/**
 * Yazma alıştırmaları (Yeniden yaz · Kendi malzemenle yaz · Video düşüncesi).
 *
 * Akış:
 *   yaz → (anahtar + internet varsa) Claude değerlendirir → geri bildirim → isteğe bağlı yeniden yaz
 *   yaz → (yoksa) öz-değerlendirme rubriği → kuyruğa alınır → internet gelince değerlendirilir
 * Her durumda "Metni ve rubriği kopyala" ile elle başka bir yapay zekâya yapıştırılabilir.
 */
import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, defaultSettings, type AiFeedback, type RoadNote } from '../db/db';
import type { WritingExercise } from '../content/types';
import { skillById } from '../content';
import { evaluateWriting, explainError } from '../ai/claude';
import { formatResponse } from '../ai/prompt';
import { HelpButton } from './HelpSheet';
import type { HelpContext } from '../ai/help';
import { recordWriting } from '../engine/record';
import { Prose, useOnline, useToast } from './ui';
import { wordCount, formatDate } from '../lib/tr';

type Phase = 'write' | 'confirm' | 'evaluating' | 'feedback' | 'self' | 'saved';
type Resp = string | Record<string, string>;

interface Props {
  ex: WritingExercise;
  sessionId?: number;
  onDone: () => void;
  /** Sonradan yeniden yazımda: kök deneme ve son hâl */
  rootId?: number;
  startVersion?: number;
  initialText?: Resp;
  task?: string;
  doneLabel?: string;
}

export default function WritingStep({ ex, sessionId, onDone, rootId: rootIn, startVersion = 1, initialText, task: taskIn, doneLabel = 'Devam' }: Props) {
  const settings = useLiveQuery(() => db.settings.get('main'), []) ?? defaultSettings();
  const online = useOnline();
  const [toast] = useToast();
  const blank: Resp = ex.type === 'video' ? Object.fromEntries(ex.fields.map((f) => [f.label, ''])) : '';
  const [resp, setResp] = useState<Resp>(initialText ?? blank);
  const [phase, setPhase] = useState<Phase>('write');
  const [feedback, setFeedback] = useState<AiFeedback | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [self, setSelf] = useState<Record<string, number>>({});
  const [version, setVersion] = useState(startVersion);
  const [rootId, setRootId] = useState<number | undefined>(rootIn);
  const [previous, setPrevious] = useState<Resp | undefined>(initialText);
  const [task, setTask] = useState<string | undefined>(taskIn);
  const [showHint, setShowHint] = useState(false);
  const [material, setMaterial] = useState<RoadNote | null>(null);

  const notes = useLiveQuery(async () => {
    if (ex.type !== 'write') return [];
    const all = await db.notes.orderBy('date').reverse().toArray();
    const tags = ex.noteTags ?? [];
    const match = all.filter((n) => tags.length === 0 || n.tags.some((t) => tags.includes(t)));
    return (match.length ? match : all).slice(0, 4);
  }, [ex.id]);

  const text = formatResponse(resp);
  const words = typeof resp === 'string' ? wordCount(resp) : Object.values(resp).reduce((a, v) => a + wordCount(v), 0);
  const ready = typeof resp === 'string' ? words >= 5 : Object.values(resp).every((v) => v.trim().length > 0);
  const canAi = !!settings.apiKey && online;
  const isRewriteRound = version > 1 || !!initialText;

  const submit = async () => {
    setError(null);
    if (material?.id != null) await db.notes.update(material.id, { usedIn: [...(material.usedIn ?? []), ex.id] });
    if (!canAi) return setPhase('self');
    // "Göndermeden önce sor" açıksa önce ne gönderileceğini göster
    if (settings.askBeforeSend) return setPhase('confirm');
    return sendToClaude();
  };

  const sendToClaude = async () => {
    setPhase('evaluating');
    try {
      const fb = await evaluateWriting(settings, ex, resp, previous ? formatResponse(previous) : undefined);
      const id = await recordWriting({ ex, response: resp, ai: fb, pending: false, version, rootId, sessionId });
      if (rootId == null) setRootId(id);
      setFeedback(fb);
      setPhase('feedback');
    } catch (e) {
      setError(explainError(e));
      setPhase('self');
    }
  };

  const saveSelf = async () => {
    const id = await recordWriting({ ex, response: resp, selfScores: self, pending: true, version, rootId, sessionId });
    if (rootId == null) setRootId(id);
    setPhase('saved');
  };

  const startRewrite = (newTask?: string) => {
    setPrevious(resp);
    setTask(newTask);
    setVersion((v) => v + 1);
    setFeedback(null);
    setSelf({});
    setPhase('write');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Yardım Al için bağlam: görev, (varsa) zayıf metin, ölçütler ve senin metnin
  const helpCtx: HelpContext = {
    task: ex.prompt,
    source: ex.type === 'rewrite' ? ex.source : undefined,
    rubric: ex.rubric,
    skills: ex.skills,
    text: formatResponse(resp).trim() || undefined,
  };

  const weakestSelf = useMemo(() => {
    const idx = ex.rubric.findIndex((_, i) => (self[i] ?? 0) < 2);
    return idx >= 0 ? ex.rubric[idx].criterion : undefined;
  }, [self, ex.rubric]);

  // ——— Yazma ———
  if (phase === 'write' || phase === 'evaluating') {
    return (
      <div className="fade">
        <div className="eyebrow">{ex.type === 'rewrite' ? 'Yeniden yaz' : ex.type === 'video' ? 'Video düşüncesi' : ex.type === 'write' && ex.atelier ? 'Atölye görevi' : 'Kendi malzemenle yaz'}{version > 1 ? ` · ${version}. hâl` : ''}</div>
        {task ? (
          <>
            <div className="card ember small" style={{ marginBottom: 12 }}>
              <div className="eyebrow">Yeniden yazma görevi</div>
              {task}
            </div>
            <details className="small muted" style={{ marginBottom: 10 }}>
              <summary style={{ cursor: 'pointer', padding: '6px 0' }}>Asıl görev</summary>
              <Prose text={ex.prompt} />
            </details>
          </>
        ) : (
          <Prose text={ex.prompt} />
        )}
        {ex.type === 'rewrite' && <div className="quote">{ex.source}</div>}

        <div className="row" style={{ gap: 4 }}>
          {ex.hint && (
            <button className="linkish small" onClick={() => setShowHint(!showHint)}>
              {showHint ? 'İpucunu gizle' : 'İpucu'}
            </button>
          )}
          <span className="grow" />
          <HelpButton context={helpCtx} modes={['fikir', 'acikla', 'degerlendir']} className="linkish small" />
        </div>
        {showHint && <div className="card soft small rise" style={{ marginBottom: 12 }}>{ex.hint}</div>}

        {ex.type === 'write' && notes && notes.length > 0 && !material && (
          <details style={{ margin: '8px 0 12px' }}>
            <summary className="small" style={{ cursor: 'pointer', padding: '6px 0', color: 'var(--ember)' }}>
              Yol Defteri'nden malzeme ({notes.length})
            </summary>
            <div className="list">
              {notes.map((n) => (
                <button key={n.id} className="option" style={{ marginTop: 8 }} onClick={() => setMaterial(n)}>
                  <div className="tiny faint">{formatDate(n.date)} · {n.tags.join(', ')}</div>
                  <div className="small" style={{ fontFamily: 'var(--serif)' }}>{n.text.length > 180 ? n.text.slice(0, 180) + '…' : n.text}</div>
                </button>
              ))}
            </div>
          </details>
        )}
        {material && (
          <div className="card soft small" style={{ margin: '8px 0 12px' }}>
            <div className="row between">
              <span className="eyebrow" style={{ margin: 0 }}>Malzeme</span>
              <button className="linkish tiny" onClick={() => setMaterial(null)}>Kaldır</button>
            </div>
            <div style={{ fontFamily: 'var(--serif)', whiteSpace: 'pre-wrap' }}>{material.text}</div>
          </div>
        )}

        {ex.type === 'video' && typeof resp !== 'string' ? (
          ex.fields.map((f) => (
            <label className="field" key={f.key}>
              <span>{f.label}</span>
              <textarea
                lang="tr"
                style={{ minHeight: 96 }}
                value={resp[f.label] ?? ''}
                placeholder={f.placeholder}
                onChange={(e) => setResp({ ...(resp as Record<string, string>), [f.label]: e.target.value })}
                disabled={phase === 'evaluating'}
              />
            </label>
          ))
        ) : (
          <textarea
            lang="tr"
            className={ex.type === 'write' ? 'big' : ''}
            value={resp as string}
            onChange={(e) => setResp(e.target.value)}
            placeholder={ex.type === 'rewrite' ? 'Kendi hâlinle yeniden yaz…' : 'Yaz. Sesle yazma da olur.'}
            disabled={phase === 'evaluating'}
            spellCheck
          />
        )}
        <div className="row between faint tiny" style={{ marginTop: 6 }}>
          <span>{words} kelime{ex.type === 'write' && ex.words ? ` · önerilen ${ex.words[0]}–${ex.words[1]}` : ''}</span>
          <span>{canAi ? 'Claude değerlendirecek' : settings.apiKey ? 'Çevrimdışı: öz-değerlendirme' : 'Öz-değerlendirme'}</span>
        </div>
        <div className="bottom-spacer" />
        <div className="bottom-bar">
          <div className="inner">
            <button className="btn primary" disabled={!ready || phase === 'evaluating'} onClick={submit}>
              {phase === 'evaluating' ? (
                <>
                  <span className="spinner" /> Okunuyor…
                </>
              ) : isRewriteRound ? 'Bu hâli gönder' : 'Bitirdim'}
            </button>
          </div>
        </div>
        {toast}
      </div>
    );
  }

  // ——— Yapay zekâ geri bildirimi ———
  if (phase === 'feedback' && feedback) {
    return (
      <div className="fade">
        <div className="eyebrow">Geri bildirim{version > 1 ? ` · ${version}. hâl` : ''}</div>
        <FeedbackView fb={feedback} />
        <div className="bottom-spacer" />
        <div className="bottom-bar">
          <div className="inner">
            {version < 3 && <button className="btn" onClick={() => startRewrite(feedback.rewriteTask)}>Yeniden yaz</button>}
            <button className="btn primary" onClick={onDone}>{doneLabel}</button>
          </div>
        </div>
      </div>
    );
  }

  // ——— Göndermeden önce onay ———
  if (phase === 'confirm') {
    return (
      <div className="fade">
        <div className="eyebrow">Göndermeden önce</div>
        <p className="small muted">
          Şu metin, görev ve ölçütlerle birlikte Claude'a (Anthropic) gönderilecek. Göndermek istemezsen kendin
          değerlendirebilirsin; metin yine kaydedilir.
        </p>
        <div className="quote">{text}</div>
        <div className="bottom-spacer" />
        <div className="bottom-bar">
          <div className="inner">
            <button className="btn" onClick={() => setPhase('self')}>Kendim değerlendireyim</button>
            <button className="btn primary" onClick={sendToClaude}>Claude'a gönder</button>
          </div>
        </div>
      </div>
    );
  }

  // ——— Öz-değerlendirme ———
  if (phase === 'self') {
    return (
      <div className="fade">
        <div className="eyebrow">Kendi gözünle oku</div>
        {error && <div className="card soft small" style={{ marginBottom: 12, borderColor: 'var(--warn)' }}>{error} Şimdilik kendin değerlendir; metnin kuyruğa alınacak.</div>}
        <div className="quote">{text}</div>
        <p className="small muted">Her ölçüt için dürüstçe işaretle. "Kısmen" demek de bir bilgi.</p>
        <div className="card soft">
          {ex.rubric.map((r, i) => (
            <div className="rubric-row" key={i}>
              <div className="tiny faint">{skillById.get(r.skill)?.name}</div>
              <div>{r.criterion}</div>
              <div className="seg">
                {['Henüz değil', 'Kısmen', 'Evet'].map((l, v) => (
                  <button key={v} className={self[i] === v ? 'on' : ''} onClick={() => setSelf({ ...self, [i]: v })}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 14 }}>
          <HelpButton context={helpCtx} modes={['degerlendir', 'fikir']} label="Başka bir yerde değerlendirt" />
        </div>
        <div className="bottom-spacer" />
        <div className="bottom-bar">
          <div className="inner">
            <button className="btn primary" disabled={ex.rubric.some((_, i) => self[i] == null)} onClick={saveSelf}>
              Kaydet
            </button>
          </div>
        </div>
        {toast}
      </div>
    );
  }

  // ——— Kaydedildi (kuyrukta) ———
  return (
    <div className="fade">
      <div className="eyebrow">Kaydedildi</div>
      <p className="muted small">
        {settings.apiKey
          ? 'Metnin "sonra değerlendir" kuyruğunda. İnternet gelince Claude okuyacak; sonucu Yazılarım\'da göreceksin ve beceri profiline işlenecek.'
          : 'Metnin Yazılarım\'da duruyor. Ayarlar\'dan bir API anahtarı eklersen bekleyen bütün yazıların değerlendirilir.'}
      </p>
      {weakestSelf && (
        <div className="card soft small">
          <div className="eyebrow">Bir sonraki adım</div>
          Kendi işaretlerine göre en çok şunu güçlendirebilirsin: <em>{weakestSelf}</em>
        </div>
      )}
      {ex.type === 'rewrite' && ex.sample && (
        <details className="card soft" style={{ marginTop: 14 }}>
          <summary className="small" style={{ cursor: 'pointer' }}>Bir örnek güçlendirme (kendi hâlini yazdıktan sonra bak)</summary>
          <div className="quote">{ex.sample}</div>
          <div className="tiny faint">Tek doğru bu değil; yalnızca bir yol.</div>
        </details>
      )}
      <div style={{ marginTop: 14 }}>
        <HelpButton context={helpCtx} modes={['degerlendir', 'fikir']} label="Başka bir yerde değerlendirt" />
      </div>
      <div className="bottom-spacer" />
      <div className="bottom-bar">
        <div className="inner">
          {version < 3 && <button className="btn" onClick={() => startRewrite(weakestSelf ? `Şu ölçütü hedefleyerek yeniden yaz: ${weakestSelf}` : undefined)}>Yeniden yaz</button>}
          <button className="btn primary" onClick={onDone}>{doneLabel}</button>
        </div>
      </div>
      {toast}
    </div>
  );
}

export function FeedbackView({ fb }: { fb: AiFeedback }) {
  return (
    <div className="rise">
      <div className="card soft">
        <div className="eyebrow" style={{ color: 'var(--good)' }}>İşleyen</div>
        <div className="prose" style={{ fontSize: '1rem' }}>{fb.strength}</div>
      </div>
      <div className="card soft">
        <div className="eyebrow" style={{ color: 'var(--warn)' }}>Zayıf yer</div>
        <div className="prose" style={{ fontSize: '1rem' }}>{fb.comment}</div>
      </div>
      <div className="card ember">
        <div className="eyebrow">Tek bir şey</div>
        <div className="prose" style={{ fontSize: '1rem' }}>{fb.suggestion}</div>
      </div>
      <div className="card soft">
        <div className="eyebrow">Beceri beceri</div>
        {fb.skills.map((s) => (
          <div key={s.skill} style={{ margin: '10px 0' }}>
            <div className="small" style={{ fontWeight: 600 }}>{skillById.get(s.skill)?.name ?? s.skill}</div>
            <div className="small muted">{s.note}</div>
          </div>
        ))}
      </div>
      <div className="card soft small">
        <div className="eyebrow">Yeniden yazma görevi</div>
        {fb.rewriteTask}
      </div>
    </div>
  );
}
