/**
 * Yazarın Masası: alıştırmalardan bağımsız serbest yazı alanı.
 * Sekmeler: Taslaklar · Projeler · Yol Defteri
 */
import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Draft } from '../db/db';
import { DRAFT_KINDS, createDraft, createProject, draftTitle, draftWords, kindLabel, statusLabel } from '../lib/desk';
import { formatDate, normalize } from '../lib/tr';
import { go } from '../lib/router';
import RoadNotes from './RoadNotes';

type Tab = 'taslaklar' | 'projeler' | 'notlar';

export default function Desk({ query }: { query: URLSearchParams }) {
  const tab: Tab = query.get('t') === 'projeler' ? 'projeler' : query.get('t') === 'notlar' ? 'notlar' : 'taslaklar';
  const setTab = (t: Tab) => go(t === 'taslaklar' ? '/desk' : `/desk?t=${t}`);

  return (
    <div className="fade">
      <div className="eyebrow">Masa</div>
      <h1>Yazarın masası</h1>
      <div className="seg" role="tablist" style={{ marginBottom: 18 }}>
        {(
          [
            ['taslaklar', 'Taslaklar'],
            ['projeler', 'Projeler'],
            ['notlar', 'Yol Defteri'],
          ] as const
        ).map(([id, label]) => (
          <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? 'on' : ''} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </div>
      {tab === 'taslaklar' && <DraftList />}
      {tab === 'projeler' && <ProjectList />}
      {tab === 'notlar' && <RoadNotes embedded />}
    </div>
  );
}

function DraftList() {
  const drafts = useLiveQuery(() => db.drafts.orderBy('updatedAt').reverse().toArray(), []) ?? [];
  const projects = useLiveQuery(() => db.projects.toArray(), []) ?? [];
  const [q, setQ] = useState('');
  const [kind, setKind] = useState<Draft['kind'] | null>(null);
  const pname = new Map(projects.map((p) => [p.id, p.title]));

  const nq = normalize(q);
  const shown = drafts.filter(
    (d) =>
      (!kind || d.kind === kind) &&
      (!nq || normalize(`${d.title} ${d.body} ${d.tags.join(' ')}`).includes(nq)),
  );
  const kindsPresent = DRAFT_KINDS.filter((k) => drafts.some((d) => d.kind === k.id));

  const newDraft = async () => go(`/draft/${await createDraft({ kind: kind ?? 'deneme' })}`);

  return (
    <>
      <button className="btn primary block" onClick={newDraft}>Yeni taslak</button>
      {drafts.length > 0 && (
        <>
          <input type="search" placeholder="Taslaklarda ara" value={q} onChange={(e) => setQ(e.target.value)} style={{ marginTop: 16 }} />
          {kindsPresent.length > 1 && (
            <div className="chips" style={{ margin: '10px 0 4px' }}>
              <button className={`chip ${!kind ? 'on' : ''}`} onClick={() => setKind(null)}>hepsi</button>
              {kindsPresent.map((k) => (
                <button key={k.id} className={`chip ${kind === k.id ? 'on' : ''}`} onClick={() => setKind(kind === k.id ? null : k.id)}>
                  {k.label}
                </button>
              ))}
            </div>
          )}
        </>
      )}
      {drafts.length === 0 ? (
        <div className="empty">
          Masa boş. Bir deneme, bir gezi yazısı, bir video metni: alıştırmalardan bağımsız, kendi yazın için.
        </div>
      ) : shown.length === 0 ? (
        <div className="empty">Bu aramayla eşleşen taslak yok.</div>
      ) : (
        <div className="list" style={{ marginTop: 6 }}>
          {shown.map((d) => (
            <a key={d.id} className="list-link" href={`#/draft/${d.id}`}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--serif)', fontSize: '1.05rem' }}>{draftTitle(d)}</div>
                <div className="tiny faint">
                  {kindLabel(d.kind)} · {statusLabel(d.status)} · {draftWords(d)} kelime · {formatDate(d.updatedAt, { day: 'numeric', month: 'short' })}
                  {d.projectId && pname.get(d.projectId) ? ` · ${pname.get(d.projectId)}` : ''}
                </div>
              </div>
              <span className="chev">›</span>
            </a>
          ))}
        </div>
      )}
    </>
  );
}

function ProjectList() {
  const projects = useLiveQuery(() => db.projects.orderBy('updatedAt').reverse().toArray(), []) ?? [];
  const drafts = useLiveQuery(() => db.drafts.toArray(), []) ?? [];
  const [title, setTitle] = useState('');

  const create = async () => {
    if (!title.trim()) return;
    const id = await createProject(title);
    setTitle('');
    go(`/project/${id}`);
  };

  return (
    <>
      <p className="small muted">
        Bir proje, taslakları bir araya getirir: bir deneme dizisi, bir yol kitabı, bir video serisi. Bölüm sırasını
        sen belirlersin; bütün proje tek bir Markdown dosyası olarak dışa aktarılabilir.
      </p>
      <div className="row">
        <input type="text" placeholder="Proje adı (ör. Yol Denemeleri)" value={title} onChange={(e) => setTitle(e.target.value)} className="grow" />
        <button className="btn primary" disabled={!title.trim()} onClick={create}>Oluştur</button>
      </div>
      {projects.length === 0 ? (
        <div className="empty">Henüz proje yok.</div>
      ) : (
        <div className="list" style={{ marginTop: 10 }}>
          {projects.map((p) => {
            const ds = drafts.filter((d) => d.projectId === p.id);
            const words = ds.reduce((a, d) => a + draftWords(d), 0);
            const finished = ds.filter((d) => d.status === 'bitti').length;
            return (
              <a key={p.id} className="list-link" href={`#/project/${p.id}`}>
                <div>
                  <div style={{ fontFamily: 'var(--serif)', fontSize: '1.05rem' }}>{p.title}</div>
                  <div className="tiny faint">
                    {ds.length} bölüm · {finished} bitti · {words} kelime
                  </div>
                </div>
                <span className="chev">›</span>
              </a>
            );
          })}
        </div>
      )}
    </>
  );
}
