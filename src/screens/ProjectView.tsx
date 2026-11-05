/** Proje: bir araya getirilmiş taslaklar, bölüm sırası ve tek dosya olarak dışa aktarma. */
import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Project } from '../db/db';
import {
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

  const newChapter = async () => go(`/draft/${await createDraft({ projectId: project.id, kind: 'deneme' })}`);

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
      <div className="small muted" style={{ margin: '10px 0 16px' }}>
        {drafts.length} bölüm · {done} bitti · {words} kelime
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
        <button className="btn primary grow" onClick={newChapter}>Yeni bölüm</button>
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

      <hr className="sep" />
      <div className="row">
        <button className="btn grow" disabled={drafts.length === 0} onClick={() => exportProject(project)}>
          Bütün projeyi Markdown olarak indir
        </button>
      </div>
      <button className="btn small ghost" style={{ color: 'var(--warn)', marginTop: 14 }} onClick={remove}>
        Projeyi sil
      </button>
    </div>
  );
}
