/**
 * İlk açılış: kısa karşılama + başlangıç profili seçimi + (isteğe bağlı) mini seviye tespiti.
 */
import { useState } from 'react';
import { updateSettings } from '../db/db';
import { MUHAMMED_PROFILE, applyProfileUpdate, placementToProfile, seedProfile } from '../engine/profile';
import { placementQuestions, placementRubric, placementWritePrompt } from '../content/placement';
import { refreshUnlocks } from '../engine/unlock';
import { go } from '../lib/router';
import { wordCount } from '../lib/tr';

type Step = 'hello' | 'name' | 'start' | 'quiz' | 'write' | 'self' | 'goal';

/**
 * İlk açılış. `redo`: Ayarlar'dan "seviye tespitini yeniden yap" ile açılır; yalnızca başlangıç
 * noktasını günceller (ilerleme ve yazılar kalır), ad ve haftalık hedef adımlarını atlar.
 */
export default function Welcome({ redo = false }: { redo?: boolean }) {
  const [step, setStep] = useState<Step>(redo ? 'start' : 'hello');
  const [name, setName] = useState('');
  // Yeniden tespit uygulamanın içinde açılır; dış kabuk (app) zaten var
  const shell = redo ? 'fade' : 'app no-nav fade';
  const [profile, setProfile] = useState<Record<string, number> | null>(null);
  const [qi, setQi] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [correct, setCorrect] = useState<boolean[]>([]);
  const [text, setText] = useState('');
  const [self, setSelf] = useState<number[]>([]);
  const [goal, setGoal] = useState(4);

  const finish = async (p = profile) => {
    if (redo) {
      await applyProfileUpdate(p ?? {});
      go('/settings');
      return;
    }
    await seedProfile(p ?? {});
    await refreshUnlocks();
    await updateSettings({ onboarded: true, weeklyGoal: goal, name: name.trim() });
    go('/today');
  };

  // Tespit yeniden yapılıyorsa profil seçilince hemen uygula (hedef adımı yok)
  const chose = (p: Record<string, number>) => {
    setProfile(p);
    if (redo) void finish(p);
    else setStep('goal');
  };

  if (step === 'hello')
    return (
      <div className={shell} style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div className="eyebrow">Hoş geldin</div>
          <h1 style={{ fontSize: '2.1rem' }}>Rüzgârla Dans</h1>
          <div className="prose muted">
            <p>
              Bu küçük defter, hikâye anlatmayı adım adım öğrenmen için. Her gün tek bir odak, on beş yirmi dakika, en
              fazla yedi adım. Gerisini sonraya bırakıyoruz.
            </p>
            <p>
              Adı bir seviye tespitinde yazılmış bir cümleden geliyor: ıslak bir çadır, güçlü bir rüzgâr ve sabırla
              toparlanmak. O cümlede imge vardı; eksik olan, rüzgârla dans etmeden önceki hâldi. Değişimi görünür kılmak,
              bu uygulamanın ilk derdi.
            </p>
          </div>
        </div>
        <button className="btn primary block" onClick={() => setStep('name')}>Başlayalım</button>
      </div>
    );

  if (step === 'name')
    return (
      <div className={shell}>
        <div className="eyebrow">Tanışalım</div>
        <h2>Sana nasıl seslenelim?</h2>
        <p className="muted small">İsteğe bağlı. Yalnızca selamlamada kullanılır ve bu cihazda kalır; Ayarlar'dan değiştirebilirsin.</p>
        <label className="field">
          <span>Adın</span>
          <input type="text" lang="tr" value={name} autoFocus onChange={(e) => setName(e.target.value)} autoComplete="given-name" />
        </label>
        <div className="bottom-spacer" />
        <div className="bottom-bar">
          <div className="inner">
            <button className="btn ghost" onClick={() => { setName(''); setStep('start'); }}>Geç</button>
            <button className="btn primary" onClick={() => setStep('start')}>Devam</button>
          </div>
        </div>
      </div>
    );

  if (step === 'start')
    return (
      <div className={shell}>
        {redo && (
          <button className="linkish small" onClick={() => go('/settings')} style={{ marginBottom: 8 }}>← Ayarlar</button>
        )}
        <div className="eyebrow">Başlangıç noktası</div>
        <h2>{redo ? 'Başlangıç noktanı yeniden belirle' : 'Nereden başlayalım?'}</h2>
        <p className="muted">
          Uygulama, hangi dersi önereceğine karar verirken bu ilk tahminden yola çıkar; sen çalıştıkça tahmin kendiliğinden
          değişir. {redo ? 'Ders ilerlemen ve yazıların olduğu gibi kalır.' : ''}
        </p>
        <div className="options">
          <button className="option" onClick={() => chose(MUHAMMED_PROFILE)}>
            <strong>Öğretmenle yaptığım tespiti kullan</strong>
            <div className="small muted" style={{ marginTop: 4 }}>
              Bu seçenek, uygulama hazırlanırken paylaşılan bir seviye tespitine dayanır: bir yolculuk anını istek–engel–değişim
              yapısıyla anlatan iki cümle. Tespitin sonucu: yapı sezgisel olarak biliniyor, imge güçlü; en çok çalışılacak
              yer, değişimden önceki hâli göstermek. Sana uymuyorsa kısa tespiti seç.
            </div>
          </button>
          <button className="option" onClick={() => setStep('quiz')}>
            <strong>Kısa bir tespit yap</strong>
            <div className="small muted" style={{ marginTop: 4 }}>Üç soru ve iki üç cümlelik bir yazı. Beş dakika.</div>
          </button>
          <button className="option" onClick={() => chose({})}>
            <strong>Sıfırdan başla</strong>
            <div className="small muted" style={{ marginTop: 4 }}>Her şeyi ilk dersten, sırasıyla.</div>
          </button>
        </div>
      </div>
    );

  if (step === 'quiz') {
    const q = placementQuestions[qi];
    const answered = picked !== null;
    return (
      <div className={shell} key={qi}>
        <div className="progress" style={{ marginBottom: 22 }}>
          <div style={{ width: `${((qi + (answered ? 1 : 0)) / 4) * 100}%` }} />
        </div>
        <div className="eyebrow">Tespit · {qi + 1}/3</div>
        <h3>{q.prompt}</h3>
        {q.passage && <div className="quote">{q.passage}</div>}
        <div className="options">
          {q.options.map((o, i) => (
            <button
              key={i}
              className={`option ${answered ? (i === q.correct ? 'correct' : i === picked ? 'wrong' : '') : ''}`}
              disabled={answered}
              onClick={() => {
                setPicked(i);
                setCorrect((c) => [...c, i === q.correct]);
              }}
            >
              {o}
            </button>
          ))}
        </div>
        {answered && <div className="explain soft card small">{q.explanation}</div>}
        <div className="bottom-spacer" />
        <div className="bottom-bar">
          <div className="inner">
            <button
              className="btn primary"
              disabled={!answered}
              onClick={() => {
                setPicked(null);
                if (qi < 2) setQi(qi + 1);
                else setStep('write');
              }}
            >
              Devam
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'write')
    return (
      <div className={shell}>
        <div className="progress" style={{ marginBottom: 22 }}>
          <div style={{ width: '75%' }} />
        </div>
        <div className="eyebrow">Tespit · küçük bir yazı</div>
        <p className="prose">{placementWritePrompt}</p>
        <textarea
          lang="tr"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Sabah uyandığımda…"
          autoFocus
        />
        <div className="faint tiny" style={{ marginTop: 6 }}>{wordCount(text)} kelime</div>
        <div className="bottom-spacer" />
        <div className="bottom-bar">
          <div className="inner">
            <button className="btn primary" disabled={wordCount(text) < 8} onClick={() => setStep('self')}>
              Yazdım
            </button>
          </div>
        </div>
      </div>
    );

  if (step === 'self')
    return (
      <div className={shell}>
        <div className="eyebrow">Kendine dürüstçe bak</div>
        <div className="quote">{text}</div>
        <p className="small muted">Henüz değerlendirme anahtarı yok; bu ilk tespiti sen yapıyorsun. Doğru cevap yok, sadece başlangıç noktası.</p>
        <div className="card soft">
          {placementRubric.map((r, i) => (
            <div className="rubric-row" key={i}>
              <div>{r.criterion}</div>
              <div className="seg">
                {['Henüz değil', 'Kısmen', 'Evet'].map((l, v) => (
                  <button
                    key={v}
                    className={self[i] === v ? 'on' : ''}
                    onClick={() => setSelf((s) => {
                      const n = [...s];
                      n[i] = v;
                      return n;
                    })}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="bottom-spacer" />
        <div className="bottom-bar">
          <div className="inner">
            <button
              className="btn primary"
              disabled={placementRubric.some((_, i) => self[i] == null)}
              onClick={() => chose(placementToProfile(correct, self))}
            >
              Devam
            </button>
          </div>
        </div>
      </div>
    );

  // goal
  return (
    <div className={shell}>
      <div className="eyebrow">Ritim</div>
      <h2>Haftada kaç gün?</h2>
      <p className="muted">
        Yolda internetsiz, yorgun günlerin olacak. Bu yüzden günlük değil haftalık bir hedef koyuyoruz. Kaçırılan bir gün
        hiçbir şeyi bozmaz.
      </p>
      <div className="chips" style={{ margin: '18px 0' }}>
        {[2, 3, 4, 5, 6, 7].map((n) => (
          <button key={n} className={`chip ${goal === n ? 'on' : ''}`} onClick={() => setGoal(n)} style={{ minWidth: 56 }}>
            {n} gün
          </button>
        ))}
      </div>
      <p className="small faint">Bunu sonra Ayarlar'dan değiştirebilirsin.</p>
      <div className="bottom-spacer" />
      <div className="bottom-bar">
        <div className="inner">
          <button className="btn primary" onClick={() => finish()}>Yola çık</button>
        </div>
      </div>
    </div>
  );
}
