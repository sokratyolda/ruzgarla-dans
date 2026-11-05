/**
 * Ünite kilitleri — her dal kendi içinde ilerler.
 *
 *  • Bir dalın ilk ünitesi, dalın ön koşulları tamamsa açılır
 *    (ön koşul: belirtilen ünitelerin bütün dersleri bitmiş).
 *  • Dalın sonraki ünitesi, önceki ünitenin bütün dersleri bitince VE temel becerilerinde
 *    ortalama ≥ UNLOCK_AVG ve hiçbiri < UNLOCK_MIN değilse açılır.
 *  • Açılan ünite kalıcı olarak açık kalır (progress tablosunda `unit:<id>` kaydı);
 *    ustalık sonra düşse bile geri kilitlenmez, o beceri tekrar yoluyla geri gelir.
 */
import { db, type SkillState } from '../db/db';
import { BRANCHES, branchPrereqsMet, contentUnits } from '../content';
import type { UnitDef } from '../content/types';

export const UNLOCK_AVG = 60;
export const UNLOCK_MIN = 45;

export const unitKey = (unitId: string) => `unit:${unitId}`;

export function unitReadiness(u: UnitDef, states: Map<string, SkillState>) {
  const vals = u.keySkills.map((s) => states.get(s)?.mastery ?? 0);
  const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  const min = vals.length ? Math.min(...vals) : 0;
  return { avg, min, passed: avg >= UNLOCK_AVG && min >= UNLOCK_MIN };
}

const openRecord = (unitId: string) => ({
  lessonId: unitKey(unitId),
  index: 0,
  completed: true,
  completedAt: new Date().toISOString(),
});

/** Kalıcı kilit açma kayıtlarını günceller ve açık ünite kimliklerini döndürür. */
export async function refreshUnlocks(): Promise<Set<string>> {
  const progress = await db.progress.toArray();
  const done = new Set(progress.filter((p) => p.completed).map((p) => p.lessonId));
  const states = new Map((await db.skills.toArray()).map((s) => [s.id, s]));
  const open = new Set<string>();

  for (const b of BRANCHES) {
    if (!b.available) continue;
    const units = contentUnits(b);
    if (units.length === 0) continue;
    // Dal daha önce açıldıysa (ilk ünitenin kaydı varsa) ön koşul yeniden aranmaz
    if (!done.has(unitKey(units[0].id)) && !branchPrereqsMet(b, done)) continue;

    for (let i = 0; i < units.length; i++) {
      const u = units[i];
      if (i === 0 || done.has(unitKey(u.id))) {
        open.add(u.id);
        if (!done.has(unitKey(u.id))) await db.progress.put(openRecord(u.id));
        continue;
      }
      const prev = units[i - 1];
      const lessonsDone = prev.lessons.every((l) => done.has(l.id));
      if (open.has(prev.id) && lessonsDone && unitReadiness(prev, states).passed) {
        await db.progress.put(openRecord(u.id));
        open.add(u.id);
      } else break;
    }
  }
  return open;
}

/** Yalnızca okur (yazmaz): arayüzde canlı sorgular için. `doneIds`: tamamlanmış ilerleme kimlikleri. */
export function openUnitsFrom(doneIds: Set<string>): Set<string> {
  const open = new Set<string>();
  for (const b of BRANCHES) {
    if (!b.available) continue;
    const units = contentUnits(b);
    if (units.length === 0) continue;
    units.forEach((u, i) => {
      if (doneIds.has(unitKey(u.id)) || (i === 0 && branchPrereqsMet(b, doneIds))) open.add(u.id);
    });
  }
  return open;
}

/** Dal açık mı (en az bir ünitesi açık)? */
export const branchIsOpen = (branchId: string, open: Set<string>) =>
  BRANCHES.find((b) => b.id === branchId)?.units.some((u) => open.has(u.id)) ?? false;
