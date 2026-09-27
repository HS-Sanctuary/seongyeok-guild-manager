"use client";

import { useEffect, useState } from "react";

export default function KerygmaHeader() {
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

  useEffect(() => {
    if (!isInfoModalOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsInfoModalOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isInfoModalOpen]);

  return (
    <>
      {/* 🎯 KERYGMA 상단 헤더 바 */}
      <div className="w-full bg-[var(--panel)] border border-[var(--panel-border)] rounded-2xl px-4 py-3 sm:px-5 sm:py-3.5 flex items-center justify-between gap-3 shadow-sm relative overflow-hidden border-l-[4px] border-l-[var(--accent)] transition-colors duration-200">
        
        {/* 좌측: 타이틀 + 서브타이틀 + 모바일 전용 (i) 버튼 */}
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 shrink-0">
          <span className="text-base sm:text-xl font-black text-[var(--text-main)] tracking-wider shrink-0">
            KERYGMA
          </span>
          
          <span className="text-xs sm:text-sm font-semibold text-[var(--accent)] truncate">
            케리그마 : 길드 공지사항
          </span>

          {/* 안내가 두 줄을 넘길 수 있는 폭에서는 전체 문구를 모달로 표시 */}
          <button
            onClick={() => setIsInfoModalOpen(true)}
            title="케리그마 안내 보기"
            className="xl:hidden w-6 h-6 rounded-full bg-[var(--inner-box)] border border-[var(--panel-border)] hover:border-[var(--accent)] text-[var(--text-sub)] hover:text-[var(--accent)] transition-all flex items-center justify-center text-xs font-serif italic shrink-0 cursor-pointer active:scale-90 shadow-xs ml-0.5"
            aria-label="케리그마 안내 보기"
          >
            i
          </button>
        </div>

        {/* 넉넉한 데스크톱 폭에서만 전체 안내를 표시 */}
        <div className="hidden xl:flex flex-col items-end justify-center text-right bg-[var(--inner-box)] border border-[var(--panel-border)] rounded-xl px-3.5 py-1.5 shrink-0 shadow-inner max-w-md">
          <p className="text-[var(--text-sub)] font-medium text-[11px] sm:text-xs whitespace-nowrap">
            케리그마는 <strong className="text-[var(--text-main)] font-bold">'선포'</strong>와 <strong className="text-[var(--text-main)] font-bold">'공표'</strong>를 뜻합니다.
          </p>
          <p className="text-[var(--accent)] font-bold text-[11px] sm:text-xs whitespace-nowrap">
            성역의 소식과 뜻이 가장 먼저 울려 퍼지는 공간입니다.
          </p>
        </div>
      </div>

      {/* 모바일 뷰 (i) 버튼 클릭 시 팝업되는 안내 모달 */}
      {isInfoModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-[100] flex items-center justify-center p-4 animate-fadeIn" onClick={() => setIsInfoModalOpen(false)}>
          <div role="dialog" aria-modal="true" aria-label="케리그마 안내" className="bg-[var(--panel)] border border-[var(--panel-border)] rounded-2xl p-5 sm:p-6 w-full max-w-sm shadow-2xl space-y-4 relative border-l-4 border-l-[var(--accent)]" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-[var(--panel-border)] pb-3">
              <h3 className="text-sm sm:text-base font-bold text-[var(--text-main)] flex items-center gap-2">
                <span className="text-[var(--accent)]">📢</span>
                <span>케리그마 안내</span>
              </h3>
              <button
                onClick={() => setIsInfoModalOpen(false)}
                className="text-[var(--text-sub)] hover:text-[var(--text-main)] text-xs font-bold cursor-pointer p-1 transition"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs sm:text-sm leading-relaxed">
              <p className="text-[var(--text-sub)] font-medium">
                케리그마는 고대 그리스어로 <strong className="text-[var(--text-main)] font-bold">'선포'</strong>와 <strong className="text-[var(--text-main)] font-bold">'공표'</strong>를 뜻하는 말입니다.
              </p>
              <p className="text-[var(--accent)] font-bold">
                성역의 소식과 뜻이 가장 먼저 울려 퍼지는 공간입니다.
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setIsInfoModalOpen(false)}
                className="px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent-strong)] text-[var(--accent-fg)] text-xs font-bold rounded-xl transition shadow-xs cursor-pointer active:scale-95"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
