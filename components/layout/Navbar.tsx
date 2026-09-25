"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { NavItem, AccountPreset } from '../../types/layout';
import NotificationInbox from './NotificationInbox';
import SpiritWingsMenu from './SpiritWingsMenu';
import MarkIcon from '@/components/common/MarkIcon';
import { SANCTUM_BETA_VERSION } from '@/lib/release';
import { useNoticeNotifications } from '@/hooks/useNoticeNotifications';

interface NavbarProps {
  headerRef: React.RefObject<HTMLElement | null>;
  showNavbar: boolean;
  banner: { message: string } | null;
  pathname: string;
  navItems: NavItem[];
  wingsRef: React.RefObject<HTMLDivElement | null>;
  isWingsOpen: boolean;
  isNotificationInboxOpen: boolean;
  setIsNotificationInboxOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsWingsOpen: (val: boolean) => void;
  setIsThemeModalOpen: (val: boolean) => void;
  mounted: boolean;
  activeAccount: AccountPreset | null;
  accounts: AccountPreset[];
  accountMenuRef: React.RefObject<HTMLDivElement | null>;
  isAccountMenuOpen: boolean;
  setIsAccountMenuOpen: (val: boolean) => void;
  switchAccount: (acc: AccountPreset) => void;
  pendingCount: number;
  handleLogout: () => void;
}

export default function Navbar({
  headerRef,
  showNavbar,
  banner,
  pathname,
  navItems,
  wingsRef,
  isWingsOpen,
  isNotificationInboxOpen,
  setIsNotificationInboxOpen,
  setIsWingsOpen,
  setIsThemeModalOpen,
  mounted,
  activeAccount,
  accounts,
  accountMenuRef,
  isAccountMenuOpen,
  setIsAccountMenuOpen,
  switchAccount,
  pendingCount,
  handleLogout
}: NavbarProps) {
  const router = useRouter();
  const {
    browserPermission,
    isLoaded: isNotificationsLoaded,
    markAllAsRead,
    markAsRead,
    notifications,
    readIds,
    requestBrowserPermission,
    unreadCount,
  } = useNoticeNotifications(activeAccount?.nickname, activeAccount?.role);

  const toggleWings = () => {
    setIsAccountMenuOpen(false);
    setIsNotificationInboxOpen(false);
    setIsWingsOpen(!isWingsOpen);
  };

  const openThemeSettings = () => {
    setIsWingsOpen(false);
    setIsAccountMenuOpen(false);
    setIsNotificationInboxOpen(false);
    setIsThemeModalOpen(true);
  };

  // 5단계 권한에 따른 가변 아이콘 렌더링 유틸
  const getRoleIcon = (role?: string) => {
    switch (role) {
      case "길드마스터":
      case "master":
        return "👑";
      case "부마스터":
      case "admin":
        return "⚔️";
      case "부마스터 대행":
        return "🛡️";
      case "cbt테스터":
        return "🧪";
      case "길드원":
      case "member":
      default:
        return "🛡️";
    }
  };

  // 🛡️ [보안 권한 제어] 부마스터 대행 이상만 관리자 메뉴 접근 가능
  const canAccessAdmin = (role?: string) => {
    if (!role) return false;
    const allowedRoles = ["길드마스터", "master", "부마스터", "admin", "부마스터 대행"];
    return allowedRoles.includes(role);
  };

  return (
    <nav 
      ref={headerRef} 
      className={`fixed top-0 left-0 right-0 z-[90] flex flex-col shadow-lg border-b backdrop-blur-md w-full transition-transform duration-300 bg-[var(--panel)] border-[var(--panel-border)] ${
        showNavbar ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      {banner && (
        <div className="w-full py-2 bg-red-600 text-white text-center text-xs font-black flex items-center justify-center gap-2 border-b border-red-800">
          <span>🚨</span><span>{banner.message}</span><span>🚨</span>
        </div>
      )}

      <div className="max-w-[1600px] mx-auto px-3 xl:px-4 w-full relative">
        <div className="flex items-center gap-2 xl:gap-3 min-h-[3.5rem] sm:min-h-[4rem] py-1.5 sm:py-2">
          
          {/* 🟢 담백하고 임팩트 있는 SANCTUM 메인 타이포 SVG 로고 (캡슐 배경 제거 & 클릭 시 홈 이동) */}
          <div className="flex items-center shrink-0 w-auto">
            <Link 
              href="/" 
              className="group relative flex w-auto items-center gap-2 rounded-xl py-1.5 pr-1.5 transition-all duration-200 shrink-0 select-none cursor-pointer hover:bg-[var(--accent)]/8"
              title="SANCTUM 메인 홈으로 이동"
            >
              {/* SVG의 800:520 비율을 유지해 문양이 잘리지 않게 표시한다. */}
              <span className="flex shrink-0 flex-col items-center leading-none">
              <span
                aria-hidden="true"
                className="h-10 sm:h-11 w-[3.9rem] sm:w-[4.3rem] shrink-0 bg-[var(--accent)] transition-all duration-300 drop-shadow-[0_0_8px_var(--accent)] group-hover:drop-shadow-[0_0_14px_var(--accent)] group-hover:scale-105 active:scale-95"
                style={{
                  maskImage: `url('/svgs/logo/생텀타이포로고.svg')`,
                  WebkitMaskImage: `url('/svgs/logo/생텀타이포로고.svg')`,
                  maskRepeat: 'no-repeat',
                  WebkitMaskRepeat: 'no-repeat',
                  maskPosition: 'left center',
                  WebkitMaskPosition: 'left center',
                  maskSize: 'contain',
                  WebkitMaskSize: 'contain',
                }}
              />
                <span className="mt-0.5 whitespace-nowrap text-[0.67rem] font-black text-[var(--accent)]">BETA {SANCTUM_BETA_VERSION}</span>
              </span>
              <span className="flex max-[340px]:hidden min-w-0 flex-col leading-none lg:hidden 2xl:flex">
                <strong className="text-[0.8rem] tracking-[0.14em] font-black text-[var(--text-main)]">SANCTUM</strong>
                <span className="mt-1 text-[0.52rem] tracking-[0.08em] font-bold text-[var(--accent)]">성역 길드 전용 플랫폼</span>
              </span>
            </Link>

          </div>

          <div className="hidden lg:flex flex-1 min-w-0 items-center justify-center gap-0.5 2xl:gap-1.5">
            {navItems.map((item) => {
              const isActive = pathname === item.path;
              if (item.comingSoon) {
                return (
                  <div key={item.en} aria-label={`${item.kr} 준비중`} className="relative flex h-11 min-w-0 flex-1 items-center justify-center overflow-hidden rounded-md opacity-75 select-none">
                    <span className="flex flex-col items-center opacity-40" aria-hidden="true">
                      <span className="font-black text-[0.67rem] 2xl:text-[0.75rem] leading-tight whitespace-nowrap text-[var(--text-main)]">{item.kr}</span>
                      <span className="text-[0.5rem] 2xl:text-[0.55rem] font-bold mt-0.5 whitespace-nowrap text-[var(--accent)]">{item.sub}</span>
                    </span>
                    <span className="absolute rounded-md border border-[var(--panel-border)] bg-[var(--panel)] px-1.5 py-0.5 text-[0.6rem] font-black text-[var(--text-main)] whitespace-nowrap">[준비중]</span>
                  </div>
                );
              }
              return (
                <Link
                  key={item.en}
                  href={item.path}
                  aria-label={`${item.kr} · ${item.sub}`}
                  className={`sanctum-nav-link group relative flex min-w-0 flex-1 items-center justify-center overflow-hidden rounded-md h-11 px-1 transition-colors focus-visible:outline-2 focus-visible:outline-[var(--accent)] ${
                    isActive ? 'bg-[var(--panel-hover)] border-b-2 shadow-sm border-[var(--accent)]' : 'hover:bg-[var(--panel-hover)]/50'
                  }`}
                >
                  <span className="sanctum-nav-primary flex flex-col items-center">
                    <span className="font-black text-[0.67rem] 2xl:text-[0.75rem] leading-tight whitespace-nowrap text-[var(--text-main)]">{item.kr}</span>
                    <span className="text-[0.5rem] 2xl:text-[0.55rem] font-bold mt-0.5 whitespace-nowrap text-[var(--accent)]">{item.sub}</span>
                  </span>
                  <span aria-hidden="true" className="sanctum-nav-reveal absolute inset-0 flex items-center justify-center">
                    <span className="font-black tracking-[0.08em] text-[0.55rem] xl:text-[0.62rem] 2xl:text-[0.7rem] whitespace-nowrap text-[var(--accent)]">{item.en}</span>
                  </span>
                </Link>
              );
            })}
          </div>

          <div className="ml-auto flex items-center gap-1.5 xl:gap-2 relative shrink-0">
            <SpiritWingsMenu
              isOpen={isWingsOpen}
              menuRef={wingsRef}
              onToggle={toggleWings}
              onClose={() => setIsWingsOpen(false)}
            />
            <button 
              onClick={openThemeSettings}
              className="hidden sm:flex w-8 h-8 sm:w-9 sm:h-9 border rounded-xl transition cursor-pointer items-center justify-center shadow-sm border-[var(--panel-border)] hover:border-[var(--accent)] hover:scale-105 text-base select-none bg-[var(--inner-box)] shrink-0"
              title="생텀 페이지 설정"
              aria-label="생텀 페이지 설정 열기"
            >
              <MarkIcon src="/svgs/UI mark/테마 팔레트 마크.svg" size="lg" colorClass="bg-[var(--accent)]" />
            </button>

            <NotificationInbox
              browserPermission={browserPermission}
              isOpen={isNotificationInboxOpen}
              isLoaded={isNotificationsLoaded}
              markAllAsRead={markAllAsRead}
              markAsRead={markAsRead}
              notifications={notifications}
              onClose={() => setIsNotificationInboxOpen(false)}
              onOpenNotice={(notification) => {
                setIsNotificationInboxOpen(false);
                if (notification.href) router.push(notification.href);
              }}
              onToggle={() => {
                setIsWingsOpen(false);
                setIsAccountMenuOpen(false);
                setIsNotificationInboxOpen((current) => !current);
              }}
              readIds={readIds}
              requestBrowserPermission={requestBrowserPermission}
              unreadCount={unreadCount}
            />

            {mounted && activeAccount ? (
              <div className="relative shrink-0" ref={accountMenuRef}>
                <button onClick={() => { setIsWingsOpen(false); setIsNotificationInboxOpen(false); setIsAccountMenuOpen(!isAccountMenuOpen); }} aria-label={`${activeAccount.nickname} 계정 메뉴`} aria-expanded={isAccountMenuOpen} aria-controls="sanctum-account-menu" className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full border transition shadow-md whitespace-nowrap bg-[var(--panel)] hover:bg-[var(--panel-hover)] text-[var(--text-main)] border-[var(--accent)] cursor-pointer shrink-0">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[0.65rem] shrink-0 bg-[var(--inner-box)] text-[var(--text-main)]">
                    {getRoleIcon(activeAccount.role)}
                  </div>
                  <div className="max-[420px]:hidden flex flex-col text-left leading-tight whitespace-normal min-w-0">
                    <span className="text-[0.68rem] sm:text-[0.72rem] font-bold max-w-[80px] xs:max-w-[110px] sm:max-w-[140px] break-all text-[var(--text-main)]">
                      {activeAccount.alias || activeAccount.nickname}
                    </span>
                    <span className="text-[0.67rem] text-[var(--accent)] mt-0.5 break-keep">
                      {activeAccount.role || "길드원"}
                    </span>
                  </div>
                  <span className="text-[0.67rem] text-[var(--text-sub)] ml-0.5">▼</span>
                </button>

                {isAccountMenuOpen && (
                  <div id="sanctum-account-menu" className="absolute right-0 mt-2 w-[min(18rem,calc(100vw-1.5rem))] max-h-[calc(100dvh-5rem)] overflow-y-auto border rounded-2xl shadow-2xl z-[130] p-2 bg-[var(--panel)] border-[var(--panel-border)] text-[var(--text-main)]">
                    <div className="text-[0.67rem] font-bold text-[var(--text-sub)] px-2 py-1">현재 활성 계정</div>
                    <div className="flex items-center justify-between p-2 rounded-lg mb-2 border-l-4 bg-[var(--inner-box)] border-[var(--accent)]">
                      <div className="flex flex-col min-w-0">
                        <span className="text-[0.7rem] font-black break-all text-[var(--text-main)]">{activeAccount.alias || activeAccount.nickname}</span>
                        <span className="text-[0.67rem] text-[var(--accent)] mt-0.5">{activeAccount.role || "길드원"}</span>
                      </div>
                      <span className="text-[0.67rem] bg-[var(--accent)]/20 text-[var(--accent)] px-1.5 py-0.5 rounded shrink-0">선택됨</span>
                    </div>

                    {accounts.filter(a => a.id !== activeAccount.id).length > 0 && (
                      <>
                        <div className="text-[0.67rem] font-bold text-[var(--text-sub)] px-2 py-1 border-t border-[var(--panel-border)] mt-1">계정 빠른 스위칭</div>
                        {accounts.filter(a => a.id !== activeAccount.id).map(acc => (
                          <button key={acc.id} onClick={() => switchAccount(acc)} className="w-full flex items-center justify-between p-2 rounded-lg text-left transition my-0.5 hover:bg-[var(--panel-hover)] text-[var(--text-sub)] hover:text-[var(--text-main)] cursor-pointer">
                            <div className="flex flex-col min-w-0">
                              <span className="text-[0.7rem] font-bold break-all">{acc.alias || acc.nickname}</span>
                              <span className="text-[0.67rem] text-[var(--text-sub)]">{acc.role || "길드원"}</span>
                            </div>
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: acc.borderColor }}></span>
                          </button>
                        ))}
                      </>
                    )}

                    <div className="border-t border-[var(--panel-border)] mt-2 pt-1 flex flex-col gap-1">
                      <Link href="/login" onClick={() => setIsAccountMenuOpen(false)} className="w-full text-center text-[0.7rem] font-bold text-[var(--accent)] hover:bg-[var(--panel-hover)] py-2.5 rounded transition">➕ 계정 추가 로그인</Link>
                      
                      {/* 부마스터 대행 이상 권한 보유자에게만 노출되는 SANCTUM 관리자 링크 */}
                      {canAccessAdmin(activeAccount.role) && (
                        <Link href="/admin" onClick={() => setIsAccountMenuOpen(false)} className="w-full text-center text-[0.7rem] font-bold text-[var(--text-sub)] hover:text-[var(--text-main)] hover:bg-[var(--panel-hover)] py-2.5 rounded transition flex items-center justify-center gap-1 border border-[var(--accent)]/20 hover:border-[var(--accent)]/50 bg-[var(--inner-box)]">
                          ⚙️ SANCTUM 관리자 
                          {pendingCount > 0 && (
                            <span className="bg-red-500 text-white px-1.5 py-0.5 rounded-full text-[0.67rem] font-black animate-pulse">
                              {pendingCount}
                            </span>
                          )}
                        </Link>
                      )}

                      <button onClick={handleLogout} className="w-full text-center text-[0.7rem] font-bold text-red-400 hover:bg-red-950/30 py-2.5 rounded transition cursor-pointer">🚪 현재 계정 로그아웃</button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login" className="text-[0.68rem] sm:text-[0.72rem] font-bold text-[var(--accent)] hover:opacity-80 whitespace-nowrap px-1">로그인</Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
