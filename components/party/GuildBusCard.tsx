"use client";

import React, { useState, useMemo } from "react";
import ClassIcon from "@/components/common/ClassIcon";
import { Party } from "./types";
import { supabase } from "@/lib/supabase";
import { autoBalanceAndBuildParty } from "@/lib/matchingUtils";

interface GuildBusCardProps {
  party: Party;
  myCharacterNames: string[];
  allCharactersMap: Record<string, any>;
  ownerAccountMap?: Record<string, string>;
  openJoinPopup: (party: Party) => void;
  setInspectCharacter: (char: any) => void;
  handleLeaveParty: (party: Party, charName: string) => void;
  handleDeleteParty: (id: number) => void;
  isAdmin: boolean;
  onRefresh?: () => void;
}

export default function GuildBusCard({
  party,
  myCharacterNames = [],
  allCharactersMap = {},
  ownerAccountMap = {},
  openJoinPopup,
  setInspectCharacter,
  handleLeaveParty,
  handleDeleteParty,
  isAdmin,
  onRefresh
}: GuildBusCardProps) {
  const safeOwnerMap = useMemo(() => {
    if (ownerAccountMap && Object.keys(ownerAccountMap).length > 0) return ownerAccountMap;
    const map: Record<string, string> = {};
    if (allCharactersMap) {
      Object.entries(allCharactersMap).forEach(([nick, char]) => {
        map[nick] = (char as any)?.owner || nick;
      });
    }
    return map;
  }, [ownerAccountMap, allCharactersMap]);

  const busAccountsMap = useMemo(() => {
    const map: Record<string, any[]> = {};
    party.members?.forEach((m: any) => {
      const memName = (m.name || m.character_name || "알수없음") as string;
      const accKey = (m.account_id || safeOwnerMap[memName] || memName) as string;
      if (!map[accKey]) map[accKey] = [];
      map[accKey].push(m);
    });
    return map;
  }, [party.members, safeOwnerMap]);

  const accountCount = Object.keys(busAccountsMap).length;
  const totalCharCount = party.members?.length || 0;

  const myJoinedCharsInParty = useMemo(() => {
    if (!party.members || myCharacterNames.length === 0) return [];
    return party.members.filter((m: any) => {
      const memName = (m.name || m.character_name) as string;
      return myCharacterNames.includes(memName);
    });
  }, [party.members, myCharacterNames]);

  const isJoined = myJoinedCharsInParty.length > 0;
  const isLeaderOrAdmin = isAdmin || (party.leader_name ? myCharacterNames.includes(party.leader_name) : false);
  const isStarted = party.status === "매칭 완료";

  const [showBusAccountModal, setShowBusAccountModal] = useState(false);

  const handleStartBus = async () => {
    if (!confirm(`[${party.content_name}] 길드 버스를 정식 출발 상태로 전환하시겠습니까?`)) return;
    try {
      const { error } = await supabase
        .from("parties")
        .update({ status: "매칭 완료" })
        .eq("id", party.id);
      if (error) throw error;
      alert("🚀 길드 버스가 정식 출발하였습니다!");
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert("시작 처리 실패: " + err.message);
    }
  };

  // 🛠️ [버그 수정] 다음 파티 시작 시 관리자는 변경하지 않고, 다음 회차 파티 구성원만 재구성하여 초록 영역에 피드백 반영
  const handleNextPartyHomework = async () => {
    if (!confirm(`[다음 회차 버스] 다음 회차 파티 구성원으로 전환하시겠습니까?`)) return;
    try {
      const balanced = autoBalanceAndBuildParty(party.members, party.max_members);
      const { error } = await supabase
        .from("parties")
        .update({ 
          members: balanced.members, 
          // leader_name을 변경하지 않고 기존 관리자를 그대로 유지합니다.
          status: "매칭 완료" 
        })
        .eq("id", party.id);

      if (error) throw error;
      alert(`✅ 다음 회차 길드 버스 파티 구성이 적용되었습니다! (관리자 유지: ${party.leader_name || "기존 관리자"})`);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert("다음 파티 시작 실패: " + err.message);
    }
  };

  const handleRebalanceParty = async () => {
    if (!confirm("버스의 승객 및 기사 포지션을 자동 재구성하고 관리자를 추첨하시겠습니까?")) return;
    try {
      const balanced = autoBalanceAndBuildParty(party.members, party.max_members);
      const newLeader = party.leader_name; // 재구성 시에도 기존 관리자 유지 혹은 필요시 추첨
      const { error } = await supabase
        .from("parties")
        .update({ members: balanced.members })
        .eq("id", party.id);
      if (error) throw error;
      alert(`🔄 버스 포지션 재구성 완료!`);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert("재구성 실패: " + err.message);
    }
  };

  return (
    <>
      <div className="rounded-2xl border p-3.5 sm:p-5 transition shadow-sm relative w-full overflow-hidden space-y-3 sm:space-y-4 bg-gradient-to-b from-[var(--panel)] via-[var(--panel)] to-amber-950/20 border-amber-500/60 ring-1 ring-amber-500/30">
        
        {/* 상단 스마트 헤더 영역 */}
        <div className="space-y-2 border-b border-[var(--panel-border)] pb-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-wrap text-[11px] sm:text-xs">
              <span className="bg-amber-500 text-black font-black px-2.5 py-0.5 rounded-lg shadow-xs flex items-center gap-1 whitespace-nowrap">
                <span>🔥</span> 성역 공식 길드 버스
              </span>

              <span className="bg-[var(--inner-box)] border border-[var(--panel-border)] text-[var(--accent)] font-bold px-2 py-0.5 rounded-lg whitespace-nowrap">
                📅 {party.party_date}
              </span>

              <span className={`px-2 py-0.5 rounded-lg font-black whitespace-nowrap ${
                isStarted 
                  ? "bg-emerald-950/80 text-emerald-400 border border-emerald-500/50" 
                  : "bg-amber-950/80 text-amber-400 border border-amber-500/50 animate-pulse"
              }`}>
                {party.status}
              </span>
            </div>

            <div className="shrink-0">
              <button
                type="button"
                onClick={() => setShowBusAccountModal(true)}
                className="bg-amber-950/90 border border-amber-500/80 hover:border-amber-400 text-amber-300 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-black shadow-md hover:scale-105 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                title="클릭하여 계정별 참여 명단 보기"
              >
                <span className="text-amber-400">⚡</span>
                <span>{accountCount}개 계정 · {totalCharCount}개 캐릭터</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-0.5 flex-wrap">
            <h2 className="text-sm sm:text-base md:text-lg font-black text-amber-400 truncate break-keep">
              {party.content_name}
            </h2>
            <span className="bg-amber-950/80 text-amber-300 border border-amber-500/50 text-[11px] font-black px-2 py-0.5 rounded-md shrink-0">
              [{party.difficulty}]
            </span>
          </div>
        </div>

        {/* 파티 상세 설명 & 희망 시간 */}
        <div className="space-y-2 text-xs">
          {party.sub_content && (
            <div className="bg-[var(--inner-box)] border border-[var(--panel-border)] p-2.5 sm:p-3 rounded-xl text-[var(--text-main)] font-medium leading-relaxed break-keep">
              <span className="text-amber-400 font-bold mr-1.5">💬</span>
              <span>{party.sub_content}</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-[var(--text-sub)] font-bold text-[11px] sm:text-xs">
            <span className="text-amber-400 shrink-0">⏰ 희망 시간</span>
            <span className="text-[var(--text-main)] font-black whitespace-nowrap">{party.time_start} ~ {party.time_end}</span>
          </div>
        </div>

        {/* 파티원 참가 목록 (초록 영역 및 계정 카드 목록) */}
        <div className="bg-[var(--inner-box)] border border-[var(--panel-border)] rounded-xl p-2.5 sm:p-3 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[var(--panel-border)]/60 pb-2 text-[11px] sm:text-xs gap-1">
            <span className="font-black text-[var(--text-main)] flex items-center gap-1.5 whitespace-nowrap shrink-0">
              <span>🏛️</span> 파티원 참가 목록
            </span>
            <div className="flex items-center gap-1.5 shrink-0 text-[11px]">
              <span className="text-[var(--text-sub)] font-bold">길드 버스 관리자 :</span>
              <span className="text-amber-300 font-black bg-amber-950/80 px-2 py-0.5 rounded-md border border-amber-500/40">
                {party.leader_name || "미정"}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 sm:gap-2 max-h-48 overflow-y-auto custom-scrollbar p-0.5">
            {Object.entries(busAccountsMap).map(([accKey, membersList], idx) => {
              const isMyAcc = myCharacterNames.some(name => (safeOwnerMap[name] || name) === accKey) || myCharacterNames.includes(accKey);
              const firstMem = membersList[0] || {};
              const repCharName = firstMem.name || firstMem.character_name || "알수없음";
              const repJob = firstMem.job || allCharactersMap[repCharName]?.job || "전사";

              return (
                <div 
                  key={`card-acc-${accKey}-${idx}`}
                  onClick={() => setShowBusAccountModal(true)}
                  className={`border rounded-xl p-2 sm:p-2.5 flex items-center gap-2 text-[11px] sm:text-xs transition cursor-pointer hover:border-amber-400 ${
                    isMyAcc 
                      ? "bg-amber-950/40 border-amber-500/70 text-amber-300 ring-1 ring-amber-500/40" 
                      : "bg-[var(--panel)] border-[var(--panel-border)] text-[var(--text-main)]"
                  }`}
                >
                  <div className="flex flex-col items-center justify-center p-1 sm:p-1.5 bg-[var(--inner-box)] border border-[var(--panel-border)] rounded-lg shrink-0">
                    <ClassIcon job={repJob} className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-black truncate max-w-[90px] sm:max-w-[110px] flex items-center gap-1">
                      <span>{accKey}</span>
                      {isMyAcc && <span className="text-[8px] bg-amber-500 text-black font-black px-1 rounded shrink-0">내 계정</span>}
                    </div>
                    <div className="text-[9px] sm:text-[10px] text-[var(--text-sub)] font-bold">
                      [{membersList.length}개 캐릭터]
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 액션 버튼 바 */}
        <div className="border-t border-[var(--panel-border)] pt-3 mt-1 space-y-2 w-full">
          {/* 관리자(방장) 전용 버스 운영 관리 툴바 */}
          {isLeaderOrAdmin && (
            <div className="flex flex-wrap items-center justify-between gap-2 bg-[var(--inner-box)]/60 p-2 rounded-xl border border-[var(--panel-border)]">
              <span className="text-[10px] font-black text-amber-400/90 flex items-center gap-1 shrink-0">
                <span>⚙️</span> 버스 운영 관리
              </span>

              <div className="flex flex-wrap items-center gap-1.5">
                {!isStarted ? (
                  <button
                    type="button"
                    onClick={handleStartBus}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-3 py-1 rounded-lg text-[11px] transition shadow-xs cursor-pointer active:scale-95 flex items-center gap-1 whitespace-nowrap"
                  >
                    <span>🚀</span>
                    <span>버스 파티 시작!</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleNextPartyHomework}
                    className="bg-amber-600 hover:bg-amber-500 text-white font-black px-3 py-1 rounded-lg text-[11px] transition shadow-xs cursor-pointer active:scale-95 flex items-center gap-1 whitespace-nowrap animate-bounce"
                  >
                    <span>✅</span>
                    <span>다음 파티 시작</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleRebalanceParty}
                  className="bg-indigo-700 hover:bg-indigo-600 text-white font-black px-3 py-1 rounded-lg text-[11px] transition shadow-xs cursor-pointer active:scale-95 flex items-center gap-1 whitespace-nowrap"
                >
                  <span>🔄</span>
                  <span>재구성</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteParty(Number(party.id))}
                  className="bg-rose-900/70 border border-rose-500/50 hover:bg-rose-800 text-rose-300 font-black px-3 py-1 rounded-lg text-[11px] transition shadow-xs cursor-pointer active:scale-95 flex items-center gap-1 whitespace-nowrap"
                >
                  <span>🗑️</span>
                  <span>파티해산</span>
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
            <span className="text-[10px] font-bold text-[var(--text-sub)] flex items-center gap-1 shrink-0">
              <span>👤</span> 캐릭터 파티 관리
            </span>

            <div className="flex flex-wrap items-center gap-1.5">
              {isJoined && myJoinedCharsInParty.map((myChar, mIdx) => {
                const charName = (myChar.name || myChar.character_name) as string;
                return (
                  <button
                    key={`my-joined-char-${charName}-${mIdx}`}
                    type="button"
                    onClick={() => handleLeaveParty(party, charName)}
                    className="bg-amber-950/90 border border-amber-600/80 hover:bg-amber-900 text-amber-300 font-black px-3 py-1 rounded-xl text-[11px] transition shadow-xs cursor-pointer active:scale-95 flex items-center gap-1 whitespace-nowrap"
                  >
                    <span>✋</span>
                    <span>[{charName}] 탈퇴</span>
                  </button>
                );
              })}

              {!isJoined && (
                <button
                  type="button"
                  onClick={() => openJoinPopup(party)}
                  className="bg-amber-500 hover:bg-amber-400 text-black font-extrabold px-3.5 py-1 rounded-xl text-[11px] transition shadow-md cursor-pointer active:scale-95 flex items-center gap-1 whitespace-nowrap"
                >
                  <span>🚌</span>
                  <span>버스 탑승</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 계정별 참여 캐릭터 전체 명단 상세 팝업 모달 */}
      {showBusAccountModal && (
        <div 
          className="fixed inset-0 z-[12000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
          onClick={() => setShowBusAccountModal(false)}
        >
          <div 
            className="bg-[var(--panel)] border border-amber-500/60 rounded-2xl max-w-lg w-full p-4 sm:p-5 shadow-2xl space-y-3.5 max-h-[85vh] flex flex-col relative"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-start border-b border-[var(--panel-border)] pb-3 shrink-0">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-base sm:text-lg">🚌</span>
                  <h3 className="text-xs sm:text-sm font-black text-amber-400">성역 길드 버스 참여 현황 상세</h3>
                </div>
                <p className="text-[11px] sm:text-xs text-[var(--text-sub)] mt-1 font-medium">
                  {party.content_name} ({party.difficulty}) | 총 <strong className="text-amber-300 font-bold">{accountCount}개 계정</strong> (<strong className="text-amber-300 font-bold">{totalCharCount}개 캐릭터</strong>)
                </p>
              </div>
              <button 
                type="button" 
                onClick={() => setShowBusAccountModal(false)} 
                className="text-[var(--text-sub)] hover:text-[var(--text-main)] font-bold text-xs sm:text-sm cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto custom-scrollbar space-y-3 pr-1 flex-1">
              {Object.entries(busAccountsMap).map(([accKey, membersList], idx) => {
                const isMyAccount = myCharacterNames.some(name => (safeOwnerMap[name] || name) === accKey) || myCharacterNames.includes(accKey);

                return (
                  <div 
                    key={`modal-acc-${accKey}-${idx}`}
                    className={`rounded-xl border p-3 space-y-2 transition ${
                      isMyAccount 
                        ? "bg-amber-950/30 border-amber-500/70 ring-1 ring-amber-500/40" 
                        : "bg-[var(--inner-box)] border-[var(--panel-border)]"
                    }`}
                  >
                    <div className="flex items-center justify-between border-b border-[var(--panel-border)]/60 pb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] sm:text-xs font-black text-[var(--text-main)] flex items-center gap-1">
                          <span>👤 계정:</span>
                          <span className="text-amber-300 underline font-extrabold">{accKey}</span>
                        </span>
                        {isMyAccount && (
                          <span className="bg-amber-500 text-black text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-xs">
                            내 계정
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] sm:text-[11px] font-bold text-[var(--text-sub)]">
                        {membersList.length}개 캐릭터 탑승 중
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {membersList.map((m: any, mIdx: number) => {
                        const charName = (m.name || m.character_name) as string;
                        const charObj = allCharactersMap[charName] || {};
                        const job = (m.job || charObj.job || "전사") as string;
                        const cp = Number(m.combat_power || charObj.combat_power || 0);

                        return (
                          <div 
                            key={`modal-mem-${charName}-${mIdx}`}
                            onClick={() => charObj && setInspectCharacter(charObj)}
                            className="bg-[var(--panel)] border border-[var(--panel-border)] rounded-lg p-2 flex items-center gap-2 hover:border-amber-400/80 transition cursor-pointer group"
                          >
                            <div className="p-1 bg-[var(--inner-box)] border border-[var(--panel-border)] rounded-lg shrink-0 group-hover:scale-105 transition">
                              <ClassIcon job={job} className="w-5 h-5 sm:w-6 sm:h-6" />
                            </div>
                            <div className="min-w-0 flex-1 space-y-0.5">
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-[11px] sm:text-xs font-black text-[var(--text-main)] truncate group-hover:text-amber-300 transition">
                                  {charName}
                                </span>
                                {m.is_driver && (
                                  <span className="bg-amber-600 text-white text-[8px] sm:text-[9px] font-black px-1 rounded shrink-0">
                                    기사
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1 text-[9px] sm:text-[10px] text-[var(--text-sub)] font-medium">
                                <span>{job}</span>
                                {cp > 0 && <span>• ⚔️ {cp.toLocaleString()}</span>}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-[var(--panel-border)] flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setShowBusAccountModal(false)}
                className="bg-amber-600 hover:bg-amber-500 text-white font-black px-5 py-1.5 rounded-xl text-xs transition shadow-md cursor-pointer"
              >
                확인 완료
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}