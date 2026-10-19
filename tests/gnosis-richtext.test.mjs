import test from 'node:test';
import assert from 'node:assert/strict';
import {loadTS} from './load-ts.mjs';
test('rich text preserves alignment size color tables and images through storage',()=>{
 const {normalizeRichDoc,richText,richHtml}=loadTS('lib/gnosisRichText.ts');
 const doc=normalizeRichDoc([{tag:'p',style:{textAlign:'center',fontSize:'1.2rem',color:'#ff0000',lineHeight:'1.7'},children:[{tag:'strong',children:[{text:'공략'}]}]},{tag:'table',children:[{tag:'tbody',children:[{tag:'tr',children:[{tag:'td',colSpan:2,children:[{text:'표'}]}]}]}]},{tag:'img',src:'data:image/png;base64,YWJj'}]);
 assert.equal(doc[0].style.textAlign,'center');assert.match(richText(doc),/공략/);assert.match(richHtml(doc),/colspan="2"/);assert.match(richHtml(doc),/data:image\/png/);
 assert.deepEqual(normalizeRichDoc(JSON.parse(JSON.stringify(doc))),doc);
});
test('rich documents cannot introduce scripts event handlers unsafe links or CSS URLs',()=>{
 const {normalizeRichDoc,richHtml}=loadTS('lib/gnosisRichText.ts');
 const doc=normalizeRichDoc([{tag:'script',children:[{text:'evil'}]},{tag:'img',src:'data:image/svg+xml;base64,YWJj',onerror:'evil'},{tag:'a',href:'javascript:alert(1)',children:[{text:'link'}]},{tag:'span',style:{color:'url(https://evil.test)',fontSize:'999rem',position:'fixed'},children:[{text:'<img onerror=evil>'}]}]);
 const html=richHtml(doc);assert.doesNotMatch(html,/<script|javascript:|svg\+xml|onerror=\"|url\(|position:|999rem/);assert.match(html,/&lt;img/);
});
