'use client';

import { useCallback, useRef, useEffect } from 'react';
import {
  setFocusElement,
  showAlert,
  announceToScreenReader,
} from '@/lib/browser-compatibility';

/**
 * Hook para manejar focus de forma compatible con navegadores
 * Proporciona funciones para establecer focus en elementos de forma segura
 */
export function useSafeFocus() {
  const elementRef = useRef<HTMLElement | null>(null);

  const focus = useCallback(
    (element?: HTMLElement | null, options?: { preventScroll?: boolean }) => {
      const target = element || elementRef.current;
      return setFocusElement(target, options);
    },
    []
  );

  const focusById = useCallback((elementId: string, options?: { preventScroll?: boolean }) => {
    const element = document.getElementById(elementId);
    return setFocusElement(element, options);
  }, []);

  return {
    elementRef,
    focus,
    focusById,
  };
}

/**
 * Hook para manejar alertas y notificaciones de forma compatible
 * Proporciona funciones para mostrar mensajes a usuarios de forma accesible
 */
export function useAccessibleAlert() {
  const showNotification = useCallback(
    async (message: string, options?: { title?: string; type?: 'info' | 'error' | 'success' | 'warning' }) => {
      const title = options?.title || 'Notificación';

      try {
        // Si estamos en el navegador, anunciar a lectores de pantalla
        if (typeof document !== 'undefined') {
          const priority = options?.type === 'error' ? 'assertive' : 'polite';
          announceToScreenReader(message, priority);
        }

        // Mostrar alerta visual
        await showAlert(message, title);
      } catch (error) {
        console.error('Error showing notification:', error);
      }
    },
    []
  );

  const showError = useCallback(
    async (message: string, title: string = 'Error') => {
      await showNotification(message, { title, type: 'error' });
    },
    [showNotification]
  );

  const showSuccess = useCallback(
    async (message: string, title: string = 'Éxito') => {
      await showNotification(message, { title, type: 'success' });
    },
    [showNotification]
  );

  const showWarning = useCallback(
    async (message: string, title: string = 'Advertencia') => {
      await showNotification(message, { title, type: 'warning' });
    },
    [showNotification]
  );

  return {
    showNotification,
    showError,
    showSuccess,
    showWarning,
  };
}

/**
 * Hook para detectar capacidades del navegador
 * Útil para adaptar UI basado en soporte de APIs modernas
 */
export function useBrowserCapabilities() {
  const getCapabilities = useCallback(() => {
    return {
      hasClipboard: (() => {
        try {
          return !!(navigator.clipboard && window.isSecureContext);
        } catch {
          return false;
        }
      })(),
      hasLocalStorage: (() => {
        try {
          const test = '__test__';
          localStorage.setItem(test, test);
          localStorage.removeItem(test);
          return true;
        } catch {
          return false;
        }
      })(),
      hasFetch: typeof fetch !== 'undefined',
      hasIntersectionObserver: typeof IntersectionObserver !== 'undefined',
      hasResizeObserver: typeof ResizeObserver !== 'undefined',
      browserName: getBrowserName(),
      isLegacyBrowser: isLegacyBrowser(),
    };
  }, []);

  return getCapabilities();
}

/**
 * Detecta el navegador basado en User-Agent
 */
function getBrowserName(): string {
  if (typeof navigator === 'undefined') return 'unknown';

  const ua = navigator.userAgent;
  if (ua.includes('Chrome') && !ua.includes('Chromium')) return 'Chrome';
  if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Edge')) return 'Edge';
  if (ua.includes('Chromium')) return 'Chromium';
  if (ua.includes('MSIE') || ua.includes('Trident')) return 'IE';

  return 'unknown';
}

/**
 * Detecta si es un navegador legacy (IE, versiones muy viejas)
 */
function isLegacyBrowser(): boolean {
  const browserName = getBrowserName();
  return browserName === 'IE';
}
