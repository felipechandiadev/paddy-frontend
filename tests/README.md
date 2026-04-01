# 🎭 Playwright E2E Tests - Paddy

Tests E2E para la aplicación Paddy usando **Playwright** con datos del seed `seed:test-cosecha`.

## 📋 Estructura

```
tests/
├── fixtures/                    # Fixtures reutilizables
│   ├── helpers/
│   │   ├── login.helper.ts      # Login/logout utilities
│   │   ├── navigation.helper.ts # Navegación entre features
│   │   └── validations.helper.ts# Assertions helpers
│   ├── auth.fixture.ts          # Fixtures de autenticación
│   ├── api.fixture.ts           # Client HTTP con autenticación
│   ├── data.fixture.ts          # Datos del seed para tests
│   └── index.ts                 # Punto de entrada unificado
├── e2e/                         # Specs tests
│   ├── auth.spec.ts             # Tests de autenticación
│   ├── receptions.spec.ts       # Tests de recepciones
│   ├── finances.spec.ts         # Tests de finanzas
│   └── producers.spec.ts        # Tests de productores
├── data/
│   └── roles.json               # Datos del seed:test-cosecha
├── playwright.config.ts         # Configuración Playwright
└── README.md                    # Este archivo
```

## 📊 Datos Disponibles (seed:test-cosecha)

### Usuarios (2)
```
ADMIN:       admin@ayg.cl / 098098
CONSULTANT:  consultor@ayg.cl / 098098
```

### Temporadas (3)
- COSECHA_2024 (inactiva)
- COSECHA_2025 (inactiva)
- COSECHA_2026 (activa) ← Para tests

### Productores (5)
1. Agrícola San Pedro LTDA (RUT: 78956452-1)
2. Sociedad Agrícola Los Robles (RUT: 65432198-9)
3. Empresa Agraria El Retiro (RUT: 54321098-7)
4. Producción Arrocera Central (RUT: 43210987-5)
5. Agroindustrial Maule SpA (RUT: 32109876-3)

### Tipos de Arroz (4)
- DIAMANTE (600)
- ZAFIRO (550)
- BRILLANTE (200)
- HARPER (200)

### Datos Esperados en 2026 (Temporada Activa)
| Entidad | Cantidad | Status |
|---------|----------|--------|
| Recepciones | 10 | analyzed |
| Anticipos | 10 | paid |
| Liquidaciones | 0 | (temporada activa) |

## 🚀 Ejecutar Tests

### Prerequisitos

1. **Backend corriendo en puerto 3000**
   ```bash
   cd backend
   npm run db:setup        # Reset DB + seed:test-cosecha
   npm run start:dev
   ```

2. **Frontend corriendo en puerto 3001**
   ```bash
   cd frontend
   npm run dev
   ```

### Tests Locales

```bash
cd frontend

# Ejecutar todos los tests
npm run test:e2e

# Modo UI (debugging interactivo)
npm run test:e2e:ui

# Modo debug (step-by-step)
npm run test:e2e:debug

# Modo headed (ver navegador)
npm run test:e2e:headed

# Test específico
npx playwright test tests/e2e/auth.spec.ts

# Ver reporte después
npm run test:e2e:report
```

## 🔧 Cómo Usar Fixtures en Tests

### Fixture: `authenticatedPageAsAdmin`
Página autenticada como ADMIN, con logout automático al final.

```typescript
test('ejemplo', async ({ authenticatedPageAsAdmin, page }) => {
  // Ya estamos logueados como admin
  await page.goto('/paddy/operations');
  // ...
  // Logout automático al finalizar
});
```

### Fixture: `apiClient`
Cliente HTTP con token inyectado automáticamente.

```typescript
test('ejemplo', async ({ apiClient }) => {
  const response = await apiClient.get('/producers');
  const data = await response.json();
  // ...
});
```

### Fixture: `seedData`
Acceso a datos del seed para referencias.

```typescript
test('ejemplo', async ({ seedData }) => {
  const adminEmail = seedData.getAdminEmail();
  const producer = seedData.getProducerById(1);
  const expectedCount = seedData.getExpectedReceptions2026Count(); // 10
  // ...
});
```

## 📝 Ejemplo Test Completo

```typescript
import { test, expect } from '../fixtures';

test('crear recepción usando datos del seed', async ({ 
  authenticatedPageAsAdmin, 
  seedData,
  page 
}) => {
  const producer = seedData.getProducerByIndex(0);
  const season = seedData.getActiveSeason();
  const riceType = seedData.getRiceTypeByIndex(0);

  await page.goto('/paddy/operations');
  await page.click('button:has-text("Nueva")');
  
  await page.selectOption('select[name="producerId"]', String(producer.id));
  await page.selectOption('select[name="seasonId"]', String(season.id));
  await page.selectOption('select[name="riceTypeId"]', String(riceType.id));
  
  await page.fill('input[name="guideNumber"]', `TEST-${Date.now()}`);
  await page.fill('input[name="grossWeight"]', '2500');
  
  await page.click('button:has-text("Guardar")');
  
  await expect(page.locator('text=Recepción creada')).toBeVisible();
});
```

## 🎯 Tests por Feature

### ✅ Autenticación (4 tests)
- Login como ADMIN
- Login como CONSULTANT
- Rechazo de credenciales inválidas
- Mantener sesión después de refresh

### ✅ Recepciones (4 tests)
- Cargar página de recepciones
- Listar 10 recepciones del seed
- Mostrar productores del seed
- Crear nueva recepción

### ✅ Finanzas (6 tests)
**Anticipos (3)**
- Cargar página
- Listar 10 anticipos del seed
- Mostrar montos esperados

**Transacciones (2)**
- Cargar página
- Listar transacciones

**Liquidaciones (1)**
- Validar que 2026 no tiene liquidaciones

### ✅ Productores (6 tests)
- Cargar página
- Listar 5 productores del seed
- Mostrar nombres
- Mostrar RUTs
- Validar que están activos
- Validar datos bancarios

## 🔍 Debugging

### Ver trazas de tests fallidos
```bash
npm run test:e2e:report
# Se abrirá un navegador con el reporte interactivo
```

### Ejecutar test en modo debug
```bash
npm run test:e2e:debug tests/e2e/auth.spec.ts
# Se abrirá debugger donde puedes hacer step-by-step
```

### Ver navegador en tiempo real
```bash
npm run test:e2e:headed
```

## 📊 Estadísticas de Tests

| Feature | Tests | Status |
|---------|-------|--------|
| Autenticación | 4 | ✅ Implementados |
| Recepciones | 4 | ✅ Implementados |
| Finanzas | 6 | ✅ Implementados |
| Productores | 6 | ✅ Implementados |
| **TOTAL** | **20** | ✅ Listos |

## ⚙️ Configuración

Ver `playwright.config.ts` para:
- Timeout: 30 segundos por test
- Retries: 0 (local) / 2 (CI)
- Workers: 4 (local) / 1 (CI)
- Navegadores: Chromium, Firefox

## 🚨 Notas Importantes

1. **Seed obligatorio**: Ejecutar `npm run db:setup` en backend antes de tests
2. **URLs fijas**: Los tests asumen localhost:3000 (backend) y localhost:3001 (frontend)
3. **Datos predecibles**: El seed genera siempre los mismos datos
4. **IDs conocidos**:
   - Usuarios: ID 1 (ADMIN), ID 2 (CONSULTANT)
   - Productores: ID 1-5
   - Temporada activa: ID 3 (2026)
   - RiceTypes: ID 1-4

## 🤝 Contribuir

Agregar nuevos tests:

1. Crear archivo en `tests/e2e/feature.spec.ts`
2. Importar fixtures: `import { test, expect } from '../fixtures'`
3. Usar `seedData` para datos predecibles
4. Ejecutar: `npm run test:e2e`

## 📚 Referencias

- [Playwright Docs](https://playwright.dev)
- [Test Fixtures](https://playwright.dev/docs/test-fixtures)
- [Best Practices](https://playwright.dev/docs/best-practices)
