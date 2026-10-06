import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase, getSessionAccount, isPendingAccount, SANCTUM_SESSION_COOKIE } from "@/lib/server/sanctumSession";

export async function GET(request: NextRequest) {
  try {
    const account = await getSessionAccount(request.cookies.get(SANCTUM_SESSION_COOKIE)?.value);
    if (!account || isPendingAccount(account)) {
      return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401, headers: { "Cache-Control": "private, no-store" } });
    }
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from("characters")
      .select("id, nickname, job, alias, sort_order")
      .eq("owner", account.nickname)
      .order("sort_order", { ascending: true }).limit(101);
    if (error) throw error;
    // 크로노스의 구형 대표 캐릭터는 owner가 비어 있을 수 있다.
    const { data: legacyMain, error: legacyError } = await supabase
      .from("characters")
      .select("id, nickname, job, alias, sort_order, owner")
      .eq("nickname", account.nickname)
      .maybeSingle();
    if (legacyError) throw legacyError;
    const characters = [...(data ?? [])];
    if (legacyMain && !legacyMain.owner && !characters.some((char) => char.nickname === legacyMain.nickname)) {
      characters.unshift(legacyMain);
    }
    if (characters.length > 100) throw new Error('Too many characters');
    return NextResponse.json({ accountId: account.id, characters: characters.map(char=>({
      id:char.id,nickname:char.nickname,job:char.job,alias:char.alias,sort_order:char.sort_order,
    })) }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ message: "캐릭터 목록을 불러오지 못했습니다." }, { status: 503, headers: { "Cache-Control": "private, no-store" } });
  }
}
