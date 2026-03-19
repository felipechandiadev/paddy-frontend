export interface PermissionMeta {
  key: string;
  label: string;
  group: string;
}

/**
 * Catálogo frontend de permisos con etiquetas legibles.
 * Debe estar sincronizado con PermissionEnum del backend.
 */
export const PERMISSION_CATALOG: PermissionMeta[] = [
  // Usuarios
  { key: 'users.view',               label: 'Ver usuarios',                group: 'Usuarios' },
  { key: 'users.create',             label: 'Crear usuarios',              group: 'Usuarios' },
  { key: 'users.update',             label: 'Editar usuarios',             group: 'Usuarios' },
  { key: 'users.delete',             label: 'Eliminar usuarios',           group: 'Usuarios' },
  { key: 'users.manage_permissions', label: 'Gestionar permisos',          group: 'Usuarios' },

  // Productores
  { key: 'producers.view',           label: 'Ver productores',             group: 'Productores' },
  { key: 'producers.create',         label: 'Crear productores',           group: 'Productores' },
  { key: 'producers.update',         label: 'Editar productores',          group: 'Productores' },
  { key: 'producers.delete',         label: 'Eliminar productores',        group: 'Productores' },

  // Tipos de Arroz
  { key: 'rice_types.view',          label: 'Ver tipos de arroz',          group: 'Configuración' },
  { key: 'rice_types.create',        label: 'Crear tipos de arroz',        group: 'Configuración' },
  { key: 'rice_types.update',        label: 'Editar tipos de arroz',       group: 'Configuración' },
  { key: 'rice_types.delete',        label: 'Eliminar tipos de arroz',     group: 'Configuración' },

  // Temporadas
  { key: 'seasons.view',             label: 'Ver temporadas',              group: 'Configuración' },
  { key: 'seasons.create',           label: 'Crear temporadas',            group: 'Configuración' },
  { key: 'seasons.update',           label: 'Editar temporadas',           group: 'Configuración' },
  { key: 'seasons.delete',           label: 'Eliminar temporadas',         group: 'Configuración' },

  // Plantillas
  { key: 'templates.view',           label: 'Ver plantillas',              group: 'Configuración' },
  { key: 'templates.create',         label: 'Crear plantillas',            group: 'Configuración' },
  { key: 'templates.update',         label: 'Editar plantillas',           group: 'Configuración' },
  { key: 'templates.delete',         label: 'Eliminar plantillas',         group: 'Configuración' },

  // Parámetros de Análisis
  { key: 'analysis_params.view',     label: 'Ver parám. de análisis',      group: 'Configuración' },
  { key: 'analysis_params.create',   label: 'Crear parám. de análisis',    group: 'Configuración' },
  { key: 'analysis_params.update',   label: 'Editar parám. de análisis',   group: 'Configuración' },
  { key: 'analysis_params.delete',   label: 'Eliminar parám. de análisis', group: 'Configuración' },

  // Recepciones
  { key: 'receptions.view',          label: 'Ver recepciones',             group: 'Recepciones' },
  { key: 'receptions.create',        label: 'Crear recepciones',           group: 'Recepciones' },
  { key: 'receptions.update',        label: 'Editar recepciones',          group: 'Recepciones' },
  { key: 'receptions.cancel',        label: 'Cancelar recepciones',        group: 'Recepciones' },

  // Anticipos
  { key: 'advances.view',            label: 'Ver anticipos',               group: 'Anticipos' },
  { key: 'advances.create',          label: 'Crear anticipos',             group: 'Anticipos' },
  { key: 'advances.update',          label: 'Editar anticipos',            group: 'Anticipos' },
  { key: 'advances.cancel',          label: 'Cancelar anticipos',          group: 'Anticipos' },
  { key: 'advances.change_interest', label: 'Editar tasa de interés',      group: 'Anticipos' },

  // Transacciones
  { key: 'transactions.view',        label: 'Ver transacciones',           group: 'Finanzas' },

  // Liquidaciones
  { key: 'settlements.view',         label: 'Ver liquidaciones',           group: 'Liquidaciones' },
  { key: 'settlements.create',       label: 'Crear liquidaciones',         group: 'Liquidaciones' },
  { key: 'settlements.save',         label: 'Guardar liquidaciones',       group: 'Liquidaciones' },
  { key: 'settlements.complete',     label: 'Liquidar (completar)',         group: 'Liquidaciones' },
  { key: 'settlements.cancel',       label: 'Cancelar liquidaciones',      group: 'Liquidaciones' },

  // Analíticas
  { key: 'analytics.view',           label: 'Ver reportes y analíticas',   group: 'Reportes' },
];

export const PERMISSION_GROUPS: string[] = Array.from(
  new Set(PERMISSION_CATALOG.map((p) => p.group)),
);
