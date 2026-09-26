import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { isEnvBrowser } from './lib/nui';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

if (import.meta.env.DEV && isEnvBrowser()) {
  document.body.classList.add('is-browser');
  void import('./dev/mock').then(({ openMock }) => openMock());
}
