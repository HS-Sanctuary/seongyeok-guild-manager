"use client";

import './globals.css';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { AccountPreset, Sticker, navItems } from '@/types/layout';
import { processImageCutout } from '@/lib/imageUtils';
import Navbar from '@/components/layout/Navbar';
import MobileBottomSheet from '@/components/layout/MobileBottomSheet';
import ThemeModal from '@/components/layout/ThemeModal';
import StickerCanvas from '@/components/layout/StickerCanvas';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [accounts, setAccounts] = useState<AccountPreset[]>([]);
  const [activeAccount, setActiveAccount] = useState<AccountPreset | null>(null);

  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isWingsOpen, setIsWingsOpen] = useState(false);
  
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [tempTheme, setTempTheme] = useState('aureum');

  const [isFabOpen, setIsFabOpen] = useState(false);
  const [fabPosition, setFabPosition] = useState<{ x: number }>({ x: 20 });
  const [fontSizeLevel, setFontSizeLevel] = useState('normal');
  
  const [sheetDragY, setSheetDragY] = useState(0);
  const [isDraggingSheet, setIsDraggingSheet] = useState(false);

  const [showNavbar, setShowNavbar] = useState(true);
  const [headerHeight, setHeaderHeight] = useState(60);
  const lastScrollY = useRef(0);
  const headerRef = useRef<HTMLElement>(null);

  const [stickers, setStickers] = useState<Sticker[]>([]);
  const stickersRef = useRef<Sticker[]>([]);
  stickersRef.current = stickers;

  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(null);
  const [activeStickerTab, setActiveStickerTab] = useState<'scale' | 'rotation' | 'opacity' | 'layer'>('scale');
  const [configStickerId, setConfigStickerId] = useState<string | null>(null);
  
  const globalStickerInputRef = useRef<HTMLInputElement>(null);
  const changeStickerImageRef = useRef<HTMLInputElement>(null);

  const dragStartX = useRef(0);
  const startFabX = useRef(0);
  const hasMoved = useRef(false);

  const wingsRef = useRef<HTMLDivElement>(null);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  const [pendingCount, setPendingCount] = useState(0);
  const [banner, setBanner] = useState<any>(null);

  // 헤더 동적 높이 측정
  useEffect(() => {
    if (headerRef.current) {
      setHeaderHeight(headerRef.current.offsetHeight);
    }
  }, [banner, mounted, fontSizeLevel]);

  // 스크롤 감지
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          if (currentScrollY > lastScrollY.current && currentScrollY > 50) {
            setShowNavbar(false);
          } else if (currentScrollY < lastScrollY.current || currentScrollY <= 10) {
            setShowNavbar(true);
          }
          lastScrollY.current = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 외부 클릭 감지
  useEffect(() => {
    const handleGlobalClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as HTMLElement;
      if (
        target.closest('.sticker-item') || 
        target.closest('.sticker-toolbar') || 
        target.closest('.sticker-modal')
      ) {
        return;
      }
      setSelectedStickerId(null);
    };

    window.addEventListener('mousedown', handleGlobalClickOutside, true);
    window.addEventListener('touchstart', handleGlobalClickOutside, true);
    return () => {
      window.removeEventListener('mousedown', handleGlobalClickOutside, true);
      window.removeEventListener('touchstart', handleGlobalClickOutside, true);
    };
  }, []);

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

  // 🚀 ESC 키로 모든 모달/메뉴/바텀시트 감지 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isThemeModalOpen) setIsThemeModalOpen(false);
        if (isFabOpen) setIsFabOpen(false);
        if (isWingsOpen) setIsWingsOpen(false);
        if (isAccountMenuOpen) setIsAccountMenuOpen(false);
        if (selectedStickerId) setSelectedStickerId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isThemeModalOpen, isFabOpen, isWingsOpen, isAccountMenuOpen, selectedStickerId]);

  useEffect(() => {
    setMounted(true);
    const savedFont = localStorage.getItem('nexus_font_size') || 'normal';
    setFontSizeLevel(savedFont);
    loadAccounts();

    const handleAccountChange = () => { loadAccounts(); };
    window.addEventListener("sanctum_account_changed", handleAccountChange);
    return () => window.removeEventListener("sanctum_account_changed", handleAccountChange);
  }, []);

  useEffect(() => {
    if (!pathname) return;
    const savedStickers = localStorage.getItem(`sanctum_stickers_${pathname}`);
    if (savedStickers) {
      try { 
        const parsed: Sticker[] = JSON.parse(savedStickers);
        setStickers(parsed); 
      } catch (e) { 
        setStickers([]); 
      }
    } else {
      setStickers([]);
    }
    setSelectedStickerId(null);
  }, [pathname]);

  const saveStickers = (newStickers: Sticker[]) => {
    setStickers(newStickers);
    if (pathname) {
      try {
        localStorage.setItem(`sanctum_stickers_${pathname}`, JSON.stringify(newStickers));
      } catch (e) {
        console.warn("Storage Quota Exceeded handled safely:", e);
      }
    }
  };

  const handleResetStickerPositions = () => {
    if (stickers.length === 0) {
      alert("현재 페이지에 배치된 스티커가 없습니다.");
      return;
    }
    const resetList = stickers.map((s, idx) => ({
      ...s,
      x: 35 + (idx % 4) * 6,
      y: 25 + (idx % 4) * 6,
      zIndex: 30,
      isLocked: false
    }));
    saveStickers(resetList);
    alert("🧹 모든 스티커 위치가 화면 중앙으로 구출되었습니다!");
  };

  const handleGlobalStickerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const processedUrl = await processImageCutout(file);
    const newSticker: Sticker = {
      id: `stk_${Date.now()}`,
      url: processedUrl,
      x: 35 + (stickers.length % 5) * 5,
      y: 25 + (stickers.length % 5) * 5,
      scale: 1,
      rotation: 0,
      opacity: 1,
      frameStyle: "sticker",
      zIndex: 30,
      isLocked: false
    };
    const updated = [...stickers, newSticker];
    saveStickers(updated);
    setSelectedStickerId(newSticker.id);
    setIsThemeModalOpen(false);
    e.target.value = "";
  };

  const updateSticker = (id: string, key: keyof Sticker, val: any) => {
    const updated = stickers.map(s => s.id === id ? { ...s, [key]: val } : s);
    saveStickers(updated);
  };

  const deleteSticker = (id: string) => {
    const updated = stickers.filter(s => s.id !== id);
    saveStickers(updated);
    if (selectedStickerId === id) setSelectedStickerId(null);
    setConfigStickerId(null);
  };

  const handleChangeStickerImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !configStickerId) return;
    const processedUrl = await processImageCutout(file);
    updateSticker(configStickerId, 'url', processedUrl);
    e.target.value = "";
  };

  const handleStartMoveSticker = (stkId: string, e: React.PointerEvent) => {
    const targetTag = (e.target as HTMLElement).tagName;
    if (targetTag === 'INPUT' || targetTag === 'BUTTON') return;

    const stk = stickers.find(s => s.id === stkId);
    if (!stk || stk.isLocked) return;

    e.stopPropagation();
    e.preventDefault();

    const startMouseX = e.clientX;
    const startMouseY = e.clientY;
    const startStkX = stk.x;
    const startStkY = stk.y;

    const mainElement = document.querySelector('main');
    const containerW = mainElement ? mainElement.clientWidth : window.innerWidth;
    const containerH = mainElement ? mainElement.clientHeight : window.innerHeight;

    const onPointerMove = (moveEvt: PointerEvent) => {
      moveEvt.preventDefault();
      const deltaXPercent = ((moveEvt.clientX - startMouseX) / containerW) * 100;
      const deltaYPercent = ((moveEvt.clientY - startMouseY) / containerH) * 100;
      
      const newX = Math.max(0, Math.min(95, startStkX + deltaXPercent));
      const newY = Math.max(0, Math.min(98, startStkY + deltaYPercent));

      setStickers((prev) => prev.map(s => s.id === stkId ? { ...s, x: newX, y: newY } : s));
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      saveStickers(stickersRef.current);
    };

    window.addEventListener('pointermove', onPointerMove, { passive: false });
    window.addEventListener('pointerup', onPointerUp);
  };

  useEffect(() => {
    const root = document.documentElement;
    const targetTheme = activeAccount?.theme || 'aureum';

    if (targetTheme.startsWith('custom_')) {
      root.setAttribute('data-theme', targetTheme);
      const savedCustom = localStorage.getItem(`sanctum_theme_${targetTheme}`);
      if (savedCustom) {
        try {
          const parsed = JSON.parse(savedCustom);
          if (parsed.colors) {
            root.style.setProperty("--background", parsed.colors.background);
            root.style.setProperty("--panel", parsed.colors.panel);
            root.style.setProperty("--panel-border", parsed.colors.panelBorder);
            root.style.setProperty("--inner-box", parsed.colors.innerBox);
            root.style.setProperty("--text-main", parsed.colors.textMain);
            root.style.setProperty("--text-sub", parsed.colors.textSub);
            root.style.setProperty("--accent", parsed.colors.accent);
            root.style.setProperty("--accent-fg", parsed.colors.accentFg || "#000000");
            root.style.setProperty("--accent-secondary", parsed.colors.accentSecondary);
            root.style.setProperty("--accent-secondary-fg", parsed.colors.accentSecondaryFg || "#000000");
            root.style.setProperty("--accent-secondary2", parsed.colors.accentSecondary2 || "#34D399");
            root.style.setProperty("--accent-secondary2-fg", parsed.colors.accentSecondary2Fg || "#000000");
          }
        } catch (e) {}
      }
    } else {
      root.setAttribute('data-theme', targetTheme);
      root.style.removeProperty("--background");
      root.style.removeProperty("--panel");
      root.style.removeProperty("--panel-border");
      root.style.removeProperty("--inner-box");
      root.style.removeProperty("--text-main");
      root.style.removeProperty("--text-sub");
      root.style.removeProperty("--accent");
      root.style.removeProperty("--accent-fg");
      root.style.removeProperty("--accent-secondary");
      root.style.removeProperty("--accent-secondary-fg");
      root.style.removeProperty("--accent-secondary2");
      root.style.removeProperty("--accent-secondary2-fg");
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
        try { parsedAccounts = JSON.parse(savedAccounts); } catch (e) {}
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
    } catch (e) {}
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
    setIsFabOpen(false);
    
    window.dispatchEvent(new CustomEvent("sanctum_account_changed", { detail: acc }));
    window.location.reload();
  };

  const handleSaveThemeSettings = () => {
    if (!activeAccount) return;
    
    const updatedAccounts = accounts.map(acc => {
      if (acc.id === activeAccount.id) {
        return { ...acc, theme: tempTheme };
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

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    dragStartX.current = e.clientX;
    startFabX.current = fabPosition.x;
    hasMoved.current = false;

    const onPointerMove = (moveEvent: PointerEvent) => {
      const deltaX = dragStartX.current - moveEvent.clientX;
      if (Math.abs(deltaX) > 8) hasMoved.current = true;
      if (hasMoved.current) {
        let newX = startFabX.current + deltaX;
        const maxLeft = window.innerWidth - 110;
        if (newX < 16) newX = 16;
        if (newX > maxLeft) newX = maxLeft;
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

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasMoved.current) return;
    setIsFabOpen((prev) => !prev);
  };

  const handleSheetDragStart = (e: React.PointerEvent) => {
    const startY = e.clientY;
    setIsDraggingSheet(true);

    const onPointerMove = (moveEvt: PointerEvent) => {
      const deltaY = moveEvt.clientY - startY;
      if (deltaY > 0) {
        setSheetDragY(deltaY);
      } else {
        setSheetDragY(0);
      }
    };

    const onPointerUp = (upEvt: PointerEvent) => {
      const finalDeltaY = upEvt.clientY - startY;
      setIsDraggingSheet(false);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);

      if (finalDeltaY > 80) {
        setIsFabOpen(false);
        setSheetDragY(0);
      } else {
        setSheetDragY(0);
      }
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  useEffect(() => {
    if (activeAccount) {
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

  const isAdmin = !!activeAccount;
  const isLoginPage = pathname === '/login';

  return (
    <html lang="ko">
      <body className="min-h-screen relative font-sans transition-colors duration-200 bg-[var(--background)] text-[var(--foreground)] overflow-x-hidden">
        {isLoginPage ? (
          children
        ) : (
          <>
            <input ref={globalStickerInputRef} type="file" accept="image/*" onChange={handleGlobalStickerUpload} className="hidden" />
            <input ref={changeStickerImageRef} type="file" accept="image/*" onChange={handleChangeStickerImage} className="hidden" />

            {/* 네비게이션바 */}
            <Navbar
              headerRef={headerRef}
              showNavbar={showNavbar}
              banner={banner}
              pathname={pathname}
              navItems={navItems}
              wingsRef={wingsRef}
              isWingsOpen={isWingsOpen}
              setIsWingsOpen={setIsWingsOpen}
              setIsThemeModalOpen={setIsThemeModalOpen}
              mounted={mounted}
              activeAccount={activeAccount}
              accounts={accounts}
              accountMenuRef={accountMenuRef}
              isAccountMenuOpen={isAccountMenuOpen}
              setIsAccountMenuOpen={setIsAccountMenuOpen}
              switchAccount={switchAccount}
              isAdmin={isAdmin}
              pendingCount={pendingCount}
              handleLogout={handleLogout}
            />

            {/* 상단 여백 동적 맞춤 Placeholder */}
            <div style={{ height: headerHeight }} className="w-full shrink-0 transition-all duration-300 pointer-events-none" />

            {/* 모바일 바텀시트 & FAB (딤드 오버레이 포함) */}
            <MobileBottomSheet
              fabPosition={fabPosition}
              handlePointerDown={handlePointerDown}
              handleHomeClick={handleHomeClick}
              handleMenuClick={handleMenuClick}
              isFabOpen={isFabOpen}
              setIsFabOpen={setIsFabOpen}
              isDraggingSheet={isDraggingSheet}
              sheetDragY={sheetDragY}
              handleSheetDragStart={handleSheetDragStart}
              setIsThemeModalOpen={setIsThemeModalOpen}
              navItems={navItems}
              pathname={pathname}
            />

            {/* 생텀 설정 모달 */}
            <ThemeModal
              isThemeModalOpen={isThemeModalOpen}
              setIsThemeModalOpen={setIsThemeModalOpen}
              activeAccount={activeAccount}
              tempTheme={tempTheme}
              setTempTheme={setTempTheme}
              globalStickerInputRef={globalStickerInputRef}
              handleResetStickerPositions={handleResetStickerPositions}
              stickers={stickers}
              updateSticker={updateSticker}
              setSelectedStickerId={setSelectedStickerId}
              deleteSticker={deleteSticker}
              fontSizeLevel={fontSizeLevel}
              setFontSizeLevel={setFontSizeLevel}
              handleSaveThemeSettings={handleSaveThemeSettings}
              router={router}
            />

            {/* 메인 레이아웃 컨테이너 */}
            <main className="max-w-[1600px] mx-auto px-4 py-6 w-full relative bg-transparent min-h-screen">
              
              {/* [LAYER 0] 카드 뒤 스티커 레이어 */}
              <StickerCanvas
                layer="back"
                stickers={stickers}
                selectedStickerId={selectedStickerId}
                setSelectedStickerId={setSelectedStickerId}
                handleStartMoveSticker={handleStartMoveSticker}
                updateSticker={updateSticker}
                deleteSticker={deleteSticker}
                setConfigStickerId={setConfigStickerId}
                activeStickerTab={activeStickerTab}
                setActiveStickerTab={setActiveStickerTab}
              />

              {/* [LAYER 10] 메인 콘텐츠 레이어 */}
              <div className="relative z-[10] pointer-events-auto">
                {children}
              </div>

              {/* [LAYER 20] 카드 앞 스티커 및 설정 툴바 레이어 */}
              <StickerCanvas
                layer="front"
                stickers={stickers}
                selectedStickerId={selectedStickerId}
                setSelectedStickerId={setSelectedStickerId}
                handleStartMoveSticker={handleStartMoveSticker}
                updateSticker={updateSticker}
                deleteSticker={deleteSticker}
                setConfigStickerId={setConfigStickerId}
                activeStickerTab={activeStickerTab}
                setActiveStickerTab={setActiveStickerTab}
              />

            </main>
          </>
        )}
      </body>
    </html>
  );
}