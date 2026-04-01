'use client';

import React, { useMemo } from 'react';
import { LineSeries, ResponsiveLine } from '@nivo/line';
import { DryingReportTrendItem, ReportGroupBy } from '../../types/reports.types';
import { REPORT_GROUP_BY_LABELS } from './reportUtils';

interface DryingRevenueTrendChartProps {
  trend: DryingReportTrendItem[];
  groupBy: ReportGroupBy;
  currencyFormatter: Intl.NumberFormat;
}

function buildTickValues(periods: string[]): string[] {
  if (periods.length <= 8) {
    return periods;
  }

  const step = Math.ceil(periods.length / 8);

  return periods.filter((_, index) => index % step === 0 || index === periods.length - 1);
}

const DryingRevenueTrendChart: React.FC<DryingRevenueTrendChartProps> = ({
  trend,
  groupBy,
  currencyFormatter,
}) => {
  const periods = useMemo(() => trend.map((item) => item.period), [trend]);

  const tickValues = useMemo(() => buildTickValues(periods), [periods]);

  const tickRotation = periods.length > 8 ? -35 : 0;

  const chartData = useMemo<LineSeries[]>(
    () => [
      {
        id: 'Neto Secado',
        data: trend.map((item) => ({ x: item.period, y: item.netDryingRevenue })),
      },
      {
        id: 'IVA Estimado',
        data: trend.map((item) => ({ x: item.period, y: item.estimatedDryingVat })),
      },
      {
        id: 'Total Secado',
        data: trend.map((item) => ({ x: item.period, y: item.totalDryingRevenue })),
      },
    ],
    [trend],
  );

  if (trend.length === 0) {
    return (
      <section className="rounded-xl border border-neutral-200 bg-white px-4 py-4 print:hidden">
        <h3 className="text-base font-semibold text-neutral-900">Gráfico de Tendencia temporal</h3>
        <p className="mt-1 text-sm text-neutral-600">
          No hay datos para graficar con los filtros actuales.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-neutral-200 bg-white px-2 py-3 print:hidden">
      <div className="border-b border-neutral-200 px-2 py-1">
        <h3 className="text-base font-semibold text-neutral-900">Gráfico de Tendencia temporal</h3>
        <p className="mt-1 text-sm text-neutral-600">
          Evolución de neto, IVA y total según agrupación por {REPORT_GROUP_BY_LABELS[groupBy].toLowerCase()}.
        </p>
      </div>

      <div className="h-[360px] w-full pt-3">
        <ResponsiveLine
          data={chartData}
          margin={{ top: 20, right: 20, bottom: 96, left: 112 }}
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
          }}
          axisLeft={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: 'Recaudación (CLP)',
            legendOffset: -92,
            legendPosition: 'start',
            format: (value) => currencyFormatter.format(Number(value)),
          }}
          enableGridX={false}
          colors={['#0f766e', '#0ea5e9', '#0f172a']}
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
              itemsSpacing: 16,
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
              <p className="font-semibold text-neutral-800">{String(point.data.x)}</p>
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

export default DryingRevenueTrendChart;
