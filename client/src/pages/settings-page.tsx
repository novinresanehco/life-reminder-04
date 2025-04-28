import { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { useLocale } from "@/hooks/use-locale";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const { locale, changeLocale } = useLocale();
  
  // Telegram settings
  const [telegramChatId, setTelegramChatId] = useState("");
  
  // Notification channels
  const [notificationChannels, setNotificationChannels] = useState({
    IN_APP: true,
    BROWSER: true,
    TELEGRAM: false,
  });
  
  // Fetch AI models
  const { data: aiModels = [], isLoading: isLoadingModels } = useQuery({
    queryKey: ['/api/ai-models'],
  });
  
  // Fetch user settings
  const { data: settings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['/api/user/settings'],
    onSuccess: (data) => {
      if (data) {
        // Update state with settings
        if (data.telegram_chat_id) {
          setTelegramChatId(data.telegram_chat_id);
        }
        
        if (data.notification_settings && data.notification_settings.channels) {
          setNotificationChannels(data.notification_settings.channels);
        }
      }
    }
  });
  
  // Update user locale
  const updateLocaleMutation = useMutation({
    mutationFn: async (newLocale: string) => {
      await apiRequest("PATCH", "/api/user/locale", { locale: newLocale });
    },
    onSuccess: () => {
      toast({
        title: t('Settings updated'),
        description: t('Your language and regional settings have been updated'),
      });
    },
    onError: (error) => {
      toast({
        title: t('Error'),
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Update user settings
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("POST", "/api/user/settings", data);
    },
    onSuccess: () => {
      toast({
        title: t('Settings updated'),
        description: t('Your settings have been saved successfully'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/user/settings'] });
    },
    onError: (error) => {
      toast({
        title: t('Error'),
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Update AI model status
  const updateModelStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number, isActive: boolean }) => {
      await apiRequest("PATCH", `/api/ai-models/${id}/status`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai-models'] });
      toast({
        title: t('Model status updated'),
        description: t('The AI model status has been updated'),
      });
    },
    onError: (error) => {
      toast({
        title: t('Error'),
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Handle language and calendar change
  const handleLocaleChange = (newLocale: string) => {
    changeLocale(newLocale);
    updateLocaleMutation.mutate(newLocale);
  };
  
  // Handle notification settings update
  const handleNotificationSettingsUpdate = () => {
    updateSettingsMutation.mutate({
      telegram_chat_id: telegramChatId,
      notification_settings: {
        channels: notificationChannels
      }
    });
  };
  
  // Toggle AI model activation
  const toggleModelActive = (id: number, currentValue: boolean) => {
    updateModelStatusMutation.mutate({ id, isActive: !currentValue });
  };
  
  return (
    <MainLayout>
      <div className="container mx-auto max-w-4xl py-6">
        <h1 className="text-3xl font-bold mb-6">{t('Settings')}</h1>
        
        <Tabs defaultValue="general">
          <TabsList className="mb-6">
            <TabsTrigger value="general">{t('General')}</TabsTrigger>
            <TabsTrigger value="ai-models">{t('AI Models')}</TabsTrigger>
            <TabsTrigger value="notifications">{t('Notifications')}</TabsTrigger>
            <TabsTrigger value="execution-modules">{t('Execution Modules')}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>{t('Language & Region')}</CardTitle>
                <CardDescription>
                  {t('Customize your language, calendar, and regional preferences')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="language">{t('Language & Calendar')}</Label>
                    <Select
                      value={locale}
                      onValueChange={handleLocaleChange}
                    >
                      <SelectTrigger id="language">
                        <SelectValue placeholder={t('Select language')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fa-IR">{t('Persian (Jalali Calendar)')}</SelectItem>
                        <SelectItem value="en-US">{t('English (Gregorian Calendar)')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-neutral-500">
                      {t('This setting controls both the interface language and date format')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="ai-models">
            <Card>
              <CardHeader>
                <CardTitle>{t('AI Model Management')}</CardTitle>
                <CardDescription>
                  {t('Configure which AI models are used for processing your items')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">{t('Ollama Local Models')}</h3>
                  <p className="text-sm text-neutral-600">{t('These are models discovered on your local Ollama installation')}</p>
                  
                  {isLoadingModels ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {aiModels.filter((model: any) => model.model_type === 'OLLAMA_LOCAL').map((model: any) => (
                        <div key={model.id} className="flex items-center justify-between py-2">
                          <div className="flex items-center">
                            <div className={cn(
                              "w-3 h-3 rounded-full mr-3",
                              model.is_active ? "bg-green-500" : "bg-neutral-300"
                            )} />
                            <div>
                              <p className="font-medium">{model.name}</p>
                              <p className="text-sm text-neutral-500">{t('Local Ollama Model')}</p>
                            </div>
                          </div>
                          <Switch
                            checked={model.is_active}
                            onCheckedChange={() => toggleModelActive(model.id, model.is_active)}
                          />
                        </div>
                      ))}
                      
                      {aiModels.filter((model: any) => model.model_type === 'OLLAMA_LOCAL').length === 0 && (
                        <p className="text-neutral-600 italic">{t('No local Ollama models discovered')}</p>
                      )}
                    </div>
                  )}
                  
                  <Separator className="my-4" />
                  
                  <h3 className="text-lg font-medium">{t('API Models')}</h3>
                  <p className="text-sm text-neutral-600">{t('External API-based models')}</p>
                  
                  {isLoadingModels ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {aiModels.filter((model: any) => model.model_type === 'API').map((model: any) => (
                        <div key={model.id} className="flex items-center justify-between py-2">
                          <div className="flex items-center">
                            <div className={cn(
                              "w-3 h-3 rounded-full mr-3",
                              model.is_active ? "bg-green-500" : "bg-neutral-300"
                            )} />
                            <div>
                              <p className="font-medium">{model.name}</p>
                              <p className="text-sm text-neutral-500">{t('API Model')}</p>
                            </div>
                          </div>
                          <Switch
                            checked={model.is_active}
                            onCheckedChange={() => toggleModelActive(model.id, model.is_active)}
                          />
                        </div>
                      ))}
                      
                      {aiModels.filter((model: any) => model.model_type === 'API').length === 0 && (
                        <p className="text-neutral-600 italic">{t('No API models configured')}</p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>{t('Notification Settings')}</CardTitle>
                <CardDescription>
                  {t('Configure how you receive notifications and alerts')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">{t('Notification Channels')}</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="in-app-notifications" className="font-medium">
                          {t('In-App Notifications')}
                        </Label>
                        <p className="text-sm text-neutral-500">
                          {t('Show notifications inside the application')}
                        </p>
                      </div>
                      <Switch
                        id="in-app-notifications"
                        checked={notificationChannels.IN_APP}
                        onCheckedChange={(checked) => 
                          setNotificationChannels({...notificationChannels, IN_APP: checked})
                        }
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="browser-notifications" className="font-medium">
                          {t('Browser Notifications')}
                        </Label>
                        <p className="text-sm text-neutral-500">
                          {t('Show browser push notifications')}
                        </p>
                      </div>
                      <Switch
                        id="browser-notifications"
                        checked={notificationChannels.BROWSER}
                        onCheckedChange={(checked) => 
                          setNotificationChannels({...notificationChannels, BROWSER: checked})
                        }
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="telegram-notifications" className="font-medium">
                          {t('Telegram Notifications')}
                        </Label>
                        <p className="text-sm text-neutral-500">
                          {t('Receive notifications via Telegram')}
                        </p>
                      </div>
                      <Switch
                        id="telegram-notifications"
                        checked={notificationChannels.TELEGRAM}
                        onCheckedChange={(checked) => 
                          setNotificationChannels({...notificationChannels, TELEGRAM: checked})
                        }
                      />
                    </div>
                  </div>
                  
                  {notificationChannels.TELEGRAM && (
                    <div className="pt-4 space-y-2">
                      <Label htmlFor="telegram-chat-id">{t('Telegram Chat ID')}</Label>
                      <Input
                        id="telegram-chat-id"
                        placeholder={t('Enter your Telegram Chat ID')}
                        value={telegramChatId}
                        onChange={(e) => setTelegramChatId(e.target.value)}
                      />
                      <p className="text-sm text-neutral-500">
                        {t('You can get your Chat ID from the Telegram bot')}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={handleNotificationSettingsUpdate}
                  disabled={updateSettingsMutation.isPending}
                >
                  {updateSettingsMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('Saving...')}
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      {t('Save Changes')}
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="execution-modules">
            <Card>
              <CardHeader>
                <CardTitle>{t('Execution Modules')}</CardTitle>
                <CardDescription>
                  {t('Connect external execution modules like n8n or custom scripts')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">{t('n8n Integration')}</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="n8n-url">{t('n8n Webhook URL')}</Label>
                    <Input
                      id="n8n-url"
                      placeholder="https://n8n.yourdomain.com/webhook/..."
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="n8n-api-key">{t('API Key')}</Label>
                    <Input
                      id="n8n-api-key"
                      type="password"
                      placeholder={t('Enter API key')}
                    />
                  </div>
                  
                  <div className="pt-4">
                    <Button variant="outline">
                      {t('Test Connection')}
                    </Button>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  {t('Save Changes')}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
