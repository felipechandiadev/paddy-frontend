'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { TextField } from '@/shared/components/ui/TextField/TextField';
import AutoComplete from '@/shared/components/ui/AutoComplete/AutoComplete';
import IconButton from '@/shared/components/ui/IconButton/IconButton';
import { fetchProducers as fetchProducersAction } from '@/features/producers/actions/producers.action';
import CreateProducerDialog from '@/features/producers/components/CreateProducerDialog';
import type { Producer as ProducerRecord } from '@/features/producers/types/producers.types';
import { fetchRiceTypes as fetchRiceTypesAction } from '@/features/rice-types/actions';
import type { RiceType as RiceTypeRecord } from '@/features/rice-types/types/rice-types.types';
import { useReceptionContext } from '../context/ReceptionContext';
import SelectTemplateDialog from './SelectTemplateDialog';
import { fetchDefaultTemplate, fetchTemplateById } from '../actions/fetchTemplates.action';

interface ReceptionGeneralDataProps {
  disableProducerSelection?: boolean;
  disableRiceTypeSelection?: boolean;
  disableDefaultTemplateLoad?: boolean;
}

interface ProducerOption {
  id: number;
  name: string;
  rut: string;
  city: string;
  email: string;
}

interface CreateProducerOption {
  id: '__create_new_producer__';
  query: string;
  isCreateOption: true;
}

type ProducerAutoCompleteOption = ProducerOption | CreateProducerOption;

interface RiceType {
  id: number;
  code: string;
  name: string;
  price: number;
}

const CREATE_PRODUCER_OPTION_ID = '__create_new_producer__' as const;

const sortProducersByName = (a: ProducerOption, b: ProducerOption) =>
  a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });

const sortRiceTypesByName = (a: RiceType, b: RiceType) =>
  a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });

const toProducerOption = (producer: ProducerRecord): ProducerOption => ({
  id: Number(producer.id),
  name: producer.name || '',
  rut: producer.rut || '',
  city: producer.city || '',
  email: producer.email || '',
});

const toRiceTypeOption = (riceType: RiceTypeRecord): RiceType => ({
  id: Number(riceType.id),
  code: riceType.code || '',
  name: riceType.name || '',
  price: Number(riceType.referencePrice ?? 0),
});

const isCreateProducerOption = (
  option: ProducerAutoCompleteOption | null
): option is CreateProducerOption => Boolean(option && 'isCreateOption' in option && option.isCreateOption);

export default function ReceptionGeneralData({
  disableProducerSelection = false,
  disableRiceTypeSelection = false,
  disableDefaultTemplateLoad = false,
}: ReceptionGeneralDataProps) {
  const { data, setData, template, setTemplate } = useReceptionContext();

  const [producers, setProducers] = useState<ProducerOption[]>([]);
  const [riceTypes, setRiceTypes] = useState<RiceType[]>([]);
  const [loadingProducers, setLoadingProducers] = useState(false);
  const [loadingRiceTypes, setLoadingRiceTypes] = useState(false);
  const [producerSearch, setProducerSearch] = useState('');
  const [createProducerDialogOpen, setCreateProducerDialogOpen] = useState(false);
  const [producerAutocompleteResetKey, setProducerAutocompleteResetKey] = useState(0);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [currentTemplateName, setCurrentTemplateName] = useState<string>('Cargando...');

  const loadProducers = useCallback(async (preferredProducer?: ProducerOption) => {
    try {
      setLoadingProducers(true);
      const result = await fetchProducersAction({
        page: 1,
        limit: 1000,
        sortField: 'name',
        sort: 'ASC',
      });

      const normalizedProducers = result.data.map(toProducerOption);
      const mergedProducers = preferredProducer
        ? [preferredProducer, ...normalizedProducers.filter((producer) => producer.id !== preferredProducer.id)]
        : normalizedProducers;

      setProducers(mergedProducers.sort(sortProducersByName));
    } catch (error) {
      console.error('Error fetching producers:', error);
    } finally {
      setLoadingProducers(false);
    }
  }, []);

  const loadRiceTypes = useCallback(async () => {
    try {
      setLoadingRiceTypes(true);
      const result = await fetchRiceTypesAction();
      const normalizedRiceTypes = result.map(toRiceTypeOption).sort(sortRiceTypesByName);
      setRiceTypes(normalizedRiceTypes);
    } catch (error) {
      console.error('Error fetching rice types:', error);
      setRiceTypes([]);
    } finally {
      setLoadingRiceTypes(false);
    }
  }, []);

  // Cargar plantilla por defecto
  useEffect(() => {
    if (disableDefaultTemplateLoad) {
      console.log('[TEMPLATE] Carga de plantilla deshabilitada (isEditMode)');
      return;
    }

    console.log('[TEMPLATE] Iniciando carga de plantilla por defecto');
    const loadDefaultTemplate = async () => {
      try {
        const defaultTemplate = await fetchDefaultTemplate();
        if (defaultTemplate) {
          console.log('[TEMPLATE] Plantilla por defecto cargada:', defaultTemplate);
          setCurrentTemplateName(defaultTemplate.name);
          setData('templateId', Number(defaultTemplate.id) || 0);
          console.log('[TEMPLATE] templateId seteado a:', Number(defaultTemplate.id) || 0);
          // Actualizar el contexto con TODOS los campos de la plantilla por defecto
          setTemplate({
            useToleranceGroup: defaultTemplate.useToleranceGroup ?? true,
            groupToleranceValue: defaultTemplate.groupToleranceValue ?? 0,
            groupToleranceName: defaultTemplate.groupToleranceName ?? '',
            
            // Parámetros disponibles
            availableHumedad: defaultTemplate.availableHumedad ?? true,
            availableGranosVerdes: defaultTemplate.availableGranosVerdes ?? true,
            availableImpurezas: defaultTemplate.availableImpurezas ?? true,
            availableVano: defaultTemplate.availableVano ?? true,
            availableHualcacho: defaultTemplate.availableHualcacho ?? true,
            availableGranosManchados: defaultTemplate.availableGranosManchados ?? true,
            availableGranosPelados: defaultTemplate.availableGranosPelados ?? true,
            availableGranosYesosos: defaultTemplate.availableGranosYesosos ?? true,
            availableBonus: defaultTemplate.availableBonus ?? true,
            availableDry: defaultTemplate.availableDry ?? false,
            
            // Mostrar tolerancia individual
            showToleranceHumedad: defaultTemplate.showToleranceHumedad ?? true,
            showToleranceGranosVerdes: defaultTemplate.showToleranceGranosVerdes ?? true,
            showToleranceImpurezas: defaultTemplate.showToleranceImpurezas ?? true,
            showToleranceVano: defaultTemplate.showToleranceVano ?? true,
            showToleranceHualcacho: defaultTemplate.showToleranceHualcacho ?? true,
            showToleranceGranosManchados: defaultTemplate.showToleranceGranosManchados ?? true,
            showToleranceGranosPelados: defaultTemplate.showToleranceGranosPelados ?? true,
            showToleranceGranosYesosos: defaultTemplate.showToleranceGranosYesosos ?? true,
            
            // Grupo de tolerancia por parámetro
            groupToleranceHumedad: defaultTemplate.groupToleranceHumedad ?? false,
            groupToleranceGranosVerdes: defaultTemplate.groupToleranceGranosVerdes ?? false,
            groupToleranceImpurezas: defaultTemplate.groupToleranceImpurezas ?? false,
            groupToleranceVano: defaultTemplate.groupToleranceVano ?? false,
            groupToleranceHualcacho: defaultTemplate.groupToleranceHualcacho ?? false,
            groupToleranceGranosManchados: defaultTemplate.groupToleranceGranosManchados ?? false,
            groupToleranceGranosPelados: defaultTemplate.groupToleranceGranosPelados ?? false,
            groupToleranceGranosYesosos: defaultTemplate.groupToleranceGranosYesosos ?? false,
            
            // Valores (porcentaje y tolerancia) de cada parámetro
            percentHumedad: defaultTemplate.percentHumedad ?? 0,
            toleranceHumedad: defaultTemplate.toleranceHumedad ?? 0,
            percentGranosVerdes: defaultTemplate.percentGranosVerdes ?? 0,
            toleranceGranosVerdes: defaultTemplate.toleranceGranosVerdes ?? 0,
            percentImpurezas: defaultTemplate.percentImpurezas ?? 0,
            toleranceImpurezas: defaultTemplate.toleranceImpurezas ?? 0,
            percentVano: defaultTemplate.percentVano ?? 0,
            toleranceVano: defaultTemplate.toleranceVano ?? 0,
            percentHualcacho: defaultTemplate.percentHualcacho ?? 0,
            toleranceHualcacho: defaultTemplate.toleranceHualcacho ?? 0,
            percentGranosManchados: defaultTemplate.percentGranosManchados ?? 0,
            toleranceGranosManchados: defaultTemplate.toleranceGranosManchados ?? 0,
            percentGranosPelados: defaultTemplate.percentGranosPelados ?? 0,
            toleranceGranosPelados: defaultTemplate.toleranceGranosPelados ?? 0,
            percentGranosYesosos: defaultTemplate.percentGranosYesosos ?? 0,
            toleranceGranosYesosos: defaultTemplate.toleranceGranosYesosos ?? 0,
            
            // Bonificación y Secado
            toleranceBonus: defaultTemplate.toleranceBonus ?? 0,
            percentDry: defaultTemplate.percentDry ?? 0,
          });
        } else {
          setCurrentTemplateName('Sin plantilla');
          setData('templateId', 0);
        }
      } catch (error) {
        console.error('Error loading default template:', error);
        setCurrentTemplateName('Error al cargar');
      }
    };
    loadDefaultTemplate();
  }, [disableDefaultTemplateLoad, setData, setTemplate]);

  // Cargar productores
  useEffect(() => {
    void loadProducers();
  }, [loadProducers]);

  // Cargar tipos de arroz
  useEffect(() => {
    void loadRiceTypes();
  }, [loadRiceTypes]);

  const selectedProducer = useMemo(
    () => producers.find((producer) => producer.id === data.producerId) || null,
    [producers, data.producerId]
  );

  const selectedRiceType = useMemo(
    () => riceTypes.find((riceType) => riceType.id === data.riceTypeId) || null,
    [riceTypes, data.riceTypeId]
  );

  const producerOptions = useMemo<ProducerAutoCompleteOption[]>(() => {
    const normalizedQuery = producerSearch.trim().toLowerCase();

    if (!normalizedQuery) {
      return producers;
    }

    const hasMatches = producers.some((producer) => {
      return (
        producer.name.toLowerCase().includes(normalizedQuery) ||
        producer.rut.toLowerCase().includes(normalizedQuery) ||
        producer.city.toLowerCase().includes(normalizedQuery) ||
        producer.email.toLowerCase().includes(normalizedQuery)
      );
    });

    if (hasMatches) {
      return producers;
    }

    return [
      ...producers,
      {
        id: CREATE_PRODUCER_OPTION_ID,
        query: producerSearch.trim(),
        isCreateOption: true,
      },
    ];
  }, [producers, producerSearch]);

  const filterProducerOption = useCallback((option: ProducerAutoCompleteOption, inputValue: string) => {
    if (isCreateProducerOption(option)) {
      return true;
    }

    const normalizedQuery = inputValue.trim().toLowerCase();

    if (!normalizedQuery) {
      return true;
    }

    return (
      option.name.toLowerCase().includes(normalizedQuery) ||
      option.rut.toLowerCase().includes(normalizedQuery) ||
      option.city.toLowerCase().includes(normalizedQuery) ||
      option.email.toLowerCase().includes(normalizedQuery)
    );
  }, []);

  const handleProducerChange = (option: ProducerAutoCompleteOption | null) => {
    if (!option) {
      setData('producerId', 0);
      setData('producerName', '');
      return;
    }

    if (isCreateProducerOption(option)) {
      setCreateProducerDialogOpen(true);
      setProducerAutocompleteResetKey((prev) => prev + 1);
      return;
    }

    setData('producerId', option.id);
    setData('producerName', option.name);
  };

  const handleProducerCreated = (producer: ProducerRecord) => {
    const normalizedProducer = toProducerOption(producer);

    setData('producerId', normalizedProducer.id);
    setData('producerName', normalizedProducer.name);
    setProducerSearch('');
    setProducerAutocompleteResetKey((prev) => prev + 1);

    setProducers((currentProducers) => {
      const nextProducers = [
        normalizedProducer,
        ...currentProducers.filter((currentProducer) => currentProducer.id !== normalizedProducer.id),
      ];

      return nextProducers.sort(sortProducersByName);
    });

    void loadProducers(normalizedProducer);
  };

  const handleCloseCreateProducerDialog = () => {
    setCreateProducerDialogOpen(false);
    setProducerSearch('');
    setProducerAutocompleteResetKey((prev) => prev + 1);
  };

  const filterRiceTypeOption = useCallback((option: RiceType, inputValue: string) => {
    const normalizedQuery = inputValue.trim().toLowerCase();

    if (!normalizedQuery) {
      return true;
    }

    return (
      option.code.toLowerCase().includes(normalizedQuery) ||
      option.name.toLowerCase().includes(normalizedQuery)
    );
  }, []);

  const handleRiceTypeChange = (option: RiceType | null) => {
    if (!option) {
      setData('riceTypeId', 0);
      setData('riceTypeName', '');
      setData('price', 0);
      return;
    }

    setData('riceTypeId', option.id);
    setData('riceTypeName', option.name);
    setData('price', option.price);
  };

  const handleSelectTemplate = async (templateId: number) => {
    try {
      // Cargar plantilla desde API
      const selectedTemplate = await fetchTemplateById(templateId);
      
      if (selectedTemplate) {
        setCurrentTemplateName(selectedTemplate.name);
        setData('templateId', Number(selectedTemplate.id) || 0);
        
        // Actualizar el contexto con TODOS los campos de la plantilla seleccionada
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
      console.error('Error selecting template:', error);
    }
    
    setTemplateDialogOpen(false);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Datos Generales</h3>

      {/* Información del Template */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-semibold text-blue-600">PLANTILLA ACTIVA: {currentTemplateName}</div>
          <IconButton
            icon="file_open"
            variant="basicSecondary"
            size="sm"
            onClick={() => setTemplateDialogOpen(true)}
            ariaLabel="Cargar plantilla"
            title="Cargar plantilla"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {/* Productor */}
        <AutoComplete<ProducerAutoCompleteOption>
          key={producerAutocompleteResetKey}
          label="Productor"
          placeholder={loadingProducers ? 'Cargando productores...' : 'Buscar productor por nombre o RUT'}
          options={producerOptions}
          value={selectedProducer}
          onChange={handleProducerChange}
          onInputChange={setProducerSearch}
          getOptionLabel={(option) =>
            isCreateProducerOption(option)
              ? `+ Nuevo productor "${option.query}"`
              : `${option.name} · ${option.rut}`
          }
          getOptionValue={(option) => option.id}
          filterOption={filterProducerOption}
          disabled={loadingProducers || disableProducerSelection}
          required
        />

        {/* Tipo de Arroz */}
        <AutoComplete<RiceType>
          label="Tipo de Arroz"
          placeholder={loadingRiceTypes ? 'Cargando tipos de arroz...' : 'Buscar por código o nombre'}
          options={riceTypes}
          value={selectedRiceType}
          onChange={handleRiceTypeChange}
          getOptionLabel={(option) => `${option.code} · ${option.name}`}
          getOptionValue={(option) => option.id}
          filterOption={filterRiceTypeOption}
          disabled={loadingRiceTypes || disableRiceTypeSelection}
          required
        />

        {/* Precio */}
        <TextField
          label="Precio ($/kg)"
          type="number"
          value={data.price.toString()}
          onChange={(e) => setData('price', parseFloat(e.target.value) || 0)}
          step="1"
          min="0"
        />

        {/* Guía */}
        <TextField
          label="Número de Guía"
          labelAlwaysVisible
          value={data.guide}
          onChange={(e) => setData('guide', e.target.value)}
          placeholder="Ej: GUA-2026-001"
          required
        />

        {/* Placa */}
        <TextField
          label="Placa del Vehículo"
          labelAlwaysVisible
          value={data.licensePlate}
          onChange={(e) => setData('licensePlate', e.target.value.toUpperCase())}
          placeholder="Ej: ABCD-12"
          required
        />

        {/* Peso Bruto */}
        <TextField
          label="Peso Bruto (kg)"
          type="number"
          value={data.grossWeight.toString()}
          onChange={(e) => setData('grossWeight', parseFloat(e.target.value) || 0)}
          step="0.01"
          min="0"
          required
        />

        {/* Tara */}
        <TextField
          label="Tara (kg)"
          type="number"
          value={data.tare.toString()}
          onChange={(e) => setData('tare', parseFloat(e.target.value) || 0)}
          step="0.01"
          min="0"
          required
        />

        {/* Peso Neto */}
        <TextField
          label="Peso Neto (kg)"
          type="number"
          value={data.netWeight.toString()}
          onChange={() => {}}
          disabled
          step="0.01"
          min="0"
        />

        {/* Observaciones */}
        <div>
          <TextField
            label="Observaciones"
            value={data.note}
            onChange={(e) => setData('note', e.target.value)}
            placeholder="Observaciones adicionales..."
            rows={3}
          />
        </div>
      </div>

      {/* Diálogo de selección de plantilla */}
      <SelectTemplateDialog
        open={templateDialogOpen}
        onClose={() => setTemplateDialogOpen(false)}
        onSelect={handleSelectTemplate}
      />

      <CreateProducerDialog
        open={createProducerDialogOpen}
        onClose={handleCloseCreateProducerDialog}
        onSuccess={handleProducerCreated}
      />
    </div>
  );
}
