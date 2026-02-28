import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  BookOpen, Brain, Gamepad2, MessageCircle, Compass, Trophy,
  Lock, Flame, Star, Zap, ArrowRight, Sparkles, CheckCircle2,
  Calendar, TrendingUp, Crown, GraduationCap, FileText, Mic,
  Presentation, FlaskConical, Wrench, Coins, RefreshCw,
} from "lucide-react";
import { useGamification } from "@/hooks/useGamification";
import DailyMissions from "@/components/gamification/DailyMissions";
import AchievementWall from "@/components/gamification/AchievementWall";
import CoinShop from "@/components/gamification/CoinShop";
import ProgressHero from "@/components/gamification/ProgressHero";
import WeeklyProgress from "@/components/gamification/WeeklyProgress";
import XPFloatingText from "@/components/gamification/XPFloatingText";
import LevelUpModal from "@/components/gamification/LevelUpModal";
import CoinEconomyWidget from "@/components/gamification/CoinEconomyWidget";
import CoinDetailsModal from "@/components/gamification/CoinDetailsModal";

interface AIInsight {
  insight: string;
  tasks: { title: string; subject: string; duration: string }[];
  tip_category?: string;
  tip_icon?: string;
}

function seededRandom(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  s = (s * 16807) % 2147483647;
  return (s - 1) / 2147483646;
}

const FAKE_NAMES = [
  "Rahim", "Karim", "Fatima", "Ayesha", "Sakib", "Nusrat", "Tanvir",
  "Mehedi", "Sumaiya", "Arif", "Laboni", "Rasel", "Mithila", "Jabed",
];

const DAILY_QUOTES = [
  { en: "\"The future belongs to those who believe in the beauty of their dreams.\" — Eleanor Roosevelt 🌟", bn: "\"ভবিষ্যৎ তাদের যারা তাদের স্বপ্নের সৌন্দর্যে বিশ্বাস করে।\" — এলিনর রুজভেল্ট 🌟" },
  { en: "\"Education is the most powerful weapon which you can use to change the world.\" — Nelson Mandela 📚", bn: "\"শিক্ষা হলো সবচেয়ে শক্তিশালী অস্ত্র যা দিয়ে তুমি পৃথিবী বদলাতে পারো।\" — নেলসন ম্যান্ডেলা 📚" },
  { en: "\"Success is not final, failure is not fatal: it is the courage to continue that counts.\" — Winston Churchill 💪", bn: "\"সাফল্য চূড়ান্ত নয়, ব্যর্থতা মারাত্মক নয়: চালিয়ে যাওয়ার সাহসই আসল।\" — উইনস্টন চার্চিল 💪" },
  { en: "\"It does not matter how slowly you go as long as you do not stop.\" — Confucius 🐢", bn: "\"তুমি কত ধীরে যাচ্ছো তা বিবেচ্য নয়, যতক্ষণ না তুমি থামো।\" — কনফুসিয়াস 🐢" },
  { en: "\"The only way to do great work is to love what you do.\" — Steve Jobs 🍎", bn: "\"মহান কাজ করার একমাত্র উপায় হলো তুমি যা করো তা ভালোবাসা।\" — স্টিভ জবস 🍎" },
  { en: "\"In the middle of difficulty lies opportunity.\" — Albert Einstein 🧠", bn: "\"কষ্টের মাঝেই সুযোগ লুকিয়ে থাকে।\" — আলবার্ট আইনস্টাইন 🧠" },
  { en: "\"Believe you can and you're halfway there.\" — Theodore Roosevelt 🚀", bn: "\"বিশ্বাস করো যে তুমি পারবে, তাহলে অর্ধেক পথ পার হয়ে গেছো।\" — থিওডোর রুজভেল্ট 🚀" },
  { en: "\"The beautiful thing about learning is that no one can take it away from you.\" — B.B. King 🎵", bn: "\"শেখার সুন্দর দিক হলো কেউ তা তোমার কাছ থেকে কেড়ে নিতে পারে না।\" — বি.বি. কিং 🎵" },
  { en: "\"Don't let yesterday take up too much of today.\" — Will Rogers ⏰", bn: "\"গতকালকে আজকের অনেক সময় দখল করতে দিও না।\" — উইল রজার্স ⏰" },
  { en: "\"Knowledge is power. Information is liberating.\" — Kofi Annan 🌍", bn: "\"জ্ঞানই শক্তি। তথ্য মুক্তিদায়ক।\" — কফি আনান 🌍" },
  { en: "\"You don't have to be great to start, but you have to start to be great.\" — Zig Ziglar 🔥", bn: "\"শুরু করতে মহান হতে হয় না, কিন্তু মহান হতে শুরু করতে হয়।\" — জিগ জিগলার 🔥" },
  { en: "\"The expert in anything was once a beginner.\" — Helen Hayes ⭐", bn: "\"যেকোনো বিষয়ের বিশেষজ্ঞ একসময় নবীন ছিলেন।\" — হেলেন হেইস ⭐" },
  { en: "\"I have not failed. I've just found 10,000 ways that won't work.\" — Thomas Edison 💡", bn: "\"আমি ব্যর্থ হইনি। আমি ১০,০০০টি উপায় খুঁজে পেয়েছি যা কাজ করে না।\" — টমাস এডিসন 💡" },
  { en: "\"Dream big. Start small. Act now.\" — Robin Sharma 🏔️", bn: "\"বড় স্বপ্ন দেখো। ছোট থেকে শুরু করো। এখনই কাজ শুরু করো।\" — রবিন শর্মা 🏔️" },
];

const Dashboard = () => {
  const { user, profile, userPlan, refreshProfile } = useAuth();
  const { t, lang } = useLanguage();
  const { setThemeMode } = useTheme();
  const navigate = useNavigate();
  const gamification = useGamification();

  const [aiInsight, setAiInsight] = useState<AIInsight | null>(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const [insightError, setInsightError] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null);
  const [subscriptionDaysLeft, setSubscriptionDaysLeft] = useState<number | null>(null);
  const [subscriptionPlanName, setSubscriptionPlanName] = useState<string>("");
  const [studyDates, setStudyDates] = useState<Set<string>>(new Set());
  const [dynamicStreak, setDynamicStreak] = useState(0);
  const [subjectProgress, setSubjectProgress] = useState<{ subject: string; percent: number; color: string }[]>([]);
  const [totalCompleted, setTotalCompleted] = useState(0);
  const [totalTopics, setTotalTopics] = useState(0);
  const [showShop, setShowShop] = useState(false);
  const [showCoinDetails, setShowCoinDetails] = useState(false);
  const [ownedItems, setOwnedItems] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;
    gamification.fetchStats();
    gamification.fetchMissions();
    gamification.fetchAchievements();
    fetchOwnedItems();
    fetchAIInsight();
    fetchNotifications();
    fetchTrialInfo();
    fetchStudyStreak();
    fetchSubjectProgress();
    sendDailyMotivation();
    sendCoinNotifications();
  }, [user]);

  const fetchOwnedItems = async () => {
    const items = await gamification.fetchInventory();
    const itemIds = items.map((i: any) => i.item_id);
    setOwnedItems(itemIds);
    // Auto-apply Dark Pro theme if owned
    if (itemIds.includes("dark_pro") && profile?.theme === "dark_pro") {
      setThemeMode("dark_pro");
    }
  };

  const fetchTrialInfo = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("user_subscriptions")
      .select("expires_at, payment_method, plan_id, subscription_plans(name_en, name_bn, plan_type)")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1);
    if (data?.[0]) {
      const sub = data[0] as any;
      const expiresAt = new Date(sub.expires_at);
      const now = new Date();
      const diffMs = expiresAt.getTime() - now.getTime();
      const daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
      if (sub.payment_method === "trial") setTrialDaysLeft(daysLeft);
      setSubscriptionDaysLeft(daysLeft);
      setSubscriptionPlanName(lang === "bn" ? (sub.subscription_plans?.name_bn || "") : (sub.subscription_plans?.name_en || sub.subscription_plans?.plan_type || ""));
    }
  };

  const fetchStudyStreak = async () => {
    if (!user) return;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Fetch from multiple sources for better streak accuracy
    const [progressRes, quizRes, doubtRes] = await Promise.all([
      supabase
        .from("student_progress")
        .select("completed_at")
        .eq("user_id", user.id)
        .eq("completed", true)
        .not("completed_at", "is", null)
        .gte("completed_at", thirtyDaysAgo.toISOString()),
      supabase
        .from("quiz_results")
        .select("created_at")
        .eq("user_id", user.id)
        .gte("created_at", thirtyDaysAgo.toISOString()),
      supabase
        .from("doubt_sessions")
        .select("created_at")
        .eq("user_id", user.id)
        .gte("created_at", thirtyDaysAgo.toISOString()),
    ]);
    
    const dates = new Set<string>();
    (progressRes.data || []).forEach(r => { if (r.completed_at) dates.add(new Date(r.completed_at).toISOString().split("T")[0]); });
    (quizRes.data || []).forEach(r => { if (r.created_at) dates.add(new Date(r.created_at).toISOString().split("T")[0]); });
    (doubtRes.data || []).forEach(r => { if (r.created_at) dates.add(new Date(r.created_at).toISOString().split("T")[0]); });
    
    setStudyDates(dates);
    
    if (dates.size === 0) { setDynamicStreak(0); return; }
    
    let streak = 0;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split("T")[0];
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];
    let checkDate = dates.has(todayStr) ? new Date(today) : dates.has(yesterdayStr) ? new Date(yesterday) : null;
    if (checkDate) {
      while (true) {
        const dateStr = checkDate.toISOString().split("T")[0];
        if (dates.has(dateStr)) { streak++; checkDate.setDate(checkDate.getDate() - 1); } else break;
      }
    }
    setDynamicStreak(streak);
  };

  const fetchSubjectProgress = async () => {
    if (!user) return;
    const classLevel = profile?.class_level || "9";
    const { data: subs } = await supabase.from("subjects").select("id, name_en, name_bn, icon").eq("class_level", classLevel).order("sort_order").limit(6);
    if (!subs || subs.length === 0) return;
    const { data: chapters } = await supabase.from("chapters").select("id, subject_id").in("subject_id", subs.map(s => s.id));
    if (!chapters) return;
    const chapterIds = chapters.map(c => c.id);
    const [topicsRes, progressRes] = await Promise.all([
      supabase.from("topics").select("id, chapter_id").in("chapter_id", chapterIds),
      supabase.from("student_progress").select("topic_id, completed").eq("user_id", user.id).eq("completed", true),
    ]);
    const topics = topicsRes.data || [];
    const completedTopicIds = new Set((progressRes.data || []).map((p: any) => p.topic_id));
    const chapterToSubject: Record<string, string> = {};
    chapters.forEach(c => { chapterToSubject[c.id] = c.subject_id; });
    const subjectTopicCount: Record<string, number> = {};
    const subjectCompletedCount: Record<string, number> = {};
    topics.forEach(tp => {
      const subId = chapterToSubject[tp.chapter_id];
      if (!subId) return;
      subjectTopicCount[subId] = (subjectTopicCount[subId] || 0) + 1;
      if (completedTopicIds.has(tp.id)) subjectCompletedCount[subId] = (subjectCompletedCount[subId] || 0) + 1;
    });
    const colors = ["bg-primary", "bg-secondary", "bg-primary/70", "bg-secondary/70", "bg-primary/50", "bg-secondary/50"];
    const progress = subs.map((s, i) => ({
      subject: lang === "bn" ? s.name_bn : s.name_en,
      percent: subjectTopicCount[s.id] ? Math.round(((subjectCompletedCount[s.id] || 0) / subjectTopicCount[s.id]) * 100) : 0,
      color: colors[i % colors.length],
    }));
    setSubjectProgress(progress.slice(0, 4));
    setTotalCompleted(Object.values(subjectCompletedCount).reduce((a, b) => a + b, 0));
    setTotalTopics(Object.values(subjectTopicCount).reduce((a, b) => a + b, 0));
  };

  const createNotification = async (textEn: string, textBn: string) => {
    if (!user) return;
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const { data: existing } = await supabase.from("notifications").select("id").eq("user_id", user.id).eq("text_en", textEn).gte("created_at", todayStart.toISOString()).limit(1);
    if (existing && existing.length > 0) return;
    await supabase.from("notifications").insert({ user_id: user.id, text_en: textEn, text_bn: textBn });
    fetchNotifications();
  };

  const sendDailyMotivation = async () => {
    if (!user) return;
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    const quote = DAILY_QUOTES[dayOfYear % DAILY_QUOTES.length];
    await createNotification(quote.en, quote.bn);
  };

  const sendCoinNotifications = async () => {
    if (!user || !gamification.stats) return;
    const s = gamification.stats;
    // Notify about earning progress
    if (s.coins >= 1000 && s.coins < 1500) {
      await createNotification(
        "🪙 You've earned 1,000+ coins! Check how to use them for discounts.",
        "🪙 আপনি ১,০০০+ কয়েন অর্জন করেছেন! ডিসকাউন্ট কিভাবে পাবেন দেখুন।"
      );
    }
    // Nudge toward discount
    if (s.coins_to_discount > 0 && s.coins_to_discount <= 2000) {
      await createNotification(
        `🎁 Only ${s.coins_to_discount} coins away from max ${s.max_discount_percent}% discount!`,
        `🎁 সর্বোচ্চ ${s.max_discount_percent}% ছাড় পেতে আর মাত্র ${s.coins_to_discount} কয়েন!`
      );
    }
    // Monthly cap warning
    if (s.monthly_coin_cap > 0 && s.monthly_coins_earned >= s.monthly_coin_cap * 0.9) {
      await createNotification(
        "⚠️ You're close to your monthly coin earning limit. Upgrade for higher caps!",
        "⚠️ আপনি মাসিক কয়েন সীমার কাছাকাছি। উচ্চতর সীমার জন্য আপগ্রেড করুন!"
      );
    }
  };

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

  const fetchAIInsight = async () => {
    if (!profile) return;
    setInsightLoading(true);
    setInsightError(false);
    try {
      const { data, error } = await supabase.functions.invoke("ai-insight", {
        body: {
          studentName: profile.full_name?.split(" ")[0] || "Student",
          classLevel: profile.class_level || "9",
          goals: profile.goals, language: lang,
          xp: profile.xp || 0, level: profile.level || 1,
          streakDays: dynamicStreak || profile.streak_days || 0,
          totalCompleted, totalTopics,
        },
      });
      if (!error && data && !data.error) {
        setAiInsight(data);
      } else {
        // On rate limit (429), show a helpful fallback instead of error
        const isRateLimit = data?.error === "Rate limit exceeded." || error?.message?.includes("429");
        if (isRateLimit) {
          setAiInsight({
            insight: lang === "bn"
              ? "তুমি আজ অনেক শিখেছো! একটু বিশ্রাম নাও, তারপর আবার শুরু করো। প্রতিদিন অল্প অল্প করে পড়লে দীর্ঘমেয়াদে অনেক ভালো ফল পাবে।"
              : "You've been learning a lot today! Take a short break, then come back. Consistent daily study leads to the best long-term results.",
            tip_category: "study_technique",
            tip_icon: "📖",
            tasks: [],
          });
        } else {
          setInsightError(true);
        }
      }
    } catch {
      setInsightError(true);
    } finally {
      setInsightLoading(false);
    }
  };

  const canAccess = (requiredPlan: string) => {
    const planOrder = ["free", "basic", "pro", "premium"];
    return planOrder.indexOf(userPlan) >= planOrder.indexOf(requiredPlan);
  };

  const firstName = profile?.full_name?.split(" ")[0] || t("Student", "শিক্ষার্থী");
  const stats = gamification.stats;
  const xp = stats?.xp || profile?.xp || 0;
  const level = stats?.level || profile?.level || 1;
  const coins = stats?.coins || 0;
  const rank = stats?.rank || { en: "Beginner Scholar", bn: "নবীন শিক্ষার্থী", icon: "📘" };

  const leaderboard = useMemo(() => {
    const today = new Date();
    const daySeed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    const competitors = FAKE_NAMES.slice(0, 8).map((name, i) => {
      const r = seededRandom(daySeed + i * 137);
      const baseXp = Math.floor(r * 1200 + 300);
      const dailyBoost = Math.floor(seededRandom(daySeed + i * 53) * 200);
      return { name, xp: baseXp + dailyBoost, isUser: false };
    });
    competitors.push({ name: firstName, xp, isUser: true });
    competitors.sort((a, b) => b.xp - a.xp);
    const top5 = competitors.slice(0, 5);
    const userEntry = competitors.find(c => c.isUser);
    if (!top5.some(c => c.isUser) && userEntry) top5[4] = userEntry;
    const medals = ["🥇", "🥈", "🥉", "", ""];
    return top5.map((c, i) => ({
      rank: competitors.indexOf(c) + 1, name: c.name, xp: c.xp,
      medal: medals[i] || "", isUser: c.isUser,
    }));
  }, [xp, firstName]);

  const streakCalendar = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - (13 - i));
    return { date: d, isStudied: studyDates.has(d.toISOString().split("T")[0]), isToday: i === 13 };
  });

  const quickActions = [
    { icon: BookOpen, label: t("Subjects", "বিষয়সমূহ"), desc: t("Browse chapters", "অধ্যায় দেখুন"), href: "/subjects", plan: "free", color: "text-primary" },
    { icon: GraduationCap, label: t("AI Courses", "AI কোর্স"), desc: t("Generate courses", "কোর্স তৈরি করো"), href: "/courses", plan: "free", color: "text-primary" },
    { icon: MessageCircle, label: t("AI Doubt Solver", "AI সন্দেহ সমাধান"), desc: t("Ask anything", "যেকোনো প্রশ্ন করুন"), href: "/doubt-solver", plan: "free", color: "text-secondary" },
    { icon: Brain, label: t("Study Planner", "স্টাডি প্ল্যানার"), desc: t("AI routine", "AI রুটিন"), href: "/study-plan", plan: "basic", color: "text-primary" },
    { icon: Gamepad2, label: t("Quizzes", "কুইজ"), desc: t("Test yourself", "নিজেকে পরীক্ষা করুন"), href: "/quizzes", plan: "basic", color: "text-destructive" },
    { icon: Compass, label: t("Career Mentor", "ক্যারিয়ার মেন্টর"), desc: t("AI guidance", "AI নির্দেশনা"), href: "/career", plan: "pro", color: "text-secondary" },
    { icon: Trophy, label: t("Skills", "স্কিল শিক্ষা"), desc: t("Learn new skills", "নতুন স্কিল শিখুন"), href: "/skills", plan: "basic", color: "text-primary" },
    { icon: Sparkles, label: t("AI Summary", "AI সারাংশ"), desc: t("Summarize anything", "যেকোনো কিছু সারাংশ"), href: "/smart-summary", plan: "free", color: "text-secondary" },
    { icon: FileText, label: t("Resume Analyzer", "রিজিউমি বিশ্লেষক"), desc: t("AI-powered analysis", "AI বিশ্লেষণ"), href: "/resume-builder", plan: "basic", color: "text-primary" },
    { icon: Presentation, label: t("Slide Generator", "স্লাইড জেনারেটর"), desc: t("AI presentations", "AI প্রেজেন্টেশন"), href: "/slide-generator", plan: "basic", color: "text-secondary" },
    { icon: GraduationCap, label: t("Scholarship", "স্কলারশিপ"), desc: t("Find & apply", "খুঁজুন ও আবেদন"), href: "/scholarship", plan: "free", color: "text-primary" },
    { icon: Mic, label: t("Mock Interview", "মক ইন্টারভিউ"), desc: t("AI-led practice", "AI ইন্টারভিউ অনুশীলন"), href: "/mock-interview", plan: "free", color: "text-destructive" },
    { icon: GraduationCap, label: t("IELTS Prep", "IELTS প্রস্তুতি"), desc: t("All 4 modules", "৪টি মডিউল"), href: "/ielts", plan: "free", color: "text-primary" },
    { icon: GraduationCap, label: t("Study Abroad", "বিদেশে পড়াশোনা"), desc: t("Full guidance", "সম্পূর্ণ গাইডেন্স"), href: "/study-abroad", plan: "free", color: "text-secondary" },
    { icon: FlaskConical, label: t("Research Mentor", "রিসার্চ মেন্টর"), desc: t("Full research guide", "সম্পূর্ণ গবেষণা গাইড"), href: "/research-mentor", plan: "free", color: "text-primary" },
    { icon: Wrench, label: t("Project Helper", "প্রজেক্ট হেল্পার"), desc: t("AI co-pilot for projects", "প্রজেক্টের AI সহযোগী"), href: "/project-helper", plan: "free", color: "text-secondary" },
  ];

  const handleQuickActionClick = (href: string, locked: boolean) => {
    if (locked) {
      navigate("/pricing");
      return;
    }
    if (!user) {
      toast.error(t("Please sign up first to use this feature", "এই ফিচার ব্যবহার করতে আগে সাইন আপ করুন"));
      navigate("/auth");
      return;
    }
    navigate(href);
  };

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-6xl mx-auto overflow-x-hidden">
      {/* Global Gamification Overlays */}
      <XPFloatingText />
      <LevelUpModal />

      {/* 🔥 Section 1: Progress Hero */}
      <ProgressHero
        firstName={firstName}
        rank={rank}
        level={level}
        xp={xp}
        xpInLevel={stats?.xp_in_level || 0}
        xpNeeded={stats?.xp_needed || 100}
        xpProgress={stats?.xp_progress || 0}
        coins={coins}
        streak={dynamicStreak}
        onShopToggle={() => setShowCoinDetails(true)}
      />

      {/* Trial/Subscription Banners - RIGHT AFTER Progress Hero */}
      {trialDaysLeft !== null && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className={`rounded-xl p-3.5 flex items-center justify-between flex-wrap gap-3 ${
            trialDaysLeft > 0 ? "bg-gradient-to-r from-primary/15 to-secondary/15 border border-primary/20" : "bg-destructive/10 border border-destructive/20"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center ${trialDaysLeft > 0 ? "bg-primary/20" : "bg-destructive/20"}`}>
              <Crown className={`w-4 h-4 ${trialDaysLeft > 0 ? "text-primary" : "text-destructive"}`} />
            </div>
            <p className="font-semibold text-foreground text-sm">
              {trialDaysLeft > 0 ? t(`Pro Trial: ${trialDaysLeft} day${trialDaysLeft !== 1 ? "s" : ""} remaining`, `Pro ট্রায়াল: ${trialDaysLeft} দিন বাকি`) : t("Your Pro trial has expired", "আপনার Pro ট্রায়াল শেষ হয়েছে")}
            </p>
          </div>
          <Link to="/pricing" className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 flex items-center gap-1.5">
            <Zap className="w-4 h-4" /> {t("Upgrade Now", "আপগ্রেড করুন")}
          </Link>
        </motion.div>
      )}

      {subscriptionDaysLeft !== null && trialDaysLeft === null && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className={`rounded-xl p-3.5 flex items-center justify-between flex-wrap gap-3 border ${
            subscriptionDaysLeft <= 5
              ? "bg-destructive/15 border-destructive/30"
              : subscriptionDaysLeft <= 10
              ? "bg-destructive/10 border-destructive/20"
              : "bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20"
          }`}
        >
          <div className="flex items-center gap-3">
            <Crown className={`w-5 h-5 ${subscriptionDaysLeft <= 10 ? "text-destructive" : "text-primary"}`} />
            <div>
              <p className={`text-sm font-semibold ${subscriptionDaysLeft <= 10 ? "text-destructive" : "text-foreground"}`}>
                {subscriptionPlanName}
              </p>
              <p className="text-xs text-muted-foreground">
                {subscriptionDaysLeft > 0
                  ? t(`${subscriptionDaysLeft} day${subscriptionDaysLeft !== 1 ? "s" : ""} remaining`, `${subscriptionDaysLeft} দিন বাকি`)
                  : t("Expired", "মেয়াদোত্তীর্ণ")}
              </p>
            </div>
          </div>
          {subscriptionDaysLeft <= 10 && (
            <Link to="/pricing" className={`px-4 py-2 rounded-lg text-sm font-semibold ${
              subscriptionDaysLeft <= 5 ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground"
            }`}>
              <Zap className="w-4 h-4 inline mr-1" /> {t("Renew", "রিনিউ")}
            </Link>
          )}
        </motion.div>
      )}

      {/* 🚀 Quick Actions */}
      <div>
        <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          {t("Quick Actions", "দ্রুত অ্যাকশন")}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map((action, i) => {
            const locked = !canAccess(action.plan);
            return (
              <motion.div key={action.href} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.02 }}>
                <button
                  type="button"
                  onClick={() => handleQuickActionClick(action.href, locked)}
                  className={`card-gradient border border-border rounded-xl p-3.5 flex flex-col gap-1.5 transition-all group h-full ${
                    locked ? "opacity-60" : "hover:-translate-y-1 hover:shadow-glow-primary hover:border-primary/30"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <action.icon className={`w-6 h-6 ${action.color}`} />
                    {locked ? (
                      <Lock className="w-3.5 h-3.5 text-secondary" />
                    ) : (
                      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                  <span className="text-sm font-semibold text-foreground leading-tight">{action.label}</span>
                  <span className="text-[11px] text-muted-foreground leading-tight">{action.desc}</span>
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* 🎯 Section 3: Daily Missions + AI Insight */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DailyMissions
          missions={gamification.missions}
          onClaimBonus={gamification.claimDailyBonus}
        />

        {/* AI Insight - improved */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="card-gradient border border-border rounded-xl p-4 flex flex-col"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-secondary" />
              {t("Today's AI Insight", "আজকের AI পরামর্শ")}
            </h3>
            {!insightLoading && (
              <button
                onClick={fetchAIInsight}
                className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-primary transition-colors"
                title={t("Refresh", "রিফ্রেশ")}
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {insightLoading ? (
            <div className="flex-1 flex items-center justify-center py-6">
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-muted-foreground">{t("Generating insight...", "পরামর্শ তৈরি হচ্ছে...")}</span>
              </div>
            </div>
          ) : insightError ? (
            <div className="flex-1 flex flex-col items-center justify-center py-4 gap-2">
              <p className="text-xs text-muted-foreground">{t("Couldn't load insight", "পরামর্শ লোড হয়নি")}</p>
              <button onClick={fetchAIInsight} className="text-xs text-primary font-semibold hover:underline flex items-center gap-1">
                <RefreshCw className="w-3 h-3" /> {t("Try again", "আবার চেষ্টা করো")}
              </button>
            </div>
          ) : aiInsight ? (
            <div className="flex-1 flex flex-col justify-between gap-3">
              {aiInsight.tip_category && (
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-base">{aiInsight.tip_icon || "💡"}</span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-primary/80">
                    {aiInsight.tip_category === "study_technique" ? t("Study Technique", "পড়ার কৌশল") :
                     aiInsight.tip_category === "memorization" ? t("Memorization", "মুখস্থ কৌশল") :
                     aiInsight.tip_category === "skill_development" ? t("Skill Development", "দক্ষতা উন্নয়ন") :
                     aiInsight.tip_category === "self_improvement" ? t("Self Improvement", "আত্মউন্নয়ন") :
                     aiInsight.tip_category === "time_management" ? t("Time Management", "সময় ব্যবস্থাপনা") :
                     aiInsight.tip_category === "exam_prep" ? t("Exam Prep", "পরীক্ষার প্রস্তুতি") :
                     aiInsight.tip_category === "focus" ? t("Focus", "মনোযোগ") :
                     t("Practical Tip", "ব্যবহারিক পরামর্শ")}
                  </span>
                </div>
              )}
              <p className="text-sm text-foreground leading-relaxed">{aiInsight.insight}</p>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center py-6">
              <p className="text-xs text-muted-foreground">{t("No insight available", "কোনো পরামর্শ নেই")}</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* 🪙 Coin Economy Widget - clickable */}
      <div className="cursor-pointer" onClick={() => setShowCoinDetails(true)}>
        <CoinEconomyWidget
          coins={coins}
          monthlyEarned={stats?.monthly_coins_earned || 0}
          monthlyCap={stats?.monthly_coin_cap || 15000}
          dailyEarned={stats?.daily_coins_earned || 0}
          dailyCap={stats?.daily_coin_cap || 1200}
          coinMultiplier={stats?.coin_multiplier || 1}
          discountProgress={stats?.discount_progress || 0}
          coinsToDiscount={stats?.coins_to_discount || 0}
          currentDiscountPercent={stats?.current_discount_percent || 0}
          discountBdt={stats?.discount_bdt || 0}
          maxDiscountPercent={stats?.max_discount_percent || 20}
          planPrice={stats?.plan_price || 399}
        />
      </div>

      {/* Reward Store Button + Shop */}
      <div className="space-y-3">
        <div className="flex justify-center">
          <button
            onClick={() => setShowShop(!showShop)}
            className="px-5 py-2.5 rounded-xl bg-secondary/10 border border-secondary/20 text-secondary text-sm font-semibold hover:bg-secondary/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
          >
            🛍️ {t("Open Reward Store", "রিওয়ার্ড স্টোর খুলুন")} • 🪙 {coins}
          </button>
        </div>
        <AnimatePresence>
          {showShop && (
            <CoinShop coins={coins} onBuy={async (type, id, cost) => { 
              const result = await gamification.buyItem(type, id, cost); 
              await fetchOwnedItems(); 
              if (result?.success && id === "dark_pro") setThemeMode("dark_pro");
            }} onClose={() => setShowShop(false)} ownedItems={ownedItems} />
          )}
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <WeeklyProgress
          subjectProgress={subjectProgress}
          totalCompleted={totalCompleted}
          totalTopics={totalTopics}
        />

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="card-gradient border border-border rounded-xl p-4"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Flame className="w-4 h-4 text-destructive" />
              {t("Study Streak", "স্টাডি স্ট্রিক")}
            </h3>
            <div className="flex items-center gap-2">
              {dynamicStreak > 0 && (
                <span className="text-xs bg-destructive/10 text-destructive px-2.5 py-1 rounded-full font-bold flex items-center gap-1">
                  <span className="animate-flame-pulse inline-block">🔥</span> {dynamicStreak} {t("days", "দিন")}
                </span>
              )}
            </div>
          </div>
          
          {/* Streak milestone */}
          {dynamicStreak > 0 && (
            <div className="mb-3 p-2.5 rounded-lg bg-gradient-to-r from-destructive/5 to-primary/5 border border-destructive/10">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{t("Next milestone", "পরবর্তী মাইলস্টোন")}</span>
                <span className="font-bold text-destructive">
                  {dynamicStreak < 7 ? `${7 - dynamicStreak} ${t("days to 🏅 7-day!", "দিন বাকি 🏅 ৭ দিন!")}`
                    : dynamicStreak < 30 ? `${30 - dynamicStreak} ${t("days to 🏆 30-day!", "দিন বাকি 🏆 ৩০ দিন!")}`
                    : `🔥 ${t("Legendary!", "কিংবদন্তি!")}`}
                </span>
              </div>
            </div>
          )}
          
          {/* 21-day calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 21 }, (_, i) => {
              const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - (20 - i));
              const dateStr = d.toISOString().split("T")[0];
              const isStudied = studyDates.has(dateStr);
              const isToday = i === 20;
              const isFuture = false;
              const dayNum = d.getDate();
              const showWeekday = i < 7;
              
              return (
                <div key={i} className="text-center">
                  {showWeekday && (
                    <div className="text-[9px] text-muted-foreground mb-0.5 font-medium">
                      {d.toLocaleDateString(lang === "bn" ? "bn-BD" : "en", { weekday: "narrow" })}
                    </div>
                  )}
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: i * 0.015, type: "spring", stiffness: 300 }}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-semibold mx-auto transition-all relative ${
                    isToday
                        ? isStudied
                          ? "bg-primary text-primary-foreground ring-2 ring-primary/40 shadow-md"
                          : "bg-destructive/20 text-destructive ring-2 ring-destructive/30 font-bold"
                        : isStudied
                        ? "bg-primary/80 text-primary-foreground shadow-sm"
                        : "bg-destructive/10 text-destructive/70"
                    }`}
                    title={`${d.toLocaleDateString()} ${isStudied ? "✓" : ""}`}
                  >
                    {isStudied ? (
                      <motion.span 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: i * 0.015 + 0.1, type: "spring" }}
                      >
                        ✓
                      </motion.span>
                    ) : dayNum}
                    {isToday && (
                      <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                    )}
                  </motion.div>
                </div>
              );
            })}
          </div>
          
          {/* Summary */}
          <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t border-border/50">
            <span>{t("Last 21 days", "গত ২১ দিন")}: {studyDates.size} {t("active", "সক্রিয়")}</span>
            <span className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded bg-primary/80" /> = {t("studied", "পড়াশোনা করেছেন")}
            </span>
          </div>
        </motion.div>
      </div>

      {/* 🏆 Section 5: Achievements + Leaderboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AchievementWall
          achievements={gamification.achievements}
          earnedCount={stats?.achievements_earned || 0}
          totalCount={stats?.achievements_total || 0}
        />

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="card-gradient border border-border rounded-xl p-4"
        >
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-3">
            <Crown className="w-4 h-4 text-secondary" />
            {t("Weekly Leaderboard", "সাপ্তাহিক লিডারবোর্ড")}
          </h3>
          <div className="space-y-1.5">
            {leaderboard.map((p, i) => (
              <motion.div
                key={p.rank}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`flex items-center gap-3 p-2 rounded-lg transition-all ${
                  p.isUser ? "bg-primary/10 border border-primary/20" : "hover:bg-accent/30"
                }`}
              >
                <span className="text-lg w-8 text-center">{p.medal || `#${p.rank}`}</span>
                <span className="flex-1 text-sm font-medium text-foreground">
                  {p.name} {p.isUser && <span className="text-xs text-primary font-bold">({t("You", "তুমি")})</span>}
                </span>
                <span className="text-sm text-primary font-bold">{p.xp} XP</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>


      {/* Coin Details Modal */}
      <CoinDetailsModal
        open={showCoinDetails}
        onClose={() => setShowCoinDetails(false)}
        coins={coins}
        monthlyEarned={stats?.monthly_coins_earned || 0}
        monthlyCap={stats?.monthly_coin_cap || 15000}
        dailyEarned={stats?.daily_coins_earned || 0}
        dailyCap={stats?.daily_coin_cap || 1200}
        coinMultiplier={stats?.coin_multiplier || 1}
        discountProgress={stats?.discount_progress || 0}
        coinsToDiscount={stats?.coins_to_discount || 0}
        currentDiscountPercent={stats?.current_discount_percent || 0}
        discountBdt={stats?.discount_bdt || 0}
        maxDiscountPercent={stats?.max_discount_percent || 20}
        planPrice={stats?.plan_price || 399}
        level={level}
        streak={dynamicStreak}
      />


      {/* Upgrade CTA */}
      {userPlan === "free" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-hero-gradient rounded-xl p-5 text-primary-foreground"
        >
          <div className="flex items-center gap-2 mb-2">
            <Crown className="w-5 h-5" />
            <h3 className="font-bold">{t("Upgrade to Pro", "Pro তে আপগ্রেড করো")}</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm mb-3">
            <span>✔ {t("Unlimited Mock Interviews", "আনলিমিটেড মক ইন্টারভিউ")}</span>
            <span>✔ {t("Resume Analyzer", "রিজিউম অ্যানালাইজার")}</span>
            <span>✔ {t("AI Study Plan", "AI স্টাডি প্ল্যান")}</span>
          </div>
          <Link to="/pricing" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-background/20 hover:bg-background/30 text-sm font-semibold transition-colors">
            {t("View Plans", "প্ল্যান দেখো")} <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      )}
    </div>
  );
};

export default Dashboard;
