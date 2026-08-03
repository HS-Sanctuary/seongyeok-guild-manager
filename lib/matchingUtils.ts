// lib/matchingUtils.ts

/**
 * 시간 문자열("HH:MM")을 분(minutes)으로 변환
 */
export const timeToMinutes = (timeStr: string): number => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
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
 * 입력예시: [{start: "18:00", end: "20:00"}, {start: "19:00", end: "21:00"}]
 */
export const calculateOptimalStartTime = (timeRanges: {start: string, end: string}[]): string | null => {
  if (timeRanges.length === 0) return null;

  let maxStart = 0;
  let minEnd = 24 * 60; // 1440분 (24:00)

  // 모든 멤버의 겹치는 최대 시작시간과 최소 종료시간을 구함
  timeRanges.forEach(range => {
    const startMin = timeToMinutes(range.start);
    const endMin = timeToMinutes(range.end);
    if (startMin > maxStart) maxStart = startMin;
    if (endMin < minEnd) minEnd = endMin;
  });

  // 교집합이 아예 없는 경우 (누군가 너무 동떨어진 시간을 냄)
  if (maxStart > minEnd) return null; 

  // 교집합의 정중앙 시간 구하기
  const midPoint = (maxStart + minEnd) / 2;

  // 15분 단위로 가장 가까운 시간에 스냅 (반올림)
  const roundedMidPoint = Math.round(midPoint / 15) * 15;

  return minutesToTime(roundedMidPoint);
};

/**
 * 2. 스케줄 겹침 방지 (Buffer Engine)
 * 한 캐릭터가 이미 예약된 파티 시간과 새로 참여할 파티 시간이 겹치는지 검사
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

    // 하나라도 시간이 겹치면 true 반환 (충돌 발생!)
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
  return members[randomIndex].name;
};