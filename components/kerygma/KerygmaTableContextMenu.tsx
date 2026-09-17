"use client";

const CELL_BG_COLORS = [
  { name: "투명", value: "transparent", border: "var(--panel-border)" },
  { name: "골드", value: "rgba(212, 175, 55, 0.25)", border: "#d4af37" },
  { name: "블루", value: "rgba(52, 152, 219, 0.25)", border: "#3498db" },
  { name: "레드", value: "rgba(231, 76, 60, 0.25)", border: "#e74c3c" },
  { name: "그린", value: "rgba(46, 204, 113, 0.25)", border: "#2ecc71" },
  { name: "퍼플", value: "rgba(155, 89, 182, 0.25)", border: "#9b59b6" },
  { name: "그레이", value: "rgba(255, 255, 255, 0.12)", border: "#888" },
  { name: "블랙", value: "rgba(0, 0, 0, 0.6)", border: "var(--panel-border)" },
];

interface ContextMenuState {
  x: number;
  y: number;
  cell: HTMLTableCellElement;
}

interface KerygmaTableContextMenuProps {
  contextMenu: ContextMenuState;
  applyTableWidth: (cell: HTMLTableCellElement, widthVal: string) => void;
  applyTableAlign: (cell: HTMLTableCellElement, align: "left" | "center" | "right") => void;
  applyCellBgColor: (cell: HTMLTableCellElement, color: string) => void;
  insertRow: (cell: HTMLTableCellElement, position: "above" | "below") => void;
  insertColumn: (cell: HTMLTableCellElement, position: "left" | "right") => void;
  deleteRow: (cell: HTMLTableCellElement) => void;
  deleteColumn: (cell: HTMLTableCellElement) => void;
  deleteTable: (cell: HTMLTableCellElement) => void;
}

export default function KerygmaTableContextMenu({
  contextMenu,
  applyTableWidth,
  applyTableAlign,
  applyCellBgColor,
  insertRow,
  insertColumn,
  deleteRow,
  deleteColumn,
  deleteTable,
}: KerygmaTableContextMenuProps) {
  return (
    <div
      className="fixed bg-[var(--panel)] border border-[var(--panel-border)] shadow-2xl rounded-2xl p-3 min-w-[240px] z-[9999] text-[var(--text-main)] flex flex-col gap-2 text-[0.75rem]"
      style={{
        top: Math.min(contextMenu.y, window.innerHeight - 400),
        left: Math.min(contextMenu.x, window.innerWidth - 250),
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex flex-col gap-1.5">
        <span className="text-[0.65rem] font-bold text-[var(--accent)]">
          표 크기 & 배치
        </span>
        <div className="flex items-center justify-between text-[0.65rem] gap-1">
          <span className="text-[var(--text-sub)]">너비:</span>
          <div className="flex gap-1">
            {[
              { label: "100%", val: "100%" },
              { label: "75%", val: "75%" },
              { label: "360px", val: "360px" },
              { label: "자동", val: "auto" },
            ].map((w) => (
              <button
                key={w.label}
                type="button"
                onClick={() => applyTableWidth(contextMenu.cell, w.val)}
                className="px-1.5 py-0.5 bg-[var(--inner-box)] border border-[var(--panel-border)] hover:border-[var(--accent)] hover:text-[var(--accent)] text-[var(--text-main)] rounded cursor-pointer transition"
              >
                {w.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between text-[0.65rem] gap-1">
          <span className="text-[var(--text-sub)]">정렬:</span>
          <div className="flex gap-1">
            {[
              { label: "좌측", val: "left" },
              { label: "중앙", val: "center" },
              { label: "우측", val: "right" },
            ].map((a) => (
              <button
                key={a.label}
                type="button"
                onClick={() => applyTableAlign(contextMenu.cell, a.val as any)}
                className="px-2 py-0.5 bg-[var(--inner-box)] border border-[var(--panel-border)] hover:border-[var(--accent)] hover:text-[var(--accent)] text-[var(--text-main)] rounded cursor-pointer transition"
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="h-[1px] bg-[var(--panel-border)] my-0.5" />

      <div className="flex flex-col gap-1.5">
        <span className="text-[0.65rem] font-bold text-[var(--text-sub)]">
          셀 배경색
        </span>
        <div className="grid grid-cols-4 gap-1.5">
          {CELL_BG_COLORS.map((c) => (
            <button
              key={c.name}
              type="button"
              onClick={() => applyCellBgColor(contextMenu.cell, c.value)}
              className="flex items-center justify-center gap-1 py-1 px-1 bg-[var(--inner-box)] border hover:border-[var(--accent)] rounded text-[0.63rem] text-[var(--text-main)] cursor-pointer transition"
              style={{ borderColor: c.border }}
            >
              <span
                className="w-2.5 h-2.5 rounded-full border border-[var(--panel-border)] inline-block shrink-0"
                style={{ backgroundColor: c.value }}
              />
              <span>{c.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="h-[1px] bg-[var(--panel-border)] my-0.5" />

      <div className="flex flex-col gap-1">
        <span className="text-[0.65rem] font-bold text-[var(--text-sub)]">
          행 / 열 추가
        </span>
        <div className="grid grid-cols-2 gap-1">
          <button
            type="button"
            onClick={() => insertRow(contextMenu.cell, "above")}
            className="px-2 py-1 bg-[var(--inner-box)] border border-[var(--panel-border)] hover:bg-[var(--panel-hover)] rounded text-left cursor-pointer transition"
          >
            위로 행 삽입
          </button>
          <button
            type="button"
            onClick={() => insertRow(contextMenu.cell, "below")}
            className="px-2 py-1 bg-[var(--inner-box)] border border-[var(--panel-border)] hover:bg-[var(--panel-hover)] rounded text-left cursor-pointer transition"
          >
            아래 행 삽입
          </button>
          <button
            type="button"
            onClick={() => insertColumn(contextMenu.cell, "left")}
            className="px-2 py-1 bg-[var(--inner-box)] border border-[var(--panel-border)] hover:bg-[var(--panel-hover)] rounded text-left cursor-pointer transition"
          >
            좌측 열 삽입
          </button>
          <button
            type="button"
            onClick={() => insertColumn(contextMenu.cell, "right")}
            className="px-2 py-1 bg-[var(--inner-box)] border border-[var(--panel-border)] hover:bg-[var(--panel-hover)] rounded text-left cursor-pointer transition"
          >
            우측 열 삽입
          </button>
        </div>
      </div>

      <div className="h-[1px] bg-[var(--panel-border)] my-0.5" />

      <div className="flex flex-col gap-1 text-[0.7rem]">
        <button
          type="button"
          onClick={() => deleteRow(contextMenu.cell)}
          className="px-2 py-1 bg-red-950/40 border border-red-800/60 hover:bg-red-900/60 text-red-300 rounded cursor-pointer flex-1 transition"
        >
          행 삭제
        </button>
        <button
          type="button"
          onClick={() => deleteColumn(contextMenu.cell)}
          className="px-2 py-1 bg-red-950/40 border border-red-800/60 hover:bg-red-900/60 text-red-300 rounded cursor-pointer flex-1 transition"
        >
          열 삭제
        </button>
        <button
          type="button"
          onClick={() => deleteTable(contextMenu.cell)}
          className="px-2 py-1 bg-red-600 border border-red-500 hover:bg-red-700 text-white rounded cursor-pointer flex-1 font-bold transition"
        >
          표 삭제
        </button>
      </div>
    </div>
  );
}