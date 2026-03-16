import {
  fetchAdvanceProducerOptions,
  fetchAdvanceSeasonOptions,
} from '@/features/finances/actions/finances.action';
import { AdvanceSeasonOption } from '@/features/finances/types/finances.types';
import { FinancialProfitabilityReport } from '@/features/reports/components';

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

function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function resolveInitialSeasonId(seasons: AdvanceSeasonOption[], today: Date): number | undefined {
  const active = seasons.find((season) => season.isActive);

  if (active) {
    return active.id;
  }

  const withDates = seasons
    .map((season) => ({
      season,
      endDate: parseSeasonDate(season.endDate),
    }))
    .filter(
      (
        item,
      ): item is {
        season: AdvanceSeasonOption;
        endDate: Date;
      } => Boolean(item.endDate),
    );

  if (withDates.length === 0) {
    return seasons[0]?.id;
  }

  const latestClosed = [...withDates]
    .filter((item) => item.endDate.getTime() <= today.getTime())
    .sort((a, b) => b.endDate.getTime() - a.endDate.getTime())[0];

  return latestClosed?.season.id ?? withDates.sort((a, b) => b.endDate.getTime() - a.endDate.getTime())[0]?.season.id;
}

function resolveInitialCutoffDate(
  seasons: AdvanceSeasonOption[],
  initialSeasonId: number | undefined,
  today: Date,
): string {
  if (!initialSeasonId) {
    return toDateInputValue(today);
  }

  const selectedSeason = seasons.find((season) => season.id === initialSeasonId);
  const seasonEndDate = parseSeasonDate(selectedSeason?.endDate);

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

  const today = new Date();
  const initialSeasonId = resolveInitialSeasonId(seasonsResult.data ?? [], today);
  const initialCutoffDate = resolveInitialCutoffDate(
    seasonsResult.data ?? [],
    initialSeasonId,
    today,
  );
  const initialPrintDateLabel = today.toLocaleDateString('es-CL');

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
