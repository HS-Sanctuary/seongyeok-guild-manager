import type {Notice} from '@/types/kerygma';
import {IRIS_UPDATE_NOTES_TITLE} from '@/lib/irisRelease';

export type UpdateChannel = 'sanctum' | 'iris';

// The approved IRIS history is one accumulating system post, not a new DB type.
export function isIrisUpdate(notice: Pick<Notice, 'title' | 'type' | 'author'> | null | undefined): boolean {
  return notice?.type === '생텀 업데이트' && notice.author === 'SANCTUM 시스템' && (notice.title === IRIS_UPDATE_NOTES_TITLE || /^IRIS Beta (?:0|[1-9][0-9]{0,3})\.(?:0|[1-9][0-9]{0,3})\.(?:0|[1-9][0-9]{0,3}) 출시!$/.test(notice.title));
}
