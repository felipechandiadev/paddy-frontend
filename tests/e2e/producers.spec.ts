import { test, expect } from '../fixtures';

test.describe('Productores - SEED:test-cosecha', () => {
  test('seed tiene 5 productores', async ({ seedData }) => {
    const producers = seedData.getAllProducers();
    expect(producers).toHaveLength(5);
  });

  test('primer productor es Agrícola San Pedro LTDA', async ({ seedData }) => {
    const producer = seedData.getProducerById(1);
    expect(producer?.name).toBe('Agrícola San Pedro LTDA');
  });

  test('segundo productor es Sociedad Agrícola Los Robles', async ({ seedData }) => {
    const producer = seedData.getProducerById(2);
    expect(producer?.name).toBe('Sociedad Agrícola Los Robles');
  });

  test('cada productor tiene rut, nombre, ciudad y banco', async ({ seedData }) => {
    const producers = seedData.getAllProducers();
    
    producers.forEach((producer) => {
      expect(producer.id).toBeDefined();
      expect(producer.name).toBeTruthy();
      expect(producer.rut).toBeTruthy();
      expect(producer.city).toBeTruthy();
      expect(producer.bank).toBeTruthy();
    });
  });

  test('todos los productores tienen RUT válido', async ({ seedData }) => {
    const producers = seedData.getAllProducers();
    
    producers.forEach((producer) => {
      // Validar formato XX.XXX.XXX-X o sin puntos
      expect(producer.rut).toMatch(/\d{2}\.?\d{3}\.?\d{3}-\d/);
    });
  });

  test('productores tienen bancos asignados', async ({ seedData }) => {
    const producers = seedData.getAllProducers();
    const banks = producers.map(p => p.bank);
    
    expect(banks).toContain('Banco del Estado de Chile');
    expect(banks).toContain('Banco Santander');
    expect(banks).toContain('Banco Itaú');
  });

  test('frontend carga correctamente en port 3001', async ({ page }) => {
    await page.goto('http://localhost:3001/', { waitUntil: 'domcontentloaded' });
    expect(page.url()).toContain('localhost:3001');
  });
});
