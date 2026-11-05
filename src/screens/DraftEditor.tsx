/**
 * Taslak düzenleyici: otomatik kayıt (cihazda, anında), kontrol noktaları, sürüm geçmişi,
 * iki sürümü karşılaştırma, eski sürüme geri dönme ve Yol Defteri'nden malzeme.
 * Geniş ekranda (MacBook, tablet yatay) yan panel sağda sürekli açık durur.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Draft, type DraftRevision } from '../db/db';
import {
  DRAFT_KINDS,
  DRAFT_STATUS,
  autoRevision,
  checkpoint,
  deleteDraft,
  draftTitle,
  exportDraft,
  restoreRevision,
  revisionsOf,
  setDraftProject,
  updateDraft,
} from '../lib/desk';
import { diffStats, wordDiff } from '../lib/diff';
import { formatDate, formatTime, normalize, wordCount } from '../lib/tr';
import { go } from '../lib/router';
import { TopBar, useToast } from '../components/ui';
import SkillPicker from '../components/SkillPicker';
import { HelpButton } from '../components/HelpSheet';

type Panel = 'surumler' | 'malzeme' | null;

const SOURCE_LABEL: Record<DraftRevision['source'], string> = {
  'kontrol-noktası': 'Kontrol noktası',
  otomatik: 'Otomatik',
  'içe-aktarma': 'Başlangıç',
};

export default function DraftEditor({ id }: { id: string }) {
  const initial = useLiveQuery(async () => (await db.drafts.get(id)) ?? null, [id]);
  if (initial === undefined) return null;
  if (initial === null)
    return (
      <div>
        <TopBar title="Taslak" onBack={() => go('/desk')} />
        <div className="empty">Bu taslak bulunamadı. Silinmiş olabilir.</div>
      </div>
    );
  return <Editor key={id} draft={initial} />;
}

function Editor({ draft }: { draft: Draft }) {
  const [title, setTitle] = useState(draft.title);
  const [body, setBody] = useState(draft.body);
  const [saved, setSaved] = useState<'kayıtlı' | 'yazılıyor' | 'kaydediliyor'>('kayıtlı');
  const [savedAt, setSavedAt] = useState(draft.updatedAt);
  const [panel, setPanel] = useState<Panel>(null);
  const [toast, show] = useToast();
  const live = useLiveQuery(() => db.drafts.get(draft.id), [draft.id]) ?? draft;
  const projects = useLiveQuery(async () => (await db.projects.toArray()).sort((x, y) => x.title.localeCompare(y.title, 'tr')), []) ?? [];
  const latest = useRef({ title, body });
  latest.current = { title, body };
  const timer = useRef<number>();
  const sideRef = useRef<HTMLElement>(null);

  // Telefonda panel metnin altında açılır: açılınca oraya kaydır ki dokunuşun karşılığı görünsün
  useEffect(() => {
    if (panel && window.matchMedia('(max-width: 999px)').matches)
      sideRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [panel]);

  // ——— Otomatik kayıt: yazmayı bıraktıktan 700 ms sonra cihaza yazılır ———
  const flush = useCallback(async () => {
    window.clearTimeout(timer.current);
    const cur = await db.drafts.get(draft.id);
    if (!cur) return;
    const { title: t, body: b } = latest.current;
    if (cur.title === t && cur.body === b) {
      setSaved('kayıtlı');
      return;
    }
    setSaved('kaydediliyor');
    await updateDraft(draft.id, { title: t, body: b });
    setSaved('kayıtlı');
    setSavedAt(new Date().toISOString());
  }, [draft.id]);

  const schedule = () => {
    setSaved('yazılıyor');
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => void flush(), 700);
  };

  // Çıkarken (ekran değişince, uygulama arka plana geçince) kaydet ve gerekiyorsa otomatik sürüm al
  useEffect(() => {
    const leave = () => {
      void flush().then(() => autoRevision(draft.id, latest.current.body));
    };
    const onVis = () => document.visibilityState === 'hidden' && leave();
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('pagehide', leave);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('pagehide', leave);
      leave();
    };
  }, [draft.id, flush]);

  // Sürüme geri dönülünce (veritabanındaki metin dışarıdan değişince) editörü güncelle
  useEffect(() => {
    if (saved === 'kayıtlı' && live.body !== latest.current.body && live.updatedAt !== savedAt) {
      setBody(live.body);
      setSavedAt(live.updatedAt);
    }
  }, [live.body, live.updatedAt]); // eslint-disable-line react-hooks/exhaustive-deps

  const words = wordCount(body);
  const minutes = Math.max(1, Math.round(words / 200));

  const remove = async () => {
    if (!window.confirm(`“${draftTitle({ title, body })}” ve bütün sürümleri silinsin mi? Geri alınamaz.`)) return;
    window.clearTimeout(timer.current);
    await deleteDraft(draft.id);
    go('/desk');
  };

  return (
    <div className="desk-editor">
      <div className="desk-main">
        <TopBar
          onBack={() => {
            void flush();
            go('/desk');
          }}
          title={
            <span className="tiny faint" aria-live="polite" style={{ whiteSpace: 'nowrap', fontFamily: 'var(--sans)' }}>
              {saved === 'kayıtlı' ? `Kayıtlı · ${formatTime(savedAt)}` : saved === 'kaydediliyor' ? 'Kaydediliyor…' : 'Yazılıyor…'}
            </span>
          }
          right={
            <div className="row" style={{ gap: 6, flexWrap: 'nowrap' }}>
              <button className={`chip compact ${panel === 'surumler' ? 'on' : ''}`} onClick={() => setPanel(panel === 'surumler' ? null : 'surumler')}>
                Sürümler
              </button>
              <button className={`chip compact ${panel === 'malzeme' ? 'on' : ''}`} onClick={() => setPanel(panel === 'malzeme' ? null : 'malzeme')}>
                Malzeme{live.materials?.length ? ` · ${live.materials.length}` : ''}
              </button>
            </div>
          }
        />

        <input
          className="draft-title"
          lang="tr"
          placeholder="Başlık"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            schedule();
          }}
        />
        <textarea
          className="draft-body"
          lang="tr"
          spellCheck
          placeholder="Yaz. Düzeltmeyi sonraya bırak."
          value={body}
          onChange={(e) => {
            setBody(e.target.value);
            schedule();
          }}
        />
        <div className="row between tiny faint" style={{ marginTop: 6 }}>
          <span>
            {words} kelime · ~{minutes} dk okuma
          </span>
          <span className="row" style={{ gap: 12 }}>
            <HelpButton
              context={{ title: title || undefined, text: body.trim() || undefined, skills: live.skills }}
              modes={['degerlendir', 'fikir']}
              className="linkish tiny"
            />
            <button className="linkish tiny" onClick={() => setPanel('surumler')}>Kontrol noktası al</button>
          </span>
        </div>

        <details className="card soft" style={{ marginTop: 18 }}>
          <summary className="small" style={{ cursor: 'pointer' }}>Tür, durum, proje, etiketler</summary>
          <Meta draft={live} projects={projects} />
          <div className="row" style={{ marginTop: 14 }}>
            <button
              className="btn small"
              onClick={async () => {
                await flush();
                const d = await db.drafts.get(draft.id);
                if (d) exportDraft(d);
              }}
            >
              Markdown olarak indir
            </button>
            <button className="btn small ghost" style={{ color: 'var(--warn)' }} onClick={remove}>
              Sil
            </button>
          </div>
        </details>
      </div>

      {panel && (
        <aside className="desk-side rise" ref={sideRef}>
          <div className="row between desk-side-close">
            <span />
            <button className="linkish small" onClick={() => setPanel(null)}>Kapat ↑</button>
          </div>
          {panel === 'surumler' ? (
            <Revisions draftId={draft.id} currentBody={body} beforeAction={flush} onToast={show} />
          ) : (
            <Materials draft={live} />
          )}
        </aside>
      )}
      {toast}
    </div>
  );
}

function Meta({ draft, projects }: { draft: Draft; projects: { id: string; title: string }[] }) {
  const [tags, setTags] = useState(draft.tags.join(', '));
  return (
    <div style={{ marginTop: 12 }}>
      <label className="field">
        <span>Tür</span>
        <select value={draft.kind} onChange={(e) => updateDraft(draft.id, { kind: e.target.value as Draft['kind'] })}>
          {DRAFT_KINDS.map((k) => (
            <option key={k.id} value={k.id}>{k.label}</option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Durum</span>
        <select value={draft.status} onChange={(e) => updateDraft(draft.id, { status: e.target.value as Draft['status'] })}>
          {DRAFT_STATUS.map((s) => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Proje</span>
        <select value={draft.projectId ?? ''} onChange={(e) => setDraftProject(draft.id, e.target.value || undefined)}>
          <option value="">Projesiz</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.title}</option>
          ))}
        </select>
      </label>
      <SkillPicker
        value={draft.skills ?? []}
        onChange={(skills) => updateDraft(draft.id, { skills })}
        label="Bu eserde uyguladığın beceriler (Gelişim'de kanıt olarak görünür)"
      />
      <label className="field" style={{ marginBottom: 0 }}>
        <span>Etiketler (virgülle)</span>
        <input
          type="text"
          lang="tr"
          value={tags}
          placeholder="Kemaliye, yokuş, yalnızlık"
          onChange={(e) => setTags(e.target.value)}
          onBlur={() =>
            updateDraft(draft.id, {
              tags: [...new Set(tags.split(',').map((t) => t.trim()).filter(Boolean))],
            })
          }
        />
      </label>
    </div>
  );
}

function Revisions({
  draftId,
  currentBody,
  beforeAction,
  onToast,
}: {
  draftId: string;
  currentBody: string;
  beforeAction: () => Promise<void>;
  onToast: (m: string) => void;
}) {
  const revs = useLiveQuery(() => revisionsOf(draftId), [draftId]) ?? [];
  const [note, setNote] = useState('');
  const [selected, setSelected] = useState<DraftRevision | null>(null);

  const takeCheckpoint = async () => {
    await beforeAction();
    await checkpoint(draftId, currentBody, note);
    setNote('');
    onToast('Kontrol noktası kaydedildi.');
  };

  if (selected) return <Compare rev={selected} currentBody={currentBody} onClose={() => setSelected(null)} draftId={draftId} beforeAction={beforeAction} onToast={onToast} />;

  return (
    <div>
      <div className="eyebrow">Sürümler</div>
      <p className="tiny muted">
        Yazdığın her şey anında cihaza kaydedilir. Kontrol noktası, metnin o anki hâlini ayrıca saklar; istediğin zaman
        ona dönebilir ya da bugünküyle karşılaştırabilirsin.
      </p>
      <input type="text" lang="tr" placeholder="Not (isteğe bağlı): ör. ikinci yapı denemesi" value={note} onChange={(e) => setNote(e.target.value)} />
      <button className="btn small primary block" style={{ marginTop: 8 }} disabled={!currentBody.trim()} onClick={takeCheckpoint}>
        Kontrol noktası al
      </button>
      {revs.length === 0 ? (
        <div className="empty" style={{ padding: '20px 0' }}>Henüz sürüm yok.</div>
      ) : (
        <div className="list" style={{ marginTop: 10 }}>
          {revs.map((r) => (
            <button key={r.id} className="rev-row" onClick={() => setSelected(r)}>
              <div className="row between tiny">
                <span>{formatDate(r.createdAt, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                <span className="faint">{SOURCE_LABEL[r.source]} · {wordCount(r.body)} kelime</span>
              </div>
              {r.note && <div className="small" style={{ marginTop: 2 }}>{r.note}</div>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Compare({
  rev,
  currentBody,
  draftId,
  onClose,
  beforeAction,
  onToast,
}: {
  rev: DraftRevision;
  currentBody: string;
  draftId: string;
  onClose: () => void;
  beforeAction: () => Promise<void>;
  onToast: (m: string) => void;
}) {
  const parts = wordDiff(rev.body, currentBody);
  const stats = parts ? diffStats(parts) : null;
  const [sideBySide, setSideBySide] = useState(!parts);

  const restore = async () => {
    if (!window.confirm('Metin bu sürüme dönsün mü? Şimdiki hâl ayrıca saklanacak; istersen geri dönebilirsin.')) return;
    await beforeAction();
    await restoreRevision(draftId, rev.id);
    onToast('Sürüme dönüldü. Önceki hâl sürümlerde duruyor.');
    onClose();
  };

  return (
    <div>
      <div className="row between">
        <div className="eyebrow" style={{ margin: 0 }}>Karşılaştır</div>
        <button className="linkish small" onClick={onClose}>← Sürümler</button>
      </div>
      <p className="tiny muted" style={{ marginTop: 6 }}>
        {formatDate(rev.createdAt, { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })} sürümünden bugüne
        {stats ? `: ${stats.added} kelime eklendi, ${stats.removed} kelime çıkarıldı.` : '.'}
        <br />
        <span className="diff-del">üstü çizili</span> = o sürümde vardı, şimdi yok · <span className="diff-add">altı çizili</span> = sonradan eklendi
      </p>
      <div className="seg" role="group" aria-label="Görünüm" style={{ margin: '8px 0' }}>
        <button className={!sideBySide ? 'on' : ''} aria-pressed={!sideBySide} disabled={!parts} onClick={() => setSideBySide(false)}>Farkları işaretle</button>
        <button className={sideBySide ? 'on' : ''} aria-pressed={sideBySide} onClick={() => setSideBySide(true)}>Yan yana</button>
      </div>
      {parts && !sideBySide ? (
        <div className="diff">
          {parts.map((p, i) => (
            <span key={i} className={p.type === 'add' ? 'diff-add' : p.type === 'del' ? 'diff-del' : undefined}>
              {p.text}
            </span>
          ))}
        </div>
      ) : (
        <div className="compare">
          <div className="card soft diff" style={{ marginTop: 0 }}>
            <div className="eyebrow">O sürüm</div>
            {rev.body}
          </div>
          <div className="card soft diff" style={{ marginTop: 0 }}>
            <div className="eyebrow">Şimdi</div>
            {currentBody}
          </div>
        </div>
      )}
      <button className="btn small block" style={{ marginTop: 12 }} onClick={restore}>
        Bu sürüme dön
      </button>
    </div>
  );
}

function Materials({ draft }: { draft: Draft }) {
  const notes = useLiveQuery(() => db.notes.orderBy('date').reverse().toArray(), []) ?? [];
  const [q, setQ] = useState('');
  const attached = new Set(draft.materials ?? []);
  const toggle = (id: number) =>
    updateDraft(draft.id, {
      materials: attached.has(id) ? [...attached].filter((x) => x !== id) : [...attached, id],
    });
  const nq = normalize(q);
  const mine = notes.filter((n) => attached.has(n.id!));
  const others = notes.filter((n) => !attached.has(n.id!) && (!nq || normalize(`${n.text} ${n.tags.join(' ')}`).includes(nq)));

  return (
    <div>
      <div className="eyebrow">Malzeme</div>
      <p className="tiny muted">Yol Defteri'nden bu taslağa notlar iliştir. Metne eklenmez; yazarken yanında durur.</p>
      {mine.map((n) => (
        <div key={n.id} className="card soft small" style={{ marginTop: 8 }}>
          <div style={{ fontFamily: 'var(--serif)', whiteSpace: 'pre-wrap' }}>{n.text}</div>
          <div className="row between tiny faint" style={{ marginTop: 4 }}>
            <span>{n.tags.join(' · ')}</span>
            <button className="linkish tiny" onClick={() => toggle(n.id!)}>Kaldır</button>
          </div>
        </div>
      ))}
      <input type="search" placeholder="Yol Defteri'nde ara" value={q} onChange={(e) => setQ(e.target.value)} style={{ marginTop: 12 }} />
      {notes.length === 0 ? (
        <div className="empty" style={{ padding: '16px 0' }}>Yol Defteri boş.</div>
      ) : (
        <div className="list">
          {others.slice(0, 30).map((n) => (
            <button key={n.id} className="rev-row" onClick={() => toggle(n.id!)}>
              <div className="tiny faint">{formatDate(n.date, { day: 'numeric', month: 'short' })} · {n.tags.join(', ')}</div>
              <div className="small" style={{ fontFamily: 'var(--serif)' }}>{n.text.length > 140 ? n.text.slice(0, 140) + '…' : n.text}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
