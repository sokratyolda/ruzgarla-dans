import { useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, defaultSettings } from './db/db';
import { useRoute } from './lib/router';
import { Icon } from './components/ui';
import Welcome from './screens/Welcome';
import Today from './screens/Today';
import PathScreen from './screens/Path';
import Gaps from './screens/Gaps';
import RoadNotes from './screens/RoadNotes';
import More from './screens/More';
import Journal from './screens/Journal';
import Writings from './screens/Writings';
import SettingsScreen from './screens/Settings';
import Session from './screens/Session';
import RewriteLater from './screens/RewriteLater';

const TABS = [
  { path: '/today', label: 'Bugün', icon: Icon.today },
  { path: '/path', label: 'Yol', icon: Icon.path },
  { path: '/gaps', label: 'Eksiklerim', icon: Icon.gaps },
  { path: '/notes', label: 'Yol Defteri', icon: Icon.notes },
  { path: '/more', label: 'Daha', icon: Icon.more },
];

export default function App() {
  // İlk açılışta kayıt yoktur: null döndür ki "yükleniyor" (undefined) ile karışmasın.
  const settings = useLiveQuery(async () => (await db.settings.get('main')) ?? null, []);
  const route = useRoute();

  // Tema ve yazı boyutu
  useEffect(() => {
    const s = settings ?? defaultSettings();
    document.documentElement.dataset.theme = s.theme;
    document.documentElement.style.setProperty('--scale', String(s.textScale || 1));
    const meta = document.querySelector('meta[name="theme-color"]');
    meta?.setAttribute('content', s.theme === 'light' ? '#f4ecdf' : '#14110f');
  }, [settings]);

  if (settings === undefined) {
    // İlk kurulumda kısa bir an: veritabanı açılıyor
    return <div className="app no-nav" />;
  }
  if (!settings?.onboarded) return <Welcome />;

  const top = '/' + (route.parts[0] ?? 'today');
  const inSession = top === '/session' || top === '/rewrite';

  let screen;
  switch (top) {
    case '/path': screen = <PathScreen />; break;
    case '/gaps': screen = <Gaps />; break;
    case '/notes': screen = <RoadNotes />; break;
    case '/more': screen = <More />; break;
    case '/journal': screen = <Journal />; break;
    case '/writings': screen = <Writings />; break;
    case '/settings': screen = <SettingsScreen />; break;
    case '/session': screen = <Session key={route.query.toString()} query={route.query} />; break;
    case '/rewrite': screen = <RewriteLater attemptId={Number(route.parts[1])} />; break;
    default: screen = <Today />;
  }

  const activeTab = ['/journal', '/writings', '/settings'].includes(top) ? '/more' : top;

  return (
    <>
      <main className={`app ${inSession ? 'no-nav' : ''}`}>{screen}</main>
      {!inSession && (
        <nav className="nav" aria-label="Ana gezinme">
          <div className="inner">
            {TABS.map((t) => (
              <a key={t.path} href={'#' + t.path} className={activeTab === t.path ? 'active' : ''}>
                <t.icon />
                {t.label}
              </a>
            ))}
          </div>
        </nav>
      )}
    </>
  );
}
