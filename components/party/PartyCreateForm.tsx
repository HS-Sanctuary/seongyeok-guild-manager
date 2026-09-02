"use client";

import { ClassIcon } from "@/components/common/ClassIcon";
import { ContentItem, DIFFICULTY_COLORS, ROLE_COLORS, ROLE_GROUPS } from "./types";

interface PartyCreateFormProps {
  isAdmin: boolean;
  myCharacterNames: string[];
  allCharactersMap: Record<string, any>;
  selectedChar: string;
  setSelectedChar: (char: string) => void;
  selectedContent: ContentItem;
  selectedDiff: string;
  openContentModal: () => void;
  selectedDate: string;
  getDayOfWeekKorean: (dateStr: string) => string;
  timeStart: string;
  timeEnd: string;
  openScheduleModal: () => void;
  partyType: "1회 클리어" | "반복 뺑이";
  setPartyType: (type: "1회 클리어" | "반복 뺑이") => void;
  matchingMode: "모집우선" | "조합우선";
  setMatchingMode: (mode: "모집우선" | "조합우선") => void;
  loopSubMode: "회차" | "시간";
  setLoopSubMode: (mode: "회차" | "시간") => void;
  minRuns: string;
  setMinRuns: (val: string) => void;
  maxRuns: string;
  setMaxRuns: (val: string) => void;
  loopHoursCount: string;
  setLoopHoursCount: (val: string) => void;
  loopHoursMin: string;
  setLoopHoursMin: (val: string) => void;
  partyMemo: string;
  setPartyMemo: (memo: string) => void;
  myRoles: string[];
  setMyRoles: (roles: string[]) => void;
  wantedRoles: string[];
  setWantedRoles: (roles: string[]) => void;
  handleReservation: () => void;
  setShowBusCreateModal: (open: boolean) => void;
}

export default function PartyCreateForm({
  isAdmin,
  myCharacterNames,
  allCharactersMap,
  selectedChar,
  setSelectedChar,
  selectedContent,
  selectedDiff,
  openContentModal,
  selectedDate,
  getDayOfWeekKorean,
  timeStart,
  timeEnd,
  openScheduleModal,
  partyType,
  setPartyType,
  matchingMode,
  setMatchingMode,
  loopSubMode,
  setLoopSubMode,
  minRuns,
  setMinRuns,
  maxRuns,
  setMaxRuns,
  loopHoursCount,
  setLoopHoursCount,
  loopHoursMin,
  setLoopHoursMin,
  partyMemo,
  setPartyMemo,
  myRoles,
  setMyRoles,
  wantedRoles,
  setWantedRoles,
  handleReservation,
  setShowBusCreateModal
}: PartyCreateFormProps) {
  const toggleRole = (role: string, state: string[], setState: (val: string[]) => void) => {
    if (state.includes(role)) setState(state.filter(r => r !== role));
    else setState([...state, role]);
  };

  return (
    <div className="space-y-2.5 w-full min-w-0">
      {/* 상단 타이틀 & 🚌 길드 버스 버튼 */}
      <div className="flex items-center justify-between gap-2 border-b border-[var(--panel-border)] pb-2 min-w-0">
        <h2 className="text-xs font-black text-[var(--accent)] flex items-center gap-1.5 shrink-0 whitespace-nowrap">
          <span>✨</span> 스마트 파티 매칭
        </h2>
        {isAdmin && (
          <button 
            type="button"
            onClick={() => setShowBusCreateModal(true)}
            className="bg-[var(--inner-box)] border border-amber-500/60 hover:bg-amber-500 hover:text-black text-amber-400 px-2.5 py-0.5 rounded-lg text-xs font-black shadow-xs transition flex items-center gap-1 shrink-0 cursor-pointer whitespace-nowrap"
            title="길드 버스 개설"
          >
            <span>🚌</span>
            <span className="hidden sm:inline">길드 버스</span>
          </button>
        )}
      </div>
      
      {/* 캐릭터 선택 */}
      <div className="space-y-1 w-full min-w-0">
        <label className="text-[11px] font-black text-[var(--accent)] flex items-center gap-1 whitespace-nowrap">
          <span>👤</span> 참여할 캐릭터 선택
        </label>
        <div className="grid grid-cols-3 gap-1.5 w-full min-w-0">
          {myCharacterNames.map(char => {
            const charObj = allCharactersMap[char];
            const jobName = charObj?.job || "전사";
            const isSelected = selectedChar === char;
            return (
              <button 
                key={char} 
                type="button"
                onClick={() => setSelectedChar(char)} 
                className={`text-xs font-black py-1.5 px-1 rounded-xl transition cursor-pointer whitespace-nowrap flex items-center justify-center gap-1 border overflow-hidden min-w-0 tracking-tight shadow-xs ${
                  isSelected ? "bg-[var(--accent)] text-[var(--accent-fg)] border-transparent ring-2 ring-[var(--accent)]/40" : "bg-[var(--inner-box)] border-[var(--panel-border)] text-[var(--text-main)] hover:border-[var(--accent)]"
                }`}
              >
                <ClassIcon job={jobName} className={`w-3.5 h-3.5 shrink-0 ${isSelected ? "brightness-200" : ""}`} />
                <span className="whitespace-nowrap shrink-0 truncate">{char}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 목표 컨텐츠 & 난이도 */}
      <div className="space-y-1 w-full min-w-0">
        <label className="text-[11px] font-black text-[var(--accent)] flex items-center gap-1 whitespace-nowrap">
          <span>🎯</span> 목표 컨텐츠 & 난이도
        </label>
        <button
          type="button"
          onClick={openContentModal}
          className="w-full bg-[var(--inner-box)] border border-[var(--panel-border)] hover:border-[var(--accent)] rounded-xl p-2 text-left transition space-y-0.5 group shadow-xs cursor-pointer"
        >
          <div className="flex items-center justify-between gap-2 min-w-0">
            <span className="text-xs font-black text-[var(--text-main)] group-hover:text-[var(--accent)] transition whitespace-nowrap">
              {selectedContent.name}
            </span>
            <span className="text-[10px] text-[var(--accent)] font-bold bg-[var(--panel)] px-2 py-0.5 rounded-lg border border-[var(--panel-border)] shrink-0 whitespace-nowrap">
              변경 ▼
            </span>
          </div>
          <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md border shrink-0 whitespace-nowrap ${DIFFICULTY_COLORS[selectedDiff]}`}>
              🔥 {selectedDiff}
            </span>
            <span className="text-[10px] text-[var(--text-sub)] font-bold whitespace-nowrap">
              ({selectedContent.size}인 권장)
            </span>
          </div>
        </button>
      </div>

      {/* 매칭 희망 스케줄 */}
      <div className="space-y-1 w-full min-w-0">
        <label className="text-[11px] font-black text-[var(--accent)] flex items-center gap-1 whitespace-nowrap">
          <span>📅</span> 매칭 희망 스케줄
        </label>
        <button
          type="button"
          onClick={openScheduleModal}
          className="w-full bg-[var(--inner-box)] border border-[var(--panel-border)] hover:border-[var(--accent)] rounded-xl p-2 text-left transition space-y-0.5 group shadow-xs cursor-pointer"
        >
          <div className="flex items-center justify-between gap-2 min-w-0">
            <span className="text-xs font-black text-[var(--accent)] whitespace-nowrap">
              {selectedDate} ({getDayOfWeekKorean(selectedDate)})
            </span>
            <span className="text-[10px] text-[var(--accent)] font-bold bg-[var(--panel)] px-2 py-0.5 rounded-lg border border-[var(--panel-border)] shrink-0 whitespace-nowrap">
              설정 ▼
            </span>
          </div>
          <p className="text-xs font-mono text-[var(--text-main)] font-black flex items-center gap-1 whitespace-nowrap">
            <span className="shrink-0">⏰</span>
            <span>{timeStart} ~ {timeEnd} 플레이 가능</span>
          </p>
        </button>
      </div>

      {/* 파티 스타일 & 매칭 전략 (2열 압축 레이아웃) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full min-w-0">
        <div className="space-y-1 w-full min-w-0">
          <label className="text-[11px] font-black text-[var(--accent)] flex items-center gap-1 whitespace-nowrap">
            <span>⚔️</span> 파티 스타일
          </label>
          <div className="grid grid-cols-2 gap-1 bg-[var(--inner-box)] p-0.5 rounded-xl border border-[var(--panel-border)]">
            <button 
              type="button" 
              onClick={() => setPartyType("1회 클리어")} 
              className={`py-1.5 rounded-lg text-[11px] font-black transition cursor-pointer whitespace-nowrap text-center ${
                partyType === "1회 클리어" ? "bg-[var(--panel)] text-[var(--text-main)] shadow-xs border border-[var(--panel-border)]" : "text-[var(--text-sub)] hover:text-[var(--text-main)]"
              }`}
            >
              1회 클리어
            </button>
            <button 
              type="button" 
              onClick={() => setPartyType("반복 뺑이")} 
              className={`py-1.5 rounded-lg text-[11px] font-black transition cursor-pointer whitespace-nowrap text-center ${
                partyType === "반복 뺑이" ? "bg-rose-950/60 text-rose-300 border border-rose-800/80 shadow-xs" : "text-[var(--text-sub)] hover:text-[var(--text-main)]"
              }`}
            >
              반복 뺑이
            </button>
          </div>
        </div>

        <div className="space-y-1 w-full min-w-0">
          <label className="text-[11px] font-black text-[var(--accent)] flex items-center gap-1 whitespace-nowrap">
            <span>🧠</span> 매칭 전략
          </label>
          <div className="grid grid-cols-2 gap-1 bg-[var(--inner-box)] p-0.5 rounded-xl border border-[var(--panel-border)]">
            <button 
              type="button" 
              onClick={() => setMatchingMode("모집우선")} 
              className={`py-1.5 rounded-lg text-[11px] font-black transition cursor-pointer whitespace-nowrap text-center ${
                matchingMode === "모집우선" ? "bg-[var(--panel)] text-[var(--text-main)] shadow-xs border border-[var(--panel-border)]" : "text-[var(--text-sub)] hover:text-[var(--text-main)]"
              }`}
            >
              모집우선
            </button>
            <button 
              type="button" 
              onClick={() => setMatchingMode("조합우선")} 
              className={`py-1.5 rounded-lg text-[11px] font-black transition cursor-pointer whitespace-nowrap text-center ${
                matchingMode === "조합우선" ? "bg-indigo-600 text-white shadow-xs" : "text-[var(--text-sub)] hover:text-[var(--text-main)]"
              }`}
            >
              조합우선
            </button>
          </div>
        </div>
      </div>

      {partyType === "반복 뺑이" && (
        <div className="bg-[var(--inner-box)] p-2.5 rounded-xl border border-[var(--panel-border)] space-y-1.5 w-full min-w-0">
          <div className="flex justify-between items-center border-b border-[var(--panel-border)] pb-1 min-w-0">
            <span className="text-[11px] font-black text-[var(--accent)] flex items-center gap-1 whitespace-nowrap">
              <span>🔄</span> 반복 상세 설정
            </span>
            <div className="flex bg-[var(--panel)] p-0.5 rounded-lg border border-[var(--panel-border)] text-[10px] shrink-0">
              <button type="button" onClick={() => setLoopSubMode("회차")} className={`px-2 py-0.5 rounded-md font-bold cursor-pointer ${loopSubMode === "회차" ? "bg-[var(--accent)] text-[var(--accent-fg)] font-black" : "text-[var(--text-sub)]"}`}>회차</button>
              <button type="button" onClick={() => setLoopSubMode("시간")} className={`px-2 py-0.5 rounded-md font-bold cursor-pointer ${loopSubMode === "시간" ? "bg-[var(--accent)] text-[var(--accent-fg)] font-black" : "text-[var(--text-sub)]"}`}>시간</button>
            </div>
          </div>

          {loopSubMode === "회차" ? (
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex-1 flex items-center justify-between bg-[var(--panel)] px-2 py-1 rounded-lg border border-[var(--panel-border)] min-w-0">
                <span className="text-[10px] text-[var(--text-sub)] font-bold shrink-0">최소</span>
                <div className="flex items-center gap-1 shrink-0">
                  <input type="number" value={minRuns} onChange={e => setMinRuns(e.target.value)} className="w-8 bg-[var(--inner-box)] border border-[var(--panel-border)] text-xs font-black text-center text-[var(--text-main)] rounded-md py-0.5 outline-none" />
                  <span className="text-xs text-[var(--text-main)] font-bold">회</span>
                </div>
              </div>
              <span className="text-[var(--text-sub)] font-bold shrink-0">~</span>
              <div className="flex-1 flex items-center justify-between bg-[var(--panel)] px-2 py-1 rounded-lg border border-[var(--panel-border)] min-w-0">
                <span className="text-[10px] text-[var(--text-sub)] font-bold shrink-0">최대</span>
                <div className="flex items-center gap-1 shrink-0">
                  <input type="number" value={maxRuns} onChange={e => setMaxRuns(e.target.value)} className="w-8 bg-[var(--inner-box)] border border-[var(--panel-border)] text-xs font-black text-center text-[var(--text-main)] rounded-md py-0.5 outline-none" />
                  <span className="text-xs text-[var(--text-main)] font-bold">회</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 min-w-0">
              <select value={loopHoursCount} onChange={e => setLoopHoursCount(e.target.value)} className="flex-1 bg-[var(--panel)] border border-[var(--panel-border)] rounded-lg px-2 py-1 text-xs font-bold text-[var(--text-main)] outline-none min-w-0">
                <option value="0">0시간</option><option value="1">1시간</option><option value="2">2시간</option><option value="3">3시간</option><option value="4">4시간</option>
              </select>
              <select value={loopHoursMin} onChange={e => setLoopHoursMin(e.target.value)} className="flex-1 bg-[var(--panel)] border border-[var(--panel-border)] rounded-lg px-2 py-1 text-xs font-bold text-[var(--text-main)] outline-none min-w-0">
                <option value="00">0분</option><option value="15">15분</option><option value="30">30분</option><option value="45">45분</option>
              </select>
            </div>
          )}
        </div>
      )}

      {/* 파티 메모 */}
      <div className="w-full min-w-0">
        <input 
          type="text"
          placeholder="파티 메모 (예: 매너팟 / 3트 클리어)"
          value={partyMemo}
          onChange={e => setPartyMemo(e.target.value)}
          className="w-full bg-[var(--inner-box)] border border-[var(--panel-border)] rounded-xl px-3 py-1.5 text-xs font-bold text-[var(--text-main)] outline-none focus:border-[var(--accent)] shadow-xs placeholder:text-[var(--text-sub)]/70"
        />
      </div>

      {matchingMode === "조합우선" && (
        <div className="bg-[var(--inner-box)] p-2.5 rounded-xl border border-indigo-900/60 space-y-1.5 w-full min-w-0">
          <div>
            <label className="text-[10px] font-black text-indigo-400 mb-1 block">내 수락 가능 포지션</label>
            <div className="flex flex-wrap gap-1">
              {Object.keys(ROLE_GROUPS).map(role => (
                <button type="button" key={role} onClick={() => toggleRole(role, myRoles, setMyRoles)} className={`text-[10px] font-bold px-2 py-0.5 rounded-md border cursor-pointer whitespace-nowrap ${myRoles.includes(role) ? ROLE_COLORS[role] : "bg-[var(--panel)] border-[var(--panel-border)] text-[var(--text-sub)]"}`}>
                  {role}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[10px] font-black text-rose-400 mb-1 block">구인 희망 포지션</label>
            <div className="flex flex-wrap gap-1">
              {Object.keys(ROLE_GROUPS).map(role => (
                <button type="button" key={role} onClick={() => toggleRole(role, wantedRoles, setWantedRoles)} className={`text-[10px] font-bold px-2 py-0.5 rounded-md border cursor-pointer whitespace-nowrap ${wantedRoles.includes(role) ? "bg-rose-950/60 text-rose-300 border-rose-500" : "bg-[var(--panel)] border-[var(--panel-border)] text-[var(--text-sub)]"}`}>
                  + {role}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 등록 버튼 */}
      <button 
        type="button"
        onClick={handleReservation} 
        className="w-full bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-[var(--accent-fg)] font-black py-2.5 rounded-xl shadow-md transition cursor-pointer text-xs tracking-wider whitespace-nowrap"
      >
        ✨ 파티 매칭 등록하기
      </button>
    </div>
  );
}