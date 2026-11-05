/**
 * Aralıklı tekrar: SM-2'nin sade bir türevi.
 * quality 0–5: 0–2 = unutulmuş/zorlanılmış, 3 = zorla hatırlandı, 4 = iyi, 5 = kolay.
 * Başarısızlıkta aralık 1 güne döner; başarıda aralık 1 → 3 → (aralık × kolaylık) büyür.
 */
import { addDays } from '../lib/tr';

export interface SrsState {
  interval: number;
  ease: number;
  reps: number;
}

export const SRS_START: SrsState = { interval: 0, ease: 2.5, reps: 0 };

export function sm2(state: SrsState, quality: number, todayStr: string): SrsState & { due: string } {
  let { interval, ease, reps } = state;
  if (quality < 3) {
    reps = 0;
    interval = 1;
  } else {
    reps += 1;
    if (reps === 1) interval = 1;
    else if (reps === 2) interval = 3;
    else interval = Math.round(interval * ease);
  }
  ease = Math.max(1.3, ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
  // Uzun yolculuklarda çok uzak tarihler anlamsızlaşır; tavan 60 gün.
  interval = Math.min(interval, 60);
  return { interval, ease, reps, due: addDays(todayStr, interval) };
}

/** 0–1 puanı SM-2 kalitesine çevirir */
export const scoreToQuality = (score: number) =>
  score >= 0.9 ? 5 : score >= 0.75 ? 4 : score >= 0.55 ? 3 : score >= 0.3 ? 2 : 1;
