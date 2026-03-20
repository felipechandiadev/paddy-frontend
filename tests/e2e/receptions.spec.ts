import { test, expect } from '../fixtures';

test.describe('Recepciones - SEED:test-cosecha', () => {
  test('seed genera 10 recepciones en 2026', async ({ seedData }) => {
    const count = seedData.getExpectedReceptions2026Count();
    expect(count).toBe(10);
  });

  test('todas las recepciones del seed están en status analyzed', async ({ seedData }) => {
    const status = seedData.receptions.allStatus;
    expect(status).toBe('analyzed');
  });

  test('seed tiene 5 productores activos', async ({ seedData }) => {
    const producers = seedData.getAllProducers();
    expect(producers).toHaveLength(5);
  });

  test('cada productor del seed tiene dato básico (id, name, rut)', async ({ seedData }) => {
    const producers = seedData.getAllProducers();
    
    producers.forEach((producer) => {
      expect(producer.id).toBeDefined();
      expect(producer.name).toBeDefined();
      expect(producer.rut).toBeDefined();
    });
  });

  test('primer productor del seed es Agrícola San Pedro LTDA', async ({ seedData }) => {
    const producer = seedData.getProducerById(1);
    expect(producer?.name).toBe('Agrícola San Pedro LTDA');
    expect(producer?.rut).toBe('78956452-1');
  });

  test('frontend se puede cargar en localhost:3001', async ({ page }) => {
    await page.goto('http://localhost:3001/', { waitUntil: 'domcontentloaded' });
    expect(page.url()).toContain('localhost:3001');
  });
});
