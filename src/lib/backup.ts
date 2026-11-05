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

/** Yedeği geri yükler: mevcut verinin YERİNE geçer. */
export async function importData(text: string): Promise<{ counts: Record<string, number> }> {
  const parsed = JSON.parse(text) as BackupFile;
  if (parsed?.app !== 'ruzgarla-dans' || !parsed.data) throw new Error('Bu dosya bir Rüzgârla Dans yedeği değil.');
  const currentKey = (await db.settings.get('main'))?.apiKey ?? '';
  const counts: Record<string, number> = {};
  await db.transaction('rw', TABLES.map((t) => db.table(t)), async () => {
    for (const t of TABLES) {
      const rows = (parsed.data[t] ?? []) as Record<string, unknown>[];
      await db.table(t).clear();
      if (t === 'settings') {
        // Yedekte anahtar yoksa bu cihazdaki anahtarı koru
        for (const r of rows) if (!r.apiKey) r.apiKey = currentKey;
        // Eski sürüm yedeklerinde olmayan ayarları varsayılanlarla tamamla
        for (let i = 0; i < rows.length; i++) rows[i] = { ...defaultSettings(), ...rows[i] };
      }
      if (t === 'skills' && parsed.version === 1) {
        // Sürüm 1 yedeği: dalı değişen becerileri güncelle (db.ts'deki göçle aynı)
        const moved: Record<string, string> = { 'hk.imge': 'betimleme', 'hk.atmosfer': 'betimleme', 'hk.deneme': 'kurgu-disi', 'hk.ekran': 'ekran' };
        for (const r of rows) if (moved[r.id as string]) r.moduleId = moved[r.id as string];
      }
      await db.table(t).bulkPut(rows);
      counts[t] = rows.length;
    }
  });
  return { counts };
}

export async function wipeAll() {
  await db.transaction('rw', TABLES.map((t) => db.table(t)), async () => {
    for (const t of TABLES) await db.table(t).clear();
  });
}
