import type {SupabaseClient} from '@supabase/supabase-js';
import type {ContentPowerReq,NexusClassItem,NexusContent} from '@/components/party/types';
import {CONTENT_DB} from '@/components/party/types';
import {getPartyContentOptions,normalizeContentName,normalizeDifficulty} from '@/lib/partyContentCatalog';
import {isTaskChecked} from '@/lib/matchingUtils';
import {resolvePartyRole,parsePartyStat} from '@/lib/partyRosterValues';
import {validBusDate,parseBusClock} from '@/lib/guildBusSettings';
import {canCreateIrisBus,type SynaxisData,type SynaxisCreate} from '@/lib/irisSynaxis';
import {isGuildBusParty} from '@/lib/guildBusPolicy';
type Account={id:string;nickname:string;role:string};
type Character={id:string|number;nickname:string;owner:string;job:string;combat_power:unknown;magic_resistance:unknown;raid_checks:unknown};
export class IrisSynaxisError extends Error{constructor(message:string,public status=400){super(message);}}
const record=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
async function snapshot(db:SupabaseClient,account:Account){
  const results=await Promise.all([
    db.from('characters').select('id,nickname,owner,job,combat_power,magic_resistance,raid_checks',{count:'exact'}).eq('owner',account.nickname).limit(61),
    db.from('nexus_contents').select('id,type,name,is_active',{count:'exact'}).eq('is_active',true).limit(201),
    db.from('content_power_reqs').select('id,content_type,content_name,difficulty,max_members,min_cp',{count:'exact'}).limit(501),
    db.from('nexus_classes').select('id,name,role',{count:'exact'}).eq('is_active',true).limit(101),
  ]);
  const limits=[60,200,500,100];if(results.some((r,i)=>r.error||!Array.isArray(r.data)||r.data.length>limits[i]||(r.count??0)>limits[i]))throw new IrisSynaxisError('파티 기준을 불러오지 못했어요. 다시 확인해주세요.',503);
  const characters=results[0].data as Character[],contents=results[1].data as NexusContent[],reqs=results[2].data as ContentPowerReq[],classes=results[3].data as NexusClassItem[];
  const targets=(id:string)=>{const option=CONTENT_DB.find(o=>o.id===id)!;const subs=id==='abyss_all'?CONTENT_DB.filter(c=>c.category==='어비스'&&c.id!=='abyss_all'):[option];return subs.map(o=>contents.find(c=>c.type===(o.category==='레이드'?'raid':'abyss')&&normalizeContentName(c.name)===normalizeContentName(o.name)));};
  const options:SynaxisData['options']=getPartyContentOptions(reqs).flatMap(option=>{
    const items=targets(option.id);if(!items.length||items.some(c=>!c))return [];
    const difficulties=option.diffs.flatMap(name=>{
      const standards=items.map(c=>reqs.filter(r=>r.content_type===c!.type&&normalizeContentName(r.content_name)===normalizeContentName(c!.name)&&normalizeDifficulty(r.difficulty)===normalizeDifficulty(name)));
      if(standards.some(rows=>rows.length!==1)||!standards.every(rows=>[4,8].includes(rows[0].max_members??0))||!standards.every(rows=>rows[0].max_members===standards[0][0].max_members))return [];
      return [{name,capacity:standards[0][0].max_members as 4|8,minCombatPower:Math.max(...standards.map(rows=>parsePartyStat(rows[0].min_cp)))}];
    });
    return difficulties.length?[{id:option.id,name:option.name,category:option.category,difficulties}]:[];
  });
  return {characters,contents,classes,targets,data:{accountId:account.id,canCreateBus:canCreateIrisBus(account.role),options,characters:characters.map(c=>({id:String(c.id),nickname:c.nickname,job:c.job,combatPower:parsePartyStat(c.combat_power),magicResistance:parsePartyStat(c.magic_resistance),completed:options.filter(o=>targets(o.id).every(item=>isTaskChecked(c.raid_checks,item,contents))).map(o=>o.id)}))} satisfies SynaxisData};
}
export async function readIrisSynaxis(db:SupabaseClient,account:Account){return (await snapshot(db,account)).data;}
export async function prepareIrisSynaxisCreate(db:SupabaseClient,account:Account,value:unknown,now=new Date()){
  const fields=['accountId','mode','contentId','difficulty','partyDate','timeStart','timeEnd','memo','members'];
  if(!record(value)||Object.keys(value).length!==fields.length||fields.some(k=>!(k in value))||!['party','bus'].includes(String(value.mode))||typeof value.memo!=='string'||!value.memo.trim()||value.memo.length>2000||/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(value.memo)||!Array.isArray(value.members)||!value.members.length||value.members.length>60)throw new IrisSynaxisError('생성 내용을 다시 확인해주세요.');
  if(value.accountId!==account.id)throw new IrisSynaxisError('선택 계정이 바뀌었어요. 다시 확인해주세요.',403);
  if(value.mode==='bus'&&!canCreateIrisBus(account.role))throw new IrisSynaxisError('운영진만 길드버스를 만들 수 있어요.',403);
  const input=value as SynaxisCreate;
  if(input.members.some(m=>!record(m)||Object.keys(m).length!==2||typeof m.id!=='string'||!m.id||m.id.length>100||typeof m.allowRepeat!=='boolean')||new Set(input.members.map(m=>m.id)).size!==input.members.length||input.mode==='party'&&input.members.length!==1)throw new IrisSynaxisError('본인 참가 캐릭터를 다시 선택해주세요.');
  const start=parseBusClock(input.timeStart),end=parseBusClock(input.timeEnd);
  const today=new Date(now.getTime()+9*3600000).toISOString().slice(0,10);
  if(!validBusDate(input.partyDate)||input.partyDate<today||!/^\d{2}:\d{2}$/.test(input.timeStart)||!/^\d{2}:\d{2}( \(\+1일\))?$/.test(input.timeEnd)||start===null||end===null||start>=1440||end<=start||end-start>1440)throw new IrisSynaxisError('날짜와 시작·종료 시간을 확인해주세요.');
  const latest=await snapshot(db,account),option=latest.data.options.find(o=>o.id===input.contentId),diff=option?.difficulties.find(d=>d.name===input.difficulty);
  if(!option||!diff)throw new IrisSynaxisError('활성 컨텐츠·난이도·4/8인 정원을 다시 확인해주세요.',409);
  const members=input.members.map(selection=>{
    const c=latest.characters.find(c=>String(c.id)===selection.id&&c.owner===account.nickname);if(!c)throw new IrisSynaxisError('본인 계정의 캐릭터만 선택할 수 있어요.',403);
    const role=resolvePartyRole(c.job,latest.classes);
    // Round completion is not the current week's KRONOS completion, especially for future dates.
    return {character_id:c.id,name:c.nickname,character_name:c.nickname,job:c.job,class_name:c.job,role,roles:[role],combat_power:parsePartyStat(c.combat_power),magic_resistance:parsePartyStat(c.magic_resistance),owner:account.id,account_id:account.id,owner_account:account.id,allow_repeat:input.mode==='bus'&&selection.allowRepeat,is_completed:false,time_start:input.timeStart,time_end:input.timeEnd,start_time:input.timeStart,end_time:input.timeEnd,startTime:input.timeStart,endTime:input.timeEnd};
  });
  const memo=input.mode==='bus'&&!input.memo.trim().includes('길드 버스')?`[성역 길드 버스] ${input.memo.trim()}`:input.memo.trim();
  if(input.mode==='party'&&isGuildBusParty({memo}))throw new IrisSynaxisError('길드버스 공지는 길드버스 생성에서 사용해주세요.');
  return {content_name:option.name,difficulty:diff.name,party_type:'1회 클리어',party_date:input.partyDate,time_start:input.timeStart,time_end:input.timeEnd,max_members:diff.capacity,matching_mode:'모집우선',wanted_roles:input.mode==='bus'?['탱커','힐러','근딜','원딜']:[],selected_sub_contents:option.category==='레이드'?null:option.id==='abyss_all'?['abyss_1','abyss_2','abyss_3']:[option.id],sub_content:memo,memo,members,status:'모집중',leader_name:members[0].name};
}
