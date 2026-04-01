'use client';

import { useEffect, useState } from 'react';
import { signOut } from 'next-auth/react';
import Alert from '@/shared/components/ui/Alert/Alert';
import { Button } from '@/shared/components/ui/Button/Button';
import Dialog from '@/shared/components/ui/Dialog/Dialog';
import { TextField } from '@/shared/components/ui/TextField/TextField';
import {
  changePassword,
  type ChangePasswordPayload,
} from '../actions/changePassword.action';

interface ChangePasswordDialogProps {
  open: boolean;
  onClose: () => void;
}

const createInitialState = (): ChangePasswordPayload => ({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
});

export default function ChangePasswordDialog({
  open,
  onClose,
}: ChangePasswordDialogProps) {
  const [form, setForm] = useState<ChangePasswordPayload>(createInitialState);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setForm(createInitialState());
      setError(null);
      setSuccessMessage(null);
      setIsSaving(false);
    }
  }, [open]);

  const handleFieldChange = (
    field: keyof ChangePasswordPayload,
    value: string,
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
    setError(null);
    setSuccessMessage(null);
  };

  const handleSubmit = async () => {
    if (!form.currentPassword.trim()) {
      setError('Debes ingresar tu contraseña actual');
      return;
    }

    if (!form.newPassword.trim()) {
      setError('Debes ingresar la nueva contraseña');
      return;
    }

    if (form.newPassword.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres');
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setError('La confirmación de contraseña no coincide');
      return;
    }

    if (form.currentPassword === form.newPassword) {
      setError('La nueva contraseña debe ser distinta a la actual');
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    const result = await changePassword(form);

    setIsSaving(false);

    if (!result.success) {
      setError(result.error || 'No fue posible actualizar la contraseña');
      return;
    }

    setSuccessMessage(
      result.message ||
        'Contraseña actualizada correctamente. Se cerrará la sesión.',
    );

    await signOut({ callbackUrl: '/' });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Cambiar contraseña"
      size="sm"
      showCloseButton={false}
      actions={
        <div className="flex gap-3 justify-between">
          <Button variant="outlined" onClick={onClose} disabled={isSaving}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            loading={isSaving}
            disabled={isSaving}
          >
            Actualizar contraseña
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {error && <Alert variant="error">{error}</Alert>}
        {successMessage && <Alert variant="success">{successMessage}</Alert>}

        <TextField
          label="Contraseña actual"
          type="password"
          value={form.currentPassword}
          onChange={(event) =>
            handleFieldChange('currentPassword', event.target.value)
          }
          placeholder="Ingresa tu contraseña actual"
          autoComplete="current-password"
          disabled={isSaving}
          required
        />

        <TextField
          label="Nueva contraseña"
          type="password"
          value={form.newPassword}
          onChange={(event) =>
            handleFieldChange('newPassword', event.target.value)
          }
          placeholder="Mínimo 8 caracteres"
          autoComplete="new-password"
          disabled={isSaving}
          required
        />

        <TextField
          label="Confirmar nueva contraseña"
          type="password"
          value={form.confirmPassword}
          onChange={(event) =>
            handleFieldChange('confirmPassword', event.target.value)
          }
          placeholder="Repite la nueva contraseña"
          autoComplete="new-password"
          disabled={isSaving}
          required
        />

        <p className="text-xs text-neutral-500">
          Al actualizar la contraseña se cerrará tu sesión por seguridad.
        </p>
      </div>
    </Dialog>
  );
}
