import { useCallback } from 'react';
import { useLocale } from './use-locale';
import { format as formatJalali, parse as parseJalali, isValid as isValidJalali } from 'date-fns-jalali';
import { format as formatGregorian, parse as parseGregorian, isValid as isValidGregorian, Locale } from 'date-fns';

export function useDate() {
  // Get locale information with fallback values for when the hook is called before auth is complete
  const localeInfo = useLocale();
  // Default values when locale info is not fully available yet
  const calendar = localeInfo?.calendar || 'gregorian';
  const isRTL = localeInfo?.isRTL || false;

  // Simple format function with strong error handling
  const format = useCallback((date: Date, formatString: string): string => {
    // Ensure date is valid
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      return '';
    }
    
    try {
      // Date-fns doesn't accept locale as string, so we can't use the string directly
      // Just use the default locale behavior instead
      if (calendar === 'jalali') {
        return formatJalali(date, formatString);
      } else {
        return formatGregorian(date, formatString);
      }
    } catch (error) {
      console.error('Error formatting date:', error);
      // Fallback to standard JavaScript formatting
      return date.toLocaleDateString();
    }
  }, [calendar]);

  const parse = useCallback((dateString: string, formatString: string, baseDate: Date): Date => {
    if (!dateString) return new Date(NaN);
    
    try {
      const baseDateToUse = baseDate || new Date();
      
      if (calendar === 'jalali') {
        return parseJalali(dateString, formatString, baseDateToUse);
      } else {
        return parseGregorian(dateString, formatString, baseDateToUse);
      }
    } catch (error) {
      console.error('Error parsing date:', error);
      return new Date();
    }
  }, [calendar]);

  const isValid = useCallback((date: Date): boolean => {
    if (!date || !(date instanceof Date)) return false;
    
    try {
      return !isNaN(date.getTime());
    } catch (error) {
      console.error('Error validating date:', error);
      return false;
    }
  }, []);

  const getToday = useCallback((): Date => {
    return new Date();
  }, []);

  return {
    format,
    parse,
    isValid,
    getToday,
    calendar
  };
}
