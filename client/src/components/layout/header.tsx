import { useAuth } from "@/hooks/use-auth";
import { useLocale } from "@/hooks/use-locale";
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useTranslation } from "react-i18next";
import { Bell, ChevronDown, Cog, LogOut, User, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export function Header() {
  const { t } = useTranslation();
  const { user, logoutMutation } = useAuth();
  const { locale, changeLocale } = useLocale();
  const [searchQuery, setSearchQuery] = useState("");
  
  // Get notifications
  const { data: notifications = [] } = useQuery({
    queryKey: ["/api/notifications"],
    enabled: !!user,
  });
  
  const unreadNotificationsCount = notifications.filter((n: any) => !n.is_read).length;
  
  // Toggle language
  const toggleLanguage = () => {
    // Toggle between fa-IR and en-US
    const newLocale = locale === "fa-IR" ? "en-US" : "fa-IR";
    changeLocale(newLocale);
  };
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  return (
    <header className="bg-white shadow-sm z-10">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="flex items-center">
              <svg className="h-8 w-8 text-primary-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
              </svg>
              <span className="mx-2 font-semibold text-lg text-neutral-900">{t('Intelligent LifeOS')}</span>
            </div>
            <div className="bg-neutral-100 rounded-md flex items-center px-3 py-1.5 md:w-72">
              <Search className="h-4 w-4 text-neutral-400 mx-2" />
              <Input 
                type="text" 
                placeholder={t('Search...')} 
                className="bg-transparent border-none w-full focus:outline-none text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          {user && (
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="relative">
                <Button variant="ghost" size="icon" className="bg-neutral-200 p-1 rounded-md">
                  <Bell className="h-5 w-5 text-neutral-600" />
                </Button>
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-destructive text-white rounded-full text-xs w-4 h-4 flex items-center justify-center">
                    {unreadNotificationsCount}
                  </span>
                )}
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="https://github.com/shadcn.png" alt={user.username} />
                      <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="hidden md:block font-medium text-sm">{user.username}</span>
                    <ChevronDown className="h-4 w-4 text-neutral-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href="/profile">
                      <div className="flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        <span>{t('Profile')}</span>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings">
                      <div className="flex items-center">
                        <Cog className="mr-2 h-4 w-4" />
                        <span>{t('Settings')}</span>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{t('Logout')}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Button 
                variant="ghost" 
                size="sm" 
                className="bg-neutral-100 p-1.5 rounded-md text-neutral-600"
                onClick={toggleLanguage}
              >
                <span className="text-sm font-medium">
                  {locale === "fa-IR" ? "فا" : "EN"}
                </span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
