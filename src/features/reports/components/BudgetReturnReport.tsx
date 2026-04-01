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
import { fetchBudgetReturnReport } from '../actions/reports.action';
import {
  BudgetReturnDetailItem,
  BudgetReturnFilters,
  BudgetReturnMonthlyItem,
  BudgetReturnReportResponse,
  BudgetReturnWaterfallStep,
} from '../types/reports.types';
import {
  AdvanceProducerOption,
  AdvanceSeasonOption,
} from '@/features/finances/types/finances.types';
import PrintableReportTable, {
  PrintableReportTableColumn,
} from './common/PrintableReportTable';
import ReportSummaryCard from './common/ReportSummaryCard';
import BudgetReturnMonthlyChart from './common/BudgetReturnMonthlyChart';
import {
  formatDateValue,
  mapProducerOptions,
  mapSeasonOptions,
  toOptionalNumber,
} from './common/reportUtils';

interface BudgetReturnReportProps {
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

function formatMonthLabel(month: string): string {
  if (!/^\d{4}-\d{2}$/.test(month)) {
    return month;
  }

  const parsed = new Date(`${month}-01T12:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return month;
  }

  return parsed.toLocaleDateString('es-CL', {
    month: 'long',
    year: 'numeric',
  });
}

const ALL_PRODUCERS_OPTION: AutoCompleteOption = {
  id: '',
  label: 'Todos',
};

const BudgetReturnReport: React.FC<BudgetReturnReportProps> = ({
  seasons,
  producers,
  initialStartDate,
  initialEndDate,
  initialSeasonId,
  initialPrintDateLabel,
}) => {
  const reportPrintRef = useRef<HTMLDivElement>(null);

  const [filters, setFilters] = useState<BudgetReturnFilters>({
    fechaInicio: initialStartDate,
    fechaFin: initialEndDate,
    seasonId: initialSeasonId,
  });
  const [report, setReport] = useState<BudgetReturnReportResponse | null>(null);
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

  const runReport = useCallback(async () => {
    if (!filters.fechaInicio || !filters.fechaFin) {
      setError('Debes seleccionar fecha inicio y fecha fin para ejecutar el reporte.');
      return;
    }

    setLoading(true);
    setError(null);

    const result = await fetchBudgetReturnReport({
      fechaInicio: filters.fechaInicio,
      fechaFin: filters.fechaFin,
      seasonId: filters.seasonId,
      producerId: filters.producerId,
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
      setError(result.error || 'No fue posible generar el Reporte 4.');
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

  const waterfallColumns = useMemo<PrintableReportTableColumn<BudgetReturnWaterfallStep>[]>(
    () => [
      {
        key: 'step',
        label: 'Paso',
        render: (row) => row.step,
      },
      {
        key: 'type',
        label: 'Tipo',
        render: (row) => {
          if (row.type === 'start') {
            return 'Desembolso';
          }

          if (row.type === 'recovery') {
            return 'Recuperacion';
          }

          return 'Saldo final';
        },
      },
      {
        key: 'amount',
        label: 'Variacion',
        align: 'right',
        render: (row) => {
          const className = row.amount < 0 ? 'text-emerald-700' : 'text-amber-700';
          return <span className={className}>{currencyFormatter.format(row.amount)}</span>;
        },
      },
      {
        key: 'cumulative',
        label: 'Acumulado',
        align: 'right',
        render: (row) => currencyFormatter.format(row.cumulative),
      },
    ],
    [currencyFormatter],
  );

  const monthlyColumns = useMemo<PrintableReportTableColumn<BudgetReturnMonthlyItem>[]>(
    () => [
      {
        key: 'month',
        label: 'Mes',
        render: (row) => formatMonthLabel(row.month),
      },
      {
        key: 'advancesCount',
        label: 'Anticipos',
        align: 'right',
        render: (row) => numberFormatter.format(row.advancesCount),
      },
      {
        key: 'disbursedAmount',
        label: 'Desembolsado',
        align: 'right',
        render: (row) => currencyFormatter.format(row.disbursedAmount),
      },
      {
        key: 'recoveriesCount',
        label: 'Recup.',
        align: 'right',
        render: (row) => numberFormatter.format(row.recoveriesCount),
      },
      {
        key: 'recoveredAmount',
        label: 'Recuperado',
        align: 'right',
        render: (row) => currencyFormatter.format(row.recoveredAmount),
      },
      {
        key: 'pendingBalance',
        label: 'Saldo Pendiente',
        align: 'right',
        render: (row) => currencyFormatter.format(row.pendingBalance),
      },
      {
        key: 'recoveryRatePct',
        label: 'Recuperacion %',
        align: 'right',
        render: (row) => `${percentFormatter.format(row.recoveryRatePct)}%`,
      },
    ],
    [currencyFormatter, numberFormatter, percentFormatter],
  );

  const detailColumns = useMemo<PrintableReportTableColumn<BudgetReturnDetailItem>[]>(
    () => [
      {
        key: 'date',
        label: 'Fecha',
        render: (row) => formatDateValue(row.date),
      },
      {
        key: 'movementType',
        label: 'Movimiento',
        render: (row) =>
          row.movementType === 'advance' ? (
            <span className="font-medium text-amber-700">Anticipo</span>
          ) : (
            <span className="font-medium text-emerald-700">Recuperacion</span>
          ),
      },
      {
        key: 'referenceId',
        label: 'Referencia',
        align: 'right',
        render: (row) => numberFormatter.format(row.referenceId),
      },
      {
        key: 'producerName',
        label: 'Productor',
        render: (row) => row.producerName,
      },
      {
        key: 'producerRut',
        label: 'RUT',
        render: (row) => row.producerRut ?? '-',
      },
      {
        key: 'amount',
        label: 'Monto',
        align: 'right',
        render: (row) => currencyFormatter.format(row.amount),
      },
      {
        key: 'settlementStatus',
        label: 'Estado liquidacion',
        render: (row) => row.settlementStatus ?? '-',
      },
    ],
    [currencyFormatter, numberFormatter],
  );

  const selectedProducer = useMemo(
    () =>
      report?.period.producerId
        ? producers.find((producer) => producer.id === report.period.producerId) ?? null
        : null,
    [producers, report],
  );

  const handlePrint = useReactToPrint({
    contentRef: reportPrintRef,
    documentTitle: report
      ? `budget-return-${report.period.fechaInicio}-${report.period.fechaFin}`
      : 'budget-return',
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
          <h2 className="text-2xl font-semibold text-foreground">Retorno de Presupuesto</h2>
          <p className="text-sm text-neutral-600">
            Reporte 4: balance de flujos de capital desembolsado y recuperado.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 items-end md:grid-cols-2 xl:grid-cols-2 print:hidden">
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

      {!error && report && report.summary.movementsCount === 0 ? (
        <Alert variant="info">
          No se detectaron movimientos de capital para los filtros seleccionados.
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
                    Retorno de Presupuesto
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
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3 print:grid-cols-3 print:gap-2">
            <ReportSummaryCard
              title="Capital desembolsado"
              value={currencyFormatter.format(report.summary.capitalDisbursed)}
            />
            <ReportSummaryCard
              title="Capital recuperado"
              value={currencyFormatter.format(report.summary.capitalRecovered)}
            />
            <ReportSummaryCard
              title="Saldo pendiente"
              value={currencyFormatter.format(report.summary.pendingCapital)}
              className={
                report.summary.pendingCapital > 0
                  ? 'border-amber-300 bg-amber-50'
                  : 'border-emerald-300 bg-emerald-50'
              }
            />
            <ReportSummaryCard
              title="Tasa recuperacion"
              value={`${percentFormatter.format(report.summary.recoveryRatePct)}%`}
            />
            <ReportSummaryCard
              title="Exposicion neta"
              value={currencyFormatter.format(report.summary.netExposure)}
            />
            <ReportSummaryCard
              title="Movimientos"
              value={numberFormatter.format(report.summary.movementsCount)}
            />
          </div>

          <PrintableReportTable
            title="Waterfall de capital"
            subtitle="Secuencia de desembolso inicial, recuperaciones y saldo final pendiente."
            columns={waterfallColumns}
            rows={report.waterfall}
            showContainerBorder={false}
          />

          <BudgetReturnMonthlyChart
            monthly={report.monthly}
            currencyFormatter={currencyFormatter}
          />

          <PrintableReportTable
            title="Evolucion mensual"
            subtitle="Detalle mensual de anticipos, recuperaciones y saldo acumulado."
            columns={monthlyColumns}
            rows={report.monthly}
            showContainerBorder={false}
          />

          <PrintableReportTable
            title="Detalle de movimientos"
            subtitle="Detalle completo de anticipos emitidos y recuperaciones por liquidacion."
            columns={detailColumns}
            rows={report.detail}
            showContainerBorder={false}
          />
        </div>
      ) : null}
    </section>
  );
};

export default BudgetReturnReport;
