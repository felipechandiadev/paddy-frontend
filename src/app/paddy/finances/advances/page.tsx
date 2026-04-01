import { fetchAdvances } from '@/features/finances/actions/finances.action';
import { AdvancesPage } from '@/features/finances/components';

interface PageProps {
  searchParams: Promise<{
    search?: string;
    sort?: string;
    sortField?: string;
    filters?: string;
    page?: string;
    limit?: string;
    producerId?: string;
    hideAnnulled?: string;
  }>;
}

export default async function AdvancesRoute({ searchParams }: PageProps) {
  const params = await searchParams;
  const hideAnnulled = params.hideAnnulled !== 'false';
  const search = typeof params.search === 'string' ? params.search.trim() : undefined;
  const sort = params.sort === 'asc' || params.sort === 'desc' ? params.sort : undefined;
  const sortField = typeof params.sortField === 'string' ? params.sortField.trim() : undefined;
  const filters = typeof params.filters === 'string' ? params.filters.trim() : undefined;

  const parsedPage = Number.parseInt(params.page || '1', 10);
  const parsedLimit = Number.parseInt(params.limit || '25', 10);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const limit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : 25;

  const result = await fetchAdvances({
    producerId: params.producerId ? parseInt(params.producerId, 10) : undefined,
    includeDeleted: !hideAnnulled,
    search,
    sort,
    sortField,
    filters,
    page,
    limit,
  });

  return (
    <div className="p-6">
      <AdvancesPage
        initialAdvances={result.data}
        initialTotalRows={result.total}
        hideAnnulled={hideAnnulled}
      />
    </div>
  );
}
