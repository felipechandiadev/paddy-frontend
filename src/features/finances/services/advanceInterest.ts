import { DateTime } from 'luxon';
import { parseDate, getDaysBetween } from '@/lib/date-formatter';
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

export function calculateAdvanceInterest(
  advance: AdvanceInterestSource,
  overrides: AdvanceInterestOverrides = {}
): number {
  const isEnabled =
    overrides.isInterestCalculationEnabled ?? advance.isInterestCalculationEnabled;

  if (!isEnabled) {
    return 0;
  }

  const issueDate = parseDate(advance.issueDate);
  if (!issueDate) {
    return 0;
  }

  const endDateStr = overrides.interestEndDate ?? advance.interestEndDate;
  const endDate =
    (endDateStr ? parseDate(endDateStr) : null) ??
    (overrides.referenceDate ? DateTime.fromJSDate(overrides.referenceDate, { zone: 'utc' }) : null) ??
    DateTime.now();

  const daysActive = Math.max(0, getDaysBetween(issueDate, endDate));
  const monthsActive = daysActive / 30;
  const interestRate = overrides.interestRate ?? advance.interestRate;

  return Math.round((advance.amount * interestRate * monthsActive) / 100);
}