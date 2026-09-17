"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const CATEGORIES = [
  "전체",
  "길드 공지사항",
  "길드 이벤트",
  "생텀 공지사항",
  "생텀 업데이트",
  "생텀 가이드",
  "모비노기 공식",
];

interface KerygmaCategoryTabsProps {
  activeCategory: string;
  onSelectCategory: (category: string) => void;
  canWriteNotice: boolean;
}

export default function KerygmaCategoryTabs({
  activeCategory,
  onSelectCategory,
  canWriteNotice,
}: KerygmaCategoryTabsProps) {
  const router = useRouter();
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const getCategoryLabel = (cat: string) => {
    if (cat === "전체") return "공지 전체";
    return cat;
  };

  // 🎯 PC/데스크톱 전용 카테고리별 활성 네온 글로우 스타일링
  const getDesktopTabStyle = (cat: string, isActive: boolean) => {
    if (!isActive) {
      return "bg-[var(--inner-box)] text-[var(--text-sub)] border-[var(--panel-border)] hover:text-[var(--text-main)] hover:border-[var(--text-sub)]/50";
    }

    switch (cat) {
      case "전체":
        return "bg-emerald-950/40 text-emerald-400 border-emerald-500/80 shadow-[0_0_12px_rgba(16,185,129,0.25)] font-bold";
      case "생텀 가이드":
        return "bg-purple-950/40 text-purple-400 border-purple-500/80 shadow-[0_0_12px_rgba(168,85,247,0.25)] font-bold";
      case "모비노기 공식":
        return "bg-blue-950/40 text-blue-400 border-blue-500/80 shadow-[0_0_12px_rgba(59,130,246,0.25)] font-bold";
      case "생텀 업데이트":
        return "bg-teal-950/40 text-teal-400 border-teal-500/80 shadow-[0_0_12px_rgba(20,184,166,0.25)] font-bold";
      case "길드 이벤트":
      case "생텀 공지사항":
      case "길드 공지사항":
        return "bg-amber-950/40 text-amber-400 border-amber-500/80 shadow-[0_0_12px_rgba(245,158,11,0.25)] font-bold";
      default:
        return "bg-[var(--accent-soft)] text-[var(--accent)] border-[var(--accent)] shadow-[0_0_12px_var(--accent-soft)] font-bold";
    }
  };

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. PC/데스크톱 뷰 (sm:flex) - 이모지 제거 & 네온 글로우 탭 유지 */}
      {/* ========================================================================= */}
      <div className="hidden sm:flex w-full bg-[var(--panel)] border border-[var(--panel-border)] rounded-2xl p-2.5 sm:p-3 items-center justify-between gap-3 shadow-xs">
        {/* 카테고리 버튼 가로 탭 목록 */}
        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar py-0.5">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => onSelectCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-[12.5px] border transition-all cursor-pointer whitespace-nowrap active:scale-95 ${getDesktopTabStyle(
                  cat,
                  isActive
                )}`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* 우측 구분선 + 공지 작성 버튼 (관리자 전용) */}
        {canWriteNotice && (
          <div className="flex items-center gap-3 shrink-0 border-l border-[var(--panel-border)] pl-3">
            <button
              onClick={() => router.push("/kerygma/write")}
              className="px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent-strong)] text-[var(--accent-fg)] text-xs font-extrabold rounded-xl transition shadow-xs flex items-center cursor-pointer active:scale-95 whitespace-nowrap"
            >
              새 공지 작성
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. 모바일 뷰 (sm:hidden) - 이모지 제거 3-버튼 모바일 전용 컴팩트 바 */}
      {/* ========================================================================= */}
      <div className="flex sm:hidden w-full bg-[var(--panel)] border border-[var(--panel-border)] rounded-2xl p-2 items-center justify-between gap-2 shadow-xs">
        {/* 좌측: 현재 선택 카테고리 뱃지 & 변경 버튼 */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {/* 현재 선택된 카테고리 표시 */}
          <div className="px-3 py-1.5 rounded-xl bg-[var(--accent-soft)] border border-[var(--accent)]/40 text-[var(--accent)] text-xs font-extrabold truncate flex items-center shrink-0 shadow-xs">
            <span className="truncate">{getCategoryLabel(activeCategory)}</span>
          </div>

          {/* 변경 버튼 */}
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-[var(--inner-box)] border border-[var(--panel-border)] hover:border-[var(--accent)] text-[var(--text-main)] hover:text-[var(--accent)] text-xs font-bold transition flex items-center shrink-0 cursor-pointer active:scale-95"
          >
            변경
          </button>
        </div>

        {/* 우측: 작성 버튼 (관리자 전용) */}
        {canWriteNotice && (
          <button
            onClick={() => router.push("/kerygma/write")}
            className="px-3.5 py-1.5 bg-[var(--accent)] hover:bg-[var(--accent-strong)] text-[var(--accent-fg)] text-xs font-extrabold rounded-xl transition shadow-xs flex items-center shrink-0 cursor-pointer active:scale-95 whitespace-nowrap"
          >
            작성
          </button>
        )}
      </div>

      {/* 📂 모바일 전용 카테고리 선택 바텀시트 모달 */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
          <div className="bg-[var(--panel)] border-t sm:border border-[var(--panel-border)] rounded-t-2xl sm:rounded-2xl p-5 w-full max-w-sm shadow-2xl space-y-4 border-amber-500/30">
            <div className="flex items-center justify-between border-b border-[var(--panel-border)] pb-3">
              <h3 className="text-sm sm:text-base font-bold text-[var(--text-main)]">
                공지 카테고리 선택
              </h3>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="text-[var(--text-sub)] hover:text-[var(--text-main)] text-xs font-bold cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2 max-h-[60vh] overflow-y-auto custom-scrollbar pr-1">
              {CATEGORIES.map((cat) => {
                const isSelected = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => {
                      onSelectCategory(cat);
                      setIsCategoryModalOpen(false);
                    }}
                    className={`w-full px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? "bg-[var(--accent)] text-[var(--accent-fg)] shadow-sm font-extrabold"
                        : "bg-[var(--inner-box)] border border-[var(--panel-border)] text-[var(--text-main)] hover:border-[var(--accent)]"
                    }`}
                  >
                    <span>{getCategoryLabel(cat)}</span>
                    {isSelected && <span>✓</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}