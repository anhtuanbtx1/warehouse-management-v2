/**
 * Utility functions for date/time formatting with Vietnam timezone
 */

/**
 * Convert database datetime to Vietnam timezone
 * @param dateString - Date string from database
 * @returns Date object adjusted to Vietnam timezone
 */
export const convertToVietnamTime = (dateString: string): Date => {
  let date = new Date(dateString);
  
  // Nếu database trả về UTC time mà không có timezone indicator
  // thì cần adjust cho múi giờ VN (+7 UTC)
  if (!dateString.includes('Z') && !dateString.includes('+') && !dateString.includes('-', 10)) {
    // Thêm 7 giờ cho múi giờ VN
    date = new Date(date.getTime() + (7 * 60 * 60 * 1000));
  }
  
  return date;
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
