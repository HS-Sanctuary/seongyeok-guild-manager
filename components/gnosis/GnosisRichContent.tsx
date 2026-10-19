import { createElement } from "react";
import { normalizeRichDoc, type RichNode } from "@/lib/gnosisRichText";
export default function GnosisRichContent({value}:{value:unknown}) {
  function render(node:RichNode,index:number):React.ReactNode {
    if(node.text!==undefined)return node.text;
    const props:Record<string,unknown>={key:index,style:node.style,'data-heading-type':node.heading};
    if(node.tag==='a')Object.assign(props,{href:node.href,target:'_blank',rel:'noopener noreferrer'});
    if(node.tag==='img')Object.assign(props,{src:node.src,alt:'첨부 이미지'});
    if(node.colSpan)props.colSpan=node.colSpan;if(node.rowSpan)props.rowSpan=node.rowSpan;
    return ['img','br','hr'].includes(node.tag!)?createElement(node.tag!,props):createElement(node.tag!,props,...(node.children??[]).map(render));
  }
  return <div className="gnosis-rich-prose">{normalizeRichDoc(value).map(render)}</div>;
}
