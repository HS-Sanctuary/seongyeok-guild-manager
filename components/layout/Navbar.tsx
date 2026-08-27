"use client";

import Link from 'next/link';
import { NavItem, AccountPreset } from '../../types/layout';

interface NavbarProps {
  headerRef: React.RefObject<HTMLElement | null>;
  showNavbar: boolean;
  banner: any;
  pathname: string;
  navItems: NavItem[];
  wingsRef: React.RefObject<HTMLDivElement | null>;
  isWingsOpen: boolean;
  setIsWingsOpen: (val: boolean) => void;
  setIsThemeModalOpen: (val: boolean) => void;
  mounted: boolean;
  activeAccount: AccountPreset | null;
  accounts: AccountPreset[];
  accountMenuRef: React.RefObject<HTMLDivElement | null>;
  isAccountMenuOpen: boolean;
  setIsAccountMenuOpen: (val: boolean) => void;
  switchAccount: (acc: AccountPreset) => void;
  isAdmin: boolean;
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
  setIsWingsOpen,
  setIsThemeModalOpen,
  mounted,
  activeAccount,
  accounts,
  accountMenuRef,
  isAccountMenuOpen,
  setIsAccountMenuOpen,
  switchAccount,
  isAdmin,
  pendingCount,
  handleLogout
}: NavbarProps) {
  return (
    <nav 
      ref={headerRef} 
      className={`fixed top-0 left-0 right-0 z-[900] flex flex-col shadow-lg border-b backdrop-blur-md w-full transition-transform duration-300 bg-[var(--panel)] border-[var(--panel-border)] ${
        showNavbar ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      {banner && (
        <div className="w-full py-2 bg-red-600 text-white text-center text-xs font-black flex items-center justify-center gap-2 border-b border-red-800">
          <span>🚨</span><span>{banner.message}</span><span>🚨</span>
        </div>
      )}

      <div className="max-w-[1600px] mx-auto px-3 xl:px-4 w-full relative">
        <div className="flex items-center justify-between min-h-[3.5rem] sm:min-h-[4rem] py-1.5 sm:py-2">
          
          <div className="flex items-center gap-2 xl:gap-3 shrink-0">
            <Link href="/" className="flex items-center gap-2 xl:gap-3 hover:opacity-80 transition-opacity shrink-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shadow-lg transition-colors border border-black/10 relative overflow-hidden shrink-0 bg-[var(--accent)] text-[var(--accent-fg)]">
                <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent"></div>
                <svg className="w-4 h-4 sm:w-5 sm:h-5 fill-current relative z-10 drop-shadow-sm text-[var(--accent-fg)]" viewBox="0 0 24 24">
                  <path d="M12 1L15.39 8.26L23 9.27L17.5 14.14L18.81 21.02L12 17.77L5.19 21.02L6.5 14.14L1 9.27L8.61 8.26L12 1Z" />
                </svg>
              </div>
              <div className="flex flex-col whitespace-nowrap">
                <span className="text-[0.52rem] sm:text-[0.58rem] font-bold tracking-tight text-[var(--text-sub)]">
                  데이안 성역 길드 전용 플랫폼
                </span>
                <span className="font-black text-base sm:text-lg leading-none tracking-wider mt-0.5 text-[var(--text-main)]">
                  SANCTUM
                </span>
              </div>
            </Link>

            {/* 정령의 날개 버튼 */}
            <div className="relative z-[100] ml-0.5 xl:ml-1 shrink-0" ref={wingsRef}>
              <button 
                onClick={() => setIsWingsOpen(!isWingsOpen)}
                className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl border transition-all duration-200 hover:scale-110 active:scale-95 bg-[var(--inner-box)] border-[var(--panel-border)] hover:border-[var(--accent)] shadow-sm text-base sm:text-lg select-none cursor-pointer"
                title="정령의 날개 (빠른 이동)"
              >
                🪽
              </button>

              {isWingsOpen && (
                <div className="fixed sm:absolute top-16 sm:top-full left-4 right-4 sm:right-auto sm:left-0 mt-2 sm:w-[260px] max-w-[calc(100vw-32px)] bg-[var(--panel)] p-1 rounded-xl shadow-[0_0_20px_rgba(0,0,0,0.8)] border border-[var(--panel-border)] animate-in fade-in slide-in-from-top-2 z-[9999]">
                  <div className="relative border border-[var(--accent)] rounded-lg h-full w-full flex flex-col bg-[var(--panel)]">
                    <div className="p-3 border-b border-[var(--panel-border)] flex justify-between items-start">
                      <div className="flex flex-col items-start">
                        <h3 className="font-black text-[1.1rem] tracking-tight text-[var(--accent)] flex items-center gap-1">
                          정령의 날개
                        </h3>
                        <p className="text-[var(--text-sub)] text-[0.7rem] font-bold mt-1"><span className="text-[var(--accent)]">고급</span> 재화</p>
                      </div>
                      <div className="w-10 h-10 relative flex items-center justify-center text-2xl select-none">🪽</div>
                    </div>
                    
                    <div className="p-3 bg-[var(--inner-box)] rounded-b-lg">
                      <p className="text-[0.65rem] text-[var(--text-sub)] leading-relaxed mb-4 break-keep font-medium">
                        정령의 힘이 담긴 날개 모양의 장식품.<br/>
                        바람의 정령을 불러내 먼 거리를<br/>빠르게 이동하는데 사용한다.
                      </p>
                      <div className="flex flex-col gap-1.5">
                        <a href="https://mabinogimobile.nexon.com/Main" target="_blank" rel="noreferrer" className="bg-[var(--panel-hover)] hover:opacity-90 text-[var(--text-main)] text-[0.7rem] font-bold py-2 px-2.5 rounded flex justify-between items-center transition border border-[var(--panel-border)] group">
                          <div className="flex items-center gap-2">
                            <img src="https://www.google.com/s2/favicons?domain=mabinogimobile.nexon.com&sz=32" alt="로고" className="w-4 h-4 rounded-sm" />
                            공식 홈페이지
                          </div>
                          <span className="text-[var(--text-sub)] group-hover:text-[var(--accent)] transition text-[0.6rem]">↗</span>
                        </a>
                        <a href="https://mabimobi.life/" target="_blank" rel="noreferrer" className="bg-[var(--panel-hover)] hover:opacity-90 text-[var(--text-main)] text-[0.7rem] font-bold py-2 px-2.5 rounded flex justify-between items-center transition border border-[var(--panel-border)] group">
                          <div className="flex items-center gap-2">
                            <img src="https://www.google.com/s2/favicons?domain=mabimobi.life&sz=32" alt="로고" className="w-4 h-4 rounded-sm" />
                            모비라이프
                          </div>
                          <span className="text-[var(--text-sub)] group-hover:text-[var(--accent)] transition text-[0.6rem]">↗</span>
                        </a>
                        <a href="https://arca.live/b/mabimobile" target="_blank" rel="noreferrer" className="bg-[var(--panel-hover)] hover:opacity-90 text-[var(--text-main)] text-[0.7rem] font-bold py-2 px-2.5 rounded flex justify-between items-center transition border border-[var(--panel-border)] group">
                          <div className="flex items-center gap-2 min-w-0">
                            <img src="https://www.google.com/s2/favicons?domain=arca.live&sz=32" alt="로고" className="w-4 h-4 rounded-sm shrink-0" />
                            <span className="truncate">모비 채널 <span className="text-[0.6rem] text-[var(--text-sub)]">(아카라이브)</span></span>
                          </div>
                          <span className="text-[var(--text-sub)] group-hover:text-[var(--accent)] transition text-[0.6rem] shrink-0">↗</span>
                        </a>
                        <a href="https://gall.dcinside.com/mgallery/board/lists/?id=enban" target="_blank" rel="noreferrer" className="bg-[var(--panel-hover)] hover:opacity-90 text-[var(--text-main)] text-[0.7rem] font-bold py-2 px-2.5 rounded flex justify-between items-center transition border border-[var(--panel-border)] group">
                          <div className="flex items-center gap-2 min-w-0">
                            <img src="https://www.google.com/s2/favicons?domain=gall.dcinside.com&sz=32" alt="로고" className="w-4 h-4 rounded-sm shrink-0" />
                            <span className="truncate">에반 갤러리 <span className="text-[0.6rem] text-[var(--text-sub)]">(디시)</span></span>
                          </div>
                          <span className="text-[var(--text-sub)] group-hover:text-[var(--accent)] transition text-[0.6rem] shrink-0">↗</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="hidden lg:flex items-center space-x-0.5 xl:space-x-2">
            {navItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.en}
                  href={item.path}
                  className={`group relative flex items-center justify-center rounded-md transition-all overflow-hidden h-11 px-2 xl:px-3.5 shrink-0 ${
                    isActive ? 'bg-[var(--panel-hover)] border-b-2 shadow-sm border-[var(--accent)]' : 'hover:bg-[var(--panel-hover)]/50'
                  }`}
                >
                  <div className="flex flex-col items-center transition-transform duration-300 transform group-hover:-translate-y-12">
                    <span className="font-black text-[0.68rem] xl:text-[0.75rem] leading-tight whitespace-nowrap text-[var(--text-main)]">{item.kr}</span>
                    <span className="text-[0.52rem] xl:text-[0.55rem] font-bold mt-0.5 whitespace-nowrap text-[var(--accent)]">{item.sub}</span>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center transition-all duration-300 transform translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100">
                    <span className="font-black tracking-widest text-[0.62rem] xl:text-[0.7rem] whitespace-nowrap text-[var(--accent)]">{item.en}</span>
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-1.5 xl:gap-2.5 relative shrink-0">
            <button 
              onClick={() => setIsThemeModalOpen(true)}
              className="hidden sm:flex w-8 h-8 sm:w-9 sm:h-9 border rounded-xl transition cursor-pointer items-center justify-center shadow-sm border-[var(--panel-border)] hover:border-[var(--accent)] hover:scale-105 text-base select-none bg-[var(--inner-box)] shrink-0"
              title="생텀 페이지 설정"
            >
              🎨
            </button>

            <div 
              className="flex w-8 h-8 sm:w-9 sm:h-9 border rounded-xl transition cursor-pointer items-center justify-center shadow-sm border-[var(--panel-border)] hover:border-[var(--accent)] hover:scale-105 text-[var(--accent)] bg-[var(--inner-box)] shrink-0" 
              title="메일함"
            >
              <svg className="w-4 h-4 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
              </svg>
            </div>

            {mounted && activeAccount ? (
              <div className="relative shrink-0" ref={accountMenuRef}>
                <button onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)} className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full border transition shadow-md whitespace-nowrap bg-[var(--panel)] hover:bg-[var(--panel-hover)] text-[var(--text-main)] border-[var(--accent)] cursor-pointer shrink-0">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[0.65rem] shrink-0 bg-[var(--inner-box)] text-[var(--text-main)]">👑</div>
                  <div className="flex flex-col text-left leading-none whitespace-nowrap min-w-0">
                    <span className="text-[0.68rem] sm:text-[0.72rem] font-bold flex items-center gap-1 max-w-[80px] xs:max-w-[110px] sm:max-w-[140px] truncate text-[var(--text-main)]">{activeAccount.alias || activeAccount.nickname}</span>
                    <span className="text-[0.52rem] sm:text-[0.58rem] text-[var(--accent)] mt-0.5">{activeAccount.role}</span>
                  </div>
                  <span className="text-[0.52rem] sm:text-[0.58rem] text-[var(--text-sub)] ml-0.5">▼</span>
                </button>

                {isAccountMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 border rounded-xl shadow-2xl z-[960] overflow-hidden p-2 bg-[var(--panel)] border-[var(--panel-border)] text-[var(--text-main)]">
                    <div className="text-[0.55rem] font-bold text-[var(--text-sub)] px-2 py-1">현재 활성 계정</div>
                    <div className="flex items-center justify-between p-2 rounded-lg mb-2 border-l-4 bg-[var(--inner-box)] border-[var(--accent)]">
                      <span className="text-[0.7rem] font-black truncate text-[var(--text-main)]">{activeAccount.alias || activeAccount.nickname}</span>
                      <span className="text-[0.55rem] bg-[var(--accent)]/20 text-[var(--accent)] px-1.5 py-0.5 rounded shrink-0">선택됨</span>
                    </div>

                    {accounts.filter(a => a.id !== activeAccount.id).length > 0 && (
                      <>
                        <div className="text-[0.55rem] font-bold text-[var(--text-sub)] px-2 py-1 border-t border-[var(--panel-border)] mt-1">계정 빠른 스위칭</div>
                        {accounts.filter(a => a.id !== activeAccount.id).map(acc => (
                          <button key={acc.id} onClick={() => switchAccount(acc)} className="w-full flex items-center justify-between p-2 rounded-lg text-left transition my-0.5 hover:bg-[var(--panel-hover)] text-[var(--text-sub)] hover:text-[var(--text-main)] cursor-pointer">
                            <span className="text-[0.7rem] font-bold truncate">{acc.alias || acc.nickname}</span>
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: acc.borderColor }}></span>
                          </button>
                        ))}
                      </>
                    )}

                    <div className="border-t border-[var(--panel-border)] mt-2 pt-1 flex flex-col gap-1">
                      <Link href="/login" className="w-full text-center text-[0.7rem] font-bold text-[var(--accent)] hover:bg-[var(--panel-hover)] py-1.5 rounded transition">➕ 계정 추가 로그인</Link>
                      {isAdmin && <Link href="/admin" className="w-full text-center text-[0.7rem] font-bold text-[var(--text-sub)] hover:text-[var(--text-main)] hover:bg-[var(--panel-hover)] py-1.5 rounded transition flex items-center justify-center gap-1">⚙️ SANCTUM 관리자 {pendingCount > 0 && <span className="bg-red-500 text-white px-1.5 py-0.2 rounded-full text-[0.55rem]">{pendingCount}</span>}</Link>}
                      <button onClick={handleLogout} className="w-full text-center text-[0.7rem] font-bold text-red-400 hover:bg-red-950/30 py-1.5 rounded transition cursor-pointer">🚪 현재 계정 로그아웃</button>
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