"use client";

import React from "react";

export interface MarkIconProps {
  /** SVG 자산 경로 (예: /svgs/UI mark/사람 마크.svg) */
  src: string;
  /** UI 표시 형태: plain(순수 마크), badge(프레임 뱃지), glow(발광 뱃지) */
  variant?: "plain" | "badge" | "glow";
  /** 규격 크기: xs(16px), sm(20px), md(24px), lg(28px), xl(36px) */
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  /** 전역 테마 색상 클래스 (기본값: bg-[var(--accent)]) */
  colorClass?: string;
  /** 호출부 전용 커스텀 배율 오버라이드 (예: scale={3.3}) */
  scale?: number;
  /** 마크 요소 추가 클래스 */
  className?: string;
  /** badge/glow 모드 시 외각 박스 추가 클래스 */
  badgeClassName?: string;
}

// ──────────────── 전역 기본 안전 광학 배율 (Global Default Safe Scales) ────────────────
// 특정 UI의 극단적 배율로 인한 타 페이지 부작용을 방지하기 위한 표준 기본값
const BASE_OPTICAL_SCALES: Record<string, number> = {
  "사람 마크": 0.90,
  "레이드 마크": 1.10,
  "어비스 마크": 1.10,
  "달력 마크": 1.20,
  "전투력 마크": 1.10,
  "도감 마크": 1.20,
};

const SIZE_MAP = {
  xs: { box: "w-4 h-4 min-w-[16px] min-h-[16px]", icon: "w-3 h-3" },
  sm: { box: "w-5 h-5 min-w-[20px] min-h-[20px]", icon: "w-3.5 h-3.5" },
  md: { box: "w-6 h-6 min-w-[24px] min-h-[24px]", icon: "w-4 h-4" },
  lg: { box: "w-7 h-7 min-w-[28px] min-h-[28px]", icon: "w-5 h-5" },
  xl: { box: "w-9 h-9 min-w-[36px] min-h-[36px]", icon: "w-6 h-6" },
};

export function MarkIcon({
  src,
  variant = "plain",
  size = "md",
  colorClass = "bg-[var(--accent)]",
  scale,
  className = "",
  badgeClassName = "",
}: MarkIconProps) {
  // SVG 경로에서 파일명 추출하여 기본 배율 계산
  const fileName = decodeURI(src).split("/").pop()?.replace(".svg", "") || "";
  const matchedScaleKey = Object.keys(BASE_OPTICAL_SCALES).find((key) => fileName.includes(key));
  const defaultScale = matchedScaleKey ? BASE_OPTICAL_SCALES[matchedScaleKey] : 1.0;

  // scale prop이 직접 전달된 경우 우선 적용, 없을 경우 전역 기본 안전 배율 적용
  const finalScaleMultiplier = scale !== undefined ? scale : defaultScale;

  const sizeConfig = SIZE_MAP[size] || SIZE_MAP.md;

  const maskElement = (
    <span
      className={`inline-block ${sizeConfig.icon} ${colorClass} transition-transform duration-150 shrink-0 pointer-events-none`}
      style={{
        maskImage: `url("${encodeURI(src)}")`,
        WebkitMaskImage: `url("${encodeURI(src)}")`,
        maskSize: "contain",
        WebkitMaskSize: "contain",
        maskRepeat: "no-repeat",
        WebkitMaskRepeat: "no-repeat",
        maskPosition: "center",
        WebkitMaskPosition: "center",
        transform: `scale(${finalScaleMultiplier})`,
      }}
    />
  );

  if (variant === "badge") {
    return (
      <div
        className={`shrink-0 ${sizeConfig.box} rounded-lg bg-[var(--inner-box)] border border-[var(--panel-border)] flex items-center justify-center shadow-2xs ${badgeClassName}`}
      >
        {maskElement}
      </div>
    );
  }

  if (variant === "glow") {
    return (
      <div
        className={`shrink-0 ${sizeConfig.box} rounded-lg bg-[var(--inner-box)] border border-[var(--accent)]/50 flex items-center justify-center shadow-[0_0_8px_rgba(234,179,8,0.25)] ${badgeClassName}`}
      >
        {maskElement}
      </div>
    );
  }

  // plain 모드: 고정 규격(box) 컨테이너 내에서 광학 배율 적용
  return (
    <span className={`shrink-0 ${sizeConfig.box} flex items-center justify-center ${className}`}>
      {maskElement}
    </span>
  );
}

export default MarkIcon;