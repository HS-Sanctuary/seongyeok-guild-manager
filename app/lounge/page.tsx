"use client";

import '../globals.css';
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PantheonView from "./components/PantheonView";
import AstraView from "./components/AstraView";

function AgoraLoungeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [mounted, setMounted] = useState(false);
  const [activeMainTab, setActiveMainTab] = useState<'PANTHEON' | 'ASTRA'>('PANTHEON');
  const [showLoreGuide, setShowLoreGuide] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "ASTRA") setActiveMainTab("ASTRA");
    else if (tabParam === "PANTHEON") setActiveMainTab("PANTHEON");
  }, [searchParams]);

  const handleTabChange = (tab: 'PANTHEON' | 'ASTRA') => {
    setActiveMainTab(tab);
    router.replace(`/lounge?tab=${tab}`, { scroll: false });
  };

  if (!mounted) return null;

  return (
    <div className="w-full text-[var(--text-main)] font-sans pb-10 relative">
      <div className="max-w-[1400px] mx-auto space-y-3 sm:space-y-5 relative z-10">
        
        {/* 헤더 */}
        <header className="relative overflow-hidden rounded-xl bg-[var(--panel)] border border-[var(--panel-border)] py-2.5 px-3.5 sm:px-5 shadow-sm transition-colors flex flex-row items-center justify-between gap-2 mb-2">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-[var(--accent)]"></div>
          
          <div className="flex items-center gap-2 shrink-0">
            <h1 className="text-base sm:text-lg font-black text-[var(--text-main)] tracking-wider leading-none flex items-center gap-2">
              <span>AGORA</span>
              <span className="text-xs sm:text-sm font-bold text-[var(--accent)] tracking-normal">
                아고라 : 길드 라운지
              </span>
            </h1>

            <button 
              onClick={() => setShowLoreGuide(true)} 
              className="w-5 h-5 flex items-center justify-center rounded-full bg-[var(--inner-box)] border border-[var(--panel-border)] text-[var(--text-sub)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition cursor-pointer text-[0.65rem] font-bold shrink-0 ml-1" 
              title="명칭 가이드 보기"
            >
              ?
            </button>
          </div>
          
          <div className="hidden md:flex bg-[var(--inner-box)] border border-[var(--panel-border)] px-3 py-1.5 rounded-lg text-xs text-[var(--text-sub)] font-medium items-start gap-2 shrink-0">
            <span className="text-sm shrink-0 leading-none mt-0.5">🏛️</span>
            <div className="flex flex-col gap-0.5 leading-snug">
              <span>고대 그리스의 대광장 아고라. 성역의 모든 캐릭터들이 교류하고 증명하는 중심 공간입니다.</span>
              <span className="text-[var(--accent)] font-semibold">성역의 모든 별을 아스트라에 새기고, 빛나는 결실을 판테온에 기립니다.</span>
            </div>
          </div>
        </header>

        {/* SANCTUM 명칭 가이드 모달 */}
        {showLoreGuide && (
          <div className="fixed inset-0 bg-black/80 z-[10000] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowLoreGuide(false)}>
            <div className="bg-[var(--panel)] border border-[var(--panel-border)] text-[var(--text-main)] rounded-2xl max-w-xl w-full p-5 shadow-2xl relative" onClick={e => e.stopPropagation()}>
              <button onClick={() => setShowLoreGuide(false)} className="absolute top-4 right-4 text-[var(--text-sub)] hover:text-[var(--text-main)] text-lg font-bold cursor-pointer">✕</button>
              <h2 className="text-base font-black text-[var(--accent)] mb-3 border-b border-[var(--panel-border)] pb-2">🏛️ SANCTUM 명칭 가이드</h2>
              <div className="space-y-2 text-xs text-[var(--text-main)]">
                <p><strong>AGORA</strong>: 성역 구성원이 소통하는 광장 라운지</p>
                <p><strong>ASTRA</strong>: 길드원 캐릭터 현황 및 파티 구인 공간 (SOL/LUNA)</p>
                <p><strong>PANTHEON</strong>: 성역 6대 랭킹 명예의 전당 (TELOS, SYMPHONIA, KRATOS, TECHNE, HARMONIA, PIETAS)</p>
              </div>
            </div>
          </div>
        )}

        {/* 세그먼트 버튼 */}
        <div className="bg-[var(--inner-box)] border-2 border-[var(--panel-border)] p-1 rounded-2xl flex gap-1.5 shadow-sm">
          <button 
            onClick={() => handleTabChange('PANTHEON')} 
            className={`flex-1 h-11 sm:h-12 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeMainTab === 'PANTHEON' 
                ? 'bg-[var(--accent)] text-[var(--accent-fg)] shadow-md border border-[var(--accent)]' 
                : 'text-[var(--text-sub)] hover:text-[var(--text-main)] hover:bg-[var(--panel)]'
            }`}
          >
            <span className="text-base sm:text-lg">🏛️</span>
            <div className="flex flex-col items-start leading-none">
              <span className="text-xs sm:text-sm font-black tracking-wider">PANTHEON</span>
              <span className={`text-[0.55rem] font-bold ${activeMainTab === 'PANTHEON' ? 'text-[var(--accent-fg)] opacity-90' : 'text-[var(--text-sub)]'}`}>판테온 (성역 랭킹)</span>
            </div>
          </button>

          <button 
            onClick={() => handleTabChange('ASTRA')} 
            className={`flex-1 h-11 sm:h-12 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeMainTab === 'ASTRA' 
                ? 'bg-[var(--accent)] text-[var(--accent-fg)] shadow-md border border-[var(--accent)]' 
                : 'text-[var(--text-sub)] hover:text-[var(--text-main)] hover:bg-[var(--panel)]'
            }`}
          >
            <span className="text-base sm:text-lg">✦</span>
            <div className="flex flex-col items-start leading-none">
              <span className="text-xs sm:text-sm font-black tracking-wider">ASTRA</span>
              <span className={`text-[0.55rem] font-bold ${activeMainTab === 'ASTRA' ? 'text-[var(--accent-fg)] opacity-90' : 'text-[var(--text-sub)]'}`}>아스트라 (길드원 현황)</span>
            </div>
          </button>
        </div>

        {/* 메인 탭 뷰 전환 */}
        {activeMainTab === 'PANTHEON' ? <PantheonView /> : <AstraView />}

      </div>
    </div>
  );
}

export default function AgoraLoungePage() {
  return (
    <Suspense fallback={<div className="w-full text-center py-10 font-bold text-[var(--text-sub)]">아고라 데이터를 불러오는 중...</div>}>
      <AgoraLoungeContent />
    </Suspense>
  );
}