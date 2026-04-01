import { test as base } from '@playwright/test';
import { testData } from '../config/testData';

export const dataFixtures = base.extend({
  seedData: async ({}, use) => {
    // Exponer datos del seed para acceso en tests
    const helpers = {
      // Usuarios
      getAdminEmail: () => testData.auth.admin.email,
      getAdminPassword: () => testData.auth.admin.password,
      getConsultantEmail: () => testData.auth.consultant.email,
      getConsultantPassword: () => testData.auth.consultant.password,

      // Productores (5 total)
      getProducerByIndex: (index: number) => testData.producers[index % 5],
      getProducerById: (id: number) => testData.producers.find((p) => p.id === id),
      getAllProducers: () => testData.producers,
      getTotalProducers: () => 5,

      // Tipos de arroz (4 total)
      getRiceTypeByIndex: (index: number) => testData.riceTypes[index % 4],
      getRiceTypeById: (id: number) => testData.riceTypes.find((r) => r.id === id),
      getAllRiceTypes: () => testData.riceTypes,
      getTotalRiceTypes: () => 4,

      // Temporadas
      getActiveSeason: () => testData.seasons.active,
      getInactiveSeasons: () => [
        testData.seasons.inactive2024,
        testData.seasons.inactive2025,
      ],

      // Datos esperados de recepciones del seed
      getExpectedReceptions2026Count: () => 10,
      getExpectedAdvances2026Count: () => 10,
      getExpectedSettlements2024Count: () => 5,
      getExpectedSettlements2025Count: () => 4,
      getExpectedSettlements2026Count: () => 0, // Temporada activa, sin liquidaciones

      // Stats del seed completo
      getTotalReceptions: () => 30, // 10x3 temporadas
      getTotalAdvances: () => 30, // 10x3 temporadas
      getTotalSettlements: () => 9, // 5 (2024) + 4 (2025) + 0 (2026)

      // Template
      getDefaultTemplate: () => testData.template,
    };

    await use(helpers);
  },
});
