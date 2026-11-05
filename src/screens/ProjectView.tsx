/** Proje: bir araya getirilmiş taslaklar, bölüm sırası ve tek dosya olarak dışa aktarma. */
import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Project, type ProjectKind } from '../db/db';
import {
  PROJECT_TEMPLATES,
  addProjectCard,
  removeProjectCard,
  templateOf,
  updateProjectCard,
  createDraft,
  deleteProject,
  draftTitle,
  draftWords,
  exportProject,
  moveInProject,
  projectDrafts,
  setDraftProject,
  statusLabel,
  updateProject,
} from '../lib/desk';
import { go } from '../lib/router';
import { TopBar } from '../components/ui';

export default function ProjectView({ id }: { id: string }) {
  const project = useLiveQuery(async () => (await db.projects.get(id)) ?? null, [id]);
  if (project === undefined) return null;
  if (project === null)
    return (
      <div>
        <TopBar title="Proje" onBack={() => go('/desk?t=projeler')} />
        <div className="empty">Bu proje bulunamadı.</div>
      </div>
    );
  return <View key={id} project={project} />;
}

function View({ project }: { project: Project }) {
  const drafts = useLiveQuery(() => projectDrafts(project), [project]) ?? [];
  const loose = useLiveQuery(async () => (await db.drafts.toArray()).filter((d) => !d.projectId), []) ?? [];
  const [title, setTitle] = useState(project.title);
  const [desc, setDesc] = useState(project.description ?? '');
  const [adding, setAdding] = useState(false);

  const words = drafts.reduce((a, d) => a + draftWords(d), 0);
  const done = drafts.filter((d) => d.status === 'bitti').length;
  const tpl = templateOf(project.kind);

  const newChapter = async () => go(`/draft/${await createDraft({ projectId: project.id, kind: tpl.draftKind })}`);

  const remove = async () => {
    if (!window.confirm(`“${project.title}” projesi silinsin mi? Taslaklar silinmez, yalnızca projeden çıkar.`)) return;
    await deleteProject(project.id);
    go('/desk?t=projeler');
  };

  return (
    <div className="fade">
      <TopBar title={<span className="tiny faint">Proje</span>} onBack={() => go('/desk?t=projeler')} />
      <input
        className="draft-title"
        lang="tr"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={() => title.trim() && updateProject(project.id, { title: title.trim() })}
      />
      <textarea
        lang="tr"
        style={{ minHeight: 80, fontSize: '1rem' }}
        placeholder="Bu proje ne hakkında? (isteğe bağlı)"
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        onBlur={() => updateProject(project.id, { description: desc.trim() || undefined })}
      />
      <label className="field" style={{ marginTop: 10 }}>
        <span>Türü</span>
        <select value={project.kind ?? 'serbest'} onChange={(e) => updateProject(project.id, { kind: e.target.value as ProjectKind })}>
          {PROJECT_TEMPLATES.map((t) => (
            <option key={t.id} value={t.id}>{t.label}</option>
          ))}
        </select>
      </label>
      <div className="small muted" style={{ margin: '0 0 16px' }}>
        {drafts.length} {tpl.unit} · {done} bitti · {words} kelime
      </div>

      {drafts.length === 0 ? (
        <div className="empty">Henüz bölüm yok.</div>
      ) : (
        <div className="list">
          {drafts.map((d, i) => (
            <div key={d.id} className="item row" style={{ gap: 8, flexWrap: 'nowrap' }}>
              <span className="faint" style={{ width: 22 }}>{i + 1}.</span>
              <a href={`#/draft/${d.id}`} className="grow" style={{ color: 'var(--text)', textDecoration: 'none', minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--serif)' }}>{draftTitle(d)}</div>
                <div className="tiny faint">{statusLabel(d.status)} · {draftWords(d)} kelime</div>
              </a>
              <button className="icon-btn" aria-label="Yukarı taşı" disabled={i === 0} onClick={() => moveInProject(project.id, d.id, -1)}>↑</button>
              <button className="icon-btn" aria-label="Aşağı taşı" disabled={i === drafts.length - 1} onClick={() => moveInProject(project.id, d.id, 1)}>↓</button>
            </div>
          ))}
        </div>
      )}

      <div className="row" style={{ marginTop: 16 }}>
        <button className="btn primary grow" onClick={newChapter}>Yeni {tpl.unit}</button>
        {loose.length > 0 && <button className="btn grow" onClick={() => setAdding(!adding)}>Var olan taslağı ekle</button>}
      </div>
      {adding && (
        <div className="list card soft" style={{ marginTop: 10 }}>
          {loose.map((d) => (
            <button
              key={d.id}
              className="rev-row"
              onClick={async () => {
                await setDraftProject(d.id, project.id);
                setAdding(false);
              }}
            >
              <div style={{ fontFamily: 'var(--serif)' }}>{draftTitle(d)}</div>
              <div className="tiny faint">{draftWords(d)} kelime</div>
            </button>
          ))}
        </div>
      )}

      {tpl.cards.length > 0 && <Notebook project={project} />}

      <hr className="sep" />
      <div className="row">
        <button className="btn grow" disabled={drafts.length === 0} onClick={() => exportProject(project)}>
          Bütün projeyi Markdown olarak indir
        </button>
        {(project.cards?.length ?? 0) > 0 && (
          <button className="btn ghost grow" disabled={drafts.length === 0} onClick={() => exportProject(project, true)}>
            Defterle birlikte indir
          </button>
        )}
      </div>
      <button className="btn small ghost" style={{ color: 'var(--warn)', marginTop: 14 }} onClick={remove}>
        Projeyi sil
      </button>
    </div>
  );
}

/** Proje defteri: türe göre kartlar (roman: karakter, mekân; gezi: durak, insan…). Hiçbiri zorunlu değil. */
function Notebook({ project }: { project: Project }) {
  const tpl = templateOf(project.kind);
  const [adding, setAdding] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const cards = project.cards ?? [];

  return (
    <section style={{ marginTop: 24 }}>
      <div className="eyebrow">Proje defteri</div>
      {tpl.cards.map((ct) => {
        const list = cards.filter((c) => c.type === ct.type);
        return (
          <div key={ct.type} className="card soft" style={{ marginTop: 10 }}>
            <div className="row between">
              <strong className="small">{ct.label}</strong>
              <button className="linkish small" onClick={() => { setAdding(adding === ct.type ? null : ct.type); setTitle(''); }}>
                {adding === ct.type ? 'Vazgeç' : '+ Ekle'}
              </button>
            </div>
            <div className="tiny faint">{ct.hint}</div>
            {adding === ct.type && (
              <div className="row" style={{ marginTop: 8 }}>
                <input type="text" lang="tr" className="grow" autoFocus placeholder="Ad" value={title} onChange={(e) => setTitle(e.target.value)} />
                <button
                  className="btn small primary"
                  disabled={!title.trim()}
                  onClick={async () => {
                    await addProjectCard(project.id, ct.type, title);
                    setAdding(null);
                  }}
                >
                  Ekle
                </button>
              </div>
            )}
            {list.map((c) => (
              <details key={c.id} style={{ marginTop: 8 }}>
                <summary style={{ cursor: 'pointer', fontFamily: 'var(--serif)' }}>{c.title}</summary>
                <CardBody projectId={project.id} cardId={c.id} body={c.body} />
              </details>
            ))}
          </div>
        );
      })}
    </section>
  );
}

function CardBody({ projectId, cardId, body }: { projectId: string; cardId: string; body: string }) {
  const [text, setText] = useState(body);
  return (
    <div style={{ marginTop: 6 }}>
      <textarea lang="tr" style={{ minHeight: 90 }} value={text} onChange={(e) => setText(e.target.value)} onBlur={() => updateProjectCard(projectId, cardId, { body: text })} />
      <button className="linkish tiny" style={{ color: 'var(--text-3)' }} onClick={() => window.confirm('Kart silinsin mi?') && removeProjectCard(projectId, cardId)}>
        Kartı sil
      </button>
    </div>
  );
}
