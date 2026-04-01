import { fetchAdvanceSeasonOptions } from '@/features/finances/actions/finances.action';
import { AdvanceSeasonOption } from '@/features/finances/types/finances.types';
import { CashProjectionReport } from '@/features/reports/components';

export const dynamic = 'force-dynamic';

function parseSeasonDate(value?: string | null): Date | null {
  if (!value) {
    return null;
  }

  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? `${value}T00:00:00`
    : value;
  const parsed = new Date(normalized);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function resolveInitialSeasonId(seasons: AdvanceSeasonOption[], today: Date): number | undefined {
  const active = seasons.find((s) => s.isActive);

  if (active) {
    return active.id;
  }

  const withDates = seasons
    .map((s) => ({ s, end: parseSeasonDate(s.endDate) }))
    .filter((item): item is { s: AdvanceSeasonOption; end: Date } => Boolean(item.end));

  if (withDates.length === 0) {
    return seasons[0]?.id;
  }

  const latestClosed = [...withDates]
    .filter((item) => item.end.getTime() <= today.getTime())
    .sort((a, b) => b.end.getTime() - a.end.getTime())[0];

  return latestClosed?.s.id ?? withDates.sort((a, b) => b.end.getTime() - a.end.getTime())[0]?.s.id;
}

export default async function CashProjectionReportPage() {
  const seasonsResult = await fetchAdvanceSeasonOptions();

  const today = new Date();
  const initialSeasonId = resolveInitialSeasonId(seasonsResult.data ?? [], today);
  const initialPrintDateLabel = today.toLocaleDateString('es-CL');

  return (
    <div className="space-y-6">
      <CashProjectionReport
        seasons={seasonsResult.data ?? []}
        initialSeasonId={initialSeasonId}
        initialPrintDateLabel={initialPrintDateLabel}
      />
    </div>
  );
}
