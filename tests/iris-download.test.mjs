import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {readFileSync} from 'node:fs';
import {loadTS} from './load-ts.mjs';
const valid={sha256:'a'.repeat(64),sizeBytes:430771,createdAtUtc:'2026-10-10T14:27:08Z'};
function render(metadata){const Page=loadTS('app/iris/download/page.tsx',{'@/public/IRIS/downloads/download.json':metadata}).default;return renderToStaticMarkup(React.createElement(Page));}
test('a verified build manifest exposes a fixed beta archive with its checksum',()=>{
 const html=render(valid);assert.match(html,/href="\/IRIS\/downloads\/IRIS-beta.zip" download=""/);assert.match(html,/'?a{64}/);
});
test('invalid metadata never exposes a misleading download',()=>{
 for(const value of [{...valid,sha256:'bad'},{...valid,sizeBytes:-1},{...valid,createdAtUtc:'invalid'}])assert.doesNotMatch(render(value),/href="\/IRIS\/downloads\/IRIS-beta.zip"/);
});
test('published workspace archive matches its displayed SHA-256',async()=>{
 const {createHash}=await import('node:crypto');const metadata=JSON.parse(readFileSync('public/IRIS/downloads/download.json','utf8'));
 assert.equal(createHash('sha256').update(readFileSync('public/IRIS/downloads/IRIS-beta.zip')).digest('hex'),metadata.sha256);
});

test('addon title and download guide expose the same independent beta version',()=>{
 const Titlebar=loadTS('components/iris/DesktopTitlebar.tsx').DesktopTitlebar;
 const title=renderToStaticMarkup(React.createElement(Titlebar,{onDrag(){},onMinimize(){},onClose(){}}));
 const version=title.match(/Beta \d+\.\d+\.\d+/)?.[0];
 assert.ok(version,'addon title must display a beta version');
 assert.ok(render(valid).includes(version),'download guide must use the addon version, not SANCTUM version');
});
