"use client";

import { useState, useEffect, Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { isScheduleConflict, pickRandomLeader } from "../../lib/matchingUtils";

function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function calculateMidpointStartTime(timeRanges: { start: string; end: string }[]): string | null {
  if (!timeRanges || timeRanges.length === 0) return null;

  let maxStart = Math.max(...timeRanges.map(r => timeToMinutes(r.start)));
  let minEnd = Math.min(...timeRanges.map(r => timeToMinutes(r.end)));

  if (maxStart >= minEnd) {
    return timeRanges[0].start;
  }

  const midMinutes = Math.floor((maxStart + minEnd) / 2);
  const roundedMid = Math.round(midMinutes / 15) * 15;
  return minutesToTime(roundedMid);
}

function CustomTimePicker({ value, onChange }: { value: string; onChange: (val: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [h, m] = value.split(":");
  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
  const minutes = ["00", "15", "30", "45"];

  return (
    <div className="relative flex-1">
      {isOpen && <div className="fixed inset-0 z-[60]" onClick={() => setIsOpen(false)}></div>}
      <div 
        onClick={() => setIsOpen(!isOpen)} 
        className={`relative z-[61] bg-[var(--inner-box)] border ${
          isOpen ? "border-[var(--accent)] text-[var(--accent)]" : "border-[var(--panel-border)] text-[var(--text-main)]"
        } hover:border-[var(--accent)] rounded-xl p-2.5 text-xs sm:text-sm font-bold cursor-pointer text-center transition flex justify-center items-center gap-1.5 shadow-xs whitespace-nowrap`}
      >
        <span>{h}:{m}</span>
        <span className={`text-[10px] text-[var(--text-sub)] transition-transform duration-200 ${isOpen ? "rotate-180 text-[var(--accent)]" : ""}`}>▼</span>
      </div>
      {isOpen && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[170px] bg-[var(--panel)] border border-[var(--panel-border)] rounded-xl shadow-2xl z-[65] p-2 flex gap-2 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex-1 h-44 overflow-y-auto custom-scrollbar pr-1 space-y-1">
            {hours.map(hour => (
              <button 
                key={hour} 
                onClick={() => onChange(`${hour}:${m}`)} 
                className={`w-full text-center py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  h === hour ? "bg-[var(--accent)] text-[var(--accent-fg)] font-black" : "text-[var(--text-sub)] hover:bg-[var(--inner-box)] hover:text-[var(--text-main)]"
                }`}
              >
                {hour}시
              </button>
            ))}
          </div>
          <div className="w-px bg-[var(--panel-border)]"></div>
          <div className="flex-1 h-44 overflow-y-auto custom-scrollbar pr-1 space-y-1">
            {minutes.map(minute => (
              <button 
                key={minute} 
                onClick={() => { onChange(`${h}:${minute}`); setIsOpen(false); }} 
                className={`w-full text-center py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  m === minute ? "bg-[var(--accent)] text-[var(--accent-fg)] font-black" : "text-[var(--text-sub)] hover:bg-[var(--inner-box)] hover:text-[var(--text-main)]"
                }`}
              >
                {minute}분
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const ROLE_GROUPS: Record<string, string[]> = {
  "탱커": ["빙결술사", "전사", "기사"],
  "힐러": ["힐러", "사제", "수도사", "음유시인"],
  "근딜": ["검술사", "대검전사", "댄서", "도적", "격투가", "듀얼블레이드"],
  "원딜": ["마법사", "화염술사", "전격술사", "궁수", "장궁병", "석궁사수", "악사", "암흑술사"]
};

const ROLE_COLORS: Record<string, string> = {
  "탱커": "text-sky-400 bg-sky-950/40 border-sky-800/50",
  "힐러": "text-emerald-400 bg-emerald-950/40 border-emerald-800/50",
  "근딜": "text-rose-400 bg-rose-950/40 border-rose-800/50",
  "원딜": "text-amber-400 bg-amber-950/40 border-amber-800/50"
};

const DIFFICULTY_COLORS: Record<string, string> = {
  "입문": "text-purple-400 bg-purple-950/40 border-purple-800/50",
  "어려움": "text-amber-400 bg-amber-950/40 border-amber-800/50",
  "매우 어려움": "text-rose-400 bg-rose-950/40 border-rose-800/50",
  "지옥 1": "text-red-500 bg-red-950/60 border-red-700/80"
};

const CONTENT_DB = [
  { id: "abyss_all", name: "어비스 3종 (통합)", type: "어비스", size: 4, diffs: ["입문", "어려움", "매우 어려움", "지옥 1"] },
  { id: "abyss_1", name: "어비스 - 허상의 정박지", type: "어비스", size: 4, diffs: ["입문", "어려움", "매우 어려움", "지옥 1"] },
  { id: "abyss_2", name: "어비스 - 광기의 동굴", type: "어비스", size: 4, diffs: ["입문", "어려움", "매우 어려움", "지옥 1"] },
  { id: "abyss_3", name: "어비스 - 흩어진 물길", type: "어비스", size: 4, diffs: ["입문", "어려움", "매우 어려움", "지옥 1"] },
  { id: "raid_cav", name: "레이드 - 카브락", type: "레이드", size: 8, diffs: ["입문", "어려움"] },
  { id: "raid_white", name: "레이드 - 화이트 서큐버스", type: "레이드", size: 8, diffs: ["어려움", "매우 어려움"] },
  { id: "raid_eirel", name: "레이드 - 에이렐", type: "레이드", size: 8, diffs: ["어려움"] }
];

const JOB_ICONS: Record<string, string> = { 
  전사: "⚔️", 마법사: "🪄", 화염술사: "🔥", 빙결술사: "❄️", 
  힐러: "💖", 사제: "🕊️", 궁수: "🏹", 기사: "🛡️", 
  대검전사: "🗡️", 도적: "🥷", 댄서: "💃", 검술사: "🤺", 
  격투가: "🥊", 듀얼블레이드: "⚔️", 음유시인: "🎵", 수도사: "🙏", 
  전격술사: "⚡", 장궁병: "🎯", 석궁사수: "🏹", 악사: "🎸", 암흑술사: "🌑" 
};

function SynaxisContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const highlightedPartyId = searchParams.get("id");

  const [user, setUser] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const [activeParties, setActiveParties] = useState<any[]>([]);
  const [showLoreGuide, setShowLoreGuide] = useState(false);
  
  const [myCharacters, setMyCharacters] = useState<any[]>([]);
  const [myCharacterNames, setMyCharacterNames] = useState<string[]>([]);
  const [allCharactersMap, setAllCharactersMap] = useState<Record<string, string>>({});

  const [selectedChar, setSelectedChar] = useState("");
  const [selectedContent, setSelectedContent] = useState(CONTENT_DB[0]);
  const [selectedDiff, setSelectedDiff] = useState(CONTENT_DB[0].diffs[0]);
  const [partyType, setPartyType] = useState<"1회 클리어" | "연속 뺑이">("1회 클리어");
  const [timeStart, setTimeStart] = useState("18:00");
  const [timeEnd, setTimeEnd] = useState("20:00");
  const [partyMemo, setPartyMemo] = useState("");

  const [matchingMode, setMatchingMode] = useState<"모집우선" | "조합우선">("모집우선");
  const [myRoles, setMyRoles] = useState<string[]>([]);
  const [wantedRoles, setWantedRoles] = useState<string[]>([]);

  const [partySearchTerm, setPartySearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"전체" | "모집중" | "모집완료">("전체");

  const [joinPopupParty, setJoinPopupParty] = useState<any>(null);
  const [joinSelectedChar, setJoinSelectedChar] = useState<string>("");
  const [joinSelectedRole, setJoinSelectedRole] = useState<string>("");
  const [joinTimeStart, setJoinTimeStart] = useState<string>("18:00");
  const [joinTimeEnd, setJoinTimeEnd] = useState<string>("24:00");
  const [detailModalParty, setDetailModalParty] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    const savedUser = localStorage.getItem("nexus_user");
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        const ownerName = parsed.username || parsed.nickname || parsed.owner || "한설";
        fetchData(ownerName);
      } catch (e) {
        fetchData("한설");
      }
    } else {
      setUser({ username: "한설" });
      fetchData("한설");
    }
  }, []);

  const fetchData = async (ownerName: string) => {
    try {
      const [charRes, partyRes] = await Promise.all([
        supabase.from("characters").select("*"),
        supabase.from("parties").select("*").neq("status", "종료됨").order("created_at", { ascending: false })
      ]);

      if (charRes.data) {
        const jobMap: Record<string, string> = {};
        charRes.data.forEach(c => { jobMap[c.nickname] = c.job || "전사"; });
        setAllCharactersMap(jobMap);

        const filteredMyChars = charRes.data.filter(c => 
          c.owner === ownerName || c.nickname === ownerName
        );
        
        const myCharsList = filteredMyChars.length > 0 ? filteredMyChars : charRes.data.slice(0, 5);
        setMyCharacters(myCharsList);
        
        const names = myCharsList.map(c => c.nickname);
        setMyCharacterNames(names);
        if (names.length > 0) setSelectedChar(names[0]);
      }

      if (partyRes.data) {
        setActiveParties(partyRes.data);
      }
    } catch (err) {
      console.error("데이터 불러오기 실패", err);
    }
  };

  const toggleRole = (role: string, state: string[], setState: any) => {
    if (state.includes(role)) setState(state.filter(r => r !== role));
    else setState([...state, role]);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const content = CONTENT_DB.find(c => c.id === e.target.value) || CONTENT_DB[0];
    setSelectedContent(content);
    setSelectedDiff(content.diffs[0]);
  };

  const handleReservation = async () => {
    if (!selectedChar) return alert("참여할 캐릭터를 선택해주세요!");
    if (matchingMode === "조합우선" && myRoles.length === 0) {
      return alert("조합 우선 매칭 시, 수행 가능한 포지션을 최소 1개 이상 선택해주세요!");
    }
    const myJob = allCharactersMap[selectedChar] || "전사"; 
    const uniquePartyUid = `party_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;

    const newParty = {
      party_uid: uniquePartyUid,
      content_name: selectedContent.name,
      difficulty: selectedDiff,
      party_type: partyType,
      time_start: timeStart,
      time_end: timeEnd,
      max_members: selectedContent.size,
      matching_mode: matchingMode,
      wanted_roles: matchingMode === "조합우선" ? wantedRoles : [],
      members: [{ name: selectedChar, job: myJob, roles: myRoles, time_start: timeStart, time_end: timeEnd }], 
      status: "모집중",
      memo: partyMemo.trim() || null
    };

    const { error } = await supabase.from("parties").insert([newParty]);
    if (!error) {
      alert(`[${selectedChar}] 파티 예약이 등록되었습니다!`);
      setPartyMemo("");
      const ownerName = user?.username || user?.nickname || user?.owner || "한설";
      fetchData(ownerName);
    } else {
      alert("등록 실패: " + error.message);
    }
  };

  const handleDeleteParty = async (id: number) => {
    if (confirm("정말로 이 파티 모집을 전체 취소 및 삭제하시겠습니까?")) {
      await supabase.from("parties").delete().eq("id", id);
      const ownerName = user?.username || user?.nickname || user?.owner || "한설";
      fetchData(ownerName);
    }
  };

  const handleLeaveParty = async (party: any, charName: string) => {
    if (!confirm(`'${charName}' 캐릭터를 이 파티에서 탈퇴 처리하시겠습니까?`)) return;

    try {
      const leavingMember = party.members.find((m: any) => m.name === charName);
      const remainingMembers = party.members.filter((m: any) => m.name !== charName);

      if (remainingMembers.length === 0) {
        await supabase.from("parties").delete().eq("id", party.id);
        alert("모든 파티원이 탈퇴하여 파티 모집이 자동 삭제되었습니다.");
      } else {
        let updatedWanted = [...(party.wanted_roles || [])];
        if (leavingMember && leavingMember.roles && leavingMember.roles.length > 0) {
          updatedWanted.push(leavingMember.roles[0]);
        }

        const updatePayload: any = {
          members: remainingMembers,
          wanted_roles: updatedWanted,
          status: "모집중",
          final_start_time: null,
          leader_name: remainingMembers[0]?.name || null
        };

        const { error } = await supabase.from("parties").update(updatePayload).eq("id", party.id);
        if (error) throw error;

        alert(`[${charName}] 파티 탈퇴가 완료되었습니다. 파티는 다시 '모집중' 상태로 원복됩니다.`);
      }

      const ownerName = user?.username || user?.nickname || user?.owner || "한설";
      fetchData(ownerName);
    } catch (err: any) {
      alert("탈퇴 처리 중 오류 발생: " + err.message);
    }
  };

  const openJoinPopup = (party: any) => {
    setJoinPopupParty(party);
    setJoinSelectedChar(myCharacters.length > 0 ? myCharacters[0].nickname : "");
    setJoinSelectedRole(party.wanted_roles?.[0] || "딜러");
    setJoinTimeStart(party.time_start);
    setJoinTimeEnd(party.time_end);
  };

  const executeJoinParty = async () => {
    if (!joinSelectedChar || !joinSelectedRole) return alert("캐릭터와 포지션을 선택해주세요!");

    try {
      const [partyRes, allActivePartiesRes] = await Promise.all([
        supabase.from("parties").select("*").eq("id", joinPopupParty.id).single(),
        supabase.from("parties").select("*").neq("status", "종료됨")
      ]);
      const latestParty = partyRes.data;
      if (!latestParty || latestParty.members.length >= latestParty.max_members) return alert("이미 모집이 마감된 파티입니다.");

      if (latestParty.members.some((m: any) => m.name === joinSelectedChar)) {
        return alert(`이미 '${joinSelectedChar}' 캐릭터가 이 파티에 참여 중입니다!`);
      }

      const existingMembers = latestParty.members;
      const allRanges = [...existingMembers.map((m: any) => ({ start: m.time_start, end: m.time_end })), { start: joinTimeStart, end: joinTimeEnd }];
      
      const maxStart = Math.max(...allRanges.map(r => timeToMinutes(r.start)));
      const minEnd = Math.min(...allRanges.map(r => timeToMinutes(r.end)));

      if (maxStart >= minEnd) {
        return alert(`⚠️ [시간 충돌 거부]\n기존 파티원들과 공통으로 겹치는 시간대가 존재하지 않습니다!\n(입력하신 시간: ${joinTimeStart} ~ ${joinTimeEnd})`);
      }

      const mySchedules = allActivePartiesRes.data
        ?.filter(p => p.members.some((m: any) => m.name === joinSelectedChar))
        .map(p => {
          const dur = p.content_name.includes("통합") || p.content_name.includes("3종") ? 45 : 15;
          const myMemInfo = p.members.find((m: any) => m.name === joinSelectedChar);
          const st = p.final_start_time || myMemInfo?.time_start || p.time_start;
          return { start: st, duration: dur };
        }) || [];
      
      const newDur = latestParty.content_name.includes("통합") || latestParty.content_name.includes("3종") ? 45 : 15;
      
      if (isScheduleConflict(joinTimeStart, newDur, mySchedules)) {
         return alert(`⚠️ [일정 충돌 경고]\n'${joinSelectedChar}' 캐릭터는 해당 시간대에 이미 다른 파티 일정이 존재합니다!`);
      }

      const myJob = allCharactersMap[joinSelectedChar] || "전사";
      const newMember = { name: joinSelectedChar, job: myJob, roles: [joinSelectedRole], time_start: joinTimeStart, time_end: joinTimeEnd };
      const updatedMembers = [...latestParty.members, newMember];
      let updatedWanted = [...(latestParty.wanted_roles || [])];
      if (updatedWanted.indexOf(joinSelectedRole) > -1) updatedWanted.splice(updatedWanted.indexOf(joinSelectedRole), 1);

      let updatePayload: any = { members: updatedMembers, wanted_roles: updatedWanted };

      if (updatedMembers.length === latestParty.max_members) {
        const timeRanges = updatedMembers.map(m => ({ start: m.time_start, end: m.time_end }));
        const optimalTime = calculateMidpointStartTime(timeRanges);
        
        updatePayload.final_start_time = optimalTime || latestParty.members[0].time_start;
        updatePayload.status = "모집완료";
        updatePayload.leader_name = pickRandomLeader(updatedMembers);
      } else {
        updatePayload.status = "모집중";
      }

      const { error } = await supabase.from("parties").update(updatePayload).eq("id", joinPopupParty.id);
      if (error) throw error;

      if (updatePayload.status === "모집완료") {
        alert(`🎉 파티 매칭 완료!\n⏰ 확정 출발 시간(중간시각): ${updatePayload.final_start_time}\n👑 파티장: ${updatePayload.leader_name}`);
      } else {
        alert(`[${joinSelectedChar}] 합류 신청이 완료되었습니다!`);
      }
      
      setJoinPopupParty(null);
      const ownerName = user?.username || user?.nickname || user?.owner || "한설";
      fetchData(ownerName);
    } catch (err) { alert("처리 중 오류가 발생했습니다."); }
  };

  const filteredParties = useMemo(() => {
    return activeParties.filter(party => {
      if (statusFilter !== "전체" && party.status !== statusFilter) return false;
      if (partySearchTerm.trim()) {
        const q = partySearchTerm.toLowerCase();
        const matchName = party.content_name?.toLowerCase().includes(q);
        const matchLeader = party.leader_name?.toLowerCase().includes(q) || party.members[0]?.name?.toLowerCase().includes(q);
        const matchMember = party.members?.some((m: any) => m.name.toLowerCase().includes(q));
        if (!matchName && !matchLeader && !matchMember) return false;
      }
      return true;
    });
  }, [activeParties, statusFilter, partySearchTerm]);

  const stats = useMemo(() => {
    const recruiting = activeParties.filter(p => p.status === "모집중").length;
    const completed = activeParties.filter(p => p.status === "모집완료").length;
    return { recruiting, completed, total: activeParties.length };
  }, [activeParties]);

  if (!mounted) return null;

  return (
    <main className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] font-sans pb-20 pt-4 sm:pt-6 relative select-none">
      <div className="max-w-[1400px] mx-auto px-3 sm:px-6 space-y-4 sm:space-y-6 relative z-10">
        
        <header className="relative overflow-hidden rounded-xl bg-[var(--panel)] border border-[var(--panel-border)] py-1.5 px-3 md:py-2.5 md:px-4 shadow-xs transition-colors flex flex-col md:flex-row justify-between items-start md:items-center gap-1.5">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-[var(--accent)] shadow-[0_0_12px_var(--accent)]"></div>
          
          <div className="flex items-center gap-1.5 flex-wrap w-full md:w-auto shrink-0">
            <h1 className="text-base md:text-lg font-black tracking-widest leading-none text-[var(--text-main)] whitespace-nowrap">SYNAXIS</h1>
            <span className="text-[var(--accent)] text-xs font-bold tracking-wide leading-none whitespace-nowrap">
              시낙시스 : 스마트 파티 매칭
            </span>

            <button 
              onClick={() => setShowLoreGuide(true)} 
              className="w-4 h-4 rounded-full bg-[var(--inner-box)] border border-[var(--panel-border)] text-[10px] font-black text-[var(--text-sub)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition cursor-pointer flex items-center justify-center shrink-0 ml-0.5" 
              title="세계관 가이드 보기"
            >
              i
            </button>
          </div>
          
          <div className="hidden md:flex bg-[var(--inner-box)] border border-[var(--panel-border)] px-2.5 py-1 rounded-lg text-xs text-[var(--text-sub)] font-medium items-center gap-2 shrink-0">
            <span className="text-sm shrink-0 leading-none">💡</span>
            <div className="flex flex-col gap-0.5 leading-snug text-[0.72rem] whitespace-nowrap">
              <span>시낙시스는 고대 그리스어로 ‘함께 모이는 것’을 뜻합니다.</span>
              <span className="text-[var(--accent)] font-bold">성역의 전우들과 함께 최적의 시간대로 길을 나서는 공간입니다.</span>
            </div>
          </div>
        </header>

        {showLoreGuide && (
          <div className="fixed inset-0 bg-black/80 z-[10000] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowLoreGuide(false)}>
            <div className="bg-[var(--panel)] border border-[var(--panel-border)] text-[var(--text-main)] rounded-2xl max-w-xl w-full p-5 shadow-2xl relative space-y-3" onClick={e => e.stopPropagation()}>
              <button onClick={() => setShowLoreGuide(false)} className="absolute top-4 right-4 text-[var(--text-sub)] hover:text-[var(--text-main)] text-base font-bold cursor-pointer">✕</button>
              <h2 className="text-base font-black text-[var(--accent)] border-b border-[var(--panel-border)] pb-2 flex items-center gap-1.5">
                <span>🏛️</span> SYNAXIS 파티 게시판 가이드
              </h2>
              <div className="space-y-2 text-xs text-[var(--text-main)] leading-relaxed">
                <p><strong>시낙시스(SYNAXIS)</strong>는 길드원 간의 유연한 레이드 및 어비스 매칭을 지원하는 공간입니다.</p>
                <p>• <strong>스마트 교집합 검증:</strong> 합류 시 기존 멤버들과 공통 시간이 없으면 입구에서 차단됩니다.</p>
                <p>• <strong>자동 재모집 시스템:</strong> 매칭 완료 후 이탈자가 발생하면 자동으로 '모집중' 상태로 원복됩니다.</p>
                <p>• <strong>상태/검색 필터:</strong> 상단 검색창을 통해 원하는 콘텐츠나 파티원을 빠르게 찾아보세요.</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
          
          {/* 📝 좌측: 파티 생성 폼 */}
          <div className="lg:col-span-4 bg-[var(--panel)] rounded-2xl border border-[var(--panel-border)] p-4 sm:p-5 shadow-sm h-fit space-y-4">
            <h2 className="text-base sm:text-lg font-black text-[var(--accent)] flex items-center gap-2 border-b border-[var(--panel-border)] pb-2.5 whitespace-nowrap">
              <span>📅</span> 파티 생성 및 예약
            </h2>
            
            <div className="bg-[var(--inner-box)] border border-[var(--panel-border)] rounded-xl p-3 space-y-1.5">
              <label className="text-[0.65rem] font-bold text-[var(--text-sub)] block whitespace-nowrap">참여할 캐릭터 선택</label>
              <div className="flex flex-wrap gap-1.5">
                {myCharacterNames.map(char => (
                  <button 
                    key={char} 
                    onClick={() => setSelectedChar(char)} 
                    className={`text-xs font-black px-2.5 py-1.5 rounded-lg transition cursor-pointer whitespace-nowrap shrink-0 ${
                      selectedChar === char 
                        ? "bg-[var(--accent)] text-[var(--accent-fg)] shadow-sm" 
                        : "bg-[var(--panel)] border border-[var(--panel-border)] text-[var(--text-sub)] hover:text-[var(--text-main)]"
                    }`}
                  >
                    {JOB_ICONS[allCharactersMap[char]] || "⚔️"} {char}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[0.65rem] font-bold text-[var(--text-sub)] block whitespace-nowrap">파티 목적</label>
              <div className="flex bg-[var(--inner-box)] p-1 rounded-xl border border-[var(--panel-border)] gap-1">
                <button 
                  onClick={() => setPartyType("1회 클리어")} 
                  className={`flex-1 py-1.5 rounded-lg text-xs font-black transition cursor-pointer whitespace-nowrap ${
                    partyType === "1회 클리어" ? "bg-[var(--panel)] text-[var(--text-main)] shadow-xs border border-[var(--panel-border)]" : "text-[var(--text-sub)]"
                  }`}
                >
                  🎯 1회 클리어
                </button>
                <button 
                  onClick={() => setPartyType("연속 뺑이")} 
                  className={`flex-1 py-1.5 rounded-lg text-xs font-black transition cursor-pointer whitespace-nowrap ${
                    partyType === "연속 뺑이" ? "bg-rose-950/40 text-rose-400 border border-rose-800/50 shadow-xs" : "text-[var(--text-sub)]"
                  }`}
                >
                  🔄 연속 뺑이
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[0.65rem] font-bold text-[var(--text-sub)] mb-1 block whitespace-nowrap">목표 컨텐츠</label>
                {/* 🎨 화살표가 우측 끝에 붙지 않도록 pr-9 패딩 여백 보완 적용 */}
                <select 
                  value={selectedContent.id} 
                  onChange={handleContentChange} 
                  className="w-full bg-[var(--inner-box)] border border-[var(--panel-border)] rounded-xl px-3 pr-9 py-2.5 text-xs font-bold text-[var(--text-main)] focus:border-[var(--accent)] outline-none cursor-pointer"
                >
                  {CONTENT_DB.map(c => <option key={c.id} value={c.id}>{c.name} ({c.size}인)</option>)}
                </select>
              </div>
              
              <div className="bg-[var(--inner-box)] p-3 rounded-xl border border-[var(--panel-border)] space-y-1.5">
                <label className="text-[0.65rem] font-bold text-[var(--text-sub)] block whitespace-nowrap">난이도 선택</label>
                <div className="flex flex-wrap gap-1.5">
                  {selectedContent.diffs.map(diff => (
                    <button 
                      key={diff} 
                      onClick={() => setSelectedDiff(diff)} 
                      className={`text-xs font-black px-2.5 py-1 rounded-lg border transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                        selectedDiff === diff 
                          ? DIFFICULTY_COLORS[diff] + " scale-105 shadow-xs" 
                          : "bg-[var(--panel)] text-[var(--text-sub)] border-[var(--panel-border)]"
                      }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[0.65rem] font-black text-[var(--accent)] mb-1 block whitespace-nowrap">가능 희망 시간 범위</label>
                <div className="flex items-center gap-2">
                  <CustomTimePicker value={timeStart} onChange={setTimeStart} />
                  <span className="text-[var(--text-sub)] font-bold shrink-0">~</span>
                  <CustomTimePicker value={timeEnd} onChange={setTimeEnd} />
                </div>
              </div>

              <div>
                <label className="text-[0.65rem] font-bold text-[var(--text-sub)] mb-1 block whitespace-nowrap">파티 한 줄 메모 (선택)</label>
                <input 
                  type="text"
                  placeholder="예: 클리어 후 바로 해산 / 트라이팟입니다."
                  value={partyMemo}
                  onChange={e => setPartyMemo(e.target.value)}
                  className="w-full bg-[var(--inner-box)] border border-[var(--panel-border)] rounded-xl px-3 py-2 text-xs font-bold text-[var(--text-main)] outline-none focus:border-[var(--accent)]"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-[var(--panel-border)] space-y-2">
              <label className="text-[0.65rem] font-bold text-[var(--text-sub)] block whitespace-nowrap">매칭 방식</label>
              <div className="flex bg-[var(--inner-box)] p-1 rounded-xl border border-[var(--panel-border)] gap-1">
                <button 
                  onClick={() => setMatchingMode("모집우선")} 
                  className={`flex-1 py-1.5 rounded-lg text-xs font-black transition cursor-pointer whitespace-nowrap ${
                    matchingMode === "모집우선" ? "bg-[var(--panel)] text-[var(--text-main)] shadow-xs border border-[var(--panel-border)]" : "text-[var(--text-sub)]"
                  }`}
                >
                  ⚡ 모집우선
                </button>
                <button 
                  onClick={() => setMatchingMode("조합우선")} 
                  className={`flex-1 py-1.5 rounded-lg text-xs font-black transition cursor-pointer whitespace-nowrap ${
                    matchingMode === "조합우선" ? "bg-indigo-600 text-white shadow-xs" : "text-[var(--text-sub)]"
                  }`}
                >
                  🛡️ 조합우선
                </button>
              </div>
            </div>

            {matchingMode === "조합우선" && (
              <div className="bg-[var(--inner-box)] p-3.5 rounded-xl border border-indigo-900/50 space-y-3 animate-in fade-in duration-150">
                <div>
                  <label className="text-[0.62rem] font-black text-indigo-400 mb-1 block whitespace-nowrap">내 수락 가능 포지션</label>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.keys(ROLE_GROUPS).map(role => (
                      <button 
                        key={role} 
                        onClick={() => toggleRole(role, myRoles, setMyRoles)} 
                        className={`text-xs font-bold px-2.5 py-1 rounded-lg border cursor-pointer whitespace-nowrap shrink-0 ${
                          myRoles.includes(role) ? ROLE_COLORS[role] : "bg-[var(--panel)] border-[var(--panel-border)] text-[var(--text-sub)]"
                        }`}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[0.62rem] font-black text-rose-400 mb-1 block whitespace-nowrap">구인 희망 포지션 (Wanted)</label>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.keys(ROLE_GROUPS).map(role => (
                      <button 
                        key={role} 
                        onClick={() => toggleRole(role, wantedRoles, setWantedRoles)} 
                        className={`text-xs font-bold px-2.5 py-1 rounded-lg border cursor-pointer whitespace-nowrap shrink-0 ${
                          wantedRoles.includes(role) ? "bg-rose-950/60 text-rose-300 border-rose-500" : "bg-[var(--panel)] border-[var(--panel-border)] text-[var(--text-sub)]"
                        }`}
                      >
                        + {role}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <button 
              onClick={handleReservation} 
              className="w-full bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-[var(--accent-fg)] font-black py-3 rounded-xl shadow-md transition cursor-pointer text-sm tracking-wider whitespace-nowrap"
            >
              ⚔️ 파티 예약 대기열 등록
            </button>
          </div>

          {/* 🔥 우측: 실시간 파티 게시판 */}
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-[var(--panel)] rounded-2xl border border-[var(--panel-border)] p-4 sm:p-5 shadow-sm space-y-4">
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-[var(--panel-border)] pb-3 gap-2.5">
                <h2 className="text-base sm:text-lg font-black text-[var(--text-main)] flex items-center gap-2 whitespace-nowrap">
                  <span>🔥</span> 실시간 파티 게시판
                </h2>
                
                <div className="flex items-center gap-2 text-[0.7rem] font-bold bg-[var(--inner-box)] px-3 py-1.5 rounded-xl border border-[var(--panel-border)] whitespace-nowrap overflow-x-auto max-w-full">
                  <span className="text-emerald-400">모집중: {stats.recruiting}파티</span>
                  <span className="text-[var(--panel-border)]">|</span>
                  <span className="text-indigo-400">매칭완료: {stats.completed}파티</span>
                  <span className="text-[var(--panel-border)]">|</span>
                  <span className="text-[var(--text-sub)]">전체: {stats.total}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2">
                <input 
                  type="text" 
                  placeholder="콘텐츠명, 방장 또는 캐릭터 검색..."
                  value={partySearchTerm}
                  onChange={e => setPartySearchTerm(e.target.value)}
                  className="bg-[var(--inner-box)] border border-[var(--panel-border)] px-3 py-2 rounded-xl text-xs font-bold text-[var(--text-main)] outline-none focus:border-[var(--accent)] w-full flex-1"
                />
                
                <div className="flex items-center bg-[var(--inner-box)] p-1 rounded-xl border border-[var(--panel-border)] w-full sm:w-auto shrink-0">
                  {(["전체", "모집중", "모집완료"] as const).map(st => (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                        statusFilter === st ? "bg-[var(--accent)] text-[var(--accent-fg)] font-black" : "text-[var(--text-sub)] hover:text-[var(--text-main)]"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="space-y-3 max-h-[700px] overflow-y-auto custom-scrollbar pr-1">
                {filteredParties.length === 0 ? (
                  <div className="text-center py-20 text-[var(--text-sub)] font-bold text-xs sm:text-sm">
                    조건에 일치하는 파티가 없습니다.
                  </div>
                ) : (
                  filteredParties.map(party => {
                    const myJoinedChars = party.members.filter((m: any) => myCharacterNames.includes(m.name));
                    const isMyParty = myJoinedChars.length > 0;
                    const isLeader = party.members[0]?.name && myCharacterNames.includes(party.members[0]?.name);
                    const isFull = party.members.length >= party.max_members;
                    const isOver4 = party.max_members > 4;
                    const isCompleted = party.status === "모집완료";
                    
                    const isHighlighted = (highlightedPartyId && party.party_uid === highlightedPartyId) || 
                                          String(party.id) === String(highlightedPartyId);

                    return (
                      <div 
                        key={party.id} 
                        id={`party-${party.id}`}
                        className={`bg-[var(--inner-box)] border rounded-2xl p-3.5 sm:p-4 flex flex-col gap-3 shadow-xs transition-all relative overflow-hidden ${
                          isHighlighted 
                            ? "border-emerald-400 ring-2 ring-emerald-500/50 bg-emerald-950/10 shadow-[0_0_15px_rgba(16,185,129,0.3)]" 
                            : party.party_type === "연속 뺑이" 
                              ? "border-rose-900/40" 
                              : "border-[var(--panel-border)]"
                        } ${isCompleted ? "bg-indigo-950/20 border-indigo-700/50" : ""}`}
                      >
                        {isHighlighted && (
                          <div className="bg-emerald-500 text-black text-[0.55rem] font-black px-2 py-0.5 rounded-br-lg absolute top-0 left-0 whitespace-nowrap">
                            🎯 선택된 파티
                          </div>
                        )}

                        <div className="flex justify-between items-start gap-2 border-b border-[var(--panel-border)] pb-2.5">
                          <div className="flex flex-col min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                              {isCompleted ? (
                                <span className="text-[0.6rem] font-black bg-indigo-600 text-white px-2 py-0.5 rounded shadow-xs whitespace-nowrap shrink-0">
                                  ✅ 매칭완료
                                </span>
                              ) : (
                                <span className="text-[0.6rem] font-black bg-[var(--panel)] text-[var(--text-sub)] px-1.5 py-0.5 rounded border border-[var(--panel-border)] whitespace-nowrap shrink-0">
                                  대기중
                                </span>
                              )}
                              <span className={`text-[0.6rem] font-bold px-1.5 py-0.5 rounded border whitespace-nowrap shrink-0 ${DIFFICULTY_COLORS[party.difficulty] || "text-[var(--text-sub)] bg-[var(--panel)] border-[var(--panel-border)]"}`}>
                                {party.difficulty}
                              </span>
                              <span className="text-[0.6rem] font-bold text-[var(--text-sub)] bg-[var(--panel)] px-1.5 py-0.5 rounded border border-[var(--panel-border)] whitespace-nowrap shrink-0">
                                {party.max_members}인팟
                              </span>
                              {party.party_type === "연속 뺑이" && (
                                <span className="text-[0.6rem] font-bold text-rose-400 bg-rose-950/30 px-1.5 py-0.5 rounded border border-rose-800/40 whitespace-nowrap shrink-0">
                                  🔄 연속 뺑이
                                </span>
                              )}
                            </div>
                            
                            <h3 className={`text-base font-black ${isCompleted ? "text-indigo-200" : "text-[var(--text-main)]"} leading-tight truncate flex items-center gap-2`}>
                              <span>{party.content_name}</span>
                            </h3>

                            {party.memo && (
                              <p className="text-[0.68rem] text-[var(--accent)] font-medium mt-1 bg-[var(--panel)] px-2 py-1 rounded-lg border border-[var(--panel-border)] truncate">
                                💬 "{party.memo}"
                              </p>
                            )}
                            
                            <div className="mt-1">
                              {isCompleted ? (
                                <span className="text-[0.65rem] bg-amber-500/20 px-2 py-0.5 rounded text-amber-400 font-black border border-amber-500/40 inline-flex items-center gap-1 animate-pulse whitespace-nowrap shrink-0">
                                  ⏰ 확정 출발 시간(중간): {party.final_start_time}
                                </span>
                              ) : (
                                <span className="text-[0.65rem] text-[var(--accent)] font-mono font-bold whitespace-nowrap">
                                  ⏰ 희망 범위 {party.time_start} ~ {party.time_end}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-1.5 shrink-0">
                            <span className="text-xs font-black text-[var(--text-main)] bg-[var(--panel)] border border-[var(--panel-border)] px-2.5 py-1 rounded-full whitespace-nowrap">
                              {party.members.length} / {party.max_members} 명
                            </span>
                            {isFull ? (
                              <button disabled className="text-xs font-bold bg-[var(--panel)] text-[var(--text-sub)] border border-[var(--panel-border)] px-3 py-1 rounded-lg cursor-not-allowed opacity-60 whitespace-nowrap shrink-0">
                                모집 마감
                              </button>
                            ) : (
                              <button 
                                onClick={() => openJoinPopup(party)} 
                                className="text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 rounded-lg shadow-sm transition cursor-pointer whitespace-nowrap shrink-0"
                              >
                                ⚔️ 참여 신청
                              </button>
                            )}
                          </div>
                        </div>

                        {party.matching_mode === "조합우선" && party.wanted_roles && party.wanted_roles.length > 0 && (
                          <div className="flex items-center gap-1.5 bg-[var(--panel)] border border-rose-900/30 px-2.5 py-1.5 rounded-xl flex-wrap">
                            <span className="text-[0.55rem] font-black text-rose-500 animate-pulse whitespace-nowrap shrink-0">WANTED</span>
                            {party.wanted_roles.map((role: string) => (
                              <span key={role} className="text-[0.58rem] font-black bg-rose-950/50 text-rose-300 px-1.5 py-0.5 rounded border border-rose-800/50 whitespace-nowrap shrink-0">
                                {role}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center justify-between gap-1.5 bg-[var(--panel)] p-2 rounded-xl border border-[var(--panel-border)]">
                          <div className="flex gap-1.5 overflow-x-auto custom-scrollbar flex-1 pb-0.5">
                            {Array.from({ length: isOver4 ? 4 : party.max_members }).map((_, i) => {
                              const m = party.members[i];
                              const actualJob = m ? (allCharactersMap[m.name] || m.job || "전사") : "";
                              return m ? (
                                <div 
                                  key={i} 
                                  className={`flex flex-col items-center justify-center border ${
                                    isCompleted && party.leader_name === m.name 
                                      ? "bg-amber-500/20 border-amber-500/50" 
                                      : "bg-[var(--inner-box)] border-[var(--panel-border)]"
                                  } rounded-lg p-1 w-12 h-14 shrink-0 relative`}
                                >
                                  <span className="text-sm leading-none mb-0.5">{JOB_ICONS[actualJob] || "👤"}</span>
                                  <span className="text-[0.52rem] text-[var(--text-main)] truncate w-full text-center font-bold">{m.name}</span>
                                  {m.roles && m.roles.length > 0 && (
                                    <span className="absolute bottom-0 bg-indigo-600 w-full text-center text-[0.45rem] text-white rounded-b-md truncate px-0.5 font-bold whitespace-nowrap">
                                      {m.roles[0]}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <div key={i} className="flex flex-col items-center justify-center bg-[var(--inner-box)]/50 border border-dashed border-[var(--panel-border)] rounded-lg p-1 w-12 h-14 shrink-0">
                                  <span className="text-[0.5rem] text-[var(--text-sub)] opacity-50 whitespace-nowrap">빈자리</span>
                                </div>
                              );
                            })}
                          </div>

                          {isOver4 && (
                            <button 
                              onClick={() => setDetailModalParty(party)} 
                              className="bg-[var(--inner-box)] hover:bg-[var(--panel)] border border-[var(--panel-border)] text-[var(--text-sub)] text-[0.6rem] font-bold px-2.5 py-3 rounded-lg flex flex-col items-center justify-center gap-0.5 transition shrink-0 cursor-pointer whitespace-nowrap"
                            >
                              <span>+보기</span>
                              <span className="text-[0.5rem] opacity-70">({party.members.length}/{party.max_members})</span>
                            </button>
                          )}
                        </div>

                        <div className="text-[0.62rem] text-[var(--text-sub)] font-medium flex justify-between items-center pt-0.5 whitespace-nowrap flex-wrap gap-2">
                          <span>파티장: <span className="text-[var(--text-main)] font-bold">{isCompleted ? `👑 ${party.leader_name}` : party.members[0]?.name || "알 수 없음"}</span></span>
                          
                          <div className="flex items-center gap-2">
                            {myJoinedChars.map((m: any) => (
                              <button 
                                key={m.name} 
                                onClick={() => handleLeaveParty(party, m.name)} 
                                className="text-[0.58rem] text-amber-400 hover:underline cursor-pointer bg-amber-950/30 px-2 py-0.5 rounded border border-amber-800/40 whitespace-nowrap"
                              >
                                👋 [{m.name}] 탈퇴하기
                              </button>
                            ))}

                            {isLeader && (
                              <button onClick={() => handleDeleteParty(party.id)} className="text-[0.58rem] text-rose-400 hover:underline cursor-pointer bg-rose-950/30 px-2 py-0.5 rounded border border-rose-800/40 whitespace-nowrap">
                                🗑️ 파티 전체삭제
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {joinPopupParty && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setJoinPopupParty(null)}>
          <div className="bg-[var(--panel)] border border-[var(--panel-border)] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="bg-[var(--inner-box)] p-4 border-b border-[var(--panel-border)] flex justify-between items-center">
              <h2 className="text-base font-black text-[var(--text-main)] whitespace-nowrap">⚔️ 파티 합류 신청</h2>
              <button onClick={() => setJoinPopupParty(null)} className="text-[var(--text-sub)] hover:text-[var(--text-main)] text-lg font-bold cursor-pointer">✕</button>
            </div>
            
            <div className="p-5 space-y-4 bg-[var(--panel)]">
              <div className="bg-[var(--inner-box)] p-3 rounded-xl border border-[var(--panel-border)] text-center space-y-0.5">
                <p className="text-xs font-black text-[var(--accent)]">{joinPopupParty.content_name} ({joinPopupParty.difficulty})</p>
                <p className="text-[0.65rem] text-[var(--text-sub)] font-mono">⏰ 파티 희망 범위: {joinPopupParty.time_start} ~ {joinPopupParty.time_end}</p>
              </div>

              <div>
                <label className="text-[0.65rem] font-bold text-[var(--text-sub)] mb-1.5 block whitespace-nowrap">1. 합류할 캐릭터 선택</label>
                <div className="flex flex-wrap gap-1.5">
                  {myCharacters.map(char => (
                    <button 
                      key={char.id} 
                      onClick={() => setJoinSelectedChar(char.nickname)} 
                      className={`text-xs font-bold px-3 py-1.5 rounded-lg transition cursor-pointer whitespace-nowrap shrink-0 ${
                        joinSelectedChar === char.nickname 
                          ? "bg-[var(--accent)] text-[var(--accent-fg)] font-black shadow-xs" 
                          : "bg-[var(--inner-box)] text-[var(--text-sub)] border border-[var(--panel-border)]"
                      }`}
                    >
                      {JOB_ICONS[char.job] || "⚔️"} {char.nickname}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[0.65rem] font-bold text-[var(--text-sub)] mb-1.5 block whitespace-nowrap">2. 포지션 선택</label>
                {joinPopupParty.wanted_roles && joinPopupParty.wanted_roles.length > 0 && (
                  <div className="mb-2 bg-rose-950/20 border border-rose-900/40 p-2.5 rounded-xl space-y-1">
                    <p className="text-[0.58rem] text-rose-400 font-bold whitespace-nowrap">🔥 파티에서 급구 중인 포지션입니다!</p>
                    <div className="flex gap-1.5 flex-wrap">
                      {joinPopupParty.wanted_roles.map((role: string) => (
                        <button 
                          key={role} 
                          onClick={() => setJoinSelectedRole(role)} 
                          className={`text-xs font-bold px-2.5 py-1 rounded-lg transition cursor-pointer whitespace-nowrap shrink-0 ${
                            joinSelectedRole === role ? "bg-rose-600 text-white font-black" : "bg-rose-950/40 text-rose-300 border border-rose-700/50"
                          }`}
                        >
                          {role}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex flex-wrap gap-1.5">
                  {["탱커", "힐러", "근딜", "원딜"].map(role => (
                    <button 
                      key={role} 
                      onClick={() => setJoinSelectedRole(role)} 
                      className={`text-xs font-bold px-3 py-1.5 rounded-lg transition cursor-pointer whitespace-nowrap shrink-0 ${
                        joinSelectedRole === role ? "bg-indigo-600 text-white font-black" : "bg-[var(--inner-box)] text-[var(--text-sub)] border border-[var(--panel-border)]"
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-[var(--inner-box)] border border-[var(--panel-border)] p-3 rounded-xl space-y-1">
                <label className="text-[0.65rem] font-black text-[var(--accent)] block whitespace-nowrap">3. 본인의 가능 시간 입력 (교집합 검증)</label>
                <div className="flex items-center gap-2 pt-1">
                  <CustomTimePicker value={joinTimeStart} onChange={setJoinTimeStart} />
                  <span className="text-[var(--text-sub)] font-bold shrink-0">~</span>
                  <CustomTimePicker value={joinTimeEnd} onChange={setJoinTimeEnd} />
                </div>
              </div>
            </div>

            <div className="p-4 bg-[var(--inner-box)] border-t border-[var(--panel-border)] flex gap-2">
              <button 
                onClick={() => setJoinPopupParty(null)} 
                className="flex-1 bg-[var(--panel)] border border-[var(--panel-border)] text-[var(--text-sub)] font-bold py-2.5 rounded-xl text-xs cursor-pointer whitespace-nowrap"
              >
                취소
              </button>
              <button 
                onClick={executeJoinParty} 
                className="flex-[2] bg-emerald-600 hover:bg-emerald-500 text-white font-black py-2.5 rounded-xl shadow-md transition text-xs cursor-pointer whitespace-nowrap"
              >
                시간 검증 및 합류 신청!
              </button>
            </div>
          </div>
        </div>
      )}

      {detailModalParty && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setDetailModalParty(null)}>
          <div className="bg-[var(--panel)] border border-[var(--panel-border)] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="bg-[var(--inner-box)] p-4 border-b border-[var(--panel-border)] flex justify-between items-center">
              <h3 className="text-[var(--text-main)] font-black text-sm whitespace-nowrap">👥 {detailModalParty.content_name} 전체 멤버 ({detailModalParty.members.length}/{detailModalParty.max_members})</h3>
              <button onClick={() => setDetailModalParty(null)} className="text-[var(--text-sub)] hover:text-[var(--text-main)] text-base font-bold cursor-pointer">✕</button>
            </div>
            
            <div className="p-4 grid grid-cols-4 gap-2 bg-[var(--panel)] max-h-[60vh] overflow-y-auto custom-scrollbar">
              {Array.from({ length: detailModalParty.max_members }).map((_, i) => {
                const m = detailModalParty.members[i];
                const actualJob = m ? (allCharactersMap[m.name] || m.job || "전사") : "";
                return m ? (
                  <div 
                    key={i} 
                    className={`flex flex-col items-center justify-center border ${
                      detailModalParty.status === "모집완료" && detailModalParty.leader_name === m.name 
                        ? "bg-amber-500/20 border-amber-500/50" 
                        : "bg-[var(--inner-box)] border-[var(--panel-border)]"
                    } rounded-xl p-2 h-20 relative`}
                  >
                    <span className="text-2xl mb-1">{JOB_ICONS[actualJob] || "👤"}</span>
                    <span className="text-[0.6rem] text-[var(--text-main)] truncate w-full text-center font-bold">{m.name}</span>
                    {m.roles && m.roles.length > 0 && (
                      <span className="absolute bottom-0 bg-indigo-600 w-full text-center text-[0.48rem] text-white rounded-b-lg truncate px-0.5 font-bold whitespace-nowrap">
                        {m.roles[0]}
                      </span>
                    )}
                  </div>
                ) : (
                  <div key={i} className="flex flex-col items-center justify-center bg-[var(--inner-box)]/50 border border-dashed border-[var(--panel-border)] rounded-xl p-2 h-20">
                    <span className="text-[0.55rem] text-[var(--text-sub)] opacity-50 whitespace-nowrap">빈자리</span>
                  </div>
                );
              })}
            </div>
            
            <div className="p-3 bg-[var(--inner-box)] border-t border-[var(--panel-border)] text-right">
              <button onClick={() => setDetailModalParty(null)} className="bg-[var(--panel)] border border-[var(--panel-border)] text-[var(--text-main)] text-xs font-bold px-4 py-1.5 rounded-lg cursor-pointer whitespace-nowrap">
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--panel-border); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: var(--accent); }
      `}} />
    </main>
  );
}

export default function PartyPage() {
  return (
    <Suspense fallback={<div className="w-full text-center py-20 font-bold text-[var(--text-sub)]">시낙시스 매칭 시스템 불러오는 중...</div>}>
      <SynaxisContent />
    </Suspense>
  );
}