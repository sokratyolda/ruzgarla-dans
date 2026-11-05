/**
 * Denemelerin kaydı ve beceri profiline işlenmesi.
 */
import { db, type AiFeedback, type Attempt } from '../db/db';
import { exerciseById, lessonById, lessonFlow } from '../content';
import type { ChoiceExercise, DiscernExercise, Exercise, MissingExercise, RubricItem, WritingExercise } from '../content/types';
import { applyScore, applyScores } from './mastery';
import { sm2 } from './srs';
import { today } from '../lib/tr';

/** Objektif soru cevabı: puanla, beceriyi ve soru kartını güncelle */
export async function recordObjective(
  ex: ChoiceExercise | DiscernExercise | MissingExercise,
  chosen: number,
  sessionId?: number,
): Promise<boolean> {
  const correct = chosen === ex.correct;
  const score = correct ? 1 : 0;
  await db.attempts.add({
    exerciseId: ex.id,
    date: new Date().toISOString(),
    response: chosen,
    score,
    skills: ex.skills,
    sessionId,
  });
  for (const s of ex.skills) await applyScore(s, score, 'objective', ex.difficulty ?? 2);

  // Soru kartı: yanlışsa yarın geri gelir; doğruysa aralık büyür
  const t = today();
  const card = await db.cards.get(ex.id);
  const base = card ?? { exerciseId: ex.id, due: t, interval: 0, ease: 2.5, reps: 0, lapses: 0 };
  const next = sm2(base, correct ? 4 : 1, t);
  await db.cards.put({
    exerciseId: ex.id,
    due: next.due,
    interval: next.interval,
    ease: next.ease,
    reps: next.reps,
    lapses: base.lapses + (correct ? 0 : 1),
  });
  return correct;
}

/** Öz-değerlendirme puanlarını (ölçüt → 0/1/2) beceri başına 0–1 puana çevirir */
export function selfToSkillScores(rubric: RubricItem[], selfScores: Record<string, number>): Record<string, number> {
  const acc: Record<string, number[]> = {};
  rubric.forEach((r, i) => {
    (acc[r.skill] ??= []).push((selfScores[i] ?? 0) / 2);
  });
  return Object.fromEntries(Object.entries(acc).map(([k, v]) => [k, v.reduce((a, b) => a + b, 0) / v.length]));
}

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

/**
 * Yazma denemesi kaydı.
 *  • aiFeedback varsa beceriler yapay zekâ puanıyla güncellenir.
 *  • Yoksa öz-değerlendirme (daha düşük ağırlıkla) uygulanır; `pending` ise
 *    deneme yapay zekâ kuyruğuna girer ve internet gelince ayrıca değerlendirilir.
 */
export async function recordWriting(args: {
  ex: WritingExercise;
  response: string | Record<string, string>;
  selfScores?: Record<string, number>;
  ai?: AiFeedback;
  pending: boolean;
  version?: number;
  rootId?: number;
  sessionId?: number;
}): Promise<number> {
  const { ex, response, selfScores, ai, pending, version = 1, rootId, sessionId } = args;
  let score = 0;
  if (ai) {
    const per = aiSkillScores(ex, ai);
    score = avg(Object.values(per));
    await applyScores(per, 'ai', ex.difficulty ?? 2);
  } else if (selfScores) {
    const per = selfToSkillScores(ex.rubric, selfScores);
    score = avg(Object.values(per));
    await applyScores(per, 'self', ex.difficulty ?? 2);
  }
  const attempt: Attempt = {
    exerciseId: ex.id,
    date: new Date().toISOString(),
    response,
    score,
    skills: ex.skills,
    version,
    rootId,
    selfScores,
    aiFeedback: ai,
    pendingReview: pending && !ai ? 1 : 0,
    sessionId,
  };
  return db.attempts.add(attempt);
}

/** Yapay zekâ puanlarını alıştırmanın becerileriyle eşleştirir (0–1) */
export function aiSkillScores(ex: Exercise, ai: AiFeedback): Record<string, number> {
  const out: Record<string, number> = {};
  for (const s of ai.skills) if (ex.skills.includes(s.skill)) out[s.skill] = Math.max(0, Math.min(100, s.score)) / 100;
  if (Object.keys(out).length === 0 && ai.skills.length) {
    // Model beklenmedik kimlik döndürdüyse ortalamayı birincil beceriye yaz
    out[ex.skills[0]] = avg(ai.skills.map((s) => s.score)) / 100;
  }
  return out;
}

/** Kuyruktaki bir denemeye sonradan gelen yapay zekâ değerlendirmesini işler */
export async function applyLateAi(attemptId: number, ai: AiFeedback) {
  const a = await db.attempts.get(attemptId);
  const ex = a && exerciseById.get(a.exerciseId);
  if (!a || !ex) return;
  const per = aiSkillScores(ex, ai);
  await applyScores(per, 'ai', ex.difficulty ?? 2);
  await db.attempts.update(attemptId, {
    aiFeedback: ai,
    pendingReview: 0,
    reviewError: undefined,
    score: avg(Object.values(per)),
  });
}

/** Oturumda bir adımı tamamlandı say; ders akışındaysa ilerlemeyi bir adım öteye taşı */
export async function completeStep(sessionId: number | undefined, exerciseId: string, lessonId?: string) {
  if (sessionId != null) {
    const s = await db.sessions.get(sessionId);
    if (s && !s.done.includes(exerciseId)) await db.sessions.update(sessionId, { done: [...s.done, exerciseId] });
  }
  if (!lessonId) return;
  const lesson = lessonById.get(lessonId);
  if (!lesson) return;
  const flow = lessonFlow(lesson);
  const idx = flow.findIndex((e) => e.id === exerciseId);
  const p = (await db.progress.get(lessonId)) ?? { lessonId, index: 0, completed: false };
  if (p.completed) return;
  // Akışta yalnızca ileri gidilir; tekrar edilen eski adımlar ilerlemeyi geri almaz
  if (idx >= p.index) {
    const index = idx + 1;
    const completed = index >= flow.length;
    await db.progress.put({ lessonId, index, completed, completedAt: completed ? new Date().toISOString() : undefined });
  }
}

export async function finishSession(sessionId: number) {
  await db.sessions.update(sessionId, { finishedAt: new Date().toISOString() });
}
