"use client";

import { useMemo } from "react";
import ClassIcon from "@/components/common/ClassIcon";
import MarkIcon from "@/components/common/MarkIcon";
import { ContentItem, DIFFICULTY_COLORS, ABYSS_SUB_DUNGEONS, AbyssSubDungeon } from "./types";
import { formatAbyssBadgeText } from "@/lib/busUtils";

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
  setTimeStart: (val: string) => void;
  timeEnd: string;
  setTimeEnd: (val: string) => void;
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
  selectedSubContents?: string[];
  setSelectedSubContents?: (val: string[]) => void;
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
  partyMemo,
  setPartyMemo,
  handleReservation,
  setShowBusCreateModal,
  selectedSubContents = ["abyss_1", "abyss_2", "abyss_3"],
  setSelectedSubContents,
}: PartyCreateFormProps) {

  const toggleSubContent = (id: string) => {
    if (!setSelectedSubContents) return;
    if (selectedSubContents.includes(id)) {
      if (selectedSubContents.length <= 1) return;
      setSelectedSubContents(selectedSubContents.filter((subId) => subId !== id));
    } else {
      setSelectedSubContents([...selectedSubContents, id]);
    }
  };

  const contentMarkSrc = useMemo(() => {
    if (!selectedContent) return "/svgs/contens mark/레이드 마크.svg";
    return selectedContent.category === "어비스"
      ? "/svgs/contens mark/어비스 마크.svg"
      : "/svgs/contens mark/레이드 마크.svg";
  }, [selectedContent]);

  const displayContentName = useMemo(() => {
    if (!selectedContent) return "목표 컨텐츠 선택";
    if (selectedContent.category === "어비스" || selectedContent.name.includes("어비스")) {
      return formatAbyssBadgeText(selectedContent.name, selectedSubContents);
    }
    return selectedContent.name
      .replace(/^(레이드|어비스)\s*-\s*/, "")
      .replace(/\s*\(통합\)/g, "")
      .trim();
  }, [selectedContent, selectedSubContents]);

  const cleanTimeStart = useMemo(() => {
    if (!timeStart) return "14:00";
    return timeStart.replace(/\s*\(\+1일\)/g, "").replace(/\s*다음날/g, "").replace(/\s*\+\d+일/g, "").trim();
  }, [timeStart]);

  const cleanTimeEnd = useMemo(() => {
    if (!timeEnd) return "23:00";
    return timeEnd.replace(/\s*\(\+1일\)/g, "").replace(/\s*다음날/g, "").replace(/\s*\+\d+일/g, "").trim();
  }, [timeEnd]);

  const displayShortDate = useMemo(() => {
    if (!selectedDate) return "";
    return selectedDate.replace(/^\d{4}-/, "");
  }, [selectedDate]);

  const isNextDay = useMemo(() => {
    if (timeEnd?.includes("+1일") || timeEnd?.includes("다음날")) return true;
    if (!cleanTimeStart || !cleanTimeEnd) return false;
    const [sH, sM] = cleanTimeStart.split(":").map(Number);
    const [eH, eM] = cleanTimeEnd.split(":").map(Number);
    if (isNaN(sH) || isNaN(eH)) return false;
    return (eH * 60 + (eM || 0)) <= (sH * 60 + (eM || 0));
  }, [timeEnd, cleanTimeStart, cleanTimeEnd]);

  return (
    <div className="space-y-2.5 w-full min-w-0">
      {/* 상단 타이틀 & 길드 버스 개설 버튼 */}
      <div className="flex items-center justify-between gap-2 border-b border-[var(--panel-border)] pb-2 min-w-0">
        <h2 className="text-xs font-black text-[var(--accent)] flex items-center gap-1.5 shrink-0 whitespace-nowrap">
          <span>✨</span> 스마트 파티 매칭
        </h2>
        {isAdmin && (
          <button
            type="button"
            onClick={() => setShowBusCreateModal(true)}
            className="group bg-[var(--inner-box)] border border-amber-500/60 hover:bg-amber-500 hover:text-black text-amber-400 px-2.5 py-1 rounded-lg text-xs font-black shadow-xs transition flex items-center gap-1.5 shrink-0 cursor-pointer whitespace-nowrap"
            title="길드 버스 개설"
          >
            <MarkIcon
              src="/svgs/UI mark/길드 마크.svg"
              size="lg"
              scale={1.4}
              colorClass="bg-amber-400 group-hover:bg-black"
            />
            <span>길드 버스</span>
          </button>
        )}
      </div>

      {/* 참여할 캐릭터 선택 */}
      <div className="space-y-1 w-full min-w-0">
        <label className="text-[11px] font-bold text-[var(--text-main)] flex items-center gap-1.5 whitespace-nowrap leading-none">
          <MarkIcon src="/svgs/UI mark/사람 마크.svg" size="sm" scale={0.8} colorClass="bg-[var(--accent)]" />
          <span className="leading-none">참여할 캐릭터 선택</span>
        </label>
        <div className="grid grid-cols-3 gap-1.5 w-full min-w-0">
          {myCharacterNames.map((char) => {
            const charObj = allCharactersMap[char];
            const jobName = charObj?.job || "전사";
            const isSelected = selectedChar === char;
            return (
              <button
                key={char}
                type="button"
                onClick={() => setSelectedChar(char)}
                className={`text-xs font-black py-1.5 px-1 rounded-xl transition cursor-pointer whitespace-nowrap flex items-center justify-center gap-1 border overflow-hidden min-w-0 tracking-tight shadow-xs ${
                  isSelected
                    ? "bg-[var(--accent)] text-[var(--accent-fg)] border-transparent ring-2 ring-[var(--accent)]/40 font-black shadow-md"
                    : "bg-[var(--inner-box)] border-[var(--panel-border)] text-[var(--text-main)] hover:border-[var(--accent)]"
                }`}
              >
                <ClassIcon job={jobName} className={`w-3.5 h-3.5 shrink-0 ${isSelected ? "brightness-200" : ""}`} />
                <span className="whitespace-nowrap shrink-0 truncate">{char}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 목표 컨텐츠 & 뱃지 */}
      <div className="w-full min-w-0 space-y-1.5">
        <button
          type="button"
          onClick={openContentModal}
          className="w-full bg-[var(--inner-box)] border border-[var(--panel-border)] hover:border-[var(--accent)] rounded-xl px-2.5 py-2 text-left transition flex items-center justify-between gap-1.5 group shadow-xs cursor-pointer min-w-0"
        >
          <div className="flex items-center gap-1.5 min-w-0 truncate">
            <MarkIcon src={contentMarkSrc} size="sm" scale={1.15} colorClass="bg-[var(--accent)]" />
            <span className="text-xs font-black text-[var(--text-main)] group-hover:text-[var(--accent)] transition truncate leading-none">
              {displayContentName}
            </span>
            {selectedContent && (
              <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md border border-[var(--panel-border)] bg-[var(--panel)] text-[var(--text-sub)] shrink-0 whitespace-nowrap">
                {selectedContent.size}인
              </span>
            )}
            {selectedDiff && (
              <span
                className={`text-[10px] font-black px-1.5 py-0.5 rounded-md border shrink-0 whitespace-nowrap ${DIFFICULTY_COLORS[selectedDiff]}`}
              >
                {selectedDiff}
              </span>
            )}
          </div>
          <span className="text-xs text-[var(--text-sub)] group-hover:text-[var(--accent)] transition shrink-0 p-0.5">
            ⚙️
          </span>
        </button>

        {/* 🎯 어비스 목표 던전 다중 선택 칩 */}
        {selectedContent?.category === "어비스" && setSelectedSubContents && (
          <div className="bg-[var(--inner-box)] border border-[var(--panel-border)] p-2 rounded-xl space-y-1.5 animate-in fade-in duration-200">
            <div className="flex justify-between items-center text-[10.5px] font-black text-[var(--accent)] mb-0.5">
              <span>🎯 어비스 목표 던전 선택</span>
              <span className="text-[var(--text-sub)] text-[9.5px] font-normal">
                {selectedSubContents.length === ABYSS_SUB_DUNGEONS.length ? "전체 진행" : `${selectedSubContents.length}개 선택됨`}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {ABYSS_SUB_DUNGEONS.map((dungeon: AbyssSubDungeon) => {
                const isChecked = selectedSubContents.includes(dungeon.id);
                return (
                  <button
                    key={dungeon.id}
                    type="button"
                    onClick={() => toggleSubContent(dungeon.id)}
                    className={`py-1.5 px-1.5 text-[10px] sm:text-[12px] font-black rounded-xl transition-all cursor-pointer text-center truncate border min-h-[32px] flex items-center justify-center shadow-xs ${
                      isChecked
                        ? "bg-[var(--accent)] text-[var(--accent-fg)] border-transparent shadow-md font-black"
                        : "bg-[var(--panel)] border-[var(--panel-border)] text-[var(--text-sub)] hover:text-[var(--text-main)] hover:border-[var(--accent)]/50"
                    }`}
                  >
                    {dungeon.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 매칭 희망 스케줄 */}
      <div className="w-full min-w-0">
        <button
          type="button"
          onClick={openScheduleModal}
          className="w-full bg-[var(--inner-box)] border border-[var(--panel-border)] hover:border-[var(--accent)] rounded-xl px-2.5 py-2 text-left transition flex items-center justify-between gap-1.5 group shadow-xs cursor-pointer min-w-0"
        >
          <div className="flex items-center gap-2 min-w-0 text-xs font-black text-[var(--text-main)] leading-none truncate">
            <MarkIcon src="/svgs/UI mark/달력 마크.svg" size="sm" scale={2.10} colorClass="bg-[var(--accent)]" />
            
            <div className="flex items-center gap-1.5 min-w-0 truncate">
              <span className="text-[var(--accent)] whitespace-nowrap shrink-0 flex items-center leading-none">
                {displayShortDate} ({getDayOfWeekKorean(selectedDate)})
              </span>
              <span className="text-[var(--text-sub)] font-bold shrink-0 flex items-center leading-none opacity-60">|</span>
              <span className="font-mono truncate flex items-center gap-1.5 leading-none translate-y-[0.5px]">
                <span>{cleanTimeStart} ~ {cleanTimeEnd}</span>
                {isNextDay && (
                  <span className="text-[9px] bg-indigo-900/80 text-indigo-200 border border-indigo-500/50 px-1.5 py-0.5 rounded font-sans shrink-0 font-bold leading-none">
                    (+1일)
                  </span>
                )}
              </span>
            </div>
          </div>
          <span className="text-xs text-[var(--text-sub)] group-hover:text-[var(--accent)] transition shrink-0 p-0.5">
            ⚙️
          </span>
        </button>
      </div>

      {/* 파티 스타일 & 매칭 전략 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full min-w-0">
        <div className="space-y-1 w-full min-w-0">
          <label className="text-[11px] font-bold text-[var(--text-main)] flex items-center gap-1.5 whitespace-nowrap leading-none">
            <MarkIcon src="/svgs/status mark/전투력 마크.svg" size="sm" scale={1.52} colorClass="bg-[var(--accent)]" />
            <span className="leading-none">파티 스타일</span>
          </label>
          <div className="grid grid-cols-2 gap-1 bg-[var(--inner-box)] p-1 rounded-xl border border-[var(--panel-border)]">
            <button
              type="button"
              onClick={() => setPartyType("1회 클리어")}
              className={`py-1.5 rounded-lg text-[11px] font-black transition cursor-pointer whitespace-nowrap text-center ${
                partyType === "1회 클리어"
                  ? "bg-[var(--accent)] text-[var(--accent-fg)] shadow-md border-transparent font-black"
                  : "text-[var(--text-sub)] hover:text-[var(--text-main)]"
              }`}
            >
              1회 클리어
            </button>
            <button
              type="button"
              onClick={() => setPartyType("반복 뺑이")}
              className={`py-1.5 rounded-lg text-[11px] font-black transition cursor-pointer whitespace-nowrap text-center ${
                partyType === "반복 뺑이"
                  ? "bg-rose-500 text-white font-black shadow-md border-transparent"
                  : "text-[var(--text-sub)] hover:text-[var(--text-main)]"
              }`}
            >
              반복 뺑이
            </button>
          </div>
        </div>

        <div className="space-y-1 w-full min-w-0">
          <label className="text-[11px] font-bold text-[var(--text-main)] flex items-center gap-1.5 whitespace-nowrap leading-none">
            <MarkIcon src="/svgs/UI mark/도감 마크.svg" size="sm" scale={3.3} colorClass="bg-[var(--accent)]" />
            <span className="leading-none">매칭 전략</span>
          </label>
          <div className="grid grid-cols-2 gap-1 bg-[var(--inner-box)] p-1 rounded-xl border border-[var(--panel-border)]">
            <button
              type="button"
              onClick={() => setMatchingMode("모집우선")}
              className={`py-1.5 rounded-lg text-[11px] font-black transition cursor-pointer whitespace-nowrap text-center ${
                matchingMode === "모집우선"
                  ? "bg-[var(--accent)] text-[var(--accent-fg)] shadow-md border-transparent font-black"
                  : "text-[var(--text-sub)] hover:text-[var(--text-main)]"
              }`}
            >
              모집우선
            </button>
            <button
              type="button"
              onClick={() => setMatchingMode("조합우선")}
              className={`py-1.5 rounded-lg text-[11px] font-black transition cursor-pointer whitespace-nowrap text-center ${
                matchingMode === "조합우선"
                  ? "bg-indigo-600 text-white font-black shadow-md border-transparent"
                  : "text-[var(--text-sub)] hover:text-[var(--text-main)]"
              }`}
            >
              조합우선
            </button>
          </div>
        </div>
      </div>

      {/* 파티 메모 */}
      <div className="w-full min-w-0">
        <input
          type="text"
          placeholder="파티 메모 (예: 매너팟 / 3트 클리어)"
          value={partyMemo}
          onChange={(e) => setPartyMemo(e.target.value)}
          className="w-full bg-[var(--inner-box)] border border-[var(--panel-border)] rounded-xl px-3 py-2 text-xs font-bold text-[var(--text-main)] outline-none focus:border-[var(--accent)] shadow-xs placeholder:text-[var(--text-sub)]/70"
        />
      </div>

      {/* 매칭 등록 버튼 */}
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