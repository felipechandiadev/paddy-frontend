'use client';

import React, { useMemo } from 'react';
import { LineSeries, ResponsiveLine } from '@nivo/line';
import { ProcessYieldMonthlyItem, ReportGroupBy } from '../../types/reports.types';
import { REPORT_GROUP_BY_LABELS } from './reportUtils';

interface ProcessYieldTrendChartProps {
  monthly: ProcessYieldMonthlyItem[];
  groupBy: ReportGroupBy;
  numberFormatter: Intl.NumberFormat;
}

function buildTickValues(periods: string[]): string[] {
  if (periods.length <= 8) {
    return periods;
  }

  const step = Math.ceil(periods.length / 8);

  return periods.filter((_, index) => index % step === 0 || index === periods.length - 1);
}

function formatPeriodLabel(period: string, groupBy: ReportGroupBy): string {
  if (groupBy === 'month' && /^\d{4}-\d{2}$/.test(period)) {
    const parsed = new Date(`${period}-01T12:00:00`);

    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString('es-CL', {
        month: 'short',
        year: 'numeric',
      });
    }
  }

  return period;
}

const ProcessYieldTrendChart: React.FC<ProcessYieldTrendChartProps> = ({
  monthly,
  groupBy,
  numberFormatter,
}) => {
  const periods = useMemo(() => monthly.map((item) => item.period), [monthly]);
  const tickValues = useMemo(() => buildTickValues(periods), [periods]);
  const tickRotation = periods.length > 8 ? -35 : 0;

  const chartData = useMemo<LineSeries[]>(
    () => [
      {
        id: 'Kg Bruto',
        data: monthly.map((item) => ({ x: item.period, y: item.grossKg })),
      },
      {
        id: 'Kg Neto',
        data: monthly.map((item) => ({ x: item.period, y: item.netKg })),
      },
      {
        id: 'Merma Kg',
        data: monthly.map((item) => ({ x: item.period, y: item.shrinkageKg })),
      },
    ],
    [monthly],
  );

  if (monthly.length === 0) {
    return (
      <section className="rounded-xl border border-neutral-200 bg-white px-4 py-4 print:hidden">
        <h3 className="text-base font-semibold text-neutral-900">Tendencia de rendimiento</h3>
        <p className="mt-1 text-sm text-neutral-600">
          No hay datos para graficar con los filtros actuales.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-neutral-200 bg-white px-2 py-3 print:hidden">
      <div className="border-b border-neutral-200 px-2 py-1">
        <h3 className="text-base font-semibold text-neutral-900">Tendencia de rendimiento</h3>
        <p className="mt-1 text-sm text-neutral-600">
          Evolucion de kilos brutos, kilos netos y merma segun agrupacion por {REPORT_GROUP_BY_LABELS[groupBy].toLowerCase()}.
        </p>
      </div>

      <div className="h-[380px] w-full pt-3">
        <ResponsiveLine
          data={chartData}
          margin={{ top: 20, right: 20, bottom: 96, left: 100 }}
          xScale={{ type: 'point' }}
          yScale={{ type: 'linear', min: 0, max: 'auto', stacked: false, reverse: false }}
          curve="monotoneX"
          axisTop={null}
          axisRight={null}
          axisBottom={{
            tickValues,
            tickRotation,
            legend: `Periodo (${REPORT_GROUP_BY_LABELS[groupBy]})`,
            legendOffset: 64,
            legendPosition: 'middle',
            format: (value) => formatPeriodLabel(String(value), groupBy),
          }}
          axisLeft={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: 'Volumen (kg)',
            legendOffset: -76,
            legendPosition: 'start',
            format: (value) => numberFormatter.format(Number(value)),
          }}
          enableGridX={false}
          colors={['#334155', '#0f766e', '#b45309']}
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
              itemsSpacing: 14,
              itemDirection: 'left-to-right',
              itemWidth: 110,
              itemHeight: 14,
              itemOpacity: 0.9,
              symbolSize: 11,
              symbolShape: 'circle',
            },
          ]}
          tooltip={({ point }) => (
            <div className="rounded border border-neutral-200 bg-white px-3 py-2 text-xs shadow">
              <p className="font-semibold text-neutral-800">
                {formatPeriodLabel(String(point.data.x), groupBy)}
              </p>
              <p style={{ color: point.seriesColor }}>
                {point.seriesId}: {numberFormatter.format(Number(point.data.y ?? 0))} kg
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

export default ProcessYieldTrendChart;
