/**
 * Eksiklerim: güçlü ve zayıf beceriler, sade bir görselle. Altında tek odak cümlesi.
 */
import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { MODULES, childrenOf, skillById, skillsOfUnit } from '../content';
import { displayMastery } from '../engine/mastery';
import { currentFocus } from '../engine/planner';
import { openUnitsFrom } from '../engine/unlock';
import { SkillBar } from '../components/ui';
import { today } from '../lib/tr';

export default function Gaps() {
  const skills = useLiveQuery(() => db.skills.toArray(), []) ?? [];
  const progress = useLiveQuery(() => db.progress.toArray(), []) ?? [];
  const [focus, setFocus] = useState<string>();
  useEffect(() => {
    void currentFocus().then(setFocus);
  }, [skills]);

  const states = new Map(skills.map((s) => [s.id, s]));
  const open = openUnitsFrom(new Set(progress.filter((p) => p.completed).map((p) => p.lessonId)));
  const mod = MODULES[0];
  const t = today();

  // Açık üniteler + bir sonraki ünite (önceden bilinen zayıflıklar görünsün)
  const units = mod.units.filter((u, i) => !u.draft && (open.has(u.id) || open.has(mod.units[i - 1]?.id)));
  const topSkills = (u: (typeof units)[number]) => {
    const ids = skillsOfUnit(u);
    const tops = new Set<string>();
    for (const id of ids) tops.add(skillById.get(id)?.parent ?? id);
    return [...tops];
  };

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

      {units.map((u) => (
        <div key={u.id} className="card soft" style={{ marginTop: 16, opacity: open.has(u.id) ? 1 : 0.65 }}>
          <div className="eyebrow">Ünite {u.number}{open.has(u.id) ? '' : ' · henüz kapalı'}</div>
          <h3>{u.title}</h3>
          {topSkills(u).map((id) => {
            const def = skillById.get(id)!;
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
      ))}

      {states.get('hk.imge') && (
        <div className="card soft" style={{ marginTop: 16, opacity: 0.75 }}>
          <div className="eyebrow">İleride</div>
          <SkillBar value={states.get('hk.imge')!.mastery} label={skillById.get('hk.imge')!.name} sub="Ünite 4'te asıl çalışılacak; şimdiden güçlü bir yanın." />
        </div>
      )}

      <p className="tiny faint" style={{ marginTop: 18 }}>
        Puanlar 0–100 arası ustalık tahminidir. Her cevap ve her değerlendirme onları biraz oynatır; tek bir kötü gün
        hiçbir şeyi silmez.
      </p>
    </div>
  );
}
