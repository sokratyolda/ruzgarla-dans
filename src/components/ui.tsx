import { useEffect, useState, type ReactNode } from 'react';
import { back } from '../lib/router';

/* ——— Sade çizgi ikonlar ——— */
const P = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;
export const Icon = {
  today: () => (
    <svg viewBox="0 0 24 24" {...P}><path d="M12 3c-3 4-5 6.5-5 9.5a5 5 0 0 0 10 0C17 9.5 15 7 12 3z" /><path d="M12 13c-1 1.3-1.6 2.2-1.6 3.2a1.6 1.6 0 0 0 3.2 0c0-1-.6-1.9-1.6-3.2z" /></svg>
  ),
  path: () => (
    <svg viewBox="0 0 24 24" {...P}><path d="M6 21c0-4 12-4 12-8s-12-4-12-8" /><circle cx="6" cy="5" r="1.4" /><circle cx="18" cy="13" r="1.4" /></svg>
  ),
  gaps: () => (
    <svg viewBox="0 0 24 24" {...P}><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></svg>
  ),
  notes: () => (
    <svg viewBox="0 0 24 24" {...P}><path d="M6 3h10l3 3v15H6z" /><path d="M9 9h7M9 13h7M9 17h4" /></svg>
  ),
  more: () => (
    <svg viewBox="0 0 24 24" {...P}><circle cx="5" cy="12" r="1.2" /><circle cx="12" cy="12" r="1.2" /><circle cx="19" cy="12" r="1.2" /></svg>
  ),
  back: () => (
    <svg viewBox="0 0 24 24" {...P}><path d="M15 5l-7 7 7 7" /></svg>
  ),
  close: () => (
    <svg viewBox="0 0 24 24" {...P}><path d="M6 6l12 12M18 6L6 18" /></svg>
  ),
  chev: () => (
    <svg viewBox="0 0 24 24" width="18" height="18" {...P}><path d="M9 5l7 7-7 7" /></svg>
  ),
  lock: () => (
    <svg viewBox="0 0 24 24" width="16" height="16" {...P}><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
  ),
  copy: () => (
    <svg viewBox="0 0 24 24" width="18" height="18" {...P}><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" /></svg>
  ),
};

export function TopBar({ title, onBack, right }: { title?: ReactNode; onBack?: (() => void) | false; right?: ReactNode }) {
  return (
    <div className="topbar">
      {onBack !== false && (
        <button className="icon-btn" aria-label="Geri" onClick={onBack ?? (() => back())}>
          <Icon.back />
        </button>
      )}
      <div className="grow" style={{ fontFamily: 'var(--serif)', fontSize: '1.15rem' }}>{title}</div>
      {right}
    </div>
  );
}

export function SkillBar({ value, label, sub }: { value: number; label: ReactNode; sub?: ReactNode }) {
  const cls = value < 40 ? 'weak' : value >= 70 ? 'strong' : '';
  return (
    <div style={{ margin: '12px 0' }}>
      <div className="row between small" style={{ marginBottom: 6 }}>
        <span>{label}</span>
        <span className="faint tiny">{Math.round(value)}</span>
      </div>
      <div className={`bar ${cls}`}>
        <div style={{ width: `${Math.max(2, value)}%` }} />
      </div>
      {sub && <div className="faint tiny" style={{ marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

/** Kısa süreli bildirim */
export function useToast() {
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 2600);
    return () => clearTimeout(t);
  }, [msg]);
  const node = msg ? <div className="toast" role="status">{msg}</div> : null;
  return [node, setMsg] as const;
}

/** Panoya kopyala (eski tarayıcılar için yedek yöntemle) */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  }
}

export function useOnline() {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);
  return online;
}

/** Metni paragraflara bölüp serif olarak gösterir */
export function Prose({ text, className = '' }: { text: string | string[]; className?: string }) {
  const paras = Array.isArray(text) ? text : text.split(/\n{2,}/);
  return (
    <div className={`prose ${className}`}>
      {paras.map((p, i) => (
        <p key={i} style={{ whiteSpace: 'pre-wrap' }}>{p}</p>
      ))}
    </div>
  );
}
