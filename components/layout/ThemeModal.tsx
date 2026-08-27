"use client";

import { AccountPreset, Sticker } from '../../types/layout';

interface ThemeModalProps {
  isThemeModalOpen: boolean;
  setIsThemeModalOpen: (val: boolean) => void;
  activeAccount: AccountPreset | null;
  tempTheme: string;
  setTempTheme: (val: string) => void;
  globalStickerInputRef: React.RefObject<HTMLInputElement | null>;
  handleResetStickerPositions: () => void;
  stickers: Sticker[];
  updateSticker: (id: string, key: keyof Sticker, val: any) => void;
  setSelectedStickerId: (id: string | null) => void;
  deleteSticker: (id: string) => void;
  fontSizeLevel: string;
  setFontSizeLevel: (val: string) => void;
  handleSaveThemeSettings: () => void;
  router: any;
}

export default function ThemeModal({
  isThemeModalOpen,
  setIsThemeModalOpen,
  activeAccount,
  tempTheme,
  setTempTheme,
  globalStickerInputRef,
  handleResetStickerPositions,
  stickers,
  updateSticker,
  setSelectedStickerId,
  deleteSticker,
  fontSizeLevel,
  setFontSizeLevel,
  handleSaveThemeSettings,
  router
}: ThemeModalProps) {
  if (!isThemeModalOpen) return null;

  return (
    <div className="sticker-modal fixed inset-0 z-[11000] flex items-center justify-center p-4 bg-black/70 animate-in fade-in duration-200">
      <div className="bg-[var(--panel)] border border-[var(--panel-border)] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
        <div className="bg-[var(--panel-hover)] p-4 border-b border-[var(--panel-border)] flex justify-between items-center">
          <h3 className="text-[var(--text-main)] font-black text-base flex items-center gap-2"><span>🎨</span> 생텀 페이지 설정 ({activeAccount?.nickname})</h3>
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
                <button key={item.id} type="button" onClick={() => setTempTheme(item.id)} className={`p-3 rounded-xl border text-xs font-black transition flex flex-col items-center justify-center gap-2 cursor-pointer ${tempTheme === item.id ? 'bg-[var(--panel-hover)] border-[var(--accent)] text-[var(--accent)] shadow-lg scale-[1.02]' : 'bg-[var(--inner-box)] border-[var(--panel-border)] text-[var(--text-sub)] hover:text-[var(--text-main)]'}`}>
                  <span className="w-5 h-5 rounded-full flex items-center justify-center p-0.5 border shadow-inner" style={{ backgroundColor: item.bg, borderColor: item.accent }}><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.accent }}></span></span>
                  <span className="text-[0.65rem] tracking-wider">{item.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3 pt-3 border-t border-[var(--panel-border)]">
            <label className="text-xs font-bold text-[var(--accent)] uppercase tracking-wider block">나만의 커스텀 테마 슬롯</label>
            <div className="grid grid-cols-3 gap-2">
              {(["custom_1", "custom_2", "custom_3"] as const).map((cSlot, idx) => (
                <button key={cSlot} type="button" onClick={() => setTempTheme(cSlot)} className={`py-2 px-1 rounded-xl text-xs font-black border transition cursor-pointer ${tempTheme === cSlot ? 'bg-[var(--accent)] text-[var(--accent-fg)] border-[var(--accent)] shadow' : 'bg-[var(--inner-box)] border-[var(--panel-border)] text-[var(--text-sub)] hover:text-[var(--text-main)]'}`}>
                  Custom {idx + 1}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-[var(--panel-border)] space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => globalStickerInputRef.current?.click()} className="py-2.5 px-2 rounded-xl bg-[var(--accent)] text-[var(--accent-fg)] hover:opacity-90 text-[0.7rem] font-black shadow-md transition flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap">🏷️ 커스텀 스티커 추가</button>
              <button onClick={handleResetStickerPositions} className="py-2.5 px-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 text-[0.7rem] font-bold transition flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap" title="구석에 박힌 스티커 구출">🧹 스티커 위치 전체 리셋</button>
            </div>

            {stickers.length > 0 && (
              <div className="pt-3 border-t border-[var(--panel-border)] space-y-2">
                <label className="text-xs font-bold text-[var(--text-sub)] uppercase tracking-wider block">📌 현재 페이지 스티커 목록 ({stickers.length}개)</label>
                <div className="flex flex-col gap-2 max-h-48 overflow-y-auto custom-scrollbar p-1">
                  {stickers.slice().reverse().map((stk, displayIndex) => {
                    const realIndex = stickers.length - 1 - displayIndex;
                    const isLocked = stk.isLocked ?? false;
                    const isBehind = (stk.zIndex ?? 30) < 10;

                    return (
                      <div key={stk.id} className="flex items-center justify-between bg-[var(--inner-box)] p-2 rounded-xl border border-[var(--panel-border)] gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <img src={stk.url} alt="스티커" className="w-8 h-8 object-contain rounded bg-black/40 shrink-0" />
                          <div className="flex flex-col leading-none min-w-0">
                            <span className="text-[0.65rem] font-bold text-[var(--text-main)] truncate">스티커 #{realIndex + 1}</span>
                            <span className="text-[0.55rem] text-[var(--text-sub)] mt-0.5">{isLocked ? "📌 고정됨" : isBehind ? "⬇️ 카드 뒤" : "⬆️ 카드 앞"}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={() => { updateSticker(stk.id, 'isLocked', false); setSelectedStickerId(stk.id); setIsThemeModalOpen(false); }} className="px-2 py-1 rounded text-[0.6rem] font-bold bg-[var(--panel-hover)] text-amber-300 border border-[var(--panel-border)] hover:border-amber-400 cursor-pointer whitespace-nowrap">✏️ 편집</button>
                          <button onClick={() => updateSticker(stk.id, 'zIndex', isBehind ? 30 : 5)} className="px-2 py-1 rounded text-[0.6rem] font-bold bg-[var(--panel-hover)] text-[var(--accent)] border border-[var(--panel-border)] hover:border-[var(--accent)] cursor-pointer whitespace-nowrap">{isBehind ? '⬆️ 카드앞' : '⬇️ 카드뒤'}</button>
                          <button onClick={() => deleteSticker(stk.id)} className="px-1.5 py-1 rounded text-[0.6rem] font-bold bg-red-600/80 text-white hover:bg-red-600 cursor-pointer">🗑️</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-[var(--panel-hover)] p-3.5 md:p-4 border-t border-[var(--panel-border)] flex flex-col gap-2.5">
          <div className="flex items-center justify-between gap-2 w-full">
            <button onClick={() => { setIsThemeModalOpen(false); router.push('/customize'); }} className="px-3.5 py-2 rounded-xl bg-[var(--inner-box)] border border-[var(--panel-border)] text-[var(--text-main)] hover:border-[var(--accent)] text-xs font-black transition shadow flex items-center justify-center gap-1.5 cursor-pointer"><span>✨</span> 테마 스튜디오</button>
            <div className="flex items-center bg-[var(--inner-box)] border border-[var(--panel-border)] rounded-xl p-1 gap-1 shrink-0">
              <button onClick={() => setFontSizeLevel('small')} className={`px-2 py-1 rounded-lg text-xs font-bold cursor-pointer ${fontSizeLevel === 'small' ? 'bg-[var(--panel-hover)] text-[var(--text-main)]' : 'text-[var(--text-sub)]'}`}>A-</button>
              <button onClick={() => setFontSizeLevel('normal')} className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer ${fontSizeLevel === 'normal' ? 'bg-[var(--panel-hover)] text-[var(--text-main)]' : 'text-[var(--text-sub)]'}`}>A</button>
              <button onClick={() => setFontSizeLevel('large')} className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer ${fontSizeLevel === 'large' ? 'bg-[var(--panel-hover)] text-[var(--text-main)]' : 'text-[var(--text-sub)]'}`}>A+</button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 w-full pt-1.5 border-t border-[var(--panel-border)]/50">
            <button onClick={() => setIsThemeModalOpen(false)} className="px-4 py-2 rounded-lg bg-[var(--inner-box)] text-[var(--text-sub)] text-xs font-bold hover:text-[var(--text-main)] cursor-pointer">취소</button>
            <button onClick={handleSaveThemeSettings} className="px-5 py-2 rounded-lg bg-[var(--accent)] text-[var(--accent-fg)] text-xs font-black shadow hover:opacity-90 cursor-pointer">적용하기</button>
          </div>
        </div>
      </div>
    </div>
  );
}