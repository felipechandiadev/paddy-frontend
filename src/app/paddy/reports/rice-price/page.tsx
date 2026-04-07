import { DateTime } from 'luxon';
import {
  formatDateInput,
  formatDateValue,
  parseDate,
  getYearStart,
  getYearEnd,
} from '@/lib/date-formatter';
import { fetchRiceTypes } from '@/features/rice-types/actions/fetch.action';
import { fetchAdvanceSeasonOptions } from '@/features/finances/actions/finances.action';
import { AdvanceSeasonOption } from '@/features/finances/types/finances.types';
import { RicePriceReport } from '@/features/reports/components';

export const dynamic = 'force-dynamic';

function resolveInitialRange(
  seasons: AdvanceSeasonOption[],
  today: DateTime,
): { initialStartDate: string; initialEndDate: string } {
  const seasonsWithDates = seasons
    .map((season) => ({
      season,
      startDate: parseDate(season.startDate),
      endDate: parseDate(season.endDate),
    }))
    .filter(
      (item): item is { season: AdvanceSeasonOption; startDate: DateTime; endDate: DateTime } =>
        Boolean(item.startDate && item.endDate),
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
    [...seasonsWithDates].sort((a, b) => b.endDate.toMillis() - a.endDate.toMillis())[0];

  return {
    initialStartDate: formatDateInput(preferredSeason.startDate),
    initialEndDate: formatDateInput(preferredSeason.endDate),
  };
}

export default async function RicePriceReportPage() {
  const [riceTypes, seasonsResult] = await Promise.all([
    fetchRiceTypes(),
    fetchAdvanceSeasonOptions(),
  ]);

  const today = DateTime.now();
  const { initialStartDate, initialEndDate } = resolveInitialRange(
    seasonsResult.data,
    today,
  );
  const initialPrintDateLabel = formatDateValue(today);

  return (
    <div className="space-y-6">
      <RicePriceReport
        riceTypes={riceTypes}
        initialStartDate={initialStartDate}
        initialEndDate={initialEndDate}
        initialPrintDateLabel={initialPrintDateLabel}
      />
    </div>
  );
}
