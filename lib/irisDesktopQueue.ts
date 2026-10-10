import {validBarterDigest,validBarterRecords,type BarterKey,type BarterBaseRecord} from './irisBarter';
import {validWorkspaceKey,type WorkspaceKey} from './irisWorkspace';
/** Portable edit state only. Authentication, IO and period verification belong to the controller. */
export type Scope = { environment: string; accountId: string; characterId: string };
export type TaskKey = { category: 'daily' | 'weekly' | 'abyss' | 'raid'; taskId: string; periodKey: string };
type EditState = Scope & {
  requestId: string; revision: number;
  deadlineAt: number;
  phase: 'pending' | 'inflight' | 'unknown' | 'conflict' | 'expired';
};
export type TaskPendingEdit = EditState & TaskKey & {kind:'task';baseCompleted:number;desiredCompleted:number};
export type ClassPendingEdit = EditState & {kind:'class';classId:string;baseLevel:number|null;desiredLevel:number};
export type BarterPendingEdit=EditState&BarterKey&{kind:'barter';baseCompleted:number;desiredCompleted:number};
export type WorkspacePendingEdit=EditState&WorkspaceKey&{kind:'workspace';baseCompleted:number;desiredCompleted:number};
export type PendingEdit = TaskPendingEdit | ClassPendingEdit | BarterPendingEdit | WorkspacePendingEdit;
export type QueueSnapshot = { schemaVersion: 3; entries: PendingEdit[] };
export type SaveOutcome = { kind: 'saved'; completed: number;baseRecords?:BarterBaseRecord[];completedBy?:string|null } | {kind:'saved';level:number} | { kind: 'unknown' | 'conflict' | 'expired' };
const WAIT_MS = 15_000;
const CAPACITY = 500;
const FIELDS = ['environment', 'accountId', 'characterId', 'category', 'taskId', 'periodKey',
  'requestId', 'revision', 'baseCompleted', 'desiredCompleted', 'deadlineAt', 'phase'];
const CLASS_FIELDS=['environment','accountId','characterId','kind','classId','baseLevel','desiredLevel','requestId','revision','deadlineAt','phase'];
const BARTER_FIELDS=['environment','accountId','characterId','kind','tradeId','scope','periodKey','catalogKey','baseRecords','baseCompleted','desiredCompleted','requestId','revision','deadlineAt','phase'];
const WORKSPACE_FIELDS=['environment','accountId','characterId','kind','itemKind','itemId','field','scope','periodKey','catalogKey','baseCompleted','desiredCompleted','requestId','revision','deadlineAt','phase'];
const PHASES = ['pending', 'inflight', 'unknown', 'conflict', 'expired'];
const CATEGORIES = ['daily', 'weekly', 'abyss', 'raid'];
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function record(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
function name(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= 100 && !/[\u0000-\u0020\u007f]/u.test(value);
}
function count(value: unknown,max=1000): value is number {
  return Number.isInteger(value) && (value as number) >= 0 && (value as number) <= max;
}
function validScope(scope: Scope) {
  return scope && name(scope.environment) && name(scope.accountId) && name(scope.characterId);
}
function validKey(key: TaskKey) {
  return key && CATEGORIES.includes(key.category) && name(key.taskId) &&
    typeof key.periodKey === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.000Z$/.test(key.periodKey) &&
    Number.isFinite(Date.parse(key.periodKey)) && new Date(key.periodKey).toISOString() === key.periodKey;
}
const scopeId = (s: Scope) => JSON.stringify([s.environment, s.accountId, s.characterId]);
const editId = (e: PendingEdit) => e.kind==='workspace'?JSON.stringify([e.environment,e.accountId,e.scope==='account'?null:e.characterId,'workspace',e.itemKind,e.itemId,e.field,e.scope,e.periodKey]):e.kind==='class'?JSON.stringify([scopeId(e),'class',e.classId]):e.kind==='barter'?JSON.stringify([e.environment,e.accountId,e.scope==='account'?null:e.characterId,'barter',e.tradeId,e.scope,e.periodKey]):JSON.stringify([scopeId(e),'task',e.category,e.taskId,e.periodKey]);
const desired=(e:PendingEdit)=>e.kind==='class'?e.desiredLevel:e.desiredCompleted;
const baseline=(e:PendingEdit)=>e.kind==='class'?e.baseLevel:e.baseCompleted;
const clone = (entries: PendingEdit[]) => structuredClone(entries);
const barterKey=(e:BarterKey)=>['character','account'].includes(e.scope)&&name(e.tradeId)&&validKey({category:'daily',taskId:e.tradeId,periodKey:e.periodKey})&&validBarterDigest(e.catalogKey)&&validBarterRecords(e.baseRecords);
const scoped=(e:PendingEdit,s:Scope)=>e.environment===s.environment&&e.accountId===s.accountId&&((e.kind==='barter'||e.kind==='workspace')&&e.scope==='account'||e.characterId===s.characterId);

function validateSnapshot(value: unknown): PendingEdit[] {
  if (!record(value) || Object.keys(value).length !== 2 || value.schemaVersion !== 3 || !Array.isArray(value.entries))
    throw new Error('Invalid queue snapshot');
  if (value.entries.length > CAPACITY || new TextEncoder().encode(JSON.stringify(value)).length > 1_048_576)
    throw new Error('Queue capacity exceeded');
  const requests = new Set<string>(), revisions = new Set<string>(), pending = new Set<string>();
  let flights = 0;
  for (const raw of value.entries) {
    if(!record(raw))throw new Error('Invalid queue entry fields');
    const fields=raw.kind==='workspace'?WORKSPACE_FIELDS:raw.kind==='class'?CLASS_FIELDS:raw.kind==='barter'?BARTER_FIELDS:[...FIELDS,'kind'];
    if (Object.keys(raw).length !== fields.length || fields.some(field => !Object.hasOwn(raw, field)))
      throw new Error('Invalid queue entry fields');
    const e = raw as PendingEdit;
    const valid=e.kind==='workspace'?validWorkspaceKey(e)&&count(e.baseCompleted,e.field==='bookmark'?1:9999)&&count(e.desiredCompleted,e.field==='bookmark'?1:9999):e.kind==='task'?validKey(e)&&count(e.baseCompleted)&&count(e.desiredCompleted):e.kind==='barter'?barterKey(e)&&e.baseRecords.some(r=>r.characterId===e.characterId)&&(e.scope!=='character'||e.baseRecords.length===1)&&count(e.baseCompleted)&&count(e.desiredCompleted):e.kind==='class'&&name(e.classId)&&(e.baseLevel===null||(count(e.baseLevel)&&e.baseLevel>0))&&count(e.desiredLevel)&&e.desiredLevel>0;
    if (!validScope(e) || !valid || !uuid.test(e.requestId) ||
      !Number.isSafeInteger(e.revision) || e.revision < 1 || !Number.isSafeInteger(e.deadlineAt) || e.deadlineAt < 0 || !PHASES.includes(e.phase))
      throw new Error('Invalid queue entry');
    const identity = editId(e), version = JSON.stringify([identity, e.revision]);
    if (requests.has(e.requestId) || revisions.has(version) || (e.phase === 'pending' && pending.has(identity)))
      throw new Error('Duplicate queue identity');
    requests.add(e.requestId); revisions.add(version);
    if (e.phase === 'pending') pending.add(identity);
    if (e.phase === 'inflight' && ++flights > 1) throw new Error('Multiple inflight requests');
  }
  return clone(value.entries as PendingEdit[]);
}

export function migrateDesktopQueueV1(value:unknown,environment:string):QueueSnapshot{
  if(!record(value)||Object.keys(value).length!==2||value.schemaVersion!==1||!Array.isArray(value.entries))throw Error('Invalid legacy snapshot');
  const entries=value.entries.map(raw=>{
    if(!record(raw)||Object.keys(raw).length!==FIELDS.length||FIELDS.some(f=>!Object.hasOwn(raw,f))||raw.environment!==environment)throw Error('Invalid legacy fields/environment');
    return {...raw,kind:'task'};
  });
  return {schemaVersion:3,entries:validateSnapshot({schemaVersion:3,entries})};
}
export function migrateDesktopQueueV2(value:unknown,environment:string):QueueSnapshot{
  if(!record(value)||Object.keys(value).length!==2||value.schemaVersion!==2||!Array.isArray(value.entries)||value.entries.some(e=>!record(e)||e.environment!==environment||!['task','class'].includes(String(e.kind))))throw Error('Invalid legacy snapshot');
  return {schemaVersion:3,entries:validateSnapshot({schemaVersion:3,entries:value.entries})};
}

export function createDesktopQueue(options: { now: () => number; id: () => string; environment: string }) {
  if (!name(options.environment)) throw new Error('Invalid queue environment');
  let entries: PendingEdit[] = [];
  const clock = () => {
    const value = options.now();
    if (!Number.isSafeInteger(value) || value < 0 || !Number.isSafeInteger(value + WAIT_MS)) throw new Error('Invalid queue clock');
    return value;
  };
  const commit = (next: PendingEdit[]) => { entries = validateSnapshot({ schemaVersion: 3, entries: next }); };
  const reschedule = (next: PendingEdit[], scope: Scope, deadlineAt: number) => {
    for (const e of next) if (e.phase === 'pending' && scoped(e,scope)) e.deadlineAt = deadlineAt;
  };
  const checkScope = (scope: Scope) => { if (!validScope(scope)) throw new Error('Invalid scope'); };
  function edit(candidate:PendingEdit){
    checkScope(candidate);validateSnapshot({schemaVersion:3,entries:[candidate]});
    const next=clone(entries),identity=editId(candidate),related=next.filter(e=>editId(e)===identity);
    if(related.some(e=>['unknown','conflict','expired'].includes(e.phase)))throw Error('Unresolved edit');
    const pending=related.find(e=>e.phase==='pending'),flight=related.find(e=>e.phase==='inflight');
    const base=pending?baseline(pending):flight?desired(flight):baseline(candidate);
    if(desired(candidate)===base){if(pending)next.splice(next.indexOf(pending),1);}
    else if(pending){if(pending.kind==='class')pending.desiredLevel=desired(candidate);else pending.desiredCompleted=desired(candidate);if(pending.kind==='barter'||pending.kind==='workspace')pending.characterId=candidate.characterId;}
    else {
      candidate.revision=(flight?.revision??0)+1;
      if(candidate.kind==='class')candidate.baseLevel=base;else candidate.baseCompleted=base as number;
      if(candidate.kind==='barter'&&flight?.kind==='barter')candidate.baseRecords=structuredClone(flight.baseRecords);
      next.push(candidate);
    }
    reschedule(next,candidate,clock()+WAIT_MS);commit(next);
  }
  return {
    edit(scope: Scope, key: TaskKey, baseCompleted: number, desiredCompleted: number): void {
      checkScope(scope);
      if (!validKey(key) || !count(baseCompleted) || !count(desiredCompleted)) throw new Error('Invalid edit');
      edit({...scope,...key,kind:'task',requestId:options.id(),revision:1,baseCompleted,desiredCompleted,deadlineAt:clock()+WAIT_MS,phase:'pending'});
    },
    editClass(scope:Scope,classId:string,baseLevel:number|null,desiredLevel:number):void{
      edit({...scope,kind:'class',classId,baseLevel,desiredLevel,requestId:options.id(),revision:1,deadlineAt:clock()+WAIT_MS,phase:'pending'});
    },
    editBarter(scope:Scope,key:BarterKey,baseCompleted:number,desiredCompleted:number):void{
      edit({...scope,...structuredClone(key),kind:'barter',baseCompleted,desiredCompleted,requestId:options.id(),revision:1,deadlineAt:clock()+WAIT_MS,phase:'pending'});
    },
    editWorkspace(scope:Scope,key:WorkspaceKey,baseCompleted:number,desiredCompleted:number):void{
      edit({...scope,...structuredClone(key),kind:'workspace',baseCompleted,desiredCompleted,requestId:options.id(),revision:1,deadlineAt:clock()+WAIT_MS,phase:'pending'});
    },
    leaveCharacter(scope: Scope): void {
      checkScope(scope); const next = clone(entries); reschedule(next, scope, clock() + WAIT_MS); commit(next);
    },
    saveNow(scope: Scope): void {
      checkScope(scope); const next = clone(entries); reschedule(next, scope, clock()); commit(next);
    },
    discard(scope: Scope): void {
      checkScope(scope); commit(entries.filter(e => e.phase !== 'pending' || !scoped(e,scope)));
    },
    due(accountId: string,blockedCharacterIds:ReadonlySet<string>=new Set()): PendingEdit[] {
      const now = clock();
      return clone(entries.filter(e => e.environment === options.environment && e.accountId === accountId &&
        !blockedCharacterIds.has(e.characterId) && e.phase === 'pending' && e.deadlineAt <= now &&
        !entries.some(other => editId(other) === editId(e) && other.phase !== 'pending')))
        .sort((a, b) => a.deadlineAt - b.deadlineAt);
    },
    claim(requestId: string): PendingEdit | null {
      if (entries.some(e => e.phase === 'inflight')) return null;
      const candidate = entries.find(e => e.requestId === requestId);
      if (!candidate || !this.due(candidate.accountId).some(e => e.requestId === requestId)) return null;
      const next = clone(entries), flight = next.find(e => e.requestId === requestId)!;
      flight.phase = 'inflight'; commit(next); return { ...flight };
    },
    settle(requestId: string, outcome: SaveOutcome): void {
      const index = entries.findIndex(e => e.requestId === requestId && (e.phase === 'inflight' || e.phase === 'unknown'));
      if (index === -1) return; // Duplicate/late response never touches a successor.
      const next = clone(entries), entry = next[index];
      if (outcome.kind === 'saved') {
        const value=entry.kind==='class'?('level' in outcome?outcome.level:undefined):('completed' in outcome?outcome.completed:undefined);
        if (value !== desired(entry)) throw new Error('Mismatched success value');
        if(entry.kind==='barter'){
          if(!('baseRecords' in outcome)||!validBarterRecords(outcome.baseRecords)||outcome.baseRecords.length!==entry.baseRecords.length||entry.baseRecords.some(r=>!outcome.baseRecords!.some(b=>b.characterId===r.characterId)))throw Error('Invalid barter success baseline');
          for(const successor of next)if(successor.kind==='barter'&&editId(successor)===editId(entry)&&successor.revision>entry.revision)successor.baseRecords=structuredClone(outcome.baseRecords);
        }
        next.splice(index, 1);
      } else if (['unknown', 'conflict', 'expired'].includes(outcome.kind)) entry.phase = outcome.kind;
      else throw new Error('Invalid save outcome');
      commit(next);
    },
    snapshot(): QueueSnapshot { return { schemaVersion: 3, entries: clone(entries) }; },
    recover(requestId: string, action: 'retry' | 'discard'): void {
      const entry = entries.find(e => e.requestId === requestId);
      if (!entry || entry.phase === 'pending' || entry.phase === 'inflight') throw Error('Not a paused edit');
      if (action === 'discard') commit(entries.filter(e => editId(e) !== editId(entry)));
      else {
        if (entry.phase !== 'unknown') throw Error('Only verified unknown baseline may retry');
        const related = entries.filter(e => editId(e) === editId(entry));
        if (related.some(e => e.phase === 'inflight' || e.phase === 'conflict' || e.phase === 'expired')) throw Error('Resolve related edit first');
        const latest = related.reduce((a,b) => a.revision > b.revision ? a : b);
        const next = clone(entries.filter(e => editId(e) !== editId(entry)));
        // Baseline was verified by the controller. Preserve the newest intent, not two pending identities.
        if (desired(latest) !== baseline(entry)) next.push(latest.kind==='class'?{...latest,baseLevel:baseline(entry),phase:'pending'}:latest.kind==='barter'&&entry.kind==='barter'?{...latest,baseCompleted:entry.baseCompleted,baseRecords:structuredClone(entry.baseRecords),phase:'pending'}:{...latest,baseCompleted:baseline(entry) as number,phase:'pending'});
        reschedule(next, entry, clock()); commit(next);
      }
    },
    restore(snapshot: unknown): void {
      const version=record(snapshot)?snapshot.schemaVersion:null;
      const next = validateSnapshot(version===1?migrateDesktopQueueV1(snapshot,options.environment):version===2?migrateDesktopQueueV2(snapshot,options.environment):snapshot);
      // Even never-sent pending work requires auth, ownership, period and baseline checks after restart.
      for (const e of next) if (e.phase === 'pending' || e.phase === 'inflight') e.phase = 'unknown';
      commit(next);
    },
  };
}
export type DesktopQueue = ReturnType<typeof createDesktopQueue>;
