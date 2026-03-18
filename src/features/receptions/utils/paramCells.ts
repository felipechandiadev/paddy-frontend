// Motor de Cálculo - Sistema de Nodos Reactivo
import { Node, NodeType, ParamCluster, Range } from '../types/nodes.types';

/**
 * Crea un nodo base con lógica de dependencias
 */
export function createNode(
  key: string,
  type: NodeType,
  label: string = '',
  adorn: string = ''
): Node {
  const consumers: Node[] = [];
  const sources: Node[] = [];

  const node: Node = {
    key,
    type,
    label,
    adorn,
    backgroundColor: 'inherit',
    nodeSources: sources,
    nodeConsumers: consumers,
    state: { value: 0, error: false, errorMessage: '', show: true },

    getValue: () => node.state.value,

    setValue: (v: number) => {
      const newVal = isNaN(v) ? 0 : v;
      if (node.state.value !== newVal) {
        node.state.value = newVal;
        node.notifyChange();
      }
    },

    addConsumer: (consumer: Node) => {
      if (!consumers.includes(consumer)) {
        consumers.push(consumer);
        if (!consumer.nodeSources.includes(node)) {
          consumer.nodeSources.push(node);
        }
      }
    },

    notifyChange: () => {
      // Ejecutar effect si existe
      if (node.effect) {
        node.effect();
      }

      // Notificar a consumidores
      consumers.forEach((consumer) => {
        if (consumer.effect) {
          consumer.effect();
        }
      });
    },
  };

  return node;
}

/**
 * Busca el porcentaje de descuento basado en el rango
 */
export function findPercentByRange(value: number, ranges: Range[]): number {
  if (!ranges || ranges.length === 0) return 0;

  const range = ranges.find((r) => value >= r.start && value <= r.end);
  return range ? range.percent : 0;
}

/**
 * Calcula penalización individual
 * penalty = (percent - tolerance) × netWeight / 100
 */
export function calculatePenalty(
  percent: number,
  tolerance: number,
  netWeight: number
): number {
  const basePenalty = Math.max(0, percent - tolerance);
  return (basePenalty * netWeight) / 100;
}

/**
 * Crea un cluster de parámetro (Humedad, Granos Verdes, etc.)
 */
export function createParamCluster(
  key: string,
  name: string,
  ranges: Range[] = []
): ParamCluster {
  // Nodos
  const rangeNode = createNode(key + '_range', 'range', 'Rango', '');
  const percentNode = createNode(key + '_percent', 'percent', 'Porcentaje', '%');
  const toleranceNode = createNode(key + '_tolerance', 'tolerance', 'Tolerancia', '%');
  const penaltyNode = createNode(key + '_penalty', 'penalty', 'Penalización', 'kg');

  // Conexiones
  rangeNode.addConsumer(percentNode);
  percentNode.addConsumer(penaltyNode);
  toleranceNode.addConsumer(penaltyNode);

  // Guardar rangos directamente en el nodo para evitar issues de closure
  (rangeNode as any)._ranges = ranges;

  // Método para actualizar rangos
  (rangeNode as any).setRanges = (newRanges: Range[]) => {
    (rangeNode as any)._ranges = newRanges;
    console.log(`[paramCells] setRanges for ${key}:`, newRanges.length, 'ranges', newRanges);
  };

  // El porcentaje automático debe calcularse solo cuando cambia el rango.
  // Si se cuelga del nodo percent, cualquier edición manual se pisa inmediatamente.
  rangeNode.effect = () => {
    const nodeRanges = (rangeNode as any)._ranges || [];
    const rangeValue = rangeNode.getValue();
    const percent = findPercentByRange(rangeValue, nodeRanges);
    console.log(`[paramCells] rangeNode.effect for ${key}: range=${rangeValue}, nodeRanges=${nodeRanges.length}, percent=${percent}`);
    percentNode.setValue(percent);
  };

  // Effect: Percent + Tolerance → Penalty (lo calcula el summary)
  penaltyNode.backgroundColor = '#f5f5f5';
  penaltyNode.state.show = true;

  const cluster: ParamCluster = {
    key,
    name,
    type: 'param',
    range: rangeNode,
    percent: percentNode,
    tolerance: toleranceNode,
    penalty: penaltyNode,
    available: false,
    toleranceGroup: false,
    showTolerance: false,
    ranges,
  };

  return cluster;
}

/**
 * Crea el cluster de Bonificación
 */
export function createBonusCluster(): ParamCluster {
  const toleranceNode = createNode('bonus_tolerance', 'tolerance', 'Bonificación', '%');
  const penaltyNode = createNode('bonus_penalty', 'penalty', 'Bonificación', 'kg');

  toleranceNode.addConsumer(penaltyNode);

  const cluster: ParamCluster = {
    key: 'Bonus',
    name: 'Bonificación',
    type: 'bonus',
    tolerance: toleranceNode,
    penalty: penaltyNode,
    available: false,
    toleranceGroup: false,
    showTolerance: true,
    ranges: [],
  };

  return cluster;
}

/**
 * Crea el cluster de Secado
 */
export function createDryCluster(): ParamCluster {
  const rangeNode = createNode('dry_range', 'range', 'Rango', '');
  const percentNode = createNode('dry_percent', 'percent', 'Secado', '%');
  const penaltyNode = createNode('dry_penalty', 'penalty', 'Secado', 'kg');

  rangeNode.addConsumer(percentNode);
  percentNode.addConsumer(penaltyNode);

  (rangeNode as any)._ranges = [];

  (rangeNode as any).setRanges = (newRanges: Range[]) => {
    (rangeNode as any)._ranges = newRanges;
    console.log('[paramCells] setRanges for Dry:', newRanges.length, 'ranges', newRanges);
  };

  rangeNode.effect = () => {
    const nodeRanges = (rangeNode as any)._ranges || [];
    const rangeValue = rangeNode.getValue();
    const percent = findPercentByRange(rangeValue, nodeRanges);
    console.log(
      `[paramCells] rangeNode.effect for Dry: range=${rangeValue}, nodeRanges=${nodeRanges.length}, percent=${percent}`
    );
    percentNode.setValue(percent);
  };

  const cluster: ParamCluster = {
    key: 'Dry',
    name: 'Secado',
    type: 'dry',
    range: rangeNode,
    percent: percentNode,
    penalty: penaltyNode,
    available: false,
    toleranceGroup: false,
    showTolerance: false,
    ranges: [],
  };

  return cluster;
}

/**
 * Calcula todos los totales basados en los clusters
 */
export function calculateTotals(
  clusters: Record<string, ParamCluster>,
  netWeight: number,
  options?: {
    useGroupTolerance?: boolean;
    groupToleranceValue?: number;
  }
): {
  totalDiscounts: number;
  totalPenalties: number;
  summaryPercent: number;
  summaryTolerance: number;
  summaryPenalty: number;
} {
  const useGroupTolerance = Boolean(options?.useGroupTolerance);
  const groupToleranceValue = Math.max(
    0,
    Number(options?.groupToleranceValue ?? 0) || 0
  );

  const paramClusters = Object.values(clusters).filter(
    (cluster) => cluster.type === 'param' && cluster.available
  );

  const groupedParamClusters = paramClusters.filter(
    (cluster) => useGroupTolerance && cluster.toleranceGroup
  );

  const individualParamClusters = paramClusters.filter(
    (cluster) => !(useGroupTolerance && cluster.toleranceGroup)
  );

  const groupedPercent = groupedParamClusters.reduce(
    (sum, cluster) => sum + (cluster.percent?.getValue() || 0),
    0
  );

  const groupedTolerance =
    groupedParamClusters.length > 0 ? groupToleranceValue : 0;

  const groupedPenalty = calculatePenalty(groupedPercent, groupedTolerance, netWeight);

  let totalDiscounts = 0;
  let summaryPercent = 0;
  let summaryTolerance = 0;
  let summaryPenalty = 0;

  individualParamClusters.forEach((cluster) => {
    if (!cluster.penalty) {
      return;
    }

    const percent = cluster.percent?.getValue() || 0;
    const tolerance = cluster.tolerance?.getValue() || 0;
    const penalty = calculatePenalty(percent, tolerance, netWeight);

    cluster.penalty.setValue(penalty);

    summaryPercent += percent;
    summaryTolerance += tolerance;
    summaryPenalty += penalty;
    totalDiscounts += penalty;
  });

  groupedParamClusters.forEach((cluster) => {
    if (!cluster.penalty) {
      return;
    }

    // Los parametros agrupados se muestran individualmente, pero no descuentan de forma individual.
    cluster.penalty.setValue(0);

    const percent = cluster.percent?.getValue() || 0;
    summaryPercent += percent;
  });

  if (groupedParamClusters.length > 0) {
    summaryTolerance += groupedTolerance;
    summaryPenalty += groupedPenalty;
    totalDiscounts += groupedPenalty;
  }

  Object.values(clusters).forEach((cluster) => {
    if (cluster.type === 'bonus' && cluster.available && cluster.tolerance) {
      const bonusPercent = cluster.tolerance.getValue() || 0;
      const bonusKg = (bonusPercent * netWeight) / 100;
      cluster.penalty?.setValue(bonusKg);
    } else if (cluster.type === 'dry' && cluster.available && cluster.percent) {
      // Secado es informativo, no descuenta en kg del total.
      cluster.penalty?.setValue(0);
    }
  });

  const summaryCluster = Object.values(clusters).find((cluster) => cluster.type === 'summary');

  if (summaryCluster?.percent) {
    summaryCluster.percent.state.error = summaryPercent > 100;
    summaryCluster.percent.state.errorMessage =
      summaryPercent > 100 ? 'El porcentaje total no puede exceder 100%' : '';
    summaryCluster.percent.setValue(summaryPercent);
  }

  if (summaryCluster?.tolerance) {
    summaryCluster.tolerance.state.error = summaryTolerance > 100;
    summaryCluster.tolerance.state.errorMessage =
      summaryTolerance > 100 ? 'La tolerancia total no puede exceder 100%' : '';
    summaryCluster.tolerance.setValue(summaryTolerance);
  }

  if (summaryCluster?.penalty) {
    summaryCluster.penalty.state.error = summaryPenalty > netWeight;
    summaryCluster.penalty.setValue(summaryPenalty);
  }

  return {
    totalDiscounts,
    totalPenalties: totalDiscounts,
    summaryPercent,
    summaryTolerance,
    summaryPenalty,
  };
}

/**
 * Valida un cluster de parámetro
 */
export function validateParamCluster(cluster: ParamCluster, netWeight: number): boolean {
  if (!cluster.tolerance || !cluster.percent) return true;

  const percent = cluster.percent.getValue();
  const tolerance = cluster.tolerance.getValue();

  // Validación 1: Valores no negativos
  if (tolerance < 0 || percent < 0) {
    cluster.tolerance.state.error = true;
    cluster.tolerance.state.errorMessage = 'Los valores no pueden ser negativos';
    return false;
  }

  // Validación 2: Tolerancia no puede exceder porcentaje
  // PERO: si percent es 0, se permite tolerance 0 (parámetro sin configurar)
  if (percent > 0 && tolerance > percent) {
    cluster.tolerance.state.error = true;
    cluster.tolerance.state.errorMessage = 'La tolerancia no puede exceder el porcentaje';
    return false;
  }

  // Limpiar errores si todo es válido
  cluster.tolerance.state.error = false;
  cluster.tolerance.state.errorMessage = '';

  return true;
}

/**
 * Calcula tolerancia grupal distribuida
 */
export function calculateGroupTolerance(
  clusters: Record<string, ParamCluster>,
  groupTolerance: number
): Record<string, number> {
  const result: Record<string, number> = {};
  let totalPercent = 0;

  // Calcular suma total de porcentajes
  Object.values(clusters).forEach((cluster) => {
    if (cluster.type === 'param' && cluster.available && cluster.percent) {
      totalPercent += cluster.percent.getValue();
    }
  });

  if (totalPercent === 0) return result;

  // Distribuir tolerancia proporcional
  Object.values(clusters).forEach((cluster) => {
    if (cluster.type === 'param' && cluster.available && cluster.percent) {
      const percent = cluster.percent.getValue();
      const distributed = (groupTolerance * percent) / totalPercent;
      result[cluster.key] = distributed;
    }
  });

  return result;
}

/**
 * Crea el cluster de resumen (Total análisis)
 */
export function createSummaryCluster(): ParamCluster {
  const percentNode = createNode('summary_percent', 'summary', 'Total Análisis', '%');
  const toleranceNode = createNode('summary_tolerance', 'summary', 'Tolerancia', '%');
  const penaltyNode = createNode('summary_penalty', 'penalty', 'Penalización', 'kg');

  const cluster: ParamCluster = {
    key: 'Summary',
    name: 'Total Análisis',
    type: 'summary',
    percent: percentNode,
    tolerance: toleranceNode,
    penalty: penaltyNode,
    available: true,
    toleranceGroup: false,
    showTolerance: false,
    ranges: [],
  };

  return cluster;
}
