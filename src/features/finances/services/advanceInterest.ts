import { Advance } from '../types/finances.types';

type AdvanceInterestSource = Pick<
  Advance,
  'amount' | 'issueDate' | 'interestRate' | 'interestEndDate' | 'isInterestCalculationEnabled'
>;

interface AdvanceInterestOverrides {
  interestRate?: number;
  interestEndDate?: string | null;
  isInterestCalculationEnabled?: boolean;
  referenceDate?: Date;
}

function parseAdvanceDate(value: string | null | undefined): Date | null {
  if (!value) {
    return null;
  }

  const normalizedValue = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? `${value}T00:00:00`
    : value;

  const parsedDate = new Date(normalizedValue);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

export function calculateAdvanceInterest(
  advance: AdvanceInterestSource,
  overrides: AdvanceInterestOverrides = {}
): number {
  const isEnabled =
    overrides.isInterestCalculationEnabled ?? advance.isInterestCalculationEnabled;

  if (!isEnabled) {
    return 0;
  }

  const issueDate = parseAdvanceDate(advance.issueDate);
  if (!issueDate) {
    return 0;
  }

  const endDate =
    parseAdvanceDate(overrides.interestEndDate ?? advance.interestEndDate ?? null) ??
    overrides.referenceDate ??
    new Date();

  const diffInMs = endDate.getTime() - issueDate.getTime();
  const daysActive = Math.max(0, diffInMs / (1000 * 60 * 60 * 24));
  const monthsActive = daysActive / 30;
  const interestRate = overrides.interestRate ?? advance.interestRate;

  return Math.round((advance.amount * interestRate * monthsActive) / 100);
}