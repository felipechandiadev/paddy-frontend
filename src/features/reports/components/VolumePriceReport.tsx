'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { signOut } from 'next-auth/react';
import { useReactToPrint } from 'react-to-print';
import AutoComplete, {
  Option as AutoCompleteOption,
} from '@/shared/components/ui/AutoComplete/AutoComplete';
import Select, { Option } from '@/shared/components/ui/Select/Select';
import { Button } from '@/shared/components/ui/Button/Button';
import Alert from '@/shared/components/ui/Alert/Alert';
import { AdvanceSeasonOption } from '@/features/finances/types/finances.types';
import { RiceType } from '@/features/rice-types/types/rice-types.types';
import {
  fetchVolumePriceByProducerReport,
  fetchVolumePriceProducerDetailReport,
  fetchVolumePriceReport,
} from '../actions/reports.action';
import {
  VolumePriceByProducerItem,
  VolumePriceByProducerReportResponse,
  VolumePriceMonthlyItem,
  VolumePriceProducerDetailItem,
  VolumePriceProducerDetailReportResponse,
  VolumePriceReportFilters,
  VolumePriceReportResponse,
} from '../types/reports.types';
import PrintableReportTable, {
  PrintableReportTableColumn,
} from './common/PrintableReportTable';
import ReportSummaryCard from './common/ReportSummaryCard';
import VolumePriceTrendChart from './common/VolumePriceTrendChart';
import {
  formatDateValue,
  mapSeasonOptions,
  toOptionalNumber,
} from './common/reportUtils';

interface VolumePriceReportProps {
  seasons: AdvanceSeasonOption[];
  riceTypes: RiceType[];
  initialSeasonId?: number;
  initialPrintDateLabel: string;
}

interface VolumePriceUIFilters {
  seasonId?: number;
  riceTypeId?: number;
  producerId?: number;
}

function formatMonthValue(monthKey: string): string {
  if (!/^\d{4}-\d{2}$/.test(monthKey)) {
    return monthKey;
  }

  const parsed = new Date(`${monthKey}-01T12:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return monthKey;
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

const VolumePriceReport: React.FC<VolumePriceReportProps> = ({
  seasons,
  riceTypes,
  initialSeasonId,
  initialPrintDateLabel,
}) => {
  const reportPrintRef = useRef<HTMLDivElement>(null);

  const [filters, setFilters] = useState<VolumePriceUIFilters>({
    seasonId: initialSeasonId ?? seasons[0]?.id,
    riceTypeId: undefined,
    producerId: undefined,
  });
  const [summaryReport, setSummaryReport] = useState<VolumePriceReportResponse | null>(null);
  const [producerReport, setProducerReport] = useState<VolumePriceByProducerReportResponse | null>(
    null,
  );
  const [producerDetail, setProducerDetail] = useState<VolumePriceProducerDetailReportResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);

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

  const availableProducerOptions = useMemo<AutoCompleteOption[]>(
    () =>
      (producerReport?.producers ?? []).map((producer) => ({
        id: producer.producerId,
        label: `${producer.producerName}${producer.producerRut ? ` (${producer.producerRut})` : ''}`,
      })),
    [producerReport],
  );
  const producerOptions = useMemo<AutoCompleteOption[]>(
    () => [ALL_PRODUCERS_OPTION, ...availableProducerOptions],
    [availableProducerOptions],
  );
  const selectedProducerOption = useMemo<AutoCompleteOption | null>(() => {
    if (!filters.producerId) {
      return null;
    }

    return availableProducerOptions.find((option) => option.id === filters.producerId) ?? null;
  }, [availableProducerOptions, filters.producerId]);

  const handleSessionExpired = useCallback(async () => {
    setSummaryReport(null);
    setProducerReport(null);
    setProducerDetail(null);
    setError('Tu sesión expiró. Serás redirigido al inicio de sesión.');
    await signOut({ callbackUrl: '/' });
  }, []);

  const loadProducerDetail = useCallback(
    async (producerId: number, reportFilters: VolumePriceReportFilters) => {
      setDetailLoading(true);
      setDetailError(null);

      const detailResult = await fetchVolumePriceProducerDetailReport(producerId, reportFilters);

      if (!detailResult.success || !detailResult.data) {
        if (detailResult.error === 'SESSION_EXPIRED') {
          setDetailLoading(false);
          await handleSessionExpired();
          return;
        }

        setProducerDetail(null);
        setDetailError(
          detailResult.error ||
            'No fue posible obtener el detalle por productor para el Reporte 6.',
        );
        setDetailLoading(false);
        return;
      }

      setProducerDetail(detailResult.data);
      setDetailLoading(false);
    },
    [handleSessionExpired],
  );

  const runReport = useCallback(async () => {
    const seasonId = filters.seasonId;

    if (!seasonId) {
      setError('Debes seleccionar una temporada para ejecutar el reporte.');
      return;
    }

    setLoading(true);
    setError(null);
    setDetailError(null);

    const reportFilters: VolumePriceReportFilters = {
      seasonId,
      riceTypeId: filters.riceTypeId,
    };

    const [summaryResult, producerResult] = await Promise.all([
      fetchVolumePriceReport(reportFilters),
      fetchVolumePriceByProducerReport(reportFilters),
    ]);

    if (summaryResult.error === 'SESSION_EXPIRED' || producerResult.error === 'SESSION_EXPIRED') {
      setLoading(false);
      await handleSessionExpired();
      return;
    }

    if (!summaryResult.success || !summaryResult.data) {
      setSummaryReport(null);
      setProducerReport(null);
      setProducerDetail(null);
      setError(summaryResult.error || 'No fue posible obtener el Reporte 6.');
      setLoading(false);
      return;
    }

    if (!producerResult.success || !producerResult.data) {
      setSummaryReport(null);
      setProducerReport(null);
      setProducerDetail(null);
      setError(
        producerResult.error || 'No fue posible obtener el consolidado por productor del Reporte 6.',
      );
      setLoading(false);
      return;
    }

    setSummaryReport(summaryResult.data);
    setProducerReport(producerResult.data);

    const availableProducers = producerResult.data.producers;
    const selectedProducerExists = availableProducers.some(
      (producer) => producer.producerId === filters.producerId,
    );

    const nextProducerId = selectedProducerExists ? filters.producerId : undefined;

    setFilters((prev) => ({
      ...prev,
      producerId: nextProducerId,
    }));

    if (nextProducerId) {
      await loadProducerDetail(nextProducerId, reportFilters);
    } else {
      setProducerDetail(null);
      setDetailError(null);
    }

    setLoading(false);
  }, [filters.producerId, filters.riceTypeId, filters.seasonId, handleSessionExpired, loadProducerDetail]);

  useEffect(() => {
    if (!summaryReport && !loading && !error) {
      void runReport();
    }
  }, [error, loading, runReport, summaryReport]);

  const monthlyColumns = useMemo<PrintableReportTableColumn<VolumePriceMonthlyItem>[]>(
    () => [
      {
        key: 'month',
        label: 'Mes',
        render: (row) => formatMonthValue(row.month),
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
        key: 'mermaPct',
        label: 'Merma %',
        align: 'right',
        render: (row) => `${percentFormatter.format(row.mermaPct)}%`,
      },
      {
        key: 'avgPricePerKg',
        label: 'Precio Prom./Kg',
        align: 'right',
        render: (row) => currencyFormatter.format(row.avgPricePerKg),
      },
      {
        key: 'totalPaidNet',
        label: 'Total Pagado Neto',
        align: 'right',
        render: (row) => currencyFormatter.format(row.totalPaidNet),
      },
    ],
    [currencyFormatter, numberFormatter, percentFormatter],
  );

  const byProducerColumns = useMemo<PrintableReportTableColumn<VolumePriceByProducerItem>[]>(
    () => [
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
        key: 'mermaPct',
        label: 'Merma %',
        align: 'right',
        render: (row) => `${percentFormatter.format(row.mermaPct)}%`,
      },
      {
        key: 'avgPricePerKg',
        label: 'Precio Prom./Kg',
        align: 'right',
        render: (row) => currencyFormatter.format(row.avgPricePerKg),
      },
      {
        key: 'deltaVsSeasonAvg',
        label: 'Delta vs Prom.',
        align: 'right',
        render: (row) => {
          const delta = row.deltaVsSeasonAvg;
          const className =
            delta > 0 ? 'text-emerald-700' : delta < 0 ? 'text-red-700' : 'text-neutral-700';
          const sign = delta > 0 ? '+' : '';

          return <span className={className}>{`${sign}${currencyFormatter.format(delta)}`}</span>;
        },
      },
      {
        key: 'totalPaidNet',
        label: 'Total Pagado Neto',
        align: 'right',
        render: (row) => currencyFormatter.format(row.totalPaidNet),
      },
      {
        key: 'participationPct',
        label: 'Participación %',
        align: 'right',
        render: (row) => `${percentFormatter.format(row.participationPct)}%`,
      },
    ],
    [currencyFormatter, numberFormatter, percentFormatter],
  );

  const detailColumns = useMemo<PrintableReportTableColumn<VolumePriceProducerDetailItem>[]>(
    () => [
      {
        key: 'receptionDate',
        label: 'Fecha Recepción',
        render: (row) => formatDateValue(row.receptionDate),
      },
      {
        key: 'purchaseDate',
        label: 'Fecha Compra',
        render: (row) => formatDateValue(row.purchaseDate),
      },
      {
        key: 'guideNumber',
        label: 'Guía',
        render: (row) => row.guideNumber,
      },
      {
        key: 'riceTypeName',
        label: 'Tipo Arroz',
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
        key: 'mermaPct',
        label: 'Merma %',
        align: 'right',
        render: (row) => `${percentFormatter.format(row.mermaPct)}%`,
      },
      {
        key: 'pricePerKg',
        label: 'Precio/Kg',
        align: 'right',
        render: (row) => currencyFormatter.format(row.pricePerKg),
      },
      {
        key: 'totalPaidNet',
        label: 'Total Pagado Neto',
        align: 'right',
        render: (row) => currencyFormatter.format(row.totalPaidNet),
      },
    ],
    [currencyFormatter, numberFormatter, percentFormatter],
  );

  const selectedRiceType = useMemo(
    () => riceTypeOptions.find((option) => option.id === filters.riceTypeId),
    [filters.riceTypeId, riceTypeOptions],
  );

  const handlePrint = useReactToPrint({
    contentRef: reportPrintRef,
    documentTitle:
      summaryReport && summaryReport.season
        ? `volume-price-${summaryReport.season.code}`
        : 'volume-price',
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
            Volumen de Compra y Precio Promedio por Kilo
          </h2>
          <p className="text-sm text-neutral-600">
            Reporte 6 de compras liquidadas con análisis de volumen mensual, precio promedio y
            distribución por productor.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3 print:hidden">
        <Select
          label="Temporada"
          options={seasonOptions}
          value={filters.seasonId ?? null}
          onChange={(value) =>
            setFilters((prev) => ({
              ...prev,
              seasonId: toOptionalNumber(value),
              producerId: undefined,
            }))
          }
          placeholder="Selecciona temporada"
        />

        <Select
          label="Tipo de arroz"
          options={riceTypeOptions}
          value={filters.riceTypeId ?? null}
          onChange={(value) =>
            setFilters((prev) => ({
              ...prev,
              riceTypeId: toOptionalNumber(value),
              producerId: undefined,
            }))
          }
          allowClear={true}
          placeholder="Todos"
        />

        <AutoComplete
          label="Detalle por productor"
          options={producerOptions}
          value={selectedProducerOption}
          onChange={(option) => {
            const producerId = toOptionalNumber(option?.id ?? null);

            setFilters((prev) => ({
              ...prev,
              producerId,
            }));

            if (!producerId) {
              setProducerDetail(null);
              setDetailError(null);
              return;
            }

            if (!filters.seasonId) {
              return;
            }

            void loadProducerDetail(producerId, {
              seasonId: filters.seasonId,
              riceTypeId: filters.riceTypeId,
            });
          }}
          placeholder={
            availableProducerOptions.length > 0 ? 'Todos (opcional)' : 'Genera primero'
          }
          disabled={availableProducerOptions.length === 0 || loading}
        />
      </div>

      <div className="flex justify-end gap-2 print:hidden">
        <Button variant="outlined" onClick={handlePrint} disabled={!summaryReport || loading}>
          Imprimir
        </Button>
        <Button onClick={() => void runReport()} loading={loading}>
          Generar Reporte
        </Button>
      </div>

      {error ? <Alert variant="error">{error}</Alert> : null}

      {!error && summaryReport && summaryReport.summary.totalReceptions === 0 ? (
        <Alert variant="info">
          No se encontraron recepciones liquidadas para los filtros seleccionados. Prueba cambiando
          temporada o quitando el filtro de tipo de arroz.
        </Alert>
      ) : null}

      {summaryReport && producerReport ? (
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
                    Volumen y Precio Promedio por Kilo
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
                  {`${summaryReport.season.code} - ${summaryReport.season.name}`}
                </span>
                <span>
                  <span className="font-semibold text-neutral-500">Rango temporada:</span>{' '}
                  {formatDateValue(summaryReport.season.startDate)} al{' '}
                  {formatDateValue(summaryReport.season.endDate)}
                </span>
                <span>
                  <span className="font-semibold text-neutral-500">Tipo arroz:</span>{' '}
                  {selectedRiceType?.label ?? 'Todos'}
                </span>
                <span>
                  <span className="font-semibold text-neutral-500">Productor detalle:</span>{' '}
                  {producerDetail?.producer
                    ? `${producerDetail.producer.name} (${producerDetail.producer.rut})`
                    : 'Todos'}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6 print:grid-cols-3 print:gap-2">
            <ReportSummaryCard
              title="Recepciones"
              value={numberFormatter.format(summaryReport.summary.totalReceptions)}
            />
            <ReportSummaryCard
              title="Productores"
              value={numberFormatter.format(summaryReport.summary.totalProducers)}
            />
            <ReportSummaryCard
              title="Kg Bruto"
              value={numberFormatter.format(summaryReport.summary.totalGrossKg)}
            />
            <ReportSummaryCard
              title="Kg Neto"
              value={numberFormatter.format(summaryReport.summary.totalNetKg)}
              hint={`Merma: ${percentFormatter.format(summaryReport.summary.mermaPct)}%`}
            />
            <ReportSummaryCard
              title="Precio Promedio/Kg"
              value={currencyFormatter.format(summaryReport.summary.weightedAvgPricePerKg)}
              hint={`Total neto: ${currencyFormatter.format(summaryReport.summary.totalPaidNet)}`}
            />
            <ReportSummaryCard
              title="Total Pagado c/IVA"
              value={currencyFormatter.format(summaryReport.summary.totalPaidWithVat)}
            />
          </div>

          <PrintableReportTable
            title="Tendencia mensual"
            subtitle="Evolución por mes de recepción liquidada considerando volumen y precio promedio." 
            columns={monthlyColumns}
            rows={summaryReport.monthly}
            showContainerBorder={false}
          />

          <VolumePriceTrendChart monthly={summaryReport.monthly} numberFormatter={numberFormatter} />

          <PrintableReportTable
            title="Consolidado por productor"
            subtitle={`Comparación por productor respecto del precio promedio de temporada (${currencyFormatter.format(
              producerReport.seasonAvgPricePerKg,
            )} por kg).`}
            columns={byProducerColumns}
            rows={producerReport.producers}
            showContainerBorder={false}
          />

          {detailLoading ? (
            <div className="rounded-xl border border-neutral-200 bg-white px-4 py-4 text-sm text-neutral-600">
              Cargando detalle del productor seleccionado...
            </div>
          ) : null}

          {detailError ? <Alert variant="error">{detailError}</Alert> : null}

          {producerDetail && !detailLoading ? (
            <>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4 print:grid-cols-4 print:gap-2">
                <ReportSummaryCard
                  title="Detalle recepciones"
                  value={numberFormatter.format(producerDetail.summary.receptions)}
                />
                <ReportSummaryCard
                  title="Kg Neto (Productor)"
                  value={numberFormatter.format(producerDetail.summary.netKg)}
                  hint={`Merma: ${percentFormatter.format(producerDetail.summary.mermaPct)}%`}
                />
                <ReportSummaryCard
                  title="Precio Promedio/Kg"
                  value={currencyFormatter.format(producerDetail.summary.avgPricePerKg)}
                />
                <ReportSummaryCard
                  title="Total Pagado Neto"
                  value={currencyFormatter.format(producerDetail.summary.totalPaidNet)}
                />
              </div>

              <PrintableReportTable
                title={`Detalle de recepciones - ${producerDetail.producer.name}`}
                subtitle="Listado de recepciones del productor dentro de la temporada y filtros seleccionados."
                columns={detailColumns}
                rows={producerDetail.receptions}
                showContainerBorder={false}
              />
            </>
          ) : null}
        </div>
      ) : null}
    </section>
  );
};

export default VolumePriceReport;
