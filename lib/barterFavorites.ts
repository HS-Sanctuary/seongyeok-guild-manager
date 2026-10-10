const ACCOUNT_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const BARTER_FAVORITES_IMPORT_LIMIT = 500;

export type BarterFavoritesSnapshot = {
  accountId: string;
  favorites: number[];
};

export type BarterFavoritesMutation =
  | { kind: "favorite"; accountId: string; tradeId: number; favorite: boolean }
  | { kind: "import"; accountId: string; importIds: number[] };

export class BarterFavoritesError extends Error {
  constructor(public readonly status: 400 | 401 | 403 | 413 | 503) {
    super("Barter favorites request failed");
  }
}

export function validateFavoriteAccountId(value: unknown): string {
  if (typeof value !== "string" || !ACCOUNT_ID_PATTERN.test(value)) {
    throw new BarterFavoritesError(400);
  }
  return value.toLowerCase();
}

export function isFavoriteTradeId(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

export function validateFavoriteMutation(value: unknown): BarterFavoritesMutation {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new BarterFavoritesError(400);
  }
  const body = value as Record<string, unknown>;
  const accountId = validateFavoriteAccountId(body.accountId);
  const keys = Object.keys(body);
  if (keys.length === 3 && keys.every(key => ["accountId", "tradeId", "favorite"].includes(key))) {
    if (!isFavoriteTradeId(body.tradeId) || typeof body.favorite !== "boolean") {
      throw new BarterFavoritesError(400);
    }
    return { kind: "favorite", accountId, tradeId: body.tradeId, favorite: body.favorite };
  }
  if (keys.length === 2 && keys.every(key => ["accountId", "importIds"].includes(key))) {
    if (!Array.isArray(body.importIds) || body.importIds.length > BARTER_FAVORITES_IMPORT_LIMIT || !body.importIds.every(isFavoriteTradeId)) {
      throw new BarterFavoritesError(400);
    }
    return { kind: "import", accountId, importIds: [...new Set(body.importIds)] };
  }
  throw new BarterFavoritesError(400);
}
