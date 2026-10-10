import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {loadTS} from './load-ts.mjs';

const accountId = '00000000-0000-4000-8000-000000000001';
const otherId = '00000000-0000-4000-8000-000000000002';
const TradeList = () => null;
const placeholder = {__esModule:true,default: () => null};
const components = ['CharacterStats','ClassLevelManager','ContentChecklist','KronosWorkspace','CharacterSelector','CharacterManageModal'];
const settle = async () => { for (let i=0;i<8;i++) await Promise.resolve(); };
function findTrade(node) {
  if (!node || typeof node !== 'object') return null;
  if (node.type === TradeList) return node;
  for (const child of React.Children.toArray(node.props?.children)) {
    const found = findTrade(child);
    if (found) return found;
  }
  return null;
}

// Execute the actual page wiring. Only React scheduling, child rendering and
// external IO are replaced; the favorites ID passed by the page stays real.
async function fixture(display, body, inspect) {
  const savedGlobals = {fetch:global.fetch,localStorage:global.localStorage};
  let stateCursor=0,refCursor=0,first=true;
  const states=[],refs=[],effects=[],requests=[];
  let release;
  const response = new Promise(resolve => {release=resolve;});
  const react = {...React,
    useState(init) {const i=stateCursor++;if (!(i in states)) {const value=typeof init==='function'?init():init;states[i]=value?.job==='전사' && value.nickname===''?{...value,nickname:'뉴월'}:value;}return [states[i],value=>{states[i]=typeof value==='function'?value(states[i]):value;}];},
    useRef(init) {const i=refCursor++;return refs[i]??= {current:init};},
    useEffect(effect) {if(first) effects.push(effect);},
  };
  const {getKronosResetDay}=loadTS('lib/kronos.ts');
  const storage=new Map([['nexus_user',JSON.stringify(display)],['chronos_last_reset_check',getKronosResetDay(new Date()).key]]);
  global.localStorage={getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,value)};
  global.fetch=async(url,init)=>{requests.push({url,init});return response;};
  const never = new Promise(()=>{});
  const catalog={select(){return this;},eq(){return this;},order(){return never;},then:never.then.bind(never)};
  const Page=loadTS('app/character/page.tsx',{
    react,'next/navigation':{useRouter:()=>({push(){}})},
    '@/lib/supabase':{supabase:{from:()=>catalog}},
    '@/components/character/TradeList':{__esModule:true,default:TradeList},
    ...Object.fromEntries(components.map(name=>['@/components/character/'+name,placeholder])),
  }).default;
  const render=()=>{stateCursor=refCursor=0;const tree=Page();first=false;return tree;};
  try {
    render();
    const cleanup=effects[0]();
    const before=findTrade(render());
    await inspect({before,requests,cleanup,release:()=>release(new Response(JSON.stringify(body),{status:200})),render:()=>findTrade(render())});
  } finally {Object.assign(global,savedGlobals);}
}

test('legacy nickname-only login resolves favorites account ID from server session',async()=>{
  await fixture({nickname:'뉴월',role:'부마스터'},{account:{id:accountId,nickname:'뉴월',role:'부마스터',status:'승인'}},async f=>{
    assert.equal(f.before.props.accountId,null);
    f.release();await settle();
    assert.equal(f.render().props.accountId,accountId,'Logged-in favorites must receive the server account ID, not missing display-profile id');
    assert.deepEqual(f.requests.map(r=>r.url),['/api/auth/session']);
  });
});

test('stored display ID is not trusted when server belongs to another nickname',async()=>{
  await fixture({id:otherId,nickname:'뉴월',role:'부마스터'},{account:{id:accountId,nickname:'한설',role:'길드마스터',status:'승인'}},async f=>{
    assert.equal(f.before.props.accountId,null);
    f.release();await settle();assert.equal(f.render().props.accountId,null);
  });
});

test('expired and malformed server sessions never enable favorites',async()=>{
  for(const account of [null,{id:'default-id',nickname:'뉴월'},{id:accountId,nickname:'뉴월',role:'pending',status:'pending'}]){
    await fixture({nickname:'뉴월'},{account},async f=>{f.release();await settle();assert.equal(f.render().props.accountId,null);});
  }
});

test('late session result after page cleanup cannot enable favorites',async()=>{
  await fixture({nickname:'뉴월'},{account:{id:accountId,nickname:'뉴월',role:'부마스터',status:'승인'}},async f=>{
    f.cleanup?.();f.release();await settle();assert.equal(f.render().props.accountId,null);
  });
});
