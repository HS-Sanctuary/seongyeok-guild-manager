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
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  const modalContainerRef = useRef<HTMLDivElement | null>(null);
  const touchStartY = useRef<number | null>(null);
  const wheelAccumulator = useRef<number>(0);
  const lastWheelTime = useRef<number>(0);

  const shiftMonth = (delta: number) => {
    setCalendarYearMonth((prev) => {
      let newM = prev.month + delta;
      let newY = prev.year;
      if (newM < 0) {
        newM = 11;
        newY -= 1;
      } else if (newM > 11) {
        newM = 0;
        newY += 1;
      }
      return { year: newY, month: newM };
    });
  };

  // 핵심 수정: 네이티브 스크롤 이벤트에서 타임 피커 요소 감지 시 preventDefault 예외 처리
  useEffect(() => {
    const modalEl = modalContainerRef.current;
    if (!modalEl || !showScheduleModal) return;

    const handleNativeWheel = (e: WheelEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && target.closest(".scrollable-time-picker")) {
        e.stopPropagation();
        return; // 시간 선택창 내부 휠 스크롤 허용
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
        shiftMonth(1);
        wheelAccumulator.current = 0;
      } else if (wheelAccumulator.current <= -THRESHOLD) {
        shiftMonth(-1);
        wheelAccumulator.current = 0;
      }
    };

    const handleNativeTouchMove = (e: TouchEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && target.closest(".scrollable-time-picker")) {
        e.stopPropagation();
        return; // 시간 선택창 내부 터치 스크롤 허용
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
      if (diffY > 0) shiftMonth(1);
      else shiftMonth(-1);
    }
    touchStartY.current = null;
  };

  const isScheduleNextDay = useMemo(() => {
    if (!timeStart || !timeEnd) return false;
    const [sH, sM] = timeStart.split(":").map(Number);
    const [eH, eM] = timeEnd.split(":").map(Number);
    return (eH * 60 + eM) <= (sH * 60 + sM);
  }, [timeStart, timeEnd]);

  const nextDayDateStr = useMemo(() => {
    if (!selectedDate) return "";
    const d = new Date(selectedDate + "T00:00:00");
    d.setDate(d.getDate() + 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }, [selectedDate]);

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
          {/* 월별 내비게이션 & 연/월 피커 */}
          <div className="flex justify-between items-center bg-[var(--inner-box)] p-2.5 rounded-xl border border-[var(--panel-border)] text-xs font-black">
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              className="p-1 hover:text-[var(--accent)] cursor-pointer text-sm"
              title="이전 달"
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
                {calendarYearMonth.year}년
              </button>
              <button
                type="button"
                onClick={() => setShowMonthPicker(true)}
                className="hover:text-[var(--accent)] underline decoration-dotted underline-offset-4 cursor-pointer transition"
                title="월 직접 선택"
              >
                {calendarYearMonth.month + 1}월
              </button>
            </div>

            <button
              type="button"
              onClick={() => shiftMonth(1)}
              className="p-1 hover:text-[var(--accent)] cursor-pointer text-sm"
              title="다음 달"
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

          {/* 달력 날짜 셀 그리드 */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((d, i) => {
              if (!d) return <div key={i} className="h-8"></div>;
              
              const isStartSelected = selectedDate === d.dateStr;
              const isNextDaySelected = isScheduleNextDay && nextDayDateStr === d.dateStr;

              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelectedDate(d.dateStr)}
                  className={`h-8 rounded-lg text-xs font-black transition flex flex-col items-center justify-center cursor-pointer relative ${
                    isStartSelected
                      ? "bg-[var(--accent)] text-[var(--accent-fg)] shadow-md ring-2 ring-[var(--accent)]/50"
                      : isNextDaySelected
                      ? "bg-indigo-900/70 text-indigo-200 border border-indigo-400/80 ring-1 ring-indigo-400/50 shadow-sm"
                      : "hover:bg-[var(--inner-box)] text-[var(--text-main)]"
                  }`}
                >
                  <span>{d.day}</span>
                  {isNextDaySelected && (
                    <span className="absolute -top-1 -right-1 text-[8px] bg-indigo-500 text-white rounded-full w-3.5 h-3.5 flex items-center justify-center font-bold shadow-xs">
                      🌙
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* 시작 & 종료 타임 피커 (pickerType 명시) */}
          <div className="flex items-center justify-between gap-1.5 sm:gap-2 pt-3 pb-1 border-t border-[var(--panel-border)] w-full min-w-0">
            <div className="flex items-center gap-1 flex-1 min-w-0">
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-xs">⏰</span>
                <span className="text-xs font-bold text-[var(--text-sub)]">시작</span>
              </div>
              <CustomTimePicker
                value={timeStart}
                onChange={setTimeStart}
                pickerType="start"
              />
            </div>

            <span className="text-xs font-black text-[var(--text-sub)] shrink-0 px-0.5">~</span>

            <div className="flex items-center gap-1 flex-1 min-w-0">
              <span className="text-xs font-bold text-[var(--text-sub)] shrink-0">종료</span>
              <CustomTimePicker
                value={timeEnd}
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

          {/* 실시간 피드백 바 */}
          <div className="bg-[var(--inner-box)] border border-[var(--panel-border)] p-2.5 rounded-xl animate-in fade-in">
            <div className="flex items-center gap-2 min-w-0 truncate text-xs font-black text-[var(--text-main)] leading-none">
              <MarkIcon src="/svgs/UI mark/달력 마크.svg" size="sm" scale={2.10} colorClass="bg-[var(--accent)]" />

              {isScheduleNextDay ? (
                <div className="flex flex-col gap-1 min-w-0 text-left">
                  <div className="text-[var(--accent)] text-[11px] font-black truncate leading-tight">
                    {selectedDate
                      ? (() => {
                          const d1 = new Date(selectedDate + "T00:00:00");
                          const d2 = new Date(selectedDate + "T00:00:00");
                          d2.setDate(d2.getDate() + 1);
                          const m1 = String(d1.getMonth() + 1).padStart(2, "0");
                          const day1 = String(d1.getDate()).padStart(2, "0");
                          const dow1 = getDayOfWeekKorean(selectedDate);
                          const y2 = d2.getFullYear();
                          const m2 = String(d2.getMonth() + 1).padStart(2, "0");
                          const day2 = String(d2.getDate()).padStart(2, "0");
                          const nextDateStr = `${y2}-${m2}-${day2}`;
                          const dow2 = getDayOfWeekKorean(nextDateStr);
                          return `${m1}-${day1}(${dow1}) ~ ${m2}-${day2}(${dow2})`;
                        })()
                      : ""
                    }
                  </div>
                  <div className="text-[var(--text-main)] font-mono text-xs flex items-center gap-1.5 leading-tight">
                    <span>{timeStart || "14:00"} ~ {timeEnd || "23:00"}</span>
                    <span className="text-[9px] bg-indigo-900/80 text-indigo-200 border border-indigo-500/50 px-1 py-0.2 rounded font-sans shrink-0 font-bold">
                      🌙 다음 날
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 min-w-0 truncate">
                  <span className="text-[var(--accent)] whitespace-nowrap shrink-0 flex items-center leading-none">
                    {selectedDate} ({getDayOfWeekKorean(selectedDate)})
                  </span>
                  <span className="text-[var(--text-sub)] font-bold shrink-0 flex items-center leading-none opacity-60">|</span>
                  <span className="font-mono truncate flex items-center leading-none translate-y-[0.5px]">
                    {timeStart || "14:00"} ~ {timeEnd || "23:00"}
                  </span>
                </div>
              )}
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
                    setCalendarYearMonth((prev) => ({ ...prev, year: y }));
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
                    setCalendarYearMonth((prev) => ({ ...prev, month: m - 1 }));
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