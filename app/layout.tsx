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
  
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isMobileAccountMenuOpen, setIsMobileAccountMenuOpen] = useState(false);

  const [isFabOpen, setIsFabOpen] = useState(false);
  const [fabPosition, setFabPosition] = useState<{ x: number }>({ x: 20 });
  const [fontSizeLevel, setFontSizeLevel] = useState('normal');
  
  const dragStartX = useRef(0);
  const startFabX = useRef(0);
  const hasMoved = useRef(false);

  const [banner, setBanner] = useState<any>(null);

  useEffect(() => {
    const savedFont = localStorage.getItem('nexus_font_size') || 'normal';
    setFontSizeLevel(savedFont);
  }, []);

  useEffect(() => {
    localStorage.setItem('nexus_font_size', fontSizeLevel);
    const root = document.documentElement;
    if (fontSizeLevel === 'large') {
      root.style.fontSize = '18px'; 
    } else if (fontSizeLevel === 'small') {
      root.style.fontSize = '14px';
    } else {
      root.style.fontSize = '16px'; 
    }
  }, [fontSizeLevel]);

  useEffect(() => {
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
  }, []);

  const switchAccount = (acc: AccountPreset) => {
    setActiveAccount(acc);
    localStorage.setItem("sanctum_active_account_id", acc.id);
    localStorage.setItem("nexus_user", JSON.stringify({ nickname: acc.nickname, role: acc.role }));
    setIsAccountMenuOpen(false);
    setIsMobileAccountMenuOpen(false);
    setIsFabOpen(false);
    window.dispatchEvent(new CustomEvent("sanctum_account_changed", { detail: acc }));
    router.refresh();
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
      localStorage.removeItem("nexus_user");
      localStorage.removeItem("sanctum_active_account_id");
      router.push("/login");
    }
  };

  if (pathname === '/login') return <html lang="ko"><body>{children}</body></html>;

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

        {/* 🟢 데스크톱 & 공통 네비게이션 바 */}
        <nav className="sticky top-0 z-[900] flex flex-col shadow-lg border-b border-zinc-800 bg-[#1c1c1e]/95 backdrop-blur-md w-full">
          {banner && (
            <div className="w-full py-2 bg-red-600 text-white text-center text-xs font-black animate-pulse flex items-center justify-center gap-2 border-b border-red-800">
              <span>🚨</span><span>{banner.message}</span><span>🚨</span>
            </div>
          )}

          <div className="max-w-[1500px] mx-auto px-4 md:px-6 w-full">
            <div className="flex items-center justify-between h-20">
              
              <Link href="/" className="flex items-center gap-3 md:gap-4 hover:opacity-80 transition-opacity">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center shadow-lg transition-colors border border-black/10 relative overflow-hidden" style={{ backgroundColor: activeColor }}>
                  <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent"></div>
                  <svg className="w-6 h-6 md:w-7 md:h-7 text-black relative z-10 drop-shadow-sm" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 1L15.39 8.26L23 9.27L17.5 14.14L18.81 21.02L12 17.77L5.19 21.02L6.5 14.14L1 9.27L8.61 8.26L12 1Z" />
                  </svg>
                </div>
                <div className="flex flex-col whitespace-nowrap">
                  <span className="font-black text-xl md:text-2xl text-white leading-none tracking-wider drop-shadow-md">SANCTUM</span>
                  <span className="text-[0.65rem] md:text-[0.7rem] font-bold tracking-tight mt-1 opacity-90 hidden sm:block text-zinc-400">
                    데이안 서버 성역 길드 <span className="mx-1 text-zinc-600">|</span> 생텀
                  </span>
                </div>
              </Link>

              <div className="hidden md:flex flex-1 justify-center space-x-2 lg:space-x-4 px-4">
                {navItems.map((item) => {
                  const isActive = pathname === item.path;
                  return (
                    <Link 
                      key={item.en} 
                      href={item.path} 
                      className={`group relative flex flex-col items-center justify-center rounded-lg transition-all overflow-hidden px-3.5 py-2 ${isActive ? 'bg-zinc-800/90 border-b-2' : 'hover:bg-zinc-800/50'}`}
                      style={{ borderColor: isActive ? activeColor : 'transparent' }}
                    >
                      <span className="font-black text-[0.85rem] tracking-wider mb-0.5 text-white">{item.en}</span>
                      <span className="text-[0.75rem] font-bold" style={{ color: activeColor }}>{item.kr}</span>
                      {item.hasNew && <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>}
                    </Link>
                  );
                })}
              </div>

              <div className="flex items-center gap-2 md:gap-4 relative">
                
                <div className="flex items-center gap-0.5 md:gap-1 bg-[#121212] border border-zinc-700 rounded-lg p-1 shadow-inner">
                  <button onClick={() => setFontSizeLevel('small')} className={`px-2 py-1 rounded text-[0.7rem] font-bold transition ${fontSizeLevel === 'small' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300'}`}>A-</button>
                  <button onClick={() => setFontSizeLevel('normal')} className={`px-2 py-1 rounded text-[0.8rem] font-bold transition ${fontSizeLevel === 'normal' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300'}`}>A</button>
                  <button onClick={() => setFontSizeLevel('large')} className={`px-2 py-1 rounded text-[0.9rem] font-bold transition ${fontSizeLevel === 'large' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300'}`}>A+</button>
                </div>

                {activeAccount ? (
                  <div className="relative hidden md:block">
                    <button onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)} className="flex items-center gap-2.5 bg-[#121212] hover:bg-zinc-800 px-4 py-2 rounded-full border transition shadow-md" style={{ borderColor: activeColor }}>
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-[0.8rem] bg-zinc-800">👑</div>
                      <div className="flex flex-col text-left leading-tight">
                        <span className="text-[0.85rem] font-bold text-white flex items-center gap-1">{activeAccount.alias || activeAccount.nickname}</span>
                        <span className="text-[0.65rem] font-bold uppercase" style={{ color: activeColor }}>{activeAccount.role}</span>
                      </div>
                      <span className="text-[0.6rem] text-zinc-400 ml-1">▼</span>
                    </button>

                    {isAccountMenuOpen && (
                      <div className="absolute right-0 mt-2 w-56 bg-[#1c1c1e] border border-zinc-700 rounded-xl shadow-2xl z-[1000] overflow-hidden p-2 animate-in fade-in slide-in-from-top-2">
                        <div className="text-[0.65rem] font-bold text-zinc-500 px-2 py-1">현재 활성 계정</div>
                        <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-800/80 mb-2 border-l-4" style={{ borderColor: activeColor }}>
                          <span className="text-[0.8rem] font-black text-white">{activeAccount.alias || activeAccount.nickname}</span>
                          <span className="text-[0.6rem] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded">접속중</span>
                        </div>

                        {accounts.filter(a => a.id !== activeAccount.id).length > 0 && (
                          <>
                            <div className="text-[0.65rem] font-bold text-zinc-500 px-2 py-1 border-t border-zinc-800 mt-1">계정 빠른 스위칭</div>
                            {accounts.filter(a => a.id !== activeAccount.id).map(acc => (
                              <button key={acc.id} onClick={() => switchAccount(acc)} className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-zinc-800 text-left transition my-0.5 border border-transparent hover:border-zinc-700">
                                <span className="text-[0.8rem] font-bold text-zinc-300">{acc.alias || acc.nickname}</span>
                                <span className="text-[0.6rem] bg-zinc-700 text-zinc-400 px-1.5 py-0.5 rounded">전환</span>
                              </button>
                            ))}
                          </>
                        )}

                        <div className="border-t border-zinc-800 mt-2 pt-2 flex flex-col gap-1.5">
                          <Link href="/login" className="w-full text-center text-[0.8rem] font-bold text-[#e6c788] hover:bg-zinc-800 py-1.5 rounded transition">➕ 계정 추가 로그인</Link>
                          <Link href="/admin" className="w-full text-center text-[0.8rem] font-bold text-zinc-300 hover:text-white hover:bg-zinc-800 py-1.5 rounded transition">⚙️ SANCTUM 관리자 설정</Link>
                          <button onClick={handleLogout} className="w-full text-center text-[0.8rem] font-bold text-red-400 hover:bg-red-950/30 py-1.5 rounded transition mt-1">🚪 현재 계정 로그아웃</button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <Link href="/login" className="text-[0.8rem] font-bold text-[#e6c788] hover:text-yellow-400 hidden md:block">로그인</Link>
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* 📱 듀얼 플로팅 알약 버튼 (모바일) */}
        <div 
          className="md:hidden fixed bottom-6 z-[10000] flex items-center bg-[#1c1c1e] rounded-full shadow-[0_0_15px_rgba(0,0,0,0.7)] border-[1.5px] cursor-grab active:cursor-grabbing select-none"
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

        {/* 📱 모바일 바텀 시트 오버레이 */}
        <div 
          className={`fixed inset-0 z-[9998] md:hidden bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${isFabOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
          onClick={() => setIsFabOpen(false)}
        />

        {/* 📱 모바일 바텀 시트 */}
        <div 
          className={`fixed inset-x-0 bottom-0 z-[9999] md:hidden bg-[#1c1c1e] border-t-[1.5px] rounded-t-[28px] p-4 shadow-2xl flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${isFabOpen ? 'translate-y-0' : 'translate-y-[120%]'}`}
          style={{ borderColor: activeColor }}
        >
          <div className="w-10 h-1.5 bg-zinc-700 rounded-full mx-auto mb-4" />

          <div className="overflow-y-auto custom-scrollbar flex flex-col gap-3 pb-16">
            
            {/* 메뉴 그리드 */}
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
                    <span className="absolute -right-1 -bottom-2 text-3xl font-black italic opacity-[0.06] text-white select-none pointer-events-none uppercase tracking-tighter">
                      {item.en}
                    </span>
                    
                    {isActive && <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-[#e6c788]/10 to-transparent pointer-events-none"></div>}

                    <div className="relative z-10 flex items-center justify-between w-full">
                      <div className="flex flex-col">
                        <span className="font-black text-[0.95rem] tracking-wide leading-tight" style={{ color: activeColor }}>{item.kr}</span>
                        <span className="text-[0.65rem] font-bold text-zinc-300 mt-1">{item.sub}</span>
                      </div>
                      {item.hasNew && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_5px_red] self-start mt-1.5"></span>}
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* 계정 설정 영역 */}
            <div className="bg-[#121212] rounded-xl border border-zinc-700/60 overflow-hidden mt-1">
              <div className="flex items-center justify-between px-3.5 py-3 bg-[#252528]">
                
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-zinc-800 border border-zinc-600 flex items-center justify-center text-[0.8rem] shadow-inner">👑</div>
                  <div className="flex flex-col">
                    <span className="text-[0.9rem] font-black text-white leading-tight">{activeAccount?.alias || activeAccount?.nickname || "로그인 필요"}</span>
                    <span className="text-[0.65rem] font-bold uppercase mt-0.5" style={{ color: activeColor }}>{activeAccount?.role || "길드원"}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
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
                  <div className="text-[0.65rem] font-bold text-zinc-500 px-2 mb-1">빠른 계정 스위칭</div>
                  
                  {accounts.filter(a => a.id !== activeAccount?.id).map(acc => (
                    <button key={acc.id} onClick={() => switchAccount(acc)} className="w-full flex items-center justify-between p-2.5 rounded-lg bg-zinc-800/60 hover:bg-zinc-700 text-left transition border border-zinc-700/50">
                      <span className="text-[0.8rem] font-bold text-zinc-200">{acc.alias || acc.nickname}</span>
                      <span className="text-[0.6rem] text-zinc-400 bg-zinc-700 px-1.5 py-0.5 rounded-md">전환</span>
                    </button>
                  ))}
                  {accounts.filter(a => a.id !== activeAccount?.id).length === 0 && <div className="text-[0.65rem] text-zinc-600 px-2 py-1 text-center">등록된 부계정이 없습니다.</div>}

                  <div className="h-px w-full bg-zinc-800 my-1"></div>
                  
                  <Link href="/login" onClick={() => setIsFabOpen(false)} className="w-full text-center text-[0.75rem] font-bold text-[#e6c788] bg-yellow-900/10 py-2.5 rounded-lg transition border border-yellow-900/30">➕ 계정 추가 로그인</Link>
                  <Link href="/admin" onClick={() => setIsFabOpen(false)} className="w-full text-center text-[0.75rem] font-bold text-zinc-300 bg-zinc-800/80 py-2.5 rounded-lg transition border border-zinc-700">⚙️ SANCTUM 관리자 메뉴</Link>
                  <button onClick={handleLogout} className="w-full text-center text-[0.75rem] font-bold text-red-400 bg-red-950/20 py-2.5 rounded-lg transition border border-red-900/30">🚪 활성 계정 로그아웃</button>
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