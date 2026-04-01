'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { signOut } from 'next-auth/react';
import { useReactToPrint } from 'react-to-print';
import Select, { Option } from '@/shared/components/ui/Select/Select';
import IconButton from '@/shared/components/ui/IconButton/IconButton';
import Alert from '@/shared/components/ui/Alert/Alert';
import { AdvanceSeasonOption } from '@/features/finances/types/finances.types';
import {
  fetchInventoryBookReport,
  fetchInventoryBookSeasonSummary,
} from '../actions/reports.action';
import {
  InventoryBookMovementItem,
  InventoryBookMonthlyReportResponse,
  InventoryBookSeasonSummaryItem,
  InventoryBookSeasonSummaryResponse,
} from '../types/reports.types';
import PrintableReportTable, {
  PrintableReportTableColumn,
} from './common/PrintableReportTable';
import ReportSummaryCard from './common/ReportSummaryCard';
import {
  formatDateValue,
  mapSeasonOptions,
  toOptionalNumber,
} from './common/reportUtils';
import InventoryBalanceBarChart from './common/InventoryBalanceBarChart';

interface InventoryBookReportProps {
  seasons: AdvanceSeasonOption[];
  initialSeasonId?: number;
  initialPrintDateLabel: string;
}

interface InventoryBookUIFilters {
  seasonId?: number;
  month?: string;
}

interface InventoryBookDerivedSummary {
  previousBalance: {
    deposito: number;
    propio: number;
    total: number;
  };
  receivedKg: number;
  purchasedKg: number;
  closingBalance: {
    deposito: number;
    propio: number;
    total: number;
  };
}

function formatMonthLabel(monthKey: string): string {
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

function toMonthKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function toNumeric(value: number | null | undefined): number {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return 0;
  }

  return Number(value);
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

const InventoryBookReport: React.FC<InventoryBookReportProps> = ({
  seasons,
  initialSeasonId,
  initialPrintDateLabel,
}) => {
  const reportPrintRef = useRef<HTMLDivElement>(null);

  const [filters, setFilters] = useState<InventoryBookUIFilters>({
    seasonId: initialSeasonId ?? seasons[0]?.id,
    month: undefined,
  });
  const [report, setReport] = useState<InventoryBookMonthlyReportResponse | null>(null);
  const [seasonSummary, setSeasonSummary] = useState<InventoryBookSeasonSummaryResponse | null>(
    null,
  );
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

  const seasonOptions = useMemo(() => mapSeasonOptions(seasons), [seasons]);

  const monthOptions = useMemo<Option[]>(() => {
    const mapped = (seasonSummary?.monthly ?? []).map((item) => ({
      id: item.month,
      label: formatMonthLabel(item.month),
    }));

    if (mapped.length > 0) {
      return mapped;
    }

    if (filters.month) {
      return [{ id: filters.month, label: formatMonthLabel(filters.month) }];
    }

    return [];
  }, [filters.month, seasonSummary?.monthly]);

  const handlePrint = useReactToPrint({
    contentRef: reportPrintRef,
    documentTitle: `Libro-Existencias-${report?.season?.name ?? 'temporada'}-${report?.month ?? ''}`,
  });

  const handleSessionExpired = useCallback(async () => {
    setReport(null);
    setSeasonSummary(null);
    setError('Tu sesión expiró. Serás redirigido al inicio de sesión.');
    await signOut({ callbackUrl: '/' });
  }, []);

  const runReport = useCallback(async () => {
    const seasonId = filters.seasonId;

    if (!seasonId) {
      setError('Debes seleccionar una temporada para generar el reporte.');
      return;
    }

    setLoading(true);
    setError(null);

    const summaryResult = await fetchInventoryBookSeasonSummary({ seasonId });

    if (summaryResult.error === 'SESSION_EXPIRED') {
      setLoading(false);
      await handleSessionExpired();
      return;
    }

    if (!summaryResult.success || !summaryResult.data) {
      setSeasonSummary(null);
      setReport(null);
      setError(
        summaryResult.error ||
          'No fue posible obtener el resumen de temporada del Libro de Existencias.',
      );
      setLoading(false);
      return;
    }

    const availableMonths = summaryResult.data.monthly.map((item) => item.month);
    const fallbackMonth =
      availableMonths[availableMonths.length - 1] ?? toMonthKey(new Date());
    const selectedMonth =
      filters.month && availableMonths.includes(filters.month)
        ? filters.month
        : fallbackMonth;

    if (!selectedMonth) {
      setSeasonSummary(summaryResult.data);
      setReport(null);
      setError('No hay meses disponibles para la temporada seleccionada.');
      setLoading(false);
      return;
    }

    if (selectedMonth !== filters.month) {
      setFilters((prev) => ({
        ...prev,
        month: selectedMonth,
      }));
    }

    const monthlyResult = await fetchInventoryBookReport({
      seasonId,
      month: selectedMonth,
    });

    if (monthlyResult.error === 'SESSION_EXPIRED') {
      setLoading(false);
      await handleSessionExpired();
      return;
    }

    if (!monthlyResult.success || !monthlyResult.data) {
      setSeasonSummary(summaryResult.data);
      setReport(null);
      setError(
        monthlyResult.error || 'No fue posible obtener el detalle mensual del Libro de Existencias.',
      );
      setLoading(false);
      return;
    }

    setSeasonSummary(summaryResult.data);
    setReport(monthlyResult.data);
    setLoading(false);
  }, [filters.month, filters.seasonId, handleSessionExpired]);

  useEffect(() => {
    if (!filters.seasonId) {
      return;
    }

    void runReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.seasonId]);

  const movementColumns = useMemo<PrintableReportTableColumn<InventoryBookMovementItem>[]>(
    () => [
      {
        key: 'date',
        label: 'Fecha',
        render: (row) => formatDateValue(row.date),
      },
      {
        key: 'movementType',
        label: 'Movimiento',
        render: (row) => (
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              row.movementType === 'RECEPTION'
                ? 'bg-green-100 text-green-800'
                : 'bg-blue-100 text-blue-800'
            }`}
          >
            {row.movementType === 'RECEPTION' ? 'Recepción' : 'Compra'}
          </span>
        ),
      },
      {
        key: 'receptionBookNumber',
        label: 'N° Libro',
        render: (row) => row.receptionBookNumber ?? '-',
      },
      {
        key: 'rut',
        label: 'RUT',
        render: (row) => row.rut ?? '-',
      },
      {
        key: 'producerName',
        label: 'Productor',
        render: (row) => row.producerName ?? '-',
      },
      {
        key: 'dispatchGuide',
        label: 'Guía',
        render: (row) => row.dispatchGuide ?? '-',
      },
      {
        key: 'receivedKg',
        label: 'Recibido (kg)',
        align: 'right',
        render: (row) =>
          row.receivedKg === null ? '-' : numberFormatter.format(row.receivedKg),
      },
      {
        key: 'purchaseInvoice',
        label: 'Factura Compra',
        render: (row) => row.purchaseInvoice ?? '-',
      },
      {
        key: 'purchasedKg',
        label: 'Comprado (kg)',
        align: 'right',
        render: (row) =>
          row.purchasedKg === null ? '-' : numberFormatter.format(row.purchasedKg),
      },
      {
        key: 'pricePerKg',
        label: 'Precio/kg',
        align: 'right',
        render: (row) =>
          row.pricePerKg === null ? '-' : currencyFormatter.format(row.pricePerKg),
      },
      {
        key: 'totalAmount',
        label: 'Total',
        align: 'right',
        render: (row) =>
          row.totalAmount === null ? '-' : currencyFormatter.format(row.totalAmount),
      },
      {
        key: 'depositoDelta',
        label: 'Δ Depósito',
        align: 'right',
        render: (row) => (
          <span className={row.depositoDelta < 0 ? 'text-red-700' : 'text-green-700'}>
            {row.depositoDelta > 0 ? '+' : ''}
            {numberFormatter.format(row.depositoDelta)}
          </span>
        ),
      },
      {
        key: 'propioDelta',
        label: 'Δ Propio',
        align: 'right',
        render: (row) => (
          <span className={row.propioDelta < 0 ? 'text-red-700' : 'text-blue-700'}>
            {row.propioDelta > 0 ? '+' : ''}
            {numberFormatter.format(row.propioDelta)}
          </span>
        ),
      },
    ],
    [currencyFormatter, numberFormatter],
  );

  const monthlySummaryColumns = useMemo<
    PrintableReportTableColumn<InventoryBookSeasonSummaryItem>[]
  >(
    () => [
      {
        key: 'month',
        label: 'Mes',
        render: (row) => formatMonthLabel(row.month),
      },
      {
        key: 'previousDeposito',
        label: 'Saldo Ant. Depósito',
        align: 'right',
        render: (row) => numberFormatter.format(row.previousBalance.deposito),
      },
      {
        key: 'previousPropio',
        label: 'Saldo Ant. Propio',
        align: 'right',
        render: (row) => numberFormatter.format(row.previousBalance.propio),
      },
      {
        key: 'receivedKg',
        label: 'Recibido (kg)',
        align: 'right',
        render: (row) => numberFormatter.format(row.receivedKg),
      },
      {
        key: 'purchasedKg',
        label: 'Comprado (kg)',
        align: 'right',
        render: (row) => numberFormatter.format(row.purchasedKg),
      },
      {
        key: 'closingDeposito',
        label: 'Cierre Depósito',
        align: 'right',
        render: (row) => numberFormatter.format(row.closingBalance.deposito),
      },
      {
        key: 'closingPropio',
        label: 'Cierre Propio',
        align: 'right',
        render: (row) => numberFormatter.format(row.closingBalance.propio),
      },
      {
        key: 'closingTotal',
        label: 'Cierre Total',
        align: 'right',
        render: (row) => numberFormatter.format(row.closingBalance.total),
      },
    ],
    [numberFormatter],
  );

  const filteredMovements = useMemo(() => {
    if (!report) {
      return [] as InventoryBookMovementItem[];
    }

    return report.movements;
  }, [report]);

  const reportSummary = useMemo<InventoryBookDerivedSummary | null>(() => {
    if (!report) {
      return null;
    }

    const previousBalance = {
      deposito: toNumeric(report.summary.previousBalance.deposito),
      propio: toNumeric(report.summary.previousBalance.propio),
      total: toNumeric(report.summary.previousBalance.total),
    };

    let receivedKg = 0;
    let purchasedKg = 0;
    let closingDeposito = previousBalance.deposito;
    let closingPropio = previousBalance.propio;
    let closingTotal = previousBalance.total;

    for (const movement of filteredMovements) {
      const received = toNumeric(movement.receivedKg);
      const purchased = toNumeric(movement.purchasedKg);
      const depositoDelta = toNumeric(movement.depositoDelta);
      const propioDelta = toNumeric(movement.propioDelta);

      receivedKg += received;
      purchasedKg += purchased;
      closingDeposito += depositoDelta;
      closingPropio += propioDelta;
      closingTotal += depositoDelta + propioDelta;
    }

    return {
      previousBalance: {
        deposito: round2(previousBalance.deposito),
        propio: round2(previousBalance.propio),
        total: round2(previousBalance.total),
      },
      receivedKg: round2(receivedKg),
      purchasedKg: round2(purchasedKg),
      closingBalance: {
        deposito: round2(closingDeposito),
        propio: round2(closingPropio),
        total: round2(closingTotal),
      },
    };
  }, [filteredMovements, report]);

  return (
    <div className="flex flex-col gap-6 p-6 print:p-0 print:gap-4">
      <div className="flex flex-col gap-1 print:hidden">
        <h1 className="text-2xl font-semibold text-foreground">Libro de Existencias</h1>
        <p className="text-sm text-neutral-500">
          Control de stock por mes separando saldo en Depósito y arroz Propio comprado.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 items-end md:grid-cols-2 xl:grid-cols-2 print:hidden">
        <Select
          label="Temporada"
          options={seasonOptions}
          value={filters.seasonId ?? null}
          onChange={(value) => {
            setFilters({
              seasonId: toOptionalNumber(value),
              month: undefined,
            });
            setSeasonSummary(null);
            setReport(null);
          }}
        />

        <Select
          label="Mes"
          options={monthOptions}
          value={filters.month ?? null}
          onChange={(value) =>
            setFilters((prev) => ({
              ...prev,
              month: value ? String(value) : undefined,
            }))
          }
          disabled={monthOptions.length === 0}
        />
      </div>

      <div className="flex justify-end gap-2 print:hidden">
        <IconButton
          icon="print"
          variant="basicSecondary"
          disabled={!report || loading}
          onClick={() => handlePrint()}
          ariaLabel="Imprimir"
        />
        <IconButton
          icon="bar_chart"
          variant="ghost"
          isLoading={loading}
          disabled={!filters.seasonId}
          onClick={() => void runReport()}
          ariaLabel="Generar Reporte"
        />
      </div>

      {error && !loading && <Alert variant="error">Error al generar el reporte: {error}</Alert>}

      {loading && (
        <div className="flex items-center justify-center py-16 text-neutral-500">
          <span className="text-sm">Calculando libro de existencias…</span>
        </div>
      )}

      {!loading && !error && report && filteredMovements.length === 0 && (
        <Alert variant="info">
          No hay movimientos para el mes seleccionado.
        </Alert>
      )}

      {!loading && report && seasonSummary && (
        <div ref={reportPrintRef} className="flex flex-col gap-6 print:gap-4">
          <div className="hidden print:block">
            <h1 className="text-lg font-bold text-neutral-900">Libro de Existencias</h1>
            <p className="text-sm text-neutral-600">
              Temporada: {report.season.name} ({report.season.year})
            </p>
            <p className="text-xs text-neutral-500">
              Mes: {formatMonthLabel(report.month)} · Impreso: {initialPrintDateLabel}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 print:hidden">
            <span className="rounded-full bg-neutral-100 px-3 py-1 text-sm font-medium text-neutral-700">
              Temporada: {report.season.name} ({report.season.year})
            </span>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
              Mes: {formatMonthLabel(report.month)}
            </span>
            <span className="rounded-full bg-amber-50 px-3 py-1 text-sm font-medium text-amber-700">
              {filteredMovements.length} movimientos
            </span>
          </div>

          {reportSummary && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 print:grid-cols-6 print:gap-2">
              <ReportSummaryCard
                title="Saldo Ant. Depósito"
                value={`${numberFormatter.format(reportSummary.previousBalance.deposito)} kg`}
              />
              <ReportSummaryCard
                title="Saldo Ant. Propio"
                value={`${numberFormatter.format(reportSummary.previousBalance.propio)} kg`}
              />
              <ReportSummaryCard
                title="Kilos Recibidos"
                value={`${numberFormatter.format(reportSummary.receivedKg)} kg`}
              />
              <ReportSummaryCard
                title="Compras"
                value={`${numberFormatter.format(reportSummary.purchasedKg)} kg`}
              />
              <ReportSummaryCard
                title="Cierre Depósito"
                value={`${numberFormatter.format(reportSummary.closingBalance.deposito)} kg`}
              />
              <ReportSummaryCard
                title="Cierre Propio"
                value={`${numberFormatter.format(reportSummary.closingBalance.propio)} kg`}
                hint={`Total cierre: ${numberFormatter.format(reportSummary.closingBalance.total)} kg`}
              />
            </div>
          )}

          {reportSummary && (
            <InventoryBalanceBarChart
              deposito={reportSummary.closingBalance.deposito}
              propio={reportSummary.closingBalance.propio}
              numberFormatter={numberFormatter}
            />
          )}

          <PrintableReportTable<InventoryBookMovementItem>
            title="Movimientos del Mes"
            subtitle="Recepciones y compras consolidadas por liquidación del mes seleccionado."
            columns={movementColumns}
            rows={filteredMovements}
            emptyMessage="Sin movimientos para el mes seleccionado."
          />

          <PrintableReportTable<InventoryBookSeasonSummaryItem>
            title="Resumen Mensual de Temporada"
            subtitle="Evolución mensual de saldos de Depósito y Propio durante la temporada."
            columns={monthlySummaryColumns}
            rows={seasonSummary.monthly}
            emptyMessage="Sin resumen mensual disponible para la temporada."
          />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 print:grid-cols-3 print:gap-2">
            <ReportSummaryCard
              title="Total Recibido Temporada"
              value={`${numberFormatter.format(seasonSummary.totals.receivedKg)} kg`}
            />
            <ReportSummaryCard
              title="Total Comprado Temporada"
              value={`${numberFormatter.format(seasonSummary.totals.purchasedKg)} kg`}
            />
            <ReportSummaryCard
              title="Saldo Final Temporada"
              value={`${numberFormatter.format(seasonSummary.totals.closingBalance.total)} kg`}
              hint={`Depósito: ${numberFormatter.format(
                seasonSummary.totals.closingBalance.deposito,
              )} kg · Propio: ${numberFormatter.format(
                seasonSummary.totals.closingBalance.propio,
              )} kg`}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryBookReport;
