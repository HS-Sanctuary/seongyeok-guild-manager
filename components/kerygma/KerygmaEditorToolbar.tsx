"use client";

import { useState } from "react";
import { PollData } from "@/types/kerygma";

const FONT_SIZES = [12, 14, 16, 18, 20, 24, 28, 32];
const LINE_HEIGHTS = [1.1, 1.3, 1.5, 1.7, 1.9, 2.1];
const SPECIAL_CHARS = [
  "★", "☆", "♥", "♡", "♠", "♤", "♣", "♧",
  "●", "○", "■", "□", "▲", "△", "▼", "▽", "◆", "◇",
  "◎", "◈", "▣", "◐", "◑", "▒", "▤", "▥", "▨", "▧", "▦", "▩",
  "→", "←", "↑", "↓", "↔", "↕", "↗", "↙", "↖", "↘",
  "⇒", "⇔", "✓", "✔", "✕", "✖", "✗", "✘",
  "©", "®", "™", "±", "×", "÷", "≠", "≤", "≥", "∞", "∴", "∵",
  "½", "⅓", "⅔", "¼", "¾", "⅛", "⅜", "⅝", "⅞",
  "℃", "℉", "㎎", "㎏", "㎜", "㎝", "㎞", "㎡", "㎥", "㏄",
  "Ω", "i", "A", "É", "—", "€", "£", "¥"
];

interface KerygmaEditorToolbarProps {
  executeCommand: (command: string, value?: string) => void;
  insertCustomHTML: (html: string) => void;
  applyFontSize: (sz: number) => void;
  applyLineHeight: (lh: number) => void;
  insertHeadingBlock: (type: string) => void;
  handleTableInsert: (rows: number, cols: number) => void;
  pendingPoll: PollData | null;
  onOpenPollModal: () => void;
  activePopover: "fontSize" | "lineHeight" | "table" | "symbol" | "heading" | null;
  setActivePopover: (popover: "fontSize" | "lineHeight" | "table" | "symbol" | "heading" | null) => void;
}

export default function KerygmaEditorToolbar({
  executeCommand,
  insertCustomHTML,
  applyFontSize,
  applyLineHeight,
  insertHeadingBlock,
  handleTableInsert,
  pendingPoll,
  onOpenPollModal,
  activePopover,
  setActivePopover,
}: KerygmaEditorToolbarProps) {
  const [tableGrid, setTableGrid] = useState({ r: 0, c: 0 });

  return (
    <div
      className="flex items-center flex-wrap gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 bg-[var(--inner-box)] text-[var(--text-main)] shrink-0 border-b border-[var(--panel-border)] relative z-20 overflow-visible"
      onMouseDown={(e) => e.preventDefault()}
    >
      <div className="flex items-center gap-1 shrink-0 flex-nowrap">
        {/* 서식 버튼 그룹 */}
        <div className="flex items-center bg-[var(--panel)] border border-[var(--panel-border)] rounded-lg overflow-hidden shrink-0">
          <button
            type="button"
            onClick={() => executeCommand("bold")}
            className="w-7 h-7 font-serif font-black hover:bg-[var(--panel-hover)] transition text-[0.75rem] cursor-pointer text-[var(--text-main)]"
            title="굵게"
          >
            B
          </button>
          <button
            type="button"
            onClick={() => executeCommand("italic")}
            className="w-7 h-7 font-serif italic hover:bg-[var(--panel-hover)] transition border-l border-[var(--panel-border)] text-[0.75rem] cursor-pointer text-[var(--text-main)]"
            title="기울임"
          >
            i
          </button>
          <button
            type="button"
            onClick={() => executeCommand("underline")}
            className="w-7 h-7 font-serif underline hover:bg-[var(--panel-hover)] transition border-l border-[var(--panel-border)] text-[0.75rem] cursor-pointer text-[var(--text-main)]"
            title="밑줄"
          >
            U
          </button>
          <button
            type="button"
            onClick={() => executeCommand("strikeThrough")}
            className="w-7 h-7 font-serif line-through hover:bg-[var(--panel-hover)] transition border-l border-[var(--panel-border)] text-[0.75rem] cursor-pointer text-[var(--text-main)]"
            title="취소선"
          >
            S
          </button>
        </div>

        {/* 정렬 버튼 그룹 */}
        <div className="flex items-center bg-[var(--panel)] border border-[var(--panel-border)] rounded-lg overflow-hidden shrink-0">
          <button
            type="button"
            onClick={() => executeCommand("justifyLeft")}
            className="w-7 h-7 hover:bg-[var(--panel-hover)] transition text-[0.65rem] font-bold cursor-pointer flex items-center justify-center text-[var(--text-main)]"
            title="좌측 정렬"
          >
            좌
          </button>
          <button
            type="button"
            onClick={() => executeCommand("justifyCenter")}
            className="w-7 h-7 hover:bg-[var(--panel-hover)] transition border-l border-[var(--panel-border)] text-[0.65rem] font-bold cursor-pointer flex items-center justify-center text-[var(--text-main)]"
            title="중앙 정렬"
          >
            중
          </button>
          <button
            type="button"
            onClick={() => executeCommand("justifyRight")}
            className="w-7 h-7 hover:bg-[var(--panel-hover)] transition border-l border-[var(--panel-border)] text-[0.65rem] font-bold cursor-pointer flex items-center justify-center text-[var(--text-main)]"
            title="우측 정렬"
          >
            우
          </button>
          <button
            type="button"
            onClick={() => executeCommand("justifyFull")}
            className="w-7 h-7 hover:bg-[var(--panel-hover)] transition border-l border-[var(--panel-border)] text-[0.65rem] font-bold cursor-pointer flex items-center justify-center text-[var(--text-main)]"
            title="양쪽 정렬"
          >
            양쪽
          </button>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0 flex-nowrap relative z-30">
        {/* 헤더 선택 드롭다운 */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() =>
              setActivePopover(activePopover === "heading" ? null : "heading")
            }
            className="flex items-center gap-0.5 px-2 h-7 bg-[var(--panel)] border border-[var(--panel-border)] rounded-lg text-[11px] sm:text-[0.7rem] font-bold cursor-pointer text-[var(--accent)] hover:bg-[var(--panel-hover)] transition"
          >
            <span>헤더</span> <span className="text-[0.55rem]">▼</span>
          </button>
          {activePopover === "heading" && (
            <div className="absolute top-full mt-1 left-0 bg-[var(--panel)] border border-[var(--panel-border)] rounded-xl shadow-2xl w-[210px] p-2 flex flex-col gap-1 z-50 max-h-[300px] overflow-y-auto custom-scrollbar">
              <div className="text-[0.65rem] font-bold text-[var(--text-sub)] px-2 py-1 border-b border-[var(--panel-border)]">
                숫자 계층
              </div>
              <button
                type="button"
                onClick={() => insertHeadingBlock("num-l1")}
                className="text-left px-2 py-1.5 text-[0.75rem] hover:bg-[var(--inner-box)] text-[var(--text-main)] font-bold rounded-lg cursor-pointer"
              >
                1. 대제목
              </button>
              <button
                type="button"
                onClick={() => insertHeadingBlock("num-l2")}
                className="text-left px-2 py-1 text-[0.72rem] hover:bg-[var(--inner-box)] text-[var(--accent)] font-semibold rounded-lg pl-4 cursor-pointer"
              >
                (1) 중제목
              </button>
              <button
                type="button"
                onClick={() => insertHeadingBlock("num-l3")}
                className="text-left px-2 py-1 text-[0.7rem] hover:bg-[var(--inner-box)] text-[var(--text-sub)] rounded-lg pl-6 cursor-pointer"
              >
                [1] 소제목
              </button>

              <div className="text-[0.65rem] font-bold text-[var(--text-sub)] px-2 py-1 border-b border-[var(--panel-border)] mt-1">
                알파벳 계층
              </div>
              <button
                type="button"
                onClick={() => insertHeadingBlock("alpha-l1")}
                className="text-left px-2 py-1.5 text-[0.75rem] hover:bg-[var(--inner-box)] text-[var(--text-main)] font-bold rounded-lg cursor-pointer"
              >
                A. 대제목
              </button>
              <button
                type="button"
                onClick={() => insertHeadingBlock("alpha-l2")}
                className="text-left px-2 py-1 text-[0.72rem] hover:bg-[var(--inner-box)] text-[var(--accent)] font-semibold rounded-lg pl-4 cursor-pointer"
              >
                (A) 중제목
              </button>
              <button
                type="button"
                onClick={() => insertHeadingBlock("alpha-l3")}
                className="text-left px-2 py-1 text-[0.7rem] hover:bg-[var(--inner-box)] text-[var(--text-sub)] rounded-lg pl-6 cursor-pointer"
              >
                [A] 소제목
              </button>

              <div className="text-[0.65rem] font-bold text-[var(--text-sub)] px-2 py-1 border-b border-[var(--panel-border)] mt-1">
                기호 계층
              </div>
              <button
                type="button"
                onClick={() => insertHeadingBlock("sym-l1")}
                className="text-left px-2 py-1.5 text-[0.75rem] hover:bg-[var(--inner-box)] text-[var(--text-main)] font-bold rounded-lg cursor-pointer"
              >
                ◆ 1단계 대제목
              </button>
              <button
                type="button"
                onClick={() => insertHeadingBlock("sym-l2")}
                className="text-left px-2 py-1 text-[0.72rem] hover:bg-[var(--inner-box)] text-[var(--accent)] font-semibold rounded-lg pl-3 cursor-pointer"
              >
                ■ 2단계 중제목
              </button>
              <button
                type="button"
                onClick={() => insertHeadingBlock("sym-l3")}
                className="text-left px-2 py-1 text-[0.7rem] hover:bg-[var(--inner-box)] text-[var(--text-main)] rounded-lg pl-5 cursor-pointer"
              >
                ◈ 3단계 소제목
              </button>
            </div>
          )}
        </div>

        {/* 폰트 크기 드롭다운 */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() =>
              setActivePopover(activePopover === "fontSize" ? null : "fontSize")
            }
            className="flex items-center gap-0.5 px-2 h-7 bg-[var(--panel)] border border-[var(--panel-border)] text-[var(--text-main)] hover:bg-[var(--panel-hover)] rounded-lg text-[11px] sm:text-[0.7rem] font-bold cursor-pointer transition"
          >
            크기 <span className="text-[0.55rem]">▼</span>
          </button>
          {activePopover === "fontSize" && (
            <div className="absolute top-full mt-1 left-0 bg-[var(--panel)] border border-[var(--panel-border)] rounded-xl shadow-2xl w-16 max-h-40 overflow-y-auto flex flex-col py-1 z-50 custom-scrollbar">
              {FONT_SIZES.map((sz: number) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => applyFontSize(sz)}
                  className="text-left px-2.5 py-1 text-[0.7rem] hover:bg-[var(--inner-box)] text-[var(--text-main)] cursor-pointer"
                >
                  {sz}px
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 줄간격 드롭다운 */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() =>
              setActivePopover(activePopover === "lineHeight" ? null : "lineHeight")
            }
            className="flex items-center gap-0.5 px-2 h-7 bg-[var(--panel)] border border-[var(--panel-border)] text-[var(--text-main)] hover:bg-[var(--panel-hover)] rounded-lg text-[11px] sm:text-[0.7rem] font-bold cursor-pointer transition"
          >
            간격 <span className="text-[0.55rem]">▼</span>
          </button>
          {activePopover === "lineHeight" && (
            <div className="absolute top-full mt-1 left-0 bg-[var(--panel)] border border-[var(--panel-border)] rounded-xl shadow-2xl w-16 flex flex-col py-1 z-50">
              {LINE_HEIGHTS.map((lh: number) => (
                <button
                  key={lh}
                  type="button"
                  onClick={() => applyLineHeight(lh)}
                  className="text-left px-2.5 py-1 text-[0.7rem] hover:bg-[var(--inner-box)] text-[var(--text-main)] cursor-pointer"
                >
                  {lh}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 표 생성 그리드 드롭다운 */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() =>
              setActivePopover(activePopover === "table" ? null : "table")
            }
            className="flex items-center gap-0.5 px-2 h-7 bg-[var(--panel)] border border-[var(--panel-border)] text-[var(--text-main)] hover:bg-[var(--panel-hover)] rounded-lg text-[11px] sm:text-[0.7rem] font-bold cursor-pointer transition"
          >
            <span>표</span>
            <span className="text-[0.55rem]">▼</span>
          </button>

          {activePopover === "table" && (
            <div className="absolute top-full mt-1 left-0 bg-[var(--panel)] border border-[var(--panel-border)] rounded-xl shadow-2xl p-3 z-50 flex flex-col items-center w-[210px]">
              <span className="text-[0.68rem] font-bold text-[var(--accent)] mb-1.5">
                표 생성 {tableGrid.r > 0 ? `(${tableGrid.r}행 ${tableGrid.c}열)` : ""}
              </span>
              <div
                className="grid grid-cols-10 gap-0.5"
                onMouseLeave={() => setTableGrid({ r: 0, c: 0 })}
              >
                {Array.from({ length: 10 }).map((_, r) =>
                  Array.from({ length: 10 }).map((_, c) => (
                    <div
                      key={`${r}-${c}`}
                      onMouseEnter={() => setTableGrid({ r: r + 1, c: c + 1 })}
                      onClick={() => handleTableInsert(r + 1, c + 1)}
                      className={`w-3.5 h-3.5 border cursor-pointer transition ${
                        r < tableGrid.r && c < tableGrid.c
                          ? "bg-[var(--accent)]/40 border-[var(--accent)]"
                          : "border-[var(--panel-border)] bg-[var(--inner-box)]"
                      }`}
                    />
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* 특수문자 드롭다운 */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() =>
              setActivePopover(activePopover === "symbol" ? null : "symbol")
            }
            className="flex items-center justify-center px-2 h-7 bg-[var(--panel)] border border-[var(--panel-border)] text-[var(--text-main)] hover:bg-[var(--panel-hover)] rounded-lg text-[11px] sm:text-[0.7rem] font-bold cursor-pointer transition"
            title="특수문자 삽입"
          >
            특문
          </button>
          {activePopover === "symbol" && (
            <div className="absolute top-full mt-1 left-0 bg-[var(--panel)] border border-[var(--panel-border)] rounded-xl shadow-2xl w-[260px] p-2 z-50 grid grid-cols-10 gap-1 h-48 overflow-y-auto custom-scrollbar">
              {SPECIAL_CHARS.map((char) => (
                <button
                  key={char}
                  type="button"
                  onClick={() => insertCustomHTML(char)}
                  className="w-5 h-5 flex items-center justify-center bg-[var(--inner-box)] border border-[var(--panel-border)] hover:bg-[var(--panel-hover)] hover:border-[var(--accent)] rounded text-[0.75rem] text-[var(--text-main)] cursor-pointer transition"
                >
                  {char}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 투표 첨부 버튼 */}
        <button
          type="button"
          onClick={onOpenPollModal}
          className={`flex items-center gap-1 px-2.5 h-7 border rounded-lg text-[11px] sm:text-[0.7rem] font-bold cursor-pointer shrink-0 transition ${
            pendingPoll
              ? "bg-[var(--accent)]/15 border-[var(--accent)] text-[var(--accent)] shadow-xs"
              : "bg-[var(--panel)] border-[var(--panel-border)] text-[var(--text-main)] hover:bg-[var(--panel-hover)] hover:border-[var(--accent)]"
          }`}
        >
          <span>투표</span>
          {pendingPoll && (
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
          )}
        </button>
      </div>
    </div>
  );
}