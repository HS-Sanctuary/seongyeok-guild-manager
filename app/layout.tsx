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

interface Sticker {
  id: string;
  url: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  opacity: number;
  frameStyle: "none" | "gold" | "polaroid" | "neon" | "sticker";
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
  const [isWingsOpen, setIsWingsOpen] = useState(false);
  
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [tempTheme, setTempTheme] = useState('aureum');

  const [isFabOpen, setIsFabOpen] = useState(false);
  const [fabPosition, setFabPosition] = useState<{ x: number }>({ x: 20 });
  const [fontSizeLevel, setFontSizeLevel] = useState('normal');
  
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(null);
  const [activeStickerTab, setActiveStickerTab] = useState<'scale' | 'rotation' | 'opacity'>('scale');
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

    const handleAccountChange = () => { loadAccounts(); };
    window.addEventListener("sanctum_account_changed", handleAccountChange);
    return () => window.removeEventListener("sanctum_account_changed", handleAccountChange);
  }, []);

  useEffect(() => {
    if (!pathname) return;
    const savedStickers = localStorage.getItem(`sanctum_stickers_${pathname}`);
    if (savedStickers) {
      try { setStickers(JSON.parse(savedStickers)); } catch (e) { setStickers([]); }
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

  const processImageCutout = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          
          const maxDim = 320;
          let width = img.width;
          let height = img.height;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          if (!ctx) { resolve(e.target?.result as string); return; }

          ctx.drawImage(img, 0, 0, width, height);
          const imageData = ctx.getImageData(0, 0, width, height);
          const data = imageData.data;
          const visited = new Uint8Array(width * height);

          const isWhite = (r: number, g: number, b: number) => r > 225 && g > 225 && b > 225;
          const queue: number[] = [];

          for (let x = 0; x < width; x++) {
            queue.push(x, 0);
            queue.push(x, height - 1);
          }
          for (let y = 0; y < height; y++) {
            queue.push(0, y);
            queue.push(width - 1, y);
          }

          while (queue.length > 0) {
            const cy = queue.pop()!;
            const cx = queue.pop()!;
            const idx = cy * width + cx;

            if (visited[idx]) continue;
            visited[idx] = 1;

            const pixelIdx = idx * 4;
            if (isWhite(data[pixelIdx], data[pixelIdx + 1], data[pixelIdx + 2])) {
              data[pixelIdx + 3] = 0;

              if (cx > 0) queue.push(cx - 1, cy);
              if (cx < width - 1) queue.push(cx + 1, cy);
              if (cy > 0) queue.push(cx, cy - 1);
              if (cy < height - 1) queue.push(cx, cy + 1);
            }
          }

          ctx.putImageData(imageData, 0, 0);
          resolve(canvas.toDataURL("image/png", 0.85));
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleGlobalStickerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const processedUrl = await processImageCutout(file);
    const newSticker: Sticker = {
      id: `stk_${Date.now()}`,
      url: processedUrl,
      x: 35 + (stickers.length % 5) * 4,
      y: 25 + (stickers.length % 5) * 4,
      scale: 1,
      rotation: 0,
      opacity: 1,
      frameStyle: "sticker"
    };
    const updated = [...stickers, newSticker];
    saveStickers(updated);
    setSelectedStickerId(newSticker.id);
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

    e.stopPropagation();
    e.preventDefault();
    const stk = stickers.find(s => s.id === stkId);
    if (!stk) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const startStkX = stk.x;
    const startStkY = stk.y;

    const onPointerMove = (moveEvt: PointerEvent) => {
      moveEvt.preventDefault();
      const deltaXPercent = ((moveEvt.clientX - startX) / window.innerWidth) * 100;
      const deltaYPercent = ((moveEvt.clientY - startY) / window.innerHeight) * 100;
      updateSticker(stkId, 'x', Math.max(0, Math.min(92, startStkX + deltaXPercent)));
      updateSticker(stkId, 'y', Math.max(0, Math.min(92, startStkY + deltaYPercent)));
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
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

  // 🔄 계정 스위칭 즉시 동기화 로직 적용
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
    
    // 💡 계정을 바꾼 즉시 전체 페이지가 해당 계정 데이터로 즉각 갱신되도록 새로고침 실행
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
      <body 
        className="min-h-screen relative font-sans transition-colors duration-200 bg-[var(--background)] text-[var(--foreground)]"
        onClick={() => setSelectedStickerId(null)}
      >
        {isLoginPage ? (
          children
        ) : (
          <>
            <input ref={globalStickerInputRef} type="file" accept="image/*" onChange={handleGlobalStickerUpload} className="hidden" />
            <input ref={changeStickerImageRef} type="file" accept="image/*" onChange={handleChangeStickerImage} className="hidden" />

            <div className="fixed inset-0 z-[800] pointer-events-none overflow-hidden">
              {stickers.map((stk) => {
                const isSelected = selectedStickerId === stk.id;

                let frameClasses = "";
                if (stk.frameStyle === "sticker") {
                  frameClasses = "drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)] [filter:drop-shadow(3px_0_0_#fff)_drop-shadow(-3px_0_0_#fff)_drop-shadow(0_3px_0_#fff)_drop-shadow(0_-3px_0_#fff)]";
                } else if (stk.frameStyle === "gold") {
                  frameClasses = "border-4 border-amber-400 shadow-2xl rounded-lg p-1 bg-black/80";
                } else if (stk.frameStyle === "polaroid") {
                  frameClasses = "bg-white p-2 pb-6 shadow-2xl rounded border text-black";
                } else if (stk.frameStyle === "neon") {
                  frameClasses = "border-2 border-cyan-400 shadow-[0_0_20px_#00f0ff] rounded-xl p-1";
                }

                return (
                  <div
                    key={stk.id}
                    onClick={(e) => { e.stopPropagation(); setSelectedStickerId(stk.id); }}
                    onPointerDown={(e) => handleStartMoveSticker(stk.id, e)}
                    className={`absolute cursor-grab active:cursor-grabbing pointer-events-auto flex flex-col items-center select-none touch-none ${
                      isSelected ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-black/50 rounded-lg z-[850]' : ''
                    }`}
                    style={{
                      left: `${stk.x}%`,
                      top: `${stk.y}%`,
                    }}
                  >
                    <div 
                      style={{
                        transform: `scale(${stk.scale}) rotate(${stk.rotation}deg)`,
                        transition: 'transform 0.05s ease-out'
                      }}
                    >
                      <img 
                        src={stk.url} 
                        alt="스티커" 
                        style={{ opacity: stk.opacity }}
                        className={`max-w-[120px] max-h-[120px] object-contain pointer-events-none ${frameClasses}`} 
                      />
                    </div>

                    {isSelected && (
                      <div 
                        className="mt-2 flex flex-col gap-1.5 bg-black/80 backdrop-blur-md border border-amber-400/80 rounded-xl p-2 shadow-2xl z-[900] pointer-events-auto opacity-100 min-w-[170px] text-white text-xs font-bold"
                        onClick={(e) => e.stopPropagation()}
                        onPointerDown={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-between gap-1 bg-zinc-900/90 rounded-lg p-1 border border-zinc-700">
                          <button 
                            onClick={() => setActiveStickerTab('scale')} 
                            className={`px-1.5 py-0.5 rounded text-[0.6rem] transition cursor-pointer ${activeStickerTab === 'scale' ? 'bg-amber-400 text-black font-black' : 'text-zinc-400 hover:text-white'}`}
                          >
                            🔍 크기
                          </button>
                          <button 
                            onClick={() => setActiveStickerTab('rotation')} 
                            className={`px-1.5 py-0.5 rounded text-[0.6rem] transition cursor-pointer ${activeStickerTab === 'rotation' ? 'bg-amber-400 text-black font-black' : 'text-zinc-400 hover:text-white'}`}
                          >
                            🔄 회전
                          </button>
                          <button 
                            onClick={() => setActiveStickerTab('opacity')} 
                            className={`px-1.5 py-0.5 rounded text-[0.6rem] transition cursor-pointer ${activeStickerTab === 'opacity' ? 'bg-amber-400 text-black font-black' : 'text-zinc-400 hover:text-white'}`}
                          >
                            👁️ 투명
                          </button>
                          <button 
                            onClick={() => setConfigStickerId(stk.id)}
                            className="px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-amber-300 text-[0.6rem] font-bold cursor-pointer"
                          >
                            ⚙️
                          </button>
                        </div>

                        <div className="px-1 py-0.5">
                          {activeStickerTab === 'scale' && (
                            <div className="flex items-center gap-2">
                              <input 
                                type="range" 
                                min="0.3" 
                                max="3.0" 
                                step="0.05" 
                                value={stk.scale} 
                                onChange={(e) => updateSticker(stk.id, 'scale', parseFloat(e.target.value))}
                                className="w-full h-1.5 accent-amber-400 cursor-pointer"
                              />
                              <span className="text-[0.6rem] text-amber-300 shrink-0 w-8 text-right">{Math.round(stk.scale * 100)}%</span>
                            </div>
                          )}

                          {activeStickerTab === 'rotation' && (
                            <div className="flex items-center gap-2">
                              <input 
                                type="range" 
                                min="0" 
                                max="360" 
                                step="1" 
                                value={stk.rotation} 
                                onChange={(e) => updateSticker(stk.id, 'rotation', parseInt(e.target.value))}
                                className="w-full h-1.5 accent-amber-400 cursor-pointer"
                              />
                              <span className="text-[0.6rem] text-amber-300 shrink-0 w-8 text-right">{stk.rotation}°</span>
                            </div>
                          )}

                          {activeStickerTab === 'opacity' && (
                            <div className="flex items-center gap-2">
                              <input 
                                type="range" 
                                min="0.1" 
                                max="1.0" 
                                step="0.05" 
                                value={stk.opacity} 
                                onChange={(e) => updateSticker(stk.id, 'opacity', parseFloat(e.target.value))}
                                className="w-full h-1.5 accent-amber-400 cursor-pointer"
                              />
                              <span className="text-[0.6rem] text-amber-300 shrink-0 w-8 text-right">{Math.round(stk.opacity * 100)}%</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {configStickerId && (
              <div className="fixed inset-0 z-[12000] flex items-center justify-center p-4 bg-black/75 animate-in fade-in duration-150">
                <div className="bg-[var(--panel)] border-2 border-[var(--accent)] rounded-2xl p-5 w-full max-w-xs shadow-2xl flex flex-col gap-3 text-[var(--text-main)]">
                  <div className="flex justify-between items-center border-b pb-2 border-[var(--panel-border)]">
                    <h4 className="font-black text-xs text-[var(--accent)] flex items-center gap-1.5">⚙️ 스티커 설정</h4>
                    <button onClick={() => setConfigStickerId(null)} className="text-xs text-[var(--text-sub)] hover:text-white cursor-pointer">&times;</button>
                  </div>

                  <button 
                    onClick={() => changeStickerImageRef.current?.click()}
                    className="w-full py-2 rounded-xl bg-[var(--inner-box)] border border-[var(--panel-border)] text-xs font-bold hover:text-[var(--accent)] transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    🖼️ 스티커 사진 변경
                  </button>

                  <div className="space-y-1">
                    <span className="text-[0.6rem] font-bold text-[var(--text-sub)] block">테두리 프레임 스타일</span>
                    <div className="grid grid-cols-2 gap-1 text-[0.6rem] font-bold">
                      {[
                        { id: "sticker", label: "스티커 외각선" },
                        { id: "gold", label: "골드 프레임" },
                        { id: "polaroid", label: "폴라로이드" },
                        { id: "neon", label: "네온 네온" },
                        { id: "none", label: "프레임 없음" },
                      ].map((f) => (
                        <button
                          key={f.id}
                          onClick={() => updateSticker(configStickerId, 'frameStyle', f.id)}
                          className={`py-1.5 px-1 rounded-lg border cursor-pointer ${
                            stickers.find(s => s.id === configStickerId)?.frameStyle === f.id
                              ? 'bg-[var(--accent)] text-[var(--accent-fg)] border-[var(--accent)] font-black'
                              : 'bg-[var(--inner-box)] border-[var(--panel-border)] text-[var(--text-sub)]'
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[var(--panel-border)] flex gap-2">
                    <button 
                      onClick={() => deleteSticker(configStickerId)}
                      className="w-full py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black cursor-pointer shadow"
                    >
                      🗑️ 스티커 삭제
                    </button>
                  </div>
                </div>
              </div>
            )}

            <nav className="sticky top-0 z-[900] flex flex-col shadow-lg border-b backdrop-blur-md w-full transition-colors bg-[var(--panel)] border-[var(--panel-border)]">
              {banner && (
                <div className="w-full py-2 bg-red-600 text-white text-center text-xs font-black flex items-center justify-center gap-2 border-b border-red-800">
                  <span>🚨</span><span>{banner.message}</span><span>🚨</span>
                </div>
              )}

              <div className="max-w-[1600px] mx-auto px-4 w-full relative">
                <div className="flex items-center justify-between h-20">
                  
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

                    <div className="relative z-[100] ml-1" ref={wingsRef}>
                      <button 
                        onClick={() => setIsWingsOpen(!isWingsOpen)}
                        className="flex items-center justify-center w-9 h-9 rounded-xl border transition-all duration-200 hover:scale-110 active:scale-95 bg-[var(--inner-box)] border-[var(--panel-border)] hover:border-[var(--accent)] shadow-sm text-lg select-none cursor-pointer"
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
                            isActive ? 'bg-[var(--panel-hover)] border-b-2 shadow-sm border-[var(--accent)]' : 'hover:bg-[var(--panel-hover)]/50'
                          }`}
                        >
                          <div className="flex flex-col items-center transition-transform duration-300 transform group-hover:-translate-y-12">
                            <span className="font-black text-[0.7rem] xl:text-[0.75rem] leading-tight whitespace-nowrap text-[var(--text-main)]">{item.kr}</span>
                            <span className="text-[0.55rem] font-bold mt-0.5 whitespace-nowrap text-[var(--accent)]">{item.sub}</span>
                          </div>
                          <div className="absolute inset-0 flex items-center justify-center transition-all duration-300 transform translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100">
                            <span className="font-black tracking-widest text-[0.65rem] xl:text-[0.7rem] whitespace-nowrap text-[var(--accent)]">{item.en}</span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>

                  <div className="hidden lg:flex items-center gap-2.5 relative shrink-0">
                    <button 
                      onClick={() => setIsThemeModalOpen(true)}
                      className="w-9 h-9 border rounded-xl transition cursor-pointer flex items-center justify-center shadow-sm border-[var(--panel-border)] hover:border-[var(--accent)] hover:scale-105 text-base select-none bg-[var(--inner-box)]"
                      title="생텀 페이지 설정"
                    >
                      🎨
                    </button>

                    <div 
                      className="w-9 h-9 border rounded-xl transition cursor-pointer flex items-center justify-center shadow-sm border-[var(--panel-border)] hover:border-[var(--accent)] hover:scale-105 text-[var(--accent)] bg-[var(--inner-box)]" 
                      title="메일함"
                    >
                      <svg className="w-4 h-4 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                      </svg>
                    </div>

                    {mounted && activeAccount ? (
                      <div className="relative" ref={accountMenuRef}>
                        <button onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)} className="flex items-center gap-2 px-3.5 py-2 rounded-full border transition shadow-md whitespace-nowrap bg-[var(--panel)] hover:bg-[var(--panel-hover)] text-[var(--text-main)] border-[var(--accent)] cursor-pointer">
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
                                  <button key={acc.id} onClick={() => switchAccount(acc)} className="w-full flex items-center justify-between p-2 rounded-lg text-left transition my-0.5 hover:bg-[var(--panel-hover)] text-[var(--text-sub)] hover:text-[var(--text-main)] cursor-pointer">
                                    <span className="text-[0.7rem] font-bold truncate">{acc.alias || acc.nickname}</span>
                                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: acc.borderColor }}></span>
                                  </button>
                                ))}
                              </>
                            )}

                            <div className="border-t border-[var(--panel-border)] mt-2 pt-1 flex flex-col gap-1">
                              <Link href="/login" className="w-full text-center text-[0.7rem] font-bold text-[var(--accent)] hover:bg-[var(--panel-hover)] py-1.5 rounded transition">➕ 계정 추가 로그인</Link>
                              {isAdmin && <Link href="/admin" className="w-full text-center text-[0.7rem] font-bold text-[var(--text-sub)] hover:text-[var(--text-main)] hover:bg-[var(--panel-hover)] py-1.5 rounded transition">⚙️ SANCTUM 관리자 {pendingCount > 0 && <span className="bg-red-500 text-white px-1.5 py-0.2 rounded-full text-[0.55rem] ml-1">{pendingCount}</span>}</Link>}
                              <button onClick={handleLogout} className="w-full text-center text-[0.7rem] font-bold text-red-400 hover:bg-red-950/30 py-1.5 rounded transition cursor-pointer">🚪 현재 계정 로그아웃</button>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <Link href="/login" className="text-[0.7rem] font-bold text-[var(--accent)] hover:opacity-80 whitespace-nowrap">로그인</Link>
                    )}
                  </div>
                </div>
              </div>
            </nav>

            <div
              className="lg:hidden fixed bottom-6 z-[10000] flex items-center rounded-full shadow-[0_0_15px_rgba(0,0,0,0.7)] border-[1.5px] cursor-grab active:cursor-grabbing select-none bg-[var(--panel)] border-[var(--accent)] touch-none"
              style={{ right: `${fabPosition.x}px` }}
              onPointerDown={handlePointerDown}
            >
              <button onClick={handleHomeClick} className="w-[2.2rem] h-[2.2rem] flex items-center justify-center rounded-l-full transition-colors border-r border-[var(--panel-border)] hover:bg-[var(--panel-hover)] cursor-pointer">
                <svg className="w-3.5 h-3.5 drop-shadow-sm text-[var(--accent)]" viewBox="0 0 24 24" fill="currentColor">
                   <path d="M12 1L15.39 8.26L23 9.27L17.5 14.14L18.81 21.02L12 17.77L5.19 21.02L6.5 14.14L1 9.27L8.61 8.26L12 1Z" />
                </svg>
              </button>
              <button onClick={handleMenuClick} className="w-[2.2rem] h-[2.2rem] flex items-center justify-center rounded-r-full transition-colors relative hover:bg-[var(--panel-hover)] cursor-pointer">
                {isFabOpen ? (
                  <svg className="w-4 h-4 text-[var(--text-main)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                ) : (
                  <svg className="w-4 h-4 text-[var(--text-main)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                )}
              </button>
            </div>

            <div
              className={`fixed inset-x-0 bottom-0 z-[9999] lg:hidden border-t-2 rounded-t-[28px] p-4 shadow-2xl flex flex-col bg-[var(--panel)] text-[var(--text-main)] border-[var(--accent)] transition-transform duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]`}
              style={{ 
                transform: isFabOpen ? `translateY(0px)` : 'translateY(120%)' 
              }}
            >
              <div className="w-full py-2 flex items-center justify-center cursor-grab active:cursor-grabbing touch-none select-none">
                <div className="w-10 h-1.5 bg-[var(--text-sub)] rounded-full opacity-50" />
              </div>

              <div className="overflow-y-auto custom-scrollbar flex flex-col gap-3 pb-12 max-h-[80vh]">
                
                {activeAccount && (
                  <div className="bg-[var(--inner-box)] border border-[var(--panel-border)] rounded-xl p-3 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[var(--panel)] border border-[var(--accent)] flex items-center justify-center text-xs">👑</div>
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-[var(--text-main)]">{activeAccount.alias || activeAccount.nickname}</span>
                        <span className="text-[0.6rem] text-[var(--accent)]">{activeAccount.role}</span>
                      </div>
                    </div>
                    
                    {accounts.length > 1 && (
                      <select 
                        value={activeAccount.id} 
                        onChange={(e) => {
                          const target = accounts.find(a => a.id === e.target.value);
                          if (target) switchAccount(target);
                        }}
                        className="bg-[var(--panel)] text-[0.65rem] font-bold text-[var(--text-main)] border border-[var(--panel-border)] rounded-lg px-2 py-1 outline-none"
                      >
                        {accounts.map(acc => (
                          <option key={acc.id} value={acc.id}>{acc.alias || acc.nickname}</option>
                        ))}
                      </select>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between gap-2 border-y border-[var(--panel-border)] py-2.5">
                  <button 
                    onClick={() => { setIsFabOpen(false); setIsThemeModalOpen(true); }}
                    className="py-2 px-3 rounded-xl bg-[var(--inner-box)] border border-[var(--panel-border)] hover:border-[var(--accent)] text-xs font-bold text-[var(--text-main)] flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <span>🎨</span> 생텀 페이지 설정
                  </button>

                  <div className="flex items-center bg-[var(--inner-box)] border border-[var(--panel-border)] rounded-xl p-1 gap-1">
                    <button onClick={() => setFontSizeLevel('small')} className={`px-2 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${fontSizeLevel === 'small' ? 'bg-[var(--panel-hover)] text-[var(--text-main)] shadow' : 'text-[var(--text-sub)]'}`}>A-</button>
                    <button onClick={() => setFontSizeLevel('normal')} className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${fontSizeLevel === 'normal' ? 'bg-[var(--panel-hover)] text-[var(--text-main)] shadow' : 'text-[var(--text-sub)]'}`}>A</button>
                    <button onClick={() => setFontSizeLevel('large')} className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${fontSizeLevel === 'large' ? 'bg-[var(--panel-hover)] text-[var(--text-main)] shadow' : 'text-[var(--text-sub)]'}`}>A+</button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {navItems.map((item) => {
                    const isActive = pathname === item.path;
                    return (
                      <Link
                        key={item.en}
                        href={item.path}
                        onClick={() => setIsFabOpen(false)}
                        className={`relative overflow-hidden flex flex-col justify-center px-4 py-3 rounded-xl border transition-colors ${
                          isActive ? 'bg-[var(--panel-hover)] border-l-[3px] border-l-[var(--accent)] shadow-sm' : 'bg-[var(--inner-box)] border-[var(--panel-border)]'
                        }`}
                      >
                        <span className="font-black text-[0.75rem] tracking-wide leading-tight whitespace-nowrap text-[var(--accent)]">{item.kr}</span>
                        <span className="text-[0.55rem] font-bold mt-1 whitespace-nowrap text-[var(--text-sub)]">{item.sub}</span>
                      </Link>
                    );
                  })}
                </div>

              </div>
            </div>

            {isThemeModalOpen && (
              <div className="fixed inset-0 z-[11000] flex items-center justify-center p-4 bg-black/70 animate-in fade-in duration-200">
                <div className="bg-[var(--panel)] border border-[var(--panel-border)] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
                  <div className="bg-[var(--panel-hover)] p-4 border-b border-[var(--panel-border)] flex justify-between items-center">
                    <h3 className="text-[var(--text-main)] font-black text-base flex items-center gap-2">
                      <span>🎨</span> 생텀 페이지 설정 ({activeAccount?.nickname})
                    </h3>
                    <button onClick={() => setIsThemeModalOpen(false)} className="text-[var(--text-sub)] hover:text-[var(--text-main)] text-xl cursor-pointer">&times;</button>
                  </div>

                  <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
                    
                    <div className="space-y-3">
                      <label className="text-xs font-bold text-[var(--text-sub)] uppercase tracking-wider block">기본 테마 프리셋</label>
                      <div className="grid grid-cols-3 gap-2.5">
                        {[
                          { id: 'aureum', name: 'AUREUM', bg: '#0A0A0A', accent: '#E6C788' },
                          { id: 'lumen', name: 'LUMEN', bg: '#FFFFFF', accent: '#2563EB' },
                          { id: 'nemeton', name: 'NEMETON', bg: '#081914', accent: '#48C9A0' },
                          { id: 'vesper', name: 'VESPER', bg: '#0D0B18', accent: '#B18AF3' },
                          { id: 'rosarium', name: 'ROSARIUM', bg: '#1A1016', accent: '#E88DA8' },
                          { id: 'elysium', name: 'ELYSIUM', bg: '#D2F4C0', accent: '#6262B8' },
                        ].map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setTempTheme(item.id)}
                            className={`p-3 rounded-xl border text-xs font-black transition flex flex-col items-center justify-center gap-2 cursor-pointer ${
                              tempTheme === item.id
                                ? 'bg-[var(--panel-hover)] border-[var(--accent)] text-[var(--accent)] shadow-lg scale-[1.02]'
                                : 'bg-[var(--inner-box)] border-[var(--panel-border)] text-[var(--text-sub)] hover:text-[var(--text-main)]'
                            }`}
                          >
                            <span className="w-5 h-5 rounded-full flex items-center justify-center p-0.5 border shadow-inner" style={{ backgroundColor: item.bg, borderColor: item.accent }}>
                              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.accent }}></span>
                            </span>
                            <span className="text-[0.65rem] tracking-wider">{item.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3 pt-3 border-t border-[var(--panel-border)]">
                      <label className="text-xs font-bold text-[var(--accent)] uppercase tracking-wider block">나만의 커스텀 테마 슬롯</label>
                      <div className="grid grid-cols-3 gap-2">
                        {(["custom_1", "custom_2", "custom_3"] as const).map((cSlot, idx) => (
                          <button
                            key={cSlot}
                            type="button"
                            onClick={() => setTempTheme(cSlot)}
                            className={`py-2 px-1 rounded-xl text-xs font-black border transition cursor-pointer ${
                              tempTheme === cSlot 
                                ? 'bg-[var(--accent)] text-[var(--accent-fg)] border-[var(--accent)] shadow' 
                                : 'bg-[var(--inner-box)] border-[var(--panel-border)] text-[var(--text-sub)] hover:text-[var(--text-main)]'
                            }`}
                          >
                            Custom {idx + 1}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[var(--panel-border)] flex items-center justify-between gap-2">
                      <button 
                        onClick={() => globalStickerInputRef.current?.click()}
                        className="py-2.5 px-4 rounded-xl bg-[var(--accent)] text-[var(--accent-fg)] hover:opacity-90 text-xs font-black shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                      >
                        🏷️ 커스텀 스티커 추가
                      </button>

                      <div className="flex items-center bg-[var(--inner-box)] border border-[var(--panel-border)] rounded-xl p-1 gap-1">
                        <button onClick={() => setFontSizeLevel('small')} className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${fontSizeLevel === 'small' ? 'bg-[var(--panel-hover)] text-[var(--text-main)] shadow' : 'text-[var(--text-sub)] hover:text-[var(--text-main)]'}`}>A-</button>
                        <button onClick={() => setFontSizeLevel('normal')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${fontSizeLevel === 'normal' ? 'bg-[var(--panel-hover)] text-[var(--text-main)] shadow' : 'text-[var(--text-sub)] hover:text-[var(--text-main)]'}`}>A</button>
                        <button onClick={() => setFontSizeLevel('large')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${fontSizeLevel === 'large' ? 'bg-[var(--panel-hover)] text-[var(--text-main)] shadow' : 'text-[var(--text-sub)] hover:text-[var(--text-main)]'}`}>A+</button>
                      </div>
                    </div>

                  </div>

                  <div className="bg-[var(--panel-hover)] p-4 border-t border-[var(--panel-border)] flex flex-col sm:flex-row items-center justify-between gap-2">
                    <button 
                      onClick={() => { setIsThemeModalOpen(false); router.push('/customize'); }} 
                      className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[var(--inner-box)] border border-[var(--panel-border)] text-[var(--text-main)] hover:border-[var(--accent)] hover:text-[var(--accent)] text-xs font-black transition shadow flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
                    >
                      <span>✨</span> 커스텀 테마 스튜디오
                    </button>

                    <div className="flex gap-2 w-full sm:w-auto justify-end">
                      <button onClick={() => setIsThemeModalOpen(false)} className="px-4 py-2 rounded-lg bg-[var(--inner-box)] text-[var(--text-sub)] text-xs font-bold hover:text-[var(--text-main)] transition cursor-pointer">취소</button>
                      <button onClick={handleSaveThemeSettings} className="px-4 py-2 rounded-lg bg-[var(--accent)] text-[var(--accent-fg)] text-xs font-black transition shadow hover:opacity-90 cursor-pointer">적용하기</button>
                    </div>
                  </div>

                </div>
              </div>
            )}

            <main className="max-w-[1600px] mx-auto px-4 py-6 w-full relative">
              {children}
            </main>
          </>
        )}
      </body>
    </html>
  );
}