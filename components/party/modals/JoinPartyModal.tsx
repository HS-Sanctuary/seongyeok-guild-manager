"use client";

import { useMemo } from "react";
import ClassIcon from "@/components/common/ClassIcon";
import MarkIcon from "@/components/common/MarkIcon";
import CustomTimePicker from "@/components/party/CustomTimePicker";
import { Party } from "@/components/party/types";

const cleanContentName = (name: string) => {
  return name
    .replace(/^(어비스|레이드)\s*-\s*/, "")
    .replace(/\s*\(통합\)/g, "")
    .trim();
};

interface JoinPartyModalProps {
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
  getDayOfWeekKorean: (dateStr: string) => string;
}

export default function JoinPartyModal({
  joinPopupParty,
  setJoinPopupParty,
  myCharacters,
  joinSelectedChar,
  setJoinSelectedChar,
  joinTimeStart,
  setTimeStartJoin,
  joinTimeEnd,
  setTimeEndJoin,
  executeJoinParty,
  getDayOfWeekKorean,
}: JoinPartyModalProps) {
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

  const todayStr = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }, []);

  // 🟡 [요청 반영] 어비스 마크 vs 레이드 마크 자동 판별 로직
  const contentMarkSrc = useMemo(() => {
    if (!joinPopupParty) return "/svgs/contens mark/어비스 마크.svg";
    const name = (joinPopupParty.content_name || joinPopupParty.party_type || "").toLowerCase();
    if (name.includes("레이드") || name.includes("raid")) {
      return "/svgs/contens mark/레이드 마크.svg";
    }
    return "/svgs/contens mark/어비스 마크.svg";
  }, [joinPopupParty]);

  if (!joinPopupParty) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 cursor-pointer overscroll-none [text-size-adjust:100%] [-webkit-text-size-adjust:100%]"
      onClick={() => setJoinPopupParty(null)}
    >
      <div 
        className="bg-[var(--panel)] border border-[var(--panel-border)] rounded-2xl p-4 sm:p-5 max-w-lg w-full space-y-3.5 shadow-2xl animate-in fade-in zoom-in-95 cursor-default max-h-[90vh] flex flex-col overflow-hidden text-xs"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 모달 헤더 */}
        <div className="flex justify-between items-center border-b border-[var(--panel-border)] pb-2.5 shrink-0">
          <h3 className="font-black text-sm sm:text-base text-[var(--text-main)] flex items-center gap-2">
            <span className="text-base">⚔️</span>
            <span>파티 참여 신청</span>
          </h3>
          <button 
            type="button"
            onClick={() => setJoinPopupParty(null)} 
            className="text-[var(--text-sub)] hover:text-white font-bold text-base cursor-pointer p-1"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-0.5 min-h-0 overscroll-contain">
          
          {/* 🟡 [노란 영역 개편] 파티 정보 요약 카드의 컨텐츠 마크 SVG 변경 */}
          <div className="bg-[var(--inner-box)] border border-[var(--panel-border)] p-3 sm:p-3.5 rounded-xl space-y-2 text-xs shrink-0 shadow-xs">
            <div className="flex items-center justify-between font-black gap-2 min-w-0">
              <span className="text-[var(--accent)] text-xs flex items-center gap-1.5 truncate min-w-0">
                <MarkIcon src={contentMarkSrc} size="sm" scale={1.0} colorClass="bg-[var(--accent)]" />
                <span className="truncate font-black">{cleanContentName(joinPopupParty.content_name || joinPopupParty.sub_content || "목표 컨텐츠")}</span>
              </span>
              <span className="px-2 py-0.5 rounded bg-[var(--accent)]/15 border border-[var(--accent)]/40 text-[var(--accent)] text-[11px] shrink-0 font-black whitespace-nowrap">
                {joinPopupParty.difficulty || "난이도"}
              </span>
            </div>
            
            <div className="text-[var(--text-main)] font-bold text-xs flex items-center gap-2 pt-1 border-t border-[var(--panel-border)]/50 min-w-0">
              <span className="shrink-0 flex items-center gap-1 text-[var(--text-sub)] text-xs">
                <span>📅</span>
                <span>모집 일정:</span>
              </span>
              <span className="text-[var(--text-main)] font-extrabold tracking-tight truncate text-xs">
                {joinPopupParty.party_date ? joinPopupParty.party_date.slice(2) : "오늘"}
                ({getDayOfWeekKorean(joinPopupParty.party_date || todayStr)})
                <span className="text-[var(--text-sub)] font-normal mx-1">|</span>
                <span className="font-mono">{joinPopupParty.time_start || "18:00"} ~ {joinPopupParty.time_end || "00:00"}</span>
              </span>
            </div>
          </div>

          {/* 참여할 캐릭터 선택 영역 */}
          <div className="space-y-2 min-w-0">
            <label className="text-xs font-black text-[var(--text-main)] flex items-center gap-1.5 whitespace-nowrap leading-none">
              <MarkIcon src="/svgs/UI mark/사람 마크.svg" size="sm" scale={0.85} colorClass="bg-[var(--accent)]" />
              <span className="leading-none">참여할 캐릭터 선택</span>
            </label>
            <div className="grid grid-cols-3 gap-2 w-full min-w-0">
              {uniqueCharacters.map((char) => {
                const charName = char.nickname || char.name;
                const jobName = char.job || "전사";
                const isSelected = joinSelectedChar === charName;

                return (
                  <button
                    key={char.id || charName}
                    type="button"
                    onClick={() => setJoinSelectedChar(charName)}
                    className={`text-xs font-black py-2 px-1.5 rounded-xl transition cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5 border overflow-hidden min-w-0 tracking-tight shadow-xs ${
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

          {/* 내 플레이 가능 시간 설정 영역 */}
          <div className="space-y-2 min-w-0 pt-0.5">
            <label className="text-xs font-black text-[var(--text-main)] flex items-center gap-1.5 whitespace-nowrap leading-none">
              <MarkIcon src="/svgs/UI mark/달력 마크.svg" size="sm" scale={1.8} colorClass="bg-[var(--accent)]" />
              <span className="leading-none">내 플레이 가능 시간 설정</span>
            </label>
            
            <div className="bg-[var(--inner-box)] border border-[var(--panel-border)] p-3 sm:p-3.5 rounded-xl space-y-2.5 min-w-0">
              <div className="flex items-center justify-between gap-1 sm:gap-2 w-full min-w-0">
                <div className="flex items-center gap-1 flex-1 min-w-0">
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-xs">⏰</span>
                    <span className="text-xs font-bold text-[var(--text-sub)]">시작</span>
                  </div>
                  <CustomTimePicker
                    value={joinTimeStart || "18:00"}
                    onChange={(val) => setTimeStartJoin ? setTimeStartJoin(val) : null}
                  />
                </div>

                <span className="text-xs font-black text-[var(--text-sub)] shrink-0 px-0.5">~</span>

                <div className="flex items-center gap-1 flex-1 min-w-0">
                  <span className="text-xs font-bold text-[var(--text-sub)] shrink-0">종료</span>
                  <CustomTimePicker
                    value={joinTimeEnd || "00:00"}
                    onChange={(val) => setTimeEndJoin ? setTimeEndJoin(val) : null}
                  />
                </div>
              </div>

              {/* 🌸 [핑크 영역 개편] 1줄 고정 최적화 안내 텍스트 */}
              <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-[var(--text-sub)] bg-[var(--panel)]/70 p-2 sm:p-2.5 rounded-lg border border-[var(--panel-border)]/60 font-bold overflow-hidden min-w-0">
                <span className="text-amber-400 shrink-0 text-xs">💡</span>
                <span className="whitespace-nowrap truncate leading-tight">
                  출발 시간은 시스템이 자동으로 정해줍니다.
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* 모달 하단 버튼 */}
        <div className="flex gap-2 pt-2.5 border-t border-[var(--panel-border)] shrink-0">
          <button
            type="button"
            onClick={() => setJoinPopupParty(null)}
            className="flex-1 py-2.5 bg-[var(--inner-box)] border border-[var(--panel-border)] text-[var(--text-sub)] hover:text-white font-bold text-xs sm:text-sm rounded-xl cursor-pointer transition text-center"
          >
            취소
          </button>
          <button
            type="button"
            onClick={executeJoinParty}
            className="flex-2 py-3 bg-[var(--accent)] text-[var(--accent-fg)] font-black text-xs sm:text-sm rounded-xl cursor-pointer shadow-md hover:brightness-110 transition text-center"
          >
            ✨ 파티 참가!
          </button>
        </div>

      </div>
    </div>
  );
}