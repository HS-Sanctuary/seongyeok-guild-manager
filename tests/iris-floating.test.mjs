import {test} from 'node:test';import assert from 'node:assert/strict';import {loadTS} from './load-ts.mjs';
const {parseFloatingState,parseFloatingPreferences,shortcutFromKeyboard,acceptFloatingRevision,floatingShortcutCaption}=loadTS('lib/irisFloating.ts');
const rect={x:0,y:0,width:72,height:20};
const state={schemaVersion:1,mode:'floating',menuOpen:false,surface:'none',revision:4,layout:{width:132,height:76,anchor:{x:40,y:0,size:52},badge:{...rect,y:56,width:132},side:'right',vertical:'down',menu:[],bubble:null,panel:null},hotkeyAvailable:true,hotkeyLabel:'(Alt + ~)',preferences:{iconSize:52,opacity:80,modifiers:1,key:192},persistent:true};
test('game keyboard focus capability is optional and strictly boolean',()=>{
 assert.equal(parseFloatingState(state).gameFocus,undefined);
 assert.equal(parseFloatingState({...state,gameFocus:true}).gameFocus,true);
 for(const gameFocus of [null,1,'true'])assert.throws(()=>parseFloatingState({...state,gameFocus}));
});
test('windowed floating preference is optional for older hosts and strictly boolean when supported',()=>{
 assert.deepEqual(parseFloatingPreferences({...state.preferences,windowedFloating:true}),{...state.preferences,windowedFloating:true});
 assert.equal(parseFloatingPreferences({...state.preferences,windowedFloating:false}).windowedFloating,false);
 assert.deepEqual(parseFloatingPreferences(state.preferences),state.preferences);
 for(const windowedFloating of [null,1,'false'])assert.throws(()=>parseFloatingPreferences({...state.preferences,windowedFloating}));
});
test('new five-button menu and legacy four-button hosts both retain validated hit geometry',()=>{
 const menu=Array.from({length:5},(_,i)=>({x:i*24,y:0,width:20,height:20}));
 for(const count of [4,5])assert.equal(parseFloatingState({...state,menuOpen:true,layout:{...state.layout,menu:menu.slice(0,count)}}).layout.menu.length,count);
 for(const count of [1,3,6])assert.throws(()=>parseFloatingState({...state,menuOpen:true,layout:{...state.layout,menu:Array.from({length:count},()=>rect)}}));
});

test('visible shortcut omits wrapper parentheses without changing the native shortcut contract',()=>{
 assert.equal(floatingShortcutCaption(state.hotkeyLabel),'Alt + ~');
 assert.equal(floatingShortcutCaption('(Ctrl + Shift + F12)'),'Ctrl + Shift + F12');
 assert.equal(floatingShortcutCaption('Ctrl + Z'),'Ctrl + Z');
 assert.equal(parseFloatingState(state).hotkeyLabel,'(Alt + ~)');
});
test('strict floating geometry rejects invisible or malformed hit areas',()=>{assert.equal(parseFloatingState(state).layout.anchor.size,52);for(const change of [{schemaVersion:2},{extra:true},{layout:{...state.layout,width:NaN}},{layout:{...state.layout,anchor:{x:-1,y:0,size:52}}},{menuOpen:true},{surface:'ergon'},{preferences:{...state.preferences,opacity:0}}])assert.throws(()=>parseFloatingState({...state,...change}));});
test('late replies cannot reopen closed surfaces',()=>{assert.equal(acceptFloatingRevision({...state,revision:5},state).revision,5);assert.equal(acceptFloatingRevision(null,state).revision,4);});

test('modal panel is independent from module identity with optional old-host capability',()=>{
 const layout={...state.layout,panel:{x:0,y:0,width:132,height:76}};
 assert.equal(parseFloatingState({...state,dialogOpen:true,layout}).surface,'none');
 assert.equal(parseFloatingState({...state,dialogOpen:false}).dialogOpen,false);
 assert.equal(parseFloatingState(state).dialogOpen,undefined);
 for(const dialogOpen of ['true',1,null])assert.throws(()=>parseFloatingState({...state,dialogOpen,layout}));
 assert.throws(()=>parseFloatingState({...state,dialogOpen:true}));
 assert.throws(()=>parseFloatingState({...state,dialogOpen:false,layout}));
});

test('native window visibility is validated without breaking older floating hosts',()=>{
 assert.equal(parseFloatingState({...state,windowVisible:false}).windowVisible,false);
 assert.equal(parseFloatingState({...state,windowVisible:true}).windowVisible,true);
 assert.equal(parseFloatingState(state).windowVisible,undefined);
 for(const windowVisible of [null,'false',0])assert.throws(()=>parseFloatingState({...state,windowVisible}));
});
test('preferences reject unsupported or reserved shortcuts and retain default display',()=>{assert.deepEqual(parseFloatingPreferences(state.preferences),state.preferences);for(const change of [{iconSize:0},{opacity:101},{modifiers:0},{key:27},{modifiers:3,key:73}])assert.throws(()=>parseFloatingPreferences({...state.preferences,...change}));assert.deepEqual(shortcutFromKeyboard({code:'Backquote',altKey:true,ctrlKey:false,shiftKey:false,metaKey:false}),{modifiers:1,key:192});assert.equal(shortcutFromKeyboard({code:'KeyK',altKey:false,ctrlKey:false,shiftKey:false,metaKey:false}),null);});
test('window events retain epoch and environment isolation',()=>{const {parseDesktopWindowEvent}=loadTS('lib/irisDesktopStore.ts');const event={version:1,kind:'window.floating.changed',epoch:2,environment:'development',state};assert.equal(parseDesktopWindowEvent(event,{epoch:2,environment:'development'}).state.revision,4);assert.equal(parseDesktopWindowEvent(event,{epoch:3,environment:'development'}),null);assert.equal(parseDesktopWindowEvent({...event,extra:true},{epoch:2,environment:'development'}),null);});
