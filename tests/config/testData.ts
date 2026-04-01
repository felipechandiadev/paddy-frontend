// Test data derived from seed:test-cosecha
export const testData = {
  api: {
    baseUrl: 'http://localhost:3000/api/v1',
  },
  auth: {
    admin: {
      email: 'admin@ayg.cl',
      password: '098098',
      role: 'ADMIN',
      userId: 1,
    },
    consultant: {
      email: 'consultor@ayg.cl',
      password: '098098',
      role: 'CONSULTANT',
      userId: 2,
    },
  },
  seasons: {
    active: {
      id: 3,
      code: 'COSECHA_2026',
      year: 2026,
      startDate: '2026-01-01',
      endDate: '2026-12-31',
    },
    inactive2025: {
      id: 2,
      code: 'COSECHA_2025',
      year: 2025,
    },
    inactive2024: {
      id: 1,
      code: 'COSECHA_2024',
      year: 2024,
    },
  },
  producers: [
    {
      id: 1,
      name: 'Agrícola San Pedro LTDA',
      rut: '78956452-1',
      city: 'Parral',
      bank: 'Banco del Estado de Chile',
    },
    {
      id: 2,
      name: 'Sociedad Agrícola Los Robles',
      rut: '65432198-9',
      city: 'Parral',
      bank: 'Banco Santander',
    },
    {
      id: 3,
      name: 'Cooperativa Agrícola Los Molinos',
      rut: '87654321-2',
      city: 'San Javier',
      bank: 'Banco Itaú',
    },
    {
      id: 4,
      name: 'Empresa Agrícola La Esperanza',
      rut: '12345678-5',
      city: 'Chillán',
      bank: 'Banco de Crédito e Inversiones',
    },
    {
      id: 5,
      name: 'Fundo Las Delicias',
      rut: '98765432-1',
      city: 'Parral',
      bank: 'Scotiabank',
    },
  ],
  riceTypes: [
    {
      id: 1,
      name: 'DIAMANTE',
      code: 'DIAMANTE',
    },
    {
      id: 2,
      name: 'ZAFIRO',
      code: 'ZAFIRO',
    },
    {
      id: 3,
      name: 'BRILLANTE',
      code: 'BRILLANTE',
    },
    {
      id: 4,
      name: 'HARPER',
      code: 'HARPER',
    },
  ],
  receptions: {
    count: 30, // 10 per season
    allStatus: 'analyzed',
    perSeason: 10,
  },
  advances: {
    count: 30, // 10 per season
    allStatus: 'paid',
    perSeason: 10,
  },
  settlements: {
    count: 9,
    by2024: 5,
    by2025: 4,
    by2026: 0,
  },
  template: {
    analysisParams: {
      humedad: { min: 10, max: 20 },
      secado: { min: 0, max: 5 },
      granosVerdes: { min: 0, max: 5 },
      granosYesosos: { min: 0, max: 5 },
      granosPelados: { min: 0, max: 3 },
    },
  },
};
