/**
 * Helper para agregar headers de auditoría a peticiones fetch
 */

function getOrCreateCorrelationId(): string {
  if (typeof window === 'undefined') return '';
  
  const key = '__paddy_correlation_id__';
  let correlationId = localStorage.getItem(key);
  
  if (!correlationId) {
    // Generar UUID v4
    correlationId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
    localStorage.setItem(key, correlationId);
  }
  
  return correlationId;
}

export interface AuditHeaders {
  'x-correlation-id': string;
  'content-type': string;
}

export function getAuditHeaders(): AuditHeaders {
  return {
    'x-correlation-id': getOrCreateCorrelationId(),
    'content-type': 'application/json',
  };
}

export function mergeAuditHeaders(headers?: Record<string, string>): Record<string, string> {
  return {
    ...getAuditHeaders(),
    ...headers,
  };
}
