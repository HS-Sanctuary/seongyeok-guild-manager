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
      <div className="max-w-[1400px] mx-auto space-y-3 sm:space-y-4 relative z-10">
        
        {/* AGORA 헤더 */}
        <header className="relative overflow-hidden rounded-xl bg-[var(--panel)] border border-[var(--panel-border)] py-1.5 px-3 md:py-2.5 md:px-4 shadow-xs transition-colors flex flex-col md:flex-row justify-between items-start md:items-center gap-1.5">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-[var(--accent)]"></div>
          
          <div className="flex items-center gap-1.5 flex-wrap w-full md:w-auto">
            <h1 className="text-base md:text-lg font-black tracking-widest leading-none text-[var(--text-main)]">AGORA</h1>
            <span className="text-[var(--accent)] text-xs font-bold tracking-wide leading-none whitespace-nowrap">
              아고라 : 길드 라운지
            </span>

            {/* 명칭 가이드 버튼 */}
            <button 
              onClick={() => setShowLoreGuide(true)} 
              className="w-4 h-4 rounded-full bg-[var(--inner-box)] border border-[var(--panel-border)] text-[10px] font-black text-[var(--text-sub)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition cursor-pointer flex items-center justify-center shrink-0 ml-0.5" 
              title="명칭 가이드 보기"
            >
              ?
            </button>
          </div>

          <div className="hidden md:flex bg-[var(--inner-box)] border border-[var(--panel-border)] px-2.5 py-1 rounded-lg text-xs text-[var(--text-sub)] font-medium items-center gap-2 shrink-0">
            <span className="text-sm shrink-0 leading-none">🏛️</span>
            <div className="flex flex-col gap-0.5 leading-snug text-[0.72rem]">
              <span>성역의 모든 캐릭터들이 교류하고 증명하는 중심 공간입니다.</span>
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

        {/* 🌟 메이저 UI: 슬라이딩 캡슐 세그먼트 탭 */}
        <div className="relative p-1.5 rounded-[1.25rem] bg-[var(--panel)] border border-[var(--panel-border)] shadow-inner flex w-full max-w-[800px] mx-auto h-[4.5rem]">
          
          {/* 부드럽게 이동하는 활성화 배경 (Sliding Indicator) */}
          <div 
            className="absolute top-1.5 bottom-1.5 rounded-xl bg-[var(--accent)] shadow-[0_4px_20px_rgba(212,163,89,0.3)] transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1)"
            style={{ 
              width: 'calc(50% - 6px)',
              left: activeMainTab === 'PANTHEON' ? '6px' : 'calc(50% + 0px)' 
            }}
          />

          {/* PANTHEON 탭 버튼 */}
          <button 
            onClick={() => handleTabChange('PANTHEON')} 
            className="relative z-10 flex-1 flex items-center justify-center gap-2.5 cursor-pointer outline-none group"
          >
            <span className={`text-xl sm:text-2xl transition-transform duration-300 ${
              activeMainTab === 'PANTHEON' ? 'scale-110 drop-shadow-md' : 'grayscale opacity-50 group-hover:opacity-80'
            }`}>
              🏛️
            </span>
            {/* 텍스트 컨테이너 가운데 정렬(items-center) 적용 */}
            <div className="flex flex-col items-center justify-center leading-tight mt-0.5">
              <span className={`font-black tracking-[0.1em] sm:tracking-[0.15em] transition-all duration-300 ${
                activeMainTab === 'PANTHEON' 
                  ? 'text-sm sm:text-base text-[var(--accent-fg)] drop-shadow-sm' 
                  : 'text-sm sm:text-base text-[var(--text-main)] group-hover:text-[var(--text-main)]'
              }`}>
                {activeMainTab === 'PANTHEON' ? 'PANTHEON' : '판테온'}
              </span>
              <span className={`text-[0.6rem] sm:text-[0.65rem] font-bold transition-all duration-300 ${
                activeMainTab === 'PANTHEON'
                  ? 'text-[var(--accent-fg)] opacity-80 tracking-widest'
                  : 'text-[var(--text-sub)] opacity-70 tracking-widest'
              }`}>
                {activeMainTab === 'PANTHEON' ? 'HALL OF FAME' : '성역 랭킹'}
              </span>
            </div>
          </button>

          {/* ASTRA 탭 버튼 */}
          <button 
            onClick={() => handleTabChange('ASTRA')} 
            className="relative z-10 flex-1 flex items-center justify-center gap-2.5 cursor-pointer outline-none group"
          >
            <span className={`text-xl sm:text-2xl transition-transform duration-300 ${
              activeMainTab === 'ASTRA' ? 'scale-110 drop-shadow-md' : 'grayscale opacity-50 group-hover:opacity-80'
            }`}>
              ✦
            </span>
            {/* 텍스트 컨테이너 가운데 정렬(items-center) 적용 */}
            <div className="flex flex-col items-center justify-center leading-tight mt-0.5">
              <span className={`font-black tracking-[0.1em] sm:tracking-[0.15em] transition-all duration-300 ${
                activeMainTab === 'ASTRA' 
                  ? 'text-sm sm:text-base text-[var(--accent-fg)] drop-shadow-sm' 
                  : 'text-sm sm:text-base text-[var(--text-main)] group-hover:text-[var(--text-main)]'
              }`}>
                {activeMainTab === 'ASTRA' ? 'ASTRA' : '아스트라'}
              </span>
              <span className={`text-[0.6rem] sm:text-[0.65rem] font-bold transition-all duration-300 ${
                activeMainTab === 'ASTRA'
                  ? 'text-[var(--accent-fg)] opacity-80 tracking-widest'
                  : 'text-[var(--text-sub)] opacity-70 tracking-widest'
              }`}>
                {activeMainTab === 'ASTRA' ? 'GUILD ROSTER' : '길드원 현황'}
              </span>
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