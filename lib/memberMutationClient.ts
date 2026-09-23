type Filter = { column: "id" | "nickname" | "owner" | "originalName"; value: string | number; exceptNickname?: string };
type Input = {
  table: "characters" | "parties" | "inquiries";
  action: "insert" | "update" | "upsert" | "delete";
  filter?: Filter;
  payload?: object;
};

export async function memberMutation(input: Input): Promise<{ data: unknown; error: Error | null }> {
  try {
    const response = await fetch("/api/member-mutations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(input),
    });
    const result = await response.json();
    if (!response.ok) return { data: null, error: new Error(result.message || "저장하지 못했습니다.") };
    return { data: result.data, error: null };
  } catch {
    return { data: null, error: new Error("서버 연결을 확인해주세요.") };
  }
}

export async function memberMutationOrThrow(input: Input) {
  const result = await memberMutation(input);
  if (result.error) throw result.error;
  return result.data;
}
