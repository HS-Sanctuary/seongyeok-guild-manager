// lib/matchingUtils.ts

/**
 * 시간 문자열("HH:MM")을 분(minutes)으로 변환
 */
export const timeToMinutes = (timeStr: string): number => {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
};

/**
 * 분(minutes)을 다시 시간 문자열("HH:MM")로 변환
 */
export const minutesToTime = (minutes: number): string => {
  const h = Math.floor(minutes / 60).toString().padStart(2, '0');
  const m = (minutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
};

/**
 * 1. 스마트 타임슬롯 자동 계산기 (교집합의 중앙값을 15분 단위로 산출)
 */
export const calculateOptimalStartTime = (timeRanges: {start: string, end: string}[]): string | null => {
  if (timeRanges.length === 0) return null;

  let maxStart = 0;
  let minEnd = 24 * 60; // 1440분 (24:00)

  timeRanges.forEach(range => {
    const startMin = timeToMinutes(range.start);
    const endMin = timeToMinutes(range.end);
    if (startMin > maxStart) maxStart = startMin;
    if (endMin < minEnd) minEnd = endMin;
  });

  if (maxStart > minEnd) return null; 

  const midPoint = (maxStart + minEnd) / 2;
  const roundedMidPoint = Math.round(midPoint / 15) * 15;

  return minutesToTime(roundedMidPoint);
};

/**
 * 2. 스케줄 겹침 방지 (Buffer Engine)
 */
export const isScheduleConflict = (
  newStartTime: string, 
  newDurationMin: number, 
  existingSchedules: {start: string, duration: number}[]
): boolean => {
  const newStart = timeToMinutes(newStartTime);
  const newEnd = newStart + newDurationMin;

  for (const schedule of existingSchedules) {
    const existStart = timeToMinutes(schedule.start);
    const existEnd = existStart + schedule.duration;

    if (newStart < existEnd && newEnd > existStart) {
      return true; 
    }
  }
  
  return false;
};

/**
 * 3. 파티장 랜덤 지정 함수
 */
export const pickRandomLeader = (members: any[]): string => {
  if (!members || members.length === 0) return "";
  const randomIndex = Math.floor(Math.random() * members.length);
  return members[randomIndex].name || members[randomIndex].character_name || "";
};

/**
 * 4. 힐러 직군 판별 함수 (힐러, 수도사, 사제 / role === '힐러')
 */
export const isHealerMember = (member: any): boolean => {
  if (!member) return false;
  const role = member.role || (member.roles && member.roles[0]);
  const job = member.job || member.class_name;
  
  if (role === "힐러") return true;
  if (["힐러", "수도사", "사제"].includes(job)) return true;
  return false;
};

/**
 * 5. 던전 이름 정제 함수 (어비스/레이드 접두사 제거)
 */
export const cleanItemName = (name: string): string => {
  if (!name) return "";
  return name.replace(/^어비스\s*-\s*/, "").replace(/^레이드\s*-\s*/, "").trim();
};

/**
 * 6. 길드 버스 및 크로노스 컨텐츠/숙제 체크 상태 공통 매칭 함수
 */
export const isTaskChecked = (checks: any[], item: any, nexusContents: any[] = []): boolean => {
  if (!Array.isArray(checks) || !item) return false;

  let rawChecks = checks;
  if (typeof checks === 'string') {
    try { rawChecks = JSON.parse(checks); } catch (e) { rawChecks = []; }
  }

  // 1. item이 정적 키 목록(keys)을 가진 경우
  if (item.keys && Array.isArray(item.keys)) {
    const checkedNames = new Set<string>();
    for (const check of rawChecks) {
      const checkStr = String(check).trim();
      for (const nc of nexusContents) {
        if (String(nc.id).trim() === checkStr) {
          if (nc.name) checkedNames.add(String(nc.name).trim());
          if (nc.mobile_name) checkedNames.add(String(nc.mobile_name).trim());
        }
      }
      if (!/^\d+$/.test(checkStr)) checkedNames.add(checkStr);
    }

    for (const k of item.keys) {
      const kClean = k.trim().toLowerCase();
      for (const name of Array.from(checkedNames)) {
        const nameClean = name.toLowerCase();
        if (kClean === nameClean || kClean.includes(nameClean) || nameClean.includes(kClean)) return true;
      }
    }
    return false;
  }

  // 2. item이 데이터베이스 콘텐츠 객체인 경우
  const itemIdStr = String(item.id || "").trim();
  const rawItemName = (item.name || "").toLowerCase().trim();
  const cleanName = cleanItemName(item.name || "").toLowerCase();

  return rawChecks.some((checkVal) => {
    if (checkVal === null || checkVal === undefined) return false;

    let checkStr = "";
    if (typeof checkVal === "object") {
      checkStr = String(checkVal.id || checkVal.name || "").trim();
    } else {
      checkStr = String(checkVal).trim();
    }

    const lowerVal = checkStr.toLowerCase();

    if (itemIdStr && checkStr === itemIdStr) return true;
    if (lowerVal === cleanName || lowerVal === rawItemName) return true;

    for (const nc of nexusContents) {
      if (String(nc.id).trim() === checkStr) {
        const ncName = (nc.name || "").toLowerCase().trim();
        const ncMobile = (nc.mobile_name || "").toLowerCase().trim();
        if (ncName === rawItemName || ncMobile === rawItemName || cleanName.includes(ncName)) return true;
      }
    }

    if (cleanName.includes("카브락") || cleanName.includes("카브")) {
      if (lowerVal.includes("cabrak") || lowerVal.includes("카브") || lowerVal.includes("raid1")) return true;
    }
    if (cleanName.includes("에이렐") || cleanName.includes("에렐")) {
      if (lowerVal.includes("eirel") || lowerVal.includes("에이렐") || lowerVal.includes("raid3")) return true;
    }
    if (cleanName.includes("화석") || cleanName.includes("서큐") || cleanName.includes("서큐버스")) {
      if (lowerVal.includes("succubus") || lowerVal.includes("서큐") || lowerVal.includes("화석")) return true;
    }
    if (cleanName.includes("허상")) {
      if (lowerVal.includes("abyss_1") || lowerVal.includes("illusion") || lowerVal.includes("허상")) return true;
    }
    if (cleanName.includes("동굴")) {
      if (lowerVal.includes("abyss_2") || lowerVal.includes("cave") || lowerVal.includes("동굴")) return true;
    }
    if (cleanName.includes("물길")) {
      if (lowerVal.includes("abyss_3") || lowerVal.includes("waterway") || lowerVal.includes("물길")) return true;
    }

    return false;
  });
};

/**
 * 7. 자동 파티 밸런싱 & 배치 알고리즘
 */
export interface AutoBalanceResult {
  members: any[];
  hasHealer: boolean;
  isIncomplete: boolean;
  tags: string[];
}

export const autoBalanceAndBuildParty = (
  candidates: any[],
  maxMembers: number = 4,
  reqPower: { min: number; rec: number; over: number } = { min: 0, rec: 0, over: 0 }
): AutoBalanceResult => {
  if (!candidates || candidates.length === 0) {
    return { members: [], hasHealer: false, isIncomplete: true, tags: ["⚠️ 인게임 구인 필요 (0/0명)"] };
  }

  const uncleared = candidates.filter(c => !c.is_cleared && !c.allow_repeat);
  const mercenaries = candidates.filter(c => c.is_cleared || c.allow_repeat);

  const sortByPowerDesc = (a: any, b: any) => (b.combat_power || 0) - (a.combat_power || 0);
  uncleared.sort(sortByPowerDesc);
  mercenaries.sort(sortByPowerDesc);

  const selectedMembers: any[] = [];

  const takeHealerFirst = () => {
    const unclearedHealerIdx = uncleared.findIndex(isHealerMember);
    if (unclearedHealerIdx > -1) {
      return uncleared.splice(unclearedHealerIdx, 1)[0];
    }
    const mercHealerIdx = mercenaries.findIndex(isHealerMember);
    if (mercHealerIdx > -1) {
      return mercenaries.splice(mercHealerIdx, 1)[0];
    }
    return null;
  };

  const firstHealer = takeHealerFirst();
  if (firstHealer) {
    selectedMembers.push(firstHealer);
  }

  while (selectedMembers.length < maxMembers && uncleared.length > 0) {
    selectedMembers.push(uncleared.shift());
  }

  while (selectedMembers.length < maxMembers && mercenaries.length > 0) {
    selectedMembers.push(mercenaries.shift());
  }

  const hasHealer = selectedMembers.some(isHealerMember);
  const isIncomplete = selectedMembers.length < maxMembers;

  const tags: string[] = [];
  if (!hasHealer) {
    tags.push("⚠️ 힐러 미포함 파티");
  }
  if (isIncomplete) {
    tags.push(`📢 인게임 구인 필요 (${selectedMembers.length}/${maxMembers}명)`);
  }

  return {
    members: selectedMembers,
    hasHealer,
    isIncomplete,
    tags
  };
};