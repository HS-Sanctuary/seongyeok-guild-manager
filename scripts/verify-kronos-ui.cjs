// Isolated browser fixtures: all API and external database traffic is intercepted.
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");
const base = process.env.KRONOS_TEST_URL || "http://localhost:3000";
const account = {
  id: "00000000-0000-0000-0000-000000000001",
  nickname: "QA길드장",
  role: "길드마스터",
  status: "승인",
  theme: process.env.KRONOS_TEST_THEME || "aureum",
};
const profileMember = {
  id: "00000000-0000-0000-0000-000000000003",
  nickname: "QA길드원",
  role: "길드원",
  status: "승인",
  favorite_word: "간식",
  birthday_mmdd: "0924",
};
const chars = ["QA캐릭", "QA부캐"].map((nickname, i) => ({
  nickname,
  owner: account.nickname,
  job: "전사",
  is_main: i === 0,
  sort_order: i,
  levels: { 전사: 10 },
  daily_checks: [],
  weekly_checks: { normal: [], repeat: {} },
  trade_checks: {},
  raid_checks: [],
  updated_at: new Date().toISOString(),
}));
const shops = [
  {
    id: 1,
    map: "티르코네일",
    npc: "QA상점",
    reward: "QA상점보상",
    reward_cnt: 2,
    cost_cnt: 1000,
    limit: 3,
    reset_type: "주간",
    scope: "캐릭당",
    is_active: true,
  },
];
const missions = [
  {
    id: 1,
    town: "티르코네일",
    title: "QA임무",
    description: "QA임무내용",
    max_count: 3,
    rewards: [{ name: "QA보상", count: 2 }, { name: "긴 제작 경험치 보상", count: 324 }],
    is_active: true,
  },
];
const trade = [
  {
    id: 1,
    map: "티르코네일",
    npc: "QA교환NPC",
    reward: "QA교환보상",
    reward_cnt: 4,
    cost: "QA재료",
    cost_cnt: 2,
    limit: 3,
    scope: "캐릭당",
    reset_type: "주간",
  },
];
const progress = [],
  notes = {};
let loginValue = "",
  notePosts = 0;
let catalogEdits = 0;
const progressCalls = [];
const output =
  process.env.KRONOS_TEST_OUTPUT ||
  path.join(require("node:os").tmpdir(), "sanctum-kronos-ui");
function week() {
  const d = new Date(Date.now() + 3 * 3600000);
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return new Date(d.getTime() - 3 * 3600000).toISOString();
}
(async () => {
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    reducedMotion: "reduce",
  });
  await context.addInitScript((account) => {
    localStorage.setItem("nexus_user", JSON.stringify(account));
    localStorage.setItem("sanctum_accounts", JSON.stringify([account]));
    localStorage.setItem("sanctum_active_account_id", account.id);
  }, account);
  await context.route("**/*", async (route) => {
    const req = route.request(),
      url = new URL(req.url());
    const send = (data) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(data),
      });
    if (url.pathname.startsWith("/api/")) {
      const b = ["POST", "PATCH"].includes(req.method()) ? req.postDataJSON() : {};
      if (url.pathname === "/api/auth/session")
        return send({ account, accounts: [account] });
      if (url.pathname === "/api/auth/login") {
        loginValue = b.code;
        return route.fulfill({
          status: 401,
          contentType: "application/json",
          body: '{"message":"QA only"}',
        });
      }
      if (url.pathname === "/api/admin/accounts") {
        if (req.method() === "PATCH" && b.action === "update_profile") {
          profileMember.favorite_word = b.favoriteWord || null;
          profileMember.birthday_mmdd = b.birthdayMMDD || null;
          return send({ account: profileMember });
        }
        return send({ actor: account, accounts: [profileMember, account] });
      }
      if (url.pathname === "/api/kronos") {
        const char = b.character || url.searchParams.get("character");
        if (req.method() === "GET")
          return send({
            shops,
            missions,
            progress: progress.filter((p) => p.character_name === char),
            notes: notes[char] || [],
          });
        if (b.action === "progress") {
          progressCalls.push({ kind: b.kind, itemId: b.itemId, delta: b.delta });
          let p = progress.find(
            (p) =>
              p.kind === b.kind &&
              p.item_id === b.itemId &&
              p.character_name === char,
          );
          if (!p) {
            p = {
              kind: b.kind,
              item_id: b.itemId,
              character_name: char,
              count: 0,
              bookmarked: false,
              period_start: week(),
            };
            progress.push(p);
          }
          p.count = Math.max(0, Math.min(3, p.count + b.delta));
          if (b.bookmarked !== undefined) p.bookmarked = b.bookmarked;
          return send({ progress: p });
        }
        notePosts++;
        notes[char] ??= [];
        notes[char] = notes[char].filter((n) => n.slot !== b.slot);
        if (b.action === "note") notes[char].push(b);
        return send({ note: b, success: true });
      }
      if (url.pathname === "/api/admin/catalog") {
        const t = url.searchParams.get("table") || b.table;
        if (req.method() === "POST" && b.action === "update") {
          const list = t === "nexus_trades" ? trade : t === "kronos_shop_items" ? shops : missions;
          const item = list.find((entry) => entry.id === b.id);
          if (item) Object.assign(item, b.payload);
          catalogEdits++;
          return send({ data: item ? [item] : [] });
        }
        return send({
          data:
            t === "nexus_trades"
              ? trade
              : t === "kronos_missions"
                ? missions
                : t === "kronos_shop_items"
                  ? shops
                  : [],
        });
      }
      return send({
        data: [],
        accounts: [account],
        pending: [],
        characters: chars,
      });
    }
    if (url.hostname.endsWith(".supabase.co")) {
      const table = url.pathname.split("/").pop();
      const data =
        table === "characters"
          ? chars
          : table === "nexus_trades"
            ? trade
            : table === "nexus_classes"
              ? [{ id: 1, name: "전사", is_active: true }]
              : table === "nexus_tasks"
                ? [
                    {
                      id: 1,
                      name: "QA일일숙제",
                      type: "daily",
                      is_active: true,
                    },
                  ]
                : [];
      return send(data);
    }
    if (url.origin === base) return route.continue();
    return route.abort();
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("dialog", (d) => d.dismiss());
  await page.goto(base + "/login");
  const code = page.getByRole("textbox", { name: "접속 코드", exact: true });
  await code.waitFor();
  await page.waitForFunction(() => document.querySelector('input[aria-label="접속 코드"]')?.type === "text");
  assert.equal(
    await code.getAttribute("type"),
    "text",
    "Korean composition input",
  );
  assert.equal(
    await code.evaluate((e) => getComputedStyle(e).webkitTextSecurity),
    "disc",
  );
  await page.getByPlaceholder("대표 캐릭터 닉네임 (예: 한설)").fill("QA길드장");
  const synthetic = "가나다5678#$";
  await code.pressSequentially(synthetic);
  await code.press("Enter");
  await page.waitForTimeout(200);
  assert.equal(loginValue, synthetic);
  await page
    .getByRole("button", { name: "접속 코드 보기", exact: true })
    .click();
  assert.equal(
    await code.evaluate((e) => getComputedStyle(e).webkitTextSecurity),
    "none",
  );
  await page.goto(base + "/character?char=" + encodeURIComponent("QA캐릭"));
  await page
    .getByRole("heading", { name: "📜 임무 게시판", exact: true })
    .waitFor();
  assert.equal(
    await page.getByRole("button", { name: "ALL", exact: true }).count(),
    0,
  );
  await page.getByRole("button", { name: "임무 게시판", exact: true }).click();
  assert.equal(
    await page
      .getByRole("heading", { name: "🛒 상점 구매 목록", exact: true })
      .count(),
    0,
  );
  await page.getByRole("button", { name: "상점 구매", exact: true }).click();
  await page
    .getByRole("heading", { name: "🛒 상점 구매 목록", exact: true })
    .waitFor();
  const shopCard = page.locator("article").filter({ hasText: "QA상점보상" });
  await shopCard.getByRole("button", { name: "남은 구매 횟수 모두 완료" }).click();
  assert.match(await shopCard.innerText(), /3\/3/, "MAX responds immediately");
  await page.waitForTimeout(250);
  assert.match(await shopCard.innerText(), /3\/3/, "MAX persists in the fixture");
  assert.equal(progressCalls.filter((call) => call.kind === "shop").length, 1, "MAX uses one request");
  assert.equal(progressCalls.find((call) => call.kind === "shop").delta, 3);
  await shopCard.getByRole("button", { name: "구매 횟수 모두 초기화" }).click();
  assert.match(await shopCard.innerText(), /0\/3/, "MIN resets immediately");
  await page.waitForTimeout(250);
  assert.equal(progressCalls.filter((call) => call.kind === "shop")[1].delta, -3, "MIN uses one request");
  await shopCard.getByRole("button", { name: "남은 구매 횟수 모두 완료" }).click();
  await page.waitForTimeout(250);
  await shopCard.getByRole("button", { name: "횟수 줄이기" }).evaluate((button) => { button.click(); button.click(); });
  assert.match(await shopCard.innerText(), /1\/3/, "rapid taps update immediately");
  await page.waitForTimeout(300);
  assert.equal(progressCalls.filter((call) => call.kind === "shop").length, 4, "rapid taps are batched");
  assert.equal(progressCalls.filter((call) => call.kind === "shop")[3].delta, -2);
  assert.match(await shopCard.innerText(), /3,000 골드/, "full-purchase price uses unit price times limit");
  const mission = page.locator("article").filter({ hasText: "QA임무내용" });
  await page.getByText("초기화: 매주 월 06시", { exact: true }).waitFor();
  assert.equal(await page.locator(".kronos-meta-badge").filter({ hasText: "QA캐릭" }).count(), 1);
  const descriptionBox = await mission.getByText("QA임무내용", { exact: true }).boundingBox();
  await mission.getByRole("button", { name: "횟수 늘리기" }).click();
  await page.waitForTimeout(100);
  assert.match(await mission.innerText(), /1\/3/);
  await mission.getByRole("button", { name: "즐겨찾기", exact: true }).click();
  assert.equal(await page.getByRole("button", { name: "즐겨찾기", exact: true }).count(), 2, "visible shop and mission cards offer favorites");
  const rewardNames = mission.locator("ul li strong:first-of-type");
  const firstRewardBox = await rewardNames.nth(0).boundingBox();
  const secondRewardBox = await rewardNames.nth(1).boundingBox();
  assert.equal(Math.round(descriptionBox.x), Math.round(firstRewardBox.x), "mission detail and rewards share a start line");
  assert.equal(Math.round(firstRewardBox.x), Math.round(secondRewardBox.x), "reward names share a start line");
  await page.waitForTimeout(250);
  await mission.getByRole("button", { name: "남은 임무 횟수 모두 완료" }).click();
  assert.match(await mission.innerText(), /3\/3/, "mission MAX responds immediately");
  await page.waitForTimeout(250);
  await mission.getByRole("button", { name: "임무 횟수 모두 초기화" }).click();
  assert.match(await mission.innerText(), /0\/3/, "mission MIN responds immediately");
  await page.waitForTimeout(250);
  await page.getByRole("textbox", { name: "임무 검색" }).fill("던바튼");
  assert.equal(await mission.count(), 0, "town filters missions");
  await page.getByRole("textbox", { name: "임무 검색" }).fill("");
  assert.equal(await mission.count(), 1);
  await page.getByRole("button", { name: "리마인드", exact: true }).click();
  await page.getByRole("dialog", { name: "1번 리마인드 메모" }).waitFor();
  const note = page.getByRole("dialog", { name: "1번 리마인드 메모" });
  await note
    .getByRole("textbox", { name: "메모 내용" })
    .fill("QA private note");
  await note.getByRole("button", { name: "저장", exact: true }).click();
  await page.waitForTimeout(150);
  assert.equal(notePosts, 1);
  await note.getByRole("button", { name: "메모 2 열기" }).click();
  await page
    .getByRole("dialog", { name: "2번 리마인드 메모" })
    .getByRole("button", { name: "메모 닫기" })
    .click();
  await note.getByRole("button", { name: "메모 닫기" }).click();
  await page.getByRole("button", { name: "임무 게시판", exact: true }).click();
  await page.getByRole("button", { name: "상점 구매", exact: true }).click();
  for (const width of [320, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.screenshot({
      path: path.join(output, "character-" + width + ".png"),
      fullPage: true,
    });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth + 1,
    );
    assert.equal(overflow, false, "character overflow " + width);
  }
  await page.goto(base + "/admin");
  await page
    .getByRole("button", { name: "물물교환 카탈로그", exact: false })
    .click();
  await page.getByText("QA교환보상", { exact: true }).waitFor();
  await page.getByRole("button", { name: "수정", exact: true }).first().click();
  await page.getByPlaceholder("맵 (예: 두갈드)").fill("QA수정맵");
  await page.getByRole("button", { name: "수정 저장" }).click();
  await page.getByText("QA수정맵", { exact: true }).waitFor();
  await page
    .getByRole("button", { name: "상점 구매 카탈로그", exact: false })
    .click();
  await page.getByText("QA상점보상", { exact: true }).waitFor();
  await page.getByRole("button", { name: "수정", exact: true }).first().click();
  await page.getByPlaceholder("맵 (예: 두갈드)").fill("QA상점수정맵");
  await page.getByRole("button", { name: "수정 저장" }).click();
  await page.getByText("QA상점수정맵", { exact: true }).waitFor();
  assert.equal(catalogEdits, 2);
  await page
    .getByRole("button", { name: "임무 게시판 관리", exact: false })
    .click();
  await page.getByRole("textbox", { name: "임무 제목", exact: true }).waitFor();
  await page.getByRole("button", { name: /가입 승인 & 권한 관리/ }).click();
  await page.getByLabel("QA길드장님의 접속 코드").fill("QA-only");
  await page.getByRole("button", { name: "본인 확인하고 목록 열기" }).click();
  await page.getByRole("button", { name: /길드원 권한 관리/ }).click();
  await page.waitForTimeout(1000);
  const memberCards = page.locator(".sanctum-member-card");
  assert.ok(await memberCards.count() >= 2, "member entries render as separate cards");
  assert.match(await memberCards.first().innerText(), /QA길드장/, "highest role appears first even when API returns it last");
  const firstMemberBox = await memberCards.nth(0).boundingBox();
  const secondMemberBox = await memberCards.nth(1).boundingBox();
  assert.ok(secondMemberBox.y > firstMemberBox.y + firstMemberBox.height, "member cards have visible separation");
  await page.screenshot({ path: path.join(output, "admin-profile-before.png"), fullPage: true });
  await page.getByText("9월 24일", { exact: true }).waitFor();
  await page.getByRole("button", { name: "정보 수정" }).filter({ hasText: "정보 수정" }).last().click();
  await page.getByRole("textbox", { name: "좋아하는 것" }).fill("바다");
  await page.getByRole("textbox", { name: "생일 (월일)" }).fill("1012");
  await page.getByRole("button", { name: "저장", exact: true }).click();
  await page.getByText("10월 12일", { exact: true }).waitFor();
  for (const width of [320, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.screenshot({
      path: path.join(output, "admin-" + width + ".png"),
      fullPage: true,
    });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth + 1,
      ),
      false,
      "admin overflow " + width,
    );
  }
  assert.deepEqual(errors, []);
  await browser.close();
  console.log(
    "PASS: Korean text/masking, multi-select tabs, MAX/MIN and rapid batching, mission town search/bookmark, note save, admin trade/shop editing, 320/390/768/1280 widths. Screenshots: " +
      output,
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
