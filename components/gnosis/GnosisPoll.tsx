"use client";
import { useEffect, useState } from "react";
import { readPoll } from "@/lib/gnosisPoll";
import type { PollData } from "@/types/kerygma";
export default function GnosisPoll({poll:rawPoll,onVote}:{poll:PollData;onVote?:(ids:string[])=>boolean}) {
  const [selected,setSelected]=useState<string[]>([]);
  const [now,setNow]=useState(0);
  useEffect(()=>{void Promise.resolve().then(()=>setNow(Date.now()));const timer=setInterval(()=>setNow(Date.now()),15000);return()=>clearInterval(timer);},[]);
  const poll=readPoll(rawPoll);if(!poll)return <p className="gnosis-editor-alert">투표 내용을 읽을 수 없어요.</p>;
  const voted=Boolean(poll.userVotes?.length),closed=Boolean(poll.endDate&&new Date(poll.endDate).getTime()<now);
  const total=poll.options.reduce((sum,option)=>sum+(Number.isFinite(option.votes)?option.votes:0),0);
  return <section className="gnosis-poll"><h3>{poll.title}</h3><p>{poll.allowMultiple?'복수 선택':'단일 선택'} · {poll.isAnonymous?'익명':'공개'}{closed?' · 마감':''}</p><div>{poll.options.map(option=><label key={option.id}><input type={poll.allowMultiple?'checkbox':'radio'} name="gnosis-poll-choice" checked={(voted?poll.userVotes:selected)?.includes(option.id)??false} disabled={!onVote||voted||closed} onChange={event=>setSelected(poll.allowMultiple?event.target.checked?[...selected,option.id]:selected.filter(id=>id!==option.id):[option.id])}/><span>{option.text}</span><small>{option.votes||0}표{total?' · '+Math.round((option.votes||0)/total*100)+'%':''}</small></label>)}</div>{onVote&&<button type="button" disabled={!selected.length||voted||closed} onClick={()=>{if(onVote(selected))setSelected([]);}}>{voted?'참여 완료':closed?'마감된 투표':'투표하기'}</button>}</section>;
}
