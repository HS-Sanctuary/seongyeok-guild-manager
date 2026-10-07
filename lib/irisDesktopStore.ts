import type { QueueSnapshot } from './irisDesktopQueue';

type Context = { epoch: number; environment: string };
export type DesktopOverlayState={clickThrough:boolean;shortcutsAvailable:boolean;opacityPercent:number};
function overlayState(value:unknown):DesktopOverlayState {
  const state=value as DesktopOverlayState|null;
  if(!state||typeof state.clickThrough!=='boolean'||typeof state.shortcutsAvailable!=='boolean'||!Number.isInteger(state.opacityPercent)||state.opacityPercent<50||state.opacityPercent>100||(state.clickThrough&&!state.shortcutsAvailable))throw Error('오버레이 상태를 확인해 주세요.');
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
  function request(method: 'store.load' | 'store.replace' | 'window.hide' | 'window.close' | 'overlay.state' | 'overlay.input' | 'overlay.opacity', payload: unknown): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const context = options.context();
      if (!context || context.environment !== options.environment || !Number.isSafeInteger(context.epoch) || context.epoch < 1 || sequence >= Number.MAX_SAFE_INTEGER) {
        reject(Error('보호된 대기함에 연결할 수 없어요.')); return;
      }
      const id = String(++sequence), epoch = context.epoch;
      const fail = () => Error('보호된 대기함 응답을 확인하지 못했어요. 변경을 보존하고 연결을 확인해 주세요.');
      let timer: ReturnType<typeof setTimeout>;
      const cleanup = () => { clearTimeout(timer); options.channel.removeEventListener('message', listener); };
      const listener = (event: Message) => {
        const value = event.data as Record<string, unknown> | null;
        if (!value || value.version !== 1 || value.id !== id) return;
        const current = options.context();
        if (value.epoch !== epoch || current?.epoch !== epoch || current.environment !== options.environment || value.ok !== true) {
          cleanup(); reject(fail()); return;
        }
        cleanup(); resolve(value.value);
      };
      options.channel.addEventListener('message', listener);
      timer = setTimeout(() => { cleanup(); reject(fail()); }, timeout);
      try { options.channel.postMessage({ version: 1, id, epoch, method, payload }); }
      catch { cleanup(); reject(fail()); }
    });
  }
  return {
    async load(): Promise<QueueSnapshot | null> {
      const value = await request('store.load', null);
      if (value === null) return null;
      const snapshot = value as QueueSnapshot | undefined;
      if (!snapshot || snapshot.schemaVersion !== 2 || !Array.isArray(snapshot.entries)) throw Error('보관된 변경 형식이 달라요. 업데이트된 IRIS를 다시 실행해 주세요.');
      // The queue restore boundary performs the complete entry validation.
      return snapshot;
    },
    async replace(value: QueueSnapshot): Promise<void> { await request('store.replace', value); },
    async hide(): Promise<void> { await request('window.hide', null); },
    async close(): Promise<void> { await request('window.close', null); },
    async overlayState():Promise<DesktopOverlayState>{return overlayState(await request('overlay.state',null));},
    async setClickThrough(enabled:boolean):Promise<DesktopOverlayState>{if(typeof enabled!=='boolean')throw Error('입력 설정을 확인해 주세요.');return overlayState(await request('overlay.input',{clickThrough:enabled}));},
    async setOpacityPercent(percent:number):Promise<DesktopOverlayState>{if(!Number.isInteger(percent)||percent<50||percent>100)throw Error('투명도는 50~100 사이로 설정해 주세요.');return overlayState(await request('overlay.opacity',{percent}));},
  };
}
