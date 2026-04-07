import { DateTime } from 'luxon';
import {
  formatDateValue,
  parseDate,
} from '@/lib/date-formatter';
import { fetchAdvanceSeasonOptions } from '@/features/finances/actions/finances.action';
import { AdvanceSeasonOption } from '@/features/finances/types/finances.types';
import { CashProjectionReport } from '@/features/reports/components';

export const dynamic = 'force-dynamic';

function resolveInitialSeasonId(seasons: AdvanceSeasonOption[], today: DateTime): number | undefined {
  const active = seasons.find((s) => s.isActive);

  if (active) {
    return active.id;
  }

  const withDates = seasons
    .map((s) => ({ s, end: parseDate(s.endDate) }))
    .filter((item): item is { s: AdvanceSeasonOption; end: DateTime } => Boolean(item.end));

  if (withDates.length === 0) {
    return seasons[0]?.id;
  }

  const latestClosed = [...withDates]
    .filter((item) => item.end <= today)
    .sort((a, b) => b.end.toMillis() - a.end.toMillis())[0];

  return latestClosed?.s.id ?? withDates.sort((a, b) => b.end.toMillis() - a.end.toMillis())[0]?.s.id;
}

export default async function CashProjectionReportPage() {
  const seasonsResult = await fetchAdvanceSeasonOptions();

  const today = DateTime.now();
  const initialSeasonId = resolveInitialSeasonId(seasonsResult.data ?? [], today);
  const initialPrintDateLabel = formatDateValue(today);

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
