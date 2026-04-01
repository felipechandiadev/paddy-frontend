import { test, expect } from '../fixtures';
import { testData } from '../config/testData';

test.describe('Autenticación - SEED:test-cosecha', () => {
  test('debe cargar la página principal', async ({ page }) => {
    await page.goto('http://localhost:3001/', { waitUntil: 'domcontentloaded' });
    expect(page.url()).toContain('localhost:3001');
  });

  test('credenciales del seed existen - admin@ayg.cl / 098098', async ({ seedData }) => {
    const admin = seedData.getAdminEmail();
    const pass = seedData.getAdminPassword();
    expect(admin).toBe('admin@ayg.cl');
    expect(pass).toBe('098098');
  });

  test('credenciales del seed existen - consultor@ayg.cl / 098098', async ({ seedData }) => {
    const consultant = seedData.getConsultantEmail();
    const pass = seedData.getConsultantPassword();
    expect(consultant).toBe('consultor@ayg.cl');
    expect(pass).toBe('098098');
  });

  test('datos del seed están cargados en testData', async ({ seedData }) => {
    expect(seedData.getTotalProducers()).toBe(5);
    expect(seedData.getTotalRiceTypes()).toBe(4);
  });

  test('temporada activa es 2026', async ({ seedData }) => {
    const activeSeason = seedData.getActiveSeason();
    expect(activeSeason.year).toBe(2026);
    expect(activeSeason.id).toBe(3);
  });

  test('seed tiene 30 recepciones totales (10 por temporada)', async ({ seedData }) => {
    expect(seedData.getTotalReceptions()).toBe(30);
  });
});
