"use client";
import { useEffect, useRef, useState } from "react";
import { flattenComments, type GnosisComment } from "@/lib/gnosisLocal";

const EMOJI = ["😀","😃","😄","😁","😆","😅","😂","🤣","😊","😇","🙂","🙃","😉","😌","😍","🥰","😘","😗","😙","😚","😋","😛","😜","🤪","😝","🤑","🤗","🤭","🤫","🤔","👍","👎","👏","🙌","👐","🤲","🤝","🙏","✍️","💪","❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","🔥","✨","🌟","⭐","🎉","🎊","🎈","🎁","🏆","💯"];
function CommentForm({ target, onSubmit, onCancel }: { target?: string; onSubmit: (text: string) => boolean; onCancel?: () => void }) {
  const [text, setText] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const root = useRef<HTMLFormElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (!emojiOpen) return;
    const close = (event: PointerEvent) => { if (event.target instanceof Node && !root.current?.contains(event.target)) setEmojiOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") setEmojiOpen(false); };
    document.addEventListener("pointerdown", close); document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", close); document.removeEventListener("keydown", escape); };
  }, [emojiOpen]);
  function submit() { if (text.trim() && onSubmit(text.trim())) { setText(""); setEmojiOpen(false); } }
  return <form ref={root} className="gnosis-comment-form" onSubmit={event => { event.preventDefault(); submit(); }}>
    {target && <div className="gnosis-reply-target">↳ {target}님에게 답글<button type="button" onClick={onCancel}>취소</button></div>}
    <label><span className="gnosis-sr-only">{target ? "답글 내용" : "댓글 내용"}</span><textarea ref={input} value={text} maxLength={2000} onChange={event => setText(event.target.value)} placeholder={target ? "답글을 남겨주세요" : "공략에 궁금한 점이나 도움이 된 내용을 남겨주세요"} onKeyDown={event => { if ((event.ctrlKey || event.metaKey) && event.key === "Enter") { event.preventDefault(); submit(); } }} /></label>
    {emojiOpen && <div className="gnosis-emoji-grid" aria-label="이모지 선택">{EMOJI.map(emoji => <button key={emoji} type="button" aria-label={"이모지 " + emoji} onClick={() => { setText(previous => (previous + emoji).slice(0, 2000)); setEmojiOpen(false); input.current?.focus(); }}>{emoji}</button>)}</div>}
    <div className="gnosis-comment-actions"><button type="button" aria-expanded={emojiOpen} onClick={() => setEmojiOpen(!emojiOpen)}>🙂 이모지</button><span>{text.length}/2,000</span><button className="is-primary" type="submit" disabled={!text.trim()}>{target ? "답글 등록" : "댓글 등록"}</button></div>
  </form>;
}
export default function GnosisComments({ comments, onAdd, onLike }: { comments: GnosisComment[]; onAdd: (text: string, parent?: GnosisComment["id"]) => boolean; onLike: (id: GnosisComment["id"]) => void }) {
  const [reply, setReply] = useState<GnosisComment["id"] | null>(null);
  const entries = flattenComments(comments);
  return <section className="gnosis-comments" aria-labelledby="gnosis-comments-title"><div className="gnosis-comment-heading"><h2 id="gnosis-comments-title">댓글 <span>{entries.length}</span></h2><span>댓글과 답글로 함께 보완해요</span></div>
    <CommentForm onSubmit={text => onAdd(text)} />
    {entries.length === 0 && <p className="gnosis-comment-empty">첫 댓글을 남겨보세요.</p>}
    <div className="gnosis-comment-list">{entries.map(({ comment, depth, parent }) => <article className="gnosis-comment" key={comment.id} style={{ marginLeft: "min(" + Math.min(depth, 2) + "rem, 8vw)" }}>
      <header><strong>{comment.author}</strong>{comment.title_name && <span className="gnosis-comment-title">{comment.title_name}</span>}<span>{comment.timestamp}</span></header>
      {parent && <span className="gnosis-comment-parent">↳ {parent}님에게</span>}<p>{comment.content}</p>
      <div className="gnosis-comment-tools"><button type="button" aria-label={comment.author + " 댓글 추천 " + (comment.likes || 0)} onClick={() => onLike(comment.id)}>♡ {comment.likes || 0}</button><button type="button" aria-expanded={reply === comment.id} onClick={() => setReply(reply === comment.id ? null : comment.id)}>답글</button></div>
      {reply === comment.id && <CommentForm key={String(comment.id)} target={comment.author} onCancel={() => setReply(null)} onSubmit={text => { const success = onAdd(text, comment.id); if (success) setReply(null); return success; }} />}
    </article>)}</div>
  </section>;
}
