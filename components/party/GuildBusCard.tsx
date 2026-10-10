'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import ClassIcon from '@/components/common/ClassIcon';
import MarkIcon from '@/components/common/MarkIcon';
import styles from './GuildBusCard.module.css';
import ResponsiveMemberName from './ResponsiveMemberName';
import { 
  Party, 
  Member, 
  DIFFICULTY_COLORS,
  ContentPowerReq,
  NexusContent,
  NexusClassItem
} from '@/components/party/types';
import { 
  assembleBalancedParty, 
  syncKronosChecklist, 
  getRoleByJob,
  findPartyPowerReq,
  parseCP,
  parseAbyssInfo,
  BusCandidate,
  BusMember 
} from '@/lib/busUtils';
import {usePartyOperations,usePartySurface} from '@/components/party/PartySurfaceContext';
import PoolStatusModal from '@/components/party/modals/PoolStatusModal';
import { eligibleBusCandidates, formatBusRoster, isBusOperator } from '@/lib/guildBusPolicy';
import { changeBusMember, completeBusRound } from '@/lib/guildBusActions';
import type { PartyCatalog } from '@/hooks/usePartyCatalog';
import BusEditModal from '@/components/party/modals/BusEditModal';

const Users = ({ className, title }: { className?: string; title?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {title && <title>{title}</title>}
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
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

const Plus = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
);

const Crown = ({ className, title }: { className?: string; title?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {title && <title>{title}</title>}
    <path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.3 8.87a.5.5 0 0 0 .416.27l6.216.525a.5.5 0 0 1 .288.883l-4.69 4.14a.5.5 0 0 0-.153.472l1.378 6.07a.5.5 0 0 1-.747.543L12.5 18.5a.5.5 0 0 0-.499 0l-5.309 3.273a.5.5 0 0 1-.747-.543l1.378-6.07a.5.5 0 0 0-.153-.472L2.48 10.548a.5.5 0 0 1 .288-.883l6.216-.525a.5.5 0 0 0 .416-.27z"/>
  </svg>
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

const getDisplayName = (m: any) => {
  const alias = m.alias || m.tempAlias;
  if (alias && alias !== "EMPTY" && alias !== "NULL" && alias.trim() !== "") {
    return alias.trim();
  }
  const rawName = m.character_name || m.name || m.nickname || "";
  return rawName;
};

interface GuildBusCardProps {
  party: Party;
  currentUserNickname: string;
  currentUserAccountId?: string;
  currentUserRole?: string;
  myCharacterNames: string[];
  catalog: PartyCatalog;
  characterProfiles?: Record<string, { alias?: string }>;
  onJoinClick: (party: Party) => void;
  onDeleteClick: (partyId: string | number) => void;
  onRefresh: () => void | Promise<void>;
  isMasterOrAdmin: boolean;
}

export default function GuildBusCard({
  party,
  characterProfiles = {},
  currentUserNickname,
  currentUserAccountId,
  currentUserRole = "",
  myCharacterNames,
  catalog,
  onJoinClick,
  onDeleteClick,
  onRefresh,
  isMasterOrAdmin
}: GuildBusCardProps) {
  const {request,memberMutation}=usePartyOperations();
  const surface=usePartySurface();
  const {powerReqs, contents:contentsCatalog, classes:classesCatalog} = catalog;
  const actionLock = useRef(false);
  const [isPoolModalOpen, setIsPoolModalOpen] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  
  const isBusStartedInDB = party.status === "운행중" || party.status === "매칭 완료" || party.status === "매칭중";
  const [isStarted, setIsStarted] = useState<boolean>(isBusStartedInDB);
  const [prevMemberNames, setPrevMemberNames] = useState<string[]>([]);

  const [isTransferModalOpen, setIsTransferModalOpen] = useState<boolean>(false);
  const [eligibleAdmins, setEligibleAdmins] = useState<{ nickname: string; role: string }[]>([]);
  const [selectedAdmin, setSelectedAdmin] = useState<string>('');
  const [isLoadingAdmins, setIsLoadingAdmins] = useState<boolean>(false);
  const [busNow, setBusNow] = useState(() => new Date());
  const [isCopyingRoster, setIsCopyingRoster] = useState(false);
  const [editingParty,setEditingParty]=useState<Party|null>(null);
  useEffect(()=>{
    const reveal=()=>{if(window.location.hash===`#guild-bus-${party.id}`)document.getElementById(`guild-bus-${party.id}`)?.scrollIntoView({block:'center'});};
    reveal();window.addEventListener('hashchange',reveal);
    return ()=>window.removeEventListener('hashchange',reveal);
  },[party.id]);

  useEffect(() => {
    if(surface&&!surface.active)return;
    const timer = window.setInterval(() => setBusNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, [surface?.active]);

  useEffect(() => {
    setIsStarted(isBusStartedInDB);
  }, [isBusStartedInDB, party.status]);

  // 🎯 범용 일원화 DB 동적 어비스 정보 분석 파서 연동
  const abyssInfo = useMemo(() => parseAbyssInfo(party, null, contentsCatalog), [party, contentsCatalog]);

  const contentMarkSrc = useMemo(() => {
    return abyssInfo.isAbyss
      ? "/svgs/contens mark/어비스 마크.svg"
      : "/svgs/contens mark/레이드 마크.svg";
  }, [abyssInfo.isAbyss]);

  const displaySubContent = useMemo(() => {
    const rawContent = party.sub_content || party.memo || "";
    if (!rawContent) return "";
    return rawContent
      .replace(/^\s*\[성역 길드 버스\]\s*/i, "")
      .replace(/^(레이드|어비스)\s*-\s*/, "")
      .replace(/(레이드|어비스)\s*-\s*/g, "")
      .replace(/\s*\(통합\)/g, "")
      .trim();
  }, [party.sub_content, party.memo]);

  const isDefaultSubContent = useMemo(() => {
    const rawContent = party.sub_content || party.memo || "";
    if (!rawContent) return true;
    const cleaned = rawContent.trim();
    return (
      cleaned === `[성역 길드 버스] ${party.content_name} (${party.difficulty}) 운행` ||
      cleaned.startsWith(`"성역 길드 버스" [`) ||
      cleaned.startsWith(`어비스 `)
    );
  }, [party.sub_content, party.memo, party.content_name, party.difficulty]);

  const candidates: BusCandidate[] = (party.members || []).map((m: any) => ({
    character_id: m.character_id || m.id,
    character_name: m.character_name || m.name,
    owner_account: m.account_id || m.owner || m.owner_account || m.nickname || m.name || '',
    job: m.job,
    combat_power: parseCP(m.combat_power || m.cp || 0),
    magic_resistance: parseCP(m.magic_resistance || m.mr || 0),
    selection_order: m.selection_order,
    allow_repeat: m.allow_repeat || false,
    is_completed: m.is_completed || false,
    time_start: m.time_start || m.start_time || m.startTime,
    time_end: m.time_end || m.end_time || m.endTime
  }));

  // 🎯 DB(`content_power_reqs`) 기반 동적 스탯 컷 조회
  const cpReqs = useMemo(() => {
    if (!powerReqs || powerReqs.length === 0) return null;
    return findPartyPowerReq(powerReqs,party.content_name,party.difficulty);
  }, [powerReqs, party.content_name, party.sub_content, party.difficulty]);

  const maxPartySize = party.max_members || 8;

  const scheduledCandidates = useMemo(
    () => eligibleBusCandidates(candidates, party, busNow),
    [candidates, party, busNow]
  );
  const activeCandidateList = scheduledCandidates;
  const { selected, hasHealer, hasTanker } = assembleBalancedParty(
    activeCandidateList, 
    maxPartySize, 
    cpReqs, 
    undefined, 
    classesCatalog
  );

  const activeMembers = selected;

  const avgCombatPower = activeMembers.length > 0
    ? Math.round(activeMembers.reduce((acc: number, cur: BusMember) => acc + parseCP(cur.combat_power), 0) / activeMembers.length)
    : 0;

  const isSubMasterOrHigherRole = ["길드마스터", "부마스터", "부마스터 대행", "master", "admin", "sub_master"].includes(currentUserRole.toLowerCase());
  const canManage = isBusOperator(
    party.leader_name,
    currentUserNickname,
    myCharacterNames,
    isMasterOrAdmin || isSubMasterOrHigherRole
  );

  const handleCopyRoster = async () => {
    if (!canManage || activeMembers.length === 0) return;
    setIsCopyingRoster(true);
    try {
      await navigator.clipboard.writeText(formatBusRoster(activeMembers.map((member) => member.character_name), candidates));
      alert("구성 안내를 클립보드에 복사했습니다.");
    } catch {
      alert("클립보드 복사에 실패했습니다. 브라우저 권한을 확인해주세요.");
    } finally {
      setIsCopyingRoster(false);
    }
  };

  const handleStartBus = async () => {
    if (!canManage || actionLock.current || !catalog.loaded || catalog.error) return;
    if (activeMembers.length === 0) return alert("출전 파티원이 없습니다.");
    actionLock.current = true;
    setIsSyncing(true);
    try {
      const { error } = await memberMutation({ table: "parties", action: "update", filter: { column: "id", value: party.id }, payload: { status: "운행중" } });

      if (error) throw error;

      setIsStarted(true);
      setPrevMemberNames(activeMembers.map((m: BusMember) => m.character_name));
      alert("🚌 길드 버스가 출발했습니다!");
      await onRefresh();
    } catch (err: any) {
      console.error("버스 출발 DB 처리 실패:", err);
      alert("버스 출발 처리 중 오류: " + err.message);
    } finally {
      actionLock.current = false;
      setIsSyncing(false);
    }
  };

  const handleReconstructParty = async () => {
    if (!canManage || actionLock.current || !catalog.loaded || catalog.error) return;
    actionLock.current = true;
    setIsSyncing(true);
    const currentActiveNames = activeMembers.map((m: BusMember) => m.character_name);
    try {
      await changeBusMember(party.id,{type:'reconfigure',selectedNames:currentActiveNames},request);
      setPrevMemberNames(currentActiveNames);
      await onRefresh();
    } catch (error: any) {
      alert(`파티 재구성 실패: ${error.message}`);
    } finally {
      actionLock.current = false;
      setIsSyncing(false);
    }
  };

  const handleCompleteAndNextRound = async () => {
    if (!canManage || actionLock.current || !catalog.loaded || catalog.error) return;
    if (activeMembers.length === 0) return alert("출전 파티원이 없습니다.");

    if (!confirm(`현재 출전 중인 ${activeMembers.length}명의 KRONOS 숙제를 완료 처리하고 다음 회차 파티를 구성하시겠습니까?`)) {
      return;
    }

    actionLock.current = true;
    setIsSyncing(true);
    try {
      const activeNames = activeMembers.map((m: BusMember) => m.character_name);
      setPrevMemberNames(activeNames);

      await completeBusRound(party.id,activeNames,party,request);
      await onRefresh();
    } catch (err: any) {
      console.error("회차 완수 처리 중 오류:", err);
      alert(`회차 완료 처리 실패: ${err.message}`);
    } finally {
      setIsSyncing(false);
      actionLock.current = false;
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

      const response = await fetch('/api/accounts/directory', { cache: 'no-store' });
      if (!response.ok) throw new Error('계정 목록 조회 실패');
      const { accounts: directory } = await response.json();
      const accounts = (directory || []).filter((account: { nickname: string }) => candidateOwnerNicknames.includes(account.nickname));

      const admins = (accounts || []).filter((acc: any) => {
        const r = acc.role || '';
        return r === '길드마스터' || r === '부마스터' || r === '부마스터 대행' || r.includes('마스터') || r === 'ADMIN' || r === 'MASTER' || r === 'SUB_MASTER';
      });

      if (admins.length === 0) {
        alert("⚠️ 인계할 관리자(길드마스터/부마스터/부마스터 대행)가 현재 파티 내에 없습니다.\n(현재 파티에 참여 중인 인원 중 관리자 권한을 소지한 인원이 없습니다.)");
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
      const { error } = await memberMutation({ table: "parties", action: "update", filter: { column: "id", value: party.id }, payload: { leader_name: selectedAdmin } });

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
    if (actionLock.current) return;
    actionLock.current = true;
    setIsSyncing(true);
    try {
      await changeBusMember(party.id,{type:'repeat',name:charName,allow_repeat:!currentAllowRepeat},request);
      await onRefresh();
    } catch (err: any) {
      console.error("반복 참여 설정 업데이트 실패:", err);
      alert(`반복 설정 저장 실패: ${err.message}`);
    } finally {
      actionLock.current = false;
      setIsSyncing(false);
    }
  };

  const handleLeave = async (charName: string) => {
    if (actionLock.current || !confirm(`'${charName}' 캐릭터를 이 길드 버스에서 탈퇴 처리하시겠습니까?`)) return;
    actionLock.current = true;
    setIsSyncing(true);
    try {
      await changeBusMember(party.id,{type:'leave',name:charName},request);
      await onRefresh();
    } catch (err: any) {
      alert(`탈퇴 처리 실패: ${err.message}`);
    } finally {
      actionLock.current = false;
      setIsSyncing(false);
    }
  };

  const myJoinedMembers = (party.members || []).filter((m: any) => {
    const charOwner = m.account_id || m.owner || m.owner_account || m.nickname || m.name;
    const charName = m.character_name || m.name;
    return myCharacterNames.includes(charName) || charName === currentUserNickname || charOwner === currentUserNickname || (!!currentUserAccountId && charOwner === currentUserAccountId);
  });
  const isMyAccountJoined = myJoinedMembers.length > 0;

  return (
    <div id={`guild-bus-${party.id}`} className="w-full scroll-mt-24 rounded-2xl border-2 border-[var(--accent)]/60 border-t-4 border-t-[var(--accent)] bg-[var(--panel)] p-3 sm:p-5 shadow-lg transition-all duration-200 hover:border-[var(--accent)] relative overflow-hidden">
      {/* Keep fixed overlays outside the size-query container. */}
      <div className={styles.busCard}>
      
      {/* 카드 헤더 래퍼 */}
      {catalog.error && <p role="alert" className="mb-2 text-xs text-rose-500">{catalog.error}</p>}
      <div className="-mx-3 -mt-3 sm:-mx-5 sm:-mt-5 p-2 sm:p-4 bg-[var(--inner-box)] border-b border-[var(--panel-border)] rounded-t-2xl mb-2 sm:mb-4 flex flex-col gap-2">
        <div className={styles.busHeader}>
          <div className="flex items-center gap-1.5 sm:gap-2.5 flex-wrap min-w-0">
            <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md text-[11px] sm:text-xs font-black bg-[var(--accent)] text-[var(--accent-fg)] flex items-center gap-1 shrink-0 shadow-xs">
              <MarkIcon src="/svgs/UI mark/길드 마크.svg" size="xs" colorClass="bg-[var(--accent-fg)]" scale={1.1} />
              <span>길드버스</span>
            </span>

            <span className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md text-[11px] sm:text-xs font-bold border ${DIFFICULTY_COLORS[party.difficulty] || 'bg-[var(--panel)] border-[var(--panel-border)] text-[var(--text-main)]'} shrink-0`}>
              {party.difficulty}
            </span>

            <div className="flex items-center gap-1.5 min-w-0">
              <MarkIcon src={contentMarkSrc} size="xs" scale={1.15} colorClass="bg-[var(--accent)]" />
              <h3 className={`${styles.readableName} text-sm sm:text-lg font-black text-[var(--text-main)]`}>
                {abyssInfo.title}
              </h3>
            </div>

            {isStarted && (
              <span className="px-1.5 sm:px-2 py-0.2 rounded text-[9px] sm:text-[10px] font-black bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40 animate-pulse">
                운행중
              </span>
            )}
          </div>

          {/* 희망 시간 & 기사단장 */}
          <div className={`${styles.busHeaderInfo} text-xs text-[var(--text-main)]`}>
            <div className="flex items-center gap-1 bg-[var(--panel)] px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md border border-[var(--panel-border)]">
              <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[var(--accent)]" />
              <span className="font-bold text-[var(--text-main)] whitespace-nowrap">{party.time_start} ~ {party.time_end}</span>
            </div>
            <div className="flex items-center gap-1 bg-[var(--panel)] px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md border border-[var(--panel-border)] min-w-0 max-w-full">
              <Crown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-600 dark:text-amber-400" />
              <span className={`${styles.readableName} font-bold text-[var(--text-main)]`}>{party.leader_name || '기사단장'}</span>
            </div>
          </div>
        </div>

        {/* 🎯 어비스 부분 및 전체 선택 던전만 정확하게 뱃지 태그로 렌더링 */}
        {abyssInfo.isAbyss && abyssInfo.selectedDungeons.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
            {abyssInfo.selectedDungeons.map((dungeon) => (
              <span 
                key={dungeon.id}
                className="px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-black bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/40 flex items-center gap-1 shadow-xs"
              >
                <span>🎯</span>
                <span>{dungeon.name}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {displaySubContent && (
        <div className="mb-2 sm:mb-3 text-xs text-[var(--text-main)] bg-[var(--inner-box)] p-2 rounded-lg border border-[var(--panel-border)] flex items-start gap-1.5">
          <AlertCircle className="w-4 h-4 text-[var(--accent)] shrink-0 mt-0.5" />
          <span className="break-all leading-snug font-medium min-w-0 flex-1">{displaySubContent}</span>
        </div>
      )}

      {/* 출전 파티 현황 영역 */}
      <div className="mb-2.5 sm:mb-4 bg-[var(--inner-box)] rounded-xl p-2.5 sm:p-3.5 border border-[var(--panel-border)]">
        <div className="flex flex-wrap items-center justify-between gap-1.5 mb-2 sm:mb-3 pb-1.5 sm:pb-2.5 border-b border-[var(--panel-border)]">
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <span className="text-xs sm:text-sm font-black text-[var(--text-main)] flex items-center gap-1.5">
              <MarkIcon src="/svgs/UI mark/지구본 마크.svg" size="xs" scale={1.1} colorClass="bg-[var(--accent)]" />
              <span>현재 회차 출전 파티 ({activeMembers.length} / {maxPartySize})</span>
            </span>

            <div className="flex items-center gap-1 ml-1">
              <span className={`px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-[11px] font-bold rounded-md border flex items-center gap-1 ${
                hasTanker ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' : 'bg-[var(--panel)] border-[var(--panel-border)] text-[var(--text-sub)] opacity-70'
              }`}>
                <Shield className="w-3 h-3" />
                {hasTanker ? '탱커 확보' : '탱커 미확보'}
              </span>

              <span className={`px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-[11px] font-bold rounded-md border flex items-center gap-1 ${
                hasHealer ? 'bg-teal-500/10 border-teal-500/30 text-teal-600 dark:text-teal-300' : 'bg-[var(--panel)] border-[var(--panel-border)] text-[var(--text-sub)] opacity-70'
              }`}>
                <Heart className="w-3 h-3" />
                {hasHealer ? '힐러 확보' : '힐러 미확보'}
              </span>
            </div>
          </div>

          <div className="px-2 py-0.5 sm:px-3 sm:py-1 bg-[var(--panel)] border border-[var(--accent)]/40 rounded-xl flex items-center gap-1.5 shadow-xs">
            <span className="text-[10px] sm:text-xs text-[var(--text-sub)] font-medium">평균 전투력</span>
            <span className="text-xs sm:text-sm font-black text-[var(--accent)] font-mono">
              {avgCombatPower > 0 ? avgCombatPower.toLocaleString() : "0"}
            </span>
          </div>
        </div>

        {/* 파티 출전 멤버 슬롯 */}
        <div className={styles.memberGrid}>
          {Array.from({ length: maxPartySize }).map((_, index) => {
            const member = activeMembers[index];

            if (!member) {
              return (
                <div 
                  key={`empty-${index}`} 
                  className={`${styles.emptySlot} rounded-xl border border-dashed border-[var(--panel-border)] bg-[var(--inner-box)]/50 flex items-center justify-center text-[var(--text-sub)] font-bold`}
                >
                  빈 출전 슬롯
                </div>
              );
            }

            const role = getRoleByJob(member.job, classesCatalog);
            const cpNum = parseCP(member.combat_power);
            const profile = (party.members || []).find(m => (m.character_name || m.name) === member.character_name);

            const isNewlyAdded = prevMemberNames.length > 0 && !prevMemberNames.includes(member.character_name);

            return (
              <div 
                key={`active-${member.character_name}-${index}`}
                className={`${styles.memberSlot} rounded-xl border relative transition-all min-w-0 ${
                  isNewlyAdded 
                    ? 'border-amber-400 bg-amber-500/10 shadow- animate-pulse' 
                    : 'border-[var(--panel-border)] bg-[var(--panel)] hover:border-[var(--accent)]'
                }`}
              >
                {isNewlyAdded && (
                  <span className="absolute top-0 right-0 px-1 py-0.2 bg-amber-500 text-black font-black text-[8px] rounded-bl-md">
                    NEW
                  </span>
                )}

                <div className={styles.memberStats}>
                  <div className={`${styles.memberClass} relative rounded-lg bg-[var(--inner-box)] border border-[var(--panel-border)] flex items-center justify-center`}>
                    <ClassIcon className={`${styles.classMark} text-[var(--text-main)]`} job={member.job} />
                    {member.is_driver && <Crown className={`${styles.driverMark} text-amber-500`} title="버스 기사" />}
                  </div>
                  <span className={`${styles.roleLabel} px-1 font-black rounded bg-[var(--accent)] text-[var(--accent-fg)]`}>
                    {role}
                  </span>
                  <div className={styles.powerRow}>
                    <span className={`${styles.memberPower} font-black text-amber-800 dark:text-amber-400 font-mono`}>
                      {cpNum > 0 ? cpNum.toLocaleString() : "-"}
                    </span>
                  </div>
                </div>
                <div className={`${styles.memberName} font-black text-[var(--text-main)]`}>
                  <ResponsiveMemberName fullName={member.character_name} alias={profile?.alias} tempAlias={profile?.tempAlias} currentAlias={characterProfiles[member.character_name]?.alias} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 버스 컨트롤러 버튼 그룹 */}
      {canManage && (
        <div className={`${styles.controller} mb-2 sm:mb-3 p-1.5 sm:p-2.5 rounded-xl bg-[var(--inner-box)] border border-[var(--panel-border)]`}>
          <div className="text-[10.5px] sm:text-xs font-black text-[var(--text-main)] flex items-center gap-1 shrink-0">
            <Crown className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>버스 컨트롤러</span>
          </div>

          <div className={styles.controllerActions}>
            <button type="button" onClick={()=>setEditingParty(structuredClone(party))} disabled={isSyncing || !catalog.loaded || !!catalog.error} className="px-2 py-1 rounded-lg text-xs font-black border border-[var(--accent)] text-[var(--accent)] bg-[var(--panel)] disabled:opacity-50">버스 수정</button>
            {!isStarted ? (
              <button
                type="button"
                onClick={handleStartBus}
                disabled={isSyncing || activeMembers.length === 0 || !catalog.loaded || !!catalog.error}
                className="w-full sm:w-auto px-2 py-1 rounded-md sm:rounded-lg text-[10.5px] sm:text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-700 disabled:opacity-50 transition-all flex items-center justify-center gap-1 shadow-sm cursor-pointer active:scale-95"
              >
                <Play className="w-3 h-3 shrink-0 text-white" />
                <span className="text-white">버스 출발</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCompleteAndNextRound}
                disabled={isSyncing || activeMembers.length === 0 || !catalog.loaded || !!catalog.error}
                className="w-full sm:w-auto px-2 py-1 rounded-md sm:rounded-lg text-[10.5px] sm:text-xs font-black bg-[var(--accent)] text-[var(--accent-fg)] hover:brightness-110 disabled:opacity-50 transition-all flex items-center justify-center gap-1 shadow-sm cursor-pointer active:scale-95"
              >
                <Sparkles className="w-3 h-3 shrink-0" />
                <span>{isSyncing ? "동기화..." : "회차 완료!"}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleReconstructParty}
              disabled={isSyncing || !catalog.loaded || !!catalog.error}
              className="w-full sm:w-auto px-2 py-1 rounded-md sm:rounded-lg text-[10.5px] sm:text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white border border-indigo-700 shadow-sm transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95"
            >
              <RefreshCw className="w-3 h-3 shrink-0 text-white" />
              <span className="text-white">파티 재구성</span>
            </button>

            <button
              type="button"
              onClick={handleCopyRoster}
              disabled={isCopyingRoster || activeMembers.length === 0}
              className="w-full sm:w-auto px-2 py-1 rounded-md sm:rounded-lg text-[10.5px] sm:text-xs font-black bg-sky-600 hover:bg-sky-500 text-white border border-sky-700 disabled:opacity-50 transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95"
            >
              <span className="text-white">{isCopyingRoster ? '복사 중...' : '구성 안내'}</span>
            </button>

            <button
              type="button"
              onClick={handleOpenTransferModal}
              disabled={isLoadingAdmins}
              className="w-full sm:w-auto px-2 py-1 rounded-md sm:rounded-lg text-[10.5px] sm:text-xs font-black bg-amber-500 hover:bg-amber-400 text-zinc-950 border border-amber-600 shadow-sm disabled:opacity-50 transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95"
            >
              <UserCheck className="w-3 h-3 shrink-0 text-zinc-950" />
              <span className="text-zinc-950">{isLoadingAdmins ? '조회중...' : '관리자 인계'}</span>
            </button>

            <button
              type="button"
              onClick={handleAttemptDeleteParty}
              className="w-full sm:w-auto px-2 py-1 rounded-md sm:rounded-lg text-[10.5px] sm:text-xs font-black bg-rose-600 hover:bg-rose-700 text-white border border-rose-700 shadow-sm transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95"
            >
              <Trash2 className="w-3 h-3 shrink-0 text-white" />
              <span className="text-white">해산</span>
            </button>
          </div>
        </div>
      )}

      {/* 참가 캐릭터 리스트 토글 바 */}
      <div className="rounded-xl border border-[var(--panel-border)] bg-[var(--inner-box)] overflow-hidden">
        <button
          type="button"
          onClick={() => setIsPoolModalOpen(true)}
          className={`${styles.participationRow} w-full px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs font-bold text-[var(--text-main)] hover:bg-[var(--panel)]/50 transition-colors cursor-pointer`}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <Users className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
            <span className={styles.readableName}>참가 캐릭터 List ({party.members?.length || 0}캐릭터)</span>
          </div>
          <span className="text-[10px] sm:text-xs text-[var(--accent)] font-bold shrink-0 ml-1">
            상세 보기 ➔
          </span>
        </button>
      </div>

      {/* 하단 내 참여 캐릭터 칩 및 추가 버튼 */}
      <div className="mt-2.5 sm:mt-4 pt-2 sm:pt-3 border-t border-[var(--panel-border)] space-y-1.5">
        <div className={styles.participationRow}>
          <span className="text-[10.5px] sm:text-xs font-bold text-[var(--text-sub)] shrink-0">
            참여 상태: {isMyAccountJoined ? <strong className="text-emerald-600 dark:text-emerald-400">참여 중 ({myJoinedMembers.length}개)</strong> : "미참여"}
          </span>

          {isMyAccountJoined ? (
            <div className="text-[9.5px] sm:text-[11px] font-bold text-[var(--text-sub)] bg-[var(--inner-box)] px-1.5 py-0.5 rounded-md border border-[var(--panel-border)] flex items-center gap-1 shrink-0">
              <span className="flex items-center gap-0.5">
                <RefreshCw className="w-2.5 h-2.5 text-[var(--accent)] inline-block" />
                <span>:반복</span>
              </span>
              <span className="text-[var(--panel-border)]">|</span>
              <span className="flex items-center gap-0.5 text-rose-500">
                <X className="w-2.5 h-2.5 inline-block" />
                <span>:탈퇴</span>
              </span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onJoinClick(party)}
              className="px-2.5 py-1 bg-[var(--accent)] hover:brightness-110 text-[var(--accent-fg)] font-black text-[10.5px] sm:text-xs rounded-lg shadow-xs transition active:scale-95 cursor-pointer flex items-center gap-1 shrink-0"
            >
              <Plus className="w-3 h-3" />
              <span>참여 신청</span>
            </button>
          )}
        </div>

        {isMyAccountJoined && (
          <div className={`${styles.joinedChips} pt-0.5 w-full`}>
            {myJoinedMembers.map((myChar: any, idx: number) => {
              const charName = myChar.character_name || myChar.name;
              const displayName = getDisplayName(myChar);
              const isRepeat = myChar.allow_repeat || false;

              return (
                <div
                  key={`joined-chip-${charName}-${idx}`}
                  className={`${styles.joinedChip} flex items-center justify-between px-1.5 py-0.5 rounded-lg border font-bold transition shadow-xs ${
                    isRepeat
                      ? 'bg-[var(--accent-soft)]/60 border-[var(--accent)] text-[var(--accent)]'
                      : 'bg-[var(--inner-box)] border-[var(--panel-border)] text-[var(--text-main)] hover:border-[var(--accent)]/50'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleToggleRepeat(charName, isRepeat)}
                    disabled={isSyncing}
                    className="flex items-center gap-0.5 min-w-0 flex-1 text-left cursor-pointer"
                    title="클릭 시 반복 참여 설정(ON/OFF)"
                  >
                    <span className={styles.readableName}>{displayName}</span>
                    <RefreshCw 
                      className={`w-3 h-3 shrink-0 transition-colors ${
                        isRepeat ? 'text-[var(--accent)]' : 'text-[var(--text-main)] opacity-70'
                      }`} 
                    />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleLeave(charName)}
                    disabled={isSyncing}
                    className="w-3.5 h-3.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-black flex items-center justify-center text-[8px] transition cursor-pointer shrink-0 ml-1 shadow-xs"
                    title={`${charName} 버스 탈퇴`}
                  >
                    <X className="w-2 h-2 text-white" />
                  </button>
                </div>
              );
            })}

            {myJoinedMembers.length < 6 && (
              <button
                type="button"
                onClick={() => onJoinClick(party)}
                className="flex items-center justify-center gap-0.5 px-2 py-0.5 bg-[var(--panel)] border border-dashed border-[var(--accent)]/60 hover:border-[var(--accent)] text-[var(--accent)] rounded-lg text-[11px] font-bold transition cursor-pointer"
              >
                <Plus className="w-2.5 h-2.5" />
                <span>추가</span>
              </button>
            )}
          </div>
        )}
      </div>

      </div>

      {/* 관리자 인계 모달 */}
      {editingParty && canManage && <BusEditModal party={editingParty} catalog={catalog} accountNickname={currentUserNickname} onClose={()=>setEditingParty(null)} onSaved={onRefresh} />}
      {isTransferModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[100] flex items-center justify-center p-3 animate-in fade-in duration-200" onClick={e=>{if(e.target===e.currentTarget)setIsTransferModalOpen(false);}}>
          <div className="bg-[var(--panel)] border-2 border-[var(--accent)] rounded-2xl p-4 w-full max-w-sm shadow-2xl flex flex-col space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--panel-border)]">
              <div className="flex items-center gap-2 text-sm font-black text-[var(--accent)]">
                <Crown className="w-4 h-4 text-amber-500 shrink-0" />
                <span>👑 버스 관리자 권한 인계</span>
              </div>
              <button
                type="button"
                onClick={() => setIsTransferModalOpen(false)}
                aria-label="관리자 인계 닫기"
                className="text-[var(--text-sub)] hover:text-[var(--text-main)] transition p-0.5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-[var(--text-sub)] font-medium leading-relaxed">
              현재 파티에 참여 중인 관리자(길드마스터/부마스터/부마스터 대행) 중에서 새로운 방장을 선택해주세요.
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
              {eligibleAdmins.map((admin) => (
                <label
                  key={admin.nickname}
                  onClick={() => setSelectedAdmin(admin.nickname)}
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition cursor-pointer ${
                    selectedAdmin === admin.nickname
                      ? 'border-[var(--accent)] bg-[var(--inner-box)] shadow-xs'
                      : 'border-[var(--panel-border)] bg-[var(--inner-box)] hover:border-[var(--accent)]/50'
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

                  <span className="px-2 py-0.5 text-[10px] font-black rounded-md bg-amber-500 text-zinc-950 border border-amber-600">
                    {admin.role || '관리자'}
                  </span>
                </label>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--panel-border)]">
              <button
                type="button"
                onClick={() => setIsTransferModalOpen(false)}
                className="px-3 py-1.5 rounded-xl bg-[var(--inner-box)] border border-[var(--panel-border)] text-xs font-bold text-[var(--text-sub)] hover:text-[var(--text-main)] transition cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleConfirmTransfer}
                className="px-4 py-1.5 rounded-xl bg-[var(--accent)] text-[var(--accent-fg)] text-xs font-black hover:brightness-110 transition shadow-xs cursor-pointer"
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
