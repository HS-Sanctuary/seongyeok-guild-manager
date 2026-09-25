"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { memberMutation, memberMutationOrThrow } from "@/lib/memberMutationClient";
import { pickRandomLeader, autoBalanceAndBuildParty } from "@/lib/matchingUtils";
import { CONTENT_DB, ContentItem, Party, Member } from "@/components/party/types";
import { generateDefaultBusMemo, BusCharSelectionConfig } from "@/components/party/modals/BusCreateModal";
import { 
  getRoleByJob,
  assembleBalancedParty, 
  syncKronosChecklist, 
  parseCP, 
  generateAbyssDefaultMemo,
  BusCandidate,
  ContentPowerReq,
  NexusClassItem
} from "@/lib/busUtils";
import {
  isTimeOverlapping,
  calculateMidpointStartTime,
  getTodayString,
  normalizeDateStr,
  getFormattedDateWithDDay,
  getMabinogiWeekRange,
  minutesToTime
} from "@/lib/partyDateUtils";

const getPartyEndDateTime = (partyDateStr?: string, startHM?: string, endHM?: string): Date => {
  const normDate = normalizeDateStr(partyDateStr || getTodayString());
  const [eH, eM] = (endHM || "23:59").split(":").map(Number);
  const [sH, sM] = (startHM || "00:00").split(":").map(Number);
  
  const startMins = (isNaN(sH) ? 0 : sH) * 60 + (isNaN(sM) ? 0 : sM);
  const endMins = (isNaN(eH) ? 23 : eH) * 60 + (isNaN(eM) ? 59 : eM);
  
  const endIsNextDay = endMins <= startMins;

  const d = new Date(normDate + "T00:00:00");
  if (endIsNextDay) {
    d.setDate(d.getDate() + 1);
  }
  d.setHours(isNaN(eH) ? 23 : eH, isNaN(eM) ? 59 : eM, 0, 0);
  return d;
};

export function usePartyManager() {
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
  
  const [powerReqs, setPowerReqs] = useState<ContentPowerReq[]>([]);
  const [nexusClasses, setNexusClasses] = useState<NexusClassItem[]>([]);
  
  const ownerAccountMapRef = useRef<Record<string, string>>({});

  const [activeDateFilter, setActiveDateFilter] = useState<string>("전체");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<"전체" | "어비스" | "레이드">("전체");

  const [calendarYearMonth, setCalendarYearMonth] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const [selectedChar, setSelectedChar] = useState("");
  const [selectedContent, setSelectedContent] = useState<ContentItem>(CONTENT_DB[0]);
  const [selectedDiff, setSelectedDiff] = useState(CONTENT_DB[0].defaultDiff);
  const [selectedSubContents, setSelectedSubContents] = useState<string[]>(["abyss_1", "abyss_2", "abyss_3"]);
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
  const [tempSubContents, setTempSubContents] = useState<string[]>(["abyss_1", "abyss_2", "abyss_3"]);

  const defaultCabrak = useMemo(() => {
    return CONTENT_DB.find(c => c.name.includes("카브락")) || CONTENT_DB[0];
  }, []);

  const [busCreateContent, setBusCreateContent] = useState<ContentItem>(defaultCabrak);
  const [busCreateDiff, setBusCreateDiff] = useState(defaultCabrak.defaultDiff || "어려움");
  const [busCreateSubContents, setBusCreateSubContents] = useState<string[]>(["abyss_1", "abyss_2", "abyss_3"]);
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

  // 🛡️ Supabase DB 기반 정격 인원수 산출 유틸
  const getMaxMembersForContent = useCallback((contentName: string, difficulty?: string, defaultSize: number = 4): number => {
    if (powerReqs && powerReqs.length > 0) {
      const match = powerReqs.find(r => 
        (r.content_name === contentName || contentName.includes(r.content_name)) &&
        (!difficulty || r.difficulty === difficulty)
      );
      if (match?.max_members) return match.max_members;
    }
    if (contentName.includes("카브락")) return 8;
    return defaultSize || 4;
  }, [powerReqs]);

  const getCPReqsForContent = useCallback((contentName: string, difficulty: string) => {
    const dbReq = powerReqs.find(r => r.content_name === contentName && r.difficulty === difficulty);
    if (dbReq) {
      return {
        min_cp: dbReq.min_cp,
        rec_cp: dbReq.rec_cp,
        op_cp: dbReq.op_cp,
        rec_mr: dbReq.rec_mr || 0,
        op_mr: dbReq.op_mr || 0,
        min: dbReq.min_cp,
        rec: dbReq.rec_cp,
        op: dbReq.op_cp
      };
    }
    return {
      min_cp: 0,
      rec_cp: 0,
      op_cp: 0,
      rec_mr: 0,
      op_mr: 0,
      min: 0,
      rec: 0,
      op: 0
    };
  }, [powerReqs]);

  const checkTimeouts = useCallback((partyList: Party[], ownerName: string) => {
    if (!ownerName) return;
    const now = new Date();
    const currentOwnerMap = ownerAccountMapRef.current;

    for (const party of partyList) {
      const isMyParty = party.members?.some((m: any) => {
        const memName = m.name || m.character_name;
        const memOwner = currentOwnerMap[memName] || memName;
        return memOwner === ownerName || memName === ownerName;
      }) || party.leader_name === ownerName;

      const endDateTime = getPartyEndDateTime(party.party_date, party.time_start, party.time_end);

      if (isMyParty && party.status === "모집중" && now >= endDateTime) {
        setTimeoutParty(party);
        break;
      }
    }
  }, []);

  const fetchData = useCallback(async (ownerName: string) => {
    try {
      const [charRes, partyRes, powerReqsRes, classesRes] = await Promise.all([
        supabase
          .from("characters")
          .select("*")
          .order("is_main", { ascending: false })
          .order("created_at", { ascending: true }),
        supabase
          .from("parties")
          .select("*")
          .neq("status", "종료됨")
          .order("created_at", { ascending: false }),
        supabase
          .from("content_power_reqs")
          .select("*"),
        supabase
          .from("nexus_classes")
          .select("*")
      ]);

      if (powerReqsRes.data) setPowerReqs(powerReqsRes.data);
      if (classesRes.data) setNexusClasses(classesRes.data);

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
        ownerAccountMapRef.current = ownerMap;

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

  const handleExtendTimeout = async (party: Party, extensionType: "30M" | "1H" | "TOMORROW" | "CANCEL") => {
    try {
      if (extensionType === "CANCEL") {
        await memberMutationOrThrow({ table: "parties", action: "delete", filter: { column: "id", value: party.id } });
        alert("파티 모집이 취소되었습니다.");
      } else if (extensionType === "TOMORROW") {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split("T")[0];
        await memberMutationOrThrow({ table: "parties", action: "update", filter: { column: "id", value: party.id }, payload: { party_date: tomorrowStr } });
        alert(`📅 파티 모집 날짜가 내일(${tomorrowStr})로 연장되었습니다.`);
      } else {
        const addMinutes = extensionType === "30M" ? 30 : 60;
        const [h, m] = (party.time_end || "22:00").split(":").map(Number);
        let endMins = h * 60 + m + addMinutes;
        if (endMins >= 1440) endMins -= 1440;
        const newTimeEnd = minutesToTime(endMins);

        await memberMutationOrThrow({ table: "parties", action: "update", filter: { column: "id", value: party.id }, payload: { time_end: newTimeEnd } });
        alert(`⏰ 희망 종료 시간이 ${newTimeEnd}까지 연장되었습니다.`);
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

  useEffect(() => {
    setMounted(true);
    let ownerName = "한설";
    const savedUser = localStorage.getItem("nexus_user");
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        ownerName = parsed.username || parsed.nickname || parsed.owner || "한설";
        setIsAdmin(["길드마스터", "부마스터", "부마스터 대행"].includes(parsed.role ?? parsed.account_role));
      } catch (e) {
        setIsAdmin(false);
      }
    } else {
      setUser({ username: "한설" });
      setIsAdmin(false);
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
    setTempSubContents(selectedSubContents);
    setShowContentModal(true);
  };

  const applyContentModal = () => {
    setSelectedContent(tempContent);
    setSelectedDiff(tempDiff);
    setSelectedSubContents(tempSubContents);
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

    const targetMaxMembers = getMaxMembersForContent(selectedContent.name, selectedDiff, selectedContent.size);

    const matchingCandidates = activeParties.filter(p => {
      if (p.status !== "모집중") return false;
      
      const pDate = normalizeDateStr(p.party_date || getTodayString());
      if (pDate !== targetDate) return false;
      if (p.content_name !== selectedContent.name) return false;
      if (p.difficulty !== selectedDiff) return false;
      if (p.party_type !== dbPartyType) return false;

      const isBus = p.party_type === "1회 클리어" && p.sub_content?.includes("길드 버스");
      if (isBus) return false;

      const pMaxMembers = p.max_members || targetMaxMembers;
      if (p.members.length >= pMaxMembers) return false;

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
        role: myRoles[0] || getRoleByJob(myJob, nexusClasses),
        roles: myRoles.length > 0 ? myRoles : [getRoleByJob(myJob, nexusClasses)],
        combat_power: myCharObj?.combat_power || 0,
        magic_resistance: myCharObj?.magic_resistance || 0,
        time_start: timeStart,
        time_end: timeEnd,
        start_time: timeStart,
        end_time: timeEnd,
        startTime: timeStart,
        endTime: timeEnd,
        is_completed: false
      };

      const candidateList = [...existingMembers, newMember];
      const pMaxMembers = existingMatchingParty.max_members || targetMaxMembers;
      const balanced = autoBalanceAndBuildParty(candidateList, pMaxMembers);

      const membersWithTime = balanced.members.map((bm: any) => {
        const original = candidateList.find((c: any) => (c.name || c.character_name) === (bm.name || bm.character_name));
        const s = original?.time_start || original?.start_time || original?.startTime || timeStart;
        const e = original?.time_end || original?.end_time || original?.endTime || timeEnd;
        return {
          ...bm,
          time_start: s,
          time_end: e,
          start_time: s,
          end_time: e,
          startTime: s,
          endTime: e,
          is_completed: bm.is_completed || false
        } as any;
      });

      let updatedWanted = [...(existingMatchingParty.wanted_roles || [])];
      if (myRoles.length > 0) {
        myRoles.forEach(r => {
          const idx = updatedWanted.indexOf(r);
          if (idx > -1) updatedWanted.splice(idx, 1);
        });
      }

      let updatePayload: any = {
        members: membersWithTime,
        wanted_roles: updatedWanted
      };

      if (membersWithTime.length === pMaxMembers) {
        const timeRanges = membersWithTime.map((m: any) => ({ start: m.time_start || m.start_time || timeStart, end: m.time_end || m.end_time || timeEnd }));
        const optimalTime = calculateMidpointStartTime(timeRanges);
        updatePayload.final_start_time = optimalTime || membersWithTime[0].time_start;
        updatePayload.status = "매칭 완료";
        updatePayload.leader_name = pickRandomLeader(membersWithTime);
      } else {
        updatePayload.status = "모집중";
      }

      const { error } = await memberMutation({ table: "parties", action: "update", filter: { column: "id", value: existingMatchingParty.id }, payload: updatePayload });
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
    if (selectedContent.category === "어비스" || selectedContent.name.includes("어비스")) {
      defaultMemo = generateAbyssDefaultMemo(selectedSubContents, selectedDiff);
    } else if (partyType === "반복 뺑이") {
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
      role: myRoles[0] || getRoleByJob(myJob, nexusClasses),
      roles: myRoles, 
      combat_power: myCharObj?.combat_power || 0,
      magic_resistance: myCharObj?.magic_resistance || 0,
      time_start: timeStart, 
      time_end: timeEnd,
      start_time: timeStart,
      end_time: timeEnd,
      startTime: timeStart,
      endTime: timeEnd,
      is_completed: false
    };

    const isAbyssCategory = selectedContent.category === "어비스" || selectedContent.name.includes("어비스");
    const subContentsToSave = isAbyssCategory ? selectedSubContents : null;

    const newParty: any = {
      content_name: selectedContent.name,
      sub_content: finalSubContent || null,
      selected_sub_contents: subContentsToSave,
      difficulty: selectedDiff,
      party_type: dbPartyType,
      party_date: targetDate,
      time_start: timeStart,
      time_end: timeEnd,
      max_members: targetMaxMembers,
      matching_mode: matchingMode,
      wanted_roles: matchingMode === "조합우선" ? wantedRoles : [],
      members: [initialMember], 
      status: "모집중",
      leader_name: selectedChar
    };

    const { error } = await memberMutation({ table: "parties", action: "insert", payload: newParty });
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

    const selectedEntries = Object.entries(busCharSelections).filter(([_, config]) => config.selected);

    if (selectedEntries.length === 0) {
      return alert("개설 시 버스 파티에 참여시킬 캐릭터를 최소 1개 이상 선택해주세요!");
    }

    const busMaxMembers = getMaxMembersForContent(busCreateContent.name, busCreateDiff, busCreateContent.size);

    const initialMembers = selectedEntries.map(([charKey, config]) => {
      const charObj = myCharacters.find(c => (c.nickname || c.name || String(c.id)) === charKey) || {};
      const charName = charObj.nickname || charObj.name || charKey;
      const job = charObj.job || "전사";
      const role = getRoleByJob(job, nexusClasses);
      const ownerAcc = user?.id || charObj.owner || user?.username || "한설";

      return {
        character_id: charObj.id,
        name: charName,
        character_name: charName,
        owner_account: ownerAcc,
        job: job,
        class_name: job,
        role: role,
        roles: [role],
        combat_power: charObj.combat_power || 0,
        magic_resistance: charObj.magic_resistance || 0,
        account_id: ownerAcc,
        owner: ownerAcc,
        time_start: busCreateTimeStart,
        time_end: busCreateTimeEnd,
        start_time: busCreateTimeStart,
        end_time: busCreateTimeEnd,
        startTime: busCreateTimeStart,
        endTime: busCreateTimeEnd,
        allow_repeat: config.allowRepeat,
        is_completed: false
      };
    });

    const cpReqs = getCPReqsForContent(busCreateContent.name, busCreateDiff);
    
    const busCandidates: BusCandidate[] = initialMembers.map((m) => ({
      character_id: m.character_id,
      character_name: m.character_name,
      owner_account: m.owner_account,
      job: m.job,
      combat_power: parseCP(m.combat_power),
      allow_repeat: m.allow_repeat,
      is_completed: m.is_completed,
      time_start: m.time_start,
      time_end: m.time_end
    }));

    assembleBalancedParty(
      busCandidates,
      busMaxMembers,
      cpReqs,
      undefined,
      nexusClasses
    );

    const busLeaderName = initialMembers[0]?.name || user?.username || "한설";
    const busMemoFinal = busCreateMemo.trim() || generateDefaultBusMemo(busCreateContent, busCreateDiff, busCreateSubContents);
    const normBusDate = normalizeDateStr(busCreateDate);

    const isAbyssBus = busCreateContent.category === "어비스" || busCreateContent.name.includes("어비스");
    const busSubContents = isAbyssBus ? busCreateSubContents : null;

    const busPartyPayload = {
      content_name: busCreateContent.name,
      sub_content: busMemoFinal,
      selected_sub_contents: busSubContents,
      difficulty: busCreateDiff,
      party_type: "1회 클리어",
      party_date: normBusDate,
      time_start: busCreateTimeStart,
      time_end: busCreateTimeEnd,
      max_members: busMaxMembers,
      matching_mode: "모집우선",
      wanted_roles: ["탱커", "힐러", "근딜", "원딜"],
      members: initialMembers,
      status: "모집중",
      leader_name: busLeaderName
    };

    const { error } = await memberMutation({ table: "parties", action: "insert", payload: busPartyPayload });
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
        const char = myCharacters.find(c => (c.nickname || c.name || String(c.id)) === item.characterId);
        if (!char) throw new Error("선택한 캐릭터 정보를 찾을 수 없습니다.");
        const mappedRole = getRoleByJob(char.job, nexusClasses);
        const ownerAcc = user?.id || char.owner || "한설";

        return {
          character_id: char.id,
          name: char.nickname || char.name,
          character_name: char.nickname || char.name,
          owner_account: ownerAcc,
          job: char.job || "전사",
          class_name: char.job || "전사",
          role: mappedRole,
          roles: [mappedRole],
          combat_power: char.combat_power || 0,
          magic_resistance: char.magic_resistance || 0,
          account_id: ownerAcc,
          owner: ownerAcc,
          allow_repeat: item.allowRepeat,
          is_completed: false,
          time_start: item.timeStart,
          time_end: item.timeEnd,
          start_time: item.timeStart,
          end_time: item.timeEnd,
          startTime: item.timeStart,
          endTime: item.timeEnd
        };
      });

      const existingParty = activeParties.find(
        p => p.content_name === targetBusParty.contentName && p.difficulty === targetBusParty.difficulty && p.sub_content?.includes("길드 버스")
      );

      const targetMaxMembers = getMaxMembersForContent(targetBusParty.contentName, targetBusParty.difficulty, 8);

      if (existingParty) {
        const existingMemberIds = new Set(existingParty.members.map((m: any) => m.character_id || m.id || m.name || m.character_name));
        const filteredNewMembers = newMembers.filter(m => !existingMemberIds.has(m.character_id) && !existingMemberIds.has(m.name));

        if (filteredNewMembers.length === 0) {
          alert("선택하신 캐릭터들은 이미 해당 버스에 탑승해 있습니다!");
          return;
        }

        const combinedMembers = [...existingParty.members, ...filteredNewMembers];
        const cpReqs = getCPReqsForContent(targetBusParty.contentName, targetBusParty.difficulty);

        const combinedCandidates: BusCandidate[] = combinedMembers.map((m: any) => ({
          character_id: m.character_id || m.id,
          character_name: m.character_name || m.name,
          owner_account: m.account_id || m.owner || m.owner_account || m.nickname || m.name || '',
          job: m.job,
          combat_power: parseCP(m.combat_power || m.cp || 0),
          allow_repeat: m.allow_repeat || false,
          is_completed: m.is_completed || false,
          time_start: m.time_start || m.start_time || "18:00",
          time_end: m.time_end || m.end_time || "23:59"
        }));

        assembleBalancedParty(combinedCandidates, existingParty.max_members || targetMaxMembers, cpReqs, undefined, nexusClasses);

        const { error } = await memberMutation({ table: "parties", action: "update", filter: { column: "id", value: existingParty.id }, payload: { members: combinedMembers } });
        if (error) throw error;
      } else {
        const firstItem = selectedData[0];
        const isTargetAbyss = targetBusParty.contentName.includes("어비스");
        const busSubContents = isTargetAbyss ? selectedSubContents : null;

        const { error } = await memberMutation({ table: "parties", action: "insert", payload: {
          content_name: targetBusParty.contentName,
          selected_sub_contents: busSubContents,
          difficulty: targetBusParty.difficulty,
          party_date: normalizeDateStr(selectedDate),
          time_start: firstItem?.timeStart || "20:00",
          time_end: firstItem?.timeEnd || "23:59",
          max_members: targetMaxMembers,
          party_type: "1회 클리어",
          sub_content: `[성역 길드 버스] ${targetBusParty.contentName} (${targetBusParty.difficulty}) 운행`,
          status: "모집중",
          matching_mode: "조합우선",
          members: newMembers,
          leader_name: newMembers[0]?.name || "한설"
        } });
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

  const handleNextRound = async (targetParty: Party, completedMembers: Member[]) => {
    const contentType = targetParty.content_name.includes("어비스") ? "abyss" : "raid";
    await syncKronosChecklist(completedMembers, contentType, targetParty.content_name, targetParty.difficulty, targetParty.id);

    const completedNames = completedMembers.map(m => m.character_name || m.name);
    const completedSet = new Set(completedNames);

    const updatedMembers = targetParty.members.map((m: any) => {
      if (completedSet.has(m.character_name || m.name) || completedMembers.some(cm => (cm as any).character_id === (m.character_id || m.id))) {
        return { ...m, is_completed: true };
      }
      return m;
    });

    try {
      const { error } = await memberMutation({ table: "parties", action: "update", filter: { column: "id", value: targetParty.id }, payload: {
          members: updatedMembers,
          status: "운행중"
        } });

      if (error) throw error;

      alert(`🎯 ${completedMembers.length}명 회차 완수 및 KRONOS 숙제가 성공적으로 자동 완료되었습니다!`);
      const ownerName = user?.username || user?.nickname || user?.owner || "한설";
      fetchData(ownerName);
    } catch (err: any) {
      console.error("다음 회차 전환 오류:", err);
      alert("회차 완수 업데이트 중 오류가 발생했습니다: " + err.message);
    }
  };

  // 🛡️ 과반수 완료 투표 엔진 (4인: 3명 / 8인: 5명)
  const handleCompleteParty = async (party: Party, memberName?: string) => {
    const maxMembers = party.max_members || getMaxMembersForContent(party.content_name, party.difficulty, 4);
    const requiredVotes = maxMembers === 8 ? 5 : 3;

    const targetName = memberName || myCharacterNames[0];
    if (!targetName && !isAdmin) {
      alert("완료 투표를 진행할 캐릭터 정보를 찾을 수 없습니다.");
      return;
    }

    let hasVotedNow = false;
    const updatedMembers = party.members.map((m: any) => {
      if ((m.name || m.character_name) === targetName) {
        const nextState = !(m.is_completed === true);
        hasVotedNow = nextState;
        return { ...m, is_completed: nextState };
      }
      return m;
    });

    const completedCount = updatedMembers.filter((m: any) => m.is_completed === true).length;
    const isMajorityReached = completedCount >= requiredVotes;

    try {
      if (isMajorityReached) {
        // 과반수 동의 달성 시 파티 종료 및 KRONOS 숙제 자동 연동
        const contentType = party.content_name.includes("어비스") ? "abyss" : "raid";
        await syncKronosChecklist(updatedMembers, contentType, party.content_name, party.difficulty, party.id);

        const { error } = await memberMutation({ table: "parties", action: "update", filter: { column: "id", value: party.id }, payload: {
            members: updatedMembers, 
            status: "종료됨" 
          } });

        if (error) throw error;

        alert(
          `🎉 [${party.content_name}] 파티 과반수 완료 승인! (${completedCount}/${requiredVotes}명)\n` +
          `파티가 성공적으로 종료되었으며, 참여 파티원의 KRONOS 숙제가 자동 완료 처리되었습니다!`
        );
      } else {
        // 과반수 미달 시 개인별 투표 상태만 DB 업데이트
        const { error } = await memberMutation({ table: "parties", action: "update", filter: { column: "id", value: party.id }, payload: { members: updatedMembers } });

        if (error) throw error;

        if (hasVotedNow) {
          alert(`🗳️ 완료 투표 완료! (현재 ${completedCount}/${requiredVotes}명 찬성 - ${requiredVotes}명 도달 시 파티 종료)`);
        } else {
          alert(`🗳️ 완료 투표를 취소했습니다. (현재 ${completedCount}/${requiredVotes}명 찬성)`);
        }
      }

      const ownerName = user?.username || user?.nickname || user?.owner || "한설";
      fetchData(ownerName);
    } catch (err: any) {
      alert("완료 투표 처리 중 오류가 발생했습니다: " + err.message);
    }
  };

  const handleDeleteParty = async (id: number | string) => {
    await memberMutationOrThrow({ table: "parties", action: "delete", filter: { column: "id", value: id } });
    const ownerName = user?.username || user?.nickname || user?.owner || "한설";
    fetchData(ownerName);
  };

  const handleLeaveParty = async (party: Party, charName: string) => {
    if (!confirm(`'${charName}' 캐릭터를 이 파티에서 탈퇴 처리하시겠습니까?`)) return;
    try {
      const leavingMember = party.members.find((m: any) => m.name === charName || m.character_name === charName);
      const remainingMembers = party.members.filter((m: any) => m.name !== charName && m.character_name !== charName);

      if (remainingMembers.length === 0) {
        await memberMutationOrThrow({ table: "parties", action: "delete", filter: { column: "id", value: party.id } });
        alert("모든 파티원이 탈퇴하여 파티 모집이 자동 삭제되었습니다.");
      } else {
        let updatedWanted = [...(party.wanted_roles || [])];
        if (leavingMember && leavingMember.roles && leavingMember.roles.length > 0) {
          updatedWanted.push(leavingMember.roles[0]);
        }
        const updatePayload: any = {
          members: remainingMembers,
          wanted_roles: updatedWanted,
          status: party.status === "운행중" ? "운행중" : "모집중",
          final_start_time: null,
          leader_name: remainingMembers[0]?.name || remainingMembers[0]?.character_name || null
        };
        const { error } = await memberMutation({ table: "parties", action: "update", filter: { column: "id", value: party.id }, payload: updatePayload });
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
      const latestMaxMembers = latestParty.max_members || getMaxMembersForContent(latestParty.content_name, latestParty.difficulty, 4);

      if (!latestParty || latestParty.members.length >= latestMaxMembers) {
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
        time_end: joinTimeEnd,
        start_time: joinTimeStart,
        end_time: joinTimeEnd,
        startTime: joinTimeStart,
        endTime: joinTimeEnd,
        is_completed: false
      };

      const candidateList = [...latestParty.members, newMember];
      const balanced = autoBalanceAndBuildParty(candidateList, latestMaxMembers);

      const membersWithTime = balanced.members.map((bm: any) => {
        const original = candidateList.find((c: any) => (c.name || c.character_name) === (bm.name || bm.character_name));
        const s = original?.time_start || original?.start_time || original?.startTime || joinTimeStart;
        const e = original?.time_end || original?.end_time || original?.endTime || joinTimeEnd;
        return {
          ...bm,
          time_start: s,
          time_end: e,
          start_time: s,
          end_time: e,
          startTime: s,
          endTime: e,
          is_completed: bm.is_completed || false
        } as any;
      });

      let updatedWanted = [...(latestParty.wanted_roles || [])];
      if (updatedWanted.indexOf(joinSelectedRole) > -1) updatedWanted.splice(updatedWanted.indexOf(joinSelectedRole), 1);

      let updatePayload: any = { members: membersWithTime, wanted_roles: updatedWanted };
      if (membersWithTime.length === latestMaxMembers) {
        const timeRanges = membersWithTime.map((m: any) => ({ start: m.time_start || m.start_time || joinTimeStart, end: m.time_end || m.end_time || joinTimeEnd }));
        const optimalTime = calculateMidpointStartTime(timeRanges);
        updatePayload.final_start_time = optimalTime || membersWithTime[0].time_start;
        updatePayload.status = "매칭 완료";
        updatePayload.leader_name = pickRandomLeader(membersWithTime);
      } else {
        updatePayload.status = "모집중";
      }

      const { error } = await memberMutation({ table: "parties", action: "update", filter: { column: "id", value: joinPopupParty.id }, payload: updatePayload });
      if (error) throw error;

      alert(updatePayload.status === "매칭 완료" ? `🎉 파티 매칭 완료!` : `[${joinSelectedChar}] 합류 완료!`);
      setJoinPopupParty(null);
      const ownerName = user?.username || user?.nickname || user?.owner || "한설";
      fetchData(ownerName);
    } catch (err) { alert("처리 중 오류 발생"); }
  };

  const openBusCreateModal = useCallback((val: boolean) => {
    setBusCreateContent(defaultCabrak);
    setBusCreateDiff(defaultCabrak.defaultDiff || "어려움");
    setBusCreateSubContents(["abyss_1", "abyss_2", "abyss_3"]);
    setBusCreateMemo(generateDefaultBusMemo(defaultCabrak, defaultCabrak.defaultDiff || "어려움", ["abyss_1", "abyss_2", "abyss_3"]));
    
    const initialSel: Record<string, BusCharSelectionConfig> = {};
    myCharacters.forEach((c, idx) => {
      const key = c.nickname || c.name || String(c.id);
      initialSel[key] = {
        selected: idx === 0,
        allowRepeat: true,
      };
    });
    setBusCharSelections(initialSel);
    setShowBusCreateModal(val);
  }, [defaultCabrak, myCharacters]);

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

      if (selectedCategoryFilter !== "전체") {
        const isAbyss = party.content_name.includes("어비스");
        const category = isAbyss ? "어비스" : "레이드";
        if (category !== selectedCategoryFilter) return false;
      }

      const isCompleted = party.status === "매칭 완료" || party.status === "모집완료";
      const isRecruiting = party.status === "모집중" || party.status === "운행중";

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
      if (aIsCompleted !== bIsCompleted) return bIsCompleted - aIsCompleted;

      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    });
  }, [activeParties, activeDateFilter, selectedCategoryFilter, statusFilter, partySearchTerm]);

  return {
    user,
    mounted,
    showLoreGuide,
    setShowLoreGuide,
    showSynaxisInfoModal,
    setShowSynaxisInfoModal,
    showContentModal,
    setShowContentModal,
    showScheduleModal,
    setShowScheduleModal,
    showFilterCalendarModal,
    setShowFilterCalendarModal,
    isAdmin,
    isMobileFormOpen,
    setIsMobileFormOpen,
    showBusCreateModal,
    setShowBusCreateModal,
    isBusModalOpen,
    setIsBusModalOpen,
    targetBusParty,
    timeoutParty,
    fabPos,
    isDraggingFab,
    myCharacters,
    myCharacterNames,
    allCharactersMap,
    powerReqs,
    nexusClasses,
    activeDateFilter,
    setActiveDateFilter,
    selectedCategoryFilter,
    setSelectedCategoryFilter,
    calendarYearMonth,
    setCalendarYearMonth,
    selectedChar,
    setSelectedChar,
    selectedContent,
    setSelectedContent,
    selectedDiff,
    setSelectedDiff,
    selectedSubContents,
    setSelectedSubContents,
    selectedDate,
    setSelectedDate,
    timeStart,
    setTimeStart,
    timeEnd,
    setTimeEnd,
    partyType,
    setPartyType,
    loopSubMode,
    setLoopSubMode,
    minRuns,
    setMinRuns,
    maxRuns,
    setMaxRuns,
    loopHoursCount,
    setLoopHoursCount,
    loopHoursMin,
    setLoopHoursMin,
    partyMemo,
    setPartyMemo,
    matchingMode,
    setMatchingMode,
    myRoles,
    setMyRoles,
    wantedRoles,
    setWantedRoles,
    partySearchTerm,
    setPartySearchTerm,
    statusFilter,
    setStatusFilter,
    tempContentCategory,
    setTempContentCategory,
    tempContent,
    setTempContent,
    tempDiff,
    setTempDiff,
    tempSubContents,
    setTempSubContents,
    busCreateContent,
    setBusCreateContent,
    busCreateDiff,
    setBusCreateDiff,
    busCreateSubContents,
    setBusCreateSubContents,
    busSelectedSubContents: busCreateSubContents,
    setBusSelectedSubContents: setBusCreateSubContents,
    busCreateDate,
    setBusCreateDate,
    busCreateTimeStart,
    setBusCreateTimeStart,
    busCreateTimeEnd,
    setBusCreateTimeEnd,
    busCreateMemo,
    setBusCreateMemo,
    busCharSelections,
    setBusCharSelections,
    joinPopupParty,
    setJoinPopupParty,
    joinSelectedChar,
    setJoinSelectedChar,
    joinSelectedRole,
    setJoinSelectedRole,
    joinTimeStart,
    setJoinTimeStart,
    joinTimeEnd,
    setJoinTimeEnd,
    inspectCharacter,
    setInspectCharacter,
    fetchData,
    handleExtendTimeout,
    openContentModal,
    applyContentModal,
    handleFabTouchStart,
    handleFabTouchMove,
    handleFabTouchEnd,
    handleFabMouseDown,
    handleFabClick,
    handleReservation,
    handleCreateGuildBus,
    openGuildBusModal,
    handleBusSubmit,
    handleNextRound,
    handleCompleteParty,
    handleDeleteParty,
    handleLeaveParty,
    openJoinPopup,
    executeJoinParty,
    openBusCreateModal,
    datePartyCounts,
    upcomingDates,
    calendarDays,
    filteredParties
  };
}
