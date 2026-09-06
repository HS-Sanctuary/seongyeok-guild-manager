"use client";

import React, { useMemo } from "react";
import ClassIcon from "@/components/common/ClassIcon";
import { Party } from "./types";
import { supabase } from "@/lib/supabase";
import { autoBalanceAndBuildParty, pickRandomLeader } from "@/lib/matchingUtils";

interface PartyCardProps {
  party: Party;
  myCharacterNames: string[];
  allCharactersMap: Record<string, any>;
  openJoinPopup: (party: Party) => void;
  setInspectCharacter: (char: any) => void;
  handleLeaveParty: (party: Party, charName: string) => void;
  handleDeleteParty: (id: number) => void;
  isAdmin: boolean;
  onRefresh?: () => void;
}

export default function PartyCard({
  party,
  myCharacterNames = [],
  allCharactersMap = {},
  openJoinPopup,
  setInspectCharacter,
  handleLeaveParty,
  handleDeleteParty,
  isAdmin,
  onRefresh
}: PartyCardProps) {
  // 내 캐릭터 참여 현황
  const myJoinedCharsInParty = useMemo(() => {
    if (!party.members || myCharacterNames.length === 0) return [];
    return party.members.filter((m: any) => {
      const memName = (m.name || m.character_name) as string;
      return myCharacterNames.includes(memName);
    });
  }, [party.members, myCharacterNames]);

  const isJoined = myJoinedCharsInParty.length > 0;
  // 💡 수정: party.leader_name이 undefined일 수 있으므로 안전한 조건식 처리
  const isLeaderOrAdmin = isAdmin || (party.leader_name ? myCharacterNames.includes(party.leader_name) : false);

  // 파티 시작 처리
  const handleStartParty = async () => {
    if (!confirm(`[${party.content_name}] 파티를 출발 처리하시겠습니까?`)) return;
    try {
      const { error } = await supabase
        .from("parties")
        .update({ status: "매칭 완료" })
        .eq("id", party.id);
      if (error) throw error;
      alert("🚀 파티가 성공적으로 시작되었습니다!");
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert("시작 처리 실패: " + err.message);
    }
  };

  // 파티 포지션 재구성
  const handleRebalanceParty = async () => {
    if (!confirm("파티 포지션을 자동으로 재구성하고 새로운 파티장을 추첨하시겠습니까?")) return;
    try {
      const balanced = autoBalanceAndBuildParty(party.members, party.max_members);
      const newLeader = pickRandomLeader(balanced.members);
      const { error } = await supabase
        .from("parties")
        .update({ members: balanced.members, leader_name: newLeader })
        .eq("id", party.id);
      if (error) throw error;
      alert(`🔄 파티 재구성 완료! 새로운 파티장: ${newLeader}`);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert("재구성 실패: " + err.message);
    }
  };

  return (
    <div className="rounded-2xl border p-3.5 sm:p-5 transition shadow-sm relative w-full overflow-hidden space-y-3 sm:space-y-4 bg-[var(--panel)] border-[var(--panel-border)]">
      
      {/* 1. 상단 스마트 헤더 */}
      <div className="space-y-2 border-b border-[var(--panel-border)] pb-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap text-[11px] sm:text-xs">
            <span className="bg-[var(--inner-box)] border border-[var(--panel-border)] text-[var(--accent)] font-bold px-2 py-0.5 rounded-lg whitespace-nowrap">
              📅 {party.party_date}
            </span>
            <span className={`px-2 py-0.5 rounded-lg font-black whitespace-nowrap ${
              party.status === "매칭 완료" 
                ? "bg-emerald-950/80 text-emerald-400 border border-emerald-500/50" 
                : "bg-amber-950/80 text-amber-400 border border-amber-500/50 animate-pulse"
            }`}>
              {party.status}
            </span>
          </div>

          <div className="bg-[var(--inner-box)] border border-[var(--panel-border)] text-[var(--text-main)] px-2.5 py-1 rounded-xl text-[11px] sm:text-xs font-black flex items-center gap-1 whitespace-nowrap shrink-0">
            <span>👥</span>
            <span>{party.members?.length || 0} / {party.max_members} 명</span>
          </div>
        </div>

        {/* 파티 제목 및 난이도 통합 */}
        <div className="flex items-center gap-2 pt-0.5 flex-wrap">
          <h2 className="text-sm sm:text-base md:text-lg font-black text-[var(--accent)] truncate break-keep">
            {party.content_name}
          </h2>
          <span className="bg-[var(--inner-box)] border border-[var(--panel-border)] text-[var(--text-sub)] text-[11px] font-bold px-2 py-0.5 rounded-md shrink-0">
            [{party.difficulty}]
          </span>
        </div>
      </div>

      {/* 2. 파티 설명 & 시간대 */}
      <div className="space-y-2 text-xs">
        {party.sub_content && (
          <div className="bg-[var(--inner-box)] border border-[var(--panel-border)] p-2.5 sm:p-3 rounded-xl text-[var(--text-main)] font-medium leading-relaxed break-keep">
            <span className="text-[var(--accent)] font-bold mr-1.5">💬</span>
            <span>{party.sub_content}</span>
          </div>
        )}

        <div className="flex items-center gap-2 text-[var(--text-sub)] font-bold text-[11px] sm:text-xs">
          <span className="text-[var(--accent)] shrink-0">⏰ 희망 시간</span>
          <span className="text-[var(--text-main)] font-black whitespace-nowrap">{party.time_start} ~ {party.time_end}</span>
        </div>
      </div>

      {/* 3. 파티원 참가 목록 */}
      <div className="bg-[var(--inner-box)] border border-[var(--panel-border)] rounded-xl p-2.5 sm:p-3 space-y-2">
        <div className="flex items-center justify-between border-b border-[var(--panel-border)]/60 pb-2 text-[11px] sm:text-xs">
          <span className="font-black text-[var(--text-main)] flex items-center gap-1.5 whitespace-nowrap shrink-0">
            <span>🏛️</span> 파티원 참가 목록
          </span>
          <div className="flex items-center gap-1 shrink-0 text-[11px]">
            <span className="text-[var(--text-sub)] font-bold">파티장:</span>
            <span className="text-[var(--text-main)] font-black bg-[var(--panel)] px-2 py-0.5 rounded-md border border-[var(--panel-border)]">
              {party.leader_name || "미정"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {party.members?.map((m: any, idx: number) => {
            const charName = (m.name || m.character_name || "") as string;
            const charObj = allCharactersMap[charName];
            const job = (m.job || charObj?.job || "전사") as string;

            return (
              <div 
                key={idx}
                onClick={() => charObj && setInspectCharacter(charObj)}
                className="bg-[var(--panel)] border border-[var(--panel-border)] rounded-lg p-2 flex items-center gap-2 hover:border-[var(--accent)] transition cursor-pointer"
              >
                <ClassIcon job={job} className="w-5 h-5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-black text-[var(--text-main)] truncate">{charName}</div>
                  <div className="text-[9px] text-[var(--text-sub)] font-medium">{m.role || "딜러"}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. 하단 버튼 바 */}
      <div className="border-t border-[var(--panel-border)] pt-3 mt-1 flex flex-wrap items-center justify-end gap-1.5 w-full">
        {isLeaderOrAdmin && party.status !== "매칭 완료" && (
          <button
            type="button"
            onClick={handleStartParty}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-3 py-1 rounded-xl text-[11px] transition shadow-xs cursor-pointer active:scale-95 flex items-center gap-1 shrink-0 whitespace-nowrap"
          >
            <span>🚀</span>
            <span>파티 시작</span>
          </button>
        )}

        {isLeaderOrAdmin && (
          <button
            type="button"
            onClick={handleRebalanceParty}
            className="bg-indigo-700 hover:bg-indigo-600 text-white font-black px-3 py-1 rounded-xl text-[11px] transition shadow-xs cursor-pointer active:scale-95 flex items-center gap-1 shrink-0 whitespace-nowrap"
          >
            <span>🔄</span>
            <span>재구성</span>
          </button>
        )}

        {isJoined && myJoinedCharsInParty.map(myChar => {
          // 💡 수정: charName이 string임을 보장하도록 타입 단언 적용
          const charName = (myChar.name || myChar.character_name || "") as string;
          return (
            <button
              key={charName}
              type="button"
              onClick={() => handleLeaveParty(party, charName)}
              className="bg-amber-950/80 border border-amber-600/70 hover:bg-amber-900 text-amber-300 font-black px-3 py-1 rounded-xl text-[11px] transition shadow-xs cursor-pointer active:scale-95 flex items-center gap-1 shrink-0 whitespace-nowrap"
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
            className="bg-[var(--accent)] text-[var(--accent-fg)] font-black px-3.5 py-1 rounded-xl text-[11px] transition shadow-md cursor-pointer active:scale-95 flex items-center gap-1 shrink-0 whitespace-nowrap"
          >
            <span>⚔️</span>
            <span>파티 신청</span>
          </button>
        )}

        {isLeaderOrAdmin && (
          <button
            type="button"
            // 💡 수정: party.id를 Number()로 감싸서 number 타입 매개변수 규격 준수
            onClick={() => handleDeleteParty(Number(party.id))}
            className="bg-rose-900/60 border border-rose-500/40 hover:bg-rose-800 text-rose-300 font-black px-3 py-1 rounded-xl text-[11px] transition shadow-xs cursor-pointer active:scale-95 flex items-center gap-1 shrink-0 whitespace-nowrap"
          >
            <span>🗑️</span>
            <span>삭제</span>
          </button>
        )}
      </div>
    </div>
  );
}