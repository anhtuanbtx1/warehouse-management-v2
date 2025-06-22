// Timezone utilities for Vietnam timezone handling
export const VIETNAM_TIMEZONE = 'Asia/Ho_Chi_Minh';

/**
 * Get current date in Vietnam timezone
 */
export function getVietnamDate(): Date {
  const now = new Date();
  // Proper timezone conversion for Vietnam (UTC+7)
  const vietnamTime = new Date(now.toLocaleString("en-US", { timeZone: VIETNAM_TIMEZONE }));
  return vietnamTime;
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
  // Get current time in Vietnam timezone
  const now = new Date();
  const vietnamTime = new Date(now.toLocaleString("en-US", { timeZone: VIETNAM_TIMEZONE }));

  // Format as YYYY-MM-DD
  const year = vietnamTime.getFullYear();
  const month = String(vietnamTime.getMonth() + 1).padStart(2, '0');
  const day = String(vietnamTime.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Get yesterday's date string in Vietnam timezone (YYYY-MM-DD format)
 */
export function getVietnamYesterday(): string {
  // Get current time in Vietnam timezone
  const now = new Date();
  const vietnamTime = new Date(now.toLocaleString("en-US", { timeZone: VIETNAM_TIMEZONE }));

  // Subtract one day
  vietnamTime.setDate(vietnamTime.getDate() - 1);

  // Format as YYYY-MM-DD
  const year = vietnamTime.getFullYear();
  const month = String(vietnamTime.getMonth() + 1).padStart(2, '0');
  const day = String(vietnamTime.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
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

/**
 * Get current Vietnam time as Date object
 * Use this for all database operations that need Vietnam time
 */
export function getVietnamNow(): Date {
  const now = new Date();
  // Add 7 hours to UTC to get Vietnam time (UTC+7)
  return new Date(now.getTime() + (7 * 60 * 60 * 1000));
}

/**
 * Get current Vietnam time as ISO string
 * Use this for database datetime fields
 */
export function getVietnamNowISO(): string {
  return getVietnamNow().toISOString();
}
