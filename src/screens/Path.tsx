/**
 * Yol: beceri haritası. Üniteler bir patikadaki duraklar gibi dizilir.
 * Açık ünitelerin dersleri seçilip istenen anda çalışılabilir.
 */
import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { MODULES, lessonFlow, skillById } from '../content';
import { openUnitsFrom, unitReadiness, UNLOCK_AVG } from '../engine/unlock';
import { go } from '../lib/router';
import { Icon } from '../components/ui';

export default function PathScreen() {
  const progress = useLiveQuery(() => db.progress.toArray(), []) ?? [];
  const skills = useLiveQuery(() => db.skills.toArray(), []) ?? [];
  const atelierDone = useLiveQuery(async () => new Set((await db.attempts.toArray()).map((a) => a.exerciseId)), []) ?? new Set<string>();
  const [expanded, setExpanded] = useState<string | null>(null);

  const pmap = new Map(progress.map((p) => [p.lessonId, p]));
  const open = openUnitsFrom(new Set(progress.filter((p) => p.completed).map((p) => p.lessonId)));
  const states = new Map(skills.map((s) => [s.id, s]));
  const mod = MODULES[0];

  // İlk bitmemiş açık ünite "şu anki durak"
  const currentUnit = mod.units.find((u) => open.has(u.id) && (u.lessons.some((l) => !pmap.get(l.id)?.completed) || (u.atelier && !atelierDone.has(u.atelier.id))));

  return (
    <div className="fade">
      <div className="eyebrow">Yol</div>
      <h1>{mod.title}</h1>
      <p className="muted small">{mod.description}</p>

      <div className="path">
        {mod.units.map((u) => {
          const isOpen = open.has(u.id);
          const lessonsDone = u.lessons.filter((l) => pmap.get(l.id)?.completed).length;
          const allDone = isOpen && u.lessons.length > 0 && lessonsDone === u.lessons.length && (!u.atelier || atelierDone.has(u.atelier.id));
          const cls = u.draft ? 'draft' : !isOpen ? 'locked' : u.id === currentUnit?.id ? 'current open' : allDone ? 'done open' : 'open';
          const ready = unitReadiness(u, states);
          const show = expanded === u.id || (expanded === null && u.id === currentUnit?.id);
          return (
            <div key={u.id} className={`stop ${cls}`}>
              <div className="marker">{u.number}</div>
              <div className="body">
                <button
                  onClick={() => setExpanded(show ? '' : u.id)}
                  style={{ all: 'unset', cursor: 'pointer', display: 'block', width: '100%' }}
                  aria-expanded={show}
                >
                  <div style={{ fontFamily: 'var(--serif)', fontSize: '1.1rem' }}>
                    {u.title} {!isOpen && !u.draft && <Icon.lock />}
                  </div>
                  <div className="small muted">
                    {u.draft ? 'Yakında' : isOpen ? `${lessonsDone}/${u.lessons.length} ders` : 'Kilitli'}
                  </div>
                </button>
                {show && (
                  <div className="rise" style={{ marginTop: 10 }}>
                    <p className="small muted">{u.summary}</p>
                    {u.draft ? (
                      <ul className="small faint" style={{ paddingLeft: 18 }}>
                        {u.plannedLessons?.map((t) => <li key={t}>{t}</li>)}
                      </ul>
                    ) : !isOpen ? (
                      <div className="card soft small">Önceki ünitenin dersleri bitince ve temel becerilerinde ortalama {UNLOCK_AVG}'a ulaşınca açılır.</div>
                    ) : (
                      <>
                        {u.lessons.map((l) => {
                          const p = pmap.get(l.id);
                          const total = lessonFlow(l).length;
                          return (
                            <button key={l.id} className="lesson-row" onClick={() => go(`/session?lesson=${l.id}`)}>
                              <span className={`state ${p?.completed ? 'done' : p?.index ? 'part' : ''}`}>{p?.completed ? '✓' : ''}</span>
                              <span className="grow">{l.title}</span>
                              <span className="tiny faint">{p?.completed ? 'tekrar et' : p?.index ? `${p.index}/${total}` : ''}</span>
                            </button>
                          );
                        })}
                        {u.atelier && (
                          <button className="lesson-row" onClick={() => go(`/session?atelier=${u.id}`)}>
                            <span className={`state ${atelierDone.has(u.atelier.id) ? 'done' : ''}`}>{atelierDone.has(u.atelier.id) ? '✓' : ''}</span>
                            <span className="grow">Atölye görevi</span>
                          </button>
                        )}
                      </>
                    )}
                    {/* Bir sonraki ünitenin kapısı */}
                    {isOpen && !u.draft && (
                      <div className="tiny faint" style={{ marginTop: 10 }}>
                        Temel beceriler: {u.keySkills.map((k) => skillById.get(k)?.name).join(', ')} · ortalama {Math.round(ready.avg)}/{UNLOCK_AVG}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <hr className="sep" />
      <div className="eyebrow">Sonraki modüller</div>
      {MODULES.filter((m) => !m.available).map((m) => (
        <div key={m.id} className="card soft" style={{ opacity: 0.7 }}>
          <div style={{ fontFamily: 'var(--serif)', fontSize: '1.05rem' }}>{m.title}</div>
          <div className="small muted">{m.description}</div>
        </div>
      ))}
    </div>
  );
}
