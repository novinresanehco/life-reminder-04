import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Item } from "@shared/schema";
import { useTranslation } from "react-i18next";
import { useDate } from "@/hooks/use-date";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

// Map importance levels to colors
const importanceColors = {
  LOW: "bg-neutral-400 text-white",
  MEDIUM: "bg-blue-500 text-white",
  HIGH: "bg-amber-500 text-white",
  CRITICAL: "bg-red-500 text-white"
};

// Map item types to icons
const itemTypeIcons = {
  TASK: "fas fa-tasks",
  PROJECT: "fas fa-project-diagram",
  GOAL: "fas fa-bullseye",
  IDEA: "fas fa-lightbulb",
  NOTE: "fas fa-sticky-note"
};

interface ItemCardProps {
  item: Item;
  className?: string;
}

export function ItemCard({ item, className }: ItemCardProps) {
  const { t } = useTranslation();
  const { format } = useDate();
  const [location, navigate] = useLocation();
  
  const handleClick = () => {
    navigate(`/items/${item.id}`);
  };
  
  return (
    <Card 
      className={cn("cursor-pointer hover:shadow-md transition-shadow", className)} 
      onClick={handleClick}
    >
      <CardHeader className="pb-2 pt-4 px-4 flex flex-row justify-between items-start">
        <div>
          <h3 className="font-medium text-base line-clamp-2">{item.title}</h3>
          <div className="flex mt-1 gap-2">
            <Badge variant="outline">{t(item.type)}</Badge>
            <Badge 
              className={importanceColors[item.importance] || "bg-neutral-400"}
            >
              {t(item.importance)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {item.description && (
          <p className="text-sm text-neutral-600 line-clamp-3 mb-3">
            {item.description}
          </p>
        )}
        
        <div className="flex justify-between items-center text-xs text-neutral-500">
          <div>
            {t('Status')}: <span className="font-medium">{t(item.status)}</span>
          </div>
          {item.due_date && (
            <div>
              {t('Due')}: <span className="font-medium">{format(new Date(item.due_date), 'PP')}</span>
            </div>
          )}
        </div>
        
        {item.tags && item.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {item.tags.map((tag, index) => (
              <span key={index} className="px-2 py-1 text-xs bg-neutral-100 text-neutral-700 rounded-md">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
