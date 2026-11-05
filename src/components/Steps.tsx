/** Kavram kartı ve objektif alıştırmalar (çoktan seçmeli, ayırt et, eksik unsuru bul). */
import { useState } from 'react';
import type { ChoiceExercise, ConceptExercise, DiscernExercise, MissingExercise } from '../content/types';
import { recordObjective } from '../engine/record';
import { Prose } from './ui';

export function ConceptStep({ ex, onDone }: { ex: ConceptExercise; onDone: () => void }) {
  return (
    <div className="fade">
      <div className="eyebrow">Kavram</div>
      <h2>{ex.title}</h2>
      <Prose text={ex.body} />
      {ex.example && (
        <div className="card soft" style={{ marginTop: 6 }}>
          {ex.example.label && <div className="eyebrow">{ex.example.label}</div>}
          <div className="quote" style={{ marginTop: 4 }}>{ex.example.text}</div>
          {ex.example.note && <div className="small muted">{ex.example.note}</div>}
        </div>
      )}
      {ex.takeaway && (
        <p className="small" style={{ marginTop: 18, color: 'var(--ember)', fontWeight: 600 }}>
          {ex.takeaway}
        </p>
      )}
      <div className="bottom-spacer" />
      <div className="bottom-bar">
        <div className="inner">
          <button className="btn primary" onClick={onDone}>Anladım</button>
        </div>
      </div>
    </div>
  );
}

type Objective = ChoiceExercise | DiscernExercise | MissingExercise;

const EYEBROW: Record<Objective['type'], string> = {
  choice: 'Soru',
  discern: 'Ayırt et',
  missing: 'Eksik unsuru bul',
};

export function ObjectiveStep({ ex, sessionId, onDone }: { ex: Objective; sessionId?: number; onDone: () => void }) {
  const [picked, setPicked] = useState<number | null>(null);
  const answered = picked !== null;
  const right = picked === ex.correct;

  const choose = async (i: number) => {
    if (answered) return;
    setPicked(i);
    await recordObjective(ex, i, sessionId);
  };

  return (
    <div className="fade">
      <div className="eyebrow">{EYEBROW[ex.type]}</div>
      <h3 style={{ fontFamily: 'var(--sans)', fontWeight: 600, fontSize: '1.05rem' }}>{ex.prompt}</h3>

      {ex.type === 'choice' && ex.passage && <div className="quote">{ex.passage}</div>}
      {ex.type === 'missing' && <div className="quote">{ex.draft}</div>}
      {ex.type === 'discern' && (
        <>
          {ex.passages.map((p) => (
            <div key={p.label} style={{ marginBottom: 10 }}>
              <div className="eyebrow" style={{ marginBottom: 0 }}>{p.label}</div>
              <div className="quote" style={{ marginTop: 4 }}>{p.text}</div>
            </div>
          ))}
          <p style={{ fontWeight: 600 }}>{ex.question}</p>
        </>
      )}

      <div className="options">
        {ex.options.map((o, i) => (
          <button
            key={i}
            className={`option ${answered ? (i === ex.correct ? 'correct' : i === picked ? 'wrong' : '') : ''}`}
            disabled={answered}
            onClick={() => choose(i)}
          >
            {o}
          </button>
        ))}
      </div>

      {answered && (
        <div className={`explain ${right ? 'good' : 'bad'}`}>
          <div className="label">{right ? 'Doğru.' : 'Bu sefer değil. Bu soru yakında yeniden karşına çıkacak.'}</div>
          <div className="small">{ex.explanation}</div>
        </div>
      )}

      <div className="bottom-spacer" />
      <div className="bottom-bar">
        <div className="inner">
          <button className="btn primary" disabled={!answered} onClick={onDone}>Devam</button>
        </div>
      </div>
    </div>
  );
}
