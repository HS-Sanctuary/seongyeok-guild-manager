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
 * 5. [명세 4번] 자동 파티 밸런싱 & 배치 알고리즘
 * - 1순위: 미클리어 캐릭터 우선 배치
 * - 2순위: 반복 참여(용병) 캐릭터를 전투력 높은 순(압도/권장)으로 배치하여 캐리
 * - 힐러 배치 검사 및 인원 미달 처리 태그 계산
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

  // 1. 미클리어 지원자 vs 용병(반복 참여) 분리
  const uncleared = candidates.filter(c => !c.is_cleared && !c.allow_repeat);
  const mercenaries = candidates.filter(c => c.is_cleared || c.allow_repeat);

  // 전투력 내림차순 정렬
  const sortByPowerDesc = (a: any, b: any) => (b.combat_power || 0) - (a.combat_power || 0);
  uncleared.sort(sortByPowerDesc);
  mercenaries.sort(sortByPowerDesc);

  const selectedMembers: any[] = [];

  // 힐러 우선 탐색을 위해 미클리어/용병 중 힐러 추출
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

  // 1단계: 힐러 최소 1명 우선 배치 시도
  const firstHealer = takeHealerFirst();
  if (firstHealer) {
    selectedMembers.push(firstHealer);
  }

  // 2단계: 1순위 미클리어 캐릭터 채우기
  while (selectedMembers.length < maxMembers && uncleared.length > 0) {
    selectedMembers.push(uncleared.shift());
  }

  // 3단계: 남은 슬롯을 2순위 용병(반복 참여 고전투력 캐릭터)으로 채우기
  while (selectedMembers.length < maxMembers && mercenaries.length > 0) {
    selectedMembers.push(mercenaries.shift());
  }

  // 결과 검증
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