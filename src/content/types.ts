/**
 * İÇERİK FORMATI
 * ---------------
 * Tüm dersler, alıştırmalar ve beceriler bu tiplerle tanımlanır ve kod içinde değil,
 * `src/content/<modül>/` altındaki veri dosyalarında durur. Yeni bir ders eklemek için
 * yalnızca bu dosyalara yeni nesneler eklemek yeterlidir; motor gerisini kendisi halleder.
 *
 * Hiyerarşi: Yazarlık → BranchDef (dal) → UnitDef → LessonDef → Exercise
 * Beceriler (SkillDef) dal düzeyinde tanımlanır; alıştırmalar `skills` alanıyla
 * bu becerilere etiketlenir. Bir alıştırma başka dalların becerilerine de etiketlenebilir.
 */

export type ExerciseType =
  | 'concept' // Kavram kartı
  | 'choice' // Çoktan seçmeli / doğru-yanlış
  | 'discern' // Ayırt et: iki pasaj
  | 'missing' // Eksik unsuru bul
  | 'rewrite' // Zayıf metni yeniden yaz
  | 'write' // Kendi malzemenle yaz
  | 'video'; // Video düşüncesi (yazılı plan)

/** 1: kolay/küçük parça, 2: normal, 3: zorlayıcı */
export type Difficulty = 1 | 2 | 3;

interface ExerciseBase {
  id: string;
  type: ExerciseType;
  /** Etiketlendiği beceri kimlikleri (ilk sıradaki birincil beceridir). */
  skills: string[];
  difficulty?: Difficulty;
}

export interface ConceptExercise extends ExerciseBase {
  type: 'concept';
  title: string;
  /** Paragraflar. Tek fikir, önce bağlam sonra mekanik. */
  body: string[];
  /** Tek örnek (isteğe bağlı) */
  example?: { label?: string; text: string; note?: string };
  /** Kartın altında duran tek cümlelik özet */
  takeaway?: string;
}

export interface ChoiceExercise extends ExerciseBase {
  type: 'choice';
  prompt: string;
  /** Soruya eşlik eden kısa pasaj (isteğe bağlı) */
  passage?: string;
  options: string[];
  correct: number;
  /** Her cevaptan sonra gösterilen "neden" açıklaması */
  explanation: string;
}

export interface DiscernExercise extends ExerciseBase {
  type: 'discern';
  prompt: string;
  passages: { label: string; text: string }[];
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

export interface MissingExercise extends ExerciseBase {
  type: 'missing';
  prompt: string;
  draft: string;
  options: string[];
  correct: number;
  explanation: string;
}

/** Yazma alıştırmalarının ölçütü. Öz-değerlendirmede ve yapay zekâda aynen kullanılır. */
export interface RubricItem {
  skill: string;
  /** "Önceki hâl en az bir davranışla gösterilmiş mi?" gibi evet/hayır sorulabilir ölçüt */
  criterion: string;
}

export interface RewriteExercise extends ExerciseBase {
  type: 'rewrite';
  prompt: string;
  source: string;
  rubric: RubricItem[];
  hint?: string;
  /** Değerlendirmeden sonra gösterilen örnek bir güçlendirme */
  sample?: string;
}

export interface WriteExercise extends ExerciseBase {
  type: 'write';
  prompt: string;
  rubric: RubricItem[];
  hint?: string;
  /** Yol Defteri'nden malzeme önerirken tercih edilen etiketler */
  noteTags?: RoadNoteTag[];
  /** Önerilen uzunluk (kelime) */
  words?: [number, number];
  /** Ünite sonu atölye görevi mi? */
  atelier?: boolean;
}

export interface VideoExercise extends ExerciseBase {
  type: 'video';
  prompt: string;
  fields: { key: string; label: string; placeholder?: string }[];
  rubric: RubricItem[];
  hint?: string;
}

export type Exercise =
  | ConceptExercise
  | ChoiceExercise
  | DiscernExercise
  | MissingExercise
  | RewriteExercise
  | WriteExercise
  | VideoExercise;

export type WritingExercise = RewriteExercise | WriteExercise | VideoExercise;

export const isWriting = (e: Exercise): e is WritingExercise =>
  e.type === 'rewrite' || e.type === 'write' || e.type === 'video';

export const isObjective = (
  e: Exercise,
): e is ChoiceExercise | DiscernExercise | MissingExercise =>
  e.type === 'choice' || e.type === 'discern' || e.type === 'missing';

export type RoadNoteTag = 'insan' | 'mekân' | 'an' | 'düşünce';

export interface SkillDef {
  id: string;
  /** Becerinin ait olduğu dalın kimliği (tarihsel nedenle adı moduleId; veritabanı dizini) */
  moduleId: string;
  name: string;
  /** Tek cümlelik tanım; "Eksiklerim" ekranında görünür */
  description: string;
  /** Alt beceri ise üst becerinin kimliği. Zorlanınca motor alt becerilere iner. */
  parent?: string;
  /** Başka modüllerdeki akraba beceriler (ör. video modülünde "öncesi/sonrası planı") */
  links?: string[];
}

export interface LessonDef {
  id: string;
  title: string;
  /** Dersin ana akışı (kavram kartları + alıştırmalar) */
  steps: Exercise[];
  /** Ders sonu kısa sınav */
  quiz: Exercise[];
}

export interface UnitDef {
  id: string;
  number: number;
  title: string;
  summary: string;
  /** Bir sonraki üniteyi açmak için eşik geçilmesi gereken temel beceriler */
  keySkills: string[];
  lessons: LessonDef[];
  /** Ünite sonu atölye görevi (uzun yazma) */
  atelier?: WriteExercise;
  /** Tekrar ve güçlendirme havuzu: günlük derste zayıf beceriler için kullanılır */
  practice: Exercise[];
  /** İçerik henüz yazılmadıysa true; yolda "yakında" görünür */
  draft?: boolean;
  /** Taslak ünitelerde planlanan ders başlıkları */
  plannedLessons?: string[];
}

/** Yazarlık çatısı altındaki bir dal (ör. Hikâye Anlatımı, Gezi Yazısı). */
export interface BranchDef {
  id: string;
  /** Yoldaki sıra numarası (D1, D2…) */
  order: number;
  title: string;
  /** Dal seçicide görünen kısa ad */
  short: string;
  description: string;
  /** İçeriği yazılmış en az bir ünitesi varsa true; değilse "yakında" görünür */
  available: boolean;
  /** Seçmeli dal: motor kendiliğinden önermez, Ayarlar'dan açılır */
  elective?: boolean;
  /** Bu dal açılmadan önce bütün dersleri bitmiş olması gereken ünite kimlikleri */
  prerequisites?: string[];
  skills: SkillDef[];
  units: UnitDef[];
}

/** @deprecated Eski ad. Yeni kodda BranchDef kullan. */
export type ModuleDef = BranchDef;
