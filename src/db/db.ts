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
  /**
   * Senin kendi işaretin: 'ogrendim' = bu beceriyi oturmuş sayıyorum (motor biraz geri çeker),
   * 'tekrar' = tekrar denemek istiyorum (motor öne alır).
   */
  selfMark?: 'ogrendim' | 'tekrar';
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

// ——— Yazarın Masası (tablolar sürüm 2'de eklendi) ———
export interface Draft {
  id: string; // UUID
  title: string;
  body: string;
  kind: 'deneme' | 'öykü' | 'gezi' | 'video-metni' | 'şiir' | 'diğer';
  tags: string[];
  projectId?: string;
  status: 'taslak' | 'revizyonda' | 'bitti';
  /** Taslağa iliştirilmiş Yol Defteri notları */
  materials?: number[];
  /** Yazılarım'dan masaya alındıysa kaynak denemenin kimliği */
  fromAttempt?: number;
  /** Bu taslakta uyguladığın beceriler (Gelişim ekranında kanıt olarak görünür) */
  skills?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface DraftRevision {
  id: string;
  draftId: string;
  body: string;
  createdAt: string;
  source: 'kontrol-noktası' | 'otomatik' | 'içe-aktarma';
  note?: string;
}

export type ProjectKind = 'serbest' | 'deneme-kitabi' | 'gezi-kitabi' | 'oyku-dosyasi' | 'roman' | 'siir-dosyasi' | 'video-serisi';

/** Proje defteri kartı: türe göre karakter, mekân, durak, sahne… */
export interface ProjectCard {
  id: string;
  type: string;
  title: string;
  body: string;
}

export interface Project {
  id: string;
  title: string;
  description?: string;
  /** Proje türü: araçlar ve bölüm adı buna göre değişir (yoksa 'serbest') */
  kind?: ProjectKind;
  /** Bölüm sırası: taslak kimlikleri */
  order: string[];
  /** Türe göre defter kartları (roman: karakter; gezi: durak…) */
  cards?: ProjectCard[];
  createdAt: string;
  updatedAt: string;
}

// ——— Kütüphanem (sürüm 3) ———
export interface SourceQuote {
  id: string;
  text: string;
  /** Sayfa, dakika ya da bölüm bilgisi */
  where?: string;
  note?: string;
}

export interface LibrarySource {
  id?: number;
  title: string;
  author?: string;
  kind: 'kitap' | 'makale' | 'site' | 'video' | 'podcast' | 'eser' | 'diğer';
  language: 'tr' | 'en' | 'diğer';
  level?: 'başlangıç' | 'orta' | 'ileri';
  /** Nasıl erişilir: "kitapçı / kütüphane", "çevrimiçi, ücretsiz"… */
  access?: string;
  url?: string;
  /** Bu kaynak ne öğretiyor (kısa) */
  teaches?: string;
  skills: string[];
  tags: string[];
  status: 'okunacak' | 'okunuyor' | 'inceledim';
  /** Senin özetin, kendi cümlelerinle */
  summary?: string;
  quotes: SourceQuote[];
  /** Uygulamanın önerdiği bir kaynaktan eklendiyse onun kimliği */
  suggestionId?: string;
  createdAt: string;
  updatedAt: string;
}

/** Kendi kavram kartın: bir kavramı kendi cümlelerinle tanımla, derslere ve eserlere bağla */
export interface ConceptCard {
  id?: number;
  term: string;
  definition: string;
  example?: string;
  skills: string[];
  /** Bağlı dersler (ders kimlikleri) */
  lessons: string[];
  /** Bağlı eserler (taslak kimlikleri) */
  drafts: string[];
  /** Bağlı kaynaklar */
  sources: number[];
  createdAt: string;
  updatedAt: string;
}

export interface Freewrite {
  id?: number;
  date: string; // ISO
  text: string;
  words: number;
  seconds: number;
}

export type Tempo = 'mini' | 'standart' | 'derin';

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
  /** Bu mevsimin ana dalı: yeni malzeme yalnızca buradan gelir */
  seasonBranch: string;
  /** Mevsimin başladığı tarih (YYYY-MM-DD) */
  seasonStartedAt?: string;
  /** Günlük oturum temposu (Aşama C) */
  tempo: Tempo;
  /** Kuyruktaki yazıları yapay zekâya göndermeden önce sor */
  askBeforeSend: boolean;
  /** Oturum başında 5 dk serbest yazma ısınması (Aşama C) */
  warmup: boolean;
  /** Açılmış seçmeli dallar (ör. 'siir') */
  electives: string[];
  /** Son yedeğin alındığı an (ISO) */
  lastBackupAt?: string;
}

export const DEFAULT_MODEL = 'claude-sonnet-5-5';

export const defaultSettings = (): Settings => ({
  key: 'main',
  name: '',
  apiKey: '',
  model: DEFAULT_MODEL,
  theme: 'dark',
  weeklyGoal: 4,
  onboarded: false,
  textScale: 1,
  createdAt: new Date().toISOString(),
  seasonBranch: 'hikaye',
  tempo: 'standart',
  askBeforeSend: false,
  warmup: true,
  electives: [],
});

/**
 * Sürüm 2'de dalı değişen beceriler. Göçler dondurulmuş kayıtlardır: içerik dosyaları
 * sonradan değişse bile bu tablo değişmez.
 */
const V2_SKILL_BRANCH: Record<string, string> = {
  'hk.imge': 'betimleme',
  'hk.atmosfer': 'betimleme',
  'hk.deneme': 'kurgu-disi',
  'hk.ekran': 'ekran',
};

class AppDB extends Dexie {
  skills!: Table<SkillState, string>;
  cards!: Table<ReviewCard, string>;
  attempts!: Table<Attempt, number>;
  progress!: Table<LessonProgress, string>;
  sessions!: Table<SessionRecord, number>;
  journal!: Table<JournalEntry, number>;
  notes!: Table<RoadNote, number>;
  settings!: Table<Settings, string>;
  drafts!: Table<Draft, string>;
  draftRevisions!: Table<DraftRevision, string>;
  projects!: Table<Project, string>;
  freewrites!: Table<Freewrite, number>;
  sources!: Table<LibrarySource, number>;
  concepts!: Table<ConceptCard, number>;

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

    // Sürüm 2 — Yazarlık çatısı: dallar ve mevsim; Yazarın Masası tabloları.
    // Var olan bütün kayıtlar korunur; yalnızca eksik ayarlar eklenir ve taşınan becerilerin dalı güncellenir.
    this.version(2)
      .stores({
        drafts: 'id, updatedAt, projectId, status, *tags',
        draftRevisions: 'id, draftId, createdAt',
        projects: 'id, updatedAt',
        freewrites: '++id, date',
      })
      .upgrade(async (tx) => {
        await tx
          .table('settings')
          .toCollection()
          .modify((st: Partial<Settings>) => {
            st.seasonBranch ??= 'hikaye';
            st.seasonStartedAt ??= new Date().toISOString().slice(0, 10);
            st.tempo ??= 'standart';
            st.askBeforeSend ??= false;
            st.warmup ??= true;
            st.electives ??= [];
          });
        await tx
          .table('skills')
          .toCollection()
          .modify((sk: SkillState) => {
            const to = V2_SKILL_BRANCH[sk.id];
            if (to) sk.moduleId = to;
          });
      });

    // Sürüm 3 — Kütüphanem: kaynaklar ve kavram kartları. Var olan kayıtlar değişmez.
    this.version(3).stores({
      sources: '++id, status, kind, updatedAt, suggestionId, *skills, *tags',
      concepts: '++id, term, updatedAt, *skills',
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
