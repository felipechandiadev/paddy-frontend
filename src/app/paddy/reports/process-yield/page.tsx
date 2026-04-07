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
import { fetchRiceTypes } from '@/features/rice-types/actions';
import { ProcessYieldReport } from '@/features/reports/components';

export const dynamic = 'force-dynamic';

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

function toDateInputValue(date: DateTime): string {
  return formatDateInput(date);
}

function resolveInitialRange(
  seasons: AdvanceSeasonOption[],
  seasonId: number | undefined,
): {
  initialStartDate?: string;
  initialEndDate?: string;
} {
  if (!seasonId) {
    return {};
  }

  const season = seasons.find((item) => item.id === seasonId);

  const startDate = parseDate(season?.startDate);
  const endDate = parseDate(season?.endDate);

  return {
    initialStartDate: startDate ? toDateInputValue(startDate) : undefined,
    initialEndDate: endDate ? toDateInputValue(endDate) : undefined,
  };
}

export default async function ProcessYieldReportPage() {
  const [seasonsResult, producersResult, riceTypes] = await Promise.all([
    fetchAdvanceSeasonOptions(),
    fetchAdvanceProducerOptions(),
    fetchRiceTypes(),
  ]);

  const today = DateTime.now();
  const initialSeasonId = resolveInitialSeasonId(seasonsResult.data ?? [], today);
  const { initialStartDate, initialEndDate } = resolveInitialRange(
    seasonsResult.data ?? [],
    initialSeasonId,
  );
  const initialPrintDateLabel = formatDateValue(today);

  return (
    <div className="space-y-6">
      <ProcessYieldReport
        seasons={seasonsResult.data ?? []}
        producers={producersResult.data ?? []}
        riceTypes={riceTypes}
        initialSeasonId={initialSeasonId}
        initialStartDate={initialStartDate}
        initialEndDate={initialEndDate}
        initialPrintDateLabel={initialPrintDateLabel}
      />
    </div>
  );
}
