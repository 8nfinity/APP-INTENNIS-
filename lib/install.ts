import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { notify } from './dialog';

// Instalação do webapp na tela inicial (PWA).
// Android/Chrome: o navegador dispara `beforeinstallprompt`, que guardamos para
// abrir o instalador quando a pessoa tocar em "Instalar".
// iPhone/Safari: não existe esse evento; mostramos o passo a passo.

type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

const isWeb = Platform.OS === 'web' && typeof window !== 'undefined';
let deferred: InstallPromptEvent | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

if (isWeb) {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e as InstallPromptEvent;
    emit();
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    emit();
  });
}

export function isStandalone() {
  if (!isWeb) return true; // app nativo: já é "instalado"
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return window.matchMedia?.('(display-mode: standalone)').matches || nav.standalone === true;
}

function isIOS() {
  return isWeb && /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

export async function installApp() {
  if (deferred) {
    const ev = deferred;
    deferred = null;
    await ev.prompt();
    await ev.userChoice.catch(() => null);
    emit();
    return;
  }
  notify(
    'Instalar o In Tennis',
    isIOS()
      ? 'No Safari, toque em Compartilhar (o quadrado com a seta para cima) e depois em "Adicionar à Tela de Início".'
      : 'No menu do navegador (⋮), toque em "Instalar app" ou "Adicionar à tela inicial".',
  );
}

export function useInstall() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const l = () => setTick((t) => t + 1);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  return { show: isWeb && !isStandalone(), canPrompt: !!deferred };
}
