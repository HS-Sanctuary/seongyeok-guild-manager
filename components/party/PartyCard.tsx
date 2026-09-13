'use client';

import React, { useMemo } from 'react';
import ClassIcon from '@/components/common/ClassIcon';
import MarkIcon from '@/components/common/MarkIcon';
import { Party, DIFFICULTY_COLORS } from '@/components/party/types';
import { parseCP } from '@/lib/busUtils';
import {
  formatPartyTimeRange,
  getDayOfWeekKorean,
  normalizeDateStr,
  timeToMinutes,
  minutesToTime,
} from '@/lib/partyDateUtils';

// 모바일용 CP/MR 수치 만 단위 축약 유틸
const formatCPShort = (cp: number) => {
  if (!cp || cp <= 0) return "-";
  if (cp >= 10000) {
    const man = cp / 10000;
    return `${(Math.floor(man * 10) / 10).toFixed(1)}만`;
  }
  return cp.toLocaleString();
};

// 시간 오염 세척 안전 변환 함수
const safeTimeToMinutes = (timeStr: string | undefined, defaultVal: string): number => {
  if (!timeStr) return timeToMinutes(defaultVal);
  const cleaned = timeStr
    .replace(/\s*\(\+1일\)/g, "")
    .replace(/\s*다음날/g, "")
    .replace(/\s*\+\d+일/g, "")
    .trim();
  const mins = timeToMinutes(cleaned);
  return isNaN(mins) ? timeToMinutes(defaultVal) : mins;
};

export const getRoleByJob = (job: string): string => {
  if (!job) return "근딜";
  const j = job.trim();

  if (
    ["빙결술사", "빙결", "대검전사", "수호자", "수호기사", "기사", "성기사", "방패전사", "크루세이더", "디펜더"].some(
      (k) => j.includes(k)
    )
  ) {
    return "탱커";
  }
  if (
    ["사제", "수도사", "힐러", "성직자", "구원자", "복음사", "마도학자", "주술사", "프리스트", "클레릭", "비숍", "샤먼"].some(
      (k) => j.includes(k)
    )
  ) {
    return "힐러";
  }
  if (["음유시인", "바드", "악사", "서포터", "버퍼", "인챈터"].some((k) => j.includes(k))) {
    return "서포터";
  }
  if (
    [
      "장궁병",
      "궁수",
      "석궁수",
      "석궁사수",
      "마법사",
      "원소술사",
      "화염술사",
      "전격술사",
      "연금술사",
      "총사",
      "건슬링어",
      "암흑술사",
      "저격수",
      "스나이퍼",
      "아처",
      "메이지",
      "위저드",
    ].some((k) => j.includes(k))
  ) {
    return "원딜";
  }
  if (
    [
      "도적",
      "전사",
      "격투가",
      "듀얼블레이드",
      "듀얼블레이더",
      "듀블",
      "검사",
      "검술사",
      "창기사",
      "암살자",
      "댄서",
      "투사",
      "검성",
      "로그",
      "어쌔신",
      "버서커",
      "슬레이어",
    ].some((k) => j.includes(k))
  ) {
    return "근딜";
  }

  return "근딜";
};

const renderFormattedNickname = (name: string) => {
  if (!name) return null;
  const len = name.length;

  if (len <= 6) {
    const fontSizeClass =
      len <= 3
        ? "text-xs sm:text-sm font-black"
        : len <= 4
        ? "text-xs font-black"
        : "text-[11px] sm:text-xs font-black tracking-tighter";

    return (
      <span
        className={`text-[var(--text-main)] whitespace-nowrap leading-tight text-left block truncate ${fontSizeClass}`}
        title={name}
      >
        {name}
      </span>
    );
  }

  const line1 = name.slice(0, 6);
  const line2 = name.slice(6, 12);

  return (
    <div
      className="flex flex-col items-start justify-center text-left leading-tight text-[10px] sm:text-[11px] font-black text-[var(--text-main)] w-full min-w-0"
      title={name}
    >
      <span className="truncate w-full text-left">{line1}</span>
      <span className="truncate w-full text-left">{line2}</span>
    </div>
  );
};

const Crown = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.3 8.87a.5.5 0 0 0 .416.27l6.216.525a.5.5 0 0 1 .288.883l-4.69 4.14a.5.5 0 0 0-.153.472l1.378 6.07a.5.5 0 0 1-.747.543L12.5 18.5a.5.5 0 0 0-.499 0l-5.309 3.273a.5.5 0 0 1-.747-.543l1.378-6.07a.5.5 0 0 0-.153-.472L2.48 10.548a.5.5 0 0 1 .288-.883l6.216-.525a.5.5 0 0 0 .416-.27z"/></svg>
);

const UserPlus = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="16" x2="22" y1="11" y2="11"/></svg>
);

const Trash2 = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
);

const CheckCircle = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
);

interface PartyCardProps {
  party: Party;
  myCharacterNames: string[];
  allCharactersMap: Record<string, any>;
  openJoinPopup: (party: Party) => void;
  setInspectCharacter: (char: any) => void;
  handleLeaveParty: (party: Party, charName: string) => void;
  handleDeleteParty: (partyId: string | number) => void;
  onCompleteParty?: (party: Party) => void;
  isAdmin: boolean;
  onRefresh?: () => void;
}

export default function PartyCard({
  party,
  myCharacterNames,
  allCharactersMap,
  openJoinPopup,
  setInspectCharacter,
  handleLeaveParty,
  handleDeleteParty,
  onCompleteParty,
  isAdmin
}: PartyCardProps) {
  const isFull = party.members.length >= party.max_members;

  const joinedMyChars = party.members.filter(m => myCharacterNames.includes(m.name || m.character_name || ''));
  const isJoined = joinedMyChars.length > 0;

  // 🎯 컨텐츠 마크 SVG 경로 동적 계산 (레이드 vs 어비스)
  const contentMarkSrc = useMemo(() => {
    if (!party.content_name) return "/svgs/contens mark/레이드 마크.svg";
    const isAbyss = party.party_type === "어비스" || party.content_name.includes("어비스");
    return isAbyss
      ? "/svgs/contens mark/어비스 마크.svg"
      : "/svgs/contens mark/레이드 마크.svg";
  }, [party.content_name, party.party_type]);

  // 🎯 컨텐츠 명칭 정제 ("레이드 - ", "어비스 - ", "(통합)" 텍스트 분리)
  const displayContentName = useMemo(() => {
    if (!party.content_name) return "";
    return party.content_name
      .replace(/^(레이드|어비스)\s*-\s*/, "")
      .replace(/\s*\(통합\)/g, "")
      .trim();
  }, [party.content_name]);

  const handleForceDelete = () => {
    if (confirm("⚠️ 정말로 이 파티 모집을 강제 삭제하시겠습니까?\n삭제된 데이터는 복구할 수 없습니다.")) {
      handleDeleteParty(party.id);
    }
  };

  const rawDate = (party as any).party_date || (party as any).date || (party as any).created_at || '';
  
  const { formattedDateRange, formattedSingleDate } = useMemo(() => {
    if (!rawDate) return { formattedDateRange: '', formattedSingleDate: '날짜 미정' };
    const norm = normalizeDateStr(rawDate);
    const d1 = new Date(norm.includes('T') ? norm : `${norm}T00:00:00`);
    if (isNaN(d1.getTime())) return { formattedDateRange: rawDate, formattedSingleDate: rawDate };

    const m1 = String(d1.getMonth() + 1).padStart(2, '0');
    const day1 = String(d1.getDate()).padStart(2, '0');
    const dow1 = getDayOfWeekKorean(norm);

    const shortYear = String(d1.getFullYear()).slice(2);
    const single = `${shortYear}-${m1}-${day1} (${dow1})`;

    const d2 = new Date(d1);
    d2.setDate(d2.getDate() + 1);
    const m2 = String(d2.getMonth() + 1).padStart(2, '0');
    const day2 = String(d2.getDate()).padStart(2, '0');
    const dow2 = getDayOfWeekKorean(`${d2.getFullYear()}-${m2}-${day2}`);

    const range = m1 === m2
      ? `${m1}-${day1}(${dow1}) ~ ${day2}(${dow2})`
      : `${m1}-${day1}(${dow1}) ~ ${m2}-${day2}(${dow2})`;

    return { formattedDateRange: range, formattedSingleDate: single };
  }, [rawDate]);

  const dynamicTimeInfo = useMemo(() => {
    const defaultStart = party.time_start || "18:00";
    const defaultEnd = party.time_end || "20:00";

    if (!party.members || party.members.length === 0) {
      const { isNextDay } = formatPartyTimeRange(defaultStart, defaultEnd);
      return {
        startTime: defaultStart.replace(/\s*\(\+1일\)/g, "").replace(/\s*다음날/g, "").trim(),
        endTime: defaultEnd.replace(/\s*\(\+1일\)/g, "").replace(/\s*다음날/g, "").trim(),
        isNextDay,
        isFull: false,
        isConflict: false,
        finalDepartureTime: party.final_start_time || null,
        memberCount: 0,
      };
    }

    const ranges = party.members.map((m) => {
      const memAny = m as Record<string, any>;
      const rawStart = memAny.time_start || memAny.start_time || memAny.startTime || memAny.timeStart || defaultStart;
      const rawEnd = memAny.time_end || memAny.end_time || memAny.endTime || memAny.timeEnd || defaultEnd;

      let sM = safeTimeToMinutes(rawStart, defaultStart);
      let eM = safeTimeToMinutes(rawEnd, defaultEnd);

      if (eM <= sM && eM < 1440) {
        eM += 24 * 60;
      }

      return { sM, eM };
    });

    let maxStartMins = 0;
    let minEndMins = 48 * 60;

    ranges.forEach((r) => {
      if (r.sM > maxStartMins) maxStartMins = r.sM;
      if (r.eM < minEndMins) minEndMins = r.eM;
    });

    const isConflict = maxStartMins >= minEndMins;
    const isCompleted =
      party.members.length >= party.max_members ||
      party.status === "completed" ||
      party.status === "매칭완료";

    if (isConflict) {
      const { isNextDay } = formatPartyTimeRange(defaultStart, defaultEnd);
      return {
        startTime: defaultStart.replace(/\s*\(\+1일\)/g, "").replace(/\s*다음날/g, "").trim(),
        endTime: defaultEnd.replace(/\s*\(\+1일\)/g, "").replace(/\s*다음날/g, "").trim(),
        isNextDay,
        isFull: isCompleted,
        isConflict: true,
        finalDepartureTime: null,
        memberCount: party.members.length,
      };
    }

    const startMinsNormalized = maxStartMins % (24 * 60);
    const endMinsNormalized = minEndMins % (24 * 60);

    const overlapStartStr = minutesToTime(startMinsNormalized);
    const overlapEndStr = minutesToTime(endMinsNormalized);

    const isNextDay = minEndMins >= 24 * 60 || endMinsNormalized < startMinsNormalized;

    let optimalDepartureTime: string | null = party.final_start_time || null;

    if (!optimalDepartureTime && isCompleted) {
      const midMins = Math.floor((maxStartMins + minEndMins) / 2);
      const roundedMid = Math.round(midMins / 5) * 5;
      optimalDepartureTime = minutesToTime(roundedMid % (24 * 60));
    }

    return {
      startTime: overlapStartStr,
      endTime: overlapEndStr,
      isNextDay,
      isFull: isCompleted,
      isConflict: false,
      finalDepartureTime: optimalDepartureTime,
      memberCount: party.members.length,
    };
  }, [
    party.members,
    party.max_members,
    party.time_start,
    party.time_end,
    party.status,
    party.final_start_time,
  ]);

  const leaderMemberName = useMemo(() => {
    if (!party.members || party.members.length === 0) return party.leader_name || '';

    let maxCP = -1;
    let leaderName = party.members[0]?.character_name || party.members[0]?.name || party.leader_name || '';

    party.members.forEach((m) => {
      const memName = m.character_name || m.name;
      const charObj = allCharactersMap[memName] || {};
      const rawCP = m.combat_power || charObj.combat_power || 0;
      const cp = parseCP(rawCP);

      if (cp > maxCP) {
        maxCP = cp;
        leaderName = memName;
      }
    });

    return leaderName;
  }, [party.members, party.leader_name, allCharactersMap]);

  return (
    <div className="w-full rounded-2xl border border-[var(--panel-border)] border-t-4 border-t-[var(--accent)] bg-[var(--panel)] p-3.5 sm:p-5 shadow-lg transition-all duration-200 hover:border-[var(--accent)] relative overflow-hidden">
      
      {/* 카드 헤더 래퍼 */}
      <div className="-mx-3.5 -mt-3.5 sm:-mx-5 sm:-mt-5 p-3.5 sm:p-4 bg-[var(--inner-box)] border-b border-[var(--panel-border)] rounded-t-2xl mb-3.5 flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
            <span className={`px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-black border ${DIFFICULTY_COLORS[party.difficulty] || 'bg-[var(--panel)] border-[var(--panel-border)] text-[var(--text-main)]'} shrink-0`}>
              {party.difficulty}
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] sm:text-[11px] font-bold bg-[var(--panel)] text-[var(--text-sub)] border border-[var(--panel-border)] shrink-0">
              {party.party_type}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {!isFull && !isJoined && (
              <button
                type="button"
                onClick={() => openJoinPopup(party)}
                className="px-2.5 sm:px-3 py-1 bg-[var(--accent)] hover:brightness-110 text-[var(--accent-fg)] font-black text-xs sm:text-sm rounded-xl shadow-md transition active:scale-95 cursor-pointer flex items-center gap-1 shrink-0"
              >
                <UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>신청</span>
              </button>
            )}

            {isJoined && (
              <span className="px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs sm:text-sm font-black flex items-center gap-1.5 shrink-0">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                참여 중
              </span>
            )}

            {(isJoined || isAdmin) && onCompleteParty && (
              <button
                type="button"
                onClick={() => onCompleteParty(party)}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm rounded-xl shadow-md transition active:scale-95 cursor-pointer flex items-center gap-1 shrink-0"
                title="던전 클리어 처리 및 KRONOS 숙제 자동 연동"
              >
                <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>완료</span>
              </button>
            )}
          </div>
        </div>

        {/* 🎯 컨텐츠 제목 영역: SVG 마크 아이콘 + 정제된 컨텐츠 이름 */}
        <div className="w-full min-w-0 py-0.5 flex items-center gap-1.5 sm:gap-2">
          <MarkIcon src={contentMarkSrc} size="xs" scale={1.15} colorClass="bg-[var(--accent)]" />
          <h3 className="text-base sm:text-lg md:text-xl font-black text-[var(--text-main)] whitespace-nowrap overflow-hidden text-ellipsis tracking-tight leading-snug">
            {displayContentName}
          </h3>
        </div>

        {/* 희망 시간 영역 */}
        <div className="flex items-center justify-start w-full pt-0.5 min-w-0">
          {dynamicTimeInfo.isConflict ? (
            <div className="inline-flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/40 px-2.5 py-1 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 shadow-xs max-w-full min-w-0 overflow-hidden">
              <span className="shrink-0">⚠️</span>
              <span className="font-sans font-black truncate">시간대 불일치 (조율 필요)</span>
            </div>
          ) : dynamicTimeInfo.isFull && dynamicTimeInfo.finalDepartureTime ? (
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-indigo-500/10 border border-amber-400/50 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl font-mono text-[clamp(10px,2.8vw,12px)] sm:text-xs font-black text-amber-600 dark:text-amber-400 shadow-xs max-w-full min-w-0 overflow-hidden">
              <span className="text-xs sm:text-sm shrink-0 animate-bounce">🎉</span>
              <span className="whitespace-nowrap font-sans font-black text-amber-600 dark:text-amber-400">출발 시간 확정!</span>
              <span className="text-[var(--accent-fg)] bg-[var(--accent)] px-2 py-0.5 rounded-md border border-[var(--accent)] font-mono font-black text-xs sm:text-sm shadow-xs shrink-0">
                {dynamicTimeInfo.finalDepartureTime}
              </span>
              <span className="text-[9px] sm:text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.5 rounded font-sans shrink-0 font-extrabold whitespace-nowrap">
                매칭 완료 ({party.members.length}/{party.max_members}명)
              </span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1 sm:gap-1.5 bg-[var(--panel)] px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl border border-[var(--panel-border)] text-[clamp(9.5px,2.8vw,12px)] sm:text-xs font-mono font-extrabold shadow-xs max-w-full min-w-0 overflow-hidden">
              {dynamicTimeInfo.isNextDay ? (
                <div className="flex items-center gap-1 sm:gap-1.5 font-bold text-[var(--text-main)] whitespace-nowrap min-w-0 tracking-tighter sm:tracking-normal">
                  <span className="text-[var(--accent)] font-sans font-black">
                    {formattedDateRange}
                  </span>
                  <span className="text-[var(--text-sub)] font-bold shrink-0">|</span>
                  <span className="font-mono font-black text-[var(--text-main)]">
                    {dynamicTimeInfo.startTime} ~ {dynamicTimeInfo.endTime}
                  </span>
                  <span className="text-[8.5px] sm:text-[10px] bg-[var(--accent)]/20 text-[var(--accent)] border border-[var(--accent)]/40 px-1 py-0.2 rounded font-sans shrink-0 font-bold ml-0.5">
                    🌙 다음 날
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 sm:gap-2 font-bold text-[var(--text-main)] whitespace-nowrap min-w-0 tracking-tighter sm:tracking-normal">
                  <span className="text-[var(--accent)] font-black">
                    {formattedSingleDate}
                  </span>
                  <span className="text-[var(--text-sub)] font-bold shrink-0">|</span>
                  <span className="font-mono font-black text-[var(--text-main)]">
                    {dynamicTimeInfo.startTime} ~ {dynamicTimeInfo.endTime}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {party.sub_content && (
        <div className="mb-3 text-xs text-[var(--text-sub)] bg-[var(--inner-box)] p-2 rounded-xl border border-[var(--panel-border)] truncate">
          💬 {party.sub_content}
        </div>
      )}

      {/* 파티원 슬롯 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3.5">
        {Array.from({ length: party.max_members }).map((_, index) => {
          const member = party.members[index];

          if (!member) {
            return (
              <div 
                key={`empty-${index}`} 
                className="min-h-[108px] sm:min-h-[112px] rounded-xl border border-dashed border-[var(--panel-border)] bg-[var(--inner-box)]/30 flex items-center justify-center text-xs text-[var(--text-sub)] font-bold"
              >
                빈 슬롯
              </div>
            );
          }

          const memName = member.character_name || member.name;
          const charObj = allCharactersMap[memName] || {};
          
          const rawJob = member.job || charObj.job || (member as any).class_name || charObj.class_name || '';
          
          const rawExplicitRole = member.role || (member.roles && member.roles[0]) || charObj.role || (charObj.roles && charObj.roles[0]);
          const explicitRole = typeof rawExplicitRole === "string" ? rawExplicitRole.trim() : "";

          const role = (explicitRole && ["탱커", "힐러", "원딜", "근딜", "서포터"].includes(explicitRole))
            ? explicitRole
            : getRoleByJob(rawJob);

          const cp = parseCP(member.combat_power || charObj.combat_power || 0);
          const mr = parseCP(member.magic_resistance || charObj.magic_resistance || 0);
          
          const isLeader = memName === leaderMemberName;

          const memAny = member as Record<string, any>;
          const memStart = (memAny.time_start || memAny.start_time || memAny.startTime || memAny.timeStart || party.time_start || "18:00").replace(/\s*\(\+1일\)/g, "").trim();
          const memEnd = (memAny.time_end || memAny.end_time || memAny.endTime || memAny.timeEnd || party.time_end || "20:00").replace(/\s*\(\+1일\)/g, "").trim();

          return (
            <div
              key={`mem-${memName}-${index}`}
              onClick={() => (charObj.nickname || charObj.name) && setInspectCharacter(charObj)}
              className={`min-h-[108px] sm:min-h-[112px] rounded-xl border ${isLeader ? 'border-amber-500/60 bg-amber-500/10' : 'border-[var(--panel-border)] bg-[var(--inner-box)]'} p-2 sm:p-2.5 flex items-center gap-2 relative overflow-hidden transition hover:border-[var(--accent)] cursor-pointer min-w-0 shadow-xs`}
            >
              <div className="flex flex-col items-center justify-center shrink-0">
                <div className={`w-7 sm:w-8 h-7 sm:h-8 rounded-lg bg-[var(--panel)] border ${isLeader ? 'border-amber-400 ring-2 ring-amber-500/30' : 'border-[var(--panel-border)]'} flex items-center justify-center p-0.5 shadow-inner relative`}>
                  <ClassIcon className="w-5 h-5 text-[var(--text-main)]" job={rawJob} />
                  {isLeader && (
                    <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-zinc-950 p-0.5 rounded-full shadow-md leading-none border border-amber-600" title="파티장 (최고 전투력)">
                      <Crown className="w-2.5 h-2.5 fill-zinc-950 text-zinc-950" />
                    </span>
                  )}
                </div>
                <span className="mt-1 px-1.5 py-0.5 text-[9px] font-black rounded bg-[var(--accent)] text-[var(--accent-fg)] leading-none whitespace-nowrap shadow-xs">
                  {role}
                </span>
              </div>

              <div className="flex-1 min-w-0 flex flex-col justify-center gap-1 py-0.5">
                <div className="min-w-0 flex items-center justify-start w-full">
                  {renderFormattedNickname(memName)}
                </div>

                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-mono font-black text-xs sm:text-sm whitespace-nowrap leading-none">
                    <MarkIcon src="/svgs/status mark/전투력 마크.svg" size="xs" scale={0.9} colorClass="bg-amber-600 dark:bg-amber-400" />
                    <span className="truncate text-xs sm:text-sm font-black font-mono tracking-tight">
                      <span className="sm:hidden">{formatCPShort(cp)}</span>
                      <span className="hidden sm:inline">{cp > 0 ? cp.toLocaleString() : "-"}</span>
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1.5 text-purple-700 dark:text-purple-400 font-mono font-black text-xs sm:text-sm whitespace-nowrap leading-none">
                    <MarkIcon src="/svgs/status mark/마도저항 마크.svg" size="xs" scale={0.85} colorClass="bg-purple-600 dark:bg-purple-400" />
                    <span className="truncate text-xs sm:text-sm font-black font-mono tracking-tight">
                      <span className="sm:hidden">{formatCPShort(mr)}</span>
                      <span className="hidden sm:inline">{mr > 0 ? mr.toLocaleString() : "-"}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-0.5 text-[9.5px] sm:text-[10px] text-[var(--text-sub)] font-mono truncate leading-none pt-1 border-t border-[var(--panel-border)]">
                    <span className="opacity-70 text-[8px]">⏱️</span>
                    <span className="truncate font-semibold">{memStart}~{memEnd}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 하단 제어 버튼 */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-[var(--panel-border)] text-xs">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          {joinedMyChars.map((m, idx) => {
            const cName = m.character_name || m.name;
            return (
              <button
                key={`leave-${cName}-${idx}`}
                type="button"
                onClick={() => handleLeaveParty(party, cName)}
                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-black border border-rose-700 rounded-lg transition cursor-pointer text-[11px] shadow-xs active:scale-95"
              >
                [{cName}] 탈퇴
              </button>
            );
          })}
        </div>

        {isAdmin && (
          <div className="ml-auto shrink-0">
            <button
              type="button"
              onClick={handleForceDelete}
              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black border border-amber-600 shadow-xs transition cursor-pointer text-[11px] rounded-lg flex items-center gap-1 active:scale-95"
              title="관리자 권한 파티 강제 삭제"
            >
              <Trash2 className="w-3 h-3 text-zinc-950" />
              <span className="text-zinc-950">강제 삭제</span>
            </button>
          </div>
        )}
      </div>

    </div>
  );
}