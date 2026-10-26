import {loadTS} from './load-ts.mjs';
import {FakeWoodCli,scope,goalId,plan,approval} from './iris-ergon-wood.fixture.mjs';
import {ProcessRepo} from './iris-ergon-wood-process.fixture.mjs';
const [root,raw]=process.argv.slice(2),packet=JSON.parse(raw),{parseErgonNativeObservation}=loadTS('lib/irisErgonNativeObservation.ts'),observation=parseErgonNativeObservation(packet,{scope,targetName:'목재',now:packet.observedAt});
const cli=new FakeWoodCli(root),repo=new ProcessRepo(root);let reads=0,quotes=0,executes=0;
cli.observe=async()=>{reads++;return observation;};cli.quote=async()=>{quotes++;throw Error('pending must not quote');};cli.execute=async()=>{executes++;throw Error('pending must not execute');};
const {createSyntheticWoodProduction}=loadTS('lib/irisErgonWoodProduction.ts'),manager=createSyntheticWoodProduction({scope,goalId,plan,approval},repo,cli,()=>cli.native(),async()=>packet.observedAt),result=await manager.step();
console.log(JSON.stringify({pid:process.pid,phase:result.phase,confirmed:result.confirmed,events:result.events,reads,quotes,executes,world:await cli.world()}));
