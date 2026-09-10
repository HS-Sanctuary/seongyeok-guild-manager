'use client';

import React, { useMemo } from 'react';
import ClassIcon from '@/components/common/ClassIcon';
import { Party, DIFFICULTY_COLORS } from '@/components/party/types';
import { getRoleByJob, parseCP } from '@/lib/busUtils';
import { formatPartyTimeRange, getDayOfWeekKorean, normalizeDateStr } from '@/lib/partyDateUtils';

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

  const handleForceDelete = () => {
    if (confirm("⚠️ 정말로 이 파티 모집을 강제 삭제하시겠습니까?\n삭제된 데이터는 복구할 수 없습니다.")) {
      handleDeleteParty(party.id);
    }
  };

  // 1. 파티 시간 범주 및 다음 날 여부 판별
  const { isNextDay } = formatPartyTimeRange(party.time_start, party.time_end);

  // 2. 파티 일시 디스플레이 양식 생성
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

    // 같은 달이면 월(Month) 생략하여 '09-11(금) ~ 12(토)'로 단축, 달이 바뀌면 '09-30(화) ~ 10-01(수)' 표기
    const range = m1 === m2
      ? `${m1}-${day1}(${dow1}) ~ ${day2}(${dow2})`
      : `${m1}-${day1}(${dow1}) ~ ${m2}-${day2}(${dow2})`;

    return { formattedDateRange: range, formattedSingleDate: single };
  }, [rawDate]);

  // 3. 최고 전투력(CP) 파티원 자동 산출 ➔ 파티장(👑) 지정
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
    <div className="w-full rounded-2xl border border-zinc-700/80 border-t-4 border-t-indigo-500/80 bg-[var(--panel)] p-3.5 sm:p-5 shadow-[0_10px_30px_rgba(0,0,0,0.8)] transition-all duration-200 hover:border-indigo-400/80 relative overflow-hidden">
      
      {/* ──────────────── 1. 파티 카드 헤더 ──────────────── */}
      <div className="-mx-3.5 -mt-3.5 sm:-mx-5 sm:-mt-5 p-3.5 sm:p-4 bg-zinc-950/90 border-b border-zinc-800 rounded-t-2xl mb-3.5 flex flex-col gap-2">
        
        {/* 1열: [난이도 / 유형 뱃지] VS [신청 / 참여 중 / 완료 버튼] */}
        <div className="flex items-center justify-between gap-2 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
            <span className={`px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-black border ${DIFFICULTY_COLORS[party.difficulty] || 'bg-zinc-800 border-zinc-700 text-zinc-200'} shrink-0`}>
              {party.difficulty}
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] sm:text-[11px] font-bold bg-zinc-900 text-zinc-400 border border-zinc-800 shrink-0">
              {party.party_type}
            </span>
          </div>

          {/* 우측 상단 액션 버튼 그룹 */}
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
              <span className="px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs sm:text-sm font-black flex items-center gap-1.5 shrink-0">
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

        {/* 2열: 던전명 단독 행 */}
        <div className="w-full min-w-0 py-0.5">
          <h3 className="text-base sm:text-lg md:text-xl font-black text-white whitespace-nowrap overflow-hidden text-ellipsis tracking-tight leading-snug">
            {party.content_name}
          </h3>
        </div>

        {/* 3열: 날짜 & 시간 디스플레이 바 (아이콘 완전 제거 및 fluid clamp 폰트 축소 적용) */}
        <div className="flex items-center justify-start w-full pt-0.5 min-w-0">
          <div className="inline-flex items-center gap-1 sm:gap-1.5 bg-black/80 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl border border-zinc-800/80 text-[clamp(9.5px,2.8vw,12px)] sm:text-xs font-mono font-extrabold shadow-sm max-w-full min-w-0 overflow-hidden">
            {isNextDay ? (
              <div className="flex items-center gap-1 sm:gap-1.5 font-bold text-white whitespace-nowrap min-w-0 tracking-tighter sm:tracking-normal">
                <span className="text-[var(--accent)] font-sans font-black">
                  {formattedDateRange}
                </span>
                <span className="text-zinc-600 font-bold shrink-0">|</span>
                <span className="font-mono font-black text-white">
                  {party.time_start} ~ {party.time_end}
                </span>
                <span className="text-[8.5px] sm:text-[10px] bg-indigo-900/80 text-indigo-200 border border-indigo-500/50 px-1 py-0.2 rounded font-sans shrink-0 font-bold ml-0.5">
                  🌙 다음 날
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2 font-bold text-white whitespace-nowrap min-w-0 tracking-tighter sm:tracking-normal">
                <span className="text-[var(--accent)] font-black">
                  {formattedSingleDate}
                </span>
                <span className="text-zinc-600 font-bold shrink-0">|</span>
                <span className="font-mono font-black text-white">
                  {party.time_start} ~ {party.time_end}
                </span>
              </div>
            )}
          </div>
        </div>

      </div>

      {party.sub_content && (
        <div className="mb-3 text-xs text-[var(--text-sub)] bg-[var(--inner-box)] p-2 rounded-xl border border-[var(--panel-border)] truncate">
          💬 {party.sub_content}
        </div>
      )}

      {/* ──────────────── 2. 참가자 슬롯 ──────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3.5">
        {Array.from({ length: party.max_members }).map((_, index) => {
          const member = party.members[index];

          if (!member) {
            return (
              <div 
                key={`empty-${index}`} 
                className="h-[84px] rounded-xl border border-dashed border-zinc-800 bg-black/20 flex items-center justify-center text-xs text-zinc-500 font-bold"
              >
                빈 슬롯
              </div>
            );
          }

          const memName = member.character_name || member.name;
          const charObj = allCharactersMap[memName] || {};
          const role = member.role || getRoleByJob(member.job);
          const cp = parseCP(member.combat_power || charObj.combat_power || 0);
          const mr = parseCP(member.magic_resistance || charObj.magic_resistance || 0);
          const aliasTag = charObj.tempAlias || charObj.alias;
          
          // 최고 전투력 파티장 판별
          const isLeader = memName === leaderMemberName;

          // 닉네임과 애칭이 같으면 애칭 뱃지 노출 안함
          const showAlias = aliasTag && aliasTag !== memName;

          // 글자 수에 따른 폰트 방어 스케일링
          const nameLen = memName.length;
          const fontScaleClass = nameLen > 8 ? "text-[10px] tracking-tighter" : "text-xs font-black";

          return (
            <div
              key={`mem-${memName}-${index}`}
              onClick={() => (charObj.nickname || charObj.name) && setInspectCharacter(charObj)}
              className={`h-[84px] rounded-xl border ${isLeader ? 'border-amber-500/60 bg-amber-950/20' : 'border-zinc-800 bg-zinc-900/60'} p-2.5 flex items-center gap-2.5 relative overflow-hidden transition hover:border-[var(--accent)]/60 cursor-pointer min-w-0 shadow-xs`}
            >
              {/* 좌측: 직업 초상화 (파티장 👑 미니 뱃지) & 포지션 */}
              <div className="flex flex-col items-center justify-center shrink-0">
                <div className={`w-8 h-8 rounded-lg bg-black/60 border ${isLeader ? 'border-amber-400 ring-2 ring-amber-500/30' : 'border-white/10'} flex items-center justify-center p-0.5 shadow-inner relative`}>
                  <ClassIcon className="w-5 h-5 text-white" job={member.job} />
                  {isLeader && (
                    <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-black p-0.5 rounded-full shadow-md leading-none border border-black" title="파티장 (최고 전투력)">
                      <Crown className="w-2.5 h-2.5 fill-amber-950 text-amber-950" />
                    </span>
                  )}
                </div>
                <span className={`mt-1 px-1 py-0.2 text-[9px] font-black rounded ${isLeader ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-black/70 text-[var(--accent)] border border-[var(--accent)]/40'} leading-none`}>
                  {role}
                </span>
              </div>

              {/* 우측: 닉네임 & 스탯 정보 */}
              <div className="flex-1 min-w-0 flex flex-col justify-between h-full py-0.5">
                <div className="flex items-center gap-1 min-w-0">
                  <span className={`text-white truncate leading-tight ${fontScaleClass}`} title={memName}>
                    {memName}
                  </span>
                  {showAlias && (
                    <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0 leading-none">
                      {aliasTag}
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-0.5 min-w-0">
                  <div className="flex items-center gap-1 text-amber-300 font-mono font-extrabold text-[10px] sm:text-[11px] whitespace-nowrap leading-none">
                    <span className="text-[9px] shrink-0 opacity-80">⚔️</span>
                    <span className="truncate">{cp > 0 ? cp.toLocaleString() : "-"}</span>
                  </div>
                  <div className="flex items-center gap-1 text-purple-300 font-mono font-bold text-[9px] sm:text-[10px] whitespace-nowrap leading-none">
                    <span className="text-[8px] shrink-0 opacity-80">🔮</span>
                    <span className="truncate">{mr > 0 ? mr.toLocaleString() : "-"}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ──────────────── 3. 하단 탈퇴 & 강제 삭제 ──────────────── */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-[var(--panel-border)] text-xs">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          {joinedMyChars.map((m, idx) => {
            const cName = m.character_name || m.name;
            return (
              <button
                key={`leave-${cName}-${idx}`}
                type="button"
                onClick={() => handleLeaveParty(party, cName)}
                className="px-2.5 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/30 rounded-lg font-bold hover:bg-rose-500/20 transition cursor-pointer text-[11px]"
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
              className="px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 transition cursor-pointer text-[11px] font-bold rounded-lg flex items-center gap-1"
              title="관리자 권한 파티 강제 삭제"
            >
              <Trash2 className="w-3 h-3 text-amber-400" />
              <span>강제 삭제</span>
            </button>
          </div>
        )}
      </div>

    </div>
  );
}