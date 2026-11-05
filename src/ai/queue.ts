/**
 * "Sonra değerlendir" kuyruğu.
 * Çevrimdışıyken ya da anahtar yokken yazılan metinler pendingReview=1 ile kaydedilir.
 * Uygulama açıldığında, internet geri geldiğinde ve Yazılarım ekranından istendiğinde
 * kuyruk sırayla işlenir.
 */
import { db, getSettings } from '../db/db';
import { exerciseById } from '../content';
import { isWriting } from '../content/types';
import { evaluateWriting, explainError, isTransient } from './claude';
import { applyLateAi } from '../engine/record';
import { formatResponse } from './prompt';

let running = false;

export async function pendingCount() {
  return db.attempts.where('pendingReview').equals(1).count();
}

/** `auto`: internet geldiğinde kendiliğinden çağrıldı; "göndermeden önce sor" açıksa hiçbir şey göndermez. */
export async function processQueue(auto = false): Promise<{ done: number; failed: number; message?: string }> {
  if (running) return { done: 0, failed: 0 };
  const settings = await getSettings();
  if (!settings.apiKey || !navigator.onLine) return { done: 0, failed: 0 };
  if (auto && settings.askBeforeSend) return { done: 0, failed: 0 };
  running = true;
  let done = 0;
  let failed = 0;
  let message: string | undefined;
  try {
    const pending = await db.attempts.where('pendingReview').equals(1).sortBy('date');
    for (const a of pending) {
      const ex = exerciseById.get(a.exerciseId);
      if (!ex || !isWriting(ex) || a.id == null) continue;
      let previous: string | undefined;
      if (a.rootId != null) {
        const prev = await db.attempts.get(a.rootId);
        if (prev) previous = formatResponse(prev.response as string | Record<string, string>);
      }
      try {
        const fb = await evaluateWriting(settings, ex, a.response as string | Record<string, string>, previous);
        await applyLateAi(a.id, fb);
        done++;
      } catch (e) {
        failed++;
        message = explainError(e);
        await db.attempts.update(a.id, { reviewError: message });
        if (isTransient(e)) break; // bağlantı yoksa kalanları da deneme
      }
    }
  } finally {
    running = false;
  }
  return { done, failed, message };
}

/** Uygulama başlarken bir kez çağrılır */
export function startQueueWatcher() {
  const run = () => void processQueue(true);
  window.addEventListener('online', run);
  setTimeout(run, 2500);
}
