export type FloatingModule='kronos'|'synaxis'|'ergon'|'settings';
export type FloatingCommand='menu'|'close'|'normal'|'floating'|'dialog-open'|'dialog-close'|FloatingModule;
export type FloatingPreferences={iconSize:number;opacity:number;modifiers:number;key:number;windowedFloating?:boolean};
export type FloatingRect={x:number;y:number;width:number;height:number};
export type FloatingGeometry={width:number;height:number;anchor:{x:number;y:number;size:number};badge:FloatingRect;side:'left'|'right';vertical:'up'|'down';menu:FloatingRect[];bubble:FloatingRect|null;panel:FloatingRect|null};
export type FloatingState={schemaVersion:1;mode:'normal'|'floating';menuOpen:boolean;surface:'none'|FloatingModule;revision:number;layout:FloatingGeometry;hotkeyAvailable:boolean;hotkeyLabel:string;preferences:FloatingPreferences;persistent:boolean;windowVisible?:boolean;dialogOpen?:boolean;gameFocus?:boolean};
export const defaultFloatingPreferences:FloatingPreferences={iconSize:36,opacity:80,modifiers:1,key:192};
export function floatingShortcutCaption(label:string){return label.startsWith('(')&&label.endsWith(')')?label.slice(1,-1):label;}
function exact(v:unknown,keys:string[]):v is Record<string,unknown>{return !!v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));}
const fail=()=>Error('플로팅 설정을 확인하지 못했어요.');
export function parseFloatingPreferences(v:unknown):FloatingPreferences{
 const hasWindowed=!!v&&typeof v==='object'&&Object.hasOwn(v,'windowedFloating');
 if(!exact(v,['iconSize','opacity','modifiers','key',...(hasWindowed?['windowedFloating']:[])])||!['iconSize','opacity','modifiers','key'].every(k=>Number.isSafeInteger(v[k]))||hasWindowed&&typeof v.windowedFloating!=='boolean')throw fail();
 const {iconSize,opacity,modifiers:m,key:k}=v as FloatingPreferences;
 if(iconSize<36||iconSize>80||opacity<35||opacity>100||m<1||m>7||!(m&3)||!(k===192||k>=48&&k<=57||k>=65&&k<=90||k>=112&&k<=123)||m===3&&(k===73||k===79))throw fail();
 return {iconSize,opacity,modifiers:m,key:k,...(hasWindowed?{windowedFloating:v.windowedFloating as boolean}:{})};
}
export function floatingShortcutLabel(p:FloatingPreferences){const parts=[];if(p.modifiers&2)parts.push('Ctrl');if(p.modifiers&1)parts.push('Alt');if(p.modifiers&4)parts.push('Shift');parts.push(p.key===192?'~':p.key>=112?'F'+(p.key-111):String.fromCharCode(p.key));return '('+parts.join(' + ')+')';}
export function shortcutFromKeyboard(e:Pick<KeyboardEvent,'code'|'altKey'|'ctrlKey'|'shiftKey'|'metaKey'>):Pick<FloatingPreferences,'modifiers'|'key'>|null{
 if(e.metaKey)return null;const modifiers=(e.altKey?1:0)|(e.ctrlKey?2:0)|(e.shiftKey?4:0);const key=e.code==='Backquote'?192:/^Key[A-Z]$/.test(e.code)?e.code.charCodeAt(3):/^Digit[0-9]$/.test(e.code)?e.code.charCodeAt(5):/^F([1-9]|1[0-2])$/.test(e.code)?111+Number(e.code.slice(1)):0;
 try{parseFloatingPreferences({...defaultFloatingPreferences,modifiers,key});return {modifiers,key};}catch{return null;}
}
export function parseFloatingState(v:unknown):FloatingState{
 const keys=['schemaVersion','mode','menuOpen','surface','revision','layout','hotkeyAvailable','hotkeyLabel','preferences','persistent'];
 if(v&&typeof v==='object'&&Object.hasOwn(v,'gameFocus')){keys.push('gameFocus');if(typeof (v as Record<string,unknown>).gameFocus!=='boolean')throw fail();}
 const hasVisibility=!!v&&typeof v==='object'&&Object.hasOwn(v,'windowVisible');
 if(hasVisibility)keys.push('windowVisible');
 const hasDialog=!!v&&typeof v==='object'&&Object.hasOwn(v,'dialogOpen');
 if(hasDialog){keys.push('dialogOpen');if(typeof (v as Record<string,unknown>).dialogOpen!=='boolean')throw fail();}
 if(!exact(v,keys)||hasVisibility&&typeof v.windowVisible!=='boolean'||v.schemaVersion!==1||!['normal','floating'].includes(String(v.mode))||typeof v.menuOpen!=='boolean'||!['none','kronos','synaxis','ergon','settings'].includes(String(v.surface))||!Number.isSafeInteger(v.revision)||Number(v.revision)<0||typeof v.hotkeyAvailable!=='boolean'||typeof v.persistent!=='boolean')throw fail();
 const preferences=parseFloatingPreferences(v.preferences);if(v.hotkeyLabel!==floatingShortcutLabel(preferences))throw fail();
 const l=v.layout;if(!exact(l,['width','height','anchor','badge','side','vertical','menu','bubble','panel'])||!['left','right'].includes(String(l.side))||!['up','down'].includes(String(l.vertical))||!['width','height'].every(k=>typeof l[k]==='number'&&Number.isFinite(l[k])&&Number(l[k])>0&&Number(l[k])<=20000)||!exact(l.anchor,['x','y','size']))throw fail();
 const rect=(r:unknown):r is FloatingRect=>exact(r,['x','y','width','height'])&&Object.values(r).every(x=>typeof x==='number'&&Number.isFinite(x))&&Number(r.x)>=0&&Number(r.y)>=0&&Number(r.width)>0&&Number(r.height)>0&&Number(r.x)+Number(r.width)<=Number(l.width)+.01&&Number(r.y)+Number(r.height)<=Number(l.height)+.01;
 if(!rect({x:l.anchor.x,y:l.anchor.y,width:l.anchor.size,height:l.anchor.size})||!rect(l.badge)||!Array.isArray(l.menu)||(v.menuOpen?![4,5,6].includes(l.menu.length):l.menu.length!==0)||!l.menu.every(rect)||l.bubble!==null&&!rect(l.bubble)||l.panel!==null&&!rect(l.panel)||(v.mode==='floating'&&((v.surface==='none'&&!v.dialogOpen)!==(l.panel===null)))||v.mode==='normal'&&(v.menuOpen||v.surface!=='none'))throw fail();
 return {...v,preferences} as FloatingState;
}
export function acceptFloatingRevision(current:FloatingState|null,next:FloatingState):FloatingState{return current&&current.revision>=next.revision?current:next;}
