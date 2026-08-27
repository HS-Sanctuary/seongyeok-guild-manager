"use client";

import Link from 'next/link';
import { NavItem } from '../../types/layout';

interface MobileBottomSheetProps {
  fabPosition: { x: number };
  handlePointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
  handleHomeClick: () => void;
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
  handleHomeClick,
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
      {/* FAB 버튼 */}
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

      {/* 🚀 바텀시트 백드롭 (Dimmed Overlay) */}
      <div 
        onClick={() => setIsFabOpen(false)}
        className={`lg:hidden fixed inset-0 z-[9998] bg-black/60 backdrop-blur-xs transition-opacity duration-300 ${
          isFabOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* 모바일 뷰 바텀 메뉴 */}
      <div
        className={`fixed inset-x-0 bottom-0 z-[9999] lg:hidden border-t-2 rounded-t-[28px] p-4 shadow-2xl flex flex-col bg-[var(--panel)] text-[var(--text-main)] border-[var(--accent)] ${
          isDraggingSheet ? '' : 'transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]'
        }`}
        style={{ transform: isFabOpen ? `translateY(${sheetDragY}px)` : 'translateY(100%)' }}
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
          </div>
        </div>
      </div>
    </>
  );
}