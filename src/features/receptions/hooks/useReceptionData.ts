'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { signOut } from 'next-auth/react';
import {
  ReceptionData,
  TemplateConfig,
  ParamCluster,
  ReceptionContextType,
  Range,
} from '../types/nodes.types';
import {
  createParamCluster,
  createBonusCluster,
  createDryCluster,
  createSummaryCluster,
  calculateTotals,
  validateParamCluster,
  calculateGroupTolerance,
} from '../utils/paramCells';

const DEFAULT_TEMPLATE: TemplateConfig = {
  useToleranceGroup: true,
  groupToleranceValue: 2.5,
  groupToleranceName: '',
  availableHumedad: true,
  availableGranosVerdes: true,
  availableImpurezas: true,
  availableVano: true,
  availableHualcacho: true,
  availableGranosManchados: true,
  availableGranosPelados: true,
  availableGranosYesosos: true,
  availableBonus: true,
  availableDry: false,
  showToleranceHumedad: true,
  showToleranceGranosVerdes: true,
  showToleranceImpurezas: true,
  showToleranceVano: true,
  showToleranceHualcacho: true,
  showToleranceGranosManchados: true,
  showToleranceGranosPelados: true,
  showToleranceGranosYesosos: true,
  groupToleranceHumedad: false,
  groupToleranceGranosVerdes: false,
  groupToleranceImpurezas: false,
  groupToleranceVano: false,
  groupToleranceHualcacho: false,
  groupToleranceGranosManchados: false,
  groupToleranceGranosPelados: false,
  groupToleranceGranosYesosos: false,
  percentHumedad: 0,
  toleranceHumedad: 0,
  percentGranosVerdes: 0,
  toleranceGranosVerdes: 0,
  percentImpurezas: 0,
  toleranceImpurezas: 0,
  percentVano: 0,
  toleranceVano: 0,
  percentHualcacho: 0,
  toleranceHualcacho: 0,
  percentGranosManchados: 0,
  toleranceGranosManchados: 0,
  percentGranosPelados: 0,
  toleranceGranosPelados: 0,
  percentGranosYesosos: 0,
  toleranceGranosYesosos: 0,
  toleranceBonus: 0,
  percentDry: 0,
};

const DEFAULT_DATA: ReceptionData = {
  producerId: 0,
  producerName: '',
  riceTypeId: 0,
  riceTypeName: '',
  price: 0,
  guide: '',
  licensePlate: '',
  note: '',
  grossWeight: 0,
  tare: 0,
  netWeight: 0,
  totalDiscounts: 0,
  bonus: 0,
  paddyNet: 0,
  status: 'cancelled',
};

export function useReceptionData(): ReceptionContextType {
  const [data, setDataState] = useState<ReceptionData>(DEFAULT_DATA);
  const [template, setTemplateState] = useState<TemplateConfig>(DEFAULT_TEMPLATE);
  const [version, setVersion] = useState(0);
  const authRedirectInProgressRef = useRef(false);
  
  // Flag para evitar ciclos infinitos durante cálculos
  const isCalculatingRef = useRef(false);

  const handleUnauthorized = useCallback(async () => {
    if (authRedirectInProgressRef.current) {
      return;
    }

    authRedirectInProgressRef.current = true;
    console.warn('[useReceptionData] Session expired. Redirecting to login.');
    await signOut({ callbackUrl: '/' });
  }, []);

  // Crear clusters
  const clusters = useMemo(() => {
    return {
      Humedad: createParamCluster('Humedad', 'Humedad'),
      GranosVerdes: createParamCluster('GranosVerdes', 'Granos Verdes'),
      Impurezas: createParamCluster('Impurezas', 'Impurezas'),
      Vano: createParamCluster('Vano', 'Vano'),
      Hualcacho: createParamCluster('Hualcacho', 'Hualcacho'),
      GranosManchados: createParamCluster('GranosManchados', 'Granos Manchados'),
      GranosPelados: createParamCluster('GranosPelados', 'Granos Pelados'),
      GranosYesosos: createParamCluster('GranosYesosos', 'Granos Yesosos'),
      Summary: createSummaryCluster(),
      Bonus: createBonusCluster(),
      Dry: createDryCluster(),
    };
  }, []);

  // ⚡ SISTEMA DE REACTIVIDAD GLOBAL ⚡
  // Al montar, envolver TODOS los métodos de cambio para notificar actualización
  useEffect(() => {
    const unsubscribeFns: (() => void)[] = [];

    // Todas las rutas de cambio en nodos
    const nodes: any[] = [];
    Object.values(clusters).forEach((cluster) => {
      nodes.push(cluster.range, cluster.percent, cluster.tolerance, cluster.penalty);
    });
    nodes.filter(Boolean).forEach((node) => {
      // Guardar métodos originales
      const originalSetValue = node.setValue;
      const originalNotifyChange = node.notifyChange;

      // Envolver setValue - notificar solo si no estamos calculando
      node.setValue = (v: number) => {
        originalSetValue(v);
        if (!isCalculatingRef.current) {
          setVersion((ver) => ver + 1); // Trigger re-render
        }
      };

      // Envolver notifyChange  
      node.notifyChange = () => {
        originalNotifyChange();
        if (!isCalculatingRef.current) {
          setVersion((ver) => ver + 1); // Trigger re-render
        }
      };

      // Guardar deshacimiento
      unsubscribeFns.push(() => {
        node.setValue = originalSetValue;
        node.notifyChange = originalNotifyChange;
      });
    });

    return () => {
      unsubscribeFns.forEach((fn) => fn());
    };
  }, [clusters]);

  // Cargar rangos desde análisis params (vía endpoint API)
  useEffect(() => {
    const loadAnalysisParams = async () => {
      try {
        const response = await fetch('/api/analysis-params', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-store',
        });

        if (!response.ok) {
          if (response.status === 401) {
            await handleUnauthorized();
            return;
          }

          console.error('[useReceptionData] API error:', response.status);
          return;
        }

        const data = await response.json();
        const params = data.data || [];

        if (!Array.isArray(params) || params.length === 0) {
          console.warn('[useReceptionData] No analysis params received');
          return;
        }

        console.log('✅ Ranges loaded:', params.length, 'analysis types');

        // Mapeo de claves de cluster a códigos de análisis params
        const codeMap: Record<string, string> = {
          Humedad: 'HUMEDAD',
          GranosVerdes: 'GRANOS_VERDES',
          Impurezas: 'IMPUREZAS',
          Vano: 'VANO',
          Hualcacho: 'HUALCACHO',
          GranosManchados: 'GRANOS_MANCHADOS',
          GranosPelados: 'GRANOS_PELADOS',
          GranosYesosos: 'GRANOS_YESOSOS',
          Dry: 'SECADO',
        };

        // Asignar rangos a cada cluster
        Object.entries(clusters).forEach(([key, cluster]) => {
          const code = codeMap[key];
          if (code && 'range' in cluster && cluster.range) {
            const param = params.find((p: any) => p.code === code);
            if (param?.ranges && Array.isArray(param.ranges)) {
              const ranges: Range[] = param.ranges.map((r: any, idx: number) => ({
                id: r.id || idx,
                start: r.rangeStart,
                end: r.rangeEnd,
                percent: r.percent,
              }));
              // Asignar rangos al nodo de rango del cluster
              (cluster as any).range.setRanges(ranges);
            }
          }
        });

      } catch (error) {
        console.error('[useReceptionData] Error loading analysis params:', error);
      }
    };

    loadAnalysisParams();
  }, [clusters, handleUnauthorized]);

  // 🔄 RECALCULAR TODO cuando cambia la versión (reactividad)
  useEffect(() => {
    // Marcar que estamos calculando para no triggear updates
    isCalculatingRef.current = true;

    try {
      // Recalcular totales
      const { totalDiscounts } = calculateTotals(clusters, data.netWeight, {
        useGroupTolerance: template.useToleranceGroup,
        groupToleranceValue: template.groupToleranceValue,
      });

      // Calcular bonus
      const bonusCluster = clusters.Bonus;
      const bonusValue = bonusCluster.available ? bonusCluster.penalty?.getValue() || 0 : 0;

      // Actualizar data
      setDataState((prev) => ({
        ...prev,
        totalDiscounts,
        bonus: bonusValue,
        paddyNet: prev.netWeight - totalDiscounts + bonusValue,
      }));
    } finally {
      isCalculatingRef.current = false;
    }
  }, [version, data.netWeight, clusters]);

  // Actualizar datos generales
  const setData = useCallback((field: keyof ReceptionData, value: any) => {
    setDataState((prev) => {
      const updated = { ...prev, [field]: value };

      // Calcular peso neto automáticamente
      if (field === 'grossWeight' || field === 'tare') {
        updated.netWeight = Math.max(0, updated.grossWeight - updated.tare);
      }

      return updated;
    });
  }, []);

  // Actualizar template
  const setTemplate = useCallback((config: Partial<TemplateConfig>) => {
    const visualOnlyFields: Array<keyof TemplateConfig> = [
      'showToleranceHumedad',
      'showToleranceGranosVerdes',
      'showToleranceImpurezas',
      'showToleranceVano',
      'showToleranceHualcacho',
      'showToleranceGranosManchados',
      'showToleranceGranosPelados',
      'showToleranceGranosYesosos',
      'groupToleranceName',
    ];

    const hasNonVisualChanges = Object.keys(config).some(
      (field) => !visualOnlyFields.includes(field as keyof TemplateConfig)
    );

    setTemplateState((prev) => {
      const updated = { ...prev, ...config };
      const hasTemplateField = (field: keyof TemplateConfig) =>
        Object.prototype.hasOwnProperty.call(config, field);

      // Mapeo de parámetros: clave -> propiedades de template
      const paramMap = {
        Humedad: {
          available: 'availableHumedad',
          showTolerance: 'showToleranceHumedad',
          groupTolerance: 'groupToleranceHumedad',
          percent: 'percentHumedad',
          tolerance: 'toleranceHumedad',
        },
        GranosVerdes: {
          available: 'availableGranosVerdes',
          showTolerance: 'showToleranceGranosVerdes',
          groupTolerance: 'groupToleranceGranosVerdes',
          percent: 'percentGranosVerdes',
          tolerance: 'toleranceGranosVerdes',
        },
        Impurezas: {
          available: 'availableImpurezas',
          showTolerance: 'showToleranceImpurezas',
          groupTolerance: 'groupToleranceImpurezas',
          percent: 'percentImpurezas',
          tolerance: 'toleranceImpurezas',
        },
        Vano: {
          available: 'availableVano',
          showTolerance: 'showToleranceVano',
          groupTolerance: 'groupToleranceVano',
          percent: 'percentVano',
          tolerance: 'toleranceVano',
        },
        Hualcacho: {
          available: 'availableHualcacho',
          showTolerance: 'showToleranceHualcacho',
          groupTolerance: 'groupToleranceHualcacho',
          percent: 'percentHualcacho',
          tolerance: 'toleranceHualcacho',
        },
        GranosManchados: {
          available: 'availableGranosManchados',
          showTolerance: 'showToleranceGranosManchados',
          groupTolerance: 'groupToleranceGranosManchados',
          percent: 'percentGranosManchados',
          tolerance: 'toleranceGranosManchados',
        },
        GranosPelados: {
          available: 'availableGranosPelados',
          showTolerance: 'showToleranceGranosPelados',
          groupTolerance: 'groupToleranceGranosPelados',
          percent: 'percentGranosPelados',
          tolerance: 'toleranceGranosPelados',
        },
        GranosYesosos: {
          available: 'availableGranosYesosos',
          showTolerance: 'showToleranceGranosYesosos',
          groupTolerance: 'groupToleranceGranosYesosos',
          percent: 'percentGranosYesosos',
          tolerance: 'toleranceGranosYesosos',
        },
      };

      // Aplicar configuración de template a clusters
      Object.entries(clusters).forEach(([key, cluster]) => {
        const mapping = paramMap[key as keyof typeof paramMap];
        if (mapping) {
          if (hasTemplateField(mapping.available as keyof TemplateConfig)) {
            cluster.available = Boolean((updated as any)[mapping.available]);
          }

          if (hasTemplateField(mapping.showTolerance as keyof TemplateConfig)) {
            cluster.showTolerance = Boolean((updated as any)[mapping.showTolerance]);
          }

          if (hasTemplateField(mapping.groupTolerance as keyof TemplateConfig)) {
            cluster.toleranceGroup = Boolean((updated as any)[mapping.groupTolerance]);
          }

          // Cargar valores en los nodos del cluster (convertir a números)
          if (cluster.percent && hasTemplateField(mapping.percent as keyof TemplateConfig)) {
            const percent = Number((updated as any)[mapping.percent] ?? 0) || 0;
            cluster.percent.setValue(percent);
          }

          if (cluster.tolerance && hasTemplateField(mapping.tolerance as keyof TemplateConfig)) {
            const tolerance = Number((updated as any)[mapping.tolerance] ?? 0) || 0;
            cluster.tolerance.setValue(tolerance);
          }
        } else if (key === 'Bonus') {
          if (hasTemplateField('availableBonus')) {
            cluster.available = Boolean(updated.availableBonus);
          }

          if (cluster.tolerance && hasTemplateField('toleranceBonus')) {
            const bonus = Number(updated.toleranceBonus ?? 0) || 0;
            cluster.tolerance.setValue(bonus);
          }
        } else if (key === 'Dry') {
          if (hasTemplateField('availableDry')) {
            cluster.available = Boolean(updated.availableDry);
          }

          if (cluster.percent && hasTemplateField('percentDry')) {
            const dry = Number(updated.percentDry ?? 0) || 0;
            cluster.percent.setValue(dry);
          }
        }
      });

      return updated;
    });

    // Solo forzar recálculo cuando cambian valores de negocio (no flags visuales).
    if (hasNonVisualChanges) {
      setVersion((ver) => ver + 1);
    }
  }, [clusters]);

  // Actualizar valor en cluster
  const setClusterValue = useCallback(
    (clusterKey: string, nodeKey: string, value: number) => {
      const clusterRecord = clusters as Record<string, ParamCluster>;
      const cluster = clusterRecord[clusterKey];
      if (!cluster) return;

      if (nodeKey === 'range' && cluster.range) {
        cluster.range.setValue(value);
      } else if (nodeKey === 'percent' && cluster.percent) {
        cluster.percent.setValue(value);
      } else if (nodeKey === 'tolerance' && cluster.tolerance) {
        cluster.tolerance.setValue(value);
      }

      // Recalcular totales
      calculateTotals(clusters, data.netWeight, {
        useGroupTolerance: template.useToleranceGroup,
        groupToleranceValue: template.groupToleranceValue,
      });
    },
    [clusters, data.netWeight, template.groupToleranceValue, template.useToleranceGroup]
  );

  // Cargar template
  const loadTemplate = useCallback(
    async (templateId: number) => {
      try {
        // TODO: Fetch template desde API
        // const response = await fetch(`/api/templates/${templateId}`);
        // const template = await response.json();
        // setTemplate(template);
      } catch (error) {
        console.error('Error loading template:', error);
      }
    },
    []
  );

  // Validar recepción
  const validateReception = useCallback(() => {
    let isValid = true;

    // Validar datos generales
    if (data.producerId === 0) {
      console.warn('Producer is required');
      isValid = false;
    }

    if (data.riceTypeId === 0) {
      console.warn('Rice type is required');
      isValid = false;
    }

    if (data.grossWeight <= 0) {
      console.warn('Gross weight must be positive');
      isValid = false;
    }

    // Validar clusters
    Object.values(clusters).forEach((cluster) => {
      if (cluster.available) {
        if (!validateParamCluster(cluster, data.netWeight)) {
          isValid = false;
        }
      }
    });

    return isValid;
  }, [data, clusters]);

  // Calcular totales
  const calculateTotalsCallback = useCallback(() => {
    const { totalDiscounts } = calculateTotals(clusters, data.netWeight, {
      useGroupTolerance: template.useToleranceGroup,
      groupToleranceValue: template.groupToleranceValue,
    });

    // Bonus aumenta el total (se suma, no se resta)
    const bonusCluster = clusters.Bonus;
    const bonusValue = bonusCluster.available ? bonusCluster.penalty?.getValue() || 0 : 0;

    const paddyNet = data.netWeight - totalDiscounts + bonusValue;

    setDataState((prev) => ({
      ...prev,
      totalDiscounts,
      bonus: bonusValue,
      paddyNet: Math.max(0, paddyNet),
    }));
  }, [clusters, data.netWeight, template.groupToleranceValue, template.useToleranceGroup]);

  // Reset
  const resetData = useCallback(() => {
    setDataState(DEFAULT_DATA);
    setTemplateState(DEFAULT_TEMPLATE);

    // Reset all cluster nodes
    Object.values(clusters).forEach((cluster) => {
      if (cluster.range) cluster.range.setValue(0);
      if (cluster.percent) cluster.percent.setValue(0);
      if (cluster.tolerance) cluster.tolerance.setValue(0);
      if (cluster.penalty) cluster.penalty.setValue(0);
    });
  }, [clusters]);

  return {
    data,
    template,
    clusters,
    version, // 🔄 Para que los componentes se sincronicen con cambios en nodos
    setData,
    setTemplate,
    setClusterValue,
    loadTemplate,
    validateReception,
    calculateTotals: calculateTotalsCallback,
    resetData,
  };
}
