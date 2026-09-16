"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Notice, CommentItem } from "@/types/kerygma";
import ClassIcon from "@/components/common/ClassIcon";

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
  setReplyingTo: (val: number | null) => void;
  replyText: string;
  setReplyText: (val: string) => void;
  onAddComment: (parentId?: number | null) => void;
  recentNoticesList: Notice[];
  onOpenNotice: (notice: Notice) => void;
}

interface ReaderRecord {
  nickname: string;
  read_at: string;
}

// 🎯 [Supabase public.characters 실시간 DB 전수 매핑 매트릭스]
const SUPABASE_CHARACTERS_JOB_MAP: Record<string, string> = {
  한설: "댄서",
  영겁: "화염술사",
  순월: "검술사",
  쌍월: "장궁병",
  먀치: "기사",
  탄월: "도적",
  제스: "사제",
  신파랑: "대검전사",
  수도사는수도사: "수도사",
  화연: "힐러",
  조로의일대삼천대천세계: "검술사",
  전당포아저씨: "궁수",
  황충의딸깍: "기사",
  사스케의딸깍: "전격술사",
  스쿠나의딸깍: "암흑술사",
  엘비라: "도적",
  가열: "빙결술사",
  일명: "화염술사",
  화선연: "장궁병",
  옛날사골곰탕: "석궁사수",
  참이맛감자탕: "듀얼블레이드",
  곰탕맛솜사탕: "격투가",
  GOMTANG: "화염술사",
  반달곰탕: "검술사",
  치즈닭도리탕: "장궁병",
  맛춘법: "장궁병",
  김당지: "석궁사수",
  최당지: "음유시인",
  정당지: "마법사",
  웰스토리젓가락도둑: "전사",
  화라비: "대검전사",
  즐기시와요: "격투가",
  밤설: "힐러",
  거월: "대검전사",
  겸설: "사제",
  한떨: "빙결술사",
  젼설: "석궁사수",
  뉴월: "격투가",
  주십쇼: "궁수",
  오십쇼: "빙결술사",
  ynara: "악사",
  우찬아: "빙결술사",
  Hideonbush: "화염술사",
  Keria: "궁수",
  새벽별l: "힐러",
  이얼굴이안보이니내놓으쇼: "수도사",
  타이틀내놓오시오: "격투가",
  자십쇼: "전격술사",
  가십쇼: "암흑술사",
};

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
  const router = useRouter();
  const [readers, setReaders] = useState<ReaderRecord[]>([]);
  const [showReaders, setShowReaders] = useState(false);

  // 🎯 [작성자 직책 권한 감지 유틸]
  const getAuthorRoleBadge = (authorName: string) => {
    if (!authorName) return null;

    let role = "";
    if (authorName === "한설") {
      role = "길드마스터";
    } else if (typeof window !== "undefined") {
      try {
        const accounts = JSON.parse(localStorage.getItem("sanctum_accounts") || "[]");
        const userAcc = accounts.find((a: any) => a.nickname === authorName);
        if (userAcc) role = userAcc.role || "";
      } catch (e) {}
    }

    if (authorName === "한설" || role === "길드마스터" || role === "마스터") {
      return (
        <span className="px-2 py-0.5 text-[10px] font-extrabold bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded shadow-sm inline-flex items-center gap-1">
          👑 길드마스터
        </span>
      );
    }

    if (role === "부길드마스터" || role === "부마스터" || role === "submaster") {
      return (
        <span className="px-2 py-0.5 text-[10px] font-extrabold bg-blue-500/20 text-blue-400 border border-blue-500/40 rounded shadow-sm inline-flex items-center gap-1">
          🛡️ 부마스터
        </span>
      );
    }

    return null;
  };

  // 🎯 [대표 캐릭터 닉네임 & 직업(job) 정밀 파싱 유틸]
  const getRepresentativeCharacterInfo = (accountName: string) => {
    if (SUPABASE_CHARACTERS_JOB_MAP[accountName]) {
      return {
        charName: accountName,
        mainClass: SUPABASE_CHARACTERS_JOB_MAP[accountName],
      };
    }

    if (typeof window !== "undefined") {
      try {
        const allChars = JSON.parse(
          localStorage.getItem("sanctum_characters_mock_db") ||
            localStorage.getItem("nexus_characters") ||
            "[]"
        );

        const userChar = allChars.find(
          (c: any) =>
            c.nickname === accountName ||
            c.name === accountName ||
            c.owner === accountName
        );

        if (userChar) {
          return {
            charName: userChar.nickname || userChar.name || accountName,
            mainClass: userChar.job || userChar.main_class || userChar.class || "전사",
          };
        }
      } catch (e) {}
    }

    return { charName: accountName, mainClass: "전사" };
  };

  // 🎯 [열람 기록 동기화]
  useEffect(() => {
    if (!selectedNotice) return;
    const storageKey = `sanctum_notice_readers_${selectedNotice.id}`;
    const existing: ReaderRecord[] = JSON.parse(
      localStorage.getItem(storageKey) || "[]"
    );

    if (currentNickname && currentNickname !== "방문자") {
      const alreadyRead = existing.some((r) => r.nickname === currentNickname);
      if (!alreadyRead) {
        const updated = [
          ...existing,
          { nickname: currentNickname, read_at: new Date().toISOString() },
        ];
        localStorage.setItem(storageKey, JSON.stringify(updated));
        setReaders(updated);
        return;
      }
    }
    setReaders(existing);
  }, [selectedNotice.id, currentNickname]);

  const isLiked = selectedNotice.userReaction === "like";

  const formatTimeShort = (isoStr: string) => {
    if (!isoStr) return "";
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return "";
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${mm}.${dd} ${hh}:${min}`;
  };

  return (
    <div className="max-w-[1400px] mx-auto px-3 sm:px-4 md:px-6 space-y-4 sm:space-y-6 animate-fadeIn pb-12">
      {/* 1. 상단 액션 바 */}
      <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3 border-b border-[var(--panel-border)] pb-3">
        <button
          onClick={onCloseReader}
          className="px-3 py-1.5 bg-[var(--inner-box)] hover:bg-[var(--panel-hover)] border border-[var(--panel-border)] hover:border-[var(--accent)] text-[var(--text-main)] text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-sm cursor-pointer active:scale-95"
        >
          <span className="text-sm">←</span>
          <span>목록으로 돌아가기</span>
        </button>

        {canWriteNotice && (
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => onTogglePin(selectedNotice.id, selectedNotice.is_pinned)}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg border text-xs font-bold transition cursor-pointer ${
                selectedNotice.is_pinned
                  ? "bg-red-500/20 border-red-500/50 text-red-400"
                  : "bg-[var(--inner-box)] border-[var(--panel-border)] text-[var(--text-sub)] hover:text-[var(--text-main)]"
              }`}
            >
              {selectedNotice.is_pinned ? "📌 고정해제" : "📌 상단고정"}
            </button>

            <button
              onClick={() => router.push(`/kerygma/write?editId=${selectedNotice.id}`)}
              className="px-2.5 sm:px-3 py-1.5 bg-[var(--inner-box)] hover:bg-[var(--panel-hover)] border border-[var(--panel-border)] hover:border-[var(--accent)] text-[var(--text-main)] text-xs font-bold rounded-lg transition cursor-pointer"
            >
              ✏️ 수정
            </button>

            <button
              onClick={() => onDeleteNotice(selectedNotice.id)}
              className="px-2.5 sm:px-3 py-1.5 bg-red-950/40 hover:bg-red-900/60 border border-red-800/60 text-red-300 text-xs font-bold rounded-lg transition cursor-pointer"
            >
              🗑️ 삭제
            </button>
          </div>
        )}
      </div>

      {/* 2. 본문 카드 */}
      <div className="bg-[var(--panel)] border border-[var(--panel-border)] rounded-xl p-4 sm:p-5 md:p-7 shadow-lg space-y-4 sm:space-y-6">
        {/* Header Area */}
        <div className="border-b border-[var(--panel-border)] pb-4 space-y-2">
          <div className="flex items-center gap-2">
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full border border-[var(--panel-border)] font-bold bg-[var(--inner-box)] ${getBadgeStyle(
                selectedNotice.type,
                selectedNotice.is_pinned
              )}`}
            >
              {selectedNotice.type}
            </span>
          </div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-[var(--text-main)] break-all leading-tight">
            {selectedNotice.title}
          </h1>

          {/* 작성자 닉네임 & 직책 뱃지 배치 */}
          <div className="flex items-center gap-2 text-xs text-[var(--text-sub)] pt-1 flex-wrap">
            <span className="font-bold text-[var(--text-main)] flex items-center gap-1.5">
              {getAuthorRoleBadge(selectedNotice.author)}
              <span>{selectedNotice.author}</span>
            </span>
            <span>•</span>
            <span>{formatNoticeDate(selectedNotice.created_at)}</span>
          </div>

          {/* 🔐 [관리자 전용: 읽은 길드원 목록 패널] */}
          {canWriteNotice && (
            <div className="mt-3 bg-[var(--inner-box)]/80 border border-[var(--panel-border)] rounded-lg p-2.5 sm:p-3 text-xs shadow-inner">
              <div
                className="flex items-center justify-between cursor-pointer select-none"
                onClick={() => setShowReaders(!showReaders)}
              >
                <span className="font-bold text-xs sm:text-sm text-[var(--accent)] tracking-tight">
                  읽은 길드원 목록 ({readers.length}명)
                </span>
                <span className="text-[11px] text-[var(--text-sub)] font-medium">
                  {showReaders ? "접기 ▲" : "펼치기 ▼"}
                </span>
              </div>

              {showReaders && (
                <div className="mt-2 pt-2 border-t border-[var(--panel-border)] flex flex-wrap gap-1.5 sm:gap-2 max-h-44 overflow-y-auto custom-scrollbar">
                  {readers.length === 0 ? (
                    <span className="text-[var(--text-sub)] text-[11px]">
                      아직 읽은 길드원이 없습니다.
                    </span>
                  ) : (
                    readers.map((r) => {
                      const { charName, mainClass } = getRepresentativeCharacterInfo(r.nickname);
                      return (
                        <div
                          key={r.nickname}
                          className="px-2 py-1 bg-[var(--panel)] border border-[var(--panel-border)] hover:border-[var(--accent)]/50 rounded-md text-[11px] sm:text-xs font-medium text-[var(--text-main)] flex items-center gap-1.5 shadow-sm transition"
                        >
                          {/* 🎯 [ClassIcon job 속성 전달 및 size 타입 충돌 해결] */}
                          <ClassIcon job={mainClass} size="sm" />
                          <span className="font-bold text-[11px] sm:text-xs text-[var(--text-main)] truncate max-w-[100px]">
                            {charName}
                          </span>
                          <span className="text-[9.5px] sm:text-[10px] text-[var(--text-sub)] font-normal shrink-0">
                            ({formatTimeShort(r.read_at)})
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Content Area */}
        <div
          className="prose-editor min-h-[160px] text-[var(--text-main)] text-sm md:text-base leading-relaxed break-words overflow-x-auto"
          dangerouslySetInnerHTML={{ __html: selectedNotice.content }}
        />

        {/* Poll Option */}
        {selectedNotice.poll && (
          <div className="p-3 sm:p-4 bg-[var(--inner-box)] border border-[var(--panel-border)] rounded-xl space-y-3 my-4">
            <h3 className="font-bold text-sm text-[var(--text-main)] flex items-center gap-2">
              <span>📊</span>
              <span>{selectedNotice.poll.title}</span>
            </h3>
            <div className="space-y-2">
              {selectedNotice.poll.options.map((opt) => {
                const userVoted = selectedNotice.poll?.userVotes?.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    onClick={() => onVoteOption(opt.id)}
                    className={`w-full p-2.5 rounded-lg border text-left text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                      userVoted
                        ? "bg-[var(--accent)]/15 border-[var(--accent)] text-[var(--text-main)]"
                        : "bg-[var(--panel)] border-[var(--panel-border)] text-[var(--text-sub)] hover:border-[var(--text-sub)]"
                    }`}
                  >
                    <span className="break-all pr-2">{opt.text}</span>
                    <span className="text-[11px] font-bold shrink-0">
                      {opt.votes || 0}표 {userVoted && "✓"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 좋아요 버튼 */}
        <div className="flex justify-center pt-4 pb-2">
          <button
            onClick={() => onReaction("like")}
            className={`px-6 py-2.5 rounded-full border transition-all flex items-center gap-2 font-bold text-xs shadow-md cursor-pointer active:scale-95 ${
              isLiked
                ? "bg-red-500/15 border-red-500/60 text-red-400 scale-105"
                : "bg-[var(--inner-box)] border-[var(--panel-border)] text-[var(--text-sub)] hover:border-red-400/40 hover:text-red-400"
            }`}
          >
            <span
              className={`text-base transition-transform ${
                isLiked ? "scale-125 animate-pulse" : ""
              }`}
            >
              {isLiked ? "❤️" : "🤍"}
            </span>
            <span>좋아요 {selectedNotice.likes || 0}</span>
          </button>
        </div>
      </div>

      {/* 3. 댓글 섹션 */}
      <div className="bg-[var(--panel)] border border-[var(--panel-border)] rounded-xl p-4 sm:p-5 md:p-7 shadow-lg space-y-4 sm:space-y-5">
        <h3 className="text-base font-bold text-[var(--text-main)] flex items-center gap-2 border-b border-[var(--panel-border)] pb-3">
          <span>💬</span>
          <span>댓글</span>
        </h3>

        {/* Comments Tree */}
        <div className="space-y-3">
          {commentsTree.length === 0 ? (
            <p className="text-xs text-[var(--text-sub)] text-center py-6">
              첫 번째 댓글을 남겨보세요!
            </p>
          ) : (
            commentsTree.map((comment) => (
              <div
                key={comment.id}
                className="p-3 sm:p-3.5 bg-[var(--inner-box)] border border-[var(--panel-border)] rounded-lg space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[var(--text-main)] flex items-center gap-1">
                    <span>👤</span> {comment.author}
                  </span>
                  <span className="text-[10px] text-[var(--text-sub)]">
                    {formatTimeShort(comment.created_at)}
                  </span>
                </div>
                <p className="text-[var(--text-main)] break-words leading-normal">
                  {comment.content}
                </p>

                <button
                  onClick={() =>
                    setReplyingTo(replyingTo === comment.id ? null : comment.id)
                  }
                  className="text-[11px] text-[var(--accent)] font-bold hover:underline cursor-pointer"
                >
                  {replyingTo === comment.id ? "답글 취소" : "답글 달기"}
                </button>

                {comment.children && comment.children.length > 0 && (
                  <div className="pl-3 sm:pl-4 border-l-2 border-[var(--accent)]/40 space-y-2 mt-2 pt-1">
                    {comment.children.map((child) => (
                      <div
                        key={child.id}
                        className="p-2 sm:p-2.5 bg-[var(--panel)] border border-[var(--panel-border)] rounded space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[var(--text-main)] flex items-center gap-1">
                            <span>↳ 👤</span> {child.author}
                          </span>
                          <span className="text-[10px] text-[var(--text-sub)]">
                            {formatTimeShort(child.created_at)}
                          </span>
                        </div>
                        <p className="text-[var(--text-main)] break-words">
                          {child.content}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {replyingTo === comment.id && (
                  <div className="mt-2 pt-2 border-t border-[var(--panel-border)] flex gap-2">
                    <input
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="답글을 남겨주세요..."
                      className="flex-1 bg-[var(--panel)] border border-[var(--panel-border)] rounded px-3 py-1.5 text-xs text-[var(--text-main)] focus:border-[var(--accent)] outline-none"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") onAddComment(comment.id);
                      }}
                    />
                    <button
                      onClick={() => onAddComment(comment.id)}
                      className="px-3 py-1.5 bg-[var(--accent)] text-[var(--accent-fg)] text-xs font-bold rounded hover:opacity-90 transition cursor-pointer"
                    >
                      등록
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* New Comment Input */}
        <div className="pt-3 border-t border-[var(--panel-border)] space-y-2">
          <div className="text-xs text-[var(--text-sub)] font-semibold">
            작성자: <span className="text-[var(--text-main)] font-bold">{currentNickname}</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <textarea
              rows={2}
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              placeholder="댓글을 남겨주세요..."
              className="w-full bg-[var(--inner-box)] border border-[var(--panel-border)] rounded-lg p-3 text-xs text-[var(--text-main)] focus:border-[var(--accent)] outline-none resize-none custom-scrollbar"
            />
            <button
              onClick={() => onAddComment(null)}
              className="sm:w-20 py-2 sm:py-0 bg-[var(--accent)] text-[var(--accent-fg)] text-xs font-bold rounded-lg hover:opacity-90 transition shadow cursor-pointer shrink-0"
            >
              등록
            </button>
          </div>
        </div>
      </div>

      {/* 4. 최근 게시글 미리보기 */}
      {recentNoticesList.length > 0 && (
        <div className="bg-[var(--panel)] border border-[var(--panel-border)] rounded-xl p-4 sm:p-5 shadow-lg space-y-3">
          <h4 className="text-xs font-bold text-[var(--text-sub)] uppercase tracking-wider">
            다른 게시글 목록
          </h4>
          <div className="divide-y divide-[var(--panel-border)]">
            {recentNoticesList.map((rn) => (
              <div
                key={rn.id}
                onClick={() => onOpenNotice(rn)}
                className="py-2.5 flex items-center justify-between text-xs hover:bg-[var(--inner-box)] px-2 rounded transition cursor-pointer"
              >
                <div className="flex items-center gap-2 truncate pr-2">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-bold shrink-0 ${getBadgeStyle(
                      rn.type,
                      rn.is_pinned
                    )}`}
                  >
                    {rn.type}
                  </span>
                  <span className="text-[var(--text-main)] font-medium truncate">
                    {rn.title}
                  </span>
                </div>
                <span className="text-[10px] text-[var(--text-sub)] shrink-0">
                  {formatNoticeDate(rn.created_at)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}