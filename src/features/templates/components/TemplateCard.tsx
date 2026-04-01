'use client';

import React from 'react';
import { usePermissions } from '@/providers/PermissionsProvider';
import IconButton from '@/shared/components/ui/IconButton/IconButton';
import Badge from '@/shared/components/ui/Badge/Badge';
import { Template } from '../types/templates.types';

interface TemplateCardProps {
  template: Template;
  onEdit: (template: Template) => void;
  onDelete: (template: Template) => void;
}

const PARAM_LABELS: {
  key: keyof Template;
  label: string;
  groupKey?: keyof Template;
  special?: boolean;
}[] = [
  { key: 'availableHumedad',        label: 'Humedad',          groupKey: 'groupToleranceHumedad' },
  { key: 'availableGranosVerdes',   label: 'Granos Verdes',    groupKey: 'groupToleranceGranosVerdes' },
  { key: 'availableImpurezas',      label: 'Impurezas',        groupKey: 'groupToleranceImpurezas' },
  { key: 'availableVano',           label: 'Vano',             groupKey: 'groupToleranceVano' },
  { key: 'availableHualcacho',      label: 'Hualcacho',        groupKey: 'groupToleranceHualcacho' },
  { key: 'availableGranosManchados',label: 'Granos Manchados', groupKey: 'groupToleranceGranosManchados' },
  { key: 'availableGranosPelados',  label: 'Granos Pelados',   groupKey: 'groupToleranceGranosPelados' },
  { key: 'availableGranosYesosos',  label: 'Granos Yesosos',   groupKey: 'groupToleranceGranosYesosos' },
  { key: 'availableBonus',          label: 'Bonificación',     special: true },
  { key: 'availableDry',            label: 'Secado',           special: true },
];

export default function TemplateCard({
  template,
  onEdit,
  onDelete,
}: TemplateCardProps) {
  const { isAdmin } = usePermissions();
  const activeParams = PARAM_LABELS.filter((p) => template[p.key]);

  return (
    <article className="flex flex-col gap-3 rounded-lg border border-border-light bg-white p-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-primary truncate">
            {template.name}
          </h3>
        </div>
        {template.isDefault && (
          <Badge variant="success">
            Predeterminada
          </Badge>
        )}
      </div>

      {/* Tolerancia grupal */}
      {template.useToleranceGroup ? (
        <div className="rounded-md border border-secondary bg-secondary-20 px-3 py-2 flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-base">layers</span>
            <span className="text-xs font-semibold text-cyan-800">Grupo de tolerancia activo</span>
          </div>
          {template.groupToleranceName && (
            <span className="text-xs text-cyan-700">
              <span className="font-medium">Nombre:</span> {template.groupToleranceName}
            </span>
          )}
          {template.groupToleranceValue != null && (
            <span className="text-xs text-cyan-700">
              <span className="font-medium">Valor:</span> {Number(template.groupToleranceValue).toFixed(2)}%
            </span>
          )}
        </div>
      ) : (
        <div className="rounded-md border border-gray-100 bg-gray-50 px-3 py-1.5 flex items-center gap-2">
          <span className="material-symbols-outlined text-gray-400 text-base">layers_clear</span>
          <span className="text-xs text-gray-400">Sin grupo de tolerancia</span>
        </div>
      )}

      {/* Parámetros activos */}
      {activeParams.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {activeParams.map((p) => {
            if (p.special) {
              // Bonificación y Secado: sin fondo ni color destacado
              return (
                <span
                  key={p.key}
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium text-gray-400 border border-gray-200"
                >
                  {p.label}
                </span>
              );
            }
            const inGroup = p.groupKey && template.useToleranceGroup && template[p.groupKey];
            return (
              <span
                key={p.key}
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                  inGroup
                    ? 'bg-secondary-20 border border-secondary text-cyan-800'
                    : 'bg-blue-50 text-blue-700 border border-blue-100'
                }`}
              >
                {p.label}
              </span>
            );
          })}
        </div>
      )}

      {/* Acciones */}
      <div className="flex items-center justify-end gap-2 border-t border-border-light pt-3 mt-auto">
        <IconButton
          icon="edit"
          variant="basicSecondary"
          size="sm"
          onClick={() => onEdit(template)}
          title="Editar plantilla"
          disabled={!isAdmin}
        />
        <IconButton
          icon="delete"
          variant="basicSecondary"
          size="sm"
          onClick={() => onDelete(template)}
          title="Eliminar plantilla"
          disabled={!isAdmin}
        />
      </div>
    </article>
  );
}
