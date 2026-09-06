"use client";

import { useState, useEffect, useMemo } from "react";
import ClassIcon from "@/components/common/ClassIcon";

interface BusJoinCharConfig {
  selected: boolean;
  allowRepeat: boolean;
  timeStart: string;
  timeEnd: string;
}

interface GuildBusJoinModalProps {
  isOpen: boolean;
  onClose: () => void;
  myCharacters: any[];
  onSubmit: (selectedData: { characterId: string; name: string; job: string; combat_power: number; magic_resistance: number; allowRepeat: boolean; timeStart: string; timeEnd: string }[]) => void;
  contentName: string;
  difficulty: string;
  busTimeStart?: string;
  busTimeEnd?: string;
}

export default function GuildBusJoinModal({
  isOpen,
  onClose,
  myCharacters,
  onSubmit,
  contentName,
  difficulty,
  busTimeStart = "20:00",
  busTimeEnd = "23:59",
}: GuildBusJoinModalProps) {
  const [selections, setSelections] = useState<Record<string, BusJoinCharConfig>>({});
  const [globalTimeStart, setGlobalTimeStart] = useState(busTimeStart);
  const [globalTimeEnd, setGlobalTimeEnd] = useState(busTimeEnd);

  // 🛡️ [방어 아키텍처] 부모 데이터에서 넘어온 중복 캐릭터를 닉네임/이름 기준으로 완벽하게 제거
  const uniqueCharacters = useMemo(() => {
    const map = new Map();
    myCharacters.forEach((c) => {
      const charName = c.nickname || c.name;
      if (charName && !map.has(charName)) {
        map.set(charName, c);
      }
    });
    return Array.from(map.values()) as any[];
  }, [myCharacters]);

  useEffect(() => {
    if (isOpen) {
      setGlobalTimeStart(busTimeStart);
      setGlobalTimeEnd(busTimeEnd);
      const initial: Record<string, BusJoinCharConfig> = {};
      uniqueCharacters.forEach((c, idx) => {
        const charName = c.nickname || c.name;
        if (!charName) return;
        initial[charName] = {
          selected: idx === 0,
          allowRepeat: true,
          timeStart: busTimeStart,
          timeEnd: busTimeEnd,
        };
      });
      setSelections(initial);
    }
  }, [isOpen, uniqueCharacters, busTimeStart, busTimeEnd]);

  if (!isOpen) return null;

  const selectedCount = Object.values(selections).filter(s => s.selected).length;

  const handleSelectAll = (select: boolean) => {
    setSelections(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(k => {
        next[k] = { ...next[k], selected: select };
      });
      return next;
    });
  };

  const handleToggleAllRepeat = (repeat: boolean) => {
    setSelections(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(k => {
        if (next[k].selected) {
          next[k] = { ...next[k], allowRepeat: repeat };
        }
      });
      return next;
    });
  };

  const handleSubmit = () => {
    const activeEntries = Object.entries(selections).filter(([_, config]) => config.selected);
    if (activeEntries.length === 0) {
      alert("탑승시킬 캐릭터를 최소 1개 이상 선택해주세요!");
      return;
    }

    const payload = activeEntries.map(([charName, config]) => {
      const targetChar = uniqueCharacters.find(c => (c.nickname || c.name) === charName) || {};
      return {
        characterId: charName,
        name: charName,
        job: targetChar.job || "전사",
        combat_power: Number(targetChar.combat_power || 0),
        magic_resistance: Number(targetChar.magic_resistance || 0),
        allowRepeat: config.allowRepeat,
        timeStart: globalTimeStart,
        timeEnd: globalTimeEnd,
      };
    });

    onSubmit(payload);
  };

  return (
    <div className="fixed inset-0 z-[110] bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 select-none">
      <div className="bg-[var(--panel)] border border-[var(--panel-border)] rounded-2xl max-w-xl w-full flex flex-col max-h-[90vh] shadow-2xl animate-in fade-in zoom-in-95 overflow-hidden">
        
        {/* 모달 헤더 */}
        <div className="flex justify-between items-center px-5 py-4 border-b border-[var(--panel-border)] bg-[var(--inner-box)] shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-xl shrink-0">✨</span>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black text-[var(--accent)]">성역 공식 길드 버스 탑승</span>
              </div>
              <h3 className="font-black text-sm sm:text-base text-[var(--text-main)] truncate mt-0.5">
                {contentName} <span className="text-[var(--accent)]">[{difficulty}]</span>
              </h3>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="text-[var(--text-sub)] hover:text-white font-black text-lg p-1 cursor-pointer shrink-0"
          >
            ✕
          </button>
        </div>

        {/* 안내 문구 영역 */}
        <div className="px-5 py-3.5 bg-[var(--inner-box)]/60 border-b border-[var(--panel-border)] text-xs text-[var(--text-sub)] space-y-1 shrink-0">
          <div className="leading-relaxed">
            길드 버스 파티에 <span className="text-[var(--accent)] font-black">[참여 가능한 시간]</span>과 <span className="text-[var(--accent)] font-black">[캐릭터들을 다중 선택]</span>하시고,
          </div>
          <div className="leading-relaxed">
            <span className="text-[var(--accent)] font-black">[반복 가능]</span> 체크 시 해당 캐릭터는 여러 회차 파티 구성에 참여 가능합니다.
          </div>
          <div className="leading-relaxed">
            <span className="text-[var(--accent)] font-black">[매 판 시스템이 알아서 파티를 구성]</span>하며 <span className="text-[var(--accent)] font-black">[완료 후 컨텐츠 완료]</span>가 됩니다.
          </div>
        </div>

        {/* 운행 시간 및 일괄 제어 컨트롤 바 */}
        <div className="p-4 border-b border-[var(--panel-border)] bg-[var(--panel)] space-y-3 shrink-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 bg-[var(--inner-box)] p-3 rounded-xl border border-[var(--panel-border)] text-xs">
            <div className="flex items-center gap-2">
              <span className="text-sm">🚌</span>
              <span className="font-black text-[var(--text-main)]">버스 운행 시간:</span>
              <span className="text-[var(--accent)] font-black">{busTimeStart} ~ {busTimeEnd}</span>
            </div>

            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <span className="text-[11px] font-bold text-[var(--text-sub)]">탑승 시간 일괄:</span>
              <input
                type="time"
                value={globalTimeStart}
                onChange={(e) => setGlobalTimeStart(e.target.value)}
                className="bg-[var(--panel)] border border-[var(--panel-border)] rounded-lg px-2 py-1 text-xs font-bold text-[var(--text-main)] outline-none cursor-pointer"
              />
              <span className="text-[var(--text-sub)]">~</span>
              <input
                type="time"
                value={globalTimeEnd}
                onChange={(e) => setGlobalTimeEnd(e.target.value)}
                className="bg-[var(--panel)] border border-[var(--panel-border)] rounded-lg px-2 py-1 text-xs font-bold text-[var(--text-main)] outline-none cursor-pointer"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleSelectAll(true)}
                className="px-2.5 py-1 bg-[var(--inner-box)] border border-[var(--panel-border)] hover:border-[var(--accent)] text-[var(--text-main)] font-bold text-[11px] rounded-lg transition cursor-pointer"
              >
                전체 선택
              </button>
              <button
                type="button"
                onClick={() => handleSelectAll(false)}
                className="px-2.5 py-1 bg-[var(--inner-box)] border border-[var(--panel-border)] hover:border-[var(--accent)] text-[var(--text-sub)] font-bold text-[11px] rounded-lg transition cursor-pointer"
              >
                전체 해제
              </button>
            </div>

            <div className="flex items-center gap-1.5 ml-auto">
              <span className="text-[11px] font-bold text-[var(--text-sub)]">선택 캐릭터 일괄:</span>
              <button
                type="button"
                onClick={() => handleToggleAllRepeat(true)}
                className="px-2 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/40 font-black text-[10px] rounded-lg cursor-pointer"
              >
                🔄 반복 가능
              </button>
              <button
                type="button"
                onClick={() => handleToggleAllRepeat(false)}
                className="px-2 py-1 bg-zinc-700/50 text-zinc-300 border border-zinc-600 font-bold text-[10px] rounded-lg cursor-pointer"
              >
                1️⃣ 1회성
              </button>
            </div>
          </div>
        </div>

        {/* 캐릭터 목록 스크롤 영역 */}
        <div className="p-4 sm:p-5 overflow-y-auto custom-scrollbar flex-1 space-y-2">
          {uniqueCharacters.map((char) => {
            const charName = char.nickname || char.name;
            if (!charName) return null;
            const config = selections[charName] || { selected: false, allowRepeat: true, timeStart: busTimeStart, timeEnd: busTimeEnd };

            return (
              <div
                key={charName}
                onClick={() => {
                  setSelections(prev => ({
                    ...prev,
                    [charName]: { ...config, selected: !config.selected }
                  }));
                }}
                className={`p-3 rounded-xl border transition flex items-center justify-between gap-3 cursor-pointer ${
                  config.selected
                    ? "bg-[var(--inner-box)] border-[var(--accent)] shadow-sm"
                    : "bg-[var(--panel)] border-[var(--panel-border)] opacity-60 hover:opacity-100"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <input
                    type="checkbox"
                    checked={config.selected}
                    onChange={() => {}}
                    className="w-4 h-4 accent-[var(--accent)] rounded cursor-pointer shrink-0"
                  />
                  <ClassIcon job={char.job || "전사"} className="w-7 h-7 shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-black text-xs sm:text-sm text-[var(--text-main)] truncate">
                        {charName}
                      </span>
                      {char.is_main && (
                        <span className="px-1.5 py-0.2 bg-[var(--accent)] text-[var(--accent-fg)] font-black text-[9px] rounded shrink-0">
                          대표
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] sm:text-[11px] text-[var(--text-sub)] font-bold mt-0.5">
                      <span>{char.job || "전사"}</span>
                      <span>•</span>
                      <span className="text-[var(--text-main)]">⚔️ {Number(char.combat_power || 0).toLocaleString()}</span>
                      <span>•</span>
                      <span className="text-purple-400">🔮 {Number(char.magic_resistance || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {config.selected && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelections(prev => ({
                        ...prev,
                        [charName]: { ...config, allowRepeat: !config.allowRepeat }
                      }));
                    }}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-black border transition shrink-0 cursor-pointer ${
                      config.allowRepeat
                        ? "bg-amber-500/20 text-amber-400 border-amber-500/50"
                        : "bg-zinc-800 text-zinc-400 border-zinc-700"
                    }`}
                  >
                    {config.allowRepeat ? "🔄 반복 가능" : "1️⃣ 1회성"}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* 모달 하단 푸터 액션 */}
        <div className="p-4 border-t border-[var(--panel-border)] bg-[var(--inner-box)] flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 bg-[var(--panel)] border border-[var(--panel-border)] text-[var(--text-sub)] font-bold text-xs rounded-xl hover:text-white transition cursor-pointer"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="flex-2 py-3 bg-[var(--accent)] text-[var(--accent-fg)] font-black text-xs rounded-xl shadow-lg hover:opacity-90 transition cursor-pointer"
          >
            선택 캐릭터 버스 탑승 신청 ({selectedCount}개)
          </button>
        </div>

      </div>
    </div>
  );
}