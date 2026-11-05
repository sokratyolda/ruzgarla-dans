/**
 * Erişim — yazılmış bütün dersler ilk günden açıktır.
 *
 * Uygulama bir sıra ÖNERİR (Bugün ekranı ve Yolum'daki "şu anki durak"), ama hiçbir dersi kilitlemez.
 * İçeriği henüz yazılmamış dallar Yolum'da gösterilmez; "Geliştiriliyor" listesinde durur.
 *
 * (Eski sürümlerde üniteler sırayla ve beceri eşiğiyle açılıyordu; progress tablosundaki
 * `unit:<id>` kayıtları o dönemden kalabilir, zararsızdır.)
 */
import type { SkillState } from '../db/db';
import { BRANCHES, contentUnits } from '../content';
import type { UnitDef } from '../content/types';

/** Bütün yazılmış ünitelerin kimlikleri (kullanılabilir dallarda) */
export function allOpenUnits(): Set<string> {
  const open = new Set<string>();
  for (const b of BRANCHES) if (b.available) for (const u of contentUnits(b)) open.add(u.id);
  return open;
}

/** Geriye dönük uyumluluk: eskiden kilitleri güncellerdi; artık her şey açık. */
export async function refreshUnlocks(): Promise<Set<string>> {
  return allOpenUnits();
}

/** Geriye dönük uyumluluk */
export const openUnitsFrom = (_done?: Set<string>) => allOpenUnits();

/** Bir ünitenin temel becerilerindeki ortalama tahmin (yalnızca motorun iç kullanımı için; ekranda gösterilmez) */
export function unitReadiness(u: UnitDef, states: Map<string, SkillState>) {
  const vals = u.keySkills.map((s) => states.get(s)?.mastery ?? 0);
  const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  return { avg };
}
