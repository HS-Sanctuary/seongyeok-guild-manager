"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  blankReminder,
  NOTE_COLORS,
  NOTE_FONTS,
  type Reminder,
} from "@/lib/kronos";

const COLORS: Record<string, { background: string; color: string }> = {
  theme: { background: "var(--panel)", color: "var(--text-main)" },
  cream: { background: "#fff3cd", color: "#342900" },
  mint: { background: "#dcfce7", color: "#123821" },
  rose: { background: "#ffe4e6", color: "#4c1722" },
  blue: { background: "#dbeafe", color: "#17345b" },
};
const COLOR_NAMES: Record<string, string> = {
  theme: "전역 테마",
  cream: "크림",
  mint: "민트",
  rose: "로즈",
  blue: "블루",
};
const FONT_NAMES: Record<string, string> = {
  sans: "기본",
  serif: "명조",
  mono: "고정폭",
};
type Layout = { x: number; y: number; width: number; height: number };
function fit(l: Layout): Layout {
  const w = window.innerWidth,
    h = window.innerHeight;
  const width = Math.min(Math.max(260, l.width), w - 16),
    height = Math.min(Math.max(270, l.height), h - 24);
  return {
    width,
    height,
    x: Math.max(8, Math.min(l.x, w - width - 8)),
    y: Math.max(8, Math.min(l.y, h - height - 8)),
  };
}

function NoteWindow({
  note,
  storageKey,
  dirty,
  busy,
  message,
  active,
  onActivate,
  onOpenOther,
  onChange,
  onClose,
  onSave,
  onDelete,
}: {
  note: Reminder;
  storageKey: string;
  dirty: boolean;
  busy: boolean;
  message: string;
  active: boolean;
  onActivate: () => void;
  onOpenOther: () => void;
  onChange: (n: Reminder) => void;
  onClose: () => void;
  onSave: () => void;
  onDelete: () => void;
}) {
  const [layout, setLayout] = useState<Layout>(() => {
    try {
      const v = JSON.parse(localStorage.getItem(storageKey) || "null");
      if (
        v &&
        ["x", "y", "width", "height"].every((k) => Number.isFinite(v[k]))
      )
        return fit(v);
    } catch {}
    return fit({
      x: window.innerWidth - 460 - note.slot * 35,
      y: 120 + note.slot * 40,
      width: 420,
      height: 390,
    });
  });
  const panel = useRef<HTMLDivElement>(null);
  const drag = useRef<{
    x: number;
    y: number;
    left: number;
    top: number;
  } | null>(null);
  useEffect(() => {
    const resize = () => {
      if (panel.current) {
        const r = panel.current.getBoundingClientRect();
        setLayout(fit({ x: r.x, y: r.y, width: r.width, height: r.height }));
      }
    };
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);
  useEffect(() => {
    const el = panel.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      try {
        localStorage.setItem(
          storageKey,
          JSON.stringify({ x: r.x, y: r.y, width: r.width, height: r.height }),
        );
      } catch {}
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [storageKey, layout]);
  function move(x: number, y: number) {
    setLayout((l) => {
      const next = fit({ ...l, x, y });
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {}
      return next;
    });
  }
  return createPortal(
    <div
      ref={panel}
      role="dialog"
      aria-modal="false"
      aria-label={note.slot + 1 + "번 리마인드 메모"}
      tabIndex={-1}
      onFocusCapture={onActivate}
      onPointerDownCapture={onActivate}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.stopPropagation();
          onClose();
        }
        if ((e.ctrlKey || e.metaKey) && e.key === "s") {
          e.preventDefault();
          onSave();
        }
      }}
      className="fixed z-[10050] flex flex-col rounded-xl border border-[var(--accent)] shadow-2xl overflow-hidden"
      style={{
        ...COLORS[note.color],
        zIndex: active ? 10051 : 10050,
        left: layout.x,
        top: layout.y,
        width: layout.width,
        height: layout.height,
        resize: "both",
        minWidth: "min(260px, calc(100vw - 16px))",
        maxWidth: "calc(100vw - 16px)",
        minHeight: "min(270px, calc(100dvh - 24px))",
        maxHeight: "calc(100dvh - 24px)",
      }}
    >
      <div
        tabIndex={0}
        aria-label="메모 이동: 드래그 또는 방향키"
        className="flex shrink-0 items-center gap-2 p-2 border-b border-current/20 cursor-move touch-none select-none"
        onPointerDown={(e) => {
          if ((e.target as HTMLElement).closest("button")) return;
          const r = panel.current!.getBoundingClientRect();
          setLayout(fit({ x: r.x, y: r.y, width: r.width, height: r.height }));
          drag.current = { x: e.clientX, y: e.clientY, left: r.x, top: r.y };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (drag.current)
            move(
              drag.current.left + e.clientX - drag.current.x,
              drag.current.top + e.clientY - drag.current.y,
            );
        }}
        onPointerUp={() => {
          drag.current = null;
        }}
        onPointerCancel={() => {
          drag.current = null;
        }}
        onKeyDown={(e) => {
          const d: Record<string, [number, number]> = {
            ArrowLeft: [-20, 0],
            ArrowRight: [20, 0],
            ArrowUp: [0, -20],
            ArrowDown: [0, 20],
          };
          if (e.target === e.currentTarget && d[e.key]) {
            e.preventDefault();
            move(layout.x + d[e.key][0], layout.y + d[e.key][1]);
          }
        }}
      >
        <strong className="text-sm flex-1">
          리마인드 {note.slot + 1}
          {dirty ? " · 수정 중" : ""}
        </strong>
        <button onClick={onOpenOther} className="text-xs p-1">
          메모 {note.slot === 0 ? 2 : 1} 열기
        </button>
        <button
          aria-label="메모 기본 크기로"
          onClick={() => setLayout(fit({ ...layout, width: 420, height: 390 }))}
          className="text-xs p-1"
        >
          크기 복원
        </button>
        <button aria-label="메모 닫기" onClick={onClose} className="p-1">
          ×
        </button>
      </div>
      <div className="flex-1 min-h-0 overflow-auto p-3 flex flex-col gap-2">
        <input
          aria-label="메모 제목"
          maxLength={100}
          value={note.title}
          disabled={busy}
          onChange={(e) => onChange({ ...note, title: e.target.value })}
          placeholder="무엇을 하려고 했나요?"
          className="w-full min-w-0 bg-transparent border-b border-current/20 p-1 font-bold text-sm"
        />
        <div className="flex flex-wrap gap-2 text-xs">
          <select
            aria-label="메모 색"
            value={note.color}
            disabled={busy}
            onChange={(e) => onChange({ ...note, color: e.target.value })}
            className="rounded p-1 bg-[var(--panel)] text-[var(--text-main)]"
          >
            {NOTE_COLORS.map((c) => (
              <option key={c} value={c}>
                {COLOR_NAMES[c]}
              </option>
            ))}
          </select>
          <select
            aria-label="메모 글꼴"
            value={note.font}
            disabled={busy}
            onChange={(e) => onChange({ ...note, font: e.target.value })}
            className="rounded p-1 bg-[var(--panel)] text-[var(--text-main)]"
          >
            {NOTE_FONTS.map((f) => (
              <option key={f} value={f}>
                {FONT_NAMES[f]}
              </option>
            ))}
          </select>
          <select
            aria-label="메모 글자 크기"
            value={note.font_size}
            disabled={busy}
            onChange={(e) =>
              onChange({ ...note, font_size: Number(e.target.value) })
            }
            className="rounded p-1 bg-[var(--panel)] text-[var(--text-main)]"
          >
            {[0.7, 0.85, 1, 1.2].map((n, i) => (
              <option key={n} value={n}>
                {["작게", "보통", "크게", "더 크게"][i]}
              </option>
            ))}
          </select>
        </div>
        <textarea
          aria-label="메모 내용"
          disabled={busy}
          maxLength={10000}
          value={note.content}
          onChange={(e) => onChange({ ...note, content: e.target.value })}
          placeholder="이 캐릭터로 할 일을 자유롭게 적어두세요."
          className="w-full flex-1 min-h-24 resize-none bg-transparent p-1 outline-none leading-relaxed"
          style={{
            fontFamily:
              note.font === "mono"
                ? "monospace"
                : note.font === "serif"
                  ? "serif"
                  : "inherit",
            fontSize: note.font_size + "rem",
          }}
        />
      </div>
      <div className="shrink-0 flex flex-wrap gap-2 items-center p-2 border-t border-current/20 text-xs">
        <span role="status" className="flex-1">
          {message || (dirty ? "이 기기에 임시 보관됨" : "저장된 메모")}
        </span>
        <button
          disabled={busy}
          onClick={onDelete}
          className="px-2 py-1 border border-current/30 rounded"
        >
          비우기
        </button>
        <button
          disabled={busy}
          onClick={onSave}
          className="px-3 py-1 rounded bg-[var(--accent)] text-[var(--accent-fg)] font-bold"
        >
          {busy ? "저장 중…" : "저장"}
        </button>
      </div>
    </div>,
    document.body,
  );
}

export default function ReminderWindows({
  account,
  character,
  initialNotes,
  request,
}: {
  account: string;
  character: string;
  initialNotes: Reminder[];
  request: number;
}) {
  const [notes, setNotes] = useState<Reminder[]>(() =>
    [0, 1].map(
      (s) => initialNotes.find((n) => n.slot === s) || blankReminder(s),
    ),
  );
  const [dirty, setDirty] = useState<boolean[]>([false, false]);
  const [open, setOpen] = useState<boolean[]>([false, false]);
  const [activeSlot, setActiveSlot] = useState(0);
  const [busy, setBusy] = useState<boolean[]>([false, false]);
  const [messages, setMessages] = useState<string[]>(["", ""]);
  const [loaded, setLoaded] = useState(false);
  const saving = useRef(new Set<number>());
  const prefix =
    "sanctum-reminder:" +
    encodeURIComponent(account) +
    ":" +
    encodeURIComponent(character) +
    ":";
  useEffect(() => {
    for (const slot of [0, 1]) {
      try {
        const draft = JSON.parse(localStorage.getItem(prefix + slot) || "null");
        if (
          draft &&
          typeof draft.content === "string" &&
          typeof draft.title === "string" &&
          NOTE_COLORS.includes(draft.color) &&
          NOTE_FONTS.includes(draft.font) &&
          [0.7, 0.85, 1, 1.2].includes(draft.font_size)
        ) {
          setNotes((v) =>
            v.map((n, i) => (i === slot ? { ...draft, slot } : n)),
          );
          setDirty((v) => v.map((d, i) => (i === slot ? true : d)));
        }
      } catch {}
    }
    setLoaded(true);
  }, [prefix]);
  useEffect(() => {
    if (!loaded) return;
    notes.forEach((n, i) => {
      try {
        if (dirty[i]) localStorage.setItem(prefix + i, JSON.stringify(n));
        else localStorage.removeItem(prefix + i);
      } catch {}
    });
  }, [notes, dirty, loaded, prefix]);
  useEffect(() => {
    if (request > 0) {
      setOpen((v) => [true, v[1]]);
      setActiveSlot(0);
    }
  }, [request]);
  useEffect(() => {
    if (!dirty.some(Boolean)) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  async function save(slot: number, remove = false) {
    if (saving.current.has(slot)) return;
    if (remove && !confirm("이 메모를 비울까요?")) return;
    saving.current.add(slot);
    setBusy((v) => v.map((b, i) => (i === slot ? true : b)));
    try {
      const r = await fetch("/api/kronos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...notes[slot],
          character,
          action: remove ? "delete-note" : "note",
        }),
      });
      const d = await r.json();
      if (!r.ok) throw Error(d.message);
      if (remove)
        setNotes((v) =>
          v.map((n, i) => (i === slot ? blankReminder(slot) : n)),
        );
      setDirty((v) => v.map((b, i) => (i === slot ? false : b)));
      setMessages((v) =>
        v.map((m, i) =>
          i === slot ? (remove ? "메모를 비웠습니다." : "저장 완료") : m,
        ),
      );
    } catch (e) {
      setMessages((v) =>
        v.map((m, i) => (i === slot ? (e as Error).message : m)),
      );
    } finally {
      saving.current.delete(slot);
      setBusy((v) => v.map((b, i) => (i === slot ? false : b)));
    }
  }
  return (
    <>
      {notes.map(
        (note, slot) =>
          open[slot] && (
            <NoteWindow
              key={slot}
              note={note}
              active={activeSlot === slot}
              onActivate={() => setActiveSlot(slot)}
              onOpenOther={() => {
                const other = slot === 0 ? 1 : 0;
                setOpen((v) => v.map((b, i) => (i === other ? true : b)));
                setActiveSlot(other);
              }}
              storageKey={prefix + "layout:" + slot}
              dirty={dirty[slot]}
              busy={busy[slot]}
              message={messages[slot]}
              onChange={(n) => {
                setNotes((v) => v.map((old, i) => (i === slot ? n : old)));
                setDirty((v) => v.map((d, i) => (i === slot ? true : d)));
                setMessages((v) => v.map((m, i) => (i === slot ? "" : m)));
              }}
              onClose={() =>
                setOpen((v) => v.map((b, i) => (i === slot ? false : b)))
              }
              onSave={() => save(slot)}
              onDelete={() => save(slot, true)}
            />
          ),
      )}
    </>
  );
}
