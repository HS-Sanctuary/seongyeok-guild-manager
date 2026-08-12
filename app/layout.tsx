"use client";

import './globals.css';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

interface NavItem {
  en: string;
  kr: string;
  sub: string;
  path: string;
}

interface AccountPreset {
  id: string;
  nickname: string;
  role: string;
  alias: string;
  borderColor: string;
  theme: string;
}

const navItems: NavItem[] = [
  { en: 'KERYGMA', kr: '케리그마', sub: '공지사항', path: '/notice' },
  { en: 'CHRONOS', kr: '크로노스', sub: '캐릭터 관리', path: '/character' },
  { en: 'AGORA', kr: '아고라', sub: '길드 라운지', path: '/lounge' },
  { en: 'EMPORION', kr: '엠포리온', sub: '거래소 정보', path: '/market' },
  { en: 'SYNAXIS', kr: '시낙시스', sub: '파티 매칭', path: '/party' },
  { en: 'GNOSIS', kr: '그노시스', sub: '정보 공유', path: '/gnosis' },
  { en: 'LOGOS', kr: '로고스', sub: '문의/건의', path: '/support' },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [accounts, setAccounts] = useState<AccountPreset[]>([]);
  const [activeAccount, setActiveAccount] = useState<AccountPreset | null>(null);

  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isMobileAccountMenuOpen, setIsMobileAccountMenuOpen] = useState(false);
  const [isWingsOpen, setIsWingsOpen] = useState(false);
  
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [tempTheme, setTempTheme] = useState('aureum');

  const [isFabOpen, setIsFabOpen] = useState(false);
  const [fabPosition, setFabPosition] = useState<{ x: number }>({ x: 20 });
  const [fontSizeLevel, setFontSizeLevel] = useState('normal');
  
  const dragStartX = useRef(0);
  const startFabX = useRef(0);
  const hasMoved = useRef(false);

  const sheetDragStartY = useRef(0);
  const sheetCurrentDeltaY = useRef(0);
  const [sheetTranslateY, setSheetTranslateY] = useState(0);
  const [isDraggingSheet, setIsDraggingSheet] = useState(false);

  const wingsRef = useRef<HTMLDivElement>(null);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  const [pendingCount, setPendingCount] = useState(0);
  const [banner, setBanner] = useState<any>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (wingsRef.current && !wingsRef.current.contains(event.target as Node)) {
        setIsWingsOpen(false);
      }
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setIsAccountMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    setMounted(true);
    const savedFont = localStorage.getItem('nexus_font_size') || 'normal';
    setFontSizeLevel(savedFont);
    loadAccounts();

    const handleAccountChange = () => {
      loadAccounts();
    };
    window.addEventListener("sanctum_account_changed", handleAccountChange);
    return () => window.removeEventListener("sanctum_account_changed", handleAccountChange);
  }, []);

  useEffect(() => {
    if (activeAccount?.theme) {
      document.documentElement.setAttribute('data-theme', activeAccount.theme);
    } else {
      document.documentElement.setAttribute('data-theme', 'aureum');
    }
  }, [activeAccount]);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem('nexus_font_size', fontSizeLevel);
    const root = document.documentElement;
    if (fontSizeLevel === 'large') {
      root.style.fontSize = '22px';
    } else if (fontSizeLevel === 'small') {
      root.style.fontSize = '18px';
    } else {
      root.style.fontSize = '20px';
    }
  }, [fontSizeLevel, mounted]);

  const loadAccounts = () => {
    try {
      const oldUser = localStorage.getItem("nexus_user");
      const savedAccounts = localStorage.getItem("sanctum_accounts");
      const savedActiveId = localStorage.getItem("sanctum_active_account_id");

      let parsedAccounts: AccountPreset[] = [];
      if (savedAccounts) {
        try {
          parsedAccounts = JSON.parse(savedAccounts);
        } catch (e) {}
      }

      if ((!parsedAccounts || parsedAccounts.length === 0) && oldUser) {
        const parsedOld = JSON.parse(oldUser);
        parsedAccounts = [{
          id: 'default-id',
          nickname: parsedOld.nickname || "한설",
          role: parsedOld.role || "마스터",
          alias: parsedOld.alias || parsedOld.nickname || "한설이네",
          borderColor: parsedOld.borderColor || "#E6C788",
          theme: parsedOld.theme || "aureum"
        }];
        localStorage.setItem("sanctum_accounts", JSON.stringify(parsedAccounts));
        localStorage.setItem("sanctum_active_account_id", parsedAccounts[0].id);
      }

      setAccounts(parsedAccounts);
      if (parsedAccounts.length > 0) {
        const current = parsedAccounts.find(a => a.id === savedActiveId) || parsedAccounts[0];
        setActiveAccount(current);
        setTempTheme(current.theme || 'aureum');
      }
    } catch (e) {
      console.error("Account parse error", e);
    }
  };

  const switchAccount = (acc: AccountPreset) => {
    setActiveAccount(acc);
    setTempTheme(acc.theme || 'aureum');

    localStorage.setItem("sanctum_active_account_id", acc.id);
    localStorage.setItem("nexus_user", JSON.stringify({ 
      nickname: acc.nickname, 
      alias: acc.alias, 
      role: acc.role,
      borderColor: acc.borderColor,
      theme: acc.theme 
    }));
    setIsAccountMenuOpen(false);
    setIsMobileAccountMenuOpen(false);
    setIsFabOpen(false);
    window.dispatchEvent(new CustomEvent("sanctum_account_changed", { detail: acc }));
  };

  const handleSaveThemeSettings = () => {
    if (!activeAccount) return;
    
    const updatedAccounts = accounts.map(acc => {
      if (acc.id === activeAccount.id) {
        return {
          ...acc,
          theme: tempTheme
        };
      }
      return acc;
    });

    setAccounts(updatedAccounts);
    localStorage.setItem("sanctum_accounts", JSON.stringify(updatedAccounts));
    
    const updatedCurrent = updatedAccounts.find(a => a.id === activeAccount.id) || null;
    setActiveAccount(updatedCurrent);
    if (updatedCurrent) {
      document.documentElement.setAttribute('data-theme', updatedCurrent.theme || 'aureum');
      window.dispatchEvent(new CustomEvent("sanctum_account_changed", { detail: updatedCurrent }));
    }

    setIsThemeModalOpen(false);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    dragStartX.current = e.clientX;
    startFabX.current = fabPosition.x;
    hasMoved.current = false;

    const onPointerMove = (moveEvent: PointerEvent) => {
      const deltaX = dragStartX.current - moveEvent.clientX;
      if (Math.abs(deltaX) > 4) {
        hasMoved.current = true;
      }
      if (hasMoved.current) {
        let newX = startFabX.current + deltaX;
        if (newX < 20) newX = 20;
        if (newX > window.innerWidth - 130) newX = window.innerWidth - 130;
        setFabPosition({ x: newX });
      }
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  const handleSheetDragStart = (e: React.PointerEvent) => {
    sheetDragStartY.current = e.clientY;
    sheetCurrentDeltaY.current = 0;
    setIsDraggingSheet(true);

    const onPointerMove = (moveEvent: PointerEvent) => {
      const deltaY = moveEvent.clientY - sheetDragStartY.current;
      if (deltaY > 0) {
        sheetCurrentDeltaY.current = deltaY;
        setSheetTranslateY(deltaY);
      }
    };

    const onPointerUp = () => {
      setIsDraggingSheet(false);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);

      if (sheetCurrentDeltaY.current > 80) {
        setIsFabOpen(false);
      }
      setSheetTranslateY(0);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  const handleHomeClick = () => {
    if (hasMoved.current) return;
    router.push('/');
    setIsFabOpen(false);
  };

  const handleMenuClick = () => {
    if (hasMoved.current) return;
    setIsFabOpen(!isFabOpen);
  };

  useEffect(() => {
    if (activeAccount && (activeAccount.nickname === "한설" || activeAccount.role === "마스터")) {
      checkPendingInquiries();
      const interval = setInterval(checkPendingInquiries, 10000);
      return () => clearInterval(interval);
    }
  }, [activeAccount]);

  const checkPendingInquiries = async () => {
    const { count, error } = await supabase.from('inquiries').select('*', { count: 'exact', head: true }).eq('status', '대기중');
    if (!error && count !== null) setPendingCount(count);
  };

  useEffect(() => {
    const fetchBanner = async () => {
      try {
        const { data, error } = await supabase.from('nexus_banners').select('*').eq('is_active', true);
        if (!error && data && data.length > 0) {
          setBanner(data.sort((a, b) => b.id - a.id)[0]);
        } else {
          setBanner(null);
        }
      } catch (err) {}
    };
    fetchBanner();
    const bannerInterval = setInterval(fetchBanner, 5000);
    return () => clearInterval(bannerInterval);
  }, []);

  const handleLogout = () => {
    if (!activeAccount) return;
    const remaining = accounts.filter(a => a.id !== activeAccount.id);
    setAccounts(remaining);
    localStorage.setItem("sanctum_accounts", JSON.stringify(remaining));

    if (remaining.length > 0) {
      switchAccount(remaining[0]);
    } else {
      setActiveAccount(null);
      localStorage.removeItem("nexus_user");
      localStorage.removeItem("sanctum_active_account_id");
      router.push("/login");
    }
  };

  if (pathname === '/login') return <html lang="ko"><body>{children}</body></html>;

  const isAdmin = activeAccount?.nickname === "한설" || activeAccount?.role === "마스터";

  return (
    <html lang="ko">
      <body className="min-h-screen relative font-sans transition-colors duration-200 bg-[var(--background)] text-[var(--foreground)]">
        
        <nav className="sticky top-0 z-[900] flex flex-col shadow-lg border-b backdrop-blur-md w-full transition-colors bg-[var(--panel)] border-[var(--panel-border)]">
          {banner && (
            <div className="w-full py-2 bg-red-600 text-white text-center text-xs font-black flex items-center justify-center gap-2 border-b border-red-800">
              <span>🚨</span><span>{banner.message}</span><span>🚨</span>
            </div>
          )}

          <div className="max-w-[1600px] mx-auto px-4 w-full relative">
            <div className="flex items-center justify-between h-20">
             
              {/* 로고 영역 */}
              <div className="flex items-center gap-3 shrink-0">
                <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity shrink-0">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-colors border border-black/10 relative overflow-hidden shrink-0 bg-[var(--accent)] text-[var(--accent-fg)]">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent"></div>
                    <svg className="w-6 h-6 fill-current relative z-10 drop-shadow-sm text-[var(--accent-fg)]" viewBox="0 0 24 24">
                      <path d="M12 1L15.39 8.26L23 9.27L17.5 14.14L18.81 21.02L12 17.77L5.19 21.02L6.5 14.14L1 9.27L8.61 8.26L12 1Z" />
                    </svg>
                  </div>
                  <div className="flex flex-col whitespace-nowrap">
                    <span className="text-[0.55rem] font-bold tracking-tight text-[var(--text-sub)]">데이안 성역 길드 전용 플랫폼</span>
                    <span className="font-black text-xl leading-tight tracking-wider mt-0.5 text-[var(--text-main)]">SANCTUM</span>
                  </div>
                </Link>

                {/* 🪽 정령의 날개 버튼 (이모지 배지 적용) */}
                <div className="relative z-[100] ml-1" ref={wingsRef}>
                  <button 
                    onClick={() => setIsWingsOpen(!isWingsOpen)}
                    className="flex items-center justify-center w-9 h-9 rounded-xl border transition-all duration-200 hover:scale-110 active:scale-95 bg-[var(--inner-box)] border-[var(--panel-border)] hover:border-[var(--accent)] shadow-sm text-lg select-none"
                    title="정령의 날개 (빠른 이동)"
                  >
                    🪽
                  </button>

                  {isWingsOpen && (
                    <div className="fixed sm:absolute top-20 left-4 right-4 sm:right-auto sm:left-0 sm:top-full mt-2 sm:w-[260px] max-w-[calc(100vw-32px)] bg-[var(--panel)] p-1 rounded-xl shadow-[0_0_20px_rgba(0,0,0,0.8)] border border-[var(--panel-border)] animate-in fade-in slide-in-from-top-2 z-[9999]">
                      <div className="relative border border-[var(--accent)] rounded-lg h-full w-full flex flex-col bg-[var(--panel)]">
                        <div className="p-3 border-b border-[var(--panel-border)] flex justify-between items-start">
                          <div>
                            <h3 className="font-black text-[1.1rem] tracking-tight text-[var(--accent)] flex items-center gap-1">
                              🪽 정령의 날개
                            </h3>
                            <p className="text-[var(--text-sub)] text-[0.7rem] font-bold mt-1"><span className="text-[var(--accent)]">고급</span> 재화</p>
                          </div>
                          <div className="w-10 h-10 relative flex items-center justify-center text-2xl select-none">
                            🪽
                          </div>
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
                              <div className="flex items-center gap-2">
                                <img src="https://www.google.com/s2/favicons?domain=arca.live&sz=32" alt="로고" className="w-4 h-4 rounded-sm" />
                                모비 채널 <span className="text-[0.6rem] font-normal text-[var(--text-sub)]">(아카라이브)</span>
                              </div>
                              <span className="text-[var(--text-sub)] group-hover:text-[var(--accent)] transition text-[0.6rem]">↗</span>
                            </a>
                            <a href="https://gall.dcinside.com/mgallery/board/lists/?id=enban" target="_blank" rel="noreferrer" className="bg-[var(--panel-hover)] hover:opacity-90 text-[var(--text-main)] text-[0.7rem] font-bold py-2 px-2.5 rounded flex justify-between items-center transition border border-[var(--panel-border)] group">
                              <div className="flex items-center gap-2">
                                <img src="https://www.google.com/s2/favicons?domain=gall.dcinside.com&sz=32" alt="로고" className="w-4 h-4 rounded-sm" />
                                에반 갤러리 <span className="text-[0.6rem] font-normal text-[var(--text-sub)]">(디시)</span>
                              </div>
                              <span className="text-[var(--text-sub)] group-hover:text-[var(--accent)] transition text-[0.6rem]">↗</span>
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 네비게이션 메뉴 */}
              <div className="hidden lg:flex items-center space-x-2 xl:space-x-3">
                {navItems.map((item) => {
                  const isActive = pathname === item.path;
                  return (
                    <Link
                      key={item.en}
                      href={item.path}
                      className={`group relative flex items-center justify-center rounded-md transition-all overflow-hidden h-12 px-3 lg:px-4 shrink-0 ${
                        isActive 
                          ? 'bg-[var(--panel-hover)] border-b-2 shadow-sm border-[var(--accent)]' 
                          : 'hover:bg-[var(--panel-hover)]/50'
                      }`}
                    >
                      <div className="flex flex-col items-center transition-transform duration-300 transform group-hover:-translate-y-12">
                        <span className="font-black text-[0.7rem] xl:text-[0.75rem] leading-tight whitespace-nowrap text-[var(--text-main)]">{item.kr}</span>
                        <span className="text-[0.5rem] font-bold mt-0.5 whitespace-nowrap text-[var(--accent)]">{item.sub}</span>
                      </div>
                      
                      <div className="absolute inset-0 flex items-center justify-center transition-all duration-300 transform translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100">
                        <span className="font-black tracking-widest text-[0.65rem] xl:text-[0.7rem] whitespace-nowrap text-[var(--accent)]">{item.en}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* 우측 유틸리티 버튼 */}
              <div className="hidden lg:flex items-center gap-2.5 relative shrink-0">
                
                {/* 🎨 테마 설정 버튼 (팔레트 이모지 적용) */}
                <button 
                  onClick={() => setIsThemeModalOpen(true)}
                  className="w-9 h-9 border rounded-xl transition cursor-pointer flex items-center justify-center shadow-sm bg-[var(--inner-box)] border-[var(--panel-border)] hover:border-[var(--accent)] hover:scale-105 text-base select-none"
                  title="생텀 테마 설정"
                >
                  🎨
                </button>

                {/* 🩷 메일함 버튼 */}
                <div className="w-9 h-9 border rounded-xl transition cursor-pointer flex items-center justify-center shadow-sm bg-[var(--inner-box)] border-[var(--panel-border)] hover:border-[var(--accent)] hover:scale-105 text-[var(--accent)]" title="메일함 (목업)">
                  <svg className="w-4 h-4 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                  </svg>
                </div>

                {mounted ? (
                  activeAccount ? (
                    <div className="relative" ref={accountMenuRef}>
                      <button onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)} className="flex items-center gap-2 px-3.5 py-2 rounded-full border transition shadow-md whitespace-nowrap bg-[var(--panel)] hover:bg-[var(--panel-hover)] text-[var(--text-main)] border-[var(--accent)]">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[0.65rem] shrink-0 bg-[var(--inner-box)] text-[var(--text-main)]">👑</div>
                        <div className="flex flex-col text-left leading-none whitespace-nowrap">
                          <span className="text-[0.7rem] font-bold flex items-center gap-1 max-w-[120px] truncate text-[var(--text-main)]">{activeAccount.alias || activeAccount.nickname}</span>
                          <span className="text-[0.55rem] text-[var(--accent)] mt-0.5">{activeAccount.role}</span>
                        </div>
                        <span className="text-[0.55rem] text-[var(--text-sub)] ml-1">▼</span>
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
                                <button key={acc.id} onClick={() => switchAccount(acc)} className="w-full flex items-center justify-between p-2 rounded-lg text-left transition my-0.5 hover:bg-[var(--panel-hover)] text-[var(--text-sub)] hover:text-[var(--text-main)]">
                                  <span className="text-[0.7rem] font-bold truncate">{acc.alias || acc.nickname}</span>
                                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: acc.borderColor }}></span>
                                </button>
                              ))}
                            </>
                          )}

                          <div className="border-t border-[var(--panel-border)] mt-2 pt-1 flex flex-col gap-1">
                            <Link href="/login" className="w-full text-center text-[0.7rem] font-bold text-[var(--accent)] hover:bg-[var(--panel-hover)] py-1.5 rounded transition">➕ 계정 추가 로그인</Link>
                            {isAdmin && <Link href="/admin" className="w-full text-center text-[0.7rem] font-bold text-[var(--text-sub)] hover:text-[var(--text-main)] hover:bg-[var(--panel-hover)] py-1.5 rounded transition">⚙️ SANCTUM 관리자 {pendingCount > 0 && <span className="bg-red-500 text-white px-1.5 py-0.2 rounded-full text-[0.55rem] ml-1">{pendingCount}</span>}</Link>}
                            <button onClick={handleLogout} className="w-full text-center text-[0.7rem] font-bold text-red-400 hover:bg-red-950/30 py-1.5 rounded transition">🚪 현재 계정 로그아웃</button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <Link href="/login" className="text-[0.7rem] font-bold text-[var(--accent)] hover:opacity-80 whitespace-nowrap">로그인</Link>
                  )
                ) : (
                  <div className="w-28 h-9 bg-zinc-800/50 rounded-full animate-pulse"></div>
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* 모바일 플로팅 FAB */}
        <div
          className="lg:hidden fixed bottom-6 z-[10000] flex items-center rounded-full shadow-[0_0_15px_rgba(0,0,0,0.7)] border-[1.5px] cursor-grab active:cursor-grabbing select-none bg-[var(--panel)] border-[var(--accent)]"
          style={{ right: `${fabPosition.x}px` }}
          onPointerDown={handlePointerDown}
        >
          <button onClick={handleHomeClick} className="w-[2.2rem] h-[2.2rem] flex items-center justify-center rounded-l-full transition-colors border-r border-[var(--panel-border)] hover:bg-[var(--panel-hover)]">
            <svg className="w-3.5 h-3.5 drop-shadow-sm text-[var(--accent)]" viewBox="0 0 24 24" fill="currentColor">
               <path d="M12 1L15.39 8.26L23 9.27L17.5 14.14L18.81 21.02L12 17.77L5.19 21.02L6.5 14.14L1 9.27L8.61 8.26L12 1Z" />
            </svg>
          </button>
          <button onClick={handleMenuClick} className="w-[2.2rem] h-[2.2rem] flex items-center justify-center rounded-r-full transition-colors relative hover:bg-[var(--panel-hover)]">
            {isFabOpen ? (
              <svg className="w-4 h-4 text-[var(--text-main)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
            ) : (
              <svg className="w-4 h-4 text-[var(--text-main)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16"></path></svg>
            )}
          </button>
        </div>

        <div
          className={`fixed inset-0 z-[9998] lg:hidden bg-black/60 transition-opacity duration-300 ${isFabOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
          onClick={() => setIsFabOpen(false)}
        />

        {/* 모바일 바텀시트 */}
        <div
          className={`fixed inset-x-0 bottom-0 z-[9999] lg:hidden border-t-2 rounded-t-[28px] p-4 shadow-2xl flex flex-col bg-[var(--panel)] text-[var(--text-main)] border-[var(--accent)] ${isDraggingSheet ? '' : 'transition-transform duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]'} ${isFabOpen ? 'translate-y-0' : 'translate-y-[120%]'}`}
          style={{ 
            transform: isFabOpen ? `translateY(${sheetTranslateY}px)` : 'translateY(120%)' 
          }}
        >
          <div 
            className="w-full py-2.5 flex items-center justify-center cursor-grab active:cursor-grabbing touch-none select-none"
            onPointerDown={handleSheetDragStart}
          >
            <div className="w-10 h-1.5 bg-[var(--text-sub)] rounded-full opacity-50" />
          </div>

          <div className="overflow-y-auto custom-scrollbar flex flex-col gap-3 pb-16">
            <div className="grid grid-cols-2 gap-2.5">
              {navItems.map((item) => {
                const isActive = pathname === item.path;
                return (
                  <Link
                    key={item.en}
                    href={item.path}
                    onClick={() => setIsFabOpen(false)}
                    className={`relative overflow-hidden flex flex-col justify-center px-4 py-3.5 rounded-xl border transition-colors ${
                      isActive 
                        ? 'bg-[var(--panel-hover)] border-l-[3px] border-l-[var(--accent)] shadow-sm' 
                        : 'bg-[var(--inner-box)] border-[var(--panel-border)]'
                    }`}
                  >
                    <span className="absolute -right-1 -bottom-2 text-[1.6rem] font-black italic opacity-[0.06] select-none pointer-events-none uppercase tracking-tighter">
                      {item.en}
                    </span>
                   
                    {isActive && <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-[var(--accent)]/15 to-transparent pointer-events-none"></div>}

                    <div className="relative z-10 flex items-center justify-between w-full">
                      <div className="flex flex-col">
                        <span className="font-black text-[0.75rem] tracking-wide leading-tight whitespace-nowrap text-[var(--accent)]">{item.kr}</span>
                        <span className="text-[0.55rem] font-bold mt-1 whitespace-nowrap text-[var(--text-sub)]">{item.sub}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            <div className="rounded-xl border overflow-hidden mt-1 bg-[var(--inner-box)] border-[var(--panel-border)]">
              <div className="flex items-center justify-between px-3.5 py-3 bg-[var(--panel-hover)]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full border border-[var(--panel-border)] flex items-center justify-center text-[0.7rem] shadow-inner shrink-0 bg-[var(--panel)]">👑</div>
                  <div className="flex flex-col whitespace-nowrap">
                    <span className="text-[0.7rem] font-black leading-tight text-[var(--text-main)]">{activeAccount?.alias || activeAccount?.nickname || "로그인 필요"}</span>
                    <span className="text-[0.55rem] font-bold uppercase mt-0.5 text-[var(--accent)]">{activeAccount?.role || "길드원"}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button 
                    onClick={() => { setIsThemeModalOpen(true); setIsFabOpen(false); }}
                    className="w-8 h-8 rounded-lg border transition flex items-center justify-center bg-[var(--panel)] border-[var(--panel-border)] hover:border-[var(--accent)] text-sm select-none"
                    title="생텀 테마 설정"
                  >
                    🎨
                  </button>

                  <div className="p-2 rounded-md border flex items-center justify-center bg-[var(--panel)] border-[var(--panel-border)] text-[var(--accent)]">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                  </div>

                  <button
                    onClick={() => setIsMobileAccountMenuOpen(!isMobileAccountMenuOpen)}
                    className="p-1.5 rounded-md border transition-all duration-300 bg-[var(--panel)] text-[var(--text-sub)] border-[var(--panel-border)] hover:text-[var(--text-main)]"
                  >
                    <svg className={`w-4 h-4 transition-transform duration-300 ${isMobileAccountMenuOpen ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                  </button>
                </div>
              </div>

              {isMobileAccountMenuOpen && (
                <div className="p-3 flex flex-col gap-1.5 border-t animate-in fade-in slide-in-from-top-2 bg-[var(--panel)] border-[var(--panel-border)]">
                  <div className="text-[0.55rem] font-bold text-[var(--text-sub)] px-2 mb-1">빠른 계정 스위칭</div>
                 
                  {accounts.filter(a => a.id !== activeAccount?.id).map(acc => (
                    <button key={acc.id} onClick={() => switchAccount(acc)} className="w-full flex items-center justify-between p-2.5 rounded-lg text-left transition border bg-[var(--inner-box)] border-[var(--panel-border)] text-[var(--text-main)] hover:bg-[var(--panel-hover)]">
                      <span className="text-[0.7rem] font-bold">{acc.alias || acc.nickname}</span>
                      <span className="text-[0.55rem] text-[var(--text-sub)] bg-black/20 px-1.5 py-0.5 rounded-md">스위치 🔄</span>
                    </button>
                  ))}
                  {accounts.filter(a => a.id !== activeAccount?.id).length === 0 && <div className="text-[0.55rem] text-[var(--text-sub)] px-2 py-1 text-center">등록된 부계정이 없습니다.</div>}

                  <div className="h-px w-full bg-[var(--panel-border)] my-1"></div>
                 
                  <Link href="/login" onClick={() => setIsFabOpen(false)} className="w-full text-center text-[0.65rem] font-bold py-2.5 rounded-lg transition border text-[var(--accent)] bg-[var(--inner-box)] border-[var(--panel-border)]">➕ 계정 추가 로그인</Link>
                  {isAdmin && <Link href="/admin" onClick={() => setIsFabOpen(false)} className="w-full text-center text-[0.65rem] font-bold text-[var(--text-main)] bg-[var(--inner-box)] py-2.5 rounded-lg transition border border-[var(--panel-border)]">⚙️ SANCTUM 관리자 메뉴</Link>}
                  <button onClick={handleLogout} className="w-full text-center text-[0.65rem] font-bold text-red-400 bg-red-950/20 py-2.5 rounded-lg transition border border-red-900/30">🚪 활성 계정 로그아웃</button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 생텀 페이지 설정 모달 */}
        {isThemeModalOpen && (
          <div className="fixed inset-0 z-[11000] flex items-center justify-center p-4 bg-black/70 animate-in fade-in duration-200">
            <div className="bg-[var(--panel)] border border-[var(--panel-border)] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
              <div className="bg-[var(--panel-hover)] p-4 border-b border-[var(--panel-border)] flex justify-between items-center">
                <h3 className="text-[var(--text-main)] font-black text-base flex items-center gap-2">
                  <span>🎨</span>
                  생텀 페이지 설정 ({activeAccount?.nickname})
                </h3>
                <button onClick={() => setIsThemeModalOpen(false)} className="text-[var(--text-sub)] hover:text-[var(--text-main)] text-xl">&times;</button>
              </div>

              <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
                
                <div className="space-y-3">
                  <label className="text-xs font-bold text-[var(--text-sub)] uppercase tracking-wider block">생텀 테마 프리셋</label>
                  
                  <div className="grid grid-cols-3 gap-2.5">
                    {[
                      { id: 'aureum', name: 'AUREUM', bg: '#0A0A0A', accent: '#E6C788' },
                      { id: 'lumen', name: 'LUMEN', bg: '#FFFFFF', accent: '#2563EB' },
                      { id: 'nemeton', name: 'NEMETON', bg: '#081914', accent: '#48C9A0' },
                      { id: 'vesper', name: 'VESPER', bg: '#0D0B18', accent: '#B18AF3' },
                      { id: 'rosarium', name: 'ROSARIUM', bg: '#1A1016', accent: '#E88DA8' },
                      { id: 'elysium', name: 'ELYSIUM', bg: '#D2F4C0', accent: '#6262B8' },
                    ].map((item) => {
                      const isSelected = tempTheme === item.id || 
                        (tempTheme === 'dark' && item.id === 'aureum') || 
                        (tempTheme === 'light' && item.id === 'lumen') || 
                        (tempTheme === 'mint' && item.id === 'nemeton') || 
                        (tempTheme === 'purple' && item.id === 'vesper') || 
                        (tempTheme === 'rose' && item.id === 'rosarium');

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setTempTheme(item.id)}
                          className={`p-3 rounded-xl border text-xs font-black transition flex flex-col items-center justify-center gap-2 ${
                            isSelected
                              ? 'bg-[var(--panel-hover)] border-[var(--accent)] text-[var(--accent)] shadow-lg scale-[1.02]'
                              : 'bg-[var(--inner-box)] border-[var(--panel-border)] text-[var(--text-sub)] hover:text-[var(--text-main)]'
                          }`}
                        >
                          <span className="w-5 h-5 rounded-full flex items-center justify-center p-0.5 border shadow-inner" style={{ backgroundColor: item.bg, borderColor: item.accent }}>
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.accent }}></span>
                          </span>
                          <span className="text-[0.65rem] tracking-wider">{item.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-3 border-t border-[var(--panel-border)] flex items-center justify-between">
                  <span className="text-xs font-bold text-[var(--text-sub)]">화면 글자 크기</span>
                  <div className="flex items-center bg-[var(--inner-box)] border border-[var(--panel-border)] rounded-xl p-1 gap-1">
                    <button onClick={() => setFontSizeLevel('small')} className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${fontSizeLevel === 'small' ? 'bg-[var(--panel-hover)] text-[var(--text-main)] shadow' : 'text-[var(--text-sub)] hover:text-[var(--text-main)]'}`}>A-</button>
                    <button onClick={() => setFontSizeLevel('normal')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${fontSizeLevel === 'normal' ? 'bg-[var(--panel-hover)] text-[var(--text-main)] shadow' : 'text-[var(--text-sub)] hover:text-[var(--text-main)]'}`}>A</button>
                    <button onClick={() => setFontSizeLevel('large')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${fontSizeLevel === 'large' ? 'bg-[var(--panel-hover)] text-[var(--text-main)] shadow' : 'text-[var(--text-sub)] hover:text-[var(--text-main)]'}`}>A+</button>
                  </div>
                </div>
              </div>

              <div className="bg-[var(--panel-hover)] p-4 border-t border-[var(--panel-border)] flex justify-between gap-2">
                <button onClick={() => setIsThemeModalOpen(false)} className="px-5 py-2 rounded-lg bg-[var(--inner-box)] text-[var(--text-sub)] text-xs font-bold hover:text-[var(--text-main)] transition">취소</button>
                <button onClick={handleSaveThemeSettings} className="px-5 py-2 rounded-lg bg-[var(--accent)] text-[var(--accent-fg)] text-xs font-black transition shadow hover:opacity-90">적용하기</button>
              </div>
            </div>
          </div>
        )}

        <main className="max-w-[1600px] mx-auto px-4 py-6 w-full">
          {children}
        </main>
      </body>
    </html>
  );
}