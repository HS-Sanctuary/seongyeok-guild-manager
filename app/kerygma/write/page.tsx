"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { CATEGORIES, LINK_ONLY_CATEGORIES, PollData, Notice } from "@/types/kerygma";
import KerygmaPollModal from "@/components/kerygma/KerygmaPollModal";

const NOTICE_CATEGORIES = ["길드 공지사항", "생텀 공지사항", "생텀 업데이트"];

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

const CELL_BG_COLORS = [
  { name: "투명", value: "transparent", border: "#555" },
  { name: "골드", value: "rgba(212, 175, 55, 0.25)", border: "#d4af37" },
  { name: "블루", value: "rgba(52, 152, 219, 0.25)", border: "#3498db" },
  { name: "레드", value: "rgba(231, 76, 60, 0.25)", border: "#e74c3c" },
  { name: "그린", value: "rgba(46, 204, 113, 0.25)", border: "#2ecc71" },
  { name: "퍼플", value: "rgba(155, 89, 182, 0.25)", border: "#9b59b6" },
  { name: "그레이", value: "rgba(255, 255, 255, 0.12)", border: "#888" },
  { name: "블랙", value: "#141416", border: "#333" },
];

export default function KerygmaWritePage() {
  const router = useRouter();
  const editorRef = useRef<HTMLDivElement>(null);
  const [user, setUser] = useState<any>(null);
  const [mounted, setMounted] = useState(false);

  // 🎯 [수정 모드 관리 상태]
  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

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

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    cell: HTMLTableCellElement;
  } | null>(null);

  const isResizingRef = useRef<{
    type: "col" | "row" | "table";
    table: HTMLTableElement;
    cell: HTMLTableCellElement;
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
  } | null>(null);

  const draggedTableRef = useRef<HTMLTableElement | null>(null);

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

  const setGlobalCursorOverride = (cursorType: string | null) => {
    if (typeof window === "undefined") return;
    let styleEl = document.getElementById("sanctum-cursor-override");
    if (!cursorType) {
      if (styleEl) styleEl.remove();
      return;
    }
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = "sanctum-cursor-override";
      document.head.appendChild(styleEl);
    }
    styleEl.innerHTML = `* { cursor: ${cursorType} !important; user-select: none !important; }`;
  };

  useEffect(() => {
    setMounted(true);
    const savedUser = localStorage.getItem("nexus_user");
    if (savedUser) setUser(JSON.parse(savedUser));

    // 🎯 [수정 모드 URL 파라미터 감지 및 기존 데이터 프리필]
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const editIdParam = params.get("editId");

      if (editIdParam) {
        const idNum = Number(editIdParam);
        setIsEditMode(true);
        setEditId(idNum);

        const mockDb: Notice[] = JSON.parse(localStorage.getItem("notices_mock_db") || "[]");
        const existing = mockDb.find((n) => Number(n.id) === idNum);

        if (existing) {
          setNewNotice({
            type: existing.type,
            title: existing.title,
            content: existing.content || "",
            link: existing.link || "",
            isPinned: existing.is_pinned || false,
          });
          if (existing.poll) setPendingPoll(existing.poll);

          setTimeout(() => {
            if (editorRef.current) editorRef.current.innerHTML = existing.content || "";
          }, 100);
        }
      } else {
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
      }
    }

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };

    const handleGlobalClick = () => setContextMenu(null);

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("click", handleGlobalClick);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("click", handleGlobalClick);
      setGlobalCursorOverride(null);
    };
  }, []);

  const isMaster = user?.nickname === "한설" || user?.role === "길드마스터";
  const isSubMaster =
    user?.role === "부길드마스터" || user?.role === "부마스터" || user?.role === "admin";
  const canWriteNotice = isMaster || isSubMaster;

  const handleEditorInput = () => {
    if (editorRef.current) setNewNotice((prev) => ({ ...prev, content: editorRef.current!.innerHTML }));
  };

  const cleanHTMLForSave = (rawHtml: string): string => {
    if (!rawHtml) return "";
    if (typeof window === "undefined") return rawHtml;
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = rawHtml;

    tempDiv.querySelectorAll(".sanctum-table-drag-handle, caption").forEach((el) => el.remove());

    tempDiv.querySelectorAll("table").forEach((tbl) => {
      tbl.removeAttribute("draggable");
      tbl.removeAttribute("contenteditable");
      (tbl as HTMLElement).style.cursor = "";
      (tbl as HTMLElement).style.userSelect = "";
    });

    tempDiv.querySelectorAll("td, th").forEach((cell) => {
      cell.removeAttribute("contenteditable");
      (cell as HTMLElement).style.cursor = "";
    });

    return tempDiv.innerHTML;
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

  const handleEditorContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const cell = target.closest("td, th") as HTMLTableCellElement | null;
    if (cell && !target.closest(".sanctum-table-drag-handle")) {
      e.preventDefault();
      e.stopPropagation();
      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        cell,
      });
    } else {
      setContextMenu(null);
    }
  };

  const handleEditorMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isResizingRef.current) return;

    const target = e.target as HTMLElement;
    const dragHandle = target.closest(".sanctum-table-drag-handle");
    const table = target.closest("table") as HTMLTableElement | null;
    const cell = target.closest("td, th") as HTMLTableCellElement | null;

    if (dragHandle) {
      setGlobalCursorOverride("grab");
      return;
    }

    if (table) {
      const tableRect = table.getBoundingClientRect();
      const threshold = 16;
      const isTableRightEdge = Math.abs(e.clientX - tableRect.right) <= threshold;

      if (isTableRightEdge) {
        setGlobalCursorOverride("ew-resize");
        return;
      }
    }

    if (cell && !cell.closest(".sanctum-table-drag-handle")) {
      const rect = cell.getBoundingClientRect();
      const threshold = 6;
      const isRight = Math.abs(e.clientX - rect.right) <= threshold;
      const isBottom = Math.abs(e.clientY - rect.bottom) <= threshold;

      if (isRight) {
        setGlobalCursorOverride("col-resize");
        return;
      } else if (isBottom) {
        setGlobalCursorOverride("row-resize");
        return;
      }
    }

    setGlobalCursorOverride(null);
  };

  const handleEditorMouseLeave = () => {
    if (!isResizingRef.current) {
      setGlobalCursorOverride(null);
    }
  };

  const handleEditorMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const dragHandle = target.closest(".sanctum-table-drag-handle");
    const table = target.closest("table") as HTMLTableElement | null;
    const cell = target.closest("td, th") as HTMLTableCellElement | null;

    if (dragHandle) {
      return;
    }

    if (table) {
      const tableRect = table.getBoundingClientRect();
      const threshold = 16;
      const isTableRightEdge = Math.abs(e.clientX - tableRect.right) <= threshold;

      if (isTableRightEdge) {
        e.preventDefault();
        e.stopPropagation();

        isResizingRef.current = {
          type: "table",
          table,
          cell: cell || (table.querySelector("td") as HTMLTableCellElement),
          startX: e.clientX,
          startY: e.clientY,
          startWidth: table.offsetWidth,
          startHeight: table.offsetHeight,
        };

        setGlobalCursorOverride("ew-resize");

        const handleWindowMouseMove = (moveEvent: MouseEvent) => {
          if (!isResizingRef.current || isResizingRef.current.type !== "table") return;
          const { table, startX, startWidth } = isResizingRef.current;
          const editorWidth = editorRef.current ? editorRef.current.clientWidth - 40 : 800;
          const deltaX = moveEvent.clientX - startX;
          const newWidth = Math.max(120, Math.min(editorWidth, startWidth + deltaX));

          table.style.width = `${newWidth}px`;
          table.style.maxWidth = "100%";
        };

        const handleWindowMouseUp = () => {
          isResizingRef.current = null;
          setGlobalCursorOverride(null);
          window.removeEventListener("mousemove", handleWindowMouseMove);
          window.removeEventListener("mouseup", handleWindowMouseUp);
          handleEditorInput();
        };

        window.addEventListener("mousemove", handleWindowMouseMove);
        window.addEventListener("mouseup", handleWindowMouseUp);
        return;
      }
    }

    if (cell && !cell.closest(".sanctum-table-drag-handle")) {
      const rect = cell.getBoundingClientRect();
      const threshold = 6;
      const isRight = Math.abs(e.clientX - rect.right) <= threshold;
      const isBottom = Math.abs(e.clientY - rect.bottom) <= threshold;

      if (isRight || isBottom) {
        e.preventDefault();
        e.stopPropagation();
        const type = isRight ? "col" : "row";

        isResizingRef.current = {
          type,
          table: cell.closest("table")!,
          cell,
          startX: e.clientX,
          startY: e.clientY,
          startWidth: cell.offsetWidth,
          startHeight: cell.offsetHeight,
        };

        setGlobalCursorOverride(type === "col" ? "col-resize" : "row-resize");

        const handleWindowMouseMove = (moveEvent: MouseEvent) => {
          if (!isResizingRef.current) return;
          const { type, cell, startX, startY, startWidth, startHeight } = isResizingRef.current;
          if (type === "col") {
            const deltaX = moveEvent.clientX - startX;
            cell.style.width = `${Math.max(30, startWidth + deltaX)}px`;
          } else if (type === "row") {
            const deltaY = moveEvent.clientY - startY;
            cell.style.height = `${Math.max(20, startHeight + deltaY)}px`;
          }
        };

        const handleWindowMouseUp = () => {
          isResizingRef.current = null;
          setGlobalCursorOverride(null);
          window.removeEventListener("mousemove", handleWindowMouseMove);
          window.removeEventListener("mouseup", handleWindowMouseUp);
          handleEditorInput();
        };

        window.addEventListener("mousemove", handleWindowMouseMove);
        window.addEventListener("mouseup", handleWindowMouseUp);
      }
    }
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const table = target.closest("table") as HTMLTableElement | null;

    if (table) {
      draggedTableRef.current = table;
      e.dataTransfer.setData("text/plain", "sanctum-table-move");
      e.dataTransfer.effectAllowed = "move";
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (draggedTableRef.current) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    if (!draggedTableRef.current) return;
    e.preventDefault();
    e.stopPropagation();

    const movingTable = draggedTableRef.current;

    let range: Range | null = null;
    if (document.caretRangeFromPoint) {
      range = document.caretRangeFromPoint(e.clientX, e.clientY);
    } else if ((document as any).caretPositionFromPoint) {
      const pos = (document as any).caretPositionFromPoint(e.clientX, e.clientY);
      if (pos) {
        range = document.createRange();
        range.setStart(pos.offsetNode, pos.offset);
        range.collapse(true);
      }
    }

    if (range && editorRef.current) {
      if (movingTable.contains(range.commonAncestorContainer)) {
        draggedTableRef.current = null;
        return;
      }

      movingTable.remove();
      range.insertNode(movingTable);

      const pBreak = document.createElement("p");
      pBreak.innerHTML = "<br>";
      if (movingTable.nextSibling) {
        movingTable.parentNode?.insertBefore(pBreak, movingTable.nextSibling);
      } else {
        movingTable.parentNode?.appendChild(pBreak);
      }

      draggedTableRef.current = null;
      setGlobalCursorOverride(null);
      handleEditorInput();
    }
  };

  const applyCellBgColor = (cell: HTMLTableCellElement, color: string) => {
    cell.style.backgroundColor = color;
    handleEditorInput();
  };

  const applyCellDimensions = (cell: HTMLTableCellElement, opts: { width?: string; height?: string }) => {
    if (opts.width !== undefined) cell.style.width = opts.width;
    if (opts.height !== undefined) cell.style.height = opts.height;
    handleEditorInput();
  };

  const applyTableWidth = (cell: HTMLTableCellElement, widthVal: string) => {
    const table = cell.closest("table");
    if (!table) return;
    table.style.width = widthVal;
    table.style.maxWidth = "100%";
    handleEditorInput();
  };

  const applyTableAlign = (cell: HTMLTableCellElement, align: "left" | "center" | "right") => {
    const table = cell.closest("table");
    if (!table) return;
    if (align === "left") {
      table.style.marginLeft = "0";
      table.style.marginRight = "auto";
    } else if (align === "center") {
      table.style.marginLeft = "auto";
      table.style.marginRight = "auto";
    } else if (align === "right") {
      table.style.marginLeft = "auto";
      table.style.marginRight = "0";
    }
    handleEditorInput();
  };

  const insertRow = (cell: HTMLTableCellElement, position: "above" | "below") => {
    const tr = cell.closest("tr");
    if (!tr) return;
    const newTr = document.createElement("tr");
    const colCount = tr.children.length;
    for (let i = 0; i < colCount; i++) {
      const td = document.createElement("td");
      td.setAttribute("contenteditable", "true");
      td.style.border = "1px solid var(--panel-border)";
      td.style.padding = "8px 12px";
      td.style.minWidth = "40px";
      td.style.height = "36px";
      td.style.backgroundColor = "transparent";
      td.innerHTML = "<br>";
      newTr.appendChild(td);
    }
    if (position === "above") {
      tr.parentElement?.insertBefore(newTr, tr);
    } else {
      tr.parentElement?.insertBefore(newTr, tr.nextSibling);
    }
    handleEditorInput();
    setContextMenu(null);
  };

  const insertColumn = (cell: HTMLTableCellElement, position: "left" | "right") => {
    const tr = cell.closest("tr");
    const table = cell.closest("table");
    if (!tr || !table) return;
    const colIndex = Array.from(tr.children).indexOf(cell);
    const rows = Array.from(table.querySelectorAll("tr"));

    rows.forEach((row) => {
      const td = document.createElement("td");
      td.setAttribute("contenteditable", "true");
      td.style.border = "1px solid var(--panel-border)";
      td.style.padding = "8px 12px";
      td.style.minWidth = "40px";
      td.style.height = "36px";
      td.style.backgroundColor = "transparent";
      td.innerHTML = "<br>";

      const targetIndex = position === "left" ? colIndex : colIndex + 1;
      if (targetIndex >= row.children.length) {
        row.appendChild(td);
      } else {
        row.insertBefore(td, row.children[targetIndex]);
      }
    });

    handleEditorInput();
    setContextMenu(null);
  };

  const deleteRow = (cell: HTMLTableCellElement) => {
    const tr = cell.closest("tr");
    const table = cell.closest("table");
    if (!tr || !table) return;
    tr.remove();
    if (table.querySelectorAll("tr").length === 0) table.remove();
    handleEditorInput();
    setContextMenu(null);
  };

  const deleteColumn = (cell: HTMLTableCellElement) => {
    const tr = cell.closest("tr");
    const table = cell.closest("table");
    if (!tr || !table) return;
    const colIndex = Array.from(tr.children).indexOf(cell);
    const rows = Array.from(table.querySelectorAll("tr"));

    rows.forEach((row) => {
      if (row.children[colIndex]) row.children[colIndex].remove();
    });

    if (table.querySelectorAll("td, th").length === 0) table.remove();
    handleEditorInput();
    setContextMenu(null);
  };

  const deleteTable = (cell: HTMLTableCellElement) => {
    const table = cell.closest("table");
    if (table) table.remove();
    handleEditorInput();
    setContextMenu(null);
  };

  const handleTableInsert = (rows: number, cols: number) => {
    let html = `<table contenteditable="false" draggable="true" class="sanctum-editor-table" style="width: 360px; max-width: 100%; border-collapse: collapse; margin: 14px 0; border: 1px solid var(--panel-border); position: relative; user-select: none;">`;

    html += `<caption class="sanctum-table-drag-handle" contenteditable="false" style="caption-side: top; background: rgba(255,255,255,0.08); border: 1px solid var(--panel-border); border-bottom: none; padding: 6px; font-size: 11px; color: var(--text-sub); font-weight: 700; cursor: grab; user-select: none; text-align: center;">⠿ 드래그하여 글자 사이로 이동</caption><tbody>`;

    for (let r = 0; r < rows; r++) {
      html += `<tr>`;
      for (let c = 0; c < cols; c++) {
        html += `<td contenteditable="true" style="border: 1px solid var(--panel-border); padding: 8px 10px; min-width: 40px; height: 36px; overflow-wrap: break-word; word-break: break-all; background-color: transparent; cursor: text;"><br></td>`;
      }
      html += `</tr>`;
    }
    html += `</tbody></table><p><br></p>`;
    insertCustomHTML(html);
  };

  const getNextCount = (type: string): { num: number; char: string } => {
    const editorEl = editorRef.current;
    if (!editorEl) return { num: 1, char: "1" };

    const fullText = editorEl.innerText || "";

    if (type.startsWith("num-")) {
      if (type === "num-l1") {
        const l1Matches = [...fullText.matchAll(/(?:^|\n)(\d+)\.\s/g)];
        const count = l1Matches.length;
        return { num: count + 1, char: String(count + 1) };
      }

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
      if (type === "alpha-l1") {
        const l1Matches = [...fullText.matchAll(/(?:^|\n)([A-Z])\.\s/g)];
        const count = l1Matches.length;
        const charCode = 65 + (count % 26);
        return { num: count + 1, char: String.fromCharCode(charCode) };
      }

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
    const cleanedContent = cleanHTMLForSave(currentContent);
    const draftData = { ...newNotice, content: cleanedContent };
    localStorage.setItem("notice_draft", JSON.stringify(draftData));
    alert("임시저장 되었습니다.");
  };

  const handleSubmit = async () => {
    if (!newNotice.title.trim()) return alert("제목을 입력해주세요.");
    const currentContent = editorRef.current ? editorRef.current.innerHTML : newNotice.content;
    const cleanedContent = cleanHTMLForSave(currentContent);

    if (LINK_ONLY_CATEGORIES.includes(newNotice.type) && !newNotice.link?.trim())
      return alert("외부 링크(URL)를 입력해주세요.");
    if (!LINK_ONLY_CATEGORIES.includes(newNotice.type) && !cleanedContent.trim())
      return alert("내용을 입력해주세요.");
    if (
      (newNotice.type === "생텀 업데이트" || newNotice.type === "생텀 공지사항") &&
      !isMaster
    )
      return alert("해당 카테고리는 길드마스터 전용입니다.");

    let finalId = editId || Date.now();

    const payload: Omit<Notice, "id"> = {
      type: newNotice.type,
      title: newNotice.title,
      content: LINK_ONLY_CATEGORIES.includes(newNotice.type) ? "" : cleanedContent,
      link: LINK_ONLY_CATEGORIES.includes(newNotice.type) ? newNotice.link : undefined,
      author: user?.nickname || "관리자",
      is_pinned: newNotice.isPinned,
      created_at: new Date().toISOString(),
      poll: pendingPoll || undefined,
      likes: 0,
      dislikes: 0,
    };

    if (isEditMode && editId) {
      try {
        await supabase.from("notices").update(payload).eq("id", editId);
      } catch (e) {
        console.warn("Supabase update warning fallback to local storage:", e);
      }

      const localDb: Notice[] = JSON.parse(localStorage.getItem("notices_mock_db") || "[]");
      const updatedDb = localDb.map((n) =>
        Number(n.id) === Number(editId) ? { ...n, ...payload, id: editId } : n
      );
      localStorage.setItem("notices_mock_db", JSON.stringify(updatedDb));
    } else {
      try {
        const { data, error } = await supabase.from("notices").insert([payload]).select();
        if (!error && data && data.length > 0 && data[0].id) {
          finalId = data[0].id;
        }
      } catch (e) {
        console.warn("Supabase insert warning fallback to local storage:", e);
      }

      const localDb: Notice[] = JSON.parse(localStorage.getItem("notices_mock_db") || "[]");
      const newEntry: Notice = { id: finalId, ...payload };
      localStorage.setItem("notices_mock_db", JSON.stringify([newEntry, ...localDb]));
    }

    localStorage.removeItem("notice_draft");

    if (NOTICE_CATEGORIES.includes(newNotice.type)) {
      router.push(`/kerygma?id=${finalId}`);
    } else {
      router.push("/gnosis");
    }
  };

  if (!mounted) return null;

  if (!canWriteNotice) {
    return (
      <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-xl font-bold text-red-400 mb-2">접근 권한 제한</h1>
        <p className="text-xs text-[var(--text-sub)] mb-4">
          공략/공지 작성 및 수정은 길드 관리자 계정만 이용 가능합니다.
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
    <main className="h-[calc(100vh-4.5rem)] sm:h-[calc(100vh-5rem)] bg-[var(--background)] text-[var(--foreground)] overflow-hidden flex flex-col p-2 sm:p-5">
      <div className="max-w-[1400px] w-full mx-auto flex flex-col h-full space-y-2 sm:space-y-3 min-h-0">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[var(--panel-border)] pb-2 sm:pb-2.5 gap-2 sm:gap-3 shrink-0">
          <h1 className="text-base sm:text-lg font-bold text-[var(--text-main)] flex items-center gap-2">
            <span>✏️</span>
            <span>{isEditMode ? "공략 / 공지 게시글 수정" : "공략 / 공지 게시글 작성"}</span>
          </h1>

          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <button
              onClick={handleSaveDraft}
              className="flex-1 sm:flex-none bg-[var(--inner-box)] border border-[var(--panel-border)] hover:bg-[var(--panel-hover)] text-[var(--text-main)] text-[11px] sm:text-[0.75rem] font-bold px-3 py-1.5 rounded-lg transition cursor-pointer"
            >
              임시저장
            </button>
            <button
              onClick={() => {
                if (confirm("작성 중인 내용이 지워질 수 있습니다. 돌아가시겠습니까?")) {
                  if (NOTICE_CATEGORIES.includes(newNotice.type)) {
                    router.push("/kerygma");
                  } else {
                    router.push("/gnosis");
                  }
                }
              }}
              className="flex-1 sm:flex-none bg-[var(--inner-box)] border border-[var(--panel-border)] hover:bg-red-500/10 hover:text-red-400 text-[var(--text-main)] text-[11px] sm:text-[0.75rem] font-bold px-3 py-1.5 rounded-lg transition cursor-pointer"
            >
              취소
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 sm:flex-none bg-[var(--accent)] hover:bg-[var(--accent-strong)] text-[var(--accent-fg)] text-[11px] sm:text-[0.75rem] font-bold px-5 py-1.5 rounded-lg transition shadow cursor-pointer"
            >
              {isEditMode ? "수정완료" : "작성완료"}
            </button>
          </div>
        </header>

        <div className="bg-[var(--panel)] rounded-xl border border-[var(--panel-border)] overflow-hidden shadow-sm flex flex-col flex-1 min-h-0">
          <div className="flex flex-col shrink-0 border-b border-[var(--panel-border)] bg-[var(--panel)] relative z-30">
            {/* 🎯 모바일 뷰 최적화 카테고리 탭 (가로 스크롤 및 콤팩트 패딩 적용) */}
            <div className="bg-[var(--inner-box)] border-b border-[var(--panel-border)] p-2 sm:p-2.5 flex items-center gap-1.5 overflow-x-auto custom-scrollbar shrink-0">
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
                  className={`px-2.5 py-1 rounded text-[10px] sm:text-[0.7rem] font-bold transition border whitespace-nowrap shrink-0 cursor-pointer ${
                    newNotice.type === cat
                      ? "bg-[var(--text-main)] text-[var(--panel)] border-[var(--text-main)]"
                      : "bg-[var(--panel)] text-[var(--text-sub)] border-[var(--panel-border)] hover:border-[var(--text-sub)] disabled:opacity-30"
                  }`}
                >
                  {cat}
                </button>
              ))}
              <label className="ml-auto flex items-center gap-1.5 cursor-pointer group px-2 shrink-0">
                <input
                  type="checkbox"
                  checked={newNotice.isPinned}
                  onChange={(e) => setNewNotice({ ...newNotice, isPinned: e.target.checked })}
                  className="w-3.5 h-3.5 rounded cursor-pointer accent-red-500"
                />
                <span className="text-[10px] sm:text-[0.75rem] font-bold text-[var(--text-sub)] group-hover:text-[var(--text-main)]">
                  📌 필독
                </span>
              </label>
            </div>

            <input
              type="text"
              placeholder="제목을 입력하세요"
              value={newNotice.title}
              onChange={(e) => setNewNotice({ ...newNotice, title: e.target.value })}
              className="w-full bg-[var(--panel)] text-[var(--text-main)] text-[0.95rem] sm:text-[1rem] font-bold px-3 sm:px-4 py-2.5 sm:py-3 border-b border-[var(--panel-border)] focus:outline-none placeholder-[var(--text-sub)]/50 shrink-0"
            />

            {!LINK_ONLY_CATEGORIES.includes(newNotice.type) && (
              <div
                className="flex items-center overflow-x-auto sm:flex-wrap gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 bg-[#252528] text-zinc-300 relative z-10 shrink-0 custom-scrollbar"
                onMouseDown={(e) => e.preventDefault()}
              >
                <div className="flex items-center bg-[#1c1c1e] border border-zinc-700 rounded overflow-hidden shrink-0">
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

                <div className="flex items-center bg-[#1c1c1e] border border-zinc-700 rounded overflow-hidden shrink-0">
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

                <div className="relative shrink-0">
                  <button
                    onClick={() =>
                      setActivePopover(activePopover === "heading" ? null : "heading")
                    }
                    className="flex items-center gap-1 px-2.5 h-7 bg-[#1c1c1e] border border-zinc-700 rounded text-[10px] sm:text-[0.7rem] font-bold cursor-pointer text-[var(--accent)] hover:bg-zinc-700"
                  >
                    <span>📌 제목/구조</span> <span className="text-[0.5rem] sm:text-[0.6rem]">▼</span>
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

                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="relative">
                    <button
                      onClick={() =>
                        setActivePopover(activePopover === "fontSize" ? null : "fontSize")
                      }
                      className="flex items-center gap-1 px-2 h-7 bg-[#1c1c1e] border border-zinc-700 rounded text-[10px] sm:text-[0.7rem] font-bold cursor-pointer"
                    >
                      크기 <span className="text-[0.5rem] sm:text-[0.6rem]">▼</span>
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
                      className="flex items-center gap-1 px-2 h-7 bg-[#1c1c1e] border border-zinc-700 rounded text-[10px] sm:text-[0.7rem] font-bold cursor-pointer"
                    >
                      간격 <span className="text-[0.5rem] sm:text-[0.6rem]">▼</span>
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

                <div className="flex items-center gap-1.5 border-l border-zinc-700 pl-1.5 sm:pl-2 relative shrink-0">
                  <button
                    onClick={() => setActivePopover(activePopover === "table" ? null : "table")}
                    className="flex items-center gap-1 px-2 h-7 bg-[#1c1c1e] border border-zinc-700 text-zinc-200 hover:text-white rounded text-[10px] sm:text-[0.7rem] font-bold cursor-pointer"
                    title="표 생성"
                  >
                    <span>🔲 표 생성</span>
                    <span className="text-[0.5rem] sm:text-[0.6rem]">▼</span>
                  </button>

                  {activePopover === "table" && (
                    <div className="absolute top-full mt-1 left-0 bg-[#252528] border border-zinc-700 rounded-lg shadow-2xl p-3 z-50 flex flex-col items-center w-[210px]">
                      <span className="text-[0.68rem] font-bold text-[var(--accent)] mb-1.5">
                        📐 표 생성 {tableGrid.r > 0 ? `(${tableGrid.r}행 ${tableGrid.c}열)` : ""}
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
                                  ? "bg-[var(--accent)]/40 border-[var(--accent)]"
                                  : "border-zinc-700 bg-zinc-800"
                              }`}
                            />
                          ))
                        )}
                      </div>
                      <p className="text-[0.62rem] text-zinc-400 mt-2 text-center">
                        💡 표 상단 바[⠿]를 잡고 글자 사이로 이동하거나 <br />
                        <b>[우클릭]</b>으로 크기/색상을 조정하세요!
                      </p>
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
                    className="flex items-center gap-1.5 px-2.5 sm:px-3 h-7 bg-[#1c1c1e] border border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white rounded text-[10px] sm:text-[0.7rem] font-bold cursor-pointer"
                  >
                    📊 투표
                  </button>
                </div>
              </div>
            )}
          </div>

          {LINK_ONLY_CATEGORIES.includes(newNotice.type) ? (
            <div className="p-4 flex flex-col gap-1.5 bg-[var(--inner-box)] flex-1 min-h-0 overflow-y-auto custom-scrollbar">
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
            <div className="flex flex-col flex-1 min-h-0 relative overflow-hidden bg-[var(--panel)]">
              <div
                ref={editorRef}
                contentEditable
                spellCheck={false}
                onInput={handleEditorInput}
                onClick={() => setActivePopover(null)}
                onKeyDown={handleEditorKeyDown}
                onContextMenu={handleEditorContextMenu}
                onMouseMove={handleEditorMouseMove}
                onMouseLeave={handleEditorMouseLeave}
                onMouseDown={handleEditorMouseDown}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="w-full flex-1 min-h-0 p-3 sm:p-5 bg-[var(--panel)] text-[0.9rem] sm:text-[0.95rem] leading-[1.65] text-[var(--text-main)] outline-none custom-scrollbar prose-editor overflow-y-auto"
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

      {contextMenu && (
        <div
          className="fixed bg-[#202023] border border-zinc-700 shadow-2xl rounded-xl p-2.5 min-w-[250px] z-[9999] text-zinc-200 flex flex-col gap-2 text-[0.75rem]"
          style={{
            top: Math.min(contextMenu.y, window.innerHeight - 420),
            left: Math.min(contextMenu.x, window.innerWidth - 260),
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col gap-1.5">
            <span className="text-[0.65rem] font-bold text-[var(--accent)]">📐 표 전체 크기 & 배치</span>
            <div className="flex items-center justify-between text-[0.65rem] gap-1">
              <span className="text-zinc-400">너비:</span>
              <div className="flex gap-1">
                {[
                  { label: "100%", val: "100%" },
                  { label: "75%", val: "75%" },
                  { label: "360px", val: "360px" },
                  { label: "자동", val: "auto" },
                ].map((w) => (
                  <button
                    key={w.label}
                    onClick={() => applyTableWidth(contextMenu.cell, w.val)}
                    className="px-1.5 py-0.5 bg-[#141416] border border-zinc-700 hover:border-[var(--accent)] hover:text-[var(--accent)] text-zinc-300 rounded cursor-pointer"
                  >
                    {w.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between text-[0.65rem] gap-1">
              <span className="text-zinc-400">정렬:</span>
              <div className="flex gap-1">
                {[
                  { label: "좌측", val: "left" },
                  { label: "중앙", val: "center" },
                  { label: "우측", val: "right" },
                ].map((a) => (
                  <button
                    key={a.label}
                    onClick={() => applyTableAlign(contextMenu.cell, a.val as any)}
                    className="px-2 py-0.5 bg-[#141416] border border-zinc-700 hover:border-[var(--accent)] hover:text-[var(--accent)] text-zinc-300 rounded cursor-pointer"
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="h-[1px] bg-zinc-700/80 my-0.5" />

          <div className="flex flex-col gap-1.5">
            <span className="text-[0.65rem] font-bold text-zinc-400">🎨 셀 배경색 선택</span>
            <div className="grid grid-cols-4 gap-1.5">
              {CELL_BG_COLORS.map((c) => (
                <button
                  key={c.name}
                  onClick={() => applyCellBgColor(contextMenu.cell, c.value)}
                  className="flex items-center justify-center gap-1 py-1 px-1 bg-[#141416] border hover:border-white rounded text-[0.63rem] text-zinc-300 cursor-pointer"
                  style={{ borderColor: c.border }}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full border border-zinc-600 inline-block shrink-0"
                    style={{ backgroundColor: c.value }}
                  />
                  <span>{c.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="h-[1px] bg-zinc-700/80 my-0.5" />

          <div className="flex flex-col gap-1">
            <span className="text-[0.65rem] font-bold text-zinc-400">➕ 행 / 열 추가</span>
            <div className="grid grid-cols-2 gap-1">
              <button
                onClick={() => insertRow(contextMenu.cell, "above")}
                className="px-2 py-1 bg-[#141416] border border-zinc-700 hover:bg-zinc-700 rounded text-left flex items-center gap-1 cursor-pointer"
              >
                <span>⬆️</span> 위로 행 삽입
              </button>
              <button
                onClick={() => insertRow(contextMenu.cell, "below")}
                className="px-2 py-1 bg-[#141416] border border-zinc-700 hover:bg-zinc-700 rounded text-left flex items-center gap-1 cursor-pointer"
              >
                <span>⬇️</span> 아래 행 삽입
              </button>
              <button
                onClick={() => insertColumn(contextMenu.cell, "left")}
                className="px-2 py-1 bg-[#141416] border border-zinc-700 hover:bg-zinc-700 rounded text-left flex items-center gap-1 cursor-pointer"
              >
                <span>⬅️</span> 좌측 열 삽입
              </button>
              <button
                onClick={() => insertColumn(contextMenu.cell, "right")}
                className="px-2 py-1 bg-[#141416] border border-zinc-700 hover:bg-zinc-700 rounded text-left flex items-center gap-1 cursor-pointer"
              >
                <span>➡️</span> 우측 열 삽입
              </button>
            </div>
          </div>

          <div className="h-[1px] bg-zinc-700/80 my-0.5" />

          <div className="flex flex-col gap-1">
            <span className="text-[0.65rem] font-bold text-zinc-400">📏 셀 너비 / 높이 퀵 설정</span>
            <div className="flex items-center justify-between gap-1 text-[0.65rem]">
              <span className="text-zinc-400">높이:</span>
              <div className="flex gap-1">
                {["30px", "45px", "60px"].map((h) => (
                  <button
                    key={h}
                    onClick={() => applyCellDimensions(contextMenu.cell, { height: h })}
                    className="px-1.5 py-0.5 bg-[#141416] border border-zinc-700 hover:border-[var(--accent)] text-zinc-300 rounded cursor-pointer"
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between gap-1 text-[0.65rem]">
              <span className="text-zinc-400">너비:</span>
              <div className="flex gap-1">
                {["80px", "140px", "200px"].map((w) => (
                  <button
                    key={w}
                    onClick={() => applyCellDimensions(contextMenu.cell, { width: w })}
                    className="px-1.5 py-0.5 bg-[#141416] border border-zinc-700 hover:border-[var(--accent)] text-zinc-300 rounded cursor-pointer"
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="h-[1px] bg-zinc-700/80 my-0.5" />

          <div className="flex items-center justify-between gap-1 text-[0.7rem]">
            <button
              onClick={() => deleteRow(contextMenu.cell)}
              className="px-2 py-1 bg-red-950/40 border border-red-800/60 hover:bg-red-900/60 text-red-300 rounded cursor-pointer flex-1"
            >
              🗑️ 행 삭제
            </button>
            <button
              onClick={() => deleteColumn(contextMenu.cell)}
              className="px-2 py-1 bg-red-950/40 border border-red-800/60 hover:bg-red-900/60 text-red-300 rounded cursor-pointer flex-1"
            >
              🗑️ 열 삭제
            </button>
            <button
              onClick={() => deleteTable(contextMenu.cell)}
              className="px-2 py-1 bg-red-900 border border-red-700 hover:bg-red-800 text-white rounded cursor-pointer flex-1 font-bold"
            >
              ❌ 표 삭제
            </button>
          </div>
        </div>
      )}
    </main>
  );
}