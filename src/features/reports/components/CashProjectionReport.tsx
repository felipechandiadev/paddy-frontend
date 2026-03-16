'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { signOut } from 'next-auth/react';
import { useReactToPrint } from 'react-to-print';
import Select from '@/shared/components/ui/Select/Select';
import { Button } from '@/shared/components/ui/Button/Button';
import Alert from '@/shared/components/ui/Alert/Alert';
import { fetchCashProjectionReport } from '../actions/reports.action';
import {
  CashProjectionByProducerItem,
  CashProjectionDetailItem,
  CashProjectionFilters,
  CashProjectionResponse,
} from '../types/reports.types';
import { AdvanceSeasonOption } from '@/features/finances/types/finances.types';
import PrintableReportTable, {
  PrintableReportTableColumn,
} from './common/PrintableReportTable';
import ReportSummaryCard from './common/ReportSummaryCard';
import { mapSeasonOptions } from './common/reportUtils';

interface CashProjectionReportProps {
  seasons: AdvanceSeasonOption[];
  initialSeasonId?: number;
  initialPrintDateLabel: string;
}

const CashProjectionReport: React.FC<CashProjectionReportProps> = ({
  seasons,
  initialSeasonId,
  initialPrintDateLabel,
}) => {
  const reportPrintRef = useRef<HTMLDivElement>(null);

  const [filters, setFilters] = useState<CashProjectionFilters>({
    seasonId: initialSeasonId,
  });
  const [report, setReport] = useState<CashProjectionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState(false);

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

  const seasonOptions = useMemo(() => mapSeasonOptions(seasons), [seasons]);

  const handlePrint = useReactToPrint({
    contentRef: reportPrintRef,
    documentTitle: `Proyeccion-de-Caja-${report?.season?.name ?? 'temporada'}`,
  });

  const runReport = useCallback(async () => {
    setLoading(true);
    setError(null);

    const result = await fetchCashProjectionReport({ seasonId: filters.seasonId });

    if (!result.success || !result.data) {
      if (result.error === 'SESSION_EXPIRED') {
        setReport(null);
        setError('Tu sesión expiró. Serás redirigido al inicio de sesión.');
        setLoading(false);
        await signOut({ callbackUrl: '/' });
        return;
      }

      setReport(null);
      setError(result.error || 'No fue posible generar el reporte de Proyección de Caja.');
      setLoading(false);
      return;
    }

    setReport(result.data);
    setLoading(false);
  }, [filters.seasonId]);

  useEffect(() => {
    void runReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const byProducerColumns = useMemo<PrintableReportTableColumn<CashProjectionByProducerItem>[]>(
    () => [
      {
        key: 'producerName',
        label: 'Productor',
        render: (row) => (
          <span className={row.saldoEstimado < 0 ? 'font-semibold text-red-700' : ''}>
            {row.producerName}
          </span>
        ),
      },
      {
        key: 'producerRut',
        label: 'RUT',
        render: (row) => row.producerRut ?? '-',
      },
      {
        key: 'receptionsCount',
        label: 'Recep.',
        align: 'right',
        render: (row) => numberFormatter.format(row.receptionsCount),
      },
      {
        key: 'totalKg',
        label: 'Kg Neto',
        align: 'right',
        render: (row) => `${numberFormatter.format(row.totalKg)} kg`,
      },
      {
        key: 'valorBruto',
        label: 'Valor Arroz',
        align: 'right',
        render: (row) => currencyFormatter.format(row.valorBruto),
      },
      {
        key: 'cargoSecado',
        label: 'Cargo Secado',
        align: 'right',
        render: (row) =>
          row.cargoSecado > 0 ? (
            <span className="text-orange-700">– {currencyFormatter.format(row.cargoSecado)}</span>
          ) : (
            <span className="text-neutral-400">–</span>
          ),
      },
      {
        key: 'totalAnticipos',
        label: 'Anticipos',
        align: 'right',
        render: (row) =>
          row.totalAnticipos > 0 ? (
            <span className="text-blue-700">– {currencyFormatter.format(row.totalAnticipos)}</span>
          ) : (
            <span className="text-neutral-400">–</span>
          ),
      },
      {
        key: 'interesAcumulado',
        label: 'Interés',
        align: 'right',
        render: (row) =>
          row.interesAcumulado > 0 ? (
            <span className="text-blue-700">– {currencyFormatter.format(row.interesAcumulado)}</span>
          ) : (
            <span className="text-neutral-400">–</span>
          ),
      },
      {
        key: 'saldoEstimado',
        label: 'Saldo a Pagar',
        align: 'right',
        render: (row) => (
          <span
            className={`font-semibold ${
              row.saldoEstimado < 0
                ? 'text-red-700'
                : row.saldoEstimado === 0
                  ? 'text-neutral-500'
                  : 'text-green-700'
            }`}
          >
            {currencyFormatter.format(row.saldoEstimado)}
          </span>
        ),
      },
    ],
    [currencyFormatter, numberFormatter],
  );

  const detailColumns = useMemo<PrintableReportTableColumn<CashProjectionDetailItem>[]>(
    () => [
      {
        key: 'guideNumber',
        label: 'Guía',
        render: (row) => row.guideNumber,
      },
      {
        key: 'receptionDate',
        label: 'Fecha',
        render: (row) => row.receptionDate,
      },
      {
        key: 'producerName',
        label: 'Productor',
        render: (row) => row.producerName,
      },
      {
        key: 'riceTypeName',
        label: 'Tipo Arroz',
        render: (row) => row.riceTypeName ?? '-',
      },
      {
        key: 'kg',
        label: 'Kg Neto',
        align: 'right',
        render: (row) => `${numberFormatter.format(row.kg)} kg`,
      },
      {
        key: 'ricePrice',
        label: 'Precio/kg',
        align: 'right',
        render: (row) => currencyFormatter.format(row.ricePrice),
      },
      {
        key: 'valorBruto',
        label: 'Valor Arroz',
        align: 'right',
        render: (row) => currencyFormatter.format(row.valorBruto),
      },
      {
        key: 'cargoSecado',
        label: 'Cargo Secado',
        align: 'right',
        render: (row) =>
          row.dryFeeApplied ? (
            <span className="text-orange-700">
              {numberFormatter.format(row.dryPercent)}% / – {currencyFormatter.format(row.cargoSecado)}
            </span>
          ) : (
            <span className="text-neutral-400">–</span>
          ),
      },
      {
        key: 'subtotal',
        label: 'Subtotal',
        align: 'right',
        render: (row) => (
          <span className="font-medium">{currencyFormatter.format(row.subtotal)}</span>
        ),
      },
    ],
    [currencyFormatter, numberFormatter],
  );

  const summary = report?.summary;

  return (
    <div className="flex flex-col gap-6 p-6 print:p-0 print:gap-4">
      {/* Header */}
      <div className="flex flex-col gap-1 print:hidden">
        <h1 className="text-2xl font-semibold text-foreground">Proyección de Caja</h1>
        <p className="text-sm text-neutral-500">
          Estimación del capital necesario para liquidar todas las recepciones analizadas pendientes.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 print:hidden">
        <div className="min-w-[220px]">
          <Select
            label="Temporada"
            options={[{ id: '', label: 'Temporada activa' }, ...seasonOptions]}
            value={filters.seasonId != null ? String(filters.seasonId) : ''}
            onChange={(val) =>
              setFilters((prev) => ({
                ...prev,
                seasonId: val && val !== '' ? Number(val) : undefined,
              }))
            }
          />
        </div>

        <Button
          variant="primary"
          onClick={() => void runReport()}
          disabled={loading}
        >
          {loading ? 'Calculando…' : 'Actualizar'}
        </Button>

        {report && (
          <Button variant="secondary" onClick={() => handlePrint()}>
            Imprimir / PDF
          </Button>
        )}
      </div>

      {/* Error */}
      {error && !loading && (
        <Alert variant="error">
          Error al generar el reporte: {error}
        </Alert>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16 text-neutral-500">
          <span className="text-sm">Calculando proyección…</span>
        </div>
      )}

      {/* No data */}
      {!loading && !error && report && report.summary.totalReceptions === 0 && (
        <Alert variant="info">
          Sin recepciones pendientes — No hay recepciones con estado &quot;Analizadas&quot; para la temporada
          seleccionada. Todas las recepciones ya han sido liquidadas.
        </Alert>
      )}

      {/* Report content */}
      {!loading && report && report.summary.totalReceptions > 0 && (
        <div ref={reportPrintRef} className="flex flex-col gap-6 print:gap-4">
          {/* Print header */}
          <div className="hidden print:block">
            <h1 className="text-lg font-bold text-neutral-900">Proyección de Caja</h1>
            {report.season && (
              <p className="text-sm text-neutral-600">
                Temporada: {report.season.name} ({report.season.year})
              </p>
            )}
            <p className="text-xs text-neutral-500">
              Impreso: {initialPrintDateLabel} · Corte: {report.assumptions.cutDate}
            </p>
          </div>

          {/* Season + cut date badge */}
          <div className="flex flex-wrap items-center gap-3 print:hidden">
            {report.season && (
              <span className="rounded-full bg-neutral-100 px-3 py-1 text-sm font-medium text-neutral-700">
                Temporada: {report.season.name} ({report.season.year})
              </span>
            )}
            <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
              Corte al: {report.assumptions.cutDate}
            </span>
            <span className="rounded-full bg-amber-50 px-3 py-1 text-sm font-medium text-amber-700">
              {summary?.totalReceptions} recepciones pendientes · {summary?.productoresCount}{' '}
              productores
            </span>
          </div>

          {/* KPI Cards */}
          {summary && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 print:grid-cols-6 print:gap-2">
              <ReportSummaryCard
                title="Valor Arroz"
                value={currencyFormatter.format(summary.valorBruto)}
                hint={`${numberFormatter.format(summary.totalKg)} kg neto total`}
              />
              <ReportSummaryCard
                title="Cargo Secado"
                value={summary.cargoSecado > 0 ? `– ${currencyFormatter.format(summary.cargoSecado)}` : '$0'}
                hint="Descuento por servicio de secado"
              />
              <ReportSummaryCard
                title="Subtotal"
                value={currencyFormatter.format(summary.subtotalAntesAnticipos)}
                hint="Aroz – secado, antes de descontar anticipos"
              />
              <ReportSummaryCard
                title="Anticipos Entregados"
                value={summary.totalAnticipos > 0 ? `– ${currencyFormatter.format(summary.totalAnticipos)}` : '$0'}
                hint="Ya salió de caja, se descuenta"
              />
              <ReportSummaryCard
                title="Interés Acumulado"
                value={summary.interesAcumulado > 0 ? `– ${currencyFormatter.format(summary.interesAcumulado)}` : '$0'}
                hint="Cobro al productor, reduce el pago"
              />
              <ReportSummaryCard
                title="Saldo Neto a Pagar"
                value={currencyFormatter.format(summary.saldoEstimado)}
                hint={
                  summary.productoresConSaldoNegativo > 0
                    ? `⚠ ${summary.productoresConSaldoNegativo} productor(es) con saldo negativo`
                    : 'Capital necesario en caja'
                }
                className={
                  summary.saldoEstimado < 0
                    ? 'border-red-300 bg-red-50'
                    : 'border-green-300 bg-green-50'
                }
              />
            </div>
          )}

          {/* IVA note */}
          <p className="text-xs text-neutral-400 print:text-[10px]">
            * {report.assumptions.ivaNote}
          </p>

          {/* By Producer table */}
          <PrintableReportTable<CashProjectionByProducerItem>
            title="Resumen por Productor"
            subtitle="Ordenado por nombre. Saldo negativo indica anticipo mayor al valor de compra."
            columns={byProducerColumns}
            rows={report.byProducer}
            emptyMessage="Sin productores con recepciones pendientes."
          />

          {/* Detail toggle */}
          <div className="print:hidden">
            <button
              type="button"
              onClick={() => setShowDetail((v) => !v)}
              className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
            >
              {showDetail ? '▲ Ocultar detalle de recepciones' : '▼ Ver detalle de recepciones'}
            </button>
          </div>

          {/* Detail table */}
          {(showDetail || undefined) && (
            <div className="print:block">
              <PrintableReportTable<CashProjectionDetailItem>
                title="Detalle de Recepciones Pendientes"
                subtitle={`${report.detail.length} recepciones con estado Analizada — aún no liquidadas`}
                columns={detailColumns}
                rows={report.detail}
                emptyMessage="Sin recepciones para mostrar."
              />
            </div>
          )}

          {/* Always show detail on print */}
          <div className="hidden print:block">
            <PrintableReportTable<CashProjectionDetailItem>
              title="Detalle de Recepciones Pendientes"
              subtitle={`${report.detail.length} recepciones con estado Analizada — aún no liquidadas`}
              columns={detailColumns}
              rows={report.detail}
              emptyMessage="Sin recepciones para mostrar."
            />
          </div>

          {/* Assumptions footer */}
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-xs text-neutral-500 print:text-[10px]">
            <p className="mb-1 font-semibold text-neutral-700">Supuestos del cálculo</p>
            <ul className="list-disc pl-4 space-y-0.5">
              <li>Estado de recepciones consideradas: <strong>Analizada</strong> (pendiente de liquidar)</li>
              <li>Interés calculado en modo: <strong>{report.assumptions.interestMode}</strong></li>
              <li>Anticipos incluidos: solo anticipos con estado <strong>Pagado</strong> (aún no descontados en liquidación)</li>
              <li>{report.assumptions.ivaNote}</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashProjectionReport;
