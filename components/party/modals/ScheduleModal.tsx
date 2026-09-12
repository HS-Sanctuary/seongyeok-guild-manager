"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import MarkIcon from "@/components/common/MarkIcon";
import CustomTimePicker from "@/components/party/CustomTimePicker";

interface ScheduleModalProps {
  showScheduleModal: boolean;
  setShowScheduleModal: (val: boolean) => void;
  calendarYearMonth: { year: number; month: number };
  setCalendarYearMonth: React.Dispatch<React.SetStateAction<{ year: number; month: number }>>;
  calendarDays: ({ day: number; dateStr: string } | null)[];
  selectedDate: string;
  setSelectedDate: (val: string) => void;
  timeStart: string;
  setTimeStart: (val: string) => void;
  timeEnd: string;
  setTimeEnd: (val: string) => void;
  getDayOfWeekKorean: (dateStr: string) => string;
}

export default function ScheduleModal({
  showScheduleModal,
  setShowScheduleModal,
  calendarYearMonth,
  setCalendarYearMonth,
  calendarDays,
  selectedDate,
  setSelectedDate,
  timeStart,
  setTimeStart,
  timeEnd,
  setTimeEnd,
  getDayOfWeekKorean,
}: ScheduleModalProps) {
  const [viewAnchorDate, setViewAnchorDate] = useState<Date>(() => {
    if (selectedDate) {
      const d = new Date(selectedDate + "T00:00:00");
      if (!isNaN(d.getTime())) return new Date(d.getFullYear(), d.getMonth(), 1);
    }
    return new Date(calendarYearMonth.year, calendarYearMonth.month, 1);
  });

  const [showYearPicker, setShowYearPicker] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  const modalContainerRef = useRef<HTMLDivElement | null>(null);
  const touchStartY = useRef<number | null>(null);
  const wheelAccumulator = useRef<number>(0);
  const lastWheelTime = useRef<number>(0);

  // 1주 단위 부드러운 스크롤 (FilterCalendarModal 표준 기준)
  const shiftWeeks = (weekDelta: number) => {
    setViewAnchorDate((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + weekDelta * 7);
      return next;
    });
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

  // 시간 파싱 세척
  const cleanTimeStart = useMemo(() => {
    if (!timeStart) return "14:00";
    return timeStart.replace(/\s*\(\+1일\)/g, "").replace(/\s*다음날/g, "").replace(/\s*\+\d+일/g, "").trim();
  }, [timeStart]);

  const cleanTimeEnd = useMemo(() => {
    if (!timeEnd) return "23:00";
    return timeEnd.replace(/\s*\(\+1일\)/g, "").replace(/\s*다음날/g, "").replace(/\s*\+\d+일/g, "").trim();
  }, [timeEnd]);

  // 자정 경과 이튿날 판별
  const isScheduleNextDay = useMemo(() => {
    if (timeEnd?.includes("+1일") || timeEnd?.includes("다음날")) return true;
    if (!cleanTimeStart || !cleanTimeEnd) return false;
    const [sH, sM] = cleanTimeStart.split(":").map(Number);
    const [eH, eM] = cleanTimeEnd.split(":").map(Number);
    if (isNaN(sH) || isNaN(eH)) return false;
    return (eH * 60 + (eM || 0)) <= (sH * 60 + (sM || 0));
  }, [timeEnd, cleanTimeStart, cleanTimeEnd]);

  const nextDayDateStr = useMemo(() => {
    if (!selectedDate) return "";
    const d = new Date(selectedDate + "T00:00:00");
    d.setDate(d.getDate() + 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }, [selectedDate]);

  useEffect(() => {
    const modalEl = modalContainerRef.current;
    if (!modalEl || !showScheduleModal) return;

    const handleNativeWheel = (e: WheelEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && target.closest(".scrollable-time-picker")) {
        e.stopPropagation();
        return;
      }

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
      const target = e.target as HTMLElement | null;
      if (target && target.closest(".scrollable-time-picker")) {
        e.stopPropagation();
        return;
      }
      e.preventDefault();
    };

    modalEl.addEventListener("wheel", handleNativeWheel, { passive: false });
    modalEl.addEventListener("touchmove", handleNativeTouchMove, { passive: false });

    return () => {
      modalEl.removeEventListener("wheel", handleNativeWheel);
      modalEl.removeEventListener("touchmove", handleNativeTouchMove);
    };
  }, [showScheduleModal]);

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

  if (!showScheduleModal) return null;

  return (
    <div 
      className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer overscroll-none"
      onClick={() => setShowScheduleModal(false)}
    >
      <div 
        ref={modalContainerRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="bg-[var(--panel)] border border-[var(--panel-border)] rounded-2xl p-4 sm:p-5 max-w-md w-full space-y-3.5 shadow-2xl animate-in fade-in zoom-in-95 cursor-default relative select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center border-b border-[var(--panel-border)] pb-2.5">
          <h3 className="font-black text-sm sm:text-base text-[var(--text-main)] flex items-center gap-2">
            <MarkIcon src="/svgs/UI mark/달력 마크.svg" size="sm" scale={1.8} colorClass="bg-[var(--accent)]" />
            <span>출발 희망 일시 설정</span>
          </h3>
          <button 
            type="button" 
            onClick={() => setShowScheduleModal(false)} 
            className="text-[var(--text-sub)] hover:text-white font-bold cursor-pointer text-sm p-1"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3">
          {/* 1주 스티어링 & 헤더 표기 */}
          <div className="flex justify-between items-center bg-[var(--inner-box)] p-2.5 rounded-xl border border-[var(--panel-border)] text-xs font-black">
            <button
              type="button"
              onClick={() => shiftWeeks(-1)}
              className="p-1 hover:text-[var(--accent)] cursor-pointer text-sm"
              title="이전 주"
            >
              ◀
            </button>

            <div className="flex items-center gap-1.5 text-xs font-black">
              <button
                type="button"
                onClick={() => setShowYearPicker(true)}
                className="hover:text-[var(--accent)] underline decoration-dotted underline-offset-4 cursor-pointer transition"
                title="연도 직접 선택"
              >
                {headerTitle.yearText}
              </button>
              <button
                type="button"
                onClick={() => setShowMonthPicker(true)}
                className="hover:text-[var(--accent)] underline decoration-dotted underline-offset-4 cursor-pointer transition"
                title="월 직접 선택"
              >
                {headerTitle.monthText}
              </button>
            </div>

            <button
              type="button"
              onClick={() => shiftWeeks(1)}
              className="p-1 hover:text-[var(--accent)] cursor-pointer text-sm"
              title="다음 주"
            >
              ▶
            </button>
          </div>

          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-black text-[var(--text-sub)] border-b border-[var(--panel-border)] pb-1">
            <span className="text-rose-400">일</span>
            <span>월</span>
            <span>화</span>
            <span>수</span>
            <span>목</span>
            <span>금</span>
            <span className="text-sky-400">토</span>
          </div>

          {/* 35일 그리드 */}
          <div className="grid grid-cols-7 gap-1">
            {calendarGridDays.map((d) => {
              const year = d.getFullYear();
              const monthStr = String(d.getMonth() + 1).padStart(2, "0");
              const dayStr = String(d.getDate()).padStart(2, "0");
              const dateKey = `${year}-${monthStr}-${dayStr}`;

              const isStartSelected = selectedDate === dateKey;
              const isNextDaySelected = isScheduleNextDay && nextDayDateStr === dateKey;

              const isFirstDayOfMonth = d.getDate() === 1;
              const lastDayOfMonthNum = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
              const isLastDayOfMonth = d.getDate() === lastDayOfMonthNum;

              return (
                <button
                  key={dateKey}
                  type="button"
                  onClick={() => setSelectedDate(dateKey)}
                  className={`h-9 rounded-xl text-xs font-black transition flex flex-col items-center justify-center cursor-pointer relative ${
                    isStartSelected
                      ? "bg-[var(--accent)] text-[var(--accent-fg)] shadow-md ring-2 ring-[var(--accent)]/50 z-10"
                      : isNextDaySelected
                      ? "bg-indigo-900/70 text-indigo-200 border border-indigo-400/80 ring-1 ring-indigo-400/50 shadow-sm z-10"
                      : "hover:bg-[var(--inner-box)] text-[var(--text-main)] bg-[var(--inner-box)]/40 border border-transparent"
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
                  {isNextDaySelected && (
                    <span className="absolute -top-1 -right-1 text-[8px] bg-indigo-500 text-white rounded-full w-3.5 h-3.5 flex items-center justify-center font-bold shadow-xs">
                      🌙
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* 타임 피커 영역 */}
          <div className="flex items-center justify-between gap-1.5 sm:gap-2 pt-3 pb-1 border-t border-[var(--panel-border)] w-full min-w-0">
            <div className="flex items-center gap-1 flex-1 min-w-0">
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-xs">⏰</span>
                <span className="text-xs font-bold text-[var(--text-sub)]">시작</span>
              </div>
              <CustomTimePicker
                value={cleanTimeStart}
                onChange={setTimeStart}
                pickerType="start"
              />
            </div>

            <span className="text-xs font-black text-[var(--text-sub)] shrink-0 px-0.5">~</span>

            <div className="flex items-center gap-1 flex-1 min-w-0">
              <span className="text-xs font-bold text-[var(--text-sub)] shrink-0">종료</span>
              <CustomTimePicker
                value={cleanTimeEnd}
                onChange={setTimeEnd}
                pickerType="end"
                badge={
                  isScheduleNextDay ? (
                    <span className="px-1 py-0.5 rounded bg-[#1e1b4b] text-indigo-300 border border-indigo-500/40 text-[9px] font-black flex items-center gap-0.5 shrink-0 whitespace-nowrap">
                      🌙 다음 날
                    </span>
                  ) : undefined
                }
              />
            </div>
          </div>

          {/* 🟢 [복구 완료] 실시간 요약 바 (전체 연도 표기 유지: 2026-09-12 (토)) */}
          <div className="bg-[var(--inner-box)] border border-[var(--panel-border)] p-2.5 rounded-xl animate-in fade-in">
            <div className="flex items-center gap-2 min-w-0 text-xs font-black text-[var(--text-main)] leading-none">
              <MarkIcon src="/svgs/UI mark/달력 마크.svg" size="sm" scale={2.10} colorClass="bg-[var(--accent)]" />

              <div className="flex items-center gap-1.5 min-w-0 truncate">
                <span className="text-[var(--accent)] whitespace-nowrap shrink-0 flex items-center leading-none">
                  {selectedDate} ({getDayOfWeekKorean(selectedDate)})
                </span>
                <span className="text-[var(--text-sub)] font-bold shrink-0 flex items-center leading-none opacity-60">|</span>
                <span className="font-mono truncate flex items-center gap-1.5 leading-none translate-y-[0.5px]">
                  <span>{cleanTimeStart} ~ {cleanTimeEnd}</span>
                  {isScheduleNextDay && (
                    <span className="text-[9px] bg-indigo-900/80 text-indigo-200 border border-indigo-500/50 px-1.5 py-0.5 rounded font-sans shrink-0 font-bold leading-none">
                      (+1일)
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 완료 버튼 */}
        <button
          type="button"
          onClick={() => setShowScheduleModal(false)}
          className="w-full py-2.5 bg-[var(--accent)] text-[var(--accent-fg)] font-black text-xs rounded-xl cursor-pointer shadow-md hover:brightness-110 transition active:scale-98"
        >
          설정 완료
        </button>

        {/* 연도 선택 서브 모달 */}
        {showYearPicker && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-xs rounded-2xl flex flex-col items-center justify-center p-4 z-[350] space-y-3">
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

        {/* 월 선택 서브 모달 */}
        {showMonthPicker && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-xs rounded-2xl flex flex-col items-center justify-center p-4 z-[350] space-y-3">
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
                  className="py-2 bg-[var(--inner-box)] border border-[var(--panel-border)] hover:border-[var(--accent)] text-xs font-bold rounded-xl cursor-pointer text-center font-mono"
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