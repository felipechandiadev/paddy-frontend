'use client';

import React, { useEffect } from 'react';
import Dialog from '@/shared/components/ui/Dialog/Dialog';
import { TextField } from '@/shared/components/ui/TextField/TextField';
import Switch from '@/shared/components/ui/Switch/Switch';
import { Button } from '@/shared/components/ui/Button/Button';
import Alert from '@/shared/components/ui/Alert/Alert';
import { updateTemplate } from '../actions';
import { Template } from '../types/templates.types';

interface UpdateTemplateDialogProps {
  open: boolean;
  template: Template | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface ParameterConfig {
  name: string;
  available: boolean;
  percent: number;
  tolerance: number;
  showTolerance: boolean;
  groupTolerance: boolean;
}

export default function UpdateTemplateDialog({
  open,
  template,
  onClose,
  onSuccess,
}: UpdateTemplateDialogProps) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [formData, setFormData] = React.useState({
    name: '',
    isDefault: false,
    groupToleranceName: '',
  });

  const [useToleranceGroup, setUseToleranceGroup] = React.useState(false);
  const [groupToleranceValue, setGroupToleranceValue] = React.useState(5.0);

  const [parameters, setParameters] = React.useState<ParameterConfig[]>([
    { name: 'Humedad', available: false, percent: 0, tolerance: 0, showTolerance: false, groupTolerance: false },
    { name: 'Granos Verdes', available: false, percent: 0, tolerance: 0, showTolerance: false, groupTolerance: false },
    { name: 'Impurezas', available: false, percent: 0, tolerance: 0, showTolerance: false, groupTolerance: false },
    { name: 'Vano', available: false, percent: 0, tolerance: 0, showTolerance: false, groupTolerance: false },
    { name: 'Hualcacho', available: false, percent: 0, tolerance: 0, showTolerance: false, groupTolerance: false },
    { name: 'Granos Manchados', available: false, percent: 0, tolerance: 0, showTolerance: false, groupTolerance: false },
    { name: 'Granos Pelados', available: false, percent: 0, tolerance: 0, showTolerance: false, groupTolerance: false },
    { name: 'Granos Yesosos', available: false, percent: 0, tolerance: 0, showTolerance: false, groupTolerance: false },
    { name: 'Bonificación', available: false, percent: 0, tolerance: 0, showTolerance: true, groupTolerance: false },
    { name: 'Secado', available: false, percent: 0, tolerance: 0, showTolerance: false, groupTolerance: false },
  ]);

  useEffect(() => {
    if (template && open) {
      setFormData({
        name: template.name,
        isDefault: template.isDefault,
        groupToleranceName: template.groupToleranceName || '',
      });

      // Cargar configuración de tolerancia grupal
      setUseToleranceGroup(template.useToleranceGroup ?? false);
      setGroupToleranceValue(Number(template.groupToleranceValue) || 5.0);

      // Cargar configuración de parámetros
      setParameters([
        {
          name: 'Humedad',
          available: template.availableHumedad ?? false,
          percent: Number(template.percentHumedad) || 0,
          tolerance: Number(template.toleranceHumedad) || 0,
          showTolerance: template.showToleranceHumedad ?? false,
          groupTolerance: template.groupToleranceHumedad ?? false,
        },
        {
          name: 'Granos Verdes',
          available: template.availableGranosVerdes ?? false,
          percent: Number(template.percentGranosVerdes) || 0,
          tolerance: Number(template.toleranceGranosVerdes) || 0,
          showTolerance: template.showToleranceGranosVerdes ?? false,
          groupTolerance: template.groupToleranceGranosVerdes ?? false,
        },
        {
          name: 'Impurezas',
          available: template.availableImpurezas ?? false,
          percent: Number(template.percentImpurezas) || 0,
          tolerance: Number(template.toleranceImpurezas) || 0,
          showTolerance: template.showToleranceImpurezas ?? false,
          groupTolerance: template.groupToleranceImpurezas ?? false,
        },
        {
          name: 'Vano',
          available: template.availableVano ?? false,
          percent: Number(template.percentVano) || 0,
          tolerance: Number(template.toleranceVano) || 0,
          showTolerance: template.showToleranceVano ?? false,
          groupTolerance: template.groupToleranceVano ?? false,
        },
        {
          name: 'Hualcacho',
          available: template.availableHualcacho ?? false,
          percent: Number(template.percentHualcacho) || 0,
          tolerance: Number(template.toleranceHualcacho) || 0,
          showTolerance: template.showToleranceHualcacho ?? false,
          groupTolerance: template.groupToleranceHualcacho ?? false,
        },
        {
          name: 'Granos Manchados',
          available: template.availableGranosManchados ?? false,
          percent: Number(template.percentGranosManchados) || 0,
          tolerance: Number(template.toleranceGranosManchados) || 0,
          showTolerance: template.showToleranceGranosManchados ?? false,
          groupTolerance: template.groupToleranceGranosManchados ?? false,
        },
        {
          name: 'Granos Pelados',
          available: template.availableGranosPelados ?? false,
          percent: Number(template.percentGranosPelados) || 0,
          tolerance: Number(template.toleranceGranosPelados) || 0,
          showTolerance: template.showToleranceGranosPelados ?? false,
          groupTolerance: template.groupToleranceGranosPelados ?? false,
        },
        {
          name: 'Granos Yesosos',
          available: template.availableGranosYesosos ?? false,
          percent: Number(template.percentGranosYesosos) || 0,
          tolerance: Number(template.toleranceGranosYesosos) || 0,
          showTolerance: template.showToleranceGranosYesosos ?? false,
          groupTolerance: template.groupToleranceGranosYesosos ?? false,
        },
        {
          name: 'Bonificación',
          available: template.availableBonus ?? false,
          percent: 0,
          tolerance: Number(template.toleranceBonus) || 0,
          showTolerance: true,
          groupTolerance: false,
        },
        {
          name: 'Secado',
          available: template.availableDry ?? false,
          percent: Number(template.percentDry) || 0,
          tolerance: 0,
          showTolerance: false,
          groupTolerance: false,
        },
      ]);

      setError(null);
    }
  }, [template, open]);

  // Limpiar error cuando se cierra el diálogo
  useEffect(() => {
    if (!open) {
      setError(null);
    }
  }, [open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleParameterChange = (
    index: number,
    field: keyof ParameterConfig,
    value: ParameterConfig[keyof ParameterConfig],
  ) => {
    setParameters((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!template) return;

    setError(null);
    setLoading(true);

    try {
      // Construir payload completo con todos los parámetros
      const payload: Partial<Template> = {
        name: formData.name,
        isDefault: formData.isDefault,
        useToleranceGroup,
        groupToleranceValue,
        groupToleranceName: useToleranceGroup
          ? formData.groupToleranceName.trim() || null
          : null,

        // Humedad
        availableHumedad: parameters[0].available,
        percentHumedad: parameters[0].percent,
        toleranceHumedad: parameters[0].tolerance,
        showToleranceHumedad: parameters[0].showTolerance,
        groupToleranceHumedad: parameters[0].groupTolerance,

        // Granos Verdes
        availableGranosVerdes: parameters[1].available,
        percentGranosVerdes: parameters[1].percent,
        toleranceGranosVerdes: parameters[1].tolerance,
        showToleranceGranosVerdes: parameters[1].showTolerance,
        groupToleranceGranosVerdes: parameters[1].groupTolerance,

        // Impurezas
        availableImpurezas: parameters[2].available,
        percentImpurezas: parameters[2].percent,
        toleranceImpurezas: parameters[2].tolerance,
        showToleranceImpurezas: parameters[2].showTolerance,
        groupToleranceImpurezas: parameters[2].groupTolerance,

        // Vano
        availableVano: parameters[3].available,
        percentVano: parameters[3].percent,
        toleranceVano: parameters[3].tolerance,
        showToleranceVano: parameters[3].showTolerance,
        groupToleranceVano: parameters[3].groupTolerance,

        // Hualcacho
        availableHualcacho: parameters[4].available,
        percentHualcacho: parameters[4].percent,
        toleranceHualcacho: parameters[4].tolerance,
        showToleranceHualcacho: parameters[4].showTolerance,
        groupToleranceHualcacho: parameters[4].groupTolerance,

        // Granos Manchados
        availableGranosManchados: parameters[5].available,
        percentGranosManchados: parameters[5].percent,
        toleranceGranosManchados: parameters[5].tolerance,
        showToleranceGranosManchados: parameters[5].showTolerance,
        groupToleranceGranosManchados: parameters[5].groupTolerance,

        // Granos Pelados
        availableGranosPelados: parameters[6].available,
        percentGranosPelados: parameters[6].percent,
        toleranceGranosPelados: parameters[6].tolerance,
        showToleranceGranosPelados: parameters[6].showTolerance,
        groupToleranceGranosPelados: parameters[6].groupTolerance,

        // Granos Yesosos
        availableGranosYesosos: parameters[7].available,
        percentGranosYesosos: parameters[7].percent,
        toleranceGranosYesosos: parameters[7].tolerance,
        showToleranceGranosYesosos: parameters[7].showTolerance,
        groupToleranceGranosYesosos: parameters[7].groupTolerance,

        // Bonificación
        availableBonus: parameters[8].available,
        toleranceBonus: parameters[8].tolerance,

        // Secado
        availableDry: parameters[9].available,
        percentDry: parameters[9].percent,
      };

      const result = await updateTemplate(template.id, payload);
      if (result.success) {
        onClose();
        onSuccess();
      } else {
        setError(result.error || 'Error al actualizar plantilla');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar plantilla');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Editar Plantilla de Análisis"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <Alert variant="error">{error}</Alert>}

        {/* Información Básica */}
        <div className="grid grid-cols-2 gap-4">
          <TextField
            label="Nombre"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="Ej: Convenio Parral 2026"
          />

          <div className="flex items-center pt-6">
            <Switch
              label="Plantilla predeterminada"
              checked={formData.isDefault}
              onChange={(checked) => setFormData((prev) => ({ ...prev, isDefault: checked }))}
            />
          </div>
        </div>

        {/* Configuración de Tolerancia Grupal */}
        <div className="border-t pt-4 space-y-3">
          <label className="flex items-center gap-3">
            <Switch
              label="Usar grupo de tolerancia"
              checked={useToleranceGroup}
              onChange={(checked) => setUseToleranceGroup(checked)}
            />
          </label>

          {useToleranceGroup && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <TextField
                label="Nombre del grupo de tolerancia"
                name="groupToleranceName"
                type="text"
                value={formData.groupToleranceName}
                onChange={handleChange}
                placeholder="Ej: Grupo Calidad A"
              />

              <TextField
                label="Valor de tolerancia grupal (%)"
                type="number"
                value={groupToleranceValue.toString()}
                onChange={(e) => setGroupToleranceValue(parseFloat(e.target.value) || 0)}
                step="0.1"
                min="0"
              />
            </div>
          )}
        </div>

        {/* Tabla de Parámetros */}
        <div className="border-t pt-4 space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Parámetros de Análisis</h3>
              <p className="text-xs text-gray-500 mt-1">Configuración técnica de laboratorio y tolerancias</p>
            </div>
            {useToleranceGroup && (
              <div className="bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200">
                <p className="text-xs font-medium text-blue-700">Tol. Grupal: {groupToleranceValue}%</p>
              </div>
            )}
          </div>
          
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-gray-50/50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Disponible</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Parámetro</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Porcentaje (%)</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Tolerancia (%)</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Mostrar Tol.</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Grupo Tol.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {parameters.map((param, idx) => {
                  const isSpecial = ['Bonificación', 'Secado'].includes(param.name);
                  
                  return (
                    <tr 
                      key={idx} 
                      className={`transition-colors duration-150 ${
                        param.groupTolerance ? 'bg-blue-50' : param.available ? 'hover:bg-blue-50/30' : 'bg-gray-50/50'
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center">
                          <Switch
                            checked={param.available}
                            onChange={(checked) => {
                              setParameters((prev) => {
                                const updated = [...prev];
                                const current = updated[idx];

                                updated[idx] = checked
                                  ? { ...current, available: true }
                                  : {
                                      ...current,
                                      available: false,
                                      showTolerance: false,
                                      groupTolerance: false,
                                      percent: 0,
                                      tolerance: 0,
                                    };

                                return updated;
                              });
                            }}
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className={`text-sm font-medium ${
                            param.available ? 'text-gray-900' : 'text-gray-400'
                          }`}>
                            {param.name}
                          </span>
                          {isSpecial && param.available && (
                            <span className="text-[10px] text-blue-600 font-bold uppercase tracking-tighter mt-0.5">Especial</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <input
                          type="number"
                          value={param.percent}
                          onChange={(e) => handleParameterChange(idx, 'percent', parseFloat(e.target.value) || 0)}
                          disabled={!param.available}
                          step="0.1"
                          min="0"
                          className={`w-20 px-3 py-1.5 text-sm border rounded-md transition-all outline-none text-center ${
                            param.available 
                              ? 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white' 
                              : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                          }`}
                        />
                      </td>
                      <td className="px-6 py-4 text-center">
                        {!isSpecial ? (
                          <input
                            type="number"
                            value={param.tolerance}
                            onChange={(e) => handleParameterChange(idx, 'tolerance', parseFloat(e.target.value) || 0)}
                            disabled={!param.available}
                            step="0.1"
                            min="0"
                            className={`w-20 px-3 py-1.5 text-sm border rounded-md transition-all outline-none text-center ${
                              param.available 
                                ? 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white' 
                                : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                            }`}
                          />
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center">
                          {!isSpecial ? (
                            <Switch
                              checked={param.showTolerance}
                              onChange={(checked) => handleParameterChange(idx, 'showTolerance', checked)}
                              disabled={!param.available}
                            />
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center">
                          {!isSpecial ? (
                            <Switch
                              checked={param.groupTolerance}
                              onChange={(checked) => handleParameterChange(idx, 'groupTolerance', checked)}
                              disabled={!useToleranceGroup || !param.available}
                            />
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer Info */}
          <div className="bg-blue-50/50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <p className="text-xs text-blue-700 leading-relaxed">
              <strong>Nota:</strong> Los parámetros marcados como <strong>Especiales</strong> (Bonificación y Secado) no permiten configuración de tolerancia. Activar <strong>Grupo de Tolerancia</strong> habilitará esta columna para los demás parámetros.
            </p>
          </div>
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button loading={loading} type="submit">
            Guardar Cambios
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
