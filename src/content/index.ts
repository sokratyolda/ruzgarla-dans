/**
 * İçerik kayıt defteri. Yeni bir modül eklemek için:
 *  1) src/content/<modül>/ klasörünü oluştur (skills.ts + üniteler + index.ts),
 *  2) ModuleDef'i aşağıdaki MODULES dizisine ekle.
 * Motor, ekranlar ve yedekleme başka hiçbir değişiklik gerektirmez.
 */
import type { Exercise, LessonDef, ModuleDef, SkillDef, UnitDef } from './types';
import { storytellingModule } from './storytelling';
import { photographyModule, videoModule } from './future';

export const MODULES: ModuleDef[] = [storytellingModule, photographyModule, videoModule];

// ——— Hızlı erişim tabloları (bir kez kurulur) ———
export const skillById = new Map<string, SkillDef>();
export const exerciseById = new Map<string, Exercise>();
export const lessonById = new Map<string, LessonDef>();
export const unitById = new Map<string, UnitDef>();
export const unitOfLesson = new Map<string, UnitDef>();
export const lessonOfExercise = new Map<string, LessonDef>();
export const unitOfExercise = new Map<string, UnitDef>();
export const moduleOfUnit = new Map<string, ModuleDef>();

for (const mod of MODULES) {
  for (const s of mod.skills) skillById.set(s.id, s);
  for (const u of mod.units) {
    unitById.set(u.id, u);
    moduleOfUnit.set(u.id, mod);
    const all: Exercise[] = [...u.practice];
    if (u.atelier) all.push(u.atelier);
    for (const l of u.lessons) {
      lessonById.set(l.id, l);
      unitOfLesson.set(l.id, u);
      for (const e of [...l.steps, ...l.quiz]) {
        lessonOfExercise.set(e.id, l);
        all.push(e);
      }
    }
    for (const e of all) {
      if (exerciseById.has(e.id) && import.meta.env?.DEV) console.warn('Yinelenen alıştırma kimliği:', e.id);
      exerciseById.set(e.id, e);
      unitOfExercise.set(e.id, u);
    }
  }
}

// Geliştirme kipinde içerik denetimi: yeni içerik eklerken hatalar konsolda görünür.
if (import.meta.env?.DEV) {
  for (const e of exerciseById.values()) {
    for (const s of e.skills) if (!skillById.has(s)) console.warn(`[içerik] ${e.id}: bilinmeyen beceri ${s}`);
    if ('options' in e && (e.correct < 0 || e.correct >= e.options.length)) console.warn(`[içerik] ${e.id}: correct indeksi seçeneklerin dışında`);
    if ('rubric' in e)
      for (const r of e.rubric) if (!e.skills.includes(r.skill)) console.warn(`[içerik] ${e.id}: rubrikteki ${r.skill} skills listesinde yok`);
  }
}

export const childrenOf =(skillId: string) => [...skillById.values()].filter((s) => s.parent === skillId);

/** Bir dersin akışı: önce adımlar, sonra kısa sınav */
export const lessonFlow = (l: LessonDef): Exercise[] => [...l.steps, ...l.quiz];

/** Kullanılabilir modüllerdeki tüm üniteler, sırasıyla */
export const allUnits = (): UnitDef[] => MODULES.filter((m) => m.available).flatMap((m) => m.units);

/** Bir ünitenin içerdiği beceriler (alıştırma etiketlerinden çıkarılır) */
export function skillsOfUnit(u: UnitDef): string[] {
  const set = new Set<string>(u.keySkills);
  for (const l of u.lessons) for (const e of lessonFlow(l)) e.skills.forEach((s) => set.add(s));
  return [...set];
}
