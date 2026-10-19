export type ClassGroup = { name: string; classes: string[] };
export const DEFAULT_CLASS_GROUPS: ClassGroup[] = [
  { name: "전사 계열", classes: ["전사", "대검전사", "검술사", "기사"] },
  { name: "마법사 계열", classes: ["마법사", "화염술사", "빙결술사", "전격술사"] },
  { name: "궁수 계열", classes: ["궁수", "장궁병", "석궁사수"] },
  { name: "힐러 계열", classes: ["힐러", "사제", "수도사", "암흑술사"] },
  { name: "음유시인 계열", classes: ["음유시인", "댄서", "악사"] },
  { name: "도적 계열", classes: ["도적", "격투가", "듀얼블레이드"] },
];
