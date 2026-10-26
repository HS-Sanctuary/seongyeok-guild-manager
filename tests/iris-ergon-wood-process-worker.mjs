import {readFile,writeFile} from 'node:fs/promises';import path from 'node:path';import {setTimeout as delay} from 'node:timers/promises';
import {loadTS} from './load-ts.mjs';import {FileRepo,FakeWoodCli,scope,goalId,plan,approval} from './iris-ergon-wood.fixture.mjs';import {ProcessRepo} from './iris-ergon-wood-process.fixture.mjs';
const [root,mode,kind='gather',token=String(process.pid)]=process.argv.slice(2),file=name=>path.join(root,name);
const repo=new ProcessRepo(root),cli=new FakeWoodCli(root),{createSyntheticWoodProduction}=loadTS('lib/irisErgonWoodProduction.ts');
const manager=createSyntheticWoodProduction({scope,goalId,plan,approval},repo,cli,()=>cli.native(),async()=>(await cli.world()).clock);
async function waitRelease(){for(let i=0;i<1500;i++){try{await readFile(file('release-'+token));return;}catch(e){if(e.code!=='ENOENT')throw e;}await delay(20);}throw Error('owned synthetic release timeout');}
async function marker(stage){const s=await new FileRepo(root).load(),w=await cli.world();await writeFile(file('ready-'+token+'.json'),JSON.stringify({pid:process.pid,stage,kind,manager:s,world:w}));await waitRelease();}
if(mode==='hold'){await writeFile(file('attempt-'+token),'owned test');await repo.withActor(scope,async()=>{await writeFile(file('entered-'+token),'entered');await waitRelease();});}
else if(['before-execute','response-loss','terminal-failure'].includes(mode)){
 const commit=repo.commit.bind(repo),execute=cli.execute.bind(cli);repo.commit=async(expected,s)=>{if(mode==='terminal-failure'&&s.events.at(-1)?.receipt)throw Error('synthetic terminal save failure');const ack=await commit(expected,s);if(mode==='before-execute'&&s.events.at(-1)?.receipt===null){if(s.events.at(-1).command.kind!==kind)throw Error('unexpected pending kind');await marker(mode);}return ack;};
 cli.execute=async(c,q)=>{if(c.kind!==kind)throw Error('unexpected command kind');const receipt=await execute(c,q);if(mode==='response-loss')await marker(mode);return receipt;};
 const result=await manager.step();if(mode==='terminal-failure'){if(result.phase!=='blocked'||result.events.at(-1)?.receipt!==null)throw Error('missing terminal pending');await marker(mode);}else throw Error('stop marker unexpectedly returned');
}else if(mode==='recover'||mode==='step'){const result=await manager.step();console.log(JSON.stringify({pid:process.pid,phase:result.phase,confirmed:result.confirmed,events:result.events,world:await cli.world()}));}
else throw Error('unknown synthetic mode');
