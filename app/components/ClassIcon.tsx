"use client";

interface ClassIconProps {
  job: string;
  /** 크라토스(전투력) 기준 해당 직업 내 순위 (1, 2, 3위만 이펙트 적용, 없거나 4위 이상은 일반) */
  kratosClassRank?: number; 
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function ClassIcon({ 
  job, 
  kratosClassRank = 0, 
  size = "md",
  className = "" 
}: ClassIconProps) {

  // 크기 조절
  const sizeMap = {
    sm: "w-6 h-6",
    md: "w-7 h-7 sm:w-8 sm:h-8",
    lg: "w-9 h-9 sm:w-10 sm:h-10"
  };

  const currentSize = sizeMap[size];

  // 4위 이하/기본 상태: 짙은 다크 배경 + 시인성 100% 화이트 SVG
  let wrapperClass = `relative flex items-center justify-center shrink-0 rounded-full ${currentSize} ${className}`;
  let innerClass = "relative flex items-center justify-center w-full h-full rounded-full border border-zinc-700 bg-zinc-800 shadow-xs z-10";
  let iconClass = "w-[60%] h-[60%] object-contain brightness-0 invert opacity-90";
  let vfxLayer = null;

  // 🔥 크라토스 직업 1~3위 전용 붉은 이펙트
  if (kratosClassRank === 1) {
    // 🥇 직업 1위: 타오르는 붉은 신화 아우라 (회전 오라 + 핏빛 글로우)
    wrapperClass += " z-20";
    innerClass = "relative flex items-center justify-center w-full h-full rounded-full border-[1.5px] border-rose-300 bg-gradient-to-br from-red-600 via-rose-700 to-zinc-900 shadow-[inset_0_0_8px_rgba(0,0,0,0.6)] z-10";
    iconClass = "w-[65%] h-[65%] object-contain brightness-0 invert drop-shadow-[0_0_4px_rgba(255,255,255,0.9)]";
    vfxLayer = (
      <>
        {/* 불꽃처럼 회전하는 붉은 오라 */}
        <div className="absolute -inset-[3px] bg-gradient-to-tr from-red-600 via-rose-500 to-amber-500 rounded-full animate-spin blur-[3px] opacity-90" style={{ animationDuration: '2.5s' }}></div>
        {/* 맥박 치는 붉은 아우라 */}
        <div className="absolute -inset-1.5 bg-rose-600 rounded-full animate-pulse blur-md opacity-60"></div>
      </>
    );
  } else if (kratosClassRank === 2) {
    // 🥈 직업 2위: 진홍빛 전설 오라
    wrapperClass += " z-10";
    innerClass = "relative flex items-center justify-center w-full h-full rounded-full border-[1.5px] border-rose-400 bg-gradient-to-br from-rose-800 via-rose-900 to-zinc-900 shadow-[inset_0_0_6px_rgba(0,0,0,0.5)] z-10";
    iconClass = "w-[60%] h-[60%] object-contain brightness-0 invert drop-shadow-[0_0_3px_rgba(255,255,255,0.8)]";
    vfxLayer = (
      <div className="absolute -inset-1 bg-gradient-to-tr from-rose-600 to-red-800 rounded-full animate-pulse blur-[2px] opacity-75"></div>
    );
  } else if (kratosClassRank === 3) {
    // 🥉 직업 3위: 루비빛 영웅 글로우
    innerClass = "relative flex items-center justify-center w-full h-full rounded-full border-[1.5px] border-rose-600 bg-gradient-to-br from-rose-950 to-zinc-900 shadow-[inset_0_0_5px_rgba(0,0,0,0.5)] z-10";
    iconClass = "w-[60%] h-[60%] object-contain brightness-0 invert drop-shadow-[0_0_2px_rgba(255,255,255,0.6)]";
    vfxLayer = (
      <div className="absolute -inset-0.5 bg-rose-700 rounded-full blur-[2px] opacity-50"></div>
    );
  }

  return (
    <div className={wrapperClass} title={kratosClassRank > 0 && kratosClassRank <= 3 ? `🔥 크라토스 ${job} ${kratosClassRank}위` : job}>
      {vfxLayer}
      <div className={innerClass}>
        <img 
          src={`/svgs/classes/${job}.svg`} 
          alt={job} 
          className={iconClass}
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
      </div>
    </div>
  );
}