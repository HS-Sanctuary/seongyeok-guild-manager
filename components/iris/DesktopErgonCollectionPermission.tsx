'use client';
import {useEffect,useRef,useState} from 'react';
import type {createDesktopStore} from '@/lib/irisDesktopStore';
import type {ErgonCollectionPolicy} from '@/lib/irisErgonAutomation';
import {DesktopFocusDialog} from './DesktopFocusDialog';
type Api=Pick<ReturnType<typeof createDesktopStore>,'revokeCollection'>;
export function DesktopErgonCollectionPermission({api,accountId,policy,disabled,onChange}:{api?:Api;accountId:string;policy:ErgonCollectionPolicy|null;disabled:boolean;onChange:(policy:ErgonCollectionPolicy)=>void}){
 const [confirm,setConfirm]=useState(false),[pending,setPending]=useState(false),[notice,setNotice]=useState(''),flight=useRef(false),live=useRef(false);
 useEffect(()=>{live.current=true;return()=>{live.current=false;};},[]);
 const revoke=async()=>{if(!api||disabled||flight.current)return;flight.current=true;setPending(true);try{const value=await api.revokeCollection(accountId);if(live.current){onChange(value);setConfirm(false);setNotice('원클릭 수령 허용을 껐어요.');}}catch{if(live.current)setNotice('허용 해제를 확인하지 못했어요.');}finally{flight.current=false;if(live.current)setPending(false);}};
 return <><p className="iris-caption">원클릭 수령 · {policy?.granted?'허용됨':policy?'첫 사용 시 허용':'상태 확인 중'}</p>{policy?.granted&&<button type="button" className="iris-desktop-button" disabled={disabled||pending} onClick={()=>setConfirm(true)}>원클릭 수령 끄기</button>}{notice&&<p role="status">{notice}</p>}{confirm&&<DesktopFocusDialog title="원클릭 수령 끄기" description="다음 수령 때 다시 허용을 요청해요. 과거 작업 기록은 그대로 보존돼요." onClose={()=>setConfirm(false)} dismissDisabled={pending}><button type="button" className="iris-desktop-button" disabled={disabled||pending} onClick={()=>void revoke()}>허용 해제</button><button type="button" className="iris-desktop-button" disabled={pending} onClick={()=>setConfirm(false)}>취소</button></DesktopFocusDialog>}</>;
}
