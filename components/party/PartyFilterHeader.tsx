"use client";

interface PartyFilterHeaderProps {
  activeDateFilter: string;
  setActiveDateFilter: (date: string) => void;
  setShowFilterCalendarModal: (open: boolean) => void;
  setStatusFilter: (filter: "전체보기" | "길드버스" | "매칭중" | "매칭완료") => void;
  setPartySearchTerm: (term: string) => void;
  upcomingDates: { dateStr: string; label: string; index: number }[];
  datePartyCounts: Record<string, { total: number; recruiting: number; completed: number }>;
  partySearchTerm: string;
  statusFilter: "전체보기" | "길드버스" | "매칭중" | "매칭완료";
}

export default function PartyFilterHeader({
  activeDateFilter,
  setActiveDateFilter,
  setShowFilterCalendarModal,
  setStatusFilter,
  setPartySearchTerm,
  upcomingDates,
  datePartyCounts,
  partySearchTerm,
  statusFilter
}: PartyFilterHeaderProps) {
  const getResponsiveClassForIndex = (index: number) => {
    if (index === 0) return "flex";
    if (index === 1) return "flex";
    if (index === 2) return "flex";
    if (index === 3) return "hidden min-[480px]:flex";
    if (index === 4) return "hidden sm:flex";
    if (index === 5) return "hidden md:flex";
    if (index === 6) return "hidden lg:flex";
    if (index === 7) return "hidden xl:flex";
    return "hidden 2xl:flex";
  };

  return (
    <div className="space-y-4 w-full min-w-0">
      <div className="space-y-3 border-b border-[var(--panel-border)] pb-3 w-full min-w-0">
        <div className="flex justify-between items-center gap-2 flex-wrap min-w-0">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className="text-sm sm:text-base font-black text-[var(--accent)] flex items-center gap-1.5 whitespace-nowrap">
              <span>📜</span> 실시간 매칭 현황
            </span>

            {activeDateFilter !== "전체" && (
              <div className="flex items-center gap-1 bg-[var(--inner-box)] border border-[var(--accent)]/50 px-2.5 py-0.5 rounded-lg text-xs font-black text-[var(--accent)] shrink-0 whitespace-nowrap shadow-xs">
                <span>📌 {activeDateFilter}</span>
                <button
                  type="button"
                  onClick={() => setActiveDateFilter("전체")}
                  className="text-[10px] text-[var(--text-sub)] hover:text-rose-400 font-black px-1 rounded hover:bg-[var(--panel)] transition cursor-pointer ml-0.5"
                  title="날짜 필터 해제"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0 ml-auto">
            <button
              type="button"
              onClick={() => setShowFilterCalendarModal(true)}
              className="p-2 rounded-xl bg-[var(--inner-box)] border border-[var(--panel-border)] text-[var(--accent)] hover:border-[var(--accent)] text-xs font-black transition flex items-center justify-center shrink-0 shadow-xs cursor-pointer"
              title="달력으로 전체 조회"
            >
              <span>📅</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveDateFilter("전체");
                setStatusFilter("전체보기");
                setPartySearchTerm("");
              }}
              className="p-2 rounded-xl bg-[var(--inner-box)] border border-[var(--panel-border)] text-[var(--text-sub)] hover:text-[var(--text-main)] hover:border-[var(--accent)] text-xs font-black transition flex items-center justify-center shrink-0 shadow-xs cursor-pointer"
              title="필터 초기화"
            >
              <span>🔄</span>
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-1.5 overflow-hidden w-full py-0.5 min-w-0">
          <div className="flex items-center gap-1.5 w-full justify-between min-w-0">
            {upcomingDates.map(item => {
              const stats = datePartyCounts[item.dateStr] || { total: 0, recruiting: 0, completed: 0 };
              const isSelected = activeDateFilter === item.dateStr;

              return (
                <button
                  key={item.dateStr}
                  type="button"
                  onClick={() => setActiveDateFilter(item.dateStr)}
                  className={`flex flex-col items-center justify-center py-2 px-3 rounded-2xl border text-center transition min-w-[68px] sm:min-w-[76px] shrink-0 cursor-pointer ${getResponsiveClassForIndex(item.index)} ${
                    isSelected
                      ? "bg-[var(--accent)] text-[var(--accent-fg)] border-transparent font-black shadow-md scale-[1.02]"
                      : "bg-[var(--inner-box)] border-[var(--panel-border)] text-[var(--text-sub)] hover:text-[var(--text-main)] hover:border-[var(--accent)]"
                  }`}
                >
                  <span className="text-xs font-black whitespace-nowrap leading-none mb-1">{item.label}</span>
                  <span className="text-[10px] leading-none font-bold opacity-80 whitespace-nowrap">
                    {stats.total === 0 ? "파티 없음" : `파티 ${stats.total}개`}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full min-w-0">
        <div className="relative flex-1 min-w-0">
          <input 
            type="text" 
            placeholder="컨텐츠명 또는 캐릭터명 검색..."
            value={partySearchTerm}
            onChange={e => setPartySearchTerm(e.target.value)}
            className="bg-[var(--inner-box)] border border-[var(--panel-border)] px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold text-[var(--text-main)] outline-none focus:border-[var(--accent)] w-full min-w-0 shadow-xs placeholder:text-[var(--text-sub)]/70"
          />
        </div>
        <div className="flex items-center bg-[var(--inner-box)] p-1 rounded-2xl border border-[var(--panel-border)] shrink-0 self-start sm:self-auto">
          {(["전체보기", "길드버스", "매칭중", "매칭완료"] as const).map(st => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-2 rounded-xl text-xs font-black transition whitespace-nowrap cursor-pointer ${
                statusFilter === st 
                  ? "bg-[var(--accent)] text-[var(--accent-fg)] shadow-xs" 
                  : "text-[var(--text-sub)] hover:text-[var(--text-main)]"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}