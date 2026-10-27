import type { QueueSnapshot } from './irisDesktopQueue';
import type {ErgonGoalWrite,ErgonBindingWrite} from './irisErgonGoalBinding';
import type {ErgonGoalReplacementWrite} from './irisErgonGoalManagement';
import {parseErgonNativeObservation,type ErgonNativeObservation} from './irisErgonNativeObservation';
import {parseErgonWoodNativeView,type WoodNativeView} from './irisErgonWoodPersistence';
import {parseGameStats,type GameStats} from './irisStats';
import {parseCurrencies,type CurrencySnapshot} from './irisCurrencies';
import {parseCurrencyCache,type CurrencyCacheView} from './irisCurrencyCache';
import {ergonReadKinds,validErgonReadKind,parseErgonSnapshot,type ErgonReadKind,type ErgonSnapshot} from './irisErgonRead';
import {parseErgonChallenge,parseErgonActionReceipt,parseErgonActionState,parseErgonActionHistory,type ErgonAction,type ErgonChallenge,type ErgonActionState} from './irisErgonActions';
import {parseErgonReference} from './irisErgonReference';
import {parseErgonProgressView,parseErgonProgressAck,type ErgonQuantityWrite,type ErgonLifecycleWrite,type ProgressScope,type ProgressView} from './irisErgonProgress';
import {ergonErrorMessage} from './irisErgonErrors';
import {automationText,parseErgonCollectionPolicy,parseErgonActionCapabilities,validateErgonCollectionRequest,parseErgonCollectionObservation,type ErgonCollectionRequest,type ErgonCollectionIdentity} from './irisErgonAutomation';
import {parseDesktopUpdateState,type DesktopUpdateState} from './irisDesktopUpdate';
import {parseFloatingState,parseFloatingPreferences,type FloatingState,type FloatingCommand,type FloatingPreferences} from './irisFloating';

type Context = { epoch: number; environment: string };
export type DesktopPresentation={compact:boolean;automatic:boolean;panelOpen:boolean};
export function parseDesktopPresentation(value:unknown):DesktopPresentation{if(!exactObject(value,['compact','automatic','panelOpen'])||typeof value.compact!=='boolean'||typeof value.automatic!=='boolean'||typeof value.panelOpen!=='boolean')throw Error('창 접힘 상태를 확인하지 못했어요.');return {...value} as DesktopPresentation;}
export type DesktopAddonState={dockSide:'right'|'left'|'off';sameLayer:boolean;tracked:boolean;actualSide:'right'|'left'|'off';status:'searching'|'attached'|'independent'|'no-space'|'unavailable';persistent:boolean};
export type DesktopAddonPreferences=Pick<DesktopAddonState,'dockSide'|'sameLayer'>;
function exactObject(value:unknown,keys:string[]):value is Record<string,unknown>{return !!value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).length===keys.length&&keys.every(key=>Object.hasOwn(value,key));}
export function parseInstalledFonts(value:unknown):string[]{
  if(!exactObject(value,['fonts'])||!Array.isArray(value.fonts)||value.fonts.length>2048)throw Error('설치 글꼴 목록을 확인하지 못했어요.');
  const seen=new Set<string>();
  return value.fonts.map(name=>{if(typeof name!=='string'||name.length>80||!name.length||name!==name.trim()||!/^([\p{L}\p{N}][\p{L}\p{N} ._-]*)$/u.test(name)||/[\x00-\x1f\x7f]/.test(name)||seen.has(name.toLocaleLowerCase()))throw Error('설치 글꼴 목록을 확인하지 못했어요.');seen.add(name.toLocaleLowerCase());return name;});
}
export function parseDesktopAddonState(value:unknown):DesktopAddonState {
  if(!exactObject(value,['dockSide','sameLayer','tracked','actualSide','status','persistent'])||!['right','left','off'].includes(String(value.dockSide))||!['right','left','off'].includes(String(value.actualSide))||!['searching','attached','independent','no-space','unavailable'].includes(String(value.status))||typeof value.sameLayer!=='boolean'||typeof value.tracked!=='boolean'||typeof value.persistent!=='boolean'||(value.status==='attached'&&(!value.tracked||value.actualSide==='off'||value.dockSide==='off')))throw Error('창 연결 상태를 확인해 주세요.');
  return {...value} as DesktopAddonState;
}
export function parseDesktopWindowEvent(value:unknown,context:Context|null):{kind:'window.close.request';reason:'manual'|'game-exit'}|{kind:'window.addon.changed';state:DesktopAddonState}|{kind:'window.update.changed';state:DesktopUpdateState}|{kind:'window.presentation.changed';state:DesktopPresentation}|{kind:'window.floating.changed';state:FloatingState}|null {
  if(!context||!Number.isSafeInteger(context.epoch)||context.epoch<1||!['development','production'].includes(context.environment)||!exactObject(value,['version','kind','epoch','environment',['window.addon.changed','window.update.changed','window.presentation.changed','window.floating.changed'].includes(String((value as {kind?:unknown})?.kind))?'state':'reason'])||value.version!==1||value.epoch!==context.epoch||value.environment!==context.environment)return null;
  if(value.kind==='window.close.request'&&(value.reason==='manual'||value.reason==='game-exit'))return {kind:value.kind,reason:value.reason};
  if(value.kind==='window.addon.changed')try{return {kind:value.kind,state:parseDesktopAddonState(value.state)};}catch{return null;}
  if(value.kind==='window.update.changed')try{return {kind:value.kind,state:parseDesktopUpdateState(value.state)};}catch{return null;}
  if(value.kind==='window.presentation.changed')try{return {kind:value.kind,state:parseDesktopPresentation(value.state)};}catch{return null;}
  if(value.kind==='window.floating.changed')try{return {kind:value.kind,state:parseFloatingState(value.state)};}catch{return null;}
  return null;
}
export type DesktopOverlayState={clickThrough:boolean;shortcutsAvailable:boolean;opacityPercent:number};
function overlayState(value:unknown):DesktopOverlayState {
  const state=value as DesktopOverlayState|null;
  if(!state||typeof state.clickThrough!=='boolean'||typeof state.shortcutsAvailable!=='boolean'||!Number.isInteger(state.opacityPercent)||state.opacityPercent<30||state.opacityPercent>100||(state.clickThrough&&!state.shortcutsAvailable))throw Error('오버레이 상태를 확인해 주세요.');
  return {clickThrough:state.clickThrough,shortcutsAvailable:state.shortcutsAvailable,opacityPercent:state.opacityPercent};
}
type Message = { data: unknown };
type Channel = {
  postMessage(value: unknown): void;
  addEventListener(type: 'message', listener: (event: Message) => void): void;
  removeEventListener(type: 'message', listener: (event: Message) => void): void;
};

/** Only the authenticated native document bridge may persist a queue. No browser fallback. */
export function createDesktopStore(options: { channel: Channel; context(): Context | null; environment: string; timeoutMs?: number }) {
  const timeout = options.timeoutMs ?? 5000;
  if (!['development', 'production'].includes(options.environment) || !Number.isSafeInteger(timeout) || timeout < 1 || timeout > 60000) throw Error('대기함 설정을 확인해 주세요.');
  let sequence = 0;
  let supportedEpoch:number|null=null;
  let workspaceEpoch:number|null=null;
  let lifeEpoch:number|null=null;
  let observationGeneration=0;
  const nativeObservations=new WeakMap<object,{epoch:number;generation:number;scope:ProgressScope}>();
  async function lifeCapabilities():Promise<void>{
    const epoch=options.context()?.epoch;if(epoch!==undefined&&epoch===lifeEpoch)return;
    let value:unknown;try{value=await request('game.life.capabilities',null);}catch{throw Error('생활 조회를 사용하려면 IRIS를 정상 종료하고 최신 앱으로 다시 실행해 주세요.');}
    if(!exactObject(value,['schemaVersion','readOnly','kinds'])||value.schemaVersion!==1||value.readOnly!==true||!Array.isArray(value.kinds)||value.kinds.length!==ergonReadKinds.length||ergonReadKinds.some(k=>!(value.kinds as unknown[]).includes(k))||epoch!==options.context()?.epoch)throw Error('생활 조회 연결을 확인하지 못했어요. 최신 앱으로 다시 실행해 주세요.');lifeEpoch=epoch??null;
  }
  async function queueCapabilities():Promise<{schemaVersion:3;barter:true}>{
    const epoch=options.context()?.epoch;
    if(epoch!==undefined&&epoch===supportedEpoch)return {schemaVersion:3,barter:true};
    let value:unknown;
    try{value=await request('store.capabilities',null);}catch{throw Error('IRIS를 정상 종료하고 최신 앱으로 다시 실행해 주세요. 보호된 대기함은 변경하지 않았어요.');}
    if(!(exactObject(value,['schemaVersion','barter'])||exactObject(value,['schemaVersion','barter','workspace']))||value.schemaVersion!==3||value.barter!==true)throw Error('IRIS를 정상 종료하고 최신 앱으로 다시 실행해 주세요. 물물교환 대기함 형식을 확인하지 못했어요.');
    if(epoch!==options.context()?.epoch)throw Error('앱 연결이 바뀌었어요. 다시 실행해 주세요.');supportedEpoch=epoch??null;workspaceEpoch=value.workspace===true?epoch??null:null;
    return {schemaVersion:3,barter:true};
  }
function request(method: 'game.life.wood.load' | 'game.life.wood.observe' | 'game.life.evidence.read' | 'game.life.progress.replaceEmptyGoal' | 'game.life.progress.createGoal' | 'game.life.progress.bindPrepared' | 'game.life.progress.capabilities' | 'game.life.progress.confirmQuantity' | 'game.life.progress.correctQuantity' | 'game.life.progress.setLifecycle' | 'game.life.progress.load' | 'store.currencies.load' | 'game.currencies.refreshCache' | 'window.game.focus' | 'window.floating.state' | 'window.floating.command' | 'window.floating.notice' | 'window.floating.preferences' | 'window.workspace' | 'game.life.capabilities' | 'game.life.read' | 'game.life.reference' | 'game.life.actions.capabilities' | 'game.life.actions.context' | 'game.life.actions.collectionObservation' | 'game.life.actions.collect' | 'game.life.actions.collectionPolicy' | 'game.life.actions.revokeCollection' | 'game.life.actions.prepare' | 'game.life.actions.confirm' | 'game.life.actions.stop' | 'game.life.actions.cancel' | 'game.life.actions.state' | 'game.life.actions.history' | 'store.capabilities' | 'store.load' | 'store.replace' | 'window.hide' | 'window.close' | 'window.addon.state' | 'window.addon.preferences' | 'window.drag' | 'window.minimize' | 'window.decision' | 'overlay.state' | 'overlay.input' | 'overlay.opacity' | 'game.stats.read' | 'game.currencies.read' | 'window.update.state' | 'window.update.check' | 'window.update.prepare' | 'window.update.apply' | 'window.fonts.list' | 'window.fonts.refresh' | 'window.presentation.state' | 'window.presentation.toggle' | 'window.presentation.panel' | 'window.alert.sound', payload: unknown): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const context = options.context();
      if (!context || context.environment !== options.environment || !Number.isSafeInteger(context.epoch) || context.epoch < 1 || sequence >= Number.MAX_SAFE_INTEGER) {
        reject(Error('보호된 대기함에 연결할 수 없어요.')); return;
      }
      // Fast Refresh can recreate the module/controller without navigating the native document.
      // Keep channel request IDs monotonic across those recreations; native replay checks stay intact.
      const sequenceKey=Symbol.for('SANCTUM.IRIS.request-sequences.v1');
      const runtime=globalThis as typeof globalThis&{[key:symbol]:WeakMap<object,number>|undefined};
      const sequences=runtime[sequenceKey]??(runtime[sequenceKey]=new WeakMap<object,number>());
      sequence=Math.max(sequence,sequences.get(options.channel)??0);
      if(sequence>=Number.MAX_SAFE_INTEGER){reject(Error('앱 요청 한도에 도달했어요. 정상 재시작해 주세요.'));return;}
      const id = String(++sequence), epoch = context.epoch;sequences.set(options.channel,sequence);
      const fail = () => Error('보호된 대기함 응답을 확인하지 못했어요. 변경을 보존하고 연결을 확인해 주세요.');
      const cleanup = () => { clearTimeout(timer); options.channel.removeEventListener('message', listener); };
      const listener = (event: Message) => {
        const value = event.data as Record<string, unknown> | null;
        if (!value || value.version !== 1 || value.id !== id) return;
        const current = options.context();
        if (value.epoch !== epoch || current?.epoch !== epoch || current.environment !== options.environment || value.ok !== true) {
          const message=value.epoch===epoch&&current?.epoch===epoch&&current.environment===options.environment&&value.ok===false&&method.startsWith('game.life.actions.')?ergonErrorMessage(value.error):null;
          cleanup(); reject(message?Error(message):fail()); return;
        }
        cleanup(); resolve(value.value);
      };
      options.channel.addEventListener('message', listener);
      const timer = setTimeout(() => { cleanup(); reject(fail()); }, (method==='game.life.evidence.read'||method==='game.life.wood.observe')?Math.max(timeout,25000):(method==='game.life.actions.confirm'||method==='game.life.actions.collect'||method==='game.life.progress.confirmQuantity'||method==='game.life.progress.correctQuantity')?Math.max(timeout,150000):method==='game.life.actions.stop'?Math.max(timeout,18000):method==='game.life.actions.prepare'?Math.max(timeout,90000):method==='window.update.prepare'?Math.max(timeout,90000):method==='window.update.check'?Math.max(timeout,15000):method.startsWith('game.')?Math.max(timeout,10000):timeout);
      try { options.channel.postMessage({ version: 1, id, epoch, method, payload }); }
      catch { cleanup(); reject(fail()); }
    });
  }
  function progressIdentity(scope:ProgressScope){if(!exactObject(scope,['environment','accountId','characterId'])||scope.environment!==options.environment||!automationText(scope.accountId)||!automationText(scope.characterId))throw Error('진행 기록의 계정과 캐릭터를 확인해 주세요.');return {accountId:scope.accountId,characterId:scope.characterId};}
  const progressId=(v:unknown)=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(v)&&v!=='00000000-0000-0000-0000-000000000000';
  function progressWrite(value:{revision:number;operationId:string;goalId:string}){if(!Number.isSafeInteger(value.revision)||value.revision<0||value.revision>=Number.MAX_SAFE_INTEGER||!progressId(value.operationId)||!progressId(value.goalId))throw Error('진행 기록 요청을 다시 확인해 주세요.');}
  return {
    async replaceErgonGoal(scope:ProgressScope,value:ErgonGoalReplacementWrite){const owner=progressIdentity(scope);progressWrite(value);if(!exactObject(value,['revision','operationId','goalId','sourcePlanId','action','displayName','targetQuantity','replacementQuantity'])||!automationText(value.sourcePlanId)||value.sourcePlanId.length>100||value.action!=='crafting'||!automationText(value.displayName)||value.displayName.length>160||!Number.isSafeInteger(value.targetQuantity)||value.targetQuantity<1||value.targetQuantity>1000000||!Number.isSafeInteger(value.replacementQuantity)||value.replacementQuantity<1||value.replacementQuantity>1000000||value.replacementQuantity===value.targetQuantity)throw Error('교체할 제작 목표 수량을 확인해 주세요.');return parseErgonProgressAck(await request('game.life.progress.replaceEmptyGoal',{...owner,...value}),scope,value.operationId);},
    async createErgonGoal(scope:ProgressScope,value:ErgonGoalWrite){const owner=progressIdentity(scope);progressWrite(value);if(!exactObject(value,['revision','operationId','goalId','sourcePlanId','parentGoalId','action','displayName','targetQuantity'])||!automationText(value.sourcePlanId)||value.sourcePlanId.length>100||value.parentGoalId!==null||!['crafting','altering','gathering'].includes(value.action)||!automationText(value.displayName)||value.displayName.length>160||!Number.isSafeInteger(value.targetQuantity)||value.targetQuantity<1||value.targetQuantity>1000000)throw Error('목표 연결 정보를 확인해 주세요.');return request('game.life.progress.createGoal',{...owner,...value});},
    async bindErgonPrepared(scope:ProgressScope,value:ErgonBindingWrite){const owner=progressIdentity(scope);progressWrite(value);if(!exactObject(value,['revision','operationId','goalId','nonce'])||!progressId(value.nonce))throw Error('연결할 준비 요청을 확인해 주세요.');return request('game.life.progress.bindPrepared',{...owner,...value});},
    async ergonProgressCapabilities(scope:ProgressScope){const r=await request('game.life.progress.capabilities',progressIdentity(scope));if(!exactObject(r,['schemaVersion','localOnly','executionConnected'])||r.schemaVersion!==1||r.localOnly!==true||r.executionConnected!==false)throw Error('지원하지 않는 진행 기록 연결이에요.');return {schemaVersion:1,localOnly:true,executionConnected:false} as const;},
    async saveErgonQuantity(scope:ProgressScope,value:ErgonQuantityWrite){const identity=progressIdentity(scope),correct=Object.hasOwn(value,'supersedesEventId')||Object.hasOwn(value,'reason');if(!exactObject(value,['revision','operationId','goalId','requestId','quantity',...(correct?['supersedesEventId','reason']:[])])||!progressId(value.requestId)||!Number.isSafeInteger(value.quantity)||value.quantity<0||value.quantity>5000000||correct&&(!progressId(value.supersedesEventId)||!automationText(value.reason)||value.reason.length>400))throw Error('확인 수량과 정정 사유를 확인해 주세요.');progressWrite(value);return parseErgonProgressAck(await request(correct?'game.life.progress.correctQuantity':'game.life.progress.confirmQuantity',{...identity,...value}),scope,value.operationId,value);},
    async setErgonGoalLifecycle(scope:ProgressScope,value:ErgonLifecycleWrite){const identity=progressIdentity(scope);if(!exactObject(value,['revision','operationId','goalId','lifecycle'])||!['paused','cancelled'].includes(value.lifecycle))throw Error('보류 또는 취소할 목표를 확인해 주세요.');progressWrite(value);return parseErgonProgressAck(await request('game.life.progress.setLifecycle',{...identity,...value}),scope,value.operationId,value);},
    async loadErgonProgress(scope:ProgressScope):Promise<ProgressView>{if(!exactObject(scope,['environment','accountId','characterId'])||scope.environment!==options.environment||!automationText(scope.accountId)||!automationText(scope.characterId))throw Error('진행 기록의 계정과 캐릭터를 확인해 주세요.');return parseErgonProgressView(await request('game.life.progress.load',{accountId:scope.accountId,characterId:scope.characterId}),scope);},
    async readErgonNativeObservation(scope:ProgressScope,targetName:string):Promise<ErgonNativeObservation>{
      if(!exactObject(scope,['environment','accountId','characterId'])||scope.environment!==options.environment||!automationText(scope.accountId)||!automationText(scope.characterId)||!automationText(targetName)||targetName.length>160)throw Error('관측할 계정·캐릭터·품목을 확인해 주세요.');
      const owner={...scope},name=targetName,epoch=options.context()?.epoch,generation=observationGeneration;
      const response=await request('game.life.evidence.read',{accountId:owner.accountId,characterId:owner.characterId,targetName:name});
      const value=parseErgonNativeObservation(response,{scope:owner,targetName:name,now:Date.now()});
      if(epoch!==options.context()?.epoch||value.documentEpoch!==epoch||generation!==observationGeneration)throw Error('관측 중 앱 문맥이 바뀌었어요.');
      nativeObservations.set(value,{epoch,generation,scope:owner});return value;
    },
    async loadErgonWoodProgress(scope:ProgressScope,goalId:string):Promise<WoodNativeView>{progressIdentity(scope);if(!progressId(goalId))throw Error('가공 목표를 확인해 주세요.');const identity={scope:{...scope},goalId},generation=observationGeneration;const result=parseErgonWoodNativeView(await request('game.life.wood.load',{accountId:scope.accountId,characterId:scope.characterId,goalId}),identity,'observation');if(generation!==observationGeneration)throw Error('가공 저장 응답 중 문맥이 바뀌었어요.');return result;},
    async observeErgonWoodProgress(scope:ProgressScope,goalId:string,approval:{id:string;maxWings:number;maxLogs:number;maxGather:number;expiresAt:number}):Promise<WoodNativeView>{progressIdentity(scope);if(!progressId(goalId)||!exactObject(approval,['id','maxWings','maxLogs','maxGather','expiresAt'])||!automationText(approval.id)||['maxWings','maxLogs','maxGather'].some(k=>!Number.isSafeInteger(approval[k as 'maxWings'])||approval[k as 'maxWings']<0)||!Number.isSafeInteger(approval.expiresAt)||approval.expiresAt<1)throw Error('가공 목표와 승인 예산을 확인해 주세요.');const identity={scope:{...scope},goalId},generation=observationGeneration;const result=parseErgonWoodNativeView(await request('game.life.wood.observe',{accountId:scope.accountId,characterId:scope.characterId,goalId,approval:{...approval}}),identity,'observation');if(generation!==observationGeneration)throw Error('가공 저장 응답 중 문맥이 바뀌었어요.');return result;},
    ownsErgonObservation(value:unknown):value is ErgonNativeObservation{if(!value||typeof value!=='object')return false;const record=nativeObservations.get(value),now=Date.now();return !!record&&record.generation===observationGeneration&&record.epoch===options.context()?.epoch&&record.scope.environment===options.environment&&Number.isFinite(now)&&now>=(value as ErgonNativeObservation).observedAt&&now-(value as ErgonNativeObservation).observedAt<15000;},
    async floatingState():Promise<FloatingState>{return parseFloatingState(await request('window.floating.state',null));},
    async floatingCommand(command:FloatingCommand):Promise<FloatingState>{if(!['menu','close','normal','floating','kronos','synaxis','ergon','settings','dialog-open','dialog-close'].includes(command))throw Error('표시할 메뉴를 확인해 주세요.');return parseFloatingState(await request('window.floating.command',{command}));},
    async setFloatingNotice(kind:'none'|'information'|'character',height?:number):Promise<FloatingState>{if(!['none','information','character'].includes(kind)||height!==undefined&&(!Number.isInteger(height)||height<80||height>360))throw Error('안내 종류를 확인해 주세요.');return parseFloatingState(await request('window.floating.notice',{kind,...(height===undefined?{}:{height})}));},
    async setFloatingPreferences(value:FloatingPreferences):Promise<FloatingState>{return parseFloatingState(await request('window.floating.preferences',parseFloatingPreferences(value)));},
    async returnGameFocus():Promise<boolean>{const value=await request('window.game.focus',null);if(!exactObject(value,['focused'])||typeof value.focused!=='boolean')throw Error('게임 입력 복귀를 확인하지 못했어요.');return value.focused;},
    lifeCapabilities,
    async collectionObservation(value:ErgonCollectionIdentity){if(!exactObject(value,['requestId','accountId','characterId'])||!automationText(value.accountId)||!automationText(value.characterId)||typeof value.requestId!=='string'||!/^(?!00000000-0000-0000-0000-000000000000$)[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value.requestId))throw Error('수령 요청을 확인해 주세요.');return parseErgonCollectionObservation(await request('game.life.actions.collectionObservation',value),value.requestId);},
    async collectLifeAction(value:ErgonCollectionRequest){validateErgonCollectionRequest(value);const receipt=parseErgonActionReceipt(await request('game.life.actions.collect',value));if(receipt.id!==value.requestId)throw Error('다른 수령 요청의 응답이에요.');return receipt;},
    async collectionPolicy(accountId:string){if(!automationText(accountId))throw Error('계정을 확인해 주세요.');return parseErgonCollectionPolicy(await request('game.life.actions.collectionPolicy',{accountId}));},
    async revokeCollection(accountId:string){if(!automationText(accountId))throw Error('계정을 확인해 주세요.');const policy=parseErgonCollectionPolicy(await request('game.life.actions.revokeCollection',{accountId}));if(policy.granted)throw Error('수령 허용 해제를 확인하지 못했어요.');return policy;},
    async readLifeReference(kind:'crafting'|'altering',displayName:string){if(!['crafting','altering'].includes(kind)||typeof displayName!=='string'||!displayName.trim()||displayName.length>160||/[\x00-\x1f\x7f]/.test(displayName))throw Error('참고할 품목을 확인해 주세요.');return parseErgonReference(kind,displayName,await request('game.life.reference',{kind,displayName}));},
    async readLife<K extends ErgonReadKind>(kind:K):Promise<ErgonSnapshot<K>>{if(!validErgonReadKind(kind))throw Error('지원하지 않는 생활 조회예요.');await lifeCapabilities();return parseErgonSnapshot(kind,await request('game.life.read',{kind}));},
    async lifeActionCapabilities(){return parseErgonActionCapabilities(await request('game.life.actions.capabilities',null));},
    async setLifeContext(value:{accountId:string;characterId:string|null;accountLabel:string;characterLabel:string|null}):Promise<void>{if(!exactObject(value,['accountId','characterId','accountLabel','characterLabel'])||!value.accountId.trim()||!value.accountLabel.trim()||(value.characterId===null?value.characterLabel!==null:typeof value.characterId!=='string'||!value.characterId.trim()||typeof value.characterLabel!=='string'||!value.characterLabel.trim()))throw Error('계정과 캐릭터 선택을 확인해 주세요.');observationGeneration++;const result=await request('game.life.actions.context',value);if(!exactObject(result,['schemaVersion'])||result.schemaVersion!==1)throw Error('에르곤 작업 문맥을 확인하지 못했어요.');},
    async prepareLifeAction(value:{accountId:string;characterId:string;action:ErgonAction;displayName:string;additionalQuantity?:number;allowAutoStop?:boolean;craftCount?:number}):Promise<ErgonChallenge>{const extended=Object.hasOwn(value,'additionalQuantity')||Object.hasOwn(value,'allowAutoStop'),batch=Object.hasOwn(value,'craftCount'),keys=['accountId','characterId','action','displayName'];if(extended)keys.push('additionalQuantity','allowAutoStop');if(batch)keys.push('craftCount');if(!exactObject(value,keys)||!['gathering','altering','crafting','collect'].includes(String(value.action))||[value.accountId,value.characterId,value.displayName].some(text=>typeof text!=='string'||!text.trim())||extended&&(value.action!=='gathering'||typeof value.allowAutoStop!=='boolean'||!Number.isSafeInteger(value.additionalQuantity)||value.additionalQuantity!<1||value.additionalQuantity!>100)||batch&&(extended||value.action!=='crafting'||!Number.isSafeInteger(value.craftCount)||value.craftCount!<1||value.craftCount!>5))throw Error('작업할 품목과 캐릭터를 확인해 주세요.');return parseErgonChallenge(await request('game.life.actions.prepare',value));},
    async stopLifeAction(value:{requestId:string;accountId:string;characterId:string}):Promise<ErgonActionState>{if(!exactObject(value,['requestId','accountId','characterId'])||typeof value.requestId!=='string'||!/^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i.test(value.requestId)||[value.accountId,value.characterId].some(text=>typeof text!=='string'||!text.trim()||text.length>100))throw Error('중지할 작업과 캐릭터를 확인해 주세요.');return parseErgonActionState(await request('game.life.actions.stop',value));},
    async confirmLifeAction(nonce:string):Promise<ReturnType<typeof parseErgonActionReceipt>>{if(!/^[0-9a-f-]{36}$/i.test(nonce))throw Error('작업 확인 기한이 지났어요.');return parseErgonActionReceipt(await request('game.life.actions.confirm',{nonce}));},
    async cancelLifeAction(nonce:string):Promise<void>{if(!/^[0-9a-f-]{36}$/i.test(nonce))return;await request('game.life.actions.cancel',{nonce});},
    async lifeActionState():Promise<ErgonActionState>{return parseErgonActionState(await request('game.life.actions.state',null));},
    async lifeActionHistory(accountId:string){if(!accountId||accountId.length>100)throw Error('계정을 확인해 주세요.');const value=parseErgonActionHistory(await request('game.life.actions.history',{accountId}));if(value.records.some(row=>row.accountId!==accountId))throw Error('다른 계정의 기록이 섞였어요.');return value;},
    async playAlertSound():Promise<void>{await request('window.alert.sound',null);},
    async setWorkspace(expanded:boolean):Promise<{expanded:boolean}>{if(typeof expanded!=='boolean')throw Error('작업화면 모드를 확인해 주세요.');const value=await request('window.workspace',{expanded});if(!exactObject(value,['expanded'])||typeof value.expanded!=='boolean')throw Error('작업화면 상태를 확인하지 못했어요.');return {expanded:value.expanded};},
    async presentationState():Promise<DesktopPresentation>{return parseDesktopPresentation(await request('window.presentation.state',null));},
    async togglePresentation():Promise<DesktopPresentation>{return parseDesktopPresentation(await request('window.presentation.toggle',null));},
    async setPresentationPanel(open:boolean):Promise<DesktopPresentation>{if(typeof open!=='boolean')throw Error('창 패널 상태를 확인해 주세요.');return parseDesktopPresentation(await request('window.presentation.panel',{open}));},
    async fonts():Promise<string[]>{return parseInstalledFonts(await request('window.fonts.list',null));},
    async refreshFonts():Promise<string[]>{return parseInstalledFonts(await request('window.fonts.refresh',null));},
    async updateState():Promise<DesktopUpdateState>{return parseDesktopUpdateState(await request('window.update.state',null));},
    async updateCheck():Promise<DesktopUpdateState>{return parseDesktopUpdateState(await request('window.update.check',null));},
    async updatePrepare():Promise<DesktopUpdateState>{return parseDesktopUpdateState(await request('window.update.prepare',null));},
    async updateApply():Promise<DesktopUpdateState>{return parseDesktopUpdateState(await request('window.update.apply',null));},
    queueCapabilities,
    async workspaceCapabilities():Promise<void>{await queueCapabilities();if(workspaceEpoch===null||workspaceEpoch!==options.context()?.epoch)throw Error('상점·임무 저장을 사용하려면 IRIS를 정상 종료하고 최신 앱으로 다시 실행해 주세요.');},
    async addonState():Promise<DesktopAddonState>{return parseDesktopAddonState(await request('window.addon.state',null));},
    async setAddonPreferences(value:DesktopAddonPreferences):Promise<DesktopAddonState>{if(!exactObject(value,['dockSide','sameLayer'])||!['right','left','off'].includes(String(value.dockSide))||typeof value.sameLayer!=='boolean')throw Error('창 설정을 확인해 주세요.');return parseDesktopAddonState(await request('window.addon.preferences',value));},
    async drag():Promise<void>{await request('window.drag',null);},
    async minimize():Promise<void>{await request('window.minimize',null);},
    async setCloseDecision(open:boolean):Promise<void>{if(typeof open!=='boolean')throw Error('종료 상태를 확인해 주세요.');await request('window.decision',{open});},
    async gameStats():Promise<GameStats>{return parseGameStats(await request('game.stats.read',null));},
    async currencies():Promise<CurrencySnapshot>{return parseCurrencies(await request('game.currencies.read',null));},
    async loadCurrencyCache(accountId:string):Promise<CurrencyCacheView|null>{if(!automationText(accountId))throw Error('계정을 확인해 주세요.');const raw=await request('store.currencies.load',{accountId});return raw===null?null:parseCurrencyCache(raw,{environment:options.environment,accountId});},
    async refreshCurrencyCache(accountId:string):Promise<CurrencyCacheView>{if(!automationText(accountId))throw Error('계정을 확인해 주세요.');return parseCurrencyCache(await request('game.currencies.refreshCache',{accountId}),{environment:options.environment,accountId});},
    async load(): Promise<QueueSnapshot | null> {
      await queueCapabilities();
      const value = await request('store.load', null);
      if (value === null) return null;
      const snapshot = value as QueueSnapshot | undefined;
      if (!snapshot || snapshot.schemaVersion !== 3 || !Array.isArray(snapshot.entries)) throw Error('보관된 변경 형식이 달라요. 업데이트된 IRIS를 다시 실행해 주세요.');
      // The queue restore boundary performs the complete entry validation.
      return snapshot;
    },
    async replace(value: QueueSnapshot): Promise<void> {
      await queueCapabilities();
      if(value.entries.some(e=>e.kind==='workspace')&&(workspaceEpoch===null||workspaceEpoch!==options.context()?.epoch))throw Error('상점·임무 대기함은 최신 IRIS에서만 보관할 수 있어요.');
      await request('store.replace', value);
    },
    async hide(): Promise<void> { await request('window.hide', null); },
    async close(): Promise<void> { await request('window.close', null); },
    async overlayState():Promise<DesktopOverlayState>{return overlayState(await request('overlay.state',null));},
    async setClickThrough(enabled:boolean):Promise<DesktopOverlayState>{if(typeof enabled!=='boolean')throw Error('입력 설정을 확인해 주세요.');return overlayState(await request('overlay.input',{clickThrough:enabled}));},
    async setOpacityPercent(percent:number):Promise<DesktopOverlayState>{if(!Number.isInteger(percent)||percent<30||percent>100)throw Error('투명도는 30~100 사이로 설정해 주세요.');return overlayState(await request('overlay.opacity',{percent}));},
  };
}
