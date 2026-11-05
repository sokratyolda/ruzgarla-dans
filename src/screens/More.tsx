import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';

export default function More() {
  const journal = useLiveQuery(() => db.journal.count(), []) ?? 0;
  const writings = useLiveQuery(async () => (await db.attempts.toArray()).filter((a) => typeof a.response !== 'number').length, []) ?? 0;
  const pending = useLiveQuery(() => db.attempts.where('pendingReview').equals(1).count(), []) ?? 0;
  return (
    <div className="fade">
      <div className="eyebrow">Daha</div>
      <h1>Defterler</h1>
      <a className="list-link" href="#/journal">
        <div>
          <div>Günce</div>
          <div className="small muted">Her oturumun sonunda kendi cümlelerinle · {journal} not</div>
        </div>
        <span className="chev">›</span>
      </a>
      <a className="list-link" href="#/writings">
        <div>
          <div>Yazılarım</div>
          <div className="small muted">
            İlk ve yeniden yazılmış hâller yan yana · {writings} metin{pending ? ` · ${pending} bekliyor` : ''}
          </div>
        </div>
        <span className="chev">›</span>
      </a>
      <a className="list-link" href="#/settings">
        <div>
          <div>Ayarlar ve yedek</div>
          <div className="small muted">Tema, haftalık hedef, Claude anahtarı, dışa/içe aktarma</div>
        </div>
        <span className="chev">›</span>
      </a>
    </div>
  );
}
