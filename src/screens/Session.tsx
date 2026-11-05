/**
 * Oturum: günlük ders (varsayılan), belirli bir ders (?lesson=…), atölye (?atelier=…)
 * ya da ek tur (?new=1). Adımlar tek tek gösterilir; her adım bitince kaydedilir,
 * böylece oturum yarıda bırakılıp sonra devam edilebilir.
 */
import { useEffect, useRef, useState } from 'react';
import { db, type SessionRecord, type SkillState } from '../db/db';
import { atelierPlan, buildLessonPlan, createCustomSession, getOrCreateTodaySession } from '../engine/planner';
import { completeStep, finishSession } from '../engine/record';
import { exerciseById, lessonById, skillById } from '../content';
import { isWriting } from '../content/types';
import { ConceptStep, ObjectiveStep } from '../components/Steps';
import WritingStep from '../components/WritingStep';
import { Icon } from '../components/ui';
import { go } from '../lib/router';

const ROLE_NOTE: Record<string, string> = {
  tekrar: 'Tekrar',
  destek: 'Küçük adım: bu beceriyi parçalara bölüyoruz',
  'atölye': 'Ünite atölyesi',
  yeni: '',
};

export default function Session({ query }: { query: URLSearchParams }) {
  const [session, setSession] = useState<SessionRecord | null>(null);
  const [idx, setIdx] = useState(0);
  const [finished, setFinished] = useState(false);
  const before = useRef<Map<string, number>>(new Map());
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    (async () => {
      before.current = new Map((await db.skills.toArray()).map((s) => [s.id, s.mastery]));
      let s: SessionRecord;
      const lesson = query.get('lesson');
      const atelier = query.get('atelier');
      if (lesson) s = await createCustomSession(buildLessonPlan(lesson));
      else if (atelier) s = await createCustomSession(atelierPlan(atelier));
      else s = await getOrCreateTodaySession(query.get('new') === '1');
      setSession(s);
      const first = s.plan.findIndex((p) => !s.done.includes(p.exerciseId));
      if (first < 0 || s.plan.length === 0) setFinished(true);
      else setIdx(first);
    })();
  }, [query]);

  if (!session) return <div className="app no-nav" />;

  const total = session.plan.length;

  const next = async () => {
    const item = session.plan[idx];
    // Bitmiş bir dersi yoldan yeniden çalışırken ilerleme kaydı değişmez (completeStep bunu korur)
    await completeStep(session.id, item.exerciseId, item.lessonId);
    const updated = { ...session, done: [...new Set([...session.done, item.exerciseId])] };
    setSession(updated);
    const nextIdx = session.plan.findIndex((p, i) => i > idx && !updated.done.includes(p.exerciseId));
    if (nextIdx < 0) {
      await finishSession(session.id!);
      setFinished(true);
    } else setIdx(nextIdx);
    window.scrollTo({ top: 0 });
  };

  if (finished) return <Summary session={session} before={before.current} />;

  const item = session.plan[idx];
  const ex = exerciseById.get(item.exerciseId);
  const progress = (session.done.length / Math.max(1, total)) * 100;

  return (
    <div>
      <div className="topbar">
        <button className="icon-btn" aria-label="Kapat" onClick={() => go('/today')}>
          <Icon.close />
        </button>
        <div className="grow progress">
          <div style={{ width: `${progress}%` }} />
        </div>
        <span className="tiny faint" style={{ minWidth: 36, textAlign: 'right' }}>
          {Math.min(idx + 1, total)}/{total}
        </span>
      </div>
      {item.lessonId && idx === session.plan.findIndex((p) => p.lessonId === item.lessonId) && (
        <div className="tiny faint" style={{ marginBottom: 10 }}>{lessonById.get(item.lessonId)?.title}</div>
      )}
      {ROLE_NOTE[item.role] && <div className="tag ember" style={{ marginBottom: 14 }}>{ROLE_NOTE[item.role]}</div>}

      {!ex ? (
        <div className="card">
          Bu adım içerikte bulunamadı (içerik güncellenmiş olabilir).
          <button className="btn block" style={{ marginTop: 12 }} onClick={next}>Atla</button>
        </div>
      ) : ex.type === 'concept' ? (
        <ConceptStep key={ex.id} ex={ex} onDone={next} />
      ) : isWriting(ex) ? (
        <WritingStep key={ex.id} ex={ex} sessionId={session.id} onDone={next} />
      ) : (
        <ObjectiveStep key={ex.id} ex={ex} sessionId={session.id} onDone={next} />
      )}
    </div>
  );
}

function Summary({ session, before }: { session: SessionRecord; before: Map<string, number> }) {
  const [after, setAfter] = useState<SkillState[]>([]);
  const [note, setNote] = useState('');
  useEffect(() => {
    void db.skills.toArray().then(setAfter);
  }, []);

  const touched = new Set(session.plan.flatMap((p) => exerciseById.get(p.exerciseId)?.skills ?? []));
  const changes = after
    .filter((s) => touched.has(s.id))
    .map((s) => ({ s, from: before.get(s.id) ?? 0, to: s.mastery }))
    .filter((c) => Math.abs(c.to - c.from) >= 0.5);

  const save = async () => {
    if (note.trim()) await db.journal.add({ date: new Date().toISOString(), text: note.trim(), sessionId: session.id });
    go('/today');
  };

  return (
    <div className="fade">
      <div className="eyebrow">Oturum bitti</div>
      <h2>Bugünlük bu kadar.</h2>
      {changes.length > 0 && (
        <div className="card soft small">
          {changes.map(({ s, from, to }) => (
            <div key={s.id} className="row between" style={{ padding: '6px 0' }}>
              <span>{skillById.get(s.id)?.name}</span>
              <span className={to >= from ? '' : 'faint'}>
                {Math.round(from)} → {Math.round(to)}
              </span>
            </div>
          ))}
        </div>
      )}
      <div style={{ marginTop: 22 }}>
        <div className="eyebrow">Günce</div>
        <p className="prose" style={{ marginBottom: 10 }}>Bugün ne öğrendin? Kendi cümlelerinle, bir iki cümle.</p>
        <textarea lang="tr" value={note} onChange={(e) => setNote(e.target.value)} style={{ minHeight: 120 }} placeholder="Bugün fark ettim ki…" />
      </div>
      <div className="bottom-spacer" />
      <div className="bottom-bar">
        <div className="inner">
          <button className="btn ghost" onClick={() => go('/today')}>Geç</button>
          <button className="btn primary" disabled={!note.trim()} onClick={save}>Günceye yaz</button>
        </div>
      </div>
    </div>
  );
}
