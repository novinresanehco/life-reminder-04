import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AIProcessingLog } from "@shared/schema";
import { useTranslation } from "react-i18next";
import { useDate } from "@/hooks/use-date";
import { useState } from "react";
import { ChevronDown, ChevronUp, Info, AlertCircle, BugPlay, LayoutList } from "lucide-react";
import { cn } from "@/lib/utils";

interface DeepThoughtLogProps {
  log: AIProcessingLog;
}

export function DeepThoughtLog({ log }: DeepThoughtLogProps) {
  const { t } = useTranslation();
  const { format } = useDate();
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Get the appropriate icon for the log level
  const getLevelIcon = (level: string) => {
    switch (level) {
      case "DEBUG":
        return <BugPlay className="h-4 w-4 text-neutral-400" />;
      case "INFO":
        return <Info className="h-4 w-4 text-blue-500" />;
      case "IMPORTANT":
        return <Info className="h-4 w-4 text-amber-500" />;
      case "CRITICAL":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <LayoutList className="h-4 w-4" />;
    }
  };
  
  // Get the appropriate color for the log level badge
  const getLevelBadgeClass = (level: string) => {
    switch (level) {
      case "DEBUG":
        return "bg-neutral-100 text-neutral-700";
      case "INFO":
        return "bg-blue-100 text-blue-700";
      case "IMPORTANT":
        return "bg-amber-100 text-amber-700";
      case "CRITICAL":
        return "bg-red-100 text-red-700";
      default:
        return "bg-neutral-100 text-neutral-700";
    }
  };
  
  // Format the timestamp
  const formattedTime = format(new Date(log.timestamp), 'PPp');
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-4 flex flex-row items-center justify-between cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center space-x-3">
          {getLevelIcon(log.log_level)}
          <div className="font-medium truncate">{log.message}</div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className={cn(getLevelBadgeClass(log.log_level))}>
            {t(log.log_level)}
          </Badge>
          <div className="text-xs text-neutral-500">{formattedTime}</div>
          <Button variant="ghost" size="sm" className="p-0 h-8 w-8">
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="p-4 pt-0 bg-neutral-50">
          {/* Model info if available */}
          {log.model_id && (
            <div className="mb-3 text-sm">
              <span className="font-medium">{t('Model')}:</span> {log.details?.modelName || `Model ID: ${log.model_id}`}
            </div>
          )}
          
          {/* Render details based on structure */}
          {log.details && Object.keys(log.details).length > 0 && (
            <div className="space-y-2">
              {/* If details has a prompt */}
              {log.details.prompt && (
                <div className="space-y-1">
                  <h4 className="text-sm font-medium">{t('Prompt')}:</h4>
                  <pre className="text-xs bg-neutral-100 p-2 rounded-md overflow-x-auto whitespace-pre-wrap">
                    {log.details.prompt}
                  </pre>
                </div>
              )}
              
              {/* If details has a rawResponse */}
              {log.details.rawResponse && (
                <div className="space-y-1">
                  <h4 className="text-sm font-medium">{t('Raw Response')}:</h4>
                  <pre className="text-xs bg-neutral-100 p-2 rounded-md overflow-x-auto whitespace-pre-wrap">
                    {log.details.rawResponse}
                  </pre>
                </div>
              )}
              
              {/* If details has an error */}
              {log.details.error && (
                <div className="space-y-1">
                  <h4 className="text-sm font-medium text-red-500">{t('Error')}:</h4>
                  <pre className="text-xs bg-red-50 text-red-700 p-2 rounded-md overflow-x-auto whitespace-pre-wrap">
                    {log.details.error}
                  </pre>
                </div>
              )}
              
              {/* Other details */}
              {Object.entries(log.details).map(([key, value]) => {
                // Skip already rendered fields or complex objects
                if (['prompt', 'rawResponse', 'error'].includes(key) || typeof value === 'object') {
                  return null;
                }
                
                return (
                  <div key={key} className="text-sm">
                    <span className="font-medium">{t(key)}:</span> {value}
                  </div>
                );
              })}
              
              {/* If there are any nested objects, render them at the end */}
              {Object.entries(log.details).map(([key, value]) => {
                if (typeof value === 'object' && value !== null && !Array.isArray(value) && 
                    !['prompt', 'rawResponse', 'error'].includes(key)) {
                  return (
                    <div key={key} className="space-y-1">
                      <h4 className="text-sm font-medium">{t(key)}:</h4>
                      <pre className="text-xs bg-neutral-100 p-2 rounded-md overflow-x-auto whitespace-pre-wrap">
                        {JSON.stringify(value, null, 2)}
                      </pre>
                    </div>
                  );
                }
                return null;
              })}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
