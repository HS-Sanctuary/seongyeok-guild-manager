"use client";

import { ClassIcon } from "@/components/common/ClassIcon";
import { DIFFICULTY_COLORS, Party } from "./types";

interface PartyCardProps {
  party: Party;
  myCharacterNames: string[];
  allCharactersMap: Record<string, any>;
  getTodayString: () => string;
  openJoinPopup: (party: Party) => void;
  setInspectCharacter: (char: any) => void;
  handleLeaveParty: (party: Party, charName: string) => void;
  handleDeleteParty: (id: number) => void;
  isAdmin: boolean;
}

export default function PartyCard({
  party,
  myCharacterNames,
  allCharactersMap,
  getTodayString,
  openJoinPopup,
  setInspectCharacter,
  handleLeaveParty,
  handleDeleteParty,
  isAdmin
}: PartyCardProps) {
  const isGuildBus = party.party_type === "GUILD_BUS";
  const myJoinedChars = party.members.filter(m => myCharacterNames.includes(m.name));
  const isLeader = party.members[0]?.name && myCharacterNames.includes(party.members[0]?.name);
  const isFull = party.members.length >= party.max_members;
  const isCompleted = party.status === "매칭 완료" || party.status === "모집완료";
  const partyDateStr = party.party_date || getTodayString();
  const memoDisplay = party.sub_content || party.memo;
  const rawType = party.party_type || "1회 클리어";
  const displayPartyType = rawType === "연속 뺑이" ? "반복 뺑이" : isGuildBus ? "🚌 길드 버스" : rawType;

  return (
    <div 
      className={`bg-[var(--inner-box)] border rounded-2xl p-4 flex flex-col gap-3 shadow-xs transition-all relative overflow-hidden ${
        isGuildBus 
          ? "border-amber-500/80 bg-gradient-to-r from-amber-500/10 via-[var(--inner-box)] to-[var(--inner-box)] ring-1 ring-amber-500/30" 
          : isCompleted
          ? "border-indigo-500/60 bg-indigo-500/5"
          : "border-[var(--panel-border)] hover:border-[var(--accent)]"
      }`}
    >
      {isGuildBus && (
        <div className="absolute top-0 right-0 bg-amber-500 text-black font-black text-[10px] px-3 py-1 rounded-bl-xl shadow-xs">
          🔥 성역 공식 길드 버스
        </div>
      )}

      <div className="flex justify-between items-start gap-2 border-b border-[var(--panel-border)] pb-2.5">
        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            <span className="text-[10px] font-black bg-[var(--accent)] text-[var(--accent-fg)] px-2 py-0.5 rounded-lg whitespace-nowrap">📅 {partyDateStr}</span>
            {isCompleted ? (
              <span className="text-[10px] font-black bg-indigo-600 text-white px-2 py-0.5 rounded-lg whitespace-nowrap">✅ 매칭 완료</span>
            ) : (
              <span className="text-[10px] font-black bg-[var(--panel)] text-[var(--text-sub)] px-2 py-0.5 rounded-lg border border-[var(--panel-border)] whitespace-nowrap">모집 중</span>
            )}
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border whitespace-nowrap ${DIFFICULTY_COLORS[party.difficulty] || "text-[var(--text-sub)]"}`}>{party.difficulty}</span>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border whitespace-nowrap ${isGuildBus ? "text-amber-400 bg-amber-500/20 border-amber-500/40" : "text-[var(--text-sub)]"}`}>{displayPartyType}</span>
          </div>
          <h3 className={`text-base font-black truncate ${isGuildBus ? "text-amber-400" : "text-[var(--text-main)]"}`}>{party.content_name}</h3>
          {memoDisplay && <p className="text-xs text-[var(--accent)] font-bold mt-1 bg-[var(--panel)] px-2.5 py-1 rounded-xl border border-[var(--panel-border)] break-all">💬 &quot;{memoDisplay}&quot;</p>}
          <div className="mt-1">
            {isCompleted ? (
              <span className="text-xs bg-amber-500/20 px-2.5 py-0.5 rounded-lg text-amber-400 font-black border border-amber-500/40 whitespace-nowrap">⏰ 확정 출발: {party.final_start_time}</span>
            ) : (
              <span className="text-xs text-[var(--accent)] font-mono font-bold whitespace-nowrap">⏰ 희망 시간 {party.time_start} ~ {party.time_end}</span>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <span className="text-xs font-black text-[var(--text-main)] bg-[var(--panel)] border border-[var(--panel-border)] px-3 py-1 rounded-full whitespace-nowrap">{party.members.length} / {party.max_members} 명</span>
          {isFull ? (
            <button type="button" disabled className="text-xs font-bold bg-[var(--panel)] text-[var(--text-sub)] border border-[var(--panel-border)] px-3 py-1.5 rounded-xl opacity-60 whitespace-nowrap">모집 마감</button>
          ) : (
            <button type="button" onClick={() => openJoinPopup(party)} className={`text-xs font-black px-3.5 py-1.5 rounded-xl shadow-xs transition cursor-pointer whitespace-nowrap ${isGuildBus ? "bg-amber-600 hover:bg-amber-500 text-white" : "bg-emerald-600 hover:bg-emerald-500 text-white"}`}>
              {isGuildBus ? "🚌 버스 탑승" : "⚔️ 합류 신청"}
            </button>
          )}
        </div>
      </div>

      {/* 멤버 슬롯 바 */}
      <div className="flex items-center justify-between gap-2 bg-[var(--panel)] p-2.5 rounded-2xl border border-[var(--panel-border)] overflow-hidden">
        <div className="flex gap-2 overflow-x-auto custom-scrollbar flex-1 pb-0.5">
          {Array.from({ length: party.max_members }).map((_, i) => {
            const m = party.members[i];
            const charObj = m ? allCharactersMap[m.name] : null;
            const actualJob = m ? (charObj?.job || m.job || "전사") : "";
            return m ? (
              <div key={i} onClick={() => setInspectCharacter(charObj || { nickname: m.name, job: actualJob })} className="flex flex-col items-center justify-center border bg-[var(--inner-box)] border-[var(--panel-border)] rounded-xl p-1.5 w-14 h-16 shrink-0 relative cursor-pointer hover:border-[var(--accent)] overflow-hidden shadow-xs">
                <ClassIcon job={actualJob} className="w-5 h-5 mb-0.5 shrink-0" />
                <span className="text-[10px] text-[var(--text-main)] truncate w-full text-center font-bold px-0.5">{m.name}</span>
                {m.roles && m.roles.length > 0 && <span className="absolute bottom-0 bg-indigo-600 w-full text-center text-[8px] text-white rounded-b-xl truncate px-0.5 font-bold">{m.roles[0]}</span>}
              </div>
            ) : (
              <div key={i} className="flex flex-col items-center justify-center bg-[var(--inner-box)]/50 border border-dashed border-[var(--panel-border)] rounded-xl p-1.5 w-14 h-16 shrink-0">
                <span className="text-[9px] text-[var(--text-sub)] opacity-50">빈자리</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="text-xs text-[var(--text-sub)] font-medium flex justify-between items-center pt-0.5 flex-wrap gap-1">
        <span className="truncate">파티장/기사: <span className="text-[var(--text-main)] font-bold">{isCompleted ? `👑 ${party.leader_name}` : party.members[0]?.name || "알 수 없음"}</span></span>
        <div className="flex items-center gap-2 shrink-0">
          {myJoinedChars.map(m => (
            <button type="button" key={m.name} onClick={() => handleLeaveParty(party, m.name)} className="text-[10px] text-amber-400 hover:underline cursor-pointer bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/30 font-bold whitespace-nowrap">
              👋 [{m.name}] 탈퇴
            </button>
          ))}
          {(isLeader || isAdmin) && (
            <button type="button" onClick={() => handleDeleteParty(party.id)} className="text-[10px] text-rose-400 hover:underline cursor-pointer bg-rose-500/10 px-2 py-0.5 rounded-lg border border-rose-500/30 font-bold whitespace-nowrap">
              🗑️ 파티 취소
            </button>
          )}
        </div>
      </div>
    </div>
  );
}