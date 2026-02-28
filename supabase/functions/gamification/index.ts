import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// XP Rules - coins are now earned INDIRECTLY, not per action
const XP_RULES: Record<string, { xp: number }> = {
  complete_lesson: { xp: 10 },
  correct_answer: { xp: 5 },
  finish_daily_goal: { xp: 20 },
  streak_7: { xp: 50 },
  streak_30: { xp: 150 },
  mock_interview: { xp: 30 },
  complete_quiz: { xp: 15 },
  ask_ai: { xp: 5 },
  daily_bonus: { xp: 30 },
  study_minutes: { xp: 10 },
  achievement_bonus: { xp: 0 },
};

// Coin earning events (indirect from XP milestones)
// Per 100 XP = 10 coins (base rate)
const COINS_PER_100_XP = 10;

// Bonus coin events
const COIN_BONUS_EVENTS: Record<string, number> = {
  streak_7: 15,
  streak_30: 50,
  daily_bonus: 10,    // mission completion bonus
  mock_interview: 5,  // high performance bonus
};

// Monthly coin caps per plan
const MONTHLY_COIN_CAPS: Record<string, number> = {
  free: 15000,
  basic: 15000,
  pro: 30000,
  premium: 50000,
};

// Daily coin cap
const DAILY_COIN_CAP = 1200;

// Premium coin multipliers
const COIN_MULTIPLIERS: Record<string, number> = {
  free: 1,
  basic: 1,
  pro: 1.5,
  premium: 2,
};

// Discount limits per plan (in coins needed)
const DISCOUNT_TIERS: Record<string, { max_percent: number; coins_needed: number; plan_price: number }> = {
  basic: { max_percent: 20, coins_needed: 8000, plan_price: 399 },
  pro: { max_percent: 25, coins_needed: 20000, plan_price: 799 },
  premium: { max_percent: 30, coins_needed: 45000, plan_price: 1499 },
};

// Anti-abuse: quiz cooldown (seconds)
const QUIZ_COOLDOWN_SECONDS = 120;
// Anti-abuse: AI question cooldown (seconds)
const AI_COOLDOWN_SECONDS = 30;
// Anti-abuse: minimum word count for AI questions
const AI_MIN_WORD_COUNT = 5;
// Coin expiry: 6 months
const COIN_EXPIRY_MONTHS = 6;

// Rank system
function getRank(level: number): { en: string; bn: string; icon: string } {
  if (level >= 16) return { en: "Mastermind", bn: "মাস্টারমাইন্ড", icon: "🧩" };
  if (level >= 11) return { en: "Academic Warrior", bn: "একাডেমিক যোদ্ধা", icon: "⚔️" };
  if (level >= 7) return { en: "Rising Genius", bn: "উদীয়মান প্রতিভা", icon: "🌟" };
  if (level >= 4) return { en: "Knowledge Explorer", bn: "জ্ঞান অনুসন্ধানী", icon: "🧭" };
  return { en: "Beginner Scholar", bn: "নবীন শিক্ষার্থী", icon: "📘" };
}

function calcLevel(xp: number): number {
  if (xp <= 0) return 1;
  return Math.max(1, Math.floor((-1 + Math.sqrt(1 + (8 * xp) / 100)) / 2) + 1);
}

function xpForLevel(level: number): number {
  return (level * (level - 1) * 100) / 2;
}

async function getUserPlan(supabase: any, userId: string): Promise<string> {
  const { data } = await supabase.rpc("get_user_plan", { _user_id: userId });
  return data || "free";
}

function resetDailyIfNeeded(profile: any): { dailyCoins: number; dailyReset: string } {
  const today = new Date().toISOString().split("T")[0];
  if (profile?.daily_coins_reset_date !== today) {
    return { dailyCoins: 0, dailyReset: today };
  }
  return { dailyCoins: profile?.daily_coins_earned || 0, dailyReset: today };
}

function resetMonthlyIfNeeded(profile: any): { monthlyCoins: number; monthlyReset: string } {
  const today = new Date();
  const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;
  if (!profile?.monthly_coins_reset_date || profile.monthly_coins_reset_date < currentMonth) {
    return { monthlyCoins: 0, monthlyReset: currentMonth };
  }
  return { monthlyCoins: profile?.monthly_coins_earned || 0, monthlyReset: profile.monthly_coins_reset_date };
}

function calculateCoinsFromXP(xpEarned: number, prevTotalXp: number): number {
  // Per 100 XP milestone = 10 coins
  const prevMilestone = Math.floor(prevTotalXp / 100);
  const newMilestone = Math.floor((prevTotalXp + xpEarned) / 100);
  return (newMilestone - prevMilestone) * COINS_PER_100_XP;
}

function applyCoinsWithCaps(
  rawCoins: number,
  dailyCoins: number,
  monthlyCoins: number,
  plan: string,
  multiplier: number
): number {
  let coins = Math.floor(rawCoins * multiplier);
  const dailyRemaining = Math.max(0, DAILY_COIN_CAP - dailyCoins);
  coins = Math.min(coins, dailyRemaining);
  const monthlyMax = MONTHLY_COIN_CAPS[plan] || MONTHLY_COIN_CAPS.free;
  const monthlyRemaining = Math.max(0, monthlyMax - monthlyCoins);
  coins = Math.min(coins, monthlyRemaining);
  return coins;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: authError } = await anonClient.auth.getClaims(token);
    if (authError || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const user = { id: claimsData.claims.sub as string };

    const { action, data } = await req.json();
    const userId = user.id;

    if (action === "award_xp") {
      const { event_type, metadata } = data;
      const rule = XP_RULES[event_type];
      if (!rule) throw new Error("Unknown event type: " + event_type);

      // Anti-abuse checks
      const { data: profile } = await supabase.from("profiles")
        .select("xp, coins, level, streak_days, last_quiz_at, last_ai_question_at, monthly_coins_earned, monthly_coins_reset_date, daily_coins_earned, daily_coins_reset_date")
        .eq("user_id", userId).single();

      // Quiz cooldown
      if (event_type === "complete_quiz" && profile?.last_quiz_at) {
        const elapsed = (Date.now() - new Date(profile.last_quiz_at).getTime()) / 1000;
        if (elapsed < QUIZ_COOLDOWN_SECONDS) {
          return json({ error: "Quiz cooldown active", cooldown_remaining: Math.ceil(QUIZ_COOLDOWN_SECONDS - elapsed) });
        }
      }

      // AI spam protection
      if (event_type === "ask_ai") {
        if (metadata?.question && metadata.question.split(/\s+/).length < AI_MIN_WORD_COUNT) {
          return json({ error: "Question too short", min_words: AI_MIN_WORD_COUNT, xp_earned: 0, coins_earned: 0 });
        }
        if (profile?.last_ai_question_at) {
          const elapsed = (Date.now() - new Date(profile.last_ai_question_at).getTime()) / 1000;
          if (elapsed < AI_COOLDOWN_SECONDS) {
            return json({ error: "AI cooldown active", cooldown_remaining: Math.ceil(AI_COOLDOWN_SECONDS - elapsed) });
          }
        }
      }

      let xpEarned = rule.xp;
      if (event_type === "achievement_bonus" && metadata?.xp_bonus) {
        xpEarned = metadata.xp_bonus;
      }

      const prevXp = profile?.xp || 0;
      const newXp = prevXp + xpEarned;
      const newLevel = calcLevel(newXp);
      const prevLevel = calcLevel(prevXp);
      const rank = getRank(newLevel);

      // Calculate coins INDIRECTLY
      const userPlan = await getUserPlan(supabase, userId);
      const multiplier = COIN_MULTIPLIERS[userPlan] || 1;
      const { dailyCoins, dailyReset } = resetDailyIfNeeded(profile);
      const { monthlyCoins, monthlyReset } = resetMonthlyIfNeeded(profile);

      // XP milestone coins
      let rawCoins = calculateCoinsFromXP(xpEarned, prevXp);

      // Bonus coins from special events
      if (COIN_BONUS_EVENTS[event_type]) {
        rawCoins += COIN_BONUS_EVENTS[event_type];
      }

      // Level-up bonus: 50 coins per level gained
      if (newLevel > prevLevel) {
        rawCoins += (newLevel - prevLevel) * 50;
      }

      // High performance bonus (quiz score >= 80%)
      if (event_type === "complete_quiz" && metadata?.score >= 80) {
        rawCoins += 10;
      }

      // Apply caps
      const coinsEarned = applyCoinsWithCaps(rawCoins, dailyCoins, monthlyCoins, userPlan, multiplier);
      const newCoins = (profile?.coins || 0) + coinsEarned;

      // Log XP event
      await supabase.from("xp_logs").insert({
        user_id: userId, action: event_type,
        xp_earned: xpEarned, coins_earned: coinsEarned,
        metadata: metadata || {},
      });

      // Update profile
      const profileUpdate: any = {
        xp: newXp, coins: newCoins, level: newLevel,
        rank_title: rank.en,
        last_active_date: new Date().toISOString().split("T")[0],
        daily_coins_earned: dailyCoins + coinsEarned,
        daily_coins_reset_date: dailyReset,
        monthly_coins_earned: monthlyCoins + coinsEarned,
        monthly_coins_reset_date: monthlyReset,
        coins_last_earned_at: coinsEarned > 0 ? new Date().toISOString() : profile?.coins_last_earned_at,
      };
      if (event_type === "complete_quiz") profileUpdate.last_quiz_at = new Date().toISOString();
      if (event_type === "ask_ai") profileUpdate.last_ai_question_at = new Date().toISOString();

      await supabase.from("profiles").update(profileUpdate).eq("user_id", userId);

      // Update daily missions
      await updateMissionProgress(supabase, userId, event_type);

      // Check achievements
      const newAchievements = await checkAchievements(supabase, userId, newXp, newLevel, profile?.streak_days || 0);

      return json({
        xp_earned: xpEarned, coins_earned: coinsEarned,
        total_xp: newXp, total_coins: newCoins,
        level: newLevel, rank,
        xp_to_next: xpForLevel(newLevel + 1) - newXp,
        new_achievements: newAchievements,
        level_up: newLevel > prevLevel,
        coin_multiplier: multiplier,
      });
    }

    if (action === "get_daily_missions") {
      const today = new Date().toISOString().split("T")[0];
      let { data: missions } = await supabase
        .from("daily_missions").select("*")
        .eq("user_id", userId).eq("mission_date", today).single();
      if (!missions) {
        const { data: newMission } = await supabase.from("daily_missions").insert({
          user_id: userId, mission_date: today,
        }).select().single();
        missions = newMission;
      }
      return json({ missions });
    }

    if (action === "claim_daily_bonus") {
      const today = new Date().toISOString().split("T")[0];
      const { data: missions } = await supabase
        .from("daily_missions").select("*")
        .eq("user_id", userId).eq("mission_date", today).single();
      if (!missions || !missions.all_completed || missions.bonus_claimed) {
        return json({ error: "Cannot claim bonus" });
      }
      await supabase.from("daily_missions").update({ bonus_claimed: true })
        .eq("user_id", userId).eq("mission_date", today);

      const { data: profile } = await supabase.from("profiles")
        .select("xp, coins, level, monthly_coins_earned, monthly_coins_reset_date, daily_coins_earned, daily_coins_reset_date")
        .eq("user_id", userId).single();

      const bonusXp = 30;
      const userPlan = await getUserPlan(supabase, userId);
      const multiplier = COIN_MULTIPLIERS[userPlan] || 1;
      const { dailyCoins, dailyReset } = resetDailyIfNeeded(profile);
      const { monthlyCoins, monthlyReset } = resetMonthlyIfNeeded(profile);
      const rawBonusCoins = COIN_BONUS_EVENTS.daily_bonus || 10;
      const bonusCoins = applyCoinsWithCaps(rawBonusCoins, dailyCoins, monthlyCoins, userPlan, multiplier);

      await supabase.from("xp_logs").insert({
        user_id: userId, action: "daily_bonus",
        xp_earned: bonusXp, coins_earned: bonusCoins,
      });

      const newXp = (profile?.xp || 0) + bonusXp;
      const newCoins = (profile?.coins || 0) + bonusCoins;
      const newLevel = calcLevel(newXp);
      const rank = getRank(newLevel);

      await supabase.from("profiles").update({
        xp: newXp, coins: newCoins, level: newLevel, rank_title: rank.en,
        daily_coins_earned: dailyCoins + bonusCoins, daily_coins_reset_date: dailyReset,
        monthly_coins_earned: monthlyCoins + bonusCoins, monthly_coins_reset_date: monthlyReset,
        coins_last_earned_at: bonusCoins > 0 ? new Date().toISOString() : profile?.coins_last_earned_at,
      }).eq("user_id", userId);

      return json({ xp_earned: bonusXp, coins_earned: bonusCoins, total_xp: newXp, total_coins: newCoins, level: newLevel, rank });
    }

    if (action === "get_stats") {
      const { data: profile } = await supabase.from("profiles")
        .select("xp, coins, level, streak_days, rank_title, last_active_date, monthly_coins_earned, monthly_coins_reset_date, daily_coins_earned, daily_coins_reset_date, coins_last_earned_at")
        .eq("user_id", userId).single();

      const xp = profile?.xp || 0;
      const level = calcLevel(xp);
      const rank = getRank(level);
      const xpForCurrent = xpForLevel(level);
      const xpForNext = xpForLevel(level + 1);
      const xpInLevel = xp - xpForCurrent;
      const xpNeeded = xpForNext - xpForCurrent;

      const userPlan = await getUserPlan(supabase, userId);
      const { monthlyCoins, monthlyReset } = resetMonthlyIfNeeded(profile);
      const { dailyCoins } = resetDailyIfNeeded(profile);
      const monthlyCap = MONTHLY_COIN_CAPS[userPlan] || MONTHLY_COIN_CAPS.free;
      const multiplier = COIN_MULTIPLIERS[userPlan] || 1;

      // Check coin expiry (6 months)
      let expiredCoins = 0;
      if (profile?.coins_last_earned_at) {
        const lastEarned = new Date(profile.coins_last_earned_at);
        const expiryDate = new Date(lastEarned);
        expiryDate.setMonth(expiryDate.getMonth() + COIN_EXPIRY_MONTHS);
        if (new Date() > expiryDate) {
          expiredCoins = profile.coins || 0;
          // Reset coins if expired
          await supabase.from("profiles").update({ coins: 0 }).eq("user_id", userId);
        }
      }

      // Discount info
      const discountTier = DISCOUNT_TIERS[userPlan] || DISCOUNT_TIERS.basic;
      const currentCoins = expiredCoins > 0 ? 0 : (profile?.coins || 0);
      const discountProgress = Math.min(100, Math.round((currentCoins / discountTier.coins_needed) * 100));
      const coinsToDiscount = Math.max(0, discountTier.coins_needed - currentCoins);
      const currentDiscountPercent = Math.min(discountTier.max_percent, Math.round((currentCoins / discountTier.coins_needed) * discountTier.max_percent));
      const discountBdt = Math.round(discountTier.plan_price * currentDiscountPercent / 100);

      const [achievementRes, totalAchRes, recentXpRes] = await Promise.all([
        supabase.from("user_achievements").select("*", { count: "exact", head: true }).eq("user_id", userId),
        supabase.from("achievements").select("*", { count: "exact", head: true }),
        supabase.from("xp_logs").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(10),
      ]);

      return json({
        xp, coins: currentCoins, level, rank,
        streak: profile?.streak_days || 0,
        xp_in_level: xpInLevel, xp_needed: xpNeeded,
        xp_progress: Math.round((xpInLevel / xpNeeded) * 100),
        achievements_earned: achievementRes.count || 0,
        achievements_total: totalAchRes.count || 0,
        recent_xp: recentXpRes.data || [],
        // Coin economy stats
        monthly_coins_earned: monthlyCoins,
        monthly_coin_cap: monthlyCap,
        daily_coins_earned: dailyCoins,
        daily_coin_cap: DAILY_COIN_CAP,
        coin_multiplier: multiplier,
        coins_expired: expiredCoins > 0,
        // Discount info
        discount_progress: discountProgress,
        coins_to_discount: coinsToDiscount,
        current_discount_percent: currentDiscountPercent,
        discount_bdt: discountBdt,
        max_discount_percent: discountTier.max_percent,
        plan_price: discountTier.plan_price,
      });
    }

    if (action === "get_achievements") {
      const [allRes, earnedRes] = await Promise.all([
        supabase.from("achievements").select("*").order("sort_order"),
        supabase.from("user_achievements").select("achievement_id, earned_at").eq("user_id", userId),
      ]);
      const earned = new Set((earnedRes.data || []).map((e: any) => e.achievement_id));
      const earnedMap: Record<string, string> = {};
      (earnedRes.data || []).forEach((e: any) => { earnedMap[e.achievement_id] = e.earned_at; });
      const achievements = (allRes.data || []).map((a: any) => ({
        ...a, earned: earned.has(a.id), earned_at: earnedMap[a.id] || null,
      }));
      return json({ achievements });
    }

    if (action === "get_leaderboard") {
      const { data: topUsers } = await supabase.from("profiles")
        .select("user_id, full_name, xp, level, rank_title, avatar_url")
        .order("xp", { ascending: false }).limit(20);
      const { count: userRank } = await supabase.from("profiles")
        .select("*", { count: "exact", head: true })
        .gt("xp", (await supabase.from("profiles").select("xp").eq("user_id", userId).single()).data?.xp || 0);
      return json({ leaderboard: topUsers || [], user_rank: (userRank || 0) + 1 });
    }

    if (action === "buy_item") {
      const { item_type, item_id, cost } = data;
      
      // Validate item exists and cost matches
      const SHOP_ITEMS: Record<string, { type: string; cost: number; nameEn: string; nameBn: string }> = {
        streak_shield: { type: "power_up", cost: 50, nameEn: "Streak Shield", nameBn: "স্ট্রিক শিল্ড" },
        dark_pro: { type: "theme", cost: 100, nameEn: "Dark Pro Theme", nameBn: "ডার্ক প্রো থিম" },
        gold_frame: { type: "frame", cost: 150, nameEn: "Gold Frame", nameBn: "গোল্ড ফ্রেম" },
        xp_boost: { type: "power_up", cost: 200, nameEn: "XP Boost (2x)", nameBn: "XP বুস্ট (২x)" },
        ai_premium: { type: "power_up", cost: 75, nameEn: "AI Premium Prompt", nameBn: "AI প্রিমিয়াম প্রম্পট" },
        diamond_frame: { type: "frame", cost: 500, nameEn: "Diamond Frame", nameBn: "ডায়মন্ড ফ্রেম" },
      };
      
      const shopItem = SHOP_ITEMS[item_id];
      if (!shopItem) return json({ error: "Unknown item" });
      if (cost !== shopItem.cost) return json({ error: "Invalid cost" });
      
      const { data: profile } = await supabase.from("profiles").select("coins, theme").eq("user_id", userId).single();
      if ((profile?.coins || 0) < cost) return json({ error: "Not enough coins" });
      
      // Deduct coins
      await supabase.from("profiles").update({ coins: (profile?.coins || 0) - cost }).eq("user_id", userId);
      
      // Add to inventory
      const { data: existing } = await supabase.from("user_inventory")
        .select("*").eq("user_id", userId).eq("item_type", item_type).eq("item_id", item_id).single();
      if (existing) {
        await supabase.from("user_inventory").update({ quantity: (existing.quantity || 1) + 1 }).eq("id", existing.id);
      } else {
        await supabase.from("user_inventory").insert({ user_id: userId, item_type, item_id, quantity: 1 });
      }
      
      // Apply item effects immediately
      if (item_id === "dark_pro") {
        await supabase.from("profiles").update({ theme: "dark_pro" }).eq("user_id", userId);
      }
      
      // For streak_shield, store activation timestamp
      if (item_id === "streak_shield") {
        await supabase.from("user_inventory").update({ 
          quantity: 1 
        }).eq("user_id", userId).eq("item_id", "streak_shield");
      }
      
      // Send purchase notification
      await supabase.from("notifications").insert({
        user_id: userId,
        text_en: `🛍️ You purchased ${shopItem.nameEn}! Check your inventory.`,
        text_bn: `🛍️ আপনি ${shopItem.nameBn} কিনেছেন! আপনার ইনভেন্টরি দেখুন।`,
      });
      
      return json({ 
        success: true, 
        remaining_coins: (profile?.coins || 0) - cost,
        item_name_en: shopItem.nameEn,
        item_name_bn: shopItem.nameBn,
        item_id,
        item_type,
      });
    }

    if (action === "get_inventory") {
      const { data: items } = await supabase.from("user_inventory").select("*").eq("user_id", userId);
      return json({ items: items || [] });
    }

    if (action === "get_coin_economy") {
      const { data: profile } = await supabase.from("profiles")
        .select("coins, monthly_coins_earned, monthly_coins_reset_date, daily_coins_earned, daily_coins_reset_date, coins_last_earned_at")
        .eq("user_id", userId).single();
      const userPlan = await getUserPlan(supabase, userId);
      const { monthlyCoins } = resetMonthlyIfNeeded(profile);
      const { dailyCoins } = resetDailyIfNeeded(profile);
      const monthlyCap = MONTHLY_COIN_CAPS[userPlan] || MONTHLY_COIN_CAPS.free;
      const multiplier = COIN_MULTIPLIERS[userPlan] || 1;
      const discountTier = DISCOUNT_TIERS[userPlan] || DISCOUNT_TIERS.basic;
      const currentCoins = profile?.coins || 0;
      const coinsToNextDiscount = Math.max(0, discountTier.coins_needed - currentCoins);
      const currentDiscountBdt = Math.min(
        Math.round(discountTier.plan_price * discountTier.max_percent / 100),
        Math.round((currentCoins / discountTier.coins_needed) * discountTier.plan_price * discountTier.max_percent / 100)
      );

      return json({
        coins: currentCoins,
        monthly_earned: monthlyCoins,
        monthly_cap: monthlyCap,
        daily_earned: dailyCoins,
        daily_cap: DAILY_COIN_CAP,
        multiplier,
        plan: userPlan,
        coins_to_next_discount: coinsToNextDiscount,
        current_discount_bdt: currentDiscountBdt,
        max_discount_percent: discountTier.max_percent,
        max_discount_bdt: Math.round(discountTier.plan_price * discountTier.max_percent / 100),
      });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    console.error("gamification error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function updateMissionProgress(supabase: any, userId: string, eventType: string) {
  const today = new Date().toISOString().split("T")[0];
  const { data: mission } = await supabase.from("daily_missions").select("*")
    .eq("user_id", userId).eq("mission_date", today).single();
  if (!mission) return;
  const updates: any = {};
  if (eventType === "complete_quiz" && !mission.mission_1_done) {
    updates.mission_1_progress = Math.min(mission.mission_1_target, (mission.mission_1_progress || 0) + 1);
    if (updates.mission_1_progress >= mission.mission_1_target) updates.mission_1_done = true;
  }
  if (eventType === "study_minutes" && !mission.mission_2_done) {
    updates.mission_2_progress = Math.min(mission.mission_2_target, (mission.mission_2_progress || 0) + 1);
    if (updates.mission_2_progress >= mission.mission_2_target) updates.mission_2_done = true;
  }
  if (eventType === "ask_ai" && !mission.mission_3_done) {
    updates.mission_3_progress = Math.min(mission.mission_3_target, (mission.mission_3_progress || 0) + 1);
    if (updates.mission_3_progress >= mission.mission_3_target) updates.mission_3_done = true;
  }
  if (Object.keys(updates).length > 0) {
    const m1Done = updates.mission_1_done ?? mission.mission_1_done;
    const m2Done = updates.mission_2_done ?? mission.mission_2_done;
    const m3Done = updates.mission_3_done ?? mission.mission_3_done;
    if (m1Done && m2Done && m3Done) updates.all_completed = true;
    await supabase.from("daily_missions").update(updates).eq("user_id", userId).eq("mission_date", today);
  }
}

async function checkAchievements(supabase: any, userId: string, totalXp: number, level: number, streak: number) {
  const [allRes, earnedRes] = await Promise.all([
    supabase.from("achievements").select("*"),
    supabase.from("user_achievements").select("achievement_id").eq("user_id", userId),
  ]);
  const earned = new Set((earnedRes.data || []).map((e: any) => e.achievement_id));
  const newAchievements: any[] = [];
  const [quizRes, correctRes, lessonRes, interviewRes, missionRes] = await Promise.all([
    supabase.from("quiz_results").select("*", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("xp_logs").select("*", { count: "exact", head: true }).eq("user_id", userId).eq("action", "correct_answer"),
    supabase.from("student_progress").select("*", { count: "exact", head: true }).eq("user_id", userId).eq("completed", true),
    supabase.from("mock_interview_results").select("*", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("daily_missions").select("*", { count: "exact", head: true }).eq("user_id", userId).eq("all_completed", true),
  ]);
  const stats: Record<string, number> = {
    streak_days: streak, quizzes_completed: quizRes.count || 0,
    correct_answers: correctRes.count || 0, lessons_completed: lessonRes.count || 0,
    interviews_completed: interviewRes.count || 0, level_reached: level,
    coins_earned: totalXp, missions_completed: missionRes.count || 0,
  };
  for (const achievement of (allRes.data || [])) {
    if (earned.has(achievement.id)) continue;
    const currentValue = stats[achievement.requirement_type] || 0;
    if (currentValue >= achievement.requirement_value) {
      await supabase.from("user_achievements").insert({ user_id: userId, achievement_id: achievement.id });
      newAchievements.push(achievement);
      if (achievement.xp_bonus > 0 || achievement.coins_bonus > 0) {
        await supabase.from("xp_logs").insert({
          user_id: userId, action: "achievement_bonus",
          xp_earned: achievement.xp_bonus || 0, coins_earned: achievement.coins_bonus || 0,
          metadata: { achievement_id: achievement.id },
        });
        const { data: prof } = await supabase.from("profiles").select("xp, coins").eq("user_id", userId).single();
        await supabase.from("profiles").update({
          xp: (prof?.xp || 0) + (achievement.xp_bonus || 0),
          coins: (prof?.coins || 0) + (achievement.coins_bonus || 0),
        }).eq("user_id", userId);
      }
    }
  }
  return newAchievements;
}

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
