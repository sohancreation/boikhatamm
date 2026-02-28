import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface UserItems {
  hasGoldFrame: boolean;
  hasDiamondFrame: boolean;
  hasDarkPro: boolean;
  hasStreakShield: boolean;
  hasXpBoost: boolean;
  hasAiPremium: boolean;
  activeFrame: "none" | "gold" | "diamond";
  frameClass: string;
  loading: boolean;
  refetch: () => Promise<void>;
}

export function useUserItems(): UserItems {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    const { data } = await supabase
      .from("user_inventory")
      .select("item_id, item_type, quantity")
      .eq("user_id", user.id);
    setItems(data || []);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const hasItem = (id: string) => items.some(i => i.item_id === id && (i.quantity || 0) > 0);

  const hasGoldFrame = hasItem("gold_frame");
  const hasDiamondFrame = hasItem("diamond_frame");
  const hasDarkPro = hasItem("dark_pro");
  const hasStreakShield = hasItem("streak_shield");
  const hasXpBoost = hasItem("xp_boost");
  const hasAiPremium = hasItem("ai_premium");

  // Diamond > Gold priority
  const activeFrame = hasDiamondFrame ? "diamond" as const : hasGoldFrame ? "gold" as const : "none" as const;
  const frameClass = activeFrame === "diamond" ? "frame-diamond" : activeFrame === "gold" ? "frame-gold" : "";

  return {
    hasGoldFrame, hasDiamondFrame, hasDarkPro,
    hasStreakShield, hasXpBoost, hasAiPremium,
    activeFrame, frameClass, loading, refetch: fetchItems,
  };
}
