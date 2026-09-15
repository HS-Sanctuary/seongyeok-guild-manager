"use client";

import { Notice, CommentItem } from "@/types/kerygma";

interface KerygmaReaderViewProps {
  selectedNotice: Notice;
  onCloseReader: () => void;
  canWriteNotice: boolean;
  onTogglePin: (id: number, currentPinned: boolean) => void;
  onDeleteNotice: (id: number) => void;
  getBadgeStyle: (type: string, isPinned: boolean) => string;
  formatNoticeDate: (dateStr: string) => string;
  onVoteOption: (optionId: string) => void;
  onReaction: (type: "like" | "dislike") => void;
  commentsTree: CommentItem[];
  currentNickname: string;
  newCommentText: string;
  setNewCommentText: (val: string) => void;
  replyingTo: number | null;
  setReplyingTo: (id: number | null) => void;
  replyText: string;
  setReplyText: (val: string) => void;
  onAddComment: (parentId?: number | null) => void;
  recentNoticesList: Notice[];
  onOpenNotice: (notice: Notice) => void;
}

export default function KerygmaReaderView({
  selectedNotice,
  onCloseReader,
  canWriteNotice,
  onTogglePin,
  onDeleteNotice,
  getBadgeStyle,
  formatNoticeDate,
  onVoteOption,
  onReaction,
  commentsTree,
  currentNickname,
  newCommentText,
  setNewCommentText,
  replyingTo,
  setReplyingTo,
  replyText,
  setReplyText,
  onAddComment,
  recentNoticesList,
  onOpenNotice,
}: KerygmaReaderViewProps) {
  const renderCommentNode = (node: CommentItem, depth = 0) => (
    <div
      key={node.id}
      className="space-y-1.5"
      style={{ marginLeft: depth > 0 ? `${Math.min(depth * 20, 60)}px` : "0px" }}
    >
      <div
        className={`p-3 bg-[var(--inner-box)] border border-[var(--panel-border)] rounded-md space-y-1.5 ${
          depth > 0 ? "border-l-2 border-l-[var(--accent)]/50" : ""
        }`}
      >
        <div className="flex justify-between items-center text-[0.7rem]">
          <div className="flex items-center gap-1.5">
            {depth > 0 && <span className="text-[var(--accent)] opacity-70">↳</span>}
            <span className="font-bold text-[var(--text-main)]">{node.author}</span>
            <span className="text-[var(--text-sub)] opacity-50">
              • {formatNoticeDate(node.created_at)}
            </span>
          </div>
          <button
            onClick={() => setReplyingTo(replyingTo === node.id ? null : node.id)}
            className="text-[0.7rem] font-semibold text-[var(--accent)] hover:underline cursor-pointer"
          >
            답글
          </button>
        </div>
        <p className="text-[0.85rem] text-[var(--text-main)] whitespace-pre-wrap leading-relaxed">
          {node.content}
        </p>
      </div>

      {replyingTo === node.id && (
        <div className="ml-4 flex gap-1.5 pt-1">
          <input
            type="text"
            placeholder="답글을 남겨주세요..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            className="flex-1 bg-[var(--inner-box)] border border-[var(--panel-border)] rounded-md px-3 py-1.5 text-[0.8rem] text-[var(--text-main)] outline-none focus:border-[var(--accent)]"
          />
          <button
            onClick={() => onAddComment(node.id)}
            className="bg-[var(--accent)] text-[var(--accent-fg)] text-[0.75rem] font-bold px-3 py-1.5 rounded-md cursor-pointer"
          >
            등록
          </button>
        </div>
      )}

      {node.children && node.children.length > 0 && (
        <div className="space-y-1.5 pt-1">
          {node.children.map((child) => renderCommentNode(child, depth + 1))}
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-[1200px] mx-auto px-4 md:px-6 space-y-4 animate-in fade-in duration-200">
      <div className="flex items-center justify-between border-b border-[var(--panel-border)] pb-3 text-[0.75rem]">
        <button
          onClick={onCloseReader}
          className="flex items-center gap-1.5 text-[var(--text-sub)] hover:text-[var(--text-main)] transition font-semibold group cursor-pointer"
        >
          <span className="transition-transform group-hover:-translate-x-0.5 text-base">←</span>
          <span>목록으로 돌아가기</span>
        </button>
        {canWriteNotice && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onTogglePin(selectedNotice.id, selectedNotice.is_pinned)}
              className="px-3 py-1 rounded-lg text-[0.75rem] font-semibold text-[var(--text-main)] bg-[var(--panel)] border border-[var(--panel-border)] hover:bg-[var(--panel-hover)] cursor-pointer"
            >
              {selectedNotice.is_pinned ? "고정해제" : "상단고정"}
            </button>
            <button
              onClick={() => onDeleteNotice(selectedNotice.id)}
              className="px-3 py-1 rounded-lg text-[0.75rem] font-semibold text-red-400 bg-[var(--panel)] border border-red-500/20 hover:bg-red-500/10 cursor-pointer"
            >
              삭제
            </button>
          </div>
        )}
      </div>

      <div className="bg-[var(--panel)] border border-[var(--panel-border)] rounded-xl overflow-hidden shadow-sm">
        <div className="p-5 md:p-6 border-b border-[var(--panel-border)] space-y-3">
          <div className="flex items-center gap-2">
            <span
              className={`text-[0.75rem] font-bold px-2 py-0.5 rounded bg-[var(--inner-box)] border border-[var(--panel-border)] ${getBadgeStyle(
                selectedNotice.type,
                selectedNotice.is_pinned
              )}`}
            >
              {selectedNotice.type}
            </span>
            {selectedNotice.is_pinned && (
              <span className="text-[0.75rem] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded">
                필독 공지
              </span>
            )}
          </div>

          <h1 className="text-xl md:text-2xl font-bold text-[var(--text-main)] leading-snug tracking-tight">
            {selectedNotice.title}
          </h1>

          <div className="flex items-center justify-between text-[0.75rem] text-[var(--text-sub)] pt-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[var(--text-main)]">{selectedNotice.author}</span>
              <span className="opacity-30">•</span>
              <span>
                {formatNoticeDate(selectedNotice.created_at)}{" "}
                {new Date(selectedNotice.created_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
        </div>

        <div className="p-5 md:p-6 min-h-[200px] text-[0.95rem] text-[var(--text-main)] leading-[1.65] break-words prose-editor">
          <div dangerouslySetInnerHTML={{ __html: selectedNotice.content || "" }} />

          {selectedNotice.poll && (
            <div className="my-5 p-4 bg-[var(--inner-box)] border border-[var(--accent)]/30 rounded-xl space-y-3">
              <div className="flex items-center justify-between text-[0.75rem]">
                <div className="flex items-center gap-1.5">
                  <span className="bg-[var(--accent)] text-[var(--accent-fg)] text-[0.65rem] font-black px-2 py-0.5 rounded">
                    POLL
                  </span>
                  <span className="text-[var(--text-sub)]">
                    {selectedNotice.poll.isAnonymous ? "🔒 익명 투표" : "👁️ 실명 투표"}
                  </span>
                </div>
                <span className="text-[var(--text-sub)]">
                  {selectedNotice.poll.allowMultiple ? "복수선택" : "단일선택"}
                </span>
              </div>

              <h3 className="text-sm font-bold text-[var(--text-main)]">
                {selectedNotice.poll.title}
              </h3>

              <div className="space-y-2">
                {selectedNotice.poll.options.map((opt) => {
                  const totalVotes = selectedNotice.poll!.options.reduce(
                    (acc, cur) => acc + (cur.votes || 0),
                    0
                  );
                  const percent =
                    totalVotes > 0 ? Math.round(((opt.votes || 0) / totalVotes) * 100) : 0;
                  const isSelected = selectedNotice.poll!.userVotes?.includes(opt.id);

                  return (
                    <div
                      key={opt.id}
                      onClick={() => onVoteOption(opt.id)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        isSelected
                          ? "bg-[var(--accent)]/15 border-[var(--accent)]"
                          : "bg-[var(--panel)] border-[var(--panel-border)] hover:border-[var(--text-sub)]/35"
                      }`}
                    >
                      <div className="flex justify-between items-center text-[0.8rem] font-semibold text-[var(--text-main)] mb-1.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-4 h-4 rounded-full border flex items-center justify-center text-[0.65rem] ${
                              isSelected
                                ? "bg-[var(--accent)] border-[var(--accent)] text-white"
                                : "border-zinc-500"
                            }`}
                          >
                            {isSelected ? "✓" : ""}
                          </span>
                          <span>{opt.text}</span>
                        </div>
                        <span className="text-[0.75rem] font-mono text-[var(--text-sub)]">
                          {opt.votes || 0}표 ({percent}%)
                        </span>
                      </div>
                      <div className="w-full bg-[var(--background)] h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-[var(--accent)] h-full transition-all duration-300"
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="px-5 py-3 bg-[var(--inner-box)]/50 border-t border-[var(--panel-border)] flex items-center justify-center gap-3">
          <button
            onClick={() => onReaction("like")}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[0.75rem] font-bold border transition cursor-pointer ${
              selectedNotice.userReaction === "like"
                ? "bg-[var(--accent)] text-[var(--accent-fg)] border-[var(--accent)]"
                : "bg-[var(--panel)] border-[var(--panel-border)] text-[var(--text-main)] hover:bg-[var(--panel-hover)]"
            }`}
          >
            <span>👍 추천</span>
            <span className="font-mono">{selectedNotice.likes || 0}</span>
          </button>
          <button
            onClick={() => onReaction("dislike")}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[0.75rem] font-bold border transition cursor-pointer ${
              selectedNotice.userReaction === "dislike"
                ? "bg-red-500 text-white border-red-500"
                : "bg-[var(--panel)] border-[var(--panel-border)] text-[var(--text-sub)] hover:bg-[var(--panel-hover)]"
            }`}
          >
            <span>👎 비추천</span>
            <span className="font-mono">{selectedNotice.dislikes || 0}</span>
          </button>
        </div>
      </div>

      <div className="bg-[var(--panel)] border border-[var(--panel-border)] rounded-xl p-5 md:p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-[var(--panel-border)] pb-3">
          <span
            className="w-4 h-4 bg-[var(--text-main)] shrink-0 inline-block opacity-85"
            style={{
              maskImage: 'url("/svgs/UI mark/채팅 마크.svg")',
              WebkitMaskImage: 'url("/svgs/UI mark/채팅 마크.svg")',
              maskSize: "contain",
              WebkitMaskSize: "contain",
              maskRepeat: "no-repeat",
              WebkitMaskRepeat: "no-repeat",
              maskPosition: "center",
              WebkitMaskPosition: "center",
            }}
          />
          <h3 className="text-sm font-bold text-[var(--text-main)]">댓글</h3>
        </div>

        <div className="space-y-2">
          {commentsTree.length === 0 ? (
            <p className="text-[0.75rem] text-[var(--text-sub)] text-center py-4">
              첫 번째 댓글을 남겨보세요!
            </p>
          ) : (
            commentsTree.map((comment) => renderCommentNode(comment, 0))
          )}
        </div>

        <div className="pt-3 border-t border-[var(--panel-border)] flex flex-col gap-2">
          <div className="flex items-center justify-between text-[0.7rem] font-semibold text-[var(--text-sub)]">
            <span>
              작성자: <span className="text-[var(--text-main)]">{currentNickname}</span>
            </span>
          </div>
          <textarea
            placeholder="댓글을 남겨주세요..."
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            rows={2}
            className="w-full bg-[var(--inner-box)] border border-[var(--panel-border)] rounded-lg p-3 text-[0.85rem] text-[var(--text-main)] outline-none focus:border-[var(--accent)] resize-none"
          />
          <div className="flex justify-end">
            <button
              onClick={() => onAddComment(null)}
              className="bg-[var(--accent)] hover:bg-[var(--accent-strong)] text-[var(--accent-fg)] text-[0.75rem] font-bold px-4 py-1.5 rounded-lg transition shadow-sm cursor-pointer"
            >
              등록
            </button>
          </div>
        </div>
      </div>

      <div className="bg-[var(--panel)] border border-[var(--panel-border)] rounded-xl p-4 md:p-5 space-y-3">
        <div className="text-[0.8rem] font-bold text-[var(--text-main)] flex items-center justify-between">
          <span>📋 최근 공지사항 빠른 이동</span>
          <span className="text-[0.7rem] font-normal text-[var(--text-sub)]">클릭 시 즉시 이동</span>
        </div>
        <div className="divide-y divide-[var(--panel-border)] border border-[var(--panel-border)] rounded-lg overflow-hidden bg-[var(--inner-box)]/30">
          {recentNoticesList.length === 0 ? (
            <div className="p-3 text-center text-[0.75rem] text-[var(--text-sub)]">
              다른 게시물이 없습니다.
            </div>
          ) : (
            recentNoticesList.map((n) => (
              <div
                key={n.id}
                onClick={() => onOpenNotice(n)}
                className="flex items-center justify-between px-3.5 py-2.5 hover:bg-[var(--panel-hover)] cursor-pointer transition-colors text-[0.8rem]"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <span
                    className={`text-[0.7rem] font-bold shrink-0 ${getBadgeStyle(
                      n.type,
                      n.is_pinned
                    )}`}
                  >
                    {n.is_pinned ? "필독" : n.type}
                  </span>
                  <span className="text-[var(--text-main)] truncate font-medium">{n.title}</span>
                </div>
                <span className="text-[0.7rem] text-[var(--text-sub)] shrink-0 ml-3">
                  {formatNoticeDate(n.created_at)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}