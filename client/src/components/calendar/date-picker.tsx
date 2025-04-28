import * as React from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { format as formatJalali } from "date-fns-jalali";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useLocale } from "@/hooks/use-locale";
import { useTranslation } from "react-i18next";

interface DatePickerProps {
  selected?: Date;
  onSelect?: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function DatePicker({
  selected,
  onSelect,
  placeholder,
  className,
  disabled = false,
}: DatePickerProps) {
  const { t } = useTranslation();
  const { calendar, isRTL } = useLocale();
  const [date, setDate] = React.useState<Date | undefined>(selected);

  React.useEffect(() => {
    setDate(selected);
  }, [selected]);

  const handleSelect = (newDate: Date | undefined) => {
    setDate(newDate);
    if (onSelect) {
      onSelect(newDate);
    }
  };

  // Format the date according to the user's calendar preference
  const formatDate = (date: Date) => {
    if (calendar === "jalali") {
      return formatJalali(date, "PPP");
    } else {
      return format(date, "PPP");
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
          {date ? formatDate(date) : <span>{placeholder || t("Select date")}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          initialFocus
          className={calendar === "jalali" ? "jalali" : ""}
        />
        {date && (
          <div className="p-3 border-t border-border">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleSelect(undefined)}
              className="w-full"
            >
              {t("Clear")}
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
