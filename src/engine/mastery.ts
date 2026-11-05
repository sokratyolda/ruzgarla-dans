/**
 * Beceri profilinin güncellenmesi.
 *
 * Her deneme 0–1 arası bir puan üretir. Etiketli her beceri için:
 *   yeni = eski + α · (100·puan − eski)
 * α; kaynağın güvenilirliğine (objektif soru < öz-değerlendirme < yapay zekâ),
 * zorluğa ve becerinin kaç kez çalışıldığına göre ayarlanır. Böylece düşük puan
 * ustalığı düşürür, yüksek puan yükseltir; erken denemeler daha çok etkiler.
 *
 * Aynı anda SM-2 ile becerinin bir sonraki tekrar günü hesaplanır ve
 * "zorlanma" sayacı tutulur: üst üste iki zayıf sonuç → küçük adımlar kipi.
 */
import { db, type SkillState } from '../db/db';
import { skillById } from '../content';
import { sm2, scoreToQuality, SRS_START } from './srs';
import { today } from '../lib/tr';

export type ScoreSource = 'objective' | 'self' | 'ai';

const SOURCE_WEIGHT: Record<ScoreSource, number> = { objective: 0.6, self: 0.55, ai: 1 };

export const blankSkill = (id: string, mastery = 0): SkillState => ({
  id,
  moduleId: skillById.get(id)?.moduleId ?? 'hikaye',
  mastery,
  practiced: 0,
  interval: SRS_START.interval,
  ease: SRS_START.ease,
  reps: SRS_START.reps,
  struggle: 0,
  recover: 0,
  scaffold: false,
});

export async function getSkill(id: string): Promise<SkillState> {
  return (await db.skills.get(id)) ?? blankSkill(id);
}

/** Bir becerinin durumunu tek bir sonuçla günceller ve kaydeder. */
export async function applyScore(skillId: string, score: number, source: ScoreSource, difficulty = 2) {
  const s = await getSkill(skillId);
  const t = today();
  const base = 0.35 / (1 + s.practiced * 0.06);
  const diffFactor = difficulty === 1 ? 0.75 : difficulty === 3 ? 1.15 : 1;
  const alpha = Math.min(0.4, Math.max(0.1, base * SOURCE_WEIGHT[source] * diffFactor));
  // Kolay bir soruda tam puan bile ustalığı 85'in üstüne taşımaz: ustalık zor işte kanıtlanır.
  const ceiling = difficulty === 1 ? 85 : 100;
  const target = Math.min(ceiling, score * 100);
  let mastery = s.mastery + alpha * (target - s.mastery);
  mastery = Math.round(Math.max(0, Math.min(100, mastery)) * 10) / 10;

  // Aralıklı tekrar günde bir kez ilerler: aynı gün aynı beceriye gelen beş doğru cevap
  // tekrar gününü beş adım ileri atmamalı. Aynı gün gelen zayıf sonuç ise (unutma) yine işlenir.
  const quality = scoreToQuality(score);
  const sameDay = s.lastPracticed?.slice(0, 10) === new Date().toISOString().slice(0, 10) && s.nextReview != null;
  const next =
    sameDay && quality >= 3
      ? { interval: s.interval, ease: s.ease, reps: s.reps, due: s.nextReview! }
      : sm2({ interval: s.interval, ease: s.ease, reps: s.reps }, quality, t);

  let { struggle, recover, scaffold } = s;
  if (score < 0.5) {
    struggle += 1;
    recover = 0;
    if (struggle >= 2) scaffold = true;
  } else if (score >= 0.7) {
    struggle = 0;
    if (scaffold) {
      recover += 1;
      if (recover >= 2) {
        scaffold = false;
        recover = 0;
      }
    }
  }

  await db.skills.put({
    ...s,
    mastery,
    practiced: s.practiced + 1,
    lastPracticed: new Date().toISOString(),
    nextReview: next.due,
    interval: next.interval,
    ease: next.ease,
    reps: next.reps,
    struggle,
    recover,
    scaffold,
  });
}

/** Birden çok beceriye aynı puanı ya da beceri başına puanları uygular. */
export async function applyScores(scores: Record<string, number>, source: ScoreSource, difficulty = 2) {
  for (const [skill, score] of Object.entries(scores)) await applyScore(skill, score, source, difficulty);
}

/** Üst becerinin ustalığı: alt becerilerinin ortalaması (yoksa kendi değeri). */
export function displayMastery(skillId: string, states: Map<string, SkillState>): number {
  const kids = [...skillById.values()].filter((k) => k.parent === skillId);
  if (kids.length === 0) return states.get(skillId)?.mastery ?? 0;
  const vals = kids.map((k) => states.get(k.id)?.mastery ?? 0);
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}
