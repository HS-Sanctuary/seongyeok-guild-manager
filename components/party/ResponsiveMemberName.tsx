'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import styles from './GuildBusCard.module.css';

export function compactMemberAlias(fullName: string, alias?: string, tempAlias?: string, currentAlias?: string) {
  const saved = [currentAlias, alias, tempAlias].find(value => value?.trim() && !['EMPTY', 'NULL'].includes(value.trim()));
  return Array.from(saved?.trim() || fullName).slice(0, 3).join('');
}

export default function ResponsiveMemberName({ fullName, alias, tempAlias, currentAlias }: {
  fullName: string;
  alias?: string;
  tempAlias?: string;
  currentAlias?: string;
}) {
  const boxRef = useRef<HTMLSpanElement>(null);
  const probeRef = useRef<HTMLSpanElement>(null);
  const [fits, setFits] = useState(true);
  const shortName = compactMemberAlias(fullName, alias, tempAlias, currentAlias);

  useLayoutEffect(() => {
    const box = boxRef.current;
    const probe = probeRef.current;
    if (!box || !probe) return;
    let active = true;
    const measure = () => {
      if (active) setFits(probe.getBoundingClientRect().width <= box.getBoundingClientRect().width);
    };
    // Observe the unchanged full-name probe, not the selected label: switching
    // to an alias must not make the fit decision oscillate.
    const observer = new ResizeObserver(measure);
    observer.observe(box);
    observer.observe(probe);
    document.fonts.ready.then(measure);
    document.fonts.addEventListener('loadingdone', measure);
    return () => {
      active = false;
      observer.disconnect();
      document.fonts.removeEventListener('loadingdone', measure);
    };
  }, [fullName]);

  return (
    <span ref={boxRef} className={styles.responsiveName} title={fullName} aria-label={fullName}>
      <span className={styles.nameLabel}>{fits ? fullName : shortName}</span>
      <span ref={probeRef} className={styles.nameProbe} aria-hidden="true">{fullName}</span>
    </span>
  );
}
