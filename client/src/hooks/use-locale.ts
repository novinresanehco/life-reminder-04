import { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from './use-auth';

type LocaleSettings = {
  locale: string;
  language: 'fa' | 'en';
  calendar: 'jalali' | 'gregorian';
  isRTL: boolean;
};

export function useLocale(): LocaleSettings & {
  changeLocale: (newLocale: string) => Promise<void>;
} {
  const { i18n } = useTranslation();
  const { user, updateLocaleMutation } = useAuth();
  
  // Parse user's locale preference
  const userLocale = user?.locale || 'fa-IR';
  const [language, region] = userLocale.split('-');
  
  // Set default values based on locale
  const isRTL = language === 'fa';
  const calendar = language === 'fa' ? 'jalali' : 'gregorian';
  
  // Update document direction and language when locale changes
  useEffect(() => {
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    
    // Set i18next language
    if (i18n.language !== language) {
      i18n.changeLanguage(language);
    }
  }, [isRTL, language, i18n]);
  
  // Function to change locale
  const changeLocale = useCallback(async (newLocale: string) => {
    if (user) {
      await updateLocaleMutation.mutateAsync({ locale: newLocale });
    }
  }, [user, updateLocaleMutation]);
  
  return {
    locale: userLocale,
    language: language as 'fa' | 'en',
    calendar: calendar as 'jalali' | 'gregorian',
    isRTL,
    changeLocale
  };
}
