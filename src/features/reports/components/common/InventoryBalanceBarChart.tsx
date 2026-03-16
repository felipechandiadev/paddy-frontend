'use client';

import React, { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface InventoryBalanceBarChartProps {
  deposito: number;
  propio: number;
  numberFormatter: Intl.NumberFormat;
}

interface BarItem {
  key: 'deposito' | 'propio';
  label: string;
  value: number;
  positiveColor: string;
  negativeColor: string;
}

const InventoryBalanceBarChart: React.FC<InventoryBalanceBarChartProps> = ({
  deposito,
  propio,
  numberFormatter,
}) => {
  const items = useMemo<BarItem[]>(
    () => [
      {
        key: 'deposito',
        label: 'Depósito',
        value: deposito,
        positiveColor: '#10b981',
        negativeColor: '#e11d48',
      },
      {
        key: 'propio',
        label: 'Propio',
        value: propio,
        positiveColor: '#3b82f6',
        negativeColor: '#f59e0b',
      },
    ],
    [deposito, propio],
  );

  const maxAbsoluteValue = useMemo(
    () => Math.max(1, ...items.map((item) => Math.abs(item.value))),
    [items],
  );

  const yDomain = useMemo(
    () => [maxAbsoluteValue * -1, maxAbsoluteValue] as [number, number],
    [maxAbsoluteValue],
  );

  return (
    <section className="rounded-xl border border-neutral-200 bg-white px-4 py-4 print:hidden">
      <h3 className="text-base font-semibold text-neutral-900">
        Barras Verticales de Saldos del Mes
      </h3>
      <p className="mt-1 text-sm text-neutral-600">
        Comparación entre saldo en Depósito y saldo Propio para el mes seleccionado.
      </p>

      <div className="mt-4 h-72 w-full rounded-md border border-neutral-200 bg-neutral-50 p-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={items} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" />
            <YAxis
              domain={yDomain}
              tickFormatter={(value) => numberFormatter.format(value)}
            />
            <ReferenceLine y={0} stroke="#6b7280" strokeDasharray="4 4" />
            <Tooltip />
            <Bar dataKey="value" name="Saldo" unit=" kg">
              {items.map((entry) => (
                <Cell
                  key={entry.key}
                  fill={entry.value >= 0 ? entry.positiveColor : entry.negativeColor}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-neutral-500">
        <span>Valores negativos: bajo cero</span>
        <span>Valores positivos: sobre cero</span>
      </div>
    </section>
  );
};

export default InventoryBalanceBarChart;