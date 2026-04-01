# Iconos Requeridos para PWA

Este documento describe los iconos necesarios para que la aplicación funcione como una Progressive Web App (PWA).

## 📋 Lista de Iconos Principales

Todos los iconos deben colocarse en `/web-admin/public/`

### Favicon (Navegador)

- `favicon.ico` - Icono principal (16x16, 32x32, 48x48 multiparte)
- `favicon-16x16.png` - 16x16 píxeles
- `favicon-32x32.png` - 32x32 píxeles

### Android/Chrome

- `android-chrome-192x192.png` - 192x192 píxeles (requerido)
- `android-chrome-512x512.png` - 512x512 píxeles (requerido)

### Apple Touch Icon

- `apple-touch-icon.png` - 180x180 píxeles

## 🎨 Especificaciones de Diseño

### Color Principal
- **Theme Color**: `#1976d2` (azul primario)
- **Background**: `#ffffff` (blanco)

### Diseño del Icono

El icono debe:
- Representar la marca "Sales AYG" o "Arrocera Aparicio y García"
- Ser reconocible a tamaños pequeños (192x192)
- Tener buen contraste
- Funcionar tanto en temas claros como oscuros

### Formato Maskable Icon

Para los iconos con `purpose: "maskable"`, asegurarse de:
- Dejar un margen de seguridad del 10-20% en todos los lados
- El contenido importante debe estar dentro del círculo seguro central
- El fondo debe cubrir todo el canvas (sin transparencia)

## 🔗 Iconos Opcionales (Shortcuts)

Si se desea implementar accesos directos, crear también:

- `/public/icons/shortcut-sale.png` - 192x192 (icono de venta)
- `/public/icons/shortcut-products.png` - 192x192 (icono de productos)
- `/public/icons/shortcut-customers.png` - 192x192 (icono de clientes)
- `/public/icons/shortcut-reports.png` - 192x192 (icono de reportes)

## 📸 Screenshots Opcionales

Para mejorar la presentación en tiendas de apps:

- `/public/screenshots/dashboard.png` - 1280x720 (desktop)
- `/public/screenshots/products.png` - 1280x720 (desktop)
- `/public/screenshots/mobile-dashboard.png` - 720x1280 (móvil)

## 🛠️ Generación de Iconos

### Opción 1: Herramientas Online

1. **Favicon Generator**: https://realfavicongenerator.net/
   - Sube tu logo/icono principal
   - Configura opciones para Android, iOS, Windows
   - Descarga el paquete completo

2. **PWA Asset Generator**: https://www.pwabuilder.com/imageGenerator
   - Sube tu icono base (512x512 mínimo)
   - Genera todos los tamaños automáticamente

### Opción 2: Comando con Sharp (Node.js)

```bash
npm install sharp-cli -g

# Desde un icono base de 1024x1024
sharp -i logo-1024.png -o favicon-16x16.png resize 16 16
sharp -i logo-1024.png -o favicon-32x32.png resize 32 32
sharp -i logo-1024.png -o android-chrome-192x192.png resize 192 192
sharp -i logo-1024.png -o android-chrome-512x512.png resize 512 512
sharp -i logo-1024.png -o apple-touch-icon.png resize 180 180
```

### Opción 3: Usando Figma/Sketch/Adobe XD

1. Crear artboard de 1024x1024
2. Diseñar el icono centrado con márgenes
3. Exportar en los tamaños requeridos:
   - 16x16, 32x32, 180x180, 192x192, 512x512

## ✅ Checklist de Implementación

- [ ] Crear iconos básicos (16, 32, 192, 512)
- [ ] Crear apple-touch-icon (180x180)
- [ ] Generar favicon.ico multiparte
- [ ] Verificar manifest.json enlazado en layout.tsx
- [ ] Probar en Chrome DevTools (Application > Manifest)
- [ ] Probar "Add to Home Screen" en dispositivo móvil
- [ ] (Opcional) Crear iconos de shortcuts
- [ ] (Opcional) Crear screenshots para stores

## 🧪 Testing

### Chrome DevTools

1. Abrir DevTools (F12)
2. Ir a "Application" tab
3. Click en "Manifest" en el sidebar izquierdo
4. Verificar:
   - Manifest se carga correctamente
   - Todos los iconos cargan sin errores
   - Service worker (si existe)

### Lighthouse

1. Abrir DevTools
2. Ir a "Lighthouse" tab
3. Seleccionar "Progressive Web App"
4. Click "Analyze page load"
5. Verificar puntuación PWA

### Dispositivo Real

1. Abrir la app en un navegador móvil
2. Chrome/Safari: Menú > "Add to Home Screen"
3. Verificar que el icono se ve correctamente
4. Abrir desde home screen y verificar splash screen

## 📝 Notas

- Los iconos PNG deben tener fondo (no transparencia) para Android
- Para iOS, puede usar transparencia en apple-touch-icon
- Los iconos maskable deben tener padding extra para adaptarse a diferentes formas
- El manifest.json ya incluye shortcuts, pero los iconos son opcionales

## 🔗 Referencias

- [Web.dev - Add a web app manifest](https://web.dev/add-manifest/)
- [MDN - Web app manifests](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [Maskable.app - Icon Editor](https://maskable.app/editor)
