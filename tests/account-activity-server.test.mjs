import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { loadTS } from './load-ts.mjs';

const A = '11111111-1111-4111-8111-111111111111';
const B = '22222222-2222-4222-8222-222222222222';
const now = '2026-10-28T12:00:00.000Z';
function helper(rpc = async () => ({ data: { status: 'recorded', accountId: A, lastActiveAt: now }, error: null })) {
  let calls = 0;
  const api = loadTS('lib/server/accountActivity.ts', {
    'server-only': {},
    '@/lib/server/sanctumSession': {
      hashSessionToken: token => createHash('sha256').update(token).digest('hex'),
      getServerSupabase: () => { calls++; return { rpc }; },
    },
  });
  return { ...api, calls: () => calls };
}
async function enabled(run) {
  const old = process.env.SANCTUM_ACCOUNT_ACTIVITY_ENABLED;
  process.env.SANCTUM_ACCOUNT_ACTIVITY_ENABLED = 'true';
  try { await run(); } finally { if (old === undefined) delete process.env.SANCTUM_ACCOUNT_ACTIVITY_ENABLED; else process.env.SANCTUM_ACCOUNT_ACTIVITY_ENABLED = old; }
}
test('disabled flag and missing token never construct a database client', async () => {
  const h = helper();
  const old = process.env.SANCTUM_ACCOUNT_ACTIVITY_ENABLED;
  try {
    delete process.env.SANCTUM_ACCOUNT_ACTIVITY_ENABLED;
    assert.equal(h.accountActivityEnabled(), false);
    await assert.rejects(h.recordAccountActivity('cookie', A), e => e.status === 503);
    process.env.SANCTUM_ACCOUNT_ACTIVITY_ENABLED = 'TRUE';
    await assert.rejects(h.recordAccountActivity('cookie', A), e => e.status === 503);
    process.env.SANCTUM_ACCOUNT_ACTIVITY_ENABLED = 'true';
    await assert.rejects(h.recordAccountActivity(undefined, A), e => e.status === 401);
    await assert.rejects(h.recordAccountActivity('cookie', 'not-uuid'), e => e.status === 400);
    assert.equal(h.calls(), 0);
  } finally { if (old === undefined) delete process.env.SANCTUM_ACCOUNT_ACTIVITY_ENABLED; else process.env.SANCTUM_ACCOUNT_ACTIVITY_ENABLED = old; }
});
test('one RPC receives a hashed cookie and expected ID, and normalizes only DB time', async () => enabled(async () => {
  let args;
  const h = helper(async (...received) => { args = received; return { data: { status: 'throttled', accountId: A, lastActiveAt: '2026-10-28T21:00:00+09:00' }, error: null }; });
  assert.deepEqual(await h.recordAccountActivity('cookie', A), { status: 'throttled', accountId: A, lastActiveAt: now });
  assert.deepEqual(args, ['sanctum_touch_account_activity', { input_token_hash: createHash('sha256').update('cookie').digest('hex'), input_expected_account_id: A }]);
  assert.equal(h.calls(), 1);
}));
test('unauthorized and cross-account statuses fail closed; RPC failures leak no details', async () => enabled(async () => {
  for (const [status, expected] of [['unauthorized', 401], ['conflict', 409]]) {
    await assert.rejects(helper(async () => ({ data: { status }, error: null })).recordAccountActivity('cookie', A), e => e.status === expected);
  }
  for (const result of [
    { data: null, error: { message: 'private db details' } },
    { data: { status: 'recorded', accountId: B, lastActiveAt: now }, error: null },
    { data: { status: 'recorded', accountId: A, lastActiveAt: 'bad' }, error: null },
    { data: { status: 'recorded', accountId: A, lastActiveAt: '1' }, error: null },
    { data: { status: 'unknown', accountId: A, lastActiveAt: now }, error: null },
  ]) await assert.rejects(helper(async () => result).recordAccountActivity('cookie', A), e => e.status === 503 && !e.message.includes('private'));
}));

function route(record = async () => ({ status: 'recorded', accountId: A, lastActiveAt: now }), flag = true) {
  let calls = 0;
  class ActivityError extends Error { constructor(status, message) { super(message); this.status = status; } }
  const api = loadTS('app/api/account/activity/route.ts', {
    'next/server': { NextResponse: { json: (body, init = {}) => new Response(JSON.stringify(body), { ...init, headers: { 'content-type': 'application/json', ...init.headers } }) } },
    '@/lib/server/sanctumSession': { SANCTUM_SESSION_COOKIE: 'sanctum_session' },
    '@/lib/server/accountActivity': { accountActivityEnabled: () => flag, AccountActivityError: ActivityError, recordAccountActivity: async (...args) => { calls++; return record(...args); } },
  });
  return { ...api, calls: () => calls, ActivityError };
}
function request(body = JSON.stringify({ expectedAccountId: A }), origin = 'https://sanctum.test', token = 'cookie', type = 'application/json') {
  const req = new Request('https://sanctum.test/api/account/activity', { method: 'POST', headers: { ...(origin === null ? {} : { origin }), 'content-type': type }, body });
  req.cookies = { get: name => name === 'sanctum_session' && token ? { value: token } : undefined };
  return req;
}
test('POST forwards only session cookie and strict expected ID, with no-store response', async () => {
  let args;
  const r = route(async (...received) => { args = received; return { status: 'recorded', accountId: A, lastActiveAt: now }; });
  const response = await r.POST(request());
  assert.equal(response.status, 200);
  assert.deepEqual(args, ['cookie', A]);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.deepEqual(Object.keys(r).filter(key => ['GET', 'PUT', 'PATCH', 'DELETE'].includes(key)), []);
});
test('POST rejects absent/foreign origins, extras, bad JSON, oversize and non-JSON without recording', async () => {
  for (const [req, status] of [
    [request(undefined, null), 403], [request(undefined, 'https://foreign.test'), 403],
    [request(JSON.stringify({ expectedAccountId: A, accountId: B })), 400],
    [request(JSON.stringify({ expectedAccountId: A, lastActiveAt: now })), 400],
    [request(JSON.stringify({ expectedAccountId: A, nickname: 'x' })), 400],
    [request('{}'), 400], [request('[]'), 400], [request('null'), 400], [request('{'), 400],
    [request(JSON.stringify({ expectedAccountId: 'invalid' })), 400], [request(' '.repeat(257)), 413],
    [request(undefined, undefined, undefined, 'text/plain'), 415],
  ]) { const r = route(); assert.equal((await r.POST(req)).status, status); assert.equal(r.calls(), 0); }
});
test('disabled API never calls recorder; typed auth errors preserve 401/409', async () => {
  const off = route(undefined, false);
  assert.equal((await off.POST(request())).status, 503); assert.equal(off.calls(), 0);
  for (const status of [401, 409]) {
    const r = route(async () => { throw new r.ActivityError(status, 'safe message'); });
    assert.equal((await r.POST(request())).status, status);
  }
});
test('synthetic atomic RPC contract bounds concurrent device writes to one per 20 minutes (not PostgreSQL execution)', async () => enabled(async () => {
  let stored = null, clock = Date.parse(now), writes = 0;
  const h = helper(async (_name, args) => {
    if (args.input_expected_account_id !== A) return { data: { status: 'conflict' }, error: null };
    const eligible = stored === null || clock - stored >= 1_200_000;
    if (eligible) { stored = clock; writes++; }
    return { data: { status: eligible ? 'recorded' : 'throttled', accountId: A, lastActiveAt: new Date(stored).toISOString() }, error: null };
  });
  const results = await Promise.all(Array.from({ length: 40 }, () => h.recordAccountActivity('cookie', A)));
  assert.equal(results.filter(x => x.status === 'recorded').length, 1); assert.equal(writes, 1);
  await assert.rejects(h.recordAccountActivity('cookie', B), e => e.status === 409); assert.equal(writes, 1);
  clock += 1_199_999; assert.equal((await h.recordAccountActivity('cookie', A)).status, 'throttled');
  clock++; assert.equal((await h.recordAccountActivity('cookie', A)).status, 'recorded'); assert.equal(writes, 2);
}));
test('unapplied SQL proposal confines writes to one aggregate and validates session under locks', () => {
  const sql = readFileSync('supabase/proposals/20261028_account_activity.sql', 'utf8');
  assert.match(sql, /security invoker/i);
  assert.doesNotMatch(sql, /for share of s, a/i, 'joined row marks do not establish account-first ordering against deletion cascade');
  const accountLock=sql.indexOf('for share of a'),sessionLock=sql.indexOf('for share of s');
  assert.ok(accountLock>=0&&sessionLock>accountLock,'lock account before revalidating/locking session');
  assert.match(sql, /s\.account_id = session_account_id/);
  assert.match(sql, /pg_advisory_xact_lock\(hashtextextended\(session_account_id::text, 0\)\)/);
  assert.ok(sql.indexOf('pg_advisory_xact_lock') < sql.indexOf('write_time := clock_timestamp()'));
  assert.match(sql, /a\.status = '승인'/); assert.match(sql, /clock_timestamp\(\)/);
  assert.match(sql, /on conflict \(account_id\) do update/i); assert.match(sql, /interval '20 minutes'/i);
  assert.match(sql, /enable row level security/i); assert.match(sql, /revoke all .*public, anon, authenticated/i);
  assert.match(sql, /revoke all on public\.sanctum_account_activity from public, anon, authenticated, service_role/i, 'reset direct/default service_role table grants before least-privilege grant');
  assert.doesNotMatch(sql, /update\s+public\.(accounts|sanctum_sessions|characters)\s+set/i);
});
