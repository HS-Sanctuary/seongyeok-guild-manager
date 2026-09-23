import { NextResponse } from "next/server";
import {
  createSessionToken,
  getServerSupabase,
  hashSessionToken,
  isPendingAccount,
  SANCTUM_SESSION_COOKIE,
  SANCTUM_SESSION_MAX_AGE_SECONDS,
  savedSessionCookieName,
  type SanctumSessionAccount,
} from "@/lib/server/sanctumSession";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const nickname = typeof body.nickname === "string" ? body.nickname.trim() : "";
    const code = typeof body.code === "string" ? body.code.trim() : "";
    const keepLoggedIn = body.keepLoggedIn !== false;

    if (!nickname || nickname.length > 12 || !code || code.length > 128) {
      return NextResponse.json({ message: "대표 캐릭터 닉네임과 접속 코드를 입력해주세요." }, { status: 400 });
    }

    const supabase = getServerSupabase();
    const { data: allowed, error: limitError } = await supabase.rpc("sanctum_allow_login_attempt", { input_nickname: nickname });
    if (limitError) {
      console.error("SANCTUM login limit error:", limitError.message);
      return NextResponse.json({ message: "로그인을 확인하지 못했습니다. 잠시 후 다시 시도해주세요." }, { status: 503 });
    }
    if (!allowed) return NextResponse.json({ message: "로그인 시도가 많습니다. 15분 뒤 다시 시도해주세요." }, { status: 429 });
    const { data, error } = await supabase.rpc("sanctum_verify_login", {
      input_nickname: nickname,
      input_code: code,
    });
    const account = data?.[0] as SanctumSessionAccount | undefined;

    if (error) {
      console.error("SANCTUM login verification failed:", error.message);
      return NextResponse.json({ message: "로그인 확인을 준비하는 중입니다. 잠시 후 다시 시도해주세요." }, { status: 503 });
    }
    if (!account) {
      return NextResponse.json({ message: "닉네임 또는 접속 코드가 올바르지 않습니다." }, { status: 401 });
    }
    if (isPendingAccount(account)) {
      return NextResponse.json({ message: "현재 가입 승인 대기 중인 계정입니다. 운영진 승인 후 접속할 수 있습니다." }, { status: 403 });
    }
    await supabase.from("sanctum_login_attempts").delete().eq("nickname", nickname.toLocaleLowerCase());

    const token = createSessionToken();
    const expiresAt = new Date(Date.now() + SANCTUM_SESSION_MAX_AGE_SECONDS * 1000).toISOString();
    const { error: sessionError } = await supabase.from("sanctum_sessions").insert({
      account_id: account.id,
      token_hash: hashSessionToken(token),
      expires_at: expiresAt,
    });
    if (sessionError) {
      console.error("SANCTUM session creation failed:", sessionError.message);
      return NextResponse.json({ message: "로그인 세션을 만들지 못했습니다. 잠시 후 다시 시도해주세요." }, { status: 503 });
    }

    const response = NextResponse.json({ account });
    response.cookies.set(SANCTUM_SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      ...(keepLoggedIn ? { maxAge: SANCTUM_SESSION_MAX_AGE_SECONDS } : {}),
    });
    const savedCookie = savedSessionCookieName(account.id);
    if (savedCookie) {
      response.cookies.set(savedCookie, token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        ...(keepLoggedIn ? { maxAge: SANCTUM_SESSION_MAX_AGE_SECONDS } : {}),
      });
    }
    return response;
  } catch (error) {
    console.error("SANCTUM login route error:", error);
    return NextResponse.json({ message: "로그인 처리 중 오류가 발생했습니다." }, { status: 500 });
  }
}
