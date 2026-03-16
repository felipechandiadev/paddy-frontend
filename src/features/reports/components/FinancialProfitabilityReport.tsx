'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { signOut } from 'next-auth/react';
import { useReactToPrint } from 'react-to-print';
import { TextField } from '@/shared/components/ui/TextField/TextField';
import AutoComplete, {
  Option as AutoCompleteOption,
} from '@/shared/components/ui/AutoComplete/AutoComplete';
import Select from '@/shared/components/ui/Select/Select';
import { Button } from '@/shared/components/ui/Button/Button';
import Alert from '@/shared/components/ui/Alert/Alert';
import { fetchFinancialProfitabilityReport } from '../actions/reports.action';
import {
  FinancialProfitabilityByProducerItem,
  FinancialProfitabilityFilters,
  FinancialProfitabilityReportResponse,
  InterestCalculationMode,
} from '../types/reports.types';
import {
  AdvanceProducerOption,
  AdvanceSeasonOption,
} from '@/features/finances/types/finances.types';
import PrintableReportTable, {
  PrintableReportTableColumn,
} from './common/PrintableReportTable';
import ReportSummaryCard from './common/ReportSummaryCard';
import FinancialProfitabilityProducerChart from './common/FinancialProfitabilityProducerChart';
import {
  INTEREST_CALCULATION_OPTIONS,
  mapProducerOptions,
  mapSeasonOptions,
  toInterestCalculationMode,
  toOptionalNumber,
} from './common/reportUtils';

interface FinancialProfitabilityReportProps {
  seasons: AdvanceSeasonOption[];
  producers: AdvanceProducerOption[];
  initialSeasonId?: number;
  initialCutoffDate: string;
  initialPrintDateLabel: string;
}

function toDateInputValue(rawValue?: string | Date | null): string | null {
  if (!rawValue) {
    return null;
  }

  if (typeof rawValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(rawValue)) {
    return rawValue;
  }

  const parsed = rawValue instanceof Date ? rawValue : new Date(rawValue);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

const ALL_PRODUCERS_OPTION: AutoCompleteOption = {
  id: '',
  label: 'Todos',
};

const FinancialProfitabilityReport: React.FC<FinancialProfitabilityReportProps> = ({
  seasons,
  producers,
  initialSeasonId,
  initialCutoffDate,
  initialPrintDateLabel,
}) => {
  const reportPrintRef = useRef<HTMLDivElement>(null);

  const [filters, setFilters] = useState<FinancialProfitabilityFilters>({
    seasonId: initialSeasonId ?? seasons[0]?.id ?? 0,
    cutoffDate: initialCutoffDate,
    calculationMode: 'devengado',
  });
  const [report, setReport] = useState<FinancialProfitabilityReportResponse | null>(null);
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

  const seasonsById = useMemo(() => {
    const map = new Map<number, { endDate: string | null }>();

    for (const season of seasons) {
      map.set(season.id, {
        endDate: toDateInputValue(season.endDate),
      });
    }

    return map;
  }, [seasons]);

  const runReport = useCallback(async () => {
    if (!filters.seasonId) {
      setError('Debes seleccionar una temporada para ejecutar el reporte.');
      return;
    }

    setLoading(true);
    setError(null);

    const result = await fetchFinancialProfitabilityReport({
      seasonId: filters.seasonId,
      cutoffDate: filters.cutoffDate,
      producerId: filters.producerId,
      calculationMode: filters.calculationMode,
    });

    if (!result.success || !result.data) {
      if (result.error === 'SESSION_EXPIRED') {
        setReport(null);
        setError('Tu sesion expiro. Seras redirigido al inicio de sesion.');
        setLoading(false);
        await signOut({ callbackUrl: '/' });
        return;
      }

      setReport(null);
      setError(result.error || 'No fue posible generar el Reporte 3.');
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

  const byProducerColumns =
    useMemo<PrintableReportTableColumn<FinancialProfitabilityByProducerItem>[]>(
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
          key: 'interestAtCutoff',
          label: 'Interes al corte',
          align: 'right',
          render: (row) => currencyFormatter.format(row.interestAtCutoff),
        },
        {
          key: 'projectedInterest',
          label: 'Interes proyectado',
          align: 'right',
          render: (row) => currencyFormatter.format(row.projectedInterest),
        },
        {
          key: 'progressPct',
          label: 'Avance %',
          align: 'right',
          render: (row) => `${percentFormatter.format(row.progressPct)}%`,
        },
        {
          key: 'participationPct',
          label: 'Participacion %',
          align: 'right',
          render: (row) => `${percentFormatter.format(row.participationPct)}%`,
        },
      ],
      [currencyFormatter, numberFormatter, percentFormatter],
    );

  const selectedSeason = useMemo(
    () =>
      report?.season
        ? seasons.find((season) => season.id === report.season.id) ?? null
        : null,
    [report, seasons],
  );

  const selectedProducer = useMemo(
    () =>
      report?.period.producerId
        ? producers.find((producer) => producer.id === report.period.producerId) ?? null
        : null,
    [producers, report],
  );

  const gaugeColor = useMemo(() => {
    const status = report?.gauge.status;

    if (status === 'excellent') {
      return 'bg-emerald-600';
    }

    if (status === 'good') {
      return 'bg-teal-600';
    }

    if (status === 'warning') {
      return 'bg-amber-500';
    }

    return 'bg-red-600';
  }, [report]);

  const calculationModeLabel = useMemo(
    () => ({
      devengado: 'Devengado',
      liquidado: 'Liquidado',
    }),
    [],
  );

  const handlePrint = useReactToPrint({
    contentRef: reportPrintRef,
    documentTitle: report
      ? `financial-profitability-${report.period.cutoffDate}`
      : 'financial-profitability',
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
          <h2 className="text-2xl font-semibold text-foreground">
            Rentabilidad de Servicios Financieros
          </h2>
          <p className="text-sm text-neutral-600">
            Reporte 3: estado de rendimiento de capital e intereses financieros al corte.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5 print:hidden">
        <Select
          label="Temporada"
          options={seasonOptions}
          value={filters.seasonId || null}
          onChange={(value) => {
            const seasonId = toOptionalNumber(value);
            const seasonEnd = seasonId ? seasonsById.get(seasonId)?.endDate : null;

            setFilters((prev) => ({
              ...prev,
              seasonId: seasonId ?? prev.seasonId,
              cutoffDate: seasonEnd ?? prev.cutoffDate,
            }));
          }}
        />
        <TextField
          label="Fecha de corte"
          type="date"
          value={filters.cutoffDate ?? ''}
          onChange={(event) =>
            setFilters((prev) => ({
              ...prev,
              cutoffDate: event.target.value,
            }))
          }
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
          label="Calculo"
          options={INTEREST_CALCULATION_OPTIONS}
          value={filters.calculationMode ?? 'devengado'}
          onChange={(value) =>
            setFilters((prev) => ({
              ...prev,
              calculationMode: toInterestCalculationMode(value),
            }))
          }
        />
        <div className="flex items-end">
          <Button
            variant="outlined"
            className="w-full"
            onClick={handlePrint}
            disabled={!report || loading}
          >
            Imprimir
          </Button>
        </div>
      </div>

      <div className="flex justify-end gap-2 print:hidden">
        <Button onClick={() => void runReport()} loading={loading}>
          Generar Reporte
        </Button>
      </div>

      {error ? <Alert variant="error">{error}</Alert> : null}

      {!error && report && report.summary.advancesCount === 0 ? (
        <Alert variant="info">
          No se encontraron anticipos con interes habilitado para los filtros seleccionados.
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
                    Rentabilidad Servicios Financieros
                  </h2>
                  <p className="m-0 mt-2 text-[11px] font-semibold text-neutral-800">
                    Fecha: {initialPrintDateLabel}
                  </p>
                </div>
              </div>

              <div className="my-4 h-px bg-neutral-300/80" />

              <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-neutral-700">
                <span>
                  <span className="font-semibold text-neutral-500">Temporada:</span>{' '}
                  {report.season ? `${report.season.code} - ${report.season.name}` : '-'}
                </span>
                <span>
                  <span className="font-semibold text-neutral-500">Fecha corte:</span>{' '}
                  {report.period.cutoffDate}
                </span>
                <span>
                  <span className="font-semibold text-neutral-500">Calculo:</span>{' '}
                  {calculationModeLabel[report.period.calculationMode]}
                </span>
                <span>
                  <span className="font-semibold text-neutral-500">Productor:</span>{' '}
                  {selectedProducer ? `${selectedProducer.name} (${selectedProducer.rut})` : 'Todos'}
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
              title="Interes al corte"
              value={currencyFormatter.format(report.summary.interestAtCutoff)}
              hint={`IVA est.: ${currencyFormatter.format(report.summary.estimatedInterestVat)}`}
            />
            <ReportSummaryCard
              title="Total financiero"
              value={currencyFormatter.format(report.summary.totalFinancialRevenue)}
            />
            <ReportSummaryCard
              title="Interes proyectado"
              value={currencyFormatter.format(report.summary.projectedSeasonInterest)}
            />
            <ReportSummaryCard
              title="Avance meta"
              value={`${percentFormatter.format(report.summary.progressPct)}%`}
            />
            <ReportSummaryCard
              title="Rend. sobre capital"
              value={`${percentFormatter.format(report.summary.capitalYieldPct)}%`}
            />
            <ReportSummaryCard
              title="Temporada"
              value={selectedSeason ? `${selectedSeason.code}` : '-'}
              hint={selectedSeason ? selectedSeason.name : undefined}
            />
          </div>

          <section className="rounded-xl border border-neutral-200 bg-white p-4 print:break-inside-avoid">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-neutral-900">Indicador de avance</h3>
                <p className="mt-1 text-sm text-neutral-600">
                  Compara el interes acumulado al corte contra la meta proyectada al cierre.
                </p>
              </div>
              <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-700">
                {report.gauge.status.toUpperCase()}
              </span>
            </div>

            <div className="mt-4 h-4 w-full overflow-hidden rounded-full bg-neutral-200">
              <div
                className={`h-4 ${gaugeColor}`}
                style={{ width: `${Math.min(100, Math.max(0, report.gauge.percent))}%` }}
              />
            </div>

            <div className="mt-2 flex flex-wrap items-center justify-between gap-3 text-sm text-neutral-700">
              <span>Actual: {currencyFormatter.format(report.gauge.current)}</span>
              <span>Meta: {currencyFormatter.format(report.gauge.target)}</span>
              <span className="font-semibold">
                Avance: {percentFormatter.format(report.gauge.percent)}%
              </span>
            </div>
          </section>

          <PrintableReportTable
            title="Consolidado por productor"
            subtitle="Detalle del aporte de interes por productor dentro de la temporada seleccionada."
            columns={byProducerColumns}
            rows={report.byProducer}
            showContainerBorder={false}
          />

          <FinancialProfitabilityProducerChart
            rows={report.byProducer}
            currencyFormatter={currencyFormatter}
          />
        </div>
      ) : null}
    </section>
  );
};

export default FinancialProfitabilityReport;
