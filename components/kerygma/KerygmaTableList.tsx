"use client";

import { Notice, LINK_ONLY_CATEGORIES } from "@/types/kerygma";

interface KerygmaTableListProps {
  isLoading: boolean;
  notices: Notice[];
  onOpenNotice: (notice: Notice) => void;
  formatNoticeDate: (dateStr: string) => string;
  getBadgeStyle: (type: string, isPinned: boolean) => string;
}

export default function KerygmaTableList({
  isLoading,
  notices,
  onOpenNotice,
  formatNoticeDate,
  getBadgeStyle,
}: KerygmaTableListProps) {
  if (isLoading) {
    return (
      <div className="w-full bg-[var(--panel)] border border-[var(--panel-border)] rounded-2xl p-8 text-center text-xs text-[var(--text-sub)] animate-pulse shadow-sm">
        <div className="inline-block w-5 h-5 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin mb-2" />
        <p>케리그마 공지사항을 불러오는 중입니다...</p>
      </div>
    );
  }

  if (notices.length === 0) {
    return (
      <div className="w-full bg-[var(--panel)] border border-[var(--panel-border)] rounded-2xl p-12 text-center text-xs text-[var(--text-sub)] shadow-sm">
        등록된 게시글이 없습니다.
      </div>
    );
  }

  return (
    <div className="w-full bg-[var(--panel)] border border-[var(--panel-border)] rounded-2xl shadow-sm overflow-hidden">
      {/* 🎯 컬럼 헤더 제거 -> 2줄 카드/블럭형 리스트 구조 */}
      <div className="divide-y divide-[var(--panel-border)]">
        {notices.map((notice) => {
          const isLink = notice.link || LINK_ONLY_CATEGORIES.includes(notice.type);
          const badgeText = notice.is_pinned ? "📌 필독" : notice.type;

          return (
            <div
              key={notice.id}
              onClick={() => onOpenNotice(notice)}
              className="px-3.5 sm:px-4 py-3 hover:bg-[var(--panel-hover)] transition cursor-pointer flex flex-col gap-1.5 group"
            >
              {/* 1행: [좌측 분류 뱃지] + [우측 작성자 & 작성일] */}
              <div className="flex items-center justify-between gap-2 w-full">
                {/* 좌측: 분류 뱃지 (shrink-0 적용으로 명칭 절대로 안 잘림) */}
                <span
                  className={`px-2 py-0.5 rounded text-[10.5px] sm:text-xs font-semibold shrink-0 whitespace-nowrap border bg-[var(--inner-box)] ${getBadgeStyle(
                    notice.type,
                    notice.is_pinned
                  )}`}
                >
                  {badgeText}
                </span>

                {/* 우측: 작성자 + 작성일 */}
                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 text-[11px] sm:text-xs text-[var(--text-sub)]">
                  <span className="font-medium text-[var(--text-main)]">
                    {notice.author}
                  </span>
                  <span className="opacity-40">•</span>
                  <span className="opacity-80">
                    {formatNoticeDate(notice.created_at)}
                  </span>
                </div>
              </div>

              {/* 2행: 공지 제목 (시인성 극대화 및 자연스러운 Truncate 방어) */}
              <div className="flex items-center gap-1.5 min-w-0 w-full pt-0.5">
                <span className="text-xs sm:text-sm font-semibold text-[var(--text-main)] truncate group-hover:text-[var(--accent)] transition leading-snug">
                  {notice.title}
                </span>
                {isLink && (
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/30 px-1 py-0.2 rounded shrink-0 whitespace-nowrap">
                    🔗
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}