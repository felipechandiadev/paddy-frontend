'use client';

import React from 'react';
import { usePermissions } from '@/providers/PermissionsProvider';
import IconButton from '@/shared/components/ui/IconButton/IconButton';
import Badge from '@/shared/components/ui/Badge/Badge';
import { RiceType } from '../types/rice-types.types';

interface RiceTypeCardProps {
  riceType: RiceType;
  onEdit: (riceType: RiceType) => void;
  onDelete: (riceType: RiceType) => void;
}

export default function RiceTypeCard({
  riceType,
  onEdit,
  onDelete,
}: RiceTypeCardProps) {
  const { isAdmin } = usePermissions();
  return (
    <article className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden p-2 flex flex-col justify-between">
      <div className="flex-grow">
        <div className="mb-2">
          <h3 className="text-lg font-bold text-foreground truncate">{riceType.name}</h3>
        </div>

        <div className="flex justify-start gap-2 mb-4">
          <Badge variant={riceType.isActive ? 'success' : 'secondary'}>
            {riceType.isActive ? 'Activo' : 'Inactivo'}
          </Badge>
        </div>

        {riceType.description && (
          <div className="mb-4">
            <p className="text-sm text-neutral-600 line-clamp-2">{riceType.description}</p>
          </div>
        )}

        {riceType.referencePrice !== undefined && riceType.referencePrice !== null && (
          <div className="text-xs text-neutral-600 mb-2">
            <span className="font-medium text-neutral-700">Precio referencia:</span> ${riceType.referencePrice}
          </div>
        )}
      </div>

      <div className="flex gap-2 justify-end pt-2 border-t border-gray-200">
        <IconButton
          icon="edit"
          variant="basicSecondary"
          size="sm"
          onClick={() => onEdit(riceType)}
          title="Editar tipo de arroz"
          disabled={!isAdmin}
        />
        <IconButton
          icon="delete"
          variant="basicSecondary"
          size="sm"
          onClick={() => onDelete(riceType)}
          title="Eliminar tipo de arroz"
          disabled={!isAdmin}
        />
      </div>
    </article>
  );
}
