// Source-only fixture. Never edits product sources, release metadata or installed IRIS.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {randomUUID,createHash} from 'node:crypto';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
export const baseline='ca697706a874d21668091588940ceb61338d0700';
export const webPaths=['components/iris/DesktopFloatingHub.tsx','components/iris/DesktopIcons.tsx','lib/irisFloating.ts'];
export const releasePaths=['lib/irisRelease.ts'];
function change(text,pattern,value,label){if(typeof text!=='string'||[...text.matchAll(new RegExp(pattern.source,pattern.flags.includes('g')?pattern.flags:pattern.flags+'g'))].length!==1)throw Error('guard target changed: '+label);return text.replace(pattern,value);}
export function guardSources(input){
 const out={...input};
 out['desktop-addon.cs']=change(out['desktop-addon.cs'],/window.TopMost=false; timer.Tick\+=\(s,e\)=>Tick\(\); timer.Start\(\);/,'window.TopMost=false; /* fixture043: no tracker timer */','tracker timer');
 out['desktop-addon.cs']=change(out['desktop-addon.cs'],/        void Tick\(\) \{[\s\S]*?(?=        void ApplyPlacement\()/,'        void Tick() { /* fixture043: no observation */ }\n','tracker Tick');
 out['desktop-addon.cs']=change(out['desktop-addon.cs'],/        GameWindowObservation Discover\(out bool unavailable\) \{[\s\S]*?(?=        static IntPtr FindWindow\()/,'        GameWindowObservation Discover(out bool unavailable) { unavailable=false;return null; }\n','tracker Discover');
 out['desktop-floating-host.cs']=change(out['desktop-floating-host.cs'],/^  void RegisterFloatingHotkey\(\)\{[^\r\n]*\}/m,'  void RegisterFloatingHotkey(){ /* fixture043: no global hotkey */ }','hotkey');
 out['desktop-bridge.cs']=change(out['desktop-bridge.cs'],/switch \(message\["method"\] as string\) \{/,'if ((message["method"] as string ?? "").StartsWith("game.", StringComparison.Ordinal)) throw new ArgumentException("fixture043_game_denied"); switch (message["method"] as string) {','game bridge');
 let w=out['desktop-webview.cs'];
 w=change(w,/if\(updateState!=null\)bridge.BindUpdater\(updateState,updateCheck,updatePrepare,updateApply\);/,`Func<object> fixtureUpdate=()=>new {supported=true,installedVersion=DesktopNativeVersion.Value,availableVersion=(string)null,phase="idle",progress=0,error=(string)null};
                bridge.BindUpdater(fixtureUpdate,()=>Task.FromResult(fixtureUpdate()),()=>Task.FromException<object>(new InvalidOperationException("fixture043_update_denied")),()=>{throw new InvalidOperationException("fixture043_update_denied");});`,'read-only fixture version');
 w=change(w,/                bridge.BindGameStats\(DesktopGameStatsReader.ReadAsync\);[\s\S]*?(?=                bridge.BindOverlay\()/,`                var installedFonts=new DesktopInstalledFonts();bridge.BindFonts(installedFonts.ReadAsync);
                bridge.BindPresentation(Presentation.State,()=>{Presentation.Toggle();return Presentation.State();},open=>{Presentation.SetPanelOpen(open);return Presentation.State();});
                bridge.BindFloating(FloatingState,FloatingCommand,FloatingNotice,FloatingPreferencesChange);
                bridge.BindGameFocus(()=>false);bridge.BindWorkspace(SetWorkspace);
`,'native game/CLI binding removal');
 w=change(w,/var core = Browser.CoreWebView2;/,`var core = Browser.CoreWebView2;
            core.AddWebResourceRequestedFilter("*",CoreWebView2WebResourceContext.All);
            core.WebResourceRequested+=(sender,e)=>{Uri u;if(!Uri.TryCreate(e.Request.Uri,UriKind.Absolute,out u)||u.Scheme!="http"||u.Host!="localhost"||u.Port!=3000)e.Response=core.Environment.CreateWebResourceResponse(new MemoryStream(),403,"Fixture denied","");};`,'network allowlist');
 w=change(w,/System.Diagnostics.Process.Start\(new System.Diagnostics.ProcessStartInfo\(target.AbsoluteUri\) \{ UseShellExecute = true \}\);/,'throw new InvalidOperationException("fixture043_external_window_denied");','external browser');
 out['desktop-webview.cs']=w;return out;
}
export function prepareSources(owner){
 if(!/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(owner))throw Error('explicit synthetic owner required');
 const out=resolve('.superpowers/stabilize-20261029','043-'+owner+'-'+randomUUID().slice(0,8)),src=join(out,'source');mkdirSync(src,{recursive:true});
 const build=readFileSync('iris/build-beta.ps1','utf8'),section=build.match(/\$sources=@\(([\s\S]*?)\)\|ForEach-Object/);if(!section)throw Error('native source list changed');
 const names=[...section[1].matchAll(/'([^']+\.cs)'/g)].map(m=>m[1]);names.push('desktop-update-policy.cs','desktop-update-install.cs','desktop-release-files.cs');
 const originals=Object.fromEntries(names.map(n=>[n,readFileSync('iris/'+n,'utf8')]));
 originals['desktop-floating.cs']=execFileSync('git',['show',baseline+':iris/desktop-floating.cs'],{encoding:'utf8'});
 const guarded=guardSources(originals),sha=s=>createHash('sha256').update(s).digest('hex');
 for(const [name,text]of Object.entries(guarded))writeFileSync(join(src,name),text);
 const overrides={};for(const p of [...webPaths,...releasePaths]){overrides[resolve(p)]=execFileSync('git',['show',baseline+':'+p],{encoding:'utf8'});}
 writeFileSync(join(src,'validation-version.cs'),'namespace IrisDesktop { internal static class DesktopNativeVersion { public const string Value="0.4.3"; } }');
 const profile=join(out,'profiles',owner);mkdirSync(profile,{recursive:true});writeFileSync(join(profile,'fixture-owner.txt'),owner);
 const manifest={owner,baseline,out,src,names,profile,sourceHashes:Object.fromEntries(names.map(n=>[n,sha(originals[n])])),guardedHashes:Object.fromEntries(names.map(n=>[n,sha(guarded[n])])),webHashes:Object.fromEntries(Object.entries(overrides).map(([p,s])=>[p,sha(s)])),fullPageHash:sha(readFileSync('app/iris/desktop/page.tsx','utf8')),overrides};
 writeFileSync(join(out,'source-manifest.json'),JSON.stringify(manifest,null,2));return manifest;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)console.log(JSON.stringify(prepareSources(process.argv[2])));
