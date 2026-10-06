const categories=['daily','weekly','abyss','raid'];
const safeText=(value,max)=>typeof value==='string' && value.trim().length>0 && Array.from(value).length<=max && !/[\u0000-\u001f\u007f]/u.test(value);
export function validateKronosDetails(input,summary) {
  if(input?.schemaVersion!==1 || !input.tasks || !Array.isArray(input.classes) || input.classes.length>100) return null;
  const tasks={};
  for(const category of categories) {
    const list=input.tasks[category],ids=new Set();
    if(!Array.isArray(list) || list.length>200) return null;
    let done=0,total=0;const rows=[];
    for(const row of list) {
      if(!safeText(row?.id,100) || ids.has(row.id) || !safeText(row.name,120) ||
        !Number.isSafeInteger(row.completed) || !Number.isSafeInteger(row.total) || row.completed<0 ||
        row.total<1 || row.total>1000 || row.completed>row.total) return null;
      ids.add(row.id);done+=row.completed;total+=row.total;
      rows.push({id:row.id,name:row.name,completed:row.completed,total:row.total});
    }
    if(done!==summary?.[category]?.completed || total!==summary?.[category]?.total) return null;
    tasks[category]=rows;
  }
  const classes=[],ids=new Set();
  for(const row of input.classes) {
    if(!safeText(row?.id,100) || ids.has(row.id) || !safeText(row.name,120) ||
      (row.level!==null && (!Number.isSafeInteger(row.level) || row.level<1 || row.level>1000))) return null;
    ids.add(row.id);classes.push({id:row.id,name:row.name,level:row.level});
  }
  return {schemaVersion:1,tasks,classes};
}
