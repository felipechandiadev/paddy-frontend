/**
 * Diccionario de descripción de eventos para usuarios no técnicos
 * Mapea eventCode a una descripción amigable en español
 */
export const EVENT_DESCRIPTIONS: Record<string, string> = {
    'CONFIG.RICE_TYPES.PUT': 'Tipo de arroz actualizado',
  'CONFIG.RICE_TYPES.UPDATE': 'Tipo de arroz actualizado',
  // AUTH
  'AUTH.LOGIN.ATTEMPT': 'Intento de inicio de sesión',
  'AUTH.REGISTER.ATTEMPT': 'Registro de nuevo usuario',
  'AUTH.REFRESH.ATTEMPT': 'Renovación de sesión',
  'AUTH.PASSWORD_CHANGE.ATTEMPT': 'Cambio de contraseña',

  // USERS
  'USERS.LIST.READ': 'Lista de usuarios consultada',
  'USERS.ITEM.READ': 'Detalle de usuario consultado',
  'USERS.CREATE': 'Nuevo usuario creado',
  'USERS.UPDATE': 'Usuario actualizado',
  'USERS.DELETE': 'Usuario eliminado',
  'USERS.TOGGLE_ACTIVE': 'Estado activo de usuario cambiado',
  'USERS.PERMISSIONS.READ': 'Permisos de usuario consultados',
  'USERS.PERMISSIONS.UPDATE': 'Permisos de usuario actualizados',

  // PRODUCERS
  'PRODUCERS.LIST.READ': 'Lista de productores consultada',
  'PRODUCERS.ITEM.READ': 'Detalle de productor consultado',
  'PRODUCERS.CREATE': 'Nuevo productor registrado',
  'PRODUCERS.UPDATE': 'Información de productor actualizada',
  'PRODUCERS.DELETE': 'Productor eliminado',
  'PRODUCERS.BANK_ACCOUNT.ADD': 'Cuenta bancaria agregada',
  'PRODUCERS.BANK_ACCOUNT.REMOVE': 'Cuenta bancaria eliminada',

  // OPERATIONS — RECEPTIONS
  'OPS.RECEPTIONS.LIST.READ': 'Lista de recepciones consultada',
  'OPS.RECEPTIONS.EXPORT': 'Recepciones exportadas',
  'OPS.RECEPTIONS.CREATE': 'Nueva recepción de arroz creada',
  'OPS.RECEPTIONS.UPDATE': 'Recepción actualizada',
  'OPS.RECEPTIONS.DELETE': 'Recepción eliminada',
  'OPS.RECEPTIONS.RICE_PRICE.UPDATE': 'Precio de arroz de recepción actualizado',
  'OPS.RECEPTIONS.CALCULATE_DISCOUNTS': 'Descuentos de recepción calculados',
  'OPS.RECEPTIONS.SETTLE': 'Recepción liquidada',

  // OPERATIONS — ANALYSIS
  'OPS.ANALYSIS.READ': 'Análisis de recepción consultado',
  'OPS.ANALYSIS.CREATE': 'Análisis de laboratorio creado',
  'OPS.ANALYSIS.UPDATE': 'Análisis de laboratorio actualizado',
  'OPS.ANALYSIS.DELETE': 'Análisis de laboratorio eliminado',
  'OPS.ANALYSIS.DRY_PERCENT.UPDATE': 'Porcentaje de secado actualizado',

  // FINANCES — ADVANCES
  'FINANCE.ADVANCES.LIST.READ': 'Lista de anticipos consultada',
  'FINANCE.ADVANCES.EXPORT': 'Anticipos exportados',
  'FINANCE.ADVANCES.CREATE': 'Nuevo anticipo creado',
  'FINANCE.ADVANCES.UPDATE': 'Anticipo actualizado',
  'FINANCE.ADVANCES.DELETE': 'Anticipo eliminado',
  'FINANCE.ADVANCES.INTEREST.CALCULATE': 'Interés de anticipo calculado',

  // FINANCES — TRANSACTIONS
  'FINANCE.TRANSACTIONS.LIST.READ': 'Lista de transacciones consultada',
  'FINANCE.TRANSACTIONS.CREATE': 'Nueva transacción registrada',
  'FINANCE.TRANSACTIONS.UPDATE': 'Transacción actualizada',
  'FINANCE.TRANSACTIONS.DELETE': 'Transacción eliminada',

  // FINANCES — SETTLEMENTS
  'FINANCE.SETTLEMENTS.LIST.READ': 'Lista de liquidaciones consultada',
  'FINANCE.SETTLEMENTS.CANDIDATES.READ': 'Candidatos de liquidación consultados',
  'FINANCE.SETTLEMENTS.CREATE': 'Nueva liquidación creada',
  'FINANCE.SETTLEMENTS.UPDATE': 'Liquidación actualizada',
  'FINANCE.SETTLEMENTS.DELETE': 'Liquidación eliminada',
  'FINANCE.SETTLEMENTS.CALCULATE': 'Cálculos de liquidación realizados',
  'FINANCE.SETTLEMENTS.COMPLETE': 'Liquidación completada',
  'FINANCE.SETTLEMENTS.CANCEL': 'Liquidación cancelada',
  'FINANCE.PRODUCERS.PENDING_BALANCE.READ': 'Saldo pendiente de productor consultado',

  // CONFIGURATION
  'CONFIG.RICE_TYPES.READ': 'Tipos de arroz consultados',
  'CONFIG.SEASONS.READ': 'Temporadas consultadas',
  'CONFIG.TEMPLATES.READ': 'Plantillas consultadas',
  'CONFIG.ANALYSIS_PARAMS.READ': 'Parámetros de análisis consultados',
  'CONFIG.READ': 'Configuración consultada',

  // ANALYTICS
  'ANALYTICS.READ': 'Reportes y analytics consultados',

  // SYSTEM
  'SYSTEM.GET': 'Consulta de sistema',

};

/**
 * Obtiene la descripción amigable de un evento
 */
export const getEventDescription = (eventCode: string): string => {
  return EVENT_DESCRIPTIONS[eventCode] || eventCode;
};
