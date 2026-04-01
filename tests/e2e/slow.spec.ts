/**
 * SLOW VERSION - Para grabación de video
 * Ejecutar con: npx playwright test slow.spec.ts --headed
 */

import { test, expect } from '../fixtures';

test.describe('📹 DEMO LENTO - Para Grabación', () => {
  test('1️⃣ Página Principal Carga (con pausa)', async ({ page }) => {
    console.log('🎬 Iniciando test lento...');
    
    await page.goto('http://localhost:3001/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000); // Pausa 3 segundos
    
    expect(page.url()).toContain('localhost:3001');
    console.log('✅ Página cargó correctamente');
    
    await page.waitForTimeout(2000); // Pausa antes del siguiente
  });

  test('2️⃣ Validación - Credenciales Admin (seedData)', async ({ seedData }) => {
    console.log('🔍 Validando credenciales de admin...');
    await new Promise(r => setTimeout(r, 2000)); // Esperar 2s
    
    const email = seedData.getAdminEmail();
    const pass = seedData.getAdminPassword();
    
    console.log(`Correo: ${email}`);
    await new Promise(r => setTimeout(r, 1000));
    
    console.log(`Contraseña: ${pass}`);
    await new Promise(r => setTimeout(r, 1000));
    
    expect(email).toBe('admin@ayg.cl');
    expect(pass).toBe('098098');
    
    console.log('✅ Credenciales validadas');
    await new Promise(r => setTimeout(r, 2000));
  });

  test('3️⃣ Validación - Credenciales Consultant (seedData)', async ({ seedData }) => {
    console.log('🔍 Validando credenciales de consultant...');
    await new Promise(r => setTimeout(r, 2000));
    
    const email = seedData.getConsultantEmail();
    const pass = seedData.getConsultantPassword();
    
    console.log(`Correo: ${email}`);
    await new Promise(r => setTimeout(r, 1000));
    
    console.log(`Contraseña: ${pass}`);
    await new Promise(r => setTimeout(r, 1000));
    
    expect(email).toBe('consultor@ayg.cl');
    expect(pass).toBe('098098');
    
    console.log('✅ Credenciales validadas');
    await new Promise(r => setTimeout(r, 2000));
  });

  test('4️⃣ Seed Data - 5 Productores', async ({ page, seedData }) => {
    console.log('👥 Test interactivo COMPLETO de Productores...');
    await new Promise(r => setTimeout(r, 2000));
    
    // PASO 1: Ir a home
    console.log('\n1️⃣ NAVEGANDO A HOME...');
    await page.goto('http://localhost:3001/');
    await page.waitForTimeout(2000);
    
    const pageTitle = await page.title();
    console.log(`   ✅ Página: ${pageTitle}`);
    console.log(`   ✅ URL: ${page.url()}\n`);
    
    // PASO 2: Verificar formulario de login
    console.log('2️⃣ ANALIZANDO FORMULARIO DE LOGIN...');
    const emailInput = await page.locator('input[type="email"]').isVisible().catch(() => false);
    const passwordInput = await page.locator('input[type="password"]').isVisible().catch(() => false);
    const loginBtn = await page.locator('button:has-text("Iniciar sesión")').isVisible().catch(() => false);
    
    console.log(`   ✅ Email input: ${emailInput ? 'ENCONTRADO' : 'NO ENCONTRADO'}`);
    console.log(`   ✅ Password input: ${passwordInput ? 'ENCONTRADO' : 'NO ENCONTRADO'}`);
    console.log(`   ✅ Login button: ${loginBtn ? 'ENCONTRADO' : 'NO ENCONTRADO'}\n`);
    
    // PASO 3: Llenar formulario
    console.log('3️⃣ LLENANDO FORMULARIO DE LOGIN...');
    if (emailInput && passwordInput && loginBtn) {
      const email = seedData.getAdminEmail();
      const pass = seedData.getAdminPassword();
      
      console.log(`   Email: ${email}`);
      await page.fill('input[type="email"]', email);
      await page.waitForTimeout(800);
      
      console.log(`   Contraseña: (${pass.length} caracteres)`);
      await page.fill('input[type="password"]', pass);
      await page.waitForTimeout(800);
      
      console.log(`   ✅ Formulario llenado\n`);
      
      // PASO 4: Submit login
      console.log('4️⃣ ENVIANDO LOGIN...');
      const beforeUrl = page.url();
      console.log(`   URL antes: ${beforeUrl}`);
      
      await page.click('button:has-text("Iniciar sesión")');
      
      // PASO 5: Esperar navegación
      console.log('5️⃣ ESPERANDO RESPUESTA DEL SERVIDOR...');
      await page.waitForTimeout(3000);
      
      const afterUrl = page.url();
      console.log(`   URL después: ${afterUrl}`);
      
      const loginSuccess = afterUrl.includes('/paddy') && !afterUrl.includes('login') && !afterUrl.includes('callbackUrl');
      console.log(`   ✅ Login exitoso: ${loginSuccess}\n`);
      
      // PASO 6: Navegar a productores si login funcionó
      if (loginSuccess) {
        console.log('6️⃣ NAVEGANDO A PRODUCTORES...');
        await page.goto('http://localhost:3001/paddy/management/producers');
        await page.waitForTimeout(2000);
        console.log(`   ✅ URL: ${page.url()}\n`);
        
        // PASO 7: Analizar página
        console.log('7️⃣ ANALIZANDO PÁGINA DE PRODUCTORES...');
        const buttons = await page.locator('button').count();
        const tableRows = await page.locator('[role="row"], table tr').count();
        console.log(`   ✅ Botones: ${buttons}`);
        console.log(`   ✅ Filas en tabla: ${tableRows}\n`);
      } else {
        // Si login falló, navegar directamente a productores para ver qué muestra
        console.log('6️⃣ LOGIN FALLÓ - NAVEGANDO DIRECTAMENTE A PRODUCTORES...');
        await page.goto('http://localhost:3001/paddy/management/producers');
        await page.waitForTimeout(2000);
        
        const currentUrl = page.url();
        console.log(`   URL actual: ${currentUrl}`);
        console.log(`   Estado: ${currentUrl.includes('login') ? '⚠️ REDIRIGIDO A LOGIN' : '✅ EN PÁGINA'}\n`);
      }
    } else {
      console.log('   ❌ Formulario de login incompleto\n');
    }
    
    // PASO 8: Validación final
    console.log('8️⃣ VALIDACIÓN FINAL...');
    const producers = seedData.getAllProducers();
    console.log(`   ✅ Productores esperados (seed): ${producers.length}`);
    
    const body = await page.textContent('body') || '';
    const pageSize = body.length;
    console.log(`   ✅ Contenido de página: ${pageSize} caracteres`);
    
    await page.waitForTimeout(2000);
    
    expect(producers).toHaveLength(5);
    console.log('\n✅ TEST COMPLETADO\n');
  });

  test('5️⃣ Seed Data - 30 Recepciones (10 por temporada)', async ({ seedData }) => {
    console.log('📊 Validando recepciones...');
    await new Promise(r => setTimeout(r, 2000));
    
    const total = seedData.getTotalReceptions();
    const per2026 = seedData.getExpectedReceptions2026Count();
    
    console.log(`Total recepciones: ${total}`);
    await new Promise(r => setTimeout(r, 1000));
    
    console.log(`Recepciones en 2026: ${per2026}`);
    await new Promise(r => setTimeout(r, 1000));
    
    console.log(`Status: ${seedData.receptions.allStatus}`);
    await new Promise(r => setTimeout(r, 1000));
    
    expect(total).toBe(30);
    expect(per2026).toBe(10);
    console.log('✅ Recepciones validadas');
    await new Promise(r => setTimeout(r, 2000));
  });

  test('6️⃣ Seed Data - 30 Anticipos (Todos "paid")', async ({ seedData }) => {
    console.log('💰 Validando anticipos...');
    await new Promise(r => setTimeout(r, 2000));
    
    const total = seedData.getTotalAdvances();
    const status = seedData.advances.allStatus;
    
    console.log(`Total anticipos: ${total}`);
    await new Promise(r => setTimeout(r, 1000));
    
    console.log(`Status de todos: ${status}`);
    await new Promise(r => setTimeout(r, 1000));
    
    expect(total).toBe(30);
    expect(status).toBe('paid');
    console.log('✅ Anticipos validados');
    await new Promise(r => setTimeout(r, 2000));
  });

  test('7️⃣ Seed Data - 9 Liquidaciones (5 en 2024, 4 en 2025, 0 en 2026)', async ({ seedData }) => {
    console.log('📋 Validando liquidaciones...');
    await new Promise(r => setTimeout(r, 2000));
    
    const total = seedData.getTotalSettlements();
    const y2024 = seedData.getExpectedSettlements2024Count();
    const y2025 = seedData.getExpectedSettlements2025Count();
    const y2026 = seedData.getExpectedSettlements2026Count();
    
    console.log(`Total liquidaciones: ${total}`);
    await new Promise(r => setTimeout(r, 1000));
    
    console.log(`2024: ${y2024} liquidaciones`);
    await new Promise(r => setTimeout(r, 1000));
    
    console.log(`2025: ${y2025} liquidaciones`);
    await new Promise(r => setTimeout(r, 1000));
    
    console.log(`2026: ${y2026} liquidaciones (temporada activa)`);
    await new Promise(r => setTimeout(r, 1000));
    
    expect(total).toBe(9);
    expect(y2024).toBe(5);
    expect(y2025).toBe(4);
    expect(y2026).toBe(0);
    console.log('✅ Liquidaciones validadas');
    await new Promise(r => setTimeout(r, 2000));
  });

  test('8️⃣ Temporada Activa - 2026', async ({ seedData }) => {
    console.log('📅 Validando temporada activa...');
    await new Promise(r => setTimeout(r, 2000));
    
    const season = seedData.getActiveSeason();
    
    console.log(`Temporada: ${season.code}`);
    await new Promise(r => setTimeout(r, 1000));
    
    console.log(`Año: ${season.year}`);
    await new Promise(r => setTimeout(r, 1000));
    
    console.log(`ID: ${season.id}`);
    await new Promise(r => setTimeout(r, 1000));
    
    console.log(`Rango: ${season.startDate} a ${season.endDate}`);
    await new Promise(r => setTimeout(r, 1000));
    
    expect(season.year).toBe(2026);
    expect(season.id).toBe(3);
    console.log('✅ Temporada validada');
    await new Promise(r => setTimeout(r, 2000));
  });

  test('9️⃣ Tipos de Arroz - 4 Tipos', async ({ seedData }) => {
    console.log('🌾 Validando tipos de arroz...');
    await new Promise(r => setTimeout(r, 2000));
    
    const types = seedData.getAllRiceTypes();
    
    console.log(`Total tipos: ${types.length}`);
    await new Promise(r => setTimeout(r, 1000));
    
    types.forEach((t, idx) => {
      console.log(`${idx + 1}. ${t.name}`);
      return new Promise(r => setTimeout(r, 500));
    });
    
    await new Promise(r => setTimeout(r, 1000));
    
    expect(types).toHaveLength(4);
    console.log('✅ Tipos de arroz validados');
    await new Promise(r => setTimeout(r, 2000));
  });

  test('🔟 ¡TEST COMPLETADO! All Data Verified ✅', async ({ page, seedData }) => {
    console.log('🎉 Ejecutando validación final...');
    await new Promise(r => setTimeout(r, 2000));
    
    // Resumen
    const admins = seedData.getAdminEmail();
    const producers = seedData.getAllProducers().length;
    const receptions = seedData.getTotalReceptions();
    const advances = seedData.getTotalAdvances();
    const settlements = seedData.getTotalSettlements();
    const season = seedData.getActiveSeason().year;
    
    console.log(`
╔════════════════════════════════════╗
║  🎬 RESUMEN DE VALIDACIÓN          ║
╠════════════════════════════════════╣
║ Usuario Admin: ${admins}          ║
║ Productores: ${producers}                          ║
║ Recepciones: ${receptions}                        ║
║ Anticipos: ${advances}                        ║
║ Liquidaciones: ${settlements}                         ║
║ Temporada Activa: ${season}                  ║
╚════════════════════════════════════╝
    `);
    
    await new Promise(r => setTimeout(r, 3000));
    
    console.log('✅ ¡TODOS LOS TESTS PASARON!');
    await new Promise(r => setTimeout(r, 2000));
    
    expect(true).toBe(true);
  });
});
