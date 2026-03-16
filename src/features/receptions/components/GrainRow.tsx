'use client';

import React, { useState, useEffect } from 'react';
import IconButton from '@/shared/components/ui/IconButton/IconButton';
import { TextField } from '@/shared/components/ui/TextField/TextField';
import { ParamCluster } from '../types/nodes.types';

type EditableField = 'range' | 'percent' | 'tolerance' | null;

interface GrainRowProps {
  cluster: ParamCluster;
  onRangeChange?: (value: number) => void;
  onPercentChange?: (value: number) => void;
  onToleranceChange?: (value: number) => void;
  onShowToleranceChange?: (visible: boolean) => void;
  useGroupTolerance: boolean;
  groupToleranceValue: number;
  showVisibilityButton?: boolean;
  isSummary?: boolean;
  version?: number; // Para sincronizarse con cambios en el hook
}

// Componente de botón de visibilidad
const VisibilityButton: React.FC<{ isVisible: boolean; onToggle: () => void }> = ({
  isVisible,
  onToggle,
}) => (
  <IconButton
    icon={isVisible ? 'visibility_off' : 'visibility'}
    variant="basicSecondary"
    size="sm"
    onClick={onToggle}
    title={isVisible ? 'Ocultar' : 'Mostrar'}
    ariaLabel={isVisible ? 'Ocultar tolerancia' : 'Mostrar tolerancia'}
  />
);

export default function GrainRow({
  cluster,
  onRangeChange,
  onPercentChange,
  onToleranceChange,
  onShowToleranceChange,
  useGroupTolerance,
  groupToleranceValue,
  showVisibilityButton = false,
  isSummary = false,
  version = 0,
}: GrainRowProps) {
  if (!cluster.available && !isSummary) {
    return null;
  }

  const isBonus = cluster.type === 'bonus';
  const isDry = cluster.type === 'dry';

  const [showTolerance, setShowTolerance] = useState(cluster.showTolerance !== false);
  const [activeField, setActiveField] = useState<EditableField>(null);
  
  // Estados locales para reflejar los valores del cluster
  const [rangeValue, setRangeValue] = useState<string>(String(Number(cluster.range?.getValue() ?? 0).toFixed(2)));
  const [percentValue, setPercentValue] = useState<string>(String(Number(cluster.percent?.getValue() ?? 0).toFixed(2)));
  const [toleranceValue, setToleranceValue] = useState<string>(String(Number(cluster.tolerance?.getValue() ?? 0).toFixed(2)));

  const formatEditableValue = (value: number | undefined) =>
    String(Number(value ?? 0).toFixed(2));

  const parseEditableValue = (value: string) => parseFloat(value.replace(',', '.')) || 0;

  // Sync local state cuando cambian los valores del cluster
  useEffect(() => {
    const newRange = formatEditableValue(cluster.range?.getValue());
    const newPercent = formatEditableValue(cluster.percent?.getValue());
    const newTolerance = formatEditableValue(cluster.tolerance?.getValue());

    if (activeField !== 'range') {
      setRangeValue(newRange);
    }

    if (activeField !== 'percent') {
      setPercentValue(newPercent);
    }

    if (activeField !== 'tolerance') {
      setToleranceValue(newTolerance);
    }
  }, [cluster.range?.getValue(), cluster.percent?.getValue(), cluster.tolerance?.getValue(), version, activeField]);

  // Mantener sincronizado el estado local de visibilidad con el estado del cluster/template.
  useEffect(() => {
    setShowTolerance(cluster.showTolerance !== false);
  }, [cluster.showTolerance, version]);

  const penaltyValue = Number(cluster.penalty?.getValue() ?? 0) || 0;
  const percentDisplayValue = Number(cluster.percent?.getValue() ?? 0) || 0;
  const toleranceTotalValue = Number(cluster.tolerance?.getValue() ?? 0) || 0;

  const formatPenaltyDecimal = (value: number) =>
    new Intl.NumberFormat('es-CL', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);

  const toleranceDisplay = useGroupTolerance
    ? Number(groupToleranceValue ?? 0) || 0
    : Number(toleranceValue) || 0;

  const hasError = cluster.tolerance?.state.error || false;

  const compactInputStyle: React.CSSProperties = {
    height: '2rem',
    padding: '0.25rem 0.5rem',
    fontSize: '0.75rem',
  };

  const toleranceInputStyle: React.CSSProperties = hasError
    ? {
        ...compactInputStyle,
        borderColor: '#f87171',
        backgroundColor: '#fef2f2',
      }
    : compactInputStyle;

  const handleRangeChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const value = e.target.value;
    setActiveField('range');
    setRangeValue(value);

    const numValue = parseEditableValue(value);
    onRangeChange?.(numValue);
  };

  const handlePercentChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const value = e.target.value;
    setActiveField('percent');
    setPercentValue(value);

    const numValue = parseEditableValue(value);
    onPercentChange?.(numValue);
  };

  const handleToleranceChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const value = e.target.value;
    setActiveField('tolerance');
    setToleranceValue(value);

    const numValue = parseEditableValue(value);
    onToleranceChange?.(numValue);
  };

  const handleRangeBlur = () => {
    setActiveField(null);
    setRangeValue(formatEditableValue(cluster.range?.getValue()));
  };

  const handlePercentBlur = () => {
    setActiveField(null);
    setPercentValue(formatEditableValue(cluster.percent?.getValue()));
  };

  const handleToleranceBlur = () => {
    setActiveField(null);
    setToleranceValue(formatEditableValue(cluster.tolerance?.getValue()));
  };

  const handleToggleTolerance = () => {
    const nextVisibility = !showTolerance;
    setShowTolerance(nextVisibility);
    onShowToleranceChange?.(nextVisibility);
  };

  return (
    <div
      className={`flex flex-row gap-1 items-center px-2 py-1 transition-colors text-xs ${
        isSummary
          ? 'bg-transparent border-y border-l-0 border-r-0 border-gray-300 rounded-none font-semibold'
          : 'bg-white hover:bg-blue-50'
      }`}
    >
      {/* Columna 1: Nombre del parámetro (156px) */}
      <div style={{ width: '156px' }}>
        <input
          type="text"
          value={cluster.name}
          readOnly
          className="w-full px-2 py-1 bg-transparent border-none text-gray-900 font-medium focus:outline-none"
        />
      </div>

      {/* Columna 2: Rango (130px) */}
      <div style={{ width: '130px' }}>
        {isSummary ? (
          <div className="bg-gray-100 px-2 py-1 rounded text-xs text-gray-500 text-center h-8 flex items-center justify-center">
            —
          </div>
        ) : isBonus ? (
          <div className="bg-gray-100 px-2 py-1 rounded text-xs text-gray-500 text-center h-8 flex items-center justify-center">
            —
          </div>
        ) : (
          <TextField
            label=""
            compact
            type="number"
            value={rangeValue}
            onChange={handleRangeChange}
            onFocus={() => setActiveField('range')}
            onBlur={handleRangeBlur}
            selectAllOnFocus
            step="0.01"
            min="0"
            placeholder="0.00"
            className="w-full"
            style={compactInputStyle}
          />
        )}
      </div>

      {/* Columna 3: % Descuento (130px) */}
      <div style={{ width: '130px' }}>
        {isSummary ? (
          <div className="bg-blue-50 px-2 py-1 rounded text-xs font-semibold text-blue-700 text-center h-8 flex items-center justify-center">
            {percentDisplayValue.toFixed(2)}
          </div>
        ) : isBonus ? (
          <TextField
            label=""
            compact
            type="number"
            value={toleranceValue}
            onChange={handleToleranceChange}
            onFocus={() => setActiveField('tolerance')}
            onBlur={handleToleranceBlur}
            selectAllOnFocus
            step="0.01"
            min="0"
            placeholder="0.00"
            className="w-full"
            style={compactInputStyle}
          />
        ) : (
          <TextField
            label=""
            compact
            type="number"
            value={percentValue}
            onChange={handlePercentChange}
            onFocus={() => setActiveField('percent')}
            onBlur={handlePercentBlur}
            selectAllOnFocus
            step="0.01"
            min="0"
            placeholder="0.00"
            className="w-full"
            style={compactInputStyle}
          />
        )}
      </div>

      {/* Columna 4: Tolerancia (130px) */}
      <div style={{ width: '130px' }}>
        {isSummary ? (
          <div className="bg-yellow-50 px-2 py-1 rounded text-xs font-semibold text-yellow-800 text-center h-8 flex items-center justify-center">
            {toleranceTotalValue.toFixed(2)}
          </div>
        ) : isBonus ? (
          <div className="bg-gray-100 px-2 py-1 rounded text-xs text-gray-500 text-center h-8 flex items-center justify-center">
            —
          </div>
        ) : isDry ? (
          <div className="bg-gray-100 px-2 py-1 rounded text-xs text-gray-500 text-center h-8 flex items-center justify-center">
            —
          </div>
        ) : showTolerance ? (
          useGroupTolerance ? (
            <div className="bg-secondary-20 border border-secondary px-2 py-1 rounded text-xs font-semibold text-cyan-700 text-center h-8 flex items-center justify-center">
              {toleranceDisplay.toFixed(2)}%
            </div>
          ) : (
            <TextField
              label=""
              compact
              type="number"
              value={toleranceValue}
              onChange={handleToleranceChange}
              onFocus={() => setActiveField('tolerance')}
              onBlur={handleToleranceBlur}
              selectAllOnFocus
              step="0.01"
              min="0"
              placeholder="0.00"
              className="w-full"
              style={toleranceInputStyle}
            />
          )
        ) : (
          <div className="bg-gray-100 px-2 py-1 rounded text-xs text-gray-500 text-center h-8 flex items-center justify-center">
            —
          </div>
        )}
      </div>

      {/* Columna 5: Botón de visibilidad (40px) */}
      <div style={{ width: '40px' }} className="flex justify-center">
        {showVisibilityButton && !isDry && !isBonus ? (
          <VisibilityButton isVisible={showTolerance} onToggle={handleToggleTolerance} />
        ) : (
          <div style={{ width: '40px' }} />
        )}
      </div>

      {/* Columna 6: Penalización (130px) */}
      <div style={{ width: '130px' }}>
        {isDry ? (
          <div className="bg-gray-100 px-2 py-1 rounded text-xs text-gray-500 text-center h-8 flex items-center justify-center">
            —
          </div>
        ) : isBonus ? (
          <div className="bg-green-50 border border-green-100 text-green-700 px-2 py-1 rounded text-xs font-semibold text-center h-8 flex items-center justify-center">
            +{formatPenaltyDecimal(penaltyValue)} kg
          </div>
        ) : (
          <div className={`${isSummary ? 'bg-red-100 border border-red-200 text-red-700' : 'bg-red-50 border border-red-100 text-red-600'} px-2 py-1 rounded text-xs font-semibold text-center h-8 flex items-center justify-center`}>
            {formatPenaltyDecimal(penaltyValue)} kg
          </div>
        )}
      </div>
    </div>
  );
}

