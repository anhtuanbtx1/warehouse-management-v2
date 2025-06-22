/**
 * Utility functions for date/time formatting with Vietnam timezone
 */

/**
 * Convert database datetime to Vietnam timezone
 * @param dateString - Date string from database
 * @returns Date object (database already stores Vietnam time)
 */
export const convertToVietnamTime = (dateString: string): Date => {
  // Database already stores Vietnam time, no conversion needed
  return new Date(dateString);
};

/**
 * Format datetime for Vietnam locale
 * @param dateString - Date string from database
 * @returns Formatted datetime string
 */
export const formatDateTime = (dateString: string): string => {
  const date = convertToVietnamTime(dateString);
  
  return date.toLocaleString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

/**
 * Format date only for Vietnam locale
 * @param dateString - Date string from database
 * @returns Formatted date string
 */
export const formatDate = (dateString: string): string => {
  const date = convertToVietnamTime(dateString);
  
  return date.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

/**
 * Format date for charts (short format)
 * @param dateString - Date string from database
 * @returns Formatted date string for charts
 */
export const formatChartDate = (dateString: string): string => {
  const date = convertToVietnamTime(dateString);
  
  return date.toLocaleDateString('vi-VN', {
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Format currency for Vietnam locale
 * @param amount - Amount to format
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Get current Vietnam time
 * @returns Current date in Vietnam timezone
 * @deprecated Use getVietnamNow() from @/lib/timezone instead
 */
export const getCurrentVietnamTime = (): Date => {
  const now = new Date();
  // Convert to Vietnam timezone
  const vietnamTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Ho_Chi_Minh"}));
  return vietnamTime;
};

/**
 * Check if a date string needs timezone adjustment
 * @param dateString - Date string to check
 * @returns True if needs adjustment
 */
export const needsTimezoneAdjustment = (dateString: string): boolean => {
  return !dateString.includes('Z') && 
         !dateString.includes('+') && 
         !dateString.includes('-', 10);
};
