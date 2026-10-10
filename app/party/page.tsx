"use client";
import {Suspense} from 'react';
import SynaxisSurface from '@/components/party/SynaxisSurface';

export default function PartyPage(){
  return <Suspense fallback={<div className="w-full text-center py-20 font-black text-[var(--text-sub)]">시낙시스 시스템 로딩 중...</div>}><SynaxisSurface/></Suspense>;
}
