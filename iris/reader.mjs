import { execFile } from 'node:child_process';

const DEFAULT_CLI = 'C:\\Nexon\\MabinogiMobile\\MabinogiMobile_CLI.exe';
const READ_COMMANDS = new Set(['get_my_info', 'get_altering_works', 'get_daily_missions', 'get_weekly_missions', 'get_currencies']);

export function readCommand(command, { cliPath = process.env.MABINOGI_CLI_PATH || DEFAULT_CLI, execute = execFile } = {}) {
  if (!READ_COMMANDS.has(command)) throw new Error('읽기 명령만 허용됩니다.');
  return new Promise((resolve, reject) => {
    execute(cliPath, [command], { windowsHide: true, timeout: 8_000, maxBuffer: 2_000_000, encoding: 'utf8' }, (error, stdout) => {
      let data;
      try { data = JSON.parse(stdout); } catch { return reject(new Error(error ? '게임 CLI 연결 실패' : '게임 응답 형식 오류')); }
      if (data?.pipe === 'disconnected') return reject(new Error(data.reason === 'game_off' ? '게임 CLI 연결 대기 (game_off 응답). 게임 실행·설정 상태와는 별도로 확인 중입니다.' : '게임 CLI 연결이 끊어졌습니다.'));
      if (error) return reject(new Error('게임 CLI 읽기 실패'));
      resolve(data);
    });
  });
}

function number(value) {
  const parsed = Number(value && typeof value === 'object' ? value.Value : value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function missionSummary(missions) {
  if (!Array.isArray(missions)) return { available: false, total: 0, completed: 0, received: 0 };
  return {
    available: true,
    total: missions.length,
    completed: missions.filter((mission) => mission?.IsCompleted === true).length,
    received: missions.filter((mission) => mission?.IsRewardReceived === true).length,
  };
}

function currencyAmount(currencies, displayName) {
  if (!Array.isArray(currencies)) return null;
  const item = currencies.find((currency) => currency?.DisplayName === displayName);
  return item ? number(item.Amount) : null;
}

function weeklyActivityProgress(weekly) {
  if (!Array.isArray(weekly)) return [];
  const categories = [
    { key: 'abyss', label: '어비스', pattern: /어비스/ },
    { key: 'raid', label: '레이드', pattern: /레이드/ },
    { key: 'fieldBoss', label: '필드보스', pattern: /필드\s*보스/ },
  ];
  return categories.map(({ key, label, pattern }) => ({
    key,
    label,
    // 특정 콘텐츠 클리어 기록이 아니라 주간 숙제 횟수만 표현한다.
    goals: weekly.filter((mission) => pattern.test(String(mission?.Description || ''))).map((mission) => ({
      current: number(mission?.CurrentCount),
      goal: number(mission?.GoalCount),
      completed: mission?.IsCompleted === true,
    })),
  }));
}

export function normalizeSnapshot(info, altering, daily, weekly, currencies) {
  const works = Array.isArray(altering?.works) ? altering.works : [];
  const facilities = [...new Set(works.map((work) => work?.FacilityName).filter((name) => typeof name === 'string'))];
  return {
    observedAt: new Date().toISOString(),
    character: {
      // 이름·계정 식별자는 검증 전에는 브라우저로도 보내지 않는다.
      job: String(info?.EnabledCombatJobDisplayName || info?.CombatJobDisplayName || '확인 중').slice(0, 60),
      level: number(info?.Level),
      combatScore: number(info?.CombatScore),
      livingScore: number(info?.LivingScore),
      attractivenessScore: number(info?.AttractivenessScore),
      arcaneResistance: number(info?.ArcaneResistance),
      decorScore: number(info?.DecorScore),
    },
    processing: {
      available: Array.isArray(altering?.works),
      facilityCount: facilities.length,
      total: works.length,
      completed: number(altering?.completedCount) ?? works.filter((work) => work?.IsCompleted === true).length,
      facilities: facilities.map((name) => ({
        name: name.slice(0, 60),
        active: works.filter((work) => work?.FacilityName === name && work?.State === 'InProgress').length,
        completed: works.filter((work) => work?.FacilityName === name && work?.IsCompleted === true).length,
      })),
    },
    missions: { daily: missionSummary(daily), weekly: missionSummary(weekly), weeklyActivityProgress: weeklyActivityProgress(weekly) },
    currencies: {
      available: Array.isArray(currencies),
      silverCoins: currencyAmount(currencies, '은동전'),
      demonTributes: currencyAmount(currencies, '마족 공물'),
    },
  };
}

export async function readSnapshot(options) {
  const info = await readCommand('get_my_info', options);
  async function optional(command) {
    try { return await readCommand(command, options); } catch { return null; }
  }
  const altering = await optional('get_altering_works');
  const daily = await optional('get_daily_missions');
  const weekly = await optional('get_weekly_missions');
  const currencies = await optional('get_currencies');
  return normalizeSnapshot(info, altering, daily, weekly, currencies);
}
