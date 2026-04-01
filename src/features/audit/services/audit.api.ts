import { AuditEventsResponse, AuditFilters, AuditSummary } from '../types/audit.types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export const auditApi = {
  async fetchEvents(filters: AuditFilters, accessToken: string): Promise<AuditEventsResponse> {
    const params = new URLSearchParams();

    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.actorUserId) params.append('actorUserId', String(filters.actorUserId));
    if (filters.actorEmail) params.append('actorEmail', filters.actorEmail);
    if (filters.severity) params.append('severity', filters.severity);
    if (filters.status) params.append('status', filters.status);
    if (filters.category) params.append('category', filters.category);
    if (filters.eventCode) params.append('eventCode', filters.eventCode);
    if (filters.correlationId) params.append('correlationId', filters.correlationId);
    if (filters.page) params.append('page', String(filters.page));
    if (filters.limit) params.append('limit', String(filters.limit));

    const url = `${API_BASE_URL}/audit/events${params.toString() ? `?${params.toString()}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch audit events: ${response.statusText}`);
    }

    return response.json();
  },

  async fetchEventById(id: number, accessToken: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/audit/events/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch audit event: ${response.statusText}`);
    }

    return response.json();
  },

  async fetchEventsByCorrrelationId(correlationId: string, accessToken: string): Promise<AuditEventsResponse> {
    const response = await fetch(`${API_BASE_URL}/audit/correlation/${correlationId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch events by correlation ID: ${response.statusText}`);
    }

    return response.json();
  },

  async fetchSummary(days: number, accessToken: string): Promise<{ success: boolean; data: AuditSummary }> {
    const response = await fetch(`${API_BASE_URL}/audit/summary?days=${days}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch audit summary: ${response.statusText}`);
    }

    return response.json();
  },
};
