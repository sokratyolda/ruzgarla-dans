/**
 * Yol Defteri: yolda görülen, duyulan, akla gelen hikâye malzemesi.
 * Büyük ve rahat bir metin kutusu (Android klavyenin sesle yazmasıyla uyumlu), hızlı etiketler.
 */
import { useEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type RoadNote } from '../db/db';
import type { RoadNoteTag } from '../content/types';
import { formatDate, normalize } from '../lib/tr';
import { useToast } from '../components/ui';
import { parseHash } from '../lib/router';

export const NOTE_TAGS: RoadNoteTag[] = ['insan', 'mekân', 'an', 'düşünce'];

/** `embedded`: Masa ekranının içinde sekme olarak gösterilir (başlık gizlenir). */
export default function RoadNotes({ embedded = false }: { embedded?: boolean }) {
  const [text, setText] = useState('');
  const [tags, setTags] = useState<RoadNoteTag[]>([]);
  const [filter, setFilter] = useState<RoadNoteTag | null>(null);
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState<number | null>(null);
  const [toast, show] = useToast();
  const ref = useRef<HTMLTextAreaElement>(null);
  const notes = useLiveQuery(() => db.notes.orderBy('date').reverse().toArray(), []) ?? [];

  useEffect(() => {
    if (parseHash().query.get('new') === '1') ref.current?.focus();
  }, []);

  const toggle = (t: RoadNoteTag) => setTags((ts) => (ts.includes(t) ? ts.filter((x) => x !== t) : [...ts, t]));

  const save = async () => {
    const body = text.trim();
    if (!body) return;
    if (editing != null) {
      await db.notes.update(editing, { text: body, tags });
      show('Not güncellendi.');
    } else {
      await db.notes.add({ text: body, tags, date: new Date().toISOString() });
      show('Deftere yazıldı.');
    }
    setText('');
    setTags([]);
    setEditing(null);
  };

  const edit = (n: RoadNote) => {
    setEditing(n.id!);
    setText(n.text);
    setTags(n.tags);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    ref.current?.focus();
  };

  const remove = async (n: RoadNote) => {
    if (window.confirm('Bu not silinsin mi? Geri alınamaz.')) await db.notes.delete(n.id!);
  };

  const nq = normalize(q);
  const shown = notes.filter((n) => (!filter || n.tags.includes(filter)) && (!nq || normalize(n.text).includes(nq)));

  return (
    <div className={embedded ? '' : 'fade'}>
      {!embedded && (
        <>
          <div className="eyebrow">Yol Defteri</div>
          <h1>Malzeme kutusu</h1>
        </>
      )}
      <p className="small muted">Gördüğün, duyduğun, aklına gelen. Cümle olması gerekmez. Mikrofona basıp konuşabilirsin.</p>

      <textarea
        ref={ref}
        lang="tr"
        className="big"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Kahvedeki yaşlı adam şekeri çayına üç kez batırıp çıkardı…"
        style={{ minHeight: '28vh' }}
      />
      <div className="chips" style={{ margin: '12px 0' }}>
        {NOTE_TAGS.map((t) => (
          <button key={t} className={`chip ${tags.includes(t) ? 'on' : ''}`} onClick={() => toggle(t)}>
            {t}
          </button>
        ))}
      </div>
      <div className="row">
        {editing != null && (
          <button className="btn ghost" onClick={() => { setEditing(null); setText(''); setTags([]); }}>Vazgeç</button>
        )}
        <button className="btn primary grow" disabled={!text.trim()} onClick={save}>
          {editing != null ? 'Güncelle' : 'Kaydet'}
        </button>
      </div>

      <hr className="sep" />

      <div className="row" style={{ marginBottom: 10 }}>
        <input type="search" placeholder="Ara" value={q} onChange={(e) => setQ(e.target.value)} className="grow" />
      </div>
      <div className="chips" style={{ marginBottom: 6 }}>
        <button className={`chip ${!filter ? 'on' : ''}`} onClick={() => setFilter(null)}>hepsi · {notes.length}</button>
        {NOTE_TAGS.map((t) => (
          <button key={t} className={`chip ${filter === t ? 'on' : ''}`} onClick={() => setFilter(filter === t ? null : t)}>
            {t}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="empty">{notes.length ? 'Bu aramayla eşleşen not yok.' : 'Henüz not yok. Yol uzun; malzeme gelecek.'}</div>
      ) : (
        <div className="list">
          {shown.map((n) => (
            <div className="item" key={n.id}>
              <div className="row between tiny faint">
                <span>{formatDate(n.date, { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</span>
                <span>{n.tags.join(' · ')}</span>
              </div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: '1.05rem', whiteSpace: 'pre-wrap', margin: '6px 0' }}>{n.text}</div>
              <div className="row tiny">
                {n.usedIn?.length ? <span className="tag good">yazıda kullanıldı</span> : null}
                <span className="grow" />
                <button className="linkish tiny" onClick={() => edit(n)}>Düzenle</button>
                <button className="linkish tiny" style={{ color: 'var(--text-3)' }} onClick={() => remove(n)}>Sil</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {toast}
    </div>
  );
}
