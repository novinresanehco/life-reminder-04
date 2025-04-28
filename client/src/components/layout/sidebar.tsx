import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { Plus, Home, CheckSquare, GitFork, Target, Lightbulb, FileText, Settings } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useLocale } from "@/hooks/use-locale";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const { t } = useTranslation();
  const [location] = useLocation();
  const { isRTL } = useLocale();
  
  // Get AI models
  const { data: aiModels = [] } = useQuery({
    queryKey: ["/api/ai-models"],
  });
  
  const navigationItems = [
    { icon: Home, label: t('Dashboard'), path: "/" },
    { icon: CheckSquare, label: t('Tasks'), path: "/tasks" },
    { icon: GitFork, label: t('Projects'), path: "/projects" },
    { icon: Target, label: t('Goals'), path: "/goals" },
    { icon: Lightbulb, label: t('Ideas'), path: "/ideas" },
    { icon: FileText, label: t('Notes'), path: "/notes" },
  ];
  
  return (
    <aside className="w-60 bg-white border-l border-neutral-200 overflow-y-auto">
      <nav className="p-4">
        <div className="mb-6">
          <Button className="w-full flex items-center justify-center">
            <Plus className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
            <span>{t('New Item')}</span>
          </Button>
        </div>
        
        <ul>
          {navigationItems.map((item, index) => {
            const isActive = location === item.path;
            return (
              <li className="mb-1" key={index}>
                <Link href={item.path}>
                  <a className={cn(
                    "flex items-center py-2 px-3 rounded-md",
                    isActive 
                      ? "bg-primary-50 text-primary-500" 
                      : "hover:bg-neutral-100 text-neutral-700"
                  )}>
                    <item.icon className={cn("w-5 h-5", isRTL ? "ml-3" : "mr-3")} />
                    <span>{item.label}</span>
                  </a>
                </Link>
              </li>
            );
          })}
          
          <li className="mt-6 mb-2">
            <div className="flex items-center justify-between px-3">
              <span className="text-xs font-medium text-neutral-500">{t('AI Models')}</span>
              <Link href="/settings">
                <a className="text-neutral-400 text-xs hover:text-neutral-700">
                  <Settings className="h-3 w-3" />
                </a>
              </Link>
            </div>
          </li>
          
          {aiModels.map((model: any, index: number) => (
            <li className="mb-1 pr-3" key={index}>
              <div className="flex items-center text-sm text-neutral-600 py-1.5">
                <span className={cn(
                  "w-3 h-3 rounded-full mr-2",
                  isRTL ? "ml-3" : "mr-3",
                  model.is_active ? "bg-green-500" : "bg-neutral-300"
                )} />
                <span>{model.name}</span>
              </div>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
