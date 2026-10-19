export type RichNode = { text?: string; tag?: string; children?: RichNode[]; style?: Record<string,string>; href?: string; src?: string; colSpan?: number; rowSpan?: number; heading?: string };
const TAGS = new Set(['p','div','span','strong','b','em','i','u','s','strike','br','h2','h3','h4','blockquote','ul','ol','li','a','img','table','thead','tbody','tr','th','td','hr','sub','sup']);
export function safeRichUrl(value: unknown) { if (typeof value !== 'string') return undefined; try { const url = new URL(value); return ['http:','https:'].includes(url.protocol) ? url.href : undefined; } catch { return undefined; } }
function color(value: string) { return /^(#[0-9a-f]{3,8}|rgba?\([\d\s.,%]+\)|transparent|var\(--(?:accent|text-main|text-sub|inner-box|panel)\))$/i.test(value); }
export function richStyle(value: unknown) {
  const result: Record<string,string> = {};
  if (!value || typeof value !== 'object') return result;
  for (const [key,raw] of Object.entries(value)) {
    if (typeof raw !== 'string') continue;
    if (['color','backgroundColor'].includes(key) && color(raw)) result[key]=raw;
    if (key==='textAlign' && ['left','center','right','justify'].includes(raw)) result[key]=raw;
    if (key==='fontSize' && /^\d*\.?\d+rem$/.test(raw) && parseFloat(raw)>=.6 && parseFloat(raw)<=2) result[key]=raw;
    if (key==='lineHeight' && /^\d*\.?\d+$/.test(raw) && Number(raw)>=1 && Number(raw)<=3) result[key]=raw;
    if (key==='fontWeight' && /^(bold|normal|[1-9]00)$/.test(raw)) result[key]=raw;
    if (key==='fontStyle' && ['italic','normal'].includes(raw)) result[key]=raw;
    if (key==='textDecoration' && /^(underline|line-through|none)$/.test(raw)) result[key]=raw;
    if (key==='width' && ['50%','100%'].includes(raw)) result[key]=raw;
  }
  return result;
}
export function normalizeRichDoc(value: unknown): RichNode[] {
  let count=0;
  function visit(rows:unknown,depth:number):RichNode[] {
    if(!Array.isArray(rows)||depth>40)return [];
    return rows.flatMap((raw):RichNode[]=>{
      if(++count>12000||!raw||typeof raw!=='object')return [];
      const row=raw as RichNode;
      if(typeof row.text==='string')return [{text:row.text}];
      if(!row.tag||!TAGS.has(row.tag))return [];
      const next:RichNode={tag:row.tag};
      const style=richStyle(row.style);if(Object.keys(style).length)next.style=style;
      if(row.tag==='a')next.href=safeRichUrl(row.href);
      if(row.tag==='img') {if(typeof row.src!=='string'||row.src.length>1500000||!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(row.src))return [];next.src=row.src;}
      for(const key of ['colSpan','rowSpan'] as const)if(Number.isInteger(row[key])&&row[key]!>1&&row[key]!<=20)next[key]=row[key];
      if(typeof row.heading==='string'&&/^(num|alpha|sym)-l[123]$/.test(row.heading))next.heading=row.heading;
      if(row.children)next.children=visit(row.children,depth+1);
      return [next];
    });
  }
  return visit(value,0);
}
const escape=(value:string)=>value.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
export function richHtml(value:unknown):string {
  function render(node:RichNode):string {
    if(node.text!==undefined)return escape(node.text);
    let attrs='';
    if(node.style) attrs+=' style="'+Object.entries(node.style).map(([key,v])=>key.replace(/[A-Z]/g,c=>'-'+c.toLowerCase())+':'+v).join(';')+'"';
    if(node.href)attrs+=' href="'+escape(node.href)+'" target="_blank" rel="noopener noreferrer"';
    if(node.src)attrs+=' src="'+node.src+'" alt="첨부 이미지"';
    if(node.colSpan)attrs+=' colspan="'+node.colSpan+'"';if(node.rowSpan)attrs+=' rowspan="'+node.rowSpan+'"';
    if(node.heading)attrs+=' data-heading-type="'+node.heading+'"';
    return '<'+node.tag+attrs+'>'+(['img','br','hr'].includes(node.tag!)?'':(node.children??[]).map(render).join('')+'</'+node.tag+'>');
  }
  return normalizeRichDoc(value).map(render).join('');
}
export function richText(value:unknown):string {
  function text(node:RichNode):string{return node.text??((node.tag==='img'?'[이미지]':node.tag==='br'?'\n':(node.children??[]).map(text).join(''))+(['p','div','h2','h3','h4','tr','li','blockquote'].includes(node.tag??'')?'\n':''));}
  return normalizeRichDoc(value).map(text).join('').trim();
}
export function readRichDom(root:HTMLElement):RichNode[] {
  function read(node:Node):RichNode[] {
    if(node.nodeType===3)return [{text:node.textContent??''}];
    if(!(node instanceof HTMLElement))return [];
    let tag=node.tagName.toLowerCase();if(['script','style','iframe','object','embed','form','input','button','svg'].includes(tag))return [];
    if(tag==='font')tag='span';
    const children=Array.from(node.childNodes).flatMap(read);
    if(!TAGS.has(tag))return children;
    const style:Record<string,string>={};
    for(const key of ['color','backgroundColor','fontSize','lineHeight','fontWeight','fontStyle','textDecoration','textAlign','width'] as const){let value=node.style[key];if(key==='fontSize'&&value.endsWith('px'))value=String(parseFloat(value)/20)+'rem';if(value)style[key]=value;}
    if(node.tagName==='FONT'&&node.getAttribute('color'))style.color=node.getAttribute('color')!;
    return [{tag,children,style,href:node.getAttribute('href')??undefined,src:node.getAttribute('src')??undefined,colSpan:Number(node.getAttribute('colspan'))||undefined,rowSpan:Number(node.getAttribute('rowspan'))||undefined,heading:node.dataset.headingType}];
  }
  return normalizeRichDoc(Array.from(root.childNodes).flatMap(read));
}
