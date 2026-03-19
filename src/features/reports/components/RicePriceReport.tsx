'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { signOut } from 'next-auth/react';
import { useReactToPrint } from 'react-to-print';
import { TextField } from '@/shared/components/ui/TextField/TextField';
import Select from '@/shared/components/ui/Select/Select';
import type { Option } from '@/shared/components/ui/Select/Select';
import IconButton from '@/shared/components/ui/IconButton/IconButton';
import Alert from '@/shared/components/ui/Alert/Alert';
import { RiceType } from '@/features/rice-types/types/rice-types.types';
import { fetchRicePriceReport } from '../actions/reports.action';
import {
  RicePriceDataPoint,
  RicePriceReportFilters,
  RicePriceReportResponse,
  RicePriceSeries,
  ReportGroupBy,
} from '../types/reports.types';import PrintableReportTable, {
  PrintableReportTableColumn,
} from './common/PrintableReportTable';
import ReportSummaryCard from './common/ReportSummaryCard';
import RicePriceTrendChart from './common/RicePriceTrendChart';
import {
  formatDateValue,
  REPORT_GROUP_BY_LABELS,
  REPORT_GROUP_BY_OPTIONS,
  toOptionalNumber,
  formatDateForInput,
} from './common/reportUtils';

interface RicePriceReportProps {
  riceTypes: RiceType[];
  initialStartDate: string;
  initialEndDate: string;
  initialPrintDateLabel: string;
}

const ALL_RICE_TYPES_OPTION: Option = { id: '', label: 'Todos los tipos' };

const RicePriceReport: React.FC<RicePriceReportProps> = ({
  riceTypes,
  initialStartDate,
  initialEndDate,
  initialPrintDateLabel,
}) => {
  const reportPrintRef = useRef<HTMLDivElement>(null);

  // Default dates: end = today, start = one month before
  const today = useMemo(() => new Date(), []);
  const oneMonthAgo = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d;
  }, []);
  const defaultEndDate = useMemo(() => formatDateForInput(today), [today]);
  const defaultStartDate = useMemo(() => formatDateForInput(oneMonthAgo), [oneMonthAgo]);

  const [filters, setFilters] = useState<RicePriceReportFilters>({
    fechaInicio: defaultStartDate,
    fechaFin: defaultEndDate,
    groupBy: 'month',
  });
  const [report, setReport] = useState<RicePriceReportResponse | null>(null);
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

  const riceTypeOptions = useMemo<Option[]>(
    () => [
      ALL_RICE_TYPES_OPTION,
      ...riceTypes
        .filter((rt) => rt.isActive)
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((rt) => ({ id: rt.id, label: `${rt.code} - ${rt.name}` })),
    ],
    [riceTypes],
  );

  const runReport = useCallback(async () => {
    if (!filters.fechaInicio || !filters.fechaFin) {
      setError('Debes seleccionar fecha inicio y fecha fin para ejecutar el reporte.');
      return;
    }

    setLoading(true);
    setError(null);

    const result = await fetchRicePriceReport({
      fechaInicio: filters.fechaInicio,
      fechaFin: filters.fechaFin,
      riceTypeId: filters.riceTypeId,
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
      setError(result.error || 'No fue posible generar el reporte de precios.');
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

  const periodColumns = useMemo<PrintableReportTableColumn<RicePriceDataPoint>[]>(
    () => [
      {
        key: 'periodKey',
        label: 'Período',
        render: (row) => row.periodKey,
      },
      {
        key: 'weightedAvgPrice',
        label: 'Precio Promedio ($/kg)',
        align: 'right',
        render: (row) =>
          row.weightedAvgPrice != null
            ? currencyFormatter.format(row.weightedAvgPrice)
            : '-',
      },
      {
        key: 'totalKg',
        label: 'Kg Neto Paddy',
        align: 'right',
        render: (row) => numberFormatter.format(row.totalKg),
      },
      {
        key: 'receptionCount',
        label: 'N° Recepciones',
        align: 'right',
        render: (row) => numberFormatter.format(row.receptionCount),
      },
    ],
    [currencyFormatter, numberFormatter],
  );

  const handlePrint = useReactToPrint({
    contentRef: reportPrintRef,
    documentTitle: report
      ? `precio-arroz-${report.period.fechaInicio}-${report.period.fechaFin}`
      : 'precio-arroz',
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

  const seriesForChart = useMemo<RicePriceSeries[]>(() => report?.series ?? [], [report]);

  const overallWeightedAvgPrice = useMemo(() => {
    if (!report) return null;
    let totalWeightedSum = 0;
    let totalKg = 0;
    for (const serie of report.series) {
      for (const point of serie.data) {
        if (point.weightedAvgPrice != null && point.totalKg > 0) {
          totalWeightedSum += point.weightedAvgPrice * point.totalKg;
          totalKg += point.totalKg;
        }
      }
    }
    return totalKg > 0 ? Math.round(totalWeightedSum / totalKg) : null;
  }, [report]);

  return (
    <section className="space-y-6 rounded-xl bg-white p-6">
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">
            Evolución de Precios por Tipo de Arroz
          </h2>
          <p className="text-sm text-neutral-600">
            Precio promedio ponderado ($/kg paddy) por tipo de arroz. Solo recepciones liquidadas.
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 gap-3 items-end md:grid-cols-2 xl:grid-cols-2 print:hidden">
        <TextField
          label="Fecha inicio"
          type="date"
          value={filters.fechaInicio}
          onChange={(event) =>
            setFilters((prev) => ({ ...prev, fechaInicio: event.target.value }))
          }
        />
        <TextField
          label="Fecha fin"
          type="date"
          value={filters.fechaFin}
          onChange={(event) =>
            setFilters((prev) => ({ ...prev, fechaFin: event.target.value }))
          }
        />
        <Select
          label="Tipo de arroz"
          options={riceTypeOptions}
          value={filters.riceTypeId ?? ''}
          onChange={(value) =>
            setFilters((prev) => ({
              ...prev,
              riceTypeId: toOptionalNumber(value),
            }))
          }
          allowClear={true}
          placeholder="Todos los tipos"
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
      {!error && report && report.summary.totalReceptions === 0 ? (
        <Alert variant="info">
          No se encontraron recepciones liquidadas para los filtros seleccionados. Prueba
          ampliando el rango de fechas o cambiando el tipo de arroz.
        </Alert>
      ) : null}

      {report ? (
        <div ref={reportPrintRef} className="space-y-6">
          {/* Encabezado de impresión */}
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
                    Evolución de Precios por Tipo de Arroz
                  </h2>
                  <p className="m-0 mt-2 text-[11px] font-semibold text-neutral-800">
                    Fecha: {initialPrintDateLabel}
                  </p>
                </div>
              </div>

              <div className="my-4 h-px bg-neutral-300/80" />

              <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-neutral-700">
                <span>
                  <span className="font-semibold text-neutral-500">Período:</span>{' '}
                  {formatDateValue(report.period.fechaInicio)} al{' '}
                  {formatDateValue(report.period.fechaFin)}
                </span>
                <span>
                  <span className="font-semibold text-neutral-500">Agrupación:</span>{' '}
                  {REPORT_GROUP_BY_LABELS[report.period.groupBy]}
                </span>
                <span>
                  <span className="font-semibold text-neutral-500">Universo:</span>{' '}
                  Solo recepciones liquidadas (SETTLED)
                </span>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <ReportSummaryCard
                title="Recepciones"
                value={numberFormatter.format(report.summary.totalReceptions)}
                hint="Liquidadas en el período"
              />
              <ReportSummaryCard
                title="Kg Neto Paddy Total"
                value={`${numberFormatter.format(report.summary.totalKg)} kg`}
                hint="Suma de finalNetWeight"
              />
              <ReportSummaryCard
                title="Tipos de Arroz"
                value={String(report.summary.riceTypesCount)}
                hint="Con datos en el período"
              />
              <ReportSummaryCard
                title="Precio Ponderado Global"
                value={
                  overallWeightedAvgPrice != null
                    ? `${currencyFormatter.format(overallWeightedAvgPrice)}/kg`
                    : '-'
                }
                hint="Todos los tipos combinados"
              />
            </div>
          </div>

          {/* Gráfico de tendencia */}
          <RicePriceTrendChart
            series={seriesForChart}
            groupBy={report.period.groupBy}
            currencyFormatter={currencyFormatter}
          />

          {/* Tabla por tipo de arroz */}
          {report.series.map((serie) => (
            <PrintableReportTable<RicePriceDataPoint>
              key={serie.riceTypeId}
              title={`${serie.riceTypeName} (${serie.riceTypeCode})`}
              subtitle={`Precio promedio ponderado por período — agrupación: ${REPORT_GROUP_BY_LABELS[report.period.groupBy]}`}
              columns={periodColumns}
              rows={serie.data.filter((point) => point.receptionCount > 0)}
              emptyMessage="Sin recepciones liquidadas para este tipo de arroz en el período."
            />
          ))}
        </div>
      ) : null}
    </section>
  );
};

export default RicePriceReport;
