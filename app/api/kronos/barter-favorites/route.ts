import { NextRequest, NextResponse } from "next/server";
import {
  getServerSupabase,
  getSessionAccount,
  isPendingAccount,
  SANCTUM_SESSION_COOKIE,
} from "@/lib/server/sanctumSession";
import {
  BarterFavoritesError,
  isFavoriteTradeId,
  validateFavoriteAccountId,
  validateFavoriteMutation,
  type BarterFavoritesSnapshot,
} from "@/lib/barterFavorites";

const headers = { "Cache-Control": "private, no-store" };
const BODY_LIMIT_BYTES = 16 * 1024;
const PAGE_SIZE = 1000;
const MAX_SNAPSHOT_PAGES = 100;
type FavoritesDB = ReturnType<typeof getServerSupabase>;

async function sessionAccountId(request: NextRequest): Promise<string> {
  const account = await getSessionAccount(request.cookies.get(SANCTUM_SESSION_COOKIE)?.value);
  if (!account || isPendingAccount(account)) throw new BarterFavoritesError(401);
  try {
    return validateFavoriteAccountId(account.id);
  } catch {
    throw new BarterFavoritesError(503);
  }
}

async function snapshot(db: FavoritesDB, accountId: string): Promise<BarterFavoritesSnapshot> {
  const favorites: number[] = [];
  let lastId = 0;
  for (let page = 0; page < MAX_SNAPSHOT_PAGES; page++) {
    let query = db.from("kronos_barter_favorites").select("trade_id", { count: "exact" })
      .eq("account_id", accountId).eq("favorited", true)
      .order("trade_id", { ascending: true }).limit(PAGE_SIZE);
    if (page > 0) query = query.gt("trade_id", lastId);
    const { data, count, error } = await query;
    if (error || !Array.isArray(data) || typeof count !== "number" || !Number.isSafeInteger(count) || count < data.length || (count > 0 && data.length === 0)) {
      throw new BarterFavoritesError(503);
    }
    for (const row of data) {
      if (!isFavoriteTradeId(row.trade_id) || row.trade_id <= lastId) throw new BarterFavoritesError(503);
      lastId = row.trade_id;
      favorites.push(lastId);
    }
    // An exact remaining count also handles projects whose row cap is below PAGE_SIZE.
    if (count === data.length) return { accountId, favorites };
  }
  // Never acknowledge a truncated snapshot or keep requesting an unbounded table.
  throw new BarterFavoritesError(503);
}

async function catalogIds(db: FavoritesDB, ids: number[]): Promise<Set<number>> {
  const existingIds = new Set<number>();
  let lastId = 0;
  for (let page = 0; page < MAX_SNAPSHOT_PAGES; page++) {
    let query = db.from("nexus_trades").select("id", { count: "exact" })
      .in("id", ids).order("id", { ascending: true }).limit(PAGE_SIZE);
    if (page > 0) query = query.gt("id", lastId);
    const { data, count, error } = await query;
    if (error || !Array.isArray(data) || typeof count !== "number" || !Number.isSafeInteger(count) || count < data.length || (count > 0 && data.length === 0)) {
      throw new BarterFavoritesError(503);
    }
    for (const row of data) {
      if (!isFavoriteTradeId(row.id) || row.id <= lastId) throw new BarterFavoritesError(503);
      lastId = row.id;
      existingIds.add(lastId);
    }
    if (count === data.length) return existingIds;
  }
  throw new BarterFavoritesError(503);
}

async function readBody(request: NextRequest): Promise<unknown> {
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get("content-type") ?? "")) {
    throw new BarterFavoritesError(400);
  }
  const reader = request.body?.getReader();
  if (!reader) throw new BarterFavoritesError(400);
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > BODY_LIMIT_BYTES) {
      await reader.cancel().catch(() => undefined);
      throw new BarterFavoritesError(413);
    }
    chunks.push(value);
  }
  try {
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(chunks)));
  } catch {
    throw new BarterFavoritesError(400);
  }
}

function failure(error: unknown) {
  const status = error instanceof BarterFavoritesError ? error.status : 503;
  const messages = {
    400: "즐겨찾기 요청을 확인해 주세요.",
    401: "로그인과 가입 승인 상태를 확인해 주세요.",
    403: "현재 로그인 계정과 요청을 다시 확인해 주세요.",
    413: "즐겨찾기 요청이 너무 큽니다.",
    503: "즐겨찾기를 불러오거나 저장하지 못했어요. 잠시 후 다시 확인해 주세요.",
  };
  return NextResponse.json({ message: messages[status] }, { status, headers });
}

export async function GET(request: NextRequest) {
  try {
    const accountId = await sessionAccountId(request);
    const requestedIds = request.nextUrl.searchParams.getAll("accountId");
    if (requestedIds.length !== 1) throw new BarterFavoritesError(400);
    if (validateFavoriteAccountId(requestedIds[0]) !== accountId) throw new BarterFavoritesError(403);
    return NextResponse.json(await snapshot(getServerSupabase(), accountId), { headers });
  } catch (error) {
    return failure(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    if (request.headers.get("origin") !== request.nextUrl.origin) throw new BarterFavoritesError(403);
    const accountId = await sessionAccountId(request);
    const mutation = validateFavoriteMutation(await readBody(request));
    if (mutation.accountId !== accountId) throw new BarterFavoritesError(403);
    const db = getServerSupabase();
    const ids = mutation.kind === "favorite" ? [mutation.tradeId] : mutation.importIds;
    if (ids.length > 0) {
      const existingIds = await catalogIds(db, ids);
      if (mutation.kind === "favorite" && !existingIds.has(mutation.tradeId)) throw new BarterFavoritesError(400);
      // Stale legacy catalog IDs are skipped. Existing false/true rows are untouched.
      const validIds = ids.filter(id => existingIds.has(id));
      if (validIds.length > 0) {
        const updatedAt = new Date().toISOString();
        const rows = validIds.map(tradeId => ({
          account_id: accountId,
          trade_id: tradeId,
          favorited: mutation.kind === "favorite" ? mutation.favorite : true,
          updated_at: updatedAt,
        }));
        const { error: writeError } = await db.from("kronos_barter_favorites").upsert(
          mutation.kind === "favorite" ? rows[0] : rows,
          { onConflict: "account_id,trade_id", ignoreDuplicates: mutation.kind === "import" },
        );
        if (writeError) throw new BarterFavoritesError(503);
      }
    }
    return NextResponse.json(await snapshot(db, accountId), { headers });
  } catch (error) {
    return failure(error);
  }
}
