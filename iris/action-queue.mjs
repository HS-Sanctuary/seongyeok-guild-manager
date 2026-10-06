// Pure planning state only. This module never executes a CLI, network or game command.
const kinds = new Set(['gather','process','collect','craft']);
const text = value => typeof value === 'string' && value.trim() === value && value.length > 0 && value.length <= 160 && !/[\u0000-\u001f\u007f]/u.test(value);
const integer = (value,min,max) => Number.isSafeInteger(value) && value >= min && value <= max;

export class AutomationQueue {
  #supported; #now; #jobs = []; #nextId = 1;
  #enabled = false; #characterKey = null; #deadline = 0; #inventoryLimit = 0.9; #reason = 'not-started';
  constructor({supportedCommands = [], now = Date.now} = {}) {
    if(!Array.isArray(supportedCommands) || typeof now !== 'function') throw new TypeError('Invalid automation configuration');
    this.#supported = new Set(supportedCommands.filter(command => kinds.has(command)));
    this.#now = now;
  }
  enqueue(job) {
    if(!job || typeof job !== 'object' || Array.isArray(job) || Object.keys(job).sort().join(',') !== 'kind,quantity,target' ||
      !this.#supported.has(job.kind) || !text(job.target) || !integer(job.quantity,1,100) || this.#jobs.length >= 100) return false;
    // A facility collection already collects all completed products; it is not a repeat count.
    if(job.kind === 'collect' && job.quantity !== 1) return false;
    const id = String(this.#nextId++);
    this.#jobs.push({id,kind:job.kind,target:job.target,quantity:job.quantity,status:'queued'});
    return id;
  }
  start(options) {
    const current = this.#now();
    if(this.#enabled || !options || Object.keys(options).sort().join(',') !== 'characterKey,inventoryLimit,maxSeconds' || !text(options.characterKey) ||
      !integer(options.maxSeconds,1,3600) || !Number.isFinite(options.inventoryLimit) || options.inventoryLimit < 0.5 || options.inventoryLimit > 0.95 ||
      !Number.isSafeInteger(current) || current < 0 || !Number.isSafeInteger(current + options.maxSeconds * 1000) || this.#jobs.some(job => job.status === 'running' || job.status === 'unknown') ||
      !this.#jobs.some(job => job.status === 'queued')) return false;
    // Existing queue is bound to its original confirmed character; start cannot silently retarget it.
    if(this.#characterKey !== null && options.characterKey !== this.#characterKey) return false;
    this.#characterKey = options.characterKey;
    this.#deadline = current + options.maxSeconds * 1000;
    this.#inventoryLimit = options.inventoryLimit;
    this.#enabled = true; this.#reason = 'ready';
    return true;
  }
  claim(frame) {
    if(!this.#enabled || this.#jobs.some(job => job.status === 'running' || job.status === 'unknown')) return null;
    const current = this.#now();
    let reason = null;
    if(!Number.isSafeInteger(current) || current >= this.#deadline) reason = 'time-limit';
    else if(!frame || frame.connected !== true || frame.blocked !== false) reason = 'game-unavailable';
    else if(frame.characterKey !== this.#characterKey) reason = 'character-changed';
    else if(!Number.isSafeInteger(frame.observedAt) || current < frame.observedAt || current - frame.observedAt > 15_000) reason = 'stale-snapshot';
    else if(!Number.isFinite(frame.inventoryRatio) || frame.inventoryRatio < 0 || frame.inventoryRatio >= this.#inventoryLimit) reason = 'inventory-limit';
    if(reason) {this.#enabled = false; this.#reason = reason; return null;}
    const job = this.#jobs.find(entry => entry.status === 'queued');
    if(!job) {this.#enabled = false; this.#reason = 'completed'; return null;}
    job.status = 'running'; this.#reason = 'running';
    return {...job,characterKey:this.#characterKey};
  }
  settle(id,status) {
    const job = this.#jobs.find(entry => entry.id === id);
    if(!job || !['running','unknown'].includes(job.status) || !['accepted','completed','failed','blocked','canceled','timeout','unknown'].includes(status)) return false;
    if(status === 'accepted') return job.status === 'running';
    job.status = status === 'timeout' ? 'unknown' : status;
    if(status !== 'completed') {this.#enabled = false; this.#reason = job.status;}
    else if(this.#enabled) this.#reason = 'ready';
    return true;
  }
  stop() {this.#enabled = false; this.#reason = 'stopped';}
  snapshot() {
    return {enabled:this.#enabled,characterKey:this.#characterKey,reason:this.#reason,jobs:this.#jobs.map(job => ({...job}))};
  }
}
