'use client';

import React from 'react';
import ClassIcon from '@/components/common/ClassIcon';
import { Party, DIFFICULTY_COLORS } from '@/components/party/types';
import { getRoleByJob, getShortNickname, parseCP } from '@/lib/busUtils';

const Clock = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 16"/></svg>
);

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

  return (
    <div className="w-full rounded-2xl border border-zinc-700/80 border-t-4 border-t-indigo-500/80 bg-[var(--panel)] p-4 sm:p-5 shadow-[0_10px_30px_rgba(0,0,0,0.8)] transition-all duration-200 hover:border-indigo-400/80 relative overflow-hidden">
      
      {/* ──────────────── 1. 파티 카드 헤더 ──────────────── */}
      <div className="-mx-4 -mt-4 sm:-mx-5 sm:-mt-5 p-3.5 sm:p-4 bg-zinc-950/70 border-b border-zinc-800 rounded-t-2xl mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-wrap min-w-0">
          <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${DIFFICULTY_COLORS[party.difficulty] || 'bg-[var(--inner-box)] border-[var(--panel-border)] text-[var(--text-main)]'} shrink-0`}>
            {party.difficulty}
          </span>
          <h3 className="text-base sm:text-lg font-black text-[var(--text-main)] truncate max-w-[200px] sm:max-w-[280px]">
            {party.content_name}
          </h3>
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[var(--inner-box)] text-[var(--text-sub)] border border-[var(--panel-border)] shrink-0">
            {party.party_type}
          </span>
        </div>

        {/* 상단 우측: 시간 / 방장 / 파티신청 / 던전 완료 버튼 */}
        <div className="flex items-center gap-2.5 text-xs text-[var(--text-main)] shrink-0 flex-wrap">
          <div className="flex items-center gap-1 bg-black/50 px-2.5 py-1 rounded-md border border-white/10">
            <Clock className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span className="font-bold">{party.time_start} ~ {party.time_end}</span>
          </div>

          <div className="flex items-center gap-1 bg-black/50 px-2.5 py-1 rounded-md border border-white/10">
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-semibold truncate max-w-[70px]">{getShortNickname(party.leader_name || '방장')}</span>
          </div>

          {!isFull && !isJoined && (
            <button
              type="button"
              onClick={() => openJoinPopup(party)}
              className="px-3.5 py-1.5 bg-[var(--accent)] hover:brightness-110 text-[var(--accent-fg)] font-black text-xs rounded-xl shadow-md transition active:scale-95 cursor-pointer flex items-center gap-1"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>파티 신청</span>
            </button>
          )}

          {isJoined && (
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
              참여 중
            </span>
          )}

          {/* 파티 완료 (클리어) 버튼 - 참여 중이거나 방장/관리자일 때 활성화 */}
          {(isJoined || isAdmin) && onCompleteParty && (
            <button
              type="button"
              onClick={() => onCompleteParty(party)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-md transition active:scale-95 cursor-pointer flex items-center gap-1"
              title="던전 클리어 처리 및 KRONOS 숙제 자동 연동"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>던전 완료</span>
            </button>
          )}
        </div>
      </div>

      {party.sub_content && (
        <div className="mb-3.5 text-xs text-[var(--text-sub)] bg-[var(--inner-box)] p-2.5 rounded-lg border border-[var(--panel-border)] truncate">
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
                className="h-[62px] rounded-xl border border-dashed border-[var(--panel-border)] bg-black/10 flex items-center justify-center text-xs text-[var(--text-sub)] font-bold"
              >
                빈 슬롯
              </div>
            );
          }

          const memName = member.character_name || member.name;
          const charObj = allCharactersMap[memName] || {};
          const shortName = getShortNickname(memName);
          const role = member.role || getRoleByJob(member.job);
          const cp = parseCP(member.combat_power || charObj.combat_power || 0);
          const mr = parseCP(member.magic_resistance || charObj.magic_resistance || 0);

          return (
            <div
              key={`mem-${memName}-${index}`}
              onClick={() => charObj.nickname && setInspectCharacter(charObj)}
              className="h-[62px] rounded-xl border border-[var(--panel-border)] bg-[var(--inner-box)] p-2 flex items-center gap-2 relative overflow-hidden transition hover:border-[var(--accent)]/60 cursor-pointer min-w-0"
            >
              <div className="flex flex-col items-center justify-center shrink-0">
                <div className="w-7 h-7 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center p-0.5">
                  <ClassIcon className="w-5 h-5 text-[var(--text-main)]" job={member.job} />
                </div>
                <span className="mt-0.5 px-1 py-0.2 text-[9px] font-black rounded bg-black/60 text-[var(--accent)] border border-[var(--accent)]/30 leading-none">
                  {role}
                </span>
              </div>

              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className="text-xs font-black text-[var(--text-main)] truncate leading-tight">
                  {shortName}
                </div>
                <div className="text-[10px] font-mono font-bold text-amber-400 mt-0.5 leading-none">
                  전투력 {cp > 0 ? cp.toLocaleString() : "-"}
                </div>
                <div className="text-[9px] font-mono text-[var(--text-sub)] mt-0.5 leading-none">
                  마도저항 {mr > 0 ? mr.toLocaleString() : "-"}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ──────────────── 3. 하단 탈퇴 & 관리자 파티 강제 삭제 ──────────────── */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-[var(--panel-border)] text-xs">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          {joinedMyChars.map((m, idx) => {
            const cName = m.character_name || m.name;
            return (
              <button
                key={`leave-${cName}-${idx}`}
                type="button"
                onClick={() => handleLeaveParty(party, cName)}
                className="px-2.5 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/30 rounded-lg font-bold hover:bg-rose-500/20 transition cursor-pointer"
              >
                [{getShortNickname(cName)}] 탈퇴
              </button>
            );
          })}
        </div>

        {isAdmin && (
          <div className="ml-auto shrink-0">
            <button
              type="button"
              onClick={handleForceDelete}
              className="px-3 py-1 rounded-lg text-xs font-bold bg-rose-950/60 text-rose-300 border border-rose-500/40 hover:bg-rose-900 transition flex items-center gap-1 cursor-pointer"
              title="관리자 권한 파티 강제 삭제"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>파티 강제 삭제</span>
            </button>
          </div>
        )}
      </div>

    </div>
  );
}