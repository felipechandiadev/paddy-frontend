# Web Admin - Panel de Administración

Panel web administrativo del sistema Sales AYG construido con Next.js 16 (App Router).

## 🏗️ Arquitectura

Este proyecto sigue **Feature-First + Clean Architecture** adaptada a Next.js.

### Principio Fundamental

**`/app` NO es la aplicación** → Es solo el sistema de routing del framework

**Toda la lógica de negocio vive en `/features`**

## 📁 Estructura del Proyecto

```
src/
├── app/              # Solo routing (NO lógica de negocio)
│   ├── page.tsx
│   ├── layout.tsx
│   └── [routes]/
├── features/         # Módulos de negocio (core de la app)
│   ├── auth/
│   ├── orders/
│   ├── products/
│   └── customers/
├── shared/           # Recursos compartidos entre features
│   ├── components/
│   ├── hooks/
│   ├── store/
│   └── utils/
├── lib/              # Clientes HTTP y utilidades
│   └── api/
│       └── client.ts  # ✅ Ya configurado
├── providers/        # Providers globales (React Query, Theme, etc)
└── config/           # Configuración de la app
```

## 🔄 Flujo de Datos

```
Page → Hook → Action → Service → Backend API (NestJS)
```

### ❌ Prohibido

- Llamar servicios directamente desde componentes
- Poner lógica de negocio en `/app`
- Crear archivos fuera de `/web-admin`
- **Conexión directa a base de datos** (usar backend API)

## 🌐 Comunicación con el Backend

El frontend **NO tiene base de datos propia**. Toda la data viene del backend NestJS.

```typescript
// lib/api/client.ts (✅ Ya está creado)
import { apiClient } from '@/lib/api/client';

// features/orders/services/orders.service.ts
export async function getOrders(token: string) {
  return apiClient.get('/orders', token);
}

// features/orders/hooks/useOrders.ts
export function useOrders() {
  const { data, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => ordersService.getOrders(token)
  });
  
  return { orders: data, loading: isLoading };
}

// app/orders/page.tsx
export default function OrdersPage() {
  const { orders, loading } = useOrders();
  return <div>{/* UI */}</div>;
}
```

## 🚀 Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **HTTP Client:** Fetch API (apiClient configurado)
- **State:** React Context / Zustand (a implementar)
- **Auth:** NextAuth (a implementar)

## 🔧 Variables de Entorno

```bash
# .env.local (✅ Ya configurado)
NEXT_PUBLIC_API_URL=http://localhost:3000  # Backend NestJS
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=your-secret-key
```

## � Progressive Web App (PWA)

Esta aplicación está configurada como PWA para permitir instalación en dispositivos móviles y escritorio.

### Características PWA

- ✅ **Manifiesto configurado** (`/public/manifest.json`)
- ✅ **Iconos optimizados** para Android, iOS, Windows
- ✅ **Instalable** en home screen de dispositivos
- ✅ **Shortcuts** de acceso rápido (Nueva Venta, Productos, Clientes, Reportes)
- ✅ **Tema personalizado** (#1976d2 - Azul primario)
- ✅ **Responsive** con orientación portrait-primary

### Iconos Requeridos

Consulta `/public/ICONS_README.md` para la lista completa de iconos necesarios:

- `favicon.ico`, `favicon-16x16.png`, `favicon-32x32.png`
- `android-chrome-192x192.png`, `android-chrome-512x512.png`
- `apple-touch-icon.png` (180x180)

**Generación de iconos:**
- Herramienta recomendada: https://realfavicongenerator.net/
- O usar: https://www.pwabuilder.com/imageGenerator

### Testing PWA

```bash
# Lighthouse PWA audit
npm run build
npm run start
# Abrir Chrome DevTools > Lighthouse > Progressive Web App
```

**Verificar en Chrome DevTools:**
1. Application tab > Manifest
2. Comprobar que todos los iconos cargan
3. Probar "Add to Home Screen"

### Metadata y SEO

- **Título dinámico**: `%s | Sales AYG`
- **Idioma**: `es-CL` (Español - Chile)
- **Theme color**: `#1976d2`
- **Viewport**: Optimizado para móviles
- **Robots.txt**: Configurado en `/public/robots.txt`
- **Sitemap**: Generado dinámicamente en `/app/sitemap.ts`

## �📦 Scripts

```bash
npm run dev        # Desarrollo (puerto 3000 por defecto)
npm run build      # Build de producción
npm run start      # Servidor de producción
npm run lint       # ESLint
```

## 📐 Reglas de Arquitectura

Ver documentación completa en: `/.github/copilot-instructions.md`

### Feature Structure

Cada feature debe tener:

```
features/{feature}/
├── actions/       # Server Actions (mutaciones)
├── hooks/         # React hooks de negocio
├── services/      # Comunicación HTTP con backend
├── store/         # Estado específico de la feature
├── components/    # Componentes UI de la feature
├── types/         # TypeScript types
└── utils/         # Utilidades de la feature
```

## 🚫 No Incluido (Por Diseño)

- ❌ **TypeORM / Prisma** → Backend gestiona toda la DB
- ❌ **Conexión a PostgreSQL** → Usar API REST del backend
- ❌ **SQL/Queries directas** → Todo a través del backend NestJS

## 🔗 Integración con Backend

Endpoints disponibles del backend (`http://localhost:3000`):

- `POST /auth/login` - Autenticación JWT
- `GET /products` - Lista de productos
- `GET /customers` - Lista de clientes  
- `GET /transactions` - Transacciones financieras
- `POST /transactions/sale` - Crear venta
- Ver más en `/backend/doc/BACKEND_SERVICES.md`

## 🎯 Siguiente Paso

1. Instalar dependencias: `npm install`
2. Configurar `.env.local` con URL del backend
3. Crear features siguiendo la estructura definida
4. Implementar autenticación con NextAuth
5. Consumir endpoints del backend via `apiClient`

## 📝 Notas Importantes

1. **Este frontend NO gestiona base de datos directamente**
2. **Todo el CRUD viene del backend NestJS a través de REST API**
3. **Solo consume endpoints REST con autenticación JWT**
4. **Sigue arquitectura Feature-First estricta** (ver `.github/copilot-instructions.md`)

