"use client";

interface CharacterStatsProps {
  statViewMode: 'character' | 'account';
  setStatViewMode: (mode: 'character' | 'account') => void;
  profile: {
    combatPower: string;
    lifeEnergy: string;
    charm: string;
    magicResistance: string;
  };
  accountTotals: {
    combatPower: number;
    lifeEnergy: number;
    charm: number;
    magicResistance: number;
  };
  charTotalScore: number;
  accountTotalScore: number;
  accountContribution: string;
  updateProfile: (field: string, value: any) => void;
  setAccountContribution: (value: string) => void;
}

export default function CharacterStats({
  statViewMode,
  setStatViewMode,
  profile,
  accountTotals,
  charTotalScore,
  accountTotalScore,
  accountContribution,
  updateProfile,
  setAccountContribution
}: CharacterStatsProps) {
  const formatComma = (val: string | number) => {
    if (val === "" || val === null || val === undefined) return "";
    const numStr = String(val).replace(/[^0-9]/g, "");
    if (!numStr) return "";
    return Number(numStr).toLocaleString();
  };

  const handleInputChange = (field: string, rawVal: string) => {
    const digitsOnly = rawVal.replace(/[^0-9]/g, "");
    updateProfile(field, digitsOnly);
  };

  return (
    <div className="space-y-2">
      {/* 뷰 모드 전환 버튼 */}
      <div className="grid grid-cols-2 bg-[var(--inner-box)] p-0.5 rounded-lg border border-[var(--panel-border)] gap-0.5 shadow-inner md:max-w-[300px]">
        <button
          type="button"
          onClick={() => setStatViewMode('character')}
          className={`py-1 text-[11px] font-black rounded-md transition cursor-pointer flex items-center justify-center gap-1 ${
            statViewMode === 'character'
              ? 'bg-[var(--accent)] text-[var(--accent-fg)] shadow-xs'
              : 'text-[var(--text-sub)] hover:text-[var(--text-main)]'
          }`}
        >
          <span>👤</span>
          <span>선택 캐릭터</span>
        </button>
        <button
          type="button"
          onClick={() => setStatViewMode('account')}
          className={`py-1 text-[11px] font-black rounded-md transition cursor-pointer flex items-center justify-center gap-1 ${
            statViewMode === 'account'
              ? 'bg-[var(--accent)] text-[var(--accent-fg)] shadow-xs'
              : 'text-[var(--text-sub)] hover:text-[var(--text-main)]'
          }`}
        >
          <span>📊</span>
          <span>계정 총합</span>
        </button>
      </div>

      {/* 스탯 카드 그리드 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5 md:gap-2">
        
        {/* ⚔️ 전투력 */}
        <div className="bg-[var(--inner-box)] px-2.5 py-1.5 md:py-2.5 rounded-lg border border-[var(--panel-border)] flex flex-col justify-between gap-0.5 min-w-0">
          <label className="text-[11px] md:text-xs font-bold text-red-400 whitespace-nowrap shrink-0">⚔️ 전투력</label>
          {statViewMode === 'character' ? (
            <input
              type="text"
              inputMode="numeric"
              value={formatComma(profile.combatPower)}
              onChange={e => handleInputChange("combatPower", e.target.value)}
              placeholder="0"
              className="w-full text-left bg-transparent text-sm md:text-base font-black font-mono text-[var(--text-main)] outline-none min-w-0"
            />
          ) : (
            <span className="text-sm md:text-base font-black font-mono text-[var(--accent)] text-left w-full truncate">
              {formatComma(accountTotals.combatPower)}
            </span>
          )}
        </div>

        {/* 🌿 생활력 */}
        <div className="bg-[var(--inner-box)] px-2.5 py-1.5 md:py-2.5 rounded-lg border border-[var(--panel-border)] flex flex-col justify-between gap-0.5 min-w-0">
          <label className="text-[11px] md:text-xs font-bold text-emerald-400 whitespace-nowrap shrink-0">🌿 생활력</label>
          {statViewMode === 'character' ? (
            <input
              type="text"
              inputMode="numeric"
              value={formatComma(profile.lifeEnergy)}
              onChange={e => handleInputChange("lifeEnergy", e.target.value)}
              placeholder="0"
              className="w-full text-left bg-transparent text-sm md:text-base font-black font-mono text-[var(--text-main)] outline-none min-w-0"
            />
          ) : (
            <span className="text-sm md:text-base font-black font-mono text-[var(--accent)] text-left w-full truncate">
              {formatComma(accountTotals.lifeEnergy)}
            </span>
          )}
        </div>

        {/* ✨ 매력 */}
        <div className="bg-[var(--inner-box)] px-2.5 py-1.5 md:py-2.5 rounded-lg border border-[var(--panel-border)] flex flex-col justify-between gap-0.5 min-w-0">
          <label className="text-[11px] md:text-xs font-bold text-pink-400 whitespace-nowrap shrink-0">✨ 매력</label>
          {statViewMode === 'character' ? (
            <input
              type="text"
              inputMode="numeric"
              value={formatComma(profile.charm)}
              onChange={e => handleInputChange("charm", e.target.value)}
              placeholder="0"
              className="w-full text-left bg-transparent text-sm md:text-base font-black font-mono text-[var(--text-main)] outline-none min-w-0"
            />
          ) : (
            <span className="text-sm md:text-base font-black font-mono text-[var(--accent)] text-left w-full truncate">
              {formatComma(accountTotals.charm)}
            </span>
          )}
        </div>

        {/* 🏆 종합점수 */}
        <div className="bg-[var(--inner-box)] px-2.5 py-1.5 md:py-2.5 rounded-lg border border-[var(--accent)]/50 bg-[var(--accent-soft)]/10 flex flex-col justify-between gap-0.5 min-w-0">
          <label className="text-[11px] md:text-xs font-bold text-[var(--accent)] whitespace-nowrap shrink-0">🏆 종합점수</label>
          <span className="text-sm md:text-base font-black font-mono text-[var(--accent)] text-left w-full truncate">
            {statViewMode === 'character' ? formatComma(charTotalScore) : formatComma(accountTotalScore)}
          </span>
        </div>

        {/* 🔮 마도저항 */}
        <div className="bg-[var(--inner-box)] px-2.5 py-1.5 md:py-2.5 rounded-lg border border-[var(--panel-border)] flex flex-col justify-between gap-0.5 min-w-0">
          <label className="text-[11px] md:text-xs font-bold text-purple-400 whitespace-nowrap shrink-0">🔮 마도저항</label>
          {statViewMode === 'character' ? (
            <input
              type="text"
              inputMode="numeric"
              value={formatComma(profile.magicResistance)}
              onChange={e => handleInputChange("magicResistance", e.target.value)}
              placeholder="0"
              className="w-full text-left bg-transparent text-sm md:text-base font-black font-mono text-[var(--text-main)] outline-none min-w-0"
            />
          ) : (
            <span className="text-sm md:text-base font-black font-mono text-[var(--accent)] text-left w-full truncate">
              {formatComma(accountTotals.magicResistance)}
            </span>
          )}
        </div>

        {/* 🛡️ 길드공헌도 */}
        <div className="bg-[var(--inner-box)] px-2.5 py-1.5 md:py-2.5 rounded-lg border border-[var(--panel-border)] flex flex-col justify-between gap-0.5 min-w-0">
          <label className="text-[11px] md:text-xs font-bold text-amber-400 whitespace-nowrap shrink-0">🛡️ 길드공헌도</label>
          <input
            type="text"
            inputMode="numeric"
            value={formatComma(accountContribution)}
            onChange={e => setAccountContribution(e.target.value.replace(/[^0-9]/g, ""))}
            placeholder="0"
            className="w-full text-left bg-transparent text-sm md:text-base font-black font-mono text-[var(--text-main)] outline-none min-w-0"
          />
        </div>

      </div>
    </div>
  );
}