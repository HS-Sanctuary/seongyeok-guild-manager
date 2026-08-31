"use client";

import { usePressAndHold } from "@/hooks/usePressAndHold";
import ClassIcon from "@/components/common/ClassIcon";

interface ClassItemProps {
  cls: any;
  currentLevel: number;
  updateClassLevel: (clsName: string, delta: number) => void;
  setMaxLevel: (clsName: string) => void;
  setMinLevel: (clsName: string) => void;
}

function MobileClassRow({
  cls,
  currentLevel,
  updateClassLevel,
  setMaxLevel,
  setMinLevel,
}: ClassItemProps) {
  const isMax = currentLevel === 65;

  const minusHold = usePressAndHold(() => updateClassLevel(cls.name, -1));
  const plusHold = usePressAndHold(() => updateClassLevel(cls.name, 1));

  return (
    <div
      className={`flex items-center justify-between p-2 rounded-lg border transition min-w-0 ${
        isMax
          ? "border-[var(--accent)] bg-[var(--accent-soft)]/20"
          : "bg-[var(--inner-box)] border-[var(--panel-border)]"
      }`}
    >
      <div className="flex items-center gap-1.5 min-w-0 pr-1 flex-1">
        {/* 이모지 대신 ClassIcon 적용 */}
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
        <button
          type="button"
          {...minusHold}
          className="w-6 h-6 flex items-center justify-center text-xs font-black rounded bg-[var(--panel)] border border-[var(--panel-border)] text-[var(--text-sub)] hover:text-[var(--text-main)] active:scale-95 cursor-pointer touch-none"
        >
          -
        </button>

        <span className="text-xs font-black font-mono text-[var(--accent)] min-w-[38px] text-center whitespace-nowrap">
          Lv.{currentLevel}
        </span>

        <button
          type="button"
          {...plusHold}
          className="w-6 h-6 flex items-center justify-center text-xs font-black rounded bg-[var(--panel)] border border-[var(--panel-border)] text-[var(--text-sub)] hover:text-[var(--text-main)] active:scale-95 cursor-pointer touch-none"
        >
          +
        </button>

        {isMax ? (
          <button
            type="button"
            onClick={() => setMinLevel(cls.name)}
            className="px-1.5 py-0.5 text-[10px] font-black rounded bg-rose-500/20 text-rose-400 border border-rose-500/40 hover:bg-rose-500 hover:text-white transition whitespace-nowrap cursor-pointer ml-0.5"
          >
            MIN
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setMaxLevel(cls.name)}
            className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent)]/40 hover:bg-[var(--accent)] hover:text-[var(--accent-fg)] transition whitespace-nowrap cursor-pointer ml-0.5"
          >
            MAX
          </button>
        )}
      </div>
    </div>
  );
}

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
  return (
    <div className="bg-[var(--panel)] rounded-xl border border-[var(--panel-border)] p-2.5 md:p-4 shadow-xs space-y-3">
      <div className="border-b border-[var(--panel-border)] pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <h3 className="font-bold text-[var(--accent)] text-xs md:text-sm whitespace-nowrap flex items-center gap-1.5">
          <span>⚡</span>
          <span>클래스 레벨 관리</span>
        </h3>
        <p className="text-[10px] text-[var(--text-sub)] font-normal md:hidden leading-tight">
          💡 + / - 버튼을 꾹 누르면 레벨이 연속 변경됩니다.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:hidden gap-2">
        {dbClasses.map((cls: any) => (
          <MobileClassRow
            key={cls.name}
            cls={cls}
            currentLevel={levels[cls.name] || 1}
            updateClassLevel={updateClassLevel}
            setMaxLevel={setMaxLevel}
            setMinLevel={setMinLevel}
          />
        ))}
      </div>

      <div className="hidden md:grid grid-cols-2 xl:grid-cols-3 gap-2">
        {dbClasses.map((cls: any) => {
          const currentLevel = levels[cls.name] || 1;
          const isMax = currentLevel === 65;

          return (
            <div
              key={cls.name}
              className={`flex items-center justify-between p-2 rounded-lg border transition min-w-0 ${
                isMax
                  ? "border-[var(--accent)] bg-[var(--accent-soft)]/20"
                  : "bg-[var(--inner-box)] border-[var(--panel-border)]"
              }`}
            >
              <div className="flex items-center gap-1.5 min-w-0 pr-1 flex-1">
                {/* 데스크톱 그리드도 ClassIcon 적용 */}
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
                <span className="text-sm font-black font-mono text-[var(--accent)] mr-0.5 whitespace-nowrap">
                  Lv.{currentLevel}
                </span>

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
    </div>
  );
}