'use client';

import React from 'react';
import { useReceptionContext } from '../context/ReceptionContext';

export default function ReceptionSummary() {
  const { data } = useReceptionContext();

  // Usar los valores calculados del contexto
  const totalDiscounts = data.totalDiscounts;
  const bonus = data.bonus;
  const paddyNet = data.paddyNet;

  // Formato de moneda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(value);
  };

  // Formato de decimal con 2 dígitos
  const formatDecimal = (value: number) => {
    return new Intl.NumberFormat('es-CL', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Resumen</h3>

      {/* Cálculo de pesos */}
      <div className="space-y-2 p-3 bg-gray-100/60 rounded border border-gray-300/70">
        <div className="text-xs font-semibold text-gray-700">CÁLCULO DE PESOS</div>
        
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-700">Peso Bruto:</span>
          <span className="font-medium text-gray-900">{formatDecimal(data.grossWeight)} kg</span>
        </div>
        
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-700">Tara:</span>
          <span className="font-medium text-gray-900">{formatDecimal(data.tare)} kg</span>
        </div>

        <div className="border-t border-gray-300 my-1"></div>

        <div className="flex justify-between items-center font-semibold text-sm">
          <span className="text-gray-900">Peso Neto:</span>
          <span className="text-blue-600">{formatDecimal(data.netWeight)} kg</span>
        </div>
      </div>

      {/* Descuentos y Bonificación */}
      <div className="space-y-2 p-3 bg-red-100/35 rounded border border-red-200/70">
        <div className="text-xs font-semibold text-red-700">DESCUENTOS</div>
        
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-700">Total Descuentos:</span>
          <span className="font-semibold text-red-600">{formatDecimal(totalDiscounts)} kg</span>
        </div>

        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-700">Bonificación:</span>
          <span className="font-semibold text-green-600">+{formatDecimal(bonus)} kg</span>
        </div>
      </div>

      {/* Resultado Final */}
      <div className="space-y-2 p-3 bg-blue-100/35 rounded border border-blue-200/70">
        <div className="flex justify-between items-center font-bold text-lg">
          <span className="text-gray-900">Paddy Neto:</span>
          <span className="text-blue-700">{formatDecimal(paddyNet)} kg</span>
        </div>

        <div className="border-t border-blue-200 my-1"></div>

        <div className="text-xs text-gray-700 mb-2">Precio: {formatCurrency(data.price)}/kg</div>

        <div className="flex justify-between items-center font-bold text-sm bg-green-50 p-2 rounded">
          <span className="text-gray-900">Valor Total:</span>
          <span className="text-green-700 text-lg">{formatCurrency(paddyNet * data.price)}</span>
        </div>
      </div>
    </div>
  );
}
