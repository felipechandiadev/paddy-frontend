/**
 * Polyfill básicas y configuración global de compatibilidad
 * Se ejecuta antes de que cargue la app
 */

// Polyfill para Promise si no existe (muy raro en navegadores modernos)
if (typeof Promise === 'undefined') {
  console.warn('Promise polyfill no disponible. Navegador muy antiguo.');
}

// Polyfill fallback para fetch si no existe
if (typeof fetch === 'undefined') {
  // En navegadores muy antiguos, usa XMLHttpRequest
  (window as any).fetch = function (url: string, options?: any) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const method = options?.method || 'GET';

      xhr.open(method, url);

      // Headers
      if (options?.headers) {
        Object.entries(options.headers).forEach(([key, value]) => {
          xhr.setRequestHeader(key, value as string);
        });
      }

      xhr.onload = () => {
        resolve(
          new Response(xhr.responseText, {
            status: xhr.status,
            statusText: xhr.statusText,
            headers: new Headers(
              xhr.getAllResponseHeaders().split('\r\n').reduce(
                (acc, line) => {
                  const [key, value] = line.split(': ');
                  if (key) acc[key.toLowerCase()] = value;
                  return acc;
                },
                {} as Record<string, string>
              )
            ),
          })
        );
      };

      xhr.onerror = () => reject(new Error('Network error'));
      xhr.ontimeout = () => reject(new Error('Request timeout'));

      xhr.send(options?.body);
    });
  };
}

// Polyfill para Object.entries si no existe (IE 11)
if (!Object.entries) {
  Object.entries = function (obj: any): Array<[string, any]> {
    return Object.keys(obj).map((key) => [key, obj[key]]);
  };
}

// Polyfill para Object.assign si no existe (IE 11)
if (!Object.assign) {
  Object.defineProperty(Object, 'assign', {
    value: function assign(target: any, ...sources: any[]) {
      if (target === null || target === undefined) {
        throw new TypeError('Cannot convert undefined or null to object');
      }

      const to = Object(target);

      for (let index = 0; index < sources.length; index++) {
        const nextSource = sources[index];

        if (nextSource !== null && nextSource !== undefined) {
          for (const nextKey in nextSource) {
            if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
              to[nextKey] = nextSource[nextKey];
            }
          }
        }
      }

      return to;
    },
    writable: true,
    configurable: true,
  });
}

// Polyfill para Array.from si no existe (IE 11)
if (!Array.from) {
  Array.from = function <T>(arrayLike: any, mapFn?: (v: any, k: number) => T): T[] {
    if (arrayLike == null) {
      throw new TypeError('Array.from requires an array-like object');
    }

    const items = Object(arrayLike);
    const length = parseInt(items.length, 10) || 0;
    const result: T[] = [];

    for (let i = 0; i < length; i++) {
      const value = items[i];
      result.push(mapFn ? mapFn(value, i) : value);
    }

    return result;
  };
}

// Polyfill para String.includes si no existe (IE 11)
if (!String.prototype.includes) {
  String.prototype.includes = function (this: string, search: string, start?: number): boolean {
    if (typeof start !== 'number') {
      start = 0;
    }

    return this.indexOf(search, start) !== -1;
  };
}

// Polyfill para Element.closest si no existe (IE 11)
if (!Element.prototype.closest) {
  Element.prototype.closest = function (
    this: Element,
    selector: string
  ): Element | null {
    let element: Element | null = this;

    while (element) {
      if (element.matches && element.matches(selector)) {
        return element;
      }
      element = element.parentElement;
    }

    return null;
  };
}

// Polyfill para Element.matches si no existe (IE 11)
if (!Element.prototype.matches) {
  Element.prototype.matches = (Element.prototype as any).msMatchesSelector ||
    (Element.prototype as any).webkitMatchesSelector ||
    function (this: Element, selector: string) {
      const matches = (this.ownerDocument || this).querySelectorAll(selector);
      let i = matches.length;

      while (--i >= 0) {
        if (matches[i] === this) {
          return true;
        }
      }

      return false;
    };
}

// Polyfill para CustomEvent si no existe (IE 11)
if (typeof CustomEvent !== 'function') {
  (window as any).CustomEvent = function (this: any, event: string, params: any) {
    params = params || { bubbles: false, cancelable: false, detail: undefined };
    const evt = document.createEvent('CustomEvent');
    evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
    return evt;
  };

  (window as any).CustomEvent.prototype = (window as any).Event.prototype;
}

// Log de polyfills aplicadas (solo en desarrollo)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.log(
    '%c Polyfills de compatibilidad cargadas',
    'color: green; font-weight: bold'
  );
}
