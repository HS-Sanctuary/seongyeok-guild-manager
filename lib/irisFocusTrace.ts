import type {FloatingModule} from './irisFloating';
export type IrisFocusTrace={phase:'inactive'|'skip'|'request'|'reply'|'error'|'close';surface:'none'|FloatingModule;menu:boolean;capable:boolean;documentFocus:boolean;keyboard:boolean;pointer:boolean;modal:boolean;editing:boolean;selection:boolean;returned:boolean|null};
let previous='',lastAt=0;
/** Temporary local-development metadata only; no keys, text, account IDs, or window handles. */
export function traceIrisFocus(state:IrisFocusTrace){
 if(process.env.NODE_ENV!=='development'||typeof window==='undefined'||!['localhost','127.0.0.1'].includes(window.location.hostname))return;
 const body=JSON.stringify(state),now=Date.now();if(body===previous&&now-lastAt<1000)return;previous=body;lastAt=now;
 void fetch('/api/iris/focus-debug',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'omit',body}).catch(()=>{/* Diagnostics never affect controls or gameplay. */});
}
