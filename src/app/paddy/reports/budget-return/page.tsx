import { DateTime } from 'luxon';
import {
  formatDateInput,
  formatDateValue,
  parseDate,
  getYearStart,
  getYearEnd,
} from '@/lib/date-formatter';
import {
  fetchAdvanceProducerOptions,
  fetchAdvanceSeasonOptions,
} from '@/features/finances/actions/finances.action';
import { AdvanceSeasonOption } from '@/features/finances/types/finances.types';
import { BudgetReturnReport } from '@/features/reports/components';

export const dynamic = 'force-dynamic';

function resolveInitialRange(
  seasons: AdvanceSeasonOption[],
  today: DateTime,
): {
  initialStartDate: string;
  initialEndDate: string;
  initialSeasonId?: number;
} {
  const seasonsWithDates = seasons
    .map((season) => ({
      season,
      startDate: parseDate(season.startDate),
      endDate: parseDate(season.endDate),
    }))
    .filter(
      (
        item,
      ): item is {
        season: AdvanceSeasonOption;
        startDate: DateTime;
        endDate: DateTime;
      } => Boolean(item.startDate && item.endDate),
    );

  if (seasonsWithDates.length === 0) {
    return {
      initialStartDate: formatDateInput(getYearStart()),
      initialEndDate: formatDateInput(getYearEnd()),
    };
  }

  const latestClosedSeason = [...seasonsWithDates]
    .filter((item) => item.endDate <= today)
    .sort((a, b) => b.endDate.toMillis() - a.endDate.toMillis())[0];

  const preferredSeason =
    latestClosedSeason ??
    [...seasonsWithDates].sort(
      (a, b) => b.endDate.toMillis() - a.endDate.toMillis(),
    )[0];

  return {
    initialStartDate: formatDateInput(preferredSeason.startDate),
    initialEndDate: formatDateInput(preferredSeason.endDate),
    initialSeasonId: preferredSeason.season.id,
  };
}

export default async function BudgetReturnReportPage() {
  const [seasonsResult, producersResult] = await Promise.all([
    fetchAdvanceSeasonOptions(),
    fetchAdvanceProducerOptions(),
  ]);

  const today = DateTime.now();
  const { initialStartDate, initialEndDate, initialSeasonId } =
    resolveInitialRange(seasonsResult.data ?? [], today);
  const initialPrintDateLabel = formatDateValue(today);

  return (
    <div className="space-y-6">
      <BudgetReturnReport
        seasons={seasonsResult.data ?? []}
        producers={producersResult.data ?? []}
        initialStartDate={initialStartDate}
        initialEndDate={initialEndDate}
        initialSeasonId={initialSeasonId}
        initialPrintDateLabel={initialPrintDateLabel}
      />
    </div>
  );
}
