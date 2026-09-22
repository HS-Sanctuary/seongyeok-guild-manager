"use client";

interface SpiritWingsMenuProps {
  isOpen: boolean;
  menuRef: React.RefObject<HTMLDivElement | null>;
  setIsOpen: (value: boolean) => void;
}

const quickLinks = [
  { label: "공식 홈페이지", domain: "mabinogimobile.nexon.com", href: "https://mabinogimobile.nexon.com/Main" },
  { label: "모비라이프", domain: "mabimobi.life", href: "https://mabimobi.life/" },
  { label: "모비 채널", domain: "arca.live", href: "https://arca.live/b/mabimobile" },
  { label: "에반 갤러리", domain: "gall.dcinside.com", href: "https://gall.dcinside.com/mgallery/board/lists/?id=enban" },
];

export default function SpiritWingsMenu({ isOpen, menuRef, setIsOpen }: SpiritWingsMenuProps) {
  return (
    <div className="relative shrink-0" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl border transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm text-base sm:text-lg select-none cursor-pointer ${
          isOpen
            ? "bg-[var(--accent)]/15 border-[var(--accent)] text-[var(--accent)]"
            : "bg-[var(--inner-box)] border-[var(--panel-border)] hover:border-[var(--accent)]"
        }`}
        title="정령의 날개 · 빠른 이동"
        aria-label="정령의 날개 빠른 이동 열기"
        aria-expanded={isOpen}
      >
        🪽
      </button>

      {isOpen && (
        <div className="fixed sm:absolute top-16 sm:top-full right-3 sm:right-0 left-3 sm:left-auto mt-2 sm:w-[17rem] max-w-[calc(100vw-24px)] rounded-2xl border border-[var(--accent)]/50 bg-[var(--panel)] p-1 shadow-2xl z-[130] animate-in fade-in slide-in-from-top-2">
          <div className="overflow-hidden rounded-xl border border-[var(--panel-border)]">
            <div className="flex items-start justify-between gap-3 px-3 py-3 border-b border-[var(--panel-border)] bg-[var(--inner-box)]">
              <div>
                <h3 className="font-black text-[0.9rem] tracking-tight text-[var(--accent)]">정령의 날개</h3>
                <p className="mt-0.5 text-[0.62rem] font-medium text-[var(--text-sub)]">성역 밖의 길을 빠르게 여는 바로가기</p>
              </div>
              <span className="text-xl leading-none" aria-hidden="true">🪽</span>
            </div>
            <div className="p-2 space-y-1 bg-[var(--panel)]">
              {quickLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between gap-2 rounded-lg border border-transparent px-2.5 py-2 text-[0.72rem] font-bold text-[var(--text-main)] transition hover:border-[var(--accent)]/40 hover:bg-[var(--accent)]/10"
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <img src={`https://www.google.com/s2/favicons?domain=${link.domain}&sz=32`} alt="" className="w-4 h-4 rounded-sm shrink-0" />
                    <span className="truncate">{link.label}</span>
                  </span>
                  <span className="text-[var(--accent)] shrink-0">↗</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
