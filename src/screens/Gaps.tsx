/**
 * Eksiklerim: güçlü ve zayıf beceriler, dal dal ve sade bir görselle.
 * En üstte tek odak cümlesi: "Şu sıralar en çok şuna çalışıyoruz".
 */
import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, defaultSettings, type SkillState } from '../db/db';
import { BRANCHES, DEFAULT_BRANCH, childrenOf, contentUnits, skillById, skillsOfUnit } from '../content';
import type { UnitDef } from '../content/types';
import { displayMastery } from '../engine/mastery';
import { currentFocus } from '../engine/planner';
import { openUnitsFrom } from '../engine/unlock';
import { SkillBar } from '../components/ui';
import { today } from '../lib/tr';

/** Ünitedeki becerilerin üst düzeyleri (alt beceriler üstlerinin altında gösterilir) */
const topSkills = (u: UnitDef) => {
  const tops = new Set<string>();
  for (const id of skillsOfUnit(u)) tops.add(skillById.get(id)?.parent ?? id);
  return [...tops];
};

export default function Gaps() {
  const skills = useLiveQuery(() => db.skills.toArray(), []) ?? [];
  const progress = useLiveQuery(() => db.progress.toArray(), []) ?? [];
  const settings = useLiveQuery(async () => ({ ...defaultSettings(), ...(await db.settings.get('main')) }), []);
  const [focus, setFocus] = useState<string>();
  useEffect(() => {
    void currentFocus().then(setFocus);
  }, [skills, settings?.seasonBranch]);

  const states = new Map(skills.map((s) => [s.id, s]));
  const open = openUnitsFrom(new Set(progress.filter((p) => p.completed).map((p) => p.lessonId)));
  const season = settings?.seasonBranch ?? DEFAULT_BRANCH;

  // Açık ünitesi olan dallar; mevsim dalı en üstte
  const groups = BRANCHES.map((b) => {
    const units = contentUnits(b);
    // Açık üniteler + hemen sonraki kilitli ünite (önceden bilinen zayıflıklar görünsün)
    const shown = units.filter((u, i) => open.has(u.id) || (i > 0 && open.has(units[i - 1].id)));
    return { branch: b, units: shown };
  })
    .filter((g) => g.units.some((u) => open.has(u.id)))
    .sort((a, b) => (a.branch.id === season ? -1 : b.branch.id === season ? 1 : a.branch.order - b.branch.order));

  const shownSkills = new Set(groups.flatMap((g) => g.units.flatMap((u) => [...topSkills(u), ...skillsOfUnit(u)])));
  // Henüz açılmamış dallarda bilinen becerilerin (ör. seviye tespitinden gelen güçlü imge)
  const ahead = skills
    .filter((s) => s.mastery > 0 && !shownSkills.has(s.id) && !skillById.get(s.id)?.parent)
    .sort((a, b) => b.mastery - a.mastery);

  const ranked = skills
    .filter((s) => s.practiced > 0 || s.mastery > 0)
    .filter((s) => childrenOf(s.id).length === 0)
    .sort((a, b) => b.mastery - a.mastery);
  const strongest = ranked.slice(0, 2);
  const focusSkill = focus ? skillById.get(focus) : undefined;

  return (
    <div className="fade">
      <div className="eyebrow">Eksiklerim</div>
      <h1>Nerede duruyorsun</h1>

      {focusSkill && (
        <div className="card ember" style={{ marginTop: 10 }}>
          <div className="eyebrow">Şu sıralar en çok şuna çalışıyoruz</div>
          <div style={{ fontFamily: 'var(--serif)', fontSize: '1.2rem' }}>{focusSkill.name}</div>
          <div className="small muted">{focusSkill.description}</div>
          {states.get(focusSkill.id)?.scaffold && (
            <div className="small" style={{ marginTop: 8 }}>
              Bu beceride son zamanlarda zorlandın. Onu küçük parçalara böldük; daha kolay adımlarla geri geleceğiz.
            </div>
          )}
        </div>
      )}

      {strongest.length > 0 && (
        <p className="small muted" style={{ marginTop: 16 }}>
          Güçlü yanın: {strongest.map((s) => skillById.get(s.id)?.name).join(' ve ')}.
        </p>
      )}

      {groups.map(({ branch, units }) => (
        <section key={branch.id} className="branch-group" style={{ marginTop: 22 }}>
          <div className="row between">
            <div className="eyebrow" style={{ margin: 0 }}>{branch.title}</div>
            {branch.id === season && <span className="tag ember">bu mevsim</span>}
          </div>
          {units.map((u) => (
            <UnitCard key={u.id} unit={u} isOpen={open.has(u.id)} states={states} />
          ))}
        </section>
      ))}

      {ahead.length > 0 && (
        <section className="branch-group" style={{ marginTop: 22 }}>
          <div className="eyebrow">İleride</div>
          <div className="card soft" style={{ opacity: 0.8 }}>
            <p className="small muted" style={{ marginBottom: 4 }}>
              Henüz açılmamış dallarda şimdiden bilinen yanların. Asıl çalışması o dallar açılınca.
            </p>
            {ahead.map((s) => (
              <SkillBar key={s.id} value={s.mastery} label={skillById.get(s.id)?.name ?? s.id} />
            ))}
          </div>
        </section>
      )}

      <p className="tiny faint" style={{ marginTop: 18 }}>
        Puanlar 0–100 arası ustalık tahminidir; bir not değil, motorun ders seçmek için tuttuğu iz. Her cevap ve her
        değerlendirme onları biraz oynatır; tek bir kötü gün hiçbir şeyi silmez.
      </p>
    </div>
  );
}

function UnitCard({ unit, isOpen, states }: { unit: UnitDef; isOpen: boolean; states: Map<string, SkillState> }) {
  const t = today();
  return (
    <div className="card soft" style={{ marginTop: 12, opacity: isOpen ? 1 : 0.65 }}>
      <div className="eyebrow">Ünite {unit.number}{isOpen ? '' : ' · henüz kapalı'}</div>
      <h3>{unit.title}</h3>
      {topSkills(unit).map((id) => {
        const def = skillById.get(id);
        if (!def) return null;
        const kids = childrenOf(id);
        const st = states.get(id);
        const due = st?.nextReview && st.nextReview <= t;
        return (
          <div key={id}>
            <SkillBar
              value={displayMastery(id, states)}
              label={<strong style={{ fontWeight: 600 }}>{def.name}</strong>}
              sub={kids.length === 0 ? (st?.scaffold ? 'küçük adımlarla çalışılıyor' : due ? 'tekrar zamanı' : undefined) : undefined}
            />
            {kids.length > 0 && (
              <div style={{ paddingLeft: 14, borderLeft: '1px solid var(--line)', marginBottom: 8 }}>
                {kids.map((k) => (
                  <SkillBar
                    key={k.id}
                    value={states.get(k.id)?.mastery ?? 0}
                    label={<span className="muted">{k.name}</span>}
                    sub={states.get(k.id)?.scaffold ? 'küçük adımlarla çalışılıyor' : undefined}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
