import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {guardSources,baseline,webPaths} from './iris-online-043-source.mjs';
test('043 fixture closes every game discovery entry and removes native CLI bindings',()=>{
 const inputs=Object.fromEntries(['desktop-addon.cs','desktop-webview.cs','desktop-floating-host.cs','desktop-bridge.cs'].map(n=>[n,readFileSync('iris/'+n,'utf8')]));
 const guarded=guardSources(inputs);
 assert.match(guarded['desktop-addon.cs'],/void Tick\(\) \{ \/\* fixture043: no observation \*\/ \}/);
 assert.match(guarded['desktop-addon.cs'],/Discover\(out bool unavailable\) \{ unavailable=false;return null; \}/);
 assert.doesNotMatch(guarded['desktop-addon.cs'],/timer\.Start\(\)/);
 assert.doesNotMatch(guarded['desktop-webview.cs'],/DesktopLifeCli\.|BindGameStats\(|BindLifeActions\(|Process\.Start\(/);
 assert.match(guarded['desktop-webview.cs'],/fixture043_external_window_denied/);
 assert.match(guarded['desktop-bridge.cs'],/StartsWith\("game\."/);
 assert.doesNotMatch(guarded['desktop-floating-host.cs'],/new DesktopFloatingHotkey/);
 assert.match(guarded['desktop-floating-host.cs'],/RegisterFloatingHotkey\(\)\{ \/\* fixture043: no global hotkey \*\/ \}/);
 assert.equal(inputs['desktop-addon.cs'],readFileSync('iris/desktop-addon.cs','utf8'));
});
test('043 fixture refuses changed guard targets, preserves explicit operating UI baseline',()=>{
 assert.throws(()=>guardSources({}),/guard target/);
 assert.equal(baseline,'ca697706a874d21668091588940ceb61338d0700');
 assert.deepEqual(webPaths,['components/iris/DesktopFloatingHub.tsx','components/iris/DesktopIcons.tsx','lib/irisFloating.ts']);
});
