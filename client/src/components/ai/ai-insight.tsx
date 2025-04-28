import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AIAnalysisResult } from "@shared/schema";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { useDate } from "@/hooks/use-date";
import { 
  Brain, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Calendar, 
  ArrowRightCircle 
} from "lucide-react";

interface AIInsightProps {
  insight: AIAnalysisResult;
}

export function AIInsight({ insight }: AIInsightProps) {
  const { t } = useTranslation();
  const { format } = useDate();
  
  // Function to determine an appropriate icon based on the processing strategy
  const getStrategyIcon = (strategy: string) => {
    switch (strategy) {
      case "SINGLE_BASIC":
        return <Brain className="h-5 w-5 text-neutral-500" />;
      case "SINGLE_BEST":
        return <Brain className="h-5 w-5 text-primary-500" />;
      case "MULTI_MODEL_SELECTIVE":
        return <Brain className="h-5 w-5 text-amber-500" />;
      case "ALL_ENCOMPASSING":
        return <Brain className="h-5 w-5 text-red-500" />;
      default:
        return <Brain className="h-5 w-5" />;
    }
  };
  
  // Get the appropriate badge color for the processing strategy
  const getStrategyBadgeClass = (strategy: string) => {
    switch (strategy) {
      case "SINGLE_BASIC":
        return "bg-neutral-100 text-neutral-700";
      case "SINGLE_BEST":
        return "bg-blue-100 text-blue-700";
      case "MULTI_MODEL_SELECTIVE":
        return "bg-amber-100 text-amber-700";
      case "ALL_ENCOMPASSING":
        return "bg-red-100 text-red-700";
      default:
        return "bg-neutral-100 text-neutral-700";
    }
  };
  
  // Helper to safely render dynamic content from AI
  const renderContent = (content: any) => {
    if (!content) return null;
    
    return (
      <div className="space-y-4">
        {/* Summary section */}
        {content.summary && (
          <div className="bg-neutral-50 p-3 rounded-md">
            <h4 className="font-medium text-neutral-800 mb-2">{t('Summary')}</h4>
            <p className="text-neutral-700">{content.summary}</p>
          </div>
        )}
        
        {/* Action Items section */}
        {content.actionItems && content.actionItems.length > 0 && (
          <div>
            <h4 className="font-medium text-neutral-800 mb-2">{t('Action Items')}</h4>
            <div className="space-y-2">
              {content.actionItems.map((item: any, index: number) => (
                <div key={index} className="flex items-start">
                  <ArrowRightCircle className="h-5 w-5 text-primary-500 mr-2 mt-0.5" />
                  <div>
                    <div className="font-medium">{item.title}</div>
                    {item.description && <div className="text-sm text-neutral-600">{item.description}</div>}
                    {item.deadline && (
                      <div className="flex items-center mt-1 text-sm text-neutral-500">
                        <Calendar className="h-3 w-3 mr-1" />
                        <span>{format(new Date(item.deadline), 'PP')}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Risks section */}
        {content.risks && content.risks.length > 0 && (
          <div>
            <h4 className="font-medium text-neutral-800 mb-2">{t('Risk Assessment')}</h4>
            <div className="space-y-2">
              {content.risks.map((risk: any, index: number) => (
                <div key={index} className="flex items-start">
                  <AlertTriangle className={cn(
                    "h-5 w-5 mr-2 mt-0.5",
                    risk.level === "HIGH" ? "text-red-500" :
                    risk.level === "MEDIUM" ? "text-amber-500" : "text-neutral-500"
                  )} />
                  <div>
                    <div className="font-medium">{risk.description}</div>
                    {risk.mitigation && (
                      <div className="text-sm text-neutral-600">
                        <span className="font-medium">{t('Mitigation')}:</span> {risk.mitigation}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Benefits/Advantages section */}
        {content.benefits && content.benefits.length > 0 && (
          <div>
            <h4 className="font-medium text-neutral-800 mb-2">{t('Benefits')}</h4>
            <div className="space-y-2">
              {content.benefits.map((benefit: any, index: number) => (
                <div key={index} className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                  <div>{benefit}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Timeline section */}
        {content.timeline && content.timeline.length > 0 && (
          <div>
            <h4 className="font-medium text-neutral-800 mb-2">{t('Timeline')}</h4>
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute top-0 left-4 h-full w-0.5 bg-neutral-200"></div>
              
              <div className="space-y-6 ml-10">
                {content.timeline.map((phase: any, index: number) => (
                  <div key={index} className="relative">
                    <div className="absolute -left-10 mt-1.5">
                      <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white">
                        <Clock className="h-4 w-4" />
                      </div>
                    </div>
                    <div className="bg-neutral-50 rounded-lg p-3">
                      <div className="font-medium">{phase.title}</div>
                      {phase.dateRange && <div className="text-sm text-neutral-500 mt-1">{phase.dateRange}</div>}
                      {phase.description && <div className="text-sm mt-2">{phase.description}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-lg font-medium flex items-center">
          {getStrategyIcon(insight.processing_strategy)}
          <span className="ml-2">{insight.title}</span>
        </CardTitle>
        <div className="flex items-center">
          <span className={cn(
            "text-xs px-2 py-1 rounded-full",
            getStrategyBadgeClass(insight.processing_strategy)
          )}>
            {t(insight.processing_strategy)}
          </span>
          <span className="ml-2 text-xs text-neutral-500">
            {format(new Date(insight.created_at), 'PPp')}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {renderContent(insight.content)}
      </CardContent>
    </Card>
  );
}
