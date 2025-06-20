// Timezone utilities for Vietnam timezone handling
export const VIETNAM_TIMEZONE = 'Asia/Ho_Chi_Minh';

/**
 * Get current date in Vietnam timezone
 */
export function getVietnamDate(): Date {
  return new Date(new Date().toLocaleString("en-US", { timeZone: VIETNAM_TIMEZONE }));
}

/**
 * Format date for Vietnam timezone
 */
export function formatVietnamDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: VIETNAM_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    ...options
  };
  
  return dateObj.toLocaleDateString('vi-VN', defaultOptions);
}

/**
 * Format datetime for Vietnam timezone
 */
export function formatVietnamDateTime(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: VIETNAM_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    ...options
  };
  
  return dateObj.toLocaleString('vi-VN', defaultOptions);
}

/**
 * Get today's date string in Vietnam timezone (YYYY-MM-DD format)
 * This is crucial for Vercel deployment where server runs UTC but database stores +7 time
 */
export function getVietnamToday(): string {
  const vietnamDate = getVietnamDate();
  return vietnamDate.toISOString().split('T')[0];
}

/**
 * Get yesterday's date string in Vietnam timezone (YYYY-MM-DD format)
 */
export function getVietnamYesterday(): string {
  const vietnamDate = getVietnamDate();
  vietnamDate.setDate(vietnamDate.getDate() - 1);
  return vietnamDate.toISOString().split('T')[0];
}

/**
 * Get date range for current month in Vietnam timezone
 */
export function getVietnamCurrentMonth(): { start: string; end: string; year: number; month: number } {
  const vietnamDate = getVietnamDate();
  const year = vietnamDate.getFullYear();
  const month = vietnamDate.getMonth() + 1; // JavaScript months are 0-based

  const firstDay = new Date(year, vietnamDate.getMonth(), 1);
  const lastDay = new Date(year, vietnamDate.getMonth() + 1, 0);

  return {
    start: firstDay.toISOString().split('T')[0],
    end: lastDay.toISOString().split('T')[0],
    year,
    month
  };
}

/**
 * Get Vietnam timezone offset in hours
 */
export function getVietnamTimezoneOffset(): number {
  return 7; // UTC+7
}
