// Isolated PostgreSQL check. Does not connect to Supabase.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { PGlite } = require("@electric-sql/pglite");

(async () => {
  const db = new PGlite();
  await db.exec(`
    create role anon; create role authenticated; create role service_role bypassrls;
    create table public.accounts (
      id uuid primary key default gen_random_uuid(), nickname text unique not null,
      role text not null, status character varying, code text not null
    );
    create or replace function public.sanctum_register_account(
      input_nickname text, input_code text, input_job text,
      input_combat_power text, input_magic_resistance text
    ) returns table (id uuid, nickname text, role text, status character varying)
    language plpgsql as $$
    begin
      insert into public.accounts as a (nickname, role, status, code)
      values (input_nickname, '승인대기', '승인대기', input_code);
      return query select a.id, a.nickname, a.role, a.status
        from public.accounts a where a.nickname = input_nickname;
    end; $$;
  `);
  const sql = fs.readFileSync(path.join(__dirname, "../supabase/migrations/20260924_account_profile_registration.sql"), "utf8");
  await db.exec(sql);
  const created = (await db.query(`select * from public.sanctum_register_account_with_profile(
    'QA-new','한글0924!@','검술사','1','1','한글','0924')`)).rows[0];
  const profile = (await db.query("select favorite_word, birthday_mmdd, code from public.accounts where id = $1", [created.id])).rows[0];
  assert.deepEqual(profile, { favorite_word: "한글", birthday_mmdd: "0924", code: "한글0924!@" });
  await db.exec(sql);
  assert.equal((await db.query("select count(*)::int as count from public.accounts")).rows[0].count, 1);
  assert.equal((await db.query(`select has_function_privilege('anon',
    'public.sanctum_register_account_with_profile(text,text,text,text,text,text,text)', 'execute') as allowed`)).rows[0].allowed, false);
  await assert.rejects(() => db.query(`select * from public.sanctum_register_account_with_profile(
    'QA-invalid','한글0230!@','검술사','1','1','한글','0230')`));
  assert.equal((await db.query("select count(*)::int as count from public.accounts")).rows[0].count, 1);
  await db.close();
  console.log("PASS: Korean code, atomic profile creation, repeat migration, invalid birthday rollback, private RPC.");
})().catch((error) => { console.error(error); process.exitCode = 1; });
