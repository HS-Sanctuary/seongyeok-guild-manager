"use client";

import { Sticker } from '../../types/layout';

interface StickerCanvasProps {
  layer: 'back' | 'front';
  stickers: Sticker[];
  selectedStickerId: string | null;
  setSelectedStickerId: (id: string | null) => void;
  handleStartMoveSticker: (stkId: string, e: React.PointerEvent) => void;
  updateSticker: (id: string, key: keyof Sticker, val: any) => void;
  deleteSticker: (id: string) => void;
  setConfigStickerId: (id: string | null) => void;
  activeStickerTab: 'scale' | 'rotation' | 'opacity' | 'layer';
  setActiveStickerTab: (val: 'scale' | 'rotation' | 'opacity' | 'layer') => void;
}

export default function StickerCanvas({
  layer,
  stickers,
  selectedStickerId,
  setSelectedStickerId,
  handleStartMoveSticker,
  updateSticker,
  deleteSticker,
  setConfigStickerId,
  activeStickerTab,
  setActiveStickerTab
}: StickerCanvasProps) {
  const filteredStickers = stickers.filter(s => {
    const isBehind = (s.zIndex ?? 30) < 10;
    return layer === 'back' ? isBehind : !isBehind;
  });

  const renderStickerItem = (stk: Sticker, arrayIndex: number) => {
    const isSelected = selectedStickerId === stk.id;
    const isLocked = stk.isLocked ?? false;
    const isBehind = (stk.zIndex ?? 30) < 10;

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
        onClick={(e) => { 
          if (isLocked) return;
          e.stopPropagation(); 
          setSelectedStickerId(stk.id); 
        }}
        onPointerDown={(e) => {
          if (isLocked) return;
          handleStartMoveSticker(stk.id, e);
        }}
        className={`sticker-item absolute flex flex-col items-center select-none touch-none transition-all ${
          isLocked ? 'pointer-events-none' : 'pointer-events-auto cursor-grab active:cursor-grabbing'
        } ${
          isSelected && !isLocked ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-black/50 rounded-xl p-1 bg-amber-400/10' : ''
        }`}
        style={{
          left: `${stk.x}%`,
          top: `${stk.y}%`,
          zIndex: isSelected ? 999 : arrayIndex + 1
        }}
      >
        {isSelected && !isLocked && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                updateSticker(stk.id, 'zIndex', isBehind ? 30 : 5);
              }}
              className="absolute -top-3 -left-3 w-7 h-7 rounded-full bg-black/90 border-2 border-amber-400 text-white text-[0.65rem] font-black flex items-center justify-center shadow-xl cursor-pointer hover:scale-110 active:scale-95 transition z-[1000]"
              title={isBehind ? "현재: 카드 뒤 설정 (클릭 시 카드 앞으로)" : "현재: 카드 앞 설정 (클릭 시 카드 뒤로)"}
            >
              {isBehind ? '⬇️' : '⬆️'}
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteSticker(stk.id);
              }}
              className="absolute -top-3 -right-3 w-7 h-7 rounded-full bg-red-600 border-2 border-white text-white text-xs font-black flex items-center justify-center shadow-xl cursor-pointer hover:scale-110 active:scale-95 transition z-[1000]"
              title="스티커 삭제"
            >
              ✕
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setConfigStickerId(stk.id);
              }}
              className="absolute -bottom-3 -right-3 w-7 h-7 rounded-full bg-zinc-900 border-2 border-amber-400 text-amber-300 text-xs font-black flex items-center justify-center shadow-xl cursor-pointer hover:scale-110 active:scale-95 transition z-[1000]"
              title="상세 설정"
            >
              ⚙️
            </button>
          </>
        )}

        <div style={{ transform: `scale(${stk.scale}) rotate(${stk.rotation}deg)`, transition: 'transform 0.05s ease-out' }}>
          <img src={stk.url} alt="스티커" style={{ opacity: stk.opacity }} className={`max-w-[140px] max-h-[140px] object-contain pointer-events-none ${frameClasses}`} />
        </div>
      </div>
    );
  };

  const selectedStk = stickers.find(s => s.id === selectedStickerId);

  return (
    <div className={`absolute inset-0 pointer-events-none w-full h-full overflow-hidden ${layer === 'back' ? 'z-0' : 'z-[20]'}`}>
      {filteredStickers.map((stk, idx) => renderStickerItem(stk, idx))}

      {/* 선택된 스티커 컨트롤 툴바 (Front 레이어에서만 렌더링) */}
      {layer === 'front' && selectedStk && !selectedStk.isLocked && (() => {
        const isBehind = (selectedStk.zIndex ?? 30) < 10;

        return (
          <div
            key={`toolbar_${selectedStk.id}`}
            className="sticker-toolbar absolute pointer-events-auto flex flex-col items-center select-none touch-none z-[950]"
            style={{ left: `${selectedStk.x}%`, top: `${selectedStk.y}%` }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-[120px] h-[120px] pointer-events-none" />
            
            <div 
              className="mt-3 flex flex-col gap-1.5 bg-black/95 backdrop-blur-md border-2 border-amber-400 rounded-xl p-2.5 shadow-2xl pointer-events-auto min-w-[280px] text-white text-xs font-bold cursor-grab active:cursor-grabbing"
              onPointerDown={(e) => {
                const targetTag = (e.target as HTMLElement).tagName;
                if (targetTag === 'INPUT' || targetTag === 'BUTTON') {
                  e.stopPropagation();
                  return;
                }
                handleStartMoveSticker(selectedStk.id, e);
              }}
            >
              <div className="w-full flex items-center justify-between pb-1.5 border-b border-zinc-800 text-[0.65rem] text-zinc-400 select-none">
                <span className="flex items-center gap-1 font-bold text-amber-300">✋ 드래그하여 이동</span>
                <button
                  onClick={() => {
                    updateSticker(selectedStk.id, 'isLocked', true);
                    setSelectedStickerId(null);
                  }}
                  className="px-2.5 py-1 rounded bg-amber-400 text-black font-black text-[0.65rem] hover:bg-amber-300 transition cursor-pointer flex items-center gap-1 shrink-0 whitespace-nowrap shadow"
                >
                  📌 위치 고정하기
                </button>
              </div>

              {isBehind && (
                <div className="text-[0.6rem] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded text-center font-bold whitespace-nowrap">
                  💡 카드 뒤 설정됨
                </div>
              )}

              <div className="flex items-center justify-between gap-1 bg-zinc-900/90 rounded-lg p-1 border border-zinc-700 whitespace-nowrap">
                <button onClick={() => setActiveStickerTab('scale')} className={`px-2 py-1 rounded text-[0.65rem] ${activeStickerTab === 'scale' ? 'bg-amber-400 text-black font-black' : 'text-zinc-400'}`}>🔍 크기</button>
                <button onClick={() => setActiveStickerTab('rotation')} className={`px-2 py-1 rounded text-[0.65rem] ${activeStickerTab === 'rotation' ? 'bg-amber-400 text-black font-black' : 'text-zinc-400'}`}>🔄 회전</button>
                <button onClick={() => setActiveStickerTab('opacity')} className={`px-2 py-1 rounded text-[0.65rem] ${activeStickerTab === 'opacity' ? 'bg-amber-400 text-black font-black' : 'text-zinc-400'}`}>👁️ 투명</button>
                <button onClick={() => setActiveStickerTab('layer')} className={`px-2 py-1 rounded text-[0.65rem] ${activeStickerTab === 'layer' ? 'bg-amber-400 text-black font-black' : 'text-zinc-400'}`}>🥞 순서</button>
                <button onClick={() => setConfigStickerId(selectedStk.id)} className="px-2 py-1 rounded bg-zinc-800 text-amber-300 text-[0.65rem] font-bold">⚙️</button>
              </div>

              <div className="px-1 py-0.5">
                {activeStickerTab === 'scale' && (
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateSticker(selectedStk.id, 'scale', Math.max(0.2, selectedStk.scale - 0.1))} className="px-2 py-0.5 bg-zinc-800 rounded font-black text-amber-300">-</button>
                    <input type="range" min="0.2" max="3.0" step="0.05" value={selectedStk.scale} onChange={(e) => updateSticker(selectedStk.id, 'scale', parseFloat(e.target.value))} className="w-full h-1.5 accent-amber-400" />
                    <button onClick={() => updateSticker(selectedStk.id, 'scale', Math.min(3.0, selectedStk.scale + 0.1))} className="px-2 py-0.5 bg-zinc-800 rounded font-black text-amber-300">+</button>
                    <span className="text-[0.6rem] text-amber-300 shrink-0 w-7 text-right">{Math.round(selectedStk.scale * 100)}%</span>
                  </div>
                )}

                {activeStickerTab === 'rotation' && (
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateSticker(selectedStk.id, 'rotation', (selectedStk.rotation - 15 + 360) % 360)} className="px-1.5 py-0.5 bg-zinc-800 rounded text-amber-300">-15°</button>
                    <input type="range" min="0" max="360" step="1" value={selectedStk.rotation} onChange={(e) => updateSticker(selectedStk.id, 'rotation', parseInt(e.target.value))} className="w-full h-1.5 accent-amber-400" />
                    <button onClick={() => updateSticker(selectedStk.id, 'rotation', (selectedStk.rotation + 15) % 360)} className="px-1.5 py-0.5 bg-zinc-800 rounded text-amber-300">+15°</button>
                    <span className="text-[0.6rem] text-amber-300 shrink-0 w-7 text-right">{selectedStk.rotation}°</span>
                  </div>
                )}

                {activeStickerTab === 'opacity' && (
                  <div className="flex items-center gap-2">
                    <input type="range" min="0.1" max="1.0" step="0.05" value={selectedStk.opacity} onChange={(e) => updateSticker(selectedStk.id, 'opacity', parseFloat(e.target.value))} className="w-full h-1.5 accent-amber-400" />
                    <span className="text-[0.6rem] text-amber-300 shrink-0 w-8 text-right">{Math.round(selectedStk.opacity * 100)}%</span>
                  </div>
                )}

                {activeStickerTab === 'layer' && (
                  <div className="grid grid-cols-2 gap-1.5">
                    <button onClick={() => updateSticker(selectedStk.id, 'zIndex', 30)} className={`py-1 px-2 rounded text-[0.65rem] border ${ (selectedStk.zIndex ?? 30) >= 10 ? 'bg-amber-400 text-black font-black' : 'bg-zinc-800 text-zinc-300' }`}>⬆️ 카드 앞으로</button>
                    <button onClick={() => updateSticker(selectedStk.id, 'zIndex', 5)} className={`py-1 px-2 rounded text-[0.65rem] border ${ (selectedStk.zIndex ?? 30) < 10 ? 'bg-amber-400 text-black font-black' : 'bg-zinc-800 text-zinc-300' }`}>⬇️ 카드 뒤로</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}