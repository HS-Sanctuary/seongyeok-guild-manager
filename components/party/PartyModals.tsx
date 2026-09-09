"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import ClassIcon from "@/components/common/ClassIcon";
import { CONTENT_DB, ContentItem, Party } from "@/components/party/types";

export interface BusCharSelectionConfig {
  selected: boolean;
  allowRepeat: boolean;
}

export function generateDefaultBusMemo(content: ContentItem, diff: string): string {
  return `"성역 길드 버스" [${content.name} ${diff}]`;
}

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

  // ──────────────── 캘린더 모달 제스처 및 주 단위 슬라이딩 상태 ────────────────
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

  // 1. 모달 활성화 시 메인 바디 스크롤 완전 차단 (Body Scroll Lock)
  useEffect(() => {
    if (props.showFilterCalendarModal) {
      const originalOverflow = document.body.style.overflow;
      const originalTouchAction = document.body.style.touchAction;
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";

      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.touchAction = originalTouchAction;
      };
    }
  }, [props.showFilterCalendarModal]);

  // 주(Week) 단위 이동 (7일씩 이동)
  const shiftWeeks = (weekDelta: number) => {
    setViewAnchorDate((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + weekDelta * 7);
      return next;
    });
  };

  // 2. 고감도 & 부드러운 휠 스크롤 및 배경 스크롤 이동 차단 Native Listener
  useEffect(() => {
    const modalEl = modalContainerRef.current;
    if (!modalEl || !props.showFilterCalendarModal) return;

    const handleNativeWheel = (e: WheelEvent) => {
      // 배경 페이지로 전달되는 스크롤 이벤트 차단
      e.preventDefault();
      e.stopPropagation();

      const now = Date.now();
      // 150ms 이상 입력이 끊기면 누적치 초기화
      if (now - lastWheelTime.current > 150) {
        wheelAccumulator.current = 0;
      }
      lastWheelTime.current = now;

      wheelAccumulator.current += e.deltaY;

      // 기존 대비 1/3 적은 스크롤(Delta 30)로도 민첩하게 반응
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

    // passive: false 지정을 통해 e.preventDefault() 활성화
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

  // 해당 날짜의 일요일(Week Start)을 구하는 헬퍼
  const getSundayOfWeek = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay();
    date.setDate(date.getDate() - day);
    date.setHours(0, 0, 0, 0);
    return date;
  };

  // 5주(35일) 윈도우 달력 그리드 계산
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

  // 상단 년도 및 월 범위 표기 로직 (예: 2026년 10~11월)
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

  // 모집중 파티 수 카운트 연동
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

  // 완료 및 진행중 파티 집계
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

  // 오늘 날짜 YYYY-MM-DD
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
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--panel)] border border-[var(--panel-border)] rounded-2xl p-5 sm:p-6 max-w-md w-full space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
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
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--panel)] border border-[var(--panel-border)] rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
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
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--panel)] border border-[var(--panel-border)] rounded-2xl p-5 sm:p-6 max-w-md w-full space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-[var(--panel-border)] pb-3">
              <h3 className="font-black text-sm sm:text-base text-[var(--text-main)]">목표 컨텐츠 선택</h3>
              <button onClick={() => props.setShowContentModal(false)} className="text-[var(--text-sub)] hover:text-white font-bold cursor-pointer">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-2 p-1 bg-[var(--inner-box)] rounded-xl border border-[var(--panel-border)]">
              {(["어비스", "레이드"] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    props.setTempContentCategory(cat);
                    const first = CONTENT_DB.find((c) => c.category === cat);
                    if (first) {
                      props.setTempContent(first);
                      props.setTempDiff(first.defaultDiff);
                    }
                  }}
                  className={`py-2 text-xs font-black rounded-lg transition cursor-pointer ${
                    props.tempContentCategory === cat
                      ? "bg-[var(--accent)] text-[var(--accent-fg)] shadow-sm"
                      : "text-[var(--text-sub)] hover:text-white"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black text-[var(--text-sub)]">던전 선택</label>
              <select
                value={props.tempContent.name}
                onChange={(e) => {
                  const target = CONTENT_DB.find((c) => c.name === e.target.value);
                  if (target) {
                    props.setTempContent(target);
                    props.setTempDiff(target.defaultDiff);
                  }
                }}
                className="w-full bg-[var(--inner-box)] border border-[var(--panel-border)] rounded-xl p-2.5 text-xs font-bold text-[var(--text-main)] outline-none focus:border-[var(--accent)] cursor-pointer"
              >
                {CONTENT_DB.filter((c) => c.category === props.tempContentCategory).map((c) => (
                  <option key={c.name} value={c.name}>{c.name} ({c.size}인)</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black text-[var(--text-sub)]">난이도 선택</label>
              <div className="grid grid-cols-3 gap-2">
                {props.tempContent.diffs.map((d) => (
                  <button
                    key={d}
                    onClick={() => props.setTempDiff(d)}
                    className={`py-2 text-xs font-black rounded-xl border transition cursor-pointer ${
                      props.tempDiff === d
                        ? "bg-[var(--accent)] text-[var(--accent-fg)] border-transparent"
                        : "bg-[var(--inner-box)] border-[var(--panel-border)] text-[var(--text-sub)] hover:border-[var(--accent)]"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => props.setShowContentModal(false)}
                className="flex-1 py-2.5 bg-[var(--inner-box)] border border-[var(--panel-border)] text-[var(--text-sub)] font-bold text-xs rounded-xl cursor-pointer"
              >
                취소
              </button>
              <button
                onClick={props.applyContentModal}
                className="flex-1 py-2.5 bg-[var(--accent)] text-[var(--accent-fg)] font-black text-xs rounded-xl cursor-pointer shadow-md"
              >
                적용하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. 일시 및 희망 시간 설정 모달 */}
      {props.showScheduleModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--panel)] border border-[var(--panel-border)] rounded-2xl p-5 sm:p-6 max-w-md w-full space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-[var(--panel-border)] pb-3">
              <h3 className="font-black text-sm sm:text-base text-[var(--text-main)]">📅 출발 희망 일시 설정</h3>
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
                  const isSelected = props.selectedDate === d.dateStr;
                  return (
                    <button
                      key={i}
                      onClick={() => props.setSelectedDate(d.dateStr)}
                      className={`h-8 rounded-lg text-xs font-black transition flex items-center justify-center cursor-pointer ${
                        isSelected
                          ? "bg-[var(--accent)] text-[var(--accent-fg)] shadow-sm"
                          : "hover:bg-[var(--inner-box)] text-[var(--text-main)]"
                      }`}
                    >
                      {d.day}
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--panel-border)]">
                <div>
                  <label className="text-[10px] font-black text-[var(--text-sub)] block mb-1">희망 시작 시간</label>
                  <input
                    type="time"
                    value={props.timeStart}
                    onChange={(e) => props.setTimeStart(e.target.value)}
                    className="w-full bg-[var(--inner-box)] border border-[var(--panel-border)] rounded-xl p-2 text-xs font-bold text-[var(--text-main)] text-center cursor-pointer"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-[var(--text-sub)] block mb-1">희망 종료 시간</label>
                  <input
                    type="time"
                    value={props.timeEnd}
                    onChange={(e) => props.setTimeEnd(e.target.value)}
                    className="w-full bg-[var(--inner-box)] border border-[var(--panel-border)] rounded-xl p-2 text-xs font-bold text-[var(--text-main)] text-center cursor-pointer"
                  />
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

      {/* 5. 필터용 달력 모달 (완벽한 월 경계 세로선 & 스크롤 격리 적용) */}
      {props.showFilterCalendarModal && (
        <div className="fixed inset-0 z-[150] bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overscroll-contain">
          <div
            ref={modalContainerRef}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className="bg-[var(--panel)] border border-[var(--panel-border)] rounded-2xl w-full max-w-sm p-4 shadow-2xl space-y-3.5 animate-in fade-in zoom-in-95 select-none relative"
          >
            {/* 상단 헤더 */}
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

            {/* 요일 라벨 */}
            <div className="grid grid-cols-7 text-center text-[11px] font-bold text-[var(--text-sub)]">
              <span className="text-red-400">일</span>
              <span>월</span>
              <span>화</span>
              <span>수</span>
              <span>목</span>
              <span>금</span>
              <span className="text-blue-400">토</span>
            </div>

            {/* 캘린더 5주 그리드 */}
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

                // 월 경계 판별 로직
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
                    {/* [한설 님 요청] 1. 각 월의 첫날(1일) 좌측에 빨간 세로 구분선 */}
                    {isFirstDayOfMonth && (
                      <span
                        aria-hidden="true"
                        className="absolute -left-[3px] top-1/2 -translate-y-1/2 h-7 w-[2.5px] bg-rose-500 rounded-full shadow-[0_0_6px_rgba(244,63,94,0.85)] z-20 pointer-events-none"
                      />
                    )}

                    {/* [한설 님 요청] 2. 각 월의 마지막날 우측에 빨간 세로 구분선 */}
                    {isLastDayOfMonth && (
                      <span
                        aria-hidden="true"
                        className="absolute -right-[3px] top-1/2 -translate-y-1/2 h-7 w-[2.5px] bg-rose-500 rounded-full shadow-[0_0_6px_rgba(244,63,94,0.85)] z-20 pointer-events-none"
                      />
                    )}

                    <span>{d.getDate()}</span>

                    {/* 카운트 뱃지 */}
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

            {/* 전체 날짜 보기 버튼 */}
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

            {/* 하단: 파티 카운트 통계 바 */}
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

            {/* 조작 안내 팝업 모달 */}
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

            {/* 년도 선택 피커 모달 */}
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

            {/* 월 선택 피커 모달 */}
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
        <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[var(--panel)] border border-[var(--panel-border)] rounded-2xl max-w-xl w-full flex flex-col max-h-[90vh] shadow-2xl animate-in fade-in zoom-in-95 overflow-hidden">
            
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

            <div className="p-4 sm:p-5 overflow-y-auto custom-scrollbar flex-1 space-y-4">
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
                    <div>
                      <label className="text-[11px] font-black text-[var(--text-sub)] block mb-1">시작 시간</label>
                      <input
                        type="time"
                        value={props.busCreateTimeStart}
                        onChange={(e) => props.setBusCreateTimeStart(e.target.value)}
                        className="w-full bg-[var(--inner-box)] border border-[var(--panel-border)] rounded-xl p-2.5 text-xs font-bold text-[var(--text-main)] text-center cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-black text-[var(--text-sub)] block mb-1">종료 시간</label>
                      <input
                        type="time"
                        value={props.busCreateTimeEnd}
                        onChange={(e) => props.setBusCreateTimeEnd(e.target.value)}
                        className="w-full bg-[var(--inner-box)] border border-[var(--panel-border)] rounded-xl p-2.5 text-xs font-bold text-[var(--text-main)] text-center cursor-pointer"
                      />
                    </div>
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
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--panel)] border border-[var(--panel-border)] rounded-2xl p-5 sm:p-6 max-w-xs w-full space-y-4 shadow-2xl animate-in fade-in zoom-in-95 text-center">
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

      {/* 8. 일반 파티 참여 모달 */}
      {props.joinPopupParty && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--panel)] border border-[var(--panel-border)] rounded-2xl p-5 sm:p-6 max-w-md w-full space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-[var(--panel-border)] pb-3">
              <h3 className="font-black text-sm sm:text-base text-[var(--text-main)]">⚔️ 파티 참여 신청</h3>
              <button onClick={() => props.setJoinPopupParty(null)} className="text-[var(--text-sub)] hover:text-white font-bold cursor-pointer">✕</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-black text-[var(--text-sub)] block mb-1">참여 캐릭터 선택</label>
                <select
                  value={props.joinSelectedChar}
                  onChange={(e) => props.setJoinSelectedChar(e.target.value)}
                  className="w-full bg-[var(--inner-box)] border border-[var(--panel-border)] rounded-xl p-2.5 text-xs font-bold text-[var(--text-main)] outline-none cursor-pointer"
                >
                  {props.myCharacters.map((c) => (
                    <option key={c.id || c.nickname} value={c.nickname}>{c.nickname} ({c.job})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-black text-[var(--text-sub)] block mb-1">수행 포지션</label>
                <div className="grid grid-cols-4 gap-2">
                  {(["탱커", "힐러", "근딜", "원딜"] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => props.setJoinSelectedRole(r)}
                      className={`py-2 text-xs font-black rounded-xl border transition cursor-pointer ${
                        props.joinSelectedRole === r
                          ? "bg-[var(--accent)] text-[var(--accent-fg)] border-transparent"
                          : "bg-[var(--inner-box)] border-[var(--panel-border)] text-[var(--text-sub)] hover:border-[var(--accent)]"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => props.setJoinPopupParty(null)}
                className="flex-1 py-2.5 bg-[var(--inner-box)] border border-[var(--panel-border)] text-[var(--text-sub)] font-bold text-xs rounded-xl cursor-pointer"
              >
                취소
              </button>
              <button
                onClick={props.executeJoinParty}
                className="flex-1 py-2.5 bg-[var(--accent)] text-[var(--accent-fg)] font-black text-xs rounded-xl cursor-pointer shadow-md"
              >
                참여하기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}