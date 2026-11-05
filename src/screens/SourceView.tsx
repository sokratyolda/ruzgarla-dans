/** Bir kaynağın sayfası: bilgileri, okuma durumu, senin özetin, alıntıların ve bağlı kavram kartları. */
import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type LibrarySource, type SourceQuote } from '../db/db';
import { go } from '../lib/router';
import { TopBar } from '../components/ui';
import SkillPicker from '../components/SkillPicker';
import { SOURCE_KINDS, STATUS_LABEL } from './Library';

const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export default function SourceView({ id }: { id: number }) {
  const src = useLiveQuery(async () => (await db.sources.get(id)) ?? null, [id]);
  if (src === undefined) return null;
  if (src === null)
    return (
      <div>
        <TopBar title="Kaynak" onBack={() => go('/library')} />
        <div className="empty">Bu kaynak bulunamadı.</div>
      </div>
    );
  return <View key={id} src={src} />;
}

function View({ src }: { src: LibrarySource }) {
  const concepts = useLiveQuery(async () => (await db.concepts.toArray()).filter((c) => c.sources.includes(src.id!)), [src.id]) ?? [];
  const [summary, setSummary] = useState(src.summary ?? '');
  const [quote, setQuote] = useState({ text: '', where: '', note: '' });
  const [details, setDetails] = useState(false);
  const update = (patch: Partial<LibrarySource>) => db.sources.update(src.id!, { ...patch, updatedAt: new Date().toISOString() });

  const addQuote = async () => {
    if (!quote.text.trim()) return;
    const q: SourceQuote = { id: uid(), text: quote.text.trim(), where: quote.where.trim() || undefined, note: quote.note.trim() || undefined };
    await update({ quotes: [...src.quotes, q] });
    setQuote({ text: '', where: '', note: '' });
  };

  const remove = async () => {
    if (!window.confirm(`“${src.title}” kütüphanenden silinsin mi? Alıntıları ve özetin de silinir.`)) return;
    await db.sources.delete(src.id!);
    go('/library');
  };

  return (
    <div className="fade">
      <TopBar title={<span className="tiny faint">Kaynak</span>} onBack={() => go('/library')} />
      <h2 style={{ marginBottom: 2 }}>{src.title}</h2>
      <div className="small muted">{[src.author, SOURCE_KINDS.find((k) => k.id === src.kind)?.label].filter(Boolean).join(' · ')}</div>
      {src.teaches && <p className="small" style={{ marginTop: 10 }}>{src.teaches}</p>}
      {src.access && <div className="tiny muted">{src.access}</div>}
      {src.url && (
        <a className="linkish small" href={src.url} target="_blank" rel="noopener noreferrer">Kaynağa git ↗</a>
      )}

      <div className="seg" role="group" aria-label="Okuma durumu" style={{ marginTop: 16 }}>
        {(Object.keys(STATUS_LABEL) as LibrarySource['status'][]).map((st) => (
          <button key={st} className={src.status === st ? 'on' : ''} aria-pressed={src.status === st} onClick={() => update({ status: st })}>
            {STATUS_LABEL[st]}
          </button>
        ))}
      </div>

      <label className="field" style={{ marginTop: 18 }}>
        <span>Özetim: bu kaynaktan ne öğrendim, kendi cümlelerimle</span>
        <textarea lang="tr" style={{ minHeight: 120 }} value={summary} onChange={(e) => setSummary(e.target.value)} onBlur={() => update({ summary: summary.trim() || undefined })} />
      </label>

      <div className="eyebrow" style={{ marginTop: 10 }}>Alıntılar · {src.quotes.length}</div>
      {src.quotes.map((q) => (
        <div key={q.id} className="card soft" style={{ marginTop: 8 }}>
          <div className="quote" style={{ margin: 0 }}>{q.text}</div>
          {q.note && <div className="small muted" style={{ marginTop: 6 }}>{q.note}</div>}
          <div className="row between tiny faint" style={{ marginTop: 6 }}>
            <span>{q.where}</span>
            <button className="linkish tiny" style={{ color: 'var(--text-3)' }} onClick={() => update({ quotes: src.quotes.filter((x) => x.id !== q.id) })}>
              Sil
            </button>
          </div>
        </div>
      ))}
      <div className="card soft" style={{ marginTop: 10 }}>
        <textarea lang="tr" style={{ minHeight: 80 }} placeholder="Alıntı (kısa tut)" value={quote.text} onChange={(e) => setQuote({ ...quote, text: e.target.value })} />
        <input type="text" lang="tr" style={{ marginTop: 8 }} placeholder="Sayfa / bölüm / dakika" value={quote.where} onChange={(e) => setQuote({ ...quote, where: e.target.value })} />
        <input type="text" lang="tr" style={{ marginTop: 8 }} placeholder="Neden aldım? (isteğe bağlı)" value={quote.note} onChange={(e) => setQuote({ ...quote, note: e.target.value })} />
        <button className="btn small primary block" style={{ marginTop: 8 }} disabled={!quote.text.trim()} onClick={addQuote}>Alıntıyı ekle</button>
      </div>

      {concepts.length > 0 && (
        <>
          <div className="eyebrow" style={{ marginTop: 18 }}>Bu kaynağa bağlı kavram kartların</div>
          {concepts.map((c) => (
            <div key={c.id} className="small" style={{ padding: '6px 0' }}>
              <strong>{c.term}</strong> — {c.definition.slice(0, 100)}
            </div>
          ))}
        </>
      )}

      <button className="linkish small" style={{ marginTop: 18 }} onClick={() => setDetails(!details)}>
        {details ? 'Bilgileri gizle' : 'Bilgileri düzenle'}
      </button>
      {details && <SourceDetails src={src} update={update} />}

      <button className="btn small ghost" style={{ color: 'var(--warn)', marginTop: 18 }} onClick={remove}>Kaynağı sil</button>
    </div>
  );
}

function SourceDetails({ src, update }: { src: LibrarySource; update: (p: Partial<LibrarySource>) => unknown }) {
  const [f, setF] = useState({
    title: src.title,
    author: src.author ?? '',
    access: src.access ?? '',
    url: src.url ?? '',
    teaches: src.teaches ?? '',
    tags: src.tags.join(', '),
  });
  const save = () =>
    update({
      title: f.title.trim() || src.title,
      author: f.author.trim() || undefined,
      access: f.access.trim() || undefined,
      url: f.url.trim() || undefined,
      teaches: f.teaches.trim() || undefined,
      tags: [...new Set(f.tags.split(',').map((t) => t.trim()).filter(Boolean))],
    });
  return (
    <div className="card soft rise" style={{ marginTop: 8 }}>
      {(
        [
          ['title', 'Ad'],
          ['author', 'Yazar'],
          ['teaches', 'Ne öğretiyor?'],
          ['access', 'Nasıl erişilir?'],
          ['url', 'Bağlantı'],
          ['tags', 'Etiketler (virgülle)'],
        ] as const
      ).map(([k, label]) => (
        <label key={k} className="field">
          <span>{label}</span>
          <input type="text" lang="tr" value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} onBlur={save} />
        </label>
      ))}
      <label className="field">
        <span>Tür</span>
        <select value={src.kind} onChange={(e) => update({ kind: e.target.value as LibrarySource['kind'] })}>
          {SOURCE_KINDS.map((k) => (
            <option key={k.id} value={k.id}>{k.label}</option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Dil</span>
        <select value={src.language} onChange={(e) => update({ language: e.target.value as LibrarySource['language'] })}>
          <option value="tr">Türkçe</option>
          <option value="en">İngilizce</option>
          <option value="diğer">Başka dil</option>
        </select>
      </label>
      <label className="field">
        <span>Seviye</span>
        <select value={src.level ?? ''} onChange={(e) => update({ level: (e.target.value || undefined) as LibrarySource['level'] })}>
          <option value="">Belirtilmedi</option>
          <option value="başlangıç">Başlangıç</option>
          <option value="orta">Orta</option>
          <option value="ileri">İleri</option>
        </select>
      </label>
      <SkillPicker value={src.skills} onChange={(skills) => update({ skills })} />
    </div>
  );
}
