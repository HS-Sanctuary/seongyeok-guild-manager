"use client";

export type OwnedCharacter = {
  nickname: string;
  job?: string | null;
  alias?: string | null;
};

type Props = {
  characters: OwnedCharacter[];
  selectedNickname: string;
  onSelect: (nickname: string) => void;
};

export default function OwnedCharacterPicker({ characters, selectedNickname, onSelect }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-1.5 md:gap-2 w-full">
      {characters.map((char) => {
        const selected = char.nickname === selectedNickname;
        return (
          <button
            key={char.nickname}
            type="button"
            aria-pressed={selected}
            onClick={() => onSelect(char.nickname)}
            className={`flex flex-col items-center justify-center gap-0.5 p-2 rounded-lg border transition cursor-pointer select-none w-full min-w-0 ${selected ? "bg-[var(--accent-soft)] border-[var(--accent)] shadow-xs" : "bg-[var(--inner-box)] border-[var(--panel-border)] hover:border-[var(--accent)]"}`}
          >
            <span className={`text-xs font-black text-center w-full break-keep [overflow-wrap:anywhere] ${selected ? "text-[var(--accent)]" : "text-[var(--text-main)]"}`}>{char.nickname}</span>
            <span className="text-xs text-[var(--text-sub)] font-bold text-center break-keep">{char.job || "전사"}</span>
          </button>
        );
      })}
    </div>
  );
}
