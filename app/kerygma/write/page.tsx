"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { CATEGORIES, LINK_ONLY_CATEGORIES, PollData, Notice } from "@/types/kerygma";
import KerygmaPollModal from "@/components/kerygma/KerygmaPollModal";

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

export default function KerygmaWritePage() {
  const router = useRouter();
  const editorRef = useRef<HTMLDivElement>(null);
  const [user, setUser] = useState<any>(null);
  const [mounted, setMounted] = useState(false);

  const [newNotice, setNewNotice] = useState({
    type: "길드 공지사항",
    title: "",
    content: "",
    link: "",
    isPinned: false,
  });

  const [activePopover, setActivePopover] = useState<
    "fontSize" | "lineHeight" | "textColor" | "bgColor" | "table" | "symbol" | "heading" | null
  >(null);
  const [tableGrid, setTableGrid] = useState({ r: 0, c: 0 });

  const [isPollModalOpen, setIsPollModalOpen] = useState(false);
  const [pendingPoll, setPendingPoll] = useState<PollData | null>(null);
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
    setMounted(true);
    const savedUser = localStorage.getItem("nexus_user");
    if (savedUser) setUser(JSON.parse(savedUser));

    const draft = localStorage.getItem("notice_draft");
    if (draft) {
      if (window.confirm("임시저장된 글이 있습니다. 가지고 오시겠습니까?")) {
        try {
          const parsed = JSON.parse(draft);
          setNewNotice(parsed);
          if (editorRef.current) editorRef.current.innerHTML = parsed.content || "";
        } catch (e) {}
      } else {
        localStorage.removeItem("notice_draft");
      }
    }

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  const isMaster = user?.nickname === "한설" || user?.role === "길드마스터";
  const isSubMaster =
    user?.role === "부길드마스터" || user?.role === "부마스터" || user?.role === "admin";
  const canWriteNotice = isMaster || isSubMaster;

  const handleEditorInput = () => {
    if (editorRef.current) setNewNotice((prev) => ({ ...prev, content: editorRef.current!.innerHTML }));
  };

  const executeCommand = (command: string, value: string = "") => {
    document.execCommand("styleWithCSS", false, "true");
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleEditorInput();
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

  // 1. 상위 대제목 기준 상대적 카운팅 스캔 엔진
  const getNextCount = (type: string): { num: number; char: string } => {
    const editorEl = editorRef.current;
    if (!editorEl) return { num: 1, char: "1" };

    const fullText = editorEl.innerText || "";

    if (type.startsWith("num-")) {
      // 대제목: 문서 전체의 대제목(1., 2...) 개수 스캔
      if (type === "num-l1") {
        const l1Matches = [...fullText.matchAll(/(?:^|\n)(\d+)\.\s/g)];
        const count = l1Matches.length;
        return { num: count + 1, char: String(count + 1) };
      }

      // 중제목: 직전 대제목(1., 2...) 이후의 중제목((1), (2)...) 개수만 스캔
      if (type === "num-l2") {
        const l1Matches = [...fullText.matchAll(/(?:^|\n)(\d+)\.\s/g)];
        let searchSection = fullText;
        if (l1Matches.length > 0) {
          const lastL1Index = fullText.lastIndexOf(l1Matches[l1Matches.length - 1][0]);
          searchSection = fullText.slice(lastL1Index);
        }
        const l2Matches = [...searchSection.matchAll(/(?:^|\n)\((\d+)\)\s/g)];
        const count = l2Matches.length;
        return { num: count + 1, char: String(count + 1) };
      }

      // 소제목: 직전 중제목((1)...) 또는 직전 대제목 이후의 소제목([1], [2]...) 개수만 스캔
      if (type === "num-l3") {
        const l2Matches = [...fullText.matchAll(/(?:^|\n)\((\d+)\)\s/g)];
        let searchSection = fullText;
        if (l2Matches.length > 0) {
          const lastL2Index = fullText.lastIndexOf(l2Matches[l2Matches.length - 1][0]);
          searchSection = fullText.slice(lastL2Index);
        } else {
          const l1Matches = [...fullText.matchAll(/(?:^|\n)(\d+)\.\s/g)];
          if (l1Matches.length > 0) {
            const lastL1Index = fullText.lastIndexOf(l1Matches[l1Matches.length - 1][0]);
            searchSection = fullText.slice(lastL1Index);
          }
        }
        const l3Matches = [...searchSection.matchAll(/(?:^|\n)\[(\d+)\]\s/g)];
        const count = l3Matches.length;
        return { num: count + 1, char: String(count + 1) };
      }
    }

    if (type.startsWith("alpha-")) {
      // 대제목 알파벳 (A., B...)
      if (type === "alpha-l1") {
        const l1Matches = [...fullText.matchAll(/(?:^|\n)([A-Z])\.\s/g)];
        const count = l1Matches.length;
        const charCode = 65 + (count % 26);
        return { num: count + 1, char: String.fromCharCode(charCode) };
      }

      // 중제목 알파벳 ((A), (B)...) -> 직전 대제목 이후 카운트
      if (type === "alpha-l2") {
        const l1Matches = [...fullText.matchAll(/(?:^|\n)([A-Z])\.\s/g)];
        let searchSection = fullText;
        if (l1Matches.length > 0) {
          const lastL1Index = fullText.lastIndexOf(l1Matches[l1Matches.length - 1][0]);
          searchSection = fullText.slice(lastL1Index);
        }
        const l2Matches = [...searchSection.matchAll(/(?:^|\n)\(([A-Z])\)\s/g)];
        const count = l2Matches.length;
        const charCode = 65 + (count % 26);
        return { num: count + 1, char: String.fromCharCode(charCode) };
      }

      // 소제목 알파벳 ([A], [B]...) -> 직전 중제목 이후 카운트
      if (type === "alpha-l3") {
        const l2Matches = [...fullText.matchAll(/(?:^|\n)\(([A-Z])\)\s/g)];
        let searchSection = fullText;
        if (l2Matches.length > 0) {
          const lastL2Index = fullText.lastIndexOf(l2Matches[l2Matches.length - 1][0]);
          searchSection = fullText.slice(lastL2Index);
        } else {
          const l1Matches = [...fullText.matchAll(/(?:^|\n)([A-Z])\.\s/g)];
          if (l1Matches.length > 0) {
            const lastL1Index = fullText.lastIndexOf(l1Matches[l1Matches.length - 1][0]);
            searchSection = fullText.slice(lastL1Index);
          }
        }
        const l3Matches = [...searchSection.matchAll(/(?:^|\n)\[([A-Z])\]\s/g)];
        const count = l3Matches.length;
        const charCode = 65 + (count % 26);
        return { num: count + 1, char: String.fromCharCode(charCode) };
      }
    }

    return { num: 1, char: "1" };
  };

  // 2. 템플릿 문구 없이 즉시 타이핑 가능한 깔끔한 헤더 블록 삽입
  const insertHeadingBlock = (type: string) => {
    const { char } = getNextCount(type);
    let fontSize = "20px";
    let fontWeight = "800";
    let color = "var(--text-main)";
    let marginLeft = "0px";
    let marginTop = "22px";
    let marginBottom = "8px";
    let borderBottom = "none";
    let prefix = "";

    switch (type) {
      case "num-l1":
        prefix = `${char}. `;
        borderBottom = "2px solid var(--accent)";
        break;
      case "num-l2":
        prefix = `(${char}) `;
        fontSize = "16px";
        fontWeight = "700";
        color = "var(--accent)";
        marginLeft = "12px";
        marginTop = "14px";
        marginBottom = "6px";
        break;
      case "num-l3":
        prefix = `[${char}] `;
        fontSize = "14.5px";
        fontWeight = "600";
        color = "var(--text-sub)";
        marginLeft = "24px";
        marginTop = "10px";
        marginBottom = "4px";
        break;
      case "alpha-l1":
        prefix = `${char}. `;
        borderBottom = "2px solid var(--accent)";
        break;
      case "alpha-l2":
        prefix = `(${char}) `;
        fontSize = "16px";
        fontWeight = "700";
        color = "var(--accent)";
        marginLeft = "12px";
        marginTop = "14px";
        marginBottom = "6px";
        break;
      case "alpha-l3":
        prefix = `[${char}] `;
        fontSize = "14.5px";
        fontWeight = "600";
        color = "var(--text-sub)";
        marginLeft = "24px";
        marginTop = "10px";
        marginBottom = "4px";
        break;
      case "sym-l1":
        prefix = `◆ `;
        borderBottom = "2px solid var(--accent)";
        break;
      case "sym-l2":
        prefix = `■ `;
        fontSize = "16px";
        fontWeight = "700";
        color = "var(--accent)";
        marginLeft = "10px";
        marginTop = "14px";
        marginBottom = "6px";
        break;
      case "sym-l3":
        prefix = `◈ `;
        fontSize = "14.5px";
        fontWeight = "600";
        color = "var(--text-main)";
        marginLeft = "20px";
        marginTop = "10px";
        marginBottom = "4px";
        break;
      case "sym-l4":
        prefix = `▣ `;
        fontSize = "13.5px";
        fontWeight = "500";
        color = "var(--text-sub)";
        marginLeft = "30px";
        marginTop = "6px";
        marginBottom = "4px";
        break;
    }

    const blockId = `hdr-${Date.now()}`;
    // 불필요한 템플릿 문구를 완전히 제거하고 기호만 삽입
    const headerHtml = `<div id="${blockId}" style="display: block; width: 100%; clear: both; font-size: ${fontSize}; font-weight: ${fontWeight}; color: ${color}; margin-top: ${marginTop}; margin-bottom: ${marginBottom}; margin-left: ${marginLeft}; ${
      borderBottom !== "none" ? `border-bottom: ${borderBottom}; padding-bottom: 4px;` : ""
    }">${prefix}&nbsp;</div><p><br></p>`;

    const sel = window.getSelection();
    let needPrependBreak = true;
    if (sel && sel.rangeCount > 0) {
      const node = sel.focusNode;
      if (node === editorRef.current && editorRef.current?.innerHTML.trim() === "") {
        needPrependBreak = false;
      }
    }

    const finalHtml = (needPrependBreak ? `<p><br></p>` : ``) + headerHtml;
    executeCommand("insertHTML", finalHtml);

    // 삽입 직후 기호 우측 위치로 커서 자동 이동 (지울 필요 없이 입력 시작 가능)
    setTimeout(() => {
      const el = document.getElementById(blockId);
      if (el) {
        const range = document.createRange();
        range.selectNodeContents(el);
        range.collapse(false);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
    }, 20);
  };

  const handleEditorKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if ((e.ctrlKey || e.metaKey) && ["b", "i", "u", "s"].includes(e.key.toLowerCase())) {
      e.preventDefault();
      const key = e.key.toLowerCase();
      if (key === "b") executeCommand("bold");
      if (key === "i") executeCommand("italic");
      if (key === "u") executeCommand("underline");
      if (key === "s") executeCommand("strikeThrough");
    }
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

  const handleSaveDraft = () => {
    const currentContent = editorRef.current ? editorRef.current.innerHTML : newNotice.content;
    const draftData = { ...newNotice, content: currentContent };
    localStorage.setItem("notice_draft", JSON.stringify(draftData));
    alert("임시저장 되었습니다.");
  };

  const handleSubmit = async () => {
    if (!newNotice.title.trim()) return alert("제목을 입력해주세요.");
    const currentContent = editorRef.current ? editorRef.current.innerHTML : newNotice.content;

    if (LINK_ONLY_CATEGORIES.includes(newNotice.type) && !newNotice.link?.trim())
      return alert("외부 링크(URL)를 입력해주세요.");
    if (!LINK_ONLY_CATEGORIES.includes(newNotice.type) && !currentContent.trim())
      return alert("내용을 입력해주세요.");
    if (
      (newNotice.type === "생텀 업데이트" || newNotice.type === "생텀 공지사항") &&
      !isMaster
    )
      return alert("해당 카테고리는 길드마스터 전용입니다.");

    const payload: Omit<Notice, "id"> = {
      type: newNotice.type,
      title: newNotice.title,
      content: LINK_ONLY_CATEGORIES.includes(newNotice.type) ? "" : currentContent,
      link: LINK_ONLY_CATEGORIES.includes(newNotice.type) ? newNotice.link : undefined,
      author: user?.nickname || "관리자",
      is_pinned: newNotice.isPinned,
      created_at: new Date().toISOString(),
      poll: pendingPoll || undefined,
      likes: 0,
      dislikes: 0,
    };

    await supabase.from("notices").insert([payload]);

    const localDb: Notice[] = JSON.parse(localStorage.getItem("notices_mock_db") || "[]");
    const newEntry: Notice = { id: Date.now(), ...payload };
    localStorage.setItem("notices_mock_db", JSON.stringify([newEntry, ...localDb]));

    localStorage.removeItem("notice_draft");
    router.push("/kerygma");
  };

  if (!mounted) return null;

  if (!canWriteNotice) {
    return (
      <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-xl font-bold text-red-400 mb-2">접근 권한 제한</h1>
        <p className="text-xs text-[var(--text-sub)] mb-4">
          공지사항 작성은 길드 관리자 계정만 이용 가능합니다.
        </p>
        <button
          onClick={() => router.push("/kerygma")}
          className="px-4 py-2 bg-[var(--panel)] border border-[var(--panel-border)] rounded-lg text-xs font-bold text-[var(--text-main)] cursor-pointer"
        >
          목록으로 돌아가기
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] pb-24 pt-4 overflow-x-hidden">
      <div className="max-w-[1400px] mx-auto px-4 py-5 space-y-3">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[var(--panel-border)] pb-3 gap-3">
          <h1 className="text-lg font-bold text-[var(--text-main)] flex items-center gap-2">
            <span>✏️</span>
            <span>새 공지 작성 (KERYGMA EDITOR)</span>
          </h1>

          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <button
              onClick={handleSaveDraft}
              className="flex-1 sm:flex-none bg-[var(--inner-box)] border border-[var(--panel-border)] hover:bg-[var(--panel-hover)] text-[var(--text-main)] text-[0.75rem] font-bold px-3 py-1.5 rounded-lg transition cursor-pointer"
            >
              임시저장
            </button>
            <button
              onClick={() => {
                if (confirm("작성 중인 내용이 지워질 수 있습니다. 돌아가시겠습니까?")) {
                  router.push("/kerygma");
                }
              }}
              className="flex-1 sm:flex-none bg-[var(--inner-box)] border border-[var(--panel-border)] hover:bg-red-500/10 hover:text-red-400 text-[var(--text-main)] text-[0.75rem] font-bold px-3 py-1.5 rounded-lg transition cursor-pointer"
            >
              취소
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 sm:flex-none bg-[var(--accent)] hover:bg-[var(--accent-strong)] text-[var(--accent-fg)] text-[0.75rem] font-bold px-5 py-1.5 rounded-lg transition shadow cursor-pointer"
            >
              작성완료
            </button>
          </div>
        </header>

        <div className="bg-[var(--panel)] rounded-xl border border-[var(--panel-border)] overflow-hidden shadow-sm flex flex-col min-h-[820px]">
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
              <div
                className="flex items-center flex-wrap gap-1.5 px-3 py-2 bg-[#252528] border-b border-[var(--panel-border)] text-zinc-300 relative z-10"
                onMouseDown={(e) => e.preventDefault()}
              >
                {/* 1. 서식 */}
                <div className="flex items-center bg-[#1c1c1e] border border-zinc-700 rounded overflow-hidden">
                  <button
                    onClick={() => executeCommand("bold")}
                    className="w-7 h-7 font-serif font-black hover:bg-zinc-700 transition text-[0.75rem] cursor-pointer"
                    title="굵게"
                  >
                    B
                  </button>
                  <button
                    onClick={() => executeCommand("italic")}
                    className="w-7 h-7 font-serif italic hover:bg-zinc-700 transition border-l border-zinc-700 text-[0.75rem] cursor-pointer"
                    title="기울임"
                  >
                    i
                  </button>
                  <button
                    onClick={() => executeCommand("underline")}
                    className="w-7 h-7 font-serif underline hover:bg-zinc-700 transition border-l border-zinc-700 text-[0.75rem] cursor-pointer"
                    title="밑줄"
                  >
                    U
                  </button>
                  <button
                    onClick={() => executeCommand("strikeThrough")}
                    className="w-7 h-7 font-serif line-through hover:bg-zinc-700 transition border-l border-zinc-700 text-[0.75rem] cursor-pointer"
                    title="취소선"
                  >
                    S
                  </button>
                </div>

                {/* 2. 글자 정렬 그룹 */}
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

                {/* 3. 계층별 자동 리셋 카운팅 헤더 드롭다운 */}
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
                    <div className="absolute top-full mt-1 left-0 bg-[#252528] border border-zinc-700 rounded-lg shadow-2xl w-[230px] p-2 flex flex-col gap-1 z-50">
                      <div className="text-[0.65rem] font-bold text-zinc-400 px-2 py-1 border-b border-zinc-700">
                        🔢 숫자 계층 카운팅 (1., 2 / (1), (2)...)
                      </div>
                      <button
                        onClick={() => insertHeadingBlock("num-l1")}
                        className="text-left px-2 py-1.5 text-[0.75rem] hover:bg-zinc-700 text-white font-bold rounded flex items-center justify-between cursor-pointer"
                      >
                        <span>1. 대제목</span>
                        <span className="text-[0.65rem] text-zinc-400">대제목 카운트</span>
                      </button>
                      <button
                        onClick={() => insertHeadingBlock("num-l2")}
                        className="text-left px-2 py-1 text-[0.72rem] hover:bg-zinc-700 text-[var(--accent)] font-semibold rounded flex items-center justify-between pl-4 cursor-pointer"
                      >
                        <span>(1) 중제목</span>
                        <span className="text-[0.65rem] text-zinc-400">상위 기준 리셋</span>
                      </button>
                      <button
                        onClick={() => insertHeadingBlock("num-l3")}
                        className="text-left px-2 py-1 text-[0.7rem] hover:bg-zinc-700 text-zinc-300 rounded flex items-center justify-between pl-6 cursor-pointer"
                      >
                        <span>[1] 소제목</span>
                        <span className="text-[0.65rem] text-zinc-400">상위 기준 리셋</span>
                      </button>

                      <div className="text-[0.65rem] font-bold text-zinc-400 px-2 py-1 border-b border-zinc-700 mt-1">
                        🔤 알파벳 계층 카운팅 (A., B / (A), (B)...)
                      </div>
                      <button
                        onClick={() => insertHeadingBlock("alpha-l1")}
                        className="text-left px-2 py-1.5 text-[0.75rem] hover:bg-zinc-700 text-white font-bold rounded flex items-center justify-between cursor-pointer"
                      >
                        <span>A. 대제목</span>
                        <span className="text-[0.65rem] text-zinc-400">대제목 카운트</span>
                      </button>
                      <button
                        onClick={() => insertHeadingBlock("alpha-l2")}
                        className="text-left px-2 py-1 text-[0.72rem] hover:bg-zinc-700 text-[var(--accent)] font-semibold rounded flex items-center justify-between pl-4 cursor-pointer"
                      >
                        <span>(A) 중제목</span>
                        <span className="text-[0.65rem] text-zinc-400">상위 기준 리셋</span>
                      </button>
                      <button
                        onClick={() => insertHeadingBlock("alpha-l3")}
                        className="text-left px-2 py-1 text-[0.7rem] hover:bg-zinc-700 text-zinc-300 rounded flex items-center justify-between pl-6 cursor-pointer"
                      >
                        <span>[A] 소제목</span>
                        <span className="text-[0.65rem] text-zinc-400">상위 기준 리셋</span>
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

                {/* 4. 폰트 크기 및 줄간격 */}
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

              {/* 본문 에디터 */}
              <div
                ref={editorRef}
                contentEditable
                spellCheck={false}
                onInput={handleEditorInput}
                onClick={() => setActivePopover(null)}
                onKeyDown={handleEditorKeyDown}
                className="w-full flex-1 p-5 bg-[var(--panel)] text-[0.95rem] leading-[1.65] text-[var(--text-main)] outline-none custom-scrollbar prose-editor min-h-[650px] md:min-h-[720px]"
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
    </main>
  );
}