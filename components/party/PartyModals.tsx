"use client";

import { ClassIcon } from "@/components/common/ClassIcon";
import CustomTimePicker from "./CustomTimePicker";
import { CONTENT_DB, ContentItem, Party } from "./types";
import { getFormattedDateWithDDay } from "@/app/party/page";

interface PartyModalsProps {
  // 안내 모달
  showSynaxisInfoModal: boolean;
  setShowSynaxisInfoModal: (open: boolean) => void;
  showLoreGuide: boolean;
  setShowLoreGuide: (open: boolean) => void;

  // 컨텐츠 모달
  showContentModal: boolean;
  setShowContentModal: (open: boolean) => void;
  tempContentCategory: "어비스" | "레이드";
  setTempContentCategory: (cat: "어비스" | "레이드") => void;
  tempContent: ContentItem;
  setTempContent: (item: ContentItem) => void;
  tempDiff: string;
  setTempDiff: (diff: string) => void;
  applyContentModal: () => void;

  // 스케줄 모달
  showScheduleModal: boolean;
  setShowScheduleModal: (open: boolean) => void;
  calendarYearMonth: { year: number; month: number };
  setCalendarYearMonth: React.Dispatch<React.SetStateAction<{ year: number; month: number }>>;
  calendarDays: ({ day: number; dateStr: string } | null)[];
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  timeStart: string;
  setTimeStart: (t: string) => void;
  timeEnd: string;
  setTimeEnd: (t: string) => void;

  // 전체 스케줄 달력 모달
  showFilterCalendarModal: boolean;
  setShowFilterCalendarModal: (open: boolean) => void;
  activeDateFilter: string;
  setActiveDateFilter: (date: string) => void;
  datePartyCounts: Record<string, { total: number; recruiting: number; completed: number }>;
  getDayOfWeekKorean: (dateStr: string) => string;

  // 길드버스 모달
  showBusCreateModal: boolean;
  setShowBusCreateModal: (open: boolean) => void;
  busCreateContent: ContentItem;
  setBusCreateContent: (c: ContentItem) => void;
  busCreateDiff: string;
  setBusCreateDiff: (d: string) => void;
  busCreateDate: string;
  setBusCreateDate: (d: string) => void;
  busCreateTimeStart: string;
  setBusCreateTimeStart: (t: string) => void;
  busCreateTimeEnd: string;
  setBusCreateTimeEnd: (t: string) => void;
  busCreateMemo: string;
  setBusCreateMemo: (m: string) => void;
  handleCreateGuildBus: () => void;

  // 캐릭터 스펙 상세 모달
  inspectCharacter: any;
  setInspectCharacter: (char: any) => void;

  // 합류 신청 모달
  joinPopupParty: Party | null;
  setJoinPopupParty: (party: Party | null) => void;
  myCharacters: any[];
  joinSelectedChar: string;
  setJoinSelectedChar: (char: string) => void;
  joinSelectedRole: string;
  setJoinSelectedRole: (role: string) => void;
  joinTimeStart: string;
  setJoinTimeStart: (t: string) => void;
  joinTimeEnd: string;
  setJoinTimeEnd: (t: string) => void;
  executeJoinParty: () => void;
}

export default function PartyModals({
  showSynaxisInfoModal,
  setShowSynaxisInfoModal,
  showLoreGuide,
  setShowLoreGuide,
  showContentModal,
  setShowContentModal,
  tempContentCategory,
  setTempContentCategory,
  tempContent,
  setTempContent,
  tempDiff,
  setTempDiff,
  applyContentModal,
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
  showFilterCalendarModal,
  setShowFilterCalendarModal,
  activeDateFilter,
  setActiveDateFilter,
  datePartyCounts,
  getDayOfWeekKorean,
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
  handleCreateGuildBus,
  inspectCharacter,
  setInspectCharacter,
  joinPopupParty,
  setJoinPopupParty,
  myCharacters,
  joinSelectedChar,
  setJoinSelectedChar,
  joinSelectedRole,
  setJoinSelectedRole,
  joinTimeStart,
  setJoinTimeStart,
  joinTimeEnd,
  setJoinTimeEnd,
  executeJoinParty
}: PartyModalsProps) {
  // 🛡️ [방어적 디자인] 안전 대치 객체 및 배열
  const safeBusContent = busCreateContent || CONTENT_DB[0];
  const safeBusDifficulties = safeBusContent?.diffs || safeBusContent?.difficulties || ["어려움"];

  const safeTempContent = tempContent || CONTENT_DB[0];
  const safeTempDifficulties = safeTempContent?.diffs || safeTempContent?.difficulties || ["어려움"];

  const safeCalendarDays = calendarDays || [];
  const safeMyCharacters = myCharacters || [];

  return (
    <>
      {/* 1. SYNAXIS 정보 모달 */}
      {showSynaxisInfoModal && (
        <div className="fixed inset-0 bg-black/80 z-[12000] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowSynaxisInfoModal(false)}>
          <div className="bg-[var(--panel)] border border-[var(--accent)]/60 text-[var(--text-main)] rounded-2xl max-w-sm w-full p-5 shadow-2xl relative space-y-3" onClick={e => e.stopPropagation()}>
            <button type="button" onClick={() => setShowSynaxisInfoModal(false)} className="absolute top-3.5 right-3.5 text-[var(--text-sub)] hover:text-[var(--text-main)] text-sm font-bold cursor-pointer">✕</button>
            <h2 className="text-sm font-black text-[var(--accent)] border-b border-[var(--panel-border)] pb-2 flex items-center gap-2">
              <span>💡</span> SYNAXIS 파티 매칭 안내
            </h2>
            <div className="space-y-2 text-xs text-[var(--text-main)] leading-relaxed font-medium">
              <p>• 시낙시스는 성역 길드원들의 원활한 레이드 및 어비스 매칭을 위한 자동 시간 계산 플랫폼입니다.</p>
              <p>• 출발 시간이 확정되면 최적의 중간 시간이 공지되며 파티장이 자동 추첨됩니다.</p>
            </div>
            <button type="button" onClick={() => setShowSynaxisInfoModal(false)} className="w-full bg-[var(--accent)] text-[var(--accent-fg)] font-black py-2 rounded-xl text-xs transition shadow-md cursor-pointer">
              확인
            </button>
          </div>
        </div>
      )}

      {/* 2. 가이드 모달 */}
      {showLoreGuide && (
        <div className="fixed inset-0 bg-black/80 z-[10000] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowLoreGuide(false)}>
          <div className="bg-[var(--panel)] border border-[var(--panel-border)] text-[var(--text-main)] rounded-2xl max-w-sm w-full p-5 shadow-2xl relative space-y-3" onClick={e => e.stopPropagation()}>
            <button type="button" onClick={() => setShowLoreGuide(false)} className="absolute top-3.5 right-3.5 text-[var(--text-sub)] hover:text-[var(--text-main)] text-sm font-bold cursor-pointer">✕</button>
            <h2 className="text-sm font-black text-[var(--accent)] border-b border-[var(--panel-border)] pb-2 flex items-center gap-2">
              <span>🏛️</span> SYNAXIS 가이드
            </h2>
            <div className="space-y-2 text-xs text-[var(--text-main)] leading-relaxed">
              <p>• <strong>길드 버스 고정:</strong> 목요일 ~ 수요일 주간 범위 동안 성역 길드 버스가 최상단에 안전하게 고정 노출됩니다.</p>
              <p>• <strong>일정 충돌 방지:</strong> 동일 캐릭터의 동일 시간대 중복 매칭 신청은 시스템이 자동 차단합니다.</p>
            </div>
          </div>
        </div>
      )}

      {/* 3. 목표 컨텐츠 & 난이도 선택 모달 */}
      {showContentModal && (
        <div className="fixed inset-0 z-[12000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowContentModal(false)}>
          <div className="bg-[var(--panel)] border border-[var(--panel-border)] rounded-2xl shadow-2xl w-full max-w-md p-5 space-y-4 relative" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-[var(--panel-border)] pb-3">
              <h3 className="text-sm font-black text-[var(--accent)] flex items-center gap-2">
                <span>🎯</span> 목표 컨텐츠 & 난이도 선택
              </h3>
              <button type="button" onClick={() => setShowContentModal(false)} className="text-[var(--text-sub)] hover:text-[var(--text-main)] font-bold text-xs cursor-pointer">✕</button>
            </div>

            <div className="flex bg-[var(--inner-box)] p-1 rounded-xl border border-[var(--panel-border)] gap-1">
              <button
                type="button"
                onClick={() => {
                  setTempContentCategory("어비스");
                  const firstAbyss = CONTENT_DB.find(c => c.category === "어비스") || CONTENT_DB[0];
                  setTempContent(firstAbyss);
                  setTempDiff(firstAbyss.defaultDiff);
                }}
                className={`flex-1 py-2 rounded-lg text-xs font-black transition cursor-pointer ${
                  tempContentCategory === "어비스" 
                    ? "bg-[var(--accent)] text-[var(--accent-fg)] shadow-xs" 
                    : "text-[var(--text-sub)] hover:text-[var(--text-main)]"
                }`}
              >
                🌀 어비스
              </button>
              <button
                type="button"
                onClick={() => {
                  setTempContentCategory("레이드");
                  const firstRaid = CONTENT_DB.find(c => c.category === "레이드") || CONTENT_DB[4];
                  setTempContent(firstRaid);
                  setTempDiff(firstRaid.defaultDiff);
                }}
                className={`flex-1 py-2 rounded-lg text-xs font-black transition cursor-pointer ${
                  tempContentCategory === "레이드" 
                    ? "bg-rose-600 text-white shadow-xs" 
                    : "text-[var(--text-sub)] hover:text-[var(--text-main)]"
                }`}
              >
                ⚔️ 레이드
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-[var(--accent)] block">1. 컨텐츠 선택</label>
              <div className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                {(CONTENT_DB || []).filter(c => c.category === tempContentCategory).map(item => {
                  const isSelected = safeTempContent.id === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setTempContent(item);
                        setTempDiff(item.defaultDiff);
                      }}
                      className={`w-full text-left px-3.5 py-2.5 rounded-xl border text-xs font-bold transition flex justify-between items-center cursor-pointer ${
                        isSelected 
                          ? "bg-[var(--inner-box)] border-[var(--accent)] text-[var(--accent)] ring-1 ring-[var(--accent)] font-black shadow-xs" 
                          : "bg-[var(--inner-box)] border-[var(--panel-border)] text-[var(--text-main)] hover:border-[var(--accent)]"
                      }`}
                    >
                      <span className="truncate pr-2">{item.name}</span>
                      <span className="text-[10px] text-[var(--text-sub)] font-normal shrink-0">({item.size}인)</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5 border-t border-[var(--panel-border)] pt-3">
              <label className="text-xs font-black text-[var(--accent)] block">2. 입장 난이도 선택</label>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {safeTempDifficulties.map(diff => {
                  const isSelected = tempDiff === diff;
                  return (
                    <button
                      key={diff}
                      type="button"
                      onClick={() => setTempDiff(diff)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-black transition cursor-pointer ${
                        isSelected 
                          ? "bg-[var(--accent)] text-[var(--accent-fg)] border-transparent ring-2 ring-[var(--accent)]/50 shadow-xs" 
                          : "bg-[var(--inner-box)] text-[var(--text-sub)] border-[var(--panel-border)] hover:text-[var(--text-main)]"
                      }`}
                    >
                      {diff}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 border-t border-[var(--panel-border)] flex justify-end gap-2">
              <button 
                type="button"
                onClick={() => setShowContentModal(false)} 
                className="bg-[var(--inner-box)] border border-[var(--panel-border)] text-[var(--text-sub)] font-bold px-4 py-2 rounded-xl text-xs transition cursor-pointer"
              >
                취소
              </button>
              <button 
                type="button"
                onClick={applyContentModal} 
                className="bg-[var(--accent)] text-[var(--accent-fg)] font-black px-5 py-2 rounded-xl text-xs shadow-md transition cursor-pointer"
              >
                선택 완료
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. 스케줄 선택 모달 */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-[12000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowScheduleModal(false)}>
          <div className="bg-[var(--panel)] border border-[var(--panel-border)] rounded-2xl shadow-2xl w-full max-w-sm p-5 space-y-4 relative" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-[var(--panel-border)] pb-3">
              <h3 className="text-xs sm:text-sm font-black text-[var(--accent)] flex items-center gap-1.5">
                <span>📅</span> 매칭 희망 스케줄 선택
              </h3>
              <button type="button" onClick={() => setShowScheduleModal(false)} className="text-[var(--text-sub)] hover:text-[var(--text-main)] font-bold text-xs cursor-pointer">✕</button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between bg-[var(--inner-box)] p-2 rounded-xl border border-[var(--panel-border)]">
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => setCalendarYearMonth(prev => ({ ...prev, year: prev.year - 1 }))} className="px-1.5 py-0.5 rounded bg-[var(--panel)] border border-[var(--panel-border)] text-[10px] font-bold hover:text-[var(--accent)] cursor-pointer">≪</button>
                  <button type="button" onClick={() => setCalendarYearMonth(prev => prev.month === 0 ? { year: prev.year - 1, month: 11 } : { ...prev, month: prev.month - 1 })} className="px-2 py-0.5 rounded bg-[var(--panel)] border border-[var(--panel-border)] text-xs font-bold hover:text-[var(--accent)] cursor-pointer">◀</button>
                </div>
                
                <span className="text-xs font-black text-[var(--accent)]">
                  {calendarYearMonth.year}년 {calendarYearMonth.month + 1}월
                </span>

                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => setCalendarYearMonth(prev => prev.month === 11 ? { year: prev.year + 1, month: 0 } : { ...prev, month: prev.month + 1 })} className="px-2 py-0.5 rounded bg-[var(--panel)] border border-[var(--panel-border)] text-xs font-bold hover:text-[var(--accent)] cursor-pointer">▶</button>
                  <button type="button" onClick={() => setCalendarYearMonth(prev => ({ ...prev, year: prev.year + 1 }))} className="px-1.5 py-0.5 rounded bg-[var(--panel)] border border-[var(--panel-border)] text-[10px] font-bold hover:text-[var(--accent)] cursor-pointer">≫</button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center bg-[var(--inner-box)] p-2 rounded-xl border border-[var(--panel-border)]">
                {["일", "월", "화", "수", "목", "금", "토"].map((w, idx) => (
                  <div key={idx} className={`text-[10px] font-bold pb-1 ${idx === 0 ? "text-rose-400" : idx === 6 ? "text-sky-400" : "text-[var(--text-sub)]"}`}>{w}</div>
                ))}
                {safeCalendarDays.map((item, idx) => {
                  if (!item) return <div key={idx} className="h-8"></div>;
                  const isSelected = selectedDate === item.dateStr;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedDate(item.dateStr)}
                      className={`h-8 rounded-lg text-xs font-bold transition flex items-center justify-center cursor-pointer ${
                        isSelected 
                          ? "bg-[var(--accent)] text-[var(--accent-fg)] font-black shadow-xs scale-105" 
                          : "text-[var(--text-main)] hover:bg-[var(--panel)]"
                      }`}
                    >
                      {item.day}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5 border-t border-[var(--panel-border)] pt-3">
              <label className="text-xs font-bold text-[var(--accent)] flex items-center gap-1 mb-1">
                <span>⏰</span> 플레이 가능 시간대
              </label>
              {/* 🌟 CustomTimePicker 적용 */}
              <div className="flex items-center gap-2 bg-[var(--inner-box)] p-2 rounded-xl border border-[var(--panel-border)]">
                <CustomTimePicker value={timeStart} onChange={setTimeStart} />
                <span className="text-[var(--text-sub)] font-bold text-xs shrink-0">~</span>
                <CustomTimePicker value={timeEnd} onChange={setTimeEnd} />
              </div>
            </div>

            <div className="pt-2 border-t border-[var(--panel-border)] flex justify-end gap-2">
              <button 
                type="button"
                onClick={() => setShowScheduleModal(false)} 
                className="bg-[var(--inner-box)] border border-[var(--panel-border)] text-[var(--text-sub)] font-bold px-4 py-2 rounded-xl text-xs transition cursor-pointer"
              >
                취소
              </button>
              <button 
                type="button"
                onClick={() => setShowScheduleModal(false)} 
                className="bg-[var(--accent)] text-[var(--accent-fg)] font-black px-5 py-2 rounded-xl text-xs shadow-md transition cursor-pointer"
              >
                선택 완료
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. 전체 스케줄 달력 모달 */}
      {showFilterCalendarModal && (
        <div className="fixed inset-0 z-[12000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowFilterCalendarModal(false)}>
          <div className="bg-[var(--panel)] border border-[var(--panel-border)] rounded-2xl shadow-2xl w-full max-w-sm p-5 space-y-3.5 relative" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-[var(--panel-border)] pb-3">
              <h3 className="text-xs sm:text-sm font-black text-[var(--accent)] flex items-center gap-1.5">
                <span>📅</span> 전체 파티 스케줄 조회
              </h3>
              <button type="button" onClick={() => setShowFilterCalendarModal(false)} className="text-[var(--text-sub)] hover:text-[var(--text-main)] font-bold text-xs cursor-pointer">✕</button>
            </div>

            <div className="bg-[var(--inner-box)] p-2.5 rounded-xl border border-[var(--accent)]/40 text-center">
              <span className="text-xs font-bold text-[var(--text-sub)]">
                선택 날짜:{" "}
                <strong className="text-[var(--accent)] font-black">
                  {activeDateFilter === "전체" ? "전체 보기" : `${activeDateFilter} (${getDayOfWeekKorean(activeDateFilter)})`}
                </strong>
              </span>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center bg-[var(--inner-box)] p-2 rounded-xl border border-[var(--panel-border)]">
              {["일", "월", "화", "수", "목", "금", "토"].map((w, idx) => (
                <div key={idx} className={`text-[10px] font-bold pb-1 ${idx === 0 ? "text-rose-400" : idx === 6 ? "text-sky-400" : "text-[var(--text-sub)]"}`}>{w}</div>
              ))}
              {safeCalendarDays.map((item, idx) => {
                if (!item) return <div key={idx} className="h-9"></div>;
                const stats = datePartyCounts[item.dateStr] || { total: 0, recruiting: 0, completed: 0 };
                const isSelected = activeDateFilter === item.dateStr;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setActiveDateFilter(item.dateStr);
                      setShowFilterCalendarModal(false);
                    }}
                    className={`h-9 rounded-lg text-xs font-bold transition flex flex-col items-center justify-center relative cursor-pointer ${
                      isSelected 
                        ? "bg-[var(--accent)] text-[var(--accent-fg)] font-black shadow-xs scale-105" 
                        : "text-[var(--text-main)] hover:bg-[var(--panel)]"
                    }`}
                  >
                    <span>{item.day}</span>
                    {stats.total > 0 && (
                      <div className="flex items-center gap-0.5 -mt-0.5">
                        <span className={`text-[8px] px-1 rounded font-black ${isSelected ? "bg-black/40 text-white" : "text-[var(--accent)]"}`}>
                          {stats.total}
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-[var(--panel-border)] flex justify-between items-center">
              <button 
                type="button"
                onClick={() => {
                  setActiveDateFilter("전체");
                  setShowFilterCalendarModal(false);
                }} 
                className="bg-[var(--inner-box)] border border-[var(--panel-border)] text-[var(--accent)] font-bold px-3 py-1.5 rounded-xl text-xs hover:border-[var(--accent)] transition cursor-pointer"
              >
                🔄 전체 날짜 파티 보기
              </button>
              <button 
                type="button"
                onClick={() => setShowFilterCalendarModal(false)} 
                className="bg-[var(--panel)] border border-[var(--panel-border)] text-[var(--text-sub)] font-bold px-3.5 py-1.5 rounded-xl text-xs transition cursor-pointer"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. 길드 버스 개설 모달 */}
      {showBusCreateModal && (
        <div className="fixed inset-0 z-[11000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowBusCreateModal(false)}>
          <div className="bg-[var(--panel)] border border-amber-500/60 rounded-2xl shadow-2xl w-full max-w-sm p-5 space-y-3.5 relative" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-[var(--panel-border)] pb-3">
              <h3 className="text-xs sm:text-sm font-black text-amber-400 flex items-center gap-1.5"><span>🚌</span> 성역 길드 버스 파티 개설</h3>
              <button type="button" onClick={() => setShowBusCreateModal(false)} className="text-[var(--text-sub)] hover:text-[var(--text-main)] font-bold text-xs cursor-pointer">✕</button>
            </div>
            
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[var(--text-sub)] font-bold mb-1 block">목표 컨텐츠</label>
                <select 
                  value={safeBusContent.id || safeBusContent.name} 
                  onChange={e => {
                    const content = CONTENT_DB.find(c => c.id === e.target.value || c.name === e.target.value) || CONTENT_DB[0];
                    setBusCreateContent(content);
                    setBusCreateDiff(content.defaultDiff || content.diffs?.[0] || "어려움");
                  }} 
                  className="w-full bg-[var(--inner-box)] border border-[var(--panel-border)] rounded-xl px-3 py-2 font-bold text-[var(--text-main)] outline-none focus:border-[var(--accent)] cursor-pointer"
                >
                  {(CONTENT_DB || []).map(c => <option key={c.id || c.name} value={c.id || c.name}>{c.name} ({c.size}인)</option>)}
                </select>
              </div>

              <div>
                <label className="text-[var(--text-sub)] font-bold mb-1 block">난이도</label>
                <select 
                  value={busCreateDiff} 
                  onChange={e => setBusCreateDiff(e.target.value)} 
                  className="w-full bg-[var(--inner-box)] border border-[var(--panel-border)] rounded-xl px-3 py-2 font-bold text-[var(--text-main)] outline-none focus:border-[var(--accent)] cursor-pointer"
                >
                  {safeBusDifficulties.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              {/* 🌟 1번 사진 개선: 모바일/iOS/Android/Mac/PC 전 영역 100% 클릭 가능 달력 박스 */}
              <div>
                <label className="text-[var(--text-sub)] font-bold mb-1 block">운행 시작일</label>
                <div 
                  className="relative w-full cursor-pointer"
                  onClick={(e) => {
                    const input = e.currentTarget.querySelector('input[type="date"]') as HTMLInputElement;
                    if (input) {
                      if ('showPicker' in input) {
                        try { input.showPicker(); } catch (err) {}
                      } else {
                        input.focus();
                      }
                    }
                  }}
                >
                  <div className="w-full bg-[var(--inner-box)] border border-amber-500/60 rounded-xl px-3 py-2 text-xs font-black text-amber-400 flex items-center justify-between shadow-xs hover:border-amber-400 transition cursor-pointer">
                    <span className="pointer-events-none">{getFormattedDateWithDDay(busCreateDate)}</span>
                    <span className="text-sm pointer-events-none">📅</span>
                  </div>
                  <input 
                    type="date" 
                    value={busCreateDate} 
                    onChange={e => setBusCreateDate(e.target.value)} 
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10 block"
                  />
                </div>
              </div>

              {/* 🌟 2번 사진 개선: 고도화된 CustomTimePicker 복원 */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[var(--text-sub)] font-bold mb-1 block">시작 시간</label>
                  <CustomTimePicker value={busCreateTimeStart} onChange={setBusCreateTimeStart} />
                </div>
                <div>
                  <label className="text-[var(--text-sub)] font-bold mb-1 block">종료 시간</label>
                  <CustomTimePicker value={busCreateTimeEnd} onChange={setBusCreateTimeEnd} />
                </div>
              </div>

              <div>
                <label className="text-[var(--text-sub)] font-bold mb-1 block">공지 메모</label>
                <input 
                  type="text" 
                  value={busCreateMemo} 
                  onChange={e => setBusCreateMemo(e.target.value)} 
                  placeholder="예: 성역 정기 길드 버스 운행!"
                  className="w-full bg-[var(--inner-box)] border border-[var(--panel-border)] rounded-xl px-3 py-2 font-bold text-[var(--text-main)] outline-none focus:border-[var(--accent)]"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-[var(--panel-border)] flex items-center justify-end gap-2">
              <button type="button" onClick={() => setShowBusCreateModal(false)} className="bg-[var(--inner-box)] border border-[var(--panel-border)] text-[var(--text-sub)] font-bold px-4 py-2 rounded-xl text-xs transition cursor-pointer">취소</button>
              <button type="button" onClick={handleCreateGuildBus} className="bg-amber-600 hover:bg-amber-500 text-white font-black px-5 py-2 rounded-xl shadow-md transition text-xs cursor-pointer">개설하기</button>
            </div>
          </div>
        </div>
      )}

      {/* 7. 캐릭터 정보 상세 조회 모달 */}
      {inspectCharacter && (
        <div className="fixed inset-0 z-[11000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setInspectCharacter(null)}>
          <div className="bg-[var(--panel)] border border-[var(--panel-border)] rounded-2xl shadow-2xl w-full max-w-sm p-5 space-y-4 relative" onClick={e => e.stopPropagation()}>
            <button type="button" onClick={() => setInspectCharacter(null)} className="absolute top-3.5 right-3.5 text-[var(--text-sub)] hover:text-[var(--text-main)] text-sm font-bold cursor-pointer">✕</button>
            <div className="flex items-center gap-3 border-b border-[var(--panel-border)] pb-3">
              <div className="p-3 bg-[var(--inner-box)] border border-[var(--panel-border)] rounded-2xl shrink-0 shadow-xs">
                <ClassIcon job={inspectCharacter.job || "전사"} className="w-8 h-8" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs text-[var(--accent)] font-bold">{inspectCharacter.job || "전사"}</span>
                <h3 className="text-base font-black text-[var(--text-main)] truncate">{inspectCharacter.nickname}</h3>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[var(--inner-box)] border border-[var(--panel-border)] p-3 rounded-xl space-y-1">
                <span className="text-xs text-[var(--text-sub)] font-bold">⚔️ 전투력</span>
                <p className="text-sm font-black text-[var(--text-main)] truncate">{inspectCharacter.combat_power?.toLocaleString() || "정보 없음"}</p>
              </div>
              <div className="bg-[var(--inner-box)] border border-[var(--panel-border)] p-3 rounded-xl space-y-1">
                <span className="text-xs text-[var(--text-sub)] font-bold">🔮 마도저항</span>
                <p className="text-sm font-black text-[var(--text-main)] truncate">{inspectCharacter.magic_resistance?.toLocaleString() || "정보 없음"}</p>
              </div>
            </div>
            <button type="button" onClick={() => setInspectCharacter(null)} className="w-full bg-[var(--accent)] text-[var(--accent-fg)] font-black py-2.5 rounded-xl text-xs shadow-md transition cursor-pointer">확인 완료</button>
          </div>
        </div>
      )}

      {/* 8. 파티 합류 신청 모달 */}
      {joinPopupParty && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setJoinPopupParty(null)}>
          <div className="bg-[var(--panel)] border border-[var(--panel-border)] rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="bg-[var(--inner-box)] p-4 border-b border-[var(--panel-border)] flex justify-between items-center">
              <h2 className="text-sm font-black text-[var(--text-main)] flex items-center gap-2"><span>⚔️</span> 파티 합류 신청</h2>
              <button type="button" onClick={() => setJoinPopupParty(null)} className="text-[var(--text-sub)] hover:text-[var(--text-main)] font-bold text-xs cursor-pointer">✕</button>
            </div>
            <div className="p-4 space-y-3.5 bg-[var(--panel)] text-xs">
              <div className="bg-[var(--inner-box)] p-3 rounded-xl border border-[var(--panel-border)] text-center space-y-1 shadow-xs">
                <p className="font-black text-[var(--accent)] text-sm truncate">{joinPopupParty.content_name} ({joinPopupParty.difficulty})</p>
                <p className="text-xs text-[var(--text-sub)] font-mono">⏰ 파티 시간: {joinPopupParty.time_start} ~ {joinPopupParty.time_end}</p>
              </div>
              <div>
                <label className="font-bold text-[var(--text-sub)] mb-1 block">1. 합류할 캐릭터 선택</label>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto custom-scrollbar p-1">
                  {safeMyCharacters.map(char => (
                    <button type="button" key={char.id || char.nickname} onClick={() => setJoinSelectedChar(char.nickname)} className={`text-xs font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer ${joinSelectedChar === char.nickname ? "bg-[var(--accent)] text-[var(--accent-fg)] font-black shadow-xs" : "bg-[var(--inner-box)] text-[var(--text-sub)] border border-[var(--panel-border)]"}`}>
                      <ClassIcon job={char.job || "전사"} className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate max-w-[100px]">{char.nickname}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="font-bold text-[var(--text-sub)] mb-1 block">2. 희망 포지션 선택</label>
                <div className="flex flex-wrap gap-1.5">
                  {["탱커", "힐러", "근딜", "원딜"].map(role => (
                    <button type="button" key={role} onClick={() => setJoinSelectedRole(role)} className={`text-xs font-bold px-3 py-1.5 rounded-xl transition cursor-pointer ${joinSelectedRole === role ? "bg-indigo-600 text-white font-black shadow-xs" : "bg-[var(--inner-box)] text-[var(--text-sub)] border border-[var(--panel-border)]"}`}>
                      {role}
                    </button>
                  ))}
                </div>
              </div>
              <div className="bg-[var(--inner-box)] border border-[var(--panel-border)] p-3 rounded-xl space-y-1">
                <label className="font-black text-[var(--accent)] block mb-1">3. 플레이 가능 시간대</label>
                {/* 🌟 CustomTimePicker 복원 */}
                <div className="flex items-center gap-2 pt-1">
                  <CustomTimePicker value={joinTimeStart} onChange={setJoinTimeStart} />
                  <span className="text-[var(--text-sub)] font-bold shrink-0">~</span>
                  <CustomTimePicker value={joinTimeEnd} onChange={setJoinTimeEnd} />
                </div>
              </div>
            </div>
            <div className="p-3 bg-[var(--inner-box)] border-t border-[var(--panel-border)] flex justify-end gap-2">
              <button type="button" onClick={() => setJoinPopupParty(null)} className="bg-[var(--panel)] border border-[var(--panel-border)] text-[var(--text-sub)] font-bold px-4 py-2 rounded-xl text-xs transition cursor-pointer">취소</button>
              <button type="button" onClick={executeJoinParty} className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-5 py-2 rounded-xl shadow-md transition text-xs cursor-pointer">신청하기</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}