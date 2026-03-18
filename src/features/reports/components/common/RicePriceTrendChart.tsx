'use client';

import React, { useMemo } from 'react';
import { LineSeries, ResponsiveLine } from '@nivo/line';
import { RicePriceSeries, ReportGroupBy } from '../../types/reports.types';
import { REPORT_GROUP_BY_LABELS } from './reportUtils';

const RICE_PRICE_CHART_COLORS = [
  '#0f766e',
  '#0ea5e9',
  '#f59e0b',
  '#8b5cf6',
  '#ef4444',
  '#10b981',
  '#f97316',
  '#6366f1',
];

interface RicePriceTrendChartProps {
  series: RicePriceSeries[];
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

const RicePriceTrendChart: React.FC<RicePriceTrendChartProps> = ({
  series,
  groupBy,
  currencyFormatter,
}) => {
  const allPeriods = useMemo(() => {
    if (series.length === 0) return [];
    return series[0].data.map((d) => d.periodKey);
  }, [series]);

  const tickValues = useMemo(() => buildTickValues(allPeriods), [allPeriods]);

  const tickRotation = allPeriods.length > 8 ? -35 : 0;

  const chartData = useMemo<LineSeries[]>(
    () =>
      series.map((rt) => ({
        id: rt.riceTypeName,
        data: rt.data.map((point) => ({
          x: point.periodKey,
          y: point.weightedAvgPrice ?? 0,
        })),
      })),
    [series],
  );

  if (series.length === 0 || allPeriods.length === 0) {
    return (
      <section className="rounded-xl border border-neutral-200 bg-white px-4 py-4 print:hidden">
        <h3 className="text-base font-semibold text-neutral-900">Gráfico de Evolución de Precios</h3>
        <p className="mt-1 text-sm text-neutral-600">
          No hay datos para graficar con los filtros actuales.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-neutral-200 bg-white px-2 py-3 print:hidden">
      <div className="border-b border-neutral-200 px-2 py-1">
        <h3 className="text-base font-semibold text-neutral-900">Evolución del Precio Promedio por Tipo de Arroz</h3>
        <p className="mt-1 text-sm text-neutral-600">
          Precio promedio ponderado ($/kg paddy) agrupado por {REPORT_GROUP_BY_LABELS[groupBy].toLowerCase()}. Solo recepciones liquidadas.
        </p>
      </div>

      <div className="h-[380px] w-full pt-3">
        <ResponsiveLine
          data={chartData}
          margin={{ top: 20, right: 20, bottom: 96, left: 120 }}
          xScale={{ type: 'point' }}
          yScale={{ type: 'linear', min: 'auto', max: 'auto', stacked: false, reverse: false }}
          curve="monotoneX"
          axisTop={null}
          axisRight={null}
          axisBottom={{
            tickValues,
            tickRotation,
            legend: `Período (${REPORT_GROUP_BY_LABELS[groupBy]})`,
            legendOffset: 64,
            legendPosition: 'middle',
          }}
          axisLeft={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: 'Precio promedio ($/kg)',
            legendOffset: -100,
            legendPosition: 'start',
            format: (value) => currencyFormatter.format(Number(value)),
          }}
          enableGridX={false}
          colors={RICE_PRICE_CHART_COLORS}
          pointSize={8}
          pointColor={{ theme: 'background' }}
          pointBorderWidth={2}
          pointBorderColor={{ from: 'serieColor' }}
          lineWidth={3}
          useMesh={true}
          enableSlices="x"
          sliceTooltip={({ slice }) => (
            <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2 shadow-lg">
              <p className="mb-1 text-xs font-semibold text-neutral-500">
                Período: {slice.points[0]?.data.x as string}
              </p>
              {slice.points.map((point) => (
                <div key={point.id} className="flex items-center gap-2 text-xs">
                  <span
                    className="inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full"
                    style={{ background: point.seriesColor }}
                  />
                  <span className="font-medium text-neutral-700">{point.seriesId}:</span>
                  <span className="text-neutral-900">
                    {currencyFormatter.format(Number(point.data.y))}/kg
                  </span>
                </div>
              ))}
            </div>
          )}
          legends={[
            {
              anchor: 'bottom',
              direction: 'row',
              justify: false,
              translateX: 0,
              translateY: 86,
              itemsSpacing: 16,
              itemDirection: 'left-to-right',
              itemWidth: 130,
              itemHeight: 14,
              itemOpacity: 0.9,
              symbolSize: 11,
              symbolShape: 'circle',
            },
          ]}
        />
      </div>
    </section>
  );
};

export default RicePriceTrendChart;
