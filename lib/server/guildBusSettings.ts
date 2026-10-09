import type { SupabaseClient } from '@supabase/supabase-js';
import type { Party, NexusContent, NexusClassItem, ContentPowerReq } from '@/components/party/types';
import {CONTENT_DB} from '@/components/party/types';
import {busSettingsSnapshot, matchesBusSnapshot, validBusDate, validBusTime} from '@/lib/guildBusSettings';
import {getPartyContentOptions, normalizeContentName, normalizeDifficulty} from '@/lib/partyContentCatalog';
import {resolvePartyRole,parsePartyStat} from '@/lib/partyRosterValues';
import {isTaskChecked} from '@/lib/matchingUtils';

export class BusSettingsError extends Error {
  constructor(message: string, public status=400) { super(message); }
}
const record=(value: unknown): value is Record<string,unknown> => !!value && typeof value==='object' && !Array.isArray(value);
type CharacterRow={id:number;nickname:string;owner:string;job:string;combat_power:string;magic_resistance:string;raid_checks:unknown};

export async function saveGuildBusSettings(db: SupabaseClient, party: Party, input: unknown, ownedNames: Set<string>) {
  if (!record(input)) throw new BusSettingsError('버스 수정 정보를 확인해주세요.');
  if (!matchesBusSnapshot(party,input.baseline)) throw new BusSettingsError('버스가 다른 화면에서 변경됐어요. 새로고침 후 다시 수정해주세요.',409);
  if (party.status==='종료됨') throw new BusSettingsError('종료한 버스는 수정할 수 없어요.',409);
  if (['운행중','매칭 완료','매칭중'].includes(party.status) && input.roundFinished!==true) throw new BusSettingsError('현재 출전 회차를 마친 뒤 수정해주세요.');
  if (!validBusDate(input.partyDate) || !validBusTime(input.timeStart) || !validBusTime(input.timeEnd)) throw new BusSettingsError('날짜와 시간을 다시 확인해주세요.');
  if (typeof input.memo!=='string' || input.memo.length>2000 || !input.memo.trim()) throw new BusSettingsError('공지를 1~2,000자로 입력해주세요.');
  if (!Array.isArray(input.members) || input.members.length>500) throw new BusSettingsError('참가 캐릭터 설정을 확인해주세요.');
  const selections=input.members.map(value=>{
    if (!record(value) || typeof value.name!=='string' || typeof value.allowRepeat!=='boolean') throw new BusSettingsError('참가 캐릭터 설정을 확인해주세요.');
    if (!ownedNames.has(value.name)) throw new BusSettingsError('본인 계정의 캐릭터만 추가·교체할 수 있어요.',403);
    return {name:value.name,allowRepeat:value.allowRepeat};
  });
  const selectedNames=selections.map(s=>s.name);
  if (new Set(selectedNames).size!==selectedNames.length) throw new BusSettingsError('같은 캐릭터가 중복 선택됐어요.');
  const previousName=(m:Party['members'][number])=>m.character_name||m.name;
  // Existing other-account entries are immutable to this editor, including their windows.
  const names=party.members.filter(m=>!ownedNames.has(previousName(m)) || selectedNames.includes(previousName(m))).map(previousName);
  names.push(...selectedNames.filter(name=>!names.includes(name)));
  if (!names.length || names.length>500) throw new BusSettingsError('참가 캐릭터를 1개 이상 선택해주세요.');
  const subKeys=input.subContents;
  if (subKeys!=null && (!Array.isArray(subKeys) || subKeys.some(k=>typeof k!=='string'))) throw new BusSettingsError('어비스 선택을 확인해주세요.');
  const [reqRes, contentRes, classRes, charRes]=await Promise.all([
    db.from('content_power_reqs').select('*'), db.from('nexus_contents').select('*'),
    db.from('nexus_classes').select('id,name,role'),
    db.from('characters').select('id,nickname,owner,job,combat_power,magic_resistance,raid_checks').in('nickname',names),
  ]);
  if ([reqRes,contentRes,classRes,charRes].some(r=>r.error)) throw new BusSettingsError('컨텐츠·캐릭터 기준을 불러오지 못했어요. 다시 시도해주세요.',503);
  const reqs=(reqRes.data ?? []) as ContentPowerReq[], contents=(contentRes.data ?? []) as NexusContent[], classes=(classRes.data ?? []) as NexusClassItem[];
  const option=getPartyContentOptions(reqs,Array.isArray(subKeys)?subKeys:undefined).find(c=>c.id===input.contentId);
  const difficulty=option?.diffs.find(diff=>typeof input.difficulty==='string' && normalizeDifficulty(diff)===normalizeDifficulty(input.difficulty));
  if (!option || !difficulty) throw new BusSettingsError('등록된 컨텐츠와 난이도를 선택해주세요.');
  const subContents=option.id==='abyss_all' ? (subKeys as string[] | undefined) ?? ['abyss_1','abyss_2','abyss_3'] : option.category==='어비스' ? [option.id] : null;
  const selectedOptions=option.id==='abyss_all' ? CONTENT_DB.filter(c=>subContents?.includes(c.id) && c.id!=='abyss_all') : [option];
  if (option.id==='abyss_all' && (!subContents?.length || selectedOptions.length!==subContents.length)) throw new BusSettingsError('어비스 선택을 확인해주세요.');
  const targets=selectedOptions.map(o=>contents.find(c=>c.type===(option.category==='레이드'?'raid':'abyss') && c.is_active!==false && normalizeContentName(c.name)===normalizeContentName(o.name)));
  if (targets.some(c=>!c)) throw new BusSettingsError('활성 컨텐츠 기준을 확인해주세요.');
  const capacity=reqs.find(r=>r.content_type===(option.category==='레이드'?'raid':'abyss') && normalizeContentName(r.content_name)===normalizeContentName(selectedOptions[0].name) && normalizeDifficulty(r.difficulty)===normalizeDifficulty(difficulty))?.max_members;
  if (capacity!==4 && capacity!==8) throw new BusSettingsError('운영 기준에 등록된 정원을 확인해주세요.');
  const characters=charRes.data as CharacterRow[];
  if (selectedNames.some(name=>!characters.some(c=>c.nickname===name && ownedNames.has(c.nickname)))) throw new BusSettingsError('삭제되었거나 찾을 수 없는 본인 캐릭터가 있어요. 목록을 다시 확인해주세요.');
  const owners=[...new Set(characters.map(c=>c.owner))];
  const accountRes=await db.from('accounts').select('id,nickname').in('nickname',owners);
  if (accountRes.error) throw new BusSettingsError('계정 정보를 불러오지 못했어요.',503);
  const ownerIds=new Map((accountRes.data ?? []).map(a=>[a.nickname,a.id]));
  if (owners.some(owner=>!ownerIds.has(owner))) throw new BusSettingsError('소유 계정을 확인할 수 없는 캐릭터가 있어요.');
  const sameContent=normalizeContentName(party.content_name)===normalizeContentName(option.name) && normalizeDifficulty(party.difficulty)===normalizeDifficulty(difficulty) && JSON.stringify(party.selected_sub_contents ?? null)===JSON.stringify(subContents);
  const members=names.map((name,index)=>{
    const character=characters.find(c=>c.nickname===name);
    const previous=party.members.find(m=>previousName(m)===name);
    if (!character) return {...previous!,is_completed:sameContent && !!previous?.is_completed};
    const selection=selections.find(s=>s.name===name);
    const start=previous?.time_start||previous?.start_time||previous?.startTime||party.time_start;
    const end=previous?.time_end||previous?.end_time||previous?.endTime||party.time_end;
    const owner=ownerIds.get(character.owner), role=resolvePartyRole(character.job,classes);
    return {...previous,character_id:character.id,name:character.nickname,character_name:character.nickname,job:character.job,class_name:character.job,
      role,roles:[role],combat_power:parsePartyStat(character.combat_power),magic_resistance:parsePartyStat(character.magic_resistance),
      owner,account_id:owner,owner_account:owner,allow_repeat:selection?.allowRepeat ?? previous?.allow_repeat ?? false,
      is_completed:(sameContent && !!previous?.is_completed) || targets.every(c=>isTaskChecked(character.raid_checks,c,contents)),
      selection_order:index,time_start:previous?start:input.timeStart,time_end:previous?end:input.timeEnd,
      start_time:previous?start:input.timeStart,end_time:previous?end:input.timeEnd,startTime:previous?start:input.timeStart,endTime:previous?end:input.timeEnd};
  });
  // The operator stays the same even when their participating character is deselected.
  const memo=input.memo.trim().includes('길드 버스') ? input.memo.trim() : `[성역 길드 버스] ${input.memo.trim()}`;
  const payload={content_name:option.name,difficulty,selected_sub_contents:subContents,max_members:capacity,
    sub_content:memo,memo,party_date:input.partyDate,time_start:input.timeStart,time_end:input.timeEnd,members,final_start_time:null};
  let query=db.from('parties').update(payload).eq('id',party.id);
  for (const [key,value] of Object.entries(busSettingsSnapshot(party))) {
    if (value==null) query=query.is(key,null);
    else query=query.eq(key,key==='members' ? JSON.stringify(value) : key==='selected_sub_contents' && Array.isArray(value) ? `{${value.map(v=>`"${String(v)}"`).join(',')}}` : value);
  }
  const {data,error}=await query.select();
  if (error) throw new BusSettingsError('수정 내용을 저장하지 못했어요. 새로고침으로 저장 상태를 확인해주세요.',500);
  if (!data?.length) throw new BusSettingsError('다른 화면에서 버스가 변경됐어요. 새로고침 후 다시 수정해주세요.',409);
  return data;
}
