'use client';

import { useState, useEffect } from 'react';
import { createUser } from '../actions/createUser.action';
import { TextField } from '@/shared/components/ui/TextField/TextField';
import Select from '@/shared/components/ui/Select/Select';
import { Button } from '@/shared/components/ui/Button/Button';
import Alert from '@/shared/components/ui/Alert/Alert';
import { useRoles } from '../hooks/useRoles';

interface CreateUserDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function CreateUserDialog({ open, onClose }: CreateUserDialogProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'CONSULTANT'>('ADMIN');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { roles, isLoading: isLoadingRoles } = useRoles(open);

  useEffect(() => {
    if (!open) {
      setName('');
      setEmail('');
      setPassword('');
      setRole('ADMIN');
      setError('');
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validación
    if (!name.trim()) {
      setError('El nombre es requerido');
      return;
    }
    if (!email.trim()) {
      setError('El email es requerido');
      return;
    }
    if (!password.trim()) {
      setError('La contraseña es requerida');
      return;
    }
    if (!role) {
      setError('El rol es requerido');
      return;
    }

    setIsLoading(true);
    const result = await createUser({ name, email, password, role });

    if (!result.success) {
      setError(result.error || 'Error al crear usuario');
      setIsLoading(false);
      return;
    }

    // Limpiar y cerrar
    setName('');
    setEmail('');
    setPassword('');
    setRole('ADMIN');
    setError('');
    setIsLoading(false);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-foreground">Crear Nuevo Usuario</h2>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {/* Nombre */}
          <TextField
            label="Nombre"
            type="text"
            placeholder="Ingresa el nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isLoading}
          />

          {/* Email */}
          <TextField
            label="Email"
            type="email"
            placeholder="usuario@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
          />

          {/* Password */}
          <TextField
            label="Contraseña"
            type="password"
            placeholder="Ingresa la contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
          />

          <Select
            label="Rol"
            value={role}
            onChange={(value) => setRole((value as 'ADMIN' | 'CONSULTANT') || 'ADMIN')}
            options={roles}
            disabled={isLoading || isLoadingRoles}
            required
          />



          {/* Error Alert */}
          {error && <Alert variant="error">{error}</Alert>}

          {/* Footer */}
          <div className="flex gap-3 pt-4 justify-between">
            <Button
              variant="outlined"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? 'Creando...' : 'Crear Usuario'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
