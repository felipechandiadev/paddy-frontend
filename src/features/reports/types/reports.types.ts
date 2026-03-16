export type ReportGroupBy = 'day' | 'week' | 'month';
export type InterestCalculationMode = 'devengado' | 'liquidado';
export type AdvanceStatusFilter = 'paid' | 'settled' | 'cancelled';
export type DryingReceptionStatusFilter =
  | 'settled'
  | 'analyzed'
  | 'analyzed_settled';

export interface ReportSeasonSummary {
  id: number;
  code: string;
  name: string;
  year: number;
}

export interface ReportAssumptions {
  universe: string;
  fechaCorte?: string;
  ivaMode: string;
  formula: string;
}

export interface DryingReportFilters {
  fechaInicio: string;
  fechaFin: string;
  seasonId?: number;
  producerId?: number;
  riceTypeId?: number;
  receptionStatus?: DryingReceptionStatusFilter;
  groupBy?: ReportGroupBy;
}

export interface DryingReportSummary {
  receptionsWithDryingCount: number;
  affectedPaddyKg: number;
  averageDryPercent: number;
  netDryingRevenue: number;
  estimatedDryingVat: number;
  totalDryingRevenue: number;
  topProducerByDrying: {
    producerId: number;
    producerName: string;
    netDryingRevenue: number;
  } | null;
  topRiceTypeByDrying: {
    riceTypeId: number;
    riceTypeName: string;
    netDryingRevenue: number;
  } | null;
}

export interface DryingReportTrendItem {
  period: string;
  receptionsWithDryingCount: number;
  netDryingRevenue: number;
  estimatedDryingVat: number;
  totalDryingRevenue: number;
}

export interface DryingReportByProducerItem {
  producerId: number;
  producerName: string;
  producerRut: string | null;
  receptionsWithDryingCount: number;
  affectedPaddyKg: number;
  averageDryPercent: number;
  netDryingRevenue: number;
  estimatedDryingVat: number;
  totalDryingRevenue: number;
}

export interface DryingReportByRiceTypeItem {
  riceTypeId: number;
  riceTypeName: string;
  receptionsWithDryingCount: number;
  affectedPaddyKg: number;
  netDryingRevenue: number;
  estimatedDryingVat: number;
  totalDryingRevenue: number;
}

export interface DryingReportDetailItem {
  receptionId: number;
  cutDate: string;
  receptionDate: string;
  guideNumber: string;
  producerName: string;
  producerRut: string | null;
  riceTypeName: string;
  paddyKg: number;
  ricePrice: number;
  dryPercent: number;
  netPaddy: number;
  netDryingRevenue: number;
  estimatedDryingVat: number;
  totalDryingRevenue: number;
  receptionStatus: string;
  settlementId: number | null;
  settlementStatus: string | null;
}

export interface DryingRevenueReportResponse {
  reportName: string;
  period: {
    fechaInicio: string;
    fechaFin: string;
    groupBy: ReportGroupBy;
    receptionStatus: DryingReceptionStatusFilter;
    seasonId: number | null;
    producerId: number | null;
    riceTypeId: number | null;
  };
  season: ReportSeasonSummary | null;
  summary: DryingReportSummary;
  trend: DryingReportTrendItem[];
  byProducer: DryingReportByProducerItem[];
  byRiceType: DryingReportByRiceTypeItem[];
  detail: DryingReportDetailItem[];
  assumptions: ReportAssumptions;
}

export interface FinancialServicesInterestReportFilters {
  fechaInicio: string;
  fechaFin: string;
  seasonId?: number;
  producerId?: number;
  status?: AdvanceStatusFilter;
  calculationMode?: InterestCalculationMode;
  groupBy?: ReportGroupBy;
}

export interface FinancialServicesInterestSummary {
  advancesCount: number;
  capitalPlaced: number;
  averageInterestRate: number;
  accruedInterestNet: number;
  estimatedInterestVat: number;
  totalFinancialRevenue: number;
  settledInterestAmount: number;
  topProducerByInterest: {
    producerId: number;
    producerName: string;
    accruedInterestNet: number;
  } | null;
}

export interface FinancialServicesTrendItem {
  period: string;
  advancesCount: number;
  capitalPlaced: number;
  accruedInterestNet: number;
  estimatedInterestVat: number;
  totalFinancialRevenue: number;
}

export interface FinancialServicesByProducerItem {
  producerId: number;
  producerName: string;
  producerRut: string | null;
  advancesCount: number;
  capitalPlaced: number;
  averageInterestRate: number;
  accruedInterestNet: number;
  estimatedInterestVat: number;
  totalFinancialRevenue: number;
}

export interface FinancialServicesByStatusItem {
  status: string;
  advancesCount: number;
  capitalPlaced: number;
  accruedInterestNet: number;
  estimatedInterestVat: number;
  totalFinancialRevenue: number;
}

export interface FinancialServicesDetailItem {
  advanceId: number;
  periodDate: string;
  issueDate: string | null;
  producerId: number;
  producerName: string;
  producerRut: string | null;
  seasonId: number;
  seasonName: string | null;
  seasonYear: number | null;
  amount: number;
  interestRate: number;
  interestEndDate: string | null;
  accruedDays: number;
  accruedInterestNet: number;
  estimatedInterestVat: number;
  totalFinancialRevenue: number;
  advanceStatus: string;
  settlementId: number | null;
  settlementStatus: string | null;
  referenceCutDate: string;
  calculationMode: InterestCalculationMode;
}

export interface FinancialServicesInterestReportResponse {
  reportName: string;
  period: {
    fechaInicio: string;
    fechaFin: string;
    calculationMode: InterestCalculationMode;
    groupBy: ReportGroupBy;
    seasonId: number | null;
    producerId: number | null;
    status: AdvanceStatusFilter | null;
  };
  season: ReportSeasonSummary | null;
  summary: FinancialServicesInterestSummary;
  trend: FinancialServicesTrendItem[];
  byProducer: FinancialServicesByProducerItem[];
  byStatus: FinancialServicesByStatusItem[];
  detail: FinancialServicesDetailItem[];
  assumptions: ReportAssumptions;
}

export interface VolumePriceReportFilters {
  seasonId: number;
  riceTypeId?: number;
}

export interface VolumePriceMonthlyItem {
  month: string;
  receptions: number;
  grossKg: number;
  netKg: number;
  mermaPct: number;
  avgPricePerKg: number;
  totalPaidNet: number;
}

export interface VolumePriceReportSummary {
  totalGrossKg: number;
  totalNetKg: number;
  mermaPct: number;
  weightedAvgPricePerKg: number;
  totalPaidNet: number;
  totalPaidWithVat: number;
  totalReceptions: number;
  totalProducers: number;
}

export interface VolumePriceReportResponse {
  season: ReportSeasonSummary & {
    startDate: string;
    endDate: string;
  };
  summary: VolumePriceReportSummary;
  monthly: VolumePriceMonthlyItem[];
}

export interface VolumePriceByProducerItem {
  producerId: number;
  producerName: string;
  producerRut: string | null;
  receptions: number;
  grossKg: number;
  netKg: number;
  mermaPct: number;
  avgPricePerKg: number;
  deltaVsSeasonAvg: number;
  totalPaidNet: number;
  participationPct: number;
}

export interface VolumePriceByProducerReportResponse {
  season: ReportSeasonSummary;
  seasonAvgPricePerKg: number;
  totalPurchasedKg: number;
  producers: VolumePriceByProducerItem[];
}

export interface VolumePriceProducerDetailItem {
  receptionId: number;
  receptionDate: string;
  purchaseDate: string | null;
  guideNumber: string;
  riceTypeName: string | null;
  grossKg: number;
  netKg: number;
  mermaPct: number;
  pricePerKg: number;
  totalPaidNet: number;
}

export interface VolumePriceProducerDetailReportResponse {
  season: ReportSeasonSummary;
  producer: {
    id: number;
    name: string;
    rut: string;
  };
  summary: {
    receptions: number;
    grossKg: number;
    netKg: number;
    mermaPct: number;
    avgPricePerKg: number;
    totalPaidNet: number;
  };
  receptions: VolumePriceProducerDetailItem[];
}

// ===== LIBRO DE EXISTENCIAS VIRTUAL =====

export interface InventoryBookBalance {
  deposito: number;
  propio: number;
  total: number;
}

export interface InventoryBookMovementItem {
  date: string;
  movementType: 'RECEPTION' | 'PURCHASE';
  receptionId: number | null;
  receptionBookNumber: string | null;
  rut: string | null;
  producerName: string | null;
  dispatchGuide: string | null;
  receivedKg: number | null;
  purchaseInvoice: string | null;
  purchasedKg: number | null;
  pricePerKg: number | null;
  totalAmount: number | null;
  grossKg: number | null;
  depositoDelta: number;
  propioDelta: number;
}

export interface InventoryBookMonthlyReportResponse {
  month: string;
  season: {
    id: number;
    name: string;
    year: number;
  };
  summary: {
    previousBalance: InventoryBookBalance;
    receivedKg: number;
    purchasedKg: number;
    closingBalance: InventoryBookBalance;
  };
  movements: InventoryBookMovementItem[];
}

export interface InventoryBookSeasonSummaryItem {
  month: string;
  previousBalance: InventoryBookBalance;
  receivedKg: number;
  purchasedKg: number;
  closingBalance: InventoryBookBalance;
}

export interface InventoryBookSeasonSummaryResponse {
  season: ReportSeasonSummary & {
    startDate: string;
    endDate: string;
  };
  monthly: InventoryBookSeasonSummaryItem[];
  totals: {
    receivedKg: number;
    purchasedKg: number;
    closingBalance: InventoryBookBalance;
  };
}

export interface InventoryBookFilters {
  seasonId: number;
  month: string;
}

export interface InventoryBookSeasonFilters {
  seasonId: number;
}

export interface ReportActionResult<T> {
  success: boolean;
  data: T | null;
  error?: string;
}

// ===== PROYECCIÓN DE CAJA =====

export interface CashProjectionSummary {
  totalReceptions: number;
  totalKg: number;
  valorBruto: number;
  cargoSecado: number;
  subtotalAntesAnticipos: number;
  totalAnticipos: number;
  interesAcumulado: number;
  saldoEstimado: number;
  productoresConSaldoNegativo: number;
  productoresCount: number;
}

export interface CashProjectionByProducerItem {
  producerId: number;
  producerName: string;
  producerRut: string | null;
  receptionsCount: number;
  totalKg: number;
  valorBruto: number;
  cargoSecado: number;
  subtotal: number;
  totalAnticipos: number;
  anticiposCount: number;
  interesAcumulado: number;
  saldoEstimado: number;
}

export interface CashProjectionDetailItem {
  receptionId: number;
  guideNumber: string;
  receptionDate: string;
  producerId: number;
  producerName: string;
  producerRut: string | null;
  riceTypeName: string | null;
  kg: number;
  ricePrice: number;
  valorBruto: number;
  dryPercent: number;
  dryFeeApplied: boolean;
  cargoSecado: number;
  subtotal: number;
}

export interface CashProjectionResponse {
  reportName: string;
  season: ReportSeasonSummary | null;
  generatedAt: string;
  summary: CashProjectionSummary;
  byProducer: CashProjectionByProducerItem[];
  detail: CashProjectionDetailItem[];
  assumptions: {
    cutDate: string;
    receptionStatus: string;
    interestMode: string;
    ivaNote: string;
  };
}

export interface CashProjectionFilters {
  seasonId?: number;
}

// ===== REPORTE 3: RENTABILIDAD SERVICIOS FINANCIEROS =====

export interface FinancialProfitabilityFilters {
  seasonId: number;
  cutoffDate?: string;
  producerId?: number;
  calculationMode?: InterestCalculationMode;
}

export interface FinancialProfitabilitySummary {
  advancesCount: number;
  capitalPlaced: number;
  interestAtCutoff: number;
  projectedSeasonInterest: number;
  progressPct: number;
  capitalYieldPct: number;
  estimatedInterestVat: number;
  totalFinancialRevenue: number;
}

export interface FinancialProfitabilityGauge {
  current: number;
  target: number;
  percent: number;
  status: 'critical' | 'warning' | 'good' | 'excellent';
}

export interface FinancialProfitabilityByProducerItem {
  producerId: number;
  producerName: string;
  producerRut: string | null;
  advancesCount: number;
  capitalPlaced: number;
  interestAtCutoff: number;
  projectedInterest: number;
  progressPct: number;
  participationPct: number;
}

export interface FinancialProfitabilityReportResponse {
  reportName: string;
  period: {
    seasonId: number;
    producerId: number | null;
    cutoffDate: string;
    seasonEndDate: string;
    calculationMode: InterestCalculationMode;
  };
  season: ReportSeasonSummary;
  summary: FinancialProfitabilitySummary;
  gauge: FinancialProfitabilityGauge;
  byProducer: FinancialProfitabilityByProducerItem[];
  assumptions: ReportAssumptions;
}

// ===== REPORTE 4: RETORNO DE PRESUPUESTO =====

export interface BudgetReturnFilters {
  fechaInicio: string;
  fechaFin: string;
  seasonId?: number;
  producerId?: number;
}

export interface BudgetReturnSummary {
  capitalDisbursed: number;
  capitalRecovered: number;
  pendingCapital: number;
  recoveryRatePct: number;
  netExposure: number;
  movementsCount: number;
}

export interface BudgetReturnWaterfallStep {
  step: string;
  type: 'start' | 'recovery' | 'end';
  amount: number;
  cumulative: number;
}

export interface BudgetReturnMonthlyItem {
  month: string;
  advancesCount: number;
  disbursedAmount: number;
  recoveriesCount: number;
  recoveredAmount: number;
  cumulativeDisbursed: number;
  cumulativeRecovered: number;
  pendingBalance: number;
  recoveryRatePct: number;
}

export interface BudgetReturnDetailItem {
  date: string;
  month: string;
  movementType: 'advance' | 'recovery';
  referenceId: number;
  producerId: number | null;
  producerName: string;
  producerRut: string | null;
  amount: number;
  settlementStatus: string | null;
}

export interface BudgetReturnReportResponse {
  reportName: string;
  period: {
    fechaInicio: string;
    fechaFin: string;
    seasonId: number | null;
    producerId: number | null;
  };
  season: ReportSeasonSummary | null;
  summary: BudgetReturnSummary;
  waterfall: BudgetReturnWaterfallStep[];
  monthly: BudgetReturnMonthlyItem[];
  detail: BudgetReturnDetailItem[];
  assumptions: ReportAssumptions;
}

// ===== REPORTE 5: RENDIMIENTO DE PROCESO =====

export interface ProcessYieldFilters {
  seasonId: number;
  fechaInicio?: string;
  fechaFin?: string;
  producerId?: number;
  riceTypeId?: number;
  groupBy?: ReportGroupBy;
}

export interface ProcessYieldSummary {
  receptionsCount: number;
  totalGrossKg: number;
  totalNetKg: number;
  totalShrinkageKg: number;
  processYieldPct: number;
  impuritiesLossKg: number;
  vanoLossKg: number;
  humidityLossKg: number;
  impuritiesLossPct: number;
  vanoLossPct: number;
  humidityLossPct: number;
}

export interface ProcessYieldSankeyNode {
  id: string;
  name: string;
}

export interface ProcessYieldSankeyLink {
  source: string;
  target: string;
  value: number;
}

export interface ProcessYieldMonthlyItem {
  period: string;
  receptions: number;
  grossKg: number;
  netKg: number;
  shrinkageKg: number;
  processYieldPct: number;
  impuritiesLossKg: number;
  vanoLossKg: number;
  humidityLossKg: number;
}

export interface ProcessYieldByProducerItem {
  producerId: number;
  producerName: string;
  producerRut: string | null;
  receptions: number;
  grossKg: number;
  netKg: number;
  shrinkageKg: number;
  processYieldPct: number;
  impuritiesLossKg: number;
  vanoLossKg: number;
  humidityLossKg: number;
}

export interface ProcessYieldDetailItem {
  receptionId: number;
  receptionDate: string;
  guideNumber: string;
  producerId: number;
  producerName: string;
  producerRut: string | null;
  riceTypeName: string | null;
  grossKg: number;
  netKg: number;
  shrinkageKg: number;
  processYieldPct: number;
  impuritiesPct: number;
  vanoPct: number;
  humidityPct: number;
  impuritiesLossKg: number;
  vanoLossKg: number;
  humidityLossKg: number;
  receptionStatus: string;
}

export interface ProcessYieldReportResponse {
  reportName: string;
  period: {
    seasonId: number;
    fechaInicio: string | null;
    fechaFin: string | null;
    producerId: number | null;
    riceTypeId: number | null;
    groupBy: ReportGroupBy;
  };
  season: ReportSeasonSummary;
  summary: ProcessYieldSummary;
  sankey: {
    nodes: ProcessYieldSankeyNode[];
    links: ProcessYieldSankeyLink[];
  };
  monthly: ProcessYieldMonthlyItem[];
  byProducer: ProcessYieldByProducerItem[];
  detail: ProcessYieldDetailItem[];
  assumptions: ReportAssumptions;
}

