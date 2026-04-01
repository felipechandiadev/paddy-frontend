'use client';

import { useEffect } from 'react';
import { Button } from '@/shared/components/ui/Button/Button';
import {
  getBackendConnectionMessage,
  isBackendConnectionError,
} from '@/lib/api/backend-connection-error';

interface PaddyErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function PaddyError({ error, reset }: PaddyErrorProps) {
  const isConnectionIssue = isBackendConnectionError(error);

  useEffect(() => {
    console.error(error);
  }, [error]);

  const title = isConnectionIssue
    ? 'Error de conexion con el servidor'
    : 'Ocurrio un error inesperado';

  const description = isConnectionIssue
    ? getBackendConnectionMessage(error)
    : 'No fue posible cargar esta pantalla. Intenta nuevamente y, si el problema persiste, revisa el estado del backend.';

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm sm:p-6">
      <div className="w-full max-w-2xl rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xl sm:p-8">
        <div className="mb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-neutral-400">
              Estado del sistema
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-neutral-950 sm:text-3xl">
              {title}
            </h1>
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 sm:p-5">
          <p className="text-sm leading-6 text-neutral-700 sm:text-base">
            {description}
          </p>

          {isConnectionIssue && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Asegurate de que el backend este iniciado y respondiendo en la URL configurada antes de reintentar.
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
          <Button variant="outlined" size="sm" onClick={() => window.location.assign('/paddy')}>
            Volver al inicio
          </Button>
          <Button variant="primary" size="sm" onClick={reset}>
            Reintentar
          </Button>
        </div>
      </div>
    </div>
  );
}
