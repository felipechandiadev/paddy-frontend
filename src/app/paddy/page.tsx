import Link from 'next/link';
import { fetchReceptions } from '@/features/receptions/actions/fetch.action';
import { fetchProducers } from '@/features/producers/actions/producers.action';
import {
  fetchAdvances,
  fetchSettlements,
  fetchTransactions,
} from '@/features/finances/actions/finances.action';
import { Transaction } from '@/features/finances/types/finances.types';

export const dynamic = 'force-dynamic';

interface MetricCard {
  id: string;
  label: string;
  value: string;
  supporting: string;
  tone: 'sky' | 'emerald' | 'amber' | 'rose';
}

const currencyFormatter = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat('es-CL', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const percentFormatter = new Intl.NumberFormat('es-CL', {
  style: 'percent',
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const datetimeFormatter = new Intl.DateTimeFormat('es-CL', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

function sumBy<T>(items: T[], selector: (item: T) => number): number {
  return items.reduce((total, item) => total + selector(item), 0);
}

function formatCurrency(value: number): string {
  return currencyFormatter.format(Number.isFinite(value) ? value : 0);
}

function formatNumber(value: number): string {
  return numberFormatter.format(Number.isFinite(value) ? value : 0);
}

function formatPercent(value: number): string {
  return percentFormatter.format(Number.isFinite(value) ? value : 0);
}

function getTransactionTypeLabel(type: Transaction['type']): string {
  const labels: Record<Transaction['type'], string> = {
    advance: 'Anticipo',
    payment: 'Pago',
    deduction: 'Descuento',
    interest: 'Interes',
    refund: 'Devolucion',
    settlement: 'Liquidacion',
  };

  return labels[type] ?? 'Movimiento';
}

function getToneClasses(tone: MetricCard['tone']): string {
  const toneClasses: Record<MetricCard['tone'], string> = {
    sky: 'from-sky-50 to-sky-100 border-sky-200 text-sky-900',
    emerald: 'from-emerald-50 to-emerald-100 border-emerald-200 text-emerald-900',
    amber: 'from-amber-50 to-amber-100 border-amber-200 text-amber-900',
    rose: 'from-rose-50 to-rose-100 border-rose-200 text-rose-900',
  };

  return toneClasses[tone];
}

export default async function PaddyPage() {
  const [producersResult, advancesResult, settlementsResult, transactionsResult] =
    await Promise.all([
      fetchProducers({ page: 1, limit: 10 }),
      fetchAdvances(),
      fetchSettlements(),
      fetchTransactions(),
    ]);

  const [analyzedReceptionsResult, settledReceptionsResult, cancelledReceptionsResult] =
    await Promise.all([
      fetchReceptions({ status: 'analyzed', includeDeleted: false, page: 1, limit: 1 }),
      fetchReceptions({ status: 'settled', includeDeleted: false, page: 1, limit: 1 }),
      fetchReceptions({ status: 'cancelled', includeDeleted: false, page: 1, limit: 1 }),
    ]);

  // Fetch actual reception data to calculate kg totals
  const [analyzedKgResult, settledKgResult] = await Promise.all([
    fetchReceptions({ status: 'analyzed', includeDeleted: false, page: 1, limit: 1000 }),
    fetchReceptions({ status: 'settled', includeDeleted: false, page: 1, limit: 1000 }),
  ]);

  const producersCount = producersResult.total;

  const analyzedReceptions = analyzedReceptionsResult.total;
  const settledReceptions = settledReceptionsResult.total;
  const cancelledReceptions = cancelledReceptionsResult.total;
  const totalReceptions = analyzedReceptions + settledReceptions + cancelledReceptions;

  // Calculate kg totals by status
  const analyzedKgTotal = sumBy(analyzedKgResult.data, (r) => r.paddyNeto || r.netWeight || 0);
  const settledKgTotal = sumBy(settledKgResult.data, (r) => r.paddyNeto || r.netWeight || 0);
  const totalKgBoth = analyzedKgTotal + settledKgTotal;

  const advances = advancesResult.data;
  const paidAdvances = advances.filter((advance) => advance.status === 'paid');
  const settledAdvances = advances.filter((advance) => advance.status === 'settled');
  const activeAdvanceExposure = sumBy(
    paidAdvances,
    (advance) => advance.amount + advance.accruedInterest,
  );

  const settlements = settlementsResult.data;
  const completedSettlements = settlements.filter(
    (settlement) => settlement.status === 'completed',
  );
  const draftSettlements = settlements.filter((settlement) => settlement.status === 'draft');

  const completedLiquidationAmount = sumBy(
    completedSettlements,
    (settlement) => settlement.liquidationTotal,
  );
  const pendingDraftAmount = sumBy(draftSettlements, (settlement) => settlement.amountDue);

  const operationCoverage =
    totalReceptions > 0 ? settledReceptions / totalReceptions : 0;
  const settlementCompletionRate =
    settlements.length > 0 ? completedSettlements.length / settlements.length : 0;
  const averageCompletedSettlement =
    completedSettlements.length > 0
      ? completedLiquidationAmount / completedSettlements.length
      : 0;

  const capitalAdvanced = sumBy(advances, (advance) => advance.amount);
  const accruedInterest = sumBy(
    advances.filter((advance) => advance.status !== 'cancelled'),
    (advance) => advance.accruedInterest,
  );

  const liquidationsByProducer = completedSettlements.reduce<Map<string, number>>(
    (accumulator, settlement) => {
      const producerName =
        settlement.producer?.name?.trim() || `Productor #${settlement.producerId}`;
      const currentTotal = accumulator.get(producerName) ?? 0;
      accumulator.set(producerName, currentTotal + settlement.liquidationTotal);
      return accumulator;
    },
    new Map(),
  );

  const topLiquidationProducers = Array.from(liquidationsByProducer.entries())
    .map(([producer, amount]) => ({ producer, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  const topProducerAmount = topLiquidationProducers[0]?.amount ?? 0;

  const recentTransactions = [...transactionsResult.data]
    .sort((a, b) => {
      const firstDate = new Date(a.transactionDate).getTime();
      const secondDate = new Date(b.transactionDate).getTime();
      return secondDate - firstDate;
    })
    .slice(0, 6);

  const dashboardMetrics: MetricCard[] = [
    {
      id: 'producers',
      label: 'Productores registrados',
      value: formatNumber(producersCount),
      supporting: `${formatNumber(analyzedReceptions)} recepciones analizadas`,
      tone: 'sky',
    },
    {
      id: 'receptions',
      label: 'Recepciones totales',
      value: formatNumber(totalReceptions),
      supporting: `${formatNumber(settledReceptions)} liquidadas`,
      tone: 'emerald',
    },
    {
      id: 'completed-settlements',
      label: 'Liquidaciones completadas',
      value: formatNumber(completedSettlements.length),
      supporting: `${formatPercent(settlementCompletionRate)} del total emitido`,
      tone: 'amber',
    },
    {
      id: 'liquidated-amount',
      label: 'Monto liquidado',
      value: formatCurrency(completedLiquidationAmount),
      supporting: `Promedio ${formatCurrency(averageCompletedSettlement)} por liquidacion`,
      tone: 'rose',
    },
    {
      id: 'active-advances',
      label: 'Anticipos vigentes',
      value: formatNumber(paidAdvances.length),
      supporting: `${formatCurrency(activeAdvanceExposure)} de exposicion activa`,
      tone: 'amber',
    },
    {
      id: 'capital-advanced',
      label: 'Capital anticipado acumulado',
      value: formatCurrency(capitalAdvanced),
      supporting: `${formatCurrency(accruedInterest)} en intereses devengados`,
      tone: 'sky',
    },
  ];

  return (
    <div className="space-y-6 p-5 md:space-y-8 md:p-8">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 text-white shadow-sm md:p-8">
        <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-sky-400/20 blur-3xl" />
        <div className="absolute -bottom-20 left-20 h-56 w-56 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="relative">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Bienvenido a Paddy</h1>
          <p className="mt-2 text-slate-200">
            Sistema de Gestión de Recepción y Finanzas de Arroz
          </p>
          <div className="mt-5 grid grid-cols-1 gap-3 text-sm text-slate-100 md:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-wide text-slate-300">Estado operacional</p>
              <p className="mt-1 text-lg font-semibold">{formatPercent(operationCoverage)} liquidado</p>
            </div>
            <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-wide text-slate-300">Recepciones por liquidar</p>
              <p className="mt-1 text-lg font-semibold">{formatNumber(analyzedReceptions)} pendientes</p>
            </div>
            <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-wide text-slate-300">Ultima actualizacion</p>
              <p className="mt-1 text-lg font-semibold">{datetimeFormatter.format(new Date())}</p>
            </div>
            <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-wide text-slate-300">Recepcionados (no liquidados)</p>
              <p className="mt-1 text-lg font-semibold">{formatNumber(analyzedKgTotal)} kg</p>
            </div>
            <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-wide text-slate-300">Liquidados</p>
              <p className="mt-1 text-lg font-semibold">{formatNumber(settledKgTotal)} kg</p>
            </div>
            <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-wide text-slate-300">Total temporada</p>
              <p className="mt-1 text-lg font-semibold">{formatNumber(totalKgBoth)} kg</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {dashboardMetrics.map((metric) => (
          <article
            key={metric.id}
            className={`rounded-2xl border bg-gradient-to-br p-5 shadow-sm ${getToneClasses(metric.tone)}`}
          >
            <p className="text-sm font-medium opacity-85">{metric.label}</p>
            <p className="mt-2 text-3xl font-bold tracking-tight">{metric.value}</p>
            <p className="mt-2 text-sm opacity-85">{metric.supporting}</p>
          </article>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm xl:col-span-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Top productores por monto liquidado</h2>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
              Ultimas liquidaciones
            </span>
          </div>
          <div className="mt-5 space-y-3">
            {topLiquidationProducers.length === 0 ? (
              <p className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-sm text-gray-600">
                No hay liquidaciones completadas para mostrar ranking.
              </p>
            ) : (
              topLiquidationProducers.map((producer) => {
                const width =
                  topProducerAmount > 0
                    ? Math.max((producer.amount / topProducerAmount) * 100, 8)
                    : 8;

                return (
                  <div key={producer.producer}>
                    <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                      <p className="truncate font-medium text-foreground">{producer.producer}</p>
                      <p className="font-semibold text-gray-700">{formatCurrency(producer.amount)}</p>
                    </div>
                    <div className="h-2 w-full rounded-full bg-gray-100">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </article>

        <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm xl:col-span-2">
          <h2 className="text-lg font-semibold text-foreground">Pulso financiero</h2>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
              <span className="text-gray-600">Saldo en borradores</span>
              <span className="font-semibold text-gray-900">{formatCurrency(pendingDraftAmount)}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
              <span className="text-gray-600">Anticipos liquidados</span>
              <span className="font-semibold text-gray-900">{formatNumber(settledAdvances.length)}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
              <span className="text-gray-600">Recepciones anuladas</span>
              <span className="font-semibold text-gray-900">{formatNumber(cancelledReceptions)}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
              <span className="text-gray-600">Movimientos registrados</span>
              <span className="font-semibold text-gray-900">{formatNumber(transactionsResult.total)}</span>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <Link
              href="/paddy/finances/settlements"
              className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
            >
              Ver liquidaciones
            </Link>
            <Link
              href="/paddy/finances/advances"
              className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-center text-sm font-semibold text-sky-700 transition hover:bg-sky-100"
            >
              Ver anticipos
            </Link>
          </div>
        </article>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Actividad reciente</h2>
          <Link
            href="/paddy/finances/payments"
            className="text-sm font-semibold text-sky-700 hover:text-sky-800"
          >
            Ir a pagos
          </Link>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-2 py-3">Fecha</th>
                <th className="px-2 py-3">Tipo</th>
                <th className="px-2 py-3">Productor</th>
                <th className="px-2 py-3 text-right">Monto</th>
              </tr>
            </thead>
            <tbody>
              {recentTransactions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-2 py-6 text-center text-gray-500">
                    No hay movimientos recientes.
                  </td>
                </tr>
              ) : (
                recentTransactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b border-gray-100 last:border-b-0">
                    <td className="px-2 py-3 text-gray-700">
                      {datetimeFormatter.format(new Date(transaction.transactionDate))}
                    </td>
                    <td className="px-2 py-3">
                      <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">
                        {getTransactionTypeLabel(transaction.type)}
                      </span>
                    </td>
                    <td className="px-2 py-3 text-gray-700">
                      {transaction.producer?.name || `Productor #${transaction.producerId}`}
                    </td>
                    <td className="px-2 py-3 text-right font-semibold text-gray-900">
                      {formatCurrency(transaction.amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
