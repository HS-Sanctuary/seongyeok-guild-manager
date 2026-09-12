"use client";

import React from "react";

interface ClassIconProps {
  job: string; // 예: '검술사', '화염술사'
  className?: string; // 예: 'w-6 h-6'
  rank?: number; // 1: 골드, 2: 실버, 3: 브론즈 (랭커 효과)
  size?: "xs" | "sm" | "md" | "lg" | "xl"; // 🎯 size 속성 추가 완료
}

const SIZE_MAP = {
  xs: "w-4 h-4 min-w-[16px] min-h-[16px]",
  sm: "w-5 h-5 min-w-[20px] min-h-[20px]",
  md: "w-6 h-6 min-w-[24px] min-h-[24px]",
  lg: "w-7 h-7 min-w-[28px] min-h-[28px]",
  xl: "w-9 h-9 min-w-[36px] min-h-[36px]",
};

export const ClassIcon: React.FC<ClassIconProps> = ({
  job,
  className = "",
  rank,
  size = "md",
}) => {
  // 랭커 1, 2, 3위에 따른 오라/발광 이펙트
  const getRankEffect = () => {
    if (rank === 1) {
      return "bg-amber-300 drop-shadow-[0_0_8px_rgba(252,211,77,0.9)] animate-pulse scale-110"; // 🥇 골드
    }
    if (rank === 2) {
      return "bg-slate-200 drop-shadow-[0_0_6px_rgba(226,232,240,0.8)] scale-105"; // 🥈 실버
    }
    if (rank === 3) {
      return "bg-amber-600 drop-shadow-[0_0_5px_rgba(217,119,6,0.7)]"; // 🥉 브론즈
    }
    return "bg-[var(--text-main)] hover:bg-[var(--accent)]"; // 일반 (전역 테마 반영)
  };

  const svgPath = `/svgs/classes/${job}.svg`;
  const sizeClass = SIZE_MAP[size] || SIZE_MAP.md;

  return (
    <div
      className={`inline-block shrink-0 transition-all duration-300 ${sizeClass} ${className} ${getRankEffect()}`}
      style={{
        maskImage: `url('${svgPath}')`,
        WebkitMaskImage: `url('${svgPath}')`,
        maskSize: "contain",
        WebkitMaskSize: "contain",
        maskRepeat: "no-repeat",
        WebkitMaskRepeat: "no-repeat",
        maskPosition: "center",
        WebkitMaskPosition: "center",
      }}
      title={job}
    />
  );
};

export default ClassIcon;