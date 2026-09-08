'use client';

import React from 'react';

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
  // 한설 님 요청: 오늘, 내일 포함 총 4일치 정보만 노출
  const displayDates = upcomingDates.slice(0, 4);

  return (
    <div className="bg-[var(--inner-box)] p-3.5 sm:p-4 rounded-2xl border border-[var(--panel-border)] space-y-3.5 min-w-0 shadow-sm">
      
      {/* ──────────────── 최상단: 복원된 헤더 타이틀 ──────────────── */}
      <div className="flex items-center justify-between border-b border-[var(--panel-border)]/60 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="text-amber-400 text-sm leading-none">⚔️</span>
          <h2 className="text-xs sm:text-sm font-black tracking-wide text-[var(--text-main)]">
            실시간 파티 매칭 현황
          </h2>
        </div>
        <span className="text-[10px] sm:text-[11px] font-bold text-[var(--text-sub)]">
          SYNAXIS Smart Matching System
        </span>
      </div>

      {/* ──────────────── 1행 (상단): 던전 구분 (좌) + 날짜 선택 (우) ──────────────── */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 min-w-0">
        
        {/* [1행 좌측] 던전 카테고리 탭 (전체던전 / 어비스 / 레이드) */}
        <div className="flex items-center gap-1 bg-[var(--panel)] p-1 rounded-xl border border-[var(--panel-border)] shrink-0 self-start md:self-auto">
          {(
            [
              { id: "전체", label: "전체던전" },
              { id: "어비스", label: "🔮 어비스" },
              { id: "레이드", label: "⚔️ 레이드" }
            ] as const
          ).map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategoryFilter(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                selectedCategoryFilter === cat.id
                  ? "bg-[var(--accent)] text-[var(--accent-fg)] shadow-xs"
                  : "text-[var(--text-sub)] hover:text-[var(--text-main)]"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* [1행 우측] 날짜 선택 슬라이더 (4일치 제한) + 캘린더 버튼 */}
        <div className="flex items-center gap-1.5 min-w-0 flex-1 md:max-w-[420px] justify-end">
          <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar py-0.5 w-full justify-end">
            <button
              type="button"
              onClick={() => setActiveDateFilter("전체")}
              className={`px-3 py-1.5 rounded-xl text-xs font-black shrink-0 border transition cursor-pointer whitespace-nowrap ${
                activeDateFilter === "전체"
                  ? "bg-[var(--accent)] text-[var(--accent-fg)] border-transparent shadow-xs"
                  : "bg-[var(--panel)] border-[var(--panel-border)] text-[var(--text-sub)] hover:text-[var(--text-main)]"
              }`}
            >
              전체날짜
            </button>

            {displayDates.map((item) => {
              const counts = datePartyCounts[item.dateStr] || { total: 0, recruiting: 0, completed: 0 };
              const isSelected = activeDateFilter === item.dateStr;

              return (
                <button
                  key={item.dateStr}
                  type="button"
                  onClick={() => setActiveDateFilter(item.dateStr)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold shrink-0 border transition flex items-center gap-1 cursor-pointer ${
                    isSelected
                      ? "bg-[var(--accent)] text-[var(--accent-fg)] border-transparent shadow-xs"
                      : "bg-[var(--panel)] border-[var(--panel-border)] text-[var(--text-main)] hover:border-[var(--accent)]/50"
                  }`}
                >
                  <span className="whitespace-nowrap">{item.label}</span>
                  {counts.total > 0 && (
                    <span
                      className={`px-1.5 py-0.2 text-[9px] rounded-full font-extrabold ${
                        isSelected
                          ? "bg-[var(--accent-fg)] text-[var(--accent)]"
                          : "bg-amber-500/20 text-amber-400"
                      }`}
                    >
                      {counts.total}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* 달력 모달 보기 버튼 (삭제 없이 보존) */}
          <button
            type="button"
            onClick={() => setShowFilterCalendarModal(true)}
            className="p-2 rounded-xl bg-[var(--panel)] border border-[var(--panel-border)] text-[var(--text-sub)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition shrink-0 cursor-pointer"
            title="날짜별 파티 달력 열기"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>
        </div>

      </div>

      {/* ──────────────── 2행 (하단): 모집 상태 (좌) + 키워드 검색바 (우) ──────────────── */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 min-w-0 pt-0.5">
        
        {/* [2행 좌측] 모집 상태 탭 */}
        <div className="flex items-center gap-1 bg-[var(--panel)] p-1 rounded-xl border border-[var(--panel-border)] shrink-0 self-start md:self-auto overflow-x-auto custom-scrollbar">
          {(
            [
              { id: "전체보기", label: "전체보기" },
              { id: "길드버스", label: "길드버스" },
              { id: "매칭중", label: "매칭중" },
              { id: "매칭완료", label: "매칭완료" }
            ] as const
          ).map((st) => (
            <button
              key={st.id}
              type="button"
              onClick={() => setStatusFilter(st.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                statusFilter === st.id
                  ? "bg-[var(--accent)] text-[var(--accent-fg)] shadow-xs"
                  : "text-[var(--text-sub)] hover:text-[var(--text-main)]"
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        {/* [2행 우측] 검색창 - 1행 우측과 좌우 너비 대칭 대치 (flex-1 & md:max-w-[420px]) */}
        <div className="relative flex-1 md:max-w-[420px] min-w-[200px]">
          <input
            type="text"
            value={partySearchTerm}
            onChange={(e) => setPartySearchTerm(e.target.value)}
            placeholder="컨텐츠명 또는 캐릭터명 검색..."
            className="w-full bg-[var(--panel)] border border-[var(--panel-border)] focus:border-[var(--accent)] rounded-xl py-2 pl-9 pr-8 text-xs font-medium text-[var(--text-main)] placeholder-[var(--text-sub)] outline-none transition shadow-inner"
          />
          <svg
            className="w-4 h-4 text-[var(--text-sub)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
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
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-sub)] hover:text-[var(--text-main)] text-xs font-bold p-0.5 cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

      </div>

    </div>
  );
}