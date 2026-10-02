import test from 'node:test';
import assert from 'node:assert/strict';
import * as React from 'react';
import {loadTS} from './load-ts.mjs';

test('actual reservation hook matches existing spaced hell parties instead of creating a separate pool', async () => {
  let slots = [], cursor = 0, parties = [], writes = [];
  const fakeReact = {
    ...React,useEffect:()=>{},useRef:value=>({current:value}),useMemo:fn=>fn(),useCallback:fn=>fn,
    useState:initial=>{
      const index = cursor++;
      if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial;
      return [slots[index], value=>{slots[index]=typeof value === 'function' ? value(slots[index]) : value;}];
    },
  };
  const db = {from:table=>{
    const query = {select:()=>query,order:()=>query,neq:()=>query,
      then:resolve=>Promise.resolve({data:table==='parties' ? parties : [],error:null}).then(resolve)};
    return query;
  }};
  const {CONTENT_DB} = loadTS('components/party/types.ts');
  const powerReqs = [{content_type:'abyss',content_name:'허상의 정박지',difficulty:'지옥1',max_members:4,min_cp:100,rec_cp:200,op_cp:300,rec_mr:0,op_mr:0}];
  const {usePartyManager} = loadTS('hooks/usePartyManager.ts', {
    react:fakeReact,'@/lib/supabase':{supabase:db},
    '@/hooks/usePartyCatalog':{usePartyCatalog:()=>({loaded:true,error:null,classes:[],contents:[],powerReqs}),refreshPartyCatalog:()=>Promise.resolve()},
    '@/lib/memberMutationClient':{memberMutation:async write=>{writes.push(write);return {error:null};}},
  });
  const render = () => {cursor=0;return usePartyManager();};
  const originalAlert = globalThis.alert, originalStorage = globalThis.localStorage;
  globalThis.alert=()=>{};
  globalThis.localStorage={removeItem:()=>{}};
  try {
    for (const difficulty of ['지옥 1','지옥1']) {
      slots=[];writes=[];
      let hook=render();
      parties=[{id:33,content_name:'어비스 - 허상의 정박지',difficulty,party_type:'1회 클리어',party_date:hook.selectedDate,
        time_start:'18:00',time_end:'20:00',max_members:4,status:'모집중',
        members:[{name:'someone',character_name:'someone',job:'전사',roles:[],time_start:'18:00',time_end:'20:00'}]}];
      await hook.fetchData('tester');
      hook=render();
      hook.setSelectedChar('tester');
      hook.setSelectedContent(CONTENT_DB.find(c=>c.id==='abyss_1'));
      hook.setSelectedDiff('지옥1');
      hook=render();
      await hook.handleReservation();
      assert.equal(writes[0]?.action,'update',`${difficulty} must join the existing party`);
      assert.equal(writes[0]?.filter?.value,33);
    }
  } finally {
    if (originalAlert === undefined) delete globalThis.alert; else globalThis.alert=originalAlert;
    if (originalStorage === undefined) delete globalThis.localStorage; else globalThis.localStorage=originalStorage;
  }
});
