'use client';

import React, { useMemo } from 'react';
import { LineSeries, ResponsiveLine } from '@nivo/line';
import { BudgetReturnMonthlyItem } from '../../types/reports.types';

interface BudgetReturnMonthlyChartProps {
  monthly: BudgetReturnMonthlyItem[];
  currencyFormatter: Intl.NumberFormat;
}

function buildTickValues(periods: string[]): string[] {
  if (periods.length <= 8) {
    return periods;
  }

  const step = Math.ceil(periods.length / 8);

  return periods.filter((_, index) => index % step === 0 || index === periods.length - 1);
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
    month: 'short',
    year: 'numeric',
  });
}

const BudgetReturnMonthlyChart: React.FC<BudgetReturnMonthlyChartProps> = ({
  monthly,
  currencyFormatter,
}) => {
  const periods = useMemo(() => monthly.map((item) => item.month), [monthly]);
  const tickValues = useMemo(() => buildTickValues(periods), [periods]);
  const tickRotation = periods.length > 8 ? -35 : 0;

  const chartData = useMemo<LineSeries[]>(
    () => [
      {
        id: 'Capital desembolsado (acum.)',
        data: monthly.map((item) => ({ x: item.month, y: item.cumulativeDisbursed })),
      },
      {
        id: 'Capital recuperado (acum.)',
        data: monthly.map((item) => ({ x: item.month, y: item.cumulativeRecovered })),
      },
      {
        id: 'Saldo pendiente',
        data: monthly.map((item) => ({ x: item.month, y: item.pendingBalance })),
      },
    ],
    [monthly],
  );

  if (monthly.length === 0) {
    return (
      <section className="rounded-xl border border-neutral-200 bg-white px-4 py-4 print:hidden">
        <h3 className="text-base font-semibold text-neutral-900">Tendencia de capital</h3>
        <p className="mt-1 text-sm text-neutral-600">
          No hay datos para graficar con los filtros actuales.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-neutral-200 bg-white px-2 py-3 print:hidden">
      <div className="border-b border-neutral-200 px-2 py-1">
        <h3 className="text-base font-semibold text-neutral-900">Tendencia de capital</h3>
        <p className="mt-1 text-sm text-neutral-600">
          Evolucion mensual del desembolso acumulado, recuperacion acumulada y saldo pendiente.
        </p>
      </div>

      <div className="h-[380px] w-full pt-3">
        <ResponsiveLine
          data={chartData}
          margin={{ top: 20, right: 20, bottom: 96, left: 118 }}
          xScale={{ type: 'point' }}
          yScale={{ type: 'linear', min: 0, max: 'auto', stacked: false, reverse: false }}
          curve="monotoneX"
          axisTop={null}
          axisRight={null}
          axisBottom={{
            tickValues,
            tickRotation,
            legend: 'Mes',
            legendOffset: 64,
            legendPosition: 'middle',
            format: (value) => formatMonthLabel(String(value)),
          }}
          axisLeft={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: 'Monto (CLP)',
            legendOffset: -96,
            legendPosition: 'start',
            format: (value) => currencyFormatter.format(Number(value)),
          }}
          enableGridX={false}
          colors={['#334155', '#0f766e', '#b91c1c']}
          pointSize={8}
          pointColor={{ theme: 'background' }}
          pointBorderWidth={2}
          pointBorderColor={{ from: 'serieColor' }}
          lineWidth={3}
          useMesh={true}
          legends={[
            {
              anchor: 'bottom',
              direction: 'row',
              justify: false,
              translateX: 0,
              translateY: 86,
              itemsSpacing: 12,
              itemDirection: 'left-to-right',
              itemWidth: 170,
              itemHeight: 14,
              itemOpacity: 0.9,
              symbolSize: 11,
              symbolShape: 'circle',
            },
          ]}
          tooltip={({ point }) => (
            <div className="rounded border border-neutral-200 bg-white px-3 py-2 text-xs shadow">
              <p className="font-semibold text-neutral-800">
                {formatMonthLabel(String(point.data.x))}
              </p>
              <p style={{ color: point.seriesColor }}>
                {point.seriesId}: {currencyFormatter.format(Number(point.data.y ?? 0))}
              </p>
            </div>
          )}
          theme={{
            text: {
              fontSize: 11,
              fill: '#525252',
            },
            axis: {
              legend: {
                text: {
                  fontSize: 11,
                  fill: '#404040',
                },
              },
            },
            grid: {
              line: {
                stroke: '#e5e5e5',
                strokeWidth: 1,
              },
            },
            tooltip: {
              container: {
                background: '#ffffff',
                color: '#171717',
                fontSize: 12,
                borderRadius: 6,
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
              },
            },
          }}
        />
      </div>
    </section>
  );
};

export default BudgetReturnMonthlyChart;
