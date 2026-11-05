/** Günce: öğrenme günlüğü, tarih sırasıyla. */
import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { formatDate } from '../lib/tr';
import { TopBar } from '../components/ui';

/** `embedded`: Yolum içinde sekme olarak gösterilir (üst başlık gizlenir). */
export default function Journal({ embedded = false }: { embedded?: boolean }) {
  const entries = useLiveQuery(() => db.journal.orderBy('date').toArray(), []) ?? [];
  const [text, setText] = useState('');
  const [newestFirst, setNewestFirst] = useState(false);

  const add = async () => {
    if (!text.trim()) return;
    await db.journal.add({ date: new Date().toISOString(), text: text.trim() });
    setText('');
  };

  const list = newestFirst ? [...entries].reverse() : entries;
  // Aylara göre grupla
  const groups = new Map<string, typeof entries>();
  for (const e of list) {
    const k = formatDate(e.date, { month: 'long', year: 'numeric' });
    groups.set(k, [...(groups.get(k) ?? []), e]);
  }

  return (
    <div className={embedded ? '' : 'fade'}>
      {embedded ? (
        <div className="row end">
          <button className="linkish small" onClick={() => setNewestFirst(!newestFirst)}>{newestFirst ? 'Eskiden yeniye' : 'Yeniden eskiye'}</button>
        </div>
      ) : (
        <TopBar title="Günce" right={<button className="linkish small" onClick={() => setNewestFirst(!newestFirst)}>{newestFirst ? 'Eskiden yeniye' : 'Yeniden eskiye'}</button>} />
      )}
      <p className="small muted">Bugün ne öğrendim, kendi cümlelerimle. Zamanla bir öğrenme günlüğüne dönüşür.</p>
      <textarea lang="tr" value={text} onChange={(e) => setText(e.target.value)} style={{ minHeight: 100 }} placeholder="Bugün fark ettim ki…" />
      <button className="btn primary block" style={{ marginTop: 10 }} disabled={!text.trim()} onClick={add}>Ekle</button>
      <hr className="sep" />
      {entries.length === 0 && <div className="empty">İlk oturumun sonunda burası dolmaya başlayacak.</div>}
      {[...groups.entries()].map(([month, es]) => (
        <div key={month} style={{ marginBottom: 22 }}>
          <div className="eyebrow">{month}</div>
          {es.map((e) => (
            <div key={e.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--line)' }}>
              <div className="tiny faint">{formatDate(e.date, { weekday: 'long', day: 'numeric' })}</div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: '1.05rem', whiteSpace: 'pre-wrap' }}>{e.text}</div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
