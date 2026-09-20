'use client';

import React, { useState } from "react";
import MarkIcon from "@/components/common/MarkIcon";
import PartyCard from "@/components/party/PartyCard";
import GuildBusCard from "@/components/party/GuildBusCard";
import { Party, DIFFICULTY_COLORS } from "@/components/party/types";
import { formatAbyssBadgeText } from "@/lib/busUtils";

const ChevronDown = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
);

const Users = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
);

const Clock = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
);

interface SynaxisPartySectionProps {
  activeParties: Party[] | any[];
  user: any;
  myCharacters: any[];
  allCharactersMap: Record<string, any>;
  formatRoleText?: (role: string) => string;
  openJoinPopup: (party: any) => void;
  setDetailModalParty?: (party: any) => void;
  handleDeleteParty: (partyId: string | number) => void;
  handleLeaveParty?: (party: any, charName: string) => void;
  onCompleteParty?: (party: any) => void;
  onNextRoundClick?: (party: any, completedMembers: any[]) => void;
  setInspectCharacter?: (char: any) => void;
  onRefresh?: () => void;
  router: any;
}

export default function SynaxisPartySection({
  activeParties,
  user,
  myCharacters,
  allCharactersMap,
  openJoinPopup,
  handleDeleteParty,
  handleLeaveParty = () => {},
  onCompleteParty,
  onNextRoundClick,
  setInspectCharacter = () => {},
  onRefresh,
  router,
}: SynaxisPartySectionProps) {
  const [expandedPartyIds, setExpandedPartyIds] = useState<(string | number)[]>([]);

  const toggleAccordion = (id: string | number) => {
    setExpandedPartyIds((prev) =>
      prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id]
    );
  };

  const myCharacterNames = (myCharacters || [])
    .map((c) => c.nickname || c.name || "")
    .filter(Boolean);

  const isAdmin =
    user?.role === "길드마스터" ||
    user?.role === "부마스터" ||
    user?.role === "ADMIN" ||
    user?.role === "MASTER" ||
    user?.role === "SUB_MASTER";

  return (
    <section className="bg-transparent p-0.5 md:p-1">
      {/* 헤더 영역 */}
      <div className="flex flex-row justify-between items-center mb-2.5 pb-2 border-b gap-1.5 md:gap-2 border-[var(--panel-border)]">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <MarkIcon src="/svgs/status mark/마도저항 마크.svg" size="md" colorClass="bg-[var(--accent)]" />
          <div className="min-w-0 flex flex-col items-start justify-center">
            <h2 className="font-black text-xs md:text-sm tracking-tight whitespace-nowrap text-[var(--text-main)] leading-tight">
              Synaxis Live Party List
            </h2>
            <div className="mt-0.5 flex items-center">
              <span className="inline-block text-[0.5rem] md:text-[0.58rem] font-extrabold px-1.5 py-0.5 -ml-1 rounded bg-[var(--accent)] text-[var(--accent-fg)] shadow-xs leading-none whitespace-nowrap">
                Sanctum : 스마트 파티 매칭 시스템 요약
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1.5 shrink-0">
          <button 
            type="button"
            onClick={() => router.push('/party')} 
            className="whitespace-nowrap shrink-0 text-[0.55rem] md:text-[0.6rem] font-bold px-1.5 py-0.5 md:px-2 md:py-1 rounded-md border transition-all active:scale-95 flex items-center gap-0.5 border-[var(--accent)] text-[var(--accent)] bg-[var(--inner-box)] hover:bg-[var(--accent)] hover:text-[var(--accent-fg)] cursor-pointer"
          >
            <span>Learn More</span>
            <span className="text-[0.5rem]">→</span>
          </button>
        </div>
      </div>

      {/* 실시간 파티 리스트 */}
      <div className="flex flex-col gap-2">
        {activeParties.length === 0 ? (
          <div className="text-center py-6 rounded-xl border backdrop-blur bg-[var(--panel)] border-[var(--panel-border)]">
            <p className="text-xs md:text-sm font-bold text-[var(--text-sub)]">
              현재 모집 중인 파티나 운행 중인 길드 버스가 없습니다.
            </p>
            <button
              type="button"
              onClick={() => router.push('/party')}
              className="mt-2 text-xs font-black text-[var(--accent)] hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <span>첫 파티 개설하러 가기</span>
              <span>→</span>
            </button>
          </div>
        ) : (
          activeParties.map((party: any) => {
            const isGuildBus =
              party.party_type === "길드버스" ||
              party.is_guild_bus ||
              (party.sub_content && party.sub_content.includes("길드 버스")) ||
              (party.content_name && party.content_name.includes("길드 버스"));

            const isExpanded = expandedPartyIds.includes(party.id);
            const members = party.members || [];
            const joinedMyChars = members.filter((m: any) =>
              myCharacterNames.includes(m.name || m.character_name || "")
            );
            const isJoined = joinedMyChars.length > 0;
            const isFull = members.length >= (party.max_members || 8);

            const contentMarkSrc =
              party.party_type === "어비스" || (party.content_name && party.content_name.includes("어비스"))
                ? "/svgs/contens mark/어비스 마크.svg"
                : "/svgs/contens mark/레이드 마크.svg";

            // 🎯 동적 약어 뱃지 텍스트 산출 (어비스 ALL / 어비스 허상/물길 등)
            const subKeys = party.selected_sub_contents || party.sub_contents;
            const displayContentName = formatAbyssBadgeText(party.content_name || "", subKeys);

            return (
              <div
                key={party.id}
                className={`rounded-xl border transition-all duration-200 overflow-hidden shadow-sm ${
                  isGuildBus
                    ? 'border-blue-500/50 bg-gradient-to-r from-blue-500/5 via-[var(--panel)] to-[var(--panel)]'
                    : 'border-[var(--panel-border)] bg-[var(--panel)] hover:border-[var(--accent)]'
                }`}
              >
                {/* 1. 초컴팩트 요약 행 */}
                <div className="p-2.5 sm:p-3 flex items-center justify-between gap-2 min-w-0">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-black shrink-0 shadow-xs flex items-center justify-center ${
                        isGuildBus
                          ? "bg-[var(--accent)] text-[var(--accent-fg)] border border-[var(--accent)]"
                          : "bg-slate-700 dark:bg-slate-800 text-slate-100 border border-slate-600/60"
                      }`}
                    >
                      <span>{isGuildBus ? "길드버스" : "자유파티"}</span>
                    </span>

                    <span
                      className={`px-1.5 py-0.5 rounded text-[9.5px] sm:text-[10px] font-bold border shrink-0 hidden sm:inline-block ${
                        DIFFICULTY_COLORS[party.difficulty] || "bg-[var(--panel)] border-[var(--panel-border)] text-[var(--text-main)]"
                      }`}
                    >
                      {party.difficulty}
                    </span>

                    <div className="flex items-center gap-1 min-w-0">
                      <MarkIcon src={contentMarkSrc} size="xs" scale={1.1} colorClass="bg-[var(--accent)]" />
                      <h3 className="text-xs sm:text-sm font-black text-[var(--text-main)] truncate max-w-[130px] sm:max-w-[240px]">
                        {displayContentName}
                      </h3>
                    </div>

                    <div className="hidden md:flex items-center gap-1 text-[11px] text-[var(--text-sub)] font-mono bg-[var(--inner-box)] px-2 py-0.5 rounded-md border border-[var(--panel-border)] shrink-0">
                      <Clock className="w-3 h-3 text-[var(--accent)]" />
                      <span>{party.time_start} ~ {party.time_end}</span>
                    </div>

                    <div className="flex items-center gap-1 text-[10px] sm:text-xs font-bold text-[var(--text-sub)] bg-[var(--inner-box)] px-2 py-0.5 rounded-md border border-[var(--panel-border)] shrink-0">
                      <Users className="w-3 h-3 text-[var(--accent)]" />
                      <span className="font-mono text-[var(--text-main)] font-black">
                        {members.length}/{party.max_members || 8}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {!isFull && !isJoined && (
                      <button
                        type="button"
                        onClick={() => openJoinPopup(party)}
                        className="px-2.5 py-1 bg-[var(--accent)] hover:brightness-110 text-[var(--accent-fg)] font-black text-[11px] sm:text-xs rounded-lg shadow-xs transition active:scale-95 cursor-pointer"
                      >
                        신청
                      </button>
                    )}

                    {isJoined && (
                      <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] sm:text-xs font-black">
                        참여중
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => toggleAccordion(party.id)}
                      className={`p-1.5 rounded-lg border border-[var(--panel-border)] bg-[var(--inner-box)] hover:bg-[var(--panel)] text-[var(--text-sub)] hover:text-[var(--text-main)] transition-all cursor-pointer ${
                        isExpanded ? "rotate-180 bg-[var(--accent)]/10 text-[var(--accent)] border-[var(--accent)]/40" : ""
                      }`}
                      title={isExpanded ? "상세 닫기" : "슬롯 상세 펼치기"}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-2 sm:p-3 border-t border-[var(--panel-border)] bg-[var(--inner-box)]/30 animate-in fade-in duration-200">
                    {isGuildBus ? (
                      <GuildBusCard
                        party={party}
                        currentUserNickname={user?.nickname || ""}
                        currentUserRole={user?.role}
                        onJoinClick={openJoinPopup}
                        onLeaveClick={(p, charName) => handleLeaveParty(p, charName || "")}
                        onDeleteClick={handleDeleteParty}
                        onNextRoundClick={onNextRoundClick}
                        onRefresh={onRefresh}
                        isMasterOrAdmin={isAdmin}
                      />
                    ) : (
                      <PartyCard
                        party={party}
                        myCharacterNames={myCharacterNames}
                        allCharactersMap={allCharactersMap}
                        openJoinPopup={openJoinPopup}
                        setInspectCharacter={setInspectCharacter}
                        handleLeaveParty={handleLeaveParty}
                        handleDeleteParty={handleDeleteParty}
                        onCompleteParty={onCompleteParty}
                        isAdmin={isAdmin}
                        onRefresh={onRefresh}
                      />
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}