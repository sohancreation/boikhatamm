import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { History, X, ChevronRight, Clock, Loader2, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export interface HistoryConfig {
  table: string;
  titleField: string;
  subtitleField?: string;
  dateField?: string;
  icon?: string;
  pageTitle: string;
  /** If true, don't filter by user_id */
  isPublic?: boolean;
  /** Return a formatted subtitle from the row data */
  formatSubtitle?: (row: any) => string;
  /** Return badge text from row data */
  formatBadge?: (row: any) => { text: string; color: string } | null;
}

interface HistoryDrawerProps {
  config: HistoryConfig;
  onSelect: (item: any) => void;
}

export default function HistoryDrawer({ config, onSelect }: HistoryDrawerProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchHistory = async () => {
    if (!user && !config.isPublic) return;
    setLoading(true);
    try {
      const dateField = config.dateField || "created_at";
      let query = supabase
        .from(config.table as any)
        .select("*");
      if (!config.isPublic && user) {
        query = query.eq("user_id", user.id);
      }
      const { data, error } = await query
        .order(dateField, { ascending: false })
        .limit(50);
      if (error) throw error;
      setItems(data || []);
    } catch (e) {
      console.error("History fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) fetchHistory();
  }, [open, user]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await supabase.from(config.table as any).delete().eq("id", id);
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const getTitle = (item: any): string => {
    const val = item[config.titleField];
    if (typeof val === "string") return val.slice(0, 80) || "Untitled";
    if (typeof val === "object") return JSON.stringify(val).slice(0, 80);
    return "Untitled";
  };

  const getSubtitle = (item: any): string => {
    if (config.formatSubtitle) return config.formatSubtitle(item);
    if (config.subtitleField && item[config.subtitleField]) {
      const val = item[config.subtitleField];
      return typeof val === "string" ? val.slice(0, 60) : "";
    }
    return "";
  };

  const getBadge = (item: any) => {
    if (config.formatBadge) return config.formatBadge(item);
    return null;
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "MMM d, yyyy • h:mm a");
    } catch {
      return dateStr;
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-accent text-accent-foreground text-sm font-medium hover:bg-accent/80 transition-colors border border-border"
          title={t("View History", "ইতিহাস দেখুন")}
        >
          <History className="w-4 h-4" />
          {t("History", "ইতিহাস")}
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:w-[420px] p-0">
        <SheetHeader className="p-4 border-b border-border">
          <SheetTitle className="flex items-center gap-2 text-lg">
            <History className="w-5 h-5 text-primary" />
            {t(`Previous ${config.pageTitle}`, `আগের ${config.pageTitle}`)}
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-5rem)]">
          <div className="p-3 space-y-2">
            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            )}

            {!loading && items.length === 0 && (
              <div className="text-center py-12 text-muted-foreground text-sm">
                {t("No previous records found", "কোনো আগের রেকর্ড পাওয়া যায়নি")}
              </div>
            )}

            {items.map((item) => {
              const badge = getBadge(item);
              return (
                <button
                  key={item.id}
                  onClick={() => { onSelect(item); setOpen(false); }}
                  className="w-full text-left p-3 rounded-xl border border-border bg-card hover:bg-accent/50 transition-all group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {config.icon && <span className="mr-1.5">{config.icon}</span>}
                        {getTitle(item)}
                      </p>
                      {getSubtitle(item) && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{getSubtitle(item)}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(item[config.dateField || "created_at"])}
                        </span>
                        {badge && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${badge.color}`}>
                            {badge.text}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!config.isPublic && (
                        <span
                          role="button"
                          onClick={(e) => handleDelete(item.id, e)}
                          className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </span>
                      )}
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
