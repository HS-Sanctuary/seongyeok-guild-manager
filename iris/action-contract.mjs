// Pure request planning only: this module never invokes the game CLI.
const kinds = new Set(['gather', 'process', 'craft', 'collect']);
const nameOk = value => typeof value === 'string' && value.length > 0 && value.length <= 160 && value.trim() === value && !/[\x00-\x1f\x7f]/.test(value);
const positive = value => Number.isSafeInteger(value) && value > 0;
const reject = reason => ({ ok: false, reason });
const items = value => Array.isArray(value) && value.length <= 10000 ? value : [];

export function planAction(job, catalog, { now = Date.now(), maxWingCost = 0 } = {}) {
  if (!job || Object.keys(job).some(key => !['kind', 'target', 'quantity'].includes(key)) || !kinds.has(job.kind) || !nameOk(job.target) || !positive(job.quantity) || job.quantity > 100) return reject('invalid-job');
  if (!Number.isSafeInteger(now) || now < 0 || !Number.isSafeInteger(catalog?.observedAt) || catalog.observedAt < 0 || catalog.observedAt > now || now - catalog.observedAt > 15000) return reject('stale-catalog');
  const cost = job.kind === 'collect' ? 0 : 5;
  if (!Number.isFinite(maxWingCost) || maxWingCost < cost) return reject('cost-limit');
  if ((job.kind === 'gather' && job.quantity !== 100) || (['process', 'collect'].includes(job.kind) && job.quantity !== 1)) return reject('unsupported-quantity');
  if (job.kind === 'collect') {
    const completed = items(catalog.works?.works).filter(work => work?.FacilityName === job.target && work.IsCompleted === true && work.State === 'Completed' && work.RemainingSeconds === 0 && nameOk(work.DisplayName));
    if (!completed.length) return reject('no-completed-work');
    if (items(catalog.works?.works).some(work => work?.DisplayName === completed[0].DisplayName && work.FacilityName !== job.target)) return reject('ambiguous-work');
    return { ok: true, command: 'complete_altering_work', body: { displayName: completed[0].DisplayName }, estimatedWingCost: cost, facility: job.target, completedWorks: completed.length };
  }
  const source = job.kind === 'gather' ? catalog.gatherable : job.kind === 'process' ? catalog.alterable : catalog.craftable;
  const matches = items(source?.items).filter(item => item?.DisplayName === job.target);
  if (matches.length !== 1) return reject('unavailable');
  const item = matches[0];
  if (job.kind === 'gather') {
    if (item.ToolOk !== true) return reject('unavailable');
    // Fishing requires a separate bounded monitoring adapter; never dispatch here.
    return { ok: true, command: 'execute_gathering', body: { displayName: item.DisplayName }, estimatedWingCost: cost, outputLimit: 100 };
  }
  const production = job.kind === 'process' ? item.ProducedPerWork : item.ProducedPerCraft;
  if (!positive(production) || !Number.isSafeInteger(production * job.quantity)) return reject('invalid-production');
  if (job.kind === 'process') {
    if (item.Alterable !== true) return reject('unavailable');
    return { ok: true, command: 'execute_altering', body: { displayName: item.DisplayName }, estimatedWingCost: cost, expectedOutput: production };
  }
  if (source.craftingUnlocked !== true || item.Craftable !== true) return reject('unavailable');
  return { ok: true, command: 'execute_crafting', body: { displayName: item.DisplayName, craftCount: job.quantity }, estimatedWingCost: cost, expectedOutput: production * job.quantity };
}

export function classifyActionResult(kind, response) {
  if (!kinds.has(kind)) return 'failed';
  if (response?.status === 'rejected') return 'failed';
  if (response?.status !== 'accepted') return 'unknown';
  const body = response.body;
  if (!body || typeof body !== 'object' || Array.isArray(body)) return 'unknown';
  if (body.error) {
    if (body.error === 'timeout') return 'unknown';
    if (['blocked', 'overweight', 'tool_broken'].includes(body.error)) return 'blocked';
    if (body.error === 'canceled') return 'stopped';
    return 'failed';
  }
  if (['stopped', 'stopped_by_user', 'canceled'].includes(body.result)) return 'stopped';
  if (kind === 'collect') return positive(body.collected) ? 'completed' : 'unknown';
  if (kind === 'process') return body.result === 'started' ? 'registered' : 'unknown';
  if (kind === 'craft') return body.result === 'completed' ? 'completed' : 'unknown';
  if (body.result === 'started') return 'running';
  return body.result === 'completed' && positive(body.target) && Number.isSafeInteger(body.gained) && body.gained >= body.target ? 'completed' : 'unknown';
}
