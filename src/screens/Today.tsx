import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, defaultSettings } from '../db/db';
import { buildDailyPlan, currentFocus, estimateMinutes, suggestNextBranch, type Frontier } from '../engine/planner';
import type { BranchDef } from '../content/types';
import { unitReadiness, UNLOCK_AVG } from '../engine/unlock';
import { weekStats } from '../engine/stats';
import { exerciseById, lessonById, skillById } from '../content';
import { DAY_NAMES_SHORT, formatDate, genitive, greeting, today } from '../lib/tr';
import { go } from '../lib/router';
import type { SessionRecord } from '../db/db';

const ROLE_LABEL: Record<string, string> = { yeni: 'yeni', tekrar: 'tekrar', destek: 'küçük adım', 'atölye': 'atölye' };

export default function Today() {
  const settings = useLiveQuery(async () => ({ ...defaultSettings(), ...(await db.settings.get('main')) }), []) ?? defaultSettings();
  const sessions = useLiveQuery(() => db.sessions.toArray(), []) ?? [];
  const skills = useLiveQuery(() => db.skills.toArray(), []) ?? [];
  const pending = useLiveQuery(() => db.attempts.where('pendingReview').equals(1).count(), []) ?? 0;
  const [preview, setPreview] = useState<{ plan: SessionRecord['plan']; frontier: Frontier } | null>(null);
  const [focus, setFocus] = useState<string | undefined>();
  const [nextBranch, setNextBranch] = useState<BranchDef | undefined>();

  const t = today();
  const todays = sessions.filter((s) => s.date === t);
  const open = todays.find((s) => !s.finishedAt && s.kind !== 'custom');
  const finishedToday = todays.some((s) => s.finishedAt && s.kind !== 'custom');

  useEffect(() => {
    void buildDailyPlan().then((p) => {
      setPreview({ plan: p.plan, frontier: p.frontier });
      if (p.frontier.kind === 'end') void suggestNextBranch(p.frontier.branch.id).then(setNextBranch);
      else setNextBranch(undefined);
    });
    void currentFocus().then(setFocus);
  }, [skills.length, sessions.length, settings.seasonBranch]);

  const stats = weekStats(sessions, settings.weeklyGoal);
  const focusSkill = focus ? skillById.get(focus) : undefined;
  const states = new Map(skills.map((s) => [s.id, s]));

  const plan = open?.plan ?? preview?.plan ?? [];
  const lessonTitle = (() => {
    const lid = plan.find((p) => p.lessonId)?.lessonId;
    return lid ? lessonById.get(lid)?.title : undefined;
  })();
  const counts = plan.reduce<Record<string, number>>((a, p) => ((a[p.role] = (a[p.role] ?? 0) + 1), a), {});

  return (
    <div className="fade">
      <div className="eyebrow">{formatDate(new Date().toISOString(), { weekday: 'long', day: 'numeric', month: 'long' })}</div>
      <h1>
        {greeting()}, {settings.name || 'yolcu'}.
      </h1>

      {/* Hafta */}
      <div className="card soft" style={{ marginTop: 18 }}>
        <div className="week">
          {stats.days.map((d, i) => (
            <div key={d.date} className={`d ${d.isToday ? 'today' : ''}`}>
              <div className={`dot ${d.done ? 'done' : ''}`} />
              {DAY_NAMES_SHORT[i]}
            </div>
          ))}
        </div>
        <div className="small muted center" style={{ marginTop: 12 }}>
          Bu hafta {stats.thisWeek}/{settings.weeklyGoal} gün
          {stats.streak >= 2 && <> · {stats.streak} haftadır ritimdesin</>}
        </div>
      </div>

      {/* Tek odak */}
      {focusSkill && (
        <div style={{ margin: '26px 4px 8px' }}>
          <div className="eyebrow">Şu sıralar en çok şuna çalışıyoruz</div>
          <div style={{ fontFamily: 'var(--serif)', fontSize: '1.25rem' }}>{focusSkill.name}</div>
          <div className="small muted">{focusSkill.description}</div>
        </div>
      )}

      {/* Bugünün dersi */}
      <div className="card ember" style={{ marginTop: 18 }}>
        {finishedToday && !open ? (
          <>
            <div className="eyebrow">Bugün</div>
            <h3>Bugünkü dersi bitirdin.</h3>
            <p className="small muted">
              Yeterli. Öğrendiğin şey yolda, uykuda yerine oturur. İstersen yine de kısa bir tur daha açabilirsin.
            </p>
            <button className="btn block" onClick={() => go('/session?new=1')}>Bir tur daha</button>
          </>
        ) : plan.length === 0 ? (
          <>
            <h3>Bugün için hazırlanacak bir şey kalmadı.</h3>
            <p className="small muted">Yeni üniteler yazıldıkça burada belirecek. Bu arada Yol Defteri'ne malzeme biriktirebilirsin.</p>
          </>
        ) : (
          <>
            <div className="eyebrow">Bugünün dersi{preview ? ` · ${preview.frontier.branch.short}` : ''}</div>
            <h3>{lessonTitle ?? (counts['atölye'] ? 'Atölye günü' : 'Güçlendirme turu')}</h3>
            <div className="small muted" style={{ marginBottom: 14 }}>
              {plan.length} adım · yaklaşık {estimateMinutes(plan)} dakika
              {Object.entries(counts).map(([r, n]) => (
                <span key={r}> · {n} {ROLE_LABEL[r]}</span>
              ))}
            </div>
            {open && (
              <div className="progress" style={{ marginBottom: 14 }}>
                <div style={{ width: `${(open.done.length / Math.max(1, open.plan.length)) * 100}%` }} />
              </div>
            )}
            <button className="btn primary block" onClick={() => go('/session')}>
              {open && open.done.length > 0 ? 'Kaldığın yerden devam' : 'Başla'}
            </button>
          </>
        )}
      </div>

      {preview?.frontier.kind === 'blocked' && preview.frontier.next && (
        <div className="card soft small" style={{ marginTop: 14 }}>
          <strong>Ünite {preview.frontier.next.number}: {preview.frontier.next.title}</strong> yolun ilerisinde. Kapısı,
          Ünite {genitive(preview.frontier.unit.number)} temel becerilerinde ortalama {UNLOCK_AVG}. Şu an{' '}
          {Math.round(unitReadiness(preview.frontier.unit, states).avg)}. Bu yüzden şimdilik güçlendirme yapıyoruz.
        </div>
      )}

      {preview?.frontier.kind === 'end' && (
        <div className="card soft small" style={{ marginTop: 14 }}>
          <strong>{preview.frontier.branch.title}</strong> dalının şimdiye kadar yazılmış bütün derslerini bitirdin.
          {preview.frontier.nextDraft && <> Sıradaki ünite (“{preview.frontier.nextDraft.title}”) yazılınca burada belirecek.</>}{' '}
          Şimdilik tekrarla güçlendiriyoruz.
          {nextBranch && (
            <div style={{ marginTop: 10 }}>
              Önerilen sonraki dal: <strong>{nextBranch.title}</strong>.{' '}
              <button className="linkish" onClick={() => go('/path')}>Yol'da gör</button>
            </div>
          )}
        </div>
      )}

      {pending > 0 && (
        <a className="list-link" href="#/writings" style={{ marginTop: 8 }}>
          <span className="tag ember">{pending}</span>
          <span className="small">yazın yapay zekâ değerlendirmesini bekliyor</span>
          <span className="chev">›</span>
        </a>
      )}

      <a className="list-link" href="#/notes?new=1">
        <span className="small">Yolda bir şey mi gördün? Yol Defteri'ne yaz.</span>
        <span className="chev">›</span>
      </a>

      {plan.length > 0 && !(finishedToday && !open) && (
        <details style={{ marginTop: 14 }}>
          <summary className="small faint" style={{ cursor: 'pointer', padding: '8px 0' }}>Bugünün adımlarını göster</summary>
          <div className="list small">
            {plan.map((p, i) => {
              const e = exerciseById.get(p.exerciseId);
              return (
                <div className="item row" key={p.exerciseId + i}>
                  <span className="faint">{i + 1}.</span>
                  <span className="grow">{e ? describe(e) : p.exerciseId}</span>
                  <span className={`tag ${p.role === 'destek' ? 'warn' : p.role === 'yeni' ? 'ember' : ''}`}>{ROLE_LABEL[p.role]}</span>
                </div>
              );
            })}
          </div>
        </details>
      )}
    </div>
  );
}

const TYPE_LABEL: Record<string, string> = {
  concept: 'Kavram kartı',
  choice: 'Soru',
  discern: 'Ayırt et',
  missing: 'Eksik unsuru bul',
  rewrite: 'Yeniden yaz',
  write: 'Kendi malzemenle yaz',
  video: 'Video düşüncesi',
};

export function describe(e: import('../content/types').Exercise) {
  const t = TYPE_LABEL[e.type];
  if (e.type === 'concept') return `${t}: ${e.title}`;
  if (e.type === 'write' && e.atelier) return 'Atölye görevi';
  return t;
}
