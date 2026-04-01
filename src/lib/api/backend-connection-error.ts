const BACKEND_CONNECTION_ERROR_PREFIX = 'BACKEND_CONNECTION_ERROR';

const DEFAULT_BACKEND_CONNECTION_MESSAGE =
  'No fue posible establecer conexion con el servidor. Verifica que el backend este operativo e intenta nuevamente.';

const NETWORK_ERROR_HINTS = [
  'fetch failed',
  'econnrefused',
  'connection refused',
  'socket hang up',
  'network error',
  'networkerror',
  'enotfound',
  'eai_again',
  'timeout',
];

function getErrorText(error: unknown): string {
  if (error instanceof Error) {
    return error.message || '';
  }

  return typeof error === 'string' ? error : '';
}

export function createBackendConnectionError(
  message = DEFAULT_BACKEND_CONNECTION_MESSAGE
): Error {
  const error = new Error(`${BACKEND_CONNECTION_ERROR_PREFIX}:${message}`);
  error.name = 'BackendConnectionError';
  return error;
}

export function isBackendConnectionError(error: unknown): boolean {
  if (error instanceof Error && error.name === 'BackendConnectionError') {
    return true;
  }

  const text = getErrorText(error).toLowerCase();

  if (!text) {
    return false;
  }

  return (
    text.startsWith(BACKEND_CONNECTION_ERROR_PREFIX.toLowerCase()) ||
    NETWORK_ERROR_HINTS.some((hint) => text.includes(hint))
  );
}

export function getBackendConnectionMessage(error: unknown): string {
  const text = getErrorText(error);

  if (text.startsWith(`${BACKEND_CONNECTION_ERROR_PREFIX}:`)) {
    const parsedMessage = text.slice(BACKEND_CONNECTION_ERROR_PREFIX.length + 1).trim();
    return parsedMessage || DEFAULT_BACKEND_CONNECTION_MESSAGE;
  }

  return DEFAULT_BACKEND_CONNECTION_MESSAGE;
}

export function throwIfBackendUnavailable(
  error: unknown,
  message = DEFAULT_BACKEND_CONNECTION_MESSAGE
): void {
  if (isBackendConnectionError(error)) {
    throw createBackendConnectionError(message);
  }
}
