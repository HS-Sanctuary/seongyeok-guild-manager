'use client';
import {useState} from 'react';
import SecretCodeInput from '@/components/common/SecretCodeInput';
export function DesktopLogin({busy,onLogin}:{busy:boolean;onLogin(nickname:string,code:string,keep:boolean):Promise<void>}) {
  const [nickname,setNickname]=useState(''),[code,setCode]=useState(''),[keep,setKeep]=useState(true);
  return <form className="space-y-4" onSubmit={async e=>{e.preventDefault();const input=code;setCode('');await onLogin(nickname,input,keep);}}>
    <h2 className="text-xl font-bold">생텀 계정으로 로그인</h2>
    <label className="block">대표 캐릭터 닉네임<input className="iris-desktop-input" autoComplete="username" maxLength={12} value={nickname} onChange={e=>setNickname(e.target.value)} disabled={busy} required/></label>
    <label className="block">접속 코드<SecretCodeInput className="iris-desktop-input pr-16" maxLength={128} value={code} onChange={setCode} disabled={busy} required/></label>
    <label className="flex gap-2 items-center"><input type="checkbox" checked={keep} onChange={e=>setKeep(e.target.checked)} disabled={busy}/>로그인 유지 · 최대 30일</label>
    <button type="submit" className="iris-desktop-button" disabled={busy}>{busy?'로그인 확인 중':'로그인'}</button>
    <p className="text-sm">코드는 암호화 대기함이나 계정 표시 목록에 저장하지 않아요.</p>
  </form>;
}
