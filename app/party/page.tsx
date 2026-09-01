"use client";

import { useState, useEffect, Suspense, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { isScheduleConflict, pickRandomLeader } from "../../lib/matchingUtils";
import { ClassIcon } from "../../components/common/ClassIcon";

// ==========================================
// 1. 유틸리티 함수 및 상수 정의
// ==========================================
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

function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// 마비노기 모바일 주간 주기 계산 (목요일 00:00 ~ 수요일 23:59)
function getMabinogiWeekRange(dateStr: string) {
  const date = new Date(dateStr);
  const day = date.getDay(); // 0: 일, 1: 월, ... 4: 목, ... 6: 토
  const diffToThursday = day >= 4 ? day - 4 : 3 + (7 - day);
  const thursday = new Date(date);
  thursday.setDate(date.getDate() - diffToThursday);
  thursday.setHours(0, 0, 0, 0);

  const wednesday = new Date(thursday);
  wednesday.setDate(thursday.getDate() + 6);
  wednesday.setHours(23, 59, 59, 999);

  return {
    start: thursday.toISOString().split("T")[0],
    end: wednesday.toISOString().split("T")[0]
  };
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
        } hover:border-[var(--accent)] rounded-lg py-1 px-1.5 sm:py-1.5 sm:px-2 text-[11px] sm:text-xs font-bold cursor-pointer text-center transition flex justify-center items-center gap-1 shadow-xs whitespace-nowrap`}
      >
        <span>{h}:{m}</span>
        <span className={`text-[8px] sm:text-[9px] text-[var(--text-sub)] transition-transform duration-200 ${isOpen ? "rotate-180 text-[var(--accent)]" : ""}`}>▼</span>
      </div>
      {isOpen && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 w-[150px] sm:w-[160px] bg-[var(--panel)] border border-[var(--panel-border)] rounded-xl shadow-2xl z-[65] p-2 flex gap-1.5 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex-1 h-32 sm:h-36 overflow-y-auto custom-scrollbar pr-1 space-y-0.5">
            {hours.map(hour => (
              <button 
                key={hour} 
                onClick={() => onChange(`${hour}:${m}`)} 
                className={`w-full text-center py-0.5 sm:py-1 rounded-md text-[11px] sm:text-xs font-bold transition whitespace-nowrap ${
                  h === hour ? "bg-[var(--accent)] text-[var(--accent-fg)] font-black" : "text-[var(--text-sub)] hover:bg-[var(--inner-box)] hover:text-[var(--text-main)]"
                }`}
              >
                {hour}시
              </button>
            ))}
          </div>
          <div className="w-px bg-[var(--panel-border)]"></div>
          <div className="flex-1 h-32 sm:h-36 overflow-y-auto custom-scrollbar pr-1 space-y-0.5">
            {minutes.map(minute => (
              <button 
                key={minute} 
                onClick={() => { onChange(`${h}:${minute}`); setIsOpen(false); }} 
                className={`w-full text-center py-0.5 sm:py-1 rounded-md text-[11px] sm:text-xs font-bold transition whitespace-nowrap ${
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
  "탱커": "text-[var(--accent)] bg-[var(--inner-box)] border-[var(--panel-border)] font-bold",
  "힐러": "text-emerald-500 dark:text-emerald-400 bg-[var(--inner-box)] border-[var(--panel-border)] font-bold",
  "근딜": "text-rose-500 dark:text-rose-400 bg-[var(--inner-box)] border-[var(--panel-border)] font-bold",
  "원딜": "text-amber-500 dark:text-amber-400 bg-[var(--inner-box)] border-[var(--panel-border)] font-bold"
};

const DIFFICULTY_COLORS: Record<string, string> = {
  "입문": "text-purple-600 dark:text-purple-400 bg-[var(--panel)] border-[var(--panel-border)]",
  "어려움": "text-amber-600 dark:text-amber-400 bg-[var(--panel)] border-[var(--panel-border)]",
  "매우 어려움": "text-rose-600 dark:text-rose-400 bg-[var(--panel)] border-[var(--panel-border)]",
  "지옥 1": "text-red-600 dark:text-red-500 bg-[var(--panel)] border-[var(--panel-border)]",
  "지옥 2": "text-rose-700 dark:text-rose-300 bg-[var(--panel)] border-[var(--panel-border)]"
};

const CONTENT_DB = [
  { id: "abyss_all", name: "어비스 3종 (통합)", type: "어비스", size: 4, diffs: ["입문", "어려움", "매우 어려움", "지옥 1"] },
  { id: "abyss_1", name: "어비스 - 허상의 정박지", type: "어비스", size: 4, diffs: ["매우 어려움", "지옥 1", "지옥 2"] },
  { id: "abyss_2", name: "어비스 - 광기의 동굴", type: "어비스", size: 4, diffs: ["매우 어려움", "지옥 1", "지옥 2"] },
  { id: "abyss_3", name: "어비스 - 흩어진 물길", type: "어비스", size: 4, diffs: ["매우 어려움", "지옥 1", "지옥 2"] },
  { id: "raid_cav", name: "레이드 - 카브락", type: "레이드", size: 8, diffs: ["입문", "어려움"] },
  { id: "raid_white", name: "레이드 - 화이트 서큐버스", type: "레이드", size: 8, diffs: ["어려움", "매우 어려움"] },
  { id: "raid_airel", name: "레이드 - 에이렐", type: "레이드", size: 8, diffs: ["어려움", "매우 어려움", "지옥 1"] }
];

// ==========================================
// 2. 메인 컴포넌트
// ==========================================
function SynaxisContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const highlightedPartyId = searchParams.get("id");

  const [user, setUser] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const [activeParties, setActiveParties] = useState<any[]>([]);
  const [showLoreGuide, setShowLoreGuide] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const [isMobileFormOpen, setIsMobileFormOpen] = useState(false);
  const [showBusCreateModal, setShowBusCreateModal] = useState(false);

  const [fabPos, setFabPos] = useState<{ x: number; y: number } | null>(null);
  const [isDraggingFab, setIsDraggingFab] = useState(false);
  const fabDragRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number; moved: boolean }>({
    startX: 0, startY: 0, initialX: 0, initialY: 0, moved: false,
  });

  const [myCharacters, setMyCharacters] = useState<any[]>([]);
  const [myCharacterNames, setMyCharacterNames] = useState<string[]>([]);
  const [allCharactersMap, setAllCharactersMap] = useState<Record<string, any>>({});
  const [ownerAccountMap, setOwnerAccountMap] = useState<Record<string, string>>({});

  const [activeDateFilter, setActiveDateFilter] = useState<string>("전체");

  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [calendarYearMonth, setCalendarYearMonth] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const [selectedChar, setSelectedChar] = useState("");
  const [selectedContent, setSelectedContent] = useState(CONTENT_DB[0]);
  const [selectedDiff, setSelectedDiff] = useState(CONTENT_DB[0].diffs[0]);
  const [partyType, setPartyType] = useState<"1회 클리어" | "반복 뺑이">("1회 클리어");
  const [loopSubMode, setLoopSubMode] = useState<"회차" | "시간">("회차");
  const [minRuns, setMinRuns] = useState("2");
  const [maxRuns, setMaxRuns] = useState("5");
  const [loopHoursCount, setLoopHoursCount] = useState("1");
  const [loopHoursMin, setLoopHoursMin] = useState("00");
  const [timeStart, setTimeStart] = useState("18:00");
  const [timeEnd, setTimeEnd] = useState("20:00");
  const [partyMemo, setPartyMemo] = useState("");
  const [matchingMode, setMatchingMode] = useState<"모집우선" | "조합우선">("모집우선");
  const [myRoles, setMyRoles] = useState<string[]>([]);
  const [wantedRoles, setWantedRoles] = useState<string[]>([]);
  const [partySearchTerm, setPartySearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"전체" | "모집중" | "모집완료">("전체");

  const [busCreateContent, setBusCreateContent] = useState(CONTENT_DB[0]);
  const [busCreateDiff, setBusCreateDiff] = useState(CONTENT_DB[0].diffs[0]);
  const [busCreateDate, setBusCreateDate] = useState(() => getTodayString());
  const [busCreateTimeStart, setBusCreateTimeStart] = useState("20:00");
  const [busCreateTimeEnd, setBusCreateTimeEnd] = useState("23:59");
  const [busCreateMemo, setBusCreateMemo] = useState("성역 정기 길드 버스 운행");

  const [joinPopupParty, setJoinPopupParty] = useState<any>(null);
  const [joinSelectedChar, setJoinSelectedChar] = useState<string>("");
  const [joinSelectedRole, setJoinSelectedRole] = useState<string>("");
  const [joinTimeStart, setJoinTimeStart] = useState<string>("18:00");
  const [joinTimeEnd, setJoinTimeEnd] = useState<string>("24:00");
  const [detailModalParty, setDetailModalParty] = useState<any>(null);
  const [inspectCharacter, setInspectCharacter] = useState<any>(null);

  // ESC 키 모달 닫기 이벤트 리스너
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowLoreGuide(false);
        setShowBusCreateModal(false);
        setShowCalendarModal(false);
        setInspectCharacter(null);
        setJoinPopupParty(null);
        setDetailModalParty(null);
        setIsMobileFormOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    setMounted(true);
    const savedUser = localStorage.getItem("nexus_user");
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        const ownerName = parsed.username || parsed.nickname || parsed.owner || "한설";
        if (parsed.nickname === "한설" || parsed.role === "admin") setIsAdmin(true);
        fetchData(ownerName);
      } catch (e) {
        setIsAdmin(true);
        fetchData("한설");
      }
    } else {
      setUser({ username: "한설" });
      setIsAdmin(true);
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
        const jobMap: Record<string, any> = {};
        const ownerMap: Record<string, string> = {};
        charRes.data.forEach(c => { 
          jobMap[c.nickname] = c; 
          ownerMap[c.nickname] = c.owner || c.nickname;
        });
        setAllCharactersMap(jobMap);
        setOwnerAccountMap(ownerMap);

        const filteredMyChars = charRes.data.filter(c => c.owner === ownerName || c.nickname === ownerName);
        const myCharsList = filteredMyChars.length > 0 ? filteredMyChars : charRes.data;
        setMyCharacters(myCharsList);
        const names = myCharsList.map(c => c.nickname);
        setMyCharacterNames(names);
        if (names.length > 0) setSelectedChar(names[0]);
      }

      if (partyRes.data) {
        setActiveParties(partyRes.data);
      }
    } catch (err) {
      console.error("데이터 로드 실패", err);
    }
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const content = CONTENT_DB.find(c => c.id === e.target.value) || CONTENT_DB[0];
    setSelectedContent(content);
    setSelectedDiff(content.diffs[0]);
  };

  const handleFabTouchStart = (e: React.TouchEvent<HTMLButtonElement>) => {
    const touch = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    fabDragRef.current = { startX: touch.clientX, startY: touch.clientY, initialX: rect.left, initialY: rect.top, moved: false };
  };
  const handleFabTouchMove = (e: React.TouchEvent<HTMLButtonElement>) => {
    const touch = e.touches[0];
    const dx = touch.clientX - fabDragRef.current.startX;
    const dy = touch.clientY - fabDragRef.current.startY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      fabDragRef.current.moved = true;
      setIsDraggingFab(true);
    }
    if (fabDragRef.current.moved) {
      const newX = Math.max(8, Math.min(window.innerWidth - 115, fabDragRef.current.initialX + dx));
      const newY = Math.max(8, Math.min(window.innerHeight - 45, fabDragRef.current.initialY + dy));
      setFabPos({ x: newX, y: newY });
    }
  };
  const handleFabTouchEnd = () => setTimeout(() => setIsDraggingFab(false), 50);
  const handleFabMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    fabDragRef.current = { startX: e.clientX, startY: e.clientY, initialX: rect.left, initialY: rect.top, moved: false };
    const onMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - fabDragRef.current.startX;
      const dy = moveEvent.clientY - fabDragRef.current.startY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        fabDragRef.current.moved = true;
        setIsDraggingFab(true);
      }
      if (fabDragRef.current.moved) {
        const newX = Math.max(8, Math.min(window.innerWidth - 115, fabDragRef.current.initialX + dx));
        const newY = Math.max(8, Math.min(window.innerHeight - 45, fabDragRef.current.initialY + dy));
        setFabPos({ x: newX, y: newY });
      }
    };
    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      setTimeout(() => setIsDraggingFab(false), 50);
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };
  const handleFabClick = () => {
    if (fabDragRef.current.moved) return;
    setIsMobileFormOpen(prev => !prev);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleRole = (role: string, state: string[], setState: any) => {
    if (state.includes(role)) setState(state.filter(r => r !== role));
    else setState([...state, role]);
  };

  const handleReservation = async () => {
    if (!selectedChar) return alert("참여할 캐릭터를 선택해주세요!");
    if (matchingMode === "조합우선" && myRoles.length === 0) {
      return alert("조합 우선 매칭 시, 수행 가능한 포지션을 최소 1개 이상 선택해주세요!");
    }

    const targetDate = activeDateFilter === "전체" ? getTodayString() : activeDateFilter;
    const myExistingParties = activeParties.filter(p => 
      (p.party_date || getTodayString()) === targetDate && 
      p.members.some((m: any) => m.name === selectedChar)
    );
    const newDur = selectedContent.name.includes("통합") || selectedContent.name.includes("3종") ? 45 : 15;
    const existingSchedules = myExistingParties.map(p => {
      const myMem = p.members.find((m: any) => m.name === selectedChar);
      const st = p.final_start_time || myMem?.time_start || p.time_start;
      return { start: st, duration: newDur };
    });

    if (isScheduleConflict(timeStart, newDur, existingSchedules)) {
      return alert(`⚠️ [일정 충돌 경고]\n'${selectedChar}' 캐릭터는 ${targetDate} 해당 시간대에 이미 다른 파티 일정이 존재합니다!`);
    }

    const myCharObj = allCharactersMap[selectedChar];
    const myJob = myCharObj?.job || "전사"; 
    const dbPartyType = partyType === "반복 뺑이" ? "연속 뺑이" : "1회 클리어";

    let defaultMemo = "";
    if (partyType === "반복 뺑이") {
      if (loopSubMode === "회차") {
        defaultMemo = `매칭 시간으로부터 ${minRuns}~${maxRuns}회 반복 클리어 예정`;
      } else {
        const minText = loopHoursMin !== "00" ? ` ${loopHoursMin}분` : "";
        const hourText = loopHoursCount !== "0" ? `${loopHoursCount}시간` : "";
        defaultMemo = `매칭 시간으로부터 ${hourText}${minText} 동안 반복 클리어 예정`;
      }
    }

    const finalSubContent = partyMemo.trim() || defaultMemo;

    const newParty: any = {
      content_name: selectedContent.name,
      sub_content: finalSubContent || null,
      difficulty: selectedDiff,
      party_type: dbPartyType,
      party_date: targetDate,
      time_start: timeStart,
      time_end: timeEnd,
      max_members: selectedContent.size,
      matching_mode: matchingMode,
      wanted_roles: matchingMode === "조합우선" ? wantedRoles : [],
      members: [{ name: selectedChar, job: myJob, roles: myRoles, time_start: timeStart, time_end: timeEnd }], 
      status: "모집중",
      leader_name: selectedChar
    };

    const { error } = await supabase.from("parties").insert([newParty]);
    if (!error) {
      alert(`[${targetDate} / ${selectedChar}] 파티 매칭이 등록되었습니다!`);
      setPartyMemo("");
      setIsMobileFormOpen(false);
      const ownerName = user?.username || user?.nickname || user?.owner || "한설";
      fetchData(ownerName);
    } else {
      alert("등록 실패: " + error.message);
    }
  };

  const handleCreateGuildBus = async () => {
    if (!isAdmin) return alert("관리자 권한이 필요합니다.");
    
    const adminCharName = myCharacters[0]?.nickname || user?.username || "한설";
    const adminCharObj = allCharactersMap[adminCharName];
    const adminJob = adminCharObj?.job || "전사";

    const busPartyPayload = {
      content_name: busCreateContent.name,
      sub_content: busCreateMemo,
      difficulty: busCreateDiff,
      party_type: "GUILD_BUS",
      party_date: busCreateDate,
      time_start: busCreateTimeStart,
      time_end: busCreateTimeEnd,
      max_members: busCreateContent.size,
      matching_mode: "모집우선",
      wanted_roles: ["탱커", "힐러", "근딜", "원딜"],
      members: [
        { 
          name: adminCharName, 
          job: adminJob, 
          roles: ["탱커", "기사"], 
          time_start: busCreateTimeStart, 
          time_end: busCreateTimeEnd,
          is_driver: true 
        }
      ],
      status: "모집중",
      leader_name: adminCharName
    };

    const { error } = await supabase.from("parties").insert([busPartyPayload]);
    if (!error) {
      alert(`🚌 [${busCreateDate}] 성역 길드 버스 파티가 성공적으로 개설되었습니다! 해당 주 동안 최상단에 고정됩니다.`);
      setShowBusCreateModal(false);
      const ownerName = user?.username || user?.nickname || user?.owner || "한설";
      fetchData(ownerName);
    } else {
      alert("버스 개설 실패: " + error.message);
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
        alert(`[${charName}] 파티 탈퇴가 완료되었습니다.`);
      }
      const ownerName = user?.username || user?.nickname || user?.owner || "한설";
      fetchData(ownerName);
    } catch (err: any) {
      alert("탈퇴 처리 중 오류: " + err.message);
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

      const candidateOwner = ownerAccountMap[joinSelectedChar] || joinSelectedChar;
      const alreadyJoinedOwner = latestParty.members.some((m: any) => {
        const memOwner = ownerAccountMap[m.name] || m.name;
        return memOwner === candidateOwner;
      });
      if (alreadyJoinedOwner) {
        return alert(`⚠️ [계정 중복 참여 제한]\n이미 해당 계정의 다른 캐릭터가 이 파티에 참여 중입니다!`);
      }

      const existingMembers = latestParty.members;
      const allRanges = [...existingMembers.map((m: any) => ({ start: m.time_start, end: m.time_end })), { start: joinTimeStart, end: joinTimeEnd }];
      const maxStart = Math.max(...allRanges.map(r => timeToMinutes(r.start)));
      const minEnd = Math.min(...allRanges.map(r => timeToMinutes(r.end)));

      if (maxStart >= minEnd) {
        return alert(`⚠️ [시간 충돌 거부]\n기존 파티원들과 겹치는 시간대가 존재하지 않습니다! (${joinTimeStart} ~ ${joinTimeEnd})`);
      }

      const partyDate = latestParty.party_date || getTodayString();
      const mySchedules = allActivePartiesRes.data
         ?.filter(p => (p.party_date || getTodayString()) === partyDate && p.members.some((m: any) => m.name === joinSelectedChar))
         .map(p => {
           const dur = p.content_name.includes("통합") || p.content_name.includes("3종") ? 45 : 15;
           const myMemInfo = p.members.find((m: any) => m.name === joinSelectedChar);
           const st = p.final_start_time || myMemInfo?.time_start || p.time_start;
           return { start: st, duration: dur };
         }) || [];
      
      const newDur = latestParty.content_name.includes("통합") || latestParty.content_name.includes("3종") ? 45 : 15;
      if (isScheduleConflict(joinTimeStart, newDur, mySchedules)) {
         return alert(`⚠️ [일정 충돌 경고]\n'${joinSelectedChar}' 캐릭터는 ${partyDate} 해당 시간대에 이미 다른 파티 일정이 존재합니다!`);
      }

      const myCharObj = allCharactersMap[joinSelectedChar];
      const myJob = myCharObj?.job || "전사";
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

      alert(updatePayload.status === "모집완료" ? `🎉 파티 매칭 완료!\n⏰ 출발 시간: ${updatePayload.final_start_time}\n👑 파티장: ${updatePayload.leader_name}` : `[${joinSelectedChar}] 합류 완료!`);
      setJoinPopupParty(null);
      const ownerName = user?.username || user?.nickname || user?.owner || "한설";
      fetchData(ownerName);
    } catch (err) { alert("처리 중 오류 발생"); }
  };

  const datePartyCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    activeParties.forEach(p => {
      if (p.party_type === "GUILD_BUS") {
        const week = getMabinogiWeekRange(p.party_date || getTodayString());
        let curr = new Date(week.start);
        const endD = new Date(week.end);
        while (curr <= endD) {
          const dStr = curr.toISOString().split("T")[0];
          counts[dStr] = (counts[dStr] || 0) + 1;
          curr.setDate(curr.getDate() + 1);
        }
      } else {
        const d = p.party_date || getTodayString();
        counts[d] = (counts[d] || 0) + 1;
      }
    });
    return counts;
  }, [activeParties]);

  const upcomingDates = useMemo(() => {
    const list = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const dateStr = `${year}-${month}-${day}`;
      const label = i === 0 ? "오늘" : i === 1 ? "내일" : `${d.getMonth() + 1}/${d.getDate()}`;
      list.push({ dateStr, label, full: `${month}월 ${day}일` });
    }
    return list;
  }, []);

  const calendarDays = useMemo(() => {
    const { year, month } = calendarYearMonth;
    const firstDayIndex = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDayIndex; i++) days.push(null);
    for (let d = 1; d <= lastDate; d++) {
      const mStr = String(month + 1).padStart(2, "0");
      const dStr = String(d).padStart(2, "0");
      days.push({ day: d, dateStr: `${year}-${mStr}-${dStr}` });
    }
    return days;
  }, [calendarYearMonth]);

  const filteredParties = useMemo(() => {
    const filtered = activeParties.filter(party => {
      const pDate = party.party_date || getTodayString();
      
      if (activeDateFilter !== "전체") {
        if (party.party_type === "GUILD_BUS") {
          const week = getMabinogiWeekRange(pDate);
          if (activeDateFilter < week.start || activeDateFilter > week.end) return false;
        } else {
          if (pDate !== activeDateFilter) return false;
        }
      }

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

    return filtered.sort((a, b) => {
      const aIsBus = a.party_type === "GUILD_BUS" ? 1 : 0;
      const bIsBus = b.party_type === "GUILD_BUS" ? 1 : 0;
      if (aIsBus !== bIsBus) return bIsBus - aIsBus;
      return new Date(b.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
    });
  }, [activeParties, activeDateFilter, statusFilter, partySearchTerm]);

  if (!mounted) return null;
  const currentRegistrationDate = activeDateFilter === "전체" ? getTodayString() : activeDateFilter;

  return (
    <main className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] font-sans pb-28 pt-3 sm:pt-6 relative select-none">
      <div className="max-w-[1400px] mx-auto px-3 sm:px-6 space-y-3 sm:space-y-4 relative z-10">
        
        {/* 상단 헤더 (과거 레이아웃 복원 & 아티팩트 완전 제거) */}
        <header className="relative overflow-hidden rounded-xl bg-[var(--panel)] border border-[var(--panel-border)] py-3 px-4 md:py-3.5 md:px-5 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-[var(--accent)] shadow-[0_0_12px_var(--accent)]"></div>
          
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-base md:text-lg font-black tracking-widest leading-none text-[var(--text-main)] whitespace-nowrap">SYNAXIS</h1>
            <span className="text-[var(--accent)] text-xs font-bold tracking-wide leading-none whitespace-nowrap">
              시낙시스 : 스마트 파티 매칭
            </span>
            <button 
              onClick={() => setShowLoreGuide(true)} 
              className="w-4 h-4 rounded-full bg-[var(--inner-box)] border border-[var(--panel-border)] text-[10px] font-black text-[var(--text-sub)] hover:text-[var(--accent)] transition flex items-center justify-center shrink-0 ml-0.5" 
              title="가이드 보기"
            >
              i
            </button>
          </div>

          <div className="bg-[var(--inner-box)] border border-[var(--panel-border)] rounded-xl px-3 py-1.5 flex items-center gap-2 text-xs text-[var(--text-main)] shadow-xs w-full md:w-auto">
            <span className="text-sm">💡</span>
            <span className="font-medium text-[var(--text-sub)] text-[11px] md:text-xs">
              시낙시스는 고대 그리스어로 <strong className="text-[var(--accent)]">&apos;함께 모이는 것&apos;</strong>을 뜻합니다. 성역의 전우들과 함께 최적의 시간대로 길을 나서는 공간입니다.
            </span>
          </div>
        </header>

        {/* 안내 모달 */}
        {showLoreGuide && (
          <div className="fixed inset-0 bg-black/80 z-[10000] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowLoreGuide(false)}>
            <div className="bg-[var(--panel)] border border-[var(--panel-border)] text-[var(--text-main)] rounded-2xl max-w-sm w-full p-4 sm:p-5 shadow-2xl relative space-y-3" onClick={e => e.stopPropagation()}>
              <button onClick={() => setShowLoreGuide(false)} className="absolute top-3.5 right-3.5 text-[var(--text-sub)] hover:text-[var(--text-main)] text-sm font-bold">✕</button>
              <h2 className="text-sm font-black text-[var(--accent)] border-b border-[var(--panel-border)] pb-2 flex items-center gap-1.5">
                <span>🏛️</span> SYNAXIS 시스템 안내
              </h2>
              <div className="space-y-2 text-xs text-[var(--text-main)] leading-relaxed">
                <p>• <strong>통합 파티 매칭:</strong> 일반 길드원들의 파티 모집과 관리자(길마/부마)들이 개설한 <strong>길드 버스 파티</strong>가 하나의 피드에 통합 제공됩니다.</p>
                <p>• <strong>버스 주간 고정:</strong> 마비노기 모바일 주간 초기화 주기(목요일 ~ 수요일) 동안 해당 버스 파티는 피드 최상단에 자동 고정 노출됩니다.</p>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* 관리자 버스 개설 모달 (넙적함 개선 및 콤팩트 디자인 적용) */}
        {/* ============================================================== */}
        {showBusCreateModal && (
          <div className="fixed inset-0 z-[11000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowBusCreateModal(false)}>
            <div className="bg-[var(--panel)] border border-amber-500/40 rounded-2xl shadow-2xl w-full max-w-sm p-4 sm:p-5 space-y-3.5 relative" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center border-b border-[var(--panel-border)] pb-2.5">
                <h3 className="text-xs sm:text-sm font-black text-amber-400 flex items-center gap-1.5"><span>🚌</span> 길드 버스 파티 개설</h3>
                <button onClick={() => setShowBusCreateModal(false)} className="text-[var(--text-sub)] hover:text-[var(--text-main)] font-bold text-xs">✕</button>
              </div>
              
              <div className="space-y-2.5 text-xs">
                <div>
                  <label className="text-[var(--text-sub)] font-bold mb-1 block">목표 컨텐츠</label>
                  <select 
                    value={busCreateContent.id} 
                    onChange={e => {
                      const content = CONTENT_DB.find(c => c.id === e.target.value) || CONTENT_DB[0];
                      setBusCreateContent(content);
                      setBusCreateDiff(content.diffs[0]);
                    }} 
                    className="w-full bg-[var(--inner-box)] border border-[var(--panel-border)] rounded-xl px-2.5 py-1.5 font-bold text-[var(--text-main)] outline-none"
                  >
                    {CONTENT_DB.map(c => <option key={c.id} value={c.id}>{c.name} ({c.size}인)</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-[var(--text-sub)] font-bold mb-1 block">난이도</label>
                  <select 
                    value={busCreateDiff} 
                    onChange={e => setBusCreateDiff(e.target.value)} 
                    className="w-full bg-[var(--inner-box)] border border-[var(--panel-border)] rounded-xl px-2.5 py-1.5 font-bold text-[var(--text-main)] outline-none"
                  >
                    {busCreateContent.diffs.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-[var(--text-sub)] font-bold mb-1 block">운행 시작일 (주간 기준)</label>
                  <input 
                    type="date" 
                    value={busCreateDate} 
                    onChange={e => setBusCreateDate(e.target.value)} 
                    className="w-full bg-[var(--inner-box)] border border-[var(--panel-border)] rounded-xl px-2.5 py-1.5 font-bold text-[var(--text-main)] outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[var(--text-sub)] font-bold mb-1 block">시작 시간</label>
                    <CustomTimePicker value={busCreateTimeStart} onChange={setBusCreateTimeStart} />
                  </div>
                  <div>
                    <label className="text-[var(--text-sub)] font-bold mb-1 block">종료 시간</label>
                    <CustomTimePicker value={busCreateTimeEnd} onChange={setBusCreateTimeEnd} />
                  </div>
                </div>

                <div>
                  <label className="text-[var(--text-sub)] font-bold mb-1 block">버스 공지 메모</label>
                  <input 
                    type="text" 
                    value={busCreateMemo} 
                    onChange={e => setBusCreateMemo(e.target.value)} 
                    placeholder="예: 성역 정기 길드 버스 운행!"
                    className="w-full bg-[var(--inner-box)] border border-[var(--panel-border)] rounded-xl px-2.5 py-1.5 font-bold text-[var(--text-main)] outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-[var(--panel-border)] flex items-center justify-end gap-2">
                <button onClick={() => setShowBusCreateModal(false)} className="bg-[var(--inner-box)] hover:bg-[var(--panel-border)] border border-[var(--panel-border)] text-[var(--text-sub)] font-bold px-3.5 py-1.5 rounded-xl text-xs transition">취소</button>
                <button onClick={handleCreateGuildBus} className="bg-amber-600 hover:bg-amber-500 text-white font-black px-4 py-1.5 rounded-xl shadow-md transition text-xs">개설하기</button>
              </div>
            </div>
          </div>
        )}

        <div className="lg:hidden">
          <button 
            onClick={() => setIsMobileFormOpen(!isMobileFormOpen)}
            className={`w-full py-2.5 px-4 rounded-xl shadow-md transition flex justify-between items-center text-xs font-black border active:scale-[0.99] ${
              isMobileFormOpen ? "bg-[var(--inner-box)] border-[var(--accent)] text-[var(--accent)]" : "bg-gradient-to-r from-[var(--inner-box)] via-[var(--panel)] to-[var(--inner-box)] border-[var(--accent)]/60 text-[var(--text-main)]"
            }`}
          >
            <span className="flex items-center gap-2">
              <span className="text-base leading-none">✨</span>
              <span>새 파티 모집 등록하기</span>
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${isMobileFormOpen ? "bg-[var(--accent)] text-[var(--accent-fg)] border-transparent" : "bg-[var(--panel)] border-[var(--panel-border)] text-[var(--accent)]"}`}>
              {isMobileFormOpen ? "▲ 폼 닫기" : "▼ 작성하기"}
            </span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4">
          
          <div className={`lg:col-span-4 bg-[var(--panel)] rounded-2xl border border-[var(--panel-border)] p-3 sm:p-4 shadow-sm h-fit space-y-2.5 sm:space-y-3 ${
            isMobileFormOpen ? "block animate-in fade-in duration-200" : "hidden lg:block"
          }`}>
            <div className="flex items-center justify-between border-b border-[var(--panel-border)] pb-1.5">
              <h2 className="text-xs sm:text-base font-black text-[var(--accent)] flex items-center gap-1.5 whitespace-nowrap">
                <span>📅</span> 스마트 파티 매칭
              </h2>
              {isAdmin && (
                <button 
                  onClick={() => setShowBusCreateModal(true)}
                  className="bg-[var(--inner-box)] border border-[var(--accent)] hover:bg-[var(--accent)] hover:text-[var(--accent-fg)] text-[var(--accent)] px-2.5 py-1 rounded-lg text-[11px] font-black shadow-xs transition flex items-center gap-1.5 shrink-0"
                >
                  <span>🚌</span> 길드 버스
                </button>
              )}
            </div>
            
            <div className="bg-[var(--inner-box)] border border-[var(--panel-border)] rounded-xl p-2 space-y-1">
              <label className="text-[0.6rem] font-bold text-[var(--text-sub)] block">참여할 캐릭터 선택</label>
              <div className="flex gap-1 overflow-x-auto custom-scrollbar pb-0.5 sm:flex-wrap">
                {myCharacterNames.map(char => {
                  const charObj = allCharactersMap[char];
                  const jobName = charObj?.job || "전사";
                  const isSelected = selectedChar === char;
                  return (
                    <button 
                      key={char} 
                      onClick={() => setSelectedChar(char)} 
                      className={`text-[0.68rem] font-black px-2 py-1 rounded-lg transition cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1 ${
                        isSelected ? "bg-[var(--accent)] text-[var(--accent-fg)] shadow-sm" : "bg-[var(--panel)] border border-[var(--panel-border)] text-[var(--text-main)] hover:border-[var(--accent)]"
                      }`}
                    >
                      <ClassIcon job={jobName} className={`w-3.5 h-3.5 ${isSelected ? "bg-black" : ""}`} />
                      <span>{char}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <div onClick={() => setShowCalendarModal(true)} className="bg-[var(--inner-box)] border border-[var(--panel-border)] hover:border-[var(--accent)] rounded-xl p-2 flex flex-col justify-center gap-0.5 cursor-pointer transition">
                <span className="text-[0.6rem] font-bold text-[var(--text-sub)] flex items-center gap-1"><span>📌</span> 희망 날짜</span>
                <div className="flex items-center justify-between bg-[var(--panel)] border border-[var(--panel-border)] px-2 py-0.5 rounded-lg">
                  <span className="text-[var(--accent)] font-black text-xs truncate">{currentRegistrationDate}</span>
                  <span className="text-[9px]">📅</span>
                </div>
              </div>

              <div className="bg-[var(--inner-box)] border border-[var(--panel-border)] rounded-xl p-2 flex flex-col justify-center gap-0.5">
                <label className="text-[0.6rem] font-bold text-[var(--text-sub)] block">목표 컨텐츠</label>
                <select 
                  value={selectedContent.id} 
                  onChange={handleContentChange} 
                  className="w-full bg-[var(--panel)] border border-[var(--panel-border)] rounded-lg px-1.5 py-0.5 text-xs font-bold text-[var(--text-main)] outline-none cursor-pointer truncate"
                >
                  {CONTENT_DB.map(c => <option key={c.id} value={c.id}>{c.name} ({c.size}인)</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <div>
                <label className="text-[0.6rem] font-bold text-[var(--text-sub)] mb-0.5 block">파티 스타일</label>
                <div className="flex bg-[var(--inner-box)] p-0.5 rounded-lg border border-[var(--panel-border)] gap-0.5">
                  <button onClick={() => setPartyType("1회 클리어")} className={`flex-1 py-1 rounded-md text-[0.68rem] font-black transition ${partyType === "1회 클리어" ? "bg-[var(--panel)] text-[var(--text-main)] shadow-xs border border-[var(--panel-border)]" : "text-[var(--text-sub)]"}`}>
                    1회 클리어
                  </button>
                  <button onClick={() => setPartyType("반복 뺑이")} className={`flex-1 py-1 rounded-md text-[0.68rem] font-black transition ${partyType === "반복 뺑이" ? "bg-rose-950/40 text-rose-400 border border-rose-800/50" : "text-[var(--text-sub)]"}`}>
                    반복 뺑이
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[0.6rem] font-bold text-[var(--text-sub)] mb-0.5 block">매칭 전략</label>
                <div className="flex bg-[var(--inner-box)] p-0.5 rounded-lg border border-[var(--panel-border)] gap-0.5">
                  <button onClick={() => setMatchingMode("모집우선")} className={`flex-1 py-1 rounded-md text-[0.68rem] font-black transition ${matchingMode === "모집우선" ? "bg-[var(--panel)] text-[var(--text-main)] shadow-xs border border-[var(--panel-border)]" : "text-[var(--text-sub)]"}`}>
                    모집우선
                  </button>
                  <button onClick={() => setMatchingMode("조합우선")} className={`flex-1 py-1 rounded-md text-[0.68rem] font-black transition ${matchingMode === "조합우선" ? "bg-indigo-600 text-white" : "text-[var(--text-sub)]"}`}>
                    조합우선
                  </button>
                </div>
              </div>
            </div>

            {partyType === "반복 뺑이" && (
              <div className="bg-[var(--inner-box)] p-2.5 rounded-xl border border-[var(--panel-border)] space-y-2">
                <div className="flex justify-between items-center border-b border-[var(--panel-border)] pb-1">
                  <span className="text-xs font-black text-[var(--accent)] flex items-center gap-1"><span>🔄</span> 반복 상세 설정</span>
                  <div className="flex bg-[var(--panel)] p-0.5 rounded-lg border border-[var(--panel-border)] text-[0.6rem]">
                    <button onClick={() => setLoopSubMode("회차")} className={`px-2 py-0.5 rounded-md font-bold ${loopSubMode === "회차" ? "bg-[var(--accent)] text-[var(--accent-fg)] font-black" : "text-[var(--text-sub)]"}`}>회차</button>
                    <button onClick={() => setLoopSubMode("시간")} className={`px-2 py-0.5 rounded-md font-bold ${loopSubMode === "시간" ? "bg-[var(--accent)] text-[var(--accent-fg)] font-black" : "text-[var(--text-sub)]"}`}>시간</button>
                  </div>
                </div>
                {loopSubMode === "회차" ? (
                  <div className="flex items-center gap-1.5">
                    <div className="flex-1 flex items-center justify-between bg-[var(--panel)] px-2 py-1 rounded-lg border border-[var(--panel-border)]">
                      <span className="text-[0.6rem] text-[var(--text-sub)] font-bold">최소</span>
                      <div className="flex items-center gap-0.5">
                        <input type="number" value={minRuns} onChange={e => setMinRuns(e.target.value)} className="w-8 bg-[var(--inner-box)] border border-[var(--panel-border)] text-xs font-black text-center text-[var(--text-main)] rounded py-0.5 outline-none" />
                        <span className="text-[0.6rem] text-[var(--text-main)] font-bold">회</span>
                      </div>
                    </div>
                    <span className="text-[var(--text-sub)] font-bold">~</span>
                    <div className="flex-1 flex items-center justify-between bg-[var(--panel)] px-2 py-1 rounded-lg border border-[var(--panel-border)]">
                      <span className="text-[0.6rem] text-[var(--text-sub)] font-bold">최대</span>
                      <div className="flex items-center gap-0.5">
                        <input type="number" value={maxRuns} onChange={e => setMaxRuns(e.target.value)} className="w-8 bg-[var(--inner-box)] border border-[var(--panel-border)] text-xs font-black text-center text-[var(--text-main)] rounded py-0.5 outline-none" />
                        <span className="text-[0.6rem] text-[var(--text-main)] font-bold">회</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <select value={loopHoursCount} onChange={e => setLoopHoursCount(e.target.value)} className="flex-1 bg-[var(--panel)] border border-[var(--panel-border)] rounded-lg px-2 py-1 text-xs font-bold text-[var(--text-main)] outline-none">
                      <option value="0">0시간</option><option value="1">1시간</option><option value="2">2시간</option><option value="3">3시간</option><option value="4">4시간</option>
                    </select>
                    <select value={loopHoursMin} onChange={e => setLoopHoursMin(e.target.value)} className="flex-1 bg-[var(--panel)] border border-[var(--panel-border)] rounded-lg px-2 py-1 text-xs font-bold text-[var(--text-main)] outline-none">
                      <option value="00">0분</option><option value="15">15분</option><option value="30">30분</option><option value="45">45분</option>
                    </select>
                  </div>
                )}
              </div>
            )}

            <div className="bg-[var(--inner-box)] p-2 rounded-xl border border-[var(--panel-border)] space-y-1">
              <label className="text-[0.6rem] font-bold text-[var(--text-sub)] block">난이도 설정</label>
              <div className="flex flex-wrap gap-1">
                {selectedContent.diffs.map(diff => (
                  <button 
                    key={diff} 
                    onClick={() => setSelectedDiff(diff)} 
                    className={`text-[0.68rem] font-black px-2 py-0.5 rounded-md border transition cursor-pointer ${
                      selectedDiff === diff ? DIFFICULTY_COLORS[diff] + " scale-105 shadow-xs font-bold border-[var(--accent)]" : "bg-[var(--panel)] text-[var(--text-sub)] border-[var(--panel-border)]"
                    }`}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <div>
                <label className="text-[0.6rem] font-black text-[var(--accent)] mb-0.5 block">가능 희망 시간 범위</label>
                <div className="flex items-center gap-1.5">
                  <CustomTimePicker value={timeStart} onChange={setTimeStart} />
                  <span className="text-[var(--text-sub)] font-bold">~</span>
                  <CustomTimePicker value={timeEnd} onChange={setTimeEnd} />
                </div>
              </div>
              <div>
                <input 
                  type="text"
                  placeholder="파티 한 줄 메모 (선택)"
                  value={partyMemo}
                  onChange={e => setPartyMemo(e.target.value)}
                  className="w-full bg-[var(--inner-box)] border border-[var(--panel-border)] rounded-xl px-2.5 py-1 text-xs font-bold text-[var(--text-main)] outline-none focus:border-[var(--accent)]"
                />
              </div>
            </div>

            {matchingMode === "조합우선" && (
              <div className="bg-[var(--inner-box)] p-2 rounded-xl border border-indigo-900/50 space-y-1.5">
                <div>
                  <label className="text-[0.55rem] font-black text-indigo-400 mb-0.5 block">내 수락 가능 포지션</label>
                  <div className="flex flex-wrap gap-1">
                    {Object.keys(ROLE_GROUPS).map(role => (
                      <button key={role} onClick={() => toggleRole(role, myRoles, setMyRoles)} className={`text-[0.65rem] font-bold px-1.5 py-0.5 rounded-md border ${myRoles.includes(role) ? ROLE_COLORS[role] : "bg-[var(--panel)] border-[var(--panel-border)] text-[var(--text-sub)]"}`}>
                        {role}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[0.55rem] font-black text-rose-400 mb-0.5 block">구인 희망 포지션</label>
                  <div className="flex flex-wrap gap-1">
                    {Object.keys(ROLE_GROUPS).map(role => (
                      <button key={role} onClick={() => toggleRole(role, wantedRoles, setWantedRoles)} className={`text-[0.65rem] font-bold px-1.5 py-0.5 rounded-md border ${wantedRoles.includes(role) ? "bg-rose-950/60 text-rose-300 border-rose-500" : "bg-[var(--panel)] border-[var(--panel-border)] text-[var(--text-sub)]"}`}>
                        + {role}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <button 
              onClick={handleReservation} 
              className="w-full bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-[var(--accent-fg)] font-black py-2.5 rounded-xl shadow-md transition cursor-pointer text-xs tracking-wider mt-1"
            >
              ✨ 파티 매칭 시작!
            </button>
          </div>

          <div className="lg:col-span-8 space-y-3">
            <div className="bg-[var(--panel)] rounded-2xl border border-[var(--panel-border)] p-3 sm:p-5 shadow-sm space-y-3">
              
              <div className="space-y-1.5 border-b border-[var(--panel-border)] pb-2.5">
                <div className="flex justify-between items-center flex-wrap gap-1.5">
                  <span className="text-xs font-black text-[var(--accent)] flex items-center gap-1.5"><span>🗓️</span> 예정된 파티 & 길드 버스</span>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => setShowCalendarModal(true)} className="text-[0.68rem] font-bold px-2.5 py-1 rounded-lg bg-[var(--inner-box)] border border-[var(--panel-border)] text-[var(--text-main)] hover:border-[var(--accent)] transition flex items-center gap-1">
                      <span>📅</span> 스케쥴 캘린더
                    </button>
                    <button onClick={() => setActiveDateFilter("전체")} className={`text-[0.68rem] font-bold px-2.5 py-1 rounded-lg border transition ${activeDateFilter === "전체" ? "bg-[var(--accent)] text-[var(--accent-fg)] border-[var(--accent)] font-black" : "bg-[var(--inner-box)] text-[var(--text-sub)] border-[var(--panel-border)]"}`}>
                      전체 ({activeParties.length})
                    </button>
                  </div>
                </div>

                <div className="flex gap-1 overflow-x-auto custom-scrollbar pb-1">
                  {upcomingDates.map(item => {
                    const count = datePartyCounts[item.dateStr] || 0;
                    const isSelected = activeDateFilter === item.dateStr;
                    return (
                      <button
                        key={item.dateStr}
                        onClick={() => setActiveDateFilter(item.dateStr)}
                        className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-lg border shrink-0 transition min-w-[64px] ${isSelected ? "bg-[var(--accent)] text-[var(--accent-fg)] border-[var(--accent)] shadow-sm font-black scale-[1.02]" : "bg-[var(--inner-box)] border-[var(--panel-border)] text-[var(--text-sub)]"}`}
                      >
                        <span className="text-[0.58rem] opacity-80">{item.label}</span>
                        <span className="text-[0.7rem] font-black">{item.dateStr.slice(5)}</span>
                        <span className={`text-[0.52rem] px-1 py-0.1 rounded-full mt-0.5 ${isSelected ? "bg-black/30 text-white" : "bg-[var(--panel)] text-[var(--accent)] border border-[var(--panel-border)]"}`}>
                          파티 {count}개
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-1.5">
                <input 
                  type="text" 
                  placeholder="컨텐츠명 또는 캐릭터 검색..."
                  value={partySearchTerm}
                  onChange={e => setPartySearchTerm(e.target.value)}
                  className="bg-[var(--inner-box)] border border-[var(--panel-border)] px-2.5 py-1.5 rounded-xl text-xs font-bold text-[var(--text-main)] outline-none focus:border-[var(--accent)] w-full flex-1"
                />
                <div className="flex items-center bg-[var(--inner-box)] p-0.5 rounded-xl border border-[var(--panel-border)] w-full sm:w-auto shrink-0">
                  {(["전체", "모집중", "모집완료"] as const).map(st => (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      className={`flex-1 sm:flex-none px-2.5 py-1 rounded-lg text-[0.68rem] font-bold transition ${statusFilter === st ? "bg-[var(--accent)] text-[var(--accent-fg)] font-black" : "text-[var(--text-sub)]"}`}
                    >
                      {st === "모집완료" ? "소집완료" : st}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3 max-h-[680px] overflow-y-auto custom-scrollbar pr-0.5">
                {filteredParties.length === 0 ? (
                  <div className="text-center py-16 text-[var(--text-sub)] font-bold text-xs sm:text-sm">
                    해당 날짜 및 조건에 일치하는 파티가 없습니다.
                  </div>
                ) : (
                  filteredParties.map(party => {
                    const isGuildBus = party.party_type === "GUILD_BUS";
                    const myJoinedChars = party.members.filter((m: any) => myCharacterNames.includes(m.name));
                    const isLeader = party.members[0]?.name && myCharacterNames.includes(party.members[0]?.name);
                    const isFull = party.members.length >= party.max_members;
                    const isCompleted = party.status === "모집완료";
                    const partyDateStr = party.party_date || getTodayString();
                    const isHighlighted = highlightedPartyId && (party.party_uid === highlightedPartyId || String(party.id) === String(highlightedPartyId));
                    const memoDisplay = party.sub_content || party.memo;
                    const rawType = party.party_type || "1회 클리어";
                    const displayPartyType = rawType === "연속 뺑이" ? "반복 뺑이" : isGuildBus ? "🚌 길드 버스" : rawType;

                    return (
                      <div 
                        key={party.id} 
                        id={`party-${party.id}`}
                        className={`bg-[var(--inner-box)] border rounded-2xl p-3 sm:p-4 flex flex-col gap-2 shadow-xs transition-all relative overflow-hidden ${
                          isHighlighted ? "border-emerald-500 ring-2 ring-emerald-500/50 bg-emerald-500/10" : isGuildBus ? "border-amber-500/70 bg-gradient-to-r from-amber-500/5 via-[var(--inner-box)] to-[var(--inner-box)] ring-1 ring-amber-500/30" : "border-[var(--panel-border)]"
                        } ${isCompleted ? "bg-indigo-500/10 border-indigo-500/50" : ""}`}
                      >
                        {isGuildBus && (
                          <div className="absolute top-0 right-0 bg-amber-500 text-black font-black text-[9px] px-3 py-0.5 rounded-bl-xl shadow-xs">
                            🔥 성역 공식 길드 버스 (주간 고정)
                          </div>
                        )}

                        <div className="flex justify-between items-start gap-2 border-b border-[var(--panel-border)] pb-2">
                          <div className="flex flex-col min-w-0 flex-1">
                            <div className="flex items-center gap-1 mb-1 flex-wrap">
                              <span className="text-[0.6rem] font-black bg-[var(--accent)] text-[var(--accent-fg)] px-1.5 py-0.5 rounded">📅 {partyDateStr}</span>
                              {isCompleted ? (
                                <span className="text-[0.6rem] font-black bg-indigo-600 text-white px-1.5 py-0.5 rounded">✅ 소집완료</span>
                              ) : (
                                <span className="text-[0.6rem] font-black bg-[var(--panel)] text-[var(--text-sub)] px-1.5 py-0.5 rounded border border-[var(--panel-border)]">대기중</span>
                              )}
                              <span className={`text-[0.6rem] font-bold px-1.5 py-0.5 rounded border ${DIFFICULTY_COLORS[party.difficulty] || "text-[var(--text-sub)] bg-[var(--panel)] border-[var(--panel-border)]"}`}>{party.difficulty}</span>
                              <span className={`text-[0.6rem] font-bold px-1.5 py-0.5 rounded border ${isGuildBus ? "text-amber-400 bg-amber-500/20 border-amber-500/40 font-black" : "text-[var(--text-sub)] bg-[var(--panel)] border-[var(--panel-border)]"}`}>{displayPartyType}</span>
                            </div>
                            <h3 className={`text-sm sm:text-base font-black ${isCompleted ? "text-indigo-300" : isGuildBus ? "text-amber-400" : "text-[var(--text-main)]"} leading-tight`}>{party.content_name}</h3>
                            {memoDisplay && <p className="text-[0.68rem] text-[var(--accent)] font-medium mt-1 bg-[var(--panel)] px-2 py-1 rounded-lg border border-[var(--panel-border)]">💬 "{memoDisplay}"</p>}
                            <div className="mt-1">
                              {isCompleted ? (
                                <span className="text-[0.65rem] bg-amber-500/20 px-2 py-0.5 rounded text-amber-400 font-black border border-amber-500/40">⏰ 확정 출발 시간: {party.final_start_time}</span>
                              ) : (
                                <span className="text-[0.65rem] text-[var(--accent)] font-mono font-bold">⏰ 희망 시간 {party.time_start} ~ {party.time_end}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-xs font-black text-[var(--text-main)] bg-[var(--panel)] border border-[var(--panel-border)] px-2.5 py-1 rounded-full">{party.members.length} / {party.max_members} 명</span>
                            {isFull ? (
                              <button disabled className="text-xs font-bold bg-[var(--panel)] text-[var(--text-sub)] border border-[var(--panel-border)] px-2.5 py-1 rounded-lg opacity-60">모집 마감</button>
                            ) : (
                              <button onClick={() => openJoinPopup(party)} className={`text-xs font-black px-2.5 py-1.5 rounded-lg shadow-sm transition cursor-pointer ${isGuildBus ? "bg-amber-600 hover:bg-amber-500 text-white" : "bg-emerald-600 hover:bg-emerald-500 text-white"}`}>
                                {isGuildBus ? "🚌 버스 탑승" : "⚔️ 합류 신청"}
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-1.5 bg-[var(--panel)] p-2 rounded-xl border border-[var(--panel-border)]">
                          <div className="flex gap-1.5 overflow-x-auto custom-scrollbar flex-1 pb-0.5">
                            {Array.from({ length: party.max_members }).map((_, i) => {
                              const m = party.members[i];
                              const charObj = m ? allCharactersMap[m.name] : null;
                              const actualJob = m ? (charObj?.job || m.job || "전사") : "";
                              return m ? (
                                <div key={i} onClick={() => setInspectCharacter(charObj || { nickname: m.name, job: actualJob })} className="flex flex-col items-center justify-center border bg-[var(--inner-box)] border-[var(--panel-border)] rounded-lg p-1 w-12 h-14 shrink-0 relative cursor-pointer hover:border-[var(--accent)]">
                                  <ClassIcon job={actualJob} className="w-4 h-4 mb-0.5" />
                                  <span className="text-[0.52rem] text-[var(--text-main)] truncate w-full text-center font-bold">{m.name}</span>
                                  {m.roles && m.roles.length > 0 && <span className="absolute bottom-0 bg-indigo-600 w-full text-center text-[0.45rem] text-white rounded-b-md truncate px-0.5 font-bold">{m.roles[0]}</span>}
                                </div>
                              ) : (
                                <div key={i} className="flex flex-col items-center justify-center bg-[var(--inner-box)]/50 border border-dashed border-[var(--panel-border)] rounded-lg p-1 w-12 h-14 shrink-0">
                                  <span className="text-[0.5rem] text-[var(--text-sub)] opacity-50">빈자리</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <div className="text-[0.62rem] text-[var(--text-sub)] font-medium flex justify-between items-center pt-0.5">
                          <span>파티장/기사: <span className="text-[var(--text-main)] font-bold">{isCompleted ? `👑 ${party.leader_name}` : party.members[0]?.name || "알 수 없음"}</span></span>
                          <div className="flex items-center gap-1.5">
                            {myJoinedChars.map((m: any) => (
                              <button key={m.name} onClick={() => handleLeaveParty(party, m.name)} className="text-[0.58rem] text-amber-400 hover:underline cursor-pointer bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30 font-bold">
                                👋 [{m.name}] 탈퇴
                              </button>
                            ))}
                            {(isLeader || isAdmin) && (
                              <button onClick={() => handleDeleteParty(party.id)} className="text-[0.58rem] text-rose-400 hover:underline cursor-pointer bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/30 font-bold">
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

      <button
        onTouchStart={handleFabTouchStart}
        onTouchMove={handleFabTouchMove}
        onTouchEnd={handleFabTouchEnd}
        onMouseDown={handleFabMouseDown}
        onClick={handleFabClick}
        style={fabPos ? { left: `${fabPos.x}px`, top: `${fabPos.y}px`, bottom: "auto", right: "auto" } : {}}
        className={`lg:hidden fixed ${
          fabPos ? "" : "bottom-20 right-4"
        } z-[90] h-9 px-4 w-auto min-w-[102px] rounded-full bg-[var(--panel)]/95 backdrop-blur-md border border-[var(--accent)]/80 text-[var(--accent)] font-black text-xs tracking-tight shadow-[0_8px_20px_rgba(0,0,0,0.6),0_0_12px_rgba(212,175,55,0.25)] flex items-center justify-center gap-1.5 active:scale-95 transition-transform select-none cursor-grab active:cursor-grabbing whitespace-nowrap shrink-0 ${
          isDraggingFab ? "opacity-90 scale-105 ring-2 ring-[var(--accent)]/50" : ""
        }`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse shrink-0"></span>
        <span className="whitespace-nowrap shrink-0">{isMobileFormOpen ? "폼 닫기" : "매칭하기"}</span>
      </button>

      {/* 캘린더 모달 */}
      {showCalendarModal && (
        <div className="fixed inset-0 z-[12000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowCalendarModal(false)}>
          <div className="bg-[var(--panel)] border border-[var(--panel-border)] rounded-2xl shadow-2xl w-full max-w-sm p-4 sm:p-5 space-y-3.5 relative" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-[var(--panel-border)] pb-2.5">
              <h3 className="text-xs sm:text-sm font-black text-[var(--text-main)] flex items-center gap-1.5"><span>📅</span> 스케쥴 캘린더</h3>
              <div className="flex items-center gap-1.5">
                <button onClick={() => setCalendarYearMonth(prev => prev.month === 0 ? { year: prev.year - 1, month: 11 } : { ...prev, month: prev.month - 1 })} className="px-2 py-1 rounded bg-[var(--inner-box)] border border-[var(--panel-border)] text-xs font-bold">◀</button>
                <span className="text-xs font-black text-[var(--accent)] min-w-[70px] text-center">{calendarYearMonth.year}년 {calendarYearMonth.month + 1}월</span>
                <button onClick={() => setCalendarYearMonth(prev => prev.month === 11 ? { year: prev.year + 1, month: 0 } : { ...prev, month: prev.month + 1 })} className="px-2 py-1 rounded bg-[var(--inner-box)] border border-[var(--panel-border)] text-xs font-bold">▶</button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center">
              {["일", "월", "화", "수", "목", "금", "토"].map((w, idx) => (
                <div key={idx} className={`text-[0.65rem] font-bold py-1 ${idx === 0 ? "text-rose-400" : idx === 6 ? "text-sky-400" : "text-[var(--text-sub)]"}`}>{w}</div>
              ))}
              {calendarDays.map((item, idx) => {
                if (!item) return <div key={idx} className="h-10"></div>;
                const count = datePartyCounts[item.dateStr] || 0;
                const isSelected = activeDateFilter === item.dateStr;
                return (
                  <div key={idx} onClick={() => { setActiveDateFilter(item.dateStr); setShowCalendarModal(false); }} className={`h-10 bg-[var(--inner-box)] border rounded-xl p-1 flex flex-col justify-between items-center cursor-pointer transition ${isSelected ? "border-[var(--accent)] bg-[var(--accent)]/10 ring-2 ring-[var(--accent)]" : "border-[var(--panel-border)] hover:border-[var(--accent)]"}`}>
                    <span className="text-xs font-bold text-[var(--text-main)]">{item.day}</span>
                    {count > 0 && <span className="text-[0.45rem] font-black bg-[var(--accent)] text-[var(--accent-fg)] px-1.5 py-0.2 rounded-full">+{count}</span>}
                  </div>
                );
              })}
            </div>
            <div className="pt-2 border-t border-[var(--panel-border)] flex justify-between items-center text-xs">
              <button onClick={() => { setActiveDateFilter("전체"); setShowCalendarModal(false); }} className="text-[var(--accent)] font-bold hover:underline">전체 파티 보기</button>
              <button onClick={() => setShowCalendarModal(false)} className="bg-[var(--inner-box)] border border-[var(--panel-border)] text-[var(--text-main)] font-bold px-3.5 py-1.5 rounded-xl">닫기</button>
            </div>
          </div>
        </div>
      )}

      {/* 캐릭터 인스펙트 모달 */}
      {inspectCharacter && (
        <div className="fixed inset-0 z-[11000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setInspectCharacter(null)}>
          <div className="bg-[var(--panel)] border border-[var(--panel-border)] rounded-2xl shadow-2xl w-full max-w-sm p-4 sm:p-5 space-y-3.5 relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setInspectCharacter(null)} className="absolute top-3.5 right-3.5 text-[var(--text-sub)] hover:text-[var(--text-main)] text-sm font-bold">✕</button>
            <div className="flex items-center gap-3 border-b border-[var(--panel-border)] pb-3">
              <div className="p-2.5 bg-[var(--inner-box)] border border-[var(--panel-border)] rounded-xl">
                <ClassIcon job={inspectCharacter.job || "전사"} className="w-8 h-8" />
              </div>
              <div>
                <span className="text-xs text-[var(--accent)] font-bold">{inspectCharacter.job || "전사"}</span>
                <h3 className="text-base font-black text-[var(--text-main)]">{inspectCharacter.nickname}</h3>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-[var(--inner-box)] border border-[var(--panel-border)] p-3 rounded-xl space-y-1">
                <span className="text-xs text-[var(--text-sub)] font-bold">⚔️ 전투력</span>
                <p className="text-sm font-black text-[var(--text-main)]">{inspectCharacter.combat_power?.toLocaleString() || "정보 없음"}</p>
              </div>
              <div className="bg-[var(--inner-box)] border border-[var(--panel-border)] p-3 rounded-xl space-y-1">
                <span className="text-xs text-[var(--text-sub)] font-bold">🔮 마도저항</span>
                <p className="text-sm font-black text-[var(--text-main)]">{inspectCharacter.magic_resistance?.toLocaleString() || "정보 없음"}</p>
              </div>
            </div>
            <button onClick={() => setInspectCharacter(null)} className="w-full bg-[var(--inner-box)] hover:bg-[var(--panel-border)] border border-[var(--panel-border)] text-[var(--text-main)] py-2 rounded-xl text-xs font-bold transition">확인 완료</button>
          </div>
        </div>
      )}

      {/* 합류 신청 모달 */}
      {joinPopupParty && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setJoinPopupParty(null)}>
          <div className="bg-[var(--panel)] border border-[var(--panel-border)] rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="bg-[var(--inner-box)] p-3.5 border-b border-[var(--panel-border)] flex justify-between items-center">
              <h2 className="text-xs font-black text-[var(--text-main)]">⚔️ 파티 합류 신청</h2>
              <button onClick={() => setJoinPopupParty(null)} className="text-[var(--text-sub)] hover:text-[var(--text-main)] font-bold text-xs">✕</button>
            </div>
            <div className="p-4 space-y-3 bg-[var(--panel)] text-xs">
              <div className="bg-[var(--inner-box)] p-2.5 rounded-xl border border-[var(--panel-border)] text-center space-y-0.5">
                <p className="font-black text-[var(--accent)]">{joinPopupParty.content_name} ({joinPopupParty.difficulty})</p>
                <p className="text-[0.65rem] text-[var(--text-sub)] font-mono">⏰ 희망 시간: {joinPopupParty.time_start} ~ {joinPopupParty.time_end}</p>
              </div>
              <div>
                <label className="font-bold text-[var(--text-sub)] mb-1 block">1. 합류할 캐릭터 선택</label>
                <div className="flex flex-wrap gap-1">
                  {myCharacters.map(char => (
                    <button key={char.id} onClick={() => setJoinSelectedChar(char.nickname)} className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition flex items-center gap-1 ${joinSelectedChar === char.nickname ? "bg-[var(--accent)] text-[var(--accent-fg)] font-black" : "bg-[var(--inner-box)] text-[var(--text-sub)] border border-[var(--panel-border)]"}`}>
                      <ClassIcon job={char.job || "전사"} className="w-3.5 h-3.5" />
                      <span>{char.nickname}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="font-bold text-[var(--text-sub)] mb-1 block">2. 포지션 선택</label>
                <div className="flex flex-wrap gap-1">
                  {["탱커", "힐러", "근딜", "원딜"].map(role => (
                    <button key={role} onClick={() => setJoinSelectedRole(role)} className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition ${joinSelectedRole === role ? "bg-indigo-600 text-white font-black" : "bg-[var(--inner-box)] text-[var(--text-sub)] border border-[var(--panel-border)]"}`}>
                      {role}
                    </button>
                  ))}
                </div>
              </div>
              <div className="bg-[var(--inner-box)] border border-[var(--panel-border)] p-2.5 rounded-xl space-y-1">
                <label className="font-black text-[var(--accent)] block">3. 본인의 가능 시간 입력</label>
                <div className="flex items-center gap-2 pt-1">
                  <CustomTimePicker value={joinTimeStart} onChange={setJoinTimeStart} />
                  <span className="text-[var(--text-sub)] font-bold">~</span>
                  <CustomTimePicker value={joinTimeEnd} onChange={setJoinTimeEnd} />
                </div>
              </div>
            </div>
            <div className="p-3 bg-[var(--inner-box)] border-t border-[var(--panel-border)] flex justify-end gap-2">
              <button onClick={() => setJoinPopupParty(null)} className="bg-[var(--panel)] hover:bg-[var(--panel-border)] border border-[var(--panel-border)] text-[var(--text-sub)] font-bold px-3.5 py-1.5 rounded-xl text-xs transition">취소</button>
              <button onClick={executeJoinParty} className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-4 py-1.5 rounded-xl shadow-md transition text-xs">신청하기</button>
            </div>
          </div>
        </div>
      )}

      {/* 전체 멤버 보기 모달 */}
      {detailModalParty && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setDetailModalParty(null)}>
          <div className="bg-[var(--panel)] border border-[var(--panel-border)] rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="bg-[var(--inner-box)] p-3.5 border-b border-[var(--panel-border)] flex justify-between items-center">
              <h3 className="text-[var(--text-main)] font-black text-xs">👥 {detailModalParty.content_name} 전체 멤버</h3>
              <button onClick={() => setDetailModalParty(null)} className="text-[var(--text-sub)] hover:text-[var(--text-main)] font-bold text-xs">✕</button>
            </div>
            <div className="p-4 grid grid-cols-4 gap-2 bg-[var(--panel)] max-h-[60vh] overflow-y-auto custom-scrollbar">
              {Array.from({ length: detailModalParty.max_members }).map((_, i) => {
                const m = detailModalParty.members[i];
                const charObj = m ? allCharactersMap[m.name] : null;
                const actualJob = m ? (charObj?.job || m.job || "전사") : "";
                return m ? (
                  <div key={i} onClick={() => setInspectCharacter(charObj || { nickname: m.name, job: actualJob })} className="flex flex-col items-center justify-center border bg-[var(--inner-box)] border-[var(--panel-border)] rounded-xl p-2 h-20 relative cursor-pointer hover:border-[var(--accent)]">
                    <ClassIcon job={actualJob} className="w-6 h-6 mb-1" />
                    <span className="text-[0.6rem] text-[var(--text-main)] truncate w-full text-center font-bold">{m.name}</span>
                    {m.roles && m.roles.length > 0 && <span className="absolute bottom-0 bg-indigo-600 w-full text-center text-[0.48rem] text-white rounded-b-lg truncate px-0.5 font-bold">{m.roles[0]}</span>}
                  </div>
                ) : (
                  <div key={i} className="flex flex-col items-center justify-center bg-[var(--inner-box)]/50 border border-dashed border-[var(--panel-border)] rounded-xl p-2 h-20">
                    <span className="text-[0.55rem] text-[var(--text-sub)] opacity-50">빈자리</span>
                  </div>
                );
              })}
            </div>
            <div className="p-3 bg-[var(--inner-box)] border-t border-[var(--panel-border)] text-right">
              <button onClick={() => setDetailModalParty(null)} className="bg-[var(--panel)] border border-[var(--panel-border)] text-[var(--text-main)] text-xs font-bold px-3.5 py-1.5 rounded-lg">닫기</button>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--panel-border); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: var(--accent); }
      `}} />
    </main>
  );
}

export default function PartyPage() {
  return (
    <Suspense fallback={<div className="w-full text-center py-20 font-bold text-[var(--text-sub)]">시낙시스 시스템 로딩 중...</div>}>
      <SynaxisContent />
    </Suspense>
  );
}