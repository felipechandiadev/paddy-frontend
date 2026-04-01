'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth.config';
import { auditApi } from '../services/audit.api';
import { AuditFilters, AuditEventsResponse, AuditSummary } from '../types/audit.types';

export async function fetchAuditEvents(filters: AuditFilters): Promise<AuditEventsResponse> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.accessToken) {
      throw new Error('Unauthorized - No session found');
    }

    return await auditApi.fetchEvents(filters, session.user.accessToken);
  } catch (error) {
    console.error('Error fetching audit events:', error);
    throw error;
  }
}

export async function fetchAuditSummary(days: number = 7): Promise<AuditSummary> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.accessToken) {
      throw new Error('Unauthorized - No session found');
    }

    const result = await auditApi.fetchSummary(days, session.user.accessToken);
    return result.data;
  } catch (error) {
    console.error('Error fetching audit summary:', error);
    throw error;
  }
}

export async function fetchAuditEventById(id: number) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.accessToken) {
      throw new Error('Unauthorized - No session found');
    }

    return await auditApi.fetchEventById(id, session.user.accessToken);
  } catch (error) {
    console.error('Error fetching audit event:', error);
    throw error;
  }
}

export async function fetchAuditEventsByCorrelationId(correlationId: string): Promise<AuditEventsResponse> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.accessToken) {
      throw new Error('Unauthorized - No session found');
    }

    return await auditApi.fetchEventsByCorrrelationId(correlationId, session.user.accessToken);
  } catch (error) {
    console.error('Error fetching events by correlation ID:', error);
    throw error;
  }
}
