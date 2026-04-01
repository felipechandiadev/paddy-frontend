import { fetchProducers } from '@/features/producers/actions/producers.action';
import ProducersDataGrid from './ui/ProducersDataGrid';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    search?: string;
    sortField?: string;
    sort?: string;
  }>;
}

export default async function ProducersRoute({ searchParams }: PageProps) {
  const params = await searchParams;

  const result = await fetchProducers({
    page: params.page ? parseInt(params.page) : 1,
    limit: params.limit ? parseInt(params.limit) : 10,
    search: params.search || '',
    sortField: params.sortField || 'name',
    sort: (params.sort as 'ASC' | 'DESC') || 'ASC',
  });

  return (
    <div className="p-6">
      <ProducersDataGrid data={result.data} total={result.total} page={result.page} limit={result.limit} />
    </div>
  );
}
