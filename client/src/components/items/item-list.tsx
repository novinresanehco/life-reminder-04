import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Item } from "@shared/schema";
import { useTranslation } from "react-i18next";
import { ItemCard } from "./item-card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Search, Filter } from "lucide-react";
import { useLocation } from "wouter";
import { useLocale } from "@/hooks/use-locale";
import { cn } from "@/lib/utils";

interface ItemListProps {
  itemType?: string;
  showFilters?: boolean;
  showCreateButton?: boolean;
  limit?: number;
}

export function ItemList({ 
  itemType, 
  showFilters = true, 
  showCreateButton = true,
  limit
}: ItemListProps) {
  const { t } = useTranslation();
  const [location, navigate] = useLocation();
  const { isRTL } = useLocale();
  
  // State for filters
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("");
  const [importance, setImportance] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("updated_at");
  const [sortOrder, setSortOrder] = useState<string>("desc");
  
  // Prepare query parameters
  const queryParams = new URLSearchParams();
  if (itemType) queryParams.append("type", itemType);
  if (status) queryParams.append("status", status);
  if (importance) queryParams.append("importance", importance);
  if (search) queryParams.append("search", search);
  if (sortBy) queryParams.append("sortBy", sortBy);
  if (sortOrder) queryParams.append("sortOrder", sortOrder);
  if (limit) queryParams.append("limit", limit.toString());
  
  // Fetch items based on filters
  const { data: items, isLoading, error } = useQuery<Item[]>({
    queryKey: [`/api/items?${queryParams.toString()}`],
  });
  
  // Create new item
  const handleCreateItem = () => {
    navigate(itemType ? `/${itemType.toLowerCase()}s/new` : "/items/new");
  };
  
  if (error) {
    return <div className="p-4 text-red-500">{t("Error loading items")}</div>;
  }
  
  return (
    <div className="space-y-6">
      {/* Filters and actions */}
      {showFilters && (
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("Search items...")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`pl-10 ${isRTL ? 'pr-4' : 'pl-10'}`}
            />
          </div>
          
          <div className="flex gap-2 flex-wrap">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder={t("Status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">{t("All Statuses")}</SelectItem>
                <SelectItem value="TODO">{t("TODO")}</SelectItem>
                <SelectItem value="IN_PROGRESS">{t("IN_PROGRESS")}</SelectItem>
                <SelectItem value="DONE">{t("DONE")}</SelectItem>
                <SelectItem value="ARCHIVED">{t("ARCHIVED")}</SelectItem>
                <SelectItem value="BACKLOG">{t("BACKLOG")}</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={importance} onValueChange={setImportance}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder={t("Importance")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">{t("All Levels")}</SelectItem>
                <SelectItem value="LOW">{t("LOW")}</SelectItem>
                <SelectItem value="MEDIUM">{t("MEDIUM")}</SelectItem>
                <SelectItem value="HIGH">{t("HIGH")}</SelectItem>
                <SelectItem value="CRITICAL">{t("CRITICAL")}</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder={t("Sort By")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="updated_at">{t("Last Updated")}</SelectItem>
                <SelectItem value="created_at">{t("Created Date")}</SelectItem>
                <SelectItem value="due_date">{t("Due Date")}</SelectItem>
                <SelectItem value="title">{t("Title")}</SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              title={sortOrder === "asc" ? t("Ascending") : t("Descending")}
            >
              <Filter className={cn("h-4 w-4", sortOrder === "asc" ? "" : "rotate-180")} />
            </Button>
          </div>
          
          {showCreateButton && (
            <Button onClick={handleCreateItem}>
              <Plus className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
              {t("New Item")}
            </Button>
          )}
        </div>
      )}
      
      {/* Items grid */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : items?.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">{t("No items found")}</p>
          {showCreateButton && (
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={handleCreateItem}
            >
              <Plus className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
              {t("Create your first item")}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
