'use client';

import { User } from '../types/users.types';
import Badge from '@/shared/components/ui/Badge/Badge';
import IconButton from '@/shared/components/ui/IconButton/IconButton';

interface UserCardProps {
  user: User;
  onEdit?: (user: User) => void;
  onDelete?: (user: User) => void;
}

export default function UserCard({ user, onEdit, onDelete }: UserCardProps) {
  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'primary';
      case 'CONSULTANT':
        return 'info';
      default:
        return 'secondary-outlined';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'Administrador';
      case 'CONSULTANT':
        return 'Consultor';
      default:
        return role;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <article className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden p-2 flex flex-col justify-between">
      {/* Contenido principal */}
      <div className="flex-grow">
{/* Email y Nombre */}
      <div className="mb-2">
        <h3 className="text-lg font-bold text-foreground truncate">{user.name}</h3>
        <p className="text-sm text-neutral-600 truncate">{user.email}</p>
        </div>

        {/* Role Badge */}
        <div className="flex justify-start gap-2 mb-4">
          <Badge variant={getRoleBadgeVariant(user.role)}>
            {getRoleLabel(user.role)}
          </Badge>
        </div>

        {/* Información adicional */}
        <div className="space-y-2 text-xs text-neutral-600">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">calendar_today</span>
            <span>Creado: {formatDate(user.createdAt)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">update</span>
            <span>Actualizado: {formatDate(user.updatedAt)}</span>
          </div>
        </div>
      </div>

      {/* Footer de acciones */}
      <div className="flex gap-2 justify-end pt-2 border-t border-gray-200">
        <IconButton
          icon="edit"
          variant="basicSecondary"
          size="sm"
          onClick={() => onEdit?.(user)}
          title="Editar usuario"
        />
        <IconButton
          icon="delete"
          variant="basicSecondary"
          size="sm"
          onClick={() => onDelete?.(user)}
          title="Eliminar usuario"
        />
      </div>
    </article>
  );
}
