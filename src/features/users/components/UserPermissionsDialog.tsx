'use client';

import { useEffect, useState, useMemo } from 'react';
import Dialog from '@/shared/components/ui/Dialog/Dialog';
import { Button } from '@/shared/components/ui/Button/Button';
import { User } from '../types/users.types';
import { useUserPermissions } from '../hooks/useUserPermissions';
import { PERMISSION_CATALOG, PERMISSION_GROUPS } from '../constants/permissions.constants';

interface UserPermissionsDialogProps {
  open: boolean;
  user: User | null;
  onClose: () => void;
}

export default function UserPermissionsDialog({
  open,
  user,
  onClose,
}: UserPermissionsDialogProps) {
  const { data, loading, saving, error, load, save } = useUserPermissions(
    user?.id ?? '',
  );

  // Permisos efectivos actuales del usuario (conjunto editable)
  const [assigned, setAssigned] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (open && user) {
      void load();
    }
  }, [open, user, load]);

  useEffect(() => {
    if (data) {
      setAssigned(new Set(data.effective));
    }
  }, [data]);

  // Catalogo agrupado
  const groupedCatalog = useMemo(() => {
    return PERMISSION_GROUPS.map((group) => ({
      group,
      permissions: PERMISSION_CATALOG.filter((p) => p.group === group),
    }));
  }, []);

  const toggle = (key: string) => {
    setAssigned((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (!user || !data) return;

    // Calcular grants y revokes respecto a los efectivos originales
    const original = new Set(data.effective);
    const grants: string[] = [];
    const revokes: string[] = [];

    for (const p of PERMISSION_CATALOG) {
      const wasAssigned = original.has(p.key);
      const isAssigned = assigned.has(p.key);
      if (!wasAssigned && isAssigned) grants.push(p.key);
      if (wasAssigned && !isAssigned) revokes.push(p.key);
    }

    try {
      await save(grants, revokes);
      onClose();
    } catch {
      // error ya manejado en el hook
    }
  };

  const handleClose = () => {
    if (!saving) onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title={user ? `Permisos de ${user.name}` : 'Permisos'}
      size="lg"
      persistent={saving}
      actions={
        <div className="flex gap-3 justify-end">
          <Button variant="outlined" onClick={handleClose} disabled={saving}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={loading || saving}>
            {saving ? 'Guardando…' : 'Guardar permisos'}
          </Button>
        </div>
      }
    >
      {loading && (
        <div className="flex items-center justify-center py-10 text-neutral-500 text-sm">
          Cargando permisos…
        </div>
      )}

      {!loading && error && (
        <div className="text-red-600 text-sm px-2 py-4">{error}</div>
      )}

      {!loading && !error && data && (
        <div className="flex flex-col gap-6 py-2">
          {groupedCatalog.map(({ group, permissions }) => (
            <div key={group}>
              <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2 border-b border-gray-100 pb-1">
                {group}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {permissions.map((p) => {
                  const isActive = assigned.has(p.key);
                  return (
                    <label
                      key={p.key}
                      className={`flex items-center gap-2 px-3 py-2 rounded cursor-pointer border transition-colors select-none ${
                        isActive
                          ? 'border-primary-300 bg-primary-50 text-primary-800'
                          : 'border-gray-200 bg-white text-neutral-600 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="accent-primary-600 w-4 h-4 shrink-0"
                        checked={isActive}
                        onChange={() => toggle(p.key)}
                      />
                      <span className="text-sm leading-snug">{p.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </Dialog>
  );
}
