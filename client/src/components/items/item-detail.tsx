import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useDate } from "@/hooks/use-date";
import { useLocale } from "@/hooks/use-locale";
import { ItemWithRelations } from "@shared/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Share, MoreHorizontal, Edit, ChevronLeft, Paperclip, AtSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "wouter";
import { AIInsight } from "@/components/ai/ai-insight";
import { DeepThoughtLog } from "@/components/ai/deep-thought-log";

interface ItemDetailProps {
  itemId: number;
}

export function ItemDetail({ itemId }: ItemDetailProps) {
  const { t } = useTranslation();
  const { format } = useDate();
  const { isRTL } = useLocale();
  const [comment, setComment] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  
  // Fetch item data
  const { data: item, isLoading, error } = useQuery<ItemWithRelations>({
    queryKey: [`/api/items/${itemId}`],
  });
  
  // Function to handle comment submission
  const submitComment = async () => {
    if (!comment.trim()) return;
    
    try {
      await fetch(`/api/items/${itemId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: comment }),
        credentials: "include",
      });
      
      // Reset form and refetch data
      setComment("");
      // queryClient.invalidateQueries([`/api/items/${itemId}`]);
    } catch (error) {
      console.error("Failed to submit comment:", error);
    }
  };
  
  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }
  
  if (error || !item) {
    return <div className="p-6">Error loading item details</div>;
  }
  
  // Get importance color
  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case "LOW": return "bg-importance-low";
      case "MEDIUM": return "bg-importance-medium";
      case "HIGH": return "bg-importance-high";
      case "CRITICAL": return "bg-importance-critical";
      default: return "bg-importance-medium";
    }
  };
  
  return (
    <main className="flex-1 overflow-y-auto bg-neutral-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center mb-6 text-sm">
          <Link href="/">
            <a className="text-neutral-500 hover:text-neutral-700">{t('Dashboard')}</a>
          </Link>
          <ChevronLeft className={cn("mx-2 text-neutral-400 h-4 w-4", isRTL && "rotate-180")} />
          <Link href={`/${item.type.toLowerCase()}s`}>
            <a className="text-neutral-500 hover:text-neutral-700">{t(item.type + 's')}</a>
          </Link>
          <ChevronLeft className={cn("mx-2 text-neutral-400 h-4 w-4", isRTL && "rotate-180")} />
          <span className="text-neutral-800 font-medium">{item.title}</span>
        </div>
        
        {/* Item Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="flex items-center">
              <h1 className="text-2xl font-semibold text-neutral-900">{item.title}</h1>
              <Badge className={cn("ml-3 px-2 py-0.5 text-xs rounded-md text-white font-medium", getImportanceColor(item.importance))}>
                {t(item.importance)}
              </Badge>
            </div>
            <div className="mt-1 text-neutral-500 flex items-center text-sm">
              <span>{t(item.type)}</span>
              <span className="mx-2">•</span>
              <span>
                {t('Last updated')}: {format(new Date(item.updated_at), 'PPP')}
              </span>
              {item.due_date && (
                <>
                  <span className="mx-2">•</span>
                  <span>
                    {t('Due date')}: {format(new Date(item.due_date), 'PPP')}
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <Button variant="outline" size="icon">
              <Share className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="mb-6 border-b border-neutral-200">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-transparent border-b-0">
              <TabsTrigger 
                value="overview" 
                className={cn(
                  "py-3 px-4 rounded-none border-b-2 data-[state=active]:border-primary-500 data-[state=active]:text-primary-600 font-medium",
                  "data-[state=inactive]:border-transparent data-[state=inactive]:text-neutral-500",
                  "hover:text-neutral-700 hover:border-neutral-300 focus:outline-none"
                )}
              >
                {t('Overview')}
              </TabsTrigger>
              <TabsTrigger 
                value="ai-insights" 
                className={cn(
                  "py-3 px-4 rounded-none border-b-2 data-[state=active]:border-primary-500 data-[state=active]:text-primary-600 font-medium",
                  "data-[state=inactive]:border-transparent data-[state=inactive]:text-neutral-500",
                  "hover:text-neutral-700 hover:border-neutral-300 focus:outline-none"
                )}
              >
                {t('AI Insights')}
              </TabsTrigger>
              <TabsTrigger 
                value="deep-thought-logs" 
                className={cn(
                  "py-3 px-4 rounded-none border-b-2 data-[state=active]:border-primary-500 data-[state=active]:text-primary-600 font-medium",
                  "data-[state=inactive]:border-transparent data-[state=inactive]:text-neutral-500",
                  "hover:text-neutral-700 hover:border-neutral-300 focus:outline-none"
                )}
              >
                {t('Deep Thought Logs')}
              </TabsTrigger>
            </TabsList>
            
            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-8 pt-4">
              {/* Item Details */}
              <Card>
                <CardContent className="p-5">
                  <div className="flex justify-between mb-4">
                    <h3 className="font-medium text-lg">{t('Description')}</h3>
                    <Button variant="ghost" size="icon">
                      <Edit className="h-4 w-4 text-neutral-400" />
                    </Button>
                  </div>
                  
                  <p className="text-neutral-700 leading-relaxed">
                    {item.description || t('No description provided.')}
                  </p>
                  
                  {item.tags && item.tags.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {item.tags.map((tag, index) => (
                        <span key={index} className="px-2 py-1 bg-neutral-100 text-neutral-700 rounded-md text-sm">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {/* Item Relations */}
                  {item.relations && (
                    Object.values(item.relations).some(arr => arr.length > 0) && (
                      <div className="mt-6">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-medium text-neutral-800">{t('Relations')}</h4>
                          <Button variant="link" className="text-primary-500 text-sm p-0 h-auto">
                            + {t('Add Relation')}
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {item.relations.parents.map((rel, index) => (
                            <div key={`parent-${index}`} className="flex items-center justify-between p-2 bg-neutral-50 rounded-md">
                              <div className="flex items-center">
                                <span className="mr-1 p-1 bg-neutral-200 rounded-md">
                                  <i className={`fas fa-${rel.item.type.toLowerCase()} text-neutral-600 text-sm`}></i>
                                </span>
                                <span className="mr-2 text-sm">{rel.item.title}</span>
                                <Badge variant="outline" className="text-xs">{t(rel.item.type)}</Badge>
                              </div>
                              <span className="text-xs text-neutral-500">{t('Parent')}</span>
                            </div>
                          ))}
                          
                          {item.relations.children.map((rel, index) => (
                            <div key={`child-${index}`} className="flex items-center justify-between p-2 bg-neutral-50 rounded-md">
                              <div className="flex items-center">
                                <span className="mr-1 p-1 bg-neutral-200 rounded-md">
                                  <i className={`fas fa-${rel.item.type.toLowerCase()} text-neutral-600 text-sm`}></i>
                                </span>
                                <span className="mr-2 text-sm">{rel.item.title}</span>
                                <Badge variant="outline" className="text-xs">{t(rel.item.type)}</Badge>
                              </div>
                              <span className="text-xs text-neutral-500">{t('Child')}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  )}
                </CardContent>
              </Card>
              
              {/* AI Analysis */}
              {item.aiInsights && item.aiInsights.length > 0 && (
                <Card className="overflow-hidden">
                  <CardHeader className="border-b border-neutral-200 bg-neutral-50 px-5 py-3 flex justify-between items-center">
                    <div className="flex items-center">
                      <i className="fas fa-robot text-primary-500 mr-2"></i>
                      <h3 className="font-medium">{t('AI Analysis')}</h3>
                    </div>
                    <div className="flex items-center text-sm text-neutral-500">
                      <i className="fas fa-info-circle mr-1"></i>
                      <span>{t('Generated with {{count}} AI models', { count: 4 })}</span>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="p-0">
                    {/* Action Plan */}
                    {item.aiInsights[0].content.actionItems && (
                      <div className="p-5">
                        <h4 className="font-medium mb-3">{t('Action Plan (AI Generated)')}</h4>
                        <div className="space-y-2">
                          {item.aiInsights[0].content.actionItems.map((action: any, index: number) => (
                            <div key={index} className="flex items-start">
                              <Checkbox id={`action-${index}`} className="mt-1 mr-3" />
                              <div>
                                <label htmlFor={`action-${index}`} className="text-neutral-700 cursor-pointer">
                                  {action.title}
                                </label>
                                {action.description && (
                                  <div className="flex items-center text-sm text-neutral-500 mt-1">
                                    <span className="bg-neutral-100 px-2 py-0.5 rounded text-xs">
                                      {action.deadline ? format(new Date(action.deadline), 'PP') : t('No deadline')}
                                    </span>
                                    <span className="ml-2">{action.description}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Risk Assessment */}
                    {item.aiInsights[0].content.risks && (
                      <div className="border-t border-neutral-200 p-5">
                        <h4 className="font-medium mb-3">{t('Risk Assessment')}</h4>
                        <div className="space-y-3">
                          {item.aiInsights[0].content.risks.map((risk: any, index: number) => (
                            <div key={index} className="flex items-start">
                              <div className="flex-shrink-0 mr-3">
                                <span className={cn(
                                  "inline-flex items-center justify-center w-6 h-6 rounded-full text-white text-xs",
                                  risk.level === "HIGH" ? "bg-danger-500" : 
                                  risk.level === "MEDIUM" ? "bg-warning-500" : "bg-neutral-500"
                                )}>
                                  {t(risk.level)}
                                </span>
                              </div>
                              <div>
                                <p className="text-neutral-700">{risk.description}</p>
                                {risk.mitigation && (
                                  <p className="text-sm text-neutral-500 mt-1">
                                    {t('Suggestion')}: {risk.mitigation}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
              
              {/* Comments */}
              <Card>
                <CardContent className="p-5">
                  <h3 className="font-medium mb-4">{t('Comments')}</h3>
                  
                  <div className="mb-5 space-y-4">
                    {item.comments && item.comments.map((comment, index) => (
                      <div key={index} className="flex">
                        <Avatar className="mr-3 mt-1">
                          <AvatarImage src="https://github.com/shadcn.png" />
                          <AvatarFallback>UN</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center">
                            <span className="font-medium">User Name</span>
                            <span className="text-xs text-neutral-500 ml-2">
                              {format(new Date(comment.created_at), 'PPp')}
                            </span>
                          </div>
                          <p className="text-neutral-700 mt-1">{comment.content}</p>
                          <div className="mt-2">
                            <Button variant="ghost" className="text-sm text-neutral-500 hover:text-neutral-700 mr-4 p-0 h-auto">
                              {t('Reply')}
                            </Button>
                            <Button variant="ghost" className="text-sm text-neutral-500 hover:text-neutral-700 p-0 h-auto">
                              {t('React')}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Comment Input */}
                  <div className="flex mt-4">
                    <Avatar className="mr-3">
                      <AvatarImage src="https://github.com/shadcn.png" />
                      <AvatarFallback>UN</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <Textarea 
                        className="w-full border border-neutral-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                        rows={2}
                        placeholder={t('Write your comment...')}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                      />
                      <div className="flex justify-between mt-2">
                        <div className="flex space-x-2 space-x-reverse">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-500 hover:text-neutral-700">
                            <Paperclip className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-500 hover:text-neutral-700">
                            <AtSign className="h-4 w-4" />
                          </Button>
                        </div>
                        <Button 
                          size="sm" 
                          onClick={submitComment}
                          disabled={!comment.trim()}
                        >
                          {t('Send')}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* AI Insights Tab */}
            <TabsContent value="ai-insights" className="pt-4">
              {item.aiInsights && item.aiInsights.length > 0 ? (
                <div className="space-y-4">
                  {item.aiInsights.map((insight, index) => (
                    <AIInsight key={index} insight={insight} />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-6 text-center">
                    <p>{t('No AI insights available yet.')}</p>
                    <Button className="mt-4">
                      {t('Generate AI Insights')}
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            {/* Deep Thought Logs Tab */}
            <TabsContent value="deep-thought-logs" className="pt-4">
              {item.aiLogs && item.aiLogs.length > 0 ? (
                <div className="space-y-4">
                  {item.aiLogs.map((log, index) => (
                    <DeepThoughtLog key={index} log={log} />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-6 text-center">
                    <p>{t('No processing logs available.')}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </main>
  );
}
