export async function mutateNotice<T = Record<string, unknown>>(body: Record<string, unknown>): Promise<T> {
  const response = await fetch("/api/notices/mutate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.message || "공지 작업에 실패했습니다.");
  return result as T;
}
