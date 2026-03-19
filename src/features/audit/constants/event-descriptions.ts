/**
 * Diccionario de descripción de eventos para usuarios no técnicos
 * Mapea eventCode a una descripción amigable en español
 */
export const EVENT_DESCRIPTIONS: Record<string, string> = {
  // AUTH Events
  'AUTH.LOGIN.ATTEMPT': 'Intento de inicio de sesión',
  'AUTH.LOGIN.SUCCESS': 'Inicio de sesión exitoso',
  'AUTH.LOGIN.FAILED': 'Error en inicio de sesión',
  'AUTH.LOGOUT': 'Cierre de sesión',
  'AUTH.TOKEN.REFRESH': 'Renovación de sesión',
  'AUTH.TOKEN.EXPIRED': 'Sesión expirada',
  'AUTH.PASSWORD.CHANGE': 'Cambio de contraseña',
  'AUTH.PASSWORD.RESET': 'Reinicio de contraseña',

  // USERS Events
  'USERS.CREATE': 'Nuevo usuario creado',
  'USERS.UPDATE': 'Usuario actualizado',
  'USERS.DELETE': 'Usuario eliminado',
  'USERS.ACTIVATE': 'Usuario activado',
  'USERS.DEACTIVATE': 'Usuario desactivado',
  'USERS.ROLE.CHANGE': 'Cambio de rol de usuario',
  'USERS.PERMISSIONS.UPDATE': 'Permisos de usuario actualizados',

  // PRODUCERS Events
  'PRODUCERS.CREATE': 'Nuevo productor registrado',
  'PRODUCERS.UPDATE': 'Información de productor actualizada',
  'PRODUCERS.DELETE': 'Productor eliminado',
  'PRODUCERS.VIEW': 'Información de productor consultada',

  // RECEPTIONS Events
  'RECEPTIONS.CREATE': 'Nueva recepción de arroz creada',
  'RECEPTIONS.UPDATE': 'Recepción actualizada',
  'RECEPTIONS.ANALYZE': 'Análisis de recepción realizado',
  'RECEPTIONS.SETTLE': 'Recepción liquidada',
  'RECEPTIONS.CANCEL': 'Recepción cancelada',
  'RECEPTIONS.STATUS.CHANGE': 'Estado de recepción cambiado',

  // ANALYSIS Events
  'ANALYSIS.CREATE': 'Nuevo análisis de laboratorio creado',
  'ANALYSIS.UPDATE': 'Análisis actualizado',
  'ANALYSIS.COMPLETE': 'Análisis completado',
  'ANALYSIS.APPROVE': 'Análisis aprobado',
  'ANALYSIS.REJECT': 'Análisis rechazado',

  // ADVANCES Events
  'ADVANCES.CREATE': 'Nuevo anticipo creado',
  'ADVANCES.UPDATE': 'Anticipo actualizado',
  'ADVANCES.PAYMENT': 'Pago de anticipo procesado',
  'ADVANCES.CANCEL': 'Anticipo cancelado',
  'ADVANCES.STATUS.CHANGE': 'Estado de anticipo cambiado',
  'ADVANCES.INTEREST.UPDATE': 'Interés de anticipo actualizado',

  // SETTLEMENTS Events
  'SETTLEMENTS.CREATE': 'Nueva liquidación creada',
  'SETTLEMENTS.CALCULATE': 'Cálculos de liquidación realizados',
  'SETTLEMENTS.APPROVE': 'Liquidación aprobada',
  'SETTLEMENTS.COMPLETE': 'Liquidación completada',
  'SETTLEMENTS.CANCEL': 'Liquidación cancelada',
  'SETTLEMENTS.PRINT': 'Liquidación impresa',

  // TRANSACTIONS Events
  'TRANSACTIONS.CREATE': 'Nueva transacción registrada',
  'TRANSACTIONS.UPDATE': 'Transacción actualizada',
  'TRANSACTIONS.REVERSE': 'Transacción reversada',
  'TRANSACTIONS.RECONCILE': 'Transacción conciliada',

  // RICE TYPES Events
  'RICE_TYPES.CREATE': 'Nuevo tipo de arroz creado',
  'RICE_TYPES.UPDATE': 'Tipo de arroz actualizado',
  'RICE_TYPES.DELETE': 'Tipo de arroz eliminado',

  // SEASONS Events
  'SEASONS.CREATE': 'Nueva temporada creada',
  'SEASONS.UPDATE': 'Temporada actualizada',
  'SEASONS.CLOSE': 'Temporada cerrada',

  // TEMPLATES Events
  'TEMPLATES.CREATE': 'Nuevo plantilla creada',
  'TEMPLATES.UPDATE': 'Plantilla actualizada',
  'TEMPLATES.DELETE': 'Plantilla eliminada',

  // ANALYTICS Events
  'ANALYTICS.REPORT.GENERATE': 'Reporte generado',
  'ANALYTICS.REPORT.EXPORT': 'Reporte exportado',
  'ANALYTICS.VIEW': 'Análisis consultados',

  // CONFIGURATION Events
  'CONFIG.UPDATE': 'Configuración actualizada',
  'CONFIG.BACKUP': 'Copia de seguridad realizada',

  // SYSTEM Events
  'SYSTEM.STARTUP': 'Sistema iniciado',
  'SYSTEM.SHUTDOWN': 'Sistema detenido',
  'SYSTEM.ERROR': 'Error del sistema',
  'SYSTEM.SYNC': 'Sincronización de datos',
  'SYSTEM.IMPORT': 'Datos importados',
  'SYSTEM.EXPORT': 'Datos exportados',
};

/**
 * Obtiene la descripción amigable de un evento
 */
export const getEventDescription = (eventCode: string): string => {
  return EVENT_DESCRIPTIONS[eventCode] || eventCode;
};
