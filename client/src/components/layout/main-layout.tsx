import { ReactNode } from "react";
import { Header } from "./header";
import { Sidebar } from "./sidebar";
import { useLocale } from "@/hooks/use-locale";
import { NotificationToast } from "@/components/notifications/notification-toast";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { isRTL } = useLocale();
  
  return (
    <div className="h-screen flex flex-col" dir={isRTL ? "rtl" : "ltr"}>
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-neutral-50 p-6">
          {children}
        </main>
      </div>
      <NotificationToast />
    </div>
  );
}
