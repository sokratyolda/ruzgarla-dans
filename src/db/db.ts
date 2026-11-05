/**
 * Cihazdaki veritabanı (IndexedDB, Dexie ile).
 * Sunucu yok, hesap yok: her şey bu telefonda durur. Yedek için Ayarlar → Dışa aktar.
 */
import Dexie, { type Table } from 'dexie';
import type { RoadNoteTag } from '../content/types';

/** Bir becerinin öğrenciye özgü durumu. Tanımı (adı vs.) içerik dosyasındadır. */
export interface SkillState {
  id: string;
  moduleId: string;
  /** Ustalık 0–100 */
  mastery: number;
  /** Bu beceriye kaç kez dokunuldu */
  practiced: number;
  lastPracticed?: string; // ISO tarih
  /** Aralıklı tekrar: bir sonraki tekrar günü (YYYY-MM-DD) */
  nextReview?: string;
  /** SM-2 parametreleri */
  interval: number;
  ease: number;
  reps: number;
  /** Üst üste zorlanma sayısı; 2'yi geçince "küçük adımlar" kipine girilir */
  struggle: number;
  /** Küçük adımlar kipinden çıkmak için gereken art arda başarı sayacı */
  recover: number;
  scaffold: boolean;
}

/** Objektif sorular (çoktan seçmeli vb.) için soru düzeyinde tekrar kartı */
export interface ReviewCard {
  exerciseId: string;
  due: string; // YYYY-MM-DD
  interval: number;
  ease: number;
  reps: number;
  lapses: number;
}

export interface AiFeedback {
  skills: { skill: string; score: number; note: string }[];
  strength: string;
  comment: string;
  suggestion: string;
  rewriteTask: string;
  model: string;
  date: string;
}

export interface Attempt {
  id?: number;
  exerciseId: string;
  date: string; // ISO
  /** Metin cevap ya da seçilen şık (sayı) ya da video planı alanları */
  response: string | number | Record<string, string>;
  /** 0–1 arası; yazmada öz-değerlendirme ya da yapay zekâ ortalaması */
  score: number;
  skills: string[];
  /** Yazma: aynı alıştırmanın kaçıncı hâli (1 = ilk yazım) */
  version?: number;
  /** Yeniden yazımda ilk denemenin kimliği */
  rootId?: number;
  selfScores?: Record<string, number>; // ölçüt sırası → 0/1/2
  aiFeedback?: AiFeedback;
  /** Yapay zekâ değerlendirmesini bekliyor (çevrimdışı ya da anahtar yok) */
  pendingReview?: 0 | 1;
  /** Değerlendirme denendi ama hata verdi */
  reviewError?: string;
  sessionId?: number;
}

export interface LessonProgress {
  lessonId: string;
  /** Akışta (steps + quiz) kaçıncı adımdayız */
  index: number;
  completed: boolean;
  completedAt?: string;
}

export interface SessionRecord {
  id?: number;
  date: string; // YYYY-MM-DD
  startedAt: string;
  finishedAt?: string;
  /** Planlanan alıştırma kimlikleri ve rolleri */
  plan: { exerciseId: string; role: 'yeni' | 'tekrar' | 'destek' | 'atölye'; lessonId?: string }[];
  done: string[];
  focusSkill?: string;
  /** daily: günlük ders; custom: yoldan seçilen ders ya da atölye */
  kind?: 'daily' | 'custom';
}

export interface JournalEntry {
  id?: number;
  date: string; // ISO
  text: string;
  sessionId?: number;
}

export interface RoadNote {
  id?: number;
  date: string; // ISO
  text: string;
  tags: RoadNoteTag[];
  /** Bu notun kullanıldığı alıştırma (varsa) */
  usedIn?: string[];
}

export interface Settings {
  key: 'main';
  /** Hitap için ad */
  name: string;
  apiKey: string;
  model: string;
  theme: 'dark' | 'light';
  /** Haftada kaç gün çalışmak istiyorum (1–7) */
  weeklyGoal: number;
  /** Karşılama ve seviye tespiti tamamlandı mı */
  onboarded: boolean;
  /** Metin boyutu çarpanı */
  textScale: number;
  createdAt: string;
}

export const DEFAULT_MODEL = 'claude-sonnet-5-5';

export const defaultSettings = (): Settings => ({
  key: 'main',
  name: 'Muhammed',
  apiKey: '',
  model: DEFAULT_MODEL,
  theme: 'dark',
  weeklyGoal: 4,
  onboarded: false,
  textScale: 1,
  createdAt: new Date().toISOString(),
});

class AppDB extends Dexie {
  skills!: Table<SkillState, string>;
  cards!: Table<ReviewCard, string>;
  attempts!: Table<Attempt, number>;
  progress!: Table<LessonProgress, string>;
  sessions!: Table<SessionRecord, number>;
  journal!: Table<JournalEntry, number>;
  notes!: Table<RoadNote, number>;
  settings!: Table<Settings, string>;

  constructor() {
    super('ruzgarla-dans');
    // Şema değişirse yeni bir version(n) ekle; eskileri silme (Dexie göç eder).
    this.version(1).stores({
      skills: 'id, moduleId, mastery, nextReview',
      cards: 'exerciseId, due',
      attempts: '++id, exerciseId, date, pendingReview, rootId, sessionId',
      progress: 'lessonId',
      sessions: '++id, date',
      journal: '++id, date',
      notes: '++id, date, *tags',
      settings: 'key',
    });
  }
}

export const db = new AppDB();

export async function getSettings(): Promise<Settings> {
  const s = await db.settings.get('main');
  if (s) return { ...defaultSettings(), ...s };
  const d = defaultSettings();
  await db.settings.put(d);
  return d;
}

export async function updateSettings(patch: Partial<Settings>) {
  const s = await getSettings();
  await db.settings.put({ ...s, ...patch, key: 'main' });
}
