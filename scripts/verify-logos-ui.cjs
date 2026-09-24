// Browser fixture only: API traffic is intercepted; no production records are written.
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");
const os = require("node:os");

const theme = process.env.LOGOS_TEST_THEME || "aureum";
const output = path.join(os.tmpdir(), "sanctum-logos-ui-" + theme);
const base = process.env.LOGOS_TEST_URL || "http://localhost:3000";
const reports = [
  { id: 1, category: "생텀 버그 제보", title: "QA 버튼 오류", content: "버튼을 누르면 열리지 않음", author: "QA길드원", status: "대기중", created_at: "2026-09-24T06:00:00Z", reply: null, attachment_paths: [] },
  { id: 2, category: "생텀 건의사항", title: "QA 메뉴 제안", content: "메뉴 위치 개선", author: "QA길드원", status: "대기중", created_at: "2026-09-24T06:01:00Z", reply: null, attachment_paths: [] },
  { id: 3, category: "질문", title: "QA 일반 문의", content: "문의 내용", author: "QA길드원", status: "답변완료", created_at: "2026-09-24T06:02:00Z", reply: "확인했습니다.", attachment_paths: [] },
];

(async () => {
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  for (const role of ["길드원", "길드마스터"]) {
    const context = await browser.newContext({ viewport: { width: 390, height: 900 }, reducedMotion: "reduce" });
    const account = { id: "00000000-0000-0000-0000-000000000001", nickname: role === "길드마스터" ? "QA길드마스터" : "QA길드원", role, theme };
    await context.addInitScript((value) => {
      localStorage.setItem("nexus_user", JSON.stringify(value));
      localStorage.setItem("sanctum_accounts", JSON.stringify([value]));
      localStorage.setItem("sanctum_active_account_id", value.id);
    }, account);
    await context.route("**/api/**", async (route) => {
      const url = new URL(route.request().url());
      const send = (data, status = 200) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(data) });
      if (url.pathname === "/api/auth/session") return send({ account });
      if (url.pathname === "/api/inquiries" && route.request().method() === "GET") return send({ data: reports });
      if (url.pathname === "/api/inquiries/reports" && route.request().method() === "POST") {
        const body = route.request().postData() || "";
        assert.match(body, /생텀 버그 제보/);
        assert.match(body, /image\/webp/, "pasted or selected image is compressed to WebP");
        return send({ data: { id: 4 } }, 201);
      }
      return send({ message: "Fixture route not found" }, 404);
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(base + "/support");
    await page.waitForFunction((expectedTheme) => document.documentElement.getAttribute("data-theme") === expectedTheme, theme);
    await page.getByRole("button", { name: /생텀 버그 제보/ }).click();
    await page.getByRole("button", { name: /QA 버튼 오류/ }).waitFor();
    assert.equal(await page.getByRole("button", { name: /QA 일반 문의/ }).count(), 0);
    await page.getByRole("button", { name: /＋ 새 글 작성/ }).click();
    await page.getByRole("textbox", { name: "제목" }).fill("QA 새 버그");
    await page.getByRole("textbox", { name: "내용" }).fill("캐릭터 화면에서 저장 알림이 사라짐");
    const imageBase64 = await page.evaluate(() => { const canvas = document.createElement("canvas"); canvas.width = 160; canvas.height = 90; const context = canvas.getContext("2d"); context.fillStyle = "#2563eb"; context.fillRect(0, 0, 160, 90); return canvas.toDataURL("image/png").split(",")[1]; });
    await page.locator('input[type="file"][multiple]').setInputFiles({ name: "qa.png", mimeType: "image/png", buffer: Buffer.from(imageBase64, "base64") });
    await page.getByText(/KB$/).waitFor();
    await page.screenshot({ path: path.join(output, role + "-390.png"), fullPage: true });
    await page.getByRole("button", { name: "등록하기" }).click();
    await page.getByRole("button", { name: /＋ 새 글 작성/ }).waitFor();
    assert.equal(new URL(page.url()).searchParams.get("tab"), "bug");
    await page.reload();
    await page.locator('nav[aria-label="로고스 글 종류"] button[aria-pressed="true"]').getByText(/생텀 버그 제보/).waitFor();
    await page.getByRole("button", { name: /QA 버튼 오류/ }).waitFor();
    for (const width of [320, 390, 768, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `${role} overflow ${width}`);
    }
    assert.deepEqual(errors, []);
    await context.close();
  }
  await browser.close();
  console.log("PASS: Logos tabs, form, image compression, member/master presentation, 320/390/768/1280 widths. Screenshots: " + output);
})().catch((error) => { console.error(error); process.exit(1); });
