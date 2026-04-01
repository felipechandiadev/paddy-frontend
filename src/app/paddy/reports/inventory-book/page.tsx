import { fetchAdvanceSeasonOptions } from '@/features/finances/actions/finances.action';
import { AdvanceSeasonOption } from '@/features/finances/types/finances.types';
import { InventoryBookReport } from '@/features/reports/components';

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

export default async function InventoryBookReportPage() {
  const seasonsResult = await fetchAdvanceSeasonOptions();

  const today = new Date();
  const initialSeasonId = resolveInitialSeasonId(seasonsResult.data ?? [], today);
  const initialPrintDateLabel = today.toLocaleDateString('es-CL');

  return (
    <div className="space-y-6">
      <InventoryBookReport
        seasons={seasonsResult.data ?? []}
        initialSeasonId={initialSeasonId}
        initialPrintDateLabel={initialPrintDateLabel}
      />
    </div>
  );
}
