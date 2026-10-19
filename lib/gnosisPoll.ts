import type {PollData} from '@/types/kerygma';
export function readPoll(value:unknown):PollData|null {
  if(!value||typeof value!=='object')return null;const row=value as PollData;
  if(typeof row.title!=='string'||!row.title.trim()||row.title.length>150||!Array.isArray(row.options)||row.options.length<2||row.options.length>10||typeof row.allowMultiple!=='boolean'||typeof row.isAnonymous!=='boolean'||typeof row.endDate!=='string')return null;
  const ids=new Set<string>(),labels=new Set<string>();
  for(const option of row.options){if(!option||typeof option.id!=='string'||!option.id||typeof option.text!=='string'||!option.text.trim()||option.text.length>200||!Number.isFinite(option.votes)||option.votes<0||ids.has(option.id)||labels.has(option.text.trim()))return null;ids.add(option.id);labels.add(option.text.trim());}
  if(row.endDate&&!Number.isFinite(new Date(row.endDate).getTime()))return null;
  if(row.userVotes!==undefined&&(!Array.isArray(row.userVotes)||!row.userVotes.every(id=>ids.has(id))))return null;
  return row;
}
export function preparePoll(value:PollData,now:number):PollData {
  const options=value.options.filter(option=>option.text.trim()).map(option=>({...option,text:option.text.trim()}));
  const result=readPoll({...value,title:value.title.trim(),options});
  if(!result)throw new Error('투표 주제와 서로 다른 항목 2~10개를 입력해주세요.');
  if(result.endDate&&new Date(result.endDate).getTime()<=now)throw new Error('투표 마감은 현재보다 뒤로 설정해주세요.');
  return result;
}
export function applyLocalVote(value:PollData,ids:string[],now:number):PollData {
  const poll=readPoll(value);if(!poll||poll.userVotes?.length)throw new Error('이미 참여했거나 사용할 수 없는 투표예요.');
  if(poll.endDate&&new Date(poll.endDate).getTime()<=now)throw new Error('마감된 투표예요.');
  if(!ids.length||new Set(ids).size!==ids.length||(!poll.allowMultiple&&ids.length!==1)||!ids.every(id=>poll.options.some(option=>option.id===id)))throw new Error('선택 항목을 확인해주세요.');
  return {...poll,userVotes:[...ids],options:poll.options.map(option=>({...option,votes:option.votes+(ids.includes(option.id)?1:0)}))};
}
