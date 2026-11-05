/**
 * Yedekleme: tüm veriyi tek bir JSON dosyasına yazar ve geri yükler.
 * API anahtarı yedeğe isteğe bağlı olarak dâhil edilir (varsayılan: hayır).
 */
import { db, defaultSettings, updateSettings } from '../db/db';
import { today } from './tr';

const TABLES = [
  'skills',
  'cards',
  'attempts',
  'progress',
  'sessions',
  'journal',
  'notes',
  'settings',
  // sürüm 2
  'drafts',
  'draftRevisions',
  'projects',
  'freewrites',
] as const;
type TableName = (typeof TABLES)[number];

export interface BackupFile {
  app: 'ruzgarla-dans';
  /** 1: ilk sürüm; 2: Yazarlık çatısı (Masa tabloları eklendi). Eski yedekler de geri yüklenebilir. */
  version: 1 | 2;
  exportedAt: string;
  data: Record<TableName, unknown[]>;
}

export async function exportData(includeApiKey = false): Promise<BackupFile> {
  const data = {} as Record<TableName, unknown[]>;
  for (const t of TABLES) data[t] = await db.table(t).toArray();
  if (!includeApiKey) data.settings = (data.settings as { apiKey?: string }[]).map((s) => ({ ...s, apiKey: '' }));
  return { app: 'ruzgarla-dans', version: 2, exportedAt: new Date().toISOString(), data };
}

export async function downloadBackup(includeApiKey = false) {
  const backup = await exportData(includeApiKey);
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ruzgarla-dans-yedek-${today()}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  await updateSettings({ lastBackupAt: new Date().toISOString() });
}

// ——— İçe aktarma ———

export const TABLE_LABELS: Record<TableName, string> = {
  skills: 'beceri',
  cards: 'tekrar kartı',
  attempts: 'alıştırma denemesi',
  progress: 'ilerleme kaydı',
  sessions: 'oturum',
  journal: 'günce notu',
  notes: 'Yol Defteri notu',
  settings: 'ayar',
  drafts: 'taslak',
  draftRevisions: 'taslak sürümü',
  projects: 'proje',
  freewrites: 'serbest yazı',
};

type Row = Record<string, unknown>;

/**
 * Dosyayı okur ve doğrular. Hiçbir şey yazmaz.
 * Geçersizse anlaşılır bir hata fırlatır; mevcut veriye dokunulmaz.
 */
export function parseBackup(text: string): BackupFile {
  let parsed: BackupFile;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('Dosya okunamadı: geçerli bir JSON değil.');
  }
  if (parsed?.app !== 'ruzgarla-dans' || typeof parsed.data !== 'object' || parsed.data === null)
    throw new Error('Bu dosya bir Rüzgârla Dans yedeği değil.');
  if (parsed.version !== 1 && parsed.version !== 2)
    throw new Error(`Bu yedek uygulamanın daha yeni bir sürümüyle alınmış (sürüm ${String(parsed.version)}). Önce uygulamayı güncelle.`);
  for (const t of TABLES) {
    const rows = parsed.data[t];
    if (rows !== undefined && !Array.isArray(rows)) throw new Error(`Yedek bozuk görünüyor: "${t}" bir liste değil.`);
  }
  return parsed;
}

export interface BackupPreview {
  version: 1 | 2;
  exportedAt?: string;
  counts: Partial<Record<TableName, number>>;
  hasApiKey: boolean;
}

export function previewBackup(b: BackupFile): BackupPreview {
  const counts: Partial<Record<TableName, number>> = {};
  for (const t of TABLES) counts[t] = (b.data[t] ?? []).length;
  const settings = (b.data.settings ?? []) as Row[];
  return { version: b.version, exportedAt: b.exportedAt, counts, hasApiKey: settings.some((r) => !!r.apiKey) };
}

/** Eski sürüm yedeklerini bugünkü şemaya uyarlar (db.ts'deki göçlerle aynı kurallar) */
function normalize(b: BackupFile, currentKey: string): Record<TableName, Row[]> {
  const out = {} as Record<TableName, Row[]>;
  for (const t of TABLES) out[t] = ((b.data[t] ?? []) as Row[]).map((r) => ({ ...r }));
  // Yedekte anahtar yoksa bu cihazdaki anahtarı koru; eksik ayarları varsayılanla tamamla
  out.settings = out.settings.map((r) => ({ ...defaultSettings(), ...r, apiKey: (r.apiKey as string) || currentKey }));
  if (b.version === 1) {
    const moved: Record<string, string> = { 'hk.imge': 'betimleme', 'hk.atmosfer': 'betimleme', 'hk.deneme': 'kurgu-disi', 'hk.ekran': 'ekran' };
    for (const r of out.skills) if (moved[r.id as string]) r.moduleId = moved[r.id as string];
  }
  return out;
}

/** YERİNE KOY: bu cihazdaki bütün veri silinir, yedekteki veri yazılır. */
export async function importData(text: string): Promise<{ counts: Record<string, number> }> {
  return replaceWith(parseBackup(text));
}

export async function replaceWith(b: BackupFile): Promise<{ counts: Record<string, number> }> {
  const currentKey = (await db.settings.get('main'))?.apiKey ?? '';
  const data = normalize(b, currentKey);
  const counts: Record<string, number> = {};
  await db.transaction('rw', TABLES.map((t) => db.table(t)), async () => {
    for (const t of TABLES) {
      await db.table(t).clear();
      await db.table(t).bulkPut(data[t]);
      counts[t] = data[t].length;
    }
  });
  return { counts };
}

/**
 * BİRLEŞTİR: bu cihazdaki veri korunur, yedekte olup burada olmayanlar eklenir.
 * İki cihazda (ör. telefon ve MacBook) ayrı ayrı çalışıldığında kullanılır.
 *  • Ayarlar: bu cihazınkiler kalır.
 *  • Beceriler: en son çalışılmış olan hâl kalır. Tekrar kartları: tekrar günü daha ileride olan.
 *  • İlerleme: iki taraftan hangisi daha ilerideyse.
 *  • Denemeler, oturumlar, günce, notlar, serbest yazılar: aynısı yoksa eklenir (yeni kimlikle;
 *    aralarındaki bağlantılar — yeniden yazım zinciri, oturum, iliştirilmiş notlar — korunur).
 *  • Taslaklar ve projeler: yoksa eklenir, varsa daha yeni düzenlenmiş olan kalır. Sürümler eklenir.
 */
export async function mergeWith(b: BackupFile): Promise<{ added: Record<string, number> }> {
  const currentKey = (await db.settings.get('main'))?.apiKey ?? '';
  const data = normalize(b, currentKey);
  const added: Record<string, number> = {};
  const inc = (t: string) => (added[t] = (added[t] ?? 0) + 1);

  await db.transaction('rw', TABLES.map((t) => db.table(t)), async () => {
    // Ayarlar: yalnızca bu cihazda hiç yoksa
    if (!(await db.settings.get('main')) && data.settings[0]) {
      await db.settings.put(data.settings[0] as never);
      inc('settings');
    }

    for (const r of data.skills) {
      const cur = await db.skills.get(r.id as string);
      if (!cur || String(r.lastPracticed ?? '') > String(cur.lastPracticed ?? '')) {
        await db.skills.put(r as never);
        inc('skills');
      }
    }
    for (const r of data.cards) {
      const cur = await db.cards.get(r.exerciseId as string);
      if (!cur || String(r.due) > cur.due) {
        await db.cards.put(r as never);
        inc('cards');
      }
    }
    for (const r of data.progress) {
      const cur = await db.progress.get(r.lessonId as string);
      if (!cur) {
        await db.progress.put(r as never);
        inc('progress');
      } else if ((!cur.completed && r.completed) || Number(r.index) > cur.index) {
        await db.progress.put({ ...cur, completed: cur.completed || !!r.completed, index: Math.max(cur.index, Number(r.index)), completedAt: cur.completedAt ?? (r.completedAt as string | undefined) });
        inc('progress');
      }
    }

    // Otomatik kimlikli tablolar: içerikle eşleştir, yoksa yeni kimlikle ekle; eski→yeni kimlik haritası tut
    const sessionMap = new Map<number, number>();
    const existingSessions = await db.sessions.toArray();
    for (const r of data.sessions) {
      const oldId = r.id as number;
      const match = existingSessions.find((s) => s.startedAt === r.startedAt);
      if (match) sessionMap.set(oldId, match.id!);
      else {
        const { id: _drop, ...rest } = r;
        sessionMap.set(oldId, await db.sessions.add(rest as never));
        inc('sessions');
      }
    }

    const attemptMap = new Map<number, number>();
    const existingAttempts = await db.attempts.toArray();
    const newAttemptIds: number[] = [];
    for (const r of data.attempts) {
      const oldId = r.id as number;
      const match = existingAttempts.find((a) => a.exerciseId === r.exerciseId && a.date === r.date);
      if (match) attemptMap.set(oldId, match.id!);
      else {
        const { id: _drop, ...rest } = r;
        if (rest.sessionId != null) rest.sessionId = sessionMap.get(rest.sessionId as number);
        const nid = await db.attempts.add(rest as never);
        attemptMap.set(oldId, nid);
        newAttemptIds.push(nid);
        inc('attempts');
      }
    }
    // Yeniden yazım zincirini (rootId) yeni kimliklere bağla
    for (const nid of newAttemptIds) {
      const a = await db.attempts.get(nid);
      if (a?.rootId != null) await db.attempts.update(nid, { rootId: attemptMap.get(a.rootId) });
    }

    const existingJournal = await db.journal.toArray();
    for (const r of data.journal) {
      if (existingJournal.some((j) => j.date === r.date && j.text === r.text)) continue;
      const { id: _drop, ...rest } = r;
      if (rest.sessionId != null) rest.sessionId = sessionMap.get(rest.sessionId as number);
      await db.journal.add(rest as never);
      inc('journal');
    }

    const noteMap = new Map<number, number>();
    const existingNotes = await db.notes.toArray();
    for (const r of data.notes) {
      const oldId = r.id as number;
      const match = existingNotes.find((n) => n.date === r.date && n.text === r.text);
      if (match) noteMap.set(oldId, match.id!);
      else {
        const { id: _drop, ...rest } = r;
        noteMap.set(oldId, await db.notes.add(rest as never));
        inc('notes');
      }
    }

    const existingFw = await db.freewrites.toArray();
    for (const r of data.freewrites) {
      if (existingFw.some((f) => f.date === r.date)) continue;
      const { id: _drop, ...rest } = r;
      await db.freewrites.add(rest as never);
      inc('freewrites');
    }

    // UUID kimlikli tablolar
    for (const r of data.projects) {
      const cur = await db.projects.get(r.id as string);
      if (!cur || String(r.updatedAt) > cur.updatedAt) {
        await db.projects.put(r as never);
        inc('projects');
      }
    }
    for (const r of data.drafts) {
      const cur = await db.drafts.get(r.id as string);
      if (!cur || String(r.updatedAt) > cur.updatedAt) {
        const materials = ((r.materials as number[] | undefined) ?? []).map((m) => noteMap.get(m)).filter((m): m is number => m != null);
        const fromAttempt = r.fromAttempt != null ? attemptMap.get(r.fromAttempt as number) : undefined;
        await db.drafts.put({ ...r, materials, fromAttempt } as never);
        inc('drafts');
      }
    }
    for (const r of data.draftRevisions) {
      if (await db.draftRevisions.get(r.id as string)) continue;
      await db.draftRevisions.put(r as never);
      inc('draftRevisions');
    }
  });
  return { added };
}

/** Sayıları okunur bir cümleye çevirir: "3 taslak, 12 alıştırma denemesi" */
export function describeCounts(counts: Partial<Record<string, number>>): string {
  const parts = Object.entries(counts)
    .filter(([t, n]) => n && t !== 'settings')
    .map(([t, n]) => `${n} ${TABLE_LABELS[t as TableName] ?? t}`);
  return parts.length ? parts.join(', ') : 'yeni kayıt yok';
}

export async function wipeAll() {
  await db.transaction('rw', TABLES.map((t) => db.table(t)), async () => {
    for (const t of TABLES) await db.table(t).clear();
  });
}
