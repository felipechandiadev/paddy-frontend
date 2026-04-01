import { fetchSettlements } from '@/features/finances/actions/finances.action';
import { SettlementsPage } from '@/features/finances/components';

interface PageProps {
  searchParams: Promise<{
    search?: string;
    sort?: string;
    sortField?: string;
    filters?: string;
    page?: string;
    limit?: string;
    producerId?: string;
    status?: string;
  }>;
}

const VALID_STATUSES = ['draft', 'completed', 'cancelled'] as const;
type SettlementStatus = (typeof VALID_STATUSES)[number];

export default async function SettlementsRoute({ searchParams }: PageProps) {
  const params = await searchParams;
  const search = typeof params.search === 'string' ? params.search.trim() : undefined;
  const sort = params.sort === 'asc' || params.sort === 'desc' ? params.sort : undefined;
  const sortField = typeof params.sortField === 'string' ? params.sortField.trim() : undefined;
  const filters = typeof params.filters === 'string' ? params.filters.trim() : undefined;

  const parsedPage = Number.parseInt(params.page || '1', 10);
  const parsedLimit = Number.parseInt(params.limit || '25', 10);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const limit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : 25;

  const parsedStatus = VALID_STATUSES.includes(
    (params.status || '').toLowerCase() as SettlementStatus
  )
    ? ((params.status || '').toLowerCase() as SettlementStatus)
    : undefined;

  const result = await fetchSettlements({
    producerId: params.producerId ? parseInt(params.producerId, 10) : undefined,
    status: parsedStatus,
    search,
    sort,
    sortField,
    filters,
    page,
    limit,
  });

  return (
    <div className="p-6">
      <SettlementsPage
        initialSettlements={result.data}
        initialTotalRows={result.total}
      />
    </div>
  );
}
