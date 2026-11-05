/**
 * Yol: Yazarlık çatısının haritası. Üstte dal seçici, altta seçili dalın üniteleri
 * bir patikadaki duraklar gibi. Açık ünitelerin dersleri istenen anda çalışılabilir.
 */
import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, defaultSettings, updateSettings } from '../db/db';
import { BRANCHES, DEFAULT_BRANCH, branchPrereqsMet, lessonFlow, skillById, unitById } from '../content';
import type { BranchDef } from '../content/types';
import { openUnitsFrom, unitReadiness, UNLOCK_AVG } from '../engine/unlock';
import { go } from '../lib/router';
import { Icon } from '../components/ui';
import { today } from '../lib/tr';

export default function PathScreen() {
  const settings = useLiveQuery(async () => ({ ...defaultSettings(), ...(await db.settings.get('main')) }), []);
  const progress = useLiveQuery(() => db.progress.toArray(), []) ?? [];
  const skills = useLiveQuery(() => db.skills.toArray(), []) ?? [];
  const tried = useLiveQuery(async () => new Set((await db.attempts.toArray()).map((a) => a.exerciseId)), []) ?? new Set<string>();
  const [picked, setPicked] = useState<string | null>(null);

  const season = settings?.seasonBranch ?? DEFAULT_BRANCH;
  const branch = BRANCHES.find((b) => b.id === (picked ?? season)) ?? BRANCHES[0];
  const done = new Set(progress.filter((p) => p.completed).map((p) => p.lessonId));
  const open = openUnitsFrom(done);

  return (
    <div className="fade">
      <div className="eyebrow">Yol</div>
      <h1>Yazarlık</h1>

      <div className="branch-picker" role="tablist" aria-label="Dallar">
        {BRANCHES.map((b) => (
          <button
            key={b.id}
            role="tab"
            aria-selected={b.id === branch.id}
            className={`chip ${b.id === branch.id ? 'on' : ''} ${b.available ? '' : 'dim'}`}
            onClick={() => setPicked(b.id)}
          >
            {b.id === season && <span className="season-dot" aria-label="bu mevsim" />}
            {b.short}
          </button>
        ))}
      </div>

      <BranchHeader branch={branch} season={season} done={done} />

      <BranchPath
        key={branch.id}
        branch={branch}
        open={open}
        progress={new Map(progress.map((p) => [p.lessonId, p]))}
        states={new Map(skills.map((s) => [s.id, s]))}
        tried={tried}
      />
    </div>
  );
}

function BranchHeader({ branch, season, done }: { branch: BranchDef; season: string; done: Set<string> }) {
  const [confirm, setConfirm] = useState(false);
  const prereqOk = branchPrereqsMet(branch, done);
  const missing = (branch.prerequisites ?? []).filter((uid) => !unitById.get(uid)?.lessons.every((l) => done.has(l.id)));

  return (
    <div style={{ margin: '18px 0 6px' }}>
      <div className="row between">
        <h2 style={{ margin: 0 }}>{branch.title}</h2>
        {branch.id === season && <span className="tag ember">bu mevsim</span>}
        {branch.elective && <span className="tag">seçmeli</span>}
      </div>
      <p className="muted small" style={{ marginTop: 6 }}>{branch.description}</p>

      {!branch.available ? (
        <div className="card soft small">
          Bu dalın iskeleti hazır ama dersleri henüz yazılmadı; o yüzden üniteler soluk ve içine girilemiyor. İçerik
          sırayla yazılıyor. Şimdilik dersler Hikâye dalında; Masa ise her zaman açık. Aşağıda bu dalda neler
          olacağını görebilirsin.
        </div>
      ) : branch.id !== season && !prereqOk ? (
        <div className="card soft small">
          Bu dal şunlar bitince açılır: {missing.map((m) => unitById.get(m)?.title).join(', ')}.
        </div>
      ) : branch.id !== season ? (
        <div className="card soft small">
          {confirm ? (
            <>
              Yeni dersler bundan sonra bu daldan gelecek. Tekrarlar bütün dallardan gelmeye devam eder; ilerlemen
              kaybolmaz.
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
            </>
          ) : (
            <button className="linkish" onClick={() => setConfirm(true)}>Bu mevsim bu dala çalış</button>
          )}
        </div>
      ) : null}
    </div>
  );
}

function BranchPath({
  branch,
  open,
  progress,
  states,
  tried,
}: {
  branch: BranchDef;
  open: Set<string>;
  progress: Map<string, { completed: boolean; index: number }>;
  states: Map<string, import('../db/db').SkillState>;
  tried: Set<string>;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  if (branch.units.length === 0) return <div className="empty">Bu dalın üniteleri henüz planlanmadı.</div>;

  // İlk bitmemiş açık ünite "şu anki durak"
  const currentUnit = branch.units.find(
    (u) => open.has(u.id) && (u.lessons.some((l) => !progress.get(l.id)?.completed) || (u.atelier && !tried.has(u.atelier.id))),
  );

  return (
    <div className="path">
      {branch.units.map((u, i) => {
        const isOpen = open.has(u.id);
        const prev = i > 0 ? branch.units[i - 1] : undefined;
        const prevDone = prev ? prev.lessons.filter((l) => progress.get(l.id)?.completed).length : 0;
        const lessonsDone = u.lessons.filter((l) => progress.get(l.id)?.completed).length;
        const allDone = isOpen && u.lessons.length > 0 && lessonsDone === u.lessons.length && (!u.atelier || tried.has(u.atelier.id));
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
                  {u.draft
                    ? 'Yakında'
                    : isOpen
                      ? `${lessonsDone}/${u.lessons.length} ders`
                      : `Sırası gelince açılır · göz atılabilir${lessonsDone ? ` · ${lessonsDone}/${u.lessons.length} ders` : ''}`}
                </div>
              </button>
              {show && (
                <div className="rise" style={{ marginTop: 10 }}>
                  <p className="small muted">{u.summary}</p>
                  {u.draft ? (
                    <ul className="small faint" style={{ paddingLeft: 18 }}>
                      {u.plannedLessons?.map((t) => <li key={t}>{t}</li>)}
                    </ul>
                  ) : (
                    <>
                      {!isOpen && (
                        <div className="card soft small" style={{ marginBottom: 6 }}>
                          {prev ? (
                            <>
                              Sırası gelince kendiliğinden açılır: “{prev.title}” ünitesinin dersleri bitince ({prevDone}/
                              {prev.lessons.length} bitti) ve temel becerilerinde ortalama {UNLOCK_AVG}'a ulaşınca (şu an{' '}
                              {Math.round(unitReadiness(prev, states).avg)}).
                            </>
                          ) : (
                            <>Bu dalın ön koşulları tamamlanınca kendiliğinden açılır.</>
                          )}{' '}
                          Beklemek zorunda değilsin: aşağıdaki derslere şimdi de girebilirsin. Yaptıkların kaydedilir ve
                          becerilerine işlenir; günlük ders ise sırayı izlemeye devam eder.
                        </div>
                      )}
                      {u.lessons.map((l) => {
                        const p = progress.get(l.id);
                        const total = lessonFlow(l).length;
                        return (
                          <button key={l.id} className="lesson-row" onClick={() => go(`/session?lesson=${l.id}`)}>
                            <span className={`state ${p?.completed ? 'done' : p?.index ? 'part' : ''}`}>{p?.completed ? '✓' : ''}</span>
                            <span className="grow">{l.title}</span>
                            <span className="tiny faint">
                              {p?.completed ? 'tekrar et' : p?.index ? `${p.index}/${total}` : !isOpen ? 'göz at' : ''}
                            </span>
                          </button>
                        );
                      })}
                      {u.atelier && (
                        <button className="lesson-row" onClick={() => go(`/session?atelier=${u.id}`)}>
                          <span className={`state ${tried.has(u.atelier.id) ? 'done' : ''}`}>{tried.has(u.atelier.id) ? '✓' : ''}</span>
                          <span className="grow">Atölye görevi</span>
                        </button>
                      )}
                    </>
                  )}
                  {u.keySkills.length > 0 && (
                    <div className="tiny faint" style={{ marginTop: 10 }}>
                      Temel beceriler: {u.keySkills.map((k) => skillById.get(k)?.name ?? k).join(', ')}
                      {isOpen && !u.draft && <> · ortalama {Math.round(ready.avg)}/{UNLOCK_AVG}</>}
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
