'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth.config';

export interface Template {
  id: number;
  name: string;
  description?: string;
  isDefault?: boolean;
  useToleranceGroup?: boolean;
  groupToleranceValue: number;
  groupToleranceName?: string | null;
  parametersConfig?: Record<string, boolean>;
  
  // Parámetros disponibles
  availableHumedad?: boolean;
  availableGranosVerdes?: boolean;
  availableImpurezas?: boolean;
  availableVano?: boolean;
  availableHualcacho?: boolean;
  availableGranosManchados?: boolean;
  availableGranosPelados?: boolean;
  availableGranosYesosos?: boolean;
  availableBonus?: boolean;
  availableDry?: boolean;
  
  // Mostrar tolerancia individual
  showToleranceHumedad?: boolean;
  showToleranceGranosVerdes?: boolean;
  showToleranceImpurezas?: boolean;
  showToleranceVano?: boolean;
  showToleranceHualcacho?: boolean;
  showToleranceGranosManchados?: boolean;
  showToleranceGranosPelados?: boolean;
  showToleranceGranosYesosos?: boolean;
  
  // Grupo de tolerancia por parámetro
  groupToleranceHumedad?: boolean;
  groupToleranceGranosVerdes?: boolean;
  groupToleranceImpurezas?: boolean;
  groupToleranceVano?: boolean;
  groupToleranceHualcacho?: boolean;
  groupToleranceGranosManchados?: boolean;
  groupToleranceGranosPelados?: boolean;
  groupToleranceGranosYesosos?: boolean;
  
  // Valores (porcentaje y tolerancia) de cada parámetro
  percentHumedad?: number;
  toleranceHumedad?: number;
  percentGranosVerdes?: number;
  toleranceGranosVerdes?: number;
  percentImpurezas?: number;
  toleranceImpurezas?: number;
  percentVano?: number;
  toleranceVano?: number;
  percentHualcacho?: number;
  toleranceHualcacho?: number;
  percentGranosManchados?: number;
  toleranceGranosManchados?: number;
  percentGranosPelados?: number;
  toleranceGranosPelados?: number;
  percentGranosYesosos?: number;
  toleranceGranosYesosos?: number;
  
  // Bonificación y Secado
  toleranceBonus?: number;
  percentDry?: number;
}

/**
 * Obtiene todas las plantillas disponibles desde la API
 */
export async function fetchTemplates(): Promise<Template[]> {
  try {
    const session = await getServerSession(authOptions);
    const token = (session?.user as any)?.accessToken;

    if (!token) {
      console.error('No token found in session');
      throw new Error('No autorizado - No token available');
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    console.log('Fetching templates from:', apiUrl);

    const response = await fetch(`${apiUrl}/configuration/templates`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error fetching templates (${response.status}):`, errorText);
      throw new Error(`Error fetching templates: ${response.status}`);
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching templates:', error);
    throw error; // Re-lanzar para que el cliente lo maneje
  }
}

/**
 * Obtiene la plantilla por defecto desde la API
 */
export async function fetchDefaultTemplate(): Promise<Template | null> {
  try {
    const session = await getServerSession(authOptions);
    const token = (session?.user as any)?.accessToken;

    if (!token) {
      throw new Error('No autorizado');
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/configuration/templates/default`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      console.warn(`Error fetching default template: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data.data || null;
  } catch (error) {
    console.error('Error fetching default template:', error);
    return null;
  }
}

/**
 * Obtiene una plantilla específica por ID desde la API
 */
export async function fetchTemplateById(templateId: number): Promise<Template | null> {
  try {
    const session = await getServerSession(authOptions);
    const token = (session?.user as any)?.accessToken;

    if (!token) {
      throw new Error('No autorizado');
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/configuration/templates/${templateId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      console.warn(`Error fetching template: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data.data || null;
  } catch (error) {
    console.error('Error fetching template:', error);
    return null;
  }
}
