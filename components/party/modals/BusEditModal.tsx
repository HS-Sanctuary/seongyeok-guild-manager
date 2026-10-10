'use client';
import {useEffect,useRef,useState,type ReactNode} from 'react';
import {createPortal} from 'react-dom';
import BusCreateModal, {type BusCharSelectionConfig} from './BusCreateModal';
import type {Party,ContentItem} from '@/components/party/types';
import type {PartyCatalog} from '@/hooks/usePartyCatalog';
import {getPartyContentOptions,normalizeContentName} from '@/lib/partyContentCatalog';
import {busSettingsSnapshot} from '@/lib/guildBusSettings';
import {extractSubContentKeys,findPartyPowerReq} from '@/lib/busUtils';
import {supabase} from '@/lib/supabase';
import {usePartyOperations,usePartySurface} from '@/components/party/PartySurfaceContext';

type DirectoryCharacter={id:number;nickname:string;owner:string;job:string;combat_power:string;magic_resistance:string;_missing?:boolean};
type Props={party:Party;catalog:PartyCatalog;accountNickname:string;onClose:()=>void;onSaved:()=>void|Promise<void>};

export default function BusEditModal({party,catalog,accountNickname,onClose,onSaved}:Props) {
  const {request}=usePartyOperations();
  const surface=usePartySurface();
  const [original]=useState(()=>party);
  const initialSub=extractSubContentKeys(original.selected_sub_contents);
  const [subContents,setSubContents]=useState(initialSub.length?initialSub:['abyss_1','abyss_2','abyss_3']);
  const [content,setContent]=useState<ContentItem|undefined>(()=>getPartyContentOptions(catalog.powerReqs,initialSub.length?initialSub:undefined).find(c=>normalizeContentName(c.name)===normalizeContentName(original.content_name)));
  const [difficulty,setDifficulty]=useState(original.difficulty);
  const [date,setDate]=useState(original.party_date||'');
  const [start,setStart]=useState(original.time_start),[end,setEnd]=useState(original.time_end);
  const [memo,setMemo]=useState((original.sub_content||original.memo||'').replace(/^\s*\[성역 길드 버스\]\s*/,''));
  const [selections,setSelections]=useState<Record<string,BusCharSelectionConfig>>(()=>Object.fromEntries(original.members.map(m=>[m.character_name||m.name,{selected:true,allowRepeat:!!m.allow_repeat,timeStart:m.time_start||m.start_time||original.time_start,timeEnd:m.time_end||m.end_time||original.time_end}])));
  const [characters,setCharacters]=useState<DirectoryCharacter[]>([]);
  const [loading,setLoading]=useState(true),[feedback,setFeedback]=useState(''),[saving,setSaving]=useState(false);
  const lock=useRef(false),alive=useRef(true);
  useEffect(()=>{
    alive.current=true;
    void (async()=>{
      const {data,error}=await supabase.from('characters').select('id,nickname,owner,job,combat_power,magic_resistance').eq('owner',accountNickname).order('nickname');
      if (!alive.current) return;
      if (error) setFeedback('참가 목록을 불러오지 못했어요. 창을 다시 열어주세요.');
      else {
        const directory:DirectoryCharacter[]=data||[];
        setCharacters(directory);
        setSelections(prev=>Object.fromEntries(Object.entries(prev).filter(([name])=>directory.some(c=>c.nickname===name))));
      }
      setLoading(false);
    })();
    return ()=>{alive.current=false;};
  },[original,accountNickname]);
  const preparing=!content || loading || (!characters.length && !!feedback);
  const preparingRef=useRef<HTMLElement>(null);
  useEffect(()=>{
    if (!preparing || surface) return;
    const previous=document.activeElement instanceof HTMLElement?document.activeElement:null;
    const overflow=document.body.style.overflow;document.body.style.overflow='hidden';
    preparingRef.current?.focus();
    const key=(e:KeyboardEvent)=>{if(e.key==='Escape'){e.preventDefault();onClose();}if(e.key==='Tab'){e.preventDefault();preparingRef.current?.querySelector('button')?.focus();}};
    document.addEventListener('keydown',key);
    return ()=>{document.removeEventListener('keydown',key);document.body.style.overflow=overflow;if(previous?.isConnected)previous.focus();};
  },[preparing,onClose,Boolean(surface)]);
  const retainedMembers=original.members.filter(m=>!characters.some(c=>c.nickname===(m.character_name||m.name))).map(m=>({name:m.character_name||m.name,start:m.time_start||m.start_time||original.time_start,end:m.time_end||m.end_time||original.time_end}));
  const save=async()=>{
    if (!content || lock.current || loading) return;
    if (['운행중','매칭 완료','매칭중'].includes(original.status) && !window.confirm('현재 출전 회차를 마쳤나요?\n아직 전투 중이면 취소하고 회차 완료 처리 후 수정해주세요.\n저장하면 새 조건으로 즉시 재편성합니다.')) return;
    const selected=Object.entries(selections).filter(([,value])=>value.selected);
    if (!selected.length && !retainedMembers.length) {setFeedback('참가 캐릭터를 최소 1개 선택해주세요.');return;}
    const removed=original.members.filter(m=>characters.some(c=>c.nickname===(m.character_name||m.name))&&!selections[m.character_name||m.name]?.selected);
    if (removed.length && !window.confirm(`${removed.map(m=>m.character_name||m.name).join(', ')}\n${removed.length}개 캐릭터를 참가 목록에서 제외할까요? 숙제 기록은 삭제하지 않아요.`)) return;
    lock.current=true;setSaving(true);setFeedback('');
    try {
      const response=await request('/api/member-mutations',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({table:'parties',action:'update',filter:{column:'id',value:original.id},payload:{_busSettings:{baseline:busSettingsSnapshot(original),contentId:content.id,difficulty,memo,partyDate:date,timeStart:start,timeEnd:end,subContents:content.category==='어비스'?subContents:null,members:selected.map(([name,c])=>({name,allowRepeat:c.allowRepeat})),roundFinished:true}}})});
      const result=await response.json();
      if (!alive.current) return;
      if (!response.ok) {setFeedback(result.message||'저장하지 못했어요. 최신 정보를 확인해주세요.');return;}
      await onSaved(); if (alive.current) onClose();
    } catch {
      if (alive.current) setFeedback('응답을 확인하지 못했어요. 다시 저장하기 전에 최신 정보로 저장 상태를 확인해주세요.');
    } finally {lock.current=false;if(alive.current)setSaving(false);}
  };
  if (typeof document==='undefined') return null;
  const portal=(node:ReactNode)=>createPortal(surface?<div data-iris-party-portal hidden={!surface.active}>{node}</div>:node,document.body);
  if (preparing) return portal(<div className="fixed inset-0 z-[250] bg-black/85 flex items-center justify-center p-4" onClick={onClose}><section ref={preparingRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label="길드 버스 수정 준비" className="max-w-lg rounded-2xl bg-[var(--panel)] text-[var(--text-main)] p-5" onClick={e=>e.stopPropagation()}><p role="status">{!content?'등록된 컨텐츠 기준을 확인한 뒤 다시 열어주세요.':feedback||'참가 캐릭터를 불러오는 중…'}</p><button type="button" onClick={onClose} className="mt-3 underline">닫기</button></section></div>);
  if (!content) return null;
  const capacity=findPartyPowerReq(catalog.powerReqs,content.name,difficulty)?.max_members||content.size;
  return portal(<BusCreateModal mode="edit" isSaving={saving} feedback={feedback} capacity={capacity} retainedMembers={retainedMembers}
    onReload={()=>{if(window.confirm('입력한 수정을 버리고 최신 버스 정보를 불러올까요?')){void (async()=>{await onSaved();if(alive.current)onClose();})();}}}
    catalog={catalog} showBusCreateModal setShowBusCreateModal={value=>{if(!value&&!lock.current)onClose();}}
    busCreateContent={content} setBusCreateContent={setContent} busCreateDiff={difficulty} setBusCreateDiff={setDifficulty}
    busCreateDate={date} setBusCreateDate={setDate} busCreateTimeStart={start} setBusCreateTimeStart={setStart} busCreateTimeEnd={end} setBusCreateTimeEnd={setEnd}
    busCreateMemo={memo} setBusCreateMemo={setMemo} busCharSelections={selections} setBusCharSelections={setSelections}
    handleCreateGuildBus={()=>{void save();}} myCharacters={characters} busSelectedSubContents={subContents} setBusSelectedSubContents={setSubContents}/>);
}
