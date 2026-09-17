export interface PollOption {
  id: string;
  text: string;
  votes: number;
  voters?: string[];
}

export interface PollData {
  title: string;
  options: PollOption[];
  allowMultiple: boolean;
  endDate: string;
  isAnonymous: boolean;
  userVotes?: string[];
}

export interface CommentItem {
  id: number;
  notice_id?: number;
  author: string;
  content: string;
  created_at: string;
  parent_id?: number | null;
  parentId?: number | null;
  children?: CommentItem[];
}

export interface Notice {
  id: number;
  type: string;
  title: string;
  content: string;
  author: string;
  is_pinned: boolean;
  link?: string;
  created_at: string;
  poll?: PollData;
  likes?: number;
  dislikes?: number;
  userReaction?: 'like' | 'dislike' | null;
}

export const CATEGORIES = [
  "전체",
  "길드 공지사항",
  "길드 이벤트",
  "생텀 공지사항",
  "생텀 업데이트",
  "생텀 가이드",
  "모비노기 공식",
];

export const LINK_ONLY_CATEGORIES = ["생텀 가이드", "모비노기 공식"];