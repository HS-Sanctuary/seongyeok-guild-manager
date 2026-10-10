import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { NextRequest } from 'next/server.js';
import { loadTS } from './load-ts.mjs';

const ACCOUNT = '11111111-1111-4111-8111-111111111111';
const OTHER = '22222222-2222-4222-8222-222222222222';
const ORIGIN = 'http://localhost:3000';
const URL = `${ORIGIN}/api/kronos/barter-favorites`;
const approved = { id: ACCOUNT, nickname: '영겁', role: '길드원', status: '승인' };
const row = (tradeId, favorite, accountId = ACCOUNT) => ({
  account_id: accountId, trade_id: tradeId, favorited: favorite, updated_at: '2026-10-09T00:00:00.000Z',
});

// Replace only the external DB boundary: unique keys and conflict modes act like Postgres.
function favoritesDB(rows = [], catalog = [1, 2, 3]) {
  const tables = { kronos_barter_favorites: structuredClone(rows), nexus_trades: catalog.map(id => ({ id })) };
  const writes = [];
  const db = { tables, writes, failure: null, maximumRows: 1000, from(table) {
    assert.ok(table in tables, `Unexpected table ${table}`);
    const filters = [];
    let payload, options, ordering, countExact = false, maximum = Infinity;
    const query = {
      select(_columns, settings) { countExact = settings?.count === 'exact'; return query; },
      eq(key, value) { filters.push(valueRow => valueRow[key] === value); return query; },
      gt(key, value) { filters.push(valueRow => valueRow[key] > value); return query; },
      in(key, values) { filters.push(valueRow => values.includes(valueRow[key])); return query; },
      order(key) { ordering = key; return query; },
      limit(value) { maximum = value; return query; },
      upsert(value, settings) { payload = value; options = settings; return query; },
      then(resolve, reject) {
        const operation = payload ? 'write' : 'read';
        if (db.failure === `${table}:${operation}`) return Promise.resolve({ data: null, error: { message: 'secret database detail' } }).then(resolve, reject);
        if (payload) {
          assert.equal(table, 'kronos_barter_favorites');
          assert.equal(options.onConflict, 'account_id,trade_id');
          const entries = Array.isArray(payload) ? payload : [payload];
          for (const entry of entries) {
            assert.ok(tables.nexus_trades.some(trade => trade.id === entry.trade_id), 'Foreign key trade exists');
            const existing = tables[table].find(saved => saved.account_id === entry.account_id && saved.trade_id === entry.trade_id);
            if (existing && options.ignoreDuplicates) continue;
            if (existing) Object.assign(existing, structuredClone(entry));
            else tables[table].push(structuredClone(entry));
          }
          writes.push({ table, payload: structuredClone(payload), options: { ...options } });
        }
        let selected = tables[table].filter(valueRow => filters.every(filter => filter(valueRow)));
        if (ordering) selected = selected.toSorted((a, b) => a[ordering] - b[ordering]);
        return Promise.resolve({ data: structuredClone(selected.slice(0, Math.min(maximum, db.maximumRows))), count: countExact ? selected.length : null, error: null }).then(resolve, reject);
      },
    };
    return query;
  } };
  return db;
}

function setup({ account = approved, rows = [], catalog, token = 'valid' } = {}) {
  assert.ok(existsSync('app/api/kronos/barter-favorites/route.ts'), 'Missing account favorites endpoint');
  const db = favoritesDB(rows, catalog);
  const route = loadTS('app/api/kronos/barter-favorites/route.ts', {
    '@/lib/server/sanctumSession': {
      getSessionAccount: async value => value === 'valid' ? account : null,
      isPendingAccount: value => ['승인대기', 'pending'].includes(value.role) || ['승인대기', 'pending'].includes(value.status),
      getServerSupabase: () => db,
      SANCTUM_SESSION_COOKIE: 'session',
    },
  });
  const get = (query = `accountId=${ACCOUNT}`) => route.GET(new NextRequest(`${URL}?${query}`, { headers: { cookie: `session=${token}` } }));
  const rawPost = (body, headers = {}) => route.POST(new NextRequest(URL, {
    method: 'POST', headers: { cookie: `session=${token}`, origin: ORIGIN, 'content-type': 'application/json', ...headers }, body,
  }));
  return { db, get, rawPost, post: (body, headers) => rawPost(JSON.stringify(body), headers) };
}

test('GET returns only the current account true favorites in numeric order', async () => {
  const s = setup({ rows: [row(3, true), row(2, false), row(1, true), row(2, true, OTHER)] });
  const response = await s.get();
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { accountId: ACCOUNT, favorites: [1, 3] });
  assert.match(response.headers.get('cache-control'), /no-store/);
  assert.equal(s.db.writes.length, 0);
});

test('GET rejects absent expired and pending sessions before reading favorites', async () => {
  for (const options of [{ account: null }, { token: 'expired' }, { account: { ...approved, status: '승인대기' } }, { account: { ...approved, role: 'pending' } }]) {
    const s = setup(options), response = await s.get();
    assert.equal(response.status, 401);
    assert.match(response.headers.get('cache-control'), /no-store/);
    assert.equal(s.db.writes.length, 0);
  }
});

test('GET rejects other account missing malformed and duplicate account IDs', async () => {
  for (const [query, status] of [[`accountId=${OTHER}`, 403], ['', 400], ['accountId=not-an-id', 400], [`accountId=${ACCOUNT}&accountId=${ACCOUNT}`, 400]]) {
    const s = setup(), response = await s.get(query);
    assert.equal(response.status, status);
    assert.equal(s.db.writes.length, 0);
  }
});

test('POST writes the desired boolean idempotently and retains false tombstones', async () => {
  const s = setup({ rows: [row(2, true, OTHER)] });
  for (const favorite of [true, true, false, false]) {
    const response = await s.post({ accountId: ACCOUNT, tradeId: 1, favorite });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { accountId: ACCOUNT, favorites: favorite ? [1] : [] });
    assert.match(response.headers.get('cache-control'), /no-store/);
  }
  const current = s.db.tables.kronos_barter_favorites.filter(saved => saved.account_id === ACCOUNT);
  assert.equal(current.length, 1);
  assert.equal(current[0].favorited, false);
  assert.ok(Number.isFinite(Date.parse(current[0].updated_at)));
  assert.equal(s.db.tables.kronos_barter_favorites.find(saved => saved.account_id === OTHER).favorited, true);
});

test('legacy import preserves explicit false and true rows and filters deleted catalog IDs', async () => {
  const s = setup({ rows: [row(1, false), row(3, true), row(2, false, OTHER)] });
  const originalTime = s.db.tables.kronos_barter_favorites[0].updated_at;
  for (let attempt = 0; attempt < 2; attempt++) {
    const response = await s.post({ accountId: ACCOUNT, importIds: [1, 2, 2, 3, 999] });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { accountId: ACCOUNT, favorites: [2, 3] });
  }
  const current = s.db.tables.kronos_barter_favorites.filter(saved => saved.account_id === ACCOUNT);
  assert.equal(current.length, 3);
  assert.equal(current.find(saved => saved.trade_id === 1).favorited, false);
  assert.equal(current.find(saved => saved.trade_id === 1).updated_at, originalTime);
  assert.equal(s.db.tables.kronos_barter_favorites.find(saved => saved.account_id === OTHER).favorited, false);
  assert.equal(s.db.writes.length, 2);
});

test('empty legacy import reads the account snapshot without a write', async () => {
  const s = setup({ rows: [row(3, true)] }), response = await s.post({ accountId: ACCOUNT, importIds: [] });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { accountId: ACCOUNT, favorites: [3] });
  assert.equal(s.db.writes.length, 0);
});

test('POST rejects unauthenticated pending and stale account requests without changes', async () => {
  for (const [options, accountId, status] of [[{ account: null }, ACCOUNT, 401], [{ account: { ...approved, status: 'pending' } }, ACCOUNT, 401], [{}, OTHER, 403]]) {
    const s = setup(options), response = await s.post({ accountId, tradeId: 1, favorite: true });
    assert.equal(response.status, status);
    assert.deepEqual(s.db.tables.kronos_barter_favorites, []);
  }
});

test('POST requires the exact same origin and JSON content type', async () => {
  for (const headers of [{ origin: '' }, { origin: 'https://evil.test' }, { origin: `${ORIGIN}/` }, { 'content-type': 'text/plain' }, { 'content-type': 'application/jsonp' }]) {
    const s = setup(), response = await s.post({ accountId: ACCOUNT, tradeId: 1, favorite: true }, headers);
    assert.equal(response.status, headers.origin !== undefined ? 403 : 400);
    assert.deepEqual(s.db.tables.kronos_barter_favorites, []);
  }
});

test('POST accepts JSON charset but rejects malformed and oversized bodies', async () => {
  const s = setup();
  assert.equal((await s.post({ accountId: ACCOUNT, tradeId: 1, favorite: true }, { 'content-type': 'application/json; charset=utf-8' })).status, 200);
  assert.equal((await s.rawPost('{broken')).status, 400);
  assert.equal((await s.rawPost(JSON.stringify({ accountId: ACCOUNT, padding: '가'.repeat(6000) }))).status, 413);
  assert.equal(s.db.tables.kronos_barter_favorites.length, 1);
});

test('POST rejects forged extra fields and malformed exact state or import payloads', async () => {
  const bodies = [null, [], {}, { accountId: ACCOUNT, tradeId: 1 }, { accountId: ACCOUNT, tradeId: 1, favorite: 'true' },
    { accountId: ACCOUNT, tradeId: 0, favorite: true }, { accountId: ACCOUNT, tradeId: 1.5, favorite: true },
    { accountId: ACCOUNT, tradeId: Number.MAX_SAFE_INTEGER + 1, favorite: true }, { accountId: ACCOUNT, tradeId: '1', favorite: true },
    { accountId: ACCOUNT, tradeId: 1, favorite: true, owner: OTHER }, { accountId: ACCOUNT, tradeId: 1, favorite: true, importIds: [] },
    { accountId: ACCOUNT, importIds: '1' }, { accountId: ACCOUNT, importIds: [1, '2'] }, { accountId: ACCOUNT, importIds: [0] },
    { accountId: ACCOUNT, importIds: [1], extra: true }, { accountId: 'bad', importIds: [] }];
  for (const body of bodies) {
    const s = setup(), response = await s.post(body);
    assert.equal(response.status, 400, JSON.stringify(body));
    assert.deepEqual(s.db.tables.kronos_barter_favorites, []);
  }
});

test('legacy import accepts 500 IDs but rejects 501 before deduplication', async () => {
  const s = setup();
  assert.equal((await s.post({ accountId: ACCOUNT, importIds: Array(500).fill(1) })).status, 200);
  assert.equal((await s.post({ accountId: ACCOUNT, importIds: Array(501).fill(2) })).status, 400);
  assert.deepEqual(s.db.tables.kronos_barter_favorites.map(saved => saved.trade_id), [1]);
});

test('exact star mutation refuses a nonexistent catalog item', async () => {
  const s = setup(), response = await s.post({ accountId: ACCOUNT, tradeId: 999, favorite: true });
  assert.equal(response.status, 400);
  assert.deepEqual(s.db.tables.kronos_barter_favorites, []);
});

test('GET returns the complete favorites beyond the default database page', async () => {
  const rows = Array.from({ length: 1002 }, (_, index) => row(index + 1, true));
  const s = setup({ rows }), response = await s.get();
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.favorites.length, 1002);
  assert.deepEqual(body.favorites.slice(998), [999, 1000, 1001, 1002]);
});

test('GET remains complete when the database project limits each response below 1000 rows', async () => {
  const s = setup({ rows: [row(1, true), row(2, true), row(3, true)] });
  s.db.maximumRows = 2;
  const response = await s.get();
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { accountId: ACCOUNT, favorites: [1, 2, 3] });
});

test('legacy import validates every catalog ID even under a smaller database row cap', async () => {
  const s = setup(); s.db.maximumRows = 2;
  const response = await s.post({ accountId: ACCOUNT, importIds: [1, 2, 3] });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { accountId: ACCOUNT, favorites: [1, 2, 3] });
  assert.equal(s.db.writes.length, 1);
});

test('database read and write failures return safe retryable errors', async () => {
  for (const failure of ['kronos_barter_favorites:read', 'kronos_barter_favorites:write', 'nexus_trades:read']) {
    const s = setup(); s.db.failure = failure;
    const response = failure === 'kronos_barter_favorites:read' ? await s.get() : await s.post({ accountId: ACCOUNT, tradeId: 1, favorite: true });
    assert.equal(response.status, 503);
    const body = await response.json();
    assert.ok(typeof body.message === 'string' && body.message.length > 0);
    assert.ok(!JSON.stringify(body).includes('secret database detail'));
    assert.match(response.headers.get('cache-control'), /no-store/);
  }
});
