"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import GnosisCategoryFields from "@/components/gnosis/GnosisCategoryFields";
import GnosisPoll from "@/components/gnosis/GnosisPoll";
import GnosisRichEditor from "@/components/gnosis/GnosisRichEditor";
import { normalizeRichDoc, richText, type RichNode } from "@/lib/gnosisRichText";
import type { PollData } from "@/types/kerygma";
import GnosisContent from "@/components/gnosis/GnosisContent";
import { FASHION_TRANSFER_KEY, FASHION_WORK_KEY, mergeFashionDraft, parseFashion, validFashionItem, type FashionLook } from "@/lib/gnosisFashion";
import { DRAFT_KEY, storeGuide, youtubeId, type FashionItem } from "@/lib/gnosisLocal";
import "../gnosis.css";
import "../gnosis-editor.css";
import "../dressroom/dressroom.css";
type Draft = { fashionLook?: FashionLook | null; richDoc?: RichNode[] | null; poll?: PollData | null; version: 1; title: string; content: string; category: string; useYoutube: boolean; youtubeLink: string; useFashion: boolean; itemData: FashionItem | null; hideMedia: boolean; useSpoiler: boolean };
const EMPTY: Draft = { richDoc: null, poll: null, version: 1, title: "", content: "", category: "전사", useYoutube: false, youtubeLink: "", useFashion: false, itemData: null, hideMedia: false, useSpoiler: false };
const validItem = validFashionItem;
function parseDraft(raw: string): Draft {
  const row = JSON.parse(raw) as Draft;
  if (!row || row.version !== 1 || ![row.title,row.content,row.category,row.youtubeLink].every(value => typeof value === "string") || ![row.useYoutube,row.useFashion,row.hideMedia,row.useSpoiler].every(value => typeof value === "boolean") || (row.itemData !== null && !validItem(row.itemData))) throw new Error("임시저장을 읽을 수 없어요. 기존 기록은 보존했어요.");
  if(row.fashionLook != null) row.fashionLook=parseFashion(row.fashionLook);
  return row;
}
export default function GnosisWritePage() {
  const router = useRouter();
  const [draft,setDraft] = useState<Draft>(EMPTY);
  const [saved,setSaved] = useState<Draft | null>(null);
  const [message,setMessage] = useState("");
  const [error,setError] = useState("");
  const [preview,setPreview] = useState(false);
  const [saving,setSaving] = useState(false);
  const [imageBusy,setImageBusy] = useState(false);
  const [cancelOpen,setCancelOpen] = useState(false);
  const cancelDialog=useRef<HTMLDialogElement>(null);
  const [dirty,setDirty] = useState(false);
  const submitLock = useRef(false);
  function update(patch: Partial<Draft>) { setDraft(previous => ({...previous,...patch})); setDirty(true); setMessage(""); setError(""); }
  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => { try { const raw = localStorage.getItem(DRAFT_KEY);
      if(raw && active)setSaved(parseDraft(raw));
      if(active && new URLSearchParams(window.location.search).get("fashion")==="1"){
        const transfer=localStorage.getItem(FASHION_TRANSFER_KEY);
        if(transfer){
          const fashionLook=parseFashion(JSON.parse(transfer));
          const base=raw?parseDraft(raw):EMPTY;
          const next=mergeFashionDraft(base,fashionLook);
          localStorage.setItem(DRAFT_KEY,JSON.stringify(next));
          setDraft(next);setSaved(null);setDirty(true);
          setMessage("패션 시뮬레이터에서 코디를 가져왔어요. 기존 임시저장 제목과 본문도 보존했어요.");
          localStorage.removeItem(FASHION_TRANSFER_KEY);
        }else if(raw){const restored=parseDraft(raw);setDraft(restored);setSaved(null);}
      } } catch (error) { if (active) setError(error instanceof Error ? error.message : "임시저장을 사용할 수 없어요."); } });
    return () => { active = false;  };
  }, []);
  useEffect(() => {
    if (!dirty) return;
    const preventExit = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload",preventExit);
    return () => window.removeEventListener("beforeunload",preventExit);
  },[dirty]);
  useEffect(()=>{if(!cancelOpen)return;cancelDialog.current?.showModal();const before=document.body.style.overflow;document.body.style.overflow="hidden";return()=>{document.body.style.overflow=before;};},[cancelOpen]);
  function cancelWriting(){if(dirty){setCancelOpen(true);}else router.push("/gnosis");}
  function closeCancel(){cancelDialog.current?.close();setCancelOpen(false);}
  function saveDraft() {
    try { localStorage.setItem(DRAFT_KEY,JSON.stringify(draft)); setSaved(draft); setDirty(false); setMessage("임시저장했어요. 이 브라우저에서 이어 쓸 수 있어요."); setError(""); }
    catch { setError("임시저장하지 못했어요. 브라우저 저장 공간을 확인해주세요."); }
  }
  function publish() {
    if (submitLock.current || imageBusy) return;
    if (!draft.title.trim() || (!draft.content.trim() && !draft.poll)) { setError("제목과 본문을 입력해주세요."); return; }
    const video = draft.useYoutube ? youtubeId(draft.youtubeLink.trim()) : null;
    if (draft.useYoutube && !video) { setError("올바른 유튜브 영상 주소를 입력해주세요."); return; }
    submitLock.current = true; setSaving(true); setError("");
    try {
      if (JSON.stringify(draft).length > 4500000) throw new Error("글 용량이 너무 커요. 이미지를 줄여주세요.");
      const id = crypto.randomUUID();
      storeGuide(localStorage,{id,title:draft.title.trim(),content:draft.content,content_format:"richtext",rich_content:draft.fashionLook?.image?[...(draft.richDoc??[{tag:"p",children:[{text:draft.content}]}]),{tag:"img",src:draft.fashionLook.image}]:draft.richDoc??null,poll:draft.poll??null,sub_category:draft.category,author:"한설",title_name:"성역 길드마스터",created_at:new Date().toISOString(),likes:0,comments:[],youtube_id:video,item_data:draft.useFashion?draft.itemData:null,is_spoiler:draft.useSpoiler,hide_media:draft.hideMedia});
      try { localStorage.removeItem(DRAFT_KEY); } catch { /* Published record remains saved. */ }
      setDirty(false); router.push("/gnosis/"+id);
    } catch { submitLock.current=false; setSaving(false); setError("글을 저장하지 못했어요. 기존 기록은 보존했어요. 임시저장 후 다시 시도해주세요."); }
  }

  function editFashion() {
    try {
      localStorage.setItem(DRAFT_KEY,JSON.stringify(draft));
      if(draft.fashionLook)localStorage.setItem(FASHION_WORK_KEY,JSON.stringify(draft.fashionLook));
      setDirty(false);router.push("/gnosis/dressroom");
    } catch {setError("작성 중인 글을 보관하지 못했어요. 저장 공간을 확인해주세요.");}
  }
  return <main className="gnosis-board gnosis-editor-page"><div className="gnosis-shell">
    <header className="gnosis-compose-heading"><div><Link href="/gnosis" onClick={event => {event.preventDefault();cancelWriting();}}>← 그노시스</Link><h1>그노시스 게시글 작성</h1></div><div className="gnosis-compose-actions"><button type="button" onClick={saveDraft} disabled={saving||imageBusy}>임시저장</button><button type="button" onClick={cancelWriting}>취소</button><button type="button" className="is-primary" disabled={saving || imageBusy} onClick={publish}>{saving?"저장 중…":"작성 완료"}</button></div></header>
    {saved && !dirty && !draft.title && !draft.content && <div className="gnosis-draft-notice">임시저장한 글이 있어요.<button type="button" onClick={() => {setDraft(saved);setDirty(true);setMessage("임시저장한 글을 불러왔어요.");}}>불러오기</button></div>}
    {error && <p className="gnosis-editor-alert" role="alert">{error}</p>}{message && <p className="gnosis-editor-status" role="status">{message}</p>}
    <div className="gnosis-compose-grid"><section className="gnosis-compose-main" aria-label="글 작성">
      <GnosisCategoryFields value={draft.category} onChange={category=>update({category})}/>
      <label className="gnosis-title-field"><span>제목</span><input value={draft.title} onChange={event=>update({title:event.target.value})} maxLength={150} placeholder="공략의 핵심이 드러나는 제목을 적어주세요"/></label>
      <div className="gnosis-editor-mode" aria-label="본문 보기 방식"><button type="button" aria-pressed={!preview} onClick={()=>setPreview(false)}>작성</button><button type="button" aria-pressed={preview} onClick={()=>setPreview(true)}>미리보기</button><span>{draft.content.length.toLocaleString()}자</span></div>
      {preview ? <div className="gnosis-editor-preview"><GnosisContent content={draft.content || "작성한 본문이 여기에 보여요."} formatted richDoc={draft.richDoc}/>{draft.poll && <GnosisPoll poll={draft.poll}/>}</div> : <GnosisRichEditor value={draft.richDoc ? normalizeRichDoc(draft.richDoc) : null} plainText={draft.content} onChange={doc=>update({richDoc:doc,content:richText(doc)})} poll={draft.poll??null} onPollChange={poll=>update({poll})} onBusyChange={setImageBusy}/>}
      <div className="gnosis-editor-footnote">글자·정렬·표·이미지를 바로 편집하고 미리보기로 확인할 수 있어요.</div>
    </section><aside className="gnosis-compose-options" aria-label="첨부와 표시 설정">
      {draft.useFashion && draft.itemData && <section className="gnosis-option-panel gnosis-fashion-summary"><h2>공유할 코디</h2><p>{draft.itemData.itemName || "나의 코디"}</p>{draft.fashionLook?.image && <Image unoptimized width={1000} height={1000} style={{width:"auto",height:"auto"}} src={draft.fashionLook.image} alt="공유할 코디 스크린샷"/>}<div className="gnosis-dye-inputs">{draft.itemData.dyeParts.map((color,index)=><span key={index} style={{borderLeft:"1rem solid "+color,paddingLeft:".3rem"}}>{color.toUpperCase()} </span>)}</div><button type="button" disabled={imageBusy||saving} onClick={editFashion}>시뮬레이터에서 수정</button></section>}
      <section className="gnosis-option-panel"><h2>함께 첨부하기</h2><label className="gnosis-check"><input type="checkbox" checked={draft.useYoutube} onChange={event=>update({useYoutube:event.target.checked})}/>유튜브 영상</label>{draft.useYoutube && <label className="gnosis-option-input">영상 주소<input type="url" value={draft.youtubeLink} onChange={event=>update({youtubeLink:event.target.value})} placeholder="https://youtu.be/…"/></label>}
      </section>
      <section className="gnosis-option-panel"><h2>표시 설정</h2><label className="gnosis-check"><input type="checkbox" checked={draft.hideMedia} onChange={event=>update({hideMedia:event.target.checked})}/>미디어 미리보기 숨기기</label><label className="gnosis-check"><input type="checkbox" checked={draft.useSpoiler} onChange={event=>update({useSpoiler:event.target.checked})}/>스포일러 주의</label><p>스포일러 글은 열람자가 직접 내용을 펼쳐요.</p></section>
      <p className="gnosis-storage-note">글과 임시저장은 현재 브라우저에 저장돼요.</p>
    </aside></div>
    <dialog ref={cancelDialog} className="gnosis-poll-dialog" aria-labelledby="gnosis-cancel-title" onCancel={event=>{event.preventDefault();closeCancel();}} onClick={event=>{if(event.target===cancelDialog.current)closeCancel();}}><h2 id="gnosis-cancel-title">작성 화면을 나갈까요?</h2><p>임시저장하지 않은 변경은 남지 않아요.</p><div className="gnosis-compose-actions"><button type="button" onClick={closeCancel}>계속 작성</button><button type="button" onClick={()=>{closeCancel();router.push('/gnosis');}}>나가기</button></div></dialog>
  </div></main>;
}
