export interface AuditEvent {
  id: number;
  eventCode: string;
  description?: string;
  category: string;
  action: string;
  status: 'SUCCESS' | 'FAIL' | 'DENIED';
  severity: 'CRITICAL' | 'HIGH' | 'WARN' | 'INFO';
  actorUserId: number | null;
  actorEmail: string | null;
  actorRole: string | null;
  entityType: string | null;
  entityId: number | null;
  route: string;
  method: string;
  ip: string | null;
  requestId: string | null;
  correlationId: string | null;
  errorMessage: string | null;
  createdAt: string;
}

export interface AuditEventsResponse {
  success: boolean;
  data: {
    events: AuditEvent[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  timestamp?: string;
  message?: string;
}

export interface AuditFilters {
  startDate?: string;
  endDate?: string;
  actorUserId?: number;
  actorEmail?: string;
  severity?: 'CRITICAL' | 'HIGH' | 'WARN' | 'INFO';
  status?: 'SUCCESS' | 'FAIL' | 'DENIED';
  category?: string;
  eventCode?: string;
  correlationId?: string;
  page?: number;
  limit?: number;
}

export interface AuditSummary {
  period: string;
  startDate: string;
  endDate: string;
  totalEvents: number;
  severitySummary: {
    CRITICAL: number;
    HIGH: number;
    WARN: number;
    INFO: number;
  };
  categoryBreakdown: Record<string, number>;
}
