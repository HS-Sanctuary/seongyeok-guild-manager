"use client";

import React from "react";
import MarkIcon from "../common/MarkIcon";
import ClassIcon from "../common/ClassIcon";

export interface PantheonCategory {
  id: string;
  nameEn: string;
  nameKr: string;
  rankLabel: string;
  unit: string;
  statName: string;
}

interface PantheonRankingSectionProps {
  currentPantheonCat: PantheonCategory;
  currentPantheonRankers: Array<{ nickname: string; job: string; val: string }>;
  pantheonSlideIdx: number;
  setPantheonSlideIdx: (idx: number | ((prev: number) => number)) => void;
  PANTHEON_CATEGORIES: PantheonCategory[];
  router: any;
}

export default function PantheonRankingSection({
  currentPantheonCat,
  currentPantheonRankers,
  pantheonSlideIdx,
  setPantheonSlideIdx,
  PANTHEON_CATEGORIES,
  router,
}: PantheonRankingSectionProps) {
  return (
    <section className="bg-transparent p-0.5 md:p-1">
      {/* 🎯 1. 시낙시스 규격과 100% 동일한 파란색 헤더 영역 */}
      <div className="flex flex-wrap justify-between items-center mb-2.5 pb-2 border-b gap-1.5 md:gap-2 border-[var(--panel-border)]">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <MarkIcon src="/svgs/UI mark/랭킹 마크.svg" size="md" colorClass="bg-[var(--accent)]" />
          <div className="min-w-0 flex flex-col items-start justify-center">
            <h2 className="font-black text-xs md:text-sm tracking-tight whitespace-nowrap text-[var(--text-main)] leading-tight">
              Pantheon in Agora
            </h2>
            <div className="mt-0.5 flex items-center">
              <span className="inline-block text-[0.5rem] md:text-[0.58rem] font-extrabold px-1.5 py-0.5 -ml-1 rounded bg-[var(--accent)] text-[var(--accent-fg)] shadow-xs leading-none whitespace-nowrap">
                Sanctum : 성역 길드 자체 랭킹 시스템 요약
              </span>
            </div>
          </div>
        </div>
        
        {/* Learn More → 버튼 */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button 
            type="button"
            onClick={() => router.push('/lounge?tab=PANTHEON')} 
            className="whitespace-nowrap shrink-0 text-[0.55rem] md:text-[0.6rem] font-bold px-1.5 py-0.5 md:px-2 md:py-1 rounded-md border transition-all active:scale-95 flex items-center gap-0.5 border-[var(--accent)] text-[var(--accent)] bg-[var(--inner-box)] hover:bg-[var(--accent)] hover:text-[var(--accent-fg)] cursor-pointer"
          >
            <span>Learn More</span>
            <span className="text-[0.5rem]">→</span>
          </button>
        </div>
      </div>

      {/* 🎯 2. 판테온 뷰 6대 정규 랭킹 카테고리 탭 버튼 (상단 영어 + 하단 랭킹 분류 명시) */}
      <div className="mb-3 grid grid-cols-2 min-[420px]:grid-cols-3 md:grid-cols-6 gap-1.5">
        {PANTHEON_CATEGORIES.map((cat, i) => {
          const isActive = i === pantheonSlideIdx;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setPantheonSlideIdx(i)}
              className={`min-w-0 py-1.5 px-1.5 md:px-2 rounded-lg transition-all border text-center cursor-pointer flex flex-col items-center justify-center ${
                isActive
                  ? "bg-[var(--accent)] text-[var(--accent-fg)] border-[var(--accent)] shadow-xs scale-[1.02]"
                  : "bg-[var(--panel)] text-[var(--text-sub)] border-[var(--panel-border)] hover:text-[var(--text-main)] hover:border-[var(--accent)]/50"
              }`}
            >
              <span className="max-w-full font-black text-[0.65rem] md:text-xs leading-tight whitespace-nowrap overflow-hidden text-ellipsis">{cat.nameEn}</span>
                <span className={`text-[0.58rem] mt-0.5 font-bold leading-tight whitespace-nowrap ${isActive ? "text-[var(--accent-fg)]/90" : "text-[var(--text-sub)]"}`}>
                {cat.rankLabel}
              </span>
            </button>
          );
        })}
      </div>

      {/* 현재 선택된 카테고리 타이틀 (자동 순환 텍스트 제거 완료) */}
      <div className="mb-2 flex items-center justify-between px-1">
        <span className="text-xs font-black text-[var(--accent)] flex items-center gap-1.5">
          <span className="text-[10px]">✦</span> {currentPantheonCat?.nameEn || ''} ({currentPantheonCat?.rankLabel || ''}) - Top 3
        </span>
      </div>

      {/* 🎯 3. Top 3 랭커 카드 리스트 (1열 풀와이드 레이아웃) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 min-h-[110px]">
        {currentPantheonRankers.length === 0 ? (
          <div className="col-span-full text-center py-8 rounded-xl border bg-[var(--panel)] border-[var(--panel-border)] text-xs font-bold text-[var(--text-sub)]">
            랭킹 데이터가 아직 집계되지 않았습니다.
          </div>
        ) : (
          currentPantheonRankers.map((ranker, idx) => (
            <div 
              key={ranker.nickname + idx} 
              className="flex flex-wrap md:flex-nowrap items-center gap-2 md:gap-3 backdrop-blur p-2.5 rounded-xl border shadow-xs min-w-0 bg-[var(--panel)] border-[var(--panel-border)] hover:border-[var(--accent)]/60 transition-all duration-200"
            >
              {/* 순위 뱃지 (1위 골드 / 2위 실버 / 3위 브론즈) */}
              <div 
                className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-black shrink-0 border ${
                  idx === 0 
                    ? 'bg-amber-500/20 text-amber-500 border-amber-500/50' 
                    : idx === 1
                    ? 'bg-slate-400/20 text-slate-300 border-slate-400/50'
                    : 'bg-amber-800/20 text-amber-600 border-amber-800/50'
                }`}
              >
                {idx + 1}
              </div>
              
              {/* 직업 아이콘 */}
              <div className="shrink-0 flex items-center justify-center">
                <ClassIcon job={ranker.job} rank={(idx + 1) as 1 | 2 | 3} size="md" />
              </div>

              {/* 닉네임 및 스탯 수치 */}
              <div className="flex-1 flex flex-wrap justify-between items-center min-w-0 gap-2">
                <span className="min-w-0 flex-1 font-black text-xs md:text-sm break-keep overflow-wrap-anywhere text-[var(--text-main)]">
                  {ranker.nickname}
                </span>
                <div className="flex items-center gap-1 shrink-0 bg-[var(--inner-box)] px-2 py-0.5 rounded-md border border-[var(--panel-border)]">
                  <MarkIcon src="/svgs/status mark/전투력 마크.svg" size="xs" colorClass="bg-[var(--accent)]" />
                  <span className="font-mono font-black text-xs whitespace-nowrap text-[var(--accent)]">
                    {ranker.val} <span className="text-[9px] font-normal text-[var(--text-sub)]">{currentPantheonCat?.unit || ''}</span>
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
