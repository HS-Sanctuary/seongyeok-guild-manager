"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import GnosisPoll from "@/components/gnosis/GnosisPoll";
import { applyLocalVote } from "@/lib/gnosisPoll";
import type { PollData } from "@/types/kerygma";
import GnosisContent from "@/components/gnosis/GnosisContent";
import GnosisComments from "@/components/gnosis/GnosisComments";
import GnosisMark from "@/components/gnosis/GnosisMark";
import { changeComment, readGuides, storeGuide, type LocalGuide, type GnosisComment } from "@/lib/gnosisLocal";
import { useGnosisNavigation } from "@/hooks/useGnosisNavigation";
import { gnosisDisplayLabel } from "@/lib/gnosisNavigation";
import "../gnosis.css";
import "../gnosis-editor.css";
export default function GnosisDetailPage() {
  const params = useParams();
  const id = String(params.id ?? "");
  const {items} = useGnosisNavigation();
  const [guide,setGuide] = useState<LocalGuide | null>(null);
  const [loaded,setLoaded] = useState(false);
  const [error,setError] = useState("");
  const [revealed,setRevealed] = useState(false);
  useEffect(() => {
    let active = true;
    function load() { try { const found=readGuides(localStorage).find(row=>String(row.id)===id)??null; if(active){setGuide(found);setError("");setLoaded(true);} } catch { if(active){setError("저장된 글을 읽을 수 없어요. 기존 기록은 그대로 남겨뒀어요.");setLoaded(true);} } }
    void Promise.resolve().then(load);
    const storage = (event: StorageEvent) => { if(event.key==="gnosis_mock_db") load(); };
    window.addEventListener("storage",storage);
    return () => {active=false;window.removeEventListener("storage",storage);};
  },[id]);
  function mutate(update:(current:LocalGuide)=>LocalGuide):boolean {
    try {
      const current=readGuides(localStorage).find(row=>String(row.id)===id);
      if(!current) throw new Error("글을 찾을 수 없어요.");
      const next=update(current);storeGuide(localStorage,next);setGuide(next);setError("");return true;
    } catch {setError("변경을 저장하지 못했어요. 기존 글과 입력 내용은 보존했어요.");return false;}
  }
  function addComment(text:string,parent?:GnosisComment["id"]) {
    return mutate(current=>{
      const comment:GnosisComment={id:crypto.randomUUID(),author:"한설",title_name:"성역 길드마스터",content:text,timestamp:new Date().toLocaleString("ko-KR"),likes:0,replies:[]};
      return {...current,comments:parent===undefined?[...(current.comments??[]),comment]:changeComment(current.comments??[],parent,row=>({...row,replies:[...(row.replies??[]),comment]}))};
    });
  }
  const date=guide?new Date(guide.created_at):null;
  const canRead=guide && (!guide.is_spoiler || revealed);
  const fashion=guide?.item_data;
  return <main className="gnosis-board gnosis-detail-page"><div className="gnosis-shell">
    <div className="gnosis-reader-back"><Link href="/gnosis">← 그노시스 게시판</Link><Link href="/gnosis/write">＋ 공략 글쓰기</Link></div>
    {error&&<p role="alert" className="gnosis-editor-alert">{error}</p>}
    {!loaded?<div className="gnosis-empty">글을 불러오고 있어요.</div>:!guide?<div className="gnosis-empty"><h1>글을 찾을 수 없어요</h1><p>게시판에서 다른 글을 확인해주세요.</p></div>:<article className="gnosis-reader">
      <header className="gnosis-reader-heading"><div className="gnosis-guide-badges"><span className="gnosis-category-badge">{gnosisDisplayLabel(guide.sub_category,items)}</span>{guide.is_spoiler&&<span className="gnosis-spoiler-badge">스포일러 주의</span>}</div><h1>{guide.title}</h1><div className="gnosis-guide-meta"><strong>{guide.author}</strong><span>{guide.title_name}</span><time>{date&&!Number.isNaN(date.getTime())?date.toLocaleDateString("ko-KR"):"날짜 미상"}</time><span>♡ {guide.likes||0}</span></div></header>
      {!canRead?<div className="gnosis-spoiler-gate"><p>스포일러가 포함된 글이에요.</p><button type="button" onClick={()=>setRevealed(true)}>내용 펼치기</button></div>:<>
        <div className="gnosis-reader-body">
          {guide.youtube_id&&/^[\w-]{11}$/.test(guide.youtube_id)&&!guide.hide_media&&<div className="gnosis-video"><iframe title={guide.title+" 첨부 영상"} src={"https://www.youtube.com/embed/"+guide.youtube_id} allowFullScreen/></div>}
          <GnosisContent content={guide.content} formatted={guide.content_format==="markdown"} richDoc={guide.rich_content}/>
          {Boolean(guide.poll) && <GnosisPoll poll={guide.poll as PollData} onVote={ids=>mutate(current=>{ return {...current,poll:applyLocalVote(current.poll as PollData,ids,Date.now())}; })}/> }
          {fashion&&typeof fashion==="object"&&typeof fashion.itemName==="string"&&<aside className="gnosis-outfit-card"><h2><GnosisMark name="패션"/>{fashion.itemName||"코디·염색 정보"}</h2><p>{typeof fashion.rarity === "string" ? fashion.rarity : ""}</p><div className="gnosis-dye-swatches">{Array.isArray(fashion.dyeParts)&&fashion.dyeParts.filter(color=>typeof color==="string"&&/^#[0-9a-f]{6}$/i.test(color)).map((color,index)=><span key={index}><i style={{background:color}}/>{color.toUpperCase()}</span>)}</div></aside>}
        </div>
        <GnosisComments comments={guide.comments??[]} onAdd={addComment} onLike={commentId=>{mutate(current=>({...current,comments:changeComment(current.comments??[],commentId,row=>({...row,likes:(row.likes||0)+1}))}));}}/>
      </>}
    </article>}
  </div></main>;
}
