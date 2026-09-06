"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

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
  lastUpdatedAt?: string | Date | null;
  currentOwnerNickname?: string;
  equippedTitle?: string;
  availableTitles?: string[];
  onEquipTitleChange?: (newTitle: string) => void;
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
  setAccountContribution,
  lastUpdatedAt,
  currentOwnerNickname = "",
  equippedTitle = "EMPTY",
  availableTitles = [],
  onEquipTitleChange
}: CharacterStatsProps) {
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isTitleModalOpen, setIsTitleModalOpen] = useState(false);
  const [userTitles, setUserTitles] = useState<string[]>(availableTitles);
  const [currentTitle, setCurrentTitle] = useState<string>(equippedTitle);
  const [isEquipping, setIsEquipping] = useState(false);

  useEffect(() => {
    setCurrentTitle(equippedTitle);
  }, [equippedTitle]);

  useEffect(() => {
    if (availableTitles && availableTitles.length > 0) {
      setUserTitles(availableTitles);
    } else if (currentOwnerNickname) {
      fetchMemberTitles();
    }
  }, [currentOwnerNickname, availableTitles]);

  const fetchMemberTitles = async () => {
    try {
      const { data } = await supabase
        .from('members')
        .select('titles, equipped_title')
        .eq('nickname', currentOwnerNickname)
        .maybeSingle();

      if (data) {
        setUserTitles(Array.isArray(data.titles) ? data.titles : []);
        if (data.equipped_title) setCurrentTitle(data.equipped_title);
      }
    } catch (e) {
      console.error("멤버 칭호 조회 실패:", e);
    }
  };

  const handleEquipTitle = async (title: string) => {
    if (!currentOwnerNickname) {
      alert("로그인 정보 또는 닉네임이 연결되지 않았습니다.");
      return;
    }

    setIsEquipping(true);
    try {
      const { error } = await supabase
        .from('members')
        .update({ equipped_title: title })
        .eq('nickname', currentOwnerNickname);

      if (error) throw error;

      setCurrentTitle(title);
      if (onEquipTitleChange) onEquipTitleChange(title);
      alert(`👑 [${title === 'EMPTY' ? '칭호 해제' : title}] (이)가 착용되었습니다!`);
      setIsTitleModalOpen(false);
    } catch (err: any) {
      alert("칭호 착용 오류: " + err.message);
    } finally {
      setIsEquipping(false);
    }
  };

  const formatComma = (val: string | number) => {
    if (val === "" || val === null || val === undefined) return "";
    const numStr = String(val).replace(/[^0-9]/g, "");
    if (!numStr) return "";
    return Number(numStr).toLocaleString();
  };

  const formatLastUpdated = (dateVal?: string | Date | null) => {
    if (!dateVal) return "기록 없음";
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "기록 없음";
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${month}/${day} ${hours}:${mins}`;
  };

  const handleInputChange = (field: string, rawVal: string) => {
    const digitsOnly = rawVal.replace(/[^0-9]/g, "");
    updateProfile(field, digitsOnly);
  };

  return (
    <div className="space-y-2">
      {/* 상단 컨트롤러 레이아웃 */}
      <div className="flex items-center justify-between gap-2 md:gap-4 flex-wrap">
        
        {/* RED: 뷰 모드 전환 버튼 & 칭호 장착 버튼 */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="inline-flex bg-[var(--inner-box)] p-0.5 md:p-1 rounded-lg border border-[var(--panel-border)] gap-0.5 md:gap-1 shadow-inner">
            <button
              type="button"
              onClick={() => setStatViewMode('character')}
              className={`px-2 py-1 md:px-3 md:py-1.5 text-xs md:text-sm font-black rounded-md transition cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                statViewMode === 'character'
                  ? 'bg-[var(--accent)] text-[var(--accent-fg)] shadow-xs'
                  : 'text-[var(--text-sub)] hover:text-[var(--text-main)]'
              }`}
            >
              <span>👤</span>
              <span>
                <span className="hidden sm:inline">선택 </span>캐릭터
              </span>
            </button>
            
            <button
              type="button"
              onClick={() => setStatViewMode('account')}
              className={`px-2 py-1 md:px-3 md:py-1.5 text-xs md:text-sm font-black rounded-md transition cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                statViewMode === 'account'
                  ? 'bg-[var(--accent)] text-[var(--accent-fg)] shadow-xs'
                  : 'text-[var(--text-sub)] hover:text-[var(--text-main)]'
              }`}
            >
              <span>📊</span>
              <span>
                계정<span className="hidden sm:inline"> 총합</span>
              </span>
            </button>
          </div>

          {/* 👑 칭호 변경 모달 트리거 버튼 */}
          <button
            type="button"
            onClick={() => setIsTitleModalOpen(true)}
            className="px-2.5 py-1 md:px-3 md:py-1.5 text-xs font-black rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition cursor-pointer flex items-center gap-1 whitespace-nowrap"
          >
            <span>👑</span>
            <span>{currentTitle && currentTitle !== 'EMPTY' ? currentTitle : '칭호 착용'}</span>
          </button>
        </div>

        {/* GREEN: 동적 시각 출력 업데이트 박스 */}
        <button
          type="button"
          onClick={() => setIsUpdateModalOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1 md:px-3.5 md:py-1.5 rounded-lg bg-[var(--inner-box)] border border-[var(--panel-border)] hover:border-[var(--accent)] text-[var(--text-sub)] hover:text-[var(--accent)] transition cursor-pointer shrink-0"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
          <div className="flex flex-col items-end leading-tight">
            <div className="flex items-center gap-1 text-[10px] md:text-xs font-bold text-[var(--text-sub)]">
              <span>ℹ️</span>
              <span>최신 업데이트</span>
            </div>
            <span className="text-[11px] md:text-xs font-black font-mono text-[var(--accent)]">
              {formatLastUpdated(lastUpdatedAt)}
            </span>
          </div>
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

      {/* 👑 칭호 장착 / 착용 변경 모달 */}
      {isTitleModalOpen && (
        <div className="fixed inset-0 z-[130] bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--panel)] border border-amber-500/50 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[var(--panel-border)] pb-3">
              <span className="font-black text-amber-400 text-sm flex items-center gap-1.5">
                <span>👑</span> 보유 칭호 장착 및 변경
              </span>
              <button
                type="button"
                onClick={() => setIsTitleModalOpen(false)}
                className="w-7 h-7 rounded-lg bg-[var(--inner-box)] text-[var(--text-sub)] hover:text-[var(--text-main)] border border-[var(--panel-border)] flex items-center justify-center font-bold text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-[var(--text-sub)] font-bold">
                달성한 명예 칭호 중 캐릭터 대표 배지로 표시할 칭호를 선택하세요.
              </p>

              <button
                type="button"
                onClick={() => handleEquipTitle("EMPTY")}
                disabled={isEquipping}
                className={`w-full p-2.5 rounded-xl border text-left text-xs font-bold transition flex justify-between items-center ${
                  currentTitle === "EMPTY" || !currentTitle
                    ? "bg-amber-500/20 border-amber-500 text-amber-300"
                    : "bg-[var(--inner-box)] border-[var(--panel-border)] text-[var(--text-sub)] hover:text-[var(--text-main)]"
                }`}
              >
                <span>🚫 칭호 착용 해제 (표시 안 함)</span>
                {currentTitle === "EMPTY" && <span className="text-amber-400 font-black">착용 중</span>}
              </button>

              <div className="max-h-52 overflow-y-auto space-y-1.5 custom-scrollbar pt-1">
                {userTitles.length === 0 ? (
                  <p className="text-xs text-[var(--text-sub)] text-center py-4 bg-[var(--inner-box)] rounded-xl border border-[var(--panel-border)]">
                    획득한 명예 칭호가 아직 없습니다. 판테온 랭킹 및 SYNAXIS 활동에 도전하세요!
                  </p>
                ) : (
                  userTitles.map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => handleEquipTitle(t)}
                      disabled={isEquipping}
                      className={`w-full p-2.5 rounded-xl border text-left text-xs font-black transition flex justify-between items-center ${
                        currentTitle === t
                          ? "bg-amber-500/20 border-amber-500 text-amber-300 shadow-xs"
                          : "bg-[var(--inner-box)] border-[var(--panel-border)] text-[var(--text-main)] hover:border-amber-500/40"
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <span>🎖️</span> {t}
                      </span>
                      {currentTitle === t && <span className="text-amber-400 text-[10px]">✅ 착용 중</span>}
                    </button>
                  ))
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsTitleModalOpen(false)}
              className="w-full py-2.5 bg-[var(--inner-box)] text-[var(--text-sub)] hover:text-[var(--text-main)] font-bold text-xs rounded-xl border border-[var(--panel-border)] transition"
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {/* 데이터 동기화 안내 모달 */}
      {isUpdateModalOpen && (
        <div className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--panel)] border border-[var(--panel-border)] rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[var(--panel-border)] pb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">🔄</span>
                <h3 className="text-sm md:text-base font-black text-[var(--accent)]">
                  데이터 동기화 안내
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsUpdateModalOpen(false)}
                className="w-7 h-7 rounded-lg bg-[var(--inner-box)] text-[var(--text-sub)] hover:text-[var(--text-main)] border border-[var(--panel-border)] flex items-center justify-center font-bold text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-[var(--text-main)]">
              <p className="bg-[var(--inner-box)] p-3 rounded-xl border border-[var(--panel-border)] text-[var(--text-sub)]">
                현재 인게임 데이터의 실시간 자동 동기화가 불가능하여, <strong className="text-[var(--accent)] font-bold">관리자가 직접 주기적으로 갱신</strong>하고 있습니다.
              </p>

              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-[var(--text-sub)]">📋 반자동 동기화 대상 항목</span>
                <div className="grid grid-cols-2 gap-1.5 bg-[var(--inner-box)] p-2.5 rounded-xl border border-[var(--panel-border)] font-bold">
                  <div className="flex items-center gap-1.5"><span className="text-[var(--accent)]">1.</span> 전투력</div>
                  <div className="flex items-center gap-1.5"><span className="text-[var(--accent)]">2.</span> 생활력</div>
                  <div className="flex items-center gap-1.5"><span className="text-[var(--accent)]">3.</span> 매력</div>
                  <div className="flex items-center gap-1.5"><span className="text-[var(--accent)]">4.</span> 종합점수</div>
                  <div className="flex items-center gap-1.5"><span className="text-[var(--accent)]">5.</span> 서버 랭킹</div>
                  <div className="flex items-center gap-1.5"><span className="text-[var(--accent)]">6.</span> 통합 랭킹</div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsUpdateModalOpen(false)}
              className="w-full py-2.5 bg-[var(--accent)] text-[var(--accent-fg)] font-black text-xs rounded-xl hover:opacity-90 transition cursor-pointer shadow-xs"
            >
              확인했습니다
            </button>
          </div>
        </div>
      )}
    </div>
  );
}