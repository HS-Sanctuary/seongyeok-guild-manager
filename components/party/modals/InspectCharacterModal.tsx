"use client";

import ClassIcon from "@/components/common/ClassIcon";

interface InspectCharacterModalProps {
  inspectCharacter: any;
  setInspectCharacter: (val: any) => void;
}

export default function InspectCharacterModal({
  inspectCharacter,
  setInspectCharacter,
}: InspectCharacterModalProps) {
  if (!inspectCharacter) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer overscroll-none"
      onClick={() => setInspectCharacter(null)}
    >
      <div 
        className="bg-[var(--panel)] border border-[var(--panel-border)] rounded-2xl p-5 sm:p-6 max-w-xs w-full space-y-4 shadow-2xl animate-in fade-in zoom-in-95 text-center cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center gap-2">
          <ClassIcon job={inspectCharacter.job} className="w-12 h-12" />
          <h3 className="font-black text-base text-[var(--text-main)]">
            {inspectCharacter.nickname || inspectCharacter.name}
          </h3>
          <p className="text-xs text-[var(--accent)] font-bold">{inspectCharacter.job || "직업 정보 없음"}</p>
        </div>

        <div className="bg-[var(--inner-box)] p-3 rounded-xl border border-[var(--panel-border)] space-y-1.5 text-xs text-[var(--text-sub)]">
          <div className="flex justify-between">
            <span>⚔️ 전투력</span>
            <strong className="text-[var(--text-main)]">{inspectCharacter.combat_power?.toLocaleString() || 0}</strong>
          </div>
          <div className="flex justify-between">
            <span>🔮 마법 저항력</span>
            <strong className="text-purple-400">{inspectCharacter.magic_resistance?.toLocaleString() || 0}</strong>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setInspectCharacter(null)}
          className="w-full py-2 bg-[var(--inner-box)] border border-[var(--panel-border)] text-[var(--text-main)] font-bold text-xs rounded-xl cursor-pointer"
        >
          닫기
        </button>
      </div>
    </div>
  );
}