import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase, getSessionAccount, isPendingAccount, SANCTUM_SESSION_COOKIE } from "@/lib/server/sanctumSession";

type Table = "characters" | "parties" | "inquiries";
type Action = "insert" | "update" | "upsert" | "delete";
type Filter = { column: "id" | "nickname" | "owner" | "originalName"; value: string | number; exceptNickname?: string };

const ADMIN_ROLES = new Set(["길드마스터", "부마스터", "부마스터 대행"]);
const isRecord = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value);
const memberName = (value: unknown) => isRecord(value)
  ? [value.name, value.character_name, value.nickname].find((part) => typeof part === "string") as string | undefined
  : undefined;

export async function POST(request: NextRequest) {
  try {
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin) {
      return NextResponse.json({ message: "요청 출처를 확인할 수 없습니다." }, { status: 403 });
    }
    const account = await getSessionAccount(request.cookies.get(SANCTUM_SESSION_COOKIE)?.value);
    if (!account || isPendingAccount(account)) {
      return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
    }
    const body = await request.json();
    const table = body?.table as Table;
    const action = body?.action as Action;
    const filter = body?.filter as Filter | undefined;
    const payload = body?.payload;
    if (!["characters", "parties", "inquiries"].includes(table) || !["insert", "update", "upsert", "delete"].includes(action)) {
      return NextResponse.json({ message: "허용되지 않은 작업입니다." }, { status: 400 });
    }
    if (action !== "delete" && !isRecord(payload)) {
      return NextResponse.json({ message: "저장할 내용이 올바르지 않습니다." }, { status: 400 });
    }
    if (["update", "delete"].includes(action) && (!filter || !["id", "nickname", "owner", "originalName"].includes(filter.column) || !(typeof filter.value === "string" || typeof filter.value === "number"))) {
      return NextResponse.json({ message: "수정 대상을 확인할 수 없습니다." }, { status: 400 });
    }
    const supabase = getServerSupabase();
    const isAdmin = ADMIN_ROLES.has(account.role);
    let cleanPayload = isRecord(payload) ? { ...payload } : {};
    const ownedNicknameUpdate = table === "characters" && action === "update" && filter?.column === "nickname" && typeof filter.value === "string" && !filter.exceptNickname;

    if (table === "characters") {
      if (action === "insert" || action === "upsert") {
        if (typeof cleanPayload.nickname !== "string" || !cleanPayload.nickname.trim()) {
          return NextResponse.json({ message: "캐릭터 이름이 필요합니다." }, { status: 400 });
        }
        const { data: existing } = await supabase.from("characters").select("owner").eq("nickname", cleanPayload.nickname).maybeSingle();
        if (existing && existing.owner !== account.nickname) return NextResponse.json({ message: "다른 계정의 캐릭터는 수정할 수 없습니다." }, { status: 403 });
        cleanPayload.owner = account.nickname;
      } else if (ownedNicknameUpdate) {
        // The write itself is scoped to the signed-in owner; no separate owner lookup is needed.
        delete cleanPayload.owner;
      } else {
        const { data: targets, error } = await supabase.from("characters").select("id, owner").eq(filter!.column, filter!.value).limit(100);
        if (error || (!targets?.length && filter!.column !== "owner") || targets?.some((target) => target.owner !== account.nickname)) {
          return NextResponse.json({ message: "본인 캐릭터만 수정할 수 있습니다." }, { status: 403 });
        }
        delete cleanPayload.owner;
      }
    }

    if (table === "parties") {
      const { data: ownedCharacters } = await supabase.from("characters").select("nickname").eq("owner", account.nickname);
      const ownNames = new Set((ownedCharacters ?? []).map((character) => character.nickname));
      if (action === "insert") {
        const members = Array.isArray(cleanPayload.members) ? cleanPayload.members : [];
        if (!isAdmin && !members.some((member) => ownNames.has(memberName(member) ?? ""))) {
          return NextResponse.json({ message: "본인 캐릭터가 포함된 파티만 만들 수 있습니다." }, { status: 403 });
        }
      } else {
        if (filter?.column !== "id") return NextResponse.json({ message: "파티 ID가 필요합니다." }, { status: 400 });
        const { data: party } = await supabase.from("parties").select("id, leader_name, members").eq("id", filter.value).maybeSingle();
        if (!party) return NextResponse.json({ message: "파티를 찾을 수 없습니다." }, { status: 404 });
        const oldMembers = Array.isArray(party.members) ? party.members : [];
        const actorInParty = oldMembers.some((member) => ownNames.has(memberName(member) ?? ""));
        const isLeader = ownNames.has(party.leader_name ?? "");
        if (!isAdmin && !actorInParty && !isLeader) {
          if (action !== "update" || !Array.isArray(cleanPayload.members)) return NextResponse.json({ message: "파티 수정 권한이 없습니다." }, { status: 403 });
          const nextMembers = cleanPayload.members;
          const preserved = oldMembers.every((member) => nextMembers.some((next) => JSON.stringify(next) === JSON.stringify(member)));
          const added = nextMembers.filter((member) => !oldMembers.some((old) => JSON.stringify(old) === JSON.stringify(member)));
          const allowedFields = Object.keys(cleanPayload).every((key) => ["members", "status", "wanted_roles", "final_start_time", "leader_name"].includes(key));
          if (!preserved || !added.length || !added.every((member) => ownNames.has(memberName(member) ?? "")) || !allowedFields) {
            return NextResponse.json({ message: "본인 캐릭터로만 파티에 합류할 수 있습니다." }, { status: 403 });
          }
        }
        if (action === "delete" && !isAdmin && !isLeader && !(actorInParty && oldMembers.length <= 1)) {
          return NextResponse.json({ message: "파티 삭제 권한이 없습니다." }, { status: 403 });
        }
      }
    }

    if (table === "inquiries") {
      if (action === "insert") {
        const category = String(cleanPayload.category ?? "기타");
        if (!["질문", "건의", "버그", "기타"].includes(category)) {
          return NextResponse.json({ message: "제보와 건의는 로고스 전용 작성창에서 등록해 주세요." }, { status: 400 });
        }
        cleanPayload = {
          category,
          title: String(cleanPayload.title ?? "").trim().slice(0, 200),
          content: String(cleanPayload.content ?? "").trim().slice(0, 10000),
          author: account.nickname,
          status: "대기중",
        };
        if (!cleanPayload.title || !cleanPayload.content) return NextResponse.json({ message: "제목과 내용을 입력해주세요." }, { status: 400 });
      } else if (action === "update" && isAdmin && filter?.column === "id") {
        const { data: existingInquiry, error: inquiryError } = await supabase.from("inquiries")
          .select("category").eq("id", filter.value).maybeSingle();
        if (inquiryError) throw inquiryError;
        if (!existingInquiry) return NextResponse.json({ message: "문의를 찾지 못했습니다." }, { status: 404 });
        if (["생텀 버그 제보", "생텀 건의사항"].includes(existingInquiry.category) && account.role !== "길드마스터") {
          return NextResponse.json({ message: "길드마스터만 이 글에 답변할 수 있습니다." }, { status: 403 });
        }
        cleanPayload = { reply: String(cleanPayload.reply ?? "").slice(0, 10000), status: "답변완료" };
      } else {
        return NextResponse.json({ message: "문의 수정 권한이 없습니다." }, { status: 403 });
      }
    }

    let query;
    if (action === "insert") query = supabase.from(table).insert(cleanPayload).select();
    else if (action === "upsert" && table === "characters") query = supabase.from(table).upsert(cleanPayload, { onConflict: "nickname" }).select();
    else if (action === "update") {
      query = supabase.from(table).update(cleanPayload).eq(filter!.column, filter!.value);
      if (ownedNicknameUpdate) query = query.eq("owner", account.nickname);
      if (table === "characters" && filter?.exceptNickname) query = query.neq("nickname", filter.exceptNickname);
      query = query.select();
    } else if (action === "delete") query = supabase.from(table).delete().eq(filter!.column, filter!.value).select();
    else return NextResponse.json({ message: "허용되지 않은 저장 방식입니다." }, { status: 400 });
    const { data, error } = await query;
    if (error) {
      console.error("SANCTUM member mutation failed:", table, action, error.message);
      return NextResponse.json({ message: "변경 사항을 저장하지 못했습니다." }, { status: 500 });
    }
    if (ownedNicknameUpdate && (!data || data.length === 0)) {
      return NextResponse.json({ message: "본인 캐릭터만 수정할 수 있습니다." }, { status: 403 });
    }
    return NextResponse.json({ data });
  } catch (error) {
    console.error("SANCTUM member mutation error:", error);
    return NextResponse.json({ message: "요청을 처리하지 못했습니다." }, { status: 500 });
  }
}
