import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

// PWAのインストールプロンプトを保存
let deferredPrompt: any;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  
  // インストールプロンプトが利用可能であることを示すUIを表示
  const installBanner = document.createElement('div');
  installBanner.id = 'pwa-install-banner';
  installBanner.className = 'fixed bottom-0 left-0 right-0 bg-blue-600 text-white p-4 flex justify-between items-center z-[9999]';
  installBanner.innerHTML = `
    <div class="flex-1">
      <p class="font-medium">ホーム画面に追加して、より快適に使用できます</p>
      <p class="text-sm opacity-90">オフラインでも使用可能になります</p>
    </div>
    <div class="flex gap-2">
      <button id="pwa-install-later" class="px-4 py-2 text-sm">後で</button>
      <button id="pwa-install-button" class="px-4 py-2 bg-white text-blue-600 rounded-lg text-sm font-medium">インストール</button>
    </div>
  `;

  document.body.appendChild(installBanner);

  // インストールボタンのイベントリスナー
  document.getElementById('pwa-install-button')?.addEventListener('click', async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to the install prompt: ${outcome}`);
      deferredPrompt = null;
      installBanner.remove();
    }
  });

  // 「後で」ボタンのイベントリスナー
  document.getElementById('pwa-install-later')?.addEventListener('click', () => {
    installBanner.remove();
  });
});

// Clean up old service workers completely
async function cleanupOldServiceWorkers() {
  if ('serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        console.log('Unregistering old service worker...');
        await registration.unregister();
      }

      // Clear all caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => {
            console.log('Deleting cache:', cacheName);
            return caches.delete(cacheName);
          })
        );
      }
    } catch (error) {
      console.error('Failed to cleanup old service workers:', error);
    }
  }
}

// Register service worker with auto-update and forced reload
if ('serviceWorker' in navigator) {
  // First cleanup old service workers
  cleanupOldServiceWorkers().then(() => {
    try {
      const updateSW = registerSW({
        immediate: true,
        onNeedRefresh() {
          console.log('New content available, updating...');
          // Immediately update and reload
          updateSW(true).then(() => {
            console.log('Update applied, reloading page...');
            window.location.reload();
          });
        },
        onOfflineReady() {
          console.log('アプリケーションがオフラインで利用可能になりました');
        },
        onRegistered(swUrl, r) {
          console.log('Service Worker registered:', swUrl);

          // Aggressive update checking
          if (r) {
            // Check immediately
            r.update().catch(err => console.error('Initial update check failed:', err));

            // Then check every 30 seconds
            setInterval(async () => {
              try {
                await r.update();
                console.log('Service Worker update check completed');
              } catch (err) {
                console.error('Service Worker update failed:', err);
              }
            }, 30 * 1000); // 30秒ごと
          }
        },
        onRegisterError(error) {
          console.error('Service Worker registration failed:', error);
        }
      });
    } catch (error) {
      console.error('Failed to register service worker:', error);
    }
  });
}

// Render app with error boundary
const rootElement = document.getElementById('root');
if (rootElement) {
  try {
    createRoot(rootElement).render(
      <StrictMode>
        <App />
      </StrictMode>
    );
  } catch (error) {
    console.error('Failed to render app:', error);
    rootElement.innerHTML = '<div style="padding: 20px; text-align: center;">アプリケーションの読み込みに失敗しました。ページを再読み込みしてください。</div>';
  }
} else {
  console.error('Root element not found');
}