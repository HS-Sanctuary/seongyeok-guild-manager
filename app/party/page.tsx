"use client";

import { useState, useEffect, Suspense, useMemo, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { pickRandomLeader, autoBalanceAndBuildParty } from "@/lib/matchingUtils";
import { CONTENT_DB, ContentItem, Party } from "@/components/party/types";
import PartyCreateForm from "@/components/party/PartyCreateForm";
import PartyFilterHeader from "@/components/party/PartyFilterHeader";
import PartyCard from "@/components/party/PartyCard";
import GuildBusCard from "@/components/party/GuildBusCard";
import PartyModals, { generateDefaultBusMemo, BusCharSelectionConfig } from "@/components/party/PartyModals";
import GuildBusJoinModal from "@/components/party/GuildBusJoinModal";
import { getRoleByJob } from "@/lib/busUtils";

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

function normalizeDateStr(dateStr: string): string {
  if (!dateStr) return "";
  const clean = dateStr.replace(/\./g, "-").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
    return clean;
  }
  const mmddMatch = clean.match(/^(\d{1,2})[\/\-](\d{1,2})$/);
  if (mmddMatch) {
    const year = new Date().getFullYear();
    const mm = mmddMatch[1].padStart(2, "0");
    const dd = mmddMatch[2].padStart(2, "0");
    return `${year}-${mm}-${dd}`;
  }
  return clean;
}

function getDayOfWeekKorean(dateStr: string): string {
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  const normDate = normalizeDateStr(dateStr);
  const d = new Date(normDate + "T00:00:00");
  return isNaN(d.getTime()) ? "월" : days[d.getDay()];
}

export function getFormattedDateWithDDay(dateStr: string): string {
  if (!dateStr) return "";
  const normStr = normalizeDateStr(dateStr);
  const targetDate = new Date(normStr + "T00:00:00");
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
  const normDate = normalizeDateStr(dateStr);
  const date = new Date(normDate + "T00:00:00");
  const day = isNaN(date.getTime()) ? 0 : date.getDay();
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

  const [isBusModalOpen, setIsBusModalOpen] = useState(false);
  const [targetBusParty, setTargetBusParty] = useState<{ contentName: string; difficulty: string } | null>(null);

  const [timeoutParty, setTimeoutParty] = useState<Party | null>(null);

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

  const defaultCabrak = useMemo(() => {
    return CONTENT_DB.find(c => c.name.includes("카브락")) || CONTENT_DB[0];
  }, []);

  const [busCreateContent, setBusCreateContent] = useState<ContentItem>(defaultCabrak);
  const [busCreateDiff, setBusCreateDiff] = useState(defaultCabrak.defaultDiff || "어려움");
  const [busCreateDate, setBusCreateDate] = useState(() => getTodayString());
  const [busCreateTimeStart, setBusCreateTimeStart] = useState("20:00");
  const [busCreateTimeEnd, setBusCreateTimeEnd] = useState("23:59");
  const [busCreateMemo, setBusCreateMemo] = useState(() => generateDefaultBusMemo(defaultCabrak, defaultCabrak.defaultDiff || "어려움"));

  const [busCharSelections, setBusCharSelections] = useState<Record<string, BusCharSelectionConfig>>({});

  const [joinPopupParty, setJoinPopupParty] = useState<Party | null>(null);
  const [joinSelectedChar, setJoinSelectedChar] = useState<string>("");
  const [joinSelectedRole, setJoinSelectedRole] = useState<string>("");
  const [joinTimeStart, setJoinTimeStart] = useState<string>("18:00");
  const [joinTimeEnd, setJoinTimeEnd] = useState<string>("24:00");
  const [inspectCharacter, setInspectCharacter] = useState<any>(null);

  const checkTimeouts = useCallback((partyList: Party[], ownerName: string) => {
    if (!ownerName) return;
    const now = new Date();
    const currentHM = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const normToday = normalizeDateStr(getTodayString());

    for (const party of partyList) {
      const isMyParty = party.members?.some((m: any) => {
        const memName = m.name || m.character_name;
        const memOwner = ownerAccountMap[memName] || memName;
        return memOwner === ownerName || memName === ownerName;
      }) || party.leader_name === ownerName;

      const normPartyDate = normalizeDateStr(party.party_date || normToday);
      const isPastDate = normPartyDate < normToday;
      const isPastTime = normPartyDate === normToday && party.time_end && party.time_end < currentHM;

      if (isMyParty && party.status === "모집중" && (isPastDate || isPastTime)) {
        setTimeoutParty(party);
        break;
      }
    }
  }, [ownerAccountMap]);

  const handleExtendTimeout = async (party: Party, extensionType: "30M" | "1H" | "TOMORROW" | "CANCEL") => {
    try {
      if (extensionType === "CANCEL") {
        await supabase.from("parties").delete().eq("id", party.id);
        alert("파티 모집이 취소되었습니다.");
      } else if (extensionType === "TOMORROW") {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split("T")[0];
        await supabase.from("parties").update({ party_date: tomorrowStr }).eq("id", party.id);
        alert(`📅 파티 모집 날짜가 내일(${tomorrowStr})로 연장되었습니다.`);
      } else {
        const addMinutes = extensionType === "30M" ? 30 : 60;
        const [h, m] = (party.time_end || "22:00").split(":").map(Number);
        const endMins = h * 60 + m + addMinutes;
        const newTimeEnd = minutesToTime(endMins);

        await supabase.from("parties").update({ time_end: newTimeEnd }).eq("id", party.id);
        alert(`⏰ 희망 종료 시간이 ${newTimeEnd}까지 ${addMinutes}분 연장되었습니다.`);
      }
      setTimeoutParty(null);
      const ownerName = user?.username || user?.nickname || user?.owner || "한설";
      fetchData(ownerName);
    } catch (err: any) {
      alert("시간 연장 처리 실패: " + err.message);
    }
  };

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
        setIsBusModalOpen(false);
        setInspectCharacter(null);
        setJoinPopupParty(null);
        setIsMobileFormOpen(false);
        setTimeoutParty(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const fetchData = useCallback(async (ownerName: string) => {
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
        checkTimeouts(partyRes.data, ownerName);
      }
    } catch (err) {
      console.error("데이터 로드 실패", err);
    }
  }, [checkTimeouts]);

  useEffect(() => {
    setMounted(true);
    let ownerName = "한설";
    const savedUser = localStorage.getItem("nexus_user");
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        ownerName = parsed.username || parsed.nickname || parsed.owner || "한설";
        if (parsed.nickname === "한설" || parsed.role === "admin") setIsAdmin(true);
      } catch (e) {
        setIsAdmin(true);
      }
    } else {
      setUser({ username: "한설" });
      setIsAdmin(true);
    }

    fetchData(ownerName);

    const partyChannel = supabase
      .channel("realtime-parties-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "parties" },
        () => {
          fetchData(ownerName);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(partyChannel);
    };
  }, [fetchData]);

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

  const handleReservation = async () => {
    if (!selectedChar) return alert("참여할 캐릭터를 선택해주세요!");
    if (matchingMode === "조합우선" && myRoles.length === 0) {
      return alert("조합 우선 매칭 시, 수행 가능한 포지션을 최소 1개 이상 선택해주세요!");
    }

    const targetDate = normalizeDateStr(selectedDate);
    const candidateOwner = ownerAccountMap[selectedChar] || selectedChar;
    const dbPartyType = partyType === "반복 뺑이" ? "연속 뺑이" : "1회 클리어";

    const timeConflictingParty = activeParties.find(p => {
      const pDate = normalizeDateStr(p.party_date || getTodayString());
      if (pDate !== targetDate) return false;

      const pStart = p.final_start_time || p.time_start;
      const pEnd = p.time_end;
      const overlap = isTimeOverlapping(timeStart, timeEnd, pStart, pEnd);
      if (!overlap) return false;

      return p.members.some((m: any) => {
        const memOwner = ownerAccountMap[m.name || m.character_name] || (m.name || m.character_name);
        return memOwner === candidateOwner;
      });
    });

    if (timeConflictingParty) {
      const matchedMem = timeConflictingParty.members.find((m: any) => (ownerAccountMap[m.name || m.character_name] || (m.name || m.character_name)) === candidateOwner);
      const pStart = timeConflictingParty.final_start_time || timeConflictingParty.time_start;
      return alert(
        `⚠️ [시간대 일정 충돌 차단]\n` +
        `해당 계정의 캐릭터 '${matchedMem?.name || matchedMem?.character_name}'가 이미 ${targetDate} [${pStart} ~ ${timeConflictingParty.time_end}] 시간대 파티에 참여 중입니다!\n` +
        `시간대가 겹치지 않는 다른 시간에 매칭을 등록해 주세요.`
      );
    }

    const matchingCandidates = activeParties.filter(p => {
      if (p.status !== "모집중") return false;
      
      const pDate = normalizeDateStr(p.party_date || getTodayString());
      if (pDate !== targetDate) return false;
      if (p.content_name !== selectedContent.name) return false;
      if (p.difficulty !== selectedDiff) return false;
      if (p.party_type !== dbPartyType) return false;

      const isBus = p.party_type === "1회 클리어" && p.sub_content?.includes("길드 버스");
      if (isBus) return false;
      if (p.members.length >= p.max_members) return false;

      const hasSameAccount = p.members.some((m: any) => {
        const memName = m.name || m.character_name;
        const memOwner = ownerAccountMap[memName] || memName;
        return memOwner === candidateOwner;
      });
      if (hasSameAccount) return false;

      const pStart = p.time_start;
      const pEnd = p.time_end;
      return isTimeOverlapping(timeStart, timeEnd, pStart, pEnd);
    });

    const existingMatchingParty = matchingCandidates.sort((a, b) => b.members.length - a.members.length)[0];

    if (existingMatchingParty) {
      const existingMembers = existingMatchingParty.members;
      const myCharObj = allCharactersMap[selectedChar];
      const myJob = myCharObj?.job || "전사";

      const newMember = {
        name: selectedChar,
        character_name: selectedChar,
        character_id: myCharObj?.id,
        job: myJob,
        role: myRoles[0] || "딜러",
        roles: myRoles.length > 0 ? myRoles : ["딜러"],
        combat_power: myCharObj?.combat_power || 0,
        magic_resistance: myCharObj?.magic_resistance || 0,
        time_start: timeStart,
        time_end: timeEnd
      };

      const candidateList = [...existingMembers, newMember];
      const balanced = autoBalanceAndBuildParty(candidateList, existingMatchingParty.max_members);

      let updatedWanted = [...(existingMatchingParty.wanted_roles || [])];
      if (myRoles.length > 0) {
        myRoles.forEach(r => {
          const idx = updatedWanted.indexOf(r);
          if (idx > -1) updatedWanted.splice(idx, 1);
        });
      }

      let updatePayload: any = {
        members: balanced.members,
        wanted_roles: updatedWanted
      };

      if (balanced.members.length === existingMatchingParty.max_members) {
        const timeRanges = balanced.members.map((m: any) => ({ start: m.time_start || timeStart, end: m.time_end || timeEnd }));
        const optimalTime = calculateMidpointStartTime(timeRanges);
        updatePayload.final_start_time = optimalTime || existingMatchingParty.members[0].time_start;
        updatePayload.status = "매칭 완료";
        updatePayload.leader_name = pickRandomLeader(balanced.members);
      } else {
        updatePayload.status = "모집중";
      }

      const { error } = await supabase.from("parties").update(updatePayload).eq("id", existingMatchingParty.id);
      if (!error) {
        alert(updatePayload.status === "매칭 완료" ? `🎉 파티 완성!` : `✨ 자동 매칭 성공!`);
        setPartyMemo("");
        localStorage.removeItem("sanctum_party_draft");
        setIsMobileFormOpen(false);
        const ownerName = user?.username || user?.nickname || user?.owner || "한설";
        fetchData(ownerName);
        return;
      }
    }

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

    const initialMember = {
      name: selectedChar, 
      character_name: selectedChar, 
      character_id: myCharObj?.id, 
      job: myJob, 
      role: myRoles[0] || "딜러",
      roles: myRoles, 
      combat_power: myCharObj?.combat_power || 0,
      magic_resistance: myCharObj?.magic_resistance || 0,
      time_start: timeStart, 
      time_end: timeEnd 
    };

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
      members: [initialMember], 
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

  // 🔥 개편된 성역 길드 버스 개설 제출 (캐릭터 닉네임이 정확히 매핑되도록 수정)
  const handleCreateGuildBus = async () => {
    if (!isAdmin) return alert("관리자 권한이 필요합니다.");

    const selectedEntries = Object.entries(busCharSelections).filter(([_, config]) => config.selected);

    if (selectedEntries.length === 0) {
      return alert("개설 시 버스 파티에 참여시킬 캐릭터를 최소 1개 이상 선택해주세요!");
    }

    const initialMembers = selectedEntries.map(([charKey, config]) => {
      const charObj = myCharacters.find(c => c.nickname === charKey || c.name === charKey || String(c.id) === String(charKey)) || {};
      const charName = charObj.nickname || charObj.name || charKey;
      const job = charObj.job || "전사";
      const role = getRoleByJob(job);

      return {
        character_id: charObj.id,
        name: charName,
        character_name: charName,
        job: job,
        class_name: job,
        role: role,
        roles: [role],
        combat_power: charObj.combat_power || 0,
        magic_resistance: charObj.magic_resistance || 0,
        account_id: user?.id || charObj.owner || user?.username || "한설",
        time_start: busCreateTimeStart,
        time_end: busCreateTimeEnd,
        allow_repeat: config.allowRepeat
      };
    });

    const busLeaderName = initialMembers[0]?.name || user?.username || "한설";
    const busMemoFinal = busCreateMemo.trim() || generateDefaultBusMemo(busCreateContent, busCreateDiff);
    const normBusDate = normalizeDateStr(busCreateDate);

    const busPartyPayload = {
      content_name: busCreateContent.name,
      sub_content: busMemoFinal,
      difficulty: busCreateDiff,
      party_type: "1회 클리어",
      party_date: normBusDate,
      time_start: busCreateTimeStart,
      time_end: busCreateTimeEnd,
      max_members: busCreateContent.size,
      matching_mode: "모집우선",
      wanted_roles: ["탱커", "힐러", "근딜", "원딜"],
      members: initialMembers,
      status: "모집중",
      leader_name: busLeaderName
    };

    const { error } = await supabase.from("parties").insert([busPartyPayload]);
    if (!error) {
      alert(`🚌 ${getFormattedDateWithDDay(normBusDate)}\n성역 길드 버스 파티가 성공적으로 개설되었습니다! (${initialMembers.length}개 캐릭터 등록)`);
      setShowBusCreateModal(false);
      const ownerName = user?.username || user?.nickname || user?.owner || "한설";
      fetchData(ownerName);
    } else {
      alert("버스 개설 실패: " + error.message);
    }
  };

  const openGuildBusModal = (contentName: string, difficulty: string) => {
    setTargetBusParty({ contentName, difficulty });
    setIsBusModalOpen(true);
  };

  const handleBusSubmit = async (selectedData: { characterId: string; allowRepeat: boolean; timeStart: string; timeEnd: string }[]) => {
    if (!targetBusParty) return;

    try {
      const newMembers = selectedData.map(item => {
        const char = myCharacters.find(c => c.nickname === item.characterId || c.name === item.characterId || String(c.id) === String(item.characterId));
        if (!char) throw new Error("선택한 캐릭터 정보를 찾을 수 없습니다.");
        const mappedRole = getRoleByJob(char.job);
        return {
          character_id: char.id,
          name: char.nickname || char.name,
          character_name: char.nickname || char.name,
          job: char.job || "전사",
          class_name: char.job || "전사",
          role: mappedRole,
          roles: [mappedRole],
          combat_power: char.combat_power || 0,
          magic_resistance: char.magic_resistance || 0,
          account_id: user?.id || char.owner || "한설",
          allow_repeat: item.allowRepeat,
          time_start: item.timeStart,
          time_end: item.timeEnd
        };
      });

      const existingParty = activeParties.find(
        p => p.content_name === targetBusParty.contentName && p.difficulty === targetBusParty.difficulty && p.sub_content?.includes("길드 버스")
      );

      if (existingParty) {
        const existingMemberIds = new Set(existingParty.members.map((m: any) => m.character_id || m.name || m.character_name));
        const filteredNewMembers = newMembers.filter(m => !existingMemberIds.has(m.character_id) && !existingMemberIds.has(m.name));

        if (filteredNewMembers.length === 0) {
          alert("선택하신 캐릭터들은 이미 해당 버스에 탑승해 있습니다!");
          return;
        }

        const combinedMembers = [...existingParty.members, ...filteredNewMembers];
        const { error } = await supabase
          .from("parties")
          .update({ members: combinedMembers })
          .eq("id", existingParty.id);
        if (error) throw error;
      } else {
        const firstItem = selectedData[0];
        const { error } = await supabase.from("parties").insert([{
          content_name: targetBusParty.contentName,
          difficulty: targetBusParty.difficulty,
          party_date: normalizeDateStr(selectedDate),
          time_start: firstItem?.timeStart || "20:00",
          time_end: firstItem?.timeEnd || "23:59",
          max_members: 8,
          party_type: "1회 클리어",
          sub_content: `[성역 길드 버스] ${targetBusParty.contentName} (${targetBusParty.difficulty}) 운행`,
          status: "모집중",
          matching_mode: "조합우선",
          members: newMembers,
          leader_name: newMembers[0]?.name || "한설"
        }]);
        if (error) throw error;
      }

      alert("성역 공식 길드 버스 탑승 신청이 완료되었습니다!");
      setIsBusModalOpen(false);
      const ownerName = user?.username || user?.nickname || user?.owner || "한설";
      fetchData(ownerName);
    } catch (err: any) {
      console.error("버스 탑승 신청 오류 상세:", err);
      alert(`신청 처리 중 오류가 발생했습니다: ${err?.message || JSON.stringify(err)}`);
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
      const leavingMember = party.members.find((m: any) => m.name === charName || m.character_name === charName);
      const remainingMembers = party.members.filter((m: any) => m.name !== charName && m.character_name !== charName);

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
          leader_name: remainingMembers[0]?.name || remainingMembers[0]?.character_name || null
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
    const isBus = party.sub_content?.includes("길드 버스");
    if (isBus) {
      openGuildBusModal(party.content_name, party.difficulty);
      return;
    }

    setJoinPopupParty(party);
    setJoinSelectedChar(myCharacters.length > 0 ? (myCharacters[0].nickname || myCharacters[0].name) : "");
    setJoinSelectedRole(party.wanted_roles?.[0] || "딜러");
    setJoinTimeStart(party.time_start);
    setJoinTimeEnd(party.time_end);
  };

  const executeJoinParty = async () => {
    if (!joinPopupParty || !joinSelectedChar || !joinSelectedRole) return alert("캐릭터와 포지션을 선택해주세요!");
    try {
      const [partyRes] = await Promise.all([
        supabase.from("parties").select("*").eq("id", joinPopupParty.id).single()
      ]);
      const latestParty = partyRes.data;
      if (!latestParty || latestParty.members.length >= latestParty.max_members) {
        return alert("이미 모집이 마감되었거나 정원이 초과된 파티입니다.");
      }

      if (latestParty.members.some((m: any) => m.name === joinSelectedChar || m.character_name === joinSelectedChar)) {
        return alert(`이미 '${joinSelectedChar}' 캐릭터가 이 파티에 참여 중입니다!`);
      }

      const candidateOwner = ownerAccountMap[joinSelectedChar] || joinSelectedChar;
      const isBus = latestParty.sub_content?.includes("길드 버스");

      if (!isBus) {
        const alreadyJoinedOwner = latestParty.members.some((m: any) => {
          const memName = m.name || m.character_name;
          const memOwner = ownerAccountMap[memName] || memName;
          return memOwner === candidateOwner;
        });
        if (alreadyJoinedOwner) {
          return alert(`⚠️ [계정 중복 참여 제한]\n이미 해당 계정의 다른 캐릭터가 이 파티에 참여 중입니다!`);
        }
      }

      const myCharObj = allCharactersMap[joinSelectedChar];
      const myJob = myCharObj?.job || "전사";
      const newMember = { 
        name: joinSelectedChar, 
        character_name: joinSelectedChar,
        character_id: myCharObj?.id,
        job: myJob, 
        roles: [joinSelectedRole], 
        role: joinSelectedRole,
        combat_power: myCharObj?.combat_power || 0,
        magic_resistance: myCharObj?.magic_resistance || 0,
        time_start: joinTimeStart, 
        time_end: joinTimeEnd 
      };

      const candidateList = [...latestParty.members, newMember];
      const balanced = autoBalanceAndBuildParty(candidateList, latestParty.max_members);

      let updatedWanted = [...(latestParty.wanted_roles || [])];
      if (updatedWanted.indexOf(joinSelectedRole) > -1) updatedWanted.splice(updatedWanted.indexOf(joinSelectedRole), 1);

      let updatePayload: any = { members: balanced.members, wanted_roles: updatedWanted };
      if (balanced.members.length === latestParty.max_members) {
        const timeRanges = balanced.members.map((m: any) => ({ start: m.time_start || joinTimeStart, end: m.time_end || joinTimeEnd }));
        const optimalTime = calculateMidpointStartTime(timeRanges);
        updatePayload.final_start_time = optimalTime || latestParty.members[0].time_start;
        updatePayload.status = "매칭 완료";
        updatePayload.leader_name = pickRandomLeader(balanced.members);
      } else {
        updatePayload.status = "모집중";
      }

      const { error } = await supabase.from("parties").update(updatePayload).eq("id", joinPopupParty.id);
      if (error) throw error;

      alert(updatePayload.status === "매칭 완료" ? `🎉 파티 매칭 완료!` : `[${joinSelectedChar}] 합류 완료!`);
      setJoinPopupParty(null);
      const ownerName = user?.username || user?.nickname || user?.owner || "한설";
      fetchData(ownerName);
    } catch (err) { alert("처리 중 오류 발생"); }
  };

  const datePartyCounts = useMemo(() => {
    const counts: Record<string, { total: number; recruiting: number; completed: number }> = {};
    const normToday = normalizeDateStr(getTodayString());

    activeParties.forEach(p => {
      const normPDate = normalizeDateStr(p.party_date || normToday);
      if (normPDate < normToday) return;

      const isCompleted = p.status === "매칭 완료" || p.status === "모집완료";
      const isBus = p.sub_content?.includes("길드 버스");
      
      if (isBus) {
        const week = getMabinogiWeekRange(normPDate);
        let curr = new Date(week.start + "T00:00:00");
        const endD = new Date(week.end + "T00:00:00");
        while (curr <= endD) {
          const dStr = curr.toISOString().split("T")[0];
          if (dStr >= normToday) {
            if (!counts[dStr]) counts[dStr] = { total: 0, recruiting: 0, completed: 0 };
            counts[dStr].total += 1;
            if (isCompleted) counts[dStr].completed += 1;
            else counts[dStr].recruiting += 1;
          }
          curr.setDate(curr.getDate() + 1);
        }
      } else {
        if (!counts[normPDate]) counts[normPDate] = { total: 0, recruiting: 0, completed: 0 };
        counts[normPDate].total += 1;
        if (isCompleted) counts[normPDate].completed += 1;
        else counts[normPDate].recruiting += 1;
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
    const normToday = normalizeDateStr(getTodayString());

    const filtered = activeParties.filter(party => {
      const normPartyDate = normalizeDateStr(party.party_date || normToday);
      if (normPartyDate < normToday) return false;
      
      const isBus = party.sub_content?.includes("길드 버스");

      if (activeDateFilter !== "전체") {
        const normFilterDate = normalizeDateStr(activeDateFilter);
        if (isBus) {
          const week = getMabinogiWeekRange(normPartyDate);
          if (normFilterDate < week.start || normFilterDate > week.end) return false;
        } else {
          if (normPartyDate !== normFilterDate) return false;
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
        const matchMember = party.members?.some((m: any) => (m.name || m.character_name)?.toLowerCase().includes(q));
        if (!matchName && !matchLeader && !matchMember) return false;
      }
      return true;
    });

    return filtered.sort((a, b) => {
      const aIsBus = a.sub_content?.includes("길드 버스") ? 1 : 0;
      const bIsBus = b.sub_content?.includes("길드 버스") ? 1 : 0;
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

            <div className="flex items-center gap-1.5 shrink-0 ml-auto">
              <button 
                type="button"
                onClick={() => setShowSynaxisInfoModal(true)} 
                className="lg:hidden w-6 h-6 rounded-full bg-[var(--inner-box)] border border-[var(--panel-border)] text-xs font-black text-[var(--text-sub)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition flex items-center justify-center shrink-0 shadow-xs cursor-pointer" 
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
          </div>

          <div className="hidden xl:flex bg-[var(--inner-box)] border border-[var(--panel-border)] rounded-xl px-3.5 py-2 items-center gap-2 text-[11px] sm:text-xs text-[var(--text-main)] shadow-inner max-w-[620px] shrink min-w-0">
            <span className="text-sm shrink-0">🏛️</span>
            <span className="medium text-[var(--text-sub)] leading-snug line-clamp-2">
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
              setMinRuns={setMinRuns}
              setLoopSubMode={setLoopSubMode}
              minRuns={minRuns}
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
              setShowBusCreateModal={(val) => {
                setBusCreateContent(defaultCabrak);
                setBusCreateDiff(defaultCabrak.defaultDiff || "어려움");
                setBusCreateMemo(generateDefaultBusMemo(defaultCabrak, defaultCabrak.defaultDiff || "어려움"));
                
                const initialSel: Record<string, BusCharSelectionConfig> = {};
                myCharacters.forEach((c, idx) => {
                  const key = c.nickname || c.name || c.id;
                  initialSel[key] = {
                    selected: idx === 0,
                    allowRepeat: true,
                  };
                });
                setBusCharSelections(initialSel);
                setShowBusCreateModal(val);
              }}
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
                  filteredParties.map(party => {
                    const isBus = party.sub_content?.includes("길드 버스") || (party.party_type === "1회 클리어" && party.sub_content?.includes("버스"));
                    
                    return isBus ? (
                      <GuildBusCard 
                        key={party.id}
                        party={party}
                        myCharacterNames={myCharacterNames}
                        allCharactersMap={allCharactersMap}
                        ownerAccountMap={ownerAccountMap}
                        openJoinPopup={openJoinPopup}
                        setInspectCharacter={setInspectCharacter}
                        handleLeaveParty={handleLeaveParty}
                        handleDeleteParty={handleDeleteParty}
                        isAdmin={isAdmin}
                        onRefresh={() => {
                          const ownerName = user?.username || user?.nickname || user?.owner || "한설";
                          fetchData(ownerName);
                        }}
                      />
                    ) : (
                      <PartyCard 
                        key={party.id}
                        party={party}
                        myCharacterNames={myCharacterNames}
                        allCharactersMap={allCharactersMap}
                        openJoinPopup={openJoinPopup}
                        setInspectCharacter={setInspectCharacter}
                        handleLeaveParty={handleLeaveParty}
                        handleDeleteParty={handleDeleteParty}
                        isAdmin={isAdmin}
                        onRefresh={() => {
                          const ownerName = user?.username || user?.nickname || user?.owner || "한설";
                          fetchData(ownerName);
                        }}
                      />
                    );
                  })
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
        <span className="whitespace-nowrap shrink-0">{isMobileFormOpen ? "닫기" : "매칭"}</span>
      </button>

      {/* 희망 시간 초과 자동 감지 연장 팝업 모달 */}
      {timeoutParty && (
        <div className="fixed inset-0 z-[110] bg-black/85 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#1c1c1e] border border-amber-500/60 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-2 text-amber-400 font-black text-lg">
              <span>⏱️</span> 희망 모집 시간 경과 안내
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              [<strong className="text-amber-300">{timeoutParty.content_name}</strong>] 파티의 희망 종료 시간(
              <strong className="text-amber-300">{timeoutParty.time_end}</strong>)이 경과하였습니다. 파티를 연장하거나 일정을 변경하시겠습니까?
            </p>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => handleExtendTimeout(timeoutParty, "30M")}
                className="py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs rounded-xl transition cursor-pointer"
              >
                ⏱️ +30분 연장
              </button>
              <button
                onClick={() => handleExtendTimeout(timeoutParty, "1H")}
                className="py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-black text-xs rounded-xl transition cursor-pointer"
              >
                ⏰ +1시간 연장
              </button>
              <button
                onClick={() => handleExtendTimeout(timeoutParty, "TOMORROW")}
                className="py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-xl transition cursor-pointer"
              >
                📅 내일 동일 시간으로
              </button>
              <button
                onClick={() => handleExtendTimeout(timeoutParty, "CANCEL")}
                className="py-2.5 bg-rose-900/60 hover:bg-rose-800 text-rose-300 font-black text-xs rounded-xl transition cursor-pointer border border-rose-500/30"
              >
                🗑️ 파티 모집 취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 길드 버스 전용 탑승 모달 */}
      {targetBusParty && (
        <GuildBusJoinModal
          isOpen={isBusModalOpen}
          onClose={() => setIsBusModalOpen(false)}
          myCharacters={myCharacters}
          onSubmit={handleBusSubmit}
          contentName={targetBusParty.contentName}
          difficulty={targetBusParty.difficulty}
        />
      )}

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
        busCharSelections={busCharSelections}
        setBusCharSelections={setBusCharSelections}
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
      <SynaxisClient />
    </Suspense>
  );
}

function SynaxisClient() {
  return <SynaxisContent />;
}