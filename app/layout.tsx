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
  bgImage?: string;
  dimmer?: number;
  textStroke?: boolean;
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
  const [tempTheme, setTempTheme] = useState('dark');
  const [tempBgImage, setTempBgImage] = useState('');
  const [tempDimmer, setTempDimmer] = useState(40);
  const [tempTextStroke, setTempTextStroke] = useState(false);

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
          theme: parsedOld.theme || "dark",
          bgImage: parsedOld.bgImage || "",
          dimmer: parsedOld.dimmer || 40,
          textStroke: false
        }];
        localStorage.setItem("sanctum_accounts", JSON.stringify(parsedAccounts));
        localStorage.setItem("sanctum_active_account_id", parsedAccounts[0].id);
      }

      setAccounts(parsedAccounts);
      if (parsedAccounts.length > 0) {
        const current = parsedAccounts.find(a => a.id === savedActiveId) || parsedAccounts[0];
        setActiveAccount(current);
        setTempTheme(current.theme || 'dark');
        setTempBgImage(current.bgImage || '');
        setTempDimmer(current.dimmer ?? 40);
        setTempTextStroke(current.textStroke ?? false);
      }
    } catch (e) {
      console.error("Account parse error", e);
    }
  };

  const switchAccount = (acc: AccountPreset) => {
    setActiveAccount(acc);
    setTempTheme(acc.theme || 'dark');
    setTempBgImage(acc.bgImage || '');
    setTempDimmer(acc.dimmer ?? 40);
    setTempTextStroke(acc.textStroke ?? false);

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
          theme: tempTheme,
          bgImage: tempBgImage,
          dimmer: tempDimmer,
          textStroke: tempTextStroke
        };
      }
      return acc;
    });

    setAccounts(updatedAccounts);
    localStorage.setItem("sanctum_accounts", JSON.stringify(updatedAccounts));
    
    const updatedCurrent = updatedAccounts.find(a => a.id === activeAccount.id) || null;
    setActiveAccount(updatedCurrent);
    if (updatedCurrent) {
      window.dispatchEvent(new CustomEvent("sanctum_account_changed", { detail: updatedCurrent }));
    }

    setIsThemeModalOpen(false);
  };

  // 💡 버튼 클릭을 방해하지 않는 깔끔한 드래그 핸들러
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
  const activeColor = activeAccount?.theme === 'light' ? '#2563eb' : (activeAccount?.borderColor || "#E6C788");
  
  const getThemeBackground = () => {
    const theme = activeAccount?.theme || 'dark';
    if (theme === 'light') return 'bg-[#fcfbf9] text-zinc-900'; 
    if (theme === 'purple') return 'bg-gradient-to-b from-[#1c1428] via-[#121212] to-[#0f0b15] text-zinc-200';
    if (theme === 'rose') return 'bg-gradient-to-b from-[#25151a] via-[#121212] to-[#150b0f] text-zinc-200';
    if (theme === 'mint') return 'bg-gradient-to-b from-[#11221c] via-[#121212] to-[#0b1411] text-zinc-200';
    return 'bg-[#121212] text-zinc-200'; 
  };

  return (
    <html lang="ko">
      <body className={`min-h-screen relative font-sans transition-colors duration-200 ${getThemeBackground()} ${activeAccount?.textStroke ? '[text-shadow:_0_1px_3px_rgba(0,0,0,0.9)]' : ''}`}>
        
        {activeAccount?.bgImage && (
          <div
            className="fixed inset-0 z-[-2] bg-cover bg-center pointer-events-none"
            style={{ backgroundImage: `url(${activeAccount.bgImage})` }}
          />
        )}
        {activeAccount?.bgImage && (
          <div 
            className="fixed inset-0 z-[-1] pointer-events-none bg-black"
            style={{ opacity: (activeAccount.dimmer ?? 40) / 100 }}
          />
        )}

        <nav className={`sticky top-0 z-[900] flex flex-col shadow-lg border-b backdrop-blur-md w-full transition-colors ${
          activeAccount?.theme === 'light' 
            ? 'bg-white/90 border-blue-200/60' 
            : 'bg-[#1c1c1e]/90 border-zinc-800'
        }`}>
          {banner && (
            <div className="w-full py-2 bg-red-600 text-white text-center text-xs font-black flex items-center justify-center gap-2 border-b border-red-800">
              <span>🚨</span><span>{banner.message}</span><span>🚨</span>
            </div>
          )}

          <div className="max-w-[1600px] mx-auto px-4 w-full relative">
            <div className="flex items-center justify-between h-20">
             
              <div className="flex items-center gap-3 shrink-0">
                <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity shrink-0">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-colors border border-black/10 relative overflow-hidden shrink-0" style={{ backgroundColor: activeColor }}>
                    <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent"></div>
                    <svg className="w-6 h-6 text-white relative z-10 drop-shadow-sm" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 1L15.39 8.26L23 9.27L17.5 14.14L18.81 21.02L12 17.77L5.19 21.02L6.5 14.14L1 9.27L8.61 8.26L12 1Z" />
                    </svg>
                  </div>
                  <div className="flex flex-col whitespace-nowrap">
                    <span className={`text-[0.55rem] font-bold tracking-tight ${activeAccount?.theme === 'light' ? 'text-zinc-500' : 'text-zinc-400'}`}>데이안 성역 길드 전용 플랫폼</span>
                    <span className={`font-black text-xl leading-tight tracking-wider mt-0.5 ${activeAccount?.theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>SANCTUM</span>
                  </div>
                </Link>

                <div className="relative z-[100] ml-1" ref={wingsRef}>
                  <button 
                    onClick={() => setIsWingsOpen(!isWingsOpen)}
                    className="flex items-center justify-center p-1 transition-transform duration-200 hover:scale-110 active:scale-95 group focus:outline-none"
                    title="정령의 날개 (빠른 이동)"
                  >
                    <span className="text-[1.1rem] drop-shadow-[0_0_6px_rgba(255,255,255,0.9)]">🪽</span>
                  </button>

                  {isWingsOpen && (
                    <div className="fixed sm:absolute top-20 left-4 right-4 sm:right-auto sm:left-0 sm:top-full mt-2 sm:w-[260px] max-w-[calc(100vw-32px)] bg-[#141414] p-1 rounded-xl shadow-[0_0_20px_rgba(0,0,0,0.8)] border border-[#0a0a0c] animate-in fade-in slide-in-from-top-2 z-[9999]">
                      <div className="relative border border-[#00c853] rounded-lg h-full w-full flex flex-col bg-[#141414]">
                        <div className="absolute -top-[3px] -left-[3px] w-2.5 h-2.5 border-t-[1.5px] border-l-[1.5px] border-[#00c853] rounded-tl-full"></div>
                        <div className="absolute -top-[3px] -right-[3px] w-2.5 h-2.5 border-t-[1.5px] border-r-[1.5px] border-[#00c853] rounded-tr-full"></div>
                        <div className="absolute -bottom-[3px] -left-[3px] w-2.5 h-2.5 border-b-[1.5px] border-l-[1.5px] border-[#00c853] rounded-bl-full"></div>
                        <div className="absolute -bottom-[3px] -right-[3px] w-2.5 h-2.5 border-b-[1.5px] border-r-[1.5px] border-[#00c853] rounded-br-full"></div>
                        
                        <div className="p-3 border-b border-[#00c853]/30 flex justify-between items-start">
                          <div>
                            <h3 className="text-[#00c853] font-black text-[1.1rem] tracking-tight">정령의 날개</h3>
                            <p className="text-zinc-400 text-[0.7rem] font-bold mt-1"><span className="text-[#00c853]">고급</span> 재화</p>
                          </div>
                          <div className="w-12 h-12 relative flex items-center justify-center bg-[radial-gradient(circle_at_center,rgba(0,200,83,0.35)_0%,rgba(0,0,0,0)_75%)]">
                            <span className="text-2xl drop-shadow-[0_0_8px_rgba(255,255,255,0.9)] pb-0.5">🪽</span>
                          </div>
                        </div>
                        
                        <div className="p-3 bg-[#111111] rounded-b-lg">
                          <p className="text-[0.65rem] text-[#9ca3af] leading-relaxed mb-4 break-keep font-medium">
                            정령의 힘이 담긴 날개 모양의 장식품.<br/>
                            바람의 정령을 불러내 먼 거리를<br/>빠르게 이동하는데 사용한다.
                          </p>
                          <div className="flex flex-col gap-1.5">
                            <a href="https://mabinogimobile.nexon.com/Main" target="_blank" rel="noreferrer" className="bg-[#1c1c1e] hover:bg-[#252528] text-zinc-300 text-[0.7rem] font-bold py-2 px-2.5 rounded flex justify-between items-center transition border border-zinc-800 hover:border-[#00c853]/50 group">
                              <div className="flex items-center gap-2">
                                <img src="https://www.google.com/s2/favicons?domain=mabinogimobile.nexon.com&sz=32" alt="로고" className="w-4 h-4 rounded-sm" />
                                공식 홈페이지
                              </div>
                              <span className="text-zinc-600 group-hover:text-[#00c853] transition text-[0.6rem]">↗</span>
                            </a>
                            <a href="https://mabimobi.life/" target="_blank" rel="noreferrer" className="bg-[#1c1c1e] hover:bg-[#252528] text-zinc-300 text-[0.7rem] font-bold py-2 px-2.5 rounded flex justify-between items-center transition border border-zinc-800 hover:border-[#00c853]/50 group">
                              <div className="flex items-center gap-2">
                                <img src="https://www.google.com/s2/favicons?domain=mabimobi.life&sz=32" alt="로고" className="w-4 h-4 rounded-sm" />
                                모비라이프
                              </div>
                              <span className="text-zinc-600 group-hover:text-[#00c853] transition text-[0.6rem]">↗</span>
                            </a>
                            <a href="https://arca.live/b/mabimobile" target="_blank" rel="noreferrer" className="bg-[#1c1c1e] hover:bg-[#252528] text-zinc-300 text-[0.7rem] font-bold py-2 px-2.5 rounded flex justify-between items-center transition border border-zinc-800 hover:border-[#00c853]/50 group">
                              <div className="flex items-center gap-2">
                                <img src="https://www.google.com/s2/favicons?domain=arca.live&sz=32" alt="로고" className="w-4 h-4 rounded-sm" />
                                모비 채널 <span className="text-[0.6rem] font-normal text-zinc-500">(아카라이브)</span>
                              </div>
                              <span className="text-zinc-600 group-hover:text-[#00c853] transition text-[0.6rem]">↗</span>
                            </a>
                            <a href="https://gall.dcinside.com/mgallery/board/lists/?id=enban" target="_blank" rel="noreferrer" className="bg-[#1c1c1e] hover:bg-[#252528] text-zinc-300 text-[0.7rem] font-bold py-2 px-2.5 rounded flex justify-between items-center transition border border-zinc-800 hover:border-[#00c853]/50 group">
                              <div className="flex items-center gap-2">
                                <img src="https://www.google.com/s2/favicons?domain=gall.dcinside.com&sz=32" alt="로고" className="w-4 h-4 rounded-sm" />
                                에반 갤러리 <span className="text-[0.6rem] font-normal text-zinc-500">(디시)</span>
                              </div>
                              <span className="text-zinc-600 group-hover:text-[#00c853] transition text-[0.6rem]">↗</span>
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="hidden lg:flex items-center space-x-2 xl:space-x-3">
                {navItems.map((item) => {
                  const isActive = pathname === item.path;
                  return (
                    <Link
                      key={item.en}
                      href={item.path}
                      className={`group relative flex items-center justify-center rounded-md transition-all overflow-hidden h-12 px-3 lg:px-4 shrink-0 ${
                        isActive 
                          ? (activeAccount?.theme === 'light' ? 'bg-blue-50 border-b-2 shadow-sm' : 'bg-zinc-800/90 border-b-2') 
                          : (activeAccount?.theme === 'light' ? 'hover:bg-blue-50/50' : 'hover:bg-zinc-800/50')
                      }`}
                      style={{ borderColor: isActive ? activeColor : 'transparent' }}
                    >
                      <div className="flex flex-col items-center transition-transform duration-300 transform group-hover:-translate-y-12">
                        <span className={`font-black text-[0.7rem] xl:text-[0.75rem] leading-tight whitespace-nowrap ${
                          isActive 
                            ? (activeAccount?.theme === 'light' ? 'text-zinc-900' : 'text-white') 
                            : (activeAccount?.theme === 'light' ? 'text-zinc-700' : 'text-zinc-300')
                        }`}>{item.kr}</span>
                        <span className="text-[0.5rem] font-bold mt-0.5 whitespace-nowrap" style={{ color: activeColor }}>{item.sub}</span>
                      </div>
                      
                      <div className="absolute inset-0 flex items-center justify-center transition-all duration-300 transform translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100">
                        <span className={`font-black tracking-widest text-[0.65rem] xl:text-[0.7rem] whitespace-nowrap ${
                          isActive 
                            ? (activeAccount?.theme === 'light' ? 'text-zinc-900' : 'text-white') 
                            : (activeAccount?.theme === 'light' ? 'text-zinc-600' : 'text-zinc-400')
                        }`}>{item.en}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>

              <div className="hidden lg:flex items-center gap-2.5 relative shrink-0">
                <button 
                  onClick={() => setIsThemeModalOpen(true)}
                  className={`border rounded-xl p-2.5 transition cursor-pointer flex items-center justify-center shadow-sm ${
                    activeAccount?.theme === 'light' 
                      ? 'bg-white border-blue-300 text-zinc-700 hover:text-black hover:border-blue-500' 
                      : 'bg-[#121212] border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500'
                  }`}
                  title="성역 테마 및 배경 설정"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.5 2h-13C4.12 2 3 3.12 3 4.5v3C3 8.88 4.12 10 5.5 10H7v1c0 1.66 1.34 3 3 3h1v4.5C11 19.88 12.12 21 13.5 21h2c1.38 0 2.5-1.12 2.5-2.5V14h1c1.66 0 3-1.34 3-3V4.5C21 3.12 19.88 2 18.5 2zM19 11c0 .55-.45 1-1 1h-1V9h1c.55 0 1 .45 1 1v1zm-3-8v3H8V3h8z" />
                  </svg>
                </button>

                <div className={`border rounded-xl p-2.5 transition cursor-pointer flex items-center justify-center shadow-sm ${
                  activeAccount?.theme === 'light' 
                    ? 'bg-white border-blue-300 text-zinc-700 hover:text-black hover:border-blue-500' 
                    : 'bg-[#121212] border-zinc-700 text-zinc-400 hover:text-white'
                }`} title="메일함 (목업)">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                  </svg>
                </div>

                {mounted ? (
                  activeAccount ? (
                    <div className="relative" ref={accountMenuRef}>
                      <button onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)} className={`flex items-center gap-2 px-3.5 py-2 rounded-full border transition shadow-md whitespace-nowrap ${
                        activeAccount?.theme === 'light' 
                          ? 'bg-white hover:bg-blue-50 text-zinc-900 border-blue-300' 
                          : 'bg-[#121212] hover:bg-zinc-800 text-white'
                      }`} style={{ borderColor: activeColor }}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[0.65rem] shrink-0 ${activeAccount?.theme === 'light' ? 'bg-blue-100 text-blue-800' : 'bg-zinc-800 text-white'}`}>👑</div>
                        <div className="flex flex-col text-left leading-none whitespace-nowrap">
                          <span className={`text-[0.7rem] font-bold flex items-center gap-1 max-w-[120px] truncate ${activeAccount?.theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>{activeAccount.alias || activeAccount.nickname}</span>
                          <span className="text-[0.55rem] text-zinc-500 mt-0.5">{activeAccount.role}</span>
                        </div>
                        <span className="text-[0.55rem] text-zinc-400 ml-1">▼</span>
                      </button>

                      {isAccountMenuOpen && (
                        <div className={`absolute right-0 mt-2 w-56 border rounded-xl shadow-2xl z-[960] overflow-hidden p-2 ${
                          activeAccount?.theme === 'light' 
                            ? 'bg-white border-blue-200 text-zinc-900 shadow-xl' 
                            : 'bg-[#1c1c1e] border-zinc-700 text-white'
                        }`}>
                          <div className="text-[0.55rem] font-bold text-zinc-500 px-2 py-1">현재 활성 계정</div>
                          <div className={`flex items-center justify-between p-2 rounded-lg mb-2 border-l-4 ${activeAccount?.theme === 'light' ? 'bg-blue-50' : 'bg-zinc-800/80'}`} style={{ borderColor: activeColor }}>
                            <span className={`text-[0.7rem] font-black truncate ${activeAccount?.theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>{activeAccount.alias || activeAccount.nickname}</span>
                            <span className="text-[0.55rem] bg-blue-500/20 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded shrink-0">선택됨</span>
                          </div>

                          {accounts.filter(a => a.id !== activeAccount.id).length > 0 && (
                            <>
                              <div className="text-[0.55rem] font-bold text-zinc-500 px-2 py-1 border-t border-zinc-200 dark:border-zinc-800 mt-1">계정 빠른 스위칭</div>
                              {accounts.filter(a => a.id !== activeAccount.id).map(acc => (
                                <button key={acc.id} onClick={() => switchAccount(acc)} className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition my-0.5 ${activeAccount?.theme === 'light' ? 'hover:bg-blue-50 text-zinc-700' : 'hover:bg-zinc-800 text-zinc-300'}`}>
                                  <span className="text-[0.7rem] font-bold truncate">{acc.alias || acc.nickname}</span>
                                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: acc.borderColor }}></span>
                                </button>
                              ))}
                            </>
                          )}

                          <div className="border-t border-zinc-200 dark:border-zinc-800 mt-2 pt-1 flex flex-col gap-1">
                            <Link href="/login" className="w-full text-center text-[0.7rem] font-bold text-blue-600 dark:text-[#e6c788] hover:bg-blue-50 dark:hover:bg-zinc-800 py-1.5 rounded transition">➕ 계정 추가 로그인</Link>
                            {isAdmin && <Link href="/admin" className="w-full text-center text-[0.7rem] font-bold text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 py-1.5 rounded transition">⚙️ SANCTUM 관리자 {pendingCount > 0 && <span className="bg-red-500 text-white px-1.5 py-0.2 rounded-full text-[0.55rem] ml-1">{pendingCount}</span>}</Link>}
                            <button onClick={handleLogout} className="w-full text-center text-[0.7rem] font-bold text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 py-1.5 rounded transition">🚪 현재 계정 로그아웃</button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <Link href="/login" className="text-[0.7rem] font-bold text-[#e6c788] hover:text-yellow-400 whitespace-nowrap">로그인</Link>
                  )
                ) : (
                  <div className="w-28 h-9 bg-zinc-800/50 rounded-full animate-pulse"></div>
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* 모바일 플로팅 버튼 (FAB) - 💡 터치 클릭 무반응 문제 해결 */}
        <div
          className={`lg:hidden fixed bottom-6 z-[10000] flex items-center rounded-full shadow-[0_0_15px_rgba(0,0,0,0.7)] border-[1.5px] cursor-grab active:cursor-grabbing select-none ${activeAccount?.theme === 'light' ? 'bg-white shadow-lg' : 'bg-[#1c1c1e]'}`}
          style={{ right: `${fabPosition.x}px`, borderColor: activeColor }}
          onPointerDown={handlePointerDown}
        >
          <button onClick={handleHomeClick} className={`w-[2.2rem] h-[2.2rem] flex items-center justify-center rounded-l-full transition-colors ${activeAccount?.theme === 'light' ? 'border-r border-zinc-200 hover:bg-blue-50' : 'border-r border-zinc-800 hover:bg-zinc-800'}`}>
            <svg className="w-3.5 h-3.5 drop-shadow-sm" style={{ color: activeColor }} viewBox="0 0 24 24" fill="currentColor">
               <path d="M12 1L15.39 8.26L23 9.27L17.5 14.14L18.81 21.02L12 17.77L5.19 21.02L6.5 14.14L1 9.27L8.61 8.26L12 1Z" />
            </svg>
          </button>
          <button onClick={handleMenuClick} className={`w-[2.2rem] h-[2.2rem] flex items-center justify-center rounded-r-full transition-colors relative ${isFabOpen ? (activeAccount?.theme === 'light' ? 'bg-blue-100' : 'bg-zinc-800') : (activeAccount?.theme === 'light' ? 'hover:bg-blue-50' : 'hover:bg-zinc-800')}`}>
            {isFabOpen ? (
              <svg className={`w-4 h-4 ${activeAccount?.theme === 'light' ? 'text-zinc-900' : 'text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
            ) : (
              <svg className={`w-4 h-4 ${activeAccount?.theme === 'light' ? 'text-zinc-900' : 'text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16"></path></svg>
            )}
          </button>
        </div>

        <div
          className={`fixed inset-0 z-[9998] lg:hidden bg-black/60 transition-opacity duration-300 ${isFabOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
          onClick={() => setIsFabOpen(false)}
        />

        <div
          className={`fixed inset-x-0 bottom-0 z-[9999] lg:hidden border-t-[1.5px] rounded-t-[28px] p-4 shadow-2xl flex flex-col ${activeAccount?.theme === 'light' ? 'bg-white text-zinc-900' : 'bg-[#1c1c1e] text-white'} ${isDraggingSheet ? '' : 'transition-transform duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]'} ${isFabOpen ? 'translate-y-0' : 'translate-y-[120%]'}`}
          style={{ 
            borderColor: activeColor, 
            transform: isFabOpen ? `translateY(${sheetTranslateY}px)` : 'translateY(120%)' 
          }}
        >
          <div 
            className="w-full py-2.5 flex items-center justify-center cursor-grab active:cursor-grabbing touch-none select-none"
            onPointerDown={handleSheetDragStart}
          >
            <div className="w-10 h-1.5 bg-zinc-400 dark:bg-zinc-600 rounded-full" />
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
                        ? (activeAccount?.theme === 'light' ? 'bg-blue-50 border-l-[3px] shadow-sm' : 'bg-zinc-800/90 border-l-[3px] shadow-sm') 
                        : (activeAccount?.theme === 'light' ? 'bg-zinc-50 border-zinc-200' : 'bg-[#252528] border-zinc-800')
                    }`}
                    style={{ borderLeftColor: isActive ? activeColor : undefined }}
                  >
                    <span className="absolute -right-1 -bottom-2 text-[1.6rem] font-black italic opacity-[0.06] select-none pointer-events-none uppercase tracking-tighter">
                      {item.en}
                    </span>
                   
                    {isActive && <div className={`absolute inset-y-0 right-0 w-12 bg-gradient-to-l ${activeAccount?.theme === 'light' ? 'from-blue-600/10' : 'from-[#e6c788]/10'} to-transparent pointer-events-none`}></div>}

                    <div className="relative z-10 flex items-center justify-between w-full">
                      <div className="flex flex-col">
                        <span className="font-black text-[0.75rem] tracking-wide leading-tight whitespace-nowrap" style={{ color: activeColor }}>{item.kr}</span>
                        <span className={`text-[0.55rem] font-bold mt-1 whitespace-nowrap ${activeAccount?.theme === 'light' ? 'text-zinc-600' : 'text-zinc-400'}`}>{item.sub}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            <div className={`rounded-xl border overflow-hidden mt-1 ${activeAccount?.theme === 'light' ? 'bg-blue-50/50 border-blue-200' : 'bg-[#121212] border-zinc-700/60'}`}>
              <div className={`flex items-center justify-between px-3.5 py-3 ${activeAccount?.theme === 'light' ? 'bg-blue-100/60' : 'bg-[#252528]'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full border flex items-center justify-center text-[0.7rem] shadow-inner shrink-0 ${activeAccount?.theme === 'light' ? 'bg-white border-blue-300 text-blue-800' : 'bg-zinc-800 border-zinc-600 text-white'}`}>👑</div>
                  <div className="flex flex-col whitespace-nowrap">
                    <span className={`text-[0.7rem] font-black leading-tight ${activeAccount?.theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>{activeAccount?.alias || activeAccount?.nickname || "로그인 필요"}</span>
                    <span className="text-[0.55rem] font-bold uppercase mt-0.5" style={{ color: activeColor }}>{activeAccount?.role || "길드원"}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button 
                    onClick={() => { setIsThemeModalOpen(true); setIsFabOpen(false); }}
                    className={`p-2 rounded-md border transition flex items-center justify-center ${activeAccount?.theme === 'light' ? 'bg-white border-blue-300 text-zinc-700 hover:bg-blue-50' : 'bg-[#121212] border-zinc-700 text-zinc-400 hover:text-white'}`}
                    title="테마 및 배경 설정"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.5 2h-13C4.12 2 3 3.12 3 4.5v3C3 8.88 4.12 10 5.5 10H7v1c0 1.66 1.34 3 3 3h1v4.5C11 19.88 12.12 21 13.5 21h2c1.38 0 2.5-1.12 2.5-2.5V14h1c1.66 0 3-1.34 3-3V4.5C21 3.12 19.88 2 18.5 2zM19 11c0 .55-.45 1-1 1h-1V9h1c.55 0 1 .45 1 1v1zm-3-8v3H8V3h8z" />
                    </svg>
                  </button>

                  <div className={`p-2 rounded-md border flex items-center justify-center ${activeAccount?.theme === 'light' ? 'bg-white border-blue-300 text-zinc-700' : 'bg-[#121212] border-zinc-700 text-zinc-400'}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                  </div>

                  <button
                    onClick={() => setIsMobileAccountMenuOpen(!isMobileAccountMenuOpen)}
                    className={`p-1.5 rounded-md border transition-all duration-300 ${isMobileAccountMenuOpen ? 'bg-zinc-700 text-white border-zinc-500' : (activeAccount?.theme === 'light' ? 'bg-white text-zinc-700 border-blue-300 hover:bg-blue-50' : 'bg-zinc-800 text-zinc-400 border-zinc-700')}`}
                  >
                    <svg className={`w-4 h-4 transition-transform duration-300 ${isMobileAccountMenuOpen ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                  </button>
                </div>
              </div>

              {isMobileAccountMenuOpen && (
                <div className={`p-3 flex flex-col gap-1.5 border-t animate-in fade-in slide-in-from-top-2 ${activeAccount?.theme === 'light' ? 'bg-white border-blue-200' : 'bg-[#1a1a1c] border-zinc-800'}`}>
                  <div className="text-[0.55rem] font-bold text-zinc-500 px-2 mb-1">빠른 계정 스위칭</div>
                 
                  {accounts.filter(a => a.id !== activeAccount?.id).map(acc => (
                    <button key={acc.id} onClick={() => switchAccount(acc)} className={`w-full flex items-center justify-between p-2.5 rounded-lg text-left transition border ${activeAccount?.theme === 'light' ? 'bg-blue-50 hover:bg-blue-100 border-blue-200 text-zinc-900' : 'bg-zinc-800/60 hover:bg-zinc-700 border-zinc-700/50 text-zinc-200'}`}>
                      <span className="text-[0.7rem] font-bold">{acc.alias || acc.nickname}</span>
                      <span className="text-[0.55rem] text-zinc-500 bg-black/10 dark:bg-[#121212] px-1.5 py-0.5 rounded-md">스위치 🔄</span>
                    </button>
                  ))}
                  {accounts.filter(a => a.id !== activeAccount?.id).length === 0 && <div className="text-[0.55rem] text-zinc-500 px-2 py-1 text-center">등록된 부계정이 없습니다.</div>}

                  <div className="h-px w-full bg-zinc-200 dark:bg-zinc-800 my-1"></div>
                 
                  <Link href="/login" onClick={() => setIsFabOpen(false)} className={`w-full text-center text-[0.65rem] font-bold py-2.5 rounded-lg transition border ${activeAccount?.theme === 'light' ? 'text-blue-600 bg-blue-50 border-blue-200 hover:bg-blue-100' : 'text-[#e6c788] bg-yellow-900/10 border-yellow-900/30'}`}>➕ 계정 추가 로그인</Link>
                  {isAdmin && <Link href="/admin" onClick={() => setIsFabOpen(false)} className="w-full text-center text-[0.65rem] font-bold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800/80 py-2.5 rounded-lg transition border border-zinc-300 dark:border-zinc-700">⚙️ SANCTUM 관리자 메뉴</Link>}
                  <button onClick={handleLogout} className="w-full text-center text-[0.65rem] font-bold text-red-500 dark:text-red-400 bg-red-950/20 py-2.5 rounded-lg transition border border-red-900/30">🚪 활성 계정 로그아웃</button>
                </div>
              )}
            </div>
          </div>
        </div>

        {isThemeModalOpen && (
          <div className="fixed inset-0 z-[11000] flex items-center justify-center p-4 bg-black/70 animate-in fade-in duration-200">
            <div className="bg-[#161618]/95 border border-zinc-600 rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.9)] w-full max-w-md overflow-hidden flex flex-col">
              <div className="bg-[#222225] p-4 border-b border-zinc-700 flex justify-between items-center">
                <h3 className="text-white font-black text-base flex items-center gap-2">
                  <span>🎨</span> 성역 테마 & 배경 설정 ({activeAccount?.nickname})
                </h3>
                <button onClick={() => setIsThemeModalOpen(false)} className="text-zinc-400 hover:text-white text-xl">&times;</button>
              </div>

              <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto custom-scrollbar">
                
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-300">성역 화면 프리셋 테마</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setTempTheme('dark')}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center gap-2 ${tempTheme === 'dark' ? 'bg-[#121212] border-[#e6c788] text-white shadow-lg' : 'bg-[#121212] border-zinc-700 text-zinc-400 hover:border-zinc-500'}`}
                    >
                      <span className="w-3.5 h-3.5 rounded-full bg-[#121212] border border-zinc-500"></span>
                      기본 다크모드
                    </button>
                    <button
                      type="button"
                      onClick={() => setTempTheme('light')}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center gap-2 ${tempTheme === 'light' ? 'bg-blue-50 border-blue-500 text-zinc-900 shadow-lg' : 'bg-[#121212] border-zinc-700 text-zinc-400 hover:border-zinc-500'}`}
                    >
                      <span className="w-3.5 h-3.5 rounded-full bg-blue-100 border-blue-400"></span>
                      클린 라이트 블루
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setTempTheme('mint')}
                      className={`p-2.5 rounded-xl border text-[0.7rem] font-bold transition flex flex-col items-center gap-1 ${tempTheme === 'mint' ? 'bg-[#11221c] border-[#00c853] text-white shadow-lg' : 'bg-[#121212] border-zinc-700 text-zinc-400 hover:border-zinc-500'}`}
                    >
                      <span className="w-3 h-3 rounded-full bg-[#11221c] border border-[#00c853]"></span>
                      민트바닐라
                    </button>
                    <button
                      type="button"
                      onClick={() => setTempTheme('purple')}
                      className={`p-2.5 rounded-xl border text-[0.7rem] font-bold transition flex flex-col items-center gap-1 ${tempTheme === 'purple' ? 'bg-[#1c1428] border-purple-500 text-white shadow-lg' : 'bg-[#121212] border-zinc-700 text-zinc-400 hover:border-zinc-500'}`}
                    >
                      <span className="w-3 h-3 rounded-full bg-[#1c1428] border border-purple-500"></span>
                      퍼플릿
                    </button>
                    <button
                      type="button"
                      onClick={() => setTempTheme('rose')}
                      className={`p-2.5 rounded-xl border text-[0.7rem] font-bold transition flex flex-col items-center gap-1 ${tempTheme === 'rose' ? 'bg-[#25151a] border-rose-500 text-white shadow-lg' : 'bg-[#121212] border-zinc-700 text-zinc-400 hover:border-zinc-500'}`}
                    >
                      <span className="w-3 h-3 rounded-full bg-[#25151a] border border-rose-500"></span>
                      로즈블룸
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-300">커스텀 배경 이미지 주소 (URL)</label>
                  <input
                    type="text"
                    placeholder="https://example.com/image.jpg"
                    value={tempBgImage}
                    onChange={(e) => setTempBgImage(e.target.value)}
                    className="w-full bg-[#111113] border border-zinc-600 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#e6c788]"
                  />
                  <p className="text-[0.6rem] text-zinc-400">* 이 기기에서 현재 계정에만 적용되는 로컬 배경입니다.</p>
                </div>

                {tempBgImage && (
                  <div className="p-3 bg-[#111113] border border-zinc-700 rounded-xl space-y-3">
                    <span className="text-xs font-black text-[#e6c788] block">👁️ 커스텀 배경 시인성 보정</span>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-zinc-300">배경 어둡기 (오버레이)</span>
                        <span className="text-[#e6c788]">{tempDimmer}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="85"
                        value={tempDimmer}
                        onChange={(e) => setTempDimmer(Number(e.target.value))}
                        className="w-full accent-[#e6c788]"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs font-bold text-zinc-300">글자 텍스트 외곽선 그림자</span>
                      <button
                        type="button"
                        onClick={() => setTempTextStroke(!tempTextStroke)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition ${tempTextStroke ? 'bg-[#e6c788] text-black' : 'bg-zinc-800 text-zinc-400'}`}
                      >
                        {tempTextStroke ? '적용됨 ON' : 'OFF'}
                      </button>
                    </div>
                  </div>
                )}

                <div className="pt-3 border-t border-zinc-700 flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-300">화면 글자 크기</span>
                  <div className="flex items-center bg-[#111113] border border-zinc-600 rounded-xl p-1 gap-1">
                    <button onClick={() => setFontSizeLevel('small')} className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${fontSizeLevel === 'small' ? 'bg-zinc-700 text-white shadow' : 'text-zinc-400 hover:text-zinc-200'}`}>A-</button>
                    <button onClick={() => setFontSizeLevel('normal')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${fontSizeLevel === 'normal' ? 'bg-zinc-700 text-white shadow' : 'text-zinc-400 hover:text-zinc-200'}`}>A</button>
                    <button onClick={() => setFontSizeLevel('large')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${fontSizeLevel === 'large' ? 'bg-zinc-700 text-white shadow' : 'text-zinc-400 hover:text-zinc-200'}`}>A+</button>
                  </div>
                </div>
              </div>

              <div className="bg-[#222225] p-4 border-t border-zinc-700 flex justify-between gap-2">
                <button onClick={() => setIsThemeModalOpen(false)} className="px-5 py-2 rounded-lg bg-zinc-800 text-zinc-300 text-xs font-bold hover:bg-zinc-700 transition">취소</button>
                <button onClick={handleSaveThemeSettings} className="px-5 py-2 rounded-lg bg-[#e6c788] text-black text-xs font-black hover:bg-yellow-500 transition shadow">적용하기</button>
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