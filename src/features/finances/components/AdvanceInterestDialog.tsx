import React, { useEffect, useState, useMemo } from 'react';
import { formatDateValue } from '@/lib/date-formatter';
import { Advance, UpdateAdvancePayload } from '../types/finances.types';
import { updateAdvance } from '../actions/finances.action';
import Dialog from '@/shared/components/ui/Dialog/Dialog';
import Alert from '@/shared/components/ui/Alert/Alert';
import { TextField } from '@/shared/components/ui/TextField/TextField';
import Switch from '@/shared/components/ui/Switch/Switch';
import { Button } from '@/shared/components/ui/Button/Button';
import IconButton from '@/shared/components/ui/IconButton/IconButton';
import { calculateAdvanceInterest } from '../services/advanceInterest';

interface AdvanceInterestDialogProps {
  open: boolean;
  advance: Advance | null;
  onClose: () => void;
  onSave?: (advance: Advance) => void;
}

export const AdvanceInterestDialog: React.FC<AdvanceInterestDialogProps> = ({
  open,
  advance,
  onClose,
  onSave,
}) => {
  const [loading, setLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [infoOpen, setInfoOpen] = useState(false);
  const [isInterestCalculationEnabled, setIsInterestCalculationEnabled] = useState(
    advance?.isInterestCalculationEnabled ?? true
  );
  const [interestRate, setInterestRate] = useState(
    String(advance?.interestRate || '')
  );
  const [interestEndDate, setInterestEndDate] = useState(
    advance?.interestEndDate || ''
  );
  const isLocked = !advance || advance.status !== 'paid';

  useEffect(() => {
    if (!advance) return;

    setIsInterestCalculationEnabled(advance.isInterestCalculationEnabled ?? true);
    setInterestRate(String(advance.interestRate ?? ''));
    setInterestEndDate(advance.interestEndDate ?? '');
    setSaveError(null);
  }, [advance]);

  // Calcular interés automáticamente
  const calculatedInterest = useMemo(() => {
    if (!advance || !isInterestCalculationEnabled) return 0;

    return calculateAdvanceInterest(advance, {
      interestRate: parseFloat(interestRate) || advance.interestRate,
      interestEndDate: interestEndDate || null,
      isInterestCalculationEnabled,
    });
  }, [advance, isInterestCalculationEnabled, interestRate, interestEndDate]);

  const handleSave = async () => {
    if (!advance) return;

    setLoading(true);
    setSaveError(null);
    try {
      const payload: UpdateAdvancePayload = {
        isInterestCalculationEnabled,
        interestRate: parseFloat(interestRate) || advance.interestRate,
        interestEndDate: interestEndDate || null,
      };

      const updated = await updateAdvance(advance.id, payload);

      if (updated) {
        onSave?.(updated);
        onClose();
      } else {
        setSaveError('No se pudo guardar. Tu sesion puede estar vencida. Vuelve a iniciar sesion.');
      }
    } catch (_error) {
      setSaveError('No se pudo guardar el cambio de interes. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  if (!advance) return null;

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        title={
          <div className="flex items-center gap-2">
            <span>Gestionar Interés de Anticipo</span>
            <IconButton
              icon="info"
              variant="basicSecondary"
              size="sm"
              onClick={() => setInfoOpen(true)}
              ariaLabel="Ver fórmula de cálculo de interés"
              title="Ver fórmula de cálculo"
            />
          </div>
        }
        maxWidth="sm"
      >
      <div className="space-y-4">
        {/* Información del Anticipo */}
        <div className="bg-gray-50 p-3 rounded">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-600">Folio:</span>
              <p className="font-semibold">{advance.id}</p>
            </div>
            <div>
              <span className="text-gray-600">Monto:</span>
              <p className="font-semibold">
                ${advance.amount?.toLocaleString('es-CL') || '0'}
              </p>
            </div>
            <div>
              <span className="text-gray-600">Tasa Mensual:</span>
              <p className="font-semibold">{advance.interestRate}%</p>
            </div>
            <div>
              <span className="text-gray-600">Fecha Inicio:</span>
              <p className="font-semibold">
                {formatDateValue(advance.issueDate)}
              </p>
            </div>
          </div>
        </div>

        {/* Toggle Cálculo */}
        <Switch
          label="Habilitar Cálculo de Interés"
          checked={isInterestCalculationEnabled}
          onChange={setIsInterestCalculationEnabled}
          disabled={isLocked}
        />

        {/* Tasa de Interés */}
        <TextField
          label="Tasa de Interés Mensual (%)"
          type="number"
          value={interestRate}
          onChange={(e) => setInterestRate(e.target.value)}
          placeholder="Ej: 2.5"
          disabled={isLocked}
        />

        {/* Fecha de Finalización */}
        <TextField
          label="Fecha de Finalización del Interés"
          type="date"
          value={interestEndDate}
          onChange={(e) => setInterestEndDate(e.target.value)}
          placeholder="Si está vacío, se usa hoy"
          disabled={isLocked || !isInterestCalculationEnabled}
        />

        {saveError && (
          <Alert variant="error">{saveError}</Alert>
        )}

        {/* Cálculo de Interés */}
        {isInterestCalculationEnabled && (
          <div className="bg-blue-50 p-3 rounded border border-blue-200">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Meses Transcurridos:</span>
                <span className="font-semibold">
                  {(
                    (new Date(interestEndDate || new Date()).getTime() -
                      new Date(advance.issueDate).getTime()) /
                    (1000 * 60 * 60 * 24 * 30)
                  ).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-base">
                <span className="font-semibold text-gray-700">Interés Acumulado:</span>
                <span className="font-bold text-blue-600">
                  ${calculatedInterest.toLocaleString('es-CL')}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Estado */}
        {isLocked && (
          <div className="bg-yellow-50 p-3 rounded border border-yellow-200 text-sm text-yellow-800">
            ⚠️ Este anticipo no esta disponible para cambios porque su estado es{' '}
            {advance.status === 'settled' ? 'Liquidado' : 'Anulado'}.
          </div>
        )}

        {/* Botones */}
        <div className="flex gap-3 pt-4 justify-between">
          <Button
            variant="outlined"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            loading={loading}
            disabled={isLocked}
          >
            Guardar Cambios
          </Button>
        </div>
      </div>
    </Dialog>

      {/* Diálogo de fórmula de interés */}
      <Dialog
        open={infoOpen}
        onClose={() => setInfoOpen(false)}
        title="Fórmula del Interés Acumulado"
        size="sm"
        showCloseButton
      >
        <div className="space-y-4 text-sm text-gray-700">
          <p>
            El interés acumulado se calcula usando interés simple sobre la base de meses
            transcurridos (donde cada mes equivale a 30 días).
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="font-bold text-blue-800 mb-2">Fórmula</p>
            <p className="font-mono text-blue-900 text-base text-center">
              Interés = Monto × Tasa (%) × Meses / 100
            </p>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
            <p className="font-semibold text-gray-800 mb-1">Donde:</p>
            <ul className="space-y-1 list-none">
              <li>
                <span className="font-mono font-semibold">Monto</span>
                {' '}— capital del anticipo (CLP)
              </li>
              <li>
                <span className="font-mono font-semibold">Tasa (%)</span>
                {' '}— tasa de interés mensual configurada
              </li>
              <li>
                <span className="font-mono font-semibold">Meses</span>
                {' '}= Días activos ÷ 30
              </li>
              <li>
                <span className="font-mono font-semibold">Días activos</span>
                {' '}= Fecha finalización − Fecha emisión (mínimo 0)
              </li>
            </ul>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-yellow-800 text-xs">
            <span className="font-semibold">Nota:</span> Si no se configura fecha de
            finalización, se usa la fecha actual. El resultado se redondea al peso
            más cercano (sin decimales).
          </div>
        </div>
      </Dialog>
    </>
  );
};
