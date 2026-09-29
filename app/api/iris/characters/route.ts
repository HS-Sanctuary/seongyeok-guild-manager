import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase, getSessionAccount, isPendingAccount, SANCTUM_SESSION_COOKIE } from "@/lib/server/sanctumSession";

export async function GET(request: NextRequest) {
  try {
    const account = await getSessionAccount(request.cookies.get(SANCTUM_SESSION_COOKIE)?.value);
    if (!account || isPendingAccount(account)) {
      return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
    }
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from("characters")
      .select("nickname, job, alias, sort_order")
      .eq("owner", account.nickname)
      .order("sort_order", { ascending: true });
    if (error) throw error;
    // 크로노스의 구형 대표 캐릭터는 owner가 비어 있을 수 있다.
    const { data: legacyMain, error: legacyError } = await supabase
      .from("characters")
      .select("nickname, job, alias, sort_order, owner")
      .eq("nickname", account.nickname)
      .maybeSingle();
    if (legacyError) throw legacyError;
    const characters = [...(data ?? [])];
    if (legacyMain && !legacyMain.owner && !characters.some((char) => char.nickname === legacyMain.nickname)) {
      characters.unshift({ nickname: legacyMain.nickname, job: legacyMain.job, alias: legacyMain.alias, sort_order: legacyMain.sort_order });
    }
    return NextResponse.json({ characters }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("IRIS character list error:", error);
    return NextResponse.json({ message: "캐릭터 목록을 불러오지 못했습니다." }, { status: 503 });
  }
}
