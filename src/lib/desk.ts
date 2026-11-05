/**
 * Yazarın Masası: serbest taslaklar, sürüm geçmişi ve projeler.
 *
 * Kayıt modeli:
 *  • Taslağın güncel metni `drafts.body` alanındadır; yazarken otomatik kaydedilir (cihazda, anında).
 *  • Sürüm (DraftRevision) iki yolla oluşur:
 *      – "Kontrol noktası": yazar elle kaydeder, isteğe bağlı not ekler;
 *      – otomatik: taslaktan çıkarken metin son sürümden farklıysa ve son sürümün üstünden
 *        AUTO_GAP_MIN dakika geçtiyse.
 *  • Eski bir sürüme dönmeden önce güncel metin her zaman sürüm olarak saklanır; dönüş geri alınabilir.
 */
import { db, type Draft, type DraftRevision, type Project } from '../db/db';
import { lower, today, wordCount } from './tr';

export const AUTO_GAP_MIN = 10;

export const DRAFT_KINDS: { id: Draft['kind']; label: string }[] = [
  { id: 'deneme', label: 'Deneme' },
  { id: 'gezi', label: 'Gezi yazısı' },
  { id: 'öykü', label: 'Öykü' },
  { id: 'video-metni', label: 'Video metni' },
  { id: 'şiir', label: 'Şiir' },
  { id: 'diğer', label: 'Diğer' },
];

export const DRAFT_STATUS: { id: Draft['status']; label: string }[] = [
  { id: 'taslak', label: 'Taslak' },
  { id: 'revizyonda', label: 'Revizyonda' },
  { id: 'bitti', label: 'Bitti' },
];

export const kindLabel = (k: Draft['kind']) => DRAFT_KINDS.find((x) => x.id === k)?.label ?? k;
export const statusLabel = (s: Draft['status']) => DRAFT_STATUS.find((x) => x.id === s)?.label ?? s;

const uuid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

const now = () => new Date().toISOString();

/** Tarayıcıdan, depolama baskısında bu sitenin verisini silmemesini ister (destekleniyorsa). */
export async function requestPersistentStorage() {
  try {
    if (navigator.storage?.persist && !(await navigator.storage.persisted())) await navigator.storage.persist();
  } catch {
    /* desteklenmiyorsa sorun değil */
  }
}

// ——— Taslaklar ———

export async function createDraft(init: Partial<Draft> = {}): Promise<string> {
  const d: Draft = {
    id: uuid(),
    title: init.title ?? '',
    body: init.body ?? '',
    kind: init.kind ?? 'deneme',
    tags: init.tags ?? [],
    projectId: init.projectId,
    status: init.status ?? 'taslak',
    materials: init.materials ?? [],
    fromAttempt: init.fromAttempt,
    createdAt: now(),
    updatedAt: now(),
  };
  await db.drafts.add(d);
  if (d.projectId) await appendToProject(d.projectId, d.id);
  // Başlangıç metni varsa ilk sürüm olarak sakla (ör. Yazılarım'dan masaya alınan metin)
  if (d.body.trim()) await addRevision(d.id, d.body, 'içe-aktarma', init.fromAttempt != null ? 'Yazılarım\'dan alındı' : undefined);
  void requestPersistentStorage();
  return d.id;
}

export async function updateDraft(id: string, patch: Partial<Omit<Draft, 'id' | 'createdAt'>>) {
  await db.drafts.update(id, { ...patch, updatedAt: now() });
}

/** Taslağı ve bütün sürümlerini siler; projedeki yerini de kaldırır. */
export async function deleteDraft(id: string) {
  const d = await db.drafts.get(id);
  await db.transaction('rw', db.drafts, db.draftRevisions, db.projects, async () => {
    await db.draftRevisions.where('draftId').equals(id).delete();
    await db.drafts.delete(id);
    if (d?.projectId) {
      const p = await db.projects.get(d.projectId);
      if (p) await db.projects.update(p.id, { order: p.order.filter((x) => x !== id), updatedAt: now() });
    }
  });
}

// ——— Sürümler ———

export async function revisionsOf(draftId: string): Promise<DraftRevision[]> {
  return (await db.draftRevisions.where('draftId').equals(draftId).sortBy('createdAt')).reverse();
}

export async function addRevision(draftId: string, body: string, source: DraftRevision['source'], note?: string) {
  const rev: DraftRevision = { id: uuid(), draftId, body, createdAt: now(), source, note: note?.trim() || undefined };
  await db.draftRevisions.add(rev);
  return rev;
}

/** Elle kontrol noktası. Metin son sürümle aynıysa yalnızca not eklenir (yinelenen sürüm oluşmaz). */
export async function checkpoint(draftId: string, body: string, note?: string) {
  const [last] = await revisionsOf(draftId);
  if (last && last.body === body) {
    if (note?.trim()) await db.draftRevisions.update(last.id, { note: note.trim(), source: 'kontrol-noktası' });
    return last;
  }
  return addRevision(draftId, body, 'kontrol-noktası', note);
}

/** Taslaktan çıkarken çağrılır: metin değiştiyse ve yeterince zaman geçtiyse otomatik sürüm. */
export async function autoRevision(draftId: string, body: string) {
  if (!body.trim()) return;
  if (!(await db.drafts.get(draftId))) return; // taslak az önce silindiyse sahipsiz sürüm bırakma
  const [last] = await revisionsOf(draftId);
  if (last?.body === body) return;
  const gapOk = !last || Date.now() - Date.parse(last.createdAt) > AUTO_GAP_MIN * 60_000;
  if (gapOk) await addRevision(draftId, body, 'otomatik');
}

/** Eski bir sürüme döner. Önce güncel metni sürüm olarak saklar; böylece dönüş geri alınabilir. */
export async function restoreRevision(draftId: string, revisionId: string) {
  const [d, rev] = await Promise.all([db.drafts.get(draftId), db.draftRevisions.get(revisionId)]);
  if (!d || !rev) return;
  const [last] = await revisionsOf(draftId);
  if (d.body.trim() && last?.body !== d.body) await addRevision(draftId, d.body, 'otomatik', 'Geri dönmeden önceki hâl');
  await updateDraft(draftId, { body: rev.body });
}

// ——— Projeler ———

export async function createProject(title: string, description?: string): Promise<string> {
  const p: Project = { id: uuid(), title: title.trim() || 'Adsız proje', description, order: [], createdAt: now(), updatedAt: now() };
  await db.projects.add(p);
  return p.id;
}

export async function updateProject(id: string, patch: Partial<Omit<Project, 'id' | 'createdAt'>>) {
  await db.projects.update(id, { ...patch, updatedAt: now() });
}

async function appendToProject(projectId: string, draftId: string) {
  const p = await db.projects.get(projectId);
  if (p && !p.order.includes(draftId)) await updateProject(projectId, { order: [...p.order, draftId] });
}

/** Taslağı bir projeye taşır (ya da projeden çıkarır: projectId boş). */
export async function setDraftProject(draftId: string, projectId: string | undefined) {
  const d = await db.drafts.get(draftId);
  if (!d || d.projectId === projectId) return;
  if (d.projectId) {
    const old = await db.projects.get(d.projectId);
    if (old) await updateProject(old.id, { order: old.order.filter((x) => x !== draftId) });
  }
  await updateDraft(draftId, { projectId });
  if (projectId) await appendToProject(projectId, draftId);
}

export async function moveInProject(projectId: string, draftId: string, delta: -1 | 1) {
  const p = await db.projects.get(projectId);
  if (!p) return;
  const i = p.order.indexOf(draftId);
  const j = i + delta;
  if (i < 0 || j < 0 || j >= p.order.length) return;
  const order = [...p.order];
  [order[i], order[j]] = [order[j], order[i]];
  await updateProject(projectId, { order });
}

/** Projeyi siler; taslaklar silinmez, yalnızca projeden çıkar. */
export async function deleteProject(projectId: string) {
  await db.transaction('rw', db.projects, db.drafts, async () => {
    await db.drafts.where('projectId').equals(projectId).modify((d) => {
      d.projectId = undefined;
    });
    await db.projects.delete(projectId);
  });
}

/** Projenin taslakları, bölüm sırasıyla (sırada olmayanlar sona) */
export async function projectDrafts(p: Project): Promise<Draft[]> {
  const all = await db.drafts.where('projectId').equals(p.id).toArray();
  const pos = (id: string) => {
    const i = p.order.indexOf(id);
    return i < 0 ? Number.MAX_SAFE_INTEGER : i;
  };
  return all.sort((a, b) => pos(a.id) - pos(b.id) || a.createdAt.localeCompare(b.createdAt));
}

// ——— Markdown dışa aktarma ———

/** Türkçe karakterleri sadeleştirerek dosya adı üretir: "Yolun Ötesi" → "yolun-otesi" */
export function slugify(s: string): string {
  const map: Record<string, string> = { ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u', â: 'a', î: 'i', û: 'u' };
  return (
    lower(s)
      .replace(/[çğıöşüâîû]/g, (c) => map[c] ?? c)
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'adsiz'
  );
}

export const draftTitle = (d: Pick<Draft, 'title' | 'body'>) =>
  d.title.trim() || d.body.trim().split(/\s+/).slice(0, 6).join(' ') || 'Adsız taslak';

export function draftToMarkdown(d: Draft, level = 1): string {
  const h = '#'.repeat(level);
  return `${h} ${draftTitle(d)}\n\n${d.body.trim()}\n`;
}

export async function projectToMarkdown(p: Project): Promise<string> {
  const drafts = await projectDrafts(p);
  const head = `# ${p.title}\n\n${p.description?.trim() ? p.description.trim() + '\n\n' : ''}`;
  return head + drafts.map((d) => draftToMarkdown(d, 2)).join('\n');
}

export function downloadText(filename: string, text: string, type = 'text/markdown;charset=utf-8') {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export const exportDraft = (d: Draft) => downloadText(`${slugify(draftTitle(d))}.md`, draftToMarkdown(d));

export async function exportProject(p: Project) {
  downloadText(`${slugify(p.title)}-${today()}.md`, await projectToMarkdown(p));
}

export const draftWords = (d: Pick<Draft, 'body'>) => wordCount(d.body);
