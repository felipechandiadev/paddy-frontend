'use client';

import { Season } from '../types/seasons.types';
import { usePermissions } from '@/providers/PermissionsProvider';
import Badge from '@/shared/components/ui/Badge/Badge';
import IconButton from '@/shared/components/ui/IconButton/IconButton';

interface SeasonCardProps {
  season: Season;
  onEdit?: (season: Season) => void;
  onDelete?: (season: Season) => void;
}

// Parsea una fecha ISO (ej: "2024-03-01T00:00:00.000Z") como fecha local,
// evitando el desfase UTC que hace retroceder un día en zonas UTC-.
const parseLocalDate = (isoString: string) => {
  const [datePart] = isoString.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const formatDate = (isoString: string) =>
  parseLocalDate(isoString).toLocaleDateString('es-CL', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

export default function SeasonCard({ season, onEdit, onDelete }: SeasonCardProps) {
  const { isAdmin } = usePermissions();
  const startDate = formatDate(season.startDate);
  const endDate = formatDate(season.endDate);

  return (
    <article className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden p-2 flex flex-col justify-between">
      {/* Contenido principal */}
      <div className="flex-grow">
        {/* Nombre y Año */}
        <div className="mb-2">
          <h3 className="text-lg font-bold text-foreground truncate">{season.name}</h3>
          <p className="text-sm text-neutral-600 truncate">Año: {season.year}</p>
        </div>

        {/* Status Badge */}
        <div className="flex justify-start gap-2 mb-4">
          <Badge variant={season.isActive ? 'primary' : 'secondary'}>
            {season.isActive ? 'Activa' : 'Inactiva'}
          </Badge>
        </div>

        {/* Información de fechas */}
        <div className="space-y-2 text-xs text-neutral-600">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">calendar_today</span>
            <span>Inicio: {startDate}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">calendar_today</span>
            <span>Fin: {endDate}</span>
          </div>
        </div>
      </div>

      {/* Footer de acciones */}
      <div className="flex gap-2 justify-end pt-2 border-t border-gray-200">
        <IconButton
          icon="edit"
          variant="basicSecondary"
          size="sm"
          onClick={() => onEdit?.(season)}
          title="Editar temporada"
          disabled={!isAdmin}
        />
        <IconButton
          icon="delete"
          variant="basicSecondary"
          size="sm"
          onClick={() => onDelete?.(season)}
          title="Eliminar temporada"
          disabled={!isAdmin}
        />
      </div>
    </article>
  );
}
