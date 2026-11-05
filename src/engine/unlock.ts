/**
 * Ünite kilitleri. Bir ünite, bir önceki ünitenin bütün dersleri bitmişse VE
 * temel becerilerinde ortalama ≥ UNLOCK_AVG ve hiçbiri < UNLOCK_MIN değilse açılır.
 * Açılan ünite kalıcı olarak açık kalır (ustalık sonra düşse bile geri kilitlenmez;
 * o beceri tekrar yoluyla geri gelir).
 */
import { db, type SkillState } from '../db/db';
import { allUnits } from '../content';
import type { UnitDef } from '../content/types';

export const UNLOCK_AVG = 60;
export const UNLOCK_MIN = 45;

const key = (unitId: string) => `unit:${unitId}`;

export function unitReadiness(u: UnitDef, states: Map<string, SkillState>) {
  const vals = u.keySkills.map((s) => states.get(s)?.mastery ?? 0);
  const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  const min = vals.length ? Math.min(...vals) : 0;
  return { avg, min, passed: avg >= UNLOCK_AVG && min >= UNLOCK_MIN };
}

/** Kalıcı kilit açma kayıtlarını günceller ve açık ünite kimliklerini döndürür. */
export async function refreshUnlocks(): Promise<Set<string>> {
  const units = allUnits();
  const states = new Map((await db.skills.toArray()).map((s) => [s.id, s]));
  const open = new Set<string>();
  for (let i = 0; i < units.length; i++) {
    const u = units[i];
    if (u.draft) break;
    const stored = await db.progress.get(key(u.id));
    if (i === 0 || stored?.completed) {
      open.add(u.id);
    } else {
      const prev = units[i - 1];
      // Eşik + önceki ünitenin bütün dersleri bitmiş olmalı (atölye isteğe bağlı)
      const lessonsDone = (await Promise.all(prev.lessons.map((l) => db.progress.get(l.id)))).every((p) => p?.completed);
      if (open.has(prev.id) && lessonsDone && unitReadiness(prev, states).passed) {
        await db.progress.put({ lessonId: key(u.id), index: 0, completed: true, completedAt: new Date().toISOString() });
        open.add(u.id);
      } else break;
    }
    if (i === 0 && !stored) await db.progress.put({ lessonId: key(u.id), index: 0, completed: true, completedAt: new Date().toISOString() });
  }
  return open;
}

/** Yalnızca okur (yazmaz): arayüzde canlı sorgular için */
export function openUnitsFrom(progressIds: Set<string>): Set<string> {
  const open = new Set<string>();
  allUnits().forEach((u, i) => {
    if (!u.draft && (i === 0 || progressIds.has(key(u.id)))) open.add(u.id);
  });
  return open;
}
