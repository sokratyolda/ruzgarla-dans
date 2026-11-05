/**
 * Gelişim: becerilerin puanla değil, kanıtla. Her beceri için ne yaptığın görünür:
 * tamamlanan alıştırmalar, yazılar, yeniden yazımlar, bu beceriyi uyguladığın eserler ve
 * kendi işaretin ("öğrendim" / "tekrar denemek istiyorum").
 *
 * Motor ders seçmek için arka planda bir tahmin tutar; o tahmin burada sayı olarak gösterilmez.
 */
import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Attempt, type SkillState } from '../db/db';
import { BRANCHES, childrenOf, contentUnits, exerciseById, skillById, skillsOfUnit } from '../content';
import type { UnitDef } from '../content/types';
import { isWriting } from '../content/types';
import { currentFocus } from '../engine/planner';
import { blankSkill } from '../engine/mastery';
import { daysBetween, formatDate, today } from '../lib/tr';

interface Evidence {
  exercises: number;
  writings: number;
  rewrites: number;
  drafts: number;
  last?: string;
}

function buildEvidence(attempts: Attempt[], draftSkills: string[][]): Map<string, Evidence> {
  const ev = new Map<string, Evidence>();
  const get = (id: string) => {
    let e = ev.get(id);
    if (!e) ev.set(id, (e = { exercises: 0, writings: 0, rewrites: 0, drafts: 0 }));
    return e;
  };
  for (const a of attempts) {
    const ex = exerciseById.get(a.exerciseId);
    for (const s of a.skills) {
      const e = get(s);
      if (ex && isWriting(ex)) {
        if ((a.version ?? 1) > 1) e.rewrites++;
        else e.writings++;
      } else e.exercises++;
      if (!e.last || a.date > e.last) e.last = a.date;
    }
  }
  for (const ds of draftSkills) for (const s of ds) get(s).drafts++;
  return ev;
}

const topSkills = (u: UnitDef) => {
  const tops = new Set<string>();
  for (const id of skillsOfUnit(u)) tops.add(skillById.get(id)?.parent ?? id);
  return [...tops];
};

export default function Progress() {
  const skills = useLiveQuery(() => db.skills.toArray(), []) ?? [];
  const attempts = useLiveQuery(() => db.attempts.toArray(), []) ?? [];
  const drafts = useLiveQuery(() => db.drafts.toArray(), []) ?? [];
  const progress = useLiveQuery(() => db.progress.toArray(), []) ?? [];
  const [focus, setFocus] = useState<string>();
  useEffect(() => {
    void currentFocus().then(setFocus);
  }, [skills, attempts.length]);

  const states = new Map(skills.map((s) => [s.id, s]));
  const evidence = buildEvidence(attempts, drafts.map((d) => d.skills ?? []));
  const done = new Set(progress.filter((p) => p.completed).map((p) => p.lessonId));
  const started = (u: UnitDef) =>
    u.lessons.some((l) => done.has(l.id) || progress.some((p) => p.lessonId === l.id && p.index > 0)) ||
    skillsOfUnit(u).some((s) => (evidence.get(s)?.exercises ?? 0) + (evidence.get(s)?.writings ?? 0) > 0);

  const totals = {
    lessons: progress.filter((p) => p.completed && !p.lessonId.startsWith('unit:')).length,
    writings: attempts.filter((a) => typeof a.response !== 'number' && (a.version ?? 1) === 1).length,
    rewrites: attempts.filter((a) => (a.version ?? 1) > 1).length,
    drafts: drafts.length,
  };
  const focusSkill = focus ? skillById.get(focus) : undefined;

  return (
    <div>
      {focusSkill && (
        <div className="card ember">
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

      <div className="stat-row" style={{ marginTop: 14 }}>
        <Stat n={totals.lessons} label="ders bitti" />
        <Stat n={totals.writings} label="yazı" />
        <Stat n={totals.rewrites} label="yeniden yazım" />
        <Stat n={totals.drafts} label="eser taslağı" />
      </div>

      <p className="tiny muted" style={{ marginTop: 12 }}>
        Burada not yok; yalnızca yaptıkların var. Bir beceriyi oturmuş sayıyorsan "Öğrendim", bir daha denemek istiyorsan
        "Tekrar" de: günlük ders buna göre ayarlanır.
      </p>

      {BRANCHES.filter((b) => b.available).map((b) => (
        <section key={b.id} style={{ marginTop: 22 }}>
          <div className="eyebrow">{b.title}</div>
          {contentUnits(b).map((u) =>
            started(u) ? (
              <div key={u.id} className="card soft" style={{ marginTop: 10 }}>
                <h3 style={{ marginBottom: 4 }}>{u.title}</h3>
                {topSkills(u).map((id) => {
                  const kids = childrenOf(id);
                  return (
                    <div key={id}>
                      <SkillRow id={id} state={states.get(id)} ev={evidence.get(id)} strong={kids.length > 0} />
                      {kids.length > 0 && (
                        <div style={{ paddingLeft: 14, borderLeft: '1px solid var(--line)' }}>
                          {kids.map((k) => (
                            <SkillRow key={k.id} id={k.id} state={states.get(k.id)} ev={evidence.get(k.id)} />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div key={u.id} className="row between small" style={{ padding: '10px 2px', borderBottom: '1px solid var(--line)' }}>
                <span className="muted">{u.title}</span>
                <span className="tiny faint">henüz başlamadın</span>
              </div>
            ),
          )}
        </section>
      ))}
    </div>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div className="stat">
      <div className="stat-n">{n}</div>
      <div className="tiny faint">{label}</div>
    </div>
  );
}

function SkillRow({ id, state, ev, strong }: { id: string; state?: SkillState; ev?: Evidence; strong?: boolean }) {
  const def = skillById.get(id);
  if (!def) return null;
  const t = today();
  const parts: string[] = [];
  if (ev?.exercises) parts.push(`${ev.exercises} alıştırma`);
  if (ev?.writings) parts.push(`${ev.writings} yazı`);
  if (ev?.rewrites) parts.push(`${ev.rewrites} yeniden yazım`);
  if (ev?.drafts) parts.push(`${ev.drafts} eserde`);
  const lastDays = ev?.last ? daysBetween(ev.last.slice(0, 10), t) : undefined;
  const due = state?.nextReview && state.nextReview <= t && (ev?.exercises || ev?.writings);

  const mark = async (m: 'ogrendim' | 'tekrar') => {
    const cur = state ?? blankSkill(id);
    await db.skills.put({ ...cur, selfMark: cur.selfMark === m ? undefined : m });
  };

  // Alt becerisi olan üst beceri yalnızca başlık olarak durur; işaretler alt becerilerde
  if (strong) {
    return (
      <div style={{ margin: '12px 0 4px' }}>
        <strong style={{ fontWeight: 600 }}>{def.name}</strong>
        <div className="tiny muted">{def.description}</div>
      </div>
    );
  }

  return (
    <div className="skill-row">
      <div className="row between" style={{ alignItems: 'flex-start' }}>
        <div style={{ minWidth: 0 }}>
          <div className="small" style={{ fontWeight: 600 }}>{def.name}</div>
          <div className="tiny faint">
            {parts.length ? parts.join(' · ') : 'henüz dokunmadın'}
            {lastDays != null && <> · son: {lastDays === 0 ? 'bugün' : lastDays === 1 ? 'dün' : `${lastDays} gün önce`}</>}
          </div>
          {(state?.scaffold || due) && (
            <div className="tiny" style={{ color: 'var(--ember)', marginTop: 2 }}>
              {state?.scaffold ? 'küçük adımlarla çalışılıyor' : 'tekrar zamanı geldi'}
            </div>
          )}
        </div>
      </div>
      <div className="row" style={{ gap: 6, marginTop: 6 }}>
        <button className={`chip compact ${state?.selfMark === 'ogrendim' ? 'on' : ''}`} aria-pressed={state?.selfMark === 'ogrendim'} onClick={() => mark('ogrendim')}>
          Öğrendim
        </button>
        <button className={`chip compact ${state?.selfMark === 'tekrar' ? 'on' : ''}`} aria-pressed={state?.selfMark === 'tekrar'} onClick={() => mark('tekrar')}>
          Tekrar denemek istiyorum
        </button>
      </div>
      {ev?.last && <span className="sr-only">Son çalışma {formatDate(ev.last)}</span>}
    </div>
  );
}
