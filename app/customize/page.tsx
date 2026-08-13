"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// 기본 테마 색상 맵
const PRESET_THEMES: Record<string, any> = {
  aureum: {
    background: "#1b1b1b",
    panel: "#101011",
    panelBorder: "#2A2A2E",
    innerBox: "#0D0D0E",
    textMain: "#EDEDED",
    textSub: "#9CA3AF",
    accent: "#E6C788",
    accentFg: "#000000",
    accentSecondary: "#C5A059",
    accentSecondaryFg: "#000000",
    headerBtnBg: "#0D0D0E"
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
    headerBtnBg: "#F1F5F9"
  },
  nemeton: {
    background: "#081914",
    panel: "#112A23",
    panelBorder: "#244A3E",
    innerBox: "#06110D",
    textMain: "#EDF9F4",
    textSub: "#A3C5B9",
    accent: "#48C9A0",
    accentFg: "#000000",
    accentSecondary: "#5EA7A0",
    accentSecondaryFg: "#000000",
    headerBtnBg: "#06110D"
  },
  vesper: {
    background: "#0D0B18",
    panel: "#19142C",
    panelBorder: "#342B50",
    innerBox: "#090712",
    textMain: "#F5F0FF",
    textSub: "#B9AECF",
    accent: "#B18AF3",
    accentFg: "#000000",
    accentSecondary: "#6E82D9",
    accentSecondaryFg: "#000000",
    headerBtnBg: "#090712"
  },
  rosarium: {
    background: "#1A1016",
    panel: "#2B1922",
    panelBorder: "#4E2A38",
    innerBox: "#120A0E",
    textMain: "#FFF4F7",
    textSub: "#C7A9B5",
    accent: "#E88DA8",
    accentFg: "#000000",
    accentSecondary: "#B89A72",
    accentSecondaryFg: "#000000",
    headerBtnBg: "#120A0E"
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
    headerBtnBg: "#C3E8AF"
  }
};

interface Sticker {
  id: string;
  url: string;
  x: number;
  y: number;
  scale: number;
  frameStyle: "none" | "gold" | "polaroid" | "neon" | "sticker";
}

export default function CustomizePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [activeSlot, setActiveSlot] = useState<"custom_1" | "custom_2" | "custom_3">("custom_1");
  const [previewTab, setPreviewTab] = useState<"main" | "chronos" | "kerygma">("main");

  // 아코디언 상태 관리
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({
    slot: true,
    globalColor: true,
    bgImage: false,
    characterCard: false,
    stickers: false
  });

  const toggleAccordion = (key: string) => {
    setOpenAccordions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // 색상 및 테마 상태
  const [colors, setColors] = useState(PRESET_THEMES.aureum);
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [bgOpacity, setBgOpacity] = useState<number>(0.3);

  // 캐릭터별 맞춤 배경 (캐릭터 이름 -> 이미지 URL)
  const [charBgs, setCharBgs] = useState<Record<string, string>>({});

  // 스티커 목록
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [selectedStickerFrame, setSelectedStickerFrame] = useState<Sticker["frameStyle"]>("sticker");

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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      alert("파일 크기가 15MB를 초과할 수 없습니다!");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setBgImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // 캐릭터 카드 배경 Upload
  const handleCharBgUpload = (charName: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCharBgs(prev => ({ ...prev, [charName]: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  // 다꾸 스티커 추가
  const handleStickerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const newSticker: Sticker = {
        id: `sticker_${Date.now()}`,
        url: reader.result as string,
        x: 20 + stickers.length * 15,
        y: 20 + stickers.length * 15,
        scale: 1,
        frameStyle: selectedStickerFrame
      };
      setStickers(prev => [...prev, newSticker]);
    };
    reader.readAsDataURL(file);
  };

  const updateSticker = (id: string, key: keyof Sticker, val: any) => {
    setStickers(prev => prev.map(s => s.id === id ? { ...s, [key]: val } : s));
  };

  const deleteSticker = (id: string) => {
    setStickers(prev => prev.filter(s => s.id !== id));
  };

  const handleSave = () => {
    const payload = {
      colors,
      bgImage,
      bgOpacity,
      charBgs,
      stickers
    };
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

    alert(`🎉 [${activeSlot.replace('_', ' ').toUpperCase()}] 스티커 & 테마 저장이 완료되었습니다!`);
  };

  if (!mounted) return null;

  return (
    <div className="relative min-h-[calc(100vh-100px)] flex flex-col lg:flex-row gap-6 p-2 md:p-4 items-start">
      
      {/* 🎛️ 좌측 플로팅 아코디언 조작 리모컨 (눈높이 고정) */}
      <div className="w-full lg:w-[420px] shrink-0 border rounded-2xl p-4 shadow-2xl flex flex-col gap-4 backdrop-blur bg-[var(--panel)] border-[var(--panel-border)] lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto custom-scrollbar z-20">
        
        <div className="flex items-center justify-between border-b pb-3 border-[var(--panel-border)] shrink-0">
          <div>
            <h1 className="font-black text-base md:text-lg text-[var(--accent)] flex items-center gap-2 whitespace-nowrap">
              <span>🎛️</span> SANCTUM 테마 스튜디오
            </h1>
            <p className="text-[0.65rem] text-[var(--text-sub)] font-bold mt-0.5 whitespace-nowrap">다꾸 스티커 & 개별 카드 테마 편집기</p>
          </div>
          <button onClick={() => router.push('/')} className="text-xs px-3 py-1.5 rounded-lg border bg-[var(--inner-box)] border-[var(--panel-border)] text-[var(--text-sub)] hover:text-[var(--text-main)] font-bold whitespace-nowrap shrink-0">
            ← 메인
          </button>
        </div>

        {/* 1. 저장 슬롯 선택 아코디언 */}
        <div className="border rounded-xl overflow-hidden border-[var(--panel-border)] bg-[var(--inner-box)]">
          <button onClick={() => toggleAccordion('slot')} className="w-full px-3 py-2.5 flex justify-between items-center text-xs font-black text-[var(--text-main)] bg-[var(--panel-hover)]">
            <span className="whitespace-nowrap">📁 1. 저장 슬롯 & 원본 불러오기</span>
            <span>{openAccordions.slot ? '▲' : '▼'}</span>
          </button>

          {openAccordions.slot && (
            <div className="p-3 space-y-3">
              <div className="grid grid-cols-3 gap-2">
                {(["custom_1", "custom_2", "custom_3"] as const).map((slot, idx) => (
                  <button
                    key={slot}
                    onClick={() => { setActiveSlot(slot); loadSlotData(slot); }}
                    className={`py-2 px-1 rounded-xl text-[0.7rem] font-black border transition whitespace-nowrap ${
                      activeSlot === slot 
                        ? 'bg-[var(--accent)] text-[var(--accent-fg)] border-[var(--accent)] shadow-md' 
                        : 'bg-[var(--panel)] border-[var(--panel-border)] text-[var(--text-sub)] hover:text-[var(--text-main)]'
                    }`}
                  >
                    Custom {idx + 1}
                  </button>
                ))}
              </div>

              <div className="space-y-1.5">
                <span className="text-[0.65rem] font-bold text-[var(--text-sub)] block whitespace-nowrap">기존 기본 테마 색상 덮어쓰기</span>
                <div className="grid grid-cols-3 gap-1.5">
                  {Object.keys(PRESET_THEMES).map((pKey) => (
                    <button
                      key={pKey}
                      onClick={() => handleCopyPreset(pKey)}
                      className="py-1 px-1.5 rounded-lg text-[0.6rem] font-bold border uppercase transition bg-[var(--panel)] border-[var(--panel-border)] text-[var(--text-sub)] hover:border-[var(--accent)] hover:text-[var(--accent)] whitespace-nowrap"
                    >
                      {pKey}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 2. 전역 색상 & HEX 직접 입력 아코디언 */}
        <div className="border rounded-xl overflow-hidden border-[var(--panel-border)] bg-[var(--inner-box)]">
          <button onClick={() => toggleAccordion('globalColor')} className="w-full px-3 py-2.5 flex justify-between items-center text-xs font-black text-[var(--text-main)] bg-[var(--panel-hover)]">
            <span className="whitespace-nowrap">🎨 2. 전역 색상 & HEX 코드 설정</span>
            <span>{openAccordions.globalColor ? '▲' : '▼'}</span>
          </button>

          {openAccordions.globalColor && (
            <div className="p-3 space-y-2 text-[0.7rem] font-bold">
              
              {[
                { label: "🖼️ 전체 바탕 배경", key: "background" },
                { label: "📦 카드 및 패널 배경", key: "panel" },
                { label: "🔲 카드 테두리 선", key: "panelBorder" },
                { label: "💡 상단 유틸 버튼 배경", key: "headerBtnBg" },
                { label: "✍️ 메인 글자 색상", key: "textMain" },
                { label: "💬 설명 글자 색상", key: "textSub" },
                { label: "✨ 주 포인트 (버튼 배경)", key: "accent" },
                { label: "🔤 주 포인트 버튼 글자색", key: "accentFg" },
                { label: "🌟 보조 포인트 (체크/완료)", key: "accentSecondary" },
                { label: "🔤 보조 포인트 버튼 글자색", key: "accentSecondaryFg" },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between p-2 rounded-lg bg-[var(--panel)] border border-[var(--panel-border)] gap-2">
                  <span className="text-[var(--text-main)] whitespace-nowrap">{item.label}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <input 
                      type="text" 
                      value={colors[item.key] || "#000000"} 
                      onChange={(e) => handleColorChange(item.key, e.target.value)}
                      className="w-16 px-1.5 py-0.5 rounded text-[0.65rem] font-mono border bg-[var(--inner-box)] border-[var(--panel-border)] text-[var(--text-main)] uppercase text-center"
                    />
                    <input 
                      type="color" 
                      value={colors[item.key] || "#000000"} 
                      onChange={(e) => handleColorChange(item.key, e.target.value)} 
                      className="w-7 h-7 rounded border-0 cursor-pointer bg-transparent" 
                    />
                  </div>
                </div>
              ))}

            </div>
          )}
        </div>

        {/* 3. 전체 배경 GIF / 이미지 아코디언 */}
        <div className="border rounded-xl overflow-hidden border-[var(--panel-border)] bg-[var(--inner-box)]">
          <button onClick={() => toggleAccordion('bgImage')} className="w-full px-3 py-2.5 flex justify-between items-center text-xs font-black text-[var(--text-main)] bg-[var(--panel-hover)]">
            <span className="whitespace-nowrap">🎞️ 3. 전체 배경 GIF / 이미지</span>
            <span>{openAccordions.bgImage ? '▲' : '▼'}</span>
          </button>

          {openAccordions.bgImage && (
            <div className="p-3 space-y-3">
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleImageUpload}
                className="text-[0.65rem] file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[0.65rem] file:font-bold file:bg-[var(--accent)] file:text-[var(--accent-fg)] cursor-pointer text-[var(--text-sub)] w-full"
              />

              {bgImage && (
                <div className="space-y-2 pt-1 border-t border-[var(--panel-border)]">
                  <div className="flex justify-between items-center text-[0.65rem] font-bold text-[var(--text-sub)]">
                    <span>어둡기 (가독성 조절)</span>
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
                    배경 이미지 삭제
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 4. 캐릭터별 개별 짤 & 카드 배경 설정 아코디언 */}
        <div className="border rounded-xl overflow-hidden border-[var(--panel-border)] bg-[var(--inner-box)]">
          <button onClick={() => toggleAccordion('characterCard')} className="w-full px-3 py-2.5 flex justify-between items-center text-xs font-black text-[var(--text-main)] bg-[var(--panel-hover)]">
            <span className="whitespace-nowrap">🃏 4. 캐릭터 카드별 배경 짤 넣기</span>
            <span>{openAccordions.characterCard ? '▲' : '▼'}</span>
          </button>

          {openAccordions.characterCard && (
            <div className="p-3 space-y-2 text-[0.7rem] font-bold">
              {["밤설", "거월", "겸설", "한띨", "전설", "뉴월"].map((charName) => (
                <div key={charName} className="flex flex-col gap-1.5 p-2 rounded-lg bg-[var(--panel)] border border-[var(--panel-border)]">
                  <div className="flex justify-between items-center">
                    <span className="text-[var(--accent)] font-black">👑 {charName} 카드 배경</span>
                    {charBgs[charName] && (
                      <button onClick={() => setCharBgs(prev => ({ ...prev, [charName]: "" }))} className="text-[0.6rem] text-red-400 underline">삭제</button>
                    )}
                  </div>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => handleCharBgUpload(charName, e)}
                    className="text-[0.6rem] file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[0.6rem] file:bg-[var(--inner-box)] file:text-[var(--text-main)] cursor-pointer text-[var(--text-sub)]"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 5. ✂️ 다꾸 스티커 & 액자 추가 아코디언 */}
        <div className="border rounded-xl overflow-hidden border-[var(--panel-border)] bg-[var(--inner-box)]">
          <button onClick={() => toggleAccordion('stickers')} className="w-full px-3 py-2.5 flex justify-between items-center text-xs font-black text-[var(--accent)] bg-[var(--panel-hover)]">
            <span className="whitespace-nowrap">✂️ 5. 다꾸 스티커 & 액자 레이어</span>
            <span>{openAccordions.stickers ? '▲' : '▼'}</span>
          </button>

          {openAccordions.stickers && (
            <div className="p-3 space-y-3">
              
              <div className="space-y-1">
                <span className="text-[0.65rem] font-bold text-[var(--text-sub)] block">스티커 테두리 / 액자 스타일</span>
                <select 
                  value={selectedStickerFrame}
                  onChange={(e) => setSelectedStickerFrame(e.target.value as any)}
                  className="w-full p-1.5 rounded-lg text-xs font-bold bg-[var(--panel)] border border-[var(--panel-border)] text-[var(--text-main)]"
                >
                  <option value="sticker">🤍 실물 스티커 (흰색 아웃라인)</option>
                  <option value="gold">🏆 금빛 황금 액자</option>
                  <option value="polaroid">📷 폴라로이드 사진틀</option>
                  <option value="neon">✨ 네온 프레임</option>
                  <option value="none">❌ 테두리 없음 (원본)</option>
                </select>
              </div>

              <div>
                <span className="text-[0.65rem] font-bold text-[var(--text-sub)] block mb-1">스티커/GIF 파일 업로드</span>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleStickerUpload}
                  className="text-[0.65rem] file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[0.65rem] file:font-bold file:bg-[var(--accent)] file:text-[var(--accent-fg)] cursor-pointer text-[var(--text-sub)] w-full"
                />
              </div>

              {/* 현재 등록된 스티커 조작 목록 */}
              {stickers.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-[var(--panel-border)]">
                  <span className="text-[0.65rem] font-black text-[var(--text-main)] block">붙은 스티커 목록 ({stickers.length}개)</span>
                  {stickers.map((stk, idx) => (
                    <div key={stk.id} className="flex items-center justify-between p-2 rounded bg-[var(--panel)] border border-[var(--panel-border)] text-[0.65rem] gap-2">
                      <span className="font-bold text-[var(--text-main)]">스티커 #{idx + 1}</span>
                      <div className="flex items-center gap-1">
                        <span>크기:</span>
                        <input 
                          type="range" 
                          min="0.4" 
                          max="2" 
                          step="0.1" 
                          value={stk.scale} 
                          onChange={(e) => updateSticker(stk.id, 'scale', parseFloat(e.target.value))}
                          className="w-16 accent-[var(--accent)] cursor-pointer"
                        />
                        <button onClick={() => deleteSticker(stk.id)} className="text-red-400 underline font-bold ml-1">삭제</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>
          )}
        </div>

        <button 
          onClick={handleSave}
          className="w-full py-3 rounded-xl font-black text-xs md:text-sm transition shadow-lg mt-2 bg-[var(--accent)] text-[var(--accent-fg)] hover:opacity-90 shrink-0 whitespace-nowrap"
        >
          💾 Custom에 저장 및 적용하기
        </button>

      </div>

      {/* 🖥️ 우측 라이브 프리뷰 대시보드 */}
      <div className="flex-1 w-full border rounded-2xl p-3 md:p-6 shadow-xl flex flex-col gap-5 relative overflow-hidden bg-[var(--panel)] border-[var(--panel-border)] z-10">
        
        {/* 전체 배경 GIF / 이미지 오버레이 */}
        {bgImage && (
          <>
            <div className="absolute inset-0 bg-cover bg-center pointer-events-none z-0" style={{ backgroundImage: `url(${bgImage})` }} />
            <div className="absolute inset-0 bg-black pointer-events-none z-0" style={{ opacity: bgOpacity }} />
          </>
        )}

        {/* ✂️ 다꾸 스티커 떠다니는 자유 레이어 */}
        <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
          {stickers.map((stk) => {
            let frameClasses = "";
            if (stk.frameStyle === "sticker") {
              frameClasses = "drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)] [filter:drop-shadow(2px_0_0_#fff)_drop-shadow(-2px_0_0_#fff)_drop-shadow(0_2px_0_#fff)_drop-shadow(0_-2px_0_#fff)]";
            } else if (stk.frameStyle === "gold") {
              frameClasses = "border-4 border-amber-400 shadow-xl rounded-lg p-1 bg-black/80";
            } else if (stk.frameStyle === "polaroid") {
              frameClasses = "bg-white p-2 pb-6 shadow-2xl rounded border border-zinc-300 text-black";
            } else if (stk.frameStyle === "neon") {
              frameClasses = "border-2 border-cyan-400 shadow-[0_0_15px_#00f0ff] rounded-xl p-1";
            }

            return (
              <div
                key={stk.id}
                className="absolute transition-transform select-none"
                style={{
                  left: `${stk.x}%`,
                  top: `${stk.y}%`,
                  transform: `scale(${stk.scale})`
                }}
              >
                <img 
                  src={stk.url} 
                  alt="스티커" 
                  className={`max-w-[120px] max-h-[120px] object-contain ${frameClasses}`} 
                />
              </div>
            );
          })}
        </div>

        {/* 상단 미리보기 탭 제어바 */}
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 border-[var(--panel-border)]">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-[var(--accent)] uppercase tracking-wider whitespace-nowrap">🖥️ 미리보기 화면 선택</span>
          </div>

          <div className="flex items-center gap-1.5 bg-[var(--inner-box)] p-1 rounded-xl border border-[var(--panel-border)] shrink-0">
            <button 
              onClick={() => setPreviewTab("main")} 
              className={`px-3 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap ${previewTab === 'main' ? 'bg-[var(--accent)] text-[var(--accent-fg)] shadow' : 'text-[var(--text-sub)] hover:text-[var(--text-main)]'}`}
            >
              🏠 메인 대시보드
            </button>
            <button 
              onClick={() => setPreviewTab("chronos")} 
              className={`px-3 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap ${previewTab === 'chronos' ? 'bg-[var(--accent)] text-[var(--accent-fg)] shadow' : 'text-[var(--text-sub)] hover:text-[var(--text-main)]'}`}
            >
              📋 크로노스
            </button>
            <button 
              onClick={() => setPreviewTab("kerygma")} 
              className={`px-3 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap ${previewTab === 'kerygma' ? 'bg-[var(--accent)] text-[var(--accent-fg)] shadow' : 'text-[var(--text-sub)] hover:text-[var(--text-main)]'}`}
            >
              📢 공지사항
            </button>
          </div>
        </div>

        {/* 🏠 메인 대시보드 풀 피드백 미리보기 (image_865b23.png 기준 100% 동일) */}
        {previewTab === "main" && (
          <div className="relative z-10 space-y-5">
            
            {/* 상단 알림 바 */}
            <div className="flex justify-end">
              <span className="text-[0.65rem] font-bold px-3 py-1 rounded-full border bg-[var(--inner-box)] border-[var(--panel-border)] text-[var(--text-sub)] flex items-center gap-1.5 whitespace-nowrap">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                심층 및 어비스 구망 출현시간 제보 시 모두에게 공유됩니다!!
              </span>
            </div>

            {/* 위젯 그리드 영역 */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
              
              <div className="p-3 rounded-xl border bg-[var(--inner-box)] border-[var(--panel-border)] flex flex-col justify-between">
                <span className="text-[0.6rem] font-black text-[var(--text-sub)] tracking-wider uppercase">SANCTUARY ASTRA</span>
                <div className="flex gap-2 my-1">
                  <div>
                    <span className="text-[0.55rem] text-[var(--text-sub)] block">SOL</span>
                    <span className="text-sm font-black text-[var(--text-main)]">9<span className="text-[0.55rem] font-normal ml-0.5">계정</span></span>
                  </div>
                  <div>
                    <span className="text-[0.55rem] text-[var(--text-sub)] block">LUNA</span>
                    <span className="text-sm font-black text-[var(--text-main)]">40<span className="text-[0.55rem] font-normal ml-0.5">캐릭터</span></span>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl border bg-[var(--inner-box)] border-[var(--panel-border)] flex flex-col justify-between">
                <span className="text-[0.6rem] font-bold text-[var(--text-sub)]">올라운더 달성률</span>
                <span className="text-xl font-black text-[var(--accent)]">21 <span className="text-xs">LV</span></span>
                <span className="text-[0.55rem] text-[var(--text-sub)]">최대 1365 LV</span>
              </div>

              <div className="p-3 rounded-xl border bg-[var(--inner-box)] border-[var(--panel-border)] flex flex-col justify-between">
                <span className="text-[0.6rem] font-bold text-[var(--text-sub)]">필드보스 알림</span>
                <span className="text-lg font-black text-[var(--text-main)]">32분 <span className="text-[0.55rem] text-[var(--text-sub)] block font-normal">다음 출현까지</span></span>
              </div>

              <div className="p-3 rounded-xl border bg-[var(--inner-box)] border-[var(--panel-border)] flex flex-col justify-between">
                <span className="text-[0.6rem] font-bold text-[var(--text-sub)]">소환의 결계 알림</span>
                <span className="text-lg font-black text-[var(--text-main)]">32분 <span className="text-[0.55rem] text-[var(--text-sub)] block font-normal">매 정각 실시간 타이머</span></span>
              </div>

              <div className="p-3 rounded-xl border bg-[var(--inner-box)] border-[var(--panel-border)] flex flex-col justify-between">
                <span className="text-[0.6rem] font-bold text-[var(--text-sub)]">어비스 구멍 알림</span>
                <span className="text-base font-black text-[var(--accent)]">17시간 47분</span>
              </div>

              <div className="p-3 rounded-xl border bg-[var(--inner-box)] border-[var(--panel-border)] flex flex-col justify-between">
                <span className="text-[0.6rem] font-bold text-red-400">심층 구멍 알림</span>
                <span className="text-xs font-black text-[var(--text-main)]">창백한 산 | 대기</span>
              </div>

            </div>

            {/* 📋 캐릭터 숙제 체크보드 (6개 캐릭터 및 맞춤 짤 배경 반영) */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h2 className="font-black text-sm md:text-base text-[var(--text-main)] flex items-center gap-1.5 whitespace-nowrap">
                  <span>📋</span> 캐릭터 숙제 체크보드
                </h2>
                <span className="text-xs font-black px-3 py-1 rounded-lg bg-[var(--accent)] text-[var(--accent-fg)] whitespace-nowrap">
                  계정 통합 달성률 14%
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
                {["밤설", "거월", "겸설", "한띨", "전설", "뉴월"].map((charName) => {
                  const customBg = charBgs[charName];
                  return (
                    <div 
                      key={charName}
                      className="relative overflow-hidden p-3 rounded-xl border flex flex-col gap-3 transition bg-[var(--panel)] border-[var(--panel-border)]"
                    >
                      {/* 개별 캐릭터 짤 배경 */}
                      {customBg && (
                        <div 
                          className="absolute inset-0 bg-cover bg-center opacity-30 pointer-events-none z-0" 
                          style={{ backgroundImage: `url(${customBg})` }} 
                        />
                      )}

                      <div className="relative z-10 flex justify-between items-center border-b pb-1.5 border-[var(--panel-border)]">
                        <span className="font-black text-xs text-[var(--text-main)]">👑 {charName}</span>
                        <span className="text-[0.55rem] text-[var(--text-sub)]">일일 0%</span>
                      </div>

                      <div className="relative z-10 space-y-2">
                        <div>
                          <span className="text-[0.6rem] font-bold text-[var(--text-sub)] block mb-1">어비스 (1/4)</span>
                          <div className="grid grid-cols-2 gap-1">
                            <button className="py-1 rounded text-[0.6rem] font-bold bg-[var(--inner-box)] text-[var(--text-sub)]">허상</button>
                            <button className="py-1 rounded text-[0.6rem] font-black bg-[var(--accent)] text-[var(--accent-fg)]">동굴</button>
                          </div>
                        </div>

                        <div>
                          <span className="text-[0.6rem] font-bold text-[var(--text-sub)] block mb-1">레이드 (0/4)</span>
                          <div className="grid grid-cols-2 gap-1">
                            <button className="py-1 rounded text-[0.6rem] font-bold bg-[var(--inner-box)] text-[var(--text-sub)]">카브</button>
                            <button className="py-1 rounded text-[0.6rem] font-black bg-[var(--accent-secondary)] text-[var(--accent-secondary-fg)]">주말</button>
                          </div>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>

            </div>

          </div>
        )}

        {/* 📋 크로노스 탭 미리보기 */}
        {previewTab === "chronos" && (
          <div className="relative z-10 p-6 rounded-xl border bg-[var(--inner-box)] border-[var(--panel-border)] text-center space-y-3">
            <h3 className="font-black text-base text-[var(--accent)]">📋 CHRONOS - 캐릭터 수집 & 스탯 관리</h3>
            <p className="text-xs text-[var(--text-sub)]">현재 설정된 배경 및 버튼 색상이 크로노스 페이지에도 동일하게 적용됩니다.</p>
          </div>
        )}

        {/* 📢 케리그마 탭 미리보기 */}
        {previewTab === "kerygma" && (
          <div className="relative z-10 p-6 rounded-xl border bg-[var(--inner-box)] border-[var(--panel-border)] text-center space-y-3">
            <h3 className="font-black text-base text-[var(--accent)]">📢 KERYGMA - 길드 공지사항</h3>
            <p className="text-xs text-[var(--text-sub)]">공지사항 카드 및 댓글 창 색상이 실시간으로 변경됩니다.</p>
          </div>
        )}

      </div>

    </div>
  );
}