import { useCallback, useEffect, useState } from 'react';

const STATIC_CACHE_PREFIX = 'cogniiq-app-shell';
let waitingRegistration: ServiceWorkerRegistration | null = null;

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

export function registerClientHubServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js').then((registration) => {
      if (registration.waiting) {
        waitingRegistration = registration;
        window.dispatchEvent(new Event('cogniiq-app-update-ready'));
      }

      registration.addEventListener('updatefound', () => {
        const installing = registration.installing;
        if (!installing) return;

        installing.addEventListener('statechange', () => {
          if (installing.state === 'installed' && navigator.serviceWorker.controller) {
            waitingRegistration = registration;
            window.dispatchEvent(new Event('cogniiq-app-update-ready'));
          }
        });
      });
    });
  });
}

export function usePwaInstallControls() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    const handleInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    const handleUpdateReady = () => setUpdateAvailable(true);

    window.addEventListener('beforeinstallprompt', handleInstallPrompt);
    window.addEventListener('cogniiq-app-update-ready', handleUpdateReady);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
      window.removeEventListener('cogniiq-app-update-ready', handleUpdateReady);
    };
  }, []);

  const installApp = useCallback(async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  }, [installPrompt]);

  const applyUpdate = useCallback(() => {
    waitingRegistration?.waiting?.postMessage({ type: 'SKIP_WAITING' });
    window.location.reload();
  }, []);

  return {
    canInstall: Boolean(installPrompt),
    updateAvailable,
    installApp,
    applyUpdate,
  };
}

export async function clearClientHubLocalState() {
  if (typeof window === 'undefined') return;

  Object.keys(window.localStorage)
    .filter((key) => key.startsWith('cogniiq-app-') || key.startsWith('cogniiq-client-hub-'))
    .forEach((key) => window.localStorage.removeItem(key));

  if ('caches' in window) {
    const keys = await window.caches.keys();
    await Promise.all(
      keys
        .filter((key) => key.startsWith(STATIC_CACHE_PREFIX))
        .map((key) => window.caches.delete(key))
    );
  }
}
