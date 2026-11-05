import { useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, defaultSettings } from './db/db';
import { useRoute } from './lib/router';
import { Icon } from './components/ui';
import Welcome from './screens/Welcome';
import Today from './screens/Today';
import MyPath from './screens/MyPath';
import Workshop from './screens/Workshop';
import Library from './screens/Library';
import SourceView from './screens/SourceView';
import Desk from './screens/Desk';
import DraftEditor from './screens/DraftEditor';
import ProjectView from './screens/ProjectView';
import SettingsScreen from './screens/Settings';
import Session from './screens/Session';
import RewriteLater from './screens/RewriteLater';
import ErrorBoundary from './components/ErrorBoundary';

/**
 * Beş ana bölüm:
 *  Bugün · Yolum (yol, gelişim, günce) · Atölyem (alıştırmalar, serbest yazma, yazılarım)
 *  · Kütüphanem (kaynaklar, kavramlar, alıntılar) · Eserlerim (taslaklar, projeler, Yol Defteri)
 * Ayarlar Bugün ekranının sağ üstündeki simgeden açılır.
 */
const TABS = [
  { path: '/today', label: 'Bugün', icon: Icon.today },
  { path: '/path', label: 'Yolum', icon: Icon.path },
  { path: '/workshop', label: 'Atölyem', icon: Icon.workshop },
  { path: '/library', label: 'Kütüphanem', icon: Icon.library },
  { path: '/desk', label: 'Eserlerim', icon: Icon.desk },
];

/** Eski bağlantılar yeni yerlerine düşer */
const withTab = (t: string, q: URLSearchParams) => new URLSearchParams({ ...Object.fromEntries(q), t });

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
  const inSession = ['/session', '/rewrite', '/draft', '/placement'].includes(top);

  let screen;
  switch (top) {
    case '/path': screen = <MyPath query={route.query} />; break;
    case '/gaps': screen = <MyPath query={withTab('gelisim', route.query)} />; break;
    case '/journal': screen = <MyPath query={withTab('gunce', route.query)} />; break;
    case '/workshop': screen = <Workshop query={route.query} />; break;
    case '/writings': screen = <Workshop query={withTab('yazilarim', route.query)} />; break;
    case '/library': screen = <Library query={route.query} />; break;
    case '/source': screen = <SourceView id={Number(route.parts[1])} />; break;
    case '/desk': screen = <Desk query={route.query} />; break;
    case '/notes': screen = <Desk query={withTab('notlar', route.query)} />; break;
    case '/draft': screen = <DraftEditor id={route.parts[1] ?? ''} />; break;
    case '/project': screen = <ProjectView id={route.parts[1] ?? ''} />; break;
    case '/settings': screen = <SettingsScreen />; break;
    case '/placement': screen = <Welcome redo />; break;
    case '/session': screen = <Session key={route.query.toString()} query={route.query} />; break;
    case '/rewrite': screen = <RewriteLater attemptId={Number(route.parts[1])} />; break;
    default: screen = <Today />;
  }

  const SECTION: Record<string, string> = {
    '/gaps': '/path',
    '/journal': '/path',
    '/writings': '/workshop',
    '/source': '/library',
    '/notes': '/desk',
    '/draft': '/desk',
    '/project': '/desk',
    '/settings': '/today',
  };
  const activeTab = SECTION[top] ?? top;

  return (
    <>
      <main className={`app ${inSession ? 'no-nav' : ''} ${top === '/draft' ? 'wide' : ''}`}>
        <ErrorBoundary resetKey={top + route.parts.join('/')}>{screen}</ErrorBoundary>
      </main>
      {!inSession && (
        <nav className="nav" aria-label="Ana gezinme">
          <div className="inner">
            {TABS.map((t) => (
              <a key={t.path} href={'#' + t.path} className={activeTab === t.path ? 'active' : ''} aria-current={activeTab === t.path ? 'page' : undefined}>
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
