// Render the real checkboard and stylesheet with synthetic data. No API or DB access.
// Set IRIS_BROWSER_PACKAGES to the bundled node_modules directory for this visual check.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {join} from 'node:path';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {loadTS} from './load-ts.mjs';

const {DesktopCheckboard}=loadTS('components/iris/DesktopCheckboard.tsx');
const browserPackages=process.env.IRIS_BROWSER_PACKAGES;
const css=readFileSync('app/iris/desktop/desktop.css','utf8');
const globalCss=readFileSync('app/globals.css','utf8').replace('@import "tailwindcss";','');
const period='2026-10-07T21:00:00.000Z';
const selected={accountId:'synthetic',characterId:'synthetic',observedAt:'2026-10-08T07:00:00.000Z',writeContext:{periodKeys:Object.fromEntries(['daily','weekly','abyss','raid'].map(category=>[category,period]))},details:{schemaVersion:1,tasks:{
  daily:[{id:'1',name:'일일 미션',completed:0,total:1},{id:'2',name:'요일 던전',completed:1,total:1}],
  weekly:[{id:'3',name:'검은 구멍',completed:3,total:11}],
  abyss:[{id:'4',name:'허상의 정박지',completed:0,total:1}],
  raid:[{id:'5',name:'화이트 서큐버스',completed:1,total:1}],
},classes:[]}};
const markup=renderToStaticMarkup(React.createElement(DesktopCheckboard,{selected,pending:[],locked:false,onEdit(){}}));

async function withPage(check){
  const {chromium}=createRequire(join(browserPackages,'package.json'))('playwright');
  const browser=await chromium.launch({channel:'msedge',headless:true});
  try{
    const page=await browser.newPage({viewport:{width:320,height:900}});
    await page.route('**/*',route=>route.abort());
    await page.setContent(`<html data-theme="aureum"><head><style>${globalCss}\n*{box-sizing:border-box}body,h3,p{margin:0}html{font-size:18px;line-height:1.5}h3{font-size:inherit}body{background:var(--background)}\n${css}</style></head><body><main class="iris-desktop"><div class="iris-hud">${markup}</div></main></body></html>`);
    await check(page);
  }finally{await browser.close();}
}

// Missing heading tint/marker makes neighboring task groups visually indistinguishable.
test('all category headings have a visible themed surface and left marker at 320px',{skip:!browserPackages},async()=>withPage(async page=>{
  for(const theme of ['aureum','lumen','nemeton','vesper','rosarium','elysium']){
    await page.evaluate(theme=>document.documentElement.dataset.theme=theme,theme);
    const headings=await page.locator('.iris-category-caption').evaluateAll(elements=>elements.map(element=>{
      const style=getComputedStyle(element),rect=element.getBoundingClientRect();
      return {background:style.backgroundImage,marker:parseFloat(style.borderInlineStartWidth),markerColor:style.borderInlineStartColor,panel:getComputedStyle(document.querySelector('.iris-hud')).backgroundColor,height:rect.height,right:rect.right,left:rect.left};
    }));
    assert.equal(headings.length,4);
    for(const heading of headings){
      assert.notEqual(heading.background,'none',`${theme}: category heading needs a tinted surface`);
      assert.ok(heading.marker>=2,`${theme}: heading needs a clear left marker`);
      assert.notEqual(heading.markerColor,heading.panel,`${theme}: marker must be visible against the panel`);
      assert.ok(heading.height<=34,`${theme}: headings must retain compact height`);
      assert.ok(heading.left>=0&&heading.right<=320,`${theme}: heading must fit at 320px`);
    }
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${theme}: no horizontal page overflow`);
  }
}));

// Dropping the visible-sibling divider makes groups run together; hidden groups must not add an orphan line.
test('thin separators divide visible groups without preceding the first visible group',{skip:!browserPackages},async()=>withPage(async page=>{
  const separators=()=>page.locator('.iris-category:not([hidden])').evaluateAll(elements=>elements.map(element=>parseFloat(getComputedStyle(element).borderTopWidth)));
  const widths=await separators();
  assert.equal(widths[0],0,'The first visible group has no leading separator');
  for(const width of widths.slice(1))assert.ok(width>0&&width<=1,'Following groups have a thin separator');
  await page.locator('.iris-category').nth(0).evaluate(element=>element.hidden=true);
  const filtered=await separators();
  assert.equal(filtered[0],0,'Hiding the first group must not leave a leading separator');
  for(const width of filtered.slice(1))assert.ok(width>0&&width<=1);
}));

// A missing summary pill loses hierarchy; widening it must not squeeze out headings or compact task columns.
test('completion summaries remain compact pills beside full headings and two-column task tiles',{skip:!browserPackages},async()=>withPage(async page=>{
  const counts=await page.locator('.iris-category-count').evaluateAll(elements=>elements.map(element=>{
    const style=getComputedStyle(element),rect=element.getBoundingClientRect(),heading=element.previousElementSibling.getBoundingClientRect();
    return {border:parseFloat(style.borderTopWidth),radius:parseFloat(style.borderTopLeftRadius),font:parseFloat(style.fontSize),width:rect.width,left:rect.left,headingRight:heading.right};
  }));
  for(const count of counts){
    assert.ok(count.border>0,'The summary has a visible pill edge');
    assert.ok(count.radius>=8,'The summary has a rounded pill shape');
    assert.ok(count.font>=12,'Summary text stays readable at the mobile base size');
    assert.ok(count.width<100&&count.left>count.headingRight,'Pills fit beside full headings');
  }
  const daily=page.locator('#iris-tasks-daily .iris-task-row');
  const first=await daily.nth(0).boundingBox(),second=await daily.nth(1).boundingBox();
  assert.equal(first.y,second.y,'Checkbox tasks retain their two-column row');
  const counter=await page.locator('#iris-tasks-weekly [data-kind=counter]').boundingBox(),grid=await page.locator('#iris-tasks-weekly .iris-category-rows').boundingBox();
  assert.ok(counter.width>=grid.width-1,'Counters retain the full group width');
}));
