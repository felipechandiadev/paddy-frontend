'use client';

import React from 'react';
import { validateParamCluster } from '../utils/paramCells';

import { Button } from '@/shared/components/ui/Button/Button';
import Alert from '@/shared/components/ui/Alert/Alert';
import { PrintDialog } from '@/shared/components/PrintDialog';
import {
  createReceptionAndAnalysis,
  fetchReceptionAnalysis,
  fetchReceptionById,
  updateReceptionAndAnalysis,
  fetchLastReception,
} from '../actions/fetch.action';
import { fetchDefaultTemplate, fetchTemplateById } from '../actions/fetchTemplates.action';
import { ReceptionProvider } from '../context/ReceptionContext';
import { useReceptionContext } from '../context/ReceptionContext';
import {
  PrintableReception,
  ReceptionAnalysis,
  ReceptionListItem,
  ReceptionTemplateConfig,
} from '../types/receptions.types';
import ReceptionGeneralData from './ReceptionGeneralData';
import GrainAnalysis from './GrainAnalysis';
import ReceptionSummary from './ReceptionSummary';
import ReceptionToPrint from './ReceptionToPrint';
import DotProgress from '@/shared/components/ui/DotProgress/DotProgress';

interface CreateReceptionDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  mode?: 'create' | 'edit';
  initialReception?: ReceptionListItem | null;
}

export default function CreateReceptionDialog({
  open,
  onClose,
  onSuccess,
  mode = 'create',
  initialReception = null,
}: CreateReceptionDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <ReceptionProvider>
        <CreateReceptionDialogContent
          onClose={onClose}
          onSuccess={onSuccess}
          mode={mode}
          initialReception={initialReception}
        />
      </ReceptionProvider>
    </div>
  );
}

function CreateReceptionDialogContent({
  onClose,
  onSuccess,
  mode,
  initialReception,
}: {
  onClose: () => void;
  onSuccess: () => void;
  mode: 'create' | 'edit';
  initialReception: ReceptionListItem | null;
}) {
  // Key to reset producer autocomplete
  const [producerAutocompleteResetKey, setProducerAutocompleteResetKey] = React.useState(0);
  const {
    data,
    template,
    clusters,
    validateReception,
    calculateTotals,
    setData,
    setTemplate,
    isTemplateReady,
    resetData,
    resetDataButKeepTemplate,
  } = useReceptionContext();
  const isEditMode = mode === 'edit' && Boolean(initialReception?.id);
  const editReceptionId = initialReception?.id ?? null;
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [savingReception, setSavingReception] = React.useState(false);
  const [realPrintOpen, setRealPrintOpen] = React.useState(false);
  const [realPrintReception, setRealPrintReception] = React.useState<PrintableReception | null>(null);
  const [initializingEditData, setInitializingEditData] = React.useState(false);
  const formRef = React.useRef<HTMLFormElement | null>(null);
  const producerAutocompleteRef = React.useRef<HTMLInputElement>(null as any);

  React.useEffect(() => {
    if (!isEditMode || !initialReception || !editReceptionId) {
      return;
    }

    let cancelled = false;

    const setClusterValues = (
      clusterKey: string,
      rangeValue: unknown,
      percentValue: unknown,
      toleranceValue: unknown,
    ) => {
      const cluster = clusters[clusterKey];
      if (!cluster) {
        return;
      }

      cluster.range?.setValue(Number(rangeValue ?? 0));
      cluster.percent?.setValue(Number(percentValue ?? 0));
      cluster.tolerance?.setValue(Number(toleranceValue ?? 0));
    };

    const preloadEditData = async () => {
      setInitializingEditData(true);
      setError(null);
      resetData();

      try {
        const [receptionResult, analysisResult] = await Promise.all([
          fetchReceptionById(initialReception.id),
          fetchReceptionAnalysis(initialReception.id),
        ]);

        if (cancelled) {
          return;
        }

        if (!receptionResult.success || !receptionResult.data) {
          setError(
            receptionResult.error ||
              'No se pudieron cargar los datos de la recepción para editar.',
          );
          return;
        }

        const receptionDetail = receptionResult.data;
        const analysis = analysisResult.success
          ? (analysisResult.data ?? null)
          : (initialReception.analysis ?? null);
        const templateSource = receptionDetail.template ?? {};

        const grossWeight = Number(
          receptionDetail.grossWeight ?? initialReception.grossWeight ?? 0,
        );
        const tareWeight = Number(
          receptionDetail.tareWeight ?? initialReception.tare ?? 0,
        );

        setData('id', Number(receptionDetail.id ?? initialReception.id ?? 0));
        setData('producerId', Number(receptionDetail.producerId ?? 0));
        setData(
          'producerName',
          receptionDetail.producer?.name ?? initialReception.producer ?? '',
        );
        setData('riceTypeId', Number(receptionDetail.riceTypeId ?? 0));
        setData(
          'riceTypeName',
          receptionDetail.riceType?.name ?? initialReception.riceType ?? '',
        );
        setData('templateId', Number(receptionDetail.templateId ?? 0));
        setData('price', Number(receptionDetail.ricePrice ?? initialReception.price ?? 0));
        setData('guide', receptionDetail.guideNumber ?? initialReception.guide ?? '');
        setData(
          'licensePlate',
          receptionDetail.licensePlate ?? initialReception.licensePlate ?? '',
        );
        setData(
          'receptionDate',
          receptionDetail.receptionDate ? receptionDetail.receptionDate.split('T')[0] : '',
        );
        setData('grossWeight', grossWeight);
        setData('tare', tareWeight);
        setData('note', receptionDetail.notes ?? initialReception.note ?? '');
        setData('status', (receptionDetail.status ?? initialReception.status ?? 'cancelled') as any);

        setTemplate({
          useToleranceGroup: Boolean(
            analysis?.useToleranceGroup ?? templateSource.useToleranceGroup ?? true,
          ),
          groupToleranceValue: Number(
            analysis?.groupToleranceValue ??
              analysis?.groupTolerance ??
              templateSource.groupToleranceValue ??
              0,
          ),
          groupToleranceName:
            analysis?.groupToleranceName ?? templateSource.groupToleranceName ?? '',

          availableHumedad: Boolean(templateSource.availableHumedad ?? true),
          availableGranosVerdes: Boolean(templateSource.availableGranosVerdes ?? true),
          availableImpurezas: Boolean(templateSource.availableImpurezas ?? true),
          availableVano: Boolean(templateSource.availableVano ?? true),
          availableHualcacho: Boolean(templateSource.availableHualcacho ?? true),
          availableGranosManchados: Boolean(
            templateSource.availableGranosManchados ?? true,
          ),
          availableGranosPelados: Boolean(templateSource.availableGranosPelados ?? true),
          availableGranosYesosos: Boolean(templateSource.availableGranosYesosos ?? true),

          showToleranceHumedad: Boolean(
            analysis?.humedadTolVisible ?? templateSource.showToleranceHumedad ?? true,
          ),
          showToleranceGranosVerdes: Boolean(
            analysis?.verdesTolVisible ??
              templateSource.showToleranceGranosVerdes ??
              true,
          ),
          showToleranceImpurezas: Boolean(
            analysis?.impurezasTolVisible ??
              templateSource.showToleranceImpurezas ??
              true,
          ),
          showToleranceVano: Boolean(
            analysis?.vanoTolVisible ?? templateSource.showToleranceVano ?? true,
          ),
          showToleranceHualcacho: Boolean(
            analysis?.hualcachoTolVisible ??
              templateSource.showToleranceHualcacho ??
              true,
          ),
          showToleranceGranosManchados: Boolean(
            analysis?.manchadosTolVisible ??
              templateSource.showToleranceGranosManchados ??
              true,
          ),
          showToleranceGranosPelados: Boolean(
            analysis?.peladosTolVisible ??
              templateSource.showToleranceGranosPelados ??
              true,
          ),
          showToleranceGranosYesosos: Boolean(
            analysis?.yesososTolVisible ??
              templateSource.showToleranceGranosYesosos ??
              true,
          ),

          groupToleranceHumedad: Boolean(
            analysis?.humedadIsGroup ?? templateSource.groupToleranceHumedad ?? false,
          ),
          groupToleranceGranosVerdes: Boolean(
            analysis?.verdesIsGroup ?? templateSource.groupToleranceGranosVerdes ?? false,
          ),
          groupToleranceImpurezas: Boolean(
            analysis?.impurezasIsGroup ?? templateSource.groupToleranceImpurezas ?? false,
          ),
          groupToleranceVano: Boolean(
            analysis?.vanoIsGroup ?? templateSource.groupToleranceVano ?? false,
          ),
          groupToleranceHualcacho: Boolean(
            analysis?.hualcachoIsGroup ?? templateSource.groupToleranceHualcacho ?? false,
          ),
          groupToleranceGranosManchados: Boolean(
            analysis?.manchadosIsGroup ??
              templateSource.groupToleranceGranosManchados ??
              false,
          ),
          groupToleranceGranosPelados: Boolean(
            analysis?.peladosIsGroup ?? templateSource.groupToleranceGranosPelados ?? false,
          ),
          groupToleranceGranosYesosos: Boolean(
            analysis?.yesososIsGroup ?? templateSource.groupToleranceGranosYesosos ?? false,
          ),

          percentHumedad: Number(analysis?.humedadPercent ?? templateSource.percentHumedad ?? 0),
          toleranceHumedad: Number(
            analysis?.humedadTolerance ?? templateSource.toleranceHumedad ?? 0,
          ),
          percentGranosVerdes: Number(
            analysis?.verdesPercent ?? templateSource.percentGranosVerdes ?? 0,
          ),
          toleranceGranosVerdes: Number(
            analysis?.verdesTolerance ?? templateSource.toleranceGranosVerdes ?? 0,
          ),
          percentImpurezas: Number(
            analysis?.impurezasPercent ?? templateSource.percentImpurezas ?? 0,
          ),
          toleranceImpurezas: Number(
            analysis?.impurezasTolerance ?? templateSource.toleranceImpurezas ?? 0,
          ),
          percentVano: Number(analysis?.vanoPercent ?? templateSource.percentVano ?? 0),
          toleranceVano: Number(
            analysis?.vanoTolerance ?? templateSource.toleranceVano ?? 0,
          ),
          percentHualcacho: Number(
            analysis?.hualcachoPercent ?? templateSource.percentHualcacho ?? 0,
          ),
          toleranceHualcacho: Number(
            analysis?.hualcachoTolerance ?? templateSource.toleranceHualcacho ?? 0,
          ),
          percentGranosManchados: Number(
            analysis?.manchadosPercent ??
              templateSource.percentGranosManchados ??
              0,
          ),
          toleranceGranosManchados: Number(
            analysis?.manchadosTolerance ??
              templateSource.toleranceGranosManchados ??
              0,
          ),
          percentGranosPelados: Number(
            analysis?.peladosPercent ?? templateSource.percentGranosPelados ?? 0,
          ),
          toleranceGranosPelados: Number(
            analysis?.peladosTolerance ??
              templateSource.toleranceGranosPelados ??
              0,
          ),
          percentGranosYesosos: Number(
            analysis?.yesososPercent ?? templateSource.percentGranosYesosos ?? 0,
          ),
          toleranceGranosYesosos: Number(
            analysis?.yesososTolerance ??
              templateSource.toleranceGranosYesosos ??
              0,
          ),

          availableBonus: Boolean(
            templateSource.availableBonus ?? analysis?.bonusEnabled ?? true,
          ),
          toleranceBonus: Number(
            analysis?.bonusPercent ?? templateSource.toleranceBonus ?? 0,
          ),
          availableDry: Boolean(templateSource.availableDry ?? false),
          percentDry: Number(analysis?.dryPercent ?? templateSource.percentDry ?? 0),
        });

        if (analysis) {
          setClusterValues(
            'Humedad',
            analysis.humedadValue ?? analysis.humedadRange,
            analysis.humedadPercent,
            analysis.humedadTolerance,
          );
          setClusterValues(
            'GranosVerdes',
            analysis.verdesValue ?? analysis.verdesRange,
            analysis.verdesPercent,
            analysis.verdesTolerance,
          );
          setClusterValues(
            'Impurezas',
            analysis.impurezasValue ?? analysis.impurezasRange,
            analysis.impurezasPercent,
            analysis.impurezasTolerance,
          );
          setClusterValues(
            'Vano',
            analysis.vanoValue ?? analysis.vanoRange,
            analysis.vanoPercent,
            analysis.vanoTolerance,
          );
          setClusterValues(
            'Hualcacho',
            analysis.hualcachoValue ?? analysis.hualcachoRange,
            analysis.hualcachoPercent,
            analysis.hualcachoTolerance,
          );
          setClusterValues(
            'GranosManchados',
            analysis.manchadosValue ?? analysis.manchadosRange,
            analysis.manchadosPercent,
            analysis.manchadosTolerance,
          );
          setClusterValues(
            'GranosPelados',
            analysis.peladosValue ?? analysis.peladosRange,
            analysis.peladosPercent,
            analysis.peladosTolerance,
          );
          setClusterValues(
            'GranosYesosos',
            analysis.yesososValue ?? analysis.yesososRange,
            analysis.yesososPercent,
            analysis.yesososTolerance,
          );
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Error al cargar la recepción para edición.',
          );
        }
      } finally {
        if (!cancelled) {
          setInitializingEditData(false);
        }
      }
    };

    void preloadEditData();

    return () => {
      cancelled = true;
    };
  }, [
    clusters,
    editReceptionId,
    initialReception,
    isEditMode,
    resetData,
    setData,
    setTemplate,
  ]);

  // Establecer focus en el productor cuando el diálogo abre (en modo creación)
  React.useEffect(() => {
    if (!open || isEditMode) {
      return;
    }
    
    setTimeout(() => {
      producerAutocompleteRef.current?.focus();
    }, 300);
  }, [open, isEditMode]);

  const buildCreatePayload = React.useCallback(() => {
    const note = data.note?.trim() || undefined;
    const dryPercent = Number(clusters.Dry.percent?.getValue() ?? 0) || 0;

    const paramKeys = [
      'Humedad',
      'GranosVerdes',
      'Impurezas',
      'Vano',
      'Hualcacho',
      'GranosManchados',
      'GranosPelados',
      'GranosYesosos',
    ] as const;

    const resolveTolerance = (clusterKey: (typeof paramKeys)[number]): number => {
      const cluster = clusters[clusterKey];
      const fallbackTolerance = Number(cluster.tolerance?.getValue() ?? 0);

      if (template.useToleranceGroup && cluster.toleranceGroup) {
        return 0;
      }

      return fallbackTolerance;
    };

    const summaryPercent = Number(clusters.Summary.percent?.getValue() ?? 0);
    const summaryTolerance = Number(clusters.Summary.tolerance?.getValue() ?? 0);
    const summaryPenaltyKg = Number(clusters.Summary.penalty?.getValue() ?? 0);
    const bonusPercent = Number(clusters.Bonus.tolerance?.getValue() ?? template.toleranceBonus ?? 0);

    return {
      reception: {
        producerId: Number(data.producerId),
        riceTypeId: Number(data.riceTypeId),
        templateId: Number(data.templateId ?? 0),
        guide: data.guide?.trim() || '',
        licensePlate: data.licensePlate?.trim() || '',
        grossWeight: Number(data.grossWeight),
        tare: Number(data.tare),
        price: Number(data.price),
        receptionDate: data.receptionDate || undefined,
        note,
        dryPercent,
      },
      analysis: {
        templateId: Number(data.templateId ?? 0),
        useToleranceGroup: Boolean(template.useToleranceGroup),
        groupToleranceName: template.groupToleranceName || undefined,
        groupToleranceValue: Number(template.groupToleranceValue ?? 0),

        humedadRange: Number(clusters.Humedad.range?.getValue() ?? 0),
        humedadPercent: Number(clusters.Humedad.percent?.getValue() ?? 0),
        humedadValue: Number(clusters.Humedad.range?.getValue() ?? 0),
        humedadTolerance: resolveTolerance('Humedad'),
        humedadIsGroup: Boolean(clusters.Humedad.toleranceGroup),
        humedadTolVisible: Boolean(clusters.Humedad.showTolerance),

        impurezasRange: Number(clusters.Impurezas.range?.getValue() ?? 0),
        impurezasPercent: Number(clusters.Impurezas.percent?.getValue() ?? 0),
        impurezasValue: Number(clusters.Impurezas.range?.getValue() ?? 0),
        impurezasTolerance: resolveTolerance('Impurezas'),
        impurezasIsGroup: Boolean(clusters.Impurezas.toleranceGroup),
        impurezasTolVisible: Boolean(clusters.Impurezas.showTolerance),

        verdesRange: Number(clusters.GranosVerdes.range?.getValue() ?? 0),
        verdesPercent: Number(clusters.GranosVerdes.percent?.getValue() ?? 0),
        verdesValue: Number(clusters.GranosVerdes.range?.getValue() ?? 0),
        verdesTolerance: resolveTolerance('GranosVerdes'),
        verdesIsGroup: Boolean(clusters.GranosVerdes.toleranceGroup),
        verdesTolVisible: Boolean(clusters.GranosVerdes.showTolerance),

        manchadosRange: Number(clusters.GranosManchados.range?.getValue() ?? 0),
        manchadosPercent: Number(clusters.GranosManchados.percent?.getValue() ?? 0),
        manchadosValue: Number(clusters.GranosManchados.range?.getValue() ?? 0),
        manchadosTolerance: resolveTolerance('GranosManchados'),
        manchadosIsGroup: Boolean(clusters.GranosManchados.toleranceGroup),
        manchadosTolVisible: Boolean(clusters.GranosManchados.showTolerance),

        yesososRange: Number(clusters.GranosYesosos.range?.getValue() ?? 0),
        yesososPercent: Number(clusters.GranosYesosos.percent?.getValue() ?? 0),
        yesososValue: Number(clusters.GranosYesosos.range?.getValue() ?? 0),
        yesososTolerance: resolveTolerance('GranosYesosos'),
        yesososIsGroup: Boolean(clusters.GranosYesosos.toleranceGroup),
        yesososTolVisible: Boolean(clusters.GranosYesosos.showTolerance),

        peladosRange: Number(clusters.GranosPelados.range?.getValue() ?? 0),
        peladosPercent: Number(clusters.GranosPelados.percent?.getValue() ?? 0),
        peladosValue: Number(clusters.GranosPelados.range?.getValue() ?? 0),
        peladosTolerance: resolveTolerance('GranosPelados'),
        peladosIsGroup: Boolean(clusters.GranosPelados.toleranceGroup),
        peladosTolVisible: Boolean(clusters.GranosPelados.showTolerance),

        vanoRange: Number(clusters.Vano.range?.getValue() ?? 0),
        vanoPercent: Number(clusters.Vano.percent?.getValue() ?? 0),
        vanoValue: Number(clusters.Vano.range?.getValue() ?? 0),
        vanoTolerance: resolveTolerance('Vano'),
        vanoIsGroup: Boolean(clusters.Vano.toleranceGroup),
        vanoTolVisible: Boolean(clusters.Vano.showTolerance),

        hualcachoRange: Number(clusters.Hualcacho.range?.getValue() ?? 0),
        hualcachoPercent: Number(clusters.Hualcacho.percent?.getValue() ?? 0),
        hualcachoValue: Number(clusters.Hualcacho.range?.getValue() ?? 0),
        hualcachoTolerance: resolveTolerance('Hualcacho'),
        hualcachoIsGroup: Boolean(clusters.Hualcacho.toleranceGroup),
        hualcachoTolVisible: Boolean(clusters.Hualcacho.showTolerance),

        totalGroupPercent: summaryPercent,
        groupTolerance: Number(template.groupToleranceValue ?? 0),
        summaryPercent,
        summaryTolerance,
        summaryPenaltyKg,
        bonusEnabled: Boolean(clusters.Bonus.available),
        bonusPercent,
        dryPercent,
        notes: note,
      },
    };
  }, [clusters, data, template]);

  const handleCloseDialog = React.useCallback(() => {
    onClose(); // Restore manual close
  }, [onClose]);

  const handleCloseRealPrint = React.useCallback(() => {
    setRealPrintOpen(false);
    setRealPrintReception(null);
    // Establecer focus en el autocomplete del productor para la siguiente recepción
    setTimeout(() => {
      producerAutocompleteRef.current?.focus();
    }, 100);
  }, []);

  // Recargar plantilla después de guardar recepción
  const reloadCurrentTemplate = React.useCallback(async (templateId: number) => {
    try {
      let selectedTemplate;
      
      if (templateId > 0) {
        // Cargar plantilla específica
        selectedTemplate = await fetchTemplateById(templateId);
      } else {
        // Cargar plantilla por defecto
        selectedTemplate = await fetchDefaultTemplate();
      }

      if (selectedTemplate) {
        console.log('[RECARGA TEMPLATE] Plantilla recargada:', selectedTemplate);
        setTemplate({
          useToleranceGroup: selectedTemplate.useToleranceGroup ?? true,
          groupToleranceValue: selectedTemplate.groupToleranceValue ?? 0,
          groupToleranceName: selectedTemplate.groupToleranceName ?? '',
          
          // Parámetros disponibles
          availableHumedad: selectedTemplate.availableHumedad ?? true,
          availableGranosVerdes: selectedTemplate.availableGranosVerdes ?? true,
          availableImpurezas: selectedTemplate.availableImpurezas ?? true,
          availableVano: selectedTemplate.availableVano ?? true,
          availableHualcacho: selectedTemplate.availableHualcacho ?? true,
          availableGranosManchados: selectedTemplate.availableGranosManchados ?? true,
          availableGranosPelados: selectedTemplate.availableGranosPelados ?? true,
          availableGranosYesosos: selectedTemplate.availableGranosYesosos ?? true,
          availableBonus: selectedTemplate.availableBonus ?? true,
          availableDry: selectedTemplate.availableDry ?? false,
          
          // Mostrar tolerancia individual
          showToleranceHumedad: selectedTemplate.showToleranceHumedad ?? true,
          showToleranceGranosVerdes: selectedTemplate.showToleranceGranosVerdes ?? true,
          showToleranceImpurezas: selectedTemplate.showToleranceImpurezas ?? true,
          showToleranceVano: selectedTemplate.showToleranceVano ?? true,
          showToleranceHualcacho: selectedTemplate.showToleranceHualcacho ?? true,
          showToleranceGranosManchados: selectedTemplate.showToleranceGranosManchados ?? true,
          showToleranceGranosPelados: selectedTemplate.showToleranceGranosPelados ?? true,
          showToleranceGranosYesosos: selectedTemplate.showToleranceGranosYesosos ?? true,
          
          // Grupo de tolerancia por parámetro
          groupToleranceHumedad: selectedTemplate.groupToleranceHumedad ?? false,
          groupToleranceGranosVerdes: selectedTemplate.groupToleranceGranosVerdes ?? false,
          groupToleranceImpurezas: selectedTemplate.groupToleranceImpurezas ?? false,
          groupToleranceVano: selectedTemplate.groupToleranceVano ?? false,
          groupToleranceHualcacho: selectedTemplate.groupToleranceHualcacho ?? false,
          groupToleranceGranosManchados: selectedTemplate.groupToleranceGranosManchados ?? false,
          groupToleranceGranosPelados: selectedTemplate.groupToleranceGranosPelados ?? false,
          groupToleranceGranosYesosos: selectedTemplate.groupToleranceGranosYesosos ?? false,
          
          // Valores (porcentaje y tolerancia) de cada parámetro
          percentHumedad: selectedTemplate.percentHumedad ?? 0,
          toleranceHumedad: selectedTemplate.toleranceHumedad ?? 0,
          percentGranosVerdes: selectedTemplate.percentGranosVerdes ?? 0,
          toleranceGranosVerdes: selectedTemplate.toleranceGranosVerdes ?? 0,
          percentImpurezas: selectedTemplate.percentImpurezas ?? 0,
          toleranceImpurezas: selectedTemplate.toleranceImpurezas ?? 0,
          percentVano: selectedTemplate.percentVano ?? 0,
          toleranceVano: selectedTemplate.toleranceVano ?? 0,
          percentHualcacho: selectedTemplate.percentHualcacho ?? 0,
          toleranceHualcacho: selectedTemplate.toleranceHualcacho ?? 0,
          percentGranosManchados: selectedTemplate.percentGranosManchados ?? 0,
          toleranceGranosManchados: selectedTemplate.toleranceGranosManchados ?? 0,
          percentGranosPelados: selectedTemplate.percentGranosPelados ?? 0,
          toleranceGranosPelados: selectedTemplate.toleranceGranosPelados ?? 0,
          percentGranosYesosos: selectedTemplate.percentGranosYesosos ?? 0,
          toleranceGranosYesosos: selectedTemplate.toleranceGranosYesosos ?? 0,
          
          // Bonificación y Secado
          toleranceBonus: selectedTemplate.toleranceBonus ?? 0,
          percentDry: selectedTemplate.percentDry ?? 0,
        });
      }
    } catch (error) {
      console.error('[RECARGA TEMPLATE] Error recargando plantilla:', error);
    }
  }, [setTemplate]);

  const handleSaveReception = React.useCallback(async () => {
    console.log('[GUARDAR] Click en Guardar Recepción');
    console.log('[GUARDAR] Estado data:', JSON.stringify(data));
    console.log('[GUARDAR] isTemplateReady:', isTemplateReady);
    setSavingReception(true);
    setError(null);

    try {
      if (isEditMode && !initialReception) {
        console.log('[GUARDAR] No se encontró la recepción a editar');
        setError('No se encontró la recepción a editar.');
        setSavingReception(false);
        return;
      }

      if (!isTemplateReady) {
        console.log('[GUARDAR] Plantilla aún no está lista');
        setError('La plantilla se está cargando. Por favor espere...');
        setSavingReception(false);
        return;
      }

      const isValid = validateReception();
      if (!isValid) {
        console.log('[GUARDAR] Validación fallida');
        setError('Faltan datos obligatorios para guardar la recepción.');
        setSavingReception(false);
        return;
      }

      if (!Number(data.templateId ?? 0)) {
        console.log('[GUARDAR] Falta plantilla, data.templateId:', data.templateId, 'Number:', Number(data.templateId ?? 0));
        setError('Debes seleccionar una plantilla antes de guardar la recepción.');
        setSavingReception(false);
        return;
      }

      calculateTotals();
      console.log('[GUARDAR] Payload:', buildCreatePayload());
      const savePayload = buildCreatePayload();
      const saveResult = isEditMode
        ? await updateReceptionAndAnalysis(Number(initialReception?.id), savePayload)
        : await createReceptionAndAnalysis(savePayload);
      console.log('[GUARDAR] Resultado:', saveResult);

      if (!saveResult.success || !saveResult.data) {
        console.log('[GUARDAR] Error al guardar:', saveResult.error);
        setError(saveResult.error || 'No se pudo guardar la recepción.');
        setSavingReception(false);
        return;
      }

      // Obtener la última recepción guardada con su análisis
      let realReception: PrintableReception | null = null;
      const lastReceptionResult = await fetchLastReception();
      console.log('[GUARDAR] fetchLastReception:', lastReceptionResult);
      if (lastReceptionResult.success && lastReceptionResult.data) {
        const lastReception = lastReceptionResult.data;
        // Cargar el análisis asociado
        const analysisResult = await fetchReceptionAnalysis(lastReception.id);
        console.log('[GUARDAR] fetchReceptionAnalysis:', analysisResult);
        realReception = mapPrintableReception(lastReception, analysisResult.data);
      } else {
        realReception = mapPrintableReception(saveResult.data.reception, saveResult.data.analysis);
      }
      // Mapea la respuesta del POST a PrintableReception
      function mapPrintableReception(raw: any, analysis?: any): PrintableReception {
        return {
          id: raw.id ?? 0,
          producer: raw.producer?.name ?? raw.producerName ?? 'Sin productor',
          rut: raw.producer?.rut ?? raw.rut ?? '-',
          producerAddress: raw.producer?.address ?? '',
          producerCity: raw.producer?.city ?? '',
          riceType: raw.riceType?.name ?? raw.riceTypeName ?? 'Sin tipo de arroz',
          templateName: raw.template?.name ?? raw.templateName ?? 'No definida',
          templateConfig: raw.template?.config ?? {
            availableHumedad: raw.template?.availableHumedad ?? true,
            availableGranosVerdes: raw.template?.availableGranosVerdes ?? true,
            availableImpurezas: raw.template?.availableImpurezas ?? true,
            availableVano: raw.template?.availableVano ?? false,
            availableHualcacho: raw.template?.availableHualcacho ?? false,
            availableGranosManchados: raw.template?.availableGranosManchados ?? true,
            availableGranosPelados: raw.template?.availableGranosPelados ?? true,
            availableGranosYesosos: raw.template?.availableGranosYesosos ?? false,
          },
          price: Number(raw.ricePrice ?? 0),
          grossWeight: Number(raw.grossWeight ?? 0),
          tare: Number(raw.tareWeight ?? raw.tare ?? 0),
          netWeight: Number(raw.netWeight ?? 0),
          guide: raw.guideNumber ?? raw.guide ?? '-',
          licensePlate: raw.licensePlate ?? '-',
          receptionDate: raw.receptionDate ?? '',
          note: raw.notes ?? raw.note ?? '',
          createdAt: raw.createdAt ?? '',
          totalConDescuentos: Number(raw.totalDiscountKg ?? 0),
          bonusKg: Number(raw.bonusKg ?? 0),
          paddyNeto: Number(raw.finalNetWeight ?? 0),
          status: raw.status ?? 'analyzed',
          analysis: analysis ?? null,
        };
      }
      // Guardar templateId antes de resetear
      const currentTemplateId = data.templateId ?? 0;
      
      // Limpiar formulario pero mantener plantilla cargada, abrir impresión
      resetDataButKeepTemplate();
      
      // Recargar la plantilla desde la API
      await reloadCurrentTemplate(currentTemplateId);
      
      setProducerAutocompleteResetKey((prev) => prev + 1);
      setRealPrintReception(realReception);
      setRealPrintOpen(true);
      console.log('[GUARDAR] Diálogo de impresión abierto');
      onSuccess();
    } catch (err) {
      console.log('[GUARDAR] Error inesperado:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Error inesperado guardando la recepción.',
      );
    } finally {
      setSavingReception(false);
    }
  }, [
    buildCreatePayload,
    calculateTotals,
    data.templateId,
    initialReception,
    isEditMode,
    isTemplateReady,
    onSuccess,
    validateReception,
    reloadCurrentTemplate,
  ]);

  const getFocusableElements = React.useCallback(() => {
    const form = formRef.current;
    if (!form) {
      return [] as HTMLElement[];
    }

    return Array.from(
      form.querySelectorAll<HTMLElement>('input, select, textarea, button')
    ).filter((element) => {
      if (element.tabIndex === -1 || element.hasAttribute('disabled')) {
        return false;
      }

      if (element instanceof HTMLInputElement && element.readOnly) {
        return false;
      }

      if (element.getAttribute('aria-hidden') === 'true') {
        return false;
      }

      const styles = window.getComputedStyle(element);
      if (styles.visibility === 'hidden' || styles.display === 'none') {
        return false;
      }

      if (element.offsetParent === null && styles.position !== 'fixed') {
        return false;
      }

      return true;
    });
  }, []);

  const moveFocusToNextElement = React.useCallback(
    (currentElement: HTMLElement) => {
      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) {
        return;
      }

      const currentIndex = focusableElements.indexOf(currentElement);
      if (currentIndex < 0) {
        focusableElements[0].focus();
        return;
      }

      const nextIndex = (currentIndex + 1) % focusableElements.length;
      focusableElements[nextIndex].focus();
    },
    [getFocusableElements]
  );

  const handleFormKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLFormElement>) => {
      const target = event.target as HTMLElement;

      if (event.key === 'Tab') {
        event.preventDefault();
        return;
      }

      const isPlusNavigationKey = event.code === 'NumpadAdd' || event.key === '+';
      if (!isPlusNavigationKey) {
        return;
      }

      event.preventDefault();
      moveFocusToNextElement(target);
    },
    [moveFocusToNextElement]
  );

  const handleDirectSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (initializingEditData) {
      return;
    }

    // Validación detallada antes de guardar
    setError(null);
    const missingFields: string[] = [];
    if (data.producerId === 0) missingFields.push('Productor');
    if (data.riceTypeId === 0) missingFields.push('Tipo de arroz');
    if (data.grossWeight <= 0) missingFields.push('Peso bruto');

    // Validar clusters (solo tipo 'param', no Summary/Bonus/Dry que son calculados)
    Object.entries(clusters).forEach(([key, cluster]) => {
      if (cluster.type === 'param' && cluster.available && !validateParamCluster(cluster, data.netWeight)) {
        missingFields.push(cluster.name || key);
      }
    });

    if (missingFields.length > 0) {
      setError(
        'Completa los campos obligatorios antes de guardar la recepción.' +
        '\nCampos incompletos o inválidos: ' + missingFields.join(', ')
      );
      return;
    }

    // Validación pasó, proceed to save
    calculateTotals();
    await handleSaveReception();
  };

  // Atajo de teclado: Tecla "-" para enfocar el autocomplete del productor
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Detectar tecla "-" (menos) desde el teclado numérico o regular
      if (e.key === '-' || e.code === 'Minus' || e.key === 'Subtract') {
        e.preventDefault();
        e.stopPropagation();
        
        let producerInput: HTMLInputElement | null = null;
        
        // Estrategia 1: Buscar por data-test-id (más confiable)
        producerInput = document.querySelector(
          'input[data-test-id="auto-complete-input"]'
        ) as HTMLInputElement | null;
        
        // Estrategia 2: Buscar por placeholder que contenga "productor"
        if (!producerInput) {
          producerInput = document.querySelector(
            'input[placeholder*="productor"]'
          ) as HTMLInputElement | null;
        }
        
        // Estrategia 3: Si no encuentra, buscar el primer input del formulario visible
        if (!producerInput) {
          const allInputs = document.querySelectorAll('input[type="text"]:not([disabled])');
          if (allInputs.length > 0) {
            producerInput = allInputs[0] as HTMLInputElement;
          }
        }
        
        if (producerInput) {
          producerInput.focus();
          producerInput.click?.();
          // Enviar evento input para abrir el dropdown
          producerInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }
    };

    // Listener en window para capturar todos los eventos
    window.addEventListener('keydown', handleKeyDown, true);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, []);

  return (
    <div
      className="w-screen h-screen max-w-none bg-white rounded-lg shadow-2xl flex flex-col opacity-100"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-gray-50">
        <h2 className="text-xl font-bold text-gray-900">
          {isEditMode ? 'Editar Recepción' : 'Crear Recepción'}
        </h2>
        <button
          type="button"
          onClick={handleCloseDialog}
          disabled={loading || initializingEditData}
          className="text-gray-500 hover:text-gray-700 text-lg font-medium leading-none disabled:opacity-50"
        >
          ✕
        </button>
      </div>

      {/* Error Alert */}
      {error && <Alert variant="error">{error}</Alert>}

      {/* Content - 3 Columns */}
      <form
        ref={formRef}
        onSubmit={handleDirectSave}
        onKeyDown={handleFormKeyDown}
        className="flex-1 overflow-hidden flex flex-row"
      >
        {/* Columna Izquierda - Datos Generales (Angosta) */}
        <div className="w-96 overflow-y-auto border-r border-gray-200 p-6 bg-white">
          <div className="pr-4">
            <ReceptionGeneralData
              disableProducerSelection={isEditMode}
              disableRiceTypeSelection={isEditMode}
              disableDefaultTemplateLoad={isEditMode}
              producerAutocompleteRef={producerAutocompleteRef}
            />
          </div>
        </div>

        {/* Columna Centro - Análisis de Granos (Ancha) */}
          <div className="flex-1 overflow-y-auto border-r border-gray-200 p-6">
          <div className="pr-4">
            <GrainAnalysis />
          </div>
        </div>

        {/* Columna Derecha - Resumen/Totales */}
        <div className="w-80 overflow-y-auto p-6 bg-white flex flex-col">
          <ReceptionSummary />
          
          {/* Footer con botones - pegado al bottom */}
          <div className="flex gap-2 mt-auto pt-6 border-t">
            <Button
              variant="secondary"
              onClick={handleCloseDialog}
              disabled={loading || initializingEditData}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button loading={loading || initializingEditData} type="submit" className="flex-1">
              Guardar
            </Button>
          </div>
        </div>
      </form>

      {realPrintReception && (
        <PrintDialog
          open={realPrintOpen}
          onClose={handleCloseRealPrint}
          title={`Recepción #${realPrintReception.id || realPrintReception.guide}`}
          fileName={`Recepcion-${realPrintReception.guide}`}
          disablePrint={savingReception}
          size="custom"
          maxWidth="96vw"
          fullWidth
          scroll="body"
          zIndex={90}
          contentStyle={{ maxHeight: '95vh' }}
        >
          <ReceptionToPrint reception={realPrintReception} />
        </PrintDialog>
      )}
          {/* Sub-dialog for loading */}
          {savingReception && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/30">
              <div className="bg-white rounded-lg shadow-xl p-8 flex flex-col items-center">
                <DotProgress totalSteps={5} size={18} gap={10} />
                <span className="mt-4 text-lg font-semibold text-gray-700">Guardando recepción...</span>
              </div>
            </div>
          )}
    </div>
  );
}

