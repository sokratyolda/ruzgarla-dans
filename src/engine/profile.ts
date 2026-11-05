/**
 * Başlangıç profilleri.
 *
 * MUHAMMED_PROFILE, öğretmenle yapılan seviye tespitinden çıkarıldı:
 *   "Sabahleyin uyandığımda çadırımı toplamak istedim fakat çadırım ıslanmıştı ve dışarıda
 *    güçlü bir rüzgâr esiyordu. Ben de rüzgârla dans etmeye başladım ve sabrederek
 *    toparlanmaya devam ettim."
 *  • İstek–engel–değişim yapısı sezgisel olarak biliniyor → Ünite 1 becerileri orta düzey.
 *  • İmge gücü belirgin ("rüzgârla dans etmek") → hk.imge yüksek başlar.
 *  • Asıl zayıflık: önceki hâli (sinir, sabırsızlık) göstermeden sonraki hâle atlamak
 *    → hk.degisim.onceki ve hk.degisim.davranis en düşük; motor bunları öne alır.
 */
import { db } from '../db/db';
import { blankSkill } from './mastery';
import { addDays, today } from '../lib/tr';
import { skillById } from '../content';

export const MUHAMMED_PROFILE: Record<string, number> = {
  'hk.olay-hikaye': 55,
  'hk.istek': 62,
  'hk.engel': 62,
  'hk.degisim-yapi': 46,
  'hk.degisim.onceki': 10,
  'hk.degisim.kirilma': 30,
  'hk.degisim.sonraki': 25,
  'hk.degisim.davranis': 15,
  'hk.goster.adlandirma': 30,
  'hk.goster.beden': 25,
  'hk.goster.nesne': 35,
  'hk.imge': 60,
};

/** Profili beceri tablosuna yazar. Var olan veriyi ezer (yalnızca ilk açılışta çağrılır). */
export async function seedProfile(profile: Record<string, number>) {
  const t = today();
  await db.transaction('rw', db.skills, async () => {
    for (const id of skillById.keys()) {
      const m = profile[id];
      const s = blankSkill(id, m ?? 0);
      // Tespit edilen becerilerin ilk tekrarı yakın bir güne kurulur ki motor onları görsün
      if (m != null) s.nextReview = addDays(t, m < 40 ? 0 : 2);
      await db.skills.put(s);
    }
  });
}

/**
 * Mini seviye tespiti sonucunu profile çevirir.
 * correct: üç sorunun doğruluğu [yapı, değişim, göster]; self: yazma öz-değerlendirmesi (0–2) ölçüt sırasıyla
 * [istek, engel, önceki hâl, değişim davranışla].
 */
export function placementToProfile(correct: boolean[], self: number[]): Record<string, number> {
  const base = (ok: boolean, lo: number, hi: number) => (ok ? hi : lo);
  const s = (i: number) => (self[i] ?? 0) * 25; // 0, 25, 50
  return {
    'hk.olay-hikaye': base(correct[0], 25, 50),
    'hk.istek': 20 + s(0),
    'hk.engel': 20 + s(1),
    'hk.degisim-yapi': base(correct[1], 20, 40),
    'hk.degisim.onceki': 5 + s(2) * 0.6,
    'hk.degisim.kirilma': base(correct[1], 10, 25),
    'hk.degisim.sonraki': 10 + s(3) * 0.5,
    'hk.degisim.davranis': 5 + s(3) * 0.5,
    'hk.goster.adlandirma': base(correct[2], 10, 35),
    'hk.goster.beden': base(correct[2], 10, 25),
    'hk.goster.nesne': base(correct[2], 10, 25),
  };
}
