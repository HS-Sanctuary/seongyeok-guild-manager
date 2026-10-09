import { NextRequest, NextResponse } from "next/server";
import { isGuildBusParty } from '@/lib/guildBusPolicy';
import { getServerSupabase, getSessionAccount, isPendingAccount, SANCTUM_SESSION_COOKIE } from "@/lib/server/sanctumSession";
import { cleanItemName, setTaskChecked } from '@/lib/matchingUtils';
import {busSettingsSnapshot,matchesBusSnapshot} from '@/lib/guildBusSettings';

const ADMIN_ROLES = new Set(["길드마스터", "부마스터", "부마스터 대행"]);
const getName = (member: any) => member?.character_name || member?.name;

export async function POST(request: NextRequest) {
  try {
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin) return NextResponse.json({ message: "요청 출처를 확인할 수 없습니다." }, { status: 403 });
    const account = await getSessionAccount(request.cookies.get(SANCTUM_SESSION_COOKIE)?.value);
    if (!account || isPendingAccount(account)) return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
    const { partyId, completedNames, finishRound, baseline } = await request.json();
    if (!(typeof partyId === "number" || typeof partyId === "string") || !Array.isArray(completedNames) || completedNames.length > 8) {
      return NextResponse.json({ message: "파티 정보를 확인할 수 없습니다." }, { status: 400 });
    }
    const supabase = getServerSupabase();
    const { data: party } = await supabase.from("parties").select("*").eq("id", partyId).maybeSingle();
    if (!party) return NextResponse.json({ message: "파티를 찾을 수 없습니다." }, { status: 404 });
    const members = Array.isArray(party.members) ? party.members : [];
    const partyNames = new Set(members.map(getName).filter(Boolean));
    const { data: ownCharacters } = await supabase.from("characters").select("nickname").eq("owner", account.nickname);
    const ownsPartyMember = (ownCharacters ?? []).some((character) => partyNames.has(character.nickname));
    const isBus = isGuildBusParty(party);
    const isOperator = ADMIN_ROLES.has(account.role) && (account.nickname === party.leader_name || (ownCharacters ?? []).some(c => c.nickname === party.leader_name));
    if (isBus && !isOperator) return NextResponse.json({message:'현재 길드 버스 운행자만 완료 처리할 수 있습니다.'},{status:403});
    if (isBus && finishRound===true && (!matchesBusSnapshot(party,baseline) || party.status==='종료됨')) return NextResponse.json({message:'버스 설정이나 참가자가 변경됐습니다. 새로고침 후 현재 회차를 확인해주세요.'},{status:409});
    if (!ownsPartyMember && !ADMIN_ROLES.has(account.role)) return NextResponse.json({ message: "파티 참여자만 완료 처리할 수 있습니다." }, { status: 403 });
    const names = [...new Set(completedNames.filter((name: unknown) => typeof name === "string" && partyNames.has(name)))];
    if (names.length !== completedNames.length) return NextResponse.json({ message: "파티에 없는 캐릭터가 포함됐습니다." }, { status: 400 });
    const {data: contents, error: catalogError} = await supabase.from('nexus_contents').select('*');
    if (catalogError) throw catalogError;
    const contentName = cleanItemName(party.content_name).replace(/\s*\(.*?\)\s*$/, '').trim();
    let targets = (contents ?? []).filter(content => cleanItemName(content.name) === contentName || content.short_name === contentName);
    if (!targets.length && /어비스.*(통합|3종|ALL)/i.test(party.content_name)) {
      const selected = Array.isArray(party.selected_sub_contents) ? party.selected_sub_contents : [];
      targets = (contents ?? []).filter(c => c.type === 'abyss' && (!selected.length || selected.some((key: string) => key === String(c.id) || key === c.code || key === c.name)));
    }
    if (!targets.length) return NextResponse.json({message:'완료할 컨텐츠를 운영 카탈로그에서 찾지 못했습니다.'},{status:400});
    for (const nickname of names) {
      const { data: character, error: readError } = await supabase.from("characters").select("id, raid_checks").eq("nickname", nickname).maybeSingle();
      if (readError || !character) return NextResponse.json({ message: "캐릭터를 확인하지 못했습니다." }, { status: 500 });
      const nextRaidChecks = targets.reduce((checks,content) => setTaskChecked(checks,content,true,contents ?? []), character.raid_checks);
      let query = supabase.from("characters").update({ raid_checks: nextRaidChecks }).eq("id", character.id);
      query = character.raid_checks == null ? query.is('raid_checks',null) : query.eq('raid_checks',JSON.stringify(character.raid_checks));
      const {data: saved, error} = await query.select('id');
      if (error) return NextResponse.json({ message: "숙제 완료를 저장하지 못했습니다." }, { status: 500 });
      if (!saved?.length) return NextResponse.json({message:'숙제 정보가 변경됐습니다. 새로고침 후 다시 시도해주세요.'},{status:409});
    }
    if (isBus && finishRound === true) {
      const completed = new Set(names);
      const nextMembers = [...members].sort((a: any,b: any) =>
        Number(completed.has(getName(a)))-Number(completed.has(getName(b))) ||
        (a.selection_order ?? members.indexOf(a))-(b.selection_order ?? members.indexOf(b))
      ).map((member,index) => ({...member,selection_order:index,...(completed.has(getName(member)) ? {is_completed:true} : {})}));
      let saveQuery = supabase.from('parties').update({members:nextMembers,status:'운행중'}).eq('id',party.id);
      for (const [key,value] of Object.entries(busSettingsSnapshot(party))) {
        if (!(key in party)) continue;
        saveQuery=value==null ? saveQuery.is(key,null) : saveQuery.eq(key,key==='members' ? JSON.stringify(value) : key==='selected_sub_contents' && Array.isArray(value) ? `{${value.map(v=>`"${String(v)}"`).join(',')}}` : value);
      }
      const {data: saved,error} = await saveQuery.select('id');
      if (error) throw error;
      if (!saved?.length) return NextResponse.json({message:'숙제는 저장됐지만 참여 정보가 변경돼 회차를 전환하지 못했습니다. 새로고침 후 다시 시도해주세요.'},{status:409});
    }
    return NextResponse.json({ updated: names.length });
  } catch (error) {
    console.error("SANCTUM checklist sync failed:", error);
    return NextResponse.json({ message: "숙제 완료를 처리하지 못했습니다." }, { status: 500 });
  }
}
