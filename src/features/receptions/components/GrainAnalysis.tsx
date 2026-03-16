'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Switch from '@/shared/components/ui/Switch/Switch';
import { TextField } from '@/shared/components/ui/TextField/TextField';
import GrainRow from './GrainRow';
import { useReceptionContext } from '../context/ReceptionContext';
import { TemplateConfig } from '../types/nodes.types';

// Componente de carga con logo animado
const LoadingIndicator: React.FC = () => (
  <div className="flex w-full flex-col items-center justify-center gap-6 py-8">
    {/* Logo */}
    <div className="w-24 h-24">
      <img 
        src="/logo.svg" 
        alt="Cargando análisis de grano"
        className="w-full h-full object-contain drop-shadow-lg"
        style={{
          filter: 'drop-shadow(0 4px 8px rgba(25, 118, 210, 0.3))'
        }}
      />
    </div>
    
    {/* Puntos de carga */}
    <div className="flex items-center gap-2">
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"
          style={{
            animationDelay: `${index * 0.15}s`,
          }}
        />
      ))}
    </div>
    
    {/* Texto de carga */}
    <p className="text-center text-gray-600 text-sm font-medium">
      Cargando análisis de grano...
    </p>
    
    {/* Subtexto */}
    <p className="text-center text-gray-400 text-xs max-w-40 leading-relaxed">
      Configurando parámetros y rangos de descuento según el template seleccionado
    </p>
  </div>
);

// Componente que indica que los rangos se cargaron correctamente
const RangesLoadedBadge: React.FC = () => (
  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 border border-green-200">
    <div className="flex gap-1">
      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" style={{ animationDelay: '0.15s' }} />
      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" style={{ animationDelay: '0.3s' }} />
    </div>
    <span className="text-xs font-semibold text-green-700">Rangos cargados ✓</span>
  </div>
);

const PARAM_CODE_ORDER: Record<string, number> = {
  Humedad: 1,
  GranosVerdes: 2,
  Impurezas: 3,
  Vano: 4,
  Hualcacho: 5,
  GranosManchados: 6,
  GranosPelados: 7,
  GranosYesosos: 8,
};

const SHOW_TOLERANCE_FIELD_MAP: Record<string, keyof TemplateConfig> = {
  Humedad: 'showToleranceHumedad',
  GranosVerdes: 'showToleranceGranosVerdes',
  Impurezas: 'showToleranceImpurezas',
  Vano: 'showToleranceVano',
  Hualcacho: 'showToleranceHualcacho',
  GranosManchados: 'showToleranceGranosManchados',
  GranosPelados: 'showToleranceGranosPelados',
  GranosYesosos: 'showToleranceGranosYesosos',
};

export default function GrainAnalysis() {
  const { data, template, clusters, version, setData, setClusterValue, setTemplate, calculateTotals } =
    useReceptionContext();

  const [useGroupTolerance, setUseGroupTolerance] = useState(template.useToleranceGroup);
  const [groupToleranceValue, setGroupToleranceValue] = useState(Number(template.groupToleranceValue) || 0);
  const [isLoading, setIsLoading] = useState(true);
  const [showContent, setShowContent] = useState(false);
  const [templateVersion, setTemplateVersion] = useState(0); // Fuerza re-render cuando cambia template
  const hasInitializedRangesRef = React.useRef(false);

  // Sincronizar cuando cambia el template
  useEffect(() => {
    setUseGroupTolerance(template.useToleranceGroup);
    setGroupToleranceValue(Number(template.groupToleranceValue) || 0);
    setTemplateVersion(v => v + 1); // Fuerza que se recalcule paramClusters
  }, [
    template.useToleranceGroup,
    template.groupToleranceValue,
    template.availableHumedad,
    template.availableGranosVerdes,
    template.availableImpurezas,
    template.availableVano,
    template.availableHualcacho,
    template.availableGranosManchados,
    template.availableGranosPelados,
    template.availableGranosYesosos,
    template.availableBonus,
    template.availableDry,
  ]);

  // Lazy loading de rangos
  useEffect(() => {
    if (hasInitializedRangesRef.current) {
      return;
    }

    hasInitializedRangesRef.current = true;

    const loadRanges = async () => {
      setIsLoading(true);
      setShowContent(false);
      
      try {
        // Simular carga de rangos en paralelo
        await new Promise(resolve => setTimeout(resolve, 800));
        calculateTotals();
      } catch (error) {
        console.error('Error cargando rangos:', error);
      } finally {
        setIsLoading(false);
        setTimeout(() => setShowContent(true), 100);
      }
    };

    loadRanges();
  }, [calculateTotals]);

  const handleGroupToleranceChange = (value: boolean) => {
    setUseGroupTolerance(value);
    setTemplate({ useToleranceGroup: value });
  };

  const handleGroupToleranceValueChange = (value: number) => {
    setGroupToleranceValue(value);
    setTemplate({ groupToleranceValue: value });
  };

  const handleRowShowToleranceChange = (clusterKey: string, visible: boolean) => {
    const templateField = SHOW_TOLERANCE_FIELD_MAP[clusterKey];
    if (!templateField) {
      return;
    }

    setTemplate({ [templateField]: visible } as Partial<TemplateConfig>);
  };

  // Obtener parámetros disponibles del template
  // Usa templateVersion como dependencia para forzar recálculo cuando cambia template
  const paramClusters = useMemo(
    () =>
      Object.values(clusters)
        .filter((c) => {
          // Requiere que sea de tipo parámetro Y que esté marcado como disponible
          return c.type === 'param' && c.available;
        })
        .sort((a, b) => {
          const orderA = PARAM_CODE_ORDER[a.key] ?? Number.MAX_SAFE_INTEGER;
          const orderB = PARAM_CODE_ORDER[b.key] ?? Number.MAX_SAFE_INTEGER;

          if (orderA === orderB) {
            return a.name.localeCompare(b.name);
          }

          return orderA - orderB;
        }),
    [clusters, templateVersion]
  );

  const bonusCluster = Object.values(clusters).find((c) => c.type === 'bonus');
  const dryCluster = Object.values(clusters).find((c) => c.type === 'dry');
  const summaryCluster = Object.values(clusters).find((c) => c.type === 'summary');

  // Separar parametros del grupo de tolerancia
  const groupToleranceParams = paramClusters.filter((c) => c.toleranceGroup && useGroupTolerance);

  // Logica de Tolerancia Grupal:
  // - Es un presupuesto total que se divide entre todos los parámetros en el grupo
  // - Ejemplo: Si tolerancia grupal = 5% y hay 2 parámetros en grupo -> cada uno obtiene 5% / 2 = 2.5%
  const distributedGroupTolerance = groupToleranceParams.length > 0 
    ? Number(groupToleranceValue) / groupToleranceParams.length 
    : 0;
  const groupedParamLabel = groupToleranceParams.length === 1 ? 'parámetro' : 'parámetros';

  const containerClassName = isLoading
    ? 'w-full min-h-[560px] flex items-center justify-center'
    : 'inline-block w-fit';

  return (
    <div className={containerClassName}>
      {isLoading ? (
        <LoadingIndicator />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900">Análisis de Laboratorio</h3>
            <RangesLoadedBadge />
          </div>

          {/* Tabla con encabezado */}
          <div>
            {/* Encabezado */}
            <div className="flex flex-row gap-1 px-3 pt-3 pb-0.5 mb-4 font-semibold text-xs text-gray-700 border-b border-gray-300">
              <div style={{ width: '156px' }}>Parámetro</div>
              <div style={{ width: '130px' }} className="text-center">Rango</div>
              <div style={{ width: '130px' }} className="text-center">% Desc.</div>
              <div style={{ width: '130px' }} className="text-center">Tolerancia</div>
              <div
                style={{ width: '40px' }}
                className="text-center flex items-center justify-center"
                aria-hidden
              />
              <div style={{ width: '130px' }} className="text-center">Penalización</div>
            </div>

            {/* Filas de parámetros */}
            <div className="space-y-1">
              {!useGroupTolerance ? (
                // Sin grupo de tolerancia: orden de código normal
                paramClusters.map((cluster) => (
                  <GrainRow
                    key={cluster.key}
                    cluster={cluster}
                    onRangeChange={(value) => setClusterValue(cluster.key, 'range', value)}
                    onPercentChange={(value) => setClusterValue(cluster.key, 'percent', value)}
                    onToleranceChange={(value) => setClusterValue(cluster.key, 'tolerance', value)}
                    onShowToleranceChange={(visible) =>
                      handleRowShowToleranceChange(cluster.key, visible)
                    }
                    useGroupTolerance={false}
                    groupToleranceValue={groupToleranceValue}
                    showVisibilityButton={true}
                    version={version}
                  />
                ))
              ) : (
                // Con grupo de tolerancia: primero los NO-grupo, luego separador + grupo
                <>
                  {paramClusters
                    .filter((c) => !c.toleranceGroup)
                    .map((cluster) => (
                      <GrainRow
                        key={cluster.key}
                        cluster={cluster}
                        onRangeChange={(value) => setClusterValue(cluster.key, 'range', value)}
                        onPercentChange={(value) => setClusterValue(cluster.key, 'percent', value)}
                        onToleranceChange={(value) => setClusterValue(cluster.key, 'tolerance', value)}
                        onShowToleranceChange={(visible) =>
                          handleRowShowToleranceChange(cluster.key, visible)
                        }
                        useGroupTolerance={false}
                        groupToleranceValue={groupToleranceValue}
                        showVisibilityButton={true}
                        version={version}
                      />
                    ))}

                  {groupToleranceParams.length > 0 && (
                    <>
                      {/* Separador con nombre del grupo */}
                      <div className="flex items-center gap-2 px-2 pt-2 pb-0.5">
                        <div className="flex-1 border-t border-secondary" />
                        <span className="text-xs font-semibold text-cyan-700 bg-secondary-20 border border-secondary rounded-full px-2.5 py-0.5">
                          {template.groupToleranceName || 'Grupo de Tolerancia'}
                        </span>
                        <div className="flex-1 border-t border-secondary" />
                      </div>

                      {groupToleranceParams.map((cluster) => (
                        <div
                          key={`${cluster.key}-group`}
                          style={{ backgroundColor: '#eceff1', borderRadius: '4px' }}
                        >
                          <GrainRow
                            cluster={cluster}
                            onRangeChange={(value) => setClusterValue(cluster.key, 'range', value)}
                            onPercentChange={(value) => setClusterValue(cluster.key, 'percent', value)}
                            onToleranceChange={(value) => setClusterValue(cluster.key, 'tolerance', value)}
                            onShowToleranceChange={(visible) =>
                              handleRowShowToleranceChange(cluster.key, visible)
                            }
                            useGroupTolerance={true}
                            groupToleranceValue={distributedGroupTolerance}
                            showVisibilityButton={true}
                            version={version}
                          />
                        </div>
                      ))}
                    </>
                  )}
                </>
              )}

            {/* Summary */}
            {summaryCluster && (
              <GrainRow
                cluster={summaryCluster}
                onRangeChange={() => {}}
                onPercentChange={() => {}}
                onToleranceChange={() => {}}
                useGroupTolerance={false}
                groupToleranceValue={0}
                showVisibilityButton={false}
                isSummary={true}
                version={version}
              />
            )}

            {/* Bonus */}
            {bonusCluster && bonusCluster.available && (
              <GrainRow
                cluster={bonusCluster}
                onRangeChange={() => {}}
                onPercentChange={() => {}}
                onToleranceChange={(value) => setClusterValue(bonusCluster.key, 'tolerance', value)}
                useGroupTolerance={false}
                groupToleranceValue={0}
                showVisibilityButton={false}
                version={version}
              />
            )}

              {/* Dry */}
              {dryCluster && dryCluster.available && (
                <GrainRow
                  cluster={dryCluster}
                  onRangeChange={(value) => setClusterValue(dryCluster.key, 'range', value)}
                  onPercentChange={(value) => setClusterValue(dryCluster.key, 'percent', value)}
                  onToleranceChange={() => {}}
                  useGroupTolerance={false}
                  groupToleranceValue={0}
                  showVisibilityButton={false}
                  version={version}
                />
              )}

            </div>
          </div>

          {/* Configuración de Tolerancia Grupal en una sola fila */}
          <div className="border border-secondary rounded-lg p-3 bg-secondary-20">
            <div className="flex items-center gap-3 flex-nowrap overflow-x-auto whitespace-nowrap">
              <Switch
                checked={useGroupTolerance}
                onChange={handleGroupToleranceChange}
                label="Usar tolerancia grupal"
              />

              {useGroupTolerance && (
                <>
                  <span className="text-xs font-medium text-cyan-700">Tolerancia %</span>
                  <TextField
                    label=""
                    compact
                    type="number"
                    value={groupToleranceValue.toString()}
                    onChange={(e) => handleGroupToleranceValueChange(parseFloat(e.target.value) || 0)}
                    selectAllOnFocus
                    step="0.1"
                    min="0"
                    className="w-28 shrink-0"
                  />
                  <span className="text-xs text-cyan-700 bg-white/80 border border-secondary rounded px-2 py-1">
                    {groupToleranceParams.length} {groupedParamLabel}
                  </span>
                  <span className="text-xs font-semibold text-cyan-700 bg-white/80 border border-secondary rounded px-2 py-1">
                    {distributedGroupTolerance.toFixed(2)}% por parámetro
                  </span>
                </>
              )}
            </div>
          </div>


        </div>
      )}
    </div>
  );
}
