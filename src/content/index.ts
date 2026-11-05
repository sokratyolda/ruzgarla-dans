/**
 * İçerik kayıt defteri: Yazarlık çatısı ve dalları.
 * Yeni bir dalın içeriğini eklemek için:
 *  1) src/content/<dal>/ klasöründe üniteleri yaz (UnitDef),
 *  2) src/content/branches.ts içindeki dal tanımında taslak üniteleri bunlarla değiştir
 *     ve `available: true` yap.
 * Motor, ekranlar ve yedekleme başka bir değişiklik gerektirmez.
 */
import type { BranchDef, Exercise, LessonDef, SkillDef, UnitDef } from './types';
import { storytellingBranch } from './storytelling';
import {
  descriptionBranch,
  languageBranch,
  nonfictionBranch,
  observationBranch,
  poetryBranch,
  readingBranch,
  revisionBranch,
  screenBranch,
  travelBranch,
} from './branches';
import { photographyModule, videoModule } from './future';

/** Bütün dallar, yoldaki sırasıyla (D1 … D10, sonra Fotoğraf ve Video) */
export const BRANCHES: BranchDef[] = [
  observationBranch,
  languageBranch,
  storytellingBranch,
  descriptionBranch,
  nonfictionBranch,
  travelBranch,
  readingBranch,
  screenBranch,
  poetryBranch,
  revisionBranch,
  photographyModule,
  videoModule,
].sort((a, b) => a.order - b.order);

/** @deprecated Eski ad. */
export const MODULES = BRANCHES;

export const DEFAULT_BRANCH = storytellingBranch.id;

// ——— Hızlı erişim tabloları (bir kez kurulur) ———
export const branchById = new Map<string, BranchDef>();
export const skillById = new Map<string, SkillDef>();
export const exerciseById = new Map<string, Exercise>();
export const lessonById = new Map<string, LessonDef>();
export const unitById = new Map<string, UnitDef>();
export const unitOfLesson = new Map<string, UnitDef>();
export const lessonOfExercise = new Map<string, LessonDef>();
export const unitOfExercise = new Map<string, UnitDef>();
export const branchOfUnit = new Map<string, BranchDef>();
/** @deprecated Eski ad. */
export const moduleOfUnit = branchOfUnit;

const DEV = import.meta.env?.DEV;

for (const b of BRANCHES) {
  branchById.set(b.id, b);
  for (const s of b.skills) {
    if (DEV && skillById.has(s.id)) console.warn('[içerik] yinelenen beceri kimliği:', s.id);
    skillById.set(s.id, s);
  }
  for (const u of b.units) {
    if (DEV && unitById.has(u.id)) console.warn('[içerik] yinelenen ünite kimliği:', u.id);
    unitById.set(u.id, u);
    branchOfUnit.set(u.id, b);
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
      if (DEV && exerciseById.has(e.id)) console.warn('[içerik] yinelenen alıştırma kimliği:', e.id);
      exerciseById.set(e.id, e);
      unitOfExercise.set(e.id, u);
    }
  }
}

// Geliştirme kipinde içerik denetimi: yeni içerik eklerken hatalar konsolda görünür.
if (DEV) {
  for (const e of exerciseById.values()) {
    for (const s of e.skills) if (!skillById.has(s)) console.warn(`[içerik] ${e.id}: bilinmeyen beceri ${s}`);
    if ('options' in e && (e.correct < 0 || e.correct >= e.options.length)) console.warn(`[içerik] ${e.id}: correct indeksi seçeneklerin dışında`);
    if ('rubric' in e)
      for (const r of e.rubric) if (!e.skills.includes(r.skill)) console.warn(`[içerik] ${e.id}: rubrikteki ${r.skill} skills listesinde yok`);
  }
  for (const u of unitById.values()) for (const k of u.keySkills) if (!skillById.has(k)) console.warn(`[içerik] ${u.id}: bilinmeyen temel beceri ${k}`);
  for (const b of BRANCHES) for (const p of b.prerequisites ?? []) if (!unitById.has(p)) console.warn(`[içerik] ${b.id}: bilinmeyen ön koşul ünitesi ${p}`);
}

export const childrenOf = (skillId: string) => [...skillById.values()].filter((s) => s.parent === skillId);

/** Bir dersin akışı: önce adımlar, sonra kısa sınav */
export const lessonFlow = (l: LessonDef): Exercise[] => [...l.steps, ...l.quiz];

/** İçeriği yazılmış (taslak olmayan) üniteler */
export const contentUnits = (b: BranchDef): UnitDef[] => b.units.filter((u) => !u.draft);

/** İçeriği olan bütün ünitelerin listesi (dal sırasıyla) */
export const allUnits = (): UnitDef[] => BRANCHES.filter((b) => b.available).flatMap(contentUnits);

/**
 * Dalın ön koşulları tamam mı? Her ön koşul ünitesinin bütün dersleri bitmiş olmalı.
 * `completedLessons`: tamamlanmış ders kimlikleri.
 */
export function branchPrereqsMet(b: BranchDef, completedLessons: Set<string>): boolean {
  return (b.prerequisites ?? []).every((uid) => {
    const u = unitById.get(uid);
    return !!u && !u.draft && u.lessons.every((l) => completedLessons.has(l.id));
  });
}

/** Bir ünitenin içerdiği beceriler (alıştırma etiketlerinden çıkarılır) */
export function skillsOfUnit(u: UnitDef): string[] {
  const set = new Set<string>(u.keySkills);
  for (const l of u.lessons) for (const e of lessonFlow(l)) e.skills.forEach((s) => set.add(s));
  return [...set];
}
