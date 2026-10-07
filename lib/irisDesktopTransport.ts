import type { PendingEdit } from './irisDesktopQueue';
import type { IrisClassDetail, IrisTaskDetail } from './irisKronos';
import type { Category } from './irisKronosWrite';

export type DesktopAccount = { id: string; nickname: string; role: string };
export type DesktopCharacter = { id: string; nickname: string; job: string; alias: string | null };
export type DesktopDetails = {
  accountId: string; characterId: string; observedAt: string;
  writeContext: { periodKeys: Record<Category, string> };
  details: { schemaVersion: 1; tasks: Record<Category, IrisTaskDetail[]>; classes: IrisClassDetail[] };
};
export type DesktopSaveResult = { kind: 'saved'; completed: number } |
  { kind: 'conflict' | 'unauthorized' | 'unknown' | 'rejected' };
export class DesktopTransportError extends Error {
  constructor(public status: number, operation: 'login' | 'request' = 'request') {
    super(operation === 'login' && status === 401 ? '닉네임 또는 접속 코드가 올바르지 않아요. 한/영 상태와 특수문자 순서를 확인해 주세요.' :
      operation === 'login' && status === 403 ? '로그인할 수 있는 승인된 계정인지 확인해 주세요.' :
      status === 401 ? '로그인이 만료됐어요. 다시 로그인해 주세요.' : '앱 연결 상태를 확인해 주세요.');
  }
}
const categories: Category[] = ['daily', 'weekly', 'abyss', 'raid'];
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const text = (v: unknown, max = 120): v is string => typeof v === 'string' && !!v.trim() &&
  Array.from(v).length <= max && !/[\u0000-\u001f\u007f]/u.test(v);
const identity = (v: unknown): v is string => text(v, 100) && !/\s/u.test(v);
const integer = (v: unknown, max = 1000): v is number => Number.isSafeInteger(v) && (v as number) >= 0 && (v as number) <= max;
const timestamp = (v: unknown): v is string => typeof v === 'string' &&
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(v) && Number.isFinite(Date.parse(v)) && new Date(v).toISOString() === v;
function account(v: unknown): DesktopAccount | null {
  if (v === null) return null;
  if (!object(v) || !identity(v.id) || !text(v.nickname)) throw new DesktopTransportError(502);
  if ([v.role, v.status].some(x => x === 'pending' || x === '승인대기')) return null;
  if (!text(v.role)) throw new DesktopTransportError(502);
  return { id: v.id, nickname: v.nickname, role: v.role };
}
function parseDetails(v: unknown, accountId: string, characterId: string): DesktopDetails {
  if (!object(v) || v.accountId !== accountId || v.characterId !== characterId || !timestamp(v.observedAt) ||
    !object(v.writeContext) || !object(v.writeContext.periodKeys) || !object(v.details) ||
    v.details.schemaVersion !== 1 || !object(v.details.tasks) || !Array.isArray(v.details.classes) || v.details.classes.length > 100)
    throw new DesktopTransportError(502);
  const tasks = {} as Record<Category, IrisTaskDetail[]>;
  const periodKeys = {} as Record<Category, string>;
  for (const category of categories) {
    const period = v.writeContext.periodKeys[category], rows = v.details.tasks[category];
    if (!timestamp(period) || !Array.isArray(rows) || rows.length > 200) throw new DesktopTransportError(502);
    periodKeys[category] = period;
    const ids = new Set<string>();
    tasks[category] = rows.map(row => {
      if (!object(row) || !identity(row.id) || !text(row.name) || !integer(row.total) || row.total < 1 ||
        !integer(row.completed) || row.completed > row.total || ids.has(row.id)) throw new DesktopTransportError(502);
      ids.add(row.id);
      return { id: row.id, name: row.name, completed: row.completed, total: row.total };
    });
  }
  const ids = new Set<string>();
  const classes = v.details.classes.map(row => {
    if (!object(row) || !identity(row.id) || !text(row.name) || ids.has(row.id) ||
      (row.level !== null && (!integer(row.level) || row.level < 1))) throw new DesktopTransportError(502);
    ids.add(row.id); return { id: row.id, name: row.name, level: row.level as number | null };
  });
  return { accountId, characterId, observedAt: v.observedAt, writeContext: { periodKeys }, details: { schemaVersion: 1, tasks, classes } };
}

export function createDesktopTransport(options: { fetch: typeof fetch; timeoutMs?: number }) {
  const timeout = options.timeoutMs ?? 15_000;
  if (!Number.isSafeInteger(timeout) || timeout < 1 || timeout > 60_000) throw new Error('Invalid transport timeout');
  async function request(path: string, body?: unknown) {
    const abort = new AbortController(); let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([
        (async () => {
          const response = await options.fetch(path, { method: body === undefined ? 'GET' : 'POST', credentials: 'same-origin',
            cache: 'no-store', redirect: 'error', signal: abort.signal,
            ...(body === undefined ? {} : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }) });
          if (!response.ok) throw new DesktopTransportError(response.status, path === '/api/auth/login' ? 'login' : 'request');
          return await response.json() as unknown;
        })(),
        new Promise<never>((_, reject) => { timer = setTimeout(() => { abort.abort(); reject(new DesktopTransportError(0)); }, timeout); }),
      ]);
    } finally { if (timer !== undefined) clearTimeout(timer); }
  }
  return {
    async login(nickname: string, code: string, keepLoggedIn: boolean): Promise<DesktopAccount> {
      if (!text(nickname,12) || !text(code,128)) throw new DesktopTransportError(400);
      const value = await request('/api/auth/login', {nickname,code,keepLoggedIn});
      const next = object(value) ? account(value.account) : null;
      if (!next) throw new DesktopTransportError(403);
      return next;
    },
    async session(): Promise<DesktopAccount | null> {
      const v = await request('/api/auth/session');
      if (!object(v) || !Object.hasOwn(v, 'account')) throw new DesktopTransportError(502);
      return account(v.account);
    },
    async characters(accountId: string): Promise<DesktopCharacter[]> {
      const v = await request('/api/iris/characters');
      if (!object(v) || v.accountId !== accountId || !Array.isArray(v.characters) || v.characters.length > 100) throw new DesktopTransportError(502);
      const ids = new Set<string>();
      return v.characters.map(row => {
        if (!object(row)) throw new DesktopTransportError(502);
        const id = typeof row.id === 'number' && Number.isSafeInteger(row.id) ? String(row.id) : row.id;
        if (!identity(id) || ids.has(id) || !text(row.nickname) || !text(row.job) ||
          (row.alias != null && row.alias !== '' && !text(row.alias))) throw new DesktopTransportError(502);
        ids.add(id); return { id, nickname: row.nickname, job: row.job, alias: row.alias === '' ? null : row.alias as string | null ?? null };
      });
    },
    async details(accountId: string, characterId: string): Promise<DesktopDetails> {
      if (!identity(accountId) || !identity(characterId)) throw new DesktopTransportError(400);
      return parseDetails(await request('/api/iris/kronos?characterId=' + encodeURIComponent(characterId)), accountId, characterId);
    },
    async save(e: PendingEdit): Promise<DesktopSaveResult> {
      try {
        const v = await request('/api/iris/kronos', { edit: { requestId: e.requestId, generation: 1, selectionVersion: e.revision,
          accountId: e.accountId, characterId: e.characterId, category: e.category, taskId: e.taskId,
          baseCompleted: e.baseCompleted, desiredCompleted: e.desiredCompleted, periodKey: e.periodKey } });
        if (!object(v) || !object(v.result) || v.result.requestId !== e.requestId) return { kind: 'unknown' };
        const result = v.result;
        if (result.status === 'saved' && result.completed === e.desiredCompleted) return { kind: 'saved', completed: e.desiredCompleted };
        if (result.status === 'conflict') return { kind: 'conflict' };
        if (result.status === 'failed') return { kind: 'rejected' };
        return { kind: 'unknown' };
      } catch (error) {
        if (error instanceof DesktopTransportError) {
          if (error.status === 401) return { kind: 'unauthorized' };
          if (error.status === 409) return { kind: 'conflict' };
          if ([400, 403, 413].includes(error.status)) return { kind: 'rejected' };
        }
        return { kind: 'unknown' };
      }
    },
    async switchAccount(id: string): Promise<DesktopAccount> {
      if (!identity(id)) throw new DesktopTransportError(400);
      const v = await request('/api/auth/switch', { accountId: id });
      const next = object(v) ? account(v.account) : null;
      if (!next || next.id !== id) throw new DesktopTransportError(502);
      return next;
    },
    async logout(): Promise<void> { await request('/api/auth/logout', {}); },
  };
}
export type DesktopTransport = ReturnType<typeof createDesktopTransport>;
