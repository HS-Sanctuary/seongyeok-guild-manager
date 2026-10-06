const fields=['requestId','generation','selectionVersion','accountId','characterId','category','taskId','baseCompleted','desiredCompleted','periodKey'];
export function validEdit(e){
  return !!e && typeof e==='object'&&!Array.isArray(e) && Object.keys(e).length===fields.length && Object.keys(e).every(k=>fields.includes(k)) &&
    typeof e.requestId==='string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(e.requestId) &&
    ['daily','weekly','abyss','raid'].includes(e.category) &&
    [e.generation,e.selectionVersion].every(v=>Number.isSafeInteger(v)&&v>0) &&
    [e.accountId,e.characterId,e.taskId].every(v=>typeof v==='string'&&v.length<=100&&v.trim()&&!/[\u0000-\u0020\u007f]/u.test(v)) &&
    [e.baseCompleted,e.desiredCompleted].every(v=>Number.isSafeInteger(v)&&v>=0&&v<=1000) &&
    typeof e.periodKey==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:00:00\.000Z$/.test(e.periodKey);
}
export class KronosEditQueue{
  #rows=new Map();#last='idle';
  stage(e,accept=()=>true){
    if(!validEdit(e)||[...this.#rows.values()].some(r=>['submitted','unknown'].includes(r.status)))return false;
    const key=e.category+':'+e.taskId,old=this.#rows.get(key);
    if(old && ['generation','selectionVersion','accountId','characterId','periodKey'].some(k=>old.edit[k]!==e[k]))return false;
    if(!old&&this.#rows.size>=200)return false;
    const edit=old?{...e,requestId:old.edit.requestId,baseCompleted:old.edit.baseCompleted}:structuredClone(e);
    if([...this.#rows.values()].some(r=>r!==old&&r.edit.requestId===edit.requestId))return false;
    const prospective=[...this.#rows.values()].filter(r=>r!==old).map(r=>({...r.edit,status:r.status}));
    if(edit.baseCompleted!==edit.desiredCompleted)prospective.push({...edit,status:'pending'});
    if(!accept({state:'pending',edits:prospective}))return false;
    if(edit.baseCompleted===edit.desiredCompleted)this.#rows.delete(key);
    else this.#rows.set(key,{edit,status:'pending'});
    this.#last='pending';return true;
  }
  submit(){
    if(!this.#rows.size||[...this.#rows.values()].some(r=>['submitted','unknown'].includes(r.status)))return false;
    for(const row of this.#rows.values())row.status='submitted';this.#last='submitted';return true;
  }
  pending(){
    return [...this.#rows.values()].filter(r=>['submitted','unknown'].includes(r.status)).map(r=>{
      const reconcileOnly=r.status==='unknown';r.status='unknown';return {...structuredClone(r.edit),reconcileOnly};
    });
  }
  applyResult(r){
    const found=[...this.#rows.entries()].find(([,row])=>row.edit.requestId===r?.requestId);
    if(!found||!['saved','failed','conflict','unknown'].includes(r.status)||!(r.completed===null||Number.isSafeInteger(r.completed)&&r.completed>=0&&r.completed<=1000))return false;
    const [key,row]=found;if(!['submitted','unknown'].includes(row.status))return false;
    if(r.status==='saved'&&r.completed!==row.edit.desiredCompleted)return false;
    if(r.status==='saved')this.#rows.delete(key);else row.status=r.status;
    this.#last=r.status;return true;
  }
  discard(){this.#rows.clear();this.#last='idle';}
  snapshot(){const rows=[...this.#rows.values()];return {state:rows.some(r=>r.status==='submitted')?'submitted':rows.some(r=>r.status==='unknown')?'unknown':rows.some(r=>r.status==='conflict')?'conflict':rows.some(r=>r.status==='failed')?'failed':rows.length?'pending':this.#last,edits:structuredClone(rows.map(r=>({...r.edit,status:r.status})))};}
}
