export type IrisInformationNotice={key:string;scope:string;title:string;message:string;reporter?:string;createdAt:number;expiresAt:number|null;sound:boolean};
export type VisibleIrisNotice={notice:IrisInformationNotice;shownAt:number;deadline:number};
export function notificationRemaining(shownAt:number,now:number){const milliseconds=Math.max(0,Math.min(10000,10000-(now-shownAt)));return {milliseconds,fraction:milliseconds/10000};}
export function createIrisNotificationQueue(scope:string){
 let pending:IrisInformationNotice[]=[],visible:VisibleIrisNotice|null=null;const seen=new Set<string>();
 const expired=(notice:IrisInformationNotice,now:number)=>notice.expiresAt!==null&&notice.expiresAt<=now;
 return {
  push(notice:IrisInformationNotice){if(notice.scope!==scope||!notice.key||seen.has(notice.key)||!Number.isFinite(notice.createdAt)||notice.expiresAt!==null&&!Number.isFinite(notice.expiresAt))return;seen.add(notice.key);if(seen.size>1024)seen.delete(seen.values().next().value!);pending=[...pending,notice].slice(-4);},
  remove(key:string){pending=pending.filter(n=>n.key!==key);if(visible?.notice.key===key)visible=null;},
  dismiss(key:string){if(visible?.notice.key===key)visible=null;pending=pending.filter(n=>n.key!==key);},
  tick(now:number){pending=pending.filter(n=>!expired(n,now));if(visible&&now>=visible.deadline)visible=null;},
  show(now:number){this.tick(now);if(visible)return visible;const notice=pending.shift();if(notice)visible={notice,shownAt:now,deadline:now+10000};return visible;},
  state(){return {pending:[...pending],visible};}
 };
}
