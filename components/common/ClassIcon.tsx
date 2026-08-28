"use client";

import React from "react";

interface ClassIconProps {
  job: string; // 예: '검술사', '화염술사'
  className?: string; // 예: 'w-6 h-6'
  rank?: number; // 1: 골드, 2: 실버, 3: 브론즈 (랭커 효과)
}

export const ClassIcon: React.FC<ClassIconProps> = ({
  job,
  className = "w-6 h-6",
  rank,
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

  return (
    <div
      className={`inline-block shrink-0 transition-all duration-300 ${className} ${getRankEffect()}`}
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