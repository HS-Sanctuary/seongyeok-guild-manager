export type UserRole =
  | "길드마스터"
  | "부마스터"
  | "부마스터 대행"
  | "cbt테스터"
  | "길드원";

export interface NavItem {
  kr: string;
  en: string;
  sub: string;
  path: string;
  comingSoon?: boolean;
}

export interface AccountPreset {
  id: string;
  nickname: string;
  role: UserRole | string;
  alias?: string;
  borderColor?: string;
  theme?: string;
}

export interface UserAccount {
  id: string;
  nickname: string;
  code: string;
  role: UserRole;
  created_at?: string;
  equipped_title?: string;
  titles?: string[];
}

export interface Sticker {
  id: string;
  url: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  opacity: number;
  frameStyle: string;
  zIndex: number;
  isLocked: boolean;
}

export const navItems: NavItem[] = [
  { kr: "케리그마", en: "KERYGMA", sub: "공지사항", path: "/kerygma" },
  { kr: "크로노스", en: "KRONOS", sub: "캐릭터 관리", path: "/character" },
  { kr: "아고라", en: "AGORA", sub: "길드 라운지", path: "/lounge" },
  { kr: "엠포리온", en: "EMPORION", sub: "거래소 정보", path: "/market", comingSoon: true },
  { kr: "시낙시스", en: "SYNAXIS", sub: "파티 매칭", path: "/party" },
  { kr: "그노시스", en: "GNOSIS", sub: "정보 공유", path: "/gnosis", comingSoon: true },
  { kr: "로고스", en: "LOGOS", sub: "문의/건의", path: "/support" }
];
