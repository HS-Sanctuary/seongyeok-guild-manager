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
  hasNew?: boolean;
}

interface AccountPreset {
  id: string;
  nickname: string;
  role: string;
  alias: string;
  borderColor: string;
  theme: string;
  bgImage?: string;
}

const navItems: NavItem[] = [
  { en: 'KERYGMA', kr: '케리그마', sub: '공지사항', path: '/notice', hasNew: true },
  { en: 'CHRONOS', kr: '크로노스', sub: '캐릭터 관리', path: '/character' },
  { en: 'AGORA', kr: '아고라', sub: '길드 라운지', path: '/lounge' },
  { en: 'EMPORION', kr: '엠포리온', sub: '거래소 정보', path: '/market' },
  { en: 'SYNAXIS', kr: '시낙시스', sub: '파티 매칭', path: '/party', hasNew: true },
  { en: 'GNOSIS', kr: '그노시스', sub: '정보 공유', path: '/gnosis' },
  { en: 'LOGOS', kr: '로고스', sub: '문의/건의', path: '/support' },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [accounts, setAccounts] = useState<AccountPreset[]>([]);
  const [activeAccount, setActiveAccount] = useState<AccountPreset | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isMobileAccountMenuOpen, setIsMobileAccountMenuOpen] = useState(false);

  const [isFabOpen, setIsFabOpen] = useState(false);
  const [fabPosition, setFabPosition] = useState<{ x: number }>({ x: 20 });
  const [fontSizeLevel, setFontSizeLevel] = useState('normal');
  
  const dragStartX = useRef(0);
  const startFabX = useRef(0);
  const hasMoved = useRef(false);

  const [pendingCount, setPendingCount] = useState(0);
  const [banner, setBanner] = useState<any>(null);

  // 폰트 크기 세팅
  useEffect(() => {
    const savedFont = localStorage.getItem('nexus_font_size') || 'normal';
    setFontSizeLevel(savedFont);
  }, []);

  useEffect(() => {
    localStorage.setItem('nexus_font_size', fontSizeLevel);
    const root = document.documentElement;
    if (fontSizeLevel === 'large') {
      root.style.fontSize = '22px';
    } else if (fontSizeLevel === 'small') {
      root.style.fontSize = '18px';
    } else {
      root.style.fontSize = '20px';
    }
  }, [fontSizeLevel]);

  const loadAccounts = () => {
    const savedAccounts = localStorage.getItem("sanctum_accounts");
    const savedActiveId = localStorage.getItem("sanctum_active_account_id");

    if (savedAccounts) {
      try {
        const parsed: AccountPreset[] = JSON.parse(savedAccounts);
        setAccounts(parsed);
        if (parsed.length > 0) {
          const current = parsed.find(a => a.id === savedActiveId) || parsed[0];
          setActiveAccount(current);
        }
      } catch (e) {
        console.error("Account parse error", e);
      }
    } else {
      const oldUser = localStorage.getItem("nexus_user");
      if (oldUser) {
        try {
          const parsedOld = JSON.parse(oldUser);
          const defaultAcc: AccountPreset = {
            id: String(Date.now()),
            nickname: parsedOld.nickname || "길드원",
            role: parsedOld.role || "길드원",
            alias: parsedOld.nickname || "내 계정 1",
            borderColor: "#E6C788",
            theme: "Classic Gold"
          };
          setAccounts([defaultAcc]);
          setActiveAccount(defaultAcc);
          localStorage.setItem("sanctum_accounts", JSON.stringify([defaultAcc]));
          localStorage.setItem("sanctum_active_account_id", defaultAcc.id);
        } catch (e) {}
      }
    }
    setIsLoaded(true);
  };

  useEffect(() => {
    loadAccounts();
    const handleAccountChange = () => {
      loadAccounts();
    };
    window.addEventListener("sanctum_account_changed", handleAccountChange);
    return () => window.removeEventListener("sanctum_account_changed", handleAccountChange);
  }, []);

  const switchAccount = (acc: AccountPreset) => {
    setActiveAccount(acc);
    localStorage.setItem("sanctum_active_account_id", acc.id);
    localStorage.setItem("nexus_user", JSON.stringify({ nickname: acc.nickname, role: acc.role }));
    setIsAccountMenuOpen(false);
    setIsMobileAccountMenuOpen(false);
    setIsFabOpen(false);
    window.dispatchEvent(new CustomEvent("sanctum_account_changed", { detail: acc }));
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

  const handleHomeClick = (e: React.MouseEvent) => {
    if (hasMoved.current) return;
    router.push('/');
    setIsFabOpen(false);
  };

  const handleMenuClick = (e: React.MouseEvent) => {
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
  const activeColor = activeAccount?.borderColor || "#E6C788";

  return (
    <html lang="ko">
      <body className="bg-[#121212] text-zinc-200 overflow-x-hidden min-h-screen relative font-sans">
        
        {activeAccount?.bgImage && (
          <div
            className="fixed inset-0 z-[-1] bg-cover bg-center pointer-events-none opacity-20 filter blur-[2px]"
            style={{ backgroundImage: `url(${activeAccount.bgImage})` }}
          />
        )}

        {/* 🟢 데스크톱 네비게이션 바 */}
        <nav className="sticky top-0 z-[900] flex flex-col shadow-lg border-b border-zinc-800 bg-[#1c1c1e]/90 backdrop-blur-md w-full">
          {banner && (
            <div className="w-full py-2 bg-red-600 text-white text-center text-xs font-black animate-pulse flex items-center justify-center gap-2 border-b border-red-800">
              <span>🚨</span><span>{banner.message}</span><span>🚨</span>
            </div>
          )}

          <div className="max-w-[1600px] mx-auto px-4 w-full">
            <div className="flex items-center justify-between h-20">
             
              {/* 로고 영역 */}
              <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity shrink-0">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-colors border border-black/10 relative overflow-hidden shrink-0" style={{ backgroundColor: activeColor }}>
                  <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent"></div>
                  <svg className="w-6 h-6 text-black relative z-10 drop-shadow-sm" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 1L15.39 8.26L23 9.27L17.5 14.14L18.81 21.02L12 17.77L5.19 21.02L6.5 14.14L1 9.27L8.61 8.26L12 1Z" />
                  </svg>
                </div>
                <div className="flex flex-col whitespace-nowrap">
                  <span className="font-black text-xl text-white leading-none tracking-wider">SANCTUM</span>
                  <span className="text-[0.55rem] font-bold tracking-tight mt-1 opacity-90 hidden sm:block text-zinc-400">데이안 서버 성역 길드</span>
                </div>
              </Link>

              {/* 상단 네비게이션 메뉴 */}
              <div className="hidden lg:flex items-center space-x-2 xl:space-x-3">
                {navItems.map((item) => {
                  const isActive = pathname === item.path;
                  return (
                    <Link
                      key={item.en}
                      href={item.path}
                      className={`group relative flex items-center justify-center rounded-md transition-all overflow-hidden h-12 px-3 lg:px-4 shrink-0 ${isActive ? 'bg-zinc-800/90 border-b-2' : 'hover:bg-zinc-800/50'}`}
                      style={{ borderColor: isActive ? activeColor : 'transparent' }}
                    >
                      <div className="flex flex-col items-center transition-transform duration-300 transform group-hover:-translate-y-12">
                        <span className={`font-black text-[0.7rem] xl:text-[0.75rem] leading-tight whitespace-nowrap ${isActive ? 'text-white' : 'text-zinc-300'}`}>{item.kr}</span>
                        <span className="text-[0.5rem] font-bold mt-0.5 whitespace-nowrap" style={{ color: activeColor }}>{item.sub}</span>
                      </div>
                      
                      <div className="absolute inset-0 flex items-center justify-center transition-all duration-300 transform translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100">
                        <span className={`font-black tracking-widest text-[0.65rem] xl:text-[0.7rem] whitespace-nowrap ${isActive ? 'text-white' : 'text-zinc-400'}`}>{item.en}</span>
                      </div>

                      {item.hasNew && <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shrink-0"></span>}
                    </Link>
                  );
                })}
              </div>

              {/* 우측 유틸리티 영역 (isLoaded 체크로 하이드레이션 오류 원천 차단) */}
              <div className="hidden lg:flex items-center gap-3 relative shrink-0">
                
                {/* 글자 크기 변경 위젯 */}
                <div className="flex items-center bg-[#121212] border border-zinc-700 rounded-lg p-0.5 shadow-inner">
                  <button onClick={() => setFontSizeLevel('small')} className={`px-2 py-1 rounded text-[0.65rem] font-bold transition ${fontSizeLevel === 'small' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>A-</button>
                  <button onClick={() => setFontSizeLevel('normal')} className={`px-2 py-1 rounded text-[0.65rem] font-bold transition ${fontSizeLevel === 'normal' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>A</button>
                  <button onClick={() => setFontSizeLevel('large')} className={`px-2 py-1 rounded text-[0.65rem] font-bold transition ${fontSizeLevel === 'large' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>A+</button>
                </div>

                {isLoaded && activeAccount ? (
                  <div className="relative">
                    <button onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)} className="flex items-center gap-2 bg-[#121212] hover:bg-zinc-800 px-3 py-1.5 rounded-full border transition shadow-md whitespace-nowrap" style={{ borderColor: activeColor }}>
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-[0.65rem] bg-zinc-800 shrink-0">👑</div>
                      <div className="flex flex-col text-left leading-none whitespace-nowrap">
                        <span className="text-[0.7rem] font-bold text-white flex items-center gap-1 max-w-[120px] truncate">{activeAccount.alias || activeAccount.nickname}</span>
                        <span className="text-[0.55rem] text-zinc-500 mt-0.5">{activeAccount.role}</span>
                      </div>
                      <span className="text-[0.55rem] text-zinc-400 ml-1">▼</span>
                    </button>

                    {isAccountMenuOpen && (
                      <div className="absolute right-0 mt-2 w-56 bg-[#1c1c1e] border border-zinc-700 rounded-xl shadow-2xl z-[1000] overflow-hidden p-2">
                        <div className="text-[0.55rem] font-bold text-zinc-500 px-2 py-1">현재 활성 계정</div>
                        <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-800/80 mb-2 border-l-4" style={{ borderColor: activeColor }}>
                          <span className="text-[0.7rem] font-black text-white truncate">{activeAccount.alias || activeAccount.nickname}</span>
                          <span className="text-[0.55rem] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded shrink-0">선택됨</span>
                        </div>

                        {accounts.filter(a => a.id !== activeAccount.id).length > 0 && (
                          <>
                            <div className="text-[0.55rem] font-bold text-zinc-500 px-2 py-1 border-t border-zinc-800 mt-1">계정 빠른 스위칭</div>
                            {accounts.filter(a => a.id !== activeAccount.id).map(acc => (
                              <button key={acc.id} onClick={() => switchAccount(acc)} className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-zinc-800 text-left transition my-0.5">
                                <span className="text-[0.7rem] font-bold text-zinc-300 truncate">{acc.alias || acc.nickname}</span>
                                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: acc.borderColor }}></span>
                              </button>
                            ))}
                          </>
                        )}

                        <div className="border-t border-zinc-800 mt-2 pt-1 flex flex-col gap-1">
                          <Link href="/login" className="w-full text-center text-[0.7rem] font-bold text-[#e6c788] hover:bg-zinc-800 py-1.5 rounded transition">➕ 계정 추가 로그인</Link>
                          {isAdmin && <Link href="/admin" className="w-full text-center text-[0.7rem] font-bold text-zinc-400 hover:text-white hover:bg-zinc-800 py-1.5 rounded transition">⚙️ SANCTUM 관리자 {pendingCount > 0 && <span className="bg-red-500 text-white px-1.5 py-0.2 rounded-full text-[0.55rem] ml-1">{pendingCount}</span>}</Link>}
                          <button onClick={handleLogout} className="w-full text-center text-[0.7rem] font-bold text-red-400 hover:bg-red-950/30 py-1.5 rounded transition">🚪 현재 계정 로그아웃</button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : isLoaded ? (
                  <Link href="/login" className="text-[0.7rem] font-bold text-[#e6c788] hover:text-yellow-400 whitespace-nowrap">로그인</Link>
                ) : (
                  <div className="w-16 h-6"></div>
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* 📱 듀얼 플로팅 알약 버튼 */}
        <div
          className="lg:hidden fixed bottom-6 z-[10000] flex items-center bg-[#1c1c1e] rounded-full shadow-[0_0_15px_rgba(0,0,0,0.7)] border-[1.5px] cursor-grab active:cursor-grabbing select-none"
          style={{ right: `${fabPosition.x}px`, borderColor: activeColor }}
          onPointerDown={handlePointerDown}
        >
          <button onClick={handleHomeClick} className="w-[3.2rem] h-[3.2rem] flex items-center justify-center border-r border-zinc-800 hover:bg-zinc-800 rounded-l-full transition-colors">
            <svg className="w-5 h-5 drop-shadow-sm" style={{ color: activeColor }} viewBox="0 0 24 24" fill="currentColor">
               <path d="M12 1L15.39 8.26L23 9.27L17.5 14.14L18.81 21.02L12 17.77L5.19 21.02L6.5 14.14L1 9.27L8.61 8.26L12 1Z" />
            </svg>
          </button>
          <button onClick={handleMenuClick} className={`w-[3.2rem] h-[3.2rem] flex items-center justify-center rounded-r-full transition-colors relative ${isFabOpen ? 'bg-zinc-800' : 'hover:bg-zinc-800'}`}>
            {!isFabOpen && <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 absolute top-2 right-2 animate-pulse border-2 border-[#1c1c1e]"></span>}
            {isFabOpen ? (
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
            ) : (
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16"></path></svg>
            )}
          </button>
        </div>

        {/* 📱 바텀 시트 오버레이 */}
        <div
          className={`fixed inset-0 z-[9998] lg:hidden bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${isFabOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
          onClick={() => setIsFabOpen(false)}
        />

        {/* 📱 초압축 바텀 시트 */}
        <div
          className={`fixed inset-x-0 bottom-0 z-[9999] lg:hidden bg-[#1c1c1e] border-t-[1.5px] rounded-t-[28px] p-4 shadow-2xl flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${isFabOpen ? 'translate-y-0' : 'translate-y-[120%]'}`}
          style={{ borderColor: activeColor }}
        >
          <div className="w-10 h-1.5 bg-zinc-700 rounded-full mx-auto mb-4" />

          <div className="overflow-y-auto custom-scrollbar flex flex-col gap-3 pb-16">
           
            <div className="grid grid-cols-2 gap-2.5">
              {navItems.map((item) => {
                const isActive = pathname === item.path;
                return (
                  <Link
                    key={item.en}
                    href={item.path}
                    onClick={() => setIsFabOpen(false)}
                    className={`relative overflow-hidden flex flex-col justify-center px-4 py-3.5 rounded-xl border transition-colors ${isActive ? 'bg-zinc-800/90 border-l-[3px] shadow-sm' : 'bg-[#252528] border-zinc-800'}`}
                    style={{ borderLeftColor: isActive ? activeColor : undefined }}
                  >
                    <span className="absolute -right-1 -bottom-2 text-[1.6rem] font-black italic opacity-[0.06] text-white select-none pointer-events-none uppercase tracking-tighter">
                      {item.en}
                    </span>
                   
                    {isActive && <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-[#e6c788]/10 to-transparent pointer-events-none"></div>}

                    <div className="relative z-10 flex items-center justify-between w-full">
                      <div className="flex flex-col">
                        <span className="font-black text-[0.75rem] tracking-wide leading-tight whitespace-nowrap" style={{ color: activeColor }}>{item.kr}</span>
                        <span className="text-[0.55rem] font-bold mt-1 text-zinc-400 whitespace-nowrap">{item.sub}</span>
                      </div>
                      {item.hasNew && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_5px_red] self-start mt-1.5 shrink-0"></span>}
                    </div>
                  </Link>
                );
              })}
            </div>

            <div className="bg-[#121212] rounded-xl border border-zinc-700/60 overflow-hidden mt-1">
              <div className="flex items-center justify-between px-3.5 py-3 bg-[#252528]">
               
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-zinc-800 border border-zinc-600 flex items-center justify-center text-[0.7rem] shadow-inner shrink-0">👑</div>
                  <div className="flex flex-col whitespace-nowrap">
                    <span className="text-[0.7rem] font-black text-white leading-tight">{activeAccount?.alias || activeAccount?.nickname || "로그인 필요"}</span>
                    <span className="text-[0.55rem] font-bold uppercase mt-0.5" style={{ color: activeColor }}>{activeAccount?.role || "길드원"}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                 
                  <div className="flex items-center bg-[#121212] border border-zinc-700 rounded p-0.5">
                    <button onClick={() => setFontSizeLevel('small')} className={`px-1.5 py-0.5 rounded text-[0.55rem] font-bold ${fontSizeLevel === 'small' ? 'bg-zinc-700 text-white' : 'text-zinc-500'}`}>A-</button>
                    <button onClick={() => setFontSizeLevel('normal')} className={`px-1.5 py-0.5 rounded text-[0.55rem] font-bold ${fontSizeLevel === 'normal' ? 'bg-zinc-700 text-white' : 'text-zinc-500'}`}>A</button>
                    <button onClick={() => setFontSizeLevel('large')} className={`px-1.5 py-0.5 rounded text-[0.55rem] font-bold ${fontSizeLevel === 'large' ? 'bg-zinc-700 text-white' : 'text-zinc-500'}`}>A+</button>
                  </div>

                  <button className="relative p-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full text-[0.5rem] font-black flex items-center justify-center text-white border border-[#252528]">2</span>
                  </button>

                  <button
                    onClick={() => setIsMobileAccountMenuOpen(!isMobileAccountMenuOpen)}
                    className={`p-1.5 rounded-md border transition-all duration-300 ${isMobileAccountMenuOpen ? 'bg-zinc-700 text-white border-zinc-500' : 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}
                  >
                    <svg className={`w-4 h-4 transition-transform duration-300 ${isMobileAccountMenuOpen ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                  </button>
                </div>
              </div>

              {isMobileAccountMenuOpen && (
                <div className="p-3 flex flex-col gap-1.5 border-t border-zinc-800 bg-[#1a1a1c] animate-in fade-in slide-in-from-top-2">
                  <div className="text-[0.55rem] font-bold text-zinc-500 px-2 mb-1">빠른 계정 스위칭</div>
                 
                  {accounts.filter(a => a.id !== activeAccount?.id).map(acc => (
                    <button key={acc.id} onClick={() => switchAccount(acc)} className="w-full flex items-center justify-between p-2.5 rounded-lg bg-zinc-800/60 hover:bg-zinc-700 text-left transition border border-zinc-700/50">
                      <span className="text-[0.7rem] font-bold text-zinc-200">{acc.alias || acc.nickname}</span>
                      <span className="text-[0.55rem] text-zinc-500 bg-[#121212] px-1.5 py-0.5 rounded-md">스위치 🔄</span>
                    </button>
                  ))}
                  {accounts.filter(a => a.id !== activeAccount?.id).length === 0 && <div className="text-[0.55rem] text-zinc-600 px-2 py-1 text-center">등록된 부계정이 없습니다.</div>}

                  <div className="h-px w-full bg-zinc-800 my-1"></div>
                 
                  <Link href="/login" onClick={() => setIsFabOpen(false)} className="w-full text-center text-[0.65rem] font-bold text-[#e6c788] bg-yellow-900/10 py-2.5 rounded-lg transition border border-yellow-900/30">➕ 계정 추가 로그인</Link>
                  {isAdmin && <Link href="/admin" onClick={() => setIsFabOpen(false)} className="w-full text-center text-[0.65rem] font-bold text-zinc-300 bg-zinc-800/80 py-2.5 rounded-lg transition border border-zinc-700">⚙️ SANCTUM 관리자 메뉴 {pendingCount > 0 && <span className="bg-red-500 text-white px-1.5 py-0.2 rounded-full text-[0.55rem] ml-1">{pendingCount}</span>}</Link>}
                  <button onClick={handleLogout} className="w-full text-center text-[0.65rem] font-bold text-red-400 bg-red-950/20 py-2.5 rounded-lg transition border border-red-900/30">🚪 활성 계정 로그아웃</button>
                </div>
              )}
            </div>

          </div>
        </div>

        {children}
      </body>
    </html>
  );
}