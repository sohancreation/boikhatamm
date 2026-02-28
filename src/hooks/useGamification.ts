import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface GamificationStats {
  xp: number;
  coins: number;
  level: number;
  rank: { en: string; bn: string; icon: string };
  streak: number;
  xp_in_level: number;
  xp_needed: number;
  xp_progress: number;
  achievements_earned: number;
  achievements_total: number;
  recent_xp: any[];
  // Coin economy
  monthly_coins_earned: number;
  monthly_coin_cap: number;
  daily_coins_earned: number;
  daily_coin_cap: number;
  coin_multiplier: number;
  coins_expired: boolean;
  discount_progress: number;
  coins_to_discount: number;
  current_discount_percent: number;
  discount_bdt: number;
  max_discount_percent: number;
  plan_price: number;
}

export interface DailyMissions {
  mission_1_type: string;
  mission_1_target: number;
  mission_1_progress: number;
  mission_1_done: boolean;
  mission_2_type: string;
  mission_2_target: number;
  mission_2_progress: number;
  mission_2_done: boolean;
  mission_3_type: string;
  mission_3_target: number;
  mission_3_progress: number;
  mission_3_done: boolean;
  all_completed: boolean;
  bonus_claimed: boolean;
}

export function useGamification() {
  const { user, refreshProfile } = useAuth();
  const [stats, setStats] = useState<GamificationStats | null>(null);
  const [missions, setMissions] = useState<DailyMissions | null>(null);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const invoke = useCallback(async (action: string, data?: any) => {
    if (!user) return null;
    try {
      const { data: result, error } = await supabase.functions.invoke("gamification", {
        body: { action, data: data || {} },
      });
      if (error) {
        // Don't log auth errors - expected when session expires
        if (error.message?.includes("401") || error.message?.includes("Unauthorized")) return null;
        console.error("Gamification error:", error);
        return null;
      }
      if (result?.error === "Unauthorized") return null;
      return result;
    } catch (e) {
      return null;
    }
  }, [user]);

  const fetchStats = useCallback(async () => {
    const result = await invoke("get_stats");
    if (result && !result.error) setStats(result);
    return result;
  }, [invoke]);

  const fetchMissions = useCallback(async () => {
    const result = await invoke("get_daily_missions");
    if (result?.missions) setMissions(result.missions);
    return result;
  }, [invoke]);

  const fetchAchievements = useCallback(async () => {
    const result = await invoke("get_achievements");
    if (result?.achievements) setAchievements(result.achievements);
    return result;
  }, [invoke]);

  const awardXP = useCallback(async (eventType: string, metadata?: any) => {
    setLoading(true);
    const result = await invoke("award_xp", { event_type: eventType, metadata });
    if (result && !result.error) {
      // Show XP toast
      if (result.xp_earned > 0) {
        toast.success(`+${result.xp_earned} XP${result.coins_earned ? ` • +${result.coins_earned} 💎` : ""}`, {
          duration: 2000,
          icon: "⚡",
        });
      }
      // Show achievement toasts
      if (result.new_achievements?.length) {
        for (const a of result.new_achievements) {
          setTimeout(() => {
            toast.success(`${a.icon} ${a.name_en}`, {
              description: a.description_en,
              duration: 4000,
            });
          }, 500);
        }
      }
      await refreshProfile();
      await fetchStats();
      await fetchMissions();
    }
    setLoading(false);
    return result;
  }, [invoke, refreshProfile, fetchStats, fetchMissions]);

  const claimDailyBonus = useCallback(async () => {
    const result = await invoke("claim_daily_bonus");
    if (result && !result.error) {
      toast.success(`🎁 Daily Bonus: +${result.xp_earned} XP • +${result.coins_earned} 💎`, { duration: 3000 });
      await refreshProfile();
      await fetchStats();
      await fetchMissions();
    }
    return result;
  }, [invoke, refreshProfile, fetchStats, fetchMissions]);

  const fetchInventory = useCallback(async () => {
    const result = await invoke("get_inventory");
    return result?.items || [];
  }, [invoke]);

  const buyItem = useCallback(async (itemType: string, itemId: string, cost: number) => {
    const result = await invoke("buy_item", { item_type: itemType, item_id: itemId, cost });
    if (result?.error) {
      toast.error(result.error === "Not enough coins" ? "💎 কয়েন যথেষ্ট নেই!" : result.error);
    } else if (result?.success) {
      toast.success(`🛍️ ${result.item_name_en || "Item"} purchased!`, { 
        description: result.item_id === "dark_pro" ? "🌙 Dark Pro Theme activated!" 
          : result.item_id === "gold_frame" ? "🖼️ Gold Frame applied to your profile!"
          : result.item_id === "diamond_frame" ? "💎 Diamond Frame applied to your profile!"
          : result.item_id === "xp_boost" ? "⚡ 2x XP Boost active for 1 hour!"
          : result.item_id === "ai_premium" ? "🤖 1 Premium AI query added!"
          : result.item_id === "streak_shield" ? "🛡️ Streak Shield active for 24 hours!"
          : undefined,
        duration: 3000 
      });
      await fetchStats();
    }
    return result;
  }, [invoke, fetchStats]);

  return {
    stats, missions, achievements, loading,
    fetchStats, fetchMissions, fetchAchievements, fetchInventory,
    awardXP, claimDailyBonus, buyItem,
  };
}
