/**
 * Kütüphanem: kaynaklar, kavramlar ve alıntılar.
 * Uygulama dış kaynakları kopyalamaz; seni iyi kaynağa yönlendirir ve orada öğrendiğini
 * kendi çalışma alanına (kavram kartı, özet, alıntı, eser) bağlamanı sağlar.
 */
import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type ConceptCard, type LibrarySource } from '../db/db';
import { SUGGESTED_SOURCES, type SuggestedSource } from '../content/library';
import { BRANCHES, contentUnits, lessonById, skillById } from '../content';
import type { ConceptExercise, LessonDef } from '../content/types';
import { go } from '../lib/router';
import { normalize } from '../lib/tr';
import { draftTitle } from '../lib/desk';
import { Tabs, useToast } from '../components/ui';
import SkillPicker from '../components/SkillPicker';

type Tab = 'kaynaklar' | 'kavramlar' | 'alintilar';

export const SOURCE_KINDS: { id: LibrarySource['kind']; label: string }[] = [
  { id: 'kitap', label: 'Kitap' },
  { id: 'eser', label: 'Edebî eser' },
  { id: 'makale', label: 'Makale' },
  { id: 'site', label: 'Site' },
  { id: 'video', label: 'Video' },
  { id: 'podcast', label: 'Podcast' },
  { id: 'diğer', label: 'Diğer' },
];
export const STATUS_LABEL: Record<LibrarySource['status'], string> = { okunacak: 'Okunacak', okunuyor: 'Okunuyor', inceledim: 'İnceledim' };
const LANG_LABEL: Record<LibrarySource['language'], string> = { tr: 'Türkçe', en: 'İngilizce', diğer: 'Başka dil' };

export default function Library({ query }: { query: URLSearchParams }) {
  const t = query.get('t');
  const tab: Tab = t === 'kavramlar' ? 'kavramlar' : t === 'alintilar' ? 'alintilar' : 'kaynaklar';
  return (
    <div className="fade">
      <div className="eyebrow">Kütüphanem</div>
      <h1>Okuduklarım, öğrendiklerim</h1>
      <Tabs
        value={tab}
        onChange={(v) => go(v === 'kaynaklar' ? '/library' : `/library?t=${v}`)}
        items={[
          ['kaynaklar', 'Kaynaklar'],
          ['kavramlar', 'Kavramlar'],
          ['alintilar', 'Alıntılar'],
        ]}
      />
      {tab === 'kaynaklar' && <Sources />}
      {tab === 'kavramlar' && <Concepts />}
      {tab === 'alintilar' && <Quotes />}
    </div>
  );
}

// ——— Kaynaklar ———

const now = () => new Date().toISOString();

export async function addSuggestion(s: SuggestedSource): Promise<number> {
  const { id, ...rest } = s;
  return db.sources.add({ ...rest, suggestionId: id, status: 'okunacak', quotes: [], createdAt: now(), updatedAt: now() });
}

function Sources() {
  const mine = useLiveQuery(() => db.sources.orderBy('updatedAt').reverse().toArray(), []) ?? [];
  const [q, setQ] = useState('');
  const [skill, setSkill] = useState('');
  const [adding, setAdding] = useState(false);
  const [toast, show] = useToast();

  const added = new Set(mine.map((m) => m.suggestionId).filter(Boolean));
  const nq = normalize(q);
  const match = (x: { title: string; author?: string; teaches?: string; tags: string[]; skills: string[] }) =>
    (!nq || normalize(`${x.title} ${x.author ?? ''} ${x.teaches ?? ''} ${x.tags.join(' ')}`).includes(nq)) &&
    (!skill || x.skills.includes(skill));
  const suggestions = SUGGESTED_SOURCES.filter((s) => !added.has(s.id) && match(s));
  const shown = mine.filter(match);
  const skillsInUse = [...new Set([...SUGGESTED_SOURCES, ...mine].flatMap((x) => x.skills))]
    .map((id) => skillById.get(id))
    .filter((x): x is NonNullable<typeof x> => !!x)
    .sort((a, b) => a.name.localeCompare(b.name, 'tr'));

  return (
    <>
      <div className="row" style={{ gap: 8 }}>
        <input type="search" placeholder="Kaynaklarda ara" value={q} onChange={(e) => setQ(e.target.value)} className="grow" />
      </div>
      <select value={skill} onChange={(e) => setSkill(e.target.value)} aria-label="Beceriye göre süz" style={{ marginTop: 8 }}>
        <option value="">Bütün beceriler</option>
        {skillsInUse.map((s) => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </select>

      <button className="btn block" style={{ marginTop: 12 }} onClick={() => setAdding(!adding)}>
        {adding ? 'Vazgeç' : 'Kendi kaynağını ekle'}
      </button>
      {adding && <NewSource onDone={(id) => { setAdding(false); go(`/source/${id}`); }} />}

      {(['okunuyor', 'okunacak', 'inceledim'] as const).map((st) => {
        const list = shown.filter((s) => s.status === st);
        if (!list.length) return null;
        return (
          <section key={st} style={{ marginTop: 18 }}>
            <div className="eyebrow">{STATUS_LABEL[st]} · {list.length}</div>
            <div className="list">
              {list.map((s) => (
                <a key={s.id} className="list-link" href={`#/source/${s.id}`}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--serif)' }}>{s.title}</div>
                    <div className="tiny faint">
                      {[s.author, SOURCE_KINDS.find((k) => k.id === s.kind)?.label, s.quotes.length ? `${s.quotes.length} alıntı` : '', s.summary ? 'özet var' : '']
                        .filter(Boolean)
                        .join(' · ')}
                    </div>
                  </div>
                  <span className="chev">›</span>
                </a>
              ))}
            </div>
          </section>
        );
      })}
      {mine.length === 0 && <p className="small muted" style={{ marginTop: 16 }}>Henüz kaynak eklemedin. Aşağıdaki önerilerle başlayabilirsin.</p>}

      {suggestions.length > 0 && (
        <section style={{ marginTop: 22 }}>
          <div className="eyebrow">Öneriler</div>
          <p className="tiny faint">
            Uygulamanın önerdiği kaynaklar. Edinmeden önce baskı ve künye bilgisini kontrol et; kamu malı eserlerin yeni
            baskılarındaki önsöz ya da sadeleştirme korunuyor olabilir.
          </p>
          {suggestions.map((s) => (
            <div key={s.id} className="card soft" style={{ marginTop: 10 }}>
              <div style={{ fontFamily: 'var(--serif)', fontSize: '1.05rem' }}>{s.title}</div>
              <div className="tiny faint">
                {[s.author, SOURCE_KINDS.find((k) => k.id === s.kind)?.label, LANG_LABEL[s.language], s.level].filter(Boolean).join(' · ')}
              </div>
              <p className="small" style={{ margin: '8px 0 4px' }}>{s.teaches}</p>
              <div className="tiny muted">{s.access}</div>
              <div className="tiny faint" style={{ marginTop: 4 }}>{s.skills.map((id) => skillById.get(id)?.name).filter(Boolean).join(', ')}</div>
              <div className="row" style={{ marginTop: 10 }}>
                <button
                  className="btn small primary"
                  onClick={async () => {
                    await addSuggestion(s);
                    show(`“${s.title}” kütüphanene eklendi.`);
                  }}
                >
                  Kütüphaneme ekle
                </button>
                {s.url && (
                  <a className="btn small ghost" href={s.url} target="_blank" rel="noopener noreferrer">Siteye git</a>
                )}
              </div>
            </div>
          ))}
        </section>
      )}
      {toast}
    </>
  );
}

function NewSource({ onDone }: { onDone: (id: number) => void }) {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [kind, setKind] = useState<LibrarySource['kind']>('kitap');
  const [skills, setSkills] = useState<string[]>([]);
  const save = async () => {
    if (!title.trim()) return;
    const id = await db.sources.add({
      title: title.trim(),
      author: author.trim() || undefined,
      kind,
      language: 'tr',
      skills,
      tags: [],
      status: 'okunacak',
      quotes: [],
      createdAt: now(),
      updatedAt: now(),
    });
    onDone(id);
  };
  return (
    <div className="card soft rise" style={{ marginTop: 10 }}>
      <label className="field">
        <span>Ad</span>
        <input type="text" lang="tr" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
      </label>
      <label className="field">
        <span>Yazar (isteğe bağlı)</span>
        <input type="text" lang="tr" value={author} onChange={(e) => setAuthor(e.target.value)} />
      </label>
      <label className="field">
        <span>Tür</span>
        <select value={kind} onChange={(e) => setKind(e.target.value as LibrarySource['kind'])}>
          {SOURCE_KINDS.map((k) => (
            <option key={k.id} value={k.id}>{k.label}</option>
          ))}
        </select>
      </label>
      <SkillPicker value={skills} onChange={setSkills} label="Hangi becerin için?" />
      <button className="btn primary block" disabled={!title.trim()} onClick={save}>Ekle ve aç</button>
      <p className="tiny faint" style={{ marginTop: 6 }}>Dil, seviye, erişim ve bağlantıyı açılan sayfada ekleyebilirsin.</p>
    </div>
  );
}

// ——— Kavramlar ———

/** Derslerdeki kavram kartları: uygulamanın kendi kavramları */
function lessonConcepts(): { ex: ConceptExercise; lesson: LessonDef; unitTitle: string }[] {
  const out: { ex: ConceptExercise; lesson: LessonDef; unitTitle: string }[] = [];
  for (const b of BRANCHES) {
    if (!b.available) continue;
    for (const u of contentUnits(b))
      for (const l of u.lessons) for (const e of l.steps) if (e.type === 'concept') out.push({ ex: e, lesson: l, unitTitle: u.title });
  }
  return out;
}

function Concepts() {
  const mine = useLiveQuery(() => db.concepts.orderBy('updatedAt').reverse().toArray(), []) ?? [];
  const [editing, setEditing] = useState<ConceptCard | 'new' | null>(null);
  const [q, setQ] = useState('');
  const nq = normalize(q);
  const appConcepts = lessonConcepts().filter((c) => !nq || normalize(`${c.ex.title} ${c.ex.body.join(' ')}`).includes(nq));
  const own = mine.filter((c) => !nq || normalize(`${c.term} ${c.definition}`).includes(nq));

  if (editing) return <ConceptEditor card={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />;

  return (
    <>
      <p className="small muted">
        Bir kavramı gerçekten öğrendiğini anlamanın yolu, onu kendi cümlelerinle tanımlamak. Kavram kartı yaz; derslere,
        kaynaklara ve eserlerine bağla.
      </p>
      <input type="search" placeholder="Kavramlarda ara" value={q} onChange={(e) => setQ(e.target.value)} />
      <button className="btn primary block" style={{ marginTop: 10 }} onClick={() => setEditing('new')}>Yeni kavram kartı</button>

      {own.length > 0 && (
        <section style={{ marginTop: 18 }}>
          <div className="eyebrow">Kendi kartlarım · {own.length}</div>
          {own.map((c) => (
            <button key={c.id} className="option" style={{ width: '100%', marginTop: 8 }} onClick={() => setEditing(c)}>
              <div style={{ fontFamily: 'var(--serif)', fontSize: '1.05rem' }}>{c.term}</div>
              <div className="small muted">{c.definition.length > 140 ? c.definition.slice(0, 140) + '…' : c.definition}</div>
              <div className="tiny faint" style={{ marginTop: 4 }}>
                {[
                  c.skills.map((s) => skillById.get(s)?.name).filter(Boolean).join(', '),
                  c.lessons.length ? `${c.lessons.length} ders` : '',
                  c.drafts.length ? `${c.drafts.length} eser` : '',
                  c.sources.length ? `${c.sources.length} kaynak` : '',
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </div>
            </button>
          ))}
        </section>
      )}

      <section style={{ marginTop: 22 }}>
        <div className="eyebrow">Derslerdeki kavramlar · {appConcepts.length}</div>
        <div className="list">
          {appConcepts.map(({ ex, lesson, unitTitle }) => (
            <details key={ex.id} className="item">
              <summary style={{ cursor: 'pointer' }}>
                <span style={{ fontFamily: 'var(--serif)' }}>{ex.title}</span>
                <div className="tiny faint">{unitTitle} · {lesson.title}</div>
              </summary>
              {ex.takeaway && <p className="small" style={{ color: 'var(--ember)', margin: '8px 0' }}>{ex.takeaway}</p>}
              <p className="small muted">{ex.body[0]}</p>
              <div className="row">
                <button className="btn small" onClick={() => go(`/session?lesson=${lesson.id}`)}>Derse git</button>
                <button
                  className="btn small ghost"
                  onClick={() =>
                    setEditing({
                      term: ex.title,
                      definition: '',
                      skills: ex.skills,
                      lessons: [lesson.id],
                      drafts: [],
                      sources: [],
                      createdAt: '',
                      updatedAt: '',
                    })
                  }
                >
                  Kendi cümlelerimle yaz
                </button>
              </div>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}

function ConceptEditor({ card, onClose }: { card: ConceptCard | null; onClose: () => void }) {
  const drafts = useLiveQuery(() => db.drafts.toArray(), []) ?? [];
  const sources = useLiveQuery(() => db.sources.toArray(), []) ?? [];
  const [c, setC] = useState<ConceptCard>(
    card ?? { term: '', definition: '', example: '', skills: [], lessons: [], drafts: [], sources: [], createdAt: '', updatedAt: '' },
  );
  const allLessons = [...lessonById.values()];
  const set = (patch: Partial<ConceptCard>) => setC({ ...c, ...patch });

  const save = async () => {
    if (!c.term.trim() || !c.definition.trim()) return;
    const record = { ...c, term: c.term.trim(), definition: c.definition.trim(), updatedAt: now(), createdAt: c.createdAt || now() };
    if (c.id != null) await db.concepts.put(record);
    else await db.concepts.add(record);
    onClose();
  };
  const remove = async () => {
    if (c.id != null && window.confirm(`“${c.term}” kartı silinsin mi?`)) {
      await db.concepts.delete(c.id);
      onClose();
    }
  };
  const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  return (
    <div className="rise">
      <button className="linkish small" onClick={onClose}>← Kavramlar</button>
      <label className="field" style={{ marginTop: 8 }}>
        <span>Kavram</span>
        <input type="text" lang="tr" value={c.term} onChange={(e) => set({ term: e.target.value })} placeholder="ör. Kırılma anı" />
      </label>
      <label className="field">
        <span>Kendi cümlelerinle tanımı</span>
        <textarea lang="tr" style={{ minHeight: 110 }} value={c.definition} onChange={(e) => set({ definition: e.target.value })} placeholder="Bunu bir arkadaşına anlatıyormuş gibi yaz." />
      </label>
      <label className="field">
        <span>Kendi örneğin (isteğe bağlı)</span>
        <textarea lang="tr" style={{ minHeight: 80 }} value={c.example ?? ''} onChange={(e) => set({ example: e.target.value })} placeholder="Yolculuğundan bir an…" />
      </label>
      <SkillPicker value={c.skills} onChange={(skills) => set({ skills })} />
      <label className="field">
        <span>Bağlı ders</span>
        <select value="" onChange={(e) => e.target.value && set({ lessons: toggle(c.lessons, e.target.value) })}>
          <option value="">Ders ekle…</option>
          {allLessons.filter((l) => !c.lessons.includes(l.id)).map((l) => (
            <option key={l.id} value={l.id}>{l.title}</option>
          ))}
        </select>
      </label>
      <LinkedChips items={c.lessons.map((id) => [id, lessonById.get(id)?.title ?? id])} onRemove={(id) => set({ lessons: c.lessons.filter((x) => x !== id) })} />
      {drafts.length > 0 && (
        <>
          <label className="field">
            <span>Bu kavramı uyguladığın eser</span>
            <select value="" onChange={(e) => e.target.value && set({ drafts: toggle(c.drafts, e.target.value) })}>
              <option value="">Eser ekle…</option>
              {drafts.filter((d) => !c.drafts.includes(d.id)).map((d) => (
                <option key={d.id} value={d.id}>{draftTitle(d)}</option>
              ))}
            </select>
          </label>
          <LinkedChips items={c.drafts.map((id) => [id, draftTitle(drafts.find((d) => d.id === id) ?? { title: '', body: '' })])} onRemove={(id) => set({ drafts: c.drafts.filter((x) => x !== id) })} />
        </>
      )}
      {sources.length > 0 && (
        <>
          <label className="field">
            <span>Kaynak</span>
            <select value="" onChange={(e) => e.target.value && set({ sources: toggle(c.sources, Number(e.target.value)) })}>
              <option value="">Kaynak ekle…</option>
              {sources.filter((s) => !c.sources.includes(s.id!)).map((s) => (
                <option key={s.id} value={s.id}>{s.title}</option>
              ))}
            </select>
          </label>
          <LinkedChips items={c.sources.map((id) => [String(id), sources.find((s) => s.id === id)?.title ?? '?'])} onRemove={(id) => set({ sources: c.sources.filter((x) => String(x) !== id) })} />
        </>
      )}
      <div className="row" style={{ marginTop: 14 }}>
        <button className="btn primary grow" disabled={!c.term.trim() || !c.definition.trim()} onClick={save}>Kaydet</button>
        {c.id != null && <button className="btn ghost" style={{ color: 'var(--warn)' }} onClick={remove}>Sil</button>}
      </div>
    </div>
  );
}

function LinkedChips({ items, onRemove }: { items: [string, string][]; onRemove: (id: string) => void }) {
  if (!items.length) return null;
  return (
    <div className="chips" style={{ margin: '-6px 0 14px' }}>
      {items.map(([id, label]) => (
        <button key={id} type="button" className="chip compact on" aria-label={`${label} bağlantısını kaldır`} onClick={() => onRemove(id)}>
          {label} ×
        </button>
      ))}
    </div>
  );
}

// ——— Alıntılar ———

function Quotes() {
  const sources = useLiveQuery(() => db.sources.toArray(), []) ?? [];
  const [q, setQ] = useState('');
  const nq = normalize(q);
  const all = sources.flatMap((s) => s.quotes.map((qu) => ({ ...qu, source: s })));
  const shown = all.filter((x) => !nq || normalize(`${x.text} ${x.note ?? ''} ${x.source.title}`).includes(nq));
  return (
    <>
      <p className="small muted">Kaynaklarından not aldığın alıntılar. Alıntı eklemek için bir kaynağın sayfasını aç.</p>
      <input type="search" placeholder="Alıntılarda ara" value={q} onChange={(e) => setQ(e.target.value)} />
      {shown.length === 0 ? (
        <div className="empty">{all.length ? 'Bu aramayla eşleşen alıntı yok.' : 'Henüz alıntı yok.'}</div>
      ) : (
        shown.map((x) => (
          <a key={x.id} href={`#/source/${x.source.id}`} className="card soft" style={{ display: 'block', marginTop: 10, color: 'var(--text)', textDecoration: 'none' }}>
            <div className="quote" style={{ margin: 0 }}>{x.text}</div>
            {x.note && <div className="small muted" style={{ marginTop: 6 }}>{x.note}</div>}
            <div className="tiny faint" style={{ marginTop: 6 }}>{x.source.title}{x.source.author ? ` · ${x.source.author}` : ''}{x.where ? ` · ${x.where}` : ''}</div>
          </a>
        ))
      )}
    </>
  );
}
