/** Original IRIS vector rendered in the active SANCTUM theme, not bitmap colors. */
export default function IrisBrandMark({ className = 'h-12 w-12', colorClass = 'text-[var(--accent)]' }: { className?: string; colorClass?: string }) {
  const mask = 'url("/IRIS/logo/IRIS%20%EB%A1%9C%EA%B3%A0%20%EB%A7%88%ED%81%AC.svg")';
  return (
    <span aria-hidden="true" className={`inline-flex shrink-0 ${colorClass} ${className}`}>
      <span data-iris-mark className="h-full w-full bg-current" style={{
        maskImage: mask, WebkitMaskImage: mask,
        maskSize: 'contain', WebkitMaskSize: 'contain',
        maskPosition: 'center', WebkitMaskPosition: 'center',
        maskRepeat: 'no-repeat', WebkitMaskRepeat: 'no-repeat',
      }} />
    </span>
  );
}
