import React from 'react';
import ReactDOM from 'react-dom/client';
// Yazı tipleri pakete gömülür: çevrimdışı da aynı görünür. latin-ext alt kümesi Türkçe harfleri içerir.
import '@fontsource-variable/literata/wght.css';
import '@fontsource-variable/literata/wght-italic.css';
import '@fontsource-variable/inter/wght.css';
import './styles/global.css';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import { startQueueWatcher } from './ai/queue';

// Service worker: uygulamayı önbelleğe alır; yeni sürüm gelince sessizce günceller.
registerSW({ immediate: true });
startQueueWatcher();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
