export const WEEKLY_RESET_DAY = 1;
export const WEEKLY_RESET_HOUR = 6;

export function getNextWeeklyReset(now = new Date()) {
  const reset = new Date(now);
  reset.setSeconds(0, 0);
  const daysUntilMonday = (WEEKLY_RESET_DAY - now.getDay() + 7) % 7;
  reset.setDate(now.getDate() + daysUntilMonday);
  reset.setHours(WEEKLY_RESET_HOUR, 0, 0, 0);
  if (reset <= now) reset.setDate(reset.getDate() + 7);
  return reset;
}

export function formatWeeklyResetRemaining(now = new Date()) {
  const remainingMinutes = Math.max(0, Math.ceil((getNextWeeklyReset(now).getTime() - now.getTime()) / 60000));
  if (remainingMinutes <= 60) return `${remainingMinutes}분`;
  return `약 ${Math.ceil(remainingMinutes / 60)}시간`;
}

export function getWeeklyReminderKey(now = new Date()) {
  const day = now.getDay();
  if ((day !== 6 && day !== 0) || now.getHours() < 9) return null;
  const reset = getNextWeeklyReset(now);
  return `weekly-reminder-${reset.toISOString().slice(0, 10)}-${day === 6 ? "sat" : "sun"}`;
}
