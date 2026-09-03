"use client";

import { useState, useEffect, Suspense, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { isScheduleConflict, pickRandomLeader } from "@/lib/matchingUtils";
import { CONTENT_DB, ContentItem, Party } from "@/components/party/types";
import PartyCreateForm from "@/components/party/PartyCreateForm";
import PartyFilterHeader from "@/components/party/PartyFilterHeader";
import PartyCard from "@/components/party/PartyCard";
import PartyModals from "@/components/party/PartyModals";

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

// ⏰ 시간 구간 실충돌 검사 (구간 [s1, e1)과 [s2, e2)가 실제 오버랩되는지 판별)
function isTimeOverlapping(start1: string, end1: string, start2: string, end2: string): boolean {
  if (!start1 || !end1 || !start2 || !end2) return false;
  const s1 = timeToMinutes(start1);
  const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2);
  const e2 = timeToMinutes(end2);
  return !(e1 <= s2 || s1 >= e2);
}

function calculateMidpointStartTime(timeRanges: { start: string; end: string }[]): string | null {
  if (!timeRanges || timeRanges.length === 0) return null;
  let maxStart = Math.max(...timeRanges.map(r => timeToMinutes(r.start)));
  let minEnd = Math.min(...timeRanges.map(r => timeToMinutes(r.end)));
  if (maxStart >= minEnd) return timeRanges[0].start;
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

function getDayOfWeekKorean(dateStr: string): string {
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  const d = new Date(dateStr);
  return days[d.getDay()] || "월";
}

export function getFormattedDateWithDDay(dateStr: string): string {
  if (!dateStr) return "";
  const cleanStr = dateStr.replace(/\./g, "-").trim();
  const targetDate = new Date(cleanStr + "T00:00:00");
  if (isNaN(targetDate.getTime())) return dateStr;

  const year = targetDate.getFullYear();
  const month = String(targetDate.getMonth() + 1).padStart(2, "0");
  const day = String(targetDate.getDate()).padStart(2, "0");
  const daysOfWeek = ["일", "월", "화", "수", "목", "금", "토"];
  const dayOfWeek = daysOfWeek[targetDate.getDay()];

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetMidnight = new Date(targetDate);
  targetMidnight.setHours(0, 0, 0, 0);

  const diffTime = targetMidnight.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  let dDayText = "";
  if (diffDays === 0) dDayText = "[오늘]";
  else if (diffDays === 1) dDayText = "[내일]";
  else if (diffDays > 1) dDayText = `[${diffDays}일 후]`;
  else if (diffDays === -1) dDayText = "[어제]";
  else dDayText = `[${Math.abs(diffDays)}일 전]`;

  return `${year}.${month}.${day} (${dayOfWeek}) ${dDayText}`;
}

function getMabinogiWeekRange(dateStr: string) {
  const date = new Date(dateStr);
  const day = date.getDay();
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

function SynaxisContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [user, setUser] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const [activeParties, setActiveParties] = useState<Party[]>([]);
  const [showLoreGuide, setShowLoreGuide] = useState(false);
  const [showSynaxisInfoModal, setShowSynaxisInfoModal] = useState(false);
  
  const [showContentModal, setShowContentModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showFilterCalendarModal, setShowFilterCalendarModal] = useState(false);

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

  const [calendarYearMonth, setCalendarYearMonth] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const [selectedChar, setSelectedChar] = useState("");
  const [selectedContent, setSelectedContent] = useState<ContentItem>(CONTENT_DB[0]);
  const [selectedDiff, setSelectedDiff] = useState(CONTENT_DB[0].defaultDiff);
  const [selectedDate, setSelectedDate] = useState(() => getTodayString());
  const [timeStart, setTimeStart] = useState("18:00");
  const [timeEnd, setTimeEnd] = useState("20:00");

  const [partyType, setPartyType] = useState<"1회 클리어" | "반복 뺑이">("1회 클리어");
  const [loopSubMode, setLoopSubMode] = useState<"회차" | "시간">("회차");
  const [minRuns, setMinRuns] = useState("2");
  const [maxRuns, setMaxRuns] = useState("5");
  const [loopHoursCount, setLoopHoursCount] = useState("1");
  const [loopHoursMin, setLoopHoursMin] = useState("00");
  const [partyMemo, setPartyMemo] = useState("");
  const [matchingMode, setMatchingMode] = useState<"모집우선" | "조합우선">("모집우선");
  const [myRoles, setMyRoles] = useState<string[]>([]);
  const [wantedRoles, setWantedRoles] = useState<string[]>([]);
  const [partySearchTerm, setPartySearchTerm] = useState("");

  const [statusFilter, setStatusFilter] = useState<"전체보기" | "길드버스" | "매칭중" | "매칭완료">("전체보기");

  const [tempContentCategory, setTempContentCategory] = useState<"어비스" | "레이드">("어비스");
  const [tempContent, setTempContent] = useState<ContentItem>(CONTENT_DB[0]);
  const [tempDiff, setTempDiff] = useState(CONTENT_DB[0].defaultDiff);

  const [busCreateContent, setBusCreateContent] = useState<ContentItem>(CONTENT_DB[0]);
  const [busCreateDiff, setBusCreateDiff] = useState(CONTENT_DB[0].defaultDiff);
  const [busCreateDate, setBusCreateDate] = useState(() => getTodayString());
  const [busCreateTimeStart, setBusCreateTimeStart] = useState("20:00");
  const [busCreateTimeEnd, setBusCreateTimeEnd] = useState("23:59");
  const [busCreateMemo, setBusCreateMemo] = useState("성역 정기 길드 버스 운행");

  const [joinPopupParty, setJoinPopupParty] = useState<Party | null>(null);
  const [joinSelectedChar, setJoinSelectedChar] = useState<string>("");
  const [joinSelectedRole, setJoinSelectedRole] = useState<string>("");
  const [joinTimeStart, setJoinTimeStart] = useState<string>("18:00");
  const [joinTimeEnd, setJoinTimeEnd] = useState<string>("24:00");
  const [inspectCharacter, setInspectCharacter] = useState<any>(null);

  useEffect(() => {
    const savedDraft = localStorage.getItem("sanctum_party_draft");
    if (savedDraft) {
      try {
        const d = JSON.parse(savedDraft);
        if (d.partyType) setPartyType(d.partyType);
        if (d.matchingMode) setMatchingMode(d.matchingMode);
        if (d.partyMemo) setPartyMemo(d.partyMemo);
        if (d.timeStart) setTimeStart(d.timeStart);
        if (d.timeEnd) setTimeEnd(d.timeEnd);
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const draft = { partyType, matchingMode, partyMemo, timeStart, timeEnd };
    localStorage.setItem("sanctum_party_draft", JSON.stringify(draft));
  }, [partyType, matchingMode, partyMemo, timeStart, timeEnd, mounted]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowLoreGuide(false);
        setShowSynaxisInfoModal(false);
        setShowContentModal(false);
        setShowScheduleModal(false);
        setShowFilterCalendarModal(false);
        setShowBusCreateModal(false);
        setInspectCharacter(null);
        setJoinPopupParty(null);
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
        supabase
          .from("characters")
          .select("*")
          .order("is_main", { ascending: false })
          .order("created_at", { ascending: true }),
        supabase
          .from("parties")
          .select("*")
          .neq("status", "종료됨")
          .order("created_at", { ascending: false })
      ]);

      if (charRes.data) {
        const sortedChars = [...charRes.data].sort((a, b) => {
          const aMain = a.is_main ? 1 : 0;
          const bMain = b.is_main ? 1 : 0;
          if (aMain !== bMain) return bMain - aMain;
          const timeA = a.created_at ? new Date(a.created_at).getTime() : (a.id || 0);
          const timeB = b.created_at ? new Date(b.created_at).getTime() : (b.id || 0);
          return timeA - timeB;
        });

        const jobMap: Record<string, any> = {};
        const ownerMap: Record<string, string> = {};
        sortedChars.forEach(c => { 
          jobMap[c.nickname] = c; 
          ownerMap[c.nickname] = c.owner || c.nickname;
        });
        setAllCharactersMap(jobMap);
        setOwnerAccountMap(ownerMap);

        const filteredMyChars = sortedChars.filter(c => c.owner === ownerName || c.nickname === ownerName);
        const myCharsList = filteredMyChars.length > 0 ? filteredMyChars : sortedChars;
        setMyCharacters(myCharsList);
        const names = myCharsList.map(c => c.nickname);
        setMyCharacterNames(names);
        
        if (names.length > 0) {
          setSelectedChar(prev => (names.includes(prev) ? prev : names[0]));
        }
      }

      if (partyRes.data) {
        setActiveParties(partyRes.data);
      }
    } catch (err) {
      console.error("데이터 로드 실패", err);
    }
  };

  const openContentModal = () => {
    setTempContentCategory(selectedContent.category);
    setTempContent(selectedContent);
    setTempDiff(selectedDiff);
    setShowContentModal(true);
  };

  const applyContentModal = () => {
    setSelectedContent(tempContent);
    setSelectedDiff(tempDiff);
    setShowContentModal(false);
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

  // 🎯 스마트 파티 매칭 등록 처리 (기존 동일 매칭 파티 자동 합류 + 신규 생성)
  const handleReservation = async () => {
    if (!selectedChar) return alert("참여할 캐릭터를 선택해주세요!");
    if (matchingMode === "조합우선" && myRoles.length === 0) {
      return alert("조합 우선 매칭 시, 수행 가능한 포지션을 최소 1개 이상 선택해주세요!");
    }

    const targetDate = selectedDate;
    const candidateOwner = ownerAccountMap[selectedChar] || selectedChar;
    const dbPartyType = partyType === "반복 뺑이" ? "연속 뺑이" : "1회 클리어";

    // 1) 내 계정 타 캐릭터들의 동시간대 다른 파티 참여 여부 검사 (일정 충돌 방지)
    const timeConflictingParty = activeParties.find(p => {
      const pDate = p.party_date || getTodayString();
      if (pDate !== targetDate) return false;

      const pStart = p.final_start_time || p.time_start;
      const pEnd = p.time_end;
      const overlap = isTimeOverlapping(timeStart, timeEnd, pStart, pEnd);
      if (!overlap) return false;

      return p.members.some((m: any) => {
        const memOwner = ownerAccountMap[m.name] || m.name;
        return memOwner === candidateOwner;
      });
    });

    if (timeConflictingParty) {
      const matchedMem = timeConflictingParty.members.find((m: any) => (ownerAccountMap[m.name] || m.name) === candidateOwner);
      const pStart = timeConflictingParty.final_start_time || timeConflictingParty.time_start;
      return alert(
        `⚠️ [시간대 일정 충돌 차단]\n` +
        `해당 계정의 캐릭터 '${matchedMem?.name}'가 이미 ${targetDate} [${pStart} ~ ${timeConflictingParty.time_end}] 시간대 파티에 참여 중입니다!\n` +
        `시간대가 겹치지 않는 다른 시간에 매칭을 등록해 주세요.`
      );
    }

    // 2) 🌟 [스마트 자동 매칭 핵심] 동일 날짜/컨텐츠/난이도/스타일에 시간대가 겹치는 "모집중" 파티가 이미 존재하는지 검색!
    const matchingCandidates = activeParties.filter(p => {
      if (p.status !== "모집중") return false;
      
      const pDate = p.party_date || getTodayString();
      if (pDate !== targetDate) return false;
      if (p.content_name !== selectedContent.name) return false;
      if (p.difficulty !== selectedDiff) return false;

      // 파티 타입 일치 ("1회 클리어" / "연속 뺑이")
      if (p.party_type !== dbPartyType) return false;

      // 길드버스는 자동 합류 대상 제외 (독립 개설)
      const isBus = p.party_type === "GUILD_BUS" || p.party_type === "길드 버스" || p.party_type === "길드버스" || p.sub_content?.includes("길드 버스");
      if (isBus) return false;

      // 정원 초과 파티 제외
      if (p.members.length >= p.max_members) return false;

      // 동일 계정 소속 캐릭터가 이미 해당 파티에 들어가 있다면 제외
      const hasSameAccount = p.members.some((m: any) => {
        const memOwner = ownerAccountMap[m.name] || m.name;
        return memOwner === candidateOwner;
      });
      if (hasSameAccount) return false;

      // 시간대 오버랩 확인
      const pStart = p.time_start;
      const pEnd = p.time_end;
      return isTimeOverlapping(timeStart, timeEnd, pStart, pEnd);
    });

    // 매칭 후보 중 인원이 가장 많은 파티 우선 선택 (빠른 파티 완성 목적)
    const existingMatchingParty = matchingCandidates.sort((a, b) => b.members.length - a.members.length)[0];

    if (existingMatchingParty) {
      // 🤝 기존 모집 파티에 자동 합류 처리!
      const existingMembers = existingMatchingParty.members;
      const myCharObj = allCharactersMap[selectedChar];
      const myJob = myCharObj?.job || "전사";

      const newMember = {
        name: selectedChar,
        job: myJob,
        roles: myRoles.length > 0 ? myRoles : ["딜러"],
        time_start: timeStart,
        time_end: timeEnd
      };

      const updatedMembers = [...existingMembers, newMember];
      
      // 구하는 포지션 차감 업데이트
      let updatedWanted = [...(existingMatchingParty.wanted_roles || [])];
      if (myRoles.length > 0) {
        myRoles.forEach(r => {
          const idx = updatedWanted.indexOf(r);
          if (idx > -1) updatedWanted.splice(idx, 1);
        });
      }

      let updatePayload: any = {
        members: updatedMembers,
        wanted_roles: updatedWanted
      };

      // 만약 이번 합류로 파티 정원이 가득 찬 경우 -> 자동 출발 시간 도출 & 매칭 완료 전환
      if (updatedMembers.length === existingMatchingParty.max_members) {
        const timeRanges = updatedMembers.map(m => ({ start: m.time_start, end: m.time_end }));
        const optimalTime = calculateMidpointStartTime(timeRanges);
        updatePayload.final_start_time = optimalTime || existingMatchingParty.members[0].time_start;
        updatePayload.status = "매칭 완료";
        updatePayload.leader_name = pickRandomLeader(updatedMembers);
      } else {
        updatePayload.status = "모집중";
      }

      const { error } = await supabase.from("parties").update(updatePayload).eq("id", existingMatchingParty.id);
      if (!error) {
        if (updatePayload.status === "매칭 완료") {
          alert(
            `🎉 [스마트 자동 매칭 성공 & 파티 완성!]\n` +
            `기존 '${existingMatchingParty.leader_name}' 님의 파티(${selectedContent.name})에 '${selectedChar}' 캐릭터가 자동 합류되어 파티가 완성되었습니다!\n` +
            `⏰ 확정 출발 시간: ${updatePayload.final_start_time}`
          );
        } else {
          alert(
            `✨ [스마트 자동 매칭 성공!]\n` +
            `동일 컨텐츠/시간대의 기존 '${existingMatchingParty.leader_name}' 님 파티(${selectedContent.name})에 '${selectedChar}' 캐릭터가 자동으로 합류되었습니다!\n` +
            `👥 파티 현황: (${updatedMembers.length}/${existingMatchingParty.max_members}명)`
          );
        }
        setPartyMemo("");
        localStorage.removeItem("sanctum_party_draft");
        setIsMobileFormOpen(false);
        const ownerName = user?.username || user?.nickname || user?.owner || "한설";
        fetchData(ownerName);
        return;
      } else {
        alert("자동 매칭 합류 실패: " + error.message);
        return;
      }
    }

    // 3) 조건에 부합하는 기존 파티가 없는 경우 -> 신규 파티 생성!
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

    const myCharObj = allCharactersMap[selectedChar];
    const myJob = myCharObj?.job || "전사";

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
      alert(`[${getFormattedDateWithDDay(targetDate)} / ${selectedChar}] 매칭 대기 파티가 신규 개설되었습니다!`);
      setPartyMemo("");
      localStorage.removeItem("sanctum_party_draft");
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

    const busMemoFinal = busCreateMemo.trim() 
      ? `[성역 길드 버스] ${busCreateMemo.trim()}` 
      : "[성역 길드 버스] 성역 정기 길드 버스 운행";

    const busPartyPayload = {
      content_name: busCreateContent.name,
      sub_content: busMemoFinal,
      difficulty: busCreateDiff,
      party_type: "1회 클리어",
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
      alert(`🚌 ${getFormattedDateWithDDay(busCreateDate)}\n성역 길드 버스 파티가 성공적으로 개설되었습니다!`);
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

  const handleLeaveParty = async (party: Party, charName: string) => {
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

  const openJoinPopup = (party: Party) => {
    setJoinPopupParty(party);
    setJoinSelectedChar(myCharacters.length > 0 ? myCharacters[0].nickname : "");
    setJoinSelectedRole(party.wanted_roles?.[0] || "딜러");
    setJoinTimeStart(party.time_start);
    setJoinTimeEnd(party.time_end);
  };

  // 🤝 기존 파티 합류 실행 (시간대 실충돌 정밀 검사)
  const executeJoinParty = async () => {
    if (!joinPopupParty || !joinSelectedChar || !joinSelectedRole) return alert("캐릭터와 포지션을 선택해주세요!");
    try {
      const [partyRes, allActivePartiesRes] = await Promise.all([
        supabase.from("parties").select("*").eq("id", joinPopupParty.id).single(),
        supabase.from("parties").select("*").neq("status", "종료됨")
      ]);
      const latestParty = partyRes.data;
      if (!latestParty || latestParty.members.length >= latestParty.max_members) {
        return alert("이미 모집이 마감되었거나 정원이 초과된 파티입니다.");
      }

      if (latestParty.members.some((m: any) => m.name === joinSelectedChar)) {
        return alert(`이미 '${joinSelectedChar}' 캐릭터가 이 파티에 참여 중입니다!`);
      }

      const candidateOwner = ownerAccountMap[joinSelectedChar] || joinSelectedChar;
      
      const isBus = latestParty.party_type === "GUILD_BUS" || 
                    latestParty.party_type === "길드 버스" || 
                    latestParty.party_type === "길드버스" || 
                    latestParty.sub_content?.includes("길드 버스") ||
                    latestParty.content_name?.includes("버스");

      // 1) 신청하려는 '해당 파티 내' 계정 중복 검사 (일반 파티인 경우에만 제한)
      if (!isBus) {
        const alreadyJoinedOwner = latestParty.members.some((m: any) => {
          const memOwner = ownerAccountMap[m.name] || m.name;
          return memOwner === candidateOwner;
        });
        if (alreadyJoinedOwner) {
          return alert(`⚠️ [계정 중복 참여 제한]\n이미 해당 계정의 다른 캐릭터가 이 파티에 참여 중입니다!`);
        }
      }

      // 2) 신청하려는 파티의 시간대와 내 계정의 다른 파티들의 '실제 시간대 겹침' 검사
      const partyDate = latestParty.party_date || getTodayString();
      const timeConflictingParty = allActivePartiesRes.data?.find((p: any) => {
        if (p.id === latestParty.id) return false; // 현재 신청 파티 제외
        const pDate = p.party_date || getTodayString();
        if (pDate !== partyDate) return false;

        const pStart = p.final_start_time || p.time_start;
        const pEnd = p.time_end;
        const overlap = isTimeOverlapping(joinTimeStart, joinTimeEnd, pStart, pEnd);
        if (!overlap) return false;

        return p.members.some((m: any) => {
          const memOwner = ownerAccountMap[m.name] || m.name;
          return memOwner === candidateOwner;
        });
      });

      if (timeConflictingParty) {
        const matchedMem = timeConflictingParty.members.find((m: any) => (ownerAccountMap[m.name] || m.name) === candidateOwner);
        const pStart = timeConflictingParty.final_start_time || timeConflictingParty.time_start;
        return alert(
          `⚠️ [시간대 일정 충돌 경고]\n` +
          `내 계정 캐릭터 '${matchedMem?.name}'가 이미 동시간대 [${pStart} ~ ${timeConflictingParty.time_end}] 다른 파티에 참여 중입니다!`
        );
      }

      const existingMembers = latestParty.members;
      const allRanges = [...existingMembers.map((m: any) => ({ start: m.time_start, end: m.time_end })), { start: joinTimeStart, end: joinTimeEnd }];
      const maxStart = Math.max(...allRanges.map(r => timeToMinutes(r.start)));
      const minEnd = Math.min(...allRanges.map(r => timeToMinutes(r.end)));

      if (maxStart >= minEnd) {
        return alert(`⚠️ [시간 충돌 거부]\n기존 파티원들과 겹치는 시간대가 존재하지 않습니다! (${joinTimeStart} ~ ${joinTimeEnd})`);
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
        updatePayload.status = "매칭 완료";
        updatePayload.leader_name = pickRandomLeader(updatedMembers);
      } else {
        updatePayload.status = "모집중";
      }

      const { error } = await supabase.from("parties").update(updatePayload).eq("id", joinPopupParty.id);
      if (error) throw error;

      alert(updatePayload.status === "매칭 완료" ? `🎉 파티 매칭 완료!\n⏰ 출발 시간: ${updatePayload.final_start_time}` : `[${joinSelectedChar}] 합류 완료!`);
      setJoinPopupParty(null);
      const ownerName = user?.username || user?.nickname || user?.owner || "한설";
      fetchData(ownerName);
    } catch (err) { alert("처리 중 오류 발생"); }
  };

  const datePartyCounts = useMemo(() => {
    const counts: Record<string, { total: number; recruiting: number; completed: number }> = {};
    const todayStr = getTodayString();

    activeParties.forEach(p => {
      const pDate = p.party_date || todayStr;
      if (pDate < todayStr) return;

      const isCompleted = p.status === "매칭 완료" || p.status === "모집완료";
      const isBus = p.party_type === "GUILD_BUS" || p.party_type === "길드 버스" || p.party_type === "길드버스" || p.sub_content?.includes("길드 버스");
      
      if (isBus) {
        const week = getMabinogiWeekRange(pDate);
        let curr = new Date(week.start);
        const endD = new Date(week.end);
        while (curr <= endD) {
          const dStr = curr.toISOString().split("T")[0];
          if (dStr >= todayStr) {
            if (!counts[dStr]) counts[dStr] = { total: 0, recruiting: 0, completed: 0 };
            counts[dStr].total += 1;
            if (isCompleted) counts[dStr].completed += 1;
            else counts[dStr].recruiting += 1;
          }
          curr.setDate(curr.getDate() + 1);
        }
      } else {
        if (!counts[pDate]) counts[pDate] = { total: 0, recruiting: 0, completed: 0 };
        counts[pDate].total += 1;
        if (isCompleted) counts[pDate].completed += 1;
        else counts[pDate].recruiting += 1;
      }
    });
    return counts;
  }, [activeParties]);

  const upcomingDates = useMemo(() => {
    const list = [];
    for (let i = 0; i < 10; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const dateStr = `${year}-${month}-${day}`;
      const label = i === 0 ? "오늘" : i === 1 ? "내일" : `${month}/${day}`;
      list.push({ dateStr, label, index: i });
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
    const todayStr = getTodayString();

    const filtered = activeParties.filter(party => {
      const pDate = party.party_date || todayStr;
      if (pDate < todayStr) return false;
      
      const isBus = party.party_type === "GUILD_BUS" || party.party_type === "길드 버스" || party.party_type === "길드버스" || party.sub_content?.includes("길드 버스");

      if (activeDateFilter !== "전체") {
        if (isBus) {
          const week = getMabinogiWeekRange(pDate);
          if (activeDateFilter < week.start || activeDateFilter > week.end) return false;
        } else {
          if (pDate !== activeDateFilter) return false;
        }
      }

      const isCompleted = party.status === "매칭 완료" || party.status === "모집완료";
      const isRecruiting = party.status === "모집중";

      if (statusFilter === "길드버스" && !isBus) return false;
      if (statusFilter === "매칭중" && (!isRecruiting || isBus)) return false;
      if (statusFilter === "매칭완료" && !isCompleted) return false;

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
      const aIsBus = (a.party_type === "GUILD_BUS" || a.sub_content?.includes("길드 버스")) ? 1 : 0;
      const bIsBus = (b.party_type === "GUILD_BUS" || b.sub_content?.includes("길드 버스")) ? 1 : 0;
      if (aIsBus !== bIsBus) return bIsBus - aIsBus;

      const aIsCompleted = a.status === "매칭 완료" || a.status === "모집완료" ? 1 : 0;
      const bIsCompleted = b.status === "매칭 완료" || b.status === "모집완료" ? 1 : 0;
      if (aIsCompleted !== bIsCompleted) return aIsCompleted - bIsCompleted;

      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    });
  }, [activeParties, activeDateFilter, statusFilter, partySearchTerm]);

  if (!mounted) return null;

  return (
    <main className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] font-sans pb-28 pt-3 sm:pt-6 relative select-none w-full overflow-x-hidden">
      <div className="max-w-[1400px] mx-auto px-3 sm:px-6 space-y-3 sm:space-y-4 relative z-10">
        
        {/* 상단 헤더 */}
        <header className="relative overflow-hidden rounded-2xl bg-[var(--panel)] border border-[var(--panel-border)] py-3 px-4 md:py-4 md:px-6 shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-3 min-w-0">
          <div className="absolute top-0 left-0 w-2 h-full bg-[var(--accent)] shadow-[0_0_15px_var(--accent)]"></div>
          
          <div className="flex items-center justify-between w-full md:w-auto gap-2.5 min-w-0 shrink-0">
            <div className="flex items-center gap-2 min-w-0 flex-wrap">
              <h1 className="text-base sm:text-lg md:text-xl font-black tracking-widest leading-none text-[var(--text-main)] whitespace-nowrap shrink-0 drop-shadow-sm">
                SYNAXIS
              </h1>
              <span className="text-xs sm:text-sm font-bold text-[var(--accent)] whitespace-nowrap shrink-0">
                시낙시스 : 스마트 파티 매칭
              </span>
            </div>

            <button 
              type="button"
              onClick={() => setShowSynaxisInfoModal(true)} 
              className="lg:hidden w-6 h-6 rounded-full bg-[var(--inner-box)] border border-[var(--panel-border)] text-xs font-black text-[var(--text-sub)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition flex items-center justify-center shrink-0 shadow-xs cursor-pointer ml-auto" 
              title="SYNAXIS 안내"
            >
              ?
            </button>
            <button 
              type="button"
              onClick={() => setShowLoreGuide(true)} 
              className="hidden lg:flex w-5 h-5 rounded-full bg-[var(--inner-box)] border border-[var(--panel-border)] text-xs font-black text-[var(--text-sub)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition items-center justify-center shrink-0 ml-1 cursor-pointer" 
              title="가이드 보기"
            >
              i
            </button>
          </div>

          <div className="hidden xl:flex bg-[var(--inner-box)] border border-[var(--panel-border)] rounded-xl px-3.5 py-2 items-center gap-2 text-[11px] sm:text-xs text-[var(--text-main)] shadow-inner max-w-[620px] shrink min-w-0">
            <span className="text-sm shrink-0">🏛️</span>
            <span className="font-medium text-[var(--text-sub)] leading-snug line-clamp-2">
              시낙시스는 고대 그리스어로 <strong className="text-[var(--accent)] font-bold">&apos;함께 모이는 것&apos;</strong>을 뜻합니다.<br className="hidden xl:block" />
              성역의 전우들과 최적의 시간으로 길을 나섭니다.
            </span>
          </div>
        </header>

        {/* 모바일 파티 등록 토글 */}
        <div className="lg:hidden">
          <button 
            type="button"
            onClick={() => setIsMobileFormOpen(!isMobileFormOpen)}
            className={`w-full py-2.5 px-4 rounded-2xl shadow-md transition flex justify-between items-center border active:scale-[0.99] cursor-pointer ${
              isMobileFormOpen ? "bg-[var(--inner-box)] border-[var(--accent)] text-[var(--accent)]" : "bg-[var(--panel)] border-[var(--panel-border)] text-[var(--text-main)]"
            }`}
          >
            <span className="flex items-center gap-2 text-xs font-black">
              <span className="text-sm leading-none">✨</span>
              <span>스마트 파티 매칭 등록</span>
            </span>
            <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-xl border ${isMobileFormOpen ? "bg-[var(--accent)] text-[var(--accent-fg)] border-transparent" : "bg-[var(--inner-box)] border-[var(--panel-border)] text-[var(--accent)]"}`}>
              {isMobileFormOpen ? "닫기" : "열기"}
            </span>
          </button>
        </div>

        {/* 메인 레이아웃 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-w-0">
          
          {/* 파티 등록 패널 */}
          <div className={`lg:col-span-5 xl:col-span-4 bg-[var(--panel)] rounded-2xl border border-[var(--panel-border)] p-4 sm:p-5 shadow-sm h-fit min-w-0 ${
            isMobileFormOpen ? "block animate-in fade-in duration-200" : "hidden lg:block"
          }`}>
            <PartyCreateForm 
              isAdmin={isAdmin}
              myCharacterNames={myCharacterNames}
              allCharactersMap={allCharactersMap}
              selectedChar={selectedChar}
              setSelectedChar={setSelectedChar}
              selectedContent={selectedContent}
              selectedDiff={selectedDiff}
              openContentModal={openContentModal}
              selectedDate={selectedDate}
              getDayOfWeekKorean={getDayOfWeekKorean}
              timeStart={timeStart}
              timeEnd={timeEnd}
              openScheduleModal={() => setShowScheduleModal(true)}
              partyType={partyType}
              setPartyType={setPartyType}
              matchingMode={matchingMode}
              setMatchingMode={setMatchingMode}
              loopSubMode={loopSubMode}
              setLoopSubMode={setLoopSubMode}
              minRuns={minRuns}
              setMinRuns={setMinRuns}
              maxRuns={maxRuns}
              setMaxRuns={setMaxRuns}
              loopHoursCount={loopHoursCount}
              setLoopHoursCount={setLoopHoursCount}
              loopHoursMin={loopHoursMin}
              setLoopHoursMin={setLoopHoursMin}
              partyMemo={partyMemo}
              setPartyMemo={setPartyMemo}
              myRoles={myRoles}
              setMyRoles={setMyRoles}
              wantedRoles={wantedRoles}
              setWantedRoles={setWantedRoles}
              handleReservation={handleReservation}
              setShowBusCreateModal={setShowBusCreateModal}
            />
          </div>

          {/* 파티 피드 영역 */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-3 min-w-0">
            <div className="bg-[var(--panel)] rounded-2xl border border-[var(--panel-border)] p-4 sm:p-5 shadow-sm space-y-4 min-w-0">
              
              <PartyFilterHeader 
                activeDateFilter={activeDateFilter}
                setActiveDateFilter={setActiveDateFilter}
                setShowFilterCalendarModal={setShowFilterCalendarModal}
                setStatusFilter={setStatusFilter}
                setPartySearchTerm={setPartySearchTerm}
                upcomingDates={upcomingDates}
                datePartyCounts={datePartyCounts}
                partySearchTerm={partySearchTerm}
                statusFilter={statusFilter}
              />

              <div className="space-y-3 max-h-[680px] overflow-y-auto custom-scrollbar pr-1 min-w-0">
                {filteredParties.length === 0 ? (
                  <div className="text-center py-20 text-[var(--text-sub)] font-bold text-xs sm:text-sm bg-[var(--inner-box)] rounded-2xl border border-[var(--panel-border)]">
                    해당 조건의 파티가 없습니다.
                  </div>
                ) : (
                  filteredParties.map(party => (
                    <PartyCard 
                      key={party.id}
                      party={party}
                      myCharacterNames={myCharacterNames}
                      allCharactersMap={allCharactersMap}
                      getTodayString={getTodayString}
                      openJoinPopup={openJoinPopup}
                      setInspectCharacter={setInspectCharacter}
                      handleLeaveParty={handleLeaveParty}
                      handleDeleteParty={handleDeleteParty}
                      isAdmin={isAdmin}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 모바일 FAB 플로팅 버튼 */}
      <button
        type="button"
        onTouchStart={handleFabTouchStart}
        onTouchMove={handleFabTouchMove}
        onTouchEnd={handleFabTouchEnd}
        onMouseDown={handleFabMouseDown}
        onClick={handleFabClick}
        style={fabPos ? { left: `${fabPos.x}px`, top: `${fabPos.y}px`, bottom: "auto", right: "auto" } : {}}
        className={`lg:hidden fixed ${
          fabPos ? "" : "bottom-20 right-4"
        } z-[90] h-10 px-4 rounded-full bg-[var(--panel)] border border-[var(--accent)] text-[var(--accent)] font-black text-xs shadow-2xl flex items-center justify-center gap-2 active:scale-95 transition-transform select-none cursor-grab active:cursor-grabbing whitespace-nowrap shrink-0 ${
          isDraggingFab ? "opacity-90 scale-105" : ""
        }`}
      >
        <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-ping shrink-0"></span>
        <span className="whitespace-nowrap shrink-0">{isMobileFormOpen ? "닫기" : "파티 등록"}</span>
      </button>

      {/* 모달 관리자 */}
      <PartyModals 
        showSynaxisInfoModal={showSynaxisInfoModal}
        setShowSynaxisInfoModal={setShowSynaxisInfoModal}
        showLoreGuide={showLoreGuide}
        setShowLoreGuide={setShowLoreGuide}
        showContentModal={showContentModal}
        setShowContentModal={setShowContentModal}
        tempContentCategory={tempContentCategory}
        setTempContentCategory={setTempContentCategory}
        tempContent={tempContent}
        setTempContent={setTempContent}
        tempDiff={tempDiff}
        setTempDiff={setTempDiff}
        applyContentModal={applyContentModal}
        showScheduleModal={showScheduleModal}
        setShowScheduleModal={setShowScheduleModal}
        calendarYearMonth={calendarYearMonth}
        setCalendarYearMonth={setCalendarYearMonth}
        calendarDays={calendarDays}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        timeStart={timeStart}
        setTimeStart={setTimeStart}
        timeEnd={timeEnd}
        setTimeEnd={setTimeEnd}
        showFilterCalendarModal={showFilterCalendarModal}
        setShowFilterCalendarModal={setShowFilterCalendarModal}
        activeDateFilter={activeDateFilter}
        setActiveDateFilter={setActiveDateFilter}
        datePartyCounts={datePartyCounts}
        getDayOfWeekKorean={getDayOfWeekKorean}
        showBusCreateModal={showBusCreateModal}
        setShowBusCreateModal={setShowBusCreateModal}
        busCreateContent={busCreateContent}
        setBusCreateContent={setBusCreateContent}
        busCreateDiff={busCreateDiff}
        setBusCreateDiff={setBusCreateDiff}
        busCreateDate={busCreateDate}
        setBusCreateDate={setBusCreateDate}
        busCreateTimeStart={busCreateTimeStart}
        setBusCreateTimeStart={setBusCreateTimeStart}
        busCreateTimeEnd={busCreateTimeEnd}
        setBusCreateTimeEnd={setBusCreateTimeEnd}
        busCreateMemo={busCreateMemo}
        setBusCreateMemo={setBusCreateMemo}
        handleCreateGuildBus={handleCreateGuildBus}
        inspectCharacter={inspectCharacter}
        setInspectCharacter={setInspectCharacter}
        joinPopupParty={joinPopupParty}
        setJoinPopupParty={setJoinPopupParty}
        myCharacters={myCharacters}
        joinSelectedChar={joinSelectedChar}
        setJoinSelectedChar={setJoinSelectedChar}
        joinSelectedRole={joinSelectedRole}
        setJoinSelectedRole={setJoinSelectedRole}
        joinTimeStart={joinTimeStart}
        setJoinTimeStart={setJoinTimeStart}
        joinTimeEnd={joinTimeEnd}
        setJoinTimeEnd={setJoinTimeEnd}
        executeJoinParty={executeJoinParty}
      />

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--panel-border); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: var(--accent); }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </main>
  );
}

export default function PartyPage() {
  return (
    <Suspense fallback={<div className="w-full text-center py-20 font-black text-[var(--text-sub)]">시낙시스 시스템 로딩 중...</div>}>
      <SynaxisContent />
    </Suspense>
  );
}