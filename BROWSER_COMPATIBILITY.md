# Guía de Compatibilidad Cross-Browser

## Navegadores Soportados

La app Paddy soporta las **últimas 2 versiones** de navegadores modernos:
- **Chrome** (versión 119+)
- **Firefox** (versión 121+)
- **Safari** (versión 17+)
- **Edge** (versión 119+)

**NO soportamos:** IE 11, IE 10, IE 9, navegadores muy antiguos.

---

## Configuración Establecida

### 1. `.browserslistrc`
Define explícitamente qué navegadores soportamos. Esto afecta:
- **autoprefixer** — genera prefijos CSS solo para navegadores necesarios
- **next/build** — compila código compatible con estos navegadores
- **tsconfig.json target: ES2017** — sintaxis compatible con ES2017

### 2. `tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2017",  // Sintaxis JavaScript compatible
    "lib": ["dom", "dom.iterable", "esnext"]
  }
}
```

### 3. `postcss.config.mjs`
```js
{
  plugins: {
    tailwindcss: {},
    autoprefixer: {},  // Genera prefijos -webkit-, -moz-, etc.
  }
}
```

---

## Utilities de Compatibilidad

### `lib/browser-compatibility.ts`
Proporciona funciones seguras para operaciones que podrían fallar en algunos navegadores:

```typescript
import {
  setFocusElement,        // Establece focus de forma segura
  showAlert,              // Alerta compatible
  copyToClipboard,        // Copia al portapapeles con fallback
  announceToScreenReader, // Accesibilidad
  isAPISupported,         // Verifica si API está disponible
  browserCapabilities,    // Detección de capacidades
} from '@/lib/browser-compatibility';
```

### `shared/hooks/useBrowserCompat.ts`
Hooks React para detectar capacidades y manejar errores:

```typescript
import {
  useSafeFocus,          // Para manejar focus
  useAccessibleAlert,    // Para mostrar alertas accesibles
  useBrowserCapabilities, // Para detectar capacidades
} from '@/shared/hooks/useBrowserCompat';
```

---

## Patrones de Uso

### ✅ CORRECTO: Manejar focus con fallback

```typescript
import { useSafeFocus } from '@/shared/hooks/useBrowserCompat';

export default function MyForm() {
  const { focusById } = useSafeFocus();

  const handleErrorFocus = () => {
    focusById('error-message');
    // Fallback automático si focus falla
  };

  return (
    <>
      <input id="email-input" type="email" />
      <div id="error-message" role="alert">Email inválido</div>
    </>
  );
}
```

### ✅ CORRECTO: Alertas accesibles

```typescript
import { useAccessibleAlert } from '@/shared/hooks/useBrowserCompat';

export default function MyComponent() {
  const { showError, showSuccess } = useAccessibleAlert();

  const handleSubmit = async () => {
    try {
      const response = await fetch('/api/data');
      await showSuccess('Guardado correctamente');
    } catch (error) {
      await showError((error as Error).message);
    }
  };

  return <button onClick={handleSubmit}>Guardar</button>;
}
```

### ❌ INCORRECTO: focus() sin verificación

```typescript
// ❌ Puede fallar en navegadores antiguos
inputRef.current?.focus();
```

### ❌ INCORRECTO: Usar Clipboard API sin fallback

```typescript
// ❌ Falla en navegadores que no soportan Clipboard API
const copyToClip = async (text: string) => {
  await navigator.clipboard.writeText(text);  // Sin fallback
};
```

### ❌ INCORRECTO: Asumir APIs modernas existen

```typescript
// ❌ IntersectionObserver podría no estar disponible
const observer = new IntersectionObserver(...);
```

### ✅ CORRECTO: Verificar APIs antes de usarlas

```typescript
import { isAPISupported } from '@/lib/browser-compatibility';

if (isAPISupported('window.IntersectionObserver')) {
  const observer = new IntersectionObserver(...);
}
```

---

## Problemas Comunes y Soluciones

### 1. Focus no funciona en inputs
**Síntoma:** Input no recibe focus, no se ve borde azul, teclado no funciona.

**Solución:**
```typescript
import { useSafeFocus } from '@/shared/hooks/useBrowserCompat';

const { focus } = useSafeFocus();
focus(inputElement); // Con fallback automático
```

### 2. Alertas muestran mensajes incorrectos
**Síntoma:** `window.alert()` muestra "undefined" o contenido truncado.

**Solución:**
```typescript
import { useAccessibleAlert } from '@/shared/hooks/useBrowserCompat';

const { showError } = useAccessibleAlert();

try {
  // ...
} catch (error) {
  const message = error instanceof Error ? error.message : 'Error desconocido';
  await showError(message);
}
```

### 3. Copiar al portapapeles falla
**Síntoma:** Botón "Copiar" no copia texto en algunos navegadores.

**Solución:**
```typescript
import { copyToClipboard } from '@/lib/browser-compatibility';

const handleCopy = async (text: string) => {
  const success = await copyToClipboard(text);
  if (success) {
    alert('Copiado al portapapeles');
  } else {
    alert('No se pudo copiar. Copia manualmente: ' + text);
  }
};
```

### 4. CSS no se aplica en navegadores antiguos
**Síntoma:** Estilos flex, grid, o propiedades CSS modernas no funcionan.

**Solución:** Ya está automáticamente manejado por **autoprefixer** en `postcss.config.mjs`. El build añade automáticamente `-webkit-`, `-moz-`, etc.

Verifica que el build incluya autoprefixer:
```bash
npm run build
# Verifica en output que haya prefijos -webkit-flex, -moz-box-shadow, etc.
```

---

## Testeo Cross-Browser

### Localmente (development)
```bash
npm run dev

# Testa en múltiples navegadores simultáneamente:
# 1. Chrome DevTools - Emular dispositivos/navegadores antiguos
#    - F12 > ... > More tools > Device mode
#    - Cambiar User Agent
# 2. Firefox Developer Edition
# 3. Safari (si estás en Mac)
```

### Errores a buscar en Console
```javascript
// En Chrome DevTools Console:
// Busca errores como:
// - "Uncaught TypeError: fetch is not a function"
// - "Cannot read property 'focus' of null"
// - "ResizeObserver is not defined"

// Verifica capacidades:
copy(window.__BROWSER_CAPABILITIES || {})
```

### Checklist de Testing
- [ ] Focus visible en inputs con Tab
- [ ] Alertas muestran mensajes completos
- [ ] Copiar texto funciona (si hay botón de copiar)
- [ ] Grillas/flexbox se ven correctamente
- [ ] Transiciones CSS funcionan
- [ ] Iconos del Material Symbols cargan
- [ ] Formularios responden a validación
- [ ] Reportes se generan sin errores

---

## Herramientas Recomendadas

### BrowserStack (servicios de testing online)
```bash
# Testa en navegadores reales sin instalarlos
# https://www.browserstack.com/
# (Requiere cuenta)
```

### Can I Use (verificar soporte de APIs)
```
https://caniuse.com/

Busca APIs específicas:
- "Clipboard API"
- "IntersectionObserver"
- "CSS Grid"
- etc.
```

### Lighthouse (auditoría en Chrome DevTools)
```
F12 > Lighthouse > Generate report

Verifica:
- Performance
- Accessibility
- Best Practices
```

---

## Resumen de Reglas

| ❌ NO hagas | ✅ HAZ |
|----------|--------|
| `element.focus()` | `useSafeFocus().focus(element)` |
| `window.alert()` con strings sin validar | `useAccessibleAlert().showError(message)` |
| `navigator.clipboard.writeText()` sin fallback | `copyToClipboard()` |
| Asumir `localStorage` existe | Verifica con `try/catch` o `browserCapabilities.localStorage` |
| Usar APIs nuevas sin verificar | `isAPISupported('window.API')` primero |
| Ignorar errores de compatibilidad en console | Lee y arregla todos los warnings/errors |

---

## Preguntas Frecuentes

**P: ¿Necesito soportar IE 11?**
A: No. Configuramos `.browserslistrc` para excluirlo explícitamente. Si lo necesitas, edita `.browserslistrc`.

**P: ¿Mi navegador X no funciona?**
A: Abre DevTools (F12), mira la Console, y busca errores tipo "not a function" o "is not defined". Luego testa el componente con las utilidades de compatibilidad.

**P: ¿Cómo verifico si una API está disponible?**
A: Usa `isAPISupported('window.API.method')` o prueba en Console: `typeof window.API !== 'undefined'`.

---

**Última actualización:** Marzo 2026
**Responsable:** Sistema de Compatibilidad Cross-Browser
