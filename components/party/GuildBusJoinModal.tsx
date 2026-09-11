"use client";

import { useState, useEffect, useMemo } from "react";
import ClassIcon from "@/components/common/ClassIcon";
import MarkIcon from "@/components/common/MarkIcon";
import CustomTimePicker from "@/components/party/CustomTimePicker";

interface BusJoinCharConfig {
  selected: boolean;
  allowRepeat: boolean;
}

interface GuildBusJoinModalProps {
  isOpen: boolean;
  onClose: () => void;
  myCharacters: any[];
  onSubmit: (
    selectedData: {
      characterId: string;
      name: string;
      job: string;
      combat_power: number;
      magic_resistance: number;
      allowRepeat: boolean;
      timeStart: string;
      timeEnd: string;
    }[]
  ) => void;
  contentName: string;
  difficulty: string;
  busTimeStart?: string;
  busTimeEnd?: string;
}

const cleanContentName = (name: string) => {
  if (!name) return "";
  return name
    .replace(/^(어비스|레이드)\s*-\s*/, "")
    .replace(/\s*\(통합\)/g, "")
    .trim();
};

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
  const [joinTimeStart, setJoinTimeStart] = useState<string>(busTimeStart);
  const [joinTimeEnd, setJoinTimeEnd] = useState<string>(busTimeEnd);
  
  // 💡 상단 설명 아코디언 토글 상태
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);

  // 🛡️ [방어 아키텍처] 닉네임/이름/ID 통합 키 사용으로 중복 캐릭터 제거
  const uniqueCharacters = useMemo(() => {
    const map = new Map();
    (myCharacters || []).forEach((c) => {
      const charKey = c.nickname || c.name || String(c.id);
      if (charKey && !map.has(charKey)) {
        map.set(charKey, c);
      }
    });
    return Array.from(map.values()) as any[];
  }, [myCharacters]);

  // 🛡️ [완벽 스크롤 차단]
  useEffect(() => {
    if (!isOpen) return;

    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalBodyTouchAction = document.body.style.touchAction;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    document.body.style.touchAction = "none";

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.body.style.touchAction = originalBodyTouchAction;
    };
  }, [isOpen]);

  // 🔑 [상태 보존 및 초기화 - 반복 기본값 true 보장]
  useEffect(() => {
    if (isOpen) {
      setJoinTimeStart(busTimeStart);
      setJoinTimeEnd(busTimeEnd);

      setSelections((prev) => {
        if (Object.keys(prev).length === 0) {
          const initial: Record<string, BusJoinCharConfig> = {};
          uniqueCharacters.forEach((c, idx) => {
            const charKey = c.nickname || c.name || String(c.id);
            if (!charKey) return;
            initial[charKey] = {
              selected: idx === 0,
              allowRepeat: true, // 🔄 기본값 반복 가능(true) 설정
            };
          });
          return initial;
        } else {
          const updated = { ...prev };
          uniqueCharacters.forEach((c) => {
            const charKey = c.nickname || c.name || String(c.id);
            if (charKey && !updated[charKey]) {
              updated[charKey] = {
                selected: false,
                allowRepeat: true, // 🔄 신규 추가 캐릭터도 기본 반복 가능(true)
              };
            }
          });
          return updated;
        }
      });
    }
  }, [isOpen, busTimeStart, busTimeEnd, uniqueCharacters]);

  const totalCount = uniqueCharacters.length;
  const selectedCount = Object.values(selections).filter((s) => s.selected).length;
  const isAllSelected = totalCount > 0 && selectedCount === totalCount;

  const isAllRepeat = useMemo(() => {
    const selectedKeys = Object.keys(selections).filter((k) => selections[k]?.selected);
    if (selectedKeys.length === 0) return true;
    return selectedKeys.every((k) => selections[k]?.allowRepeat === true);
  }, [selections]);

  const isScheduleNextDay = useMemo(() => {
    if (!joinTimeStart || !joinTimeEnd) return false;
    const [sH, sM] = joinTimeStart.split(":").map(Number);
    const [eH, eM] = joinTimeEnd.split(":").map(Number);
    return eH * 60 + eM <= sH * 60 + sM;
  }, [joinTimeStart, joinTimeEnd]);

  if (!isOpen) return null;

  const handleToggleSelectAll = () => {
    const nextSelectState = !isAllSelected;
    setSelections((prev) => {
      const next = { ...prev };
      uniqueCharacters.forEach((char) => {
        const charKey = char.nickname || char.name || String(char.id);
        if (charKey) {
          next[charKey] = {
            selected: nextSelectState,
            allowRepeat: next[charKey]?.allowRepeat ?? true,
          };
        }
      });
      return next;
    });
  };

  const handleToggleBatchRepeat = () => {
    const nextRepeatState = !isAllRepeat;
    setSelections((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((k) => {
        if (next[k]?.selected) {
          next[k] = { ...next[k], allowRepeat: nextRepeatState };
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

    const payload = activeEntries.map(([charKey, config]) => {
      const targetChar = uniqueCharacters.find((c) => (c.nickname || c.name || String(c.id)) === charKey) || {};
      const charName = targetChar.nickname || targetChar.name || charKey;
      return {
        characterId: charKey,
        name: charName,
        job: targetChar.job || "전사",
        combat_power: Number(targetChar.combat_power || 0),
        magic_resistance: Number(targetChar.magic_resistance || 0),
        allowRepeat: config.allowRepeat,
        timeStart: joinTimeStart,
        timeEnd: joinTimeEnd,
      };
    });

    onSubmit(payload);
  };

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/85 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 select-none cursor-pointer overscroll-none"
      onClick={onClose}
    >
      <div
        className="bg-[var(--panel)] border border-[var(--panel-border)] rounded-2xl max-w-lg w-full flex flex-col max-h-[90vh] sm:max-h-[92vh] shadow-2xl animate-in fade-in zoom-in-95 overflow-hidden cursor-default min-w-0 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 모달 헤더 */}
        <div className="flex justify-between items-center px-4 sm:px-5 py-2.5 sm:py-3 border-b border-[var(--panel-border)] bg-[var(--inner-box)] shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <MarkIcon src="/svgs/UI mark/길드 마크.svg" size="sm" scale={1.6} colorClass="bg-[var(--accent)]" />
            <div className="min-w-0">
              <span className="text-[10px] sm:text-xs font-black text-[var(--accent)] block leading-none">
                성역 공식 길드 버스 탑승
              </span>
              <h3 className="font-black text-xs sm:text-sm text-[var(--text-main)] truncate mt-0.5 leading-tight">
                {cleanContentName(contentName)}{" "}
                <span className="text-[var(--accent)] font-bold">[{difficulty}]</span>
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--text-sub)] hover:text-white font-black text-base p-1 cursor-pointer shrink-0 ml-2"
          >
            ✕
          </button>
        </div>

        {/* 💡 안내 문구 아코디언 바 */}
        <div className="border-b border-[var(--panel-border)] bg-[var(--inner-box)]/80 shrink-0">
          <button
            type="button"
            onClick={() => setIsGuideOpen(!isGuideOpen)}
            className="w-full px-4 py-1.5 flex items-center justify-between text-[11px] font-bold text-[var(--text-sub)] hover:text-[var(--text-main)] transition cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <span>💡</span>
              <span>버스 탑승 가이드 및 이용 안내</span>
            </span>
            <span className="text-[var(--accent)] font-black text-xs">
              {isGuideOpen ? "접기 ▲" : "펼치기 ▼"}
            </span>
          </button>

          {isGuideOpen && (
            <div className="px-4 pb-2.5 pt-1 text-[11px] text-[var(--text-sub)] space-y-1 animate-in fade-in duration-150 border-t border-[var(--panel-border)]/50">
              <div className="flex items-start gap-1.5 leading-snug">
                <span className="text-[var(--accent)] shrink-0">•</span>
                <span>참여 가능 시간과 탑승할 캐릭터들을 다중 선택하세요.</span>
              </div>
              <div className="flex items-start gap-1.5 leading-snug">
                <span className="text-[var(--accent)] shrink-0">•</span>
                <span><strong className="text-[var(--accent)]">[반복 가능]</strong> 체크 시 여러 회차 파티 편성에 연속 참여됩니다.</span>
              </div>
              <div className="flex items-start gap-1.5 leading-snug">
                <span className="text-[var(--accent)] shrink-0">•</span>
                <span>완수 시 KRONOS 주간 숙제 체크리스트가 자동으로 동기화됩니다.</span>
              </div>
            </div>
          )}
        </div>

        {/* 운행 시간 및 CustomTimePicker 시간 설정 영역 */}
        <div className="p-2.5 sm:p-3.5 border-b border-[var(--panel-border)] bg-[var(--panel)] space-y-2 shrink-0">
          <div className="flex items-center justify-between gap-2 bg-[var(--inner-box)] px-3 py-1.5 rounded-xl border border-[var(--panel-border)] text-xs font-black">
            <div className="flex items-center gap-1.5 text-[var(--text-main)] shrink-0">
              <span className="text-sm">🚌</span>
              <span>운행 타임:</span>
            </div>
            <div className="text-[var(--accent)] font-mono text-xs font-black truncate">
              {busTimeStart} ~ {busTimeEnd}
            </div>
          </div>

          {/* 타임 피커 바 */}
          <div className="flex items-center justify-between gap-1.5 bg-[var(--inner-box)]/80 px-2.5 py-1.5 rounded-xl border border-[var(--panel-border)] min-w-0">
            <div className="flex items-center gap-1 flex-1 min-w-0">
              <span className="text-[10px] font-bold text-[var(--text-sub)] shrink-0">시작</span>
              <CustomTimePicker
                value={joinTimeStart}
                onChange={setJoinTimeStart}
                pickerType="start"
              />
            </div>

            <span className="text-xs font-black text-[var(--text-sub)] shrink-0 px-0.5">~</span>

            <div className="flex items-center gap-1 flex-1 min-w-0">
              <span className="text-[10px] font-bold text-[var(--text-sub)] shrink-0">종료</span>
              <CustomTimePicker
                value={joinTimeEnd}
                onChange={setJoinTimeEnd}
                pickerType="end"
                badge={
                  isScheduleNextDay ? (
                    <span className="px-1 py-0.2 rounded bg-[#1e1b4b] text-indigo-300 border border-indigo-500/40 text-[9px] font-black flex items-center gap-0.5 shrink-0 whitespace-nowrap">
                      🌙 다음날
                    </span>
                  ) : undefined
                }
              />
            </div>
          </div>

          {/* 일괄 선택 컨트롤 바 */}
          <div className="flex items-center justify-between gap-2 text-xs pt-0.5">
            <button
              type="button"
              onClick={handleToggleSelectAll}
              className={`px-3 py-1 rounded-lg font-bold text-[11px] border transition cursor-pointer whitespace-nowrap shrink-0 ${
                isAllSelected
                  ? "bg-rose-500/15 text-rose-300 border-rose-500/40 hover:bg-rose-500/25"
                  : "bg-[var(--inner-box)] border-[var(--panel-border)] text-[var(--text-main)] hover:border-[var(--accent)]"
              }`}
            >
              {isAllSelected ? "✕ 전체 해제" : "✓ 전체 선택"}
            </button>

            <button
              type="button"
              onClick={handleToggleBatchRepeat}
              className={`px-3 py-1 rounded-lg font-black text-[11px] border transition cursor-pointer whitespace-nowrap shrink-0 ${
                isAllRepeat
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/50"
                  : "bg-zinc-800 text-zinc-300 border-zinc-700 hover:text-white"
              }`}
            >
              {isAllRepeat ? "🔄 전체 반복 중" : "1️⃣ 전체 1회성 중"}
            </button>
          </div>
        </div>

        {/* 캐릭터 목록 스크롤 영역 (세로 컴팩트 카드 적용) */}
        <div className="p-2.5 sm:p-3.5 overflow-y-auto custom-scrollbar flex-1 space-y-2 overscroll-contain min-h-0">
          {uniqueCharacters.map((char) => {
            const charKey = char.nickname || char.name || String(char.id);
            if (!charKey) return null;
            const config = selections[charKey] || { selected: false, allowRepeat: true };

            return (
              <div
                key={charKey}
                onClick={() => {
                  setSelections((prev) => ({
                    ...prev,
                    [charKey]: { ...config, selected: !config.selected },
                  }));
                }}
                className={`p-2 rounded-xl border transition flex items-center justify-between gap-2 cursor-pointer select-none ${
                  config.selected
                    ? "bg-[var(--inner-box)] border-[var(--accent)] shadow-xs"
                    : "bg-[var(--panel)] border-[var(--panel-border)] opacity-60 hover:opacity-100"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <input
                    type="checkbox"
                    checked={config.selected}
                    onChange={() => {}}
                    className="w-4 h-4 accent-[var(--accent)] rounded cursor-pointer shrink-0"
                  />
                  <ClassIcon job={char.job || "전사"} className="w-7 h-7 shrink-0" />

                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-black text-xs text-[var(--text-main)] truncate max-w-[100px] sm:max-w-[140px]">
                        {char.nickname || char.name}
                      </span>
                      {char.is_main && (
                        <span className="px-1 py-0.2 bg-[var(--accent)] text-[var(--accent-fg)] font-black text-[8px] rounded shrink-0 leading-none">
                          대표
                        </span>
                      )}
                      <span className="text-[10px] text-[var(--text-sub)] font-bold">
                        ({char.job || "전사"})
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] font-black text-[var(--text-sub)] flex-wrap">
                      <span className="text-[var(--text-main)] flex items-center gap-1 shrink-0">
                        <span
                          className="w-3 h-3 bg-[var(--text-main)] shrink-0 inline-block"
                          style={{
                            maskImage: 'url("/svgs/status mark/전투력 마크.svg")',
                            WebkitMaskImage: 'url("/svgs/status mark/전투력 마크.svg")',
                            maskSize: "contain",
                            WebkitMaskSize: "contain",
                            maskRepeat: "no-repeat",
                            WebkitMaskRepeat: "no-repeat",
                            maskPosition: "center",
                            WebkitMaskPosition: "center",
                          }}
                        />
                        <span>{Number(char.combat_power || 0).toLocaleString()}</span>
                      </span>

                      <span className="text-purple-400 dark:text-purple-300 flex items-center gap-1 shrink-0">
                        <span
                          className="w-3 h-3 bg-purple-400 dark:bg-purple-300 shrink-0 inline-block"
                          style={{
                            maskImage: 'url("/svgs/status mark/마도저항 마크.svg")',
                            WebkitMaskImage: 'url("/svgs/status mark/마도저항 마크.svg")',
                            maskSize: "contain",
                            WebkitMaskSize: "contain",
                            maskRepeat: "no-repeat",
                            WebkitMaskRepeat: "no-repeat",
                            maskPosition: "center",
                            WebkitMaskPosition: "center",
                          }}
                        />
                        <span>{Number(char.magic_resistance || 0).toLocaleString()}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {config.selected && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelections((prev) => ({
                        ...prev,
                        [charKey]: { ...config, allowRepeat: !config.allowRepeat },
                      }));
                    }}
                    className={`px-2 py-1 rounded-lg text-[10px] font-black border transition shrink-0 cursor-pointer whitespace-nowrap ${
                      config.allowRepeat
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/50"
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

        {/* 모달 하단 푸터 */}
        <div className="p-3 border-t border-[var(--panel-border)] bg-[var(--inner-box)] flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 bg-[var(--panel)] border border-[var(--panel-border)] text-[var(--text-sub)] font-bold text-xs rounded-xl hover:text-white transition cursor-pointer text-center truncate"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="flex-2 py-2.5 bg-[var(--accent)] text-[var(--accent-fg)] font-black text-xs sm:text-sm rounded-xl shadow-md hover:brightness-110 transition cursor-pointer text-center truncate"
          >
            선택 캐릭터 탑승 신청 ({selectedCount}개)
          </button>
        </div>
      </div>
    </div>
  );
}