'use client';

import { Producer } from '../../types/producers.types';
import ProducerDetailContent from './ProducerDetailContent';

interface ProducerDetailDialogProps {
  open: boolean;
  producer: Producer | null;
  onClose: () => void;
  onProducerUpdate?: (producer: Producer) => void;
}

export default function ProducerDetailDialog({
  open,
  producer,
  onClose,
  onProducerUpdate,
}: ProducerDetailDialogProps) {
  if (!open || !producer) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden">
        {/* Header con botón cerrar */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
          <h1 className="text-lg font-bold text-foreground">Detalle del Productor</h1>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-200 transition-colors"
            title="Cerrar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <ProducerDetailContent
            producer={producer}
            onProducerUpdate={onProducerUpdate}
          />
        </div>
      </div>
    </div>
  );
}
