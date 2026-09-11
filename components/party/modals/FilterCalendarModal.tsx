"use client";

import { useState, useMemo, useRef, useEffect } from "react";

interface FilterCalendarModalProps {
  showFilterCalendarModal: boolean;
  setShowFilterCalendarModal: (val: boolean) => void;
  activeDateFilter: string;
  setActiveDateFilter: (val: string) => void;
  datePartyCounts: Record<string, { total: number; recruiting: number; completed: number }>;
  getDayOfWeekKorean: (dateStr: string) => string;
  parties?: any[];
  guildBuses?: any[];
}

export default function FilterCalendarModal({
  showFilterCalendarModal,
  setShowFilterCalendarModal,
  activeDateFilter,
  setActiveDateFilter,
  datePartyCounts,
  parties = [],
  guildBuses = [],
}: FilterCalendarModalProps) {
  const [viewAnchorDate, setViewAnchorDate] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const [showControlInfoModal, setShowControlInfoModal] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  const modalContainerRef = useRef<HTMLDivElement | null>(null);
  const touchStartY = useRef<number | null>(null);
  const wheelAccumulator = useRef<number>(0);
  const lastWheelTime = useRef<number>(0);

  const shiftWeeks = (weekDelta: number) => {
    setViewAnchorDate((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + weekDelta * 7);
      return next;
    });
  };

  useEffect(() => {
    const modalEl = modalContainerRef.current;
    if (!modalEl || !showFilterCalendarModal) return;

    const handleNativeWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const now = Date.now();
      if (now - lastWheelTime.current > 150) {
        wheelAccumulator.current = 0;
      }
      lastWheelTime.current = now;

      wheelAccumulator.current += e.deltaY;

      const THRESHOLD = 30;

      if (wheelAccumulator.current >= THRESHOLD) {
        shiftWeeks(1);
        wheelAccumulator.current = 0;
      } else if (wheelAccumulator.current <= -THRESHOLD) {
        shiftWeeks(-1);
        wheelAccumulator.current = 0;
      }
    };

    const handleNativeTouchMove = (e: TouchEvent) => {
      e.preventDefault();
    };

    modalEl.addEventListener("wheel", handleNativeWheel, { passive: false });
    modalEl.addEventListener("touchmove", handleNativeTouchMove, { passive: false });

    return () => {
      modalEl.removeEventListener("wheel", handleNativeWheel);
      modalEl.removeEventListener("touchmove", handleNativeTouchMove);
    };
  }, [showFilterCalendarModal]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const diffY = touchStartY.current - e.changedTouches[0].clientY;
    if (Math.abs(diffY) > 20) {
      if (diffY > 0) shiftWeeks(1);
      else shiftWeeks(-1);
    }
    touchStartY.current = null;
  };

  const getSundayOfWeek = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay();
    date.setDate(date.getDate() - day);
    date.setHours(0, 0, 0, 0);
    return date;
  };

  const gridStartDate = useMemo(() => getSundayOfWeek(viewAnchorDate), [viewAnchorDate]);

  const calendarGridDays = useMemo(() => {
    const days: Date[] = [];
    const start = new Date(gridStartDate);
    for (let i = 0; i < 35; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push(d);
    }
    return days;
  }, [gridStartDate]);

  const headerTitle = useMemo(() => {
    if (calendarGridDays.length === 0) {
      return { yearText: "2026년", monthText: "9월", startYear: 2026, startMonth: 9 };
    }
    const startDay = calendarGridDays[0];
    const endDay = calendarGridDays[calendarGridDays.length - 1];

    const startYear = startDay.getFullYear();
    const startMonth = startDay.getMonth() + 1;
    const endYear = endDay.getFullYear();
    const endMonth = endDay.getMonth() + 1;

    let yearText = `${startYear}년`;
    let monthText = `${startMonth}월`;

    if (startYear === endYear) {
      if (startMonth !== endMonth) {
        monthText = `${startMonth}~${endMonth}월`;
      }
    } else {
      yearText = `${startYear}~${endYear}년`;
      monthText = `${startMonth}월~${endMonth}월`;
    }

    return { yearText, monthText, startYear, startMonth };
  }, [calendarGridDays]);

  const recruitingPartiesCount = useMemo(() => {
    const fromParties = parties.filter((p) =>
      ["recruiting", "매칭중", "모집중", "open", "OPEN"].includes(p.status)
    ).length;
    const fromCounts = Object.values(datePartyCounts || {}).reduce(
      (acc, curr) => acc + (curr.recruiting || 0),
      0
    );
    return Math.max(fromParties, fromCounts);
  }, [parties, datePartyCounts]);

  const totalCompletedCount = useMemo(() => {
    const completedParties = parties.filter((p) =>
      ["completed", "매칭완료", "완료"].includes(p.status)
    ).length;

    let completedBusRounds = 0;
    guildBuses.forEach((bus) => {
      if (Array.isArray(bus.bus_rounds)) {
        bus.bus_rounds.forEach((r: any) => {
          if (r.is_completed || ["completed", "완료"].includes(r.status)) completedBusRounds += 1;
        });
      } else if (["completed", "완료"].includes(bus.status)) {
        completedBusRounds += bus.total_rounds || 1;
      }
    });

    const fromCounts = Object.values(datePartyCounts || {}).reduce(
      (acc, curr) => acc + (curr.completed || 0),
      0
    );

    return Math.max(completedParties + completedBusRounds, fromCounts);
  }, [parties, guildBuses, datePartyCounts]);

  const inProgressPartiesCount = useMemo(() => {
    return parties.filter((p) => ["in_progress", "진행중"].includes(p.status)).length;
  }, [parties]);

  const todayStr = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }, []);

  if (!showFilterCalendarModal) return null;

  return (
    <div 
      className="fixed inset-0 z-[150] bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overscroll-none cursor-pointer"
      onClick={() => setShowFilterCalendarModal(false)}
    >
      <div
        ref={modalContainerRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={(e) => e.stopPropagation()}
        className="bg-[var(--panel)] border border-[var(--panel-border)] rounded-2xl w-full max-w-sm p-4 shadow-2xl space-y-3.5 animate-in fade-in zoom-in-95 select-none relative cursor-default"
      >
        <div className="flex justify-between items-center border-b border-[var(--panel-border)] pb-2.5">
          <div className="flex items-center gap-1.5 font-black text-sm text-[var(--text-main)]">
            <span className="text-base">📅</span>
            
            <button
              type="button"
              onClick={() => setShowYearPicker(true)}
              className="hover:text-[var(--accent)] underline decoration-dotted underline-offset-4 cursor-pointer transition"
              title="연도 변경"
            >
              {headerTitle.yearText}
            </button>

            <button
              type="button"
              onClick={() => setShowMonthPicker(true)}
              className="hover:text-[var(--accent)] underline decoration-dotted underline-offset-4 cursor-pointer transition"
              title="월 변경"
            >
              {headerTitle.monthText}
            </button>

            <span className="text-xs font-bold text-[var(--text-sub)]">파티 검색</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowControlInfoModal(true)}
              className="flex items-center gap-1 bg-[var(--inner-box)] border border-[var(--panel-border)] hover:border-[var(--accent)] text-[var(--accent)] px-2 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer transition"
              title="조작 안내"
            >
              <span>▲▼ 조작</span>
            </button>

            <button
              type="button"
              onClick={() => setShowFilterCalendarModal(false)}
              className="text-[var(--text-sub)] hover:text-[var(--text-main)] text-sm font-bold cursor-pointer p-1"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 text-center text-[11px] font-bold text-[var(--text-sub)]">
          <span className="text-red-400">일</span>
          <span>월</span>
          <span>화</span>
          <span>수</span>
          <span>목</span>
          <span>금</span>
          <span className="text-blue-400">토</span>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {calendarGridDays.map((d) => {
            const year = d.getFullYear();
            const monthStr = String(d.getMonth() + 1).padStart(2, "0");
            const dayStr = String(d.getDate()).padStart(2, "0");
            const dateKey = `${year}-${monthStr}-${dayStr}`;

            const info = datePartyCounts[dateKey] || { total: 0, recruiting: 0, completed: 0 };
            const isSelected = activeDateFilter === dateKey;
            const isPast = dateKey < todayStr;

            const completedCount = info.completed > 0 ? info.completed : info.total;
            const hasParty = info.total > 0;

            const isFirstDayOfMonth = d.getDate() === 1;
            const lastDayOfMonthNum = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
            const isLastDayOfMonth = d.getDate() === lastDayOfMonthNum;

            return (
              <button
                key={dateKey}
                type="button"
                onClick={() => {
                  setActiveDateFilter(dateKey);
                  setShowFilterCalendarModal(false);
                }}
                className={`h-9 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center relative cursor-pointer ${
                  isSelected
                    ? "bg-[var(--accent)] text-[var(--accent-fg)] ring-2 ring-[var(--accent)]/50 shadow-md"
                    : hasParty
                    ? "bg-[var(--inner-box)] text-[var(--text-main)] border border-[var(--accent)]/60 shadow-xs hover:border-[var(--accent)]"
                    : "bg-[var(--inner-box)]/50 text-[var(--text-sub)] hover:text-[var(--text-main)] border border-transparent"
                }`}
              >
                {isFirstDayOfMonth && (
                  <span
                    aria-hidden="true"
                    className="absolute -left-[3px] top-1/2 -translate-y-1/2 h-7 w-[2.5px] bg-rose-500 rounded-full shadow-[0_0_6px_rgba(244,63,94,0.85)] z-20 pointer-events-none"
                  />
                )}

                {isLastDayOfMonth && (
                  <span
                    aria-hidden="true"
                    className="absolute -right-[3px] top-1/2 -translate-y-1/2 h-7 w-[2.5px] bg-rose-500 rounded-full shadow-[0_0_6px_rgba(244,63,94,0.85)] z-20 pointer-events-none"
                  />
                )}

                <span>{d.getDate()}</span>

                {hasParty && (
                  <span
                    className={`text-[9px] leading-none font-extrabold px-1 rounded-full ${
                      isSelected
                        ? "bg-[var(--accent-fg)] text-[var(--accent)]"
                        : isPast
                        ? "text-emerald-400 font-black"
                        : "text-amber-400"
                    }`}
                  >
                    {isPast ? completedCount : info.total}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => {
            setActiveDateFilter("전체");
            setShowFilterCalendarModal(false);
          }}
          className={`w-full py-2 rounded-xl text-xs font-black transition border cursor-pointer ${
            activeDateFilter === "전체"
              ? "bg-[var(--accent)] text-[var(--accent-fg)] border-transparent"
              : "bg-[var(--inner-box)] text-[var(--text-main)] border-[var(--panel-border)] hover:border-[var(--accent)]"
          }`}
        >
          전체 날짜 보기
        </button>

        <div className="pt-1 border-t border-[var(--panel-border)]/80 grid grid-cols-3 gap-1.5 text-center">
          <div className="bg-[var(--inner-box)] p-1.5 rounded-xl border border-emerald-500/20 flex flex-col items-center justify-center">
            <span className="text-[10px] text-[var(--text-sub)] font-semibold">완료된 파티</span>
            <span className="text-xs font-black text-emerald-400 font-mono">
              {totalCompletedCount}건
            </span>
          </div>

          <div className="bg-[var(--inner-box)] p-1.5 rounded-xl border border-amber-500/20 flex flex-col items-center justify-center">
            <span className="text-[10px] text-[var(--text-sub)] font-semibold">모집중인 파티</span>
            <span className="text-xs font-black text-amber-400 font-mono">
              {recruitingPartiesCount}건
            </span>
          </div>

          <div className="bg-[var(--inner-box)] p-1.5 rounded-xl border border-blue-500/20 flex flex-col items-center justify-center">
            <span className="text-[10px] text-[var(--text-sub)] font-semibold">진행중인 파티</span>
            <span className="text-xs font-black text-blue-400 font-mono">
              {inProgressPartiesCount}건
            </span>
          </div>
        </div>

        {showControlInfoModal && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xs rounded-2xl flex flex-col items-center justify-center p-4 z-[160] text-center space-y-3">
            <div className="text-2xl">🖱️📱</div>
            <p className="text-xs font-bold text-[var(--text-main)] leading-relaxed">
              휠이나 스와이프로<br />캘린더를 부드럽게 넘길 수 있습니다.
            </p>
            <button
              type="button"
              onClick={() => setShowControlInfoModal(false)}
              className="px-4 py-1.5 bg-[var(--accent)] text-[var(--accent-fg)] font-black text-xs rounded-xl cursor-pointer"
            >
              확인
            </button>
          </div>
        )}

        {showYearPicker && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-xs rounded-2xl flex flex-col items-center justify-center p-4 z-[160] space-y-3">
            <h4 className="text-xs font-black text-[var(--accent)]">연도 선택</h4>
            <div className="grid grid-cols-2 gap-2 w-full max-w-[200px]">
              {[2025, 2026, 2027, 2028].map((y) => (
                <button
                  key={y}
                  type="button"
                  onClick={() => {
                    setViewAnchorDate(new Date(y, headerTitle.startMonth - 1, 1));
                    setShowYearPicker(false);
                  }}
                  className="py-2 bg-[var(--inner-box)] border border-[var(--panel-border)] hover:border-[var(--accent)] text-xs font-bold rounded-xl cursor-pointer"
                >
                  {y}년
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setShowYearPicker(false)}
              className="text-xs text-[var(--text-sub)] hover:text-white pt-1 cursor-pointer"
            >
              닫기
            </button>
          </div>
        )}

        {showMonthPicker && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-xs rounded-2xl flex flex-col items-center justify-center p-4 z-[160] space-y-3">
            <h4 className="text-xs font-black text-[var(--accent)]">월 선택</h4>
            <div className="grid grid-cols-4 gap-1.5 w-full">
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setViewAnchorDate(new Date(headerTitle.startYear, m - 1, 1));
                    setShowMonthPicker(false);
                  }}
                  className="py-2 bg-[var(--inner-box)] border border-[var(--panel-border)] hover:border-[var(--accent)] text-xs font-bold rounded-xl cursor-pointer"
                >
                  {m}월
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setShowMonthPicker(false)}
              className="text-xs text-[var(--text-sub)] hover:text-white pt-1 cursor-pointer"
            >
              닫기
            </button>
          </div>
        )}

      </div>
    </div>
  );
}