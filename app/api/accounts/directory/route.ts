import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase, getSessionAccount, isPendingAccount, SANCTUM_SESSION_COOKIE } from "@/lib/server/sanctumSession";

export async function GET(request: NextRequest) {
  try {
    const actor = await getSessionAccount(request.cookies.get(SANCTUM_SESSION_COOKIE)?.value);
    if (!actor || isPendingAccount(actor)) return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
    const supabase = getServerSupabase();
    let { data, error } = await supabase.from("accounts")
      .select("nickname, role, equipped_title, titles, job, main_class")
      .eq("status", "승인");
    if (error?.code === "42703") {
      const fallback = await supabase.from("accounts").select("nickname, role").eq("status", "승인");
      data = fallback.data?.map(account => ({ ...account, equipped_title: null, titles: null, job: null, main_class: null })) ?? null;
      error = fallback.error;
    }
    if (error) throw error;
    return NextResponse.json({ accounts: data ?? [] }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("SANCTUM account directory error:", error);
    return NextResponse.json({ message: "계정 정보를 불러오지 못했습니다." }, { status: 503 });
  }
}
