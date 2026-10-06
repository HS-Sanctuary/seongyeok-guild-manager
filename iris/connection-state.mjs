// In-memory data contract only. HTTP handlers must authorize callers before use.
import {validateKronosDetails} from './kronos-details.mjs';
import {KronosEditQueue,validEdit} from './kronos-edits.mjs';
const categories = ['daily','weekly','abyss','raid'];
const text = (value, max) => typeof value === 'string' && value.trim().length > 0 && Array.from(value).length <= max && !/[\u0000-\u001f\u007f]/u.test(value);
const idOf = value => Number.isSafeInteger(value) && value >= 0 ? String(value) : text(value,100) ? value : null;

function characterList(input) {
  if (!Array.isArray(input) || input.length > 100) return null;
  const ids = new Set();
  const result = [];
  for (const entry of input) {
    const id = idOf(entry?.id);
    if (!id || ids.has(id) || !text(entry.nickname,12)) return null;
    ids.add(id);
    result.push({id,nickname:entry.nickname,job:text(entry.job,60) ? entry.job : null,alias:text(entry.alias,3) ? entry.alias : null});
  }
  return result;
}
function summaryOf(input) {
  if (!input || typeof input !== 'object') return null;
  const result = {};
  for (const category of categories) {
    const count = input[category];
    if (!count || !Number.isSafeInteger(count.completed) || !Number.isSafeInteger(count.total) ||
        count.completed < 0 || count.total < count.completed || count.total > 10000) return null;
    result[category] = {completed:count.completed,total:count.total};
  }
  return result;
}

export class ConnectionState {
  #now;
  #generation = 0;
  #selectionVersion = 0;
  #active = false;
  #stale = false;
  #lastBrowserAt = null;
  #accountId = null;
  #characters = [];
  #selectedId = null;
  #summary = null;
  #details = null;
  #writeAllowed=false;
  #writeContext=null;
  #edits=new KronosEditQueue();
  constructor({now = Date.now} = {}) { this.#now = now; }
  #clearSelection() { this.#selectedId = null; this.#summary = null; this.#details = null; this.#writeContext=null; this.#selectionVersion++; }
  #clearData() {
    this.#writeAllowed=false;
    this.#accountId = null; this.#characters = []; this.#lastBrowserAt = null;
    this.#clearSelection();
  }
  #expire() {
    if (this.#lastBrowserAt === null) return;
    const age = this.#now() - this.#lastBrowserAt;
    if (age > 60_000 || age < 0) { this.#clearData(); this.#stale = true; }
  }
  begin() {
    this.#generation++; this.#active = true; this.#stale = false; this.#clearData();
    return this.#generation;
  }
  setCharacters(generation, payload) {
    this.#expire();
    if (!payload || typeof payload !== 'object') return false;
    const {accountId,characters} = payload;
    if (!this.#active || generation !== this.#generation || !text(accountId,100)) return false;
    const validated = characterList(characters);
    if (!validated) return false;
    if (accountId !== this.#accountId || (this.#selectedId && !validated.some(entry=>entry.id === this.#selectedId))) {this.#writeAllowed=false;this.#clearSelection();}
    this.#accountId = accountId; this.#characters = validated;
    this.#lastBrowserAt = this.#now(); this.#stale = false;
    return true;
  }
  select(generation, id,discardPending=false) {
    this.#expire();
    const normalized = idOf(id);
    if (!this.#active || generation !== this.#generation || !this.#characters.some(entry=>entry.id === normalized)) return null;
    if(this.#edits.snapshot().edits.length&&!discardPending)return null;
    if(discardPending)this.#edits.discard();
    this.#clearSelection(); this.#selectedId = normalized;
    return this.#selectionVersion;
  }
  setSummary(generation, selectionVersion, characterId, summary, details,writeContext) {
    this.#expire();
    if (!this.#active || generation !== this.#generation || selectionVersion !== this.#selectionVersion ||
        !this.#selectedId || idOf(characterId) !== this.#selectedId) return false;
    const validated = summaryOf(summary);
    const normalized=details===undefined ? null : validateKronosDetails(details,validated);
    if (!validated || (details!==undefined && !normalized)) {this.#summary=null;this.#details=null;this.#writeContext=null;return false;}
    const keys=writeContext?.periodKeys;
    this.#writeContext=keys&&categories.every(k=>typeof keys[k]==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:00:00\.000Z$/.test(keys[k]))?{periodKeys:Object.fromEntries(categories.map(k=>[k,keys[k]]))}:null;
    this.#summary = validated; this.#details=normalized; this.#lastBrowserAt = this.#now();
    return true;
  }
  disconnect() { this.#generation++; this.#active = false; this.#stale = false; this.#clearData(); }
  setWriteAllowed(generation,allowed){this.#expire();if(!this.#active||this.#stale||generation!==this.#generation||typeof allowed!=='boolean')return false;this.#writeAllowed=allowed;return true;}
  stageEdit(e){
    this.#expire();if(!this.#writeAllowed||!this.#active||this.#stale||!validEdit(e)||e.generation!==this.#generation||e.selectionVersion!==this.#selectionVersion||e.accountId!==this.#accountId||e.characterId!==this.#selectedId||!this.#details||e.periodKey!==this.#writeContext?.periodKeys[e.category])return false;
    const row=this.#details.tasks[e.category].find(r=>r.id===e.taskId);
    if(!row||e.desiredCompleted>row.total)return false;
    const old=this.#edits.snapshot().edits.find(r=>r.category===e.category&&r.taskId===e.taskId);
    if(!old&&e.baseCompleted!==row.completed)return false;
    return this.#edits.stage(e,editQueue=>Buffer.byteLength(JSON.stringify({...this.snapshot(),editQueue}),'utf8')<=64000);
  }
  discardEdits(){this.#edits.discard();}
  submitEdits(generation,version){this.#expire();return this.#writeAllowed&&this.#active&&!this.#stale&&generation===this.#generation&&version===this.#selectionVersion&&this.#edits.snapshot().edits.every(e=>e.characterId===this.#selectedId&&e.accountId===this.#accountId&&e.generation===generation&&e.selectionVersion===version)&&this.#edits.submit();}
  takeEdits(generation){this.#expire();return this.#writeAllowed&&this.#active&&!this.#stale&&!!this.#details&&generation===this.#generation&&this.#edits.snapshot().edits.every(e=>e.characterId===this.#selectedId&&e.accountId===this.#accountId&&e.generation===generation&&e.selectionVersion===this.#selectionVersion)?this.#edits.pending():[];}
  applyEditResults(generation,version,results){this.#expire();if(!this.#writeAllowed||!this.#active||this.#stale||generation!==this.#generation||version!==this.#selectionVersion||!Array.isArray(results)||!results.length||results.length>200)return false;return results.every(r=>this.#edits.applyResult(r));}
  snapshot() {
    this.#expire();
    return structuredClone({generation:this.#generation,selectionVersion:this.#selectionVersion,
      accountId:this.#accountId,characters:this.#characters,selectedId:this.#selectedId,summary:this.#summary,details:this.#details,writeAllowed:this.#writeAllowed,writeContext:this.#writeContext,editQueue:this.#edits.snapshot(),
      status:!this.#active ? 'disconnected' : this.#stale ? 'stale' : this.#summary ? 'connected' : this.#selectedId ? 'waiting-summary' : this.#accountId ? 'waiting-selection' : 'waiting-browser'});
  }
}
