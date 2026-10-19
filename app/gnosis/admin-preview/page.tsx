import Link from "next/link";
import { notFound } from "next/navigation";
import GnosisNavigationEditor from "@/components/gnosis/GnosisNavigationEditor";
import "../../admin/admin.css";

export default function GnosisAdminPreview() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <main className="sanctum-admin mx-auto min-h-screen max-w-5xl space-y-4 p-4 text-[var(--text-main)]">
    <h1 className="text-lg font-bold">그노시스 분류 관리 · 로컬 미리보기</h1>
    <p className="text-sm text-[var(--text-sub)]">개발용 분류 편집 화면이에요. 운영 관리자 기능과 글 데이터에는 접근하지 않아요.</p>
    <GnosisNavigationEditor />
    <Link href="/gnosis" className="inline-block text-sm text-[var(--accent)] underline">게시판에서 확인하기 →</Link>
  </main>;
}
