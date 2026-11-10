/**
 * Formatters for Bangladeshi Taka (BDT ৳) and Asia/Dhaka DateTime.
 */

// Format numbers in South Asian / Bangladeshi comma system (e.g., 1,00,000)
export function formatBangladeshiNumber(val: number): string {
  const isNegative = val < 0;
  const absVal = Math.round(Math.abs(val));
  const str = absVal.toString();

  if (str.length <= 3) {
    return (isNegative ? '-' : '') + str;
  }

  // Last 3 digits
  const lastThree = str.substring(str.length - 3);
  const remaining = str.substring(0, str.length - 3);

  // Group by 2 digits for everything before last 3
  const parts: string[] = [];
  let i = remaining.length;
  while (i > 0) {
    const chunkStart = Math.max(0, i - 2);
    parts.unshift(remaining.substring(chunkStart, i));
    i = chunkStart;
  }

  const grouped = parts.join(',') + ',' + lastThree;
  return (isNegative ? '-' : '') + grouped;
}

// Convert English digits to Bengali digits
export function toBnDigits(value: number | string): string {
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(value).replace(/[0-9]/g, (match) => bnDigits[parseInt(match, 10)]);
}

/**
 * Primary Currency Formatter
 * Example: formatBDT(100000) => "৳1,00,000"
 */
export function formatBDT(
  amount: number,
  options?: {
    isBengali?: boolean;
    showSign?: boolean;
    hideSymbol?: boolean;
  }
): string {
  const formattedNum = formatBangladeshiNumber(amount);
  const numString = options?.isBengali ? toBnDigits(formattedNum) : formattedNum;
  const symbol = options?.hideSymbol ? '' : '৳';

  if (options?.showSign && amount > 0) {
    return `+${symbol}${numString}`;
  }
  if (amount < 0) {
    return `-${symbol}${numString.replace('-', '')}`;
  }
  return `${symbol}${numString}`;
}

/**
 * Dhaka Date Formatter (Asia/Dhaka)
 * Example: "10 Nov 2026"
 */
export function formatDhakaDate(dateStringOrTimestamp: string | Date): string {
  if (!dateStringOrTimestamp) return '';
  const date = typeof dateStringOrTimestamp === 'string' ? new Date(dateStringOrTimestamp) : dateStringOrTimestamp;
  if (isNaN(date.getTime())) return String(dateStringOrTimestamp);

  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Dhaka',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

/**
 * Dhaka Time Formatter
 * Example: "04:30 PM"
 */
export function formatDhakaTime(dateStringOrTimestamp: string | Date): string {
  if (!dateStringOrTimestamp) return '';
  const date = typeof dateStringOrTimestamp === 'string' ? new Date(dateStringOrTimestamp) : dateStringOrTimestamp;
  if (isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Dhaka',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

/**
 * Dhaka Date and Time Formatter
 * Example: "10 Nov 2026, 04:30 PM"
 */
export function formatDhakaDateTime(dateStringOrTimestamp: string | Date): string {
  if (!dateStringOrTimestamp) return '';
  const date = typeof dateStringOrTimestamp === 'string' ? new Date(dateStringOrTimestamp) : dateStringOrTimestamp;
  if (isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Dhaka',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

/**
 * Get current date string in Asia/Dhaka YYYY-MM-DD
 */
export function getCurrentDhakaDateString(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Dhaka',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());

  const year = parts.find((p) => p.type === 'year')?.value;
  const month = parts.find((p) => p.type === 'month')?.value;
  const day = parts.find((p) => p.type === 'day')?.value;

  return `${year}-${month}-${day}`;
}
