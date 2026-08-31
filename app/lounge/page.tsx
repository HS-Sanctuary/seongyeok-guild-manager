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

  useEffect(() => { 
    setMounted(true); 
  }, []);

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
      <div className="max-w-[1400px] mx-auto space-y-3 relative z-10">
        
        {/* 상단 레이아웃 */}
        <div className="flex flex-row items-center justify-between gap-2">
          
          {/* 좌측: AGORA 헤더 박스 */}
          <header className="relative overflow-hidden rounded-xl bg-[var(--panel)] border border-[var(--panel-border)] px-2.5 sm:px-3 h-[52px] flex flex-row items-center justify-start gap-2 sm:gap-3">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-[var(--accent)]"></div>
            
            <div className="flex flex-col pl-1 sm:pl-1 shrink-0">
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm sm:text-base font-black tracking-widest leading-none text-[var(--text-main)]">AGORA</h1>
                <button 
                  onClick={() => setShowLoreGuide(true)} 
                  className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-[var(--inner-box)] border border-[var(--panel-border)] text-[9px] sm:text-[10px] font-black text-[var(--text-sub)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition cursor-pointer flex items-center justify-center shrink-0" 
                  title="명칭 가이드 보기"
                >
                  ?
                </button>
              </div>
              <span className="text-[var(--accent)] text-[0.6rem] sm:text-[0.65rem] font-bold tracking-wide leading-tight mt-0.5 whitespace-nowrap">
                아고라 : 길드 라운지
              </span>
            </div>

            <div className="hidden md:flex bg-[var(--inner-box)] border border-[var(--panel-border)] px-3 py-1.5 rounded-lg text-xs text-[var(--text-sub)] font-medium items-center gap-2.5 flex-grow max-w-[500px] ml-1">
              <span className="text-xs shrink-0 leading-none">🏛️</span>
              <span className="text-[0.68rem] font-semibold whitespace-nowrap overflow-hidden text-ellipsis">성역의 모든 캐릭터들이 교류하고 증명하는 중심 공간입니다.</span>
            </div>
          </header>

          {/* 우측: PANTHEON / ASTRA 탭 스위처 (전역 테마 완벽 적용) */}
          <div className="bg-[var(--panel)] border border-[var(--panel-border)] p-1 rounded-xl flex items-center gap-1 shrink-0 h-[52px] w-auto flex-grow sm:flex-grow-0 sm:w-auto md:basis-[400px]">
            
            <button 
              onClick={() => handleTabChange('PANTHEON')} 
              className={`flex-1 h-full rounded-lg flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-3 md:px-4 transition-all cursor-pointer ${
                activeMainTab === 'PANTHEON' 
                  ? 'bg-[var(--accent)] text-[var(--accent-fg)] shadow-md font-black' 
                  : 'bg-[var(--inner-box)] text-[var(--text-sub)] hover:text-[var(--text-main)] border border-[var(--panel-border)]'
              }`}
            >
              <span className="text-base sm:text-lg shrink-0">🏛️</span>
              <div className="flex flex-col items-start leading-tight">
                <span className="text-[0.68rem] sm:text-xs font-black tracking-wider whitespace-nowrap">
                  {activeMainTab === 'PANTHEON' ? 'PANTHEON' : '판테온'}
                </span>
                <span className={`text-[0.52rem] sm:text-[0.55rem] font-extrabold tracking-tight whitespace-nowrap ${
                  activeMainTab === 'PANTHEON' ? 'opacity-80' : 'text-[var(--text-sub)]'
                }`}>
                  {activeMainTab === 'PANTHEON' ? 'HALL OF FAME' : '성역 랭킹'}
                </span>
              </div>
            </button>

            <button 
              onClick={() => handleTabChange('ASTRA')} 
              className={`flex-1 h-full rounded-lg flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-3 md:px-4 transition-all cursor-pointer ${
                activeMainTab === 'ASTRA' 
                  ? 'bg-[var(--accent)] text-[var(--accent-fg)] shadow-md font-black' 
                  : 'bg-[var(--inner-box)] text-[var(--text-sub)] hover:text-[var(--text-main)] border border-[var(--panel-border)]'
              }`}
            >
              <span className="text-base sm:text-lg shrink-0">✦</span>
              <div className="flex flex-col items-start leading-tight">
                <span className="text-[0.68rem] sm:text-xs font-black tracking-wider whitespace-nowrap">
                  {activeMainTab === 'ASTRA' ? 'ASTRA' : '아스트라'}
                </span>
                <span className={`text-[0.52rem] sm:text-[0.55rem] font-extrabold tracking-tight whitespace-nowrap ${
                  activeMainTab === 'ASTRA' ? 'opacity-80' : 'text-[var(--text-sub)]'
                }`}>
                  {activeMainTab === 'ASTRA' ? 'GUILD ROSTER' : '길드원 현황'}
                </span>
              </div>
            </button>

          </div>

        </div>

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