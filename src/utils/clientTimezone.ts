/**
 * Client-side timezone utilities for consistent Vietnam time handling
 * Works regardless of server timezone (UTC in production, Asia/Bangkok in dev)
 */

/**
 * Get current Vietnam date string (YYYY-MM-DD) from client-side
 * This ensures consistent date calculation regardless of server timezone
 */
export function getClientVietnamToday(): string {
  const now = new Date();
  
  // Force Vietnam timezone calculation on client-side
  const vietnamTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
  
  const year = vietnamTime.getFullYear();
  const month = String(vietnamTime.getMonth() + 1).padStart(2, '0');
  const day = String(vietnamTime.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Get yesterday's date in Vietnam timezone from client-side
 */
export function getClientVietnamYesterday(): string {
  const now = new Date();
  const vietnamTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
  
  // Subtract one day
  vietnamTime.setDate(vietnamTime.getDate() - 1);
  
  const year = vietnamTime.getFullYear();
  const month = String(vietnamTime.getMonth() + 1).padStart(2, '0');
  const day = String(vietnamTime.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Get current month info in Vietnam timezone from client-side
 */
export function getClientVietnamCurrentMonth() {
  const now = new Date();
  const vietnamTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
  
  const year = vietnamTime.getFullYear();
  const month = vietnamTime.getMonth() + 1;
  
  // First and last day of current month
  const firstDay = new Date(year, vietnamTime.getMonth(), 1);
  const lastDay = new Date(year, vietnamTime.getMonth() + 1, 0);
  
  return {
    start: `${year}-${String(month).padStart(2, '0')}-01`,
    end: `${year}-${String(month).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`,
    year,
    month
  };
}

/**
 * Check if we're in production environment
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Get timezone-corrected API URL with client-calculated dates
 * This bypasses server timezone issues by sending correct dates from client
 */
export function getTimezoneAwareApiUrl(baseUrl: string, additionalParams?: Record<string, string>): string {
  const today = getClientVietnamToday();
  const yesterday = getClientVietnamYesterday();
  const currentMonth = getClientVietnamCurrentMonth();
  
  const params = new URLSearchParams({
    clientToday: today,
    clientYesterday: yesterday,
    clientMonth: currentMonth.month.toString(),
    clientYear: currentMonth.year.toString(),
    timezoneOverride: 'true',
    ...additionalParams
  });
  
  return `${baseUrl}?${params.toString()}`;
}

/**
 * Debug info for timezone troubleshooting
 */
export function getClientTimezoneDebug() {
  const now = new Date();
  const vietnamTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
  
  return {
    clientTime: now.toISOString(),
    clientTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    vietnamTime: vietnamTime.toISOString(),
    vietnamToday: getClientVietnamToday(),
    vietnamYesterday: getClientVietnamYesterday(),
    currentMonth: getClientVietnamCurrentMonth(),
    environment: process.env.NODE_ENV || 'development',
    note: 'Client-side Vietnam timezone calculation - independent of server timezone'
  };
}
