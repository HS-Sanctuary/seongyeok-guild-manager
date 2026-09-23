import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase, getSessionAccount, isPendingAccount, SANCTUM_SESSION_COOKIE } from "@/lib/server/sanctumSession";

const ADMIN_ROLES = new Set(["길드마스터", "부마스터", "부마스터 대행"]);

export async function GET(request: NextRequest) {
  try {
    const account = await getSessionAccount(request.cookies.get(SANCTUM_SESSION_COOKIE)?.value);
    if (!account || isPendingAccount(account)) return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
    const supabase = getServerSupabase();
    const isAdmin = ADMIN_ROLES.has(account.role);
    if (request.nextUrl.searchParams.get("count") === "pending") {
      if (!isAdmin) return NextResponse.json({ count: 0 });
      const { count, error } = await supabase.from("inquiries").select("id", { count: "exact", head: true }).eq("status", "대기중");
      if (error) throw error;
      return NextResponse.json({ count: count ?? 0 });
    }
    let query = supabase.from("inquiries").select("*").order("created_at", { ascending: false }).limit(200);
    if (!isAdmin) query = query.eq("author", account.nickname);
    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ data });
  } catch (error) {
    console.error("SANCTUM inquiry read failed:", error);
    return NextResponse.json({ message: "문의 목록을 불러오지 못했습니다." }, { status: 500 });
  }
}
