'use client';

import React, { useMemo } from 'react';
import Select, { Option } from '@/shared/components/ui/Select/Select';
import { AnalysisParam } from '../types/analysis-params.types';

interface AnalysisParamsFilterProps {
  data: AnalysisParam[];
  onFilterChange: (selectedParam: string | null) => void;
}

export default function AnalysisParamsFilter({
  data,
  onFilterChange,
}: AnalysisParamsFilterProps) {
  const [selectedParam, setSelectedParam] = React.useState<string | number | null>(null);
  const safeData = Array.isArray(data) ? data : [];

  // Generar opciones únicas de parámetros
  const parameterOptions: Option[] = useMemo(() => {
    const uniqueParams = Array.from(
      new Map(
        safeData.map((item) => [item.discountCode, item.discountName])
      ).entries()
    ).map(([code, name]) => ({
      id: code,
      label: name,
    }));

    return uniqueParams.sort((a, b) => a.label.localeCompare(b.label));
  }, [safeData]);

  const handleParamChange = (id: string | number | null) => {
    setSelectedParam(id);
    if (id === null) {
      onFilterChange(null);
    } else {
      // Encontrar el nombre del parámetro basado en el código
      const paramName = safeData.find((item) => item.discountCode === id)?.discountName || null;
      onFilterChange(paramName);
    }
  };

  return (
    <div className="w-full md:w-72">
      <Select
        label="Filtrar por Parámetro"
        placeholder="Selecciona un parámetro..."
        options={parameterOptions}
        value={selectedParam}
        onChange={handleParamChange}
        allowClear
      />
    </div>
  );
}
