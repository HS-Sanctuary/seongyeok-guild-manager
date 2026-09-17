"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Notice, PollData } from "@/types/kerygma";
import KerygmaPollModal from "@/components/kerygma/KerygmaPollModal";
import KerygmaEditorToolbar from "@/components/kerygma/KerygmaEditorToolbar";
import KerygmaTableContextMenu from "@/components/kerygma/KerygmaTableContextMenu";

const KERYGMA_CATEGORIES = [
  "길드 공지사항",
  "길드 이벤트",
  "생텀 공지사항",
  "생텀 업데이트",
  "생텀 가이드",
  "모비노기 공식",
];

const LINK_ONLY_CATEGORIES = ["생텀 가이드", "모비노기 공식"];

// 🎯 [이미지 초경량 WebP 자동 리샘플링 엔진]
const compressAndResampleImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 1000;
        const MAX_HEIGHT = 2000;

        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }
        if (height > MAX_HEIGHT) {
          width = Math.round((width * MAX_HEIGHT) / height);
          height = MAX_HEIGHT;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas 생성 실패"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL("image/webp", 0.7);
        resolve(compressedBase64);
      };
      img.onerror = (err) => reject(err);
      img.src = e.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};

export default function KerygmaWritePage() {
  const router = useRouter();
  const editorRef = useRef<HTMLDivElement>(null);
  const [user, setUser] = useState<any>(null);
  const [mounted, setMounted] = useState(false);

  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const [newNotice, setNewNotice] = useState({
    type: "길드 공지사항",
    title: "",
    content: "",
    link: "",
    isPinned: false,
  });

  const [activePopover, setActivePopover] = useState<
    "fontSize" | "lineHeight" | "table" | "symbol" | "heading" | null
  >(null);

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

  // 투표 관련 상태
  const [isPollModalOpen, setIsPollModalOpen] = useState(false);
  const [pendingPoll, setPendingPoll] = useState<PollData | null>(null);
  const [showPollPreviewCard, setShowPollPreviewCard] = useState(false);
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
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActivePopover(null);
        setContextMenu(null);
        setIsCategoryModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    setMounted(true);
    const savedUser = localStorage.getItem("nexus_user");
    if (savedUser) setUser(JSON.parse(savedUser));

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const editIdParam = params.get("editId");

      if (editIdParam) {
        const idNum = Number(editIdParam);
        setIsEditMode(true);
        setEditId(idNum);

        // Supabase DB에서 게시글 조회
        supabase
          .from("notices")
          .select("*")
          .eq("id", idNum)
          .single()
          .then(({ data, error }) => {
            if (error || !data) {
              console.error("Supabase load error:", error);
              alert("공지글을 불러오지 못했습니다.");
              return;
            }

            setNewNotice({
              type: data.type,
              title: data.title,
              content: data.content || "",
              link: data.link || "",
              isPinned: data.is_pinned || false,
            });
            if (data.poll) {
              setPendingPoll(data.poll);
              setPollForm(data.poll);
            }

            setTimeout(() => {
              if (editorRef.current && !LINK_ONLY_CATEGORIES.includes(data.type)) {
                editorRef.current.innerHTML = data.content || "";
              }
            }, 120);
          });
      } else {
        const draft = localStorage.getItem("kerygma_notice_draft");
        if (draft) {
          if (window.confirm("임시저장된 공지글이 있습니다. 가져오시겠습니까?")) {
            try {
              const parsed = JSON.parse(draft);
              setNewNotice({
                type: parsed.type || "길드 공지사항",
                title: parsed.title || "",
                content: parsed.content || "",
                link: parsed.link || "",
                isPinned: parsed.isPinned || false,
              });
              if (parsed.poll) {
                setPendingPoll(parsed.poll);
                setPollForm(parsed.poll);
              }
              setTimeout(() => {
                if (editorRef.current && !LINK_ONLY_CATEGORIES.includes(parsed.type)) {
                  editorRef.current.innerHTML = parsed.content || "";
                }
              }, 120);
            } catch (e) {
              console.error("Draft restore error:", e);
            }
          } else {
            localStorage.removeItem("kerygma_notice_draft");
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

  const isMaster =
    user?.nickname === "한설" ||
    user?.role === "길드마스터" ||
    user?.role === "길드 마스터" ||
    user?.role === "마스터" ||
    user?.role === "admin";

  const isSubMaster =
    user?.role === "부길드마스터" ||
    user?.role === "부마스터" ||
    user?.role === "admin";

  const canWriteNotice = isMaster || isSubMaster;
  const isLinkOnly = LINK_ONLY_CATEGORIES.includes(newNotice.type);

  const handleEditorInput = () => {
    if (editorRef.current) {
      setNewNotice((prev) => ({
        ...prev,
        content: editorRef.current!.innerHTML,
      }));
    }
  };

  const handleEditorPaste = async (e: React.ClipboardEvent<HTMLDivElement>) => {
    const clipboardData = e.clipboardData;
    if (!clipboardData) return;

    const items = Array.from(clipboardData.items);
    const imageItem = items.find((item) => item.type.startsWith("image/"));

    if (imageItem) {
      e.preventDefault();
      const file = imageItem.getAsFile();
      if (!file) return;

      try {
        const compressedBase64 = await compressAndResampleImage(file);
        const imgHtml = `<img src="${compressedBase64}" alt="첨부 이미지" class="max-w-full rounded-xl my-2.5 border border-[var(--panel-border)] shadow-md inline-block" style="max-width: 100%; height: auto;" /><p><br></p>`;
        insertCustomHTML(imgHtml);
      } catch (err) {
        console.error("Image compression error:", err);
        alert("이미지 압축 처리 중 오류가 발생했습니다.");
      }
      return;
    }

    const hasMedia = items.some(
      (item) => item.type.startsWith("video/") || item.type.startsWith("audio/")
    );
    if (hasMedia) {
      e.preventDefault();
      alert("동영상 및 오디오 파일은 DB 용량 보호를 위해 붙여넣기가 제한됩니다.");
      return;
    }

    const pastedHtml = clipboardData.getData("text/html");
    if (pastedHtml && /<(video|audio|iframe|embed|object)/i.test(pastedHtml)) {
      e.preventDefault();
      const plainText = clipboardData.getData("text/plain");
      executeCommand("insertText", plainText);
      alert("외부 동영상 및 서식 미디어 태그가 자동 제거되고 텍스트만 안전하게 붙여넣어졌습니다.");
      return;
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    if (draggedTableRef.current) {
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
      return;
    }

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      e.preventDefault();
      e.stopPropagation();

      const files = Array.from(e.dataTransfer.files);
      const hasMedia = files.some(
        (f) => f.type.startsWith("video/") || f.type.startsWith("audio/")
      );
      if (hasMedia) {
        alert("동영상 및 오디오 파일은 DB 용량 보호를 위해 드롭 첨부가 제한됩니다.");
        return;
      }

      const imageFiles = files.filter((f) => f.type.startsWith("image/"));
      if (imageFiles.length > 0) {
        for (const file of imageFiles) {
          try {
            const compressedBase64 = await compressAndResampleImage(file);
            const imgHtml = `<img src="${compressedBase64}" alt="첨부 이미지" class="max-w-full rounded-xl my-2.5 border border-[var(--panel-border)] shadow-md inline-block" style="max-width: 100%; height: auto;" /><p><br></p>`;
            insertCustomHTML(imgHtml);
          } catch (err) {
            console.error("Drop image compression error:", err);
          }
        }
      }
    }
  };

  const cleanHTMLForSave = (rawHtml: string): string => {
    if (!rawHtml) return "";
    if (typeof window === "undefined") return rawHtml;
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = rawHtml;

    tempDiv
      .querySelectorAll("video, audio, iframe, embed, object, source")
      .forEach((el) => el.remove());

    tempDiv
      .querySelectorAll(".sanctum-table-drag-handle, caption")
      .forEach((el) => el.remove());

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
    const els = editorRef.current?.querySelectorAll(
      'font[size="7"], span[style*="xxx-large"]'
    );
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

    if (dragHandle) return;

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
          const editorWidth = editorRef.current
            ? editorRef.current.clientWidth - 40
            : 800;
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
          const { type, cell, startX, startY, startWidth, startHeight } =
            isResizingRef.current;
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

  // 표 조작 바인딩 메서드
  const applyCellBgColor = (cell: HTMLTableCellElement, color: string) => {
    cell.style.backgroundColor = color;
    handleEditorInput();
  };

  const applyTableWidth = (cell: HTMLTableCellElement, widthVal: string) => {
    const table = cell.closest("table");
    if (!table) return;
    table.style.width = widthVal;
    table.style.maxWidth = "100%";
    handleEditorInput();
  };

  const applyTableAlign = (
    cell: HTMLTableCellElement,
    align: "left" | "center" | "right"
  ) => {
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
    html += `<caption class="sanctum-table-drag-handle" contenteditable="false" style="caption-side: top; background: var(--inner-box); border: 1px solid var(--panel-border); border-bottom: none; padding: 6px; font-size: 11px; color: var(--text-sub); font-weight: 700; cursor: grab; user-select: none; text-align: center;">드래그하여 위치 이동</caption><tbody>`;

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

  const insertHeadingBlock = (type: string) => {
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
        prefix = `1. `;
        borderBottom = "2px solid var(--accent)";
        break;
      case "num-l2":
        prefix = `(1) `;
        fontSize = "16px";
        fontWeight = "700";
        color = "var(--accent)";
        marginLeft = "12px";
        marginTop = "14px";
        marginBottom = "6px";
        break;
      case "num-l3":
        prefix = `[1] `;
        fontSize = "14.5px";
        fontWeight = "600";
        color = "var(--text-sub)";
        marginLeft = "24px";
        marginTop = "10px";
        marginBottom = "4px";
        break;
      case "alpha-l1":
        prefix = `A. `;
        borderBottom = "2px solid var(--accent)";
        break;
      case "alpha-l2":
        prefix = `(A) `;
        fontSize = "16px";
        fontWeight = "700";
        color = "var(--accent)";
        marginLeft = "12px";
        marginTop = "14px";
        marginBottom = "6px";
        break;
      case "alpha-l3":
        prefix = `[A] `;
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

  const handleInsertPoll = (pollData: PollData) => {
    setPendingPoll(pollData);
    setIsPollModalOpen(false);
  };

  const handleSaveDraft = () => {
    const currentContent = editorRef.current
      ? editorRef.current.innerHTML
      : newNotice.content;
    const cleanedContent = cleanHTMLForSave(currentContent);
    const draftData = {
      ...newNotice,
      content: cleanedContent,
      poll: pendingPoll || undefined,
    };
    localStorage.setItem("kerygma_notice_draft", JSON.stringify(draftData));
    alert("임시저장 완료 (본문 및 투표 데이터 포함)");
  };

  // 🎯 [Supabase 100% 직결 및 router.replace 히스토리 대체 적용]
  const handleSubmit = async () => {
    if (!newNotice.title.trim()) return alert("제목을 입력해주세요.");

    const currentContent = editorRef.current
      ? editorRef.current.innerHTML
      : newNotice.content;
    const cleanedContent = cleanHTMLForSave(currentContent);

    if (isLinkOnly && !newNotice.link?.trim()) {
      return alert("외부 이동 URL 링크를 입력해주세요.");
    }
    if (!isLinkOnly && !cleanedContent.trim() && !pendingPoll) {
      return alert("내용 또는 투표를 작성해주세요.");
    }
    if (
      (newNotice.type === "생텀 업데이트" || newNotice.type === "생텀 공지사항") &&
      !isMaster
    ) {
      return alert("해당 카테고리는 길드마스터/관리자 전용입니다.");
    }

    const payloadSizeKB = Math.round(new Blob([cleanedContent]).size / 1024);
    if (payloadSizeKB > 2000) {
      return alert(
        `게시글 데이터 용량이 너무 큽니다 (${payloadSizeKB}KB). 첨부된 이미지가 너무 많거나 고용량인 경우 일부 정리 후 시도해주세요.`
      );
    }

    let finalId = editId;

    const payload = {
      type: newNotice.type,
      title: newNotice.title,
      content: isLinkOnly ? "" : cleanedContent,
      link: isLinkOnly ? newNotice.link : null,
      author: user?.nickname || "관리자",
      is_pinned: newNotice.isPinned,
      created_at: new Date().toISOString(),
      poll: pendingPoll || null,
      likes: 0,
      dislikes: 0,
    };

    if (isEditMode && editId) {
      const { error } = await supabase.from("notices").update(payload).eq("id", editId);
      if (error) {
        console.error("Supabase update error:", error);
        return alert(
          `[DB 수정 실패] ${error.message}\n\n※ Supabase SQL Editor에서 알맞은 컬럼(poll, link 등) 추가 및 RLS 비활성화 쿼리를 실행해 주셨는지 확인하세요.`
        );
      }
    } else {
      const { data, error } = await supabase
        .from("notices")
        .insert([payload])
        .select();

      if (error) {
        console.error("Supabase insert error:", error);
        return alert(
          `[DB 저장 실패] ${error.message}\n\n※ Supabase SQL Editor에서 알맞은 컬럼(poll, link 등) 추가 및 RLS 비활성화 쿼리를 실행해 주셨는지 확인하세요.`
        );
      }

      if (data && data.length > 0 && data[0].id) {
        finalId = data[0].id;
      }
    }

    localStorage.removeItem("kerygma_notice_draft");
    alert(isEditMode ? "공지글이 성공적으로 수정되었습니다." : "공지글이 성공적으로 등록되었습니다!");
    
    // 🎯 [핵심 Fix: push 대신 replace를 사용하여 히스토리 스택 상의 작성 페이지를 새로 생성된 공지 상세/목록으로 교체]
    router.replace(finalId ? `/kerygma?id=${finalId}` : "/kerygma");
  };

  if (!mounted) return null;

  if (!canWriteNotice) {
    return (
      <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-xl font-bold text-red-400 mb-2">접근 권한 제한</h1>
        <p className="text-xs text-[var(--text-sub)] mb-4">
          공지 작성 및 수정은 길드 관리자 계정만 이용 가능합니다.
        </p>
        <button
          onClick={() => router.push("/kerygma")}
          className="px-4 py-2 bg-[var(--panel)] border border-[var(--panel-border)] rounded-lg text-xs font-bold text-[var(--text-main)] cursor-pointer"
        >
          케리그마 목록으로 돌아가기
        </button>
      </main>
    );
  }

  return (
    <main className="h-[calc(100vh-4.5rem)] sm:h-[calc(100vh-5rem)] bg-[var(--background)] text-[var(--foreground)] flex flex-col p-2 sm:p-5 overflow-hidden relative">
      <div className="max-w-[1400px] w-full mx-auto flex flex-col h-full space-y-2 sm:space-y-3 min-h-0 overflow-hidden">
        
        {/* 상단 액션 바 */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[var(--panel-border)] pb-2 sm:pb-2.5 gap-2 sm:gap-3 shrink-0">
          <h1 className="text-base sm:text-lg font-bold text-[var(--text-main)]">
            {isEditMode ? "케리그마 게시글 수정" : "케리그마 게시글 작성"}
          </h1>

          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleSaveDraft}
              className="flex-1 sm:flex-none bg-[var(--inner-box)] border border-[var(--panel-border)] hover:bg-[var(--panel-hover)] text-[var(--text-main)] text-[11px] sm:text-[0.75rem] font-bold px-3 py-1.5 rounded-lg transition cursor-pointer"
            >
              임시저장
            </button>
            <button
              type="button"
              onClick={() => {
                if (confirm("작성 중인 내용이 지워질 수 있습니다. 돌아가시겠습니까?")) {
                  router.push("/kerygma");
                }
              }}
              className="flex-1 sm:flex-none bg-[var(--inner-box)] border border-[var(--panel-border)] hover:bg-red-500/10 hover:text-red-400 text-[var(--text-main)] text-[11px] sm:text-[0.75rem] font-bold px-3 py-1.5 rounded-lg transition cursor-pointer"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="flex-1 sm:flex-none bg-[var(--accent)] hover:bg-[var(--accent-strong)] text-[var(--accent-fg)] text-[11px] sm:text-[0.75rem] font-bold px-5 py-1.5 rounded-lg transition shadow cursor-pointer"
            >
              {isEditMode ? "수정완료" : "작성완료"}
            </button>
          </div>
        </header>

        {/* 메인 작성 카드 */}
        <div className="bg-[var(--panel)] rounded-xl border border-[var(--panel-border)] shadow-sm flex flex-col flex-1 min-h-0 overflow-hidden relative">
          
          {/* 헤더 및 툴바 영역 */}
          <div className="flex flex-col shrink-0 border-b border-[var(--panel-border)] bg-[var(--panel)] rounded-t-xl relative z-20 overflow-visible">
            
            {/* 카테고리 선택 영역 */}
            <div className="bg-[var(--inner-box)] border-b border-[var(--panel-border)] p-2 sm:p-2.5 flex items-center justify-between gap-2 rounded-t-xl relative z-10">
              
              <div className="hidden sm:flex items-center gap-1.5 overflow-x-auto custom-scrollbar shrink-0">
                {KERYGMA_CATEGORIES.map((cat) => {
                  const isSelected = newNotice.type === cat;
                  const isMasterOnly =
                    cat.includes("생텀") && !cat.includes("가이드") && !isMaster;

                  return (
                    <button
                      key={cat}
                      type="button"
                      disabled={isMasterOnly}
                      onClick={() => setNewNotice({ ...newNotice, type: cat })}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border whitespace-nowrap shrink-0 cursor-pointer ${
                        isSelected
                          ? "bg-[var(--text-main)] text-[var(--panel)] border-[var(--text-main)] shadow-sm"
                          : "bg-[var(--panel)] text-[var(--text-sub)] border-[var(--panel-border)] hover:border-[var(--text-sub)] hover:text-[var(--text-main)] disabled:opacity-30"
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>

              <div className="flex sm:hidden items-center gap-1.5">
                <div className="px-2.5 py-1 bg-[var(--text-main)] text-[var(--panel)] font-extrabold text-[11px] rounded shadow-sm shrink-0">
                  {newNotice.type}
                </div>
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(true)}
                  className="px-2.5 py-1 bg-[var(--panel)] hover:bg-[var(--panel-hover)] border border-[var(--panel-border)] hover:border-[var(--accent)] text-[var(--accent)] text-[11px] font-bold rounded transition cursor-pointer shrink-0"
                >
                  변경
                </button>
              </div>

              <label className="flex items-center gap-1.5 cursor-pointer group px-1 shrink-0">
                <input
                  type="checkbox"
                  checked={newNotice.isPinned}
                  onChange={(e) =>
                    setNewNotice({ ...newNotice, isPinned: e.target.checked })
                  }
                  className="w-3.5 h-3.5 rounded cursor-pointer accent-red-500"
                />
                <span className="text-[11px] sm:text-xs font-bold text-[var(--text-sub)] group-hover:text-[var(--text-main)]">
                  필독 설정
                </span>
              </label>
            </div>

            {/* 제목 입력란 */}
            <input
              type="text"
              placeholder="제목을 입력하세요"
              value={newNotice.title}
              onChange={(e) =>
                setNewNotice({ ...newNotice, title: e.target.value })
              }
              className="w-full bg-[var(--panel)] text-[var(--text-main)] text-[0.95rem] sm:text-[1rem] font-bold px-3 sm:px-4 py-2.5 sm:py-3 border-b border-[var(--panel-border)] focus:outline-none placeholder-[var(--text-sub)]/50 shrink-0 relative z-10"
            />

            {/* 서식 툴바 컴포넌트 */}
            {!isLinkOnly && (
              <KerygmaEditorToolbar
                executeCommand={executeCommand}
                insertCustomHTML={insertCustomHTML}
                applyFontSize={applyFontSize}
                applyLineHeight={applyLineHeight}
                insertHeadingBlock={insertHeadingBlock}
                handleTableInsert={handleTableInsert}
                pendingPoll={pendingPoll}
                onOpenPollModal={() => {
                  if (pendingPoll) setPollForm(pendingPoll);
                  setIsPollModalOpen(true);
                }}
                activePopover={activePopover}
                setActivePopover={setActivePopover}
              />
            )}

            {/* 스마트 슬림 투표 바 */}
            {pendingPoll && (
              <div className="bg-[var(--inner-box)] border-b border-[var(--panel-border)] px-3 sm:px-4 py-2 flex flex-col gap-2 shrink-0 transition-all relative z-10">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 overflow-hidden min-w-0">
                    <span className="px-2 py-0.5 bg-[var(--accent)] text-[var(--accent-fg)] text-[10px] font-extrabold rounded shrink-0">
                      투표 첨부됨
                    </span>
                    <span className="text-xs font-bold text-[var(--text-main)] truncate">
                      {pendingPoll.title}
                    </span>
                    <span className="text-[10px] text-[var(--text-sub)] hidden sm:inline shrink-0">
                      ({pendingPoll.options.length}개 항목 · {pendingPoll.allowMultiple ? "복수" : "단일"} · {pendingPoll.endDate})
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setShowPollPreviewCard(!showPollPreviewCard)}
                      className="px-2 py-1 bg-[var(--panel)] hover:bg-[var(--panel-hover)] border border-[var(--panel-border)] text-[10.5px] font-bold text-[var(--text-main)] rounded transition cursor-pointer"
                    >
                      {showPollPreviewCard ? "미리보기 닫기 ▲" : "카드 보기 ▼"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPollForm(pendingPoll);
                        setIsPollModalOpen(true);
                      }}
                      className="px-2 py-1 bg-[var(--panel)] hover:bg-[var(--panel-hover)] border border-[var(--panel-border)] text-[10.5px] font-bold text-[var(--accent)] rounded transition cursor-pointer"
                    >
                      수정
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm("첨부된 투표를 삭제하시겠습니까?")) {
                          setPendingPoll(null);
                          setShowPollPreviewCard(false);
                        }
                      }}
                      className="px-2 py-1 bg-red-950/40 hover:bg-red-900/60 border border-red-800/60 text-[10.5px] font-bold text-red-300 rounded transition cursor-pointer"
                    >
                      삭제
                    </button>
                  </div>
                </div>

                {showPollPreviewCard && (
                  <div className="mt-1 p-3 bg-[var(--panel)] border border-[var(--panel-border)] rounded-xl space-y-2 animate-fadeIn border-l-4 border-l-[var(--accent)]">
                    <div className="flex justify-between items-center text-[11px] font-bold border-b border-[var(--panel-border)]/50 pb-1.5">
                      <span className="text-[var(--text-main)]">{pendingPoll.title}</span>
                      <div className="flex items-center gap-1 text-[10px]">
                        <span className="px-1.5 py-0.5 bg-[var(--inner-box)] border border-[var(--panel-border)] text-[var(--text-sub)] rounded">
                          {pendingPoll.allowMultiple ? "복수 선택" : "단일 선택"}
                        </span>
                        <span className="px-1.5 py-0.5 bg-[var(--inner-box)] border border-[var(--panel-border)] text-[var(--text-sub)] rounded">
                          {pendingPoll.isAnonymous ? "익명" : "실명 공개"}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      {pendingPoll.options.map((opt, idx) => (
                        <div
                          key={opt.id || idx}
                          className="w-full bg-[var(--inner-box)] border border-[var(--panel-border)] rounded-lg p-2 flex items-center justify-between text-xs text-[var(--text-main)]"
                        >
                          <span className="truncate">{opt.text || `선택 ${idx + 1}`}</span>
                          <span className="text-[10px] text-[var(--text-sub)] bg-[var(--panel)] px-1.5 py-0.5 rounded border border-[var(--panel-border)] shrink-0">
                            0표 (0%)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 본문 및 외부 링크 분기 영역 */}
          {isLinkOnly ? (
            <div className="p-4 sm:p-6 flex flex-col gap-3 bg-[var(--inner-box)] flex-1 min-h-0 overflow-y-auto custom-scrollbar relative z-10 rounded-b-xl">
              <label className="text-xs sm:text-sm font-bold text-[var(--text-main)]">
                외부 바로가기 이동 URL 링크
              </label>
              <input
                type="url"
                placeholder="https://official.mabinogimobile.nexon.com..."
                value={newNotice.link || ""}
                onChange={(e) => setNewNotice({ ...newNotice, link: e.target.value })}
                className="w-full bg-[var(--panel)] border border-[var(--panel-border)] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[var(--text-main)] focus:border-[var(--accent)] outline-none transition"
              />
              <div className="p-3 bg-[var(--panel)] border border-[var(--panel-border)] rounded-xl space-y-1.5 text-[11px] sm:text-xs text-[var(--text-sub)]">
                <p className="font-bold text-[var(--accent)]">
                  외부 바로가기 링크 기능 동작 안내
                </p>
                <p>• [{newNotice.type}] 카테고리는 공지 목록에서 글 클릭 시 바로 외부 URL로 이동합니다.</p>
                <p>• 보안 환경을 위해 접속 전 보안 이동 확인 팝업이 표시됩니다.</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 min-h-0 relative z-10 overflow-y-auto custom-scrollbar bg-[var(--panel)] rounded-b-xl flex flex-col">
              <div
                ref={editorRef}
                contentEditable
                spellCheck={false}
                onInput={handleEditorInput}
                onPaste={handleEditorPaste}
                onClick={() => setActivePopover(null)}
                onKeyDown={handleEditorKeyDown}
                onContextMenu={handleEditorContextMenu}
                onMouseMove={handleEditorMouseMove}
                onMouseLeave={handleEditorMouseLeave}
                onMouseDown={handleEditorMouseDown}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="w-full flex-1 min-h-[300px] p-3 sm:p-5 bg-[var(--panel)] text-[0.9rem] sm:text-[0.95rem] leading-[1.65] text-[var(--text-main)] outline-none custom-scrollbar prose-editor"
                data-placeholder="케리그마 공지사항 내용을 작성해주세요..."
              />
            </div>
          )}
        </div>
      </div>

      {/* 투표 모달 */}
      <KerygmaPollModal
        isOpen={isPollModalOpen}
        onClose={() => setIsPollModalOpen(false)}
        pollForm={pollForm}
        setPollForm={setPollForm}
        onInsertPoll={handleInsertPoll}
      />

      {/* 모바일 카테고리 모달 */}
      {isCategoryModalOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[9999] flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setIsCategoryModalOpen(false)}
        >
          <div
            className="bg-[var(--panel)] border border-[var(--panel-border)] rounded-2xl p-5 w-full max-w-xs shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[var(--panel-border)] pb-2.5">
              <h3 className="text-sm font-bold text-[var(--text-main)]">
                카테고리 선택
              </h3>
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="text-[var(--text-sub)] hover:text-[var(--text-main)] text-xs font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {KERYGMA_CATEGORIES.map((cat) => {
                const isSelected = newNotice.type === cat;
                const isMasterOnly =
                  cat.includes("생텀") && !cat.includes("가이드") && !isMaster;

                return (
                  <button
                    key={cat}
                    type="button"
                    disabled={isMasterOnly}
                    onClick={() => {
                      setNewNotice({ ...newNotice, type: cat });
                      setIsCategoryModalOpen(false);
                    }}
                    className={`w-full py-2.5 px-3 rounded-xl border text-xs font-bold text-left transition flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? "bg-[var(--accent)] text-[var(--accent-fg)] border-[var(--accent)] shadow"
                        : "bg-[var(--inner-box)] border-[var(--panel-border)] text-[var(--text-main)] hover:border-[var(--accent)]/50 disabled:opacity-30"
                    }`}
                  >
                    <span>{cat}</span>
                    {isSelected && <span className="text-xs">선택됨</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 표 조작 컨텍스트 메뉴 */}
      {contextMenu && (
        <KerygmaTableContextMenu
          contextMenu={contextMenu}
          applyTableWidth={applyTableWidth}
          applyTableAlign={applyTableAlign}
          applyCellBgColor={applyCellBgColor}
          insertRow={insertRow}
          insertColumn={insertColumn}
          deleteRow={deleteRow}
          deleteColumn={deleteColumn}
          deleteTable={deleteTable}
        />
      )}
    </main>
  );
}