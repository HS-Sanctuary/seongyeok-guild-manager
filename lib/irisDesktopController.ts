import type { DesktopQueue, QueueSnapshot, TaskKey,PendingEdit,SaveOutcome } from './irisDesktopQueue';
import { DesktopTransportError, type DesktopAccount, type DesktopCharacter, type DesktopDetails, type DesktopTransport } from './irisDesktopTransport';
import type {BarterKey} from './irisBarter';
import type {WorkspaceKey} from './irisWorkspace';
export type DesktopStore = { load(): Promise<QueueSnapshot | null>; replace(value: QueueSnapshot): Promise<void> };
export type DesktopSaveConfirmation = {characterId:string;nickname:string;confirmedAt:number};
export type DesktopClassDraft={text:string;error:string|null};
type Disposition = 'save' | 'keep' | 'discard';

/** Owns authenticated serial IO. It does not operate the game or carry authentication secrets. */
export function createDesktopController(options: { queue: DesktopQueue; transport: DesktopTransport; store: DesktopStore; environment: string; now?:()=>number }) {
  const { queue, transport, store, environment } = options;
  let account: DesktopAccount | null = null, characters: DesktopCharacter[] = [], selected: DesktopDetails | null = null;
  let epoch = 0, selection = 0, changing = false, closed = false, durabilityError = false;
  let charactersLoaded = false;
  const confirmations=new Map<string,DesktopSaveConfirmation>();
  const explicitBarterRetries=new Set<string>();
  const confirmationKey=(owner:string,id:string)=>JSON.stringify([owner,id]);
  const drafts=new Map<string,Record<string,DesktopClassDraft>>();
  const currentDrafts=()=>account&&selected?drafts.get(confirmationKey(account.id,selected.characterId))??{}:{};
  const invalid=(values:Record<string,DesktopClassDraft>)=>Object.values(values).some(d=>d.error!==null);
  const blocked=()=>new Set(account?characters.filter(c=>invalid(drafts.get(confirmationKey(account!.id,c.id))??{})).map(c=>c.id):[]);
  const requireValidDraft=()=>{if(invalid(currentDrafts()))throw Error('클래스 레벨 입력을 고치거나 되돌린 뒤 진행해 주세요.');};
  let running: Promise<void> | null = null, disk = Promise.resolve();
  const scope = (id: string) => { if (!account) throw Error('로그인이 필요해요.'); return { environment, accountId: account.id, characterId: id }; };
  const locked = () => changing || closed || durabilityError || !account;
  const requireEdit = () => { if (locked() || !selected) throw Error('먼저 연결 상태를 확인해 주세요.'); };
  async function loadCharacters() {
    charactersLoaded = false; characters = [];
    if (!account) return;
    characters = await transport.characters(account.id);
    charactersLoaded = true;
  }
  function acknowledge(edit: PendingEdit, completed:number,outcome:SaveOutcome) {
    // Session-local evidence only: do not invent a historic DB write time or persist it as queue data.
    if(account?.id===edit.accountId){
      const character=characters.find(c=>c.id===edit.characterId);
      if(character)confirmations.set(confirmationKey(edit.accountId,edit.characterId),{characterId:edit.characterId,nickname:character.nickname,confirmedAt:(options.now??Date.now)()});
    }
    if(edit.kind==='workspace'&&selected?.accountId===edit.accountId&&(edit.scope==='account'||selected.characterId===edit.characterId)){
      const row=selected.details.workspace?.find(r=>r.itemKind===edit.itemKind&&r.id===edit.itemId&&r.key.periodKey===edit.periodKey);
      if(row){if(edit.field==='count')row.completed=completed;else row.bookmarked=completed===1;}return;
    }
    if(edit.kind==='class'){
      const values=drafts.get(confirmationKey(edit.accountId,edit.characterId));
      if(values?.[edit.classId]?.error===null&&Number(values[edit.classId].text)===completed)delete values[edit.classId];
    }
    if(edit.kind==='barter'&&selected?.accountId===edit.accountId&&(edit.scope==='account'||selected.characterId===edit.characterId)){
      const row=selected.details.barter?.find(r=>r.id===edit.tradeId&&r.periodKey===edit.periodKey),context=selected.writeContext.barter?.find(r=>r.tradeId===edit.tradeId&&r.periodKey===edit.periodKey);
      if(row&&context&&outcome.kind==='saved'&&'baseRecords' in outcome&&outcome.baseRecords){row.completed=completed;row.completedBy=outcome.completedBy??null;row.consistent=true;context.baseRecords=structuredClone(outcome.baseRecords);}
      return;
    }
    if (selected?.accountId === edit.accountId && selected.characterId === edit.characterId) {
      if(edit.kind==='class'){
        const row=selected.details.classes.find(r=>r.id===edit.classId);if(row)row.level=completed;
        const context=selected.writeContext.classes.find(r=>r.classId===edit.classId);if(context)context.baseLevel=completed;
      }else if(edit.kind==='task'&&selected.writeContext.periodKeys[edit.category]===edit.periodKey){
        const row = selected.details.tasks[edit.category].find(r => r.id === edit.taskId); if (row) row.completed = completed;
      }
    }
  }
  function inspection(edit:PendingEdit,latest:DesktopDetails):SaveOutcome|'baseline'{
    if(edit.kind==='workspace'){
      // An optional catalog read failure is not evidence that the item was removed.
      if(!latest.details.workspace)return {kind:'unknown'};
      const row=latest.details.workspace?.find(r=>r.itemKind===edit.itemKind&&r.id===edit.itemId);
      if(!row||row.key.scope!==edit.scope||row.key.catalogKey!==edit.catalogKey)return {kind:'conflict'};
      if(row.key.periodKey!==edit.periodKey)return {kind:'expired'};
      const value=edit.field==='count'?row.completed:Number(row.bookmarked);
      if(value===edit.desiredCompleted)return {kind:'saved',completed:value};
      return value===edit.baseCompleted&&(edit.field==='bookmark'||edit.desiredCompleted<=row.total)?'baseline':{kind:'conflict'};
    }
    if(edit.kind==='barter'){
      const row=latest.details.barter?.find(r=>r.id===edit.tradeId),context=latest.writeContext.barter?.find(r=>r.tradeId===edit.tradeId);
      if(!row||!context||context.scope!==edit.scope||context.catalogKey!==edit.catalogKey)return {kind:'conflict'};
      if(context.periodKey!==edit.periodKey)return {kind:'expired'};
      if(context.baseRecords.length!==edit.baseRecords.length||edit.baseRecords.some(b=>!context.baseRecords.some(c=>c.characterId===b.characterId)))return {kind:'conflict'};
      const buyer=edit.desiredCompleted?characters.find(c=>c.id===edit.characterId)?.nickname:null;
      if(row.consistent&&row.completed===edit.desiredCompleted&&row.completedBy===buyer)return {kind:'saved',completed:row.completed,completedBy:row.completedBy,baseRecords:context.baseRecords};
      return edit.baseRecords.every(b=>context.baseRecords.some(c=>c.characterId===b.characterId&&c.recordKey===b.recordKey))&&edit.desiredCompleted<=row.total?'baseline':{kind:'unknown'};
    }
    if(edit.kind==='class'){
      const c=latest.writeContext.classes?.find(r=>r.classId===edit.classId);
      if(!c?.editable)return {kind:'conflict'};
      if(c.baseLevel===edit.desiredLevel)return {kind:'saved',level:edit.desiredLevel};
      return c.baseLevel===edit.baseLevel?'baseline':{kind:'conflict'};
    }
    const row=latest.details.tasks[edit.category].find(r=>r.id===edit.taskId);
    if(latest.writeContext.periodKeys[edit.category]!==edit.periodKey)return {kind:'expired'};
    if(row?.completed===edit.desiredCompleted)return {kind:'saved',completed:row.completed};
    return row&&row.completed===edit.baseCompleted&&edit.desiredCompleted<=row.total?'baseline':{kind:'conflict'};
  }
  function settle(edit:PendingEdit,outcome:SaveOutcome){
    queue.settle(edit.requestId,outcome);
    if(outcome.kind==='saved')acknowledge(edit,'level' in outcome?outcome.level:outcome.completed,outcome);
  }
  function persist() {
    const snapshot = queue.snapshot();
    disk = disk.then(() => store.replace(snapshot)).catch(error => { durabilityError = true; throw error; });
    return disk;
  }
  async function read(id: string) {
    if (!account || !characters.some(c => c.id === id)) throw Error('본인 캐릭터를 선택해 주세요.');
    const owner = account.id, currentEpoch = epoch;
    const value = await transport.details(owner, id);
    if (epoch !== currentEpoch || account?.id !== owner) throw Error('계정이 바뀌었어요.');
    return value;
  }
  async function reconcile() {
    if (!account) throw Error('저장 결과 확인에 로그인이 필요해요.');
    for (const edit of queue.snapshot().entries.filter(e => e.environment === environment && e.accountId === account!.id && e.phase === 'unknown')) {
      const latest = await read(edit.characterId);
      const result=inspection(edit,latest);if(result!=='baseline')settle(edit,result);
      // Confirmed baseline: keep unknown, paused. Only an explicit recovery action may retry later.
      await persist();
    }
  }
  async function flush(draining = false) {
    if (durabilityError) throw Error('대기함을 보관하지 못했어요.');
    if ((locked() && !draining) || closed || !account) return;
    const owner = account.id, currentEpoch = epoch;
    while ((!locked() || draining) && !closed && !durabilityError && account?.id === owner && epoch === currentEpoch) {
      const next = queue.due(owner,blocked())[0]; if (!next) break;
      const edit = queue.claim(next.requestId); if (!edit) break;
      const explicitBarterRetry=explicitBarterRetries.delete(edit.requestId);
      await persist(); // Durable inflight before even inspecting/sending the request.
      try {
        const latest = await read(edit.characterId);
        const checked=inspection(edit,latest);
        if(checked!=='baseline'&&!(edit.kind==='barter'&&checked.kind==='unknown'&&explicitBarterRetry))settle(edit,checked);
        else if(blocked().has(edit.characterId))queue.settle(edit.requestId,{kind:'unknown'});
        else {
          const result = await transport.save(edit);
          if (result.kind === 'saved') settle(edit,result);
          else if (result.kind === 'conflict' || result.kind === 'rejected') queue.settle(edit.requestId, { kind: 'conflict' });
          else {
            queue.settle(edit.requestId, { kind: 'unknown' });
            if (result.kind === 'unauthorized') { account = null; selected = null; characters = []; epoch++; }
          }
        }
      } catch (error) {
        queue.settle(edit.requestId, { kind: 'unknown' });
        if (error instanceof DesktopTransportError && error.status === 401) { account = null; selected = null; characters = []; epoch++; }
      }
      await persist();
    }
  }
  function tick(): Promise<void> {
    if (running) return running;
    const operation = flush(); running = operation;
    void operation.finally(() => { if (running === operation) running = null; }).catch(() => {});
    return operation;
  }
  async function transition(action: () => Promise<void>, disposition: Disposition) {
    if (changing || closed || durabilityError) throw Error('현재 작업이 끝난 뒤 다시 시도해 주세요.');
    if(disposition!=='discard'&&blocked().size)throw Error('클래스 레벨 입력을 고치거나 되돌린 뒤 진행해 주세요.');
    changing = true; selection++;
    try {
      if (running) await running;
      if (account) {
        try { await reconcile(); } // Inspect old-cookie results where the session is still available.
        catch(error) {
          if (!(error instanceof DesktopTransportError) || error.status !== 401 || disposition === 'save') throw error;
          // Expired authentication cannot resolve old requests; retain them paused across reauthentication.
        }
        const scopes = new Set(queue.snapshot().entries.filter(e => e.environment === environment && e.accountId === account!.id).map(e => e.characterId));
        if (disposition === 'discard') {for (const id of scopes) queue.discard(scope(id));for(const c of characters)drafts.delete(confirmationKey(account.id,c.id));}
        if (disposition === 'save') {
          for (const id of scopes) queue.saveNow(scope(id));
          const saving = flush(true); running = saving;
          try { await saving; } finally { if (running === saving) running = null; }
          await reconcile();
          if (queue.snapshot().entries.some(e => e.environment === environment && e.accountId === account!.id)) throw Error('남은 변경을 확인해 주세요.');
        }
      }
      await persist();
      await action();
    } finally { changing = false; }
  }
  return {
    async start() {
      if (changing || running || closed || durabilityError) throw Error('앱을 다시 확인해 주세요.');
      changing = true; selection++; epoch++;
      try {
        try {
          const restored = await store.load(); if (restored) queue.restore(restored);
        } catch (error) { durabilityError = true; throw error; }
        account = await transport.session(); selected = null;
        await loadCharacters();
      } finally { changing = false; }
    },
    async reloadCharacters() {
      if (locked() || running) throw Error('현재 작업이 끝난 뒤 다시 시도해 주세요.');
      if (charactersLoaded) return;
      changing = true;
      try { await loadCharacters(); }
      catch(error) {
        if(error instanceof DesktopTransportError && error.status===401){account=null;selected=null;epoch++;}
        throw error;
      } finally { changing = false; }
    },
    async selectCharacter(id: string) {
      if (locked()) throw Error('먼저 로그인해 주세요.');
      if(id!==selected?.characterId)requireValidDraft();
      const version = ++selection, currentEpoch = epoch;
      if (selected && selected.characterId !== id) { queue.leaveCharacter(scope(selected.characterId)); await persist(); }
      if (version !== selection || currentEpoch !== epoch || changing || closed) return;
      const value = await read(id);
      if (version === selection && currentEpoch === epoch && !changing && !closed) {
        // Inputs remain editable during read-only IO; validate again before hiding them.
        if(id!==selected?.characterId)requireValidDraft();
        selected = value;
      }
    },
    async refresh() {
      if(running) await running;
      if (locked() || !selected) return;
      const id=selected.characterId,version=selection,currentEpoch=epoch;
      try {
        const value=await read(id);
        if(version===selection && currentEpoch===epoch && !changing && !closed) selected=value;
      } catch(error) {
        if(error instanceof DesktopTransportError && error.status===401){account=null;characters=[];selected=null;epoch++;}
        throw error;
      }
    },
    edit(key: TaskKey, base: number, desired: number): Promise<void> {
      requireEdit();
      const row = selected!.details.tasks[key.category].find(r => r.id === key.taskId);
      if (!row || selected!.writeContext.periodKeys[key.category] !== key.periodKey || desired > row.total) throw Error('항목이나 기간을 확인해 주세요.');
      queue.edit(scope(selected!.characterId), key, base, desired);
      return persist();
    },
    editBarter(key:BarterKey,base:number,desired:number):Promise<void>{
      requireEdit();const row=selected!.details.barter?.find(r=>r.id===key.tradeId),context=selected!.writeContext.barter?.find(r=>r.tradeId===key.tradeId);
      if(!row||!context||context.periodKey!==key.periodKey||context.scope!==key.scope||context.catalogKey!==key.catalogKey||JSON.stringify(context.baseRecords)!==JSON.stringify(key.baseRecords)||desired>row.total)throw Error('물물교환 항목이나 기간을 다시 확인해 주세요.');
      queue.editBarter(scope(selected!.characterId),key,base,desired);return persist();
    },
    editWorkspace(key:WorkspaceKey,base:number,desired:number):Promise<void>{
      requireEdit();const row=selected!.details.workspace?.find(r=>r.itemKind===key.itemKind&&r.id===key.itemId);
      if(!row||row.key.catalogKey!==key.catalogKey||row.key.periodKey!==key.periodKey||row.scope!==key.scope||(key.field==='count'&&desired>row.total))throw Error('상점·임무 항목이나 기간을 다시 확인해 주세요.');
      queue.editWorkspace(scope(selected!.characterId),key,base,desired);return persist();
    },
    async setClassDraft(classId:string,text:string){
      requireEdit();
      const context=selected!.writeContext.classes?.find(c=>c.classId===classId);
      if(!context?.editable)throw Error('저장된 클래스 정보를 웹에서 확인해 주세요.');
      const values=drafts.get(confirmationKey(account!.id,selected!.characterId))??{};
      const value=Number(text),error=!/^\d{1,4}$/.test(text)||!Number.isSafeInteger(value)||value<1||value>1000?'1~1000 사이의 정수를 입력해 주세요.':null;
      if(error===null)queue.editClass(scope(selected!.characterId),classId,context.baseLevel,value);
      values[classId]={text,error};drafts.set(confirmationKey(account!.id,selected!.characterId),values);
      if(error===null&&!queue.snapshot().entries.some(e=>e.kind==='class'&&e.accountId===account!.id&&e.characterId===selected!.characterId&&e.classId===classId))delete values[classId];
      if(error===null)await persist();
    },
    async revertClassDraft(classId:string){
      requireEdit();const key=confirmationKey(account!.id,selected!.characterId),values=drafts.get(key);
      if(!values?.[classId])return;
      const pending=queue.snapshot().entries.filter(e=>e.kind==='class'&&e.accountId===account!.id&&e.characterId===selected!.characterId&&e.classId===classId).sort((a,b)=>b.revision-a.revision)[0];
      delete values[classId];
      if(pending?.kind==='class')values[classId]={text:String(pending.desiredLevel),error:null};
      queue.leaveCharacter(scope(selected!.characterId));await persist();
    },
    async saveNow() { requireEdit();requireValidDraft(); queue.saveNow(scope(selected!.characterId)); await persist(); await tick(); },
    async discard() { requireEdit(); queue.discard(scope(selected!.characterId));drafts.delete(confirmationKey(account!.id,selected!.characterId)); await persist(); },
    async recover(requestId: string, action: 'retry' | 'discard') {
      if (locked() || running) throw Error('연결 상태를 먼저 확인해 주세요.');
      const edit = queue.snapshot().entries.find(e => e.requestId === requestId && e.environment === environment && e.accountId === account?.id);
      if (!edit || ['pending','inflight'].includes(edit.phase)) throw Error('확인할 변경이 없어요.');
      changing = true;
      try {
        if (action === 'discard') {
          // Read first: a failed refresh must retain the paused intent and draft.
          const latest=edit.kind==='class'?await read(edit.characterId):null;
          queue.recover(requestId, 'discard');
          if(edit.kind==='class') {
            const values=drafts.get(confirmationKey(edit.accountId,edit.characterId));
            if(values)delete values[edit.classId];
            if(latest&&selected?.characterId===edit.characterId)selected=latest;
          }
        }
        else {
          if (edit.phase !== 'unknown') throw Error('충돌하거나 기간이 지난 변경은 버린 뒤 다시 체크해 주세요.');
          if(blocked().has(edit.characterId))throw Error('클래스 입력을 먼저 고쳐 주세요.');
          const latest=await read(edit.characterId),result=inspection(edit,latest);
          // A partial barter intent is never inferred from MAX. Explicit retry reaches
          // the server, which permits only the original item digests or exact desired copies.
          if(result==='baseline'||(edit.kind==='barter'&&result.kind==='unknown')){
            queue.recover(requestId,'retry');
            if(edit.kind==='barter')for(const retried of queue.snapshot().entries)if(retried.kind==='barter'&&retried.phase==='pending'&&retried.accountId===edit.accountId&&retried.tradeId===edit.tradeId&&retried.periodKey===edit.periodKey&&retried.scope===edit.scope)explicitBarterRetries.add(retried.requestId);
          }else settle(edit,result);
        }
        await persist();
      } finally { changing = false; }
      await tick();
    },
    tick,
    async login(nickname: string, code: string, keepLoggedIn: boolean) {
      await transition(async () => {
        account = null; selected = null; characters = []; epoch++;
        account = await transport.login(nickname,code,keepLoggedIn);
        await loadCharacters();
      }, 'keep');
    },
    async switchAccount(id: string) {
      await transition(async () => {
        // Clear old view before cookie-changing IO. Failure cannot retain old-account write permission.
        account = null; selected = null; characters = []; epoch++;
        account = await transport.switchAccount(id);
        await loadCharacters();
      }, 'keep');
    },
    async logout(disposition: Disposition) {
      await transition(async () => { account = null; characters = []; selected = null; epoch++; await transport.logout(); }, disposition);
    },
    async shutdown(disposition: Disposition) {
      if(closed) return; // A failed native close reply may be retried without reopening transmissions.
      if(disposition==='keep') {
        if(blocked().size)throw Error('클래스 레벨 입력을 고치거나 되돌린 뒤 종료해 주세요.');
        if(changing || durabilityError) throw Error('보관 실패 상태예요. 최근 변경을 잃을 수 있는 종료를 별도로 확인해 주세요.');
        changing=true;selection++;
        try {if(running) await running;await persist();closed=true;selected=null;epoch++;}
        finally{changing=false;}
        return; // No network required: unknown results remain protected and paused.
      }
      await transition(async () => { closed = true; selected = null; epoch++; }, disposition);
    },
    async shutdownWithoutSaving() {
      if(changing || running) throw Error('현재 작업이 끝난 뒤 다시 시도해 주세요.');
      closed=true;selected=null;epoch++; // Explicit loss-warning path; never overwrite an unreadable store.
    },
    state() { return structuredClone({ account, characters, charactersLoaded, selected,classDrafts:currentDrafts(),hasInvalidClassDraft:invalid(currentDrafts()), lastSaveConfirmation:account&&selected?confirmations.get(confirmationKey(account.id,selected.characterId))??null:null, locked: locked(), durabilityError, epoch, queue: queue.snapshot() }); },
  };
}
