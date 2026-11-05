/**
 * Yol: öğrenme dalları ve dersler. Yazılmış bütün dersler açıktır; uygulama yalnızca bir sıra önerir
 * ("şu anki durak"). İçeriği henüz yazılmamış dallar seçicide görünmez; altta "Geliştiriliyor" listesindedir.
 */
import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, defaultSettings, updateSettings } from '../db/db';
import { BRANCHES, DEFAULT_BRANCH, lessonFlow, skillById } from '../content';
import type { BranchDef } from '../content/types';
import { go } from '../lib/router';
import { today } from '../lib/tr';

export default function PathBody() {
  const settings = useLiveQuery(async () => ({ ...defaultSettings(), ...(await db.settings.get('main')) }), []);
  const progress = useLiveQuery(() => db.progress.toArray(), []) ?? [];
  const tried = useLiveQuery(async () => new Set((await db.attempts.toArray()).map((a) => a.exerciseId)), []) ?? new Set<string>();
  const [picked, setPicked] = useState<string | null>(null);

  const ready = BRANCHES.filter((b) => b.available && (!b.elective || settings?.electives.includes(b.id)));
  const upcoming = BRANCHES.filter((b) => !b.available);
  const season = settings?.seasonBranch ?? DEFAULT_BRANCH;
  const branch = ready.find((b) => b.id === (picked ?? season)) ?? ready[0];

  return (
    <div>
      {ready.length > 1 && (
        <div className="branch-picker" role="tablist" aria-label="Dallar">
          {ready.map((b) => (
            <button key={b.id} role="tab" aria-selected={b.id === branch.id} className={`chip ${b.id === branch.id ? 'on' : ''}`} onClick={() => setPicked(b.id)}>
              {b.id === season && <span className="season-dot" aria-label="bu mevsim" />}
              {b.short}
            </button>
          ))}
        </div>
      )}

      {branch && (
        <>
          <BranchHeader branch={branch} season={season} />
          <BranchPath key={branch.id} branch={branch} progress={new Map(progress.map((p) => [p.lessonId, p]))} tried={tried} />
        </>
      )}

      {upcoming.length > 0 && (
        <section style={{ marginTop: 28 }}>
          <div className="eyebrow">Geliştiriliyor</div>
          <p className="small muted">
            Bu dalların dersleri henüz yazılmadı; hazır oldukça yukarıya eklenecekler. Şimdilik Eserlerim ve Kütüphanem her
            konuda serbestçe kullanılabilir.
          </p>
          <div className="list">
            {upcoming.map((b) => (
              <details key={b.id} className="item">
                <summary style={{ cursor: 'pointer' }}>
                  <span style={{ fontFamily: 'var(--serif)' }}>{b.title}</span>
                </summary>
                <p className="small muted" style={{ margin: '6px 0' }}>{b.description}</p>
                <ul className="small faint" style={{ paddingLeft: 18, margin: 0 }}>
                  {b.units.map((u) => (
                    <li key={u.id}>{u.title}</li>
                  ))}
                </ul>
              </details>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function BranchHeader({ branch, season }: { branch: BranchDef; season: string }) {
  const [confirm, setConfirm] = useState(false);
  return (
    <div style={{ margin: '14px 0 6px' }}>
      <div className="row between">
        <h2 style={{ margin: 0 }}>{branch.title}</h2>
        {branch.id === season && <span className="tag ember">bu mevsim</span>}
      </div>
      <p className="muted small" style={{ marginTop: 6 }}>{branch.description}</p>
      {branch.id !== season && (
        <div className="small">
          {confirm ? (
            <div className="card soft">
              Günlük derste yeni adımlar bundan sonra bu daldan gelir; tekrarlar bütün dallardan sürer.
              <div className="row" style={{ marginTop: 10 }}>
                <button className="btn small ghost" onClick={() => setConfirm(false)}>Vazgeç</button>
                <button
                  className="btn small primary"
                  onClick={async () => {
                    await updateSettings({ seasonBranch: branch.id, seasonStartedAt: today() });
                    setConfirm(false);
                  }}
                >
                  Evet, bu dala geç
                </button>
              </div>
            </div>
          ) : (
            <button className="linkish" onClick={() => setConfirm(true)}>Günlük dersi bu daldan al</button>
          )}
        </div>
      )}
    </div>
  );
}

function BranchPath({
  branch,
  progress,
  tried,
}: {
  branch: BranchDef;
  progress: Map<string, { completed: boolean; index: number }>;
  tried: Set<string>;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  // Önerilen durak: ilk bitmemiş (yazılmış) ünite
  const currentUnit = branch.units.find(
    (u) => !u.draft && (u.lessons.some((l) => !progress.get(l.id)?.completed) || (u.atelier && !tried.has(u.atelier.id))),
  );

  return (
    <div className="path">
      {branch.units.map((u) => {
        const lessonsDone = u.lessons.filter((l) => progress.get(l.id)?.completed).length;
        const allDone = !u.draft && u.lessons.length > 0 && lessonsDone === u.lessons.length && (!u.atelier || tried.has(u.atelier.id));
        const cls = u.draft ? 'draft' : u.id === currentUnit?.id ? 'current open' : allDone ? 'done open' : 'open';
        const show = expanded === u.id || (expanded === null && u.id === currentUnit?.id);
        return (
          <div key={u.id} className={`stop ${cls}`}>
            <div className="marker" aria-hidden>{u.number}</div>
            <div className="body">
              <button
                onClick={() => setExpanded(show ? '' : u.id)}
                className="stop-head"
                aria-expanded={show}
              >
                <div style={{ fontFamily: 'var(--serif)', fontSize: '1.1rem' }}>{u.title}</div>
                <div className="small muted">
                  {u.draft ? 'Geliştiriliyor' : `${lessonsDone}/${u.lessons.length} ders${u.id === currentUnit?.id ? ' · önerilen durak' : ''}`}
                </div>
              </button>
              {show && (
                <div className="rise" style={{ marginTop: 10 }}>
                  <p className="small muted">{u.summary}</p>
                  {u.draft ? (
                    <>
                      <p className="tiny faint">Bu ünitenin dersleri henüz yazılmadı. Planlanan dersler:</p>
                      <ul className="small faint" style={{ paddingLeft: 18 }}>
                        {u.plannedLessons?.map((t) => <li key={t}>{t}</li>)}
                      </ul>
                    </>
                  ) : (
                    <>
                      {u.lessons.map((l) => {
                        const p = progress.get(l.id);
                        const total = lessonFlow(l).length;
                        return (
                          <button key={l.id} className="lesson-row" onClick={() => go(`/session?lesson=${l.id}`)}>
                            <span className={`state ${p?.completed ? 'done' : p?.index ? 'part' : ''}`} aria-hidden>{p?.completed ? '✓' : ''}</span>
                            <span className="grow">{l.title}</span>
                            <span className="tiny faint">{p?.completed ? 'tamamlandı · tekrar et' : p?.index ? `${p.index}/${total}` : ''}</span>
                          </button>
                        );
                      })}
                      {u.atelier && (
                        <button className="lesson-row" onClick={() => go(`/session?atelier=${u.id}`)}>
                          <span className={`state ${tried.has(u.atelier.id) ? 'done' : ''}`} aria-hidden>{tried.has(u.atelier.id) ? '✓' : ''}</span>
                          <span className="grow">Atölye görevi</span>
                        </button>
                      )}
                    </>
                  )}
                  {u.keySkills.length > 0 && (
                    <div className="tiny faint" style={{ marginTop: 10 }}>
                      Çalışılan beceriler: {u.keySkills.map((k) => skillById.get(k)?.name ?? k).join(', ')}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
