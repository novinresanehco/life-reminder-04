import { useCallback } from 'react';
import { useLocale } from './use-locale';
import { format as formatJalali, parse as parseJalali, isValid as isValidJalali } from 'date-fns-jalali';
import { format as formatGregorian, parse as parseGregorian, isValid as isValidGregorian } from 'date-fns';

export function useDate() {
  const { locale, isRTL, calendar } = useLocale();

  const format = useCallback((date: Date, formatString: string): string => {
    if (!date || !isValidGregorian(date)) return '';
    
    if (calendar === 'jalali') {
      return formatJalali(date, formatString, { locale: isRTL ? 'fa-IR' : 'en-US' });
    } else {
      return formatGregorian(date, formatString, { locale: isRTL ? 'fa-IR' : 'en-US' });
    }
  }, [calendar, isRTL]);

  const parse = useCallback((dateString: string, formatString: string, baseDate: Date): Date => {
    if (!dateString) return new Date(NaN);
    
    if (calendar === 'jalali') {
      return parseJalali(dateString, formatString, baseDate || new Date());
    } else {
      return parseGregorian(dateString, formatString, baseDate || new Date());
    }
  }, [calendar]);

  const isValid = useCallback((date: Date): boolean => {
    if (!date) return false;
    
    if (calendar === 'jalali') {
      return isValidJalali(date);
    } else {
      return isValidGregorian(date);
    }
  }, [calendar]);

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
