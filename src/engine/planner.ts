/**
 * GÜNLÜK DERS OLUŞTURUCU — uygulamanın kalbi.
 *
 * Bir oturum en fazla 7 adım ve yaklaşık 15–20 dakikadır (ağırlık ≈ 9).
 *  • ~%60 YENİ: sıradaki dersin akışından devam (ders bitince ünite atölyesi).
 *  • ~%40 TEKRAR/GÜÇLENDİRME:
 *      – vakti gelen soru kartları (aralıklı tekrar),
 *      – en zayıf ya da tekrar günü gelmiş beceriler için alıştırma havuzundan seçim,
 *      – zorlanılan beceride "küçük adımlar": kolay (difficulty 1) parçalar.
 * Yeni malzeme kalmadıysa (sonraki ünite henüz açılmadıysa) oturum tamamen
 * güçlendirmeye döner ve kilidi açacak temel becerilere yoğunlaşır.
 *
 * MEVSİM: Yeni malzeme yalnızca bu mevsimin ana dalından (settings.seasonBranch) gelir.
 * Tekrar ise açılmış bütün dallardaki zayıf becerilerden gelir; eski dallar unutulmaz.
 */
import { db, getSettings, type SessionRecord, type SkillState } from '../db/db';
import {
  BRANCHES,
  DEFAULT_BRANCH,
  allUnits,
  branchById,
  branchPrereqsMet,
  contentUnits,
  exerciseById,
  lessonFlow,
  lessonById,
  lessonOfExercise,
  skillById,
  skillsOfUnit,
  unitById,
} from '../content';
import type { BranchDef, Exercise, LessonDef, UnitDef } from '../content/types';
import { isObjective } from '../content/types';
import { refreshUnlocks, unitReadiness } from './unlock';
import { today } from '../lib/tr';

export const WEIGHT: Record<Exercise['type'], number> = {
  concept: 1,
  choice: 1,
  discern: 1,
  missing: 1,
  rewrite: 2,
  video: 2,
  write: 3,
};
const weightOf = (e: Exercise) => (e.type === 'write' && e.atelier ? 4 : WEIGHT[e.type]);

export const MAX_STEPS = 7;
const TARGET_WEIGHT = 9;
const NEW_WEIGHT = 5.4; // %60

type PlanItem = SessionRecord['plan'][number];

export type Frontier = { branch: BranchDef } & (
  | { kind: 'lesson'; unit: UnitDef; lesson: LessonDef; index: number }
  | { kind: 'atelier'; unit: UnitDef }
  /** Dalın sonraki ünitesi kilitli: önceki ünitenin temel becerileri güçlenmeli */
  | { kind: 'blocked'; unit: UnitDef; next?: UnitDef }
  /** Dal henüz açılmadı (ön koşullar eksik) */
  | { kind: 'locked' }
  /** Dalın yazılmış içeriği bitti (varsa sıradaki taslak ünite) */
  | { kind: 'end'; nextDraft?: UnitDef }
);

/** Mevsimin ana dalı (ayar yoksa ya da geçersizse Hikâye) */
export async function seasonBranch(): Promise<BranchDef> {
  const s = await getSettings();
  const b = branchById.get(s.seasonBranch);
  return b && b.available ? b : branchById.get(DEFAULT_BRANCH)!;
}

/** Sıradaki yeni malzeme nerede? (yalnızca verilen dalda) */
export async function findFrontier(open: Set<string>, branch: BranchDef): Promise<Frontier> {
  const units = contentUnits(branch);
  const progress = new Map((await db.progress.toArray()).map((p) => [p.lessonId, p]));
  for (let i = 0; i < units.length; i++) {
    const u = units[i];
    if (!open.has(u.id)) {
      return i === 0 ? { kind: 'locked', branch } : { kind: 'blocked', branch, unit: units[i - 1], next: u };
    }
    for (const l of u.lessons) {
      const p = progress.get(l.id);
      if (!p?.completed) return { kind: 'lesson', branch, unit: u, lesson: l, index: p?.index ?? 0 };
    }
    if (u.atelier) {
      const done = await db.attempts.where('exerciseId').equals(u.atelier.id).count();
      if (!done) return { kind: 'atelier', branch, unit: u };
    }
  }
  return { kind: 'end', branch, nextDraft: branch.units.find((u) => u.draft) };
}

/** Açık ünitelerdeki "yaprak" beceriler (alt becerisi olan üst beceriler hariç); `branchId` verilirse yalnız o dal */
function openLeafSkills(open: Set<string>, branchId?: string): string[] {
  const set = new Set<string>();
  for (const b of BRANCHES) {
    if (branchId && b.id !== branchId) continue;
    for (const u of contentUnits(b)) if (open.has(u.id)) skillsOfUnit(u).forEach((s) => set.add(s));
  }
  const parents = new Set([...skillById.values()].filter((s) => s.parent).map((s) => s.parent!));
  return [...set].filter((s) => !parents.has(s));
}

/** Zayıflık sırası: küçük adımlar kipindekiler önce, sonra tekrar günü gelenler, sonra düşük ustalık */
export function rankWeakSkills(skills: string[], states: Map<string, SkillState>, t = today()) {
  return skills
    .map((id) => {
      const s = states.get(id);
      const mastery = s?.mastery ?? 0;
      const due = s?.nextReview ? s.nextReview <= t : false;
      const rank = mastery - (s?.scaffold ? 50 : 0) - (due ? 15 : 0);
      return { id, mastery, due, scaffold: !!s?.scaffold, rank };
    })
    .sort((a, b) => a.rank - b.rank);
}

/**
 * Şu sıralar en çok neye çalışıyoruz? (Eksiklerim ve Bugün ekranındaki tek odak)
 * Önce mevsim dalının açık becerilerine bakılır; orada açık beceri yoksa bütün dallara.
 */
export async function currentFocus(): Promise<string | undefined> {
  const open = await refreshUnlocks();
  const branch = await seasonBranch();
  const states = new Map((await db.skills.toArray()).map((s) => [s.id, s]));
  const inSeason = openLeafSkills(open, branch.id);
  return rankWeakSkills(inSeason.length ? inSeason : openLeafSkills(open), states)[0]?.id;
}

/**
 * Mevsim bitince önerilecek dal: içeriği olan, ön koşulları tamam, seçmeli değilse (ya da seçmeliler
 * açıksa) ve yazılmış içeriği bitmemiş dallar arasında temel becerileri en zayıf olan.
 */
export async function suggestNextBranch(currentId: string): Promise<BranchDef | undefined> {
  const s = await getSettings();
  const progress = await db.progress.toArray();
  const done = new Set(progress.filter((p) => p.completed).map((p) => p.lessonId));
  const states = new Map((await db.skills.toArray()).map((x) => [x.id, x]));
  const candidates = BRANCHES.filter(
    (b) =>
      b.id !== currentId &&
      b.available &&
      (!b.elective || s.electives.includes(b.id)) &&
      branchPrereqsMet(b, done) &&
      contentUnits(b).some((u) => u.lessons.some((l) => !done.has(l.id))),
  );
  const score = (b: BranchDef) => {
    const keys = contentUnits(b).flatMap((u) => u.keySkills);
    return keys.reduce((a, k) => a + (states.get(k)?.mastery ?? 0), 0) / Math.max(1, keys.length);
  };
  return candidates.sort((a, b) => score(a) - score(b))[0];
}

export async function buildDailyPlan(): Promise<{ plan: PlanItem[]; focusSkill?: string; frontier: Frontier }> {
  const t = today();
  const open = await refreshUnlocks();
  const states = new Map((await db.skills.toArray()).map((s) => [s.id, s]));
  const attempts = await db.attempts.toArray();
  const lastTried = new Map<string, string>();
  for (const a of attempts) {
    const prev = lastTried.get(a.exerciseId);
    if (!prev || a.date > prev) lastTried.set(a.exerciseId, a.date);
  }
  const used = new Set<string>();
  const newItems: PlanItem[] = [];
  let weight = 0;

  // ——— 1) Yeni malzeme (yalnızca mevsimin ana dalından) ———
  const frontier = await findFrontier(open, await seasonBranch());
  if (frontier.kind === 'lesson') {
    const flow = lessonFlow(frontier.lesson);
    let w = 0;
    for (let i = frontier.index; i < flow.length; i++) {
      const e = flow[i];
      const ew = weightOf(e);
      // Bir adımlık taşmaya izin ver: bir yazma görevi yarım bırakılmasın
      if (newItems.length > 0 && (w + ew > NEW_WEIGHT + 1 || newItems.length >= 4)) {
        // Kavram kartıyla oturumu bitirme: kartın ardından en az bir uygulama gelsin.
        const last = exerciseById.get(newItems[newItems.length - 1].exerciseId);
        if (!(last?.type === 'concept' && newItems.length < 5)) break;
      }
      newItems.push({ exerciseId: e.id, role: 'yeni', lessonId: frontier.lesson.id });
      used.add(e.id);
      w += ew;
    }
    weight += w;
  } else if (frontier.kind === 'atelier' && frontier.unit.atelier) {
    newItems.push({ exerciseId: frontier.unit.atelier.id, role: 'atölye' });
    used.add(frontier.unit.atelier.id);
    weight += weightOf(frontier.unit.atelier);
  }

  // ——— 2) Tekrar ve güçlendirme ———
  const review: PlanItem[] = [];
  // Tekrar payı ≈ %40: yeni malzeme varken tekrar sayısı yeni adım sayısının üçte ikisini geçmez
  const maxReview = newItems.length > 0 ? Math.max(2, Math.ceil((newItems.length * 2) / 3)) : 5;
  const room = () =>
    newItems.length + review.length < MAX_STEPS && review.length < maxReview && weight < TARGET_WEIGHT;

  // 2a) Vakti gelen soru kartları (en gecikmiş önce), en fazla 2
  const dueCards = (await db.cards.where('due').belowOrEqual(t).toArray()).sort((a, b) => a.due.localeCompare(b.due));
  for (const c of dueCards) {
    if (review.length >= 2 || !room()) break;
    const e = exerciseById.get(c.exerciseId);
    if (!e || used.has(e.id)) continue;
    review.push({ exerciseId: e.id, role: 'tekrar' });
    used.add(e.id);
    weight += weightOf(e);
  }

  // 2b) Zayıf beceriler için havuzdan seçim
  let skills = openLeafSkills(open);
  // Yeni malzeme yoksa: kilidi açacak temel becerilere odaklan
  if (frontier.kind === 'blocked') skills = frontier.unit.keySkills.filter((s) => skills.includes(s));
  const ranked = rankWeakSkills(skills, states, t);
  const pool = practicePool(open);
  const completed = new Set((await db.progress.toArray()).filter((p) => p.completed).map((p) => p.lessonId));

  for (const sk of ranked) {
    if (!room()) break;
    const candidates = pool.filter((e) => {
      if (used.has(e.id) || !e.skills.includes(sk.id)) return false;
      // Ders içi sorular yalnızca ders tamamlandıysa tekrar olarak gelir
      const l = lessonOfExercise.get(e.id);
      if (l && !completed.has(l.id)) return false;
      // Bugün zaten yapılmışsa tekrar etme
      const last = lastTried.get(e.id);
      if (last && last.slice(0, 10) === t) return false;
      return true;
    });
    if (candidates.length === 0) continue;
    const pick = candidates
      .map((e) => {
        const d = e.difficulty ?? 2;
        let score = 0;
        if (sk.scaffold) score += d === 1 ? 0 : 20; // küçük adımlar: kolay parçalar
        else if (sk.mastery > 55) score += d >= 2 ? 0 : 8;
        else score += d === 3 ? 10 : 0;
        if (e.skills[0] !== sk.id) score += 5; // birincil etiket tercih edilir
        const last = lastTried.get(e.id);
        score += last ? 10 - Math.min(10, (Date.now() - Date.parse(last)) / 86400000) : -5; // hiç denenmemiş önce
        if (!room() || weight + weightOf(e) > TARGET_WEIGHT + 1) score += 100; // sığmayan en sona
        return { e, score };
      })
      .sort((a, b) => a.score - b.score)[0];
    if (weight + weightOf(pick.e) > TARGET_WEIGHT + 1) continue;
    review.push({ exerciseId: pick.e.id, role: sk.scaffold ? 'destek' : 'tekrar' });
    used.add(pick.e.id);
    weight += weightOf(pick.e);
  }

  // ——— 3) Sıralama: ısınma için bir objektif tekrar, sonra yeni, sonra kalan tekrar ———
  const warmIdx = review.findIndex((r) => {
    const e = exerciseById.get(r.exerciseId);
    return e && isObjective(e);
  });
  const warm = warmIdx >= 0 && newItems.length > 0 ? review.splice(warmIdx, 1) : [];
  const plan = [...warm, ...newItems, ...review].slice(0, MAX_STEPS);

  return { plan, focusSkill: ranked[0]?.id, frontier };
}

/** Açık ünitelerin (bütün dallar) alıştırma havuzu + ders içi objektif sorular (kavram kartları hariç) */
function practicePool(open: Set<string>): Exercise[] {
  const out: Exercise[] = [];
  for (const u of allUnits()) {
    if (!open.has(u.id)) continue;
    out.push(...u.practice);
    for (const l of u.lessons) for (const e of lessonFlow(l)) if (e.type !== 'concept' && e.type !== 'write') out.push(e);
  }
  return out;
}

/** Yoldan bir dersi baştan (ya da kaldığı yerden) çalışmak için */
export function buildLessonPlan(lessonId: string): PlanItem[] {
  const l = lessonById.get(lessonId);
  if (!l) return [];
  return lessonFlow(l).map((e) => ({ exerciseId: e.id, role: 'yeni' as const, lessonId }));
}

export function atelierPlan(unitId: string): PlanItem[] {
  const u = unitById.get(unitId);
  return u?.atelier ? [{ exerciseId: u.atelier.id, role: 'atölye' }] : [];
}

/** Bugünün oturumunu getir; yoksa ya da bittiyse ve yenisi istenirse oluştur. */
export async function getOrCreateTodaySession(forceNew = false): Promise<SessionRecord> {
  const t = today();
  const existing = (await db.sessions.where('date').equals(t).toArray()).filter((s) => !s.finishedAt && s.kind !== 'custom');
  if (existing.length && !forceNew) return existing[existing.length - 1];
  const { plan, focusSkill } = await buildDailyPlan();
  const rec: SessionRecord = { date: t, startedAt: new Date().toISOString(), plan, done: [], focusSkill, kind: 'daily' };
  rec.id = await db.sessions.add(rec);
  return rec;
}

export async function createCustomSession(plan: PlanItem[]): Promise<SessionRecord> {
  const rec: SessionRecord = { date: today(), startedAt: new Date().toISOString(), plan, done: [], kind: 'custom' };
  rec.id = await db.sessions.add(rec);
  return rec;
}

export const estimateMinutes = (plan: PlanItem[]) =>
  Math.max(5, Math.round(plan.reduce((a, p) => a + (exerciseById.get(p.exerciseId) ? weightOf(exerciseById.get(p.exerciseId)!) : 1), 0) * 2));

export { unitReadiness };
