import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertItemSchema, Item } from "@shared/schema";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { DatePicker } from "@/components/calendar/date-picker";
import { useLocale } from "@/hooks/use-locale";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

// Extend the insertItemSchema to handle tags as string
const extendedItemSchema = insertItemSchema.extend({
  tagsString: z.string().optional(),
}).omit({ tags: true });

type ExtendedItemFormData = z.infer<typeof extendedItemSchema>;

interface ItemFormProps {
  defaultValues?: Partial<Item>;
  isEditing?: boolean;
}

export function ItemForm({ defaultValues, isEditing = false }: ItemFormProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [location, navigate] = useLocation();
  const { isRTL } = useLocale();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    defaultValues?.due_date ? new Date(defaultValues.due_date) : undefined
  );

  // Convert tags array to comma-separated string for the form
  const tagsString = defaultValues?.tags?.join(", ") || "";

  // Prepare form with default values
  const form = useForm<ExtendedItemFormData>({
    resolver: zodResolver(extendedItemSchema),
    defaultValues: {
      ...defaultValues,
      tagsString,
    },
  });

  // Create or update item mutation
  const mutation = useMutation({
    mutationFn: async (data: ExtendedItemFormData) => {
      // Convert comma-separated tags string to array and trim each tag
      const tags = data.tagsString
        ? data.tagsString.split(",").map(tag => tag.trim()).filter(Boolean)
        : [];

      // Prepare data for API request
      const itemData = {
        ...data,
        tags,
        due_date: selectedDate?.toISOString(),
      };

      delete (itemData as any).tagsString;

      if (isEditing && defaultValues?.id) {
        const res = await apiRequest("PATCH", `/api/items/${defaultValues.id}`, itemData);
        return await res.json();
      } else {
        const res = await apiRequest("POST", "/api/items", itemData);
        return await res.json();
      }
    },
    onSuccess: (data) => {
      // Invalidate queries to refresh the items list
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      
      // Show success message
      toast({
        title: isEditing ? t("Item updated") : t("Item created"),
        description: isEditing 
          ? t("Your item has been successfully updated")
          : t("Your new item has been created"),
      });
      
      // Navigate to the item detail page
      navigate(`/items/${data.id}`);
    },
    onError: (error) => {
      toast({
        title: t("Error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Form submission handler
  const onSubmit = (data: ExtendedItemFormData) => {
    mutation.mutate(data);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{isEditing ? t("Edit Item") : t("Create New Item")}</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {/* Title field */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("Title")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("Enter title")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description field */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("Description")}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t("Enter description")}
                      className="resize-none min-h-[100px]"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Item Type */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("Type")}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("Select item type")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="TASK">{t("TASK")}</SelectItem>
                      <SelectItem value="PROJECT">{t("PROJECT")}</SelectItem>
                      <SelectItem value="GOAL">{t("GOAL")}</SelectItem>
                      <SelectItem value="IDEA">{t("IDEA")}</SelectItem>
                      <SelectItem value="NOTE">{t("NOTE")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Status */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("Status")}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("Select status")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="TODO">{t("TODO")}</SelectItem>
                      <SelectItem value="IN_PROGRESS">{t("IN_PROGRESS")}</SelectItem>
                      <SelectItem value="DONE">{t("DONE")}</SelectItem>
                      <SelectItem value="ARCHIVED">{t("ARCHIVED")}</SelectItem>
                      <SelectItem value="BACKLOG">{t("BACKLOG")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Importance Level */}
            <FormField
              control={form.control}
              name="importance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("Importance Level")}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("Select importance")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="LOW">{t("LOW")}</SelectItem>
                      <SelectItem value="MEDIUM">{t("MEDIUM")}</SelectItem>
                      <SelectItem value="HIGH">{t("HIGH")}</SelectItem>
                      <SelectItem value="CRITICAL">{t("CRITICAL")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {t("Importance level determines AI processing intensity")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Due Date */}
            <FormItem>
              <FormLabel>{t("Due Date")}</FormLabel>
              <DatePicker 
                selected={selectedDate}
                onSelect={setSelectedDate}
                placeholder={t("Select due date")}
              />
            </FormItem>

            {/* Tags */}
            <FormField
              control={form.control}
              name="tagsString"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("Tags")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("Enter tags separated by commas")}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {t("Example: work, important, meeting")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              type="button"
              onClick={() => navigate("/")}
            >
              {t("Cancel")}
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? (
                <>
                  <Loader2 className={`${isRTL ? "ml-2" : "mr-2"} h-4 w-4 animate-spin`} />
                  {isEditing ? t("Updating...") : t("Creating...")}
                </>
              ) : (
                isEditing ? t("Update Item") : t("Create Item")
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
