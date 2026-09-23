import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase, getSessionAccount, isPendingAccount, SANCTUM_SESSION_COOKIE } from "@/lib/server/sanctumSession";

const ADMIN_ROLES = new Set(["길드마스터", "부마스터", "부마스터 대행"]);
const getName = (member: any) => member?.character_name || member?.name;

export async function POST(request: NextRequest) {
  try {
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin) return NextResponse.json({ message: "요청 출처를 확인할 수 없습니다." }, { status: 403 });
    const account = await getSessionAccount(request.cookies.get(SANCTUM_SESSION_COOKIE)?.value);
    if (!account || isPendingAccount(account)) return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
    const { partyId, completedNames } = await request.json();
    if (!(typeof partyId === "number" || typeof partyId === "string") || !Array.isArray(completedNames) || completedNames.length > 8) {
      return NextResponse.json({ message: "파티 정보를 확인할 수 없습니다." }, { status: 400 });
    }
    const supabase = getServerSupabase();
    const { data: party } = await supabase.from("parties").select("id, content_name, members").eq("id", partyId).maybeSingle();
    if (!party) return NextResponse.json({ message: "파티를 찾을 수 없습니다." }, { status: 404 });
    const members = Array.isArray(party.members) ? party.members : [];
    const partyNames = new Set(members.map(getName).filter(Boolean));
    const { data: ownCharacters } = await supabase.from("characters").select("nickname").eq("owner", account.nickname);
    const ownsPartyMember = (ownCharacters ?? []).some((character) => partyNames.has(character.nickname));
    if (!ownsPartyMember && !ADMIN_ROLES.has(account.role)) return NextResponse.json({ message: "파티 참여자만 완료 처리할 수 있습니다." }, { status: 403 });
    const names = [...new Set(completedNames.filter((name: unknown) => typeof name === "string" && partyNames.has(name)))];
    if (names.length !== completedNames.length) return NextResponse.json({ message: "파티에 없는 캐릭터가 포함됐습니다." }, { status: 400 });
    for (const nickname of names) {
      const { data: character, error: readError } = await supabase.from("characters").select("id, raid_checks").eq("nickname", nickname).maybeSingle();
      if (readError || !character) return NextResponse.json({ message: "캐릭터를 확인하지 못했습니다." }, { status: 500 });
      const raidChecks = character.raid_checks && typeof character.raid_checks === "object" ? character.raid_checks : {};
      const { error } = await supabase.from("characters").update({ raid_checks: { ...raidChecks, [party.content_name]: true } }).eq("id", character.id);
      if (error) return NextResponse.json({ message: "숙제 완료를 저장하지 못했습니다." }, { status: 500 });
    }
    return NextResponse.json({ updated: names.length });
  } catch (error) {
    console.error("SANCTUM checklist sync failed:", error);
    return NextResponse.json({ message: "숙제 완료를 처리하지 못했습니다." }, { status: 500 });
  }
}
