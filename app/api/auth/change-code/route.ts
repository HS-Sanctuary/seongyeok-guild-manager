import { NextRequest, NextResponse } from "next/server";
import {
  getServerSupabase,
  getSessionAccount,
  isPendingAccount,
  savedSessionCookieName,
  SANCTUM_SESSION_COOKIE,
} from "@/lib/server/sanctumSession";

function clearAccountCookies(response: NextResponse, accountId: string) {
  response.cookies.set(SANCTUM_SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  const savedCookie = savedSessionCookieName(accountId);
  if (savedCookie) response.cookies.set(savedCookie, "", { httpOnly: true, path: "/", maxAge: 0 });
  return response;
}

export async function POST(request: NextRequest) {
  let revokedAccountId: string | null = null;
  try {
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin) {
      return NextResponse.json({ message: "요청 출처를 확인할 수 없습니다." }, { status: 403 });
    }

    const account = await getSessionAccount(request.cookies.get(SANCTUM_SESSION_COOKIE)?.value);
    if (!account || isPendingAccount(account) || account.status !== "승인") {
      return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
    }

    const body = await request.json();
    const currentCode = typeof body.currentCode === "string" ? body.currentCode : "";
    const newCode = typeof body.newCode === "string" ? body.newCode : "";
    if (!currentCode || currentCode.length > 128 || newCode.length < 10 || newCode.length > 64 ||
        newCode.trim() !== newCode || /\s|[\u0000-\u001f\u007f]/u.test(newCode) || newCode === currentCode) {
      return NextResponse.json({ message: "현재 코드와 새 코드의 길이·형식을 확인해 주세요." }, { status: 400 });
    }

    const supabase = getServerSupabase();
    const { data: allowed, error: limitError } = await supabase.rpc("sanctum_allow_login_attempt", { input_nickname: account.nickname });
    if (limitError) throw limitError;
    if (!allowed) return NextResponse.json({ message: "확인 시도가 많습니다. 15분 뒤 다시 시도해 주세요." }, { status: 429 });

    const { data: verified, error: verifyError } = await supabase.rpc("sanctum_verify_login", {
      input_nickname: account.nickname,
      input_code: currentCode,
    });
    if (verifyError) throw verifyError;
    if (verified?.[0]?.id !== account.id) {
      return NextResponse.json({ message: "현재 접속 코드가 올바르지 않습니다." }, { status: 401 });
    }

    // 먼저 모든 기기 세션을 무효화한다. 뒤의 변경이 실패해도 기존 코드로 재로그인할 수 있다.
    const { error: revokeError } = await supabase.from("sanctum_sessions").delete().eq("account_id", account.id);
    if (revokeError) throw revokeError;
    revokedAccountId = account.id;

    const { data: changed, error: changeError } = await supabase.from("accounts")
      .update({ code: newCode })
      .eq("id", account.id)
      .eq("status", "승인")
      .select("id")
      .maybeSingle();
    if (changeError || !changed) {
      return clearAccountCookies(NextResponse.json({ message: "코드를 변경하지 못했습니다. 기존 코드로 다시 로그인해 주세요.", loginRequired: true }, { status: 503 }), account.id);
    }

    await supabase.from("sanctum_login_attempts").delete().eq("nickname", account.nickname.toLocaleLowerCase());
    return clearAccountCookies(NextResponse.json({ ok: true, message: "접속 코드가 변경되었습니다. 새 코드로 다시 로그인해 주세요." }), account.id);
  } catch (error) {
    console.error("SANCTUM code change failed:", error instanceof Error ? error.name : "unknown error");
    if (revokedAccountId) {
      return clearAccountCookies(NextResponse.json({ message: "변경을 완료하지 못했습니다. 기존 접속 코드로 다시 로그인해 주세요.", loginRequired: true }, { status: 503 }), revokedAccountId);
    }
    return NextResponse.json({ message: "접속 코드 변경을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요." }, { status: 503 });
  }
}
