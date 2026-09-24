// Isolated PostgreSQL-compatible fixture. Never connects to production.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { PGlite } = require("@electric-sql/pglite");

(async () => {
  const db = new PGlite();
  await db.exec(`create table public.inquiries(id bigint primary key, title text not null);
    insert into public.inquiries values (1, '기존 문의');
    create schema storage;
    create table storage.buckets(id text primary key, name text not null, public boolean not null,
      file_size_limit bigint, allowed_mime_types text[]);`);
  const sql = fs.readFileSync(path.join(__dirname, "../supabase/migrations/20260924_logos_private_report_images.sql"), "utf8");
  await db.exec(sql);
  await db.exec(sql);
  const { rows } = await db.query(`select i.title, i.attachment_paths, i.reporter_account_id, b.public, b.file_size_limit, b.allowed_mime_types
    from public.inquiries i cross join storage.buckets b where i.id = 1 and b.id = 'logos-reports'`);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].title, "기존 문의");
  assert.deepEqual(rows[0].attachment_paths, []);
  assert.equal(rows[0].reporter_account_id, null);
  assert.equal(rows[0].public, false);
  assert.equal(Number(rows[0].file_size_limit), 358400);
  assert.deepEqual(rows[0].allowed_mime_types, ["image/webp"]);
  await db.close();
  console.log("PASS: Logos image migration preserves inquiries, private bucket, file limit, and reapplication.");
})().catch((error) => { console.error(error); process.exit(1); });
