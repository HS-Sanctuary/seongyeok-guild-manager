import Link from 'next/link';
import IrisBrandMark from '@/components/iris/IrisBrandMark';
import download from '@/public/IRIS/downloads/download.json';
import {IRIS_VERSION_LABEL, IRIS_UPDATE_NOTES_HREF} from '@/lib/irisRelease';

const steps = [
  { title: 'AI 커넥터 켜기', body: '마비노기 모바일 인게임 설정의 게임 탭에서 "마비노기 모바일 AI 커넥터 beta"를 켜주세요!' },
  { title: '압축 풀기', body: '다운로드한 ZIP을 폴더에 모두 압축 해제해 주세요.' },
  { title: 'IRIS.exe 실행', body: '압축을 푼 폴더에서 IRIS.exe를 실행해 주세요.' },
  { title: '생텀 로그인', body: '생텀 계정으로 로그인하고 사용할 캐릭터를 선택하세요.' },
];
const panel = 'rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)]';
const summary = 'cursor-pointer rounded-lg py-4 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]';
const link = 'font-medium underline decoration-[var(--accent)] underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]';

export default function IrisDownloadPage() {
  const release = /^[a-f0-9]{64}$/.test(download.sha256)
    && Number.isSafeInteger(download.sizeBytes) && download.sizeBytes > 0
    && Number.isFinite(Date.parse(download.createdAtUtc)) ? download : null;

  return (
    <section aria-labelledby="iris-download-title" className="mx-auto max-w-5xl space-y-7 px-3 py-6 leading-relaxed break-keep text-[var(--text-main)] [overflow-wrap:anywhere] md:px-6 md:py-10">
      <Link href="/" className={`inline-flex items-center gap-2 text-sm ${link}`}><span aria-hidden="true">←</span> 생텀으로 돌아가기</Link>

      <div className="grid min-w-0 gap-6 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] md:items-center">
        <header className="min-w-0 space-y-4">
          <IrisBrandMark className="h-16 w-16" />
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="rounded-full bg-[color-mix(in_srgb,var(--accent)_12%,var(--panel))] px-3 py-1 font-semibold">IRIS {IRIS_VERSION_LABEL}</span>
            <span className="rounded-full bg-[var(--inner-box)] px-3 py-1">Windows x64</span>
          </div>
          <h1 id="iris-download-title" className="text-2xl font-bold leading-tight md:text-3xl">IRIS for SANCTUM</h1>
          <p className="text-lg font-semibold">게임 옆의 작은 생텀.</p>
          <p className="text-[var(--text-sub)]">크로노스에서 숙제를 확인하고, 시낙시스에서 파티에 참여하세요. 게임 옆에 두고 사용하는 Windows 애드온 바예요.</p>
          <Link href={IRIS_UPDATE_NOTES_HREF} className={`inline-flex text-sm ${link}`}>업데이트 노트 보기 →</Link>
        </header>

        <div className={`${panel} min-w-0 space-y-4 p-5 md:p-6`}>
          <h2 className="text-lg font-bold">지금 시작해 보세요</h2>
          <p className="text-sm text-[var(--text-sub)]">대부분의 PC에서는 추가 설치 없이 압축을 풀고 실행하면 돼요.</p>
          {release ? <>
            <a href="/IRIS/downloads/IRIS-beta.zip" download className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-3 font-bold text-[var(--accent-fg)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]">
              <span aria-hidden="true">↓</span> 베타 ZIP 다운로드
            </a>
            <p className="text-sm text-[var(--text-sub)]">Windows x64 · {(release.sizeBytes / 1024 / 1024).toFixed(1)} MB · 미서명 베타</p>
          </> : <p role="status">다운로드 파일을 준비하고 있어요. 준비가 완료되면 이곳에서 받을 수 있어요.</p>}
          <p className="border-t border-[var(--panel-border)] pt-4 text-sm">관리자 권한·Node.js·개발 서버는 필요하지 않아요.</p>
        </div>
      </div>

      <section aria-labelledby="iris-launch-title" className="space-y-3">
        <h2 id="iris-launch-title" className="text-lg font-bold">실행은 이렇게, 네 단계면 끝나요</h2>
        <ol className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {steps.map((step, index) => <li key={step.title} className={`${panel} min-w-0 space-y-3 p-5`}>
            <span aria-hidden="true" className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--accent)_12%,var(--panel))] text-sm font-bold">{index + 1}</span>
            <h3 className="font-bold">{step.title}</h3>
            <p className="text-sm text-[var(--text-sub)]">{step.body}</p>
          </li>)}
        </ol>
      </section>

      <aside aria-labelledby="iris-safety-title" className={`${panel} space-y-3 border-l-4 border-l-[var(--accent)] p-5`}>
        <h2 id="iris-safety-title" className="font-bold">실행 전 알아두세요</h2>
        <p className="text-sm">IRIS는 코드 서명이 없는 무료 베타입니다. Windows 보안 경고나 실행 차단이 발생할 수 있으니, 안내와 알려진 제한을 확인한 뒤 다운로드·실행 여부를 직접 선택해 주세요.</p>
        <p className="text-sm">출처와 아래 파일 확인값을 확인하고, <strong>보안 프로그램을 끄지 마세요.</strong> 차단되거나 문제가 생기면 사용을 중단하고 한설에게 알려주세요.</p>
        <p className="text-sm">베타에서는 일부 길드버스 운영·이전 요청 확인 버튼의 확인창 연결이 남아 있어요. 반응이 없으면 <Link href="/party" className={link}>생텀 웹 시낙시스</Link>에서 처리하고, 같은 요청을 반복하지 마세요.</p>
      </aside>

      <section aria-labelledby="iris-help-title" className="space-y-3">
        <h2 id="iris-help-title" className="text-lg font-bold">필요할 때만 확인하세요</h2>
        <div className={`${panel} divide-y divide-[var(--panel-border)] px-5`}>
          <details>
            <summary className={summary}>추가 설치가 필요하다는 오류가 나요</summary>
            <div className="space-y-3 pb-5 text-sm">
              <p>IRIS 화면에는 Microsoft Edge WebView2 Runtime이 필요해요. Windows 11에는 기본 포함되고, 대부분의 Windows 10에도 이미 설치돼 있어요.</p>
              <p>없다는 오류가 나올 때만 <a href="https://developer.microsoft.com/microsoft-edge/webview2/" target="_blank" rel="noopener noreferrer" className={link}>Microsoft 공식 안내 (새 창)</a>에서 설치해 주세요.</p>
            </div>
          </details>
          <details>
            <summary className={summary}>게임 정보는 어떻게 읽나요?</summary>
            <p className="pb-5 text-sm">게임의 기존 공식 생활 커넥터와 CLI를 그대로 사용해요. 이미 쓰고 있다면 다시 설치하지 않아요. 게임과 CLI는 이 다운로드에 포함하지 않으며, 게임 설치 경로가 다르면 동봉된 README를 참고해 주세요.</p>
          </details>
          <details>
            <summary className={summary}>로그인과 업데이트 안내</summary>
            <div className="space-y-3 pb-5 text-sm">
              <p>브라우저 로그인은 공유하지 않아요. IRIS에서 생텀 계정으로 따로 로그인해 주세요.</p>
              <p>업데이트 전에는 기존 IRIS를 정상 종료해 주세요. 미저장 데이터를 보호하는 <strong>보호 대기 기록은 지우지 마세요.</strong></p>
            </div>
          </details>
          {release ? <details>
            <summary className={summary}>파일 확인값 보기</summary>
            <div className="space-y-3 pb-5 text-sm">
              <p>다운로드한 ZIP의 SHA-256 확인값이에요. 파일이 같은지 확인할 때 사용해 주세요.</p>
              <code className="block rounded-xl bg-[var(--inner-box)] p-3 [overflow-wrap:anywhere]">{release.sha256}</code>
            </div>
          </details> : null}
        </div>
        <p className="text-sm text-[var(--text-sub)]">다른 PC의 설치·화면 배율·장시간 사용 검증은 아직 남아 있어요. 앱 기능은 운영 생텀의 배포 상태를 따라요.</p>
      </section>
    </section>
  );
}
