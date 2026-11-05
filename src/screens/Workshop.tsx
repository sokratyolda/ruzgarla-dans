/**
 * Atölyem: istediğin an, istediğin kadar çalış.
 *  • Alıştırmalar: süreye ve beceriye göre süzülebilir; her biri tek başına açılır.
 *  • Serbest yazma: zamanlayıcıyla, değerlendirmesiz, düzeltmesiz yazı.
 *  • Yazılarım: alıştırmalarda yazdıkların; ilk ve yeniden yazılmış hâller.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { BRANCHES, contentUnits, lessonFlow, skillById } from '../content';
import type { Exercise } from '../content/types';
import { go } from '../lib/router';
import { createDraft } from '../lib/desk';
import { formatDate, wordCount } from '../lib/tr';
import { Tabs, useToast } from '../components/ui';
import Writings from './Writings';

type Tab = 'alistirmalar' | 'serbest' | 'yazilarim';

export default function Workshop({ query }: { query: URLSearchParams }) {
  const t = query.get('t');
  const tab: Tab = t === 'serbest' ? 'serbest' : t === 'yazilarim' ? 'yazilarim' : 'alistirmalar';
  return (
    <div className="fade">
      <div className="eyebrow">Atölyem</div>
      <h1>Çalışma tezgâhı</h1>
      <Tabs
        value={tab}
        onChange={(v) => go(v === 'alistirmalar' ? '/workshop' : `/workshop?t=${v}`)}
        items={[
          ['alistirmalar', 'Alıştırmalar'],
          ['serbest', 'Serbest yazma'],
          ['yazilarim', 'Yazılarım'],
        ]}
      />
      {tab === 'alistirmalar' && <Exercises />}
      {tab === 'serbest' && <Freewrite />}
      {tab === 'yazilarim' && <Writings embedded />}
    </div>
  );
}

// ——— Alıştırmalar ———

/** Bir alıştırmanın yaklaşık süresi (dakika) */
export const minutesOf = (e: Exercise) =>
  e.type === 'write' ? (e.atelier ? 20 : 10) : e.type === 'video' ? 6 : e.type === 'rewrite' ? 5 : 2;

const TYPE_LABEL: Record<Exercise['type'], string> = {
  concept: 'Kavram',
  choice: 'Soru',
  discern: 'Ayırt et',
  missing: 'Eksik unsuru bul',
  rewrite: 'Yeniden yaz',
  write: 'Kendi malzemenle yaz',
  video: 'Video düşüncesi',
};

type Dur = 'hepsi' | 'kisa' | 'orta' | 'uzun';
const DUR: [Dur, string][] = [
  ['hepsi', 'Hepsi'],
  ['kisa', '≤ 5 dk'],
  ['orta', '6–10 dk'],
  ['uzun', '15+ dk'],
];

function Exercises() {
  const tried = useLiveQuery(async () => new Set((await db.attempts.toArray()).map((a) => a.exerciseId)), []) ?? new Set<string>();
  const [dur, setDur] = useState<Dur>('hepsi');
  const [skill, setSkill] = useState('');

  const all = useMemo(() => {
    const out: { e: Exercise; where: string }[] = [];
    for (const b of BRANCHES) {
      if (!b.available) continue;
      for (const u of contentUnits(b)) {
        for (const l of u.lessons) for (const e of lessonFlow(l)) if (e.type !== 'concept') out.push({ e, where: `${u.title} · ${l.title}` });
        for (const e of u.practice) out.push({ e, where: `${u.title} · alıştırma havuzu` });
        if (u.atelier) out.push({ e: u.atelier, where: `${u.title} · atölye` });
      }
    }
    return out;
  }, []);

  const skillOptions = useMemo(() => {
    const ids = new Set(all.flatMap((x) => x.e.skills));
    return [...ids].map((id) => skillById.get(id)).filter((s): s is NonNullable<typeof s> => !!s).sort((a, b) => a.name.localeCompare(b.name, 'tr'));
  }, [all]);

  const shown = all.filter(({ e }) => {
    const m = minutesOf(e);
    if (dur === 'kisa' && m > 5) return false;
    if (dur === 'orta' && (m < 6 || m > 10)) return false;
    if (dur === 'uzun' && m < 15) return false;
    if (skill && !e.skills.includes(skill)) return false;
    return true;
  });

  return (
    <>
      <p className="small muted">
        Günlük dersin dışında, istediğin an istediğin kadar. Kısa bir boşlukta bir soru, akşam kampta uzun bir yazı.
      </p>
      <div className="chips" role="group" aria-label="Süre" style={{ marginBottom: 10 }}>
        {DUR.map(([id, label]) => (
          <button key={id} className={`chip ${dur === id ? 'on' : ''}`} aria-pressed={dur === id} onClick={() => setDur(id)}>
            {label}
          </button>
        ))}
      </div>
      <label className="field">
        <span>Beceri</span>
        <select value={skill} onChange={(e) => setSkill(e.target.value)}>
          <option value="">Bütün beceriler</option>
          {skillOptions.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </label>
      <div className="tiny faint" style={{ marginBottom: 6 }}>{shown.length} alıştırma</div>
      <div className="list">
        {shown.map(({ e, where }) => (
          <a key={e.id} className="list-link" href={`#/session?ex=${encodeURIComponent(e.id)}`}>
            <div style={{ minWidth: 0 }}>
              <div className="small" style={{ fontWeight: 600 }}>
                {TYPE_LABEL[e.type]} · ~{minutesOf(e)} dk {tried.has(e.id) && <span className="tag good">yapıldı</span>}
              </div>
              <div className="tiny faint">{e.skills.map((s) => skillById.get(s)?.name).filter(Boolean).join(', ')}</div>
              <div className="tiny faint">{where}</div>
            </div>
            <span className="chev">›</span>
          </a>
        ))}
      </div>
    </>
  );
}

// ——— Serbest yazma ———

const SPARKS = [
  'Bugün yolda gördüğün ama kimseye anlatmadığın bir şey.',
  'Son konuştuğun yabancının elleri.',
  'Çadırın içinden duyduğun bir ses.',
  'Bir yokuşun ortasında aklından geçen cümle.',
  'Bırakmak zorunda kaldığın bir eşya.',
  'Bir köy kahvesinde kimsenin sormadığı soru.',
];

function Freewrite() {
  const past = useLiveQuery(() => db.freewrites.orderBy('date').reverse().toArray(), []) ?? [];
  const notes = useLiveQuery(() => db.notes.orderBy('date').reverse().limit(20).toArray(), []) ?? [];
  const [minutes, setMinutes] = useState(5);
  const [running, setRunning] = useState(false);
  const [left, setLeft] = useState(0);
  const [text, setText] = useState('');
  const [spark, setSpark] = useState(() => SPARKS[Math.floor(Math.random() * SPARKS.length)]);
  const started = useRef(0);
  const [toast, show] = useToast();

  useEffect(() => {
    if (!running) return;
    const iv = window.setInterval(() => {
      const l = minutes * 60 - Math.floor((Date.now() - started.current) / 1000);
      setLeft(Math.max(0, l));
    }, 500);
    return () => window.clearInterval(iv);
  }, [running, minutes]);

  const start = () => {
    started.current = Date.now();
    setLeft(minutes * 60);
    setText('');
    setRunning(true);
  };

  const finish = async () => {
    setRunning(false);
    if (!text.trim()) return;
    await db.freewrites.add({
      date: new Date().toISOString(),
      text: text.trim(),
      words: wordCount(text),
      seconds: Math.round((Date.now() - started.current) / 1000),
    });
    setText('');
    show('Kaydedildi. Değerlendirme yok; yazdın, o kadar.');
  };

  const newSpark = () => {
    const pool = [...SPARKS, ...notes.map((n) => `Yol Defteri'nden: “${n.text.length > 90 ? n.text.slice(0, 90) + '…' : n.text}”`)];
    setSpark(pool[Math.floor(Math.random() * pool.length)]);
  };

  const mm = String(Math.floor(left / 60)).padStart(2, '0');
  const ss = String(left % 60).padStart(2, '0');

  if (running)
    return (
      <div>
        <div className="row between" style={{ marginBottom: 8 }}>
          <span className="small muted">{spark}</span>
          <span className={`timer ${left === 0 ? 'done' : ''}`} aria-live="polite">{left === 0 ? 'süre doldu' : `${mm}:${ss}`}</span>
        </div>
        <textarea
          className="big"
          lang="tr"
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Durma, düzeltme. Elin aklından hızlı olsun."
          spellCheck={false}
        />
        <div className="row between tiny faint" style={{ marginTop: 6 }}>
          <span>{wordCount(text)} kelime</span>
          <span>yazım denetimi kapalı: geri dönüp düzeltme</span>
        </div>
        <div className="bottom-spacer" />
        <div className="bottom-bar">
          <div className="inner">
            <button className="btn primary" onClick={finish}>Bitir ve kaydet</button>
          </div>
        </div>
      </div>
    );

  return (
    <div>
      <p className="small muted">
        İç editörü sustur: süre boyunca durmadan yaz, geri dönüp düzeltme. Bu yazılar değerlendirilmez; içlerinden
        işe yarayan bir cümle çıkarsa Eserlerim'e taşırsın.
      </p>
      <div className="card soft">
        <div className="eyebrow">Kıvılcım</div>
        <div style={{ fontFamily: 'var(--serif)' }}>{spark}</div>
        <button className="linkish small" onClick={newSpark}>Başka bir kıvılcım</button>
      </div>
      <div className="chips" role="group" aria-label="Süre" style={{ margin: '14px 0' }}>
        {[5, 10, 15].map((m) => (
          <button key={m} className={`chip ${minutes === m ? 'on' : ''}`} aria-pressed={minutes === m} onClick={() => setMinutes(m)}>
            {m} dakika
          </button>
        ))}
      </div>
      <button className="btn primary block" onClick={start}>Başla</button>

      {past.length > 0 && (
        <>
          <hr className="sep" />
          <div className="eyebrow">Önceki serbest yazılar</div>
          <div className="list">
            {past.map((f) => (
              <details key={f.id} className="item">
                <summary style={{ cursor: 'pointer' }}>
                  <span className="small">{formatDate(f.date, { day: 'numeric', month: 'short' })} · {f.words} kelime</span>
                  <div className="tiny faint" style={{ fontFamily: 'var(--serif)' }}>{f.text.slice(0, 80)}{f.text.length > 80 ? '…' : ''}</div>
                </summary>
                <div style={{ fontFamily: 'var(--serif)', whiteSpace: 'pre-wrap', margin: '8px 0' }}>{f.text}</div>
                <button
                  className="btn small"
                  onClick={async () => go(`/draft/${await createDraft({ body: f.text, kind: 'diğer' })}`)}
                >
                  Eserlerime taşı
                </button>
              </details>
            ))}
          </div>
        </>
      )}
      {toast}
    </div>
  );
}
