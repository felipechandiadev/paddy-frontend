'use client';

import React from 'react';
import { useCan } from '@/shared/hooks/useCan';
import IconButton from '@/shared/components/ui/IconButton/IconButton';
import { Producer } from '../types/producers.types';

interface ProducersDataGridProps {
  producers: Producer[];
  isLoading: boolean;
  onAdd: () => void;
  onView: (producer: Producer) => void;
  onDelete: (producer: Producer) => void;
}

export default function ProducersDataGrid({
  producers,
  isLoading,
  onAdd,
  onView,
  onDelete,
}: ProducersDataGridProps) {
  const { can } = useCan();
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center">
        <p className="text-gray-500">Cargando productores...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left font-semibold text-gray-900">RUT</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-900">Nombre</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-900">Email</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-900">Teléfono</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-900">Ciudad</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-900">Estado</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-900">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {producers.map((producer) => (
              <tr key={producer.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-3 text-gray-700">{producer.rut}</td>
                <td className="px-6 py-3 text-gray-900 font-medium">{producer.name}</td>
                <td className="px-6 py-3 text-gray-700">{producer.email}</td>
                <td className="px-6 py-3 text-gray-700">{producer.phone}</td>
                <td className="px-6 py-3 text-gray-700">{producer.city}</td>
                <td className="px-6 py-3">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      producer.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {producer.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-6 py-3">
                  <div className="flex gap-1">
                    <IconButton
                      icon="visibility"
                      variant="basicSecondary"
                      size="sm"
                      onClick={() => onView(producer)}
                      ariaLabel="Ver detalle"
                      title="Ver detalle"
                    />
                    <IconButton
                      icon="delete"
                      variant="basicSecondary"
                      size="sm"
                      onClick={() => onDelete(producer)}
                      ariaLabel="Eliminar"
                      title="Eliminar"
                      disabled={!can('producers.delete')}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {producers.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No hay productores registrados</p>
          <button
            onClick={onAdd}
            disabled={!can('producers.create')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Agregar Productor
          </button>
        </div>
      )}
    </div>
  );
}
