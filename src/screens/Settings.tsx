import { useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, defaultSettings, updateSettings } from '../db/db';
import { MODEL_OPTIONS, explainError, testConnection } from '../ai/claude';
import { processQueue } from '../ai/queue';
import { describeCounts, downloadBackup, mergeWith, parseBackup, previewBackup, replaceWith, wipeAll, type BackupFile } from '../lib/backup';
import { TopBar, useToast } from '../components/ui';
import { go } from '../lib/router';
import { BRANCHES, branchById } from '../content';
import { formatDate, today } from '../lib/tr';

export default function SettingsScreen() {
  const s = useLiveQuery(async () => ({ ...defaultSettings(), ...(await db.settings.get('main')) }), []) ?? defaultSettings();
  const seasonOptions = BRANCHES.filter((b) => b.available && (!b.elective || s.electives.includes(b.id)));
  const electives = BRANCHES.filter((b) => b.elective);
  const [toast, show] = useToast();
  const [keyDraft, setKeyDraft] = useState<string | null>(null);
  const [reveal, setReveal] = useState(false);
  const [testing, setTesting] = useState(false);
  const [withKey, setWithKey] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<BackupFile | null>(null);
  const custom = !MODEL_OPTIONS.some((m) => m.id === s.model);

  const saveKey = async () => {
    await updateSettings({ apiKey: (keyDraft ?? '').trim() });
    setKeyDraft(null);
    show('Anahtar bu cihaza kaydedildi.');
    void processQueue(true);
  };

  const test = async () => {
    setTesting(true);
    try {
      const r = await testConnection(s);
      show(`Bağlantı tamam: "${r}"`);
    } catch (e) {
      show(explainError(e));
    } finally {
      setTesting(false);
    }
  };

  // İçe aktarma iki adımlı: önce dosya doğrulanır ve içeriği gösterilir, sonra yöntem seçilir.
  const onPick = async (f: File) => {
    try {
      setPending(parseBackup(await f.text()));
    } catch (e) {
      show(e instanceof Error ? e.message : 'Dosya okunamadı.');
    }
  };

  const doMerge = async () => {
    if (!pending) return;
    const { added } = await mergeWith(pending);
    setPending(null);
    show(`Birleştirildi. Eklenen: ${describeCounts(added)}.`);
  };

  const doReplace = async () => {
    if (!pending) return;
    if (!window.confirm('Bu cihazdaki bütün veri silinip yedekteki veri yazılacak. Emin misin?')) return;
    const { counts } = await replaceWith(pending);
    setPending(null);
    show(`Geri yüklendi: ${describeCounts(counts)}.`);
  };

  return (
    <div className="fade">
      <TopBar title="Ayarlar" />

      <div className="card">
        <h3>Sen</h3>
        <label className="field">
          <span>Adın</span>
          <input type="text" value={s.name} onChange={(e) => updateSettings({ name: e.target.value })} />
        </label>
        <div className="field">
          <span className="small muted" style={{ fontWeight: 600 }}>Haftalık hedef</span>
          <div className="chips" style={{ marginTop: 8 }}>
            {[2, 3, 4, 5, 6, 7].map((n) => (
              <button key={n} className={`chip ${s.weeklyGoal === n ? 'on' : ''}`} onClick={() => updateSettings({ weeklyGoal: n })}>
                {n} gün
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Mevsim</h3>
        <p className="small muted">
          Yeni dersler yalnızca bu mevsimin dalından gelir; tekrarlar açtığın bütün dallardan. Dalı Yol ekranından da
          değiştirebilirsin.
        </p>
        <label className="field">
          <span>Bu mevsimin dalı</span>
          <select
            value={s.seasonBranch}
            onChange={(e) => updateSettings({ seasonBranch: e.target.value, seasonStartedAt: today() })}
          >
            {seasonOptions.map((b) => (
              <option key={b.id} value={b.id}>{b.title}</option>
            ))}
          </select>
        </label>
        {s.seasonStartedAt && (
          <div className="tiny faint">
            {branchById.get(s.seasonBranch)?.short} mevsimi {formatDate(s.seasonStartedAt)} tarihinde başladı.
          </div>
        )}
        {electives.length > 0 && (
          <>
            <div className="small muted" style={{ margin: '16px 0 8px', fontWeight: 600 }}>Seçmeli dallar</div>
            {electives.map((b) => (
              <label key={b.id} className="row small" style={{ margin: '6px 0' }}>
                <input
                  type="checkbox"
                  style={{ width: 20, height: 20 }}
                  checked={s.electives.includes(b.id)}
                  onChange={(e) =>
                    updateSettings({
                      electives: e.target.checked ? [...s.electives, b.id] : s.electives.filter((x) => x !== b.id),
                    })
                  }
                />
                {b.title}
                {!b.available && <span className="tag">yakında</span>}
              </label>
            ))}
          </>
        )}
      </div>

      <div className="card">
        <h3>Görünüm</h3>
        <div className="chips">
          <button className={`chip ${s.theme === 'dark' ? 'on' : ''}`} onClick={() => updateSettings({ theme: 'dark' })}>Gece (koyu)</button>
          <button className={`chip ${s.theme === 'light' ? 'on' : ''}`} onClick={() => updateSettings({ theme: 'light' })}>Kâğıt (açık)</button>
        </div>
        <div className="small muted" style={{ margin: '16px 0 8px', fontWeight: 600 }}>Yazı boyutu</div>
        <div className="chips">
          {[
            [0.92, 'Küçük'],
            [1, 'Normal'],
            [1.1, 'Büyük'],
            [1.2, 'Daha büyük'],
          ].map(([v, l]) => (
            <button key={l} className={`chip ${s.textScale === v ? 'on' : ''}`} onClick={() => updateSettings({ textScale: v as number })}>
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <h3>Yardım</h3>
        <p className="small muted">
          Derslerde, sorularda, yazma alıştırmalarında ve eserlerinde bir "Yardım al" düğmesi var. Uygulama hiçbir şey
          göndermez: o anki bağlamla bir soru taslağı hazırlar, sen görürsün, istersen düzenlersin, kopyalayıp ya da
          paylaşıp kendi seçtiğin araca (ChatGPT, Claude, başka bir yapay zekâ ya da bir öğretmen) taşırsın.
        </p>
      </div>

      <details className="card" open={!!s.apiKey}>
        <summary style={{ cursor: 'pointer' }}>
          <h3 style={{ display: 'inline' }}>İsteğe bağlı: uygulama içinde Claude ile değerlendirme</h3>
        </summary>
        <p className="small muted" style={{ marginTop: 10 }}>
          Kendi Anthropic API anahtarını girersen yazma alıştırmaların uygulamanın içinden Claude'a gönderilip
          değerlendirilebilir. Anahtar yoksa bu özellik hiç çalışmaz ve hiçbir şey gönderilmez. Anahtar yalnızca bu
          cihazda saklanır, yalnızca Anthropic'in API'sine gider ve yedeğe varsayılan olarak eklenmez.
        </p>
        <label className="field">
          <span>API anahtarı</span>
          <input
            type={reveal ? 'text' : 'password'}
            autoComplete="off"
            spellCheck={false}
            placeholder="sk-ant-…"
            value={keyDraft ?? s.apiKey}
            onChange={(e) => setKeyDraft(e.target.value)}
          />
        </label>
        <div className="row">
          <button className="btn small ghost" onClick={() => setReveal(!reveal)}>{reveal ? 'Gizle' : 'Göster'}</button>
          {keyDraft !== null && keyDraft !== s.apiKey && <button className="btn small primary" onClick={saveKey}>Kaydet</button>}
          {s.apiKey && keyDraft === null && (
            <button className="btn small" disabled={testing} onClick={test}>{testing ? 'Deneniyor…' : 'Bağlantıyı dene'}</button>
          )}
          {s.apiKey && keyDraft === null && (
            <button className="btn small ghost" onClick={() => updateSettings({ apiKey: '' })}>Anahtarı sil</button>
          )}
        </div>
        <label className="field" style={{ marginTop: 16 }}>
          <span>Model</span>
          <select value={custom ? '__custom' : s.model} onChange={(e) => updateSettings({ model: e.target.value === '__custom' ? '' : e.target.value })}>
            {MODEL_OPTIONS.map((m) => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))}
            <option value="__custom">Başka bir model adı…</option>
          </select>
        </label>
        {custom && (
          <label className="field">
            <span>Model adı</span>
            <input type="text" spellCheck={false} value={s.model} placeholder="claude-…" onChange={(e) => updateSettings({ model: e.target.value.trim() })} />
          </label>
        )}
        <label className="row small" style={{ marginTop: 6, alignItems: 'flex-start' }}>
          <input type="checkbox" checked={s.askBeforeSend} onChange={(e) => updateSettings({ askBeforeSend: e.target.checked })} style={{ width: 20, height: 20, flex: 'none' }} />
          <span>
            Göndermeden önce sor. Açıkken her yazı gönderilmeden önce sana gösterilir ve onayın istenir; bekleyen yazılar
            internet gelince kendiliğinden gönderilmez, Yazılarım'dan elle gönderirsin.
          </span>
        </label>
      </details>

      <div className="card">
        <h3>Başlangıç noktası</h3>
        <p className="small muted">
          Uygulama hangi dersi önereceğine karar verirken ilk günkü seviye tespitinden yola çıktı; sen çalıştıkça bu tahmin
          kendiliğinden değişiyor ve sana sayı olarak gösterilmiyor. Tespit sana uymadıysa yeniden yapabilirsin; ders
          ilerlemen ve yazıların olduğu gibi kalır.
        </p>
        <button className="btn small" onClick={() => go('/placement')}>Seviye tespitini yeniden yap</button>
      </div>

      <div className="card">
        <h3>Yedek</h3>
        <p className="small muted">
          Tüm veri (beceri profili, alıştırma yazıları, Masa'daki taslaklar ve sürümleri, Yol Defteri, Günce) tek bir JSON
          dosyasına yazılır. Telefon değiştirirsen ya da bozulursa bu dosyayla geri yüklersin; telefon ile bilgisayar
          arasında taşımak için de kullanabilirsin. Arada bir indirip buluta ya da bilgisayarına koymanı öneririm.
        </p>
        <label className="row small" style={{ margin: '6px 0 12px' }}>
          <input type="checkbox" checked={withKey} onChange={(e) => setWithKey(e.target.checked)} style={{ width: 20, height: 20 }} />
          API anahtarını da yedeğe ekle
        </label>
        <div className="row">
          <button className="btn primary grow" onClick={() => downloadBackup(withKey)}>Dışa aktar</button>
          <button className="btn grow" onClick={() => fileRef.current?.click()}>İçe aktar</button>
        </div>
        {s.lastBackupAt && (
          <div className="tiny faint" style={{ marginTop: 8 }}>Son yedek: {formatDate(s.lastBackupAt)}</div>
        )}
        {pending && <ImportPreview file={pending} onMerge={doMerge} onReplace={doReplace} onCancel={() => setPending(null)} />}
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void onPick(f);
            e.target.value = '';
          }}
        />
      </div>

      <div className="card soft">
        <h3>Baştan başla</h3>
        <p className="small muted">Bütün veriyi bu cihazdan siler ve karşılama ekranına döner. Önce yedek almayı unutma.</p>
        <button
          className="btn small ghost"
          style={{ color: 'var(--warn)', borderColor: 'var(--warn)' }}
          onClick={async () => {
            if (!window.confirm('Tüm veri silinsin mi? Bu geri alınamaz.')) return;
            if (!window.confirm('Emin misin? Yedeğin yoksa her şey kaybolur.')) return;
            await wipeAll();
            go('/today');
          }}
        >
          Tüm veriyi sil
        </button>
      </div>

      <p className="tiny faint center" style={{ marginTop: 20 }}>Rüzgârla Dans · sürüm {__APP_VERSION__} · veriler yalnızca bu cihazda</p>
      {toast}
    </div>
  );
}

function ImportPreview({
  file,
  onMerge,
  onReplace,
  onCancel,
}: {
  file: BackupFile;
  onMerge: () => void;
  onReplace: () => void;
  onCancel: () => void;
}) {
  const p = previewBackup(file);
  return (
    <div className="card soft rise" style={{ marginTop: 14 }}>
      <div className="eyebrow">Yedek dosyası</div>
      <p className="small" style={{ marginBottom: 6 }}>
        {p.exportedAt ? <>{formatDate(p.exportedAt, { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })} tarihli. </> : null}
        İçinde: {describeCounts(p.counts)}.
      </p>
      {p.version === 1 && <p className="tiny faint">Uygulamanın önceki sürümüyle alınmış; bugünkü yapıya uyarlanarak yüklenir.</p>}
      <p className="tiny muted">
        <strong>Birleştir:</strong> Bu cihazdaki her şey kalır; yedekte olup burada olmayanlar eklenir. Telefon ile bilgisayar
        arasında taşırken bunu seç.
        <br />
        <strong>Yerine koy:</strong> Bu cihazdaki bütün veri silinir, yerine yedek gelir. Yeni ya da sıfırlanmış bir cihaz için.
      </p>
      <div className="row" style={{ marginTop: 10 }}>
        <button className="btn small primary grow" onClick={onMerge}>Birleştir</button>
        <button className="btn small grow" onClick={onReplace}>Yerine koy</button>
        <button className="btn small ghost" onClick={onCancel}>Vazgeç</button>
      </div>
    </div>
  );
}
