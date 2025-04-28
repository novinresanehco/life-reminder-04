import { useTranslation } from "react-i18next";
import { MainLayout } from "@/components/layout/main-layout";
import { ItemList } from "@/components/items/item-list";
import { useEffect, useState } from "react";
import { useParams, Route } from "wouter";
import { useLocation } from "wouter";
import { ItemForm } from "@/components/items/item-form";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";

interface ItemsPageProps {
  itemType?: string; // TASK, PROJECT, GOAL, IDEA, NOTE
}

export default function ItemsPage({ itemType }: ItemsPageProps) {
  const { t } = useTranslation();
  const [location, navigate] = useLocation();
  const params = useParams();
  const [pageTitle, setPageTitle] = useState("");
  
  // Set page title based on item type
  useEffect(() => {
    if (itemType) {
      setPageTitle(t(`${itemType}s`));
    } else {
      setPageTitle(t('All Items'));
    }
  }, [itemType, t]);
  
  // If this is a "new" route, show the form
  if (location.endsWith('/new')) {
    return (
      <MainLayout>
        <div className="container mx-auto max-w-3xl">
          <h1 className="text-2xl font-bold mb-6">{t('Create New')} {itemType ? t(itemType) : t('Item')}</h1>
          <ItemForm defaultValues={{ type: itemType as "TASK" | "PROJECT" | "GOAL" | "IDEA" | "NOTE" | undefined }} />
        </div>
      </MainLayout>
    );
  }
  
  // If this is an "edit" route, show the form with existing item data
  if (location.match(/\/items\/\d+\/edit/)) {
    const itemId = parseInt(location.split('/')[2]);
    
    // Fetch item data
    const { data: item, isLoading } = useQuery({
      queryKey: [`/api/items/${itemId}`],
    });
    
    if (isLoading) {
      return (
        <MainLayout>
          <div className="animate-pulse">
            <div className="h-8 w-64 bg-neutral-200 rounded mb-6"></div>
            <Card className="w-full h-96"></Card>
          </div>
        </MainLayout>
      );
    }
    
    if (!item) {
      return (
        <MainLayout>
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-2">{t('Item Not Found')}</h2>
            <p className="text-neutral-600">{t('The item you are trying to edit does not exist')}</p>
          </div>
        </MainLayout>
      );
    }
    
    return (
      <MainLayout>
        <div className="container mx-auto max-w-3xl">
          <h1 className="text-2xl font-bold mb-6">{t('Edit')} {t(item && typeof item === 'object' && 'type' in item ? (item.type as string) : 'Item')}</h1>
          <ItemForm defaultValues={item} isEditing={true} />
        </div>
      </MainLayout>
    );
  }
  
  // Regular items list view
  return (
    <MainLayout>
      <div className="container mx-auto">
        <h1 className="text-2xl font-bold mb-6">{pageTitle}</h1>
        <ItemList itemType={itemType} />
      </div>
    </MainLayout>
  );
}
