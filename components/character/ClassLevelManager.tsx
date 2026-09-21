"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import ClassIcon from "@/components/common/ClassIcon";

interface ClassItemProps {
  cls: any;
  currentLevel: number;
  updateClassLevel: (clsName: string, delta: number) => void;
  setMaxLevel: (clsName: string) => void;
  setMinLevel: (clsName: string) => void;
  setHoldingInfo?: (info: { name: string; level: number } | null) => void;
}

const LINEAGE_GROUPS = [
  { name: "전체", defaultClasses: [] },
  { name: "전사 계열", defaultClasses: ["전사", "대검전사", "검술사", "기사"] },
  { name: "마법사 계열", defaultClasses: ["마법사", "화염술사", "빙결술사", "전격술사"] },
  { name: "궁수 계열", defaultClasses: ["궁수", "장궁병", "석궁사수"] },
  { name: "음유시인 계열", defaultClasses: ["음유시인", "댄서", "악사"] },
  { name: "힐러 계열", defaultClasses: ["힐러", "사제", "수도사", "암흑술사"] },
  { name: "도적 계열", defaultClasses: ["도적", "격투가", "듀얼블레이드"] },
];

// ----------------------------------------------------
// 모바일 클래스 행 컴포넌트
// ----------------------------------------------------
function MobileClassRow({
  cls,
  currentLevel,
  updateClassLevel,
  setMaxLevel,
  setMinLevel,
  setHoldingInfo,
}: ClassItemProps) {
  const isMax = currentLevel === 65;

  // 레벨 직접 입력 상태
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(String(currentLevel));

  useEffect(() => {
    setInputValue(String(currentLevel));
  }, [currentLevel]);

  // 키보드 직접 입력 완료 처리
  const handleInputSubmit = () => {
    let num = parseInt(inputValue, 10);
    if (isNaN(num)) num = currentLevel;
    if (num < 1) num = 1;
    if (num > 65) num = 65;

    const delta = num - currentLevel;
    if (delta !== 0) {
      updateClassLevel(cls.name, delta);
    }
    setIsEditing(false);
  };

  // ----------------------------------------------------
  // 모바일 꾹 누르기 타이머 & 민감도 제어 로직
  // ----------------------------------------------------
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentLevelRef = useRef(currentLevel);
  currentLevelRef.current = currentLevel;

  const stopHold = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    timerRef.current = null;
    intervalRef.current = null;
    if (setHoldingInfo) setHoldingInfo(null);
  };

  const startHold = (delta: number) => {
    stopHold();

    // 1. 단발 터치: 즉시 1단계 변경
    updateClassLevel(cls.name, delta);
    if (setHoldingInfo) {
      const nextLevel = Math.min(65, Math.max(1, currentLevelRef.current + delta));
      setHoldingInfo({ name: cls.name, level: nextLevel });
    }

    // 2. 350ms 이상 꾹 누를 때만 홀드 작동
    timerRef.current = setTimeout(() => {
      let speed = 120; // 초기 홀드 속도

      const runInterval = () => {
        intervalRef.current = setInterval(() => {
          updateClassLevel(cls.name, delta);
          if (setHoldingInfo) {
            setHoldingInfo({ name: cls.name, level: currentLevelRef.current });
          }
        }, speed);
      };

      runInterval();

      // 1초 이상 유지 시 가속도 적용 (50ms 간격)
      timerRef.current = setTimeout(() => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        speed = 50;
        runInterval();
      }, 1000);
    }, 350);
  };

  return (
    <div
      className={`flex items-center justify-between p-2 rounded-lg border transition min-w-0 ${
        isMax
          ? "border-[var(--accent)] bg-[var(--accent-soft)]/20"
          : "bg-[var(--inner-box)] border-[var(--panel-border)]"
      }`}
    >
      <div className="flex items-center gap-1.5 min-w-0 pr-1 flex-1">
        <ClassIcon job={cls.name} className="w-4 h-4 shrink-0" />
        <span
          className={`text-xs font-bold truncate ${
            isMax ? "text-[var(--accent)]" : "text-[var(--text-main)]"
          }`}
        >
          {cls.name}
        </span>
      </div>

      <div className="flex items-center gap-1 shrink-0 select-none">
        {/* 마이너스 버튼 */}
        <button
          type="button"
          onPointerDown={(e) => {
            e.preventDefault();
            startHold(-1);
          }}
          onPointerUp={stopHold}
          onPointerLeave={stopHold}
          onPointerCancel={stopHold}
          className="w-7 h-7 flex items-center justify-center text-xs font-black rounded bg-[var(--panel)] border border-[var(--panel-border)] text-[var(--text-sub)] hover:text-[var(--text-main)] active:scale-95 cursor-pointer touch-none"
        >
          -
        </button>

        {/* 레벨 표시 및 직접 입력 영역 */}
        {isEditing ? (
          <input
            type="number"
            min={1}
            max={65}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onBlur={handleInputSubmit}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleInputSubmit();
            }}
            autoFocus
            className="w-12 h-6 text-xs font-black font-mono text-center text-[var(--accent)] bg-[var(--panel)] border border-[var(--accent)] rounded focus:outline-none"
          />
        ) : (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="text-xs font-black font-mono text-[var(--accent)] min-w-[42px] text-center whitespace-nowrap hover:underline cursor-pointer px-1 py-0.5 rounded hover:bg-[var(--panel)] transition"
            title="터치하여 직접 입력"
          >
            Lv.{currentLevel}
          </button>
        )}

        {/* 플러스 버튼 */}
        <button
          type="button"
          onPointerDown={(e) => {
            e.preventDefault();
            startHold(1);
          }}
          onPointerUp={stopHold}
          onPointerLeave={stopHold}
          onPointerCancel={stopHold}
          className="w-7 h-7 flex items-center justify-center text-xs font-black rounded bg-[var(--panel)] border border-[var(--panel-border)] text-[var(--text-sub)] hover:text-[var(--text-main)] active:scale-95 cursor-pointer touch-none"
        >
          +
        </button>

        {isMax ? (
          <button
            type="button"
            onClick={() => setMinLevel(cls.name)}
            className="px-1.5 py-1 text-[10px] font-black rounded bg-rose-500/20 text-rose-400 border border-rose-500/40 hover:bg-rose-500 hover:text-white transition whitespace-nowrap cursor-pointer ml-0.5"
          >
            MIN
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setMaxLevel(cls.name)}
            className="px-1.5 py-1 text-[10px] font-bold rounded bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent)]/40 hover:bg-[var(--accent)] hover:text-[var(--accent-fg)] transition whitespace-nowrap cursor-pointer ml-0.5"
          >
            MAX
          </button>
        )}
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 메인 매니저 컴포넌트
// ----------------------------------------------------
interface ClassLevelManagerProps {
  dbClasses: any[];
  levels: Record<string, number>;
  updateClassLevel: (clsName: string, delta: number) => void;
  setMaxLevel: (clsName: string) => void;
  setMinLevel: (clsName: string) => void;
}

export default function ClassLevelManager({
  dbClasses,
  levels,
  updateClassLevel,
  setMaxLevel,
  setMinLevel,
}: ClassLevelManagerProps) {
  // 모바일 누름 동작 시 상단 노출용 오버레이 상태
  const [holdingInfo, setHoldingInfo] = useState<{ name: string; level: number } | null>(null);

  // 계열 필터 탭 상태
  const [selectedTab, setSelectedTab] = useState<string>("전체");

  const safeClasses = dbClasses || [];

  // 직업 계열 분류 판별 함수
  const getLineageName = (clsName: string, customCategory?: string) => {
    for (const group of LINEAGE_GROUPS) {
      if (group.defaultClasses.includes(clsName)) return group.name;
    }
    if (customCategory && customCategory.trim() !== "") return customCategory;
    return "기타 계열";
  };

  // 선택된 탭에 맞춰 필터링된 직업 목록
  const filteredClasses = useMemo(() => {
    if (selectedTab === "전체") return safeClasses;
    return safeClasses.filter(
      (cls: any) => getLineageName(cls.name, cls.category) === selectedTab
    );
  }, [safeClasses, selectedTab]);

  // 데스크톱용 레벨 직접 입력 컴포넌트
  const DesktopLevelInput = ({ clsName, currentLevel }: { clsName: string; currentLevel: number }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [inputValue, setInputValue] = useState(String(currentLevel));

    useEffect(() => {
      setInputValue(String(currentLevel));
    }, [currentLevel]);

    const handleSubmit = () => {
      let num = parseInt(inputValue, 10);
      if (isNaN(num)) num = currentLevel;
      if (num < 1) num = 1;
      if (num > 65) num = 65;

      const delta = num - currentLevel;
      if (delta !== 0) updateClassLevel(clsName, delta);
      setIsEditing(false);
    };

    if (isEditing) {
      return (
        <input
          type="number"
          min={1}
          max={65}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onBlur={handleSubmit}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit();
          }}
          autoFocus
          className="w-12 h-6 text-xs font-black font-mono text-center text-[var(--accent)] bg-[var(--panel)] border border-[var(--accent)] rounded focus:outline-none mr-1"
        />
      );
    }

    return (
      <button
        type="button"
        onClick={() => setIsEditing(true)}
        className="text-sm font-black font-mono text-[var(--accent)] mr-1 whitespace-nowrap hover:underline cursor-pointer px-1 py-0.5 rounded hover:bg-[var(--panel)] transition"
        title="클릭하여 직접 입력"
      >
        Lv.{currentLevel}
      </button>
    );
  };

  return (
    <div className="bg-[var(--panel)] rounded-xl border border-[var(--panel-border)] p-2.5 md:p-4 shadow-xs space-y-3 relative">
      <div className="border-b border-[var(--panel-border)] pb-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h3 className="font-bold text-[var(--accent)] text-xs md:text-sm whitespace-nowrap flex items-center gap-1.5">
          <span>⚡</span>
          <span>클래스 레벨 관리</span>
        </h3>

        {/* 🌟 6대 계열별 빠른 필터 탭 */}
        <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar pb-0.5 max-w-full">
          {LINEAGE_GROUPS.map((group) => {
            const isActive = selectedTab === group.name;
            return (
              <button
                key={group.name}
                type="button"
                onClick={() => setSelectedTab(group.name)}
                className={`px-2 py-1 rounded-md text-[10px] md:text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "bg-[var(--accent)] text-[var(--accent-fg)] font-black shadow-2xs"
                    : "bg-[var(--inner-box)] text-[var(--text-sub)] hover:text-[var(--text-main)] border border-[var(--panel-border)]"
                }`}
              >
                {group.name}
              </button>
            );
          })}
        </div>
      </div>

      {filteredClasses.length === 0 ? (
        <div className="text-center py-8 text-xs font-bold text-[var(--text-sub)] bg-[var(--inner-box)] rounded-xl border border-[var(--panel-border)]/50">
          등록된 클래스가 없습니다.
        </div>
      ) : (
        <>
          {/* 모바일 뷰 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:hidden gap-2">
            {filteredClasses.map((cls: any) => (
              <MobileClassRow
                key={cls.id || cls.name}
                cls={cls}
                currentLevel={levels[cls.name] || 1}
                updateClassLevel={updateClassLevel}
                setMaxLevel={setMaxLevel}
                setMinLevel={setMinLevel}
                setHoldingInfo={setHoldingInfo}
              />
            ))}
          </div>

          {/* 데스크톱 뷰 */}
          <div className="hidden md:grid grid-cols-2 xl:grid-cols-3 gap-2">
            {filteredClasses.map((cls: any) => {
              const currentLevel = levels[cls.name] || 1;
              const isMax = currentLevel === 65;

              return (
                <div
                  key={cls.id || cls.name}
                  className={`flex items-center justify-between p-2 rounded-lg border transition min-w-0 ${
                    isMax
                      ? "border-[var(--accent)] bg-[var(--accent-soft)]/20"
                      : "bg-[var(--inner-box)] border-[var(--panel-border)]"
                  }`}
                >
                  <div className="flex items-center gap-1.5 min-w-0 pr-1 flex-1">
                    <ClassIcon job={cls.name} className="w-5 h-5 shrink-0" />
                    <span
                      className={`text-sm font-bold truncate ${
                        isMax ? "text-[var(--accent)]" : "text-[var(--text-main)]"
                      }`}
                    >
                      {cls.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <DesktopLevelInput clsName={cls.name} currentLevel={currentLevel} />

                    <button
                      type="button"
                      onClick={() => updateClassLevel(cls.name, -10)}
                      className="px-1 py-0.5 text-[10px] font-bold rounded bg-[var(--panel)] border border-[var(--panel-border)] text-[var(--text-sub)] hover:text-[var(--text-main)] cursor-pointer"
                    >
                      -10
                    </button>
                    <button
                      type="button"
                      onClick={() => updateClassLevel(cls.name, -1)}
                      className="px-1 py-0.5 text-[10px] font-bold rounded bg-[var(--panel)] border border-[var(--panel-border)] text-[var(--text-sub)] hover:text-[var(--text-main)] cursor-pointer"
                    >
                      -1
                    </button>

                    {isMax ? (
                      <button
                        type="button"
                        onClick={() => setMinLevel(cls.name)}
                        className="px-1.5 py-0.5 text-[10px] font-black rounded bg-rose-500/20 text-rose-400 border border-rose-500/40 hover:bg-rose-500 hover:text-white transition whitespace-nowrap cursor-pointer"
                      >
                        MIN
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setMaxLevel(cls.name)}
                        className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent)]/40 hover:bg-[var(--accent)] hover:text-[var(--accent-fg)] transition whitespace-nowrap cursor-pointer"
                      >
                        MAX
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => updateClassLevel(cls.name, 1)}
                      className="px-1 py-0.5 text-[10px] font-bold rounded bg-[var(--panel)] border border-[var(--panel-border)] text-[var(--text-sub)] hover:text-[var(--text-main)] cursor-pointer"
                    >
                      +1
                    </button>
                    <button
                      type="button"
                      onClick={() => updateClassLevel(cls.name, 10)}
                      className="px-1 py-0.5 text-[10px] font-bold rounded bg-[var(--panel)] border border-[var(--panel-border)] text-[var(--text-sub)] hover:text-[var(--text-main)] cursor-pointer"
                    >
                      +10
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* 모바일 터치 홀드 시 손가락 가림 방지용 상단 중앙 고정 반투명 오버레이 */}
      {holdingInfo && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[99999] pointer-events-none md:hidden">
          <div className="flex items-center gap-2.5 bg-zinc-950/90 border border-[var(--accent)] text-white px-4 py-2 rounded-full shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-100">
            <ClassIcon job={holdingInfo.name} className="w-5 h-5 shrink-0" />
            <span className="text-xs font-bold text-zinc-200">{holdingInfo.name}</span>
            <span className="text-sm font-black font-mono text-[var(--accent)]">
              Lv.{holdingInfo.level}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}