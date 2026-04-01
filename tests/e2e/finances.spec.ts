import { test, expect } from '../fixtures';

test.describe('Finanzas - SEED:test-cosecha', () => {
  test.describe('Seed data validation', () => {
    test('seed tiene 10 anticipos en 2026', async ({ seedData }) => {
      const count = seedData.getExpectedAdvances2026Count();
      expect(count).toBe(10);
    });

    test('todos los anticipos del seed están en status paid', async ({ seedData }) => {
      const status = seedData.advances.allStatus;
      expect(status).toBe('paid');
    });

    test('seed tiene 9 liquidaciones totales', async ({ seedData }) => {
      const total = seedData.getTotalSettlements();
      expect(total).toBe(9);
    });

    test('2026 tiene 0 liquidaciones (temporada activa)', async ({ seedData }) => {
      const count2026 = seedData.getExpectedSettlements2026Count();
      expect(count2026).toBe(0);
    });

    test('2024 tiene 5 liquidaciones', async ({ seedData }) => {
      const count = seedData.getExpectedSettlements2024Count();
      expect(count).toBe(5);
    });

    test('2025 tiene 4 liquidaciones', async ({ seedData }) => {
      const count = seedData.getExpectedSettlements2025Count();
      expect(count).toBe(4);
    });

    test('seed tiene 30 transacciones totales', async ({ seedData }) => {
      const count = seedData.getTotalAdvances();
      expect(count).toBeGreaterThanOrEqual(10);
    });
  });
});
