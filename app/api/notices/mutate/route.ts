import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase, getSessionAccount, isPendingAccount, SANCTUM_SESSION_COOKIE } from "@/lib/server/sanctumSession";

type NoticeComment = {
  id: number;
  author: string;
  content: string;
  created_at: string;
  parentId?: number | null;
  parent_id?: number | null;
  children?: NoticeComment[];
};
type PollOption = { id: string; text: string; votes?: number; voters?: string[] };
type NoticePoll = { options: PollOption[]; allowMultiple?: boolean; [key: string]: unknown };

const WRITER_ROLES = new Set(["길드마스터", "부마스터"]);
const MANAGED_FIELDS = ["type", "title", "content", "link", "is_pinned", "poll", "likes", "dislikes"] as const;

function findComment(nodes: NoticeComment[], id: number): NoticeComment | undefined {
  for (const node of nodes) {
    if (node.id === id) return node;
    const nested = findComment(node.children || [], id);
    if (nested) return nested;
  }
}

function appendComment(nodes: NoticeComment[], parentId: number, comment: NoticeComment): NoticeComment[] {
  return nodes.map(node => node.id === parentId
    ? { ...node, children: [...(node.children || []), comment] }
    : { ...node, children: appendComment(node.children || [], parentId, comment) });
}

function removeComment(nodes: NoticeComment[], id: number): NoticeComment[] {
  return nodes.filter(node => node.id !== id).map(node => ({ ...node, children: removeComment(node.children || [], id) }));
}

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
    const action = body?.action;
    const id = Number(body?.id);
    const isWriter = WRITER_ROLES.has(account.role);
    const supabase = getServerSupabase();

    if (action === "save") {
      if (!isWriter) return NextResponse.json({ message: "공지 작성 권한이 없습니다." }, { status: 403 });
      const input = body.payload;
      if (!input || typeof input !== "object" || Array.isArray(input)) return NextResponse.json({ message: "공지 내용이 올바르지 않습니다." }, { status: 400 });
      const title = typeof input.title === "string" ? input.title.trim() : "";
      if (!title || title.length > 200 || typeof input.content !== "string" || input.content.length > 2_000_000) {
        return NextResponse.json({ message: "제목 또는 본문 길이를 확인해주세요." }, { status: 400 });
      }
      const payload: Record<string, unknown> = {};
      for (const field of MANAGED_FIELDS) if (field in input) payload[field] = input[field];
      payload.title = title;
      if (body.id != null) {
        if (!Number.isInteger(id)) return NextResponse.json({ message: "공지 ID가 올바르지 않습니다." }, { status: 400 });
        const { data, error } = await supabase.from("notices").update(payload).eq("id", id).select("id").single();
        if (error) throw error;
        return NextResponse.json({ id: data.id });
      }
      payload.author = account.nickname;
      payload.created_at = new Date().toISOString();
      const { data, error } = await supabase.from("notices").insert(payload).select("id").single();
      if (error) throw error;
      return NextResponse.json({ id: data.id });
    }

    if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ message: "공지 ID가 올바르지 않습니다." }, { status: 400 });
    if (["pin", "delete"].includes(action)) {
      if (!isWriter) return NextResponse.json({ message: "공지 관리 권한이 없습니다." }, { status: 403 });
      if (action === "delete") {
        const { error } = await supabase.from("notices").delete().eq("id", id);
        if (error) throw error;
        return NextResponse.json({ ok: true });
      }
      const { data: notice, error: readError } = await supabase.from("notices").select("is_pinned").eq("id", id).single();
      if (readError) throw readError;
      const { error } = await supabase.from("notices").update({ is_pinned: !notice.is_pinned }).eq("id", id);
      if (error) throw error;
      return NextResponse.json({ is_pinned: !notice.is_pinned });
    }

    if (action === "vote") {
      const optionId = typeof body.optionId === "string" ? body.optionId : "";
      const { data: notice, error: readError } = await supabase.from("notices").select("poll").eq("id", id).single();
      if (readError) throw readError;
      const poll = notice.poll as NoticePoll | null;
      if (!poll || !Array.isArray(poll.options) || !poll.options.some(option => option.id === optionId)) {
        return NextResponse.json({ message: "투표 항목을 찾지 못했습니다." }, { status: 400 });
      }
      const wasSelected = poll.options.some(option => option.id === optionId && (option.voters || []).includes(account.nickname));
      const options = poll.options.map(option => {
        const previouslyVoted = (option.voters || []).includes(account.nickname);
        const voters = (option.voters || []).filter(nickname => nickname !== account.nickname);
        if (option.id === optionId && !wasSelected) voters.push(account.nickname);
        if (poll.allowMultiple && option.id !== optionId && previouslyVoted) voters.push(account.nickname);
        const nowVoted = voters.includes(account.nickname);
        const votes = Math.max(0, (option.votes || 0) + Number(nowVoted) - Number(previouslyVoted));
        return { ...option, voters, votes };
      });
      const { userVotes: _legacyUserVotes, ...pollWithoutLegacyVotes } = poll;
      const nextPoll = { ...pollWithoutLegacyVotes, options };
      const { error } = await supabase.from("notices").update({ poll: nextPoll }).eq("id", id);
      if (error) throw error;
      return NextResponse.json({ poll: { ...nextPoll, userVotes: options.filter(option => option.voters.includes(account.nickname)).map(option => option.id) } });
    }

    if (["comment", "delete_comment"].includes(action)) {
      const { data: notice, error: readError } = await supabase.from("notices").select("comments").eq("id", id).single();
      if (readError) throw readError;
      const comments = Array.isArray(notice.comments) ? notice.comments as NoticeComment[] : [];
      let nextComments: NoticeComment[];
      if (action === "comment") {
        const content = typeof body.content === "string" ? body.content.trim() : "";
        const parentId = body.parentId == null ? null : Number(body.parentId);
        if (!content || content.length > 4000 || (parentId !== null && !findComment(comments, parentId))) {
          return NextResponse.json({ message: "댓글 내용을 확인해주세요." }, { status: 400 });
        }
        const newComment: NoticeComment = {
          id: Date.now() * 1000 + Math.floor(Math.random() * 1000),
          author: account.nickname,
          content,
          created_at: new Date().toISOString(),
          parentId,
          parent_id: parentId,
          children: [],
        };
        nextComments = parentId === null ? [...comments, newComment] : appendComment(comments, parentId, newComment);
      } else {
        const commentId = Number(body.commentId);
        const target = findComment(comments, commentId);
        if (!target) return NextResponse.json({ message: "댓글을 찾지 못했습니다." }, { status: 404 });
        if (target.author !== account.nickname && !isWriter) return NextResponse.json({ message: "댓글 삭제 권한이 없습니다." }, { status: 403 });
        nextComments = removeComment(comments, commentId);
      }
      const { error } = await supabase.from("notices").update({ comments: nextComments }).eq("id", id);
      if (error) throw error;
      return NextResponse.json({ comments: nextComments });
    }
    return NextResponse.json({ message: "허용되지 않은 공지 작업입니다." }, { status: 400 });
  } catch (error) {
    console.error("SANCTUM notice mutation error:", error);
    return NextResponse.json({ message: "공지 작업을 처리하지 못했습니다." }, { status: 500 });
  }
}
