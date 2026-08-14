"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const PRESET_THEMES: Record<string, any> = {
  aureum: {
    background: "#1b1b1b",
    panel: "#101011",
    panelBorder: "#2A2A2E",
    innerBox: "#1c1c1e",
    textMain: "#EDEDED",
    textSub: "#9CA3AF",
    accent: "#E6C788",
    accentFg: "#000000",
    accentSecondary: "#C5A059",
    accentSecondaryFg: "#000000",
    accentSpecial: "#174738",
    headerBtnBg: "#1c1c1e"
  },
  lumen: {
    background: "#FFFFFF",
    panel: "#FFFFFF",
    panelBorder: "#E2E8F0",
    innerBox: "#F1F5F9",
    textMain: "#0F172A",
    textSub: "#64748B",
    accent: "#2563EB",
    accentFg: "#FFFFFF",
    accentSecondary: "#0284C7",
    accentSecondaryFg: "#FFFFFF",
    accentSpecial: "#DBEAFE",
    headerBtnBg: "#F1F5F9"
  },
  nemeton: {
    background: "#081914",
    panel: "#112A23",
    panelBorder: "#244A3E",
    innerBox: "#0c1f1a",
    textMain: "#EDF9F4",
    textSub: "#A3C5B9",
    accent: "#48C9A0",
    accentFg: "#000000",
    accentSecondary: "#5EA7A0",
    accentSecondaryFg: "#000000",
    accentSpecial: "#0F382B",
    headerBtnBg: "#0c1f1a"
  },
  vesper: {
    background: "#0D0B18",
    panel: "#19142C",
    panelBorder: "#342B50",
    innerBox: "#120f21",
    textMain: "#F5F0FF",
    textSub: "#B9AECF",
    accent: "#B18AF3",
    accentFg: "#000000",
    accentSecondary: "#6E82D9",
    accentSecondaryFg: "#000000",
    accentSpecial: "#2A1F45",
    headerBtnBg: "#120f21"
  },
  rosarium: {
    background: "#1A1016",
    panel: "#2B1922",
    panelBorder: "#4E2A38",
    innerBox: "#1c1117",
    textMain: "#FFF4F7",
    textSub: "#C7A9B5",
    accent: "#E88DA8",
    accentFg: "#000000",
    accentSecondary: "#B89A72",
    accentSecondaryFg: "#000000",
    accentSpecial: "#421C2B",
    headerBtnBg: "#1c1117"
  },
  elysium: {
    background: "#D2F4C0",
    panel: "#EAF8E0",
    panelBorder: "#A7D79A",
    innerBox: "#C3E8AF",
    textMain: "#1A2030",
    textSub: "#5B665F",
    accent: "#6262B8",
    accentFg: "#FFFFFF",
    accentSecondary: "#6BAA57",
    accentSecondaryFg: "#FFFFFF",
    accentSpecial: "#BBE3A5",
    headerBtnBg: "#C3E8AF"
  }
};

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

type MenuCategory = "slot" | "color" | "bg" | "char" | null;

export default function CustomizePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [activeSlot, setActiveSlot] = useState<"custom_1" | "custom_2" | "custom_3">("custom_1");
  const [previewTab, setPreviewTab] = useState<"main" | "chronos">("main");

  // 플로팅 리모컨 관련
  const [isRemoteOpen, setIsRemoteOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<MenuCategory>(null);
  const [remotePos, setRemotePos] = useState({ x: 20, y: 120 });

  // 스티커 시스템
  const stickerInputRef = useRef<HTMLInputElement>(null);
  const changeStickerInputRef = useRef<HTMLInputElement>(null);
  const previewCanvasRef = useRef<HTMLDivElement>(null);

  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(null);

  const [configStickerId, setConfigStickerId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [tooltipText, setTooltipText] = useState<{ title: string; desc: string; x: number; y: number } | null>(null);
  const tooltipTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 색상 상태
  const [colors, setColors] = useState(PRESET_THEMES.aureum);
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [bgOpacity, setBgOpacity] = useState<number>(0.3);
  const [charBgs, setCharBgs] = useState<Record<string, string>>({});

  useEffect(() => {
    setMounted(true);
    loadSlotData("custom_1");
  }, []);

  const loadSlotData = (slotKey: string) => {
    const savedCustom = localStorage.getItem(`sanctum_theme_${slotKey}`);
    if (savedCustom) {
      try {
        const parsed = JSON.parse(savedCustom);
        const loadedColors = { ...PRESET_THEMES.aureum, ...(parsed.colors || {}) };
        setColors(loadedColors);
        setBgImage(parsed.bgImage || null);
        setBgOpacity(parsed.bgOpacity !== undefined ? parsed.bgOpacity : 0.3);
        setCharBgs(parsed.charBgs || {});
        setStickers(parsed.stickers || []);
        applyRealtimeTheme(loadedColors);
      } catch (e) {
        setColors(PRESET_THEMES.aureum);
      }
    } else {
      setColors(PRESET_THEMES.aureum);
      setBgImage(null);
      setBgOpacity(0.3);
      setCharBgs({});
      setStickers([]);
      applyRealtimeTheme(PRESET_THEMES.aureum);
    }
  };

  const applyRealtimeTheme = (themeColors: any) => {
    const root = document.documentElement;
    root.style.setProperty("--background", themeColors.background);
    root.style.setProperty("--panel", themeColors.panel);
    root.style.setProperty("--panel-border", themeColors.panelBorder);
    root.style.setProperty("--inner-box", themeColors.innerBox);
    root.style.setProperty("--text-main", themeColors.textMain);
    root.style.setProperty("--text-sub", themeColors.textSub);
    root.style.setProperty("--accent", themeColors.accent);
    root.style.setProperty("--accent-fg", themeColors.accentFg || "#000000");
    root.style.setProperty("--accent-secondary", themeColors.accentSecondary);
    root.style.setProperty("--accent-secondary-fg", themeColors.accentSecondaryFg || "#000000");
    root.style.setProperty("--accent-special", themeColors.accentSpecial || "#174738");
    root.style.setProperty("--headerBtnBg", themeColors.headerBtnBg || themeColors.innerBox);
  };

  const handleColorChange = (key: string, value: string) => {
    const newColors = { ...colors, [key]: value };
    setColors(newColors);
    applyRealtimeTheme(newColors);
  };

  const handleCopyPreset = (presetKey: string) => {
    const presetColors = PRESET_THEMES[presetKey];
    if (presetColors) {
      setColors(presetColors);
      applyRealtimeTheme(presetColors);
    }
  };

  const handleMouseEnterTooltip = (e: React.MouseEvent, title: string, desc: string) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top - 10;

    if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
    tooltipTimerRef.current = setTimeout(() => {
      setTooltipText({ title, desc, x, y });
    }, 3000);
  };

  const handleMouseLeaveTooltip = () => {
    if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
    setTooltipText(null);
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
          canvas.width = img.width;
          canvas.height = img.height;

          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }

          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;

          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            if (r > 238 && g > 238 && b > 238) {
              data[i + 3] = 0;
            }
          }

          ctx.putImageData(imageData, 0, 0);
          resolve(canvas.toDataURL("image/png"));
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setBgImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleCharBgUpload = (charKey: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCharBgs(prev => ({ ...prev, [charKey]: reader.result as string }));
    reader.readAsDataURL(file);
  };

  const handleStickerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const processedUrl = await processImageCutout(file);
    const newSticker: Sticker = {
      id: `sticker_${Date.now()}`,
      url: processedUrl,
      x: 40 + (stickers.length % 5) * 3,
      y: 35 + (stickers.length % 5) * 3,
      scale: 1,
      rotation: 0,
      opacity: 1,
      frameStyle: "sticker"
    };
    setStickers(prev => [...prev, newSticker]);
    setSelectedStickerId(newSticker.id);
    e.target.value = "";
  };

  const handleChangeStickerImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !configStickerId) return;

    const processedUrl = await processImageCutout(file);
    updateSticker(configStickerId, 'url', processedUrl);
    e.target.value = "";
  };

  const updateSticker = (id: string, key: keyof Sticker, val: any) => {
    setStickers(prev => prev.map(s => s.id === id ? { ...s, [key]: val } : s));
  };

  const deleteSticker = (id: string) => {
    setStickers(prev => prev.filter(s => s.id !== id));
    if (selectedStickerId === id) setSelectedStickerId(null);
    setDeleteConfirmId(null);
    setConfigStickerId(null);
  };

  const handleSave = () => {
    const payload = { colors, bgImage, bgOpacity, charBgs, stickers };
    localStorage.setItem(`sanctum_theme_${activeSlot}`, JSON.stringify(payload));

    const savedActiveId = localStorage.getItem("sanctum_active_account_id");
    const savedAccounts = localStorage.getItem("sanctum_accounts");
    if (savedAccounts && savedActiveId) {
      try {
        const accounts = JSON.parse(savedAccounts);
        const updatedAccounts = accounts.map((a: any) => 
          a.id === savedActiveId ? { ...a, theme: activeSlot } : a
        );
        localStorage.setItem("sanctum_accounts", JSON.stringify(updatedAccounts));
        window.dispatchEvent(new CustomEvent("sanctum_account_changed", { detail: updatedAccounts.find((a: any) => a.id === savedActiveId) }));
      } catch (e) {}
    }

    alert(`🎉 [${activeSlot.replace('_', ' ').toUpperCase()}] 테마와 스티커 설정이 저장되었습니다!`);
  };

  const handlePointerDownRemote = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const btn = e.currentTarget;
    btn.setPointerCapture(e.pointerId);

    const startX = e.clientX - remotePos.x;
    const startY = e.clientY - remotePos.y;

    const onPointerMove = (moveEvt: PointerEvent) => {
      setRemotePos({
        x: Math.max(10, Math.min(window.innerWidth - 70, moveEvt.clientX - startX)),
        y: Math.max(10, Math.min(window.innerHeight - 70, moveEvt.clientY - startY))
      });
    };

    const onPointerUp = (upEvt: PointerEvent) => {
      btn.releasePointerCapture(upEvt.pointerId);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  // 스티커 이동 핸들러
  const handleStartMoveSticker = (stkId: string, e: React.PointerEvent) => {
    e.stopPropagation();
    const canvasRect = previewCanvasRef.current?.getBoundingClientRect();
    if (!canvasRect) return;

    const stk = stickers.find(s => s.id === stkId);
    if (!stk) return;

    const startPointerX = e.clientX;
    const startPointerY = e.clientY;
    const startStkX = stk.x;
    const startStkY = stk.y;

    const onPointerMove = (moveEvt: PointerEvent) => {
      const deltaXPercent = ((moveEvt.clientX - startPointerX) / canvasRect.width) * 100;
      const deltaYPercent = ((moveEvt.clientY - startPointerY) / canvasRect.height) * 100;
      updateSticker(stkId, 'x', Math.max(0, Math.min(92, startStkX + deltaXPercent)));
      updateSticker(stkId, 'y', Math.max(0, Math.min(92, startStkY + deltaYPercent)));
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  // 스티커 크기 조절 핸들러 (개선)
  const handleStartScaleSticker = (stkId: string, e: React.PointerEvent) => {
    e.stopPropagation();
    const stk = stickers.find(s => s.id === stkId);
    if (!stk) return;

    const startY = e.clientY;
    const startScale = stk.scale;

    const onPointerMove = (moveEvt: PointerEvent) => {
      const deltaY = startY - moveEvt.clientY;
      const newScale = Math.max(0.3, Math.min(3.0, startScale + deltaY * 0.015));
      updateSticker(stkId, 'scale', newScale);
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  // 스티커 회전 조작 핸들러 (개선)
  const handleStartRotateSticker = (stkId: string, e: React.PointerEvent) => {
    e.stopPropagation();
    const stk = stickers.find(s => s.id === stkId);
    if (!stk) return;

    const startX = e.clientX;
    const startRotation = stk.rotation;

    const onPointerMove = (moveEvt: PointerEvent) => {
      const deltaX = moveEvt.clientX - startX;
      let newRot = Math.round((startRotation + deltaX) % 360);
      if (newRot < 0) newRot += 360;
      updateSticker(stkId, 'rotation', newRot);
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  if (!mounted) return null;

  const isLeftHalf = typeof window !== 'undefined' ? remotePos.x < window.innerWidth / 2 : true;

  const menuItems = [
    { id: "slot", label: "슬롯 선택", icon: "📁", desc: "커스텀 1~3 슬롯 지정 및 기본 테마 복사" },
    { id: "color", label: "색상 설정", icon: "🎨", desc: "생텀 요소별 상세 색상 및 HEX 직접 지정" },
    { id: "bg", label: "배경 GIF", icon: "🎞️", desc: "전체 배경 이미지/GIF 업로드 및 어둡기 조절" },
    { id: "char", label: "캐릭터 짤", icon: "🃏", desc: "캐릭터 1~6 카드별 최애 배경 짤 주입" },
  ];

  return (
    <div 
      className="relative min-h-[calc(100vh-90px)] w-full flex flex-col p-2 md:p-4 overflow-hidden select-none"
      onClick={() => setSelectedStickerId(null)}
    >
      <input ref={stickerInputRef} type="file" accept="image/*" onChange={handleStickerUpload} className="hidden" />
      <input ref={changeStickerInputRef} type="file" accept="image/*" onChange={handleChangeStickerImage} className="hidden" />

      {/* 3초 호버 말풍선 툴팁 */}
      {tooltipText && (
        <div 
          className="fixed z-[10000] bg-black/90 text-white border border-[var(--accent)] px-3 py-2 rounded-xl shadow-2xl pointer-events-none transform -translate-x-1/2 -translate-y-full animate-in fade-in duration-200"
          style={{ left: `${tooltipText.x}px`, top: `${tooltipText.y}px` }}
        >
          <div className="font-black text-xs text-[var(--accent)]">{tooltipText.title}</div>
          <div className="text-[0.6rem] text-zinc-300 mt-0.5">{tooltipText.desc}</div>
        </div>
      )}

      {/* 🔮 1. 스마트 방사형 플로팅 리모컨 */}
      <div 
        className="fixed z-[999] touch-none transition-all duration-100"
        style={{ left: `${remotePos.x}px`, top: `${remotePos.y}px` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative flex items-center justify-center">
          <button
            onPointerDown={handlePointerDownRemote}
            onClick={() => { setIsRemoteOpen(!isRemoteOpen); if (isRemoteOpen) setActiveMenu(null); }}
            onMouseEnter={(e) => handleMouseEnterTooltip(e, "🎛️ 커스텀 리모컨", "드래그하여 원하는 위치로 옮기거나 클릭하여 메뉴 열기")}
            onMouseLeave={handleMouseLeaveTooltip}
            className={`w-14 h-14 rounded-full shadow-[0_0_25px_rgba(0,0,0,0.8)] border-2 flex items-center justify-center text-xl transition-all duration-300 cursor-grab active:cursor-grabbing ${
              isRemoteOpen 
                ? 'bg-red-700 border-red-400 text-white rotate-45 scale-110' 
                : 'bg-[var(--panel)] border-[var(--accent)] text-[var(--accent)] hover:scale-105'
            }`}
          >
            {isRemoteOpen ? "✚" : "🎛️"}
          </button>

          {isRemoteOpen && (
            <>
              {menuItems.map((item, index) => {
                const startAngle = isLeftHalf ? -60 : 120;
                const endAngle = isLeftHalf ? 60 : 240;
                const step = (endAngle - startAngle) / menuItems.length;
                const angleRad = (startAngle + index * step) * (Math.PI / 180);
                const radius = 85;
                const x = Math.round(radius * Math.cos(angleRad));
                const y = Math.round(radius * Math.sin(angleRad));

                const isSelected = activeMenu === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveMenu(isSelected ? null : (item.id as MenuCategory))}
                    onMouseEnter={(e) => handleMouseEnterTooltip(e, `${item.icon} ${item.label}`, item.desc)}
                    onMouseLeave={handleMouseLeaveTooltip}
                    className={`absolute w-10 h-10 rounded-full border shadow-2xl flex items-center justify-center text-base transition-all duration-300 ${
                      isSelected 
                        ? 'bg-[var(--accent)] border-white text-[var(--accent-fg)] scale-125 z-10' 
                        : 'bg-zinc-800/90 border-zinc-600 text-white hover:bg-zinc-700 hover:scale-110'
                    }`}
                    style={{ transform: `translate(${x}px, ${y}px)` }}
                  >
                    {item.icon}
                  </button>
                );
              })}

              {/* 🏷️ 스티커 추가 탐색기 버튼 */}
              {(() => {
                const angleRad = (isLeftHalf ? 80 : 260) * (Math.PI / 180);
                const radius = 85;
                const x = Math.round(radius * Math.cos(angleRad));
                const y = Math.round(radius * Math.sin(angleRad));

                return (
                  <button
                    onClick={() => stickerInputRef.current?.click()}
                    onMouseEnter={(e) => handleMouseEnterTooltip(e, "🏷️ 스티커 추가", "내 컴퓨터/폰에서 스티커 이미지 선택 탐색기 열기")}
                    onMouseLeave={handleMouseLeaveTooltip}
                    className="absolute w-10 h-10 rounded-full border shadow-2xl flex items-center justify-center text-base transition-all duration-300 bg-amber-500 border-amber-300 text-black hover:scale-125 z-10"
                    style={{ transform: `translate(${x}px, ${y}px)` }}
                  >
                    🏷️
                  </button>
                );
              })()}
            </>
          )}
        </div>

        {/* 🗂️ 서브 조작 팝업 모달 */}
        {activeMenu && (
          <div className={`absolute top-16 ${isLeftHalf ? 'left-16' : 'right-16'} w-[320px] max-h-[70vh] overflow-y-auto custom-scrollbar bg-[var(--panel)] border-2 border-[var(--accent)] rounded-2xl shadow-2xl p-4 z-[1000] text-[var(--text-main)] animate-in fade-in zoom-in-95 duration-200`}>
            
            <div className="flex justify-between items-center border-b pb-2 mb-3 border-[var(--panel-border)]">
              <span className="font-black text-xs text-[var(--accent)] flex items-center gap-1 whitespace-nowrap">
                {menuItems.find(m => m.id === activeMenu)?.icon} {menuItems.find(m => m.id === activeMenu)?.label}
              </span>
              <button onClick={() => setActiveMenu(null)} className="text-xs text-[var(--text-sub)] hover:text-white font-bold">&times;</button>
            </div>

            {/* 1) 슬롯 선택 */}
            {activeMenu === "slot" && (
              <div className="space-y-3">
                <span className="text-[0.65rem] font-bold text-[var(--text-sub)] block whitespace-nowrap">저장 슬롯 선택</span>
                <div className="grid grid-cols-3 gap-1.5">
                  {(["custom_1", "custom_2", "custom_3"] as const).map((slot, idx) => (
                    <button
                      key={slot}
                      onClick={() => { setActiveSlot(slot); loadSlotData(slot); }}
                      className={`py-2 px-1 rounded-xl text-[0.65rem] font-black border transition whitespace-nowrap ${
                        activeSlot === slot ? 'bg-[var(--accent)] text-[var(--accent-fg)] border-[var(--accent)]' : 'bg-[var(--inner-box)] border-[var(--panel-border)] text-[var(--text-sub)]'
                      }`}
                    >
                      Custom {idx + 1}
                    </button>
                  ))}
                </div>

                <span className="text-[0.65rem] font-bold text-[var(--text-sub)] block whitespace-nowrap pt-2 border-t border-[var(--panel-border)]">기존 테마 복사</span>
                <div className="grid grid-cols-3 gap-1.5">
                  {Object.keys(PRESET_THEMES).map((pKey) => (
                    <button
                      key={pKey}
                      onClick={() => handleCopyPreset(pKey)}
                      className="py-1 px-1 rounded text-[0.6rem] font-bold uppercase border bg-[var(--inner-box)] border-[var(--panel-border)] text-[var(--text-sub)] hover:text-[var(--accent)] whitespace-nowrap"
                    >
                      {pKey}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 2) 전역 색상 설정 (모바일 overflow 완벽 수정) */}
            {activeMenu === "color" && (
              <div className="space-y-2 text-[0.7rem] font-bold">
                {[
                  { label: "🖼️ 전체 바탕 배경", key: "background" },
                  { label: "📦 카드 및 패널 배경", key: "panel" },
                  { label: "🔲 카드 테두리 선", key: "panelBorder" },
                  { label: "내부 상자 / 서브 카드의 배경", key: "innerBox" },
                  { label: "💡 상단 유틸 버튼 배경", key: "headerBtnBg" },
                  { label: "✍️ 메인 글자 색상", key: "textMain" },
                  { label: "💬 설명 글자 색상", key: "textSub" },
                  { label: "✨ 주 포인트 (대표 버튼)", key: "accent" },
                  { label: "🔤 주 포인트 버튼 글자색", key: "accentFg" },
                  { label: "보조포인트2 (체크/완료)", key: "accentSecondary" },
                  { label: "🔤 보조포인트2 버튼 글자색", key: "accentSecondaryFg" },
                  { label: "🌌 특수 강조/알림", key: "accentSpecial" },
                ].map((item) => (
                  <div 
                    key={item.key} 
                    className="flex items-center justify-between p-1.5 rounded-lg bg-[var(--inner-box)] border border-[var(--panel-border)] gap-1 overflow-hidden min-w-0"
                  >
                    <span className="text-[var(--text-main)] truncate text-[0.6rem] shrink">{item.label}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      <input 
                        type="text" 
                        value={colors[item.key] || "#000000"} 
                        onChange={(e) => handleColorChange(item.key, e.target.value)}
                        className="w-14 px-1 py-0.5 rounded text-[0.55rem] font-mono border bg-[var(--panel)] border-[var(--panel-border)] text-[var(--text-main)] uppercase text-center"
                      />
                      <input 
                        type="color" 
                        value={colors[item.key] || "#000000"} 
                        onChange={(e) => handleColorChange(item.key, e.target.value)} 
                        className="w-5 h-5 rounded border-0 cursor-pointer bg-transparent shrink-0" 
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 3) 전체 배경 GIF */}
            {activeMenu === "bg" && (
              <div className="space-y-3">
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageUpload}
                  className="text-[0.65rem] file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[0.65rem] file:font-bold file:bg-[var(--accent)] file:text-[var(--accent-fg)] cursor-pointer text-[var(--text-sub)] w-full"
                />

                {bgImage && (
                  <div className="space-y-2 pt-2 border-t border-[var(--panel-border)]">
                    <div className="flex justify-between items-center text-[0.65rem] font-bold text-[var(--text-sub)]">
                      <span>어둡기 조절</span>
                      <span>{Math.round(bgOpacity * 100)}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="0.8" 
                      step="0.05" 
                      value={bgOpacity} 
                      onChange={(e) => setBgOpacity(parseFloat(e.target.value))}
                      className="w-full accent-[var(--accent)] cursor-pointer"
                    />
                    <button onClick={() => setBgImage(null)} className="text-[0.65rem] text-red-400 underline font-bold">
                      배경 삭제
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 4) 캐릭터별 개별 짤 */}
            {activeMenu === "char" && (
              <div className="space-y-2 text-[0.7rem] font-bold">
                {["char_1", "char_2", "char_3", "char_4", "char_5", "char_6"].map((charKey, idx) => (
                  <div key={charKey} className="flex flex-col gap-1 p-2 rounded-lg bg-[var(--inner-box)] border border-[var(--panel-border)]">
                    <div className="flex justify-between items-center">
                      <span className="text-[var(--accent)] font-black">👑 캐릭터 {idx + 1} 배경</span>
                      {charBgs[charKey] && (
                        <button onClick={() => setCharBgs(prev => ({ ...prev, [charKey]: "" }))} className="text-[0.6rem] text-red-400 underline">삭제</button>
                      )}
                    </div>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => handleCharBgUpload(charKey, e)}
                      className="text-[0.60rem] file:mr-2 file:py-0.5 file:px-1.5 file:rounded file:border-0 file:bg-[var(--panel)] file:text-[var(--text-main)] cursor-pointer text-[var(--text-sub)]"
                    />
                  </div>
                ))}
              </div>
            )}

            <button 
              onClick={handleSave}
              className="w-full py-2.5 rounded-xl font-black text-xs transition shadow-lg mt-3 bg-[var(--accent)] text-[var(--accent-fg)] hover:opacity-90 whitespace-nowrap"
            >
              💾 Custom 슬롯에 저장
            </button>

          </div>
        )}
      </div>

      {/* 🖥️ 2. 미리보기 대시보드 */}
      <div 
        ref={previewCanvasRef}
        className="w-full border rounded-2xl p-3 md:p-6 shadow-2xl flex flex-col gap-4 relative overflow-hidden bg-[var(--panel)] border-[var(--panel-border)] z-10 my-auto"
      >
        {bgImage && (
          <>
            <div className="absolute inset-0 bg-cover bg-center pointer-events-none z-0" style={{ backgroundImage: `url(${bgImage})` }} />
            <div className="absolute inset-0 bg-black pointer-events-none z-0" style={{ opacity: bgOpacity }} />
          </>
        )}

        {/* ✂️ 스티커 레이어 & 투명도 독립 UI 분리 */}
        <div className="absolute inset-0 z-40 overflow-hidden pointer-events-none">
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
                className={`absolute cursor-pointer pointer-events-auto transition-transform flex flex-col items-center ${
                  isSelected ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-black/50 rounded-lg z-50' : ''
                }`}
                style={{
                  left: `${stk.x}%`,
                  top: `${stk.y}%`,
                  transform: `scale(${stk.scale}) rotate(${stk.rotation}deg)`
                }}
              >
                {/* 스티커 이미지만 opacity 유효 적용! */}
                <img 
                  src={stk.url} 
                  alt="스티커" 
                  style={{ opacity: stk.opacity }}
                  className={`max-w-[130px] max-h-[130px] object-contain pointer-events-none ${frameClasses}`} 
                />

                {/* 스티커 선택 시 아래에 뜨는 조작 UI (100% 불투명하게 독립 분리) */}
                {isSelected && (
                  <div 
                    className="absolute top-full mt-2 flex flex-col items-center gap-1.5 bg-black/95 border border-amber-400 rounded-xl p-2 shadow-2xl z-50 pointer-events-auto opacity-100"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* 불투명도 조절 게이지바 (텍스트 삭제) */}
                    <input 
                      type="range" 
                      min="0.1" 
                      max="1.0" 
                      step="0.05" 
                      value={stk.opacity} 
                      onChange={(e) => updateSticker(stk.id, 'opacity', parseFloat(e.target.value))}
                      className="w-full h-1.5 accent-amber-400 cursor-pointer"
                      title="불투명도 조절"
                    />

                    {/* 아이콘 전용 조작 라인 [✥] [⤢] [🔄] [⚙️] */}
                    <div className="flex items-center gap-1 pt-1 border-t border-zinc-700">
                      <button 
                        onPointerDown={(e) => handleStartMoveSticker(stk.id, e)}
                        className="w-7 h-7 rounded bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-xs text-white flex items-center justify-center cursor-grab active:cursor-grabbing"
                        title="이동"
                      >
                        ✥
                      </button>

                      <button 
                        onPointerDown={(e) => handleStartScaleSticker(stk.id, e)}
                        className="w-7 h-7 rounded bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-xs text-white flex items-center justify-center cursor-ns-resize"
                        title="크기 조절"
                      >
                        ⤢
                      </button>

                      <button 
                        onPointerDown={(e) => handleStartRotateSticker(stk.id, e)}
                        className="w-7 h-7 rounded bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-xs text-white flex items-center justify-center cursor-ew-resize"
                        title="회전"
                      >
                        🔄
                      </button>

                      <button 
                        onClick={() => setConfigStickerId(stk.id)}
                        className="w-7 h-7 rounded bg-amber-500 hover:bg-amber-400 text-black text-xs font-black flex items-center justify-center"
                        title="설정"
                      >
                        ⚙️
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 헤더 제어바 */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-b pb-3 border-[var(--panel-border)]">
          <div className="flex items-center gap-2">
            <button onClick={() => router.push('/')} className="px-3 py-1.5 rounded-lg border text-xs font-bold bg-[var(--headerBtnBg,var(--inner-box))] border-[var(--panel-border)] text-[var(--text-sub)] hover:text-white whitespace-nowrap">
              ← 메인 페이지 이동
            </button>
            <h1 className="font-black text-sm md:text-base text-[var(--accent)] whitespace-nowrap">
              🖥️ 실시간 미리보기
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-[var(--inner-box)] p-1 rounded-xl border border-[var(--panel-border)]">
              <button 
                onClick={() => setPreviewTab("main")} 
                className={`px-3 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap ${previewTab === 'main' ? 'bg-[var(--accent)] text-[var(--accent-fg)]' : 'text-[var(--text-sub)]'}`}
              >
                🏠 메인 대시보드
              </button>
              <button 
                onClick={() => setPreviewTab("chronos")} 
                className={`px-3 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap ${previewTab === 'chronos' ? 'bg-[var(--accent)] text-[var(--accent-fg)]' : 'text-[var(--text-sub)]'}`}
              >
                📋 크로노스
              </button>
            </div>
          </div>
        </div>

        {/* 🏠 메인 대시보드 미리보기 (검은색 전체 주입 적용) */}
        {previewTab === "main" && (
          <div className="relative z-10 space-y-4">
            <div className="flex justify-end">
              <span className="text-[0.6rem] font-bold px-3 py-1 rounded-full border bg-[var(--inner-box)] border-[var(--panel-border)] text-[var(--text-sub)] flex items-center gap-1.5 whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                심층 및 어비스 구멍 출현 제보 공유중!!
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
              <div className="p-2.5 rounded-xl border bg-[var(--inner-box)] border-[var(--panel-border)] flex flex-col justify-between">
                <span className="text-[0.55rem] font-black text-[var(--text-sub)] tracking-wider uppercase whitespace-nowrap">SANCTUARY ASTRA</span>
                <div className="flex gap-2 my-1">
                  <div>
                    <span className="text-[0.5rem] text-[var(--text-sub)] block whitespace-nowrap">SOL</span>
                    <span className="text-xs font-black text-[var(--text-main)] whitespace-nowrap">9<span className="text-[0.5rem] font-normal ml-0.5">계정</span></span>
                  </div>
                  <div>
                    <span className="text-[0.5rem] text-[var(--text-sub)] block whitespace-nowrap">LUNA</span>
                    <span className="text-xs font-black text-[var(--text-main)] whitespace-nowrap">40<span className="text-[0.5rem] font-normal ml-0.5">캐릭터</span></span>
                  </div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl border bg-[var(--inner-box)] border-[var(--panel-border)] flex flex-col justify-between">
                <span className="text-[0.55rem] font-bold text-[var(--text-sub)] whitespace-nowrap">올라운더 달성률</span>
                <span className="text-base font-black text-[var(--accent)] whitespace-nowrap">21 <span className="text-[0.65rem]">LV</span></span>
                <span className="text-[0.5rem] text-[var(--text-sub)] whitespace-nowrap">최대 1365 LV</span>
              </div>

              <div className="p-2.5 rounded-xl border bg-[var(--inner-box)] border-[var(--panel-border)] flex flex-col justify-between">
                <span className="text-[0.55rem] font-bold text-[var(--text-sub)] whitespace-nowrap">필드보스 알림</span>
                <span className="text-sm font-black text-[var(--text-main)] whitespace-nowrap">32분</span>
              </div>

              <div className="p-2.5 rounded-xl border bg-[var(--inner-box)] border-[var(--panel-border)] flex flex-col justify-between">
                <span className="text-[0.55rem] font-bold text-[var(--text-sub)] whitespace-nowrap">소환의 결계</span>
                <span className="text-sm font-black text-[var(--text-main)] whitespace-nowrap">32분</span>
              </div>

              <div className="p-2.5 rounded-xl border flex flex-col justify-between" style={{ backgroundColor: colors.accentSpecial || "#174738", borderColor: colors.panelBorder }}>
                <span className="text-[0.55rem] font-bold text-[var(--text-sub)] whitespace-nowrap">어비스 구멍 알림</span>
                <span className="text-sm font-black text-[var(--accent)] whitespace-nowrap">17시간 47분</span>
              </div>

              <div className="p-2.5 rounded-xl border bg-[var(--inner-box)] border-[var(--panel-border)] flex flex-col justify-between">
                <span className="text-[0.55rem] font-bold text-red-400 whitespace-nowrap">심층 구멍</span>
                <span className="text-[0.65rem] font-black text-[var(--text-main)] whitespace-nowrap">창백한 산 | 대기</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h2 className="font-black text-xs md:text-sm text-[var(--text-main)] whitespace-nowrap">📋 캐릭터 숙제 체크보드</h2>
                <span className="text-[0.65rem] font-black px-2.5 py-0.5 rounded-lg bg-[var(--accent)] text-[var(--accent-fg)] whitespace-nowrap">계정 통합 14%</span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                {["char_1", "char_2", "char_3", "char_4", "char_5", "char_6"].map((charKey, idx) => {
                  const customBg = charBgs[charKey];
                  return (
                    <div key={charKey} className="relative overflow-hidden p-2.5 rounded-xl border flex flex-col gap-2 bg-[var(--panel)] border-[var(--panel-border)]">
                      {customBg && <div className="absolute inset-0 bg-cover bg-center opacity-30 pointer-events-none z-0" style={{ backgroundImage: `url(${customBg})` }} />}
                      <div className="relative z-10 flex justify-between items-center border-b pb-1 border-[var(--panel-border)]">
                        <span className="font-black text-xs text-[var(--text-main)] whitespace-nowrap">👑 캐릭터 {idx + 1}</span>
                        <span className="text-[0.5rem] text-[var(--text-sub)] whitespace-nowrap">0%</span>
                      </div>
                      <div className="relative z-10 space-y-1.5">
                        <div className="grid grid-cols-2 gap-1">
                          <button className="py-1 rounded text-[0.55rem] font-bold bg-[var(--inner-box)] text-[var(--text-sub)] whitespace-nowrap">허상</button>
                          {/* 1번 버튼: 보조포인트2 (accentSecondary) 적용! */}
                          <button className="py-1 rounded text-[0.55rem] font-black bg-[var(--accent-secondary)] text-[var(--accent-secondary-fg)] whitespace-nowrap">동굴</button>
                        </div>
                        <div className="grid grid-cols-2 gap-1">
                          <button className="py-1 rounded text-[0.55rem] font-bold bg-[var(--inner-box)] text-[var(--text-sub)] whitespace-nowrap">카브</button>
                          {/* 1번 버튼: 보조포인트2 (accentSecondary) 적용! */}
                          <button className="py-1 rounded text-[0.55rem] font-black bg-[var(--accent-secondary)] text-[var(--accent-secondary-fg)] whitespace-nowrap">주말</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 📋 크로노스 미리보기 */}
        {previewTab === "chronos" && (
          <div className="relative z-10 space-y-3">
            <div className="p-2.5 rounded-xl border flex justify-between items-center bg-[var(--inner-box)] border-[var(--panel-border)]">
              <span className="font-black text-xs text-[var(--accent)] whitespace-nowrap">CHRONOS 크로노스 : 캐릭터 관리</span>
              <span className="text-[0.55rem] text-[var(--text-sub)] whitespace-nowrap">⌛ 명예의 전당 즉시 연결</span>
            </div>

            <div className="p-3 rounded-xl border bg-[var(--panel)] border-[var(--panel-border)] space-y-3">
              <div className="flex items-center justify-between border-b pb-2 border-[var(--panel-border)]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--inner-box)] text-base shrink-0">🎨</div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-black text-sm text-[var(--accent)] whitespace-nowrap">대표 캐릭터</span>
                    <span className="px-1.5 py-0.5 rounded text-[0.55rem] font-bold bg-black/40 text-[var(--text-main)] whitespace-nowrap">댄서</span>
                    <span className="px-1.5 py-0.5 rounded text-[0.55rem] font-bold bg-[var(--accent)] text-[var(--accent-fg)] whitespace-nowrap">대표</span>
                  </div>
                </div>
                <span className="text-[0.6rem] font-bold px-2 py-0.5 rounded border border-[var(--accent)] text-[var(--accent)] whitespace-nowrap">✨ 칭호 2</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                {[
                  { name: "⚔️ 전투력", val: "100189" },
                  { name: "🌿 생활력", val: "24673" },
                  { name: "✨ 매력", val: "47363" },
                  { name: "🔮 마도저항", val: "4676" },
                  { name: "🛡️ 길드 공헌도", val: "45173" },
                ].map((st) => (
                  <div key={st.name} className="p-2 rounded-lg border bg-[var(--inner-box)] border-[var(--panel-border)]">
                    <span className="text-[0.55rem] font-bold text-[var(--text-sub)] block whitespace-nowrap">{st.name}</span>
                    <span className="text-xs font-black text-[var(--text-main)] whitespace-nowrap">{st.val}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-2 rounded-xl border bg-[var(--panel)] border-[var(--panel-border)] flex items-center justify-between gap-2 overflow-x-auto custom-scrollbar">
              <div className="flex items-center gap-1.5 shrink-0">
                {["캐릭터 1", "캐릭터 2", "캐릭터 3", "캐릭터 4", "캐릭터 5", "캐릭터 6"].map((cName, idx) => (
                  <button 
                    key={cName}
                    className={`px-2.5 py-1 rounded-lg text-center border text-[0.6rem] font-bold whitespace-nowrap ${
                      idx === 0 
                        ? 'bg-[var(--accent)] text-[var(--accent-fg)] border-[var(--accent)]' 
                        : 'bg-[var(--inner-box)] border-[var(--panel-border)] text-[var(--text-sub)]'
                    }`}
                  >
                    <div>{cName}</div>
                  </button>
                ))}
              </div>
              <span className="text-[0.6rem] px-2 py-1 rounded bg-[var(--inner-box)] text-[var(--text-sub)] font-bold whitespace-nowrap shrink-0">⚙️ 설정</span>
            </div>

            <div className="grid grid-cols-3 gap-1 p-1 rounded-xl border bg-[var(--inner-box)] border-[var(--panel-border)] text-[0.6rem] font-bold text-center">
              <div className="py-1.5 rounded-lg bg-[var(--accent)] text-[var(--accent-fg)] font-black whitespace-nowrap">ALL / 일일</div>
              <div className="py-1.5 text-[var(--text-sub)] whitespace-nowrap">어비스/레이드 / 주간</div>
              <div className="py-1.5 text-[var(--text-sub)] whitespace-nowrap">물교/구매 / 클래스</div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              <div className="p-2.5 rounded-xl border bg-[var(--panel)] border-[var(--panel-border)] space-y-2">
                <div className="flex justify-between items-center border-b pb-1 border-[var(--panel-border)]">
                  <span className="font-black text-[0.65rem] text-[var(--accent)] whitespace-nowrap">일일 컨텐츠</span>
                  <span className="text-[0.5rem] px-1.5 py-0.5 rounded bg-[var(--inner-box)] text-[var(--text-sub)] whitespace-nowrap">전체 완료</span>
                </div>
                <div className="space-y-1">
                  {["일일 미션", "요일 던전", "일일 아르바이트", "심층 던전"].map((it) => (
                    <div key={it} className="flex justify-between items-center p-1.5 rounded bg-[var(--inner-box)] text-[0.6rem] font-bold text-[var(--text-main)]">
                      <span className="whitespace-nowrap">{it}</span>
                      <span className="w-3.5 h-3.5 rounded border border-[var(--panel-border)]"></span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-2.5 rounded-xl border bg-[var(--panel)] border-[var(--panel-border)] space-y-2">
                <div className="flex justify-between items-center border-b pb-1 border-[var(--panel-border)]">
                  <span className="font-black text-[0.65rem] text-[var(--accent)] whitespace-nowrap">주간 컨텐츠</span>
                  <span className="text-[0.5rem] px-1.5 py-0.5 rounded bg-[var(--inner-box)] text-[var(--text-sub)] whitespace-nowrap">전체 완료</span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between items-center p-1 rounded bg-[var(--inner-box)] text-[0.6rem] font-bold text-[var(--text-main)]">
                    <span className="whitespace-nowrap">검은 구멍</span>
                    <span className="text-[0.55rem] text-[var(--text-sub)]">0/12 - +</span>
                  </div>
                  <div className="flex justify-between items-center p-1 rounded bg-[var(--inner-box)] text-[0.6rem] font-bold text-[var(--text-main)]">
                    <span className="whitespace-nowrap">소환의 결계</span>
                    <span className="text-[0.55rem] text-[var(--text-sub)]">0/7 - +</span>
                  </div>
                  <div className="flex justify-between items-center p-1 rounded bg-[var(--inner-box)] text-[0.6rem] font-bold text-[var(--text-main)]">
                    <span className="whitespace-nowrap">뱅가드 브리치</span>
                    <span className="text-[0.55rem] text-[var(--text-sub)]">0/3 - +</span>
                  </div>
                  <div className="flex justify-between items-center p-1.5 rounded bg-[var(--inner-box)] text-[0.6rem] font-bold text-[var(--text-main)]">
                    <span className="whitespace-nowrap">필드 보스</span>
                    <span className="w-3.5 h-3.5 rounded border border-[var(--panel-border)]"></span>
                  </div>
                  <div className="flex justify-between items-center p-1.5 rounded bg-[var(--inner-box)] text-[0.6rem] font-bold text-[var(--accent-secondary)] border border-[var(--accent-secondary)]/40">
                    <span className="whitespace-nowrap">심층 던전 [매우 어려움]</span>
                    <span className="w-3.5 h-3.5 rounded bg-[var(--accent-secondary)] text-[var(--accent-secondary-fg)] flex items-center justify-center text-[0.5rem]">✓</span>
                  </div>
                  <div className="flex justify-between items-center p-1.5 rounded bg-[var(--inner-box)] text-[0.6rem] font-bold text-[var(--accent-secondary)] border border-[var(--accent-secondary)]/40">
                    <span className="whitespace-nowrap">[주간 목표] 정기 의뢰(초회)</span>
                    <span className="w-3.5 h-3.5 rounded bg-[var(--accent-secondary)] text-[var(--accent-secondary-fg)] flex items-center justify-center text-[0.5rem]">✓</span>
                  </div>
                  <div className="flex justify-between items-center p-1.5 rounded bg-[var(--inner-box)] text-[0.6rem] font-bold text-[var(--text-main)]">
                    <span className="whitespace-nowrap">[멤버십] 주간 아르바이트</span>
                    <span className="w-3.5 h-3.5 rounded border border-[var(--panel-border)]"></span>
                  </div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl border bg-[var(--panel)] border-[var(--panel-border)] space-y-2">
                <div className="flex justify-between items-center border-b pb-1 border-[var(--panel-border)]">
                  <span className="font-black text-[0.65rem] text-[var(--accent)] whitespace-nowrap">어비스 관리</span>
                  <span className="text-[0.5rem] px-1.5 py-0.5 rounded bg-[var(--inner-box)] text-[var(--text-sub)] whitespace-nowrap">전체 완료</span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between items-center p-1.5 rounded bg-[var(--inner-box)] text-[0.6rem] font-bold text-[var(--text-main)]">
                    <span className="whitespace-nowrap">허상의 정박지</span>
                    <span className="w-3.5 h-3.5 rounded border border-[var(--panel-border)]"></span>
                  </div>
                  <div className="flex justify-between items-center p-1.5 rounded bg-[var(--inner-box)] text-[0.6rem] font-bold text-[var(--accent-secondary)] border border-[var(--accent-secondary)]/40">
                    <span className="whitespace-nowrap">광기의 동굴</span>
                    <span className="w-3.5 h-3.5 rounded bg-[var(--accent-secondary)] text-[var(--accent-secondary-fg)] flex items-center justify-center text-[0.5rem]">✓</span>
                  </div>
                  <div className="flex justify-between items-center p-1.5 rounded bg-[var(--inner-box)] text-[0.6rem] font-bold text-[var(--accent-secondary)] border border-[var(--accent-secondary)]/40">
                    <span className="whitespace-nowrap">흩어진 물길</span>
                    <span className="w-3.5 h-3.5 rounded bg-[var(--accent-secondary)] text-[var(--accent-secondary-fg)] flex items-center justify-center text-[0.5rem]">✓</span>
                  </div>
                  <div className="flex justify-between items-center p-1.5 rounded bg-[var(--inner-box)] text-[0.6rem] font-bold text-[var(--text-main)]">
                    <span className="whitespace-nowrap">주말에는 어비스</span>
                    <span className="w-3.5 h-3.5 rounded border border-[var(--panel-border)]"></span>
                  </div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl border bg-[var(--panel)] border-[var(--panel-border)] space-y-2">
                <div className="flex justify-between items-center border-b pb-1 border-[var(--panel-border)]">
                  <span className="font-black text-[0.65rem] text-[var(--accent)] whitespace-nowrap">레이드 관리</span>
                  <span className="text-[0.5rem] px-1.5 py-0.5 rounded bg-[var(--inner-box)] text-[var(--text-sub)] whitespace-nowrap">전체 완료</span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between items-center p-1.5 rounded bg-[var(--inner-box)] text-[0.6rem] font-bold text-[var(--accent-secondary)] border border-[var(--accent-secondary)]/40">
                    <span className="whitespace-nowrap">카브락</span>
                    <span className="w-3.5 h-3.5 rounded bg-[var(--accent-secondary)] text-[var(--accent-secondary-fg)] flex items-center justify-center text-[0.5rem]">✓</span>
                  </div>
                  <div className="flex justify-between items-center p-1.5 rounded bg-[var(--inner-box)] text-[0.6rem] font-bold text-[var(--text-main)]">
                    <span className="whitespace-nowrap">화이트서큐버스</span>
                    <span className="w-3.5 h-3.5 rounded border border-[var(--panel-border)]"></span>
                  </div>
                  <div className="flex justify-between items-center p-1.5 rounded bg-[var(--inner-box)] text-[0.6rem] font-bold text-[var(--text-main)]">
                    <span className="whitespace-nowrap">에이렐</span>
                    <span className="w-3.5 h-3.5 rounded border border-[var(--panel-border)]"></span>
                  </div>
                  <div className="flex justify-between items-center p-1.5 rounded bg-[var(--inner-box)] text-[0.6rem] font-bold text-[var(--text-main)]">
                    <span className="whitespace-nowrap">주말에는 레이드</span>
                    <span className="w-3.5 h-3.5 rounded border border-[var(--panel-border)]"></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ⚙️ 스티커 설정 팝업 모달 */}
      {configStickerId && (
        <div className="fixed inset-0 z-[11000] flex items-center justify-center p-4 bg-black/70 animate-in fade-in duration-200" onClick={() => setConfigStickerId(null)}>
          <div className="bg-[var(--panel)] border border-[var(--accent)] rounded-2xl p-5 shadow-2xl w-full max-w-sm space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b pb-2 border-[var(--panel-border)]">
              <h3 className="font-black text-sm text-[var(--accent)] flex items-center gap-1.5">⚙️ 스티커 설정</h3>
              <button onClick={() => setConfigStickerId(null)} className="text-zinc-400 hover:text-white text-lg font-bold">&times;</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[0.65rem] font-bold text-[var(--text-sub)] block mb-1">프레임 / 아웃라인 스타일</label>
                <select 
                  value={stickers.find(s => s.id === configStickerId)?.frameStyle || "sticker"}
                  onChange={(e) => updateSticker(configStickerId, 'frameStyle', e.target.value)}
                  className="w-full p-2 rounded-xl text-xs font-bold bg-[var(--inner-box)] border border-[var(--panel-border)] text-[var(--text-main)]"
                >
                  <option value="sticker">🤍 실물 스티커 (자동 누끼 & 흰색 아웃라인)</option>
                  <option value="gold">🏆 금빛 황금 액자</option>
                  <option value="polaroid">📷 폴라로이드 사진틀</option>
                  <option value="neon">✨ 네온 프레임</option>
                  <option value="none">❌ 원본 (테두리 없음)</option>
                </select>
              </div>

              <div className="pt-2 border-t border-[var(--panel-border)] flex flex-col gap-2">
                <button 
                  onClick={() => changeStickerInputRef.current?.click()}
                  className="w-full py-2 rounded-xl bg-[var(--inner-box)] hover:bg-[var(--panel-hover)] border border-[var(--panel-border)] text-xs font-bold text-[var(--accent)] flex items-center justify-center gap-1.5"
                >
                  🖼️ 이미지 교체하기
                </button>

                <button 
                  onClick={() => setDeleteConfirmId(configStickerId)}
                  className="w-full py-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-800/50 text-xs font-bold text-red-400 flex items-center justify-center gap-1.5"
                >
                  🗑️ 스티커 삭제
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🗑️ 삭제 확인 모달 */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[12000] flex items-center justify-center p-4 bg-black/80 animate-in fade-in duration-200" onClick={() => setDeleteConfirmId(null)}>
          <div className="bg-zinc-900 border border-red-500 rounded-2xl p-5 shadow-2xl w-full max-w-xs text-center space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="text-3xl">🚨</div>
            <div className="space-y-1">
              <h4 className="font-black text-sm text-white">스티커를 삭제하시겠습니까?</h4>
              <p className="text-[0.65rem] text-zinc-400">삭제된 스티커는 복구되지 않습니다.</p>
            </div>
            <div className="flex gap-2 justify-center pt-2">
              <button onClick={() => setDeleteConfirmId(null)} className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-bold hover:bg-zinc-700 transition">취소</button>
              <button onClick={() => deleteSticker(deleteConfirmId)} className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-black hover:bg-red-500 transition shadow-lg">확인 (삭제)</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}