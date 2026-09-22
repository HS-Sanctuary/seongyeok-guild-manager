"use client";

import Link from 'next/link';
import { NavItem } from '../../types/layout';

interface MobileBottomSheetProps {
  fabPosition: { x: number };
  handlePointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
  handleMenuClick: (e: React.MouseEvent) => void;
  isFabOpen: boolean;
  setIsFabOpen: (val: boolean) => void;
  isDraggingSheet: boolean;
  sheetDragY: number;
  handleSheetDragStart: (e: React.PointerEvent) => void;
  setIsThemeModalOpen: (val: boolean) => void;
  navItems: NavItem[];
  pathname: string;
}

export default function MobileBottomSheet({
  fabPosition,
  handlePointerDown,
  handleMenuClick,
  isFabOpen,
  setIsFabOpen,
  isDraggingSheet,
  sheetDragY,
  handleSheetDragStart,
  setIsThemeModalOpen,
  navItems,
  pathname
}: MobileBottomSheetProps) {
  return (
    <>
      {/* 이동 가능한 성역 메뉴 호출 버튼 */}
      <div
        className="xl:hidden fixed bottom-5 z-[10000] flex items-center cursor-grab active:cursor-grabbing select-none touch-none"
        style={{ right: `${fabPosition.x}px` }}
        onPointerDown={handlePointerDown}
      >
        <button
          type="button"
          onClick={handleMenuClick}
          className="relative isolate w-[4.75rem] h-[2.7rem] flex items-center justify-center cursor-pointer"
          title="성역 메뉴 열기"
          aria-label={isFabOpen ? '성역 메뉴 닫기' : '성역 메뉴 열기'}
          aria-expanded={isFabOpen}
        >
          <span
            aria-hidden="true"
            className="absolute -inset-2 -z-10 rounded-full opacity-[0.14] blur-[0.5px] animate-[spin_18s_linear_infinite]"
            style={{
              background: 'repeating-conic-gradient(from 4deg at 50% 50%, transparent 0deg 10deg, var(--text-main) 10.4deg 11.15deg, transparent 11.7deg 24deg)',
              maskImage: 'radial-gradient(circle at center, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.75) 22%, rgba(0,0,0,0.18) 58%, transparent 76%)',
              WebkitMaskImage: 'radial-gradient(circle at center, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.75) 22%, rgba(0,0,0,0.18) 58%, transparent 76%)',
            }}
          />
          <span
            aria-hidden="true"
            className="absolute -inset-1 -z-10 rounded-full opacity-[0.1] blur-[2px] animate-[pulse_4s_ease-in-out_infinite]"
            style={{
              background: 'radial-gradient(circle at center, var(--text-main) 0%, color-mix(in srgb, var(--text-main) 45%, transparent) 13%, transparent 60%)',
            }}
          />
          <span
            aria-hidden="true"
            className="absolute h-8 w-14 bg-[var(--accent)] opacity-20 blur-md animate-[pulse_3s_ease-in-out_infinite]"
            style={{
              maskImage: "url('/svgs/logo/생텀타이포로고.svg')",
              WebkitMaskImage: "url('/svgs/logo/생텀타이포로고.svg')",
              maskRepeat: 'no-repeat',
              WebkitMaskRepeat: 'no-repeat',
              maskPosition: 'center',
              WebkitMaskPosition: 'center',
              maskSize: 'contain',
              WebkitMaskSize: 'contain',
            }}
          />
          <span
            className="relative h-8 w-14 bg-[var(--accent)] drop-shadow-[0_0_4px_var(--accent)] transition-transform duration-300 hover:scale-105"
            style={{
              maskImage: "url('/svgs/logo/생텀타이포로고.svg')",
              WebkitMaskImage: "url('/svgs/logo/생텀타이포로고.svg')",
              maskRepeat: 'no-repeat',
              WebkitMaskRepeat: 'no-repeat',
              maskPosition: 'center',
              WebkitMaskPosition: 'center',
              maskSize: 'contain',
              WebkitMaskSize: 'contain',
            }}
          />
        </button>
      </div>

      {/* 🚀 바텀시트 백드롭 (Dimmed Overlay) */}
      <div 
        onClick={() => setIsFabOpen(false)}
        className={`xl:hidden fixed inset-0 z-[9998] bg-black/60 backdrop-blur-xs transition-opacity duration-300 ${
          isFabOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* 모바일 뷰 바텀 메뉴 */}
      <div
        className={`fixed inset-x-5 sm:inset-x-8 bottom-0 z-[9999] xl:hidden max-w-[56rem] mx-auto border-2 border-b-0 rounded-t-[28px] p-4 shadow-2xl flex flex-col bg-[var(--panel)] text-[var(--text-main)] border-[var(--accent)] ${
          isDraggingSheet ? '' : 'transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]'
        }`}
        style={{ transform: isFabOpen ? `translateY(${sheetDragY}px)` : 'translateY(calc(100% + 1rem))' }}
      >
        <div onPointerDown={handleSheetDragStart} className="w-full py-2.5 flex items-center justify-center cursor-grab active:cursor-grabbing touch-none select-none" title="아래로 쓸어내려 닫기">
          <div className="w-12 h-1.5 bg-[var(--text-sub)] rounded-full opacity-60 hover:opacity-100 transition-opacity" />
        </div>

        <div className="overflow-y-auto custom-scrollbar flex flex-col gap-3 pb-12 max-h-[80vh]">
          <div className="border-b border-[var(--panel-border)] pb-2 mb-1">
            <button onClick={() => { setIsFabOpen(false); setIsThemeModalOpen(true); }} className="w-full py-2.5 px-3 rounded-xl bg-[var(--inner-box)] border border-[var(--panel-border)] hover:border-[var(--accent)] text-xs font-bold text-[var(--text-main)] flex items-center justify-center gap-1.5 cursor-pointer shadow-sm">
              <span>🎨</span> 생텀 페이지 설정
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {navItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <Link 
                  key={item.en} 
                  href={item.path} 
                  onClick={() => setIsFabOpen(false)} 
                  className={`relative overflow-hidden flex flex-col justify-center px-4 py-3.5 rounded-xl border transition-all group ${
                    isActive ? 'bg-[var(--panel-hover)] border-l-[3px] border-l-[var(--accent)] shadow-sm' : 'bg-[var(--inner-box)] border-[var(--panel-border)] hover:border-[var(--accent)]/50'
                  }`}
                >
                  <span className="absolute right-2 -bottom-1 text-[1.3rem] sm:text-[1.5rem] font-black italic tracking-tighter opacity-15 select-none pointer-events-none text-[var(--accent)] group-hover:opacity-25 transition-opacity">
                    {item.en}
                  </span>

                  <span className="relative z-10 font-black text-[0.75rem] tracking-wide leading-tight whitespace-nowrap text-[var(--accent)]">
                    {item.kr}
                  </span>
                  <span className="relative z-10 text-[0.55rem] font-bold mt-1 whitespace-nowrap text-[var(--text-sub)]">
                    {item.sub}
                  </span>
                </Link>
              );
            })}
            <Link
              href="/"
              onClick={() => setIsFabOpen(false)}
              className={`relative overflow-hidden flex flex-col justify-center px-4 py-3.5 rounded-xl border transition-all group ${
                pathname === '/'
                  ? 'bg-[var(--panel-hover)] border-l-[3px] border-l-[var(--accent)] shadow-sm'
                  : 'bg-[var(--inner-box)] border-[var(--panel-border)] hover:border-[var(--accent)]/50'
              }`}
            >
              <span className="absolute right-2 -bottom-1 text-[1.3rem] sm:text-[1.5rem] font-black italic tracking-tighter opacity-15 select-none pointer-events-none text-[var(--accent)] group-hover:opacity-25 transition-opacity">
                SANCTUM
              </span>
              <span className="relative z-10 font-black text-[0.75rem] tracking-wide leading-tight whitespace-nowrap text-[var(--accent)]">생텀</span>
              <span className="relative z-10 text-[0.55rem] font-bold mt-1 whitespace-nowrap text-[var(--text-sub)]">홈으로 이동</span>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
