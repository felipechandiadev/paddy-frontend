'use client';

import { useEffect, useState } from 'react';
import Alert from '@/shared/components/ui/Alert/Alert';
import { Button } from '@/shared/components/ui/Button/Button';
import Switch from '@/shared/components/ui/Switch/Switch';
import { TextField } from '@/shared/components/ui/TextField/TextField';
import { updateProducer } from '../../actions/producers.action';
import { Producer } from '../../types/producers.types';

interface ProducerInfoSectionProps {
  producer: Producer;
  onProducerUpdate?: (producer: Producer) => void;
}

interface ProducerFormState {
  rut: string;
  name: string;
  email: string;
  phone: string;
  contactPerson: string;
  address: string;
  city: string;
  isActive: boolean;
}

function createFormState(producer: Producer): ProducerFormState {
  return {
    rut: producer.rut || '',
    name: producer.name || '',
    email: producer.email || '',
    phone: producer.phone || '',
    contactPerson: producer.contactPerson || '',
    address: producer.address || '',
    city: producer.city || '',
    isActive: producer.isActive,
  };
}

export default function ProducerInfoSection({
  producer,
  onProducerUpdate,
}: ProducerInfoSectionProps) {
  const [formData, setFormData] = useState<ProducerFormState>(() => createFormState(producer));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    setFormData(createFormState(producer));
    setError(null);
    setSuccessMessage(null);
  }, [producer]);

  const handleFieldChange = (field: keyof ProducerFormState, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setError(null);
    setSuccessMessage(null);
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    const result = await updateProducer(producer.id, {
      rut: formData.rut.trim(),
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      contactPerson: formData.contactPerson.trim(),
      address: formData.address.trim(),
      city: formData.city.trim(),
      isActive: formData.isActive,
    });

    setIsSaving(false);

    if (!result.success || !result.data) {
      setError(result.error || 'No fue posible actualizar la información del productor.');
      return;
    }

    onProducerUpdate?.(result.data);
    setFormData(createFormState(result.data));
    setSuccessMessage('Información del productor actualizada correctamente.');
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-neutral-900">Información del productor</h3>
        <p className="text-sm text-neutral-500">
          Revisa y actualiza los datos generales del productor cuando sea necesario.
        </p>
      </div>

      <div className="space-y-4">
        {error && <Alert variant="error">{error}</Alert>}
        {successMessage && <Alert variant="success">{successMessage}</Alert>}

        <div className="grid gap-4 md:grid-cols-2">
          <TextField
            label="RUT"
            type="dni"
            value={formData.rut}
            onChange={(event) => handleFieldChange('rut', event.target.value)}
            placeholder="12.345.678-9"
            disabled={isSaving}
          />

          <TextField
            label="Nombre"
            type="text"
            value={formData.name}
            onChange={(event) => handleFieldChange('name', event.target.value)}
            placeholder="Nombre del productor"
            disabled={isSaving}
          />

          <TextField
            label="Email"
            type="email"
            value={formData.email}
            onChange={(event) => handleFieldChange('email', event.target.value)}
            placeholder="correo@ejemplo.com"
            disabled={isSaving}
          />

          <TextField
            label="Teléfono"
            type="tel"
            value={formData.phone}
            onChange={(event) => handleFieldChange('phone', event.target.value)}
            placeholder="+56 9 1234 5678"
            phonePrefix="+56"
            disabled={isSaving}
          />

          <TextField
            label="Persona de contacto"
            type="text"
            value={formData.contactPerson}
            onChange={(event) => handleFieldChange('contactPerson', event.target.value)}
            placeholder="Nombre del contacto"
            disabled={isSaving}
          />

          <TextField
            label="Ciudad"
            type="text"
            value={formData.city}
            onChange={(event) => handleFieldChange('city', event.target.value)}
            placeholder="Parral"
            disabled={isSaving}
          />

          <div className="md:col-span-2">
            <TextField
              label="Dirección"
              type="text"
              value={formData.address}
              onChange={(event) => handleFieldChange('address', event.target.value)}
              placeholder="Calle Principal 123"
              disabled={isSaving}
            />
          </div>

          <div className="md:col-span-2 pt-2">
            <Switch
              label="Activo"
              checked={formData.isActive}
              onChange={(checked) => handleFieldChange('isActive', checked)}
              labelPosition="right"
              disabled={isSaving}
            />
          </div>
        </div>

        <div className="flex justify-end border-t border-gray-200 pt-4">
          <Button
            variant="primary"
            onClick={handleSubmit}
            loading={isSaving}
            disabled={isSaving}
          >
            Actualizar
          </Button>
        </div>
      </div>
    </div>
  );
}
