import { Page } from '@playwright/test';
import { testData } from '../../config/testData';

/**
 * Login helper - Navega a la página principal
 * Credenciales: admin@ayg.cl / 098098
 */
export async function loginAs(
  page: Page,
  role: 'admin' | 'consultant'
) {
  const creds = testData.auth[role];

  console.log(`🔐 Navegando como ${role} (${creds.email})`);

  // Navegar a la página principal
  await page.goto('http://localhost:3001/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(500);

  console.log(`✅ Navigation complete for ${role}`);
}

export async function logout(page: Page) {
  console.log('🚪 Logging out...');

  try {
    // Intentar diferentes selectores de botón de menú
    const menuButton = page.locator('[aria-label="Menu"]')
      .or(page.locator('button:has-text("≡")'))
      .or(page.locator('[data-testid="user-menu"]'));

    await menuButton.click();

    // Click en "Cerrar sesión"
    const logoutBtn = page.locator('text=Cerrar sesión')
      .or(page.locator('text=Sign out'))
      .or(page.locator('button:has-text("Logout")'));

    await logoutBtn.click();

    await page.waitForURL('/', { timeout: 5_000 });
  } catch (e) {
    console.warn('⚠️ Logout button not found, navigating to home');
    await page.goto('/');
  }
}
