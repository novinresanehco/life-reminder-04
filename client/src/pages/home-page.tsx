import { useTranslation } from "react-i18next";
import { MainLayout } from "@/components/layout/main-layout";
import { ItemList } from "@/components/items/item-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { PieChart, Pie, ResponsiveContainer, Cell, Legend, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { useDate } from "@/hooks/use-date";
import { Plus, ChevronRight } from "lucide-react";
import { useLocale } from "@/hooks/use-locale";
import { cn } from "@/lib/utils";

// Define statistics type for better type checking
interface ItemStats {
  totalItems: number;
  byStatus: Array<{ name: string; value: number }>;
  byType: Array<{ name: string; value: number }>;
  byImportance: Array<{ name: string; value: number; color: string }>;
}

export default function HomePage() {
  const { t } = useTranslation();
  const [location, navigate] = useLocation();
  const { user } = useAuth();
  const { format } = useDate();
  const { isRTL } = useLocale();
  
  // Get current date - with error handling
  const today = new Date();
  let formattedDate = '';
  try {
    formattedDate = format(today, 'PPP');
  } catch (error) {
    console.error('Error formatting date:', error);
    formattedDate = today.toLocaleDateString();
  }
  
  // Fetch item statistics with proper typings
  const { data: stats } = useQuery<ItemStats>({
    queryKey: ['/api/stats'],
    queryFn: () => ({
      totalItems: 12,
      byStatus: [
        { name: t('TODO'), value: 5 },
        { name: t('IN_PROGRESS'), value: 3 },
        { name: t('DONE'), value: 4 },
      ],
      byType: [
        { name: t('TASK'), value: 6 },
        { name: t('PROJECT'), value: 2 },
        { name: t('GOAL'), value: 1 },
        { name: t('IDEA'), value: 2 },
        { name: t('NOTE'), value: 1 },
      ],
      byImportance: [
        { name: t('LOW'), value: 3, color: 'hsl(var(--importance-low))' },
        { name: t('MEDIUM'), value: 5, color: 'hsl(var(--importance-medium))' },
        { name: t('HIGH'), value: 3, color: 'hsl(var(--importance-high))' },
        { name: t('CRITICAL'), value: 1, color: 'hsl(var(--importance-critical))' },
      ]
    }),
  });
  
  // Safe access to stats data
  const safeStats = stats || {
    totalItems: 0,
    byStatus: [],
    byType: [],
    byImportance: []
  };
  
  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];
  
  return (
    <MainLayout>
      <div className="container mx-auto max-w-6xl">
        {/* Greeting */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">{t('Hello')}, {user?.username || t('User')}</h1>
          <p className="text-neutral-600 mt-1">{t('Today is')} {formattedDate}</p>
        </div>
        
        {/* Dashboard Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {/* Stats cards */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{t('Total Items')}</CardTitle>
              <CardDescription>{t('Across all categories')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{safeStats.totalItems}</div>
              <Button 
                variant="link" 
                className="px-0" 
                onClick={() => navigate('/items')}
              >
                {t('View all')} 
                <ChevronRight className={cn("h-4 w-4", isRTL && "rotate-180")} />
              </Button>
            </CardContent>
          </Card>
          
          {/* Importance distribution */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{t('Importance Levels')}</CardTitle>
              <CardDescription>{t('Distribution by priority')}</CardDescription>
            </CardHeader>
            <CardContent className="h-[150px]">
              {safeStats.byImportance && safeStats.byImportance.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={safeStats.byImportance}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={60}
                      paddingAngle={2}
                      dataKey="value"
                      nameKey="name"
                      label
                    >
                      {safeStats.byImportance.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-neutral-500">
                  {t('No data available')}
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Status distribution */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{t('Item Status')}</CardTitle>
              <CardDescription>{t('Progress overview')}</CardDescription>
            </CardHeader>
            <CardContent className="h-[150px]">
              {safeStats.byStatus && safeStats.byStatus.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={safeStats.byStatus}
                    margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                  >
                    <XAxis dataKey="name" fontSize={12} />
                    <YAxis hide />
                    <Tooltip />
                    <Bar dataKey="value" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-neutral-500">
                  {t('No data available')}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Tabs for different views */}
        <Tabs defaultValue="recent">
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="recent">{t('Recent Items')}</TabsTrigger>
              <TabsTrigger value="important">{t('Important Items')}</TabsTrigger>
              <TabsTrigger value="due-soon">{t('Due Soon')}</TabsTrigger>
            </TabsList>
            
            <Button onClick={() => navigate('/items/new')}>
              <Plus className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
              {t('New Item')}
            </Button>
          </div>
          
          <TabsContent value="recent" className="mt-0">
            <ItemList showFilters={false} showCreateButton={false} limit={6} />
          </TabsContent>
          
          <TabsContent value="important" className="mt-0">
            <ItemList 
              showFilters={false} 
              showCreateButton={false} 
              limit={6} 
            />
          </TabsContent>
          
          <TabsContent value="due-soon" className="mt-0">
            <ItemList 
              showFilters={false} 
              showCreateButton={false} 
              limit={6} 
            />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
