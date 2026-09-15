"use client";

export default function KerygmaHeader() {
  return (
    <header className="bg-[var(--panel)] border border-[var(--panel-border)] rounded-xl p-4 md:px-5 md:py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 relative overflow-hidden border-l-4 border-l-[var(--accent)] shadow-sm">
      <div className="flex flex-col">
        <h1 className="text-xl md:text-2xl font-black tracking-tight text-[var(--text-main)] leading-none">
          KERYGMA
        </h1>
        <p className="text-[0.75rem] font-semibold text-[var(--accent)] mt-1.5">
          케리그마 : 길드 공지사항
        </p>
      </div>
      <div className="flex items-start sm:items-center gap-2 px-3 py-2 rounded-lg bg-[var(--inner-box)] border border-[var(--panel-border)] text-[0.7rem] text-[var(--text-sub)] max-w-xl">
        <span className="shrink-0 text-base mt-0.5 sm:mt-0">📢</span>
        <div className="flex flex-col leading-snug break-words">
          <span>케리그마는 고대 그리스어로 '선포'와 '공표'를 뜻하는 말입니다.</span>
          <span className="text-[var(--accent)] font-medium">
            성역의 소식과 뜻이 가장 먼저 울려 퍼지는 공간입니다.
          </span>
        </div>
      </div>
    </header>
  );
}