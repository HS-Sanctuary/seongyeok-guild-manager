"use client";

import React, { useEffect } from "react";
import ClassIcon from "@/components/common/ClassIcon";

interface GuildBusAccountDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountName: string;
  characters: any[];
  allCharactersMap: Record<string, any>;
}

export default function GuildBusAccountDetailModal({
  isOpen,
  onClose,
  accountName,
  characters,
  allCharactersMap,
}: GuildBusAccountDetailModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 cursor-pointer"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg rounded-2xl bg-[var(--panel)] border border-[var(--panel-border)] p-6 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* 상단 헤더 */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--panel-border)] mb-4">
          <div>
            <h2 className="text-lg font-black text-[var(--text-main)]">
              {accountName} 계정 참여 현황
            </h2>
            <span className="text-sm text-[var(--accent)] font-bold">
              총 {characters.length}개 캐릭터 버스 동반 탑승 중
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--text-sub)] hover:text-[var(--text-main)] text-sm font-bold px-3 py-1.5 rounded-xl bg-[var(--inner-box)] border border-[var(--panel-border)] cursor-pointer transition-colors"
          >
            ✕ 닫기
          </button>
        </div>

        {/* 캐릭터 상세 스펙 리스트 */}
        <div className="space-y-3 max-h-[55vh] overflow-y-auto custom-scrollbar pr-1 mb-5">
          {characters.map((m, idx) => {
            const charName = (m.name || m.character_name) as string;
            const charObj = allCharactersMap[charName] || m.charObj || {};
            
            const job = (charObj.job || m.job || "전사") as string;
            const role = (charObj.role || m.role || "딜러") as string;
            const combatPower = Number(charObj.combat_power || m.combat_power || 0);
            const magicResistance = Number(charObj.magic_resistance || m.magic_resistance || 0);

            return (
              <div 
                key={idx}
                className="bg-[var(--inner-box)] border border-[var(--panel-border)] rounded-xl p-4 flex items-center justify-between gap-4 shadow-xs"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-9 h-9 rounded-lg overflow-hidden bg-[var(--panel)] flex items-center justify-center border border-[var(--panel-border)] shrink-0">
                    <ClassIcon job={job} className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex flex-col justify-center">
                    <div className="text-base font-black text-[var(--text-main)] truncate flex items-center gap-2">
                      <span>{charName}</span>
                      {m.allow_repeat && (
                        <span className="text-xs px-2 py-0.5 rounded-md bg-[var(--accent)]/15 text-[var(--accent)] font-bold border border-[var(--accent)]/30" title="반복 참여 용병">
                          🔄 용병
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-[var(--text-sub)] font-semibold flex items-center gap-1.5 mt-0.5">
                      <span className="text-[var(--accent)] font-bold">{role}</span>
                      <span className="opacity-40">/</span>
                      <span>{job}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1 shrink-0 font-mono text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-[var(--text-sub)] text-xs">⚔️ 전투력</span>
                    <strong className="text-[var(--text-main)] font-black text-base">{combatPower.toLocaleString()}</strong>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[var(--text-sub)] text-xs">🔮 마도저항</span>
                    <strong className="text-[var(--text-main)] font-black text-base">{magicResistance.toLocaleString()}</strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 확인 버튼 */}
        <div className="flex justify-end pt-2 border-t border-[var(--panel-border)]">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3.5 text-base font-bold bg-[var(--accent)] text-[var(--accent-fg)] hover:opacity-90 rounded-xl shadow-md transition-all cursor-pointer"
          >
            확인 완료
          </button>
        </div>

      </div>
    </div>
  );
}