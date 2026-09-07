'use client';

import React, { useState } from 'react';
import ClassIcon from '@/components/common/ClassIcon';
import { 
  Party, 
  Member, 
  DIFFICULTY_COLORS 
} from '@/components/party/types';
import { 
  assembleBalancedParty, 
  syncKronosChecklist, 
  CONTENT_CP_REQUIREMENTS, 
  getRoleByJob,
  parseCP,
  BusCandidate
} from '@/lib/busUtils';

// ──────────────── 경량 SVG 아이콘 컴포넌트 ────────────────
const Users = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
);

const CheckCircle2 = ({ className, title }: { className?: string; title?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {title && <title>{title}</title>}
    <circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>
  </svg>
);

const RefreshCw = ({ className, title }: { className?: string; title?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {title && <title>{title}</title>}
    <path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/>
  </svg>
);

const Play = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="6 3 20 12 6 21 6 3"/></svg>
);

const Trash2 = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
);

const Shield = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>
);

const Heart = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
);

const ChevronDown = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
);

const ChevronUp = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
);

const Plus = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
);

const Crown = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.3 8.87a.5.5 0 0 0 .416.27l6.216.525a.5.5 0 0 1 .288.883l-4.69 4.14a.5.5 0 0 0-.153.472l1.378 6.07a.5.5 0 0 1-.747.543L12.5 18.5a.5.5 0 0 0-.499 0l-5.309 3.273a.5.5 0 0 1-.747-.543l1.378-6.07a.5.5 0 0 0-.153-.472L2.48 10.548a.5.5 0 0 1 .288-.883l6.216-.525a.5.5 0 0 0 .416-.27z"/></svg>
);

const Clock = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
);

const Sparkles = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.937A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .962 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.582a.5.5 0 0 1 0 .962L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.962 0z"/></svg>
);

const AlertCircle = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
);

const X = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
);

interface GuildBusCardProps {
  party: Party;
  currentUserNickname: string;
  currentUserRole?: string;
  onJoinClick: (party: Party) => void;
  onLeaveClick: (party: Party, charName?: string) => void;
  onDeleteClick: (partyId: string | number) => void;
  onNextRoundClick?: (party: Party, completedMembers: Member[]) => void;
  isMasterOrAdmin: boolean;
}

export default function GuildBusCard({
  party,
  currentUserNickname,
  currentUserRole,
  onJoinClick,
  onLeaveClick,
  onDeleteClick,
  onNextRoundClick,
  isMasterOrAdmin
}: GuildBusCardProps) {
  const [isPoolExpanded, setIsPoolExpanded] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // 1. 버스 참가자 데이터를 BusCandidate 규격으로 변환
  const candidates: BusCandidate[] = (party.members || []).map((m) => ({
    character_name: m.character_name || m.name,
    owner_account: m.account_id || m.owner || m.nickname || m.name,
    job: m.job,
    combat_power: parseCP(m.combat_power || m.cp),
    allow_repeat: m.allow_repeat || false,
    is_completed: m.is_completed || false,
    time_start: m.time_start,
    time_end: m.time_end
  }));

  // 2. 컨텐츠별 스펙 기준 가져오기
  const cpReqs = CONTENT_CP_REQUIREMENTS[party.content_name]?.[party.difficulty] || 
                 CONTENT_CP_REQUIREMENTS[party.sub_content || '']?.[party.difficulty];

  // 3. 8인 자동 밸런싱 알고리즘 실행
  const maxPartySize = party.max_members || 8;
  const { selected, remaining, hasHealer, hasTanker } = assembleBalancedParty(candidates, maxPartySize, cpReqs);

  // 현재 출전 파티원 8인 데이터
  const activeMembers = selected;
  // 남은 대기열 및 완료된 유저 데이터
  const poolMembers = remaining;

  // 4. [노란 영역 버그 수정] 안전한 평균 전투력 계산 (문자열 직렬화 방지)
  const avgCombatPower = activeMembers.length > 0
    ? Math.round(activeMembers.reduce((acc, cur) => acc + parseCP(cur.combat_power), 0) / activeMembers.length)
    : 0;

  // 관리자 및 방장 권한 체크
  const isLeader = party.leader_name === currentUserNickname;
  const canManage = isMasterOrAdmin || isLeader;

  // 5. 내 계정 캐릭터 목록 추출 (개별 캐릭터 탈퇴 컨트롤용)
  const myJoinedMembers = (party.members || []).filter((m) => {
    const charOwner = m.account_id || m.owner || m.nickname || m.name;
    const charName = m.character_name || m.name;
    return charName === currentUserNickname || charOwner === currentUserNickname;
  });
  const isMyAccountJoined = myJoinedMembers.length > 0;

  // 회차 완료 & KRONOS 동기화 처리
  const handleCompleteAndNextRound = async () => {
    if (activeMembers.length === 0) {
      alert("출전 파티원이 없습니다.");
      return;
    }

    if (!confirm(`현재 출전 중인 ${activeMembers.length}명의 KRONOS 숙제를 완료 처리하고 다음 회차 파티를 구성하시겠습니까?`)) {
      return;
    }

    setIsSyncing(true);
    try {
      const activeNames = activeMembers.map((m) => m.character_name);
      const contentType = party.party_type === "어비스" ? "abyss" : "raid";
      
      // KRONOS 정규화 숙제 자동 연동
      await syncKronosChecklist(activeNames, contentType, party.content_name);

      if (onNextRoundClick) {
        const completedMemberList = party.members.filter(m => activeNames.includes(m.character_name || m.name));
        onNextRoundClick(party, completedMemberList);
      }
    } catch (err) {
      console.error("회차 완수 처리 중 오류:", err);
      alert("KRONOS 동기화 중 오류가 발생했습니다.");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="w-full rounded-2xl border-2 border-[var(--accent)]/50 bg-[var(--panel)] p-4 sm:p-5 shadow-xl transition-all duration-200 hover:border-[var(--accent)] relative overflow-hidden">
      
      {/* ──────────────── 1. 버스 카드 헤더 ──────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--panel-border)] pb-3.5 mb-4">
        <div className="flex items-center gap-2.5 flex-wrap min-w-0">
          <span className="px-2.5 py-1 rounded-md text-xs font-black bg-[var(--accent)] text-black flex items-center gap-1 shrink-0">
            <Sparkles className="w-3.5 h-3.5" />
            길드버스
          </span>
          <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${DIFFICULTY_COLORS[party.difficulty] || 'bg-[var(--inner-box)] border-[var(--panel-border)] text-[var(--text-main)]'} shrink-0`}>
            {party.difficulty}
          </span>
          <h3 className="text-base sm:text-lg font-black text-[var(--text-main)] truncate max-w-[200px] sm:max-w-[280px]">
            {party.content_name}
          </h3>
        </div>

        <div className="flex items-center gap-3 text-xs text-[var(--text-main)] opacity-90 shrink-0">
          <div className="flex items-center gap-1 bg-[var(--inner-box)] px-2.5 py-1 rounded-md border border-[var(--panel-border)]">
            <Clock className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span className="font-bold">{party.time_start} ~ {party.time_end}</span>
          </div>
          <div className="flex items-center gap-1 bg-[var(--inner-box)] px-2.5 py-1 rounded-md border border-[var(--panel-border)]">
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-semibold truncate max-w-[80px]">{party.leader_name || '기사단장'}</span>
          </div>
        </div>
      </div>

      {party.sub_content && party.sub_content !== `[성역 길드 버스] ${party.content_name} (${party.difficulty}) 운행` && (
        <div className="mb-4 text-xs text-[var(--text-main)] opacity-90 bg-[var(--inner-box)] p-2.5 rounded-lg border border-[var(--panel-border)] flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-[var(--accent)] shrink-0" />
          <span className="truncate">{party.sub_content}</span>
        </div>
      )}

      {/* ──────────────── 2. [🎯 현재 회차 출전 8인 슬롯] ──────────────── */}
      <div className="mb-4 bg-[var(--inner-box)] rounded-xl p-3.5 border border-[var(--panel-border)]">
        
        {/* 상단 바: 파티 상태 요약 + [노란 영역 개선] 복구된 평균 전투력 */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2.5 border-b border-[var(--panel-border)]">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs sm:text-sm font-black text-[var(--text-main)] flex items-center gap-1.5">
              <span className="text-rose-400">🎯</span> 현재 회차 출전 파티 ({activeMembers.length} / {maxPartySize})
            </span>

            <div className="flex items-center gap-1.5 ml-1">
              <span className={`px-2 py-0.5 text-[11px] font-bold rounded-md border flex items-center gap-1 ${
                hasTanker 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                  : 'bg-zinc-800/60 border-zinc-700 text-zinc-500'
              }`}>
                <Shield className="w-3 h-3" />
                {hasTanker ? '탱커 확보' : '탱커 미확보'}
              </span>

              <span className={`px-2 py-0.5 text-[11px] font-bold rounded-md border flex items-center gap-1 ${
                hasHealer 
                  ? 'bg-teal-500/10 border-teal-500/30 text-teal-300' 
                  : 'bg-zinc-800/60 border-zinc-700 text-zinc-500'
              }`}>
                <Heart className="w-3 h-3" />
                {hasHealer ? '힐러 확보' : '힐러 미확보'}
              </span>
            </div>
          </div>

          {/* [노란 영역 개선] 세 자리 콤마 정수 평균 전투력 */}
          <div className="px-3 py-1 bg-[var(--panel)] border border-[var(--accent)]/40 rounded-xl flex items-center gap-1.5 shadow-inner">
            <span className="text-xs text-[var(--text-sub)] font-medium">평균 전투력</span>
            <span className="text-xs sm:text-sm font-black text-[var(--accent)] font-mono">
              {avgCombatPower > 0 ? avgCombatPower.toLocaleString() : "0"}
            </span>
          </div>
        </div>

        {/* [빨간 영역 개선] 직업명 제거 & 역할군/전투력 시인성 극대화 슬롯 그리드 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {Array.from({ length: maxPartySize }).map((_, index) => {
            const member = activeMembers[index];

            if (!member) {
              return (
                <div 
                  key={`empty-${index}`} 
                  className="h-[58px] rounded-xl border border-dashed border-[var(--panel-border)] bg-black/10 flex items-center justify-center text-xs text-[var(--text-sub)] font-bold"
                >
                  빈 출전 슬롯
                </div>
              );
            }

            const role = getRoleByJob(member.job);
            const cpNum = parseCP(member.combat_power);

            return (
              <div 
                key={`active-${member.character_name}-${index}`}
                className="h-[58px] rounded-xl border border-[var(--panel-border)] bg-[var(--panel)] p-2 flex items-center gap-2.5 relative overflow-hidden transition-all hover:border-[var(--accent)]/60 min-w-0"
              >
                {/* 좌측: 직업 아이콘 + 바로 밑 미니 역할군 뱃지 */}
                <div className="flex flex-col items-center justify-center shrink-0">
                  <div className="w-7 h-7 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center p-0.5">
                    <ClassIcon className="w-5 h-5 text-[var(--text-main)]" job={member.job} />
                  </div>
                  <span className="mt-0.5 px-1 py-0.2 text-[9px] font-black rounded bg-black/60 text-[var(--accent)] border border-[var(--accent)]/30 leading-none">
                    {role}
                  </span>
                </div>

                {/* 우측: 닉네임 (상단) + 전투력 (하단 골드/오렌지 강조) */}
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-black text-[var(--text-main)] truncate leading-tight">
                      {member.character_name}
                    </span>
                    {member.allow_repeat && (
                      <RefreshCw className="w-3 h-3 text-[var(--accent)] shrink-0" title="용병/반복 참여" />
                    )}
                  </div>
                  <div className="text-[11px] font-black text-amber-400 font-mono mt-0.5 leading-none">
                    {cpNum > 0 ? cpNum.toLocaleString() : "-"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 관리자 및 길드마스터 버스 제어 바 */}
      {canManage && (
        <div className="mb-4 p-3 rounded-xl bg-[var(--inner-box)] border border-[var(--panel-border)] flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs font-bold text-[var(--text-main)] flex items-center gap-1.5">
            <Crown className="w-4 h-4 text-amber-400" />
            <span>버스 통제 시스템</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleCompleteAndNextRound}
              disabled={isSyncing || activeMembers.length === 0}
              className="flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl text-xs font-black bg-[var(--accent)] text-black hover:brightness-110 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 shadow cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" />
              {isSyncing ? "KRONOS 동기화 중..." : "🎯 회차 완수 & KRONOS 연동"}
            </button>

            <button
              type="button"
              onClick={() => onDeleteClick(party.id)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20 transition-all flex items-center gap-1 cursor-pointer"
              title="버스 해산"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">해산</span>
            </button>
          </div>
        </div>
      )}

      {/* ──────────────── 3. [핑크 영역 개선] 전체 대기열 및 참전 풀 ──────────────── */}
      <div className="rounded-xl border border-[var(--panel-border)] bg-[var(--inner-box)] overflow-hidden">
        <button
          type="button"
          onClick={() => setIsPoolExpanded(!isPoolExpanded)}
          className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs font-bold text-[var(--text-main)] hover:bg-[var(--panel)]/50 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[var(--accent)]" />
            <span>📋 전체 대기열 및 참전 풀 ({party.members?.length || 0}명 등록 중)</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-[var(--accent)] font-bold">
            <span>{isPoolExpanded ? "접기" : "펼쳐보기"}</span>
            {isPoolExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {isPoolExpanded && (
          <div className="p-3 border-t border-[var(--panel-border)] bg-[var(--panel)]/30 space-y-2 animate-in fade-in duration-200">
            {poolMembers.length === 0 ? (
              <div className="text-center py-4 text-xs text-[var(--text-sub)] font-bold">
                현재 출전 중인 8인 외 대기 중인 다른 캐릭터가 없습니다.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {poolMembers.map((member, idx) => {
                  const role = getRoleByJob(member.job);
                  const cpVal = parseCP(member.combat_power);

                  return (
                    <div
                      key={`pool-${member.character_name}-${idx}`}
                      className="p-2 rounded-xl bg-[var(--inner-box)] border border-[var(--panel-border)] flex items-center justify-between text-xs transition hover:border-[var(--accent)]/50"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <ClassIcon className="w-4 h-4 text-[var(--text-main)] shrink-0" job={member.job} />
                        <span className="font-bold text-[var(--text-main)] truncate max-w-[90px]">
                          {member.character_name}
                        </span>
                        <span className="px-1.5 py-0.5 text-[9px] font-extrabold rounded bg-black/40 text-[var(--text-sub)] shrink-0">
                          {role}
                        </span>
                        {member.is_completed && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" title="클리어 완료" />
                        )}
                        {member.allow_repeat && (
                          <RefreshCw className="w-3 h-3 text-[var(--accent)] shrink-0" title="용병 가능" />
                        )}
                      </div>

                      <div className="font-mono font-bold text-[var(--accent)] text-[11px] shrink-0 ml-1">
                        {cpVal > 0 ? cpVal.toLocaleString() : "-"}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ──────────────── 4. [파란 영역 개선] 개별 캐릭터 탈퇴 컨트롤 ──────────────── */}
      <div className="mt-4 pt-3 border-t border-[var(--panel-border)] flex flex-wrap items-center justify-between gap-3">
        
        {/* 참여한 내 캐릭터 칩 및 개별 '✕' 탈퇴 버튼 */}
        <div className="flex items-center gap-2 flex-wrap min-w-0 flex-1">
          <span className="text-xs font-bold text-[var(--text-sub)] shrink-0">
            참여 상태: {isMyAccountJoined ? <strong className="text-emerald-400">참여 중 ({myJoinedMembers.length}개)</strong> : "미참여"}
          </span>

          {/* 내 참여 캐릭터별 개별 탈퇴 칩 */}
          {myJoinedMembers.map((myChar, idx) => {
            const charName = myChar.character_name || myChar.name;
            return (
              <span
                key={`joined-chip-${charName}-${idx}`}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[var(--inner-box)] border border-[var(--accent)]/50 rounded-xl text-xs font-bold text-[var(--text-main)] shadow-xs"
              >
                <span>{charName}</span>
                <button
                  type="button"
                  onClick={() => onLeaveClick(party, charName)}
                  className="w-4 h-4 rounded-full bg-rose-950/80 hover:bg-rose-600 text-rose-300 hover:text-white flex items-center justify-center text-[10px] transition cursor-pointer"
                  title={`${charName} 캐릭터만 파티 탈퇴`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })}
        </div>

        {/* 캐릭터 탑승 및 추가 버튼 */}
        <div className="flex items-center gap-2 shrink-0 ml-auto">
          <button
            type="button"
            onClick={() => onJoinClick(party)}
            className="px-4 py-2 bg-[var(--accent)] hover:brightness-110 text-[var(--accent-fg)] font-black text-xs rounded-xl shadow-md transition active:scale-95 cursor-pointer flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isMyAccountJoined ? '캐릭터 변경 / 추가' : '참여 신청'}</span>
          </button>
        </div>
      </div>

    </div>
  );
}