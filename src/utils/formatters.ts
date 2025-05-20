
/**
 * Format a number as currency
 * @param value The number to format
 * @returns A formatted string with 2 decimal places
 */
export const formatCurrency = (value: number): string => {
  // Safety check for non-number values
  if (typeof value !== 'number' || isNaN(value)) {
    return '0.00';
  }

  return value.toFixed(2);
};

/**
 * Format a date string to a readable format
 * @param dateString ISO date string
 * @returns Formatted date string
 */
export const formatDate = (dateString?: string | null): string => {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  } catch (e) {
    console.error('Error formatting date:', e);
    return 'Invalid date';
  }
};

/**
 * Truncate a string to a maximum length
 * @param str String to truncate
 * @param maxLength Maximum length before truncating
 * @returns Truncated string with ellipsis if needed
 */
export const truncateString = (str: string, maxLength: number): string => {
  if (!str) return '';
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + '...';
};
