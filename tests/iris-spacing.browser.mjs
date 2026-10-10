// Real IRIS components/CSS, synthetic external IO; catches squeezed grouping,
// loss of two-column density, clipped controls and changed homework edit payloads.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdtempSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
process.env.IRIS_SYNAXIS_FIXTURE_PORT='3012';
const {server}=await import('./iris-synaxis.fixture.mjs');
const {chromium}=createRequire(process.argv[2])('playwright');
const browser=await chromium.launch({headless:true,channel:'chrome'});
const page=await browser.newPage({viewport:{width:390,height:1050}}),errors=[],failures=[];
const screenshots=mkdtempSync(join(tmpdir(),'iris-spacing-'));
page.setDefaultTimeout(4000);page.on('pageerror',e=>errors.push(e.message));
const go=async(font=18,query='')=>{await page.goto('http://127.0.0.1:3012/?spacing=1&font='+font+query);await page.getByRole('region',{name:'일일 숙제',exact:true}).waitFor();};
const scenario=async(name,run)=>{try{await run();console.log('PASS '+name);}catch(e){failures.push(e);console.error('FAIL '+name+' '+e.message);}};
const fits=async()=>{
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'no horizontal overflow');
  assert.deepEqual(await page.evaluate(()=>[...document.querySelectorAll('button')].filter(e=>e.getClientRects().length&&!e.closest('[hidden]')&&e.scrollWidth>e.clientWidth+2).map(e=>e.textContent)),[],'no clipped buttons');
};
try{
  await scenario('homework leaves breathing room between tiles and larger room between groups',async()=>{
    for(const [width,font] of [[320,18],[390,18],[768,18],[1280,18],[1280,20],[1280,22]]){
      await page.setViewportSize({width,height:1050});await go(font);
      const daily=page.getByRole('region',{name:'일일 숙제',exact:true}),weekly=page.getByRole('region',{name:'주간 숙제',exact:true});
      const rows=await daily.locator('.iris-task-row').evaluateAll(nodes=>nodes.map(n=>n.getBoundingClientRect().toJSON()));
      assert.ok(Math.abs(rows[0].y-rows[1].y)<1,'two columns retained');
      const tileGap=rows[1].x-rows[0].right;assert.ok(tileGap>=font*.35,'tile gap '+tileGap);
      assert.ok(rows[2].y-rows[0].bottom>=font*.35,'row gap');
      const title=await daily.locator('.iris-category-caption').boundingBox();assert.ok(rows[0].y-title.y-title.height>=font*.4,'caption-to-tiles space');
      const d=await daily.boundingBox(),w=await weekly.boundingBox();assert.ok(w.y-d.y-d.height>=font*.6,'groups separated');
      assert.ok(rows[0].height<=font*2.35,'cards not inflated');
      await fits();
      if(width===390){await page.locator('.iris-kronos-tabs').scrollIntoViewIfNeeded();await page.screenshot({path:join(screenshots,'homework.png'),fullPage:true});}
    }
  });
  await scenario('Synaxis separates heading, tabs, actions, help and search without inflating member cards',async()=>{
    for(const [width,font] of [[320,18],[390,18],[768,18],[1280,18],[1280,20],[1280,22]]){
      await page.setViewportSize({width,height:1050});await go(font,'&member=1');await page.getByRole('button',{name:'시낙시스',exact:true}).click();
      await page.locator('.iris-synaxis-filters input').waitFor();
      const heading=await page.locator('.iris-synaxis-heading').boundingBox(),tabs=await page.locator('.iris-synaxis-tabs').boundingBox(),actions=await page.locator('.iris-synaxis-primary-actions').boundingBox();
      assert.ok(tabs.y-heading.y-heading.height>=font*.5,'heading-to-tabs gap');
      assert.ok(actions.y-tabs.y-tabs.height>=font*.5,'tabs-to-actions gap');
      const input=await page.locator('.iris-synaxis-filters input').boundingBox(),select=await page.locator('.iris-synaxis-filters select').boundingBox();
      assert.ok(select.y-input.y-input.height>=font*.4,'search-to-filters gap');
      const slots=page.locator('.party-member');if(await slots.count()){
        const height=(await slots.first().boundingBox()).height;
        if(font===18)assert.ok(height<=126,'compact default member preserved');
        // Larger text legitimately wraps. Compare against the old toolbar spacing
        // in the same rendered layout instead of imposing a smaller-text height.
        await page.evaluate(()=>{document.querySelector('.iris-synaxis-toolbar').style.display='block';for(const e of document.querySelectorAll('.iris-synaxis-tabs,.iris-synaxis-primary-actions'))e.style.margin='.4rem 0';document.querySelector('.iris-synaxis-filters').style.gap='.3rem';});
        const baseline=(await slots.first().boundingBox()).height;assert.ok(Math.abs(height-baseline)<1,'spacing does not inflate cards '+JSON.stringify({width,font,height,baseline}));
        await page.evaluate(()=>{for(const e of document.querySelectorAll('.iris-synaxis-toolbar,.iris-synaxis-tabs,.iris-synaxis-primary-actions,.iris-synaxis-filters'))e.removeAttribute('style');});
      }
      await fits();
      if(width===390)await page.screenshot({path:join(screenshots,'synaxis.png'),fullPage:true});
    }
  });
  await scenario('spacing retains homework edits, filters and theme readability',async()=>{
    await page.setViewportSize({width:390,height:1050});await go();
    for(const theme of ['aureum','lumen','nemeton','vesper','rosarium','elysium']){
      await page.evaluate(theme=>document.documentElement.dataset.theme=theme,theme);await fits();
    }
    await page.getByRole('checkbox',{name:'일일 미션 완료',exact:true}).click();await page.getByRole('button',{name:'검은 구멍 증가',exact:true}).click();
    assert.deepEqual(await page.evaluate(()=>window.fixture.homeworkEdits),[{key:{category:'daily',taskId:'d0',periodKey:'fixture-period'},base:0,desired:1},{key:{category:'weekly',taskId:'w0',periodKey:'fixture-period'},base:0,desired:1}]);
    await page.getByRole('button',{name:'주간',exact:true}).click();assert.equal(await page.getByRole('region',{name:'주간 숙제',exact:true}).isVisible(),false);
    await page.getByRole('button',{name:'주간',exact:true}).click();await page.getByRole('checkbox',{name:'미완료만',exact:true}).check();
    assert.equal(await page.getByRole('checkbox',{name:'카브락 완료',exact:true}).count(),0);assert.equal(await page.evaluate(()=>window.fixture.writes.length),0);
    await page.screenshot({path:join(screenshots,'homework-light.png'),fullPage:true});
  });
  assert.deepEqual(errors,[]);console.log('Screenshots '+screenshots);if(failures.length)throw new AggregateError(failures,'IRIS spacing failures: '+failures.length);
}finally{await browser.close();server.close();}
