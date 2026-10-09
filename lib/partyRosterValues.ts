import type {NexusClassItem} from '@/components/party/types';

// Pure roster values shared by the browser engine and authenticated server writes.
export function resolvePartyRole(jobName: string, catalog?: NexusClassItem[]): NexusClassItem['role'] {
  if (!jobName) return '근딜';
  const job=jobName.trim();
  const found=catalog?.find(c=>c.name.toLowerCase()===job.toLowerCase());
  if (found?.role && (found.role!=='서포터' || job==='음유시인')) return found.role;
  if (job==='대검전사') return '근딜';
  if (['빙결술사','빙결','기사','전사','성기사','수호자'].some(k=>job.includes(k))) return '탱커';
  if (['사제','수도사','힐러','성직자','구원자'].some(k=>job.includes(k))) return '힐러';
  if (job==='음유시인') return '서포터';
  if (['궁수','석궁사수','마법사','화염술사','전격술사','장궁병','악사','암흑술사'].some(k=>job.includes(k))) return '원딜';
  return '근딜';
}
export function parsePartyStat(value: unknown): number {
  if (typeof value==='number') return value;
  if (!value) return 0;
  const number=parseInt(String(value).replace(/,/g,'').trim(),10);
  return Number.isNaN(number)?0:number;
}
