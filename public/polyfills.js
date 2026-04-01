/**
 * Polyfills y compatibilidad global
 * Cargado como primer script en el <head>
 * NOTA: Este archivo NO tiene acceso a módulos ES6 - usa sintaxis vanilla JS
 */

(function() {
  'use strict';

  // Polyfill para Promise (muy raro, pero por si acaso)
  if (typeof Promise === 'undefined') {
    console.warn('[Polyfills] Promise no disponible. Navegador muy antiguo.');
  }

  // Polyfill para Object.entries (IE 11)
  if (!Object.entries) {
    Object.entries = function(obj) {
      return Object.keys(obj).map(function(key) {
        return [key, obj[key]];
      });
    };
  }

  // Polyfill para Object.assign (IE 11)
  if (!Object.assign) {
    Object.defineProperty(Object, 'assign', {
      value: function(target) {
        var sources = Array.prototype.slice.call(arguments, 1);
        
        if (target === null || target === undefined) {
          throw new TypeError('Cannot convert undefined or null to object');
        }

        var to = Object(target);

        sources.forEach(function(source) {
          if (source !== null && source !== undefined) {
            Object.keys(source).forEach(function(key) {
              if (Object.prototype.hasOwnProperty.call(source, key)) {
                to[key] = source[key];
              }
            });
          }
        });

        return to;
      },
      writable: true,
      configurable: true
    });
  }

  // Polyfill para Array.from (IE 11)
  if (!Array.from) {
    Array.from = function(arrayLike, mapFn) {
      if (arrayLike == null) {
        throw new TypeError('Array.from requires an array-like object');
      }

      var items = Object(arrayLike);
      var length = parseInt(items.length, 10) || 0;
      var result = [];

      for (var i = 0; i < length; i++) {
        var value = items[i];
        result.push(mapFn ? mapFn(value, i) : value);
      }

      return result;
    };
  }

  // Polyfill para String.includes (IE 11)
  if (!String.prototype.includes) {
    String.prototype.includes = function(search, start) {
      if (typeof start !== 'number') {
        start = 0;
      }
      return this.indexOf(search, start) !== -1;
    };
  }

  // Polyfill para Array.prototype.includes (IE 11)
  if (!Array.prototype.includes) {
    Object.defineProperty(Array.prototype, 'includes', {
      value: function(searchElement, fromIndex) {
        if (this == null) {
          throw new TypeError('"this" is null or not defined');
        }

        var O = Object(this);
        var len = parseInt(O.length) || 0;
        if (len === 0) {
          return false;
        }

        var n = parseInt(fromIndex) || 0;
        var k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);

        while (k < len) {
          if (O[k] === searchElement) {
            return true;
          }
          k++;
        }

        return false;
      }
    });
  }

  // Polyfill para Element.closest (IE 11)
  if (!Element.prototype.closest) {
    Element.prototype.closest = function(selector) {
      var element = this;

      while (element) {
        if (element.matches && element.matches(selector)) {
          return element;
        }
        element = element.parentElement;
      }

      return null;
    };
  }

  // Polyfill para Element.matches (IE 11)
  if (!Element.prototype.matches) {
    Element.prototype.matches =
      Element.prototype.msMatchesSelector ||
      Element.prototype.webkitMatchesSelector ||
      function(selector) {
        var matches = (this.ownerDocument || this).querySelectorAll(selector);
        var i = matches.length;

        while (--i >= 0 && matches.item(i) !== this) {
          // intentional empty
        }

        return i > -1;
      };
  }

  // Polyfill para CustomEvent (IE 11)
  if (typeof window !== 'undefined' && typeof CustomEvent !== 'function') {
    window.CustomEvent = function(event, params) {
      params = params || { bubbles: false, cancelable: false, detail: undefined };
      var evt = document.createEvent('CustomEvent');
      evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
      return evt;
    };
    window.CustomEvent.prototype = window.Event.prototype;
  }

  // Detección de navegador y capacidades
  var browserName = (function() {
    var ua = navigator.userAgent;
    if (ua.indexOf('Chrome') > -1) return 'Chrome';
    if (ua.indexOf('Safari') > -1 && ua.indexOf('Chrome') === -1) return 'Safari';
    if (ua.indexOf('Firefox') > -1) return 'Firefox';
    if (ua.indexOf('Edge') > -1 || ua.indexOf('Edg') > -1) return 'Edge';
    if (ua.indexOf('MSIE') > -1 || ua.indexOf('Trident') > -1) return 'IE';
    return 'Unknown';
  })();

  // Almacenar capacidades en window para uso posterior
  window.__BROWSER_CAPABILITIES = {
    browserName: browserName,
    isIE: browserName === 'IE',
    hasClipboard: !!(navigator.clipboard && window.isSecureContext),
    hasLocalStorage: (function() {
      try {
        var test = '__localStorage_test__';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
      } catch (e) {
        return false;
      }
    })(),
    hasFetch: typeof fetch !== 'undefined',
    hasIntersectionObserver: typeof IntersectionObserver !== 'undefined',
    hasResizeObserver: typeof ResizeObserver !== 'undefined'
  };

  // Log en desarrollo
  if (process.env.NODE_ENV === 'development') {
    console.log('%c[Polyfills] Compatibilidad cargada', 'color: green; font-weight: bold;', window.__BROWSER_CAPABILITIES);
  }

  // Advertencia si es navegador heredado
  if (browserName === 'IE') {
    console.warn('[Compatibilidad] Este navegador es muy antiguo (IE). Algunas características podrían no funcionar correctamente.');
  }
})();
