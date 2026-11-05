/**
 * Yedekleme: tüm veriyi tek bir JSON dosyasına yazar ve geri yükler.
 * API anahtarı yedeğe isteğe bağlı olarak dâhil edilir (varsayılan: hayır).
 */
import { db } from '../db/db';
import { today } from './tr';

const TABLES = ['skills', 'cards', 'attempts', 'progress', 'sessions', 'journal', 'notes', 'settings'] as const;
type TableName = (typeof TABLES)[number];

export interface BackupFile {
  app: 'ruzgarla-dans';
  version: 1;
  exportedAt: string;
  data: Record<TableName, unknown[]>;
}

export async function exportData(includeApiKey = false): Promise<BackupFile> {
  const data = {} as Record<TableName, unknown[]>;
  for (const t of TABLES) data[t] = await db.table(t).toArray();
  if (!includeApiKey) data.settings = (data.settings as { apiKey?: string }[]).map((s) => ({ ...s, apiKey: '' }));
  return { app: 'ruzgarla-dans', version: 1, exportedAt: new Date().toISOString(), data };
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
