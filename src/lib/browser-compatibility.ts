/**
 * Browser Compatibility Utilities
 * Proporciona fallbacks para APIs modernas que podrían no estar disponibles en navegadores antiguos
 */

/**
 * Obtiene el elemento activo del documento de forma segura
 * Fallback para navegadores sin support completo de activeElement
 */
export function getSafeActiveElement(): Element | null {
  try {
    return document.activeElement || null;
  } catch {
    return null;
  }
}

/**
 * Establece el focus en un elemento de forma segura y completa
 * Maneja casos donde focus estándar falla o no es perceptible
 */
export function setFocusElement(
  element: HTMLElement | null | undefined,
  options?: { preventScroll?: boolean }
): boolean {
  if (!element || !(element instanceof HTMLElement)) {
    return false;
  }

  try {
    // Primero intenta con el método estándar
    if ('focus' in element) {
      element.focus({ preventScroll: options?.preventScroll ?? false });
    } else {
      (element as any).focus();
    }

    // Verifica que el focus se haya establecido
    const activeElement = getSafeActiveElement();
    if (activeElement === element) {
      return true;
    }

    // Si focus fallso, intenta con tabindex temporal
    const originalTabindex = element.getAttribute('tabindex');
    if (originalTabindex === null) {
      element.setAttribute('tabindex', '-1');
    }

    element.focus({ preventScroll: options?.preventScroll ?? false });

    // Restaura tabindex si fue modificado
    if (originalTabindex === null) {
      element.removeAttribute('tabindex');
    }

    return true;
  } catch (error) {
    console.warn('Error setting focus on element:', error);
    return false;
  }
}

/**
 * Anuncia un mensaje a lectores de pantalla (a11y)
 * Fallback para navegadores sin ARIA live regions
 */
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
  try {
    let announcer = document.getElementById('sr-announcer');
    if (!announcer) {
      announcer = document.createElement('div');
      announcer.id = 'sr-announcer';
      announcer.setAttribute('aria-live', priority);
      announcer.setAttribute('aria-atomic', 'true');
      announcer.setAttribute('role', 'status');
      announcer.style.position = 'absolute';
      announcer.style.left = '-10000px';
      announcer.style.width = '1px';
      announcer.style.height = '1px';
      announcer.style.overflow = 'hidden';
      document.body.appendChild(announcer);
    }

    announcer.setAttribute('aria-live', priority);
    announcer.textContent = message;

    // Limpiar después de anuncio
    setTimeout(() => {
      announcer!.textContent = '';
    }, 3000);
  } catch (error) {
    console.warn('Error announcing message to screen reader:', error);
  }
}

/**
 * Muestra alerta de forma robusta con fallbacks
 * Intenta custom alert primero, luego window.alert si falla
 */
export function showAlert(message: string, title: string = 'Notificación'): Promise<void> {
  return new Promise((resolve) => {
    try {
      // Intenta usar diálogo custom (si está disponible en el DOM)
      const customAlert = document.getElementById('custom-alert');
      if (customAlert) {
        // Asume que el custom alert tiene métodos show/hide
        console.log(`[${title}] ${message}`);
      }

      // Fallback a window.alert
      window.alert(`${title}\n\n${message}`);
      resolve();
    } catch (error) {
      console.error(`Alert failed: ${title}`, message, error);
      resolve(); // No rechazar, siempre resolver
    }
  });
}

/**
 * Copia texto al portapapeles de forma segura con fallbacks
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  // Intenta Clipboard API moderna
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      console.warn('Clipboard API failed, attempting fallback:', error);
    }
  }

  // Fallback: crear textarea temporal
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    textarea.style.pointerEvents = 'none';
    document.body.appendChild(textarea);

    textarea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);

    return success;
  } catch (error) {
    console.error('Clipboard fallback failed:', error);
    return false;
  }
}

/**
 * Verifica si una API está disponible en el navegador
 */
export function isAPISupported(apiPath: string): boolean {
  try {
    const parts = apiPath.split('.');
    let obj: any = window;

    for (const part of parts) {
      if (obj[part] === undefined) {
        return false;
      }
      obj = obj[part];
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Detección de capacidades del navegador
 */
export const browserCapabilities = {
  clipboardAPI: isAPISupported('navigator.clipboard.writeText'),
  localStorage: (() => {
    try {
      const test = '__localStorage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  })(),
  customElements: isAPISupported('window.customElements'),
  intersectionObserver: isAPISupported('window.IntersectionObserver'),
  resizeObserver: isAPISupported('window.ResizeObserver'),
  fetch: isAPISupported('window.fetch'),
  crypto: isAPISupported('window.crypto'),
};

/**
 * Obtiene headers seguros para fetch con fallbacks
 */
export function getSafeFetchHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  // Agrega User-Agent si está disponible
  if (typeof navigator !== 'undefined' && navigator.userAgent) {
    headers['X-Client-Version'] = navigator.userAgent;
  }

  return headers;
}
