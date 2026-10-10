'use client';
import {createContext,useContext,useMemo} from 'react';
import {memberMutation as mutate,memberMutationOrThrow as mutateOrThrow} from '@/lib/memberMutationClient';

export type PartyConfirmation={title:string;message:string;confirmLabel:string};
export type PartySurfaceSession={
  account:{id:string;nickname:string;role:string};
  active:boolean;
  locked:boolean;
  request:typeof fetch;
  refreshToken?:number;
  activity?:{party:number;bus:number};
  acknowledge?(kind:'party'|'bus',visibleIds?:string[]):void;
  onLoaded?():void;
  confirm?(options:PartyConfirmation):Promise<boolean>;
  notify?(message:string):void;
};
export const PartySurfaceContext=createContext<PartySurfaceSession|null>(null);
export const usePartySurface=()=>useContext(PartySurfaceContext);
export function usePartyOperations(){
  const surface=usePartySurface();
  const request=surface?.request;
  return useMemo(()=>({
    request:request??((...args:Parameters<typeof fetch>)=>fetch(...args)),
    memberMutation:(input:Parameters<typeof mutate>[0])=>mutate(input,request),
    memberMutationOrThrow:(input:Parameters<typeof mutateOrThrow>[0])=>mutateOrThrow(input,request),
  }),[request]);
}
