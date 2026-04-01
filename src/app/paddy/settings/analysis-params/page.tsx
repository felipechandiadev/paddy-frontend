import { Metadata } from 'next';
import { AnalysisParamsPage } from '@/features/analysis-params';
import { fetchAnalysisParams } from '@/features/analysis-params';
import { throwIfBackendUnavailable } from '@/lib/api/backend-connection-error';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Parámetros de Análisis | Paddy',
  description: 'Gestión de parámetros de análisis y rangos de descuento',
};

async function getAnalysisParams() {
  try {
    const params = await fetchAnalysisParams();
    return params;
  } catch (error) {
    throwIfBackendUnavailable(error);
    console.error('Failed to fetch analysis params:', error);
    return [];
  }
}

export default async function AnalysisParamsSettingsPage() {
  const analysisParams = await getAnalysisParams();

  return <AnalysisParamsPage initialData={analysisParams} />;
}
