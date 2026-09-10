export function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * 파티 날짜 포맷터 (예: 2026-09-11 -> 9/11(금))
 */
export function formatPartyDate(dateStr?: string): string {
  if (!dateStr) return '날짜 미정';
  try {
    const cleanStr = dateStr.includes('T') ? dateStr : `${dateStr}T00:00:00`;
    const d = new Date(cleanStr);
    if (isNaN(d.getTime())) return dateStr;

    const month = d.getMonth() + 1;
    const day = d.getDate();
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    const dayOfWeek = days[d.getDay()];

    return `${month}/${day}(${dayOfWeek})`;
  } catch {
    return dateStr;
  }
}

/**
 * 출발 시간 ~ 종료 시간 표기 유틸
 * - "익일" 텍스트를 "다음 날"로 변경
 * - 00:00 종료는 당일 자정(24:00)으로 간주하여 "다음 날" 미적용
 * - 00:01 이상부터 종료 시점이 시작 시점보다 작은 경우에만 "다음 날" 적용
 */
export function formatPartyTimeRange(timeStart: string, timeEnd: string): { formatted: string; isNextDay: boolean } {
  if (!timeStart || !timeEnd) return { formatted: `${timeStart || "00:00"} ~ ${timeEnd || "00:00"}`, isNextDay: false };

  const startMins = timeToMinutes(timeStart);
  const endMins = timeToMinutes(timeEnd);

  // 00:00은 0분이므로 (endMins === 0), 다음 날이 아님.
  // endMins > 0 이면서 endMins < startMins 인 경우(예: 18:00 ~ 01:00)에만 다음 날로 처리
  const isNextDay = endMins > 0 && endMins < startMins;

  if (isNextDay) {
    return { formatted: `${timeStart} ~ 다음 날 ${timeEnd}`, isNextDay: true };
  }
  return { formatted: `${timeStart} ~ ${timeEnd}`, isNextDay: false };
}

export function isTimeOverlapping(start1: string, end1: string, start2: string, end2: string): boolean {
  if (!start1 || !end1 || !start2 || !end2) return false;
  let s1 = timeToMinutes(start1);
  let e1 = timeToMinutes(end1);
  let s2 = timeToMinutes(start2);
  let e2 = timeToMinutes(end2);

  if (e1 <= s1 && e1 > 0) e1 += 24 * 60; // 다음 날 범위 보정
  if (e2 <= s2 && e2 > 0) e2 += 24 * 60;

  return !(e1 <= s2 || s1 >= e2);
}

export function calculateMidpointStartTime(timeRanges: { start: string; end: string }[]): string | null {
  if (!timeRanges || timeRanges.length === 0) return null;
  let maxStart = Math.max(...timeRanges.map(r => timeToMinutes(r.start)));
  let minEnd = Math.min(...timeRanges.map(r => {
    let e = timeToMinutes(r.end);
    let s = timeToMinutes(r.start);
    return e <= s && e > 0 ? e + 24 * 60 : e;
  }));

  if (maxStart >= minEnd) return timeRanges[0].start;
  const midMinutes = Math.floor((maxStart + minEnd) / 2);
  const roundedMid = Math.round(midMinutes / 15) * 15;
  return minutesToTime(roundedMid);
}

export function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function normalizeDateStr(dateStr: string): string {
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

export function getDayOfWeekKorean(dateStr: string): string {
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

export function getMabinogiWeekRange(dateStr: string) {
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