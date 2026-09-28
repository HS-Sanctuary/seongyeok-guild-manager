import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase, getSessionAccount, isPendingAccount, SANCTUM_SESSION_COOKIE } from "@/lib/server/sanctumSession";

const WRITER_ROLES = new Set(["길드마스터", "부마스터"]);
const noStore = { "Cache-Control": "private, no-store" };

function noticeId(value: unknown): number | null {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

async function authenticatedAccount(request: NextRequest) {
  const account = await getSessionAccount(request.cookies.get(SANCTUM_SESSION_COOKIE)?.value);
  return account && !isPendingAccount(account) && account.status === "승인" ? account : null;
}

export async function POST(request: NextRequest) {
  try {
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin) {
      return NextResponse.json({ message: "요청 출처를 확인할 수 없습니다." }, { status: 403 });
    }
    const account = await authenticatedAccount(request);
    if (!account) return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
    const payload = await request.json().catch(() => null);
    const id = noticeId(payload?.id);
    if (!id) return NextResponse.json({ message: "공지 ID가 올바르지 않습니다." }, { status: 400 });

    const supabase = getServerSupabase();
    const { data: notice, error: noticeError } = await supabase.from("notices").select("id").eq("id", id).maybeSingle();
    if (noticeError) throw noticeError;
    if (!notice) return NextResponse.json({ message: "공지를 찾을 수 없습니다." }, { status: 404 });
    const { error } = await supabase.from("notice_reads")
      .upsert({ notice_id: id, account_id: account.id }, { onConflict: "notice_id,account_id", ignoreDuplicates: true });
    if (error) throw error;
    return NextResponse.json({ ok: true }, { headers: noStore });
  } catch (error) {
    console.error("SANCTUM notice read save error:", error);
    return NextResponse.json({ message: "읽음 기록을 저장하지 못했습니다." }, { status: 503 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const account = await authenticatedAccount(request);
    if (!account) return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
    if (!WRITER_ROLES.has(account.role)) {
      return NextResponse.json({ message: "읽은 길드원 조회 권한이 없습니다." }, { status: 403 });
    }
    const id = noticeId(new URL(request.url).searchParams.get("id"));
    if (!id) return NextResponse.json({ message: "공지 ID가 올바르지 않습니다." }, { status: 400 });

    const supabase = getServerSupabase();
    const { data: rows, error } = await supabase.from("notice_reads")
      .select("account_id, read_at").eq("notice_id", id).order("read_at", { ascending: true });
    if (error) throw error;
    const accountIds = (rows ?? []).map(row => row.account_id);
    if (accountIds.length === 0) return NextResponse.json({ readers: [] }, { headers: noStore });

    const { data: accounts, error: accountError } = await supabase.from("accounts")
      .select("id, nickname").in("id", accountIds).eq("status", "승인");
    if (accountError) throw accountError;
    const names = new Map((accounts ?? []).map(row => [row.id, row.nickname]));
    const readers = (rows ?? []).flatMap(row => {
      const nickname = names.get(row.account_id);
      return nickname ? [{ nickname, read_at: row.read_at }] : [];
    });
    return NextResponse.json({ readers }, { headers: noStore });
  } catch (error) {
    console.error("SANCTUM notice readers load error:", error);
    return NextResponse.json({ message: "읽은 길드원 목록을 불러오지 못했습니다." }, { status: 503 });
  }
}
