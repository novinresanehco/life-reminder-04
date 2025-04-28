import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { AuthForm } from "@/components/auth/auth-form";
import { useLocale } from "@/hooks/use-locale";
import { Button } from "@/components/ui/button";

export default function AuthPage() {
  const { t } = useTranslation();
  const [location, navigate] = useLocation();
  const { user, isLoading } = useAuth();
  const { isRTL, changeLocale } = useLocale();
  
  // Redirect to home if user is logged in
  useEffect(() => {
    if (user && !isLoading) {
      navigate("/");
    }
  }, [user, isLoading, navigate]);
  
  // Toggle language
  const toggleLanguage = () => {
    const newLocale = isRTL ? "en-US" : "fa-IR";
    changeLocale(newLocale);
  };
  
  return (
    <div className="min-h-screen flex flex-col" dir={isRTL ? "rtl" : "ltr"}>
      {/* Language switcher */}
      <div className="absolute top-4 right-4">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={toggleLanguage}
        >
          {isRTL ? "English" : "فارسی"}
        </Button>
      </div>
      
      {/* Two-column layout */}
      <div className="flex flex-1">
        {/* Left column: form */}
        <div className="w-full max-w-md p-8 mx-auto flex items-center justify-center">
          <div className="w-full">
            <div className="mb-8 text-center">
              <div className="flex justify-center mb-4">
                <svg className="h-12 w-12 text-primary-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
                </svg>
              </div>
              <h1 className="text-2xl font-bold">{t('Intelligent LifeOS')}</h1>
              <p className="text-neutral-600 mt-2">{t('Sign in to continue to your dashboard')}</p>
            </div>
            
            <AuthForm />
          </div>
        </div>
        
        {/* Right column: hero section */}
        <div className="hidden lg:flex w-1/2 bg-primary-600 text-white p-12 flex-col justify-center">
          <div className="max-w-md mx-auto">
            <h2 className="text-3xl font-bold mb-6">{t('Organize Your Life, Amplify Your Potential')}</h2>
            
            <div className="space-y-6">
              <div className="flex items-start">
                <div className="flex-shrink-0 p-1 bg-primary-400 rounded-full">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-xl font-semibold">{t('AI-Powered Insights')}</h3>
                  <p className="mt-1 text-primary-100">{t('Let our intelligent system analyze your tasks and provide actionable insights.')}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex-shrink-0 p-1 bg-primary-400 rounded-full">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-xl font-semibold">{t('Multiple Calendar Support')}</h3>
                  <p className="mt-1 text-primary-100">{t('Seamlessly switch between Jalali and Gregorian calendars based on your preference.')}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex-shrink-0 p-1 bg-primary-400 rounded-full">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-xl font-semibold">{t('Bilingual Interface')}</h3>
                  <p className="mt-1 text-primary-100">{t('Use the platform in Persian or English with full RTL/LTR support.')}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex-shrink-0 p-1 bg-primary-400 rounded-full">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-xl font-semibold">{t('Proactive Intelligence')}</h3>
                  <p className="mt-1 text-primary-100">{t('Get notifications and suggestions before issues arise.')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
