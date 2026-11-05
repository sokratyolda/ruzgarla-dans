/** Beceri seçici: dallara göre gruplu açılır liste + seçilenler çip olarak (dokununca çıkar). */
import { BRANCHES, skillById } from '../content';

export default function SkillPicker({
  value,
  onChange,
  label = 'Beceriler',
}: {
  value: string[];
  onChange: (v: string[]) => void;
  label?: string;
}) {
  return (
    <div className="field">
      <span className="small muted" style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>{label}</span>
      {value.length > 0 && (
        <div className="chips" style={{ marginBottom: 8 }}>
          {value.map((id) => (
            <button
              key={id}
              type="button"
              className="chip compact on"
              aria-label={`${skillById.get(id)?.name ?? id} becerisini çıkar`}
              onClick={() => onChange(value.filter((x) => x !== id))}
            >
              {skillById.get(id)?.name ?? id} ×
            </button>
          ))}
        </div>
      )}
      <select
        value=""
        aria-label={`${label}: ekle`}
        onChange={(e) => {
          const id = e.target.value;
          if (id && !value.includes(id)) onChange([...value, id]);
        }}
      >
        <option value="">Beceri ekle…</option>
        {BRANCHES.map((b) => (
          <optgroup key={b.id} label={b.title}>
            {b.skills
              .filter((s) => !value.includes(s.id))
              .map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
          </optgroup>
        ))}
      </select>
    </div>
  );
}
