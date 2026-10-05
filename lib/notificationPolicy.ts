export type NotificationModule = 'kerygma' | 'kronos' | 'agora' | 'synaxis' | 'logos';
export type NotificationPreferences = Record<NotificationModule, boolean>;
export const NOTIFICATION_MODULES: {key: NotificationModule; label: string}[] = [
  {key:'kerygma',label:'케리그마'}, {key:'kronos',label:'크로노스'},
  {key:'agora',label:'아고라'}, {key:'synaxis',label:'시낙시스'}, {key:'logos',label:'로고스'},
];
export function normalizePreferences(value: unknown): NotificationPreferences {
  const raw = value && typeof value === 'object' ? value as Record<string,unknown> : {};
  return Object.fromEntries(NOTIFICATION_MODULES.map(({key})=>[key,raw[key] !== false])) as NotificationPreferences;
}
export function notificationEnabled(item: {type:string}, preferences:NotificationPreferences) {
  if (item.type.startsWith('운영')) return true;
  const category = NOTIFICATION_MODULES.find(({key})=>item.type.toLowerCase().startsWith(key));
  return preferences[category?.key ?? 'kerygma'];
}
export function visibleNotifications<T extends {id:number;type:string}>(items:T[], reads:number[], prefs:NotificationPreferences):T[] {
  const read = new Set(reads);
  return items.filter(item=>!read.has(item.id) && notificationEnabled(item,prefs));
}
export function mergeReadIds(previous:number[], next:number[]):number[] {
  return [...new Set([...previous,...next].filter(Number.isSafeInteger))];
}
export function preferenceStorageKey(nickname?:string) {return `sanctum_notification_preferences_${nickname || 'guest'}`;}
