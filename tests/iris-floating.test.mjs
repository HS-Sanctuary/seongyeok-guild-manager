import {test} from 'node:test';import assert from 'node:assert/strict';import {loadTS} from './load-ts.mjs';
const {parseFloatingState,parseFloatingPreferences,shortcutFromKeyboard,acceptFloatingRevision}=loadTS('lib/irisFloating.ts');
const rect={x:0,y:0,width:72,height:20};
const state={schemaVersion:1,mode:'floating',menuOpen:false,surface:'none',revision:4,layout:{width:132,height:76,anchor:{x:40,y:0,size:52},badge:{...rect,y:56,width:132},side:'right',vertical:'down',menu:[],bubble:null,panel:null},hotkeyAvailable:true,hotkeyLabel:'(Alt + ~)',preferences:{iconSize:52,opacity:80,modifiers:1,key:192},persistent:true};
test('strict floating geometry rejects invisible or malformed hit areas',()=>{assert.equal(parseFloatingState(state).layout.anchor.size,52);for(const change of [{schemaVersion:2},{extra:true},{layout:{...state.layout,width:NaN}},{layout:{...state.layout,anchor:{x:-1,y:0,size:52}}},{menuOpen:true},{surface:'ergon'},{preferences:{...state.preferences,opacity:0}}])assert.throws(()=>parseFloatingState({...state,...change}));});
test('late replies cannot reopen closed surfaces',()=>{assert.equal(acceptFloatingRevision({...state,revision:5},state).revision,5);assert.equal(acceptFloatingRevision(null,state).revision,4);});

test('native window visibility is validated without breaking older floating hosts',()=>{
 assert.equal(parseFloatingState({...state,windowVisible:false}).windowVisible,false);
 assert.equal(parseFloatingState({...state,windowVisible:true}).windowVisible,true);
 assert.equal(parseFloatingState(state).windowVisible,undefined);
 for(const windowVisible of [null,'false',0])assert.throws(()=>parseFloatingState({...state,windowVisible}));
});
test('preferences reject unsupported or reserved shortcuts and retain default display',()=>{assert.deepEqual(parseFloatingPreferences(state.preferences),state.preferences);for(const change of [{iconSize:0},{opacity:101},{modifiers:0},{key:27},{modifiers:3,key:73}])assert.throws(()=>parseFloatingPreferences({...state.preferences,...change}));assert.deepEqual(shortcutFromKeyboard({code:'Backquote',altKey:true,ctrlKey:false,shiftKey:false,metaKey:false}),{modifiers:1,key:192});assert.equal(shortcutFromKeyboard({code:'KeyK',altKey:false,ctrlKey:false,shiftKey:false,metaKey:false}),null);});
test('window events retain epoch and environment isolation',()=>{const {parseDesktopWindowEvent}=loadTS('lib/irisDesktopStore.ts');const event={version:1,kind:'window.floating.changed',epoch:2,environment:'development',state};assert.equal(parseDesktopWindowEvent(event,{epoch:2,environment:'development'}).state.revision,4);assert.equal(parseDesktopWindowEvent(event,{epoch:3,environment:'development'}),null);assert.equal(parseDesktopWindowEvent({...event,extra:true},{epoch:2,environment:'development'}),null);});
