import { fetchTemplates } from '@/features/templates/actions';
import TemplatesPage from '@/features/templates/components/TemplatesPage';

export const dynamic = 'force-dynamic';

export default async function TemplatesSettingsPage({
  searchParams,
}: {
  searchParams: Record<string, string>;
}) {
  const templates = await fetchTemplates();

  return (
    <TemplatesPage initialData={templates} searchParams={searchParams} />
  );
}
