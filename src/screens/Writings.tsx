/** Yazılarım: tüm yazma denemeleri; ilk ve son hâl yan yana, gelişim görünür. */
import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Attempt } from '../db/db';
import { exerciseById } from '../content';
import { isWriting } from '../content/types';
import { formatResponse } from '../ai/prompt';
import { processQueue } from '../ai/queue';
import { formatDate } from '../lib/tr';
import { TopBar, useOnline, useToast } from '../components/ui';
import { FeedbackView } from '../components/WritingStep';
import { go } from '../lib/router';
import { createDraft } from '../lib/desk';

/** `embedded`: Atölyem içinde sekme olarak gösterilir. */
export default function Writings({ embedded = false }: { embedded?: boolean }) {
  const attempts = useLiveQuery(() => db.attempts.orderBy('date').reverse().toArray(), []) ?? [];
  const settings = useLiveQuery(() => db.settings.get('main'), []);
  const online = useOnline();
  const [busy, setBusy] = useState(false);
  const [toast, show] = useToast();

  const writing = attempts.filter((a) => typeof a.response !== 'number' && exerciseById.get(a.exerciseId) && isWriting(exerciseById.get(a.exerciseId)!));
  const groups = new Map<number, Attempt[]>();
  for (const a of writing) {
    const root = a.rootId ?? a.id!;
    groups.set(root, [...(groups.get(root) ?? []), a]);
  }
  const ordered = [...groups.values()]
    .map((g) => g.sort((a, b) => (a.version ?? 1) - (b.version ?? 1)))
    .sort((a, b) => b[b.length - 1].date.localeCompare(a[a.length - 1].date));
  const pending = writing.filter((a) => a.pendingReview === 1).length;

  const runQueue = async () => {
    setBusy(true);
    const r = await processQueue();
    setBusy(false);
    show(r.done ? `${r.done} yazı değerlendirildi.` : r.message ?? 'Değerlendirilecek bir şey yok.');
  };

  return (
    <div className={embedded ? '' : 'fade'}>
      {!embedded && <TopBar title="Yazılarım" />}
      {pending > 0 && (
        <div className="card soft small" style={{ marginBottom: 16 }}>
          {pending} yazı yapay zekâ değerlendirmesini bekliyor.{' '}
          {!settings?.apiKey ? (
            <a href="#/settings" style={{ color: 'var(--ember)' }}>Ayarlar'dan anahtar ekle.</a>
          ) : !online ? (
            'İnternet gelince kendiliğinden değerlendirilecek.'
          ) : (
            <button className="btn small" style={{ marginTop: 10, width: '100%' }} disabled={busy} onClick={runQueue}>
              {busy ? 'Değerlendiriliyor…' : 'Şimdi değerlendir'}
            </button>
          )}
        </div>
      )}
      {ordered.length === 0 && <div className="empty">Yazdıkların burada birikecek: ilk hâl ve yeniden yazılmış hâl yan yana.</div>}
      {ordered.map((g) => (
        <Group key={g[0].id} versions={g} />
      ))}
      {toast}
    </div>
  );
}

function Group({ versions }: { versions: Attempt[] }) {
  const ex = exerciseById.get(versions[0].exerciseId)!;
  const first = versions[0];
  const last = versions[versions.length - 1];
  const [open, setOpen] = useState(false);
  const title = ex.type === 'write' && ex.atelier ? 'Atölye' : ex.type === 'rewrite' ? 'Yeniden yaz' : ex.type === 'video' ? 'Video düşüncesi' : 'Kendi malzemenle';
  const prompt = 'prompt' in ex ? ex.prompt : '';

  return (
    <div className="card" style={{ marginBottom: 14 }}>
      <div className="row between tiny faint">
        <span>{title} · {formatDate(last.date)}</span>
        <span>{versions.length > 1 ? `${versions.length} hâl` : ''}</span>
      </div>
      <div className="small muted" style={{ margin: '6px 0 10px' }}>{prompt.length > 140 ? prompt.slice(0, 140) + '…' : prompt}</div>
      <div className={versions.length > 1 ? 'compare' : ''}>
        <Version a={first} label={versions.length > 1 ? 'İlk hâl' : undefined} />
        {versions.length > 1 && <Version a={last} label={`${last.version ?? versions.length}. hâl`} />}
      </div>
      {versions.length > 2 && (
        <details className="small" style={{ marginTop: 8 }}>
          <summary className="faint" style={{ cursor: 'pointer' }}>Ara hâller</summary>
          {versions.slice(1, -1).map((v) => <Version key={v.id} a={v} label={`${v.version}. hâl`} />)}
        </details>
      )}
      {last.aiFeedback && (
        <>
          <button className="linkish small" onClick={() => setOpen(!open)}>{open ? 'Geri bildirimi gizle' : 'Son geri bildirim'}</button>
          {open && <FeedbackView fb={last.aiFeedback} />}
        </>
      )}
      {last.reviewError && last.pendingReview === 1 && <div className="tiny" style={{ color: 'var(--warn)', marginTop: 6 }}>{last.reviewError}</div>}
      <div className="row end" style={{ marginTop: 10 }}>
        <button
          className="btn small ghost"
          title="Bu metni alıştırmadan çıkarıp Masa'da serbestçe geliştir"
          onClick={async () => {
            const body = formatResponse(last.response as string | Record<string, string>);
            const kind = ex.type === 'video' ? 'video-metni' : 'öykü';
            go(`/draft/${await createDraft({ body, kind, fromAttempt: last.id, title: '' })}`);
          }}
        >
          Masaya al
        </button>
        <button className="btn small" onClick={() => go(`/rewrite/${last.id}`)}>Yeniden yaz</button>
      </div>
    </div>
  );
}

function Version({ a, label }: { a: Attempt; label?: string }) {
  return (
    <div className="card soft" style={{ padding: 14, marginTop: 0 }}>
      <div className="row between tiny" style={{ marginBottom: 6 }}>
        <span className="faint">{label}</span>
        {a.pendingReview === 1 ? (
          <span className="tag ember">bekliyor</span>
        ) : a.aiFeedback ? (
          <span className="tag good">okundu</span>
        ) : a.selfScores ? (
          <span className="tag">öz değerlendirme</span>
        ) : null}
      </div>
      <div style={{ fontFamily: 'var(--serif)', whiteSpace: 'pre-wrap', fontSize: '1rem', lineHeight: 1.65 }}>
        {formatResponse(a.response as string | Record<string, string>)}
      </div>
    </div>
  );
}
