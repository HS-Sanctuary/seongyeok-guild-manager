export type FashionItem = { itemName: string; rarity: string; dyeParts: string[] };
export type GnosisComment = { id: string | number; author: string; title_name?: string; content: string; timestamp?: string; likes?: number; replies?: GnosisComment[] };
export type LocalGuide = {
  id: string | number; title: string; content: string; sub_category: string; author: string; created_at: string;
  title_name?: string; content_format?: string; likes?: number; youtube_id?: string | null; item_data?: FashionItem | null;
  is_spoiler?: boolean; hide_media?: boolean; comments?: GnosisComment[]; [key: string]: unknown;
};
type StoragePort = Pick<Storage, "getItem" | "setItem">;
export const GUIDE_KEY = "gnosis_mock_db";
export const DRAFT_KEY = "gnosis_writer_draft_v1";
export function isLocalGuide(value: unknown): value is LocalGuide {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  if (!(typeof row.id === "number" || typeof row.id === "string") || !["title", "content", "sub_category", "author", "created_at"].every(key => typeof row[key] === "string")) return false;
  if (["title_name", "content_format"].some(key => row[key] !== undefined && typeof row[key] !== "string")) return false;
  if (row.youtube_id != null && typeof row.youtube_id !== "string") return false;
  if (row.likes !== undefined && (typeof row.likes !== "number" || !Number.isFinite(row.likes))) return false;
  if (row.comments === undefined) return true;
  if (!Array.isArray(row.comments)) return false;
  const queue: unknown[] = [...row.comments];
  for (let index = 0; index < queue.length; index++) {
    if (index > 10000) return false;
    const comment = queue[index] as Partial<GnosisComment> | null;
    if (!comment || typeof comment !== "object" || !["number", "string"].includes(typeof comment.id) || typeof comment.content !== "string" || typeof comment.author !== "string") return false;
    if ([comment.title_name, comment.timestamp].some(value => value !== undefined && typeof value !== "string") || (comment.likes !== undefined && (typeof comment.likes !== "number" || !Number.isFinite(comment.likes)))) return false;
    if (comment.replies !== undefined && !Array.isArray(comment.replies)) return false;
    if (comment.replies) queue.push(...comment.replies);
  }
  return true;
}
export function readGuides(storage: StoragePort): LocalGuide[] {
  const raw = storage.getItem(GUIDE_KEY);
  const rows: unknown = raw ? JSON.parse(raw) : [];
  if (!Array.isArray(rows) || !rows.every(isLocalGuide)) throw new Error("저장된 글을 읽을 수 없어요. 기존 기록은 보존했어요.");
  return rows;
}
export function storeGuide(storage: StoragePort, guide: LocalGuide) {
  const rows = readGuides(storage);
  if (!isLocalGuide(guide)) throw new Error("글 내용을 확인해주세요.");
  const exists = rows.some(row => String(row.id) === String(guide.id));
  storage.setItem(GUIDE_KEY, JSON.stringify(exists ? rows.map(row => String(row.id) === String(guide.id) ? guide : row) : [guide, ...rows]));
}
export function changeComment(rows: GnosisComment[], id: GnosisComment["id"], change: (row: GnosisComment) => GnosisComment): GnosisComment[] {
  const result = structuredClone(rows);
  const stack = [result];
  while (stack.length) {
    const list = stack.pop()!;
    for (const [index, row] of list.entries()) {
      if (String(row.id) === String(id)) { list[index] = change(row); return result; }
      if (row.replies) stack.push(row.replies);
    }
  }
  return result;
}
export function flattenComments(rows: GnosisComment[]) {
  const result: { comment: GnosisComment; depth: number; parent?: string }[] = [];
  const stack = rows.map(comment => ({ comment, depth: 0, parent: undefined as string | undefined })).reverse();
  while (stack.length) { const entry = stack.pop()!; result.push(entry); if (entry.comment.replies) for (const comment of [...entry.comment.replies].reverse()) stack.push({ comment, depth: entry.depth + 1, parent: entry.comment.author }); }
  return result;
}
export function youtubeId(value: string): string | null {
  try {
    const url = new URL(value);
    if (!["https:", "http:"].includes(url.protocol)) return null;
    const host = url.hostname.toLowerCase();
    const id = host === "youtu.be" ? url.pathname.slice(1) : ["youtube.com", "www.youtube.com", "m.youtube.com"].includes(host) ? url.pathname === "/watch" ? url.searchParams.get("v") : /^\/(?:shorts|embed)\/([^/]+)$/.exec(url.pathname)?.[1] : null;
    return id && /^[\w-]{11}$/.test(id) ? id : null;
  } catch { return null; }
}
export function gnosisExcerpt(content: string, formatted: boolean) {
  return formatted ? content.replace(/^\s*(?:## |[-] |> )/gm, "").replace(/\[([^\]]+)\]\(https?:\/\/[^\s)]+\)/g, "$1").replace(/\*\*|~~|\+\+|\*/g, "") : content;
}
