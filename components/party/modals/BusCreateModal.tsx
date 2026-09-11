"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import ClassIcon from "@/components/common/ClassIcon";
import MarkIcon from "@/components/common/MarkIcon";
import CustomTimePicker from "@/components/party/CustomTimePicker";
import { CONTENT_DB, ContentItem } from "@/components/party/types";

export interface BusCharSelectionConfig {
  selected: boolean;
  allowRepeat: boolean;
}

export function generateDefaultBusMemo(content: ContentItem, diff: string): string {
  return `"성역 길드 버스" [${content.name} ${diff}]`;
}

const cleanContentName = (name: string) => {
  return name
    .replace(/^(어비스|레이드)\s*-\s*/, "")
    .replace(/\s*\(통합\)/g, "")
    .trim();
};

const getDayOfWeekKorean = (dateStr: string) => {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  if (isNaN(d.getTime())) return "";
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  return days[d.getDay()];
};

const formatShortDateDisplay = (dateStr: string) => {
  if (!dateStr) return "날짜 미정";
  const d = new Date(dateStr + "T00:00:00");
  if (isNaN(d.getTime())) return dateStr;
  const yy = String(d.getFullYear()).slice(2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const dow = getDayOfWeekKorean(dateStr);
  return `${yy}-${mm}-${dd} (${dow})`;
};

interface BusCreateModalProps {
  showBusCreateModal: boolean;
  setShowBusCreateModal: (val: boolean) => void;
  busCreateContent: ContentItem;
  setBusCreateContent: (val: ContentItem) => void;
  busCreateDiff: string;
  setBusCreateDiff: (val: string) => void;
  busCreateDate: string;
  setBusCreateDate: (val: string) => void;
  busCreateTimeStart: string;
  setBusCreateTimeStart: (val: string) => void;
  busCreateTimeEnd: string;
  setBusCreateTimeEnd: (val: string) => void;
  busCreateMemo: string;
  setBusCreateMemo: (val: string) => void;
  busCharSelections: Record<string, BusCharSelectionConfig>;
  setBusCharSelections: React.Dispatch<React.SetStateAction<Record<string, BusCharSelectionConfig>>>;
  handleCreateGuildBus: () => void;
  myCharacters: any[];
}

export default function BusCreateModal({
  showBusCreateModal,
  setShowBusCreateModal,
  busCreateContent,
  setBusCreateContent,
  busCreateDiff,
  setBusCreateDiff,
  busCreateDate,
  setBusCreateDate,
  busCreateTimeStart,
  setBusCreateTimeStart,
  busCreateTimeEnd,
  setBusCreateTimeEnd,
  busCreateMemo,
  setBusCreateMemo,
  busCharSelections,
  setBusCharSelections,
  handleCreateGuildBus,
  myCharacters,
}: BusCreateModalProps) {
  const [currentStep, setCurrentStep] = useState<"SETTINGS" | "CHARACTERS">("SETTINGS");

  const [showContentModal, setShowContentModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  const [tempContentCategory, setTempContentCategory] = useState<"어비스" | "레이드">("레이드");
  const [tempContent, setTempContent] = useState<ContentItem>(busCreateContent);
  const [tempDiff, setTempDiff] = useState<string>(busCreateDiff);

  const [calendarYearMonth, setCalendarYearMonth] = useState(() => {
    const d = busCreateDate ? new Date(busCreateDate + "T00:00:00") : new Date();
    const validD = isNaN(d.getTime()) ? new Date() : d;
    return { year: validD.getFullYear(), month: validD.getMonth() };
  });

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
      if (diffY > 0) shiftMonth(1);
      else shiftMonth(-1);
    }
    touchStartY.current = null;
  };

  const uniqueCharacters = useMemo(() => {
    const map = new Map();
    (myCharacters || []).forEach((c) => {
      const charKey = c.nickname || c.name || String(c.id);
      if (charKey && !map.has(charKey)) {
        map.set(charKey, c);
      }
    });
    return Array.from(map.values()) as any[];
  }, [myCharacters]);

  const selectedCount = Object.values(busCharSelections).filter((c) => c.selected).length;
  const totalCount = uniqueCharacters.length;
  const isAllSelected = totalCount > 0 && selectedCount === totalCount;

  const isAllRepeat = useMemo(() => {
    const selectedKeys = Object.keys(busCharSelections).filter((k) => busCharSelections[k]?.selected);
    if (selectedKeys.length === 0) return false;
    return selectedKeys.every((k) => busCharSelections[k]?.allowRepeat === true);
  }, [busCharSelections]);

  const handleToggleSelectAll = () => {
    const nextSelectState = !isAllSelected;
    setBusCharSelections((prev) => {
      const next = { ...prev };
      uniqueCharacters.forEach((char) => {
        const key = char.nickname || char.name || String(char.id);
        if (key) {
          next[key] = {
            selected: nextSelectState,
            allowRepeat: next[key]?.allowRepeat ?? false,
          };
        }
      });
      return next;
    });
  };

  const handleToggleBatchRepeat = () => {
    const nextRepeatState = !isAllRepeat;
    setBusCharSelections((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((k) => {
        if (next[k]?.selected) {
          next[k] = { ...next[k], allowRepeat: nextRepeatState };
        }
      });
      return next;
    });
  };

  const openContentSelectModal = () => {
    setTempContentCategory(busCreateContent.category || "레이드");
    setTempContent(busCreateContent);
    setTempDiff(busCreateDiff);
    setShowContentModal(true);
  };

  const applyContentModal = () => {
    setBusCreateContent(tempContent);
    setBusCreateDiff(tempDiff);
    setBusCreateMemo(generateDefaultBusMemo(tempContent, tempDiff));
    setShowContentModal(false);
  };

  const openScheduleModal = () => {
    const d = busCreateDate ? new Date(busCreateDate + "T00:00:00") : new Date();
    const validD = isNaN(d.getTime()) ? new Date() : d;
    setCalendarYearMonth({ year: validD.getFullYear(), month: validD.getMonth() });
    setShowScheduleModal(true);
  };

  const calendarDays = useMemo(() => {
    const { year, month } = calendarYearMonth;
    const days: ({ day: number; dateStr: string } | null)[] = [];
    const firstDayOfWeek = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }

    for (let d = 1; d <= totalDays; d++) {
      const mStr = String(month + 1).padStart(2, "0");
      const dStr = String(d).padStart(2, "0");
      days.push({
        day: d,
        dateStr: `${year}-${mStr}-${dStr}`,
      });
    }

    return days;
  }, [calendarYearMonth]);

  const isScheduleNextDay = useMemo(() => {
    if (!busCreateTimeStart || !busCreateTimeEnd) return false;
    const [sH, sM] = busCreateTimeStart.split(":").map(Number);
    const [eH, eM] = busCreateTimeEnd.split(":").map(Number);
    return (eH * 60 + eM) <= (sH * 60 + sM);
  }, [busCreateTimeStart, busCreateTimeEnd]);

  const nextDayDateStr = useMemo(() => {
    if (!busCreateDate) return "";
    const d = new Date(busCreateDate + "T00:00:00");
    d.setDate(d.getDate() + 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }, [busCreateDate]);

  const abyssContents = useMemo(() => CONTENT_DB.filter((c) => c.category === "어비스"), []);
  const raidContents = useMemo(() => CONTENT_DB.filter((c) => c.category === "레이드"), []);

  if (!showBusCreateModal) return null;

  return (
    <div 
      className="fixed inset-0 z-[250] bg-black/85 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 cursor-pointer overscroll-none"
      onClick={() => setShowBusCreateModal(false)}
    >
      <div 
        className="bg-[var(--panel)] border border-[var(--panel-border)] rounded-2xl max-w-lg w-full flex flex-col max-h-[85vh] sm:max-h-[90vh] shadow-2xl animate-in fade-in zoom-in-95 overflow-hidden cursor-default min-w-0 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-4 sm:px-5 py-3 sm:py-3.5 border-b border-[var(--panel-border)] bg-[var(--inner-box)] shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <MarkIcon src="/svgs/UI mark/길드 마크.svg" size="sm" scale={1.8} colorClass="bg-[var(--accent)]" />
            <h3 className="font-black text-sm sm:text-base text-[var(--accent)] tracking-tight truncate">
              성역 공식 길드 버스 개설
            </h3>
          </div>
          <button 
            type="button"
            onClick={() => setShowBusCreateModal(false)}
            className="text-[var(--text-sub)] hover:text-white font-black text-base sm:text-lg p-1 cursor-pointer shrink-0 ml-2"
          >
            ✕
          </button>
        </div>

        {/* 2단계 순차 프로세스 바 */}
        <div className="grid grid-cols-2 border-b border-[var(--panel-border)] bg-[var(--panel)] text-xs font-black shrink-0">
          <button
            type="button"
            onClick={() => setCurrentStep("SETTINGS")}
            className={`py-2.5 sm:py-3 flex items-center justify-center gap-1.5 border-b-2 transition cursor-pointer ${
              currentStep === "SETTINGS"
                ? "border-[var(--accent)] text-[var(--accent)] bg-[var(--inner-box)]/60 font-black"
                : "border-transparent text-[var(--text-sub)] hover:text-white"
            }`}
          >
            <span>1️⃣ 버스 생성 설정</span>
            {currentStep === "CHARACTERS" && <span className="text-[10px] text-emerald-400">✓</span>}
          </button>

          <button
            type="button"
            onClick={() => setCurrentStep("CHARACTERS")}
            className={`py-2.5 sm:py-3 flex items-center justify-center gap-1.5 border-b-2 transition cursor-pointer ${
              currentStep === "CHARACTERS"
                ? "border-[var(--accent)] text-[var(--accent)] bg-[var(--inner-box)]/60 font-black"
                : "border-transparent text-[var(--text-sub)] hover:text-white"
            }`}
          >
            <span>2️⃣ 참여 캐릭터 선택</span>
            <span className="px-1.5 py-0.2 rounded-full bg-[var(--accent)]/20 text-[var(--accent)] text-[10px] font-mono">
              {selectedCount}/{totalCount}
            </span>
          </button>
        </div>

        {/* Step Body */}
        <div className="p-3.5 sm:p-5 overflow-y-auto custom-scrollbar flex-1 space-y-3.5 overscroll-contain min-h-0">
          {currentStep === "SETTINGS" ? (
            /* 1단계: 버스 생성 설정 */
            <div className="space-y-3">
              {/* 1. 목표 컨텐츠 선택 카드 */}
              <div
                onClick={openContentSelectModal}
                className="bg-[var(--inner-box)] border border-[var(--panel-border)] hover:border-[var(--accent)]/70 transition p-3 sm:p-3.5 rounded-2xl cursor-pointer flex items-center justify-between gap-3 shadow-xs group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <MarkIcon
                    src={
                      busCreateContent.category === "어비스"
                        ? "/svgs/contens mark/어비스 마크.svg"
                        : "/svgs/contens mark/레이드 마크.svg"
                    }
                    size="sm"
                    scale={1.8}
                    colorClass="bg-[var(--accent)]"
                  />
                  <span className="font-black text-sm sm:text-base text-[var(--text-main)] truncate">
                    {cleanContentName(busCreateContent.name)}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="px-2 py-0.5 rounded-md bg-[var(--panel)] border border-[var(--panel-border)] text-[var(--text-sub)] text-[11px] font-bold">
                      {busCreateContent.size}인
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-[var(--accent)]/20 border border-[var(--accent)]/40 text-[var(--accent)] text-[11px] font-black">
                      {busCreateDiff}
                    </span>
                  </div>
                </div>
                <span className="text-[var(--text-sub)] group-hover:text-[var(--accent)] text-sm transition shrink-0">
                  ⚙️
                </span>
              </div>

              {/* 2. 출발 일시 설정 카드 */}
              <div
                onClick={openScheduleModal}
                className="bg-[var(--inner-box)] border border-[var(--panel-border)] hover:border-[var(--accent)]/70 transition p-3 sm:p-3.5 rounded-2xl cursor-pointer flex items-center justify-between gap-3 shadow-xs group"
              >
                <div className="flex items-center gap-2.5 min-w-0 truncate">
                  <MarkIcon src="/svgs/UI mark/달력 마크.svg" size="sm" scale={1.8} colorClass="bg-[var(--accent)]" />
                  <div className="flex items-center gap-1.5 font-mono text-xs sm:text-sm font-black text-[var(--accent)] truncate">
                    <span>{formatShortDateDisplay(busCreateDate)}</span>
                    <span className="text-[var(--text-sub)] opacity-50 font-normal">|</span>
                    <span className="text-[var(--text-main)] font-mono">
                      {busCreateTimeStart || "14:00"} ~ {busCreateTimeEnd || "23:00"}
                    </span>
                    {isScheduleNextDay && (
                      <span className="text-[9px] bg-indigo-900/80 text-indigo-200 border border-indigo-500/50 px-1 py-0.2 rounded font-sans shrink-0 font-bold ml-0.5">
                        🌙 다음 날
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-[var(--text-sub)] group-hover:text-[var(--accent)] text-sm transition shrink-0">
                  ⚙️
                </span>
              </div>

              {/* 3. 공지 메모 */}
              <div className="pt-1">
                <label className="text-[11px] font-black text-[var(--text-sub)] block mb-1">공지 메모</label>
                <input
                  type="text"
                  value={busCreateMemo}
                  onChange={(e) => setBusCreateMemo(e.target.value)}
                  placeholder="버스 승객 안내용 공지"
                  className="w-full bg-[var(--inner-box)] border border-[var(--panel-border)] rounded-xl p-2.5 text-xs font-bold text-[var(--text-main)] outline-none focus:border-[var(--accent)] transition"
                />
              </div>
            </div>
          ) : (
            /* 2단계: 참여 캐릭터 선택 */
            <div className="space-y-3">
              <div className="bg-[var(--inner-box)] border border-[var(--panel-border)] p-2 rounded-xl flex items-center justify-between gap-2 text-xs">
                <button
                  type="button"
                  onClick={handleToggleSelectAll}
                  className={`px-3 py-1.5 rounded-lg font-bold text-[11px] border transition cursor-pointer whitespace-nowrap shrink-0 ${
                    isAllSelected
                      ? "bg-rose-500/15 text-rose-300 border-rose-500/40 hover:bg-rose-500/25"
                      : "bg-[var(--panel)] border-[var(--panel-border)] text-[var(--text-main)] hover:border-[var(--accent)]"
                  }`}
                >
                  {isAllSelected ? "✕ 전체 해제" : "✓ 전체 선택"}
                </button>

                <button
                  type="button"
                  onClick={handleToggleBatchRepeat}
                  className={`px-3 py-1.5 rounded-lg font-black text-[11px] border transition cursor-pointer whitespace-nowrap shrink-0 ${
                    isAllRepeat
                      ? "bg-amber-500/20 text-amber-300 border-amber-500/50"
                      : "bg-zinc-800 text-zinc-300 border-zinc-700 hover:text-white"
                  }`}
                >
                  {isAllRepeat ? "🔄 전체 반복 중" : "1️⃣ 전체 1회성 중"}
                </button>
              </div>

              <div className="space-y-2">
                {uniqueCharacters.map((char) => {
                  const key = char.nickname || char.name || String(char.id);
                  const config = busCharSelections[key] || { selected: false, allowRepeat: false };

                  return (
                    <div
                      key={key}
                      onClick={() => {
                        setBusCharSelections((prev) => ({
                          ...prev,
                          [key]: { ...config, selected: !config.selected },
                        }));
                      }}
                      className={`p-2.5 sm:p-3 rounded-xl border transition flex items-center justify-between gap-2.5 cursor-pointer select-none ${
                        config.selected
                          ? "bg-[var(--inner-box)] border-[var(--accent)] shadow-xs"
                          : "bg-[var(--panel)] border-[var(--panel-border)] opacity-60 hover:opacity-100"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <input
                          type="checkbox"
                          checked={config.selected}
                          onChange={() => {}}
                          className="w-4 h-4 accent-[var(--accent)] rounded cursor-pointer shrink-0"
                        />
                        <ClassIcon job={char.job} className="w-7 h-7 sm:w-8 sm:h-8 shrink-0" />
                        
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-black text-xs sm:text-sm text-[var(--text-main)] truncate max-w-[110px] sm:max-w-[150px]">
                              {char.nickname || char.name}
                            </span>
                            {char.is_main && (
                              <span className="px-1.5 py-0.2 bg-[var(--accent)] text-[var(--accent-fg)] font-black text-[9px] rounded shrink-0 leading-none">
                                대표
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-[11px] font-black text-[var(--text-sub)] flex-wrap">
                            <span className="text-[var(--text-main)] flex items-center gap-1 shrink-0">
                              <span
                                className="w-3.5 h-3.5 bg-[var(--text-main)] shrink-0 inline-block"
                                style={{
                                  maskImage: 'url("/svgs/status mark/전투력 마크.svg")',
                                  WebkitMaskImage: 'url("/svgs/status mark/전투력 마크.svg")',
                                  maskSize: "contain",
                                  WebkitMaskSize: "contain",
                                  maskRepeat: "no-repeat",
                                  WebkitMaskRepeat: "no-repeat",
                                  maskPosition: "center",
                                  WebkitMaskPosition: "center",
                                }}
                              />
                              <span>{Number(char.combat_power || 0).toLocaleString()}</span>
                            </span>

                            <span className="text-purple-400 dark:text-purple-300 flex items-center gap-1 shrink-0">
                              <span
                                className="w-3.5 h-3.5 bg-purple-400 dark:bg-purple-300 shrink-0 inline-block"
                                style={{
                                  maskImage: 'url("/svgs/status mark/마도저항 마크.svg")',
                                  WebkitMaskImage: 'url("/svgs/status mark/마도저항 마크.svg")',
                                  maskSize: "contain",
                                  WebkitMaskSize: "contain",
                                  maskRepeat: "no-repeat",
                                  WebkitMaskRepeat: "no-repeat",
                                  maskPosition: "center",
                                  WebkitMaskPosition: "center",
                                }}
                              />
                              <span>{Number(char.magic_resistance || 0).toLocaleString()}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {config.selected && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setBusCharSelections((prev) => ({
                              ...prev,
                              [key]: { ...config, allowRepeat: !config.allowRepeat },
                            }));
                          }}
                          className={`px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg text-[10px] sm:text-[11px] font-black border transition shrink-0 cursor-pointer whitespace-nowrap ${
                            config.allowRepeat
                              ? "bg-amber-500/20 text-amber-300 border-amber-500/50"
                              : "bg-zinc-800 text-zinc-400 border-zinc-700"
                          }`}
                        >
                          {config.allowRepeat ? "🔄 반복 가능" : "1️⃣ 1회성"}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="p-3 sm:p-4 border-t border-[var(--panel-border)] bg-[var(--inner-box)] flex items-center gap-2 sm:gap-3 shrink-0">
          {currentStep === "SETTINGS" ? (
            <>
              <button
                type="button"
                onClick={() => setShowBusCreateModal(false)}
                className="flex-1 py-2.5 sm:py-3 bg-[var(--panel)] border border-[var(--panel-border)] text-[var(--text-sub)] font-bold text-xs rounded-xl hover:text-white transition cursor-pointer text-center truncate"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep("CHARACTERS")}
                className="flex-2 py-2.5 sm:py-3 bg-[var(--accent)] text-[var(--accent-fg)] font-black text-xs sm:text-sm rounded-xl shadow-md hover:brightness-110 transition cursor-pointer text-center truncate"
              >
                다음: 캐릭터 선택 (1/2) ➡️
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setCurrentStep("SETTINGS")}
                className="flex-1 py-2.5 sm:py-3 bg-[var(--panel)] border border-[var(--panel-border)] text-[var(--text-sub)] font-bold text-xs rounded-xl hover:text-white transition cursor-pointer text-center truncate"
              >
                ◀ 설정 변경
              </button>
              <button
                type="button"
                onClick={handleCreateGuildBus}
                className="flex-2 py-2.5 sm:py-3 bg-[var(--accent)] text-[var(--accent-fg)] font-black text-xs sm:text-sm rounded-xl shadow-md hover:brightness-110 transition cursor-pointer text-center truncate"
              >
                🚌 버스 개설하기 ({selectedCount}개)
              </button>
            </>
          )}
        </div>

        {/* 서브 모달 1: 목표 컨텐츠 선택 */}
        {showContentModal && (
          <div
            className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 cursor-pointer overscroll-none"
            onClick={() => setShowContentModal(false)}
          >
            <div
              className="bg-[var(--panel)] border border-[var(--panel-border)] rounded-2xl p-4 sm:p-5 max-w-lg w-full space-y-3 shadow-2xl animate-in fade-in zoom-in-95 cursor-default max-h-[85vh] flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center border-b border-[var(--panel-border)] pb-3 shrink-0">
                <h3 className="font-black text-sm sm:text-base text-[var(--text-main)] flex items-center gap-2">
                  <MarkIcon src="/svgs/contens mark/여신상 마크.svg" size="sm" scale={1.8} colorClass="bg-[var(--accent)]" />
                  <span>목표 컨텐츠 선택</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowContentModal(false)}
                  className="text-[var(--text-sub)] hover:text-white font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 grid grid-cols-2 gap-2.5 sm:gap-3.5 min-h-0 overscroll-contain">
                {/* 좌측: 어비스 */}
                <div className="space-y-2 pr-1 sm:pr-2 border-r border-[var(--panel-border)]/70">
                  <div className="flex items-center gap-1.5 pb-1.5 border-b border-[var(--panel-border)] text-xs font-black text-[var(--accent)] sticky top-0 bg-[var(--panel)] z-10">
                    <MarkIcon src="/svgs/contens mark/어비스 마크.svg" size="sm" scale={1.6} colorClass="bg-[var(--accent)]" />
                    <span>어비스</span>
                  </div>
                  <div className="space-y-2">
                    {abyssContents.map((c) => {
                      const isSelected = tempContent.name === c.name;
                      const displayName = cleanContentName(c.name);

                      return (
                        <div
                          key={c.name}
                          className={`rounded-xl overflow-hidden border transition-all duration-200 ${
                            isSelected
                              ? "border-[var(--accent)] bg-[var(--inner-box)] shadow-md"
                              : "border-[var(--panel-border)] bg-[var(--panel)] hover:border-[var(--accent)]/50"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setTempContent(c);
                              setTempContentCategory("어비스");
                              if (tempContent.name !== c.name) {
                                setTempDiff(c.defaultDiff);
                              }
                            }}
                            className={`w-full p-2 sm:p-2.5 text-left text-xs font-black transition flex items-center justify-between cursor-pointer ${
                              isSelected
                                ? "bg-[var(--accent)] text-[var(--accent-fg)]"
                                : "bg-[var(--inner-box)] text-[var(--text-main)] hover:bg-[var(--panel-border)]/50"
                            }`}
                          >
                            <span className="truncate">{displayName}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold shrink-0 ml-1 ${
                              isSelected ? "bg-black/20 text-[var(--accent-fg)]" : "bg-[var(--panel)] text-[var(--text-sub)]"
                            }`}>
                              {c.size}인
                            </span>
                          </button>

                          {isSelected && (
                            <div className="p-2 sm:p-2.5 bg-[var(--inner-box)]/90 border-t border-[var(--accent)]/30 space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                              <span className="text-[10px] font-black text-[var(--text-sub)] block">
                                난이도 선택
                              </span>
                              <div className="grid grid-cols-2 gap-1.5">
                                {c.diffs.map((d) => {
                                  const isDiffSelected = tempDiff === d;
                                  return (
                                    <button
                                      key={d}
                                      type="button"
                                      onClick={() => setTempDiff(d)}
                                      className={`py-1.5 px-1 text-[10px] sm:text-[11px] font-black rounded-lg border transition-all cursor-pointer text-center whitespace-nowrap break-keep ${
                                        isDiffSelected
                                          ? "bg-[var(--accent)] text-[var(--accent-fg)] border-transparent shadow-xs scale-[1.02]"
                                          : "bg-[var(--panel)] border-[var(--panel-border)] text-[var(--text-sub)] hover:text-white hover:border-[var(--accent)]/50"
                                      }`}
                                    >
                                      {d}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 우측: 레이드 */}
                <div className="space-y-2 pl-1 sm:pl-2">
                  <div className="flex items-center gap-1.5 pb-1.5 border-b border-[var(--panel-border)] text-xs font-black text-[var(--accent)] sticky top-0 bg-[var(--panel)] z-10">
                    <MarkIcon src="/svgs/contens mark/레이드 마크.svg" size="sm" scale={1.6} colorClass="bg-[var(--accent)]" />
                    <span>레이드</span>
                  </div>
                  <div className="space-y-2">
                    {raidContents.map((c) => {
                      const isSelected = tempContent.name === c.name;
                      const displayName = cleanContentName(c.name);

                      return (
                        <div
                          key={c.name}
                          className={`rounded-xl overflow-hidden border transition-all duration-200 ${
                            isSelected
                              ? "border-[var(--accent)] bg-[var(--inner-box)] shadow-md"
                              : "border-[var(--panel-border)] bg-[var(--panel)] hover:border-[var(--accent)]/50"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setTempContent(c);
                              setTempContentCategory("레이드");
                              if (tempContent.name !== c.name) {
                                setTempDiff(c.defaultDiff);
                              }
                            }}
                            className={`w-full p-2 sm:p-2.5 text-left text-xs font-black transition flex items-center justify-between cursor-pointer ${
                              isSelected
                                ? "bg-[var(--accent)] text-[var(--accent-fg)]"
                                : "bg-[var(--inner-box)] text-[var(--text-main)] hover:bg-[var(--panel-border)]/50"
                            }`}
                          >
                            <span className="truncate">{displayName}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold shrink-0 ml-1 ${
                              isSelected ? "bg-black/20 text-[var(--accent-fg)]" : "bg-[var(--panel)] text-[var(--text-sub)]"
                            }`}>
                              {c.size}인
                            </span>
                          </button>

                          {isSelected && (
                            <div className="p-2 sm:p-2.5 bg-[var(--inner-box)]/90 border-t border-[var(--accent)]/30 space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                              <span className="text-[10px] font-black text-[var(--text-sub)] block">
                                난이도 선택
                              </span>
                              <div className="grid grid-cols-2 gap-1.5">
                                {c.diffs.map((d) => {
                                  const isDiffSelected = tempDiff === d;
                                  return (
                                    <button
                                      key={d}
                                      type="button"
                                      onClick={() => setTempDiff(d)}
                                      className={`py-1.5 px-1 text-[10px] sm:text-[11px] font-black rounded-lg border transition-all cursor-pointer text-center whitespace-nowrap break-keep ${
                                        isDiffSelected
                                          ? "bg-[var(--accent)] text-[var(--accent-fg)] border-transparent shadow-xs scale-[1.02]"
                                          : "bg-[var(--panel)] border-[var(--panel-border)] text-[var(--text-sub)] hover:text-white hover:border-[var(--accent)]/50"
                                      }`}
                                    >
                                      {d}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 하단 미리보기 바 */}
              <div className="bg-[var(--inner-box)] border border-[var(--panel-border)] p-2.5 rounded-xl flex items-center justify-between gap-2 shrink-0 animate-in fade-in duration-150">
                <div className="flex items-center gap-2 min-w-0">
                  <MarkIcon 
                    src={
                      tempContentCategory === "어비스"
                        ? "/svgs/contens mark/어비스 마크.svg"
                        : "/svgs/contens mark/레이드 마크.svg"
                    } 
                    size="sm" 
                    scale={1.8} 
                    colorClass="bg-[var(--accent)]" 
                  />
                  <span className="font-black text-xs sm:text-sm text-[var(--text-main)] truncate">
                    {cleanContentName(tempContent.name)}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-[var(--accent)]/15 border border-[var(--accent)]/40 text-[var(--accent)] text-[11px] font-black shrink-0 whitespace-nowrap">
                    {tempDiff}
                  </span>
                </div>
                <span className="text-xs font-bold text-[var(--text-sub)] shrink-0">
                  {tempContent.size}인
                </span>
              </div>

              <div className="flex gap-2 pt-1 border-t border-[var(--panel-border)] shrink-0">
                <button
                  type="button"
                  onClick={() => setShowContentModal(false)}
                  className="flex-1 py-2.5 bg-[var(--inner-box)] border border-[var(--panel-border)] text-[var(--text-sub)] hover:text-white font-bold text-xs rounded-xl cursor-pointer transition"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={applyContentModal}
                  className="flex-2 py-2.5 bg-[var(--accent)] text-[var(--accent-fg)] font-black text-xs sm:text-sm rounded-xl cursor-pointer shadow-md hover:brightness-110 transition text-center"
                >
                  적용하기
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 서브 모달 2: 출발 희망 일시 설정 */}
        {showScheduleModal && (
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

                {/* 달력 날짜 그리드 */}
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((d, i) => {
                    if (!d) return <div key={i} className="h-8"></div>;

                    const isStartSelected = busCreateDate === d.dateStr;
                    const isNextDaySelected = isScheduleNextDay && nextDayDateStr === d.dateStr;

                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setBusCreateDate(d.dateStr)}
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
                      value={busCreateTimeStart}
                      onChange={setBusCreateTimeStart}
                      pickerType="start"
                    />
                  </div>

                  <span className="text-xs font-black text-[var(--text-sub)] shrink-0 px-0.5">~</span>

                  <div className="flex items-center gap-1 flex-1 min-w-0">
                    <span className="text-xs font-bold text-[var(--text-sub)] shrink-0">종료</span>
                    <CustomTimePicker
                      value={busCreateTimeEnd}
                      onChange={setBusCreateTimeEnd}
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
                          {busCreateDate
                            ? (() => {
                                const d1 = new Date(busCreateDate + "T00:00:00");
                                const d2 = new Date(busCreateDate + "T00:00:00");
                                d2.setDate(d2.getDate() + 1);
                                const m1 = String(d1.getMonth() + 1).padStart(2, "0");
                                const day1 = String(d1.getDate()).padStart(2, "0");
                                const dow1 = getDayOfWeekKorean(busCreateDate);
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
                          <span>{busCreateTimeStart || "14:00"} ~ {busCreateTimeEnd || "23:00"}</span>
                          <span className="text-[9px] bg-indigo-900/80 text-indigo-200 border border-indigo-500/50 px-1 py-0.2 rounded font-sans shrink-0 font-bold">
                            🌙 다음 날
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 min-w-0 truncate">
                        <span className="text-[var(--accent)] whitespace-nowrap shrink-0 flex items-center leading-none">
                          {busCreateDate} ({getDayOfWeekKorean(busCreateDate)})
                        </span>
                        <span className="text-[var(--text-sub)] font-bold shrink-0 flex items-center leading-none opacity-60">|</span>
                        <span className="font-mono truncate flex items-center leading-none translate-y-[0.5px]">
                          {busCreateTimeStart || "14:00"} ~ {busCreateTimeEnd || "23:00"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

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
        )}
      </div>
    </div>
  );
}