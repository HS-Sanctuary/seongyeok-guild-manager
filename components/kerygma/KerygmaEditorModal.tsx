"use client";

import { useEffect, useRef, useState } from "react";
import { CATEGORIES, LINK_ONLY_CATEGORIES, PollData } from "@/types/kerygma";
import KerygmaPollModal from "./KerygmaPollModal";

interface KerygmaEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  isMaster: boolean;
  newNotice: { type: string; title: string; content: string; link: string; isPinned: boolean };
  setNewNotice: React.Dispatch<
    React.SetStateAction<{
      type: string;
      title: string;
      content: string;
      link: string;
      isPinned: boolean;
    }>
  >;
  pendingPoll: PollData | null;
  setPendingPoll: (poll: PollData | null) => void;
  onSubmit: () => void;
  handleSaveDraft: () => void;
}

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

const FONT_SIZES = [12, 14, 16, 18, 20, 24, 28, 32];
const LINE_HEIGHTS = [1.1, 1.3, 1.5, 1.7, 1.9, 2.1];

export default function KerygmaEditorModal({
  isOpen,
  onClose,
  isMaster,
  newNotice,
  setNewNotice,
  pendingPoll,
  setPendingPoll,
  onSubmit,
  handleSaveDraft,
}: KerygmaEditorModalProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [activePopover, setActivePopover] = useState<
    "fontSize" | "lineHeight" | "textColor" | "bgColor" | "table" | "symbol" | "heading" | null
  >(null);
  const [tableGrid, setTableGrid] = useState({ r: 0, c: 0 });

  const [isPollModalOpen, setIsPollModalOpen] = useState(false);
  const [pollForm, setPollForm] = useState<PollData>({
    title: "",
    options: [
      { id: "opt-1", text: "", votes: 0, voters: [] },
      { id: "opt-2", text: "", votes: 0, voters: [] },
    ],
    allowMultiple: false,
    endDate: "1일",
    isAnonymous: false,
  });

  useEffect(() => {
    if (isOpen && editorRef.current) {
      if (editorRef.current.innerHTML !== newNotice.content) {
        editorRef.current.innerHTML = newNotice.content;
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleEditorInput = () => {
    if (editorRef.current) setNewNotice((prev) => ({ ...prev, content: editorRef.current!.innerHTML }));
  };

  const executeCommand = (command: string, value: string = "") => {
    document.execCommand("styleWithCSS", false, "true");
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleEditorInput();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if ((e.ctrlKey || e.metaKey) && ["b", "i", "u", "s"].includes(e.key.toLowerCase())) {
      e.preventDefault();
      const key = e.key.toLowerCase();
      if (key === "b") executeCommand("bold");
      if (key === "i") executeCommand("italic");
      if (key === "u") executeCommand("underline");
      if (key === "s") executeCommand("strikeThrough");
    }
  };

  const insertCustomHTML = (html: string) => {
    document.execCommand("insertHTML", false, html);
    handleEditorInput();
    setActivePopover(null);
  };

  const applyFontSize = (sz: number) => {
    executeCommand("fontSize", "7");
    const els = editorRef.current?.querySelectorAll('font[size="7"], span[style*="xxx-large"]');
    els?.forEach((el) => {
      el.removeAttribute("size");
      (el as HTMLElement).style.fontSize = `${sz}px`;
    });
    handleEditorInput();
    setActivePopover(null);
  };

  const applyLineHeight = (lh: number) => {
    const selection = window.getSelection();
    if (!selection?.rangeCount) return;
    let node = selection.focusNode;
    while (node && node !== editorRef.current) {
      if (node.nodeType === 1) {
        (node as HTMLElement).style.lineHeight = `${lh}`;
        break;
      }
      node = node.parentNode;
    }
    handleEditorInput();
    setActivePopover(null);
  };

  const handleTableInsert = (rows: number, cols: number) => {
    let html = `<table style="width: 100%; table-layout: fixed; border-collapse: collapse; margin: 12px 0; border: 1px solid var(--panel-border);"><tbody>`;
    for (let r = 0; r < rows; r++) {
      html += `<tr>`;
      for (let c = 0; c < cols; c++) {
        html += `<td style="border: 1px solid var(--panel-border); padding: 8px 12px; overflow-wrap: break-word; word-break: break-all;"><br></td>`;
      }
      html += `</tr>`;
    }
    html += `</tbody></table><p><br></p>`;
    insertCustomHTML(html);
  };

  // 계층형 제목 삽입 함수
  const insertHeadingBlock = (type: string) => {
    let html = "";
    switch (type) {
      // 1. 숫자 계층
      case "num-l1":
        html = `<div style="font-size: 20px; font-weight: 800; color: var(--text-main); margin-top: 18px; margin-bottom: 8px; border-bottom: 2px solid var(--accent); padding-bottom: 4px;">1. 대제목 제목을 입력하세요</div><p><br></p>`;
        break;
      case "num-l2":
        html = `<div style="font-size: 16px; font-weight: 700; color: var(--accent); margin-left: 12px; margin-top: 12px; margin-bottom: 6px;">(1) 중제목 내용을 입력하세요</div><p><br></p>`;
        break;
      case "num-l3":
        html = `<div style="font-size: 14.5px; font-weight: 600; color: var(--text-sub); margin-left: 24px; margin-top: 8px; margin-bottom: 4px;">[1] 소제목 항목을 입력하세요</div><p><br></p>`;
        break;

      // 2. 특수문자 계층
      case "sym-l1":
        html = `<div style="font-size: 20px; font-weight: 800; color: var(--text-main); margin-top: 18px; margin-bottom: 8px;">◆ 1단계 대제목 입력</div><p><br></p>`;
        break;
      case "sym-l2":
        html = `<div style="font-size: 16px; font-weight: 700; color: var(--accent); margin-left: 10px; margin-top: 12px; margin-bottom: 6px;">■ 2단계 중제목 입력</div><p><br></p>`;
        break;
      case "sym-l3":
        html = `<div style="font-size: 14.5px; font-weight: 600; color: var(--text-main); margin-left: 20px; margin-top: 8px; margin-bottom: 4px;">◈ 3단계 소제목 입력</div><p><br></p>`;
        break;
      case "sym-l4":
        html = `<div style="font-size: 13.5px; font-weight: 500; color: var(--text-sub); margin-left: 30px; margin-top: 6px; margin-bottom: 4px;">▣ 4단계 세부목록 입력</div><p><br></p>`;
        break;
    }
    insertCustomHTML(html);
  };

  const insertPoll = () => {
    if (!pollForm.title.trim()) return alert("투표 주제를 입력하세요.");
    const validOptions = pollForm.options.filter((o) => o.text.trim() !== "");
    if (validOptions.length < 2) return alert("선택 항목을 2개 이상 입력하세요.");

    const finalPoll: PollData = {
      ...pollForm,
      options: validOptions.map((opt, i) => ({
        ...opt,
        id: `opt-${Date.now()}-${i}`,
        votes: 0,
        voters: [],
      })),
    };
    setPendingPoll(finalPoll);
    insertCustomHTML(
      `<div class="p-3 my-3 border border-[var(--accent)]/50 rounded-lg bg-[var(--inner-box)] text-[0.8rem] font-bold">📊 [투표 삽입됨: ${finalPoll.title}]</div><p><br></p>`
    );
    setIsPollModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[var(--background)] min-h-screen animate-in fade-in duration-150 overflow-y-auto pb-16">
      <div className="max-w-[1400px] mx-auto px-4 py-5 space-y-3">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[var(--panel-border)] pb-3 gap-3">
          <h1 className="text-lg font-bold text-[var(--text-main)] flex items-center gap-2">
            <span>✏️</span>
            <span>새 공지 작성</span>
          </h1>

          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <button
              onClick={handleSaveDraft}
              className="flex-1 sm:flex-none bg-[var(--inner-box)] border border-[var(--panel-border)] hover:bg-[var(--panel-hover)] text-[var(--text-main)] text-[0.75rem] font-bold px-3 py-1.5 rounded-lg transition cursor-pointer"
            >
              임시저장
            </button>
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none bg-[var(--inner-box)] border border-[var(--panel-border)] hover:bg-red-500/10 hover:text-red-400 text-[var(--text-main)] text-[0.75rem] font-bold px-3 py-1.5 rounded-lg transition cursor-pointer"
            >
              취소
            </button>
            <button
              onClick={onSubmit}
              className="flex-1 sm:flex-none bg-[var(--accent)] hover:bg-[var(--accent-strong)] text-[var(--accent-fg)] text-[0.75rem] font-bold px-5 py-1.5 rounded-lg transition shadow cursor-pointer"
            >
              작성완료
            </button>
          </div>
        </header>

        <div className="bg-[var(--panel)] rounded-xl border border-[var(--panel-border)] overflow-hidden shadow-sm flex flex-col min-h-[780px]">
          {/* 카테고리 선택 및 필독 옵션 */}
          <div className="bg-[var(--inner-box)] border-b border-[var(--panel-border)] p-3 flex flex-wrap items-center gap-1.5">
            {CATEGORIES.filter((c) => c !== "전체").map((cat) => (
              <button
                key={cat}
                onClick={() =>
                  setNewNotice({
                    ...newNotice,
                    type: cat,
                    link: LINK_ONLY_CATEGORIES.includes(cat) ? newNotice.link : "",
                  })
                }
                disabled={cat.includes("생텀") && !isMaster && !cat.includes("가이드")}
                className={`px-2.5 py-1 rounded text-[0.7rem] font-bold transition border cursor-pointer ${
                  newNotice.type === cat
                    ? "bg-[var(--text-main)] text-[var(--panel)] border-[var(--text-main)]"
                    : "bg-[var(--panel)] text-[var(--text-sub)] border-[var(--panel-border)] hover:border-[var(--text-sub)] disabled:opacity-30"
                }`}
              >
                {cat}
              </button>
            ))}
            <label className="ml-auto flex items-center gap-1.5 cursor-pointer group px-2">
              <input
                type="checkbox"
                checked={newNotice.isPinned}
                onChange={(e) => setNewNotice({ ...newNotice, isPinned: e.target.checked })}
                className="w-3.5 h-3.5 rounded cursor-pointer accent-red-500"
              />
              <span className="text-[0.75rem] font-bold text-[var(--text-sub)] group-hover:text-[var(--text-main)]">
                📌 필독
              </span>
            </label>
          </div>

          {/* 제목 입력란 */}
          <input
            type="text"
            placeholder="제목을 입력하세요"
            value={newNotice.title}
            onChange={(e) => setNewNotice({ ...newNotice, title: e.target.value })}
            className="w-full bg-[var(--panel)] text-[var(--text-main)] text-[1rem] font-bold px-4 py-3.5 border-b border-[var(--panel-border)] focus:outline-none placeholder-[var(--text-sub)]/50"
          />

          {LINK_ONLY_CATEGORIES.includes(newNotice.type) ? (
            <div className="p-4 flex flex-col gap-1.5 bg-[var(--inner-box)] min-h-[400px]">
              <label className="text-[0.8rem] font-bold text-[var(--text-main)]">
                🔗 외부 이동 URL 링크
              </label>
              <input
                type="url"
                placeholder="https://..."
                value={newNotice.link || ""}
                onChange={(e) => setNewNotice({ ...newNotice, link: e.target.value })}
                className="w-full bg-[var(--panel)] border border-[var(--panel-border)] rounded-lg px-3 py-2 text-[0.85rem] text-[var(--text-main)] focus:border-[var(--accent)] outline-none"
              />
            </div>
          ) : (
            <div className="flex flex-col flex-1 relative">
              {/* 확장된 에디터 툴바 */}
              <div
                className="flex items-center flex-wrap gap-1.5 px-3 py-2 bg-[#252528] border-b border-[var(--panel-border)] text-zinc-300 relative z-10"
                onMouseDown={(e) => e.preventDefault()}
              >
                {/* 1. 기본 스타일 (볼드, 이탤릭, 밑줄, 취소선) */}
                <div className="flex items-center bg-[#1c1c1e] border border-zinc-700 rounded overflow-hidden">
                  <button
                    onClick={() => executeCommand("bold")}
                    className="w-7 h-7 font-serif font-black hover:bg-zinc-700 transition text-[0.75rem] cursor-pointer"
                    title="굵게 (Ctrl+B)"
                  >
                    B
                  </button>
                  <button
                    onClick={() => executeCommand("italic")}
                    className="w-7 h-7 font-serif italic hover:bg-zinc-700 transition border-l border-zinc-700 text-[0.75rem] cursor-pointer"
                    title="기울임 (Ctrl+I)"
                  >
                    i
                  </button>
                  <button
                    onClick={() => executeCommand("underline")}
                    className="w-7 h-7 font-serif underline hover:bg-zinc-700 transition border-l border-zinc-700 text-[0.75rem] cursor-pointer"
                    title="밑줄 (Ctrl+U)"
                  >
                    U
                  </button>
                  <button
                    onClick={() => executeCommand("strikeThrough")}
                    className="w-7 h-7 font-serif line-through hover:bg-zinc-700 transition border-l border-zinc-700 text-[0.75rem] cursor-pointer"
                    title="취소선 (Ctrl+S)"
                  >
                    S
                  </button>
                </div>

                {/* 2. 글자 정렬 버튼 그룹 (신규 구현) */}
                <div className="flex items-center bg-[#1c1c1e] border border-zinc-700 rounded overflow-hidden">
                  <button
                    onClick={() => executeCommand("justifyLeft")}
                    className="w-7 h-7 hover:bg-zinc-700 transition text-[0.7rem] cursor-pointer flex items-center justify-center"
                    title="좌측 정렬"
                  >
                    ⇇
                  </button>
                  <button
                    onClick={() => executeCommand("justifyCenter")}
                    className="w-7 h-7 hover:bg-zinc-700 transition border-l border-zinc-700 text-[0.7rem] cursor-pointer flex items-center justify-center"
                    title="중앙 정렬"
                  >
                    ≡
                  </button>
                  <button
                    onClick={() => executeCommand("justifyRight")}
                    className="w-7 h-7 hover:bg-zinc-700 transition border-l border-zinc-700 text-[0.7rem] cursor-pointer flex items-center justify-center"
                    title="우측 정렬"
                  >
                    ⇉
                  </button>
                  <button
                    onClick={() => executeCommand("justifyFull")}
                    className="w-7 h-7 hover:bg-zinc-700 transition border-l border-zinc-700 text-[0.7rem] cursor-pointer flex items-center justify-center"
                    title="양쪽 정렬"
                  >
                    ⇥
                  </button>
                </div>

                {/* 3. 제목 & 계층 구조 드롭다운 (신규 구현) */}
                <div className="relative">
                  <button
                    onClick={() =>
                      setActivePopover(activePopover === "heading" ? null : "heading")
                    }
                    className="flex items-center gap-1 px-2.5 h-7 bg-[#1c1c1e] border border-zinc-700 rounded text-[0.7rem] font-bold cursor-pointer text-[var(--accent)] hover:bg-zinc-700"
                  >
                    <span>📌 제목/구조</span> <span className="text-[0.6rem]">▼</span>
                  </button>
                  {activePopover === "heading" && (
                    <div className="absolute top-full mt-1 left-0 bg-[#252528] border border-zinc-700 rounded-lg shadow-2xl w-[220px] p-2 flex flex-col gap-1 z-50">
                      <div className="text-[0.65rem] font-bold text-zinc-400 px-2 py-1 border-b border-zinc-700">
                        🔢 숫자 계층 구조
                      </div>
                      <button
                        onClick={() => insertHeadingBlock("num-l1")}
                        className="text-left px-2 py-1.5 text-[0.75rem] hover:bg-zinc-700 text-white font-bold rounded flex items-center justify-between cursor-pointer"
                      >
                        <span>1. 대제목</span>
                        <span className="text-[0.65rem] text-zinc-400">20px</span>
                      </button>
                      <button
                        onClick={() => insertHeadingBlock("num-l2")}
                        className="text-left px-2 py-1 text-[0.72rem] hover:bg-zinc-700 text-[var(--accent)] font-semibold rounded flex items-center justify-between pl-4 cursor-pointer"
                      >
                        <span>(1) 중제목</span>
                        <span className="text-[0.65rem] text-zinc-400">16px</span>
                      </button>
                      <button
                        onClick={() => insertHeadingBlock("num-l3")}
                        className="text-left px-2 py-1 text-[0.7rem] hover:bg-zinc-700 text-zinc-300 rounded flex items-center justify-between pl-6 cursor-pointer"
                      >
                        <span>[1] 소제목</span>
                        <span className="text-[0.65rem] text-zinc-400">14.5px</span>
                      </button>

                      <div className="text-[0.65rem] font-bold text-zinc-400 px-2 py-1 border-b border-zinc-700 mt-1">
                        ◆ 특수문자 계층 구조
                      </div>
                      <button
                        onClick={() => insertHeadingBlock("sym-l1")}
                        className="text-left px-2 py-1.5 text-[0.75rem] hover:bg-zinc-700 text-white font-bold rounded flex items-center justify-between cursor-pointer"
                      >
                        <span>◆ 1단계 대제목</span>
                        <span className="text-[0.65rem] text-zinc-400">20px</span>
                      </button>
                      <button
                        onClick={() => insertHeadingBlock("sym-l2")}
                        className="text-left px-2 py-1 text-[0.72rem] hover:bg-zinc-700 text-[var(--accent)] font-semibold rounded flex items-center justify-between pl-3 cursor-pointer"
                      >
                        <span>■ 2단계 중제목</span>
                        <span className="text-[0.65rem] text-zinc-400">16px</span>
                      </button>
                      <button
                        onClick={() => insertHeadingBlock("sym-l3")}
                        className="text-left px-2 py-1 text-[0.7rem] hover:bg-zinc-700 text-zinc-200 rounded flex items-center justify-between pl-5 cursor-pointer"
                      >
                        <span>◈ 3단계 소제목</span>
                        <span className="text-[0.65rem] text-zinc-400">14.5px</span>
                      </button>
                      <button
                        onClick={() => insertHeadingBlock("sym-l4")}
                        className="text-left px-2 py-1 text-[0.68rem] hover:bg-zinc-700 text-zinc-400 rounded flex items-center justify-between pl-7 cursor-pointer"
                      >
                        <span>▣ 4단계 세부목록</span>
                        <span className="text-[0.65rem] text-zinc-400">13.5px</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* 4. 폰트 크기 및 줄간격 선택 */}
                <div className="flex items-center gap-1.5">
                  <div className="relative">
                    <button
                      onClick={() =>
                        setActivePopover(activePopover === "fontSize" ? null : "fontSize")
                      }
                      className="flex items-center gap-1 px-2 h-7 bg-[#1c1c1e] border border-zinc-700 rounded text-[0.7rem] font-bold cursor-pointer"
                    >
                      크기 <span className="text-[0.6rem]">▼</span>
                    </button>
                    {activePopover === "fontSize" && (
                      <div className="absolute top-full mt-1 left-0 bg-[#1c1c1e] border border-zinc-700 rounded shadow-xl w-16 max-h-40 overflow-y-auto flex flex-col py-1 z-50">
                        {FONT_SIZES.map((sz: number) => (
                          <button
                            key={sz}
                            onClick={() => applyFontSize(sz)}
                            className="text-left px-2.5 py-1 text-[0.7rem] hover:bg-zinc-700 text-white cursor-pointer"
                          >
                            {sz}px
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="relative">
                    <button
                      onClick={() =>
                        setActivePopover(activePopover === "lineHeight" ? null : "lineHeight")
                      }
                      className="flex items-center gap-1 px-2 h-7 bg-[#1c1c1e] border border-zinc-700 rounded text-[0.7rem] font-bold cursor-pointer"
                    >
                      간격 <span className="text-[0.6rem]">▼</span>
                    </button>
                    {activePopover === "lineHeight" && (
                      <div className="absolute top-full mt-1 left-0 bg-[#1c1c1e] border border-zinc-700 rounded shadow-xl w-16 flex flex-col py-1 z-50">
                        {LINE_HEIGHTS.map((lh: number) => (
                          <button
                            key={lh}
                            onClick={() => applyLineHeight(lh)}
                            className="text-left px-2.5 py-1 text-[0.7rem] hover:bg-zinc-700 text-white cursor-pointer"
                          >
                            {lh}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* 5. 표, 특수문자, 투표 생성 */}
                <div className="flex items-center gap-1.5 border-l border-zinc-700 pl-2">
                  <button
                    onClick={() => setActivePopover(activePopover === "table" ? null : "table")}
                    className="flex items-center justify-center w-7 h-7 bg-[#1c1c1e] border border-zinc-700 rounded text-[0.75rem] cursor-pointer"
                    title="표 생성"
                  >
                    🔲
                  </button>
                  {activePopover === "table" && (
                    <div className="absolute top-full mt-1 left-0 bg-[#252528] border border-zinc-700 rounded shadow-xl p-3 z-50 flex flex-col items-center w-[200px]">
                      <span className="text-[0.7rem] font-bold text-[#3498db] mb-2">
                        {tableGrid.r > 0 ? `${tableGrid.r}x${tableGrid.c}` : "행x열"}
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
                              className={`w-3.5 h-3.5 border cursor-pointer ${
                                r < tableGrid.r && c < tableGrid.c
                                  ? "bg-[#3498db]/40 border-[#3498db]"
                                  : "border-zinc-600"
                              }`}
                            />
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => setActivePopover(activePopover === "symbol" ? null : "symbol")}
                    className="flex items-center justify-center w-7 h-7 bg-[#1c1c1e] border border-zinc-700 rounded text-[0.75rem] text-white cursor-pointer"
                    title="특수문자 삽입"
                  >
                    Ω
                  </button>
                  {activePopover === "symbol" && (
                    <div className="absolute top-full mt-1 left-0 bg-[#252528] border border-zinc-700 rounded shadow-xl w-[280px] p-2 z-50 grid grid-cols-10 gap-1 h-48 overflow-y-auto">
                      {SPECIAL_CHARS.map((char) => (
                        <button
                          key={char}
                          onClick={() => insertCustomHTML(char)}
                          className="w-6 h-6 flex items-center justify-center bg-[#1c1c1e] border border-zinc-700 hover:bg-zinc-600 rounded text-[0.75rem] text-white cursor-pointer"
                        >
                          {char}
                        </button>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => setIsPollModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 h-7 bg-[#1c1c1e] border border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white rounded text-[0.7rem] font-bold cursor-pointer"
                  >
                    📊 투표
                  </button>
                </div>
              </div>

              {/* 확장된 본문 에디터 (Red Line 영역까지 수직 확장) */}
              <div
                ref={editorRef}
                contentEditable
                onInput={handleEditorInput}
                onKeyDown={handleKeyDown}
                onClick={() => setActivePopover(null)}
                className="w-full flex-1 p-5 bg-[var(--panel)] text-[0.95rem] leading-[1.65] text-[var(--text-main)] outline-none custom-scrollbar prose-editor min-h-[600px] md:min-h-[700px] lg:min-h-[750px]"
                data-placeholder="내용을 작성해주세요..."
              />

              <KerygmaPollModal
                isOpen={isPollModalOpen}
                onClose={() => setIsPollModalOpen(false)}
                pollForm={pollForm}
                setPollForm={setPollForm}
                onInsertPoll={insertPoll}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}