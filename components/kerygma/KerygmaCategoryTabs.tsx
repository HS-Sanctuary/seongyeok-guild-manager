"use client";

import Link from "next/link";
import { CATEGORIES } from "@/types/kerygma";

interface KerygmaCategoryTabsProps {
  activeCategory: string;
  onSelectCategory: (cat: string) => void;
  canWriteNotice?: boolean;
}

export default function KerygmaCategoryTabs({
  activeCategory,
  onSelectCategory,
  canWriteNotice = false,
}: KerygmaCategoryTabsProps) {
  const renderCategoryButton = (cat: string) => {
    const isSelected = activeCategory === cat;
    let activeClasses = "";
    let glowColor = "";

    if (cat === "전체") {
      activeClasses =
        "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-[0_4px_12px_rgba(16,185,129,0.3)]";
      glowColor = "rgba(16, 185, 129, 0.85)";
    } else if (cat.startsWith("길드")) {
      activeClasses =
        "bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-[0_4px_12px_rgba(245,158,11,0.3)]";
      glowColor = "rgba(245, 158, 11, 0.85)";
    } else if (cat.startsWith("생텀")) {
      activeClasses =
        "bg-purple-500/20 text-purple-300 border-purple-500/50 shadow-[0_4px_12px_rgba(168,85,247,0.3)]";
      glowColor = "rgba(168, 85, 247, 0.85)";
    } else if (cat === "모비노기 공식") {
      activeClasses =
        "bg-blue-500/20 text-blue-300 border-blue-500/50 shadow-[0_4px_12px_rgba(59,130,246,0.3)]";
      glowColor = "rgba(59, 130, 246, 0.85)";
    }

    return (
      <button
        key={cat}
        onClick={() => onSelectCategory(cat)}
        className={`relative px-3 py-1.5 rounded-lg text-[0.75rem] font-bold transition-all duration-300 border whitespace-nowrap shrink-0 cursor-pointer ${
          isSelected
            ? activeClasses
            : "bg-[var(--panel)] border-[var(--panel-border)] text-[var(--text-sub)] hover:text-[var(--text-main)] hover:bg-[var(--panel-hover)]"
        }`}
      >
        <span>{cat}</span>
        {isSelected && (
          <span
            className="absolute -bottom-1 left-2 right-2 h-[2.5px] rounded-full transition-all duration-300"
            style={{
              backgroundColor: glowColor,
              boxShadow: `0 0 10px ${glowColor}, 0 0 4px ${glowColor}`,
            }}
          />
        )}
      </button>
    );
  };

  return (
    <div className="p-3 rounded-xl bg-[var(--panel)] border border-[var(--panel-border)] shadow-sm flex items-center justify-between gap-3 overflow-hidden">
      <div className="flex items-center gap-2 text-[0.75rem] overflow-x-auto pb-1 sm:pb-0 custom-scrollbar flex-1 min-w-0">
        {renderCategoryButton("전체")}
        <span className="text-[var(--panel-border)] font-black select-none px-1 shrink-0">|</span>
        {renderCategoryButton("길드 공지사항")}
        {renderCategoryButton("길드 이벤트")}
        <span className="text-[var(--panel-border)] font-black select-none px-1 shrink-0">|</span>
        {renderCategoryButton("생텀 공지사항")}
        {renderCategoryButton("생텀 업데이트")}
        {renderCategoryButton("생텀 가이드")}
        <span className="text-[var(--panel-border)] font-black select-none px-1 shrink-0">|</span>
        {renderCategoryButton("모비노기 공식")}
      </div>

      {canWriteNotice && (
        <Link
          href="/kerygma/write"
          className="bg-[var(--accent)] hover:bg-[var(--accent-strong)] text-[var(--accent-fg)] text-[0.7rem] font-bold px-3 py-1.5 rounded-md transition shadow-sm flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ml-auto"
        >
          <span>✏️</span>
          <span>새 공지 작성</span>
        </Link>
      )}
    </div>
  );
}