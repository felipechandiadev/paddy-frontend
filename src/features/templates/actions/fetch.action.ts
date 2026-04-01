'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth.config';
import { templatesApi } from '../services/templates.api';
import { Template } from '../types/templates.types';

export async function fetchTemplates(): Promise<Template[]> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.accessToken) {
    throw new Error('Not authenticated');
  }
  const response = await templatesApi.list(session.user.accessToken);
  return response.data || [];
}

export async function createTemplate(
  data: Partial<Template>
): Promise<{ success: boolean; data?: Template; error?: string }> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.accessToken) {
      return { success: false, error: 'Not authenticated' };
    }
    const response = await templatesApi.create(session.user.accessToken, data);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Error' };
  }
}

export async function updateTemplate(
  id: number,
  data: Partial<Template>
): Promise<{ success: boolean; data?: Template; error?: string }> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.accessToken) {
      return { success: false, error: 'Not authenticated' };
    }
    const response = await templatesApi.update(session.user.accessToken, id, data);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Error' };
  }
}

export async function deleteTemplate(id: number): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.accessToken) {
      return { success: false, error: 'Not authenticated' };
    }
    await templatesApi.delete(session.user.accessToken, id);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Error' };
  }
}
