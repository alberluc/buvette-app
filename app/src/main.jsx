import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Lock landscape only on tablets (smallest dimension >= 600px); phones stay free
const _minDim = Math.min(screen.width, screen.height);
if (_minDim >= 600 && screen.orientation?.lock) {
  screen.orientation.lock('landscape').catch(() => {});
}

window.__pwaInstallEvent = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  window.__pwaInstallEvent = e;
  window.dispatchEvent(new Event('pwa-installable'));
});
window.addEventListener('appinstalled', () => {
  window.__pwaInstallEvent = null;
  window.dispatchEvent(new Event('pwa-installed'));
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
