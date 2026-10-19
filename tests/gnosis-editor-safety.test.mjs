import test from 'node:test';
import assert from 'node:assert/strict';
import {loadTS} from './load-ts.mjs';
test('image sizing never upscales and bounds wide and tall images',()=>{
 const {imageDimensions}=loadTS('lib/gnosisImage.ts');
 assert.deepEqual(imageDimensions(4000,3000),{width:1000,height:750});
 assert.deepEqual(imageDimensions(1000,4000),{width:400,height:1600});
 assert.deepEqual(imageDimensions(57,60),{width:57,height:60});
});
test('poll creation rejects empty duplicate and invalid deadline inputs',()=>{
 const {preparePoll}=loadTS('lib/gnosisPoll.ts');
 const base={title:'투표',options:[{id:'a',text:'A',votes:0},{id:'b',text:'B',votes:0}],allowMultiple:false,isAnonymous:true,endDate:''};
 assert.equal(preparePoll(base,1000).options.length,2);
 for(const row of [{...base,title:''},{...base,options:[base.options[0]]},{...base,options:[base.options[0],base.options[0]]},{...base,endDate:'invalid'},{...base,endDate:'2000-01-01'}])assert.throws(()=>preparePoll(row,Date.UTC(2026,9,19)));
});
test('local votes reject duplicate submissions foreign IDs closed polls and extra single choices',()=>{
 const {applyLocalVote}=loadTS('lib/gnosisPoll.ts');
 const poll={title:'투표',options:[{id:'a',text:'A',votes:0},{id:'b',text:'B',votes:0}],allowMultiple:false,isAnonymous:true,endDate:''};
 const result=applyLocalVote(poll,['a'],1000);assert.equal(result.options[0].votes,1);assert.equal(poll.options[0].votes,0);assert.deepEqual(result.userVotes,['a']);
 for(const [row,ids] of [[result,['a']],[poll,['foreign']],[poll,['a','b']],[{...poll,endDate:'1970-01-01'},['a']]])assert.throws(()=>applyLocalVote(row,ids,1000));
});
