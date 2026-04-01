'use client';

import React, { useMemo } from 'react';
import { LineSeries, ResponsiveLine } from '@nivo/line';
import { FinancialProfitabilityByProducerItem } from '../../types/reports.types';

interface FinancialProfitabilityProducerChartProps {
  rows: FinancialProfitabilityByProducerItem[];
  currencyFormatter: Intl.NumberFormat;
}

function buildTickValues(labels: string[]): string[] {
  if (labels.length <= 7) {
    return labels;
  }

  const step = Math.ceil(labels.length / 7);

  return labels.filter((_, index) => index % step === 0 || index === labels.length - 1);
}

const FinancialProfitabilityProducerChart: React.FC<
  FinancialProfitabilityProducerChartProps
> = ({ rows, currencyFormatter }) => {
  const labels = useMemo(
    () => rows.map((item, index) => `${index + 1}. ${item.producerName}`),
    [rows],
  );

  const tickValues = useMemo(() => buildTickValues(labels), [labels]);
  const tickRotation = labels.length > 5 ? -30 : 0;

  const chartData = useMemo<LineSeries[]>(
    () => [
      {
        id: 'Interes al corte',
        data: rows.map((item, index) => ({
          x: `${index + 1}. ${item.producerName}`,
          y: item.interestAtCutoff,
        })),
      },
      {
        id: 'Interes proyectado temporada',
        data: rows.map((item, index) => ({
          x: `${index + 1}. ${item.producerName}`,
          y: item.projectedInterest,
        })),
      },
    ],
    [rows],
  );

  if (rows.length === 0) {
    return (
      <section className="rounded-xl border border-neutral-200 bg-white px-4 py-4 print:hidden">
        <h3 className="text-base font-semibold text-neutral-900">Evolucion por productor</h3>
        <p className="mt-1 text-sm text-neutral-600">
          No hay productores para graficar con los filtros actuales.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-neutral-200 bg-white px-2 py-3 print:hidden">
      <div className="border-b border-neutral-200 px-2 py-1">
        <h3 className="text-base font-semibold text-neutral-900">Evolucion por productor</h3>
        <p className="mt-1 text-sm text-neutral-600">
          Comparacion entre interes actual devengado y proyeccion al cierre de temporada.
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
            legend: 'Productores',
            legendOffset: 66,
            legendPosition: 'middle',
          }}
          axisLeft={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: 'Interes (CLP)',
            legendOffset: -96,
            legendPosition: 'start',
            format: (value) => currencyFormatter.format(Number(value)),
          }}
          enableGridX={false}
          colors={['#0f766e', '#1d4ed8']}
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
              itemWidth: 180,
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

export default FinancialProfitabilityProducerChart;
