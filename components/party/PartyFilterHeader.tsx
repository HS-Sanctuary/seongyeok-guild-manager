'use client';

import React from 'react';
import MarkIcon from '@/components/common/MarkIcon';

interface PartyFilterHeaderProps {
  activeDateFilter: string;
  setActiveDateFilter: (date: string) => void;
  setShowFilterCalendarModal: (show: boolean) => void;
  selectedCategoryFilter: "전체" | "어비스" | "레이드";
  setSelectedCategoryFilter: (cat: "전체" | "어비스" | "레이드") => void;
  statusFilter: "전체보기" | "길드버스" | "매칭중" | "매칭완료";
  setStatusFilter: (status: "전체보기" | "길드버스" | "매칭중" | "매칭완료") => void;
  partySearchTerm: string;
  setPartySearchTerm: (term: string) => void;
  upcomingDates: { dateStr: string; label: string; index: number }[];
  datePartyCounts: Record<string, { total: number; recruiting: number; completed: number }>;
}

export default function PartyFilterHeader({
  activeDateFilter,
  setActiveDateFilter,
  setShowFilterCalendarModal,
  selectedCategoryFilter,
  setSelectedCategoryFilter,
  statusFilter,
  setStatusFilter,
  partySearchTerm,
  setPartySearchTerm,
  upcomingDates,
  datePartyCounts
}: PartyFilterHeaderProps) {
  // 한설 님 요청: 드롭다운에서 10일치 날짜가 한눈에 보이도록 10일로 대폭 확장
  const displayDates = upcomingDates.slice(0, 10);

  const categoryTabs = [
    { id: "전체" as const, label: "전체 던전", iconSrc: null },
    { id: "어비스" as const, label: "어비스", iconSrc: "/svgs/contens mark/어비스 마크.svg" },
    { id: "레이드" as const, label: "레이드", iconSrc: "/svgs/contens mark/레이드 마크.svg" },
  ];

  return (
    <div className="bg-[var(--inner-box)]/90 backdrop-blur-md p-3 sm:p-4 rounded-2xl border border-[var(--panel-border)] shadow-lg space-y-2.5 sm:space-y-3 min-w-0">
      
      {/* ──────────────── 1. 최상단: 브랜드 타이틀 & 메인 언더라인 탭 ──────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[var(--panel-border)]/80 pb-2 gap-2">
        
        {/* 타이틀 & 라이브 스태터스 */}
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <h2 className="text-xs sm:text-sm font-black tracking-tight text-[var(--text-main)] flex items-center gap-1.5">
            <span>실시간 파티 매칭</span>
            <span className="text-[10px] font-mono text-[var(--accent)] font-semibold uppercase tracking-wider hidden sm:inline">
              [LIVE]
            </span>
          </h2>
        </div>

        {/* [메인 탭] 🔴/🟡 전역 MarkIcon 동기화 글로우 언더라인 탭 */}
        <div className="flex items-center gap-1 sm:gap-2">
          {categoryTabs.map((cat) => {
            const isActive = selectedCategoryFilter === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategoryFilter(cat.id)}
                className={`group relative px-2 sm:px-2.5 py-1 text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                  isActive
                    ? "text-[var(--accent)] font-extrabold"
                    : "text-[var(--text-sub)] hover:text-[var(--text-main)]"
                }`}
              >
                {cat.iconSrc && (
                  <MarkIcon
                    src={cat.iconSrc}
                    size="xs"
                    colorClass={isActive ? "bg-[var(--accent)]" : "bg-[var(--text-sub)] group-hover:bg-[var(--text-main)]"}
                  />
                )}
                <span>{cat.label}</span>
                {isActive && (
                  <span className="absolute bottom-[-9px] left-0 right-0 h-[2.5px] bg-[var(--accent)] rounded-full shadow-[0_0_8px_var(--accent)] transition-all" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ──────────────── 2. 하단: 통합 검색바 + 스마트 드롭다운 필터 ──────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-0.5 min-w-0">
        
        {/* [좌측] 라이브 통합 검색바 */}
        <div className="relative flex-1 min-w-0">
          <input
            type="text"
            value={partySearchTerm}
            onChange={(e) => setPartySearchTerm(e.target.value)}
            placeholder="던전명, 모집글 제목, 캐릭터명 검색..."
            className="w-full bg-[var(--panel)]/80 border border-[var(--panel-border)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/30 rounded-xl py-1.5 sm:py-2 pl-8 sm:pl-9 pr-7 sm:pr-8 text-xs font-medium text-[var(--text-main)] placeholder-[var(--text-sub)] outline-none transition shadow-inner"
          />
          <svg
            className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--text-sub)] absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {partySearchTerm && (
            <button
              type="button"
              onClick={() => setPartySearchTerm("")}
              className="absolute right-2 sm:right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-sub)] hover:text-[var(--text-main)] text-xs font-bold p-0.5 cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* [우측] 세련된 드롭다운 필터 그룹 */}
        <div className="flex items-center gap-1.5 shrink-0 min-w-0 justify-between sm:justify-end">
          
          {/* 1. 모집 상태 드롭다운 칩 */}
          <div className="relative flex-1 sm:flex-initial min-w-0">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full sm:w-auto appearance-none bg-[var(--panel)] border border-[var(--panel-border)] focus:border-[var(--accent)] text-[var(--text-main)] text-[11px] sm:text-xs font-bold rounded-xl pl-2.5 sm:pl-3 pr-5 sm:pr-7 py-1.5 sm:py-2 cursor-pointer outline-none transition shadow-xs truncate"
            >
              <option value="전체보기">⚡ 상태: 전체</option>
              <option value="길드버스">🚌 길드버스만</option>
              <option value="매칭중">🟢 매칭 진행중</option>
              <option value="매칭완료">✅ 매칭 완료</option>
            </select>
            <div className="pointer-events-none absolute right-1.5 sm:right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-sub)] text-[9px] sm:text-[10px]">
              ▼
            </div>
          </div>

          {/* 2. 날짜 선택 드롭다운 칩 (10일치 표시) */}
          <div className="relative flex-1 sm:flex-initial min-w-0">
            <select
              value={activeDateFilter}
              onChange={(e) => setActiveDateFilter(e.target.value)}
              className="w-full sm:w-auto appearance-none bg-[var(--panel)] border border-[var(--panel-border)] focus:border-[var(--accent)] text-[var(--text-main)] text-[11px] sm:text-xs font-bold rounded-xl pl-2.5 sm:pl-3 pr-5 sm:pr-7 py-1.5 sm:py-2 cursor-pointer outline-none transition shadow-xs truncate"
            >
              <option value="전체">📅 전체 날짜</option>
              {displayDates.map((d) => {
                const counts = datePartyCounts[d.dateStr] || { total: 0 };
                return (
                  <option key={d.dateStr} value={d.dateStr}>
                    {d.label} {counts.total > 0 ? `(${counts.total}건)` : ''}
                  </option>
                );
              })}
            </select>
            <div className="pointer-events-none absolute right-1.5 sm:right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-sub)] text-[9px] sm:text-[10px]">
              ▼
            </div>
          </div>

          {/* 3. 🟢 달력 모달 아이콘 버튼 (전역 MarkIcon 적용) */}
          <button
            type="button"
            onClick={() => setShowFilterCalendarModal(true)}
            className="group p-1 sm:p-1.5 rounded-xl bg-[var(--panel)] border border-[var(--panel-border)] text-[var(--text-sub)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition shrink-0 cursor-pointer shadow-xs flex items-center justify-center"
            title="날짜별 파티 달력 열기"
          >
            <MarkIcon
              src="/svgs/UI mark/달력 마크.svg"
              size="xs"
              colorClass="bg-[var(--text-sub)] group-hover:bg-[var(--accent)]"
            />
          </button>

        </div>

      </div>

    </div>
  );
}