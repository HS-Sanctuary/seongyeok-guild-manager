'use client';

import React, { useState, useEffect, useMemo } from 'react';
import ClassIcon from '@/components/common/ClassIcon';
import MarkIcon from '@/components/common/MarkIcon';
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
  getShortNickname,
  parseCP,
  BusCandidate 
} from '@/lib/busUtils';
import { supabase } from '@/lib/supabase';
import PoolStatusModal from '@/components/party/modals/PoolStatusModal';

const Users = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
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

const Plus = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
);

const Crown = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.3 8.87a.5.5 0 0 0 .416.27l6.216.525a.5.5 0 0 1 .288.883l-4.69 4.14a.5.5 0 0 0-.153.472l1.378 6.07a.5.5 0 0 1-.747.543L12.5 18.5a.5.5 0 0 0-.499 0l-5.309 3.273a.5.5 0 0 1-.747-.543l1.378-6.07a.5.5 0 0 0-.153-.472L2.48 10.548a.5.5 0 0 1 .288-.883l6.216-.525a.5.5 0 0 0 .416-.27z"/></svg>
);

const UserCheck = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>
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

const formatCPShort = (cp: number) => {
  if (!cp || cp <= 0) return "-";
  if (cp >= 10000) {
    const man = cp / 10000;
    return `${(Math.floor(man * 10) / 10).toFixed(1)}만`;
  }
  return cp.toLocaleString();
};

const getDisplayName = (m: any) => {
  const alias = m.alias || m.tempAlias;
  if (alias && alias !== "EMPTY" && alias !== "NULL" && alias.trim() !== "") {
    return alias.trim().slice(0, 3);
  }
  const rawName = m.character_name || m.name || m.nickname || "";
  return getShortNickname(rawName).slice(0, 3);
};

interface GuildBusCardProps {
  party: Party;
  currentUserNickname: string;
  currentUserRole?: string;
  onJoinClick: (party: Party) => void;
  onLeaveClick: (party: Party, charName?: string) => void;
  onDeleteClick: (partyId: string | number) => void;
  onNextRoundClick?: (party: Party, completedMembers: Member[]) => void;
  onRefresh?: () => void;
  isMasterOrAdmin: boolean;
}

export default function GuildBusCard({
  party,
  currentUserNickname,
  onJoinClick,
  onLeaveClick,
  onDeleteClick,
  onNextRoundClick,
  onRefresh,
  isMasterOrAdmin
}: GuildBusCardProps) {
  const [isPoolModalOpen, setIsPoolModalOpen] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  
  // 🎯 DB 상태 호환성 유지 (운행중 / 매칭중 호환)
  const isBusStartedInDB = party.status === "운행중" || party.status === "매칭 완료" || party.status === "매칭중" || (party as any).is_started;
  const [isStarted, setIsStarted] = useState<boolean>(isBusStartedInDB);
  const [prevMemberNames, setPrevMemberNames] = useState<string[]>([]);
  const [reconfiguredCandidates, setReconfiguredCandidates] = useState<BusCandidate[] | null>(null);

  const [isTransferModalOpen, setIsTransferModalOpen] = useState<boolean>(false);
  const [eligibleAdmins, setEligibleAdmins] = useState<{ nickname: string; role: string }[]>([]);
  const [selectedAdmin, setSelectedAdmin] = useState<string>('');
  const [isLoadingAdmins, setIsLoadingAdmins] = useState<boolean>(false);

  useEffect(() => {
    setIsStarted(isBusStartedInDB);
  }, [isBusStartedInDB, party.status]);

  const contentMarkSrc = useMemo(() => {
    if (!party.content_name) return "/svgs/contens mark/레이드 마크.svg";
    const isAbyss = party.party_type === "어비스" || party.content_name.includes("어비스");
    return isAbyss
      ? "/svgs/contens mark/어비스 마크.svg"
      : "/svgs/contens mark/레이드 마크.svg";
  }, [party.content_name, party.party_type]);

  const displayContentName = useMemo(() => {
    if (!party.content_name) return "";
    return party.content_name
      .replace(/^(레이드|어비스)\s*-\s*/, "")
      .replace(/\s*\(통합\)/g, "")
      .trim();
  }, [party.content_name]);

  const displaySubContent = useMemo(() => {
    if (!party.sub_content) return "";
    return party.sub_content
      .replace(/^(레이드|어비스)\s*-\s*/, "")
      .replace(/(레이드|어비스)\s*-\s*/g, "")
      .replace(/\s*\(통합\)/g, "")
      .trim();
  }, [party.sub_content]);

  const isDefaultSubContent = useMemo(() => {
    if (!party.sub_content) return true;
    const cleaned = party.sub_content.trim();
    return (
      cleaned === `[성역 길드 버스] ${party.content_name} (${party.difficulty}) 운행` ||
      cleaned.startsWith(`"성역 길드 버스" [`) ||
      cleaned.startsWith(`[성역 길드 버스]`)
    );
  }, [party.sub_content, party.content_name, party.difficulty]);

  const candidates: BusCandidate[] = (party.members || []).map((m: any) => ({
    character_id: m.character_id || m.id,
    character_name: m.character_name || m.name,
    owner_account: m.account_id || m.owner || m.owner_account || m.nickname || m.name || '',
    job: m.job,
    combat_power: parseCP(m.combat_power || m.cp || 0),
    allow_repeat: m.allow_repeat || false,
    is_completed: m.is_completed || false,
    time_start: m.time_start,
    time_end: m.time_end
  }));

  const cpReqs = CONTENT_CP_REQUIREMENTS[party.content_name]?.[party.difficulty] || 
                 CONTENT_CP_REQUIREMENTS[party.sub_content || '']?.[party.difficulty];
  const maxPartySize = party.max_members || 8;

  const activeCandidateList = reconfiguredCandidates || candidates;
  const { selected, remaining, hasHealer, hasTanker } = assembleBalancedParty(activeCandidateList, maxPartySize, cpReqs);

  const activeMembers = selected;

  const avgCombatPower = activeMembers.length > 0
    ? Math.round(activeMembers.reduce((acc, cur) => acc + parseCP(cur.combat_power), 0) / activeMembers.length)
    : 0;

  const isLeader = party.leader_name === currentUserNickname;
  const canManage = isMasterOrAdmin || isLeader;

  const handleStartBus = async () => {
    if (activeMembers.length === 0) return alert("출전 파티원이 없습니다.");
    try {
      const { error } = await supabase
        .from("parties")
        .update({ status: "운행중", is_started: true })
        .eq("id", party.id);

      if (error) throw error;

      setIsStarted(true);
      setPrevMemberNames(activeMembers.map(m => m.character_name));
      alert("🚌 길드 버스가 출발했습니다!");
      if (onRefresh) onRefresh();
    } catch (err: any) {
      console.error("버스 출발 DB 처리 실패:", err);
      alert("버스 출발 처리 중 오류: " + err.message);
    }
  };

  const handleReconstructParty = () => {
    const currentActiveNames = activeMembers.map(m => m.character_name);
    setPrevMemberNames(currentActiveNames);

    const reshuffled = [...candidates].sort((a, b) => parseCP(b.combat_power) - parseCP(a.combat_power));
    setReconfiguredCandidates(reshuffled);
    alert("🔄 파티 재구성이 완료되었습니다!");
  };

  const handleCompleteAndNextRound = async () => {
    if (activeMembers.length === 0) return alert("출전 파티원이 없습니다.");

    if (!confirm(`현재 출전 중인 ${activeMembers.length}명의 KRONOS 숙제를 완료 처리하고 다음 회차 파티를 구성하시겠습니까?`)) {
      return;
    }

    setIsSyncing(true);
    try {
      const activeNames = activeMembers.map((m) => m.character_name);
      setPrevMemberNames(activeNames);

      const contentType = party.party_type === "어비스" || party.content_name.includes("어비스") ? "abyss" : "raid";
      await syncKronosChecklist(activeMembers, contentType, party.content_name, party.difficulty);

      if (onNextRoundClick) {
        const completedMemberList = party.members.filter((m: any) => 
          activeMembers.some(am => am.character_name === (m.character_name || m.name) || am.character_id === (m.character_id || m.id))
        );
        onNextRoundClick(party, completedMemberList);
      }
      setReconfiguredCandidates(null);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("회차 완수 처리 중 오류:", err);
      alert("KRONOS 동기화 중 오류가 발생했습니다.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAttemptDeleteParty = () => {
    const totalMembersCount = (party.members || []).length;
    if (totalMembersCount > 0) {
      const confirmed = window.confirm(
        `⚠️ [길드 버스 해산 경고]\n\n현재 총 ${totalMembersCount}개의 캐릭터가 아직 버스 탑승 및 대기 상태에 있습니다.\n정말로 이 길드 버스를 해산하시겠습니까?\n(해산 시 등록된 모든 탑승 신청 정보가 삭제됩니다.)`
      );
      if (!confirmed) return;
    } else {
      const confirmed = window.confirm("정말로 이 길드 버스를 해산하시겠습니까?");
      if (!confirmed) return;
    }

    onDeleteClick(party.id);
  };

  const handleOpenTransferModal = async () => {
    setIsLoadingAdmins(true);
    try {
      const candidateOwnerNicknames = Array.from(new Set(
        (party.members || []).map((m: any) => 
          m.account_id || m.owner || m.owner_account || m.nickname || m.name
        ).filter((ownerName: string) => ownerName && ownerName !== party.leader_name)
      ));

      if (candidateOwnerNicknames.length === 0) {
        alert("⚠️ 인계할 관리자(길드마스터/부마스터)가 현재 파티 내에 없습니다.\n인계받을 관리자가 먼저 파티원 또는 대기열로 참여해 있어야 합니다.");
        setIsLoadingAdmins(false);
        return;
      }

      const { data: accounts, error } = await supabase
        .from('accounts')
        .select('nickname, role')
        .in('nickname', candidateOwnerNicknames);

      if (error) throw error;

      const admins = (accounts || []).filter((acc: any) => {
        const r = acc.role || '';
        return r === '길드마스터' || r === '부마스터' || r.includes('마스터') || r === 'ADMIN' || r === 'MASTER' || r === 'SUB_MASTER';
      });

      if (admins.length === 0) {
        alert("⚠️ 인계할 관리자(길드마스터/부마스터)가 현재 파티 내에 없습니다.\n(현재 파티에 참여 중인 인원 중 관리자 권한을 소지한 인원이 없습니다.)");
        setIsLoadingAdmins(false);
        return;
      }

      setEligibleAdmins(admins);
      setSelectedAdmin(admins[0].nickname);
      setIsTransferModalOpen(true);
    } catch (err: any) {
      console.error("관리자 인계 데이터 조회 실패:", err);
      alert("관리자 목록을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setIsLoadingAdmins(false);
    }
  };

  const handleConfirmTransfer = async () => {
    if (!selectedAdmin) return;
    if (!confirm(`정말로 [${selectedAdmin}] 님에게 버스 운행 관리자(방장) 권한을 인계하시겠습니까?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('parties')
        .update({ leader_name: selectedAdmin })
        .eq('id', party.id);

      if (error) throw error;

      alert(`👑 버스 관리자가 [${selectedAdmin}] 님으로 성공적으로 인계되었습니다!`);
      setIsTransferModalOpen(false);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      console.error("관리자 인계 처리 실패:", err);
      alert("관리자 인계 처리 중 오류: " + err.message);
    }
  };

  const handleToggleRepeat = async (charName: string, currentAllowRepeat: boolean) => {
    try {
      const updatedMembers = (party.members || []).map((m: any) => {
        const name = m.character_name || m.name;
        if (name === charName) {
          return { ...m, allow_repeat: !currentAllowRepeat };
        }
        return m;
      });

      const { error } = await supabase
        .from('parties')
        .update({ members: updatedMembers })
        .eq('id', party.id);

      if (error) throw error;
      if (onRefresh) onRefresh();
    } catch (err: any) {
      console.error("반복 참여 설정 업데이트 실패:", err);
    }
  };

  const myJoinedMembers = (party.members || []).filter((m: any) => {
    const charOwner = m.account_id || m.owner || m.owner_account || m.nickname || m.name;
    const charName = m.character_name || m.name;
    return charName === currentUserNickname || charOwner === currentUserNickname;
  });
  const isMyAccountJoined = myJoinedMembers.length > 0;

  return (
    <div className="w-full rounded-2xl border-2 border-[var(--accent)]/60 border-t-4 border-t-[var(--accent)] bg-[var(--panel)] p-3.5 sm:p-5 shadow-[0_10px_30px_rgba(0,0,0,0.8),0_0_20px_rgba(234,179,8,0.12)] transition-all duration-200 hover:border-[var(--accent)] relative overflow-hidden">
      
      <div className="-mx-3.5 -mt-3.5 sm:-mx-5 sm:-mt-5 p-2.5 sm:p-4 bg-black/60 border-b border-[var(--panel-border)] rounded-t-2xl mb-2.5 sm:mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-3">
        <div className="flex items-center gap-1.5 sm:gap-2.5 flex-wrap min-w-0">
          <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md text-[11px] sm:text-xs font-black bg-[var(--accent)] text-black flex items-center gap-1 shrink-0 shadow-sm">
            <MarkIcon src="/svgs/UI mark/길드 마크.svg" size="xs" colorClass="bg-black" scale={1.1} />
            <span>길드버스</span>
          </span>

          <span className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md text-[11px] sm:text-xs font-bold border ${DIFFICULTY_COLORS[party.difficulty] || 'bg-[var(--inner-box)] border-[var(--panel-border)] text-[var(--text-main)]'} shrink-0`}>
            {party.difficulty}
          </span>

          <div className="flex items-center gap-1.5 min-w-0">
            <MarkIcon src={contentMarkSrc} size="xs" scale={1.15} colorClass="bg-[var(--accent)]" />
            <h3 className="text-sm sm:text-lg font-black text-[var(--text-main)] truncate max-w-[180px] sm:max-w-[320px]">
              {displayContentName}
            </h3>
          </div>

          {isStarted && (
            <span className="px-1.5 sm:px-2 py-0.2 rounded text-[9px] sm:text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse">
              운행중
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-3 text-[11px] sm:text-xs text-[var(--text-main)] opacity-90 shrink-0">
          <div className="flex items-center gap-1 bg-black/40 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md border border-white/10">
            <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[var(--accent)]" />
            <span className="font-bold">{party.time_start} ~ {party.time_end}</span>
          </div>
          <div className="flex items-center gap-1 bg-black/40 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md border border-white/10">
            <Crown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400" />
            <span className="font-semibold truncate max-w-[80px]">{party.leader_name || '기사단장'}</span>
          </div>
        </div>
      </div>

      {displaySubContent && !isDefaultSubContent && (
        <div className="mb-2.5 sm:mb-4 text-xs text-[var(--text-main)] opacity-90 bg-[var(--inner-box)] p-2.5 rounded-lg border border-[var(--panel-border)] flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-[var(--accent)] shrink-0 mt-0.5" />
          <span className="break-all leading-snug font-medium min-w-0 flex-1">{displaySubContent}</span>
        </div>
      )}

      <div className="mb-3.5 sm:mb-4 bg-[var(--inner-box)] rounded-xl p-3 sm:p-3.5 border border-[var(--panel-border)]">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5 sm:mb-3 pb-2 sm:pb-2.5 border-b border-[var(--panel-border)]">
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <span className="text-xs sm:text-sm font-black text-[var(--text-main)] flex items-center gap-1.5">
              <MarkIcon src="/svgs/UI mark/지구본 마크.svg" size="xs" scale={1.1} colorClass="bg-[var(--accent)]" />
              <span>현재 회차 출전 파티 ({activeMembers.length} / {maxPartySize})</span>
            </span>

            <div className="flex items-center gap-1 ml-1">
              <span className={`px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-[11px] font-bold rounded-md border flex items-center gap-1 ${
                hasTanker ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-zinc-800/60 border-zinc-700 text-zinc-500'
              }`}>
                <Shield className="w-3 h-3" />
                {hasTanker ? '탱커 확보' : '탱커 미확보'}
              </span>

              <span className={`px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-[11px] font-bold rounded-md border flex items-center gap-1 ${
                hasHealer ? 'bg-teal-500/10 border-teal-500/30 text-teal-300' : 'bg-zinc-800/60 border-zinc-700 text-zinc-500'
              }`}>
                <Heart className="w-3 h-3" />
                {hasHealer ? '힐러 확보' : '힐러 미확보'}
              </span>
            </div>
          </div>

          <div className="px-2.5 sm:px-3 py-1 bg-[var(--panel)] border border-[var(--accent)]/40 rounded-xl flex items-center gap-1.5 shadow-inner">
            <span className="text-[11px] sm:text-xs text-[var(--text-sub)] font-medium">평균 전투력</span>
            <span className="text-xs sm:text-sm font-black text-[var(--accent)] font-mono">
              {avgCombatPower > 0 ? avgCombatPower.toLocaleString() : "0"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
          {Array.from({ length: maxPartySize }).map((_, index) => {
            const member = activeMembers[index];

            if (!member) {
              return (
                <div 
                  key={`empty-${index}`} 
                  className="min-h-[62px] rounded-xl border border-dashed border-[var(--panel-border)] bg-black/10 flex items-center justify-center text-xs text-[var(--text-sub)] font-bold"
                >
                  빈 출전 슬롯
                </div>
              );
            }

            const role = getRoleByJob(member.job);
            const cpNum = parseCP(member.combat_power);
            const displayName = getDisplayName(member);

            const isNewlyAdded = prevMemberNames.length > 0 && !prevMemberNames.includes(member.character_name);

            return (
              <div 
                key={`active-${member.character_name}-${index}`}
                className={`min-h-[62px] rounded-xl border p-2 flex items-center gap-2 relative overflow-hidden transition-all min-w-0 ${
                  isNewlyAdded 
                    ? 'border-amber-400 bg-amber-500/10 shadow-[0_0_12px_rgba(251,191,36,0.3)] animate-pulse' 
                    : 'border-[var(--panel-border)] bg-[var(--panel)] hover:border-[var(--accent)]/60'
                }`}
              >
                {isNewlyAdded && (
                  <span className="absolute top-0 right-0 px-1.5 py-0.2 bg-amber-500 text-black font-black text-[8px] rounded-bl-md">
                    NEW
                  </span>
                )}

                <div className="flex flex-col items-center justify-center shrink-0">
                  <div className="w-7 h-7 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center p-0.5">
                    <ClassIcon className="w-5 h-5 text-[var(--text-main)]" job={member.job} />
                  </div>
                  <span className="mt-0.5 px-1 py-0.2 text-[9px] font-black rounded bg-black/60 text-[var(--accent)] border border-[var(--accent)]/30 leading-none">
                    {role}
                  </span>
                </div>

                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <div className="flex items-center gap-1 min-w-0">
                    <span className="text-xs font-black text-[var(--text-main)] truncate leading-tight">
                      {displayName}
                    </span>
                    {member.allow_repeat && (
                      <RefreshCw className="w-3 h-3 text-[var(--accent)] shrink-0" title="용병/반복 참여" />
                    )}
                  </div>

                  <div className="flex items-center gap-1 mt-0.5 min-w-0">
                    <MarkIcon src="/svgs/status mark/전투력 마크.svg" size="xs" scale={0.85} colorClass="bg-amber-400" />
                    <span className="text-[11px] sm:text-xs font-black text-amber-400 font-mono leading-none truncate">
                      <span className="sm:hidden">{formatCPShort(cpNum)}</span>
                      <span className="hidden sm:inline">{cpNum > 0 ? cpNum.toLocaleString() : "-"}</span>
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {canManage && (
        <div className="mb-3.5 sm:mb-4 p-2.5 sm:p-3 rounded-xl bg-[var(--inner-box)] border border-[var(--panel-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="text-xs font-bold text-[var(--text-main)] flex items-center gap-1.5 shrink-0">
            <Crown className="w-4 h-4 text-amber-400" />
            <span>버스 컨트롤러</span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 w-full sm:flex sm:items-center sm:w-auto sm:gap-2">
            {!isStarted ? (
              <button
                type="button"
                onClick={handleStartBus}
                disabled={activeMembers.length === 0}
                className="w-full sm:w-auto px-3 py-1.5 rounded-lg sm:rounded-xl text-xs font-black bg-emerald-500 hover:bg-emerald-400 text-black disabled:opacity-50 transition-all flex items-center justify-center gap-1 shadow cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 shrink-0" />
                <span>버스 출발</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCompleteAndNextRound}
                disabled={isSyncing || activeMembers.length === 0}
                className="w-full sm:w-auto px-3 py-1.5 rounded-lg sm:rounded-xl text-xs font-black bg-[var(--accent)] text-black hover:brightness-110 disabled:opacity-50 transition-all flex items-center justify-center gap-1 shadow cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span>{isSyncing ? "동기화..." : "회차 완료!"}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleReconstructParty}
              className="w-full sm:w-auto px-2.5 py-1.5 rounded-lg sm:rounded-xl text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 hover:bg-indigo-500/30 transition-all flex items-center justify-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 shrink-0" />
              <span>파티 재구성</span>
            </button>

            <button
              type="button"
              onClick={handleOpenTransferModal}
              disabled={isLoadingAdmins}
              className="w-full sm:w-auto px-2.5 py-1.5 rounded-lg sm:rounded-xl text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 disabled:opacity-50 transition-all flex items-center justify-center gap-1 cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5 shrink-0 text-amber-400" />
              <span>{isLoadingAdmins ? '조회중...' : '관리자 인계'}</span>
            </button>

            <button
              type="button"
              onClick={handleAttemptDeleteParty}
              className="w-full sm:w-auto px-2.5 py-1.5 rounded-lg sm:rounded-xl text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20 transition-all flex items-center justify-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 shrink-0" />
              <span>해산</span>
            </button>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-[var(--panel-border)] bg-[var(--inner-box)] overflow-hidden">
        <button
          type="button"
          onClick={() => setIsPoolModalOpen(true)}
          className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 flex items-center justify-between text-xs font-bold text-[var(--text-main)] hover:bg-[var(--panel)]/50 transition-colors cursor-pointer min-w-0"
        >
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--accent)] shrink-0" />
            <span className="truncate">참가 캐릭터 List ({party.members?.length || 0}캐릭터)</span>
          </div>
          <span className="text-[11px] sm:text-xs text-[var(--accent)] font-bold shrink-0 ml-1">
            상세 보기 ➔
          </span>
        </button>
      </div>

      <div className="mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t border-[var(--panel-border)] space-y-2">
        <div className="flex items-center justify-between gap-1.5 min-w-0">
          <span className="text-[11px] sm:text-xs font-bold text-[var(--text-sub)] shrink-0">
            참여 상태: {isMyAccountJoined ? <strong className="text-emerald-400">참여 중 ({myJoinedMembers.length}개)</strong> : "미참여"}
          </span>

          {isMyAccountJoined ? (
            <div className="text-[10px] sm:text-[11px] font-bold text-[var(--text-sub)] bg-[var(--inner-box)] px-2 py-0.5 rounded-md border border-[var(--panel-border)] flex items-center gap-1.5 shrink-0">
              <span className="flex items-center gap-0.5">
                <RefreshCw className="w-3 h-3 text-[var(--accent)] inline-block" />
                <span>:반복</span>
              </span>
              <span className="text-[var(--panel-border)]">|</span>
              <span className="flex items-center gap-0.5 text-rose-400">
                <X className="w-3 h-3 inline-block" />
                <span>:탈퇴</span>
              </span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onJoinClick(party)}
              className="px-2.5 sm:px-3 py-1 sm:py-1.5 bg-[var(--accent)] hover:brightness-110 text-[var(--accent-fg)] font-black text-[11px] sm:text-xs rounded-lg sm:rounded-xl shadow-xs transition active:scale-95 cursor-pointer flex items-center gap-1 shrink-0"
            >
              <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>참여 신청</span>
            </button>
          )}
        </div>

        {isMyAccountJoined && (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-1.5 pt-1 w-full">
            {myJoinedMembers.map((myChar: any, idx: number) => {
              const charName = myChar.character_name || myChar.name;
              const displayName = getDisplayName(myChar);
              const isRepeat = myChar.allow_repeat || false;

              return (
                <div
                  key={`joined-chip-${charName}-${idx}`}
                  className={`flex items-center justify-between px-2 py-1 rounded-xl border text-xs font-bold transition shadow-xs ${
                    isRepeat
                      ? 'bg-[var(--accent-soft)]/60 border-[var(--accent)] text-[var(--accent)]'
                      : 'bg-[var(--inner-box)] border-[var(--panel-border)] text-[var(--text-main)] hover:border-[var(--accent)]/50'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleToggleRepeat(charName, isRepeat)}
                    className="flex items-center gap-1 min-w-0 flex-1 text-left cursor-pointer truncate"
                    title="클릭 시 반복 참여 설정(ON/OFF)"
                  >
                    <span className="truncate">{displayName}</span>
                    <RefreshCw 
                      className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                        isRepeat ? 'text-[var(--accent)]' : 'text-[var(--text-main)] opacity-70'
                      }`} 
                    />
                  </button>

                  <button
                    type="button"
                    onClick={() => onLeaveClick(party, charName)}
                    className="w-4 h-4 rounded-full bg-rose-950/80 hover:bg-rose-600 text-rose-300 hover:text-white flex items-center justify-center text-[9px] transition cursor-pointer shrink-0 ml-1"
                    title={`${charName} 버스 탈퇴`}
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              );
            })}

            {myJoinedMembers.length < 6 && (
              <button
                type="button"
                onClick={() => onJoinClick(party)}
                className="flex items-center justify-center gap-1 px-2 py-1 bg-[var(--panel)] border border-dashed border-[var(--accent)]/60 hover:border-[var(--accent)] text-[var(--accent)] rounded-xl text-xs font-bold transition cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>추가</span>
              </button>
            )}
          </div>
        )}
      </div>

      {isTransferModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-3 animate-in fade-in duration-200">
          <div className="bg-[var(--panel)] border-2 border-[var(--accent)] rounded-2xl p-4 w-full max-w-sm shadow-2xl flex flex-col space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--panel-border)]">
              <div className="flex items-center gap-2 text-sm font-black text-[var(--accent)]">
                <Crown className="w-4 h-4 text-amber-400 shrink-0" />
                <span>👑 버스 관리자 권한 인계</span>
              </div>
              <button
                type="button"
                onClick={() => setIsTransferModalOpen(false)}
                className="text-[var(--text-sub)] hover:text-white transition p-0.5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-[var(--text-sub)] font-medium leading-relaxed">
              현재 파티에 참여 중인 관리자(길드마스터/부마스터) 중에서 새로운 방장을 선택해주세요.
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
              {eligibleAdmins.map((admin) => (
                <label
                  key={admin.nickname}
                  onClick={() => setSelectedAdmin(admin.nickname)}
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition cursor-pointer ${
                    selectedAdmin === admin.nickname
                      ? 'border-[var(--accent)] bg-[var(--inner-box)] shadow-xs'
                      : 'border-[var(--panel-border)] bg-black/20 hover:border-[var(--accent)]/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="adminTransferSelect"
                      checked={selectedAdmin === admin.nickname}
                      onChange={() => setSelectedAdmin(admin.nickname)}
                      className="accent-[var(--accent)]"
                    />
                    <span className="text-xs font-black text-[var(--text-main)]">
                      {admin.nickname}
                    </span>
                  </div>

                  <span className="px-2 py-0.5 text-[10px] font-black rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {admin.role || '관리자'}
                  </span>
                </label>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--panel-border)]">
              <button
                type="button"
                onClick={() => setIsTransferModalOpen(false)}
                className="px-3 py-1.5 rounded-xl bg-[var(--inner-box)] border border-[var(--panel-border)] text-xs font-bold text-[var(--text-sub)] hover:text-white transition cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleConfirmTransfer}
                className="px-4 py-1.5 rounded-xl bg-[var(--accent)] text-black text-xs font-black hover:brightness-110 transition shadow-sm cursor-pointer"
              >
                인계 확정
              </button>
            </div>
          </div>
        </div>
      )}

      <PoolStatusModal
        isOpen={isPoolModalOpen}
        onClose={() => setIsPoolModalOpen(false)}
        members={party.members || []}
        activeMembers={activeMembers}
      />

    </div>
  );
}