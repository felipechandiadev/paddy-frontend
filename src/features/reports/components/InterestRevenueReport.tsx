'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { signOut } from 'next-auth/react';
import { useReactToPrint } from 'react-to-print';
import { TextField } from '@/shared/components/ui/TextField/TextField';
import AutoComplete, {
  Option as AutoCompleteOption,
} from '@/shared/components/ui/AutoComplete/AutoComplete';
import Select from '@/shared/components/ui/Select/Select';
import IconButton from '@/shared/components/ui/IconButton/IconButton';
import Alert from '@/shared/components/ui/Alert/Alert';
import { fetchFinancialServicesInterestReport } from '../actions/reports.action';
import {
  FinancialServicesByProducerItem,
  FinancialServicesByStatusItem,
  FinancialServicesDetailItem,
  FinancialServicesInterestReportResponse,
  FinancialServicesTrendItem,
  FinancialServicesInterestReportFilters,
  ReportGroupBy,
} from '../types/reports.types';
import {
  AdvanceProducerOption,
  AdvanceSeasonOption,
} from '@/features/finances/types/finances.types';
import PrintableReportTable, {
  PrintableReportTableColumn,
} from './common/PrintableReportTable';
import ReportSummaryCard from './common/ReportSummaryCard';
import InterestRevenueTrendChart from './common/InterestRevenueTrendChart';
import {
  formatDateValue,
  INTEREST_CALCULATION_OPTIONS,
  INTEREST_STATUS_OPTIONS,
  mapProducerOptions,
  mapSeasonOptions,
  normalizeStatusLabel,
  REPORT_GROUP_BY_LABELS,
  REPORT_GROUP_BY_OPTIONS,
  toAdvanceStatusFilter,
  toInterestCalculationMode,
  toOptionalNumber,
} from './common/reportUtils';

interface InterestRevenueReportProps {
  seasons: AdvanceSeasonOption[];
  producers: AdvanceProducerOption[];
  initialStartDate: string;
  initialEndDate: string;
  initialSeasonId?: number;
  initialPrintDateLabel: string;
}

function toDateInputValue(rawValue?: string | null): string | null {
  if (!rawValue) {
    return null;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(rawValue)) {
    return rawValue;
  }

  const parsed = new Date(rawValue);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function toDateOnly(rawValue?: string | Date | null): Date | null {
  if (!rawValue) {
    return null;
  }

  if (rawValue instanceof Date) {
    if (Number.isNaN(rawValue.getTime())) {
      return null;
    }

    return new Date(
      rawValue.getFullYear(),
      rawValue.getMonth(),
      rawValue.getDate(),
      12,
      0,
      0,
      0,
    );
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(rawValue)) {
    const [year, month, day] = rawValue.split('-').map(Number);
    return new Date(year, month - 1, day, 12, 0, 0, 0);
  }

  const parsed = new Date(rawValue);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return new Date(
    parsed.getFullYear(),
    parsed.getMonth(),
    parsed.getDate(),
    12,
    0,
    0,
    0,
  );
}

function toDayKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function toMonthKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');

  return `${year}-${month}`;
}

function toIsoWeekKey(date: Date): string {
  const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNr = (target.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNr + 3);

  const isoYear = target.getUTCFullYear();
  const firstThursday = new Date(Date.UTC(isoYear, 0, 4));
  const firstDayNr = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDayNr + 3);

  const week =
    1 + Math.round((target.getTime() - firstThursday.getTime()) / 604800000);

  return `${isoYear}-W${String(week).padStart(2, '0')}`;
}

function toPeriodKey(date: Date, groupBy: ReportGroupBy): string {
  if (groupBy === 'day') {
    return toDayKey(date);
  }

  if (groupBy === 'week') {
    return toIsoWeekKey(date);
  }

  return toMonthKey(date);
}

function startOfPeriod(date: Date, groupBy: ReportGroupBy): Date {
  const base = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0);

  if (groupBy === 'day') {
    return base;
  }

  if (groupBy === 'week') {
    const day = (base.getDay() + 6) % 7;
    base.setDate(base.getDate() - day);
    return base;
  }

  return new Date(base.getFullYear(), base.getMonth(), 1, 12, 0, 0, 0);
}

function addPeriod(date: Date, groupBy: ReportGroupBy): Date {
  const next = new Date(date.getTime());

  if (groupBy === 'day') {
    next.setDate(next.getDate() + 1);
    return next;
  }

  if (groupBy === 'week') {
    next.setDate(next.getDate() + 7);
    return next;
  }

  next.setMonth(next.getMonth() + 1);
  return next;
}

function buildPeriodSequence(
  startRaw: string,
  endRaw: string,
  groupBy: ReportGroupBy,
): string[] {
  const startDate = toDateOnly(startRaw);
  const endDate = toDateOnly(endRaw);

  if (!startDate || !endDate || startDate > endDate) {
    return [];
  }

  const firstPeriod = startOfPeriod(startDate, groupBy);
  const lastPeriod = startOfPeriod(endDate, groupBy);
  const periods: string[] = [];

  let cursor = firstPeriod;

  while (cursor <= lastPeriod) {
    periods.push(toPeriodKey(cursor, groupBy));
    cursor = addPeriod(cursor, groupBy);
  }

  return periods;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

const ALL_PRODUCERS_OPTION: AutoCompleteOption = {
  id: '',
  label: 'Todos',
};

const InterestRevenueReport: React.FC<InterestRevenueReportProps> = ({
  seasons,
  producers,
  initialStartDate,
  initialEndDate,
  initialSeasonId,
  initialPrintDateLabel,
}) => {
  const reportPrintRef = useRef<HTMLDivElement>(null);

  const [filters, setFilters] = useState<FinancialServicesInterestReportFilters>({
    fechaInicio: initialStartDate,
    fechaFin: initialEndDate,
    seasonId: initialSeasonId,
    calculationMode: 'devengado',
    groupBy: 'month',
  });
  const [report, setReport] = useState<FinancialServicesInterestReportResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }),
    [],
  );

  const numberFormatter = useMemo(
    () =>
      new Intl.NumberFormat('es-CL', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }),
    [],
  );

  const percentFormatter = useMemo(
    () =>
      new Intl.NumberFormat('es-CL', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }),
    [],
  );

  const seasonOptions = useMemo(() => mapSeasonOptions(seasons), [seasons]);
  const seasonsById = useMemo(() => {
    const map = new Map<
      number,
      {
        startDate: string | null;
        endDate: string | null;
      }
    >();

    for (const season of seasons) {
      map.set(season.id, {
        startDate: toDateInputValue(season.startDate),
        endDate: toDateInputValue(season.endDate),
      });
    }

    return map;
  }, [seasons]);
  const producerOptions = useMemo<AutoCompleteOption[]>(
    () => [ALL_PRODUCERS_OPTION, ...mapProducerOptions(producers)],
    [producers],
  );
  const selectedProducerOption = useMemo<AutoCompleteOption | null>(() => {
    if (!filters.producerId) {
      return null;
    }

    return producerOptions.find((option) => option.id === filters.producerId) ?? null;
  }, [filters.producerId, producerOptions]);
  const interestCalculationModeLabels = useMemo(
    () => ({
      devengado: 'Devengado',
      liquidado: 'Liquidado',
    }),
    [],
  );

  const runReport = useCallback(async () => {
    if (!filters.fechaInicio || !filters.fechaFin) {
      setError('Debes seleccionar fecha inicio y fecha fin para ejecutar el reporte.');
      return;
    }

    setLoading(true);
    setError(null);

    const result = await fetchFinancialServicesInterestReport({
      fechaInicio: filters.fechaInicio,
      fechaFin: filters.fechaFin,
      seasonId: filters.seasonId,
      producerId: filters.producerId,
      status: filters.status,
      calculationMode: filters.calculationMode,
      groupBy: filters.groupBy,
    });

    if (!result.success || !result.data) {
      if (result.error === 'SESSION_EXPIRED') {
        setReport(null);
        setError('Tu sesión expiró. Serás redirigido al inicio de sesión.');
        setLoading(false);
        await signOut({ callbackUrl: '/' });
        return;
      }

      setReport(null);
      setError(result.error || 'No fue posible generar el reporte de recaudación por intereses.');
      setLoading(false);
      return;
    }

    setReport(result.data);
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    if (!report && !loading && !error) {
      void runReport();
    }
  }, [error, loading, report, runReport]);

  const trendColumns = useMemo<PrintableReportTableColumn<FinancialServicesTrendItem>[]>(
    () => [
      {
        key: 'period',
        label: 'Periodo',
        render: (row) => row.period,
      },
      {
        key: 'advancesCount',
        label: 'Anticipos',
        align: 'right',
        render: (row) => numberFormatter.format(row.advancesCount),
      },
      {
        key: 'capitalPlaced',
        label: 'Capital',
        align: 'right',
        render: (row) => currencyFormatter.format(row.capitalPlaced),
      },
      {
        key: 'accruedInterestNet',
        label: 'Interés Neto',
        align: 'right',
        render: (row) => currencyFormatter.format(row.accruedInterestNet),
      },
      {
        key: 'estimatedInterestVat',
        label: 'IVA Estimado',
        align: 'right',
        render: (row) => currencyFormatter.format(row.estimatedInterestVat),
      },
      {
        key: 'totalFinancialRevenue',
        label: 'Total Financiero',
        align: 'right',
        render: (row) => currencyFormatter.format(row.totalFinancialRevenue),
      },
    ],
    [currencyFormatter, numberFormatter],
  );

  const trendRows = useMemo<FinancialServicesTrendItem[]>(() => {
    if (!report) {
      return [];
    }

    const buckets = new Map<string, FinancialServicesTrendItem>();

    for (const item of report.detail) {
      const periodDate = toDateOnly(item.periodDate ?? item.referenceCutDate);

      if (!periodDate) {
        continue;
      }

      const key = toPeriodKey(periodDate, report.period.groupBy);
      const current = buckets.get(key) ?? {
        period: key,
        advancesCount: 0,
        capitalPlaced: 0,
        accruedInterestNet: 0,
        estimatedInterestVat: 0,
        totalFinancialRevenue: 0,
      };

      current.advancesCount += 1;
      current.capitalPlaced += Number(item.amount ?? 0);
      current.accruedInterestNet += Number(item.accruedInterestNet ?? 0);
      current.estimatedInterestVat += Number(item.estimatedInterestVat ?? 0);
      current.totalFinancialRevenue += Number(item.totalFinancialRevenue ?? 0);

      buckets.set(key, current);
    }

    const periodSequence = buildPeriodSequence(
      report.period.fechaInicio,
      report.period.fechaFin,
      report.period.groupBy,
    );

    const periodSet = new Set(periodSequence);
    const extraPeriods = Array.from(buckets.keys())
      .filter((period) => !periodSet.has(period))
      .sort((a, b) => a.localeCompare(b));

    const orderedPeriods = [...periodSequence, ...extraPeriods];

    return orderedPeriods.map((period) => {
      const bucket = buckets.get(period);

      if (!bucket) {
        return {
          period,
          advancesCount: 0,
          capitalPlaced: 0,
          accruedInterestNet: 0,
          estimatedInterestVat: 0,
          totalFinancialRevenue: 0,
        };
      }

      return {
        period: bucket.period,
        advancesCount: bucket.advancesCount,
        capitalPlaced: round2(bucket.capitalPlaced),
        accruedInterestNet: round2(bucket.accruedInterestNet),
        estimatedInterestVat: round2(bucket.estimatedInterestVat),
        totalFinancialRevenue: round2(bucket.totalFinancialRevenue),
      };
    });
  }, [report]);

  const byProducerColumns = useMemo<PrintableReportTableColumn<FinancialServicesByProducerItem>[]>(
    () => [
      {
        key: 'producerName',
        label: 'Productor',
        render: (row) => row.producerName,
      },
      {
        key: 'producerRut',
        label: 'RUT',
        render: (row) => row.producerRut || '-',
      },
      {
        key: 'advancesCount',
        label: 'Anticipos',
        align: 'right',
        render: (row) => numberFormatter.format(row.advancesCount),
      },
      {
        key: 'capitalPlaced',
        label: 'Capital',
        align: 'right',
        render: (row) => currencyFormatter.format(row.capitalPlaced),
      },
      {
        key: 'averageInterestRate',
        label: 'Tasa Promedio',
        align: 'right',
        render: (row) => `${percentFormatter.format(row.averageInterestRate)}%`,
      },
      {
        key: 'accruedInterestNet',
        label: 'Interés Neto',
        align: 'right',
        render: (row) => currencyFormatter.format(row.accruedInterestNet),
      },
      {
        key: 'estimatedInterestVat',
        label: 'IVA Estimado',
        align: 'right',
        render: (row) => currencyFormatter.format(row.estimatedInterestVat),
      },
      {
        key: 'totalFinancialRevenue',
        label: 'Total Financiero',
        align: 'right',
        render: (row) => currencyFormatter.format(row.totalFinancialRevenue),
      },
    ],
    [currencyFormatter, numberFormatter, percentFormatter],
  );

  const byStatusColumns = useMemo<PrintableReportTableColumn<FinancialServicesByStatusItem>[]>(
    () => [
      {
        key: 'status',
        label: 'Estado',
        render: (row) => normalizeStatusLabel(row.status),
      },
      {
        key: 'advancesCount',
        label: 'Anticipos',
        align: 'right',
        render: (row) => numberFormatter.format(row.advancesCount),
      },
      {
        key: 'capitalPlaced',
        label: 'Capital',
        align: 'right',
        render: (row) => currencyFormatter.format(row.capitalPlaced),
      },
      {
        key: 'accruedInterestNet',
        label: 'Interés Neto',
        align: 'right',
        render: (row) => currencyFormatter.format(row.accruedInterestNet),
      },
      {
        key: 'estimatedInterestVat',
        label: 'IVA Estimado',
        align: 'right',
        render: (row) => currencyFormatter.format(row.estimatedInterestVat),
      },
      {
        key: 'totalFinancialRevenue',
        label: 'Total Financiero',
        align: 'right',
        render: (row) => currencyFormatter.format(row.totalFinancialRevenue),
      },
    ],
    [currencyFormatter, numberFormatter],
  );

  const detailColumns = useMemo<PrintableReportTableColumn<FinancialServicesDetailItem>[]>(
    () => [
      {
        key: 'periodDate',
        label: 'Fecha Corte',
        render: (row) => formatDateValue(row.periodDate),
      },
      {
        key: 'issueDate',
        label: 'Fecha Emisión',
        render: (row) => formatDateValue(row.issueDate),
      },
      {
        key: 'advanceId',
        label: 'Folio',
        render: (row) => row.advanceId,
      },
      {
        key: 'producerName',
        label: 'Productor',
        render: (row) => row.producerName,
      },
      {
        key: 'seasonName',
        label: 'Temporada',
        render: (row) => row.seasonName || '-',
      },
      {
        key: 'amount',
        label: 'Capital',
        align: 'right',
        render: (row) => currencyFormatter.format(row.amount),
      },
      {
        key: 'interestRate',
        label: 'Tasa %',
        align: 'right',
        render: (row) => `${percentFormatter.format(row.interestRate)}%`,
      },
      {
        key: 'accruedDays',
        label: 'Días',
        align: 'right',
        render: (row) => numberFormatter.format(row.accruedDays),
      },
      {
        key: 'accruedInterestNet',
        label: 'Interés Neto',
        align: 'right',
        render: (row) => currencyFormatter.format(row.accruedInterestNet),
      },
      {
        key: 'estimatedInterestVat',
        label: 'IVA Interés',
        align: 'right',
        render: (row) => currencyFormatter.format(row.estimatedInterestVat),
      },
      {
        key: 'totalFinancialRevenue',
        label: 'Total Financiero',
        align: 'right',
        render: (row) => currencyFormatter.format(row.totalFinancialRevenue),
      },
      {
        key: 'advanceStatus',
        label: 'Estado Anticipo',
        render: (row) => normalizeStatusLabel(row.advanceStatus),
      },
      {
        key: 'settlementStatus',
        label: 'Estado Liquidación',
        render: (row) => normalizeStatusLabel(row.settlementStatus),
      },
    ],
    [currencyFormatter, numberFormatter, percentFormatter],
  );

  const selectedProducer = useMemo(
    () =>
      report?.period.producerId
        ? producers.find((producer) => producer.id === report.period.producerId) ?? null
        : null,
    [report, producers],
  );

  const handlePrint = useReactToPrint({
    contentRef: reportPrintRef,
    documentTitle: report
      ? `interest-revenue-${report.period.fechaInicio}-${report.period.fechaFin}`
      : 'interest-revenue',
    pageStyle: `
      @page {
        margin: 12mm;
      }
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    `,
  });

  return (
    <section className="space-y-6 rounded-xl bg-white p-6">
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Recaudación por Intereses</h2>
          <p className="text-sm text-neutral-600">
            Consolidado de ingresos financieros por anticipos con vista devengada o liquidada.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 items-end md:grid-cols-2 xl:grid-cols-3 print:hidden">
        <TextField
          label="Fecha inicio"
          type="date"
          value={filters.fechaInicio}
          onChange={(event) =>
            setFilters((prev) => ({
              ...prev,
              fechaInicio: event.target.value,
            }))
          }
        />
        <TextField
          label="Fecha fin"
          type="date"
          value={filters.fechaFin}
          onChange={(event) =>
            setFilters((prev) => ({
              ...prev,
              fechaFin: event.target.value,
            }))
          }
        />
        <Select
          label="Temporada"
          options={seasonOptions}
          value={filters.seasonId ?? null}
          onChange={(value) => {
            const seasonId = toOptionalNumber(value);
            const selectedSeason = seasonId ? seasonsById.get(seasonId) : null;

            setFilters((prev) => ({
              ...prev,
              seasonId,
              fechaInicio: selectedSeason?.startDate ?? prev.fechaInicio,
              fechaFin: selectedSeason?.endDate ?? prev.fechaFin,
            }));
          }}
          allowClear={true}
          placeholder="Todas"
        />
        <AutoComplete
          label="Productor"
          options={producerOptions}
          value={selectedProducerOption}
          onChange={(option) =>
            setFilters((prev) => ({
              ...prev,
              producerId: toOptionalNumber(option?.id ?? null),
            }))
          }
          placeholder="Todos"
        />
        <Select
          label="Modo de cálculo"
          options={INTEREST_CALCULATION_OPTIONS}
          value={filters.calculationMode ?? 'devengado'}
          onChange={(value) =>
            setFilters((prev) => ({
              ...prev,
              calculationMode: toInterestCalculationMode(value),
            }))
          }
        />
        <Select
          label="Estado anticipo"
          options={INTEREST_STATUS_OPTIONS}
          value={filters.status ?? null}
          onChange={(value) =>
            setFilters((prev) => ({
              ...prev,
              status: toAdvanceStatusFilter(value),
            }))
          }
          allowClear={true}
          placeholder="Todos"
        />
        <Select
          label="Agrupar por"
          options={REPORT_GROUP_BY_OPTIONS}
          value={filters.groupBy ?? 'month'}
          onChange={(value) =>
            setFilters((prev) => ({
              ...prev,
              groupBy: (value || 'month') as ReportGroupBy,
            }))
          }
        />
      </div>

      <div className="flex justify-end gap-2 print:hidden">
        <IconButton
          icon="print"
          variant="basicSecondary"
          disabled={!report || loading}
          onClick={handlePrint}
          ariaLabel="Imprimir"
        />
        <IconButton
          icon="bar_chart"
          variant="ghost"
          isLoading={loading}
          onClick={() => void runReport()}
          ariaLabel="Generar Reporte"
        />
      </div>

      {error ? <Alert variant="error">{error}</Alert> : null}
      {!error && report && report.summary.advancesCount === 0 ? (
        <Alert variant="info">
          No se encontraron ingresos por intereses para los filtros seleccionados. Prueba
          ampliando el rango de fechas o ajustando temporada/productor/estado.
        </Alert>
      ) : null}

      {report ? (
        <div ref={reportPrintRef} className="space-y-6">
          <div className="rounded-xl bg-neutral-50 p-5 print:rounded-none print:bg-white print:p-0">
            <div className="pb-4 print:pb-3">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <p className="m-0 text-[9px] uppercase tracking-[0.08em] text-neutral-500">
                    Sociedad Comercial e Industrial
                  </p>
                  <h3 className="m-0 mt-1 text-[22px] font-extrabold leading-[1.1] text-neutral-900">
                    Aparicio y Garcia Ltda
                  </h3>
                  <p className="m-0 text-[10px] text-neutral-600">Panamericana Sur km 342</p>
                  <p className="m-0 text-[10px] text-neutral-600">Parral, Chile</p>
                </div>

                <div className="text-right">
                  <h2 className="m-0 text-[23px] font-black leading-none text-blue-900">
                    Recaudación por Intereses
                  </h2>
                  <p className="m-0 mt-2 text-[11px] font-semibold text-neutral-800">
                    Fecha: {initialPrintDateLabel}
                  </p>
                </div>
              </div>

              <div className="my-4 h-px bg-neutral-300/80" />

              <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-neutral-700">
                <span>
                  <span className="font-semibold text-neutral-500">Periodo:</span>{' '}
                  {formatDateValue(report.period.fechaInicio)} al {formatDateValue(report.period.fechaFin)}
                </span>
                <span>
                  <span className="font-semibold text-neutral-500">Temporada:</span>{' '}
                  {report.season ? `${report.season.code} - ${report.season.name}` : 'Todas'}
                </span>
                <span>
                  <span className="font-semibold text-neutral-500">Productor:</span>{' '}
                  {selectedProducer ? `${selectedProducer.name} (${selectedProducer.rut})` : 'Todos'}
                </span>
                <span>
                  <span className="font-semibold text-neutral-500">Agrupación:</span>{' '}
                  {REPORT_GROUP_BY_LABELS[report.period.groupBy]}
                </span>
                <span>
                  <span className="font-semibold text-neutral-500">Modo cálculo:</span>{' '}
                  {interestCalculationModeLabels[report.period.calculationMode]}
                </span>
                <span>
                  <span className="font-semibold text-neutral-500">Estado anticipo:</span>{' '}
                  {report.period.status ? normalizeStatusLabel(report.period.status) : 'Todos'}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4 print:grid-cols-4 print:gap-2">
            <ReportSummaryCard
              title="Anticipos"
              value={numberFormatter.format(report.summary.advancesCount)}
            />
            <ReportSummaryCard
              title="Capital colocado"
              value={currencyFormatter.format(report.summary.capitalPlaced)}
            />
            <ReportSummaryCard
              title="Interés neto"
              value={currencyFormatter.format(report.summary.accruedInterestNet)}
              hint={`Tasa promedio: ${percentFormatter.format(report.summary.averageInterestRate)}%`}
            />
            <ReportSummaryCard
              title="Total financiero"
              value={currencyFormatter.format(report.summary.totalFinancialRevenue)}
              hint={`IVA estimado: ${currencyFormatter.format(report.summary.estimatedInterestVat)}`}
            />
          </div>

          <PrintableReportTable
            title="Tendencia temporal"
            subtitle="Evolución de ingresos financieros por periodo según el criterio de agrupación seleccionado."
            columns={trendColumns}
            rows={trendRows}
            showContainerBorder={false}
          />

          <InterestRevenueTrendChart
            trend={trendRows}
            groupBy={report.period.groupBy}
            currencyFormatter={currencyFormatter}
          />

          <PrintableReportTable
            title="Consolidado por productor"
            subtitle="Resumen por productor para anticipos considerados dentro del periodo consultado."
            columns={byProducerColumns}
            rows={report.byProducer}
            showContainerBorder={false}
          />

          <PrintableReportTable
            title="Consolidado por estado"
            subtitle="Distribución de ingresos financieros según estado del anticipo." 
            columns={byStatusColumns}
            rows={report.byStatus}
            showContainerBorder={false}
          />

          <PrintableReportTable
            title="Detalle por anticipo"
            subtitle="Listado base para respaldo y revisión impresa de cada anticipo incluido en el cálculo."
            columns={detailColumns}
            rows={report.detail}
            showContainerBorder={false}
          />
        </div>
      ) : null}
    </section>
  );
};

export default InterestRevenueReport;
