'use client';

import React from 'react';
import { Button } from '@/shared/components/ui/Button/Button';
import Alert from '@/shared/components/ui/Alert/Alert';
import { PrintDialog } from '@/shared/components/PrintDialog';
import {
  createReceptionAndAnalysis,
  fetchReceptionAnalysis,
  fetchReceptionById,
  updateReceptionAndAnalysis,
} from '../actions/fetch.action';
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
  const {
    data,
    template,
    clusters,
    validateReception,
    calculateTotals,
    setData,
    setTemplate,
    resetData,
  } = useReceptionContext();
  const isEditMode = mode === 'edit' && Boolean(initialReception?.id);
  const editReceptionId = initialReception?.id ?? null;
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [previewReception, setPreviewReception] = React.useState<PrintableReception | null>(null);
  const [savingReception, setSavingReception] = React.useState(false);
  const [previewError, setPreviewError] = React.useState<string | null>(null);
  const [initializingEditData, setInitializingEditData] = React.useState(false);
  const formRef = React.useRef<HTMLFormElement | null>(null);

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
      setPreviewError(null);
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

    const groupedParamsCount = paramKeys.filter((key) => Boolean(clusters[key].toleranceGroup)).length;
    const distributedGroupTolerance =
      template.useToleranceGroup && groupedParamsCount > 0
        ? Number(template.groupToleranceValue ?? 0) / groupedParamsCount
        : 0;

    const resolveTolerance = (clusterKey: (typeof paramKeys)[number]): number => {
      const cluster = clusters[clusterKey];
      const fallbackTolerance = Number(cluster.tolerance?.getValue() ?? 0);

      if (template.useToleranceGroup && cluster.toleranceGroup && groupedParamsCount > 0) {
        return distributedGroupTolerance;
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

  const buildPreviewReception = React.useCallback((): PrintableReception => {
    const nowIso = new Date().toISOString();
    const payload = buildCreatePayload();

    const grossWeight = Number(payload.reception.grossWeight ?? data.grossWeight ?? 0);
    const tare = Number(payload.reception.tare ?? data.tare ?? 0);
    const netWeight = Math.max(0, grossWeight - tare);

    const summaryPenaltyKg = Number(
      payload.analysis.summaryPenaltyKg ??
        clusters.Summary.penalty?.getValue() ??
        data.totalDiscounts ??
        0,
    );
    const bonusKg = Number(
      clusters.Bonus.penalty?.getValue() ??
        data.bonus ??
        0,
    );
    const paddyNeto = netWeight - summaryPenaltyKg + bonusKg;

    const templateConfig: ReceptionTemplateConfig = {
      availableHumedad: Boolean(template.availableHumedad),
      availableGranosVerdes: Boolean(template.availableGranosVerdes),
      availableImpurezas: Boolean(template.availableImpurezas),
      availableVano: Boolean(template.availableVano),
      availableHualcacho: Boolean(template.availableHualcacho),
      availableGranosManchados: Boolean(template.availableGranosManchados),
      availableGranosPelados: Boolean(template.availableGranosPelados),
      availableGranosYesosos: Boolean(template.availableGranosYesosos),
    };

    const analysis: ReceptionAnalysis = {
      id: 0,
      receptionId: 0,
      ...payload.analysis,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    return {
      id: 0,
      producer: data.producerName || 'Sin productor',
      rut: '',
      producerAddress: '',
      producerCity: '',
      riceType: data.riceTypeName || 'Sin tipo de arroz',
      templateName: 'Previsualización',
      templateConfig,
      price: Number(payload.reception.price ?? data.price ?? 0),
      grossWeight,
      tare,
      netWeight,
      guide: data.guide || 'SIN-GUIA',
      licensePlate: data.licensePlate || '-',
      note: data.note,
      createdAt: nowIso,
      totalConDescuentos: summaryPenaltyKg,
      bonusKg,
      paddyNeto,
      status: 'analyzed',
      analysis,
    };
  }, [
    buildCreatePayload,
    clusters.Bonus.penalty,
    clusters.Summary.penalty,
    data,
    template,
  ]);

  const handleCloseDialog = React.useCallback(() => {
    setPreviewOpen(false);
    setPreviewReception(null);
    setPreviewError(null);
    onClose();
  }, [onClose]);

  const handleClosePreview = React.useCallback(() => {
    setPreviewOpen(false);
    setPreviewError(null);
  }, []);

  const handleSaveReception = React.useCallback(async () => {
    setSavingReception(true);
    setPreviewError(null);

    try {
      if (isEditMode && !initialReception) {
        setPreviewError('No se encontró la recepción a editar.');
        return;
      }

      const isValid = validateReception();
      if (!isValid) {
        setPreviewError('Faltan datos obligatorios para guardar la recepción.');
        return;
      }

      if (!Number(data.templateId ?? 0)) {
        setPreviewError('Debes seleccionar una plantilla antes de guardar la recepción.');
        return;
      }

      calculateTotals();
      const savePayload = buildCreatePayload();
      const saveResult = isEditMode
        ? await updateReceptionAndAnalysis(Number(initialReception?.id), savePayload)
        : await createReceptionAndAnalysis(savePayload);

      if (!saveResult.success) {
        setPreviewError(saveResult.error || 'No se pudo guardar la recepción.');
        return;
      }

      setPreviewOpen(false);
      setPreviewReception(null);
      onClose();
      onSuccess();
    } catch (err) {
      setPreviewError(
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
    onClose,
    onSuccess,
    validateReception,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (initializingEditData) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const isValid = validateReception();
      if (!isValid) {
        setError('Completa los campos obligatorios antes de previsualizar la recepción.');
        return;
      }

      calculateTotals();
      const preview = buildPreviewReception();
      setPreviewReception(preview);
      setPreviewError(null);
      setPreviewOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear la recepción');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`w-screen h-screen max-w-none bg-white rounded-lg shadow-2xl flex flex-col ${
        previewOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
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
        onSubmit={handleSubmit}
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
              Previsualizar
            </Button>
          </div>
        </div>
      </form>

      {previewReception && (
        <PrintDialog
          open={previewOpen}
          onClose={handleClosePreview}
          title={`${isEditMode ? 'Previsualización Edición' : 'Previsualización'} Recepción #${previewReception.guide}`}
          fileName={`Previsualizacion-Recepcion-${previewReception.guide}`}
          showPrintButton
          disablePrint={savingReception}
          extraActions={
            <Button
              variant="primary"
              onClick={handleSaveReception}
              loading={savingReception}
              disabled={savingReception}
            >
              {isEditMode ? 'Guardar Cambios' : 'Guardar Recepción'}
            </Button>
          }
          size="custom"
          maxWidth="96vw"
          fullWidth
          scroll="body"
          zIndex={90}
          contentStyle={{ maxHeight: '95vh' }}
        >
          <div className="space-y-3">
            {previewError && <Alert variant="error">{previewError}</Alert>}
            <ReceptionToPrint reception={previewReception} />
          </div>
        </PrintDialog>
      )}
    </div>
  );
}

