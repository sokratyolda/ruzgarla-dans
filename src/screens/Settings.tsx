import { useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, defaultSettings, updateSettings } from '../db/db';
import { MODEL_OPTIONS, explainError, testConnection } from '../ai/claude';
import { processQueue } from '../ai/queue';
import { downloadBackup, importData, wipeAll } from '../lib/backup';
import { TopBar, useToast } from '../components/ui';
import { go } from '../lib/router';

export default function SettingsScreen() {
  const s = useLiveQuery(() => db.settings.get('main'), []) ?? defaultSettings();
  const [toast, show] = useToast();
  const [keyDraft, setKeyDraft] = useState<string | null>(null);
  const [reveal, setReveal] = useState(false);
  const [testing, setTesting] = useState(false);
  const [withKey, setWithKey] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const custom = !MODEL_OPTIONS.some((m) => m.id === s.model);

  const saveKey = async () => {
    await updateSettings({ apiKey: (keyDraft ?? '').trim() });
    setKeyDraft(null);
    show('Anahtar bu cihaza kaydedildi.');
    void processQueue();
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

  const onImport = async (f: File) => {
    if (!window.confirm('Yedek geri yüklensin mi? Bu cihazdaki mevcut verinin YERİNE geçer.')) return;
    try {
      const { counts } = await importData(await f.text());
      show(`Geri yüklendi: ${counts.attempts ?? 0} deneme, ${counts.notes ?? 0} not, ${counts.journal ?? 0} günce.`);
    } catch (e) {
      show(e instanceof Error ? e.message : 'Dosya okunamadı.');
    }
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
        <h3>Claude ile değerlendirme</h3>
        <p className="small muted">
          Yazdıklarını gerçekten okuyup değerlendirmesi için kendi Anthropic API anahtarını gir. Anahtar yalnızca bu cihazda
          saklanır ve yalnızca Anthropic'in API'sine gönderilir. Yedeğe varsayılan olarak dâhil edilmez.
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
      </div>

      <div className="card">
        <h3>Yedek</h3>
        <p className="small muted">
          Tüm veri (beceri profili, yazılar, Yol Defteri, Günce) tek bir JSON dosyasına yazılır. Telefon değiştirirsen ya da
          bozulursa bu dosyayla geri yüklersin. Arada bir indirip buluta ya da bilgisayarına koymanı öneririm.
        </p>
        <label className="row small" style={{ margin: '6px 0 12px' }}>
          <input type="checkbox" checked={withKey} onChange={(e) => setWithKey(e.target.checked)} style={{ width: 20, height: 20 }} />
          API anahtarını da yedeğe ekle
        </label>
        <div className="row">
          <button className="btn primary grow" onClick={() => downloadBackup(withKey)}>Dışa aktar</button>
          <button className="btn grow" onClick={() => fileRef.current?.click()}>İçe aktar</button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void onImport(f);
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
