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
import { fetchDryingRevenueReport } from '../actions/reports.action';
import {
  DryingReportByProducerItem,
  DryingReportByRiceTypeItem,
  DryingReportDetailItem,
  DryingReportFilters,
  DryingReportTrendItem,
  DryingRevenueReportResponse,
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
import DryingRevenueTrendChart from './common/DryingRevenueTrendChart';
import {
  DRYING_RECEPTION_STATUS_LABELS,
  DRYING_RECEPTION_STATUS_OPTIONS,
  formatDateValue,
  mapProducerOptions,
  mapSeasonOptions,
  normalizeReceptionStatusLabel,
  normalizeStatusLabel,
  REPORT_GROUP_BY_LABELS,
  REPORT_GROUP_BY_OPTIONS,
  toDryingReceptionStatusFilter,
  toOptionalNumber,
} from './common/reportUtils';

interface DryingRevenueReportProps {
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

const ALL_SEASONS_OPTION = {
  id: '',
  label: 'Todos',
};

const DryingRevenueReport: React.FC<DryingRevenueReportProps> = ({
  seasons,
  producers,
  initialStartDate,
  initialEndDate,
  initialSeasonId,
  initialPrintDateLabel,
}) => {
  const reportPrintRef = useRef<HTMLDivElement>(null);

  const [filters, setFilters] = useState<DryingReportFilters>({
    fechaInicio: initialStartDate,
    fechaFin: initialEndDate,
    seasonId: initialSeasonId,
    receptionStatus: 'analyzed_settled',
    groupBy: 'month',
  });
  const [report, setReport] = useState<DryingRevenueReportResponse | null>(null);
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

  const seasonOptions = useMemo(
    () => [ALL_SEASONS_OPTION, ...mapSeasonOptions(seasons)],
    [seasons],
  );
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
  const selectedProducerFilterOption = useMemo<AutoCompleteOption | null>(() => {
    if (!filters.producerId) {
      return null;
    }

    return producerOptions.find((option) => option.id === filters.producerId) ?? null;
  }, [filters.producerId, producerOptions]);

  const runReport = useCallback(async () => {
    if (!filters.fechaInicio || !filters.fechaFin) {
      setError('Debes seleccionar fecha inicio y fecha fin para ejecutar el reporte.');
      return;
    }

    setLoading(true);
    setError(null);

    const result = await fetchDryingRevenueReport({
      fechaInicio: filters.fechaInicio,
      fechaFin: filters.fechaFin,
      seasonId: filters.seasonId,
      producerId: filters.producerId,
      riceTypeId: filters.riceTypeId,
      receptionStatus: filters.receptionStatus,
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
      setError(result.error || 'No fue posible generar el reporte de recaudación por secado.');
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

  const trendColumns = useMemo<PrintableReportTableColumn<DryingReportTrendItem>[]>(
    () => [
      {
        key: 'period',
        label: 'Periodo',
        render: (row) => row.period,
      },
      {
        key: 'receptionsWithDryingCount',
        label: 'Recepciones',
        align: 'right',
        render: (row) => numberFormatter.format(row.receptionsWithDryingCount),
      },
      {
        key: 'netDryingRevenue',
        label: 'Neto Secado',
        align: 'right',
        render: (row) => currencyFormatter.format(row.netDryingRevenue),
      },
      {
        key: 'estimatedDryingVat',
        label: 'IVA Estimado',
        align: 'right',
        render: (row) => currencyFormatter.format(row.estimatedDryingVat),
      },
      {
        key: 'totalDryingRevenue',
        label: 'Total Secado',
        align: 'right',
        render: (row) => currencyFormatter.format(row.totalDryingRevenue),
      },
    ],
    [currencyFormatter, numberFormatter],
  );

  const trendRows = useMemo<DryingReportTrendItem[]>(() => {
    if (!report) {
      return [];
    }

    const buckets = new Map<string, DryingReportTrendItem>();

    for (const item of report.detail) {
      const cutDate = toDateOnly(item.cutDate);

      if (!cutDate) {
        continue;
      }

      const key = toPeriodKey(cutDate, report.period.groupBy);
      const current = buckets.get(key) ?? {
        period: key,
        receptionsWithDryingCount: 0,
        netDryingRevenue: 0,
        estimatedDryingVat: 0,
        totalDryingRevenue: 0,
      };

      current.receptionsWithDryingCount += 1;
      current.netDryingRevenue += Number(item.netDryingRevenue ?? 0);
      current.estimatedDryingVat += Number(item.estimatedDryingVat ?? 0);
      current.totalDryingRevenue += Number(item.totalDryingRevenue ?? 0);

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
          receptionsWithDryingCount: 0,
          netDryingRevenue: 0,
          estimatedDryingVat: 0,
          totalDryingRevenue: 0,
        };
      }

      return {
        period: bucket.period,
        receptionsWithDryingCount: bucket.receptionsWithDryingCount,
        netDryingRevenue: round2(bucket.netDryingRevenue),
        estimatedDryingVat: round2(bucket.estimatedDryingVat),
        totalDryingRevenue: round2(bucket.totalDryingRevenue),
      };
    });
  }, [report]);

  const byProducerColumns = useMemo<PrintableReportTableColumn<DryingReportByProducerItem>[]>(
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
        key: 'receptionsWithDryingCount',
        label: 'Recepciones',
        align: 'right',
        render: (row) => numberFormatter.format(row.receptionsWithDryingCount),
      },
      {
        key: 'affectedPaddyKg',
        label: 'Kg Afectados',
        align: 'right',
        render: (row) => numberFormatter.format(row.affectedPaddyKg),
      },
      {
        key: 'averageDryPercent',
        label: 'Promedio %',
        align: 'right',
        render: (row) => `${percentFormatter.format(row.averageDryPercent)}%`,
      },
      {
        key: 'netDryingRevenue',
        label: 'Neto Secado',
        align: 'right',
        render: (row) => currencyFormatter.format(row.netDryingRevenue),
      },
      {
        key: 'totalDryingRevenue',
        label: 'Total Secado',
        align: 'right',
        render: (row) => currencyFormatter.format(row.totalDryingRevenue),
      },
    ],
    [currencyFormatter, numberFormatter, percentFormatter],
  );

  const byRiceTypeColumns = useMemo<PrintableReportTableColumn<DryingReportByRiceTypeItem>[]>(
    () => [
      {
        key: 'riceTypeName',
        label: 'Tipo Arroz',
        render: (row) => row.riceTypeName,
      },
      {
        key: 'receptionsWithDryingCount',
        label: 'Recepciones',
        align: 'right',
        render: (row) => numberFormatter.format(row.receptionsWithDryingCount),
      },
      {
        key: 'affectedPaddyKg',
        label: 'Kg Afectados',
        align: 'right',
        render: (row) => numberFormatter.format(row.affectedPaddyKg),
      },
      {
        key: 'netDryingRevenue',
        label: 'Neto Secado',
        align: 'right',
        render: (row) => currencyFormatter.format(row.netDryingRevenue),
      },
      {
        key: 'estimatedDryingVat',
        label: 'IVA Estimado',
        align: 'right',
        render: (row) => currencyFormatter.format(row.estimatedDryingVat),
      },
      {
        key: 'totalDryingRevenue',
        label: 'Total Secado',
        align: 'right',
        render: (row) => currencyFormatter.format(row.totalDryingRevenue),
      },
    ],
    [currencyFormatter, numberFormatter],
  );

  const detailColumns = useMemo<PrintableReportTableColumn<DryingReportDetailItem>[]>(
    () => [
      {
        key: 'cutDate',
        label: 'Fecha Corte',
        render: (row) => formatDateValue(row.cutDate),
      },
      {
        key: 'receptionDate',
        label: 'Fecha Recepción',
        render: (row) => formatDateValue(row.receptionDate),
      },
      {
        key: 'guideNumber',
        label: 'Guia',
        render: (row) => row.guideNumber,
      },
      {
        key: 'producerName',
        label: 'Productor',
        render: (row) => row.producerName,
      },
      {
        key: 'riceTypeName',
        label: 'Tipo Arroz',
        render: (row) => row.riceTypeName,
      },
      {
        key: 'paddyKg',
        label: 'Kg',
        align: 'right',
        render: (row) => numberFormatter.format(row.paddyKg),
      },
      {
        key: 'dryPercent',
        label: 'Secado %',
        align: 'right',
        render: (row) => `${percentFormatter.format(row.dryPercent)}%`,
      },
      {
        key: 'ricePrice',
        label: 'Precio/Kg',
        align: 'right',
        render: (row) => currencyFormatter.format(row.ricePrice),
      },
      {
        key: 'netPaddy',
        label: 'Neto Arroz',
        align: 'right',
        render: (row) => currencyFormatter.format(row.netPaddy),
      },
      {
        key: 'netDryingRevenue',
        label: 'Neto Secado',
        align: 'right',
        render: (row) => currencyFormatter.format(row.netDryingRevenue),
      },
      {
        key: 'estimatedDryingVat',
        label: 'IVA Secado',
        align: 'right',
        render: (row) => currencyFormatter.format(row.estimatedDryingVat),
      },
      {
        key: 'totalDryingRevenue',
        label: 'Total Secado',
        align: 'right',
        render: (row) => currencyFormatter.format(row.totalDryingRevenue),
      },
      {
        key: 'receptionStatus',
        label: 'Estado Recepción',
        render: (row) => normalizeReceptionStatusLabel(row.receptionStatus),
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
      ? `drying-revenue-${report.period.fechaInicio}-${report.period.fechaFin}`
      : 'drying-revenue',
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
          <h2 className="text-2xl font-semibold text-foreground">Recaudación por Secado</h2>
          <p className="text-sm text-neutral-600">
            Vista consolidada de neto, IVA estimado y total por servicios de secado.
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
          value={filters.seasonId ?? ''}
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
          placeholder="Todos"
        />
        <AutoComplete
          label="Productor"
          labelAlwaysVisible={true}
          options={producerOptions}
          value={selectedProducerFilterOption}
          onChange={(option) =>
            setFilters((prev) => ({
              ...prev,
              producerId: toOptionalNumber(option?.id ?? null),
            }))
          }
          placeholder="Todos"
        />
        <Select
          label="Estado Recepción"
          options={DRYING_RECEPTION_STATUS_OPTIONS}
          value={filters.receptionStatus ?? 'analyzed_settled'}
          onChange={(value) =>
            setFilters((prev) => ({
              ...prev,
              receptionStatus: toDryingReceptionStatusFilter(value),
            }))
          }
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
      {!error && report && report.summary.receptionsWithDryingCount === 0 ? (
        <Alert variant="info">
          No se encontraron cobros de secado para los filtros seleccionados. Este reporte considera
          liquidaciones completadas y recepciones con porcentaje de secado mayor a 0%. Prueba
          ampliando el rango de fechas o cambiando temporada/productor.
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
                    Recaudación por Secado
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
                  <span className="font-semibold text-neutral-500">Estado recepción:</span>{' '}
                  {DRYING_RECEPTION_STATUS_LABELS[report.period.receptionStatus]}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4 print:grid-cols-4 print:gap-2">
            <ReportSummaryCard
              title="Recepciones con secado"
              value={numberFormatter.format(report.summary.receptionsWithDryingCount)}
            />
            <ReportSummaryCard
              title="Kg afectados"
              value={numberFormatter.format(report.summary.affectedPaddyKg)}
            />
            <ReportSummaryCard
              title="Neto secado"
              value={currencyFormatter.format(report.summary.netDryingRevenue)}
            />
            <ReportSummaryCard
              title="Total secado"
              value={currencyFormatter.format(report.summary.totalDryingRevenue)}
              hint={`IVA estimado: ${currencyFormatter.format(report.summary.estimatedDryingVat)}`}
            />
          </div>

          <PrintableReportTable
            title="Tendencia temporal"
            subtitle="Evolución de recaudación por periodo según el criterio de agrupación seleccionado."
            columns={trendColumns}
            rows={trendRows}
            showContainerBorder={false}
          />

          <DryingRevenueTrendChart
            trend={trendRows}
            groupBy={report.period.groupBy}
            currencyFormatter={currencyFormatter}
          />

          <PrintableReportTable
            title="Consolidado por productor"
            subtitle="Resumen por productor afectado por cobros de secado dentro del periodo consultado."
            columns={byProducerColumns}
            rows={report.byProducer}
            showContainerBorder={false}
          />

          <PrintableReportTable
            title="Consolidado por tipo de arroz"
            subtitle="Distribución de ingresos de secado según tipo de arroz recepcionado."
            columns={byRiceTypeColumns}
            rows={report.byRiceType}
            showContainerBorder={false}
          />

          <PrintableReportTable
            title="Detalle por recepción"
            subtitle="Listado base para respaldo y revisión impresa de cada recepción incluida en el cálculo."
            columns={detailColumns}
            rows={report.detail}
            showContainerBorder={false}
          />
        </div>
      ) : null}
    </section>
  );
};

export default DryingRevenueReport;
