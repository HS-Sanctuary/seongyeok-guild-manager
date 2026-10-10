// Actual IRIS components/CSS with synthetic IO only; no operating account or game.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdtempSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
process.env.IRIS_SYNAXIS_FIXTURE_PORT='3011';
const {server}=await import('./iris-synaxis.fixture.mjs');
const {chromium}=createRequire(process.argv[2])('playwright');
const sharp=createRequire(import.meta.url)('sharp');
const browser=await chromium.launch({headless:true,channel:'chrome'});
const page=await browser.newPage({viewport:{width:390,height:1050},deviceScaleFactor:3}),failures=[],errors=[];
const screenshots=mkdtempSync(join(tmpdir(),'iris-navigation-'));
page.setDefaultTimeout(4000);page.on('pageerror',e=>errors.push(e.message));
const go=async(font=18)=>{await page.goto('http://127.0.0.1:3011/?nav=1&font='+font);await page.getByRole('button',{name:'스탯',exact:true}).waitFor();};
const scenario=async(name,run)=>{try{await run();console.log('PASS '+name);}catch(e){failures.push(e);console.error('FAIL '+name+' '+e.message);}};
const fits=async()=>{
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'document horizontal overflow');
  assert.deepEqual(await page.evaluate(()=>[...document.querySelectorAll('button')].filter(e=>e.getClientRects().length&&!e.closest('[hidden]')&&e.scrollWidth>e.clientWidth+2).map(e=>e.textContent)),[],'clipped buttons');
};
const contrast=(foreground,background)=>{
  const luminance=color=>color.match(/[\d.]+/g).slice(0,3).map(Number).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
  const a=luminance(foreground),b=luminance(background);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
};
try{
  await scenario('main menu text remains readable in all six themes',async()=>{
    await go();
    for(const theme of ['aureum','lumen','nemeton','vesper','rosarium','elysium']){
      await page.evaluate(theme=>document.documentElement.dataset.theme=theme,theme);
      await page.waitForFunction(()=>!document.getAnimations().some(a=>a.playState==='running'));
      const colors=await page.evaluate(()=>[...document.querySelectorAll('.iris-main-tabs button')].map(button=>{const style=getComputedStyle(button);return [style.color,style.backgroundColor==='rgba(0, 0, 0, 0)'?getComputedStyle(button.parentElement).backgroundColor:style.backgroundColor];}));
      for(const [fg,bg] of colors)assert.ok(contrast(fg,bg)>=4.5,theme+' text contrast '+contrast(fg,bg).toFixed(3));
    }
  });
  await scenario('main menus reuse the bag and raid SVG assets',async()=>{
    await go();
    const assets=await Promise.all(['/svgs/UI mark/가방 마크.svg','/svgs/contens mark/레이드 마크.svg'].map(async path=>({path,raw:await (await page.request.get('http://127.0.0.1:3011'+encodeURI(path))).text()})));
    console.log('Asset geometry '+JSON.stringify(await page.evaluate(assets=>{
      const results=[];
      for(const {path,raw} of assets){
        const svg=document.importNode(new DOMParser().parseFromString(raw,'image/svg+xml').documentElement,true);
        svg.style.position='absolute';svg.style.visibility='hidden';document.body.append(svg);const b=svg.getBBox();results.push({path,viewBox:svg.getAttribute('viewBox'),x:b.x,y:b.y,width:b.width,height:b.height});svg.remove();
      }return results;
    },assets)));
    const icons=page.locator('.iris-main-tab-icon');
    for(const [index,path] of [[0,'/svgs/UI mark/가방 마크.svg'],[1,'/svgs/contens mark/레이드 마크.svg']]){
      assert.equal(await icons.nth(index).getAttribute('aria-hidden'),'true');
      const mask=await icons.nth(index).locator('[style*="mask"]').evaluate(e=>getComputedStyle(e).maskImage);
      assert.ok(decodeURI(mask).includes(path),'requested SVG asset '+path);
      assert.equal((await page.request.get('http://127.0.0.1:3011'+encodeURI(path))).status(),200);
    }
  });
  await scenario('painted objects have matching size and centering, not just matching boxes',async()=>{
    for(const font of [18,20,22]){
      await go(font);const icons=page.locator('.iris-main-tab-icon'),bounds=[];
      for(let i=0;i<2;i++){
        const icon=icons.nth(i);await icon.evaluate(e=>{e.style.background='#000';e.querySelector('[style*="mask"]')?.style.setProperty('background-color','#fff','important');});
        assert.equal(await icon.locator('[style*="mask"]').count(),1,'render the requested SVG mask');
        await page.waitForFunction(()=>!document.getAnimations().some(a=>a.playState==='running'));
        const rect=await icon.boundingBox();
        const png=await icon.screenshot({path:join(screenshots,'object-'+font+'-'+i+'.png')});
        const {data,info}=await sharp(png).removeAlpha().raw().toBuffer({resolveWithObject:true});
        let minX=info.width,minY=info.height,maxX=-1,maxY=-1;
        for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++){const n=(y*info.width+x)*info.channels;if(data[n]>240&&data[n+1]>240&&data[n+2]>240){minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);}}
        assert.ok(maxX>=0,'icon is visibly painted');
        const b={w:(maxX-minX+1)/3,h:(maxY-minY+1)/3,cx:(minX+maxX+1)/6,cy:(minY+maxY+1)/6};bounds.push(b);
        // Screenshot cropping and small SVG mask rasterization can differ by a CSS pixel.
        assert.ok(Math.abs(b.cx-(rect.x-Math.floor(rect.x)+rect.width/2))<=1&&Math.abs(b.cy-(rect.y-Math.floor(rect.y)+rect.height/2))<=1,'visible object centered '+JSON.stringify({b,rect}));
        assert.ok(Math.max(b.w,b.h)>=font*.85&&Math.max(b.w,b.h)<=font*.95,'visible object fills its intended size '+JSON.stringify(b));
      }
      console.log('Painted bounds font '+font+' '+JSON.stringify(bounds));
      assert.ok(Math.abs(bounds[0].w-bounds[1].w)<=1&&Math.abs(bounds[0].h-bounds[1].h)<=1,'objects same optical size');
    }
  });
  await scenario('main navigation visually leads child tabs in all six themes',async()=>{
    await go();
    for(const theme of ['aureum','lumen','nemeton','vesper','rosarium','elysium']){
      await page.evaluate(theme=>document.documentElement.dataset.theme=theme,theme);
      await page.waitForFunction(()=>{
        const button=document.querySelector('.iris-main-tabs button[aria-pressed=true]'),swatch=document.createElement('span');
        swatch.style.background='var(--accent)';document.body.append(swatch);const matches=getComputedStyle(button).backgroundColor===getComputedStyle(swatch).backgroundColor;swatch.remove();return matches;
      });
      const main=page.getByRole('navigation',{name:'상위 메뉴'}),child=page.getByRole('navigation',{name:'크로노스 기능'});
      const selected=main.getByRole('button',{name:'크로노스',exact:true});
      assert.equal(await selected.locator('.iris-main-tab-icon').count(),1,'main menu includes a decorative icon');
      const colors=await page.evaluate(()=>{
        const main=document.querySelector('.iris-main-tabs button[aria-pressed=true]'),child=document.querySelector('.iris-kronos-tabs button[aria-pressed=true]');
        const swatch=document.createElement('span');swatch.style.background='var(--accent)';document.body.append(swatch);
        const result=[getComputedStyle(main).backgroundColor,getComputedStyle(child).backgroundColor,getComputedStyle(swatch).backgroundColor];swatch.remove();return result;
      });
      assert.equal(colors[0],colors[2],theme+' main selected fills with accent');assert.notEqual(colors[0],colors[1],theme+' child selected stays quieter');
      assert.equal(await child.getByRole('button').count(),7);await fits();
      if(['aureum','lumen'].includes(theme))await page.screenshot({path:join(screenshots,theme+'-navigation.png')});
    }
    await page.getByRole('button',{name:'스탯',exact:true}).click();await page.getByRole('button',{name:'시낙시스',exact:true}).click();
    await page.getByRole('button',{name:'크로노스',exact:true}).click();assert.equal(await page.locator('#iris-pane-stats').isVisible(),true,'child tab remembered');
    assert.equal(await page.evaluate(()=>window.fixture.writes.length),0,'navigation never writes');
  });
  await scenario('stats confirmation keeps cancel right of No without wrapping or clipping',async()=>{
    for(const [width,font] of [[320,18],[390,18],[768,18],[1280,18],[1280,20],[1280,22]]){
      await page.setViewportSize({width,height:1050});await go(font);await page.getByRole('button',{name:'스탯',exact:true}).click();
      await page.getByRole('button',{name:'스탯 확인 열기'}).click();const dialog=page.getByRole('dialog');await dialog.waitFor();
      const boxes=await Promise.all(['네, 업데이트','아니요, 다른 캐릭터','취소'].map(name=>dialog.getByRole('button',{name,exact:true}).boundingBox()));
      assert.ok(Math.abs(boxes[0].y-boxes[2].y)<2,'three actions stay in one row '+width+'/'+font);assert.ok(boxes[2].x>boxes[1].x+boxes[1].width-1,'cancel follows No');
      await fits();assert.equal(await dialog.getByRole('button',{name:'취소',exact:true}).evaluate(e=>e===document.activeElement),true,'initial safe focus');
      if(width===390)await page.screenshot({path:join(screenshots,'390-confirmation.png')});
      await page.keyboard.press('Escape');assert.equal(await dialog.count(),0);assert.equal(await page.getByRole('button',{name:'스탯 확인 열기'}).evaluate(e=>e===document.activeElement),true);
    }
  });
  await scenario('confirmation retains cancel, choose-other, confirm and busy guards',async()=>{
    await go();await page.getByRole('button',{name:'스탯',exact:true}).click();const open=page.getByRole('button',{name:'스탯 확인 열기'});
    await open.click();await page.getByRole('button',{name:'취소',exact:true}).click();assert.equal(await page.getByRole('dialog').count(),0);
    await open.click();await page.getByRole('button',{name:'아니요, 다른 캐릭터',exact:true}).click();
    await page.getByRole('heading',{name:'업데이트할 캐릭터 선택'}).waitFor();await page.getByRole('button',{name:'열두글자닉네임테스트용 · 검술사',exact:true}).click();
    await open.click();await page.getByRole('button',{name:'네, 업데이트',exact:true}).click();
    await page.evaluate(()=>window.fixture.setStatsBusy(true));await page.getByRole('button',{name:'업데이트 중…'}).waitFor();
    for(const name of ['업데이트 중…','아니요, 다른 캐릭터','취소'])assert.equal(await page.getByRole('button',{name,exact:true}).isDisabled(),true);
    await page.keyboard.press('Escape');assert.equal(await page.getByRole('dialog').count(),1);
    assert.deepEqual(await page.evaluate(()=>window.fixture.confirmationActions),['cancel','select:2','confirm']);assert.equal(await page.evaluate(()=>window.fixture.writes.length),0);
  });
  assert.deepEqual(errors,[]);console.log('Screenshots '+screenshots);
  if(failures.length)throw new AggregateError(failures,'IRIS navigation regression failures: '+failures.length);
}finally{await browser.close();server.close();}
