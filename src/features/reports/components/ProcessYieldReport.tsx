'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { signOut } from 'next-auth/react';
import { useReactToPrint } from 'react-to-print';
import { TextField } from '@/shared/components/ui/TextField/TextField';
import AutoComplete, {
  Option as AutoCompleteOption,
} from '@/shared/components/ui/AutoComplete/AutoComplete';
import Select, { Option } from '@/shared/components/ui/Select/Select';
import IconButton from '@/shared/components/ui/IconButton/IconButton';
import Alert from '@/shared/components/ui/Alert/Alert';
import { fetchProcessYieldReport } from '../actions/reports.action';
import {
  ProcessYieldByProducerItem,
  ProcessYieldDetailItem,
  ProcessYieldFilters,
  ProcessYieldMonthlyItem,
  ProcessYieldReportResponse,
  ReportGroupBy,
} from '../types/reports.types';
import {
  AdvanceProducerOption,
  AdvanceSeasonOption,
} from '@/features/finances/types/finances.types';
import { RiceType } from '@/features/rice-types/types/rice-types.types';
import PrintableReportTable, {
  PrintableReportTableColumn,
} from './common/PrintableReportTable';
import ReportSummaryCard from './common/ReportSummaryCard';
import ProcessYieldTrendChart from './common/ProcessYieldTrendChart';
import {
  formatDateValue,
  mapProducerOptions,
  mapSeasonOptions,
  normalizeReceptionStatusLabel,
  REPORT_GROUP_BY_LABELS,
  REPORT_GROUP_BY_OPTIONS,
  toOptionalNumber,
} from './common/reportUtils';

interface ProcessYieldReportProps {
  seasons: AdvanceSeasonOption[];
  producers: AdvanceProducerOption[];
  riceTypes: RiceType[];
  initialSeasonId?: number;
  initialStartDate?: string;
  initialEndDate?: string;
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

function formatPeriodLabel(period: string, groupBy: ReportGroupBy): string {
  if (groupBy === 'month' && /^\d{4}-\d{2}$/.test(period)) {
    const parsed = new Date(`${period}-01T12:00:00`);

    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString('es-CL', {
        month: 'long',
        year: 'numeric',
      });
    }
  }

  return period;
}

const ALL_PRODUCERS_OPTION: AutoCompleteOption = {
  id: '',
  label: 'Todos',
};

const ProcessYieldReport: React.FC<ProcessYieldReportProps> = ({
  seasons,
  producers,
  riceTypes,
  initialSeasonId,
  initialStartDate,
  initialEndDate,
  initialPrintDateLabel,
}) => {
  const reportPrintRef = useRef<HTMLDivElement>(null);

  const [filters, setFilters] = useState<ProcessYieldFilters>({
    seasonId: initialSeasonId ?? seasons[0]?.id ?? 0,
    fechaInicio: initialStartDate,
    fechaFin: initialEndDate,
    groupBy: 'month',
  });
  const [report, setReport] = useState<ProcessYieldReportResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const riceTypeOptions = useMemo<Option[]>(
    () =>
      riceTypes
        .filter((riceType) => riceType.isActive)
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((riceType) => ({
          id: riceType.id,
          label: `${riceType.code} - ${riceType.name}`,
        })),
    [riceTypes],
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

  const runReport = useCallback(async () => {
    if (!filters.seasonId) {
      setError('Debes seleccionar una temporada para ejecutar el reporte.');
      return;
    }

    if ((filters.fechaInicio && !filters.fechaFin) || (!filters.fechaInicio && filters.fechaFin)) {
      setError('Debes ingresar fecha inicio y fecha fin juntas para filtrar por periodo.');
      return;
    }

    setLoading(true);
    setError(null);

    const result = await fetchProcessYieldReport({
      seasonId: filters.seasonId,
      fechaInicio: filters.fechaInicio,
      fechaFin: filters.fechaFin,
      producerId: filters.producerId,
      riceTypeId: filters.riceTypeId,
      groupBy: filters.groupBy,
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
      setError(result.error || 'No fue posible generar el Reporte 5.');
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

  const monthlyColumns = useMemo<PrintableReportTableColumn<ProcessYieldMonthlyItem>[]>(
    () => [
      {
        key: 'period',
        label: 'Periodo',
        render: (row) => formatPeriodLabel(row.period, report?.period.groupBy ?? 'month'),
      },
      {
        key: 'receptions',
        label: 'Recepciones',
        align: 'right',
        render: (row) => numberFormatter.format(row.receptions),
      },
      {
        key: 'grossKg',
        label: 'Kg Bruto',
        align: 'right',
        render: (row) => numberFormatter.format(row.grossKg),
      },
      {
        key: 'netKg',
        label: 'Kg Neto',
        align: 'right',
        render: (row) => numberFormatter.format(row.netKg),
      },
      {
        key: 'shrinkageKg',
        label: 'Merma Kg',
        align: 'right',
        render: (row) => numberFormatter.format(row.shrinkageKg),
      },
      {
        key: 'processYieldPct',
        label: 'Rendimiento %',
        align: 'right',
        render: (row) => `${percentFormatter.format(row.processYieldPct)}%`,
      },
    ],
    [numberFormatter, percentFormatter, report?.period.groupBy],
  );

  const byProducerColumns = useMemo<PrintableReportTableColumn<ProcessYieldByProducerItem>[]>(
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
        key: 'receptions',
        label: 'Recepciones',
        align: 'right',
        render: (row) => numberFormatter.format(row.receptions),
      },
      {
        key: 'grossKg',
        label: 'Kg Bruto',
        align: 'right',
        render: (row) => numberFormatter.format(row.grossKg),
      },
      {
        key: 'netKg',
        label: 'Kg Neto',
        align: 'right',
        render: (row) => numberFormatter.format(row.netKg),
      },
      {
        key: 'processYieldPct',
        label: 'Rendimiento %',
        align: 'right',
        render: (row) => `${percentFormatter.format(row.processYieldPct)}%`,
      },
      {
        key: 'impuritiesLossKg',
        label: 'Merma Impur.',
        align: 'right',
        render: (row) => numberFormatter.format(row.impuritiesLossKg),
      },
      {
        key: 'vanoLossKg',
        label: 'Merma Vano',
        align: 'right',
        render: (row) => numberFormatter.format(row.vanoLossKg),
      },
      {
        key: 'humidityLossKg',
        label: 'Merma Hum.',
        align: 'right',
        render: (row) => numberFormatter.format(row.humidityLossKg),
      },
    ],
    [numberFormatter, percentFormatter],
  );

  const detailColumns = useMemo<PrintableReportTableColumn<ProcessYieldDetailItem>[]>(
    () => [
      {
        key: 'receptionDate',
        label: 'Fecha',
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
        label: 'Tipo arroz',
        render: (row) => row.riceTypeName ?? '-',
      },
      {
        key: 'grossKg',
        label: 'Kg Bruto',
        align: 'right',
        render: (row) => numberFormatter.format(row.grossKg),
      },
      {
        key: 'netKg',
        label: 'Kg Neto',
        align: 'right',
        render: (row) => numberFormatter.format(row.netKg),
      },
      {
        key: 'shrinkageKg',
        label: 'Merma Kg',
        align: 'right',
        render: (row) => numberFormatter.format(row.shrinkageKg),
      },
      {
        key: 'processYieldPct',
        label: 'Rend. %',
        align: 'right',
        render: (row) => `${percentFormatter.format(row.processYieldPct)}%`,
      },
      {
        key: 'impuritiesLossKg',
        label: 'Impur. Kg',
        align: 'right',
        render: (row) => numberFormatter.format(row.impuritiesLossKg),
      },
      {
        key: 'vanoLossKg',
        label: 'Vano Kg',
        align: 'right',
        render: (row) => numberFormatter.format(row.vanoLossKg),
      },
      {
        key: 'humidityLossKg',
        label: 'Humedad Kg',
        align: 'right',
        render: (row) => numberFormatter.format(row.humidityLossKg),
      },
      {
        key: 'receptionStatus',
        label: 'Estado',
        render: (row) => normalizeReceptionStatusLabel(row.receptionStatus),
      },
    ],
    [numberFormatter, percentFormatter],
  );

  const sankeyRows = useMemo(
    () => {
      const nodes = report?.sankey.nodes ?? [];
      const links = report?.sankey.links ?? [];

      return links.map((link) => ({
        source: nodes.find((node) => node.id === link.source)?.name ?? link.source,
        target: nodes.find((node) => node.id === link.target)?.name ?? link.target,
        value: link.value,
      }));
    },
    [report],
  );

  const sankeyColumns = useMemo<PrintableReportTableColumn<{ source: string; target: string; value: number }>[]>(
    () => [
      {
        key: 'source',
        label: 'Origen',
        render: (row) => row.source,
      },
      {
        key: 'target',
        label: 'Destino',
        render: (row) => row.target,
      },
      {
        key: 'value',
        label: 'Kg',
        align: 'right',
        render: (row) => numberFormatter.format(row.value),
      },
    ],
    [numberFormatter],
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
      ? `process-yield-${report.period.seasonId}-${report.period.fechaInicio ?? 'full'}`
      : 'process-yield',
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
          <h2 className="text-2xl font-semibold text-foreground">Rendimiento de Proceso</h2>
          <p className="text-sm text-neutral-600">
            Reporte 5: balance de mermas y rendimiento industrial por recepcion.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 items-end md:grid-cols-2 xl:grid-cols-3 print:hidden">
        <Select
          label="Temporada"
          options={seasonOptions}
          value={filters.seasonId || null}
          onChange={(value) => {
            const seasonId = toOptionalNumber(value);
            const selectedSeason = seasonId ? seasonsById.get(seasonId) : null;

            setFilters((prev) => ({
              ...prev,
              seasonId: seasonId ?? prev.seasonId,
              fechaInicio: selectedSeason?.startDate ?? prev.fechaInicio,
              fechaFin: selectedSeason?.endDate ?? prev.fechaFin,
            }));
          }}
        />
        <TextField
          label="Fecha inicio"
          type="date"
          value={filters.fechaInicio ?? ''}
          onChange={(event) =>
            setFilters((prev) => ({
              ...prev,
              fechaInicio: event.target.value || undefined,
            }))
          }
        />
        <TextField
          label="Fecha fin"
          type="date"
          value={filters.fechaFin ?? ''}
          onChange={(event) =>
            setFilters((prev) => ({
              ...prev,
              fechaFin: event.target.value || undefined,
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
          label="Tipo arroz"
          options={riceTypeOptions}
          value={filters.riceTypeId ?? null}
          onChange={(value) =>
            setFilters((prev) => ({
              ...prev,
              riceTypeId: toOptionalNumber(value),
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

      {!error && report && report.summary.receptionsCount === 0 ? (
        <Alert variant="info">
          No se encontraron recepciones analizadas/liquidadas para los filtros seleccionados.
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
                    Rendimiento de Proceso
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
                  <span className="font-semibold text-neutral-500">Periodo:</span>{' '}
                  {report.period.fechaInicio && report.period.fechaFin
                    ? `${formatDateValue(report.period.fechaInicio)} al ${formatDateValue(report.period.fechaFin)}`
                    : 'Temporada completa'}
                </span>
                <span>
                  <span className="font-semibold text-neutral-500">Productor:</span>{' '}
                  {selectedProducer ? `${selectedProducer.name} (${selectedProducer.rut})` : 'Todos'}
                </span>
                <span>
                  <span className="font-semibold text-neutral-500">Agrupacion:</span>{' '}
                  {REPORT_GROUP_BY_LABELS[report.period.groupBy]}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4 print:grid-cols-4 print:gap-2">
            <ReportSummaryCard
              title="Recepciones"
              value={numberFormatter.format(report.summary.receptionsCount)}
            />
            <ReportSummaryCard
              title="Kg bruto"
              value={numberFormatter.format(report.summary.totalGrossKg)}
            />
            <ReportSummaryCard
              title="Kg neto"
              value={numberFormatter.format(report.summary.totalNetKg)}
            />
            <ReportSummaryCard
              title="Rendimiento"
              value={`${percentFormatter.format(report.summary.processYieldPct)}%`}
            />
            <ReportSummaryCard
              title="Merma total kg"
              value={numberFormatter.format(report.summary.totalShrinkageKg)}
            />
            <ReportSummaryCard
              title="Merma impurezas"
              value={numberFormatter.format(report.summary.impuritiesLossKg)}
              hint={`${percentFormatter.format(report.summary.impuritiesLossPct)}%`}
            />
            <ReportSummaryCard
              title="Merma vano"
              value={numberFormatter.format(report.summary.vanoLossKg)}
              hint={`${percentFormatter.format(report.summary.vanoLossPct)}%`}
            />
            <ReportSummaryCard
              title="Merma humedad"
              value={numberFormatter.format(report.summary.humidityLossKg)}
              hint={`${percentFormatter.format(report.summary.humidityLossPct)}%`}
            />
          </div>

          <ProcessYieldTrendChart
            monthly={report.monthly}
            groupBy={report.period.groupBy}
            numberFormatter={numberFormatter}
          />

          <PrintableReportTable
            title="Flujos del proceso"
            subtitle="Representacion tabular de las transiciones del diagrama de proceso (tipo sankey)."
            columns={sankeyColumns}
            rows={sankeyRows}
            showContainerBorder={false}
          />

          <PrintableReportTable
            title="Evolucion por periodo"
            subtitle="Consolidado de volumen, merma y rendimiento segun la agrupacion elegida."
            columns={monthlyColumns}
            rows={report.monthly}
            showContainerBorder={false}
          />

          <PrintableReportTable
            title="Consolidado por productor"
            subtitle="Contribucion de cada productor al volumen bruto, neto y mermas del proceso."
            columns={byProducerColumns}
            rows={report.byProducer}
            showContainerBorder={false}
          />

          <PrintableReportTable
            title="Detalle por recepcion"
            subtitle="Base de respaldo con mermas tecnicas por parametro en cada recepcion."
            columns={detailColumns}
            rows={report.detail}
            showContainerBorder={false}
          />
        </div>
      ) : null}
    </section>
  );
};

export default ProcessYieldReport;
