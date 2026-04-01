'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { TextField } from '@/shared/components/ui/TextField/TextField';
import { Button } from '@/shared/components/ui/Button/Button';
import Alert from '@/shared/components/ui/Alert/Alert';
import { Season } from '../types/seasons.types';

interface UpdateSeasonDialogProps {
  open: boolean;
  season: Season | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function UpdateSeasonDialog({ open, season, onClose, onSuccess }: UpdateSeasonDialogProps) {
  const { data: session } = useSession();
  const [name, setName] = useState('');
  const [year, setYear] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open && season) {
      setName(season.name);
      setYear(season.year.toString());
      setStartDate(season.startDate.split('T')[0]);
      setEndDate(season.endDate.split('T')[0]);
      setError('');
    }
  }, [open, season]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('El nombre es requerido');
      return;
    }
    if (!year.trim()) {
      setError('El año es requerido');
      return;
    }
    if (!startDate) {
      setError('La fecha de inicio es requerida');
      return;
    }
    if (!endDate) {
      setError('La fecha de fin es requerida');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`http://localhost:3000/api/v1/configuration/seasons/${season?.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.user?.accessToken}`,
        },
        body: JSON.stringify({
          name,
          year: parseInt(year),
          startDate,
          endDate,
          isActive: season?.isActive || false,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al actualizar temporada');
      }

      setError('');
      setIsLoading(false);
      onClose();
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setIsLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-foreground">Editar Temporada</h2>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <TextField
            label="Nombre"
            type="text"
            placeholder="Ej: Temporada 2024"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isLoading}
          />

          <TextField
            label="Año"
            type="number"
            placeholder="2024"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            disabled={isLoading}
          />

          <TextField
            label="Fecha de Inicio"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            disabled={isLoading}
          />

          <TextField
            label="Fecha de Fin"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            disabled={isLoading}
          />

          {error && <Alert variant="error">{error}</Alert>}

          <div className="flex gap-3 pt-4 justify-between">
            <Button variant="outlined" onClick={onClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit" disabled={isLoading}>
              {isLoading ? 'Actualizando...' : 'Actualizar Temporada'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
