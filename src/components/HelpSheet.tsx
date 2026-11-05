/**
 * Yardım Al: kullanıcının kontrolünde, uygulama dışı yardım.
 * 1) Ne istediğini seç → 2) hazırlanan istemi gör ve istersen düzenle → 3) kopyala ya da paylaş.
 * Uygulama hiçbir şeyi kendiliğinden göndermez.
 */
import { useEffect, useState } from 'react';
import { HELP_MODES, buildHelpPrompt, type HelpContext, type HelpMode } from '../ai/help';
import { copyText, Icon, useToast } from './ui';

export function HelpButton({ context, modes, label = 'Yardım al', className = 'btn ghost small' }: { context: HelpContext; modes?: HelpMode[]; label?: string; className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)} aria-haspopup="dialog">
        <Icon.help /> {label}
      </button>
      {open && <HelpSheet context={context} modes={modes} onClose={() => setOpen(false)} />}
    </>
  );
}

export default function HelpSheet({ context, modes, onClose }: { context: HelpContext; modes?: HelpMode[]; onClose: () => void }) {
  const available = HELP_MODES.filter((m) => (!modes || modes.includes(m.id)) && (m.id !== 'degerlendir' || !!context.text?.trim()));
  const [mode, setMode] = useState<HelpMode | null>(available.length === 1 ? available[0].id : null);
  const [prompt, setPrompt] = useState('');
  const [toast, show] = useToast();
  const canShare = typeof navigator !== 'undefined' && 'share' in navigator;

  useEffect(() => {
    if (mode) setPrompt(buildHelpPrompt(mode, context));
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Esc ile kapat
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const copy = async () => show((await copyText(prompt)) ? 'Kopyalandı. İstediğin araca yapıştırabilirsin.' : 'Kopyalanamadı.');
  const share = async () => {
    try {
      await navigator.share({ text: prompt });
    } catch {
      /* kullanıcı vazgeçti */
    }
  };

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet rise" role="dialog" aria-modal="true" aria-label="Yardım al" onClick={(e) => e.stopPropagation()}>
        <div className="row between">
          <div className="eyebrow" style={{ margin: 0 }}>Yardım al</div>
          <button className="icon-btn" aria-label="Kapat" onClick={onClose}>
            <Icon.close />
          </button>
        </div>
        {!mode ? (
          <>
            <p className="small muted">
              Uygulama hiçbir şey göndermez. Senin için bir soru taslağı hazırlar; görür, istersen düzenler, sonra kendi
              seçtiğin araca (ChatGPT, Claude, başka bir yapay zekâ ya da bir öğretmen) taşırsın.
            </p>
            <div className="options">
              {available.map((m) => (
                <button key={m.id} className="option" onClick={() => setMode(m.id)}>
                  <strong>{m.label}</strong>
                  <div className="small muted" style={{ marginTop: 4 }}>{m.desc}</div>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            {available.length > 1 && (
              <button className="linkish small" onClick={() => setMode(null)}>← Başka bir şey iste</button>
            )}
            <p className="tiny muted" style={{ margin: '6px 0' }}>
              Gönderilecek metnin tamamı aşağıda. Paylaşmak istemediğin bir şey varsa sil.
            </p>
            <textarea lang="tr" className="sheet-text" value={prompt} onChange={(e) => setPrompt(e.target.value)} aria-label="Hazırlanan soru" />
            <div className="row" style={{ marginTop: 10 }}>
              <button className="btn primary grow" onClick={copy}>
                <Icon.copy /> Kopyala
              </button>
              {canShare && (
                <button className="btn grow" onClick={share}>Paylaş…</button>
              )}
            </div>
          </>
        )}
        {toast}
      </div>
    </div>
  );
}
