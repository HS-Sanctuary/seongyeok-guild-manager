"use client";

import { useState } from "react";

export default function KerygmaHeader() {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <header className="bg-[var(--panel)] border border-[var(--panel-border)] rounded-xl p-3 sm:p-4 md:px-5 flex flex-col gap-2.5 relative overflow-hidden border-l-4 border-l-[var(--accent)] shadow-sm">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-end gap-2">
          <h1 className="text-lg md:text-2xl font-black tracking-tight text-[var(--text-main)] leading-none">
            KERYGMA
          </h1>
          <p className="text-[10px] md:text-xs font-semibold text-[var(--accent)]">
            케리그마 : 길드 공지사항
          </p>
        </div>
        {/* 모바일 (i) 인포 토글 버튼 */}
        <button
          onClick={() => setShowInfo(!showInfo)}
          className="sm:hidden flex items-center justify-center w-6 h-6 rounded-full bg-[var(--inner-box)] border border-[var(--panel-border)] text-[var(--text-sub)] hover:text-[var(--text-main)] hover:border-[var(--accent)] transition-all cursor-pointer shadow-sm"
        >
          <span className="text-[10px] font-black">i</span>
        </button>
      </div>

      {/* 설명 영역: PC에서는 항상 노출, 모바일에서는 showInfo 상태에 따라 노출 */}
      <div
        className={`${
          showInfo ? "flex" : "hidden"
        } sm:flex items-start sm:items-center gap-2 px-3 py-2 rounded-lg bg-[var(--inner-box)] border border-[var(--panel-border)] text-[10px] sm:text-[0.7rem] text-[var(--text-sub)] max-w-xl animate-fadeIn`}
      >
        <span className="shrink-0 text-sm mt-0.5 sm:mt-0">📢</span>
        <div className="flex flex-col leading-snug break-words">
          <span>케리그마는 고대 그리스어로 '선포'와 '공표'를 뜻하는 말입니다.</span>
          <span className="text-[var(--accent)] font-medium">
            성역의 소식과 뜻이 가장 먼저 울려 퍼지는 공간입니다.
          </span>
        </div>
      </div>
    </header>
  );
}