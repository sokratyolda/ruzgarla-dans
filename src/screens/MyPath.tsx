/** Yolum: Yol (dallar ve dersler) · Gelişim (kanıtlarla) · Günce */
import { go } from '../lib/router';
import PathBody from './Path';
import Progress from './Progress';
import Journal from './Journal';
import { Tabs } from '../components/ui';

type Tab = 'yol' | 'gelisim' | 'gunce';

export default function MyPath({ query }: { query: URLSearchParams }) {
  const t = query.get('t');
  const tab: Tab = t === 'gelisim' ? 'gelisim' : t === 'gunce' ? 'gunce' : 'yol';
  return (
    <div className="fade">
      <div className="eyebrow">Yolum</div>
      <h1>Yazarlık yolu</h1>
      <Tabs
        value={tab}
        onChange={(v) => go(v === 'yol' ? '/path' : `/path?t=${v}`)}
        items={[
          ['yol', 'Yol'],
          ['gelisim', 'Gelişim'],
          ['gunce', 'Günce'],
        ]}
      />
      {tab === 'yol' && <PathBody />}
      {tab === 'gelisim' && <Progress />}
      {tab === 'gunce' && <Journal embedded />}
    </div>
  );
}
