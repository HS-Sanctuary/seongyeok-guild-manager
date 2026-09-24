"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { memberMutation } from "@/lib/memberMutationClient";
import { compressReportImage } from "@/lib/client/compressReportImage";

type Tab = "문의" | "생텀 버그 제보" | "생텀 건의사항";
type Inquiry = {
  id: number;
  category: string;
  title: string;
  content: string;
  author: string;
  status: string;
  created_at: string;
  reply: string | null;
  attachment_paths?: string[];
  retention_review_at?: string | null;
};
type DraftImage = { file: File; preview: string };

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "문의", label: "1:1 문의", icon: "✉️" },
  { id: "생텀 버그 제보", label: "생텀 버그 제보", icon: "🛠️" },
  { id: "생텀 건의사항", label: "생텀 건의사항", icon: "💡" },
];
const REPORT_TABS = new Set<Tab>(["생텀 버그 제보", "생텀 건의사항"]);
const field = "w-full min-w-0 rounded-xl border border-[var(--panel-border)] bg-[var(--inner-box)] px-3.5 py-2.5 text-sm text-[var(--text-main)] outline-none focus:border-[var(--accent)]";

export default function SupportPage() {
  const [user, setUser] = useState<{ nickname: string; role: string } | null>(null);
  const [items, setItems] = useState<Inquiry[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("문의");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [imagesById, setImagesById] = useState<Record<number, string[]>>({});
  const [writing, setWriting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [replying, setReplying] = useState(false);
  const [reviewingId, setReviewingId] = useState<number | null>(null);
  const [reviewClock, setReviewClock] = useState(0);
  const [replyText, setReplyText] = useState("");
  const [category, setCategory] = useState("질문");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [draftImages, setDraftImages] = useState<DraftImage[]>([]);
  const [processingImages, setProcessingImages] = useState(false);
  const previewUrls = useRef(new Set<string>());

  const fetchInquiries = useCallback(async () => {
    setLoading(true);
    try {
      const review = new URLSearchParams(window.location.search).get("review");
      const response = await fetch(review ? `/api/inquiries?review=${encodeURIComponent(review)}` : "/api/inquiries", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "목록을 불러오지 못했습니다.");
      setItems(result.data ?? []);
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const tab = new URLSearchParams(window.location.search).get("tab");
      if (tab === "bug") setActiveTab("생텀 버그 제보");
      if (tab === "idea") setActiveTab("생텀 건의사항");
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const abort = new AbortController();
    fetch("/api/auth/session", { cache: "no-store", signal: abort.signal })
      .then((response) => response.json())
      .then((result) => { if (result.account) setUser({ nickname: result.account.nickname, role: result.account.role }); })
      .catch(() => { /* The inquiry API separately reports session failures. */ })
      .finally(() => { if (!abort.signal.aborted) void fetchInquiries(); });
    const urls = previewUrls.current;
    return () => { abort.abort(); for (const url of urls) URL.revokeObjectURL(url); };
  }, [fetchInquiries]);

  const isReport = REPORT_TABS.has(activeTab);
  const visible = items.filter((item) => isReport ? item.category === activeTab : !REPORT_TABS.has(item.category as Tab));
  const isMaster = user?.role === "길드마스터";
  const isOperator = ["길드마스터", "부마스터", "부마스터 대행"].includes(user?.role ?? "");

  useEffect(() => {
    const update = () => setReviewClock(Date.now());
    const initial = window.setTimeout(update, 0);
    const timer = window.setInterval(update, 60_000);
    return () => { window.clearTimeout(initial); window.clearInterval(timer); };
  }, []);

  useEffect(() => {
    if (!isMaster || loading || !items.length) return;
    const reviewId = Number(new URLSearchParams(window.location.search).get("review"));
    if (!Number.isSafeInteger(reviewId) || reviewId < 1) return;
    const item = items.find((entry) => entry.id === reviewId);
    if (!item) return;
    const timer = window.setTimeout(() => {
      setActiveTab(item.category as Tab);
      setExpandedId(reviewId);
      document.getElementById(`logos-inquiry-${reviewId}`)?.scrollIntoView({ block: "center" });
      if (item.attachment_paths?.length) {
        void fetch(`/api/inquiries/attachments?inquiryId=${reviewId}`, { cache: "no-store" })
          .then((response) => response.ok ? response.json() : Promise.reject(new Error("사진을 불러오지 못했습니다.")))
          .then((result) => setImagesById((current) => ({ ...current, [reviewId]: result.images ?? [] })))
          .catch(() => setError("첨부 사진을 불러오지 못했습니다."));
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [isMaster, loading, items]);

  function selectTab(tab: Tab) {
    const url = new URL(window.location.href);
    if (tab === "문의") url.searchParams.delete("tab");
    else url.searchParams.set("tab", tab === "생텀 버그 제보" ? "bug" : "idea");
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
    setActiveTab(tab);
    setExpandedId(null);
    setWriting(false);
    setError("");
  }

  async function attachFiles(files: File[]) {
    if (!isReport || !files.length) return;
    if (draftImages.length + files.length > 3) { setError("사진은 최대 3장까지 첨부할 수 있습니다."); return; }
    setProcessingImages(true);
    try {
      const next = await Promise.all(files.map(async (file) => {
        const compressed = await compressReportImage(file);
        const preview = URL.createObjectURL(compressed);
        previewUrls.current.add(preview);
        return { file: compressed, preview };
      }));
      setDraftImages((current) => [...current, ...next]);
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "사진을 줄이지 못했습니다.");
    } finally {
      setProcessingImages(false);
    }
  }

  function clearDraft() {
    for (const image of draftImages) {
      URL.revokeObjectURL(image.preview);
      previewUrls.current.delete(image.preview);
    }
    setDraftImages([]);
    setTitle("");
    setContent("");
    setCategory("질문");
    setWriting(false);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting || processingImages) return;
    if (!title.trim() || !content.trim()) { setError("제목과 내용을 모두 입력해 주세요."); return; }
    setSubmitting(true);
    setError("");
    try {
      if (isReport) {
        const form = new FormData();
        form.set("category", activeTab);
        form.set("title", title.trim());
        form.set("content", content.trim());
        for (const image of draftImages) form.append("images", image.file);
        const response = await fetch("/api/inquiries/reports", { method: "POST", body: form });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "저장하지 못했습니다.");
      } else {
        const result = await memberMutation({ table: "inquiries", action: "insert", payload: { category, title: title.trim(), content: content.trim() } });
        if (result.error) throw new Error("문의를 저장하지 못했습니다.");
      }
      clearDraft();
      await fetchInquiries();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "저장하지 못했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  async function openItem(item: Inquiry) {
    if (expandedId === item.id) { setExpandedId(null); return; }
    setExpandedId(item.id);
    setReplyText("");
    if (!item.attachment_paths?.length) return;
    try {
      const response = await fetch(`/api/inquiries/attachments?inquiryId=${item.id}`, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "사진을 불러오지 못했습니다.");
      setImagesById((current) => ({ ...current, [item.id]: result.images ?? [] }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "사진을 불러오지 못했습니다.");
    }
  }

  async function submitReply(id: number) {
    if (!isMaster || !replyText.trim() || replying) return;
    setReplying(true);
    try {
      const result = await memberMutation({ table: "inquiries", action: "update", filter: { column: "id", value: id }, payload: { reply: replyText.trim() } });
      if (result.error) throw new Error("답변을 저장하지 못했습니다.");
      setReplyText("");
      await fetchInquiries();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "답변을 저장하지 못했습니다.");
    } finally {
      setReplying(false);
    }
  }

  async function reviewReport(id: number, action: "defer" | "delete") {
    if (!isMaster || reviewingId !== null) return;
    if (action === "delete" && !window.confirm("이 제보 글과 첨부 사진을 영구 삭제할까요? 삭제 후 복구할 수 없습니다.")) return;
    setReviewingId(id);
    setError("");
    try {
      const response = await fetch(action === "delete" ? `/api/inquiries/retention?id=${id}` : "/api/inquiries/retention", {
        method: action === "delete" ? "DELETE" : "POST",
        ...(action === "defer" ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) } : {}),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "정리 검토를 처리하지 못했습니다.");
      if (action === "delete") setExpandedId(null);
      await fetchInquiries();
      window.dispatchEvent(new Event("sanctum_retention_changed"));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "정리 검토를 처리하지 못했습니다.");
    } finally {
      setReviewingId(null);
    }
  }

  return <main className="min-h-screen bg-[var(--background)] px-3 pb-24 pt-6 text-[var(--text-main)] sm:px-6">
    <div className="mx-auto max-w-[1100px] space-y-4">
      <header className="rounded-2xl border border-[var(--panel-border)] border-l-[5px] border-l-[var(--accent)] bg-[var(--panel)] p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h1 className="text-2xl font-black tracking-wide text-[var(--accent)]">✉️ LOGOS</h1><p className="mt-1 text-sm text-[var(--text-sub)]">성역의 문의와 생텀 제보를 남기는 공간</p></div>
          <button type="button" onClick={() => { setWriting((open) => !open); setError(""); }} className="rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-bold text-[var(--accent-fg)]">{writing ? "작성 닫기" : "＋ 새 글 작성"}</button>
        </div>
      </header>

      <nav aria-label="로고스 글 종류" className="grid grid-cols-1 gap-2 rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] p-2 sm:grid-cols-3">
        {TABS.map((tab) => <button key={tab.id} type="button" aria-pressed={activeTab === tab.id} onClick={() => selectTab(tab.id)} className={`rounded-xl px-3 py-2.5 text-sm font-bold transition ${activeTab === tab.id ? "bg-[var(--accent)] text-[var(--accent-fg)]" : "bg-[var(--inner-box)] text-[var(--text-main)] hover:bg-[var(--panel-hover)]"}`}>{tab.icon} {tab.label}</button>)}
      </nav>

      {error && <div role="alert" className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-600 dark:text-rose-300">{error}</div>}

      {writing && <form onSubmit={(event) => void submit(event)} className="space-y-4 rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] p-4 shadow-sm sm:p-6">
        <div><h2 className="text-lg font-bold text-[var(--accent)]">{activeTab === "문의" ? "1:1 문의 작성" : `${activeTab} 작성`}</h2><p className="mt-1 text-xs text-[var(--text-sub)]">{isReport ? "제보·건의는 본인과 길드마스터만 볼 수 있습니다." : "1:1 문의는 본인과 운영진이 볼 수 있습니다."} 비밀번호·접속 코드는 적지 마세요.</p>{isReport && <p className="mt-2 text-xs text-[var(--text-sub)]">작성 후 60일이 지나면 길드마스터가 보존 여부를 검토합니다. 검토 결과에 따라 글과 첨부 사진이 삭제될 수 있습니다.</p>}</div>
        {activeTab === "문의" && <label className="block text-sm font-bold">분류<select value={category} onChange={(event) => setCategory(event.target.value)} className={`${field} mt-1`}><option>질문</option><option>건의</option><option>버그</option></select></label>}
        <label className="block text-sm font-bold">제목<input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} required placeholder="한눈에 알아볼 수 있는 제목" className={`${field} mt-1`} /></label>
        <label className="block text-sm font-bold">내용<textarea value={content} onChange={(event) => setContent(event.target.value)} onPaste={(event) => { const files = [...event.clipboardData.files].filter((file) => file.type.startsWith("image/")); if (files.length && isReport) { event.preventDefault(); void attachFiles(files); } }} maxLength={10000} required rows={8} placeholder={isReport ? "발생 화면, 재현 순서, 기대한 결과를 적어 주세요. 사진은 이 칸에 붙여넣을 수 있어요." : "문의 내용을 자세히 적어 주세요."} className={`${field} mt-1 resize-y`} /></label>
        {isReport && <div className="space-y-2 rounded-xl border border-dashed border-[var(--panel-border)] bg-[var(--inner-box)] p-3" onPaste={(event) => { const files = [...event.clipboardData.files].filter((file) => file.type.startsWith("image/")); if (files.length) { event.preventDefault(); void attachFiles(files); } }} tabIndex={0}>
          <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs text-[var(--text-sub)]">스크린샷 붙여넣기 또는 선택 · 최대 3장 · 장당 350KB 이하로 자동 축소</p><label className="cursor-pointer rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] px-3 py-1.5 text-xs font-bold">사진 선택<input type="file" accept="image/*" multiple className="sr-only" onChange={(event) => { void attachFiles([...event.target.files ?? []]); event.target.value = ""; }} /></label></div>
          {processingImages && <p className="text-xs text-[var(--text-sub)]">사진을 줄이는 중...</p>}
          {draftImages.length > 0 && <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{draftImages.map((image) => <div key={image.preview} className="relative rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-1"><Image unoptimized src={image.preview} alt="첨부할 스크린샷 미리보기" width={640} height={360} className="h-28 w-full rounded object-contain" /><button type="button" aria-label="사진 제거" onClick={() => { URL.revokeObjectURL(image.preview); previewUrls.current.delete(image.preview); setDraftImages((current) => current.filter((entry) => entry.preview !== image.preview)); }} className="absolute right-1 top-1 rounded bg-[var(--panel)] px-2 py-0.5 text-xs font-bold">×</button><p className="px-1 text-xs text-[var(--text-sub)]">{Math.ceil(image.file.size / 1024)}KB</p></div>)}</div>}
        </div>}
        <div className="flex justify-end gap-2"><button type="button" onClick={clearDraft} className="rounded-lg border border-[var(--panel-border)] px-4 py-2 text-sm font-bold">취소</button><button type="submit" disabled={submitting || processingImages} className="rounded-lg bg-[var(--accent)] px-5 py-2 text-sm font-bold text-[var(--accent-fg)] disabled:opacity-50">{submitting ? "저장 중..." : "등록하기"}</button></div>
      </form>}

      <section className="rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] p-4 shadow-sm sm:p-6">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2"><h2 className="text-lg font-bold text-[var(--accent)]">{TABS.find((tab) => tab.id === activeTab)?.label} 내역 <span className="ml-1 text-sm text-[var(--text-sub)]">{visible.length}</span></h2><p className="text-xs text-[var(--text-sub)]">{isMaster ? "길드마스터에게 접수된 글" : isOperator && !isReport ? "운영진에게 접수된 문의" : "내가 작성한 글"}</p></div>
        {loading ? <p className="py-12 text-center text-sm text-[var(--text-sub)]">불러오는 중...</p> : visible.length === 0 ? <p className="py-12 text-center text-sm text-[var(--text-sub)]">아직 작성된 글이 없습니다.</p> : <div className="space-y-2">{visible.map((item) => <article key={item.id} id={`logos-inquiry-${item.id}`} className="overflow-hidden rounded-xl border border-[var(--panel-border)] bg-[var(--inner-box)]">
          <button type="button" aria-expanded={expandedId === item.id} onClick={() => void openItem(item)} className="w-full p-3 text-left hover:bg-[var(--panel-hover)] sm:p-4">
            <span className="flex flex-wrap items-center justify-between gap-2"><span className="rounded border border-[var(--panel-border)] bg-[var(--panel)] px-2 py-0.5 text-xs text-[var(--text-sub)]">{item.category}</span><span className="text-xs text-[var(--text-sub)]">{isMaster && isReport && item.retention_review_at && Date.parse(item.retention_review_at) <= reviewClock ? "정리 검토 필요" : item.status}</span></span>
            <strong className="mt-2 block min-w-0 break-words text-sm">{item.title}</strong>
            <span className="mt-1 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--text-sub)]">{isMaster && <span>{item.author}</span>}<time>{new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(item.created_at))}</time></span>
          </button>
          {expandedId === item.id && <div className="space-y-4 border-t border-[var(--panel-border)] p-3 sm:p-4"><p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{item.content}</p>{!!item.attachment_paths?.length && <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">{imagesById[item.id]?.map((url) => <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="block rounded-lg border border-[var(--panel-border)] p-1"><Image unoptimized src={url} alt="제보에 첨부된 스크린샷" width={800} height={600} className="max-h-80 w-full object-contain" /></a>) ?? <p className="text-xs text-[var(--text-sub)]">사진을 불러오는 중...</p>}</div>}{item.reply && <div className="rounded-xl border border-[var(--accent)]/30 bg-[var(--accent-soft)] p-3"><p className="mb-1 text-xs font-bold text-[var(--accent)]">길드마스터 답변</p><p className="whitespace-pre-wrap break-words text-sm">{item.reply}</p></div>}{isMaster && item.status === "대기중" && <div className="space-y-2 border-t border-[var(--panel-border)] pt-3"><label className="block text-xs font-bold">답변<textarea value={replyText} onChange={(event) => setReplyText(event.target.value)} maxLength={10000} rows={4} className={`${field} mt-1`} /></label><button type="button" disabled={replying || !replyText.trim()} onClick={() => void submitReply(item.id)} className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-bold text-[var(--accent-fg)] disabled:opacity-50">{replying ? "저장 중..." : "답변 등록"}</button></div>}{isMaster && isReport && item.retention_review_at && Date.parse(item.retention_review_at) <= reviewClock && <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--panel-border)] pt-3"><p className="text-xs text-[var(--text-sub)]">60일 보존 기간이 지나 정리 여부를 결정할 수 있습니다.</p><div className="flex gap-2"><button type="button" disabled={reviewingId !== null} onClick={() => void reviewReport(item.id, "defer")} className="rounded-lg border border-[var(--panel-border)] px-3 py-2 text-xs font-bold disabled:opacity-50">60일 보류</button><button type="button" disabled={reviewingId !== null} onClick={() => void reviewReport(item.id, "delete")} className="rounded-lg border border-rose-500/50 px-3 py-2 text-xs font-bold text-rose-500 disabled:opacity-50">글·사진 삭제</button></div></div>}</div>}
        </article>)}</div>}
      </section>
    </div>
  </main>;
}
