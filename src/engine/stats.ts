/**
 * Sakin motivasyon: haftalık gün hedefi ve hafta serisi.
 * Seri gün değil HAFTA üzerinden sayılır: yolda internetsiz ya da yorgun bir gün
 * seriyi bozmaz; yalnızca haftalık hedefe bakılır.
 */
import type { SessionRecord } from '../db/db';
import { addDays, today, weekStart } from '../lib/tr';

export function weekStats(sessions: SessionRecord[], weeklyGoal: number, t = today()) {
  const studied = new Set(sessions.filter((s) => s.finishedAt || s.done.length > 0).map((s) => s.date));
  const ws = weekStart(t);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(ws, i);
    return { date: d, done: studied.has(d), isToday: d === t, future: d > t };
  });
  const thisWeek = days.filter((d) => d.done).length;

  // Hedefi tutturulan ardışık haftalar (bu hafta hedef tutmuşsa o da sayılır)
  let streak = thisWeek >= weeklyGoal ? 1 : 0;
  let cursor = addDays(ws, -7);
  for (let guard = 0; guard < 520; guard++) {
    let n = 0;
    for (let i = 0; i < 7; i++) if (studied.has(addDays(cursor, i))) n++;
    if (n >= weeklyGoal) {
      streak++;
      cursor = addDays(cursor, -7);
    } else break;
  }
  const totalSteps = sessions.reduce((a, s) => a + s.done.length, 0);
  return { days, thisWeek, streak, totalDays: studied.size, totalSteps };
}
