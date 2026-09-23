"use client";

import { useEffect, useRef, useState } from "react";
import { SanctumNotification } from "@/hooks/useNoticeNotifications";
import MarkIcon from "@/components/common/MarkIcon";

interface NotificationInboxProps {
  browserPermission: NotificationPermission | "unsupported";
  isOpen: boolean;
  isLoaded: boolean;
  markAllAsRead: () => void;
  markAsRead: (id: number) => void;
  notifications: SanctumNotification[];
  onClose: () => void;
  onOpenNotice: (notification: SanctumNotification) => void;
  onToggle: () => void;
  readIds: number[];
  requestBrowserPermission: () => Promise<NotificationPermission | "unsupported">;
  unreadCount: number;
}

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "방금 전";
  return new Intl.DateTimeFormat("ko-KR", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

export default function NotificationInbox({
  browserPermission,
  isOpen,
  isLoaded,
  markAllAsRead,
  markAsRead,
  notifications,
  onClose,
  onOpenNotice,
  onToggle,
  readIds,
  requestBrowserPermission,
  unreadCount,
}: NotificationInboxProps) {
  const inboxRef = useRef<HTMLDivElement>(null);
  const [isPermissionHelpOpen, setIsPermissionHelpOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (inboxRef.current && !inboxRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  const browserNotificationLabel =
    browserPermission === "granted"
      ? "브라우저 알림 켜짐"
      : browserPermission === "denied"
        ? "브라우저 설정에서 알림을 허용해 주세요"
        : browserPermission === "unsupported"
          ? "이 브라우저에서는 알림을 지원하지 않습니다"
          : "브라우저 알림 켜기";

  const canRequestPermission = browserPermission === "default";
  const needsBrowserSettings = browserPermission === "denied";

  return (
    <div ref={inboxRef} className="relative shrink-0">
      <button
        type="button"
        onClick={onToggle}
        className="relative flex w-8 h-8 sm:w-9 sm:h-9 border rounded-xl transition cursor-pointer items-center justify-center shadow-sm border-[var(--panel-border)] hover:border-[var(--accent)] hover:scale-105 text-[var(--accent)] bg-[var(--inner-box)] shrink-0"
        title={unreadCount > 0 ? `읽지 않은 알림 ${unreadCount}개` : "알림함"}
        aria-label="알림함 열기"
        aria-expanded={isOpen}
        aria-controls="sanctum-notification-inbox"
      >
        <MarkIcon src="/svgs/UI mark/우편함 마크.svg" size="lg" scale={1} maskZoom={3.8} colorClass="bg-[var(--accent)]" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[0.55rem] leading-4 font-black shadow-sm">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div id="sanctum-notification-inbox" className="fixed sm:absolute right-3 sm:right-0 top-16 sm:top-full mt-2 w-[min(28rem,calc(100vw-24px))] max-h-[calc(100dvh-5rem)] overflow-hidden flex flex-col rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] shadow-2xl z-[120]">
          <div className="flex items-start justify-between gap-2 px-3 sm:px-4 py-3 border-b border-[var(--panel-border)] bg-[var(--panel)] shrink-0">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[1rem] font-black tracking-tight text-[var(--text-main)]">알림함</h2>
                {browserPermission === "granted" && (
                  <span className="inline-flex items-center rounded-full border border-emerald-400/40 bg-emerald-400/10 px-2 py-0.5 text-[0.62rem] font-black text-emerald-400">
                    🔔 알림 허용됨
                  </span>
                )}
              </div>
              <p className="text-[0.7rem] font-medium text-[var(--text-sub)] mt-0.5">새 공지와 시스템 업데이트를 알려드립니다.</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {unreadCount > 0 && (
                <button type="button" onClick={markAllAsRead} className="text-[0.7rem] font-black px-2 py-1 rounded-md text-[var(--accent)] hover:bg-[var(--accent)]/10 cursor-pointer">
                  모두 읽음
                </button>
              )}
              <button type="button" onClick={onClose} className="w-7 h-7 rounded-lg text-[var(--text-sub)] hover:bg-[var(--accent)]/10 hover:text-[var(--accent)] cursor-pointer" aria-label="알림함 닫기">✕</button>
            </div>
          </div>

          {browserPermission !== "granted" && (
          <div className="p-2.5 border-b border-[var(--panel-border)] bg-[var(--inner-box)] overflow-y-auto shrink min-h-0">
            <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 rounded-lg bg-[var(--panel)] text-[var(--text-main)] border border-[var(--accent)]/35">
              <span className="min-w-0 text-[0.75rem] font-black break-keep">🔔 {browserNotificationLabel}</span>
              {canRequestPermission && (
                <button
                  type="button"
                  onClick={() => void requestBrowserPermission()}
                  className="shrink-0 px-2.5 py-1.5 rounded-md text-[0.7rem] font-black bg-[var(--accent)] text-[var(--accent-fg)] hover:opacity-90 active:scale-95 transition cursor-pointer"
                >
                  허용하기
                </button>
              )}
              {needsBrowserSettings && (
                <button
                  type="button"
                  onClick={() => setIsPermissionHelpOpen((current) => !current)}
                  className="shrink-0 px-2.5 py-1.5 rounded-md text-[0.7rem] font-black border border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)]/10 active:scale-95 transition cursor-pointer"
                >
                  설정 방법
                </button>
              )}
            </div>

            {isPermissionHelpOpen && needsBrowserSettings && (
              <div className="mt-2 rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] px-3 py-2.5 text-[0.68rem] leading-relaxed text-[var(--text-sub)]">
                <p className="font-black text-[var(--text-main)]">브라우저에서 한 번 차단되어 설정에서 바꿔야 합니다.</p>
                <ol className="mt-1.5 list-decimal pl-4 space-y-1">
                  <li>주소창 왼쪽의 사이트 정보 아이콘(자물쇠/슬라이더)을 누릅니다.</li>
                  <li><strong className="text-[var(--text-main)]">사이트 설정</strong> 또는 <strong className="text-[var(--text-main)]">권한</strong>을 엽니다.</li>
                  <li><strong className="text-[var(--text-main)]">알림</strong>을 <strong className="text-[var(--accent)]">허용</strong>으로 바꾸고 SANCTUM을 새로고침합니다.</li>
                </ol>
                <p className="mt-2">모바일도 브라우저 주소창의 사이트 정보 → 권한 → 알림에서 허용할 수 있습니다. 기기와 브라우저마다 메뉴 이름은 조금 다를 수 있습니다.</p>
              </div>
            )}

            <p className="px-1 pt-2 text-[0.65rem] leading-relaxed text-[var(--text-sub)]">브라우저 알림은 직접 허용한 경우에만, SANCTUM을 열어 둔 동안 새 공지가 등록되면 표시됩니다.</p>
          </div>
          )}

          <div className="min-h-0 flex-1 overflow-y-auto custom-scrollbar p-2">
            {!isLoaded ? (
              <div className="px-3 py-8 text-center text-[0.8rem] text-[var(--text-sub)]">알림을 불러오는 중...</div>
            ) : notifications.length === 0 ? (
              <div className="px-3 py-8 text-center text-[0.8rem] text-[var(--text-sub)]">새 알림이 없습니다.</div>
            ) : (
              notifications.map((notification) => (
                <button
                  type="button"
                  key={notification.id}
                  onClick={() => {
                    markAsRead(notification.id);
                    onOpenNotice(notification);
                  }}
                  className="w-full text-left p-3 rounded-xl transition hover:bg-[var(--accent)]/10 cursor-pointer border border-transparent hover:border-[var(--accent)]/35"
                >
                  <div className="flex items-start gap-2">
                    <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${readIds.includes(notification.id) ? "bg-transparent" : "bg-[var(--accent)]"}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[0.65rem] font-black text-[var(--accent)]">{notification.type}</span>
                        {notification.is_pinned && <span className="text-[0.65rem] font-black text-rose-400">필독</span>}
                      </div>
                      <p className="mt-1 text-[0.85rem] font-black text-[var(--text-main)] break-keep">{notification.title}</p>
                      <p className="mt-1 text-[0.65rem] font-medium text-[var(--text-sub)]">{notification.author} · {formatDate(notification.created_at)}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
