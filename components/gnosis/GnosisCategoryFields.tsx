"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { DEFAULT_CLASS_GROUPS } from "@/lib/gnosisClassGroups";
import { GNOSIS_COMBAT_CATEGORIES, GNOSIS_LIFE_CATEGORIES, gnosisCategoryLabel, type GnosisSection } from "@/lib/gnosisCategories";
import { useGnosisNavigation } from "@/hooks/useGnosisNavigation";
import GnosisMark from "./GnosisMark";

const GENERIC: Record<string, string> = { "전체": "전체 지식", "클래스": "클래스", "전투": "전투", "생활": "생활", "패션": "패션", "악보": "악보 지식", "기타": "기타 지식" };
export default function GnosisCategoryFields({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const { items } = useGnosisNavigation();
  const [groups, setGroups] = useState(DEFAULT_CLASS_GROUPS);
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const { data, error } = await supabase.from("nexus_classes").select("*");
        if (cancelled || error || !data) return;
        const next = DEFAULT_CLASS_GROUPS.map(group => ({ ...group, classes: [...group.classes] }));
        const known = new Set(next.flatMap(group => group.classes));
        for (const row of data) {
          if (typeof row.name !== "string" || !row.name || known.has(row.name)) continue;
          const name = typeof (row.group_name || row.category) === "string" ? row.group_name || row.category : "신규 계열";
          let group = next.find(group => group.name === name);
          if (!group) { group = { name, classes: [] }; next.push(group); }
          group.classes.push(row.name); known.add(row.name);
        }
        setGroups(next);
      } catch { /* Existing groups remain available offline. */ }
    })();
    return () => { cancelled = true; };
  }, []);
  const label = gnosisCategoryLabel(value);
  const section: GnosisSection = groups.some(group => group.classes.includes(value)) ? "클래스" : GNOSIS_COMBAT_CATEGORIES.includes(value) ? "전투" : GNOSIS_LIFE_CATEGORIES.includes(value) ? "생활" : items.some(item => item.key === label) ? label as GnosisSection : "기타";
  const selected = items.find(item => item.key === section)!;
  return <div className="gnosis-category-fields">
    <label><span><GnosisMark name={selected.icon} />분야</span><select value={section} onChange={event => onChange(event.target.value === "클래스" ? "전사" : event.target.value === "전투" ? GNOSIS_COMBAT_CATEGORIES[0] : event.target.value === "생활" ? GNOSIS_LIFE_CATEGORIES[0] : GENERIC[event.target.value])}>{items.map(item => <option key={item.key} value={item.key}>{item.label}</option>)}</select></label>
    {["클래스", "전투", "생활"].includes(section) && <label><span>세부 분류</span><select value={value} onChange={event => onChange(event.target.value)}>
      <option value={GENERIC[section]}>{selected.label} 전체</option>
      {section === "클래스" ? groups.map(group => <optgroup key={group.name} label={group.name}>{group.classes.map(name => <option key={name}>{name}</option>)}</optgroup>) : (section === "전투" ? GNOSIS_COMBAT_CATEGORIES : GNOSIS_LIFE_CATEGORIES).map(name => <option key={name}>{name}</option>)}
    </select></label>}
  </div>;
}
