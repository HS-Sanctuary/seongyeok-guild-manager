import Link from 'next/link';
import download from '@/public/IRIS/downloads/download.json';
export default function IrisDownloadPage(){
  let release:{sha256:string;sizeBytes:number;createdAtUtc:string}|null=null;
  if(/^[a-f0-9]{64}$/.test(download.sha256)&&Number.isSafeInteger(download.sizeBytes)&&download.sizeBytes>0&&Number.isFinite(Date.parse(download.createdAtUtc)))release=download;
  return <section className="mx-auto max-w-2xl space-y-5 p-4 sm:p-6 break-keep text-[var(--text-main)]">
    <header className="space-y-2"><h1 className="text-xl font-bold text-[var(--accent)]">IRIS for SANCTUM 베타</h1><p>게임 옆에서 크로노스와 시낙시스를 사용하는 Windows x64 애드온 바예요.</p></header>
    <div className="space-y-4 rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] p-4">
      {release?<><a href="/IRIS/downloads/IRIS-beta.zip" download className="inline-flex rounded-xl bg-[var(--accent)] px-5 py-3 font-bold text-[var(--accent-fg)]">베타 ZIP 다운로드</a><p className="text-sm">Windows x64 · {(release.sizeBytes/1024/1024).toFixed(1)} MB · 미서명 베타 후보</p><p className="text-sm break-words">SHA-256 확인값<br/><code className="[overflow-wrap:anywhere]">{release.sha256}</code></p></>:<p role="status">다운로드 파일을 준비하고 있어요. 준비가 완료되면 이곳에서 받을 수 있어요.</p>}
      <p>ZIP을 모두 압축 해제한 뒤 <strong>IRIS.exe</strong>를 실행해 주세요. 관리자 권한·Node.js·개발 서버는 필요하지 않아요.</p>
    </div>
    <div className="space-y-3 rounded-2xl border border-[var(--panel-border)] bg-[var(--inner-box)] p-4">
      <h2 className="font-bold">실행 전에 확인해 주세요</h2>
      <p>대부분의 PC에서는 추가 설치 없이 ZIP을 풀고 실행할 수 있어요. IRIS 화면은 Microsoft Edge WebView2 Runtime을 사용해요. Windows 11에는 기본 포함되고 대부분의 Windows 10에도 이미 설치돼 있어요. 없다는 오류가 나올 때만 <a href="https://developer.microsoft.com/microsoft-edge/webview2/" target="_blank" rel="noopener noreferrer" className="underline">Microsoft 공식 안내</a>에서 설치해 주세요.</p>
      <p>게임 정보를 읽을 때는 게임의 기존 공식 생활 커넥터와 CLI를 그대로 사용해요. 커넥터를 이미 쓰고 있다면 다시 설치하지 않아요. 게임이나 CLI는 다운로드에 포함하지 않으며, 다른 설치 경로만 동봉된 README를 참고해 주세요.</p>
      <p>현재 코드 서명 전이라 Windows 보안 경고가 나올 수 있어요. 출처와 확인값을 먼저 확인하고, 보안 프로그램을 끄지 마세요. 실행이 차단되면 한설에게 알려주세요.</p>
      <p>기본 브라우저의 로그인은 공유하지 않아요. 생텀 계정으로 따로 로그인해 주세요. 업데이트 전에는 기존 IRIS를 정상 종료하고, 보호 대기 기록은 지우지 마세요.</p>
      <p>베타에서는 일부 길드버스 운영·이전 요청 확인 버튼의 확인창 연결이 아직 남아 있어요. 버튼에 반응이 없으면 <Link href="/party" className="underline">생텀 웹 시낙시스</Link>에서 처리해 주세요. 같은 요청을 반복해서 보내지 마세요.</p>
      <p className="text-sm">다른 PC의 설치·화면 배율·장시간 사용 검증은 아직 남아 있어요. 앱 기능은 운영 생텀의 배포 상태를 따라요.</p>
    </div>
    <Link href="/" className="inline-block underline">생텀으로 돌아가기</Link>
  </section>;
}
