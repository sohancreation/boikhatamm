import { useState, useEffect } from "react";
import { Bell, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";

const NotificationBell = () => {
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) fetchNotifications();
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;
    const { data } = await supabase.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20);
    const notifs = data || [];
    setNotifications(notifs);
    setUnreadCount(notifs.filter((n: any) => !n.is_read).length);
  };

  const markAllRead = async () => {
    if (!user || unreadCount === 0) return;
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);
    setUnreadCount(0);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const deleteNotification = async (id: string) => {
    await supabase.from("notifications").delete().eq("id", id);
    setNotifications(prev => prev.filter(n => n.id !== id));
    setUnreadCount(prev => {
      const deleted = notifications.find(n => n.id === id);
      return deleted && !deleted.is_read ? prev - 1 : prev;
    });
  };

  return (
    <div className="relative">
      <button
        onClick={() => { setShowNotifications(!showNotifications); if (!showNotifications) markAllRead(); }}
        className="relative p-2 rounded-lg hover:bg-accent text-muted-foreground transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] rounded-full flex items-center justify-center font-bold animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>
      <AnimatePresence>
        {showNotifications && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="absolute right-0 top-full mt-2 w-72 max-w-[calc(100vw-2rem)] card-gradient border border-border rounded-xl shadow-lg z-50 p-3 space-y-2 max-h-80 overflow-y-auto"
          >
            {notifications.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-2">{t("No notifications", "কোনো বিজ্ঞপ্তি নেই")}</p>
            ) : notifications.map(n => (
              <div key={n.id} className={`flex items-center justify-between text-sm p-2 rounded-lg ${!n.is_read ? "bg-accent/50" : ""}`}>
                <span className="text-foreground flex-1 mr-2">{lang === "bn" ? n.text_bn : n.text_en}</span>
                <button onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}
                  className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive flex-shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
