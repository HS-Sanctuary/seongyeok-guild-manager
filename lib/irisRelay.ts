import {validateIrisEdit,type IrisEditResult} from '@/lib/irisKronosWrite';
const local = 'http://127.0.0.1:4317/api/connection/browser/';

export function parseIrisConnectionFragment(origin:string,hash:string) {
  if (!['http://localhost:3000','http://127.0.0.1:3000'].includes(origin)) return null;
  const params=new URLSearchParams(hash.replace(/^#/,''));
  const token=params.get('connect'),rawGeneration=params.get('g');
  if (params.getAll('connect').length !== 1 || params.getAll('g').length !== 1 ||
    !token || !/^[A-Za-z0-9_-]{43,128}$/.test(token) || !rawGeneration || !/^[1-9]\d*$/.test(rawGeneration)) return null;
  const generation=Number(rawGeneration);
  return Number.isSafeInteger(generation) ? {token,generation} : null;
}
type Options = {
  token:string;generation:number;onStatus:(message:string)=>void;
  fetcher?:typeof fetch;
  schedule?:(fn:()=>void,delay:number)=>ReturnType<typeof setTimeout>;
  cancel?:(handle:ReturnType<typeof setTimeout>)=>void;
  onWriteAllowed?:(allowed:boolean)=>void;
  now?:()=>number;
};
class RelayError extends Error {
  constructor(public status:number,public endpoint='') { super('Relay request failed'); }
}

// Browser session cookies stay on same-origin API calls; never send them to loopback.
export class IrisRelay {
  private active=false;
  private epoch=0;
  private controller=new AbortController();
  private timer:ReturnType<typeof setTimeout>|undefined;
  private writeAllowed=false;
  private writeRevision=0;
  private owned:{accountId:string;characters:{id:unknown;nickname:unknown;job?:unknown;alias?:unknown}[]}|null=null;
  private nextRefresh=0;
  private summarySelection='';
  private fetcher:typeof fetch;
  private schedule:NonNullable<Options['schedule']>;
  private cancel:NonNullable<Options['cancel']>;
  constructor(private options:Options) {
    if (!/^[A-Za-z0-9_-]{43,128}$/.test(options.token) || !Number.isSafeInteger(options.generation) || options.generation < 1) throw new Error('Invalid connection');
    // Window.fetch cannot use this IrisRelay instance as its Web IDL receiver.
    this.fetcher=options.fetcher ?? ((...args:Parameters<typeof fetch>)=>fetch(...args));
    this.schedule=options.schedule ?? ((fn,delay)=>setTimeout(fn,delay));
    this.cancel=options.cancel ?? (handle=>clearTimeout(handle));
  }
  private async request(url:string,method='GET',body?:unknown,signal=this.controller.signal) {
    const serialized=body===undefined ? undefined : JSON.stringify(body);
    if(serialized!==undefined && new TextEncoder().encode(serialized).byteLength>65536) throw new RelayError(413,url);
    const abort=new AbortController();
    const relayAbort=()=>abort.abort();
    if (signal.aborted) abort.abort(); else signal.addEventListener('abort',relayAbort,{once:true});
    const timeout=setTimeout(()=>abort.abort(),8000);
    const loopback=url.startsWith(local);
    try {
      const response=await this.fetcher(url,{method,signal:abort.signal,cache:'no-store',redirect:'error',
        credentials:loopback ? 'omit' : 'same-origin',
        headers:{...(loopback ? {'X-IRIS-Browser':this.options.token} : {}),...(body === undefined ? {} : {'Content-Type':'application/json'})},
        body:serialized,
      });
      if (!response.ok) throw new RelayError(response.status,url);
      return await response.json();
    } catch(error) {
      if (error instanceof RelayError) throw error;
      throw new RelayError(0,url);
    } finally {clearTimeout(timeout);signal.removeEventListener('abort',relayAbort);}
  }
  async start() {
    if (this.active) return;
    this.active=true;this.controller=new AbortController();const epoch=++this.epoch;
    this.owned=null;this.nextRefresh=0;this.summarySelection='';
    try {
      await this.request(local+'consent','POST',{generation:this.options.generation});
      if (this.active && epoch===this.epoch) await this.cycle(epoch);
    } catch(error) { if (epoch===this.epoch && this.active) await this.fail(error); }
  }
  async setWriteAllowed(allowed:boolean){
    if(!this.active)throw new Error('읽기 연결을 먼저 시작해 주세요.');
    const revision=++this.writeRevision;
    this.writeAllowed=false;this.options.onWriteAllowed?.(false);
    try {
      await this.request(local+'write-consent','POST',{generation:this.options.generation,allowed});
    } catch(error) {
      // If acknowledgment is lost, the native permission may still be enabled.
      // Stop renewing its lease and best-effort disconnect; never silently keep polling.
      if(this.active && revision===this.writeRevision) await this.fail(error);
      throw error;
    }
    if(this.active&&revision===this.writeRevision){this.writeAllowed=allowed;this.options.onWriteAllowed?.(allowed);}
  }
  private async saveEdits(epoch:number,accountId:string,characterId:string,selectionVersion:number){
    const revision=this.writeRevision;
    const current=()=>this.active&&epoch===this.epoch&&this.writeAllowed&&revision===this.writeRevision;
    const batch=await this.request(local+'edits');
    if(!current()||batch.generation!==this.options.generation||!Array.isArray(batch.edits)||batch.edits.length>200)return;
    for(const request of batch.edits){
      if(!current())return;
      const {reconcileOnly,...raw}=request;
      let edit;try{edit=validateIrisEdit(raw);}catch{throw new RelayError(400,local+'edits');}
      if(typeof reconcileOnly!=='boolean'||edit.accountId!==accountId||edit.characterId!==characterId||edit.generation!==this.options.generation||edit.selectionVersion!==selectionVersion)throw new RelayError(409,local+'edits');
      const selection=await this.request(local+'selection');
      if(!current()||!selection.writeAllowed||selection.generation!==edit.generation||selection.selectionVersion!==selectionVersion||selection.selectedId!==characterId)return;
      let rejected=false;
      if(!reconcileOnly){
        try{await this.request('/api/iris/kronos','POST',{edit});}
        catch(error){if(error instanceof RelayError && [401,403].includes(error.status))throw error;rejected=error instanceof RelayError&&error.status!==0;}
      }
      if(!current())return;
      let result:IrisEditResult={requestId:edit.requestId,status:'unknown',completed:null};
      let verified;
      try{
        const latest=await this.request('/api/iris/kronos?characterId='+encodeURIComponent(characterId));
        if(latest.accountId!==accountId||latest.characterId!==characterId)throw new RelayError(403);
        verified=latest;
        const row=latest.details?.tasks?.[edit.category]?.find((r:{id:string})=>r.id===edit.taskId);
        const samePeriod=latest.writeContext?.periodKeys?.[edit.category]===edit.periodKey;
        if(row&&Number.isSafeInteger(row.completed)){
          result={requestId:edit.requestId,status:!samePeriod?'conflict':row.completed===edit.desiredCompleted?'saved':row.completed!==edit.baseCompleted?'conflict':rejected||reconcileOnly?'failed':'unknown',completed:row.completed};
        }
      }catch(error){if(error instanceof RelayError && [401,403].includes(error.status))throw error;}
      const after=await this.request(local+'selection');
      if(!current()||!after.writeAllowed||after.generation!==edit.generation||after.selectionVersion!==selectionVersion||after.selectedId!==characterId)return;
      // Long serial batches must not age out the 60s display lease. This is the
      // same verified GET, not another polling loop or a replay of the POST.
      if(verified){
        await this.request(local+'summary','PUT',{generation:edit.generation,selectionVersion,characterId,summary:verified.summary,details:verified.details,writeContext:verified.writeContext});
        if(!current())return;
      }
      await this.request(local+'edits/results','PUT',{generation:edit.generation,selectionVersion,results:[result]});
      if(!current())return;
    }
  }
  private async cycle(epoch:number) {
    const current=()=>this.active && epoch===this.epoch;
    let sendingSummary=false;
    try {
      const now=(this.options.now??Date.now)();
      const refresh=!this.owned||now>=this.nextRefresh;
      if(refresh){
        const owned=await this.request('/api/iris/characters');
        if (!current()) return;
        if (typeof owned.accountId !== 'string' || !Array.isArray(owned.characters) || owned.characters.length > 100) throw new RelayError(503);
        const characters=owned.characters.map((c:{id:unknown;nickname:unknown;job?:unknown;alias?:unknown})=>({id:c.id,nickname:c.nickname,job:c.job,alias:c.alias}));
        await this.request(local+'characters','PUT',{generation:this.options.generation,accountId:owned.accountId,characters});
        if (!current()) return;
        this.owned={accountId:owned.accountId,characters};
        this.nextRefresh=now+15000;
      }
      const owned=this.owned!;
      const characters=owned.characters;
      const selection=await this.request(local+'selection');
      if (!current()) return;
      if (selection.generation !== this.options.generation) throw new RelayError(403);
      if (selection.selectedId !== null) {
        if (!characters.some((c:{id:unknown})=>String(c.id)===selection.selectedId)) throw new RelayError(403);
        const selected=selection.selectedId+':'+selection.selectionVersion;
        if(refresh||selected!==this.summarySelection){
        const data=await this.request('/api/iris/kronos?characterId='+encodeURIComponent(selection.selectedId));
        if (!current()) return;
        if (data.accountId !== owned.accountId || data.characterId !== selection.selectedId) throw new RelayError(403);
        sendingSummary=true;
        await this.request(local+'summary','PUT',{generation:this.options.generation,selectionVersion:selection.selectionVersion,characterId:selection.selectedId,summary:data.summary,
          ...(data.details===undefined ? {} : {details:data.details}),...(data.writeContext===undefined?{}:{writeContext:data.writeContext})});
        sendingSummary=false;
        if (!current()) return;
        this.summarySelection=selected;
        }
        if(this.writeAllowed&&selection.writeAllowed)await this.saveEdits(epoch,owned.accountId,selection.selectedId,selection.selectionVersion);
        if (!current()) return;
        this.options.onStatus('선택한 캐릭터의 크로노스 요약을 전달하고 있어요.');
      } else {this.summarySelection='';this.options.onStatus('아이리스 오버레이에서 현재 게임 캐릭터를 선택·확인해 주세요.');}
    } catch(error) {
      if (!current()) return;
      if (sendingSummary && error instanceof RelayError && error.status===409) this.options.onStatus('캐릭터 선택 변경을 확인하고 있어요.');
      else {await this.fail(error);return;}
    }
    // Only loopback selection/edit checks run each second. Database reads retain
    // their 15s refresh cadence; submitted writes still revalidate on the server.
    if (current()) this.timer=this.schedule(()=>this.cycle(epoch),1000);
  }
  private async fail(error:unknown) {
    const failure=error instanceof RelayError ? error : new RelayError(503);
    const loopback=failure.endpoint.startsWith(local);
    const stage=failure.endpoint.endsWith('/consent') ? '승인' : failure.endpoint.endsWith('/characters') ? '캐릭터 목록' : '요약';
    const message=failure.status===413 ? '아이리스 전달 정보가 크기 제한을 넘었어요. 연결을 중단했으니 관리자에게 알려 주세요.' : loopback
      ? failure.status===0
        ? `아이리스 ${stage} 연결에 응답이 없어요. 아이리스 실행 상태와 브라우저의 로컬 연결 허용 여부를 확인한 뒤 ‘새 읽기 연결’을 시작해 주세요.`
        : failure.status===403
          ? '아이리스 연결 승인이 만료되거나 바뀌었어요. 아이리스에서 ‘새 읽기 연결’을 시작해 주세요.'
          : `아이리스 ${stage} 전달 중 연결 상태가 맞지 않아요 (${failure.status}). 아이리스에서 ‘새 읽기 연결’을 시작해 주세요.`
      : failure.status===401
        ? '생텀 로그인이 만료됐어요. 생텀에 로그인한 뒤 아이리스에서 ‘새 읽기 연결’을 시작해 주세요.'
        : failure.status===403
          ? '생텀에서 선택한 캐릭터의 접근 권한을 확인하지 못했어요. 본인 캐릭터로 다시 연결해 주세요.'
          : `생텀 캐릭터·크로노스 조회에 실패했어요 (${failure.status || '응답 없음'}). 로그인 만료로 확인된 것은 아니에요. 잠시 뒤 ‘새 읽기 연결’을 시작해 주세요.`;
    this.options.onStatus(message);
    await this.stop();
  }
  async stop() {
    if (!this.active) return;
    this.active=false;this.epoch++;this.controller.abort();
    this.writeRevision++;this.writeAllowed=false;this.options.onWriteAllowed?.(false);
    if (this.timer !== undefined) {this.cancel(this.timer);this.timer=undefined;}
    // Best effort; if unreachable, the native state independently expires after 60s.
    try {await this.request(local+'disconnect','POST',{},new AbortController().signal);} catch { /* No successful disconnect claim. */ }
  }
}
