// Run with @electric-sql/pglite available through NODE_PATH. Never connects to Supabase.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { PGlite } = require("@electric-sql/pglite");
const ts = require("typescript");

(async () => {
  const db = new PGlite();
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    create table public.accounts(id uuid primary key, nickname text unique);
    create table public.characters(nickname text primary key, owner text);
    insert into accounts values ('00000000-0000-0000-0000-000000000001','QA-owner'),('00000000-0000-0000-0000-000000000002','QA-other');
    insert into characters values ('QA-one','QA-owner'),('QA-two','QA-owner'),('QA-stranger','QA-other');`);
  const sql = fs.readFileSync(
    path.join(
      __dirname,
      "../supabase/migrations/20260924_kronos_workspace.sql",
    ),
    "utf8",
  );
  await db.exec(sql);
  await db.exec(sql); // Reapplying must not damage existing objects.
  await db.exec(`insert into kronos_missions(town,title,max_count,rewards) values ('티르코네일','QA mission',3,'[{"name":"QA reward","count":2}]');
    insert into kronos_shop_items(map,npc,reward,"limit",scope) values ('티르코네일','QA NPC','QA item',2,'계정당'),('던바튼','QA NPC','QA item',2,'캐릭당');`);
  const owner = "00000000-0000-0000-0000-000000000001";
  const change = async (character, kind, id, delta, bookmark = null) =>
    (
      await db.query(
        "select * from sanctum_kronos_progress($1,$2,$3,$4,$5,$6)",
        [owner, character, kind, id, delta, bookmark],
      )
    ).rows[0];
  assert.equal((await change("QA-one", "mission", 1, 1, true)).count, 1);
  assert.equal(
    (await change("QA-two", "mission", 1, 0)).count,
    0,
    "missions stay per character",
  );
  await change("QA-one", "mission", 1, 1);
  await change("QA-one", "mission", 1, 1);
  assert.equal(
    (await change("QA-one", "mission", 1, 1)).count,
    3,
    "upper bound",
  );
  await db.exec(
    "update kronos_progress set period_start=period_start-interval '7 days' where kind='mission'",
  );
  const reset = await change("QA-one", "mission", 1, 1);
  assert.equal(reset.count, 1, "expired count resets before increment");
  assert.equal(reset.bookmarked, true, "bookmark survives reset");
  await change("QA-one", "shop", 1, 1);
  assert.equal(
    (await change("QA-two", "shop", 1, 1)).count,
    2,
    "account-wide shopping shares count",
  );
  await change("QA-one", "shop", 2, 1);
  assert.equal(
    (await change("QA-two", "shop", 2, -1)).count,
    0,
    "character shopping is independent and lower-bounded",
  );
  await assert.rejects(() => change("QA-stranger", "mission", 1, 1), /권한/);
  await assert.rejects(() => change("QA-one", "mission", 999, 1), /활성/);
  const priv = (
    await db.query(`select has_table_privilege('anon','public.kronos_reminders','select') as read,
    has_table_privilege('authenticated','public.kronos_progress','update') as write,
    has_function_privilege('anon','public.sanctum_kronos_progress(uuid,text,text,bigint,integer,boolean)','execute') as rpc`)
  ).rows[0];
  assert.deepEqual(priv, { read: false, write: false, rpc: false });
  const monday = (
    await db.query(
      "select extract(isodow from period_start at time zone 'Asia/Seoul') as day, extract(hour from period_start at time zone 'Asia/Seoul') as hour from kronos_progress where kind='mission' limit 1",
    )
  ).rows[0];
  assert.equal(Number(monday.day), 1);
  assert.equal(Number(monday.hour), 6);
  const boundary = (
    await db.query(`select (date_trunc('week', (sample.at_utc at time zone 'Asia/Seoul') - interval '6 hours') + interval '6 hours') at time zone 'Asia/Seoul' as period_start
      from (values ('2026-09-27 20:59:59+00'::timestamptz), ('2026-09-27 21:00:00+00'::timestamptz)) as sample(at_utc)`)
  ).rows;
  assert.equal(boundary[0].period_start.toISOString(), "2026-09-20T21:00:00.000Z", "Monday 05:59 KST still belongs to the previous week");
  assert.equal(boundary[1].period_start.toISOString(), "2026-09-27T21:00:00.000Z", "Monday 06:00 KST starts the new week");
  const kronosSource = fs.readFileSync(path.join(__dirname, "../lib/kronos.ts"), "utf8");
  const kronosModule = { exports: {} };
  const compiled = ts.transpileModule(kronosSource, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  new Function("module", "exports", compiled)(kronosModule, kronosModule.exports);
  const { kronosPeriodStart, currentProgress } = kronosModule.exports;
  const beforeReset = new Date("2026-09-27T20:59:59.000Z");
  const afterReset = new Date("2026-09-27T21:00:00.000Z");
  assert.equal(new Date(kronosPeriodStart(beforeReset)).toISOString(), boundary[0].period_start.toISOString());
  assert.equal(new Date(kronosPeriodStart(afterReset)).toISOString(), boundary[1].period_start.toISOString());
  assert.equal(currentProgress({ count: 3, period_start: boundary[0].period_start.toISOString() }, false, beforeReset), 3);
  assert.equal(currentProgress({ count: 3, period_start: boundary[0].period_start.toISOString() }, false, afterReset), 0, "UI count resets at Monday 06:00 KST");
  await db.exec(sql);
  assert.equal(
    (await change("QA-two", "shop", 1, 0)).count,
    2,
    "reapplying preserves saved data",
  );
  const batchSql = fs.readFileSync(path.join(__dirname, "../supabase/migrations/20260924_kronos_progress_batch.sql"), "utf8");
  await db.exec(batchSql);
  await db.exec(batchSql);
  assert.equal((await change("QA-two", "shop", 2, 2)).count, 2, "MAX completes in one atomic call");
  assert.equal((await change("QA-two", "shop", 2, -2)).count, 0, "batch decrement is bounded");
  assert.equal((await change("QA-one", "mission", 1, 9999)).count, 3, "batch increment respects catalog maximum");
  await assert.rejects(() => change("QA-one", "shop", 1, 10000), /권한/);
  await assert.rejects(() => change("QA-stranger", "shop", 1, 2), /권한/);
  await db.exec("delete from characters where nickname='QA-one'");
  assert.equal(
    (
      await db.query(
        "select count(*)::int as n from kronos_progress where character_name='QA-one'",
      )
    ).rows[0].n,
    0,
    "character deletion cascades",
  );
  await db.close();
  console.log(
    "PASS: migration, idempotence, ownership, limits, weekly reset, bookmarks, shared purchases, private permissions, cascade, atomic MAX.",
  );
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
