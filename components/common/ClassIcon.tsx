"use client";

import React, { useState, useEffect } from "react";

export interface ClassIconProps {
  /** 직업 명칭 (예: '검술사', '화염술사', '크로노스') */
  job: string;
  /** 호출부 전용 추가 Tailwind 클래스 */
  className?: string;
  /** 랭커 순위 (1: 골드 오라, 2: 실버 오라, 3: 브론즈 오라) */
  rank?: number;
  /** 크라토스 순위 호환 프롭 (rank와 동일하게 작동) */
  kratosClassRank?: number;
  /** 규격 크기: xs(16px), sm(20px), md(24px), lg(28px), xl(36px) */
  size?: "xs" | "sm" | "md" | "lg" | "xl";
}

const SIZE_MAP = {
  xs: "w-4 h-4 min-w-[16px] min-h-[16px] text-[10px]",
  sm: "w-5 h-5 min-w-[20px] min-h-[20px] text-[11px]",
  md: "w-6 h-6 min-w-[24px] min-h-[24px] text-[12px]",
  lg: "w-7 h-7 min-w-[28px] min-h-[28px] text-[13px]",
  xl: "w-9 h-9 min-w-[36px] min-h-[36px] text-[15px]",
};

export const ClassIcon: React.FC<ClassIconProps> = ({
  job,
  className = "",
  rank,
  kratosClassRank,
  size = "md",
}) => {
  const activeRank = rank ?? kratosClassRank ?? 0;
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const cleanJobName = (job || "전사").trim();
  const svgPath = `/svgs/classes/${encodeURIComponent(cleanJobName)}.svg`;
  const sizeClass = SIZE_MAP[size] || SIZE_MAP.md;

  // 🛡️ SVG 이미지 존재 여부 사전 테스트 (신규 클래스 에셋 누락 방어)
  useEffect(() => {
    if (!cleanJobName) {
      setHasError(true);
      return;
    }

    let isMounted = true;
    const img = new Image();
    img.src = svgPath;

    img.onload = () => {
      if (isMounted) {
        setHasError(false);
        setIsLoaded(true);
      }
    };

    img.onerror = () => {
      if (isMounted) {
        setHasError(true);
        setIsLoaded(true);
      }
    };

    return () => {
      isMounted = false;
    };
  }, [cleanJobName, svgPath]);

  // 🥇 1위 / 🥈 2위 / 🥉 3위 직업 랭커에 따른 오라 및 빛남 이펙트
  const getRankEffect = () => {
    if (activeRank === 1) {
      return "bg-amber-300 drop-shadow-[0_0_8px_rgba(252,211,77,0.9)] animate-pulse scale-110 z-10";
    }
    if (activeRank === 2) {
      return "bg-slate-200 drop-shadow-[0_0_6px_rgba(226,232,240,0.8)] scale-105 z-10";
    }
    if (activeRank === 3) {
      return "bg-amber-600 drop-shadow-[0_0_5px_rgba(217,119,6,0.7)] z-10";
    }
    // 일반 상태: 전역 CSS 테마 변수(AUREUM, LUMEN 등)에 따라 다크에선 밝게, 라이트에선 어둡게 자동 반전
    return "bg-[var(--text-main,#d4d4d8)] hover:bg-[var(--accent,#e6c788)]";
  };

  const titleText = activeRank > 0 && activeRank <= 3 ? `🔥 크라토스 ${cleanJobName} ${activeRank}위` : cleanJobName;

  // 🚨 SVG 파일이 아직 등록되지 않은 신규 클래스 Fallback 렌더러
  if (hasError) {
    const firstChar = cleanJobName.charAt(0) || "⚔️";
    const rankBorder =
      activeRank === 1
        ? "border-amber-300 text-amber-300 shadow-[0_0_8px_rgba(252,211,77,0.8)]"
        : activeRank === 2
        ? "border-slate-200 text-slate-200 shadow-[0_0_6px_rgba(226,232,240,0.7)]"
        : activeRank === 3
        ? "border-amber-600 text-amber-500 shadow-[0_0_5px_rgba(217,119,6,0.6)]"
        : "border-[var(--panel-border,rgba(255,255,255,0.2))] text-[var(--accent,#e6c788)] bg-[var(--inner-box,#252528)]/80";

    return (
      <div
        className={`inline-flex items-center justify-center rounded-lg border font-black shrink-0 transition-all duration-300 ${sizeClass} ${rankBorder} ${className}`}
        title={titleText}
      >
        <span>{firstChar}</span>
      </div>
    );
  }

  return (
    <div
      className={`inline-block shrink-0 transition-all duration-300 ${sizeClass} ${className} ${getRankEffect()}`}
      style={{
        maskImage: `url("${svgPath}")`,
        WebkitMaskImage: `url("${svgPath}")`,
        maskSize: "contain",
        WebkitMaskSize: "contain",
        maskRepeat: "no-repeat",
        WebkitMaskRepeat: "no-repeat",
        maskPosition: "center",
        WebkitMaskPosition: "center",
      }}
      title={titleText}
    />
  );
};

export default ClassIcon;