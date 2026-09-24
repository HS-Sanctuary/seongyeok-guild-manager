import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase, getSessionAccount, isPendingAccount, SANCTUM_SESSION_COOKIE } from "@/lib/server/sanctumSession";

const ADMIN_ROLES = new Set(["길드마스터", "부마스터", "부마스터 대행"]);
const MASTER_ONLY_CATEGORIES = new Set(["생텀 버그 제보", "생텀 건의사항"]);

export async function GET(request: NextRequest) {
  try {
    const account = await getSessionAccount(request.cookies.get(SANCTUM_SESSION_COOKIE)?.value);
    if (!account || isPendingAccount(account)) return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
    const supabase = getServerSupabase();
    const isAdmin = ADMIN_ROLES.has(account.role);
    const isMaster = account.role === "길드마스터";
    if (request.nextUrl.searchParams.get("count") === "pending") {
      if (!isAdmin) return NextResponse.json({ count: 0 });
      let countQuery = supabase.from("inquiries").select("id", { count: "exact", head: true }).eq("status", "대기중");
      if (!isMaster) countQuery = countQuery.neq("category", "생텀 버그 제보").neq("category", "생텀 건의사항");
      const { count, error } = await countQuery;
      if (error) throw error;
      return NextResponse.json({ count: count ?? 0 });
    }
    let visible;
    if (!isMaster) {
      let regularQuery = supabase.from("inquiries").select("*")
        .neq("category", "생텀 버그 제보").neq("category", "생텀 건의사항")
        .order("created_at", { ascending: false }).limit(200);
      if (!isAdmin) regularQuery = regularQuery.eq("author", account.nickname);
      const [regular, ownReports] = await Promise.all([
        regularQuery,
        supabase.from("inquiries").select("*").eq("reporter_account_id", account.id).in("category", [...MASTER_ONLY_CATEGORIES]).order("created_at", { ascending: false }).limit(200),
      ]);
      if (regular.error) throw regular.error;
      if (ownReports.error) throw ownReports.error;
      visible = [...(regular.data ?? []), ...(ownReports.data ?? [])].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)).slice(0, 200);
    } else {
      const { data, error } = await supabase.from("inquiries").select("*")
        .order("created_at", { ascending: false }).limit(200);
      if (error) throw error;
      visible = data ?? [];
    }
    return NextResponse.json({ data: visible }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("SANCTUM inquiry read failed:", error);
    return NextResponse.json({ message: "문의 목록을 불러오지 못했습니다." }, { status: 500 });
  }
}
