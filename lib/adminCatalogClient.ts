type AdminCatalogAction = "insert" | "update" | "upsert" | "delete";

export async function adminCatalogRead<T>(table: string): Promise<T[]> {
  const response = await fetch(`/api/admin/catalog?table=${encodeURIComponent(table)}`, { cache: "no-store" });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || "카탈로그 조회 실패");
  return result.data || [];
}

export async function adminCatalogWrite<T = Record<string, unknown>>(
  table: string,
  action: AdminCatalogAction,
  payload?: Record<string, unknown>,
  id?: string | number,
): Promise<T[]> {
  const response = await fetch("/api/admin/catalog", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ table, action, payload, id }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.message || "관리 작업에 실패했습니다.");
  return result.data || [];
}
