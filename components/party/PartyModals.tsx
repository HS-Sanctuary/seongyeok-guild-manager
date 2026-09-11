"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import ClassIcon from "@/components/common/ClassIcon";
import MarkIcon from "@/components/common/MarkIcon";
import CustomTimePicker from "@/components/party/CustomTimePicker";
import { CONTENT_DB, ContentItem, Party } from "@/components/party/types";

export interface BusCharSelectionConfig {
  selected: boolean;
  allowRepeat: boolean;
}

export function generateDefaultBusMemo(content: ContentItem, diff: string): string {
  return `"성역 길드 버스" [${content.name} ${diff}]`;
}

// "어비스 - ", "레이드 - " 접두사 및 "(통합)" 문구 제거 헬퍼 함수
const cleanContentName = (name: string) => {
  return name
    .replace(/^(어비스|레이드)\s*-\s*/, "")
    .replace(/\s*\(통합\)/g, "")
    .trim();
};

interface PartyModalsProps {
  showSynaxisInfoModal: boolean;
  setShowSynaxisInfoModal: (val: boolean) => void;
  showLoreGuide: boolean;
  setShowLoreGuide: (val: boolean) => void;
  showContentModal: boolean;
  setShowContentModal: (val: boolean) => void;
  tempContentCategory: "어비스" | "레이드";
  setTempContentCategory: (val: "어비스" | "레이드") => void;
  tempContent: ContentItem;
  setTempContent: (val: ContentItem) => void;
  tempDiff: string;
  setTempDiff: (val: string) => void;
  applyContentModal: () => void;

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

  showFilterCalendarModal: boolean;
  setShowFilterCalendarModal: (val: boolean) => void;
  activeDateFilter: string;
  setActiveDateFilter: (val: string) => void;
  datePartyCounts: Record<string, { total: number; recruiting: number; completed: number }>;
  getDayOfWeekKorean: (dateStr: string) => string;

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

  inspectCharacter: any;
  setInspectCharacter: (val: any) => void;

  joinPopupParty: Party | null;
  setJoinPopupParty: (val: Party | null) => void;
  myCharacters: any[];
  joinSelectedChar: string;
  setJoinSelectedChar: (val: string) => void;
  joinSelectedRole: string;
  setJoinSelectedRole: (val: string) => void;
  joinTimeStart: string;
  setTimeStartJoin?: (val: string) => void;
  joinTimeEnd: string;
  setTimeEndJoin?: (val: string) => void;
  executeJoinParty: () => void;

  parties?: any[];
  guildBuses?: any[];
}

export default function PartyModals(props: PartyModalsProps) {
  const [busActiveTab, setBusActiveTab] = useState<"SETTINGS" | "CHARACTERS">("CHARACTERS");

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

  // 컨텐츠 목록 2열 그리드 분류
  const abyssContents = useMemo(() => {
    return CONTENT_DB.filter((c) => c.category === "어비스");
  }, []);

  const raidContents = useMemo(() => {
    return CONTENT_DB.filter((c) => c.category === "레이드");
  }, []);

  // 스케줄 설정 모달 내 다음 날 상태 및 다음 날 날짜 계산
  const isScheduleNextDay = useMemo(() => {
    if (!props.timeStart || !props.timeEnd) return false;
    const [sH, sM] = props.timeStart.split(":").map(Number);
    const [eH, eM] = props.timeEnd.split(":").map(Number);
    const startMins = sH * 60 + sM;
    const endMins = eH * 60 + eM;
    return endMins <= startMins;
  }, [props.timeStart, props.timeEnd]);

  const nextDayDateStr = useMemo(() => {
    if (!props.selectedDate) return "";
    const d = new Date(props.selectedDate + "T00:00:00");
    d.setDate(d.getDate() + 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }, [props.selectedDate]);

  // PartyModals 내 모든 모달의 활성화 상태 통합 감지
  const isAnyModalOpen = Boolean(
    props.showSynaxisInfoModal ||
    props.showLoreGuide ||
    props.showContentModal ||
    props.showScheduleModal ||
    props.showFilterCalendarModal ||
    props.showBusCreateModal ||
    props.inspectCharacter ||
    props.joinPopupParty
  );

  // 완벽 스크롤 차단: html/body 이중 오버플로우 고정 & 휠/터치 이벤트 전파 가로채기
  useEffect(() => {
    if (!isAnyModalOpen) return;

    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalBodyTouchAction = document.body.style.touchAction;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    document.body.style.touchAction = "none";

    const handleWheel = (e: WheelEvent) => {
      const target = e.target as HTMLElement;
      const scrollableEl = target.closest(".overflow-y-auto, .overflow-auto") as HTMLElement | null;

      if (!scrollableEl) {
        e.preventDefault();
      } else {
        const isScrollAtTop = scrollableEl.scrollTop <= 0 && e.deltaY < 0;
        const isScrollAtBottom =
          scrollableEl.scrollTop + scrollableEl.clientHeight >= scrollableEl.scrollHeight - 1 && e.deltaY > 0;
        if (isScrollAtTop || isScrollAtBottom) {
          e.preventDefault();
        }
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      const scrollableEl = target.closest(".overflow-y-auto, .overflow-auto");
      if (!scrollableEl) {
        e.preventDefault();
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.body.style.touchAction = originalBodyTouchAction;
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, [isAnyModalOpen]);

  const shiftWeeks = (weekDelta: number) => {
    setViewAnchorDate((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + weekDelta * 7);
      return next;
    });
  };

  useEffect(() => {
    const modalEl = modalContainerRef.current;
    if (!modalEl || !props.showFilterCalendarModal) return;

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
  }, [props.showFilterCalendarModal]);

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

  const gridStartDate = useMemo(() => {
    return getSundayOfWeek(viewAnchorDate);
  }, [viewAnchorDate]);

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
    const partiesList = props.parties || [];
    const fromParties = partiesList.filter((p) =>
      ["recruiting", "매칭중", "모집중", "open", "OPEN"].includes(p.status)
    ).length;
    const fromCounts = Object.values(props.datePartyCounts || {}).reduce(
      (acc, curr) => acc + (curr.recruiting || 0),
      0
    );
    return Math.max(fromParties, fromCounts);
  }, [props.parties, props.datePartyCounts]);

  const totalCompletedCount = useMemo(() => {
    const partiesList = props.parties || [];
    const busList = props.guildBuses || [];
    const completedParties = partiesList.filter((p) =>
      ["completed", "매칭완료", "완료"].includes(p.status)
    ).length;

    let completedBusRounds = 0;
    busList.forEach((bus) => {
      if (Array.isArray(bus.bus_rounds)) {
        bus.bus_rounds.forEach((r: any) => {
          if (r.is_completed || ["completed", "완료"].includes(r.status)) completedBusRounds += 1;
        });
      } else if (["completed", "완료"].includes(bus.status)) {
        completedBusRounds += bus.total_rounds || 1;
      }
    });

    const fromCounts = Object.values(props.datePartyCounts || {}).reduce(
      (acc, curr) => acc + (curr.completed || 0),
      0
    );

    return Math.max(completedParties + completedBusRounds, fromCounts);
  }, [props.parties, props.guildBuses, props.datePartyCounts]);

  const inProgressPartiesCount = useMemo(() => {
    const partiesList = props.parties || [];
    return partiesList.filter((p) => ["in_progress", "진행중"].includes(p.status)).length;
  }, [props.parties]);

  const uniqueCharacters = useMemo(() => {
    const map = new Map();
    (props.myCharacters || []).forEach((c) => {
      const charKey = c.nickname || c.name || String(c.id);
      if (charKey && !map.has(charKey)) {
        map.set(charKey, c);
      }
    });
    return Array.from(map.values()) as any[];
  }, [props.myCharacters]);

  const selectedCount = Object.values(props.busCharSelections).filter((c) => c.selected).length;
  const totalCount = uniqueCharacters.length;

  const handleSelectAll = (select: boolean) => {
    props.setBusCharSelections((prev) => {
      const next = { ...prev };
      uniqueCharacters.forEach((char) => {
        const key = char.nickname || char.name || String(char.id);
        if (key) {
          next[key] = {
            selected: select,
            allowRepeat: next[key]?.allowRepeat ?? true,
          };
        }
      });
      return next;
    });
  };

  const handleToggleAllRepeat = (repeat: boolean) => {
    props.setBusCharSelections((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((k) => {
        if (next[k]?.selected) {
          next[k] = { ...next[k], allowRepeat: repeat };
        }
      });
      return next;
    });
  };

  const todayStr = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }, []);

  return (
    <>
      {/* 1. SYNAXIS 안내 모달 */}
      {props.showSynaxisInfoModal && (
        <div 
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer overscroll-none"
          onClick={() => props.setShowSynaxisInfoModal(false)}
        >
          <div 
            className="bg-[var(--panel)] border border-[var(--panel-border)] rounded-2xl p-5 sm:p-6 max-w-md w-full space-y-4 shadow-2xl animate-in fade-in zoom-in-95 cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b border-[var(--panel-border)] pb-3">
              <h3 className="font-black text-base sm:text-lg text-[var(--accent)] flex items-center gap-2">
                <span>🏛️</span> SYNAXIS 시스템 안내
              </h3>
              <button 
                onClick={() => props.setShowSynaxisInfoModal(false)}
                className="text-[var(--text-sub)] hover:text-white font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="text-xs sm:text-sm text-[var(--text-sub)] space-y-3 leading-relaxed">
              <p>
                <strong className="text-[var(--text-main)] font-bold">시낙시스(SYNAXIS)</strong>는 길드원 간의 원활한 던전 및 레이드 매칭을 위해 설계된 성역 전용 통합 스마트 매칭 플랫폼입니다.
              </p>
              <div className="bg-[var(--inner-box)] p-3 rounded-xl border border-[var(--panel-border)] space-y-2 text-[11px] sm:text-xs">
                <div>✨ <strong className="text-[var(--text-main)]">자동 시간 조율:</strong> 멤버가 모이면 최적의 중간 출발 시간을 자동 산출합니다.</div>
                <div>🚌 <strong className="text-[var(--text-main)]">성역 길드 버스:</strong> 관리자가 개설한 지원 버스에 내 캐릭터들을 일괄 탑승시킬 수 있습니다.</div>
                <div>⚡ <strong className="text-[var(--text-main)]">실시간 동기화:</strong> 수동 새로고침 없이 파티 생성이 즉시 반영됩니다.</div>
              </div>
            </div>
            <button
              onClick={() => props.setShowSynaxisInfoModal(false)}
              className="w-full py-2.5 bg-[var(--accent)] text-[var(--accent-fg)] font-black text-xs rounded-xl shadow-md hover:opacity-90 transition cursor-pointer"
            >
              확인
            </button>
          </div>
        </div>
      )}

      {/* 2. 가이드 모달 */}
      {props.showLoreGuide && (
        <div 
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer overscroll-none"
          onClick={() => props.setShowLoreGuide(false)}
        >
          <div 
            className="bg-[var(--panel)] border border-[var(--panel-border)] rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl animate-in fade-in zoom-in-95 cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b border-[var(--panel-border)] pb-3">
              <h3 className="font-black text-base text-[var(--accent)] flex items-center gap-2">
                <span>📖</span> 매칭 가이드
              </h3>
              <button 
                onClick={() => props.setShowLoreGuide(false)}
                className="text-[var(--text-sub)] hover:text-white font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="text-xs text-[var(--text-sub)] space-y-2.5 leading-relaxed">
              <p>• <strong>조합 우선:</strong> 탱/힐/딜 구성을 맞춰 최적의 파티 조합으로 자동 배치합니다.</p>
              <p>• <strong>모집 우선:</strong> 역할 구분 없이 빠른 매칭 완성을 최우선으로 진행합니다.</p>
              <p>• <strong>연속 뺑이:</strong> 반복 클리어를 원하는 길드원끼리 묶어주는 매칭 모드입니다.</p>
            </div>
            <button
              onClick={() => props.setShowLoreGuide(false)}
              className="w-full py-2.5 bg-[var(--inner-box)] border border-[var(--panel-border)] text-[var(--text-main)] font-black text-xs rounded-xl hover:bg-[var(--panel-border)] transition cursor-pointer"
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {/* 3. 목표 컨텐츠 선택 모달 */}
      {props.showContentModal && (
        <div 
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 cursor-pointer overscroll-none"
          onClick={() => props.setShowContentModal(false)}
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
              <button onClick={() => props.setShowContentModal(false)} className="text-[var(--text-sub)] hover:text-white font-bold cursor-pointer">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 grid grid-cols-2 gap-2.5 sm:gap-3.5 min-h-0 overscroll-contain">
              <div className="space-y-2 pr-1 sm:pr-2 border-r border-[var(--panel-border)]/70">
                <div className="flex items-center gap-1.5 pb-1.5 border-b border-[var(--panel-border)] text-xs font-black text-[var(--accent)] sticky top-0 bg-[var(--panel)] z-10">
                  <MarkIcon src="/svgs/contens mark/어비스 마크.svg" size="sm" scale={1.6} colorClass="bg-[var(--accent)]" />
                  <span>어비스</span>
                </div>
                <div className="space-y-2">
                  {abyssContents.map((c) => {
                    const isSelected = props.tempContent.name === c.name;
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
                            props.setTempContent(c);
                            props.setTempContentCategory("어비스");
                            if (props.tempContent.name !== c.name) {
                              props.setTempDiff(c.defaultDiff);
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
                                const isDiffSelected = props.tempDiff === d;
                                return (
                                  <button
                                    key={d}
                                    type="button"
                                    onClick={() => props.setTempDiff(d)}
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

              <div className="space-y-2 pl-1 sm:pl-2">
                <div className="flex items-center gap-1.5 pb-1.5 border-b border-[var(--panel-border)] text-xs font-black text-[var(--accent)] sticky top-0 bg-[var(--panel)] z-10">
                  <MarkIcon src="/svgs/contens mark/레이드 마크.svg" size="sm" scale={1.6} colorClass="bg-[var(--accent)]" />
                  <span>레이드</span>
                </div>
                <div className="space-y-2">
                  {raidContents.map((c) => {
                    const isSelected = props.tempContent.name === c.name;
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
                            props.setTempContent(c);
                            props.setTempContentCategory("레이드");
                            if (props.tempContent.name !== c.name) {
                              props.setTempDiff(c.defaultDiff);
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
                                const isDiffSelected = props.tempDiff === d;
                                return (
                                  <button
                                    key={d}
                                    type="button"
                                    onClick={() => props.setTempDiff(d)}
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

            <div className="bg-[var(--inner-box)] border border-[var(--panel-border)] p-2.5 rounded-xl flex items-center justify-between gap-2 shrink-0 animate-in fade-in duration-150">
              <div className="flex items-center gap-2 min-w-0">
                <MarkIcon 
                  src={
                    props.tempContentCategory === "어비스"
                      ? "/svgs/contens mark/어비스 마크.svg"
                      : "/svgs/contens mark/레이드 마크.svg"
                  } 
                  size="sm" 
                  scale={1.8} 
                  colorClass="bg-[var(--accent)]" 
                />
                <span className="font-black text-xs sm:text-sm text-[var(--text-main)] truncate">
                  {cleanContentName(props.tempContent.name)}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-[var(--accent)]/15 border border-[var(--accent)]/40 text-[var(--accent)] text-[11px] font-black shrink-0 whitespace-nowrap">
                  {props.tempDiff}
                </span>
              </div>
              <span className="text-xs font-bold text-[var(--text-sub)] shrink-0">
                {props.tempContent.size}인
              </span>
            </div>

            <div className="flex gap-2 pt-1 border-t border-[var(--panel-border)] shrink-0">
              <button
                type="button"
                onClick={() => props.setShowContentModal(false)}
                className="flex-1 py-2.5 bg-[var(--inner-box)] border border-[var(--panel-border)] text-[var(--text-sub)] hover:text-white font-bold text-xs rounded-xl cursor-pointer transition"
              >
                취소
              </button>
              <button
                type="button"
                onClick={props.applyContentModal}
                className="flex-2 py-2.5 bg-[var(--accent)] text-[var(--accent-fg)] font-black text-xs sm:text-sm rounded-xl cursor-pointer shadow-md hover:brightness-110 transition text-center"
              >
                적용하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. 출발 희망 일시 모달 */}
      {props.showScheduleModal && (
        <div 
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer overscroll-none"
          onClick={() => props.setShowScheduleModal(false)}
        >
          <div 
            className="bg-[var(--panel)] border border-[var(--panel-border)] rounded-2xl p-5 sm:p-6 max-w-md w-full space-y-4 shadow-2xl animate-in fade-in zoom-in-95 cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b border-[var(--panel-border)] pb-3">
              <h3 className="font-black text-sm sm:text-base text-[var(--text-main)] flex items-center gap-2">
                <MarkIcon src="/svgs/UI mark/달력 마크.svg" size="sm" scale={1.8} colorClass="bg-[var(--accent)]" />
                <span>출발 희망 일시 설정</span>
              </h3>
              <button onClick={() => props.setShowScheduleModal(false)} className="text-[var(--text-sub)] hover:text-white font-bold cursor-pointer">✕</button>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center bg-[var(--inner-box)] p-2.5 rounded-xl border border-[var(--panel-border)] text-xs font-black">
                <button
                  onClick={() => props.setCalendarYearMonth((prev) => ({
                    year: prev.month === 0 ? prev.year - 1 : prev.year,
                    month: prev.month === 0 ? 11 : prev.month - 1,
                  }))}
                  className="p-1 hover:text-[var(--accent)] cursor-pointer"
                >
                  ◀
                </button>
                <span>{props.calendarYearMonth.year}년 {props.calendarYearMonth.month + 1}월</span>
                <button
                  onClick={() => props.setCalendarYearMonth((prev) => ({
                    year: prev.month === 11 ? prev.year + 1 : prev.year,
                    month: prev.month === 11 ? 0 : prev.month + 1,
                  }))}
                  className="p-1 hover:text-[var(--accent)] cursor-pointer"
                >
                  ▶
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-black text-[var(--text-sub)] border-b border-[var(--panel-border)] pb-1">
                <span className="text-rose-400">일</span>
                <span>월</span>
                <span>화</span>
                <span>수</span>
                <span>목</span>
                <span>금</span>
                <span className="text-sky-400">토</span>
              </div>

              <div className="grid grid-cols-7 gap-1">
                {props.calendarDays.map((d, i) => {
                  if (!d) return <div key={i} className="h-8"></div>;
                  
                  const isStartSelected = props.selectedDate === d.dateStr;
                  const isNextDaySelected = isScheduleNextDay && nextDayDateStr === d.dateStr;

                  return (
                    <button
                      key={i}
                      onClick={() => props.setSelectedDate(d.dateStr)}
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

              <div className="flex items-center justify-between gap-1 sm:gap-2 pt-3 pb-1 border-t border-[var(--panel-border)] w-full min-w-0">
                <div className="flex items-center gap-1 flex-1 min-w-0">
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-sm">⏰</span>
                    <span className="text-xs font-bold text-[var(--text-sub)]">시작</span>
                  </div>
                  <CustomTimePicker
                    value={props.timeStart}
                    onChange={props.setTimeStart}
                  />
                </div>

                <span className="text-xs font-black text-[var(--text-sub)] shrink-0 px-0.5">~</span>

                <div className="flex items-center gap-1 flex-1 min-w-0">
                  <span className="text-xs font-bold text-[var(--text-sub)] shrink-0">종료</span>
                  <CustomTimePicker
                    value={props.timeEnd}
                    onChange={props.setTimeEnd}
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

              <div className="bg-[var(--inner-box)] border border-[var(--panel-border)] p-2.5 rounded-xl animate-in fade-in">
                <div className="flex items-center gap-2 min-w-0 truncate text-xs font-black text-[var(--text-main)] leading-none">
                  <MarkIcon src="/svgs/UI mark/달력 마크.svg" size="sm" scale={2.10} colorClass="bg-[var(--accent)]" />

                  {isScheduleNextDay ? (
                    <div className="flex flex-col gap-1 min-w-0 text-left">
                      <div className="text-[var(--accent)] text-[11px] font-black truncate leading-tight">
                        {props.selectedDate
                          ? (() => {
                              const d1 = new Date(props.selectedDate + "T00:00:00");
                              const d2 = new Date(props.selectedDate + "T00:00:00");
                              d2.setDate(d2.getDate() + 1);
                              const m1 = String(d1.getMonth() + 1).padStart(2, "0");
                              const day1 = String(d1.getDate()).padStart(2, "0");
                              const dow1 = props.getDayOfWeekKorean(props.selectedDate);
                              const y2 = d2.getFullYear();
                              const m2 = String(d2.getMonth() + 1).padStart(2, "0");
                              const day2 = String(d2.getDate()).padStart(2, "0");
                              const nextDateStr = `${y2}-${m2}-${day2}`;
                              const dow2 = props.getDayOfWeekKorean(nextDateStr);
                              return `${m1}-${day1}(${dow1}) ~ ${m2}-${day2}(${dow2})`;
                            })()
                          : ""
                        }
                      </div>
                      <div className="text-[var(--text-main)] font-mono text-xs flex items-center gap-1.5 leading-tight">
                        <span>{props.timeStart} ~ {props.timeEnd}</span>
                        <span className="text-[9px] bg-indigo-900/80 text-indigo-200 border border-indigo-500/50 px-1 py-0.2 rounded font-sans shrink-0 font-bold">
                          🌙 다음 날
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 min-w-0 truncate">
                      <span className="text-[var(--accent)] whitespace-nowrap shrink-0 flex items-center leading-none">
                        {props.selectedDate} ({props.getDayOfWeekKorean(props.selectedDate)})
                      </span>
                      <span className="text-[var(--text-sub)] font-bold shrink-0 flex items-center leading-none opacity-60">|</span>
                      <span className="font-mono truncate flex items-center leading-none translate-y-[0.5px]">
                        {props.timeStart} ~ {props.timeEnd}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={() => props.setShowScheduleModal(false)}
              className="w-full py-2.5 bg-[var(--accent)] text-[var(--accent-fg)] font-black text-xs rounded-xl cursor-pointer shadow-md"
            >
              설정 완료
            </button>
          </div>
        </div>
      )}

      {/* 5. 필터용 달력 모달 */}
      {props.showFilterCalendarModal && (
        <div 
          className="fixed inset-0 z-[150] bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overscroll-none cursor-pointer"
          onClick={() => props.setShowFilterCalendarModal(false)}
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
                  onClick={() => props.setShowFilterCalendarModal(false)}
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

                const info = props.datePartyCounts[dateKey] || { total: 0, recruiting: 0, completed: 0 };
                const isSelected = props.activeDateFilter === dateKey;
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
                      props.setActiveDateFilter(dateKey);
                      props.setShowFilterCalendarModal(false);
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
                props.setActiveDateFilter("전체");
                props.setShowFilterCalendarModal(false);
              }}
              className={`w-full py-2 rounded-xl text-xs font-black transition border cursor-pointer ${
                props.activeDateFilter === "전체"
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
      )}

      {/* 6. 성역 길드 버스 파티 개설 모달 */}
      {props.showBusCreateModal && (
        <div 
          className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 cursor-pointer overscroll-none"
          onClick={() => props.setShowBusCreateModal(false)}
        >
          <div 
            className="bg-[var(--panel)] border border-[var(--panel-border)] rounded-2xl max-w-xl w-full flex flex-col max-h-[90vh] shadow-2xl animate-in fade-in zoom-in-95 overflow-hidden cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center px-5 py-4 border-b border-[var(--panel-border)] bg-[var(--inner-box)] shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xl">🚌</span>
                <h3 className="font-black text-base sm:text-lg text-[var(--accent)] tracking-tight">
                  성역 공식 길드 버스 개설
                </h3>
              </div>
              <button 
                onClick={() => props.setShowBusCreateModal(false)}
                className="text-[var(--text-sub)] hover:text-white font-black text-lg p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 border-b border-[var(--panel-border)] bg-[var(--panel)] text-xs font-black shrink-0">
              <button
                onClick={() => setBusActiveTab("CHARACTERS")}
                className={`py-3 flex items-center justify-center gap-2 border-b-2 transition cursor-pointer ${
                  busActiveTab === "CHARACTERS"
                    ? "border-[var(--accent)] text-[var(--accent)] bg-[var(--inner-box)]/50"
                    : "border-transparent text-[var(--text-sub)] hover:text-white"
                }`}
              >
                <span>👥 내 캐릭터 선택</span>
                <span className="px-2 py-0.5 rounded-full bg-[var(--accent)]/20 text-[var(--accent)] text-[10px]">
                  {selectedCount} / {totalCount}
                </span>
              </button>
              <button
                onClick={() => setBusActiveTab("SETTINGS")}
                className={`py-3 flex items-center justify-center gap-2 border-b-2 transition cursor-pointer ${
                  busActiveTab === "SETTINGS"
                    ? "border-[var(--accent)] text-[var(--accent)] bg-[var(--inner-box)]/50"
                    : "border-transparent text-[var(--text-sub)] hover:text-white"
                }`}
              >
                <span>⚙️ 운행 설정 및 메모</span>
              </button>
            </div>

            <div className="p-4 sm:p-5 overflow-y-auto custom-scrollbar flex-1 space-y-4 overscroll-contain">
              {busActiveTab === "CHARACTERS" ? (
                <div className="space-y-3">
                  <div className="bg-[var(--inner-box)] border border-[var(--panel-border)] p-2.5 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleSelectAll(true)}
                        className="px-2.5 py-1 bg-[var(--panel)] border border-[var(--panel-border)] hover:border-[var(--accent)] text-[var(--text-main)] font-bold text-[11px] rounded-lg transition cursor-pointer"
                      >
                        전체 선택
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectAll(false)}
                        className="px-2.5 py-1 bg-[var(--panel)] border border-[var(--panel-border)] hover:border-[var(--accent)] text-[var(--text-sub)] font-bold text-[11px] rounded-lg transition cursor-pointer"
                      >
                        전체 해제
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 ml-auto">
                      <span className="text-[11px] font-bold text-[var(--text-sub)]">선택 캐릭터 일괄:</span>
                      <button
                        type="button"
                        onClick={() => handleToggleAllRepeat(true)}
                        className="px-2 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/40 font-black text-[10px] rounded-lg cursor-pointer"
                      >
                        🔄 반복 설정
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleAllRepeat(false)}
                        className="px-2 py-1 bg-zinc-700/50 text-zinc-300 border border-zinc-600 font-bold text-[10px] rounded-lg cursor-pointer"
                      >
                        1회성 설정
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {uniqueCharacters.map((char) => {
                      const key = char.nickname || char.name || String(char.id);
                      const config = props.busCharSelections[key] || { selected: false, allowRepeat: true };

                      return (
                        <div
                          key={key}
                          onClick={() => {
                            props.setBusCharSelections((prev) => ({
                              ...prev,
                              [key]: { ...config, selected: !config.selected },
                            }));
                          }}
                          className={`p-3 rounded-xl border transition flex items-center justify-between gap-3 cursor-pointer ${
                            config.selected
                              ? "bg-[var(--inner-box)] border-[var(--accent)] shadow-sm"
                              : "bg-[var(--panel)] border-[var(--panel-border)] opacity-60 hover:opacity-100"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <input
                              type="checkbox"
                              checked={config.selected}
                              onChange={() => {}}
                              className="w-4 h-4 accent-[var(--accent)] rounded cursor-pointer shrink-0"
                            />
                            <ClassIcon job={char.job} className="w-8 h-8 shrink-0" />
                            <div className="min-w-0 space-y-0.5">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-black text-xs sm:text-sm text-[var(--text-main)] truncate">
                                  {char.nickname || char.name}
                                </span>
                                {char.is_main && (
                                  <span className="px-1.5 py-0.2 bg-[var(--accent)] text-[var(--accent-fg)] font-black text-[9px] rounded shrink-0">
                                    대표
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-xs font-black text-[var(--text-sub)] flex-wrap">
                                <span className="text-[var(--text-main)]">⚔️ {Number(char.combat_power || 0).toLocaleString()}</span>
                                <span className="text-purple-300">🔮 {Number(char.magic_resistance || 0).toLocaleString()}</span>
                              </div>
                            </div>
                          </div>

                          {config.selected && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                props.setBusCharSelections((prev) => ({
                                  ...prev,
                                  [key]: { ...config, allowRepeat: !config.allowRepeat },
                                }));
                              }}
                              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-black border transition shrink-0 cursor-pointer ${
                                config.allowRepeat
                                  ? "bg-amber-500/20 text-amber-400 border-amber-500/50"
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
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-black text-[var(--text-sub)] block mb-1">목표 컨텐츠</label>
                      <select
                        value={props.busCreateContent.name}
                        onChange={(e) => {
                          const target = CONTENT_DB.find((c) => c.name === e.target.value);
                          if (target) {
                            props.setBusCreateContent(target);
                            props.setBusCreateDiff(target.defaultDiff);
                            props.setBusCreateMemo(generateDefaultBusMemo(target, target.defaultDiff));
                          }
                        }}
                        className="w-full bg-[var(--inner-box)] border border-[var(--panel-border)] rounded-xl p-2.5 text-xs font-bold text-[var(--text-main)] outline-none cursor-pointer"
                      >
                        {CONTENT_DB.map((c) => (
                          <option key={c.name} value={c.name}>{c.name} ({c.size}인)</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-black text-[var(--text-sub)] block mb-1">난이도</label>
                      <select
                        value={props.busCreateDiff}
                        onChange={(e) => {
                          props.setBusCreateDiff(e.target.value);
                          props.setBusCreateMemo(generateDefaultBusMemo(props.busCreateContent, e.target.value));
                        }}
                        className="w-full bg-[var(--inner-box)] border border-[var(--panel-border)] rounded-xl p-2.5 text-xs font-bold text-[var(--text-main)] outline-none cursor-pointer"
                      >
                        {props.busCreateContent.diffs.map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-black text-[var(--text-sub)] block mb-1">운행 시작일</label>
                    <input
                      type="date"
                      value={props.busCreateDate}
                      onChange={(e) => props.setBusCreateDate(e.target.value)}
                      className="w-full bg-[var(--inner-box)] border border-[var(--panel-border)] rounded-xl p-2.5 text-xs font-bold text-[var(--text-main)] outline-none cursor-pointer"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <CustomTimePicker
                      label="시작 시간"
                      value={props.busCreateTimeStart}
                      onChange={props.setBusCreateTimeStart}
                    />
                    <CustomTimePicker
                      label="종료 시간"
                      value={props.busCreateTimeEnd}
                      onChange={props.setBusCreateTimeEnd}
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-black text-[var(--text-sub)] block mb-1">공지 메모</label>
                    <input
                      type="text"
                      value={props.busCreateMemo}
                      onChange={(e) => props.setBusCreateMemo(e.target.value)}
                      placeholder="버스 승객 안내용 공지"
                      className="w-full bg-[var(--inner-box)] border border-[var(--panel-border)] rounded-xl p-2.5 text-xs font-bold text-[var(--text-main)] outline-none focus:border-[var(--accent)]"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-[var(--panel-border)] bg-[var(--inner-box)] flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => props.setShowBusCreateModal(false)}
                className="flex-1 py-3 bg-[var(--panel)] border border-[var(--panel-border)] text-[var(--text-sub)] font-bold text-xs rounded-xl hover:text-white transition cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={props.handleCreateGuildBus}
                className="flex-2 py-3 bg-[var(--accent)] text-[var(--accent-fg)] font-black text-xs rounded-xl shadow-lg hover:opacity-90 transition cursor-pointer"
              >
                🚌 버스 개설하기 ({selectedCount}개 캐릭터)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. 캐릭터 상세 모달 */}
      {props.inspectCharacter && (
        <div 
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer overscroll-none"
          onClick={() => props.setInspectCharacter(null)}
        >
          <div 
            className="bg-[var(--panel)] border border-[var(--panel-border)] rounded-2xl p-5 sm:p-6 max-w-xs w-full space-y-4 shadow-2xl animate-in fade-in zoom-in-95 text-center cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center gap-2">
              <ClassIcon job={props.inspectCharacter.job} className="w-12 h-12" />
              <h3 className="font-black text-base text-[var(--text-main)]">
                {props.inspectCharacter.nickname || props.inspectCharacter.name}
              </h3>
              <p className="text-xs text-[var(--accent)] font-bold">{props.inspectCharacter.job || "직업 정보 없음"}</p>
            </div>

            <div className="bg-[var(--inner-box)] p-3 rounded-xl border border-[var(--panel-border)] space-y-1.5 text-xs text-[var(--text-sub)]">
              <div className="flex justify-between">
                <span>⚔️ 전투력</span>
                <strong className="text-[var(--text-main)]">{props.inspectCharacter.combat_power?.toLocaleString() || 0}</strong>
              </div>
              <div className="flex justify-between">
                <span>🔮 마법 저항력</span>
                <strong className="text-purple-400">{props.inspectCharacter.magic_resistance?.toLocaleString() || 0}</strong>
              </div>
            </div>

            <button
              onClick={() => props.setInspectCharacter(null)}
              className="w-full py-2 bg-[var(--inner-box)] border border-[var(--panel-border)] text-[var(--text-main)] font-bold text-xs rounded-xl cursor-pointer"
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {/* 8. 일반 파티 참여 신청 모달 (확장 세로비율 & 폰트 크기 증대 & 문구 개선 버전) */}
      {props.joinPopupParty && (
        <div 
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 cursor-pointer overscroll-none"
          onClick={() => props.setJoinPopupParty(null)}
        >
          <div 
            className="bg-[var(--panel)] border border-[var(--panel-border)] rounded-2xl p-5 sm:p-6 max-w-lg w-full space-y-4 shadow-2xl animate-in fade-in zoom-in-95 cursor-default max-h-[90vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center border-b border-[var(--panel-border)] pb-3 shrink-0">
              <h3 className="font-black text-base sm:text-lg text-[var(--text-main)] flex items-center gap-2">
                <span className="text-lg">⚔️</span>
                <span>파티 참여 신청</span>
              </h3>
              <button 
                type="button"
                onClick={() => props.setJoinPopupParty(null)} 
                className="text-[var(--text-sub)] hover:text-white font-bold text-lg cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Main Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-5 pr-0.5 min-h-0 overscroll-contain">
              
              {/* 모집 일정 및 목표 파티 요약 브리핑 카드 (빨간 영역 폰트 스케일 업) */}
              <div className="bg-[var(--inner-box)] border border-[var(--panel-border)] p-3.5 sm:p-4 rounded-xl space-y-2 text-xs sm:text-sm shrink-0 shadow-xs">
                <div className="flex items-center justify-between font-black">
                  <span className="text-[var(--accent)] text-xs sm:text-sm flex items-center gap-2 truncate">
                    <span className="text-sm sm:text-base">🎯</span>
                    <span className="truncate">{cleanContentName(props.joinPopupParty.content_name || props.joinPopupParty.sub_content || "목표 컨텐츠")}</span>
                  </span>
                  <span className="px-2.5 py-0.5 rounded bg-[var(--accent)]/15 border border-[var(--accent)]/40 text-[var(--accent)] text-xs shrink-0 font-black">
                    {props.joinPopupParty.difficulty || "난이도"}
                  </span>
                </div>
                
                {/* 폰트 및 아이콘 시인성 강화 */}
                <div className="text-[var(--text-main)] font-bold text-xs sm:text-sm flex items-center gap-2 pt-1 border-t border-[var(--panel-border)]/50">
                  <span className="shrink-0 flex items-center gap-1 text-[var(--text-sub)]">
                    <span>📅</span>
                    <span>모집 일정:</span>
                  </span>
                  <span className="text-[var(--text-main)] font-extrabold tracking-tight truncate">
                    {props.joinPopupParty.party_date ? props.joinPopupParty.party_date.slice(2) : "오늘"}
                    ({props.getDayOfWeekKorean(props.joinPopupParty.party_date || todayStr)})
                    <span className="text-[var(--text-sub)] font-normal mx-1">|</span>
                    <span className="font-mono">{props.joinPopupParty.time_start || "18:00"} ~ {props.joinPopupParty.time_end || "00:00"}</span>
                  </span>
                </div>
              </div>

              {/* 1. 참여할 캐릭터 선택 (3열 그리드 버튼) */}
              <div className="space-y-2 min-w-0">
                <label className="text-xs sm:text-sm font-black text-[var(--text-main)] flex items-center gap-1.5 whitespace-nowrap leading-none">
                  <MarkIcon src="/svgs/UI mark/사람 마크.svg" size="sm" scale={0.85} colorClass="bg-[var(--accent)]" />
                  <span className="leading-none">참여할 캐릭터 선택</span>
                </label>
                <div className="grid grid-cols-3 gap-2 w-full min-w-0">
                  {uniqueCharacters.map((char) => {
                    const charName = char.nickname || char.name;
                    const jobName = char.job || "전사";
                    const isSelected = props.joinSelectedChar === charName;

                    return (
                      <button
                        key={char.id || charName}
                        type="button"
                        onClick={() => props.setJoinSelectedChar(charName)}
                        className={`text-xs font-black py-2.5 px-1.5 rounded-xl transition cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5 border overflow-hidden min-w-0 tracking-tight shadow-xs ${
                          isSelected
                            ? "bg-[var(--accent)] text-[var(--accent-fg)] border-transparent ring-2 ring-[var(--accent)]/40 font-black shadow-md scale-[1.02]"
                            : "bg-[var(--inner-box)] border-[var(--panel-border)] text-[var(--text-main)] hover:border-[var(--accent)]"
                        }`}
                      >
                        <ClassIcon job={jobName} className={`w-4 h-4 shrink-0 ${isSelected ? "brightness-200" : ""}`} />
                        <span className="whitespace-nowrap shrink-0 truncate">{charName}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. 플레이 가능 시간 설정 및 안내 문구 (초록 영역 문구 수정) */}
              <div className="space-y-2 min-w-0 pt-1">
                <label className="text-xs sm:text-sm font-black text-[var(--text-main)] flex items-center gap-1.5 whitespace-nowrap leading-none">
                  <MarkIcon src="/svgs/UI mark/달력 마크.svg" size="sm" scale={1.8} colorClass="bg-[var(--accent)]" />
                  <span className="leading-none">내 플레이 가능 시간 설정</span>
                </label>
                
                <div className="bg-[var(--inner-box)] border border-[var(--panel-border)] p-3.5 sm:p-4 rounded-xl space-y-3">
                  <div className="flex items-center justify-between gap-1 sm:gap-2 w-full min-w-0">
                    {/* 시작 시간 Picker */}
                    <div className="flex items-center gap-1 flex-1 min-w-0">
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-sm">⏰</span>
                        <span className="text-xs font-bold text-[var(--text-sub)]">시작</span>
                      </div>
                      <CustomTimePicker
                        value={props.joinTimeStart || "18:00"}
                        onChange={(val) => props.setTimeStartJoin ? props.setTimeStartJoin(val) : null}
                      />
                    </div>

                    <span className="text-xs font-black text-[var(--text-sub)] shrink-0 px-0.5">~</span>

                    {/* 종료 시간 Picker */}
                    <div className="flex items-center gap-1 flex-1 min-w-0">
                      <span className="text-xs font-bold text-[var(--text-sub)] shrink-0">종료</span>
                      <CustomTimePicker
                        value={props.joinTimeEnd || "00:00"}
                        onChange={(val) => props.setTimeEndJoin ? props.setTimeEndJoin(val) : null}
                      />
                    </div>
                  </div>

                  {/* 초록 영역 요청 문구 수정 반영 */}
                  <div className="flex items-center gap-1.5 text-xs text-[var(--text-sub)] bg-[var(--panel)]/70 p-2.5 rounded-lg border border-[var(--panel-border)]/60 leading-relaxed font-bold">
                    <span className="text-amber-400 shrink-0">💡</span>
                    <span>참여한 파티원들의 출발 시간을 계산해 시스템이 정해줍니다.</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Bottom Actions */}
            <div className="flex gap-2 pt-3 border-t border-[var(--panel-border)] shrink-0">
              <button
                type="button"
                onClick={() => props.setJoinPopupParty(null)}
                className="flex-1 py-3 bg-[var(--inner-box)] border border-[var(--panel-border)] text-[var(--text-sub)] hover:text-white font-bold text-xs sm:text-sm rounded-xl cursor-pointer transition text-center"
              >
                취소
              </button>
              <button
                type="button"
                onClick={props.executeJoinParty}
                className="flex-2 py-3 bg-[var(--accent)] text-[var(--accent-fg)] font-black text-xs sm:text-sm rounded-xl cursor-pointer shadow-md hover:brightness-110 transition text-center"
              >
                ✨ 파티 참가!
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}