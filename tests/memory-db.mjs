import assert from 'node:assert/strict';
export function memoryDB(initial) {
  const tables = structuredClone(initial);
  const writes = [];
  return { tables, writes, from(table) {
    assert.ok(table in tables, `Unexpected table: ${table}`);
    let filters = [], change, remove = false, single = false;
    const query = {
      select() { return query; }, limit() { return query; },
      eq(key,value) { filters.push(row => typeof row[key] === 'object' ? JSON.stringify(row[key]) === (typeof value === 'string' ? value : JSON.stringify(value)) : String(row[key]) === String(value)); return query; },
      in(key,values) { filters.push(row => values.map(String).includes(String(row[key]))); return query; },
      is(key,value) { filters.push(row => row[key] === value); return query; },
      update(payload) { change = payload; return query; },
      delete() { remove = true; return query; },
      maybeSingle() { single = true; return query; }, single() { single = true; return query; },
      then(resolve,reject) {
        const rows = tables[table].filter(row => filters.every(f => f(row)));
        if (change) { for (const row of rows) { writes.push({table,id:row.id,payload:structuredClone(change)}); Object.assign(row, structuredClone(change)); } }
        if (remove) tables[table] = tables[table].filter(row => !rows.includes(row));
        return Promise.resolve({data: structuredClone(single ? rows[0] ?? null : rows), error:null}).then(resolve,reject);
      },
    };
    return query;
  }};
}
