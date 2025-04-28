import { useParams } from "wouter";
import { MainLayout } from "@/components/layout/main-layout";
import { ItemDetail } from "@/components/items/item-detail";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { Edit, ArrowLeft } from "lucide-react";
import { useLocale } from "@/hooks/use-locale";
import { cn } from "@/lib/utils";

export default function ItemDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const [location, navigate] = useLocation();
  const { isRTL } = useLocale();
  
  // Fetch item to check if it exists
  const { data: item, isLoading, error } = useQuery({
    queryKey: [`/api/items/${id}`],
  });
  
  const handleEdit = () => {
    navigate(`/items/${id}/edit`);
  };
  
  const handleBack = () => {
    window.history.back();
  };
  
  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-full">
          <div className="animate-pulse text-center">
            <div className="h-8 w-48 bg-neutral-200 rounded mb-4 mx-auto"></div>
            <div className="h-4 w-64 bg-neutral-200 rounded mx-auto"></div>
          </div>
        </div>
      </MainLayout>
    );
  }
  
  if (error || !item) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-2">{t('Item Not Found')}</h2>
          <p className="text-neutral-600 mb-6">{t('The item you are looking for does not exist or you do not have permission to view it.')}</p>
          <Button onClick={() => navigate('/')}>{t('Go to Dashboard')}</Button>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <div className="mb-4 flex items-center justify-between">
        <Button 
          variant="ghost" 
          onClick={handleBack} 
          className="flex items-center"
        >
          <ArrowLeft className={cn("h-4 w-4", isRTL ? "ml-2 rotate-180" : "mr-2")} />
          {t('Back')}
        </Button>
        
        <Button 
          variant="outline"
          onClick={handleEdit}
          className="flex items-center"
        >
          <Edit className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
          {t('Edit')}
        </Button>
      </div>
      
      <ItemDetail itemId={parseInt(id)} />
    </MainLayout>
  );
}
