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
import { FinancialProfitabilityReport } from '@/features/reports/components';

export const dynamic = 'force-dynamic';

function toDateInputValue(date: DateTime): string {
  return formatDateInput(date);
}

function resolveInitialSeasonId(seasons: AdvanceSeasonOption[], today: DateTime): number | undefined {
  const active = seasons.find((season) => season.isActive);

  if (active) {
    return active.id;
  }

  const withDates = seasons
    .map((season) => ({
      season,
      endDate: parseDate(season.endDate),
    }))
    .filter(
      (
        item,
      ): item is {
        season: AdvanceSeasonOption;
        endDate: DateTime;
      } => Boolean(item.endDate),
    );

  if (withDates.length === 0) {
    return seasons[0]?.id;
  }

  const latestClosed = [...withDates]
    .filter((item) => item.endDate <= today)
    .sort((a, b) => b.endDate.toMillis() - a.endDate.toMillis())[0];

  return latestClosed?.season.id ?? withDates.sort((a, b) => b.endDate.toMillis() - a.endDate.toMillis())[0]?.season.id;
}

function resolveInitialCutoffDate(
  seasons: AdvanceSeasonOption[],
  initialSeasonId: number | undefined,
  today: DateTime,
): string {
  if (!initialSeasonId) {
    return toDateInputValue(today);
  }

  const selectedSeason = seasons.find((season) => season.id === initialSeasonId);
  const seasonEndDate = parseDate(selectedSeason?.endDate);

  if (!seasonEndDate) {
    return toDateInputValue(today);
  }

  return toDateInputValue(seasonEndDate <= today ? seasonEndDate : today);
}

export default async function FinancialProfitabilityReportPage() {
  const [seasonsResult, producersResult] = await Promise.all([
    fetchAdvanceSeasonOptions(),
    fetchAdvanceProducerOptions(),
  ]);

  const today = DateTime.now();
  const initialSeasonId = resolveInitialSeasonId(seasonsResult.data ?? [], today);
  const initialCutoffDate = resolveInitialCutoffDate(
    seasonsResult.data ?? [],
    initialSeasonId,
    today,
  );
  const initialPrintDateLabel = formatDateValue(today);

  return (
    <div className="space-y-6">
      <FinancialProfitabilityReport
        seasons={seasonsResult.data ?? []}
        producers={producersResult.data ?? []}
        initialSeasonId={initialSeasonId}
        initialCutoffDate={initialCutoffDate}
        initialPrintDateLabel={initialPrintDateLabel}
      />
    </div>
  );
}
