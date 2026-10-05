import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

// Execute the actual page handlers, not a copy of their navigation logic.
// Router transitions may finish later; native history changes the URL now.
const source = fs.readFileSync('app/kerygma/page.tsx', 'utf8');
const ast = ts.createSourceFile('page.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
function handler(name, scope) {
  let expression;
  function visit(node) {
    if (ts.isVariableDeclaration(node) && node.name.getText(ast) === name) expression = node.initializer.getText(ast);
    ts.forEachChild(node, visit);
  }
  visit(ast);
  assert.ok(expression, `missing page handler ${name}`);
  const js = ts.transpile(`const run = ${expression};`, {target:ts.ScriptTarget.ES2020});
  return new Function(...Object.keys(scope), `${js}\nreturn run;`)(...Object.values(scope));
}
function fixture() {
  const state = {url:'/kerygma?id=14', selected:null, comments:[], category:'전체'};
  const pending = [];
  const scope = {
    window:{history:{
      pushState:(_data,_title,url)=>{state.url=url;},
      replaceState:(_data,_title,url)=>{state.url=url;},
    }},
    router:{push:url=>pending.push(url),replace:url=>pending.push(url)},
    withViewerVotes:notice=>notice,
    setSelectedNotice:notice=>{state.selected=notice;},
    setCommentsTree:comments=>{state.comments=comments;},
    setSelectedCategory:category=>{state.category=category;},
  };
  return {state, open:handler('handleOpenNotice',scope), close:handler('handleCloseReader',scope)};
}
const notice = {id:14,title:'업데이트',comments:[{id:1,content:'기존 댓글'}]};

test('returning to list removes the old notice URL before another click',()=>{
  const {state,close}=fixture();
  state.selected=notice;
  close();
  assert.equal(state.url,'/kerygma');
  assert.equal(state.selected,null);
});
test('same-URL notice click recovers a list whose selection was cleared',()=>{
  const {state,open}=fixture();
  open(notice);
  assert.equal(state.selected?.id,14);
  assert.deepEqual(state.comments,[{id:1,content:'기존 댓글'}]);
  assert.equal(state.url,'/kerygma?id=14');
});
test('rapid open-close-reopen keeps the last URL, notice and comments together',()=>{
  const {state,open,close}=fixture();
  open(notice); close(); open({id:13,comments:null});
  assert.equal(state.url,'/kerygma?id=13');
  assert.equal(state.selected?.id,13);
  assert.deepEqual(state.comments,[]);
});
