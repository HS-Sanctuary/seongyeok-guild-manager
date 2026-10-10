import { memberMutationOrThrow } from '@/lib/memberMutationClient';
import type {Party} from '@/components/party/types';
import {busSettingsSnapshot} from '@/lib/guildBusSettings';

export async function changeBusMember(partyId: string | number, action:
  | {type: 'repeat'; name: string; allow_repeat: boolean}
  | {type: 'leave'; name: string}
  | {type: 'reconfigure'; selectedNames: string[]}
 , request:typeof fetch=fetch) {
  return memberMutationOrThrow({table:'parties',action:'update',filter:{column:'id',value:partyId},payload:{_busMemberAction:action}},request);
}

export async function completeBusRound(partyId: string | number, completedNames: string[], party: Party, request:typeof fetch=fetch) {
  const response = await request('/api/parties/sync-checklist', {
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({partyId,completedNames,finishRound:true,baseline:busSettingsSnapshot(party)}),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || '회차 완료를 저장하지 못했습니다.');
  return result;
}
