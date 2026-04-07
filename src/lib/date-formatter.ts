import { DateTime } from 'luxon';

/**
 * Centralized date formatting utilities for frontend
 * Uses Luxon with Spanish locale (es-CL)
 */

/**
 * Parse a date string (YYYY-MM-DD) to DateTime
 * @param value Date string, Date object, DateTime, or null
 * @returns DateTime object or null
 */
export function parseDate(value?: string | Date | DateTime | null): DateTime | null {
  if (!value) return null;

  if (value instanceof DateTime) {
    return value;
  }

  if (value instanceof Date) {
    return DateTime.fromJSDate(value, { zone: 'utc' });
  }

  // For dates without time info (YYYY-MM-DD format), fromISO parses them as local time
  // This prevents timezone offset issues when input is date-only strings
  return DateTime.fromISO(String(value));
}

/**
 * Format date to Spanish locale display (dd-MM-yyyy)
 * Used for UI rendering
 * @param value Date, DateTime, ISO string, or YYYY-MM-DD string
 * @returns Formatted string like "07-04-2026" or "-" if invalid
 */
export function formatDateValue(value?: string | Date | DateTime | null): string {
  if (!value) return '-';

  let dt: DateTime;

  if (value instanceof DateTime) {
    dt = value;
  } else if (value instanceof Date) {
    dt = DateTime.fromJSDate(value, { zone: 'utc' });
  } else {
    const strValue = String(value);
    // Check if it's an ISO string with timezone (from backend)
    if (strValue.includes('T') && (strValue.endsWith('Z') || strValue.includes('+'))) {
      // ISO string with timezone - parse as UTC then convert to local
      dt = DateTime.fromISO(strValue, { zone: 'utc' }).toLocal();
    } else {
      // Date-only string (YYYY-MM-DD) or other format - parse as local time
      dt = parseDate(strValue) || DateTime.invalid('Invalid date');
    }
  }

  if (!dt.isValid) return '-';

  return dt.toFormat('dd-MM-yyyy', { locale: 'es' });
}

/**
 * Format date to YYYY-MM-DD (input field format)
 * Used for HTML input[type=date] and API transport
 * @param value Date, DateTime, or string
 * @returns String in YYYY-MM-DD format or empty string
 */
export function formatDateInput(value?: string | Date | DateTime | null): string {
  if (!value) return '';

  let dt: DateTime;

  if (value instanceof DateTime) {
    dt = value;
  } else if (value instanceof Date) {
    dt = DateTime.fromJSDate(value, { zone: 'utc' });
  } else {
    dt = parseDate(String(value)) || DateTime.invalid('Invalid date');
  }

  if (!dt.isValid) return '';

  return dt.toFormat('yyyy-MM-dd');
}

/**
 * Alias for formatDateInput (used in report pages)
 * Converts various date formats to YYYY-MM-DD for input fields
 */
export function toDateInputValue(value?: string | Date | null): string {
  return formatDateInput(value);
}

/**
 * Format full datetime with time for audit logs and prints
 * @param value Date, DateTime, or string
 * @returns Formatted string like "07-04-2026 14:30:45"
 */
export function formatDateTimeLocale(value?: string | Date | DateTime | null): string {
  if (!value) return '-';

  let dt: DateTime;

  if (value instanceof DateTime) {
    dt = value;
  } else if (value instanceof Date) {
    dt = DateTime.fromJSDate(value, { zone: 'utc' });
  } else {
    dt = parseDate(String(value)) || DateTime.invalid('Invalid date');
  }

  if (!dt.isValid) return '-';

  return dt.toFormat('dd-MM-yyyy HH:mm:ss', { locale: 'es' });
}

/**
 * Get today's date in YYYY-MM-DD format
 * Used for initializing date ranges in reports
 * @returns Today's date string
 */
export function getTodayInputFormat(): string {
  return formatDateInput(DateTime.now().toJSDate());
}

/**
 * Get today's date in Spanish locale format
 * @returns Today's date like "07-04-2026"
 */
export function getTodayDisplayFormat(): string {
  return formatDateValue(DateTime.now().toJSDate());
}

/**
 * Calculate number of days between two dates
 * @param start Start date
 * @param end End date
 * @returns Number of days (can be negative)
 */
export function getDaysBetween(
  start?: string | Date | DateTime | null,
  end?: string | Date | DateTime | null,
): number {
  const startDt = parseDate(start);
  const endDt = parseDate(end);

  if (!startDt || !endDt) return 0;

  const diff = endDt.diff(startDt, 'days');
  return Math.floor(diff.days);
}

/**
 * Get start of year for initial date range
 * @param year Optional year (defaults to current)
 * @returns DateTime at Jan 1 midnight UTC
 */
export function getYearStart(year?: number): DateTime {
  const targetYear = year || DateTime.now().year;
  return DateTime.utc(targetYear, 1, 1);
}

/**
 * Get end of year for final date range
 * @param year Optional year (defaults to current)
 * @returns  DateTime at Dec 31 23:59:59.999 UTC
 */
export function getYearEnd(year?: number): DateTime {
  const targetYear = year || DateTime.now().year;
  return DateTime.utc(targetYear, 12, 31, 23, 59, 59, 999);
}

/**
 * Get month start
 * @param date Date or DateTime
 * @returns DateTime at first day of month, midnight UTC
 */
export function getMonthStart(date?: string | Date | DateTime | null): DateTime | null {
  const dt = parseDate(date);
  if (!dt) return null;
  return dt.startOf('month');
}

/**
 * Get month end
 * @param date Date or DateTime
 * @returns DateTime at last day of month, end of day UTC
 */
export function getMonthEnd(date?: string | Date | DateTime | null): DateTime | null {
  const dt = parseDate(date);
  if (!dt) return null;
  return dt.endOf('month');
}

/**
 * Add days to a date
 * @param date Base date
 * @param days Number of days to add
 * @returns New formatted date in YYYY-MM-DD
 */
export function addDaysFormatted(date?: string | Date | DateTime | null, days: number = 0): string {
  const dt = parseDate(date);
  if (!dt) return '';
  return formatDateInput(dt.plus({ days }));
}

/**
 * Check if date is valid
 * @param value Any date value
 * @returns true if valid date, false otherwise
 */
export function isValidDate(value?: any): boolean {
  try {
    const dt = parseDate(value);
    return dt?.isValid ?? false;
  } catch {
    return false;
  }
}

/**
 * Get relative time string (e.g., "hace 2 días")
 * Useful for audit logs and timestamps
 * @param date Date to compare
 * @returns Relative time string in Spanish
 */
export function getRelativeTime(date?: string | Date | DateTime | null): string {
  if (!date) return '-';

  try {
    const dt = parseDate(date);
    if (!dt?.isValid) return '-';

    const now = DateTime.now();
    const diffHours = now.diff(dt, 'hours').hours;
    const diffDays = now.diff(dt, 'days').days;
    const diffMonths = now.diff(dt, 'months').months;

    if (diffHours < 1) {
      return 'hace unos minutos';
    }
    if (diffHours < 24) {
      const h = Math.floor(diffHours);
      return `hace ${h} ${h === 1 ? 'hora' : 'horas'}`;
    }
    if (diffDays < 30) {
      const d = Math.floor(diffDays);
      return `hace ${d} ${d === 1 ? 'día' : 'días'}`;
    }
    if (diffMonths < 12) {
      const m = Math.floor(diffMonths);
      return `hace ${m} ${m === 1 ? 'mes' : 'meses'}`;
    }

    return `hace ${Math.floor(now.diff(dt, 'years').years)} años`;
  } catch {
    return '-';
  }
}
