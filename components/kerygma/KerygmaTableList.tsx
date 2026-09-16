"use client";

import { Notice } from "@/types/kerygma";

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
  return (
    <div className="bg-[var(--panel)] rounded-xl border border-[var(--panel-border)] overflow-hidden shadow-sm">
      {/* 🎯 모바일 최적화 콤팩트 테이블 헤더 */}
      <div className="flex items-center justify-between px-2 sm:px-4 py-2 sm:py-3 bg-[var(--inner-box)] border-b border-[var(--panel-border)] text-[9px] sm:text-[0.7rem] font-semibold text-[var(--text-sub)] select-none">
        <div className="w-[55px] sm:w-[110px] shrink-0 text-center">분류</div>
        <div className="flex-1 min-w-0 px-2 sm:px-3 text-left">제목</div>
        <div className="w-[45px] sm:w-[85px] shrink-0 text-center">작성자</div>
        <div className="w-[50px] sm:w-[90px] shrink-0 text-center">작성일</div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-40 text-[var(--text-sub)] text-[11px] sm:text-[0.8rem]">
          데이터 로드 중...
        </div>
      ) : notices.length === 0 ? (
        <div className="flex justify-center items-center h-40 text-[var(--text-sub)] text-[11px] sm:text-[0.8rem]">
          등록된 게시글이 없습니다.
        </div>
      ) : (
        <div className="flex flex-col">
          {notices.map((notice) => (
            <div
              key={notice.id}
              onClick={() => onOpenNotice(notice)}
              className="flex items-center justify-between px-2 sm:px-4 py-2.5 sm:py-3 border-b border-[var(--panel-border)] hover:bg-[var(--panel-hover)] cursor-pointer transition-colors group last:border-0 text-[11px] sm:text-[0.85rem]"
            >
              {/* 분류 */}
              <div className="w-[55px] sm:w-[110px] shrink-0 text-center flex justify-center items-center overflow-hidden">
                <span
                  className={`text-[8.5px] sm:text-[0.7rem] font-bold px-1 sm:px-2 py-0.5 rounded border border-[var(--panel-border)] whitespace-nowrap truncate w-full sm:w-auto mx-0.5 sm:mx-0 ${getBadgeStyle(
                    notice.type,
                    notice.is_pinned
                  )}`}
                >
                  {notice.is_pinned ? "필독" : notice.type}
                </span>
              </div>

              {/* 제목 */}
              <div className="flex-1 min-w-0 px-2 sm:px-3 flex items-center gap-1.5 sm:gap-2 overflow-hidden">
                <h3
                  className={`truncate whitespace-nowrap text-[11px] sm:text-[0.85rem] ${
                    notice.is_pinned
                      ? "font-bold text-[var(--text-main)]"
                      : "font-medium text-[var(--text-sub)] group-hover:text-[var(--text-main)]"
                  }`}
                >
                  {notice.title}
                </h3>
                {notice.poll && (
                  <span className="text-[8px] sm:text-[0.65rem] bg-[var(--accent)]/15 text-[var(--accent)] px-1 sm:px-1.5 py-0.5 rounded font-semibold shrink-0 whitespace-nowrap">
                    📊투표
                  </span>
                )}
              </div>

              {/* 작성자 */}
              <div className="w-[45px] sm:w-[85px] shrink-0 text-center text-[9.5px] sm:text-[0.75rem] text-[var(--text-sub)] truncate whitespace-nowrap font-medium px-0.5">
                {notice.author}
              </div>

              {/* 작성일 */}
              <div className="w-[50px] sm:w-[90px] shrink-0 text-center text-[9px] sm:text-[0.75rem] text-[var(--text-sub)] opacity-75 font-mono truncate whitespace-nowrap">
                {formatNoticeDate(notice.created_at)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}