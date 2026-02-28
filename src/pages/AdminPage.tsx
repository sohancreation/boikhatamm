import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Users, CreditCard, Trash2, CheckCircle, XCircle,
  Loader2, Gift, Search, RefreshCw, AlertTriangle, Crown,
  Mail, Calendar, Clock, LogOut, Moon, Sun, Phone, GraduationCap,
  BookOpen, Target, Globe, History,
} from "lucide-react";
import { toast } from "sonner";

type AdminTab = "users" | "payments" | "profile-edits";

interface UserData {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  profile: any;
  roles: any[];
  subscriptions: any[];
}

interface PaymentData {
  id: string;
  user_id: string;
  amount_bdt: number;
  payment_method: string;
  transaction_id: string;
  status: string;
  created_at: string;
  metadata: any;
  user_name: string;
}

const AdminPage = () => {
  const { t } = useLanguage();
  const { isDark, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [tab, setTab] = useState<AdminTab>("users");
  const [users, setUsers] = useState<UserData[]>([]);
  const [payments, setPayments] = useState<PaymentData[]>([]);
  const [profileEdits, setProfileEdits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [plans, setPlans] = useState<any[]>([]);
  const [expandedPlanUser, setExpandedPlanUser] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ userId: string; email: string } | null>(null);
  const [paymentFilter, setPaymentFilter] = useState("all");

  // Check admin role via edge function (which also auto-assigns role for admin email)
  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    const checkAdmin = async () => {
      try {
        // Call edge function - it auto-assigns super_admin for the admin email
        const { data: result, error } = await supabase.functions.invoke("admin-panel", {
          body: { action: "list-users" },
        });
        if (error || result?.error) {
          navigate("/dashboard");
          toast.error("Access denied");
        } else {
          setIsAdmin(true);
        }
      } catch {
        navigate("/dashboard");
        toast.error("Access denied");
      }
    };
    checkAdmin();
  }, [user, navigate]);

  const callAdmin = useCallback(async (action: string, data?: any) => {
    const { data: result, error } = await supabase.functions.invoke("admin-panel", {
      body: { action, data },
    });
    if (error) throw new Error(error.message);
    if (result?.error) throw new Error(result.error);
    return result;
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, paymentsRes, plansRes, editsRes] = await Promise.all([
        callAdmin("list-users"),
        callAdmin("list-pending-payments"),
        supabase.from("subscription_plans").select("*").eq("is_active", true).order("price_bdt"),
        callAdmin("list-profile-edits"),
      ]);
      setUsers(usersRes.users || []);
      setPayments(paymentsRes.payments || []);
      setPlans(plansRes.data || []);
      setProfileEdits(editsRes.edits || []);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [callAdmin]);

  useEffect(() => {
    if (isAdmin) fetchData();
  }, [isAdmin, fetchData]);

  const handleApprovePayment = async (payment: PaymentData) => {
    setActionLoading(payment.id);
    try {
      const planId = payment.metadata?.plan_id;
      if (!planId) throw new Error("No plan ID in payment metadata");
      await callAdmin("approve-payment", { transactionId: payment.id, planId, userId: payment.user_id });
      toast.success(t("Payment approved!", "পেমেন্ট অনুমোদিত!"));
      fetchData();
    } catch (e: any) { toast.error(e.message); }
    finally { setActionLoading(null); }
  };

  const handleRejectPayment = async (paymentId: string) => {
    setActionLoading(paymentId);
    try {
      await callAdmin("reject-payment", { transactionId: paymentId });
      toast.success(t("Payment rejected", "পেমেন্ট প্রত্যাখ্যাত"));
      fetchData();
    } catch (e: any) { toast.error(e.message); }
    finally { setActionLoading(null); }
  };

  const handleGrantPlan = async (userId: string, planId: string) => {
    setActionLoading(userId);
    try {
      await callAdmin("give-subscription", { userId, planId });
      toast.success(t("Subscription granted!", "সাবস্ক্রিপশন দেওয়া হয়েছে!"));
      setExpandedPlanUser(null);
      fetchData();
    } catch (e: any) { toast.error(e.message); }
    finally { setActionLoading(null); }
  };

  const handleDeleteUser = async (userId: string) => {
    setActionLoading(userId);
    try {
      await callAdmin("delete-user", { userId });
      toast.success(t("User deleted", "ইউজার ডিলিট হয়েছে"));
      setDeleteConfirm(null);
      fetchData();
    } catch (e: any) { toast.error(e.message); }
    finally { setActionLoading(null); }
  };

  const filteredUsers = users.filter(u =>
    (u.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.profile?.full_name || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPayments = payments.filter(p =>
    paymentFilter === "all" ? true : p.status === paymentFilter
  );

  const pendingCount = payments.filter(p => p.status === "pending").length;

  const getActivePlan = (u: UserData) => {
    const activeSub = u.subscriptions?.find((s: any) => s.status === "active" && new Date(s.expires_at) > new Date());
    return activeSub?.subscription_plans;
  };

  if (isAdmin === null) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-background font-bangla">
      {/* Admin Header */}
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-xl border-b border-border h-14 flex items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-primary" />
          <span className="text-lg font-bold text-gradient">BoiKhata Admin</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground">
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors font-medium">
            <LogOut className="w-4 h-4" /> {t("Logout", "লগআউট")}
          </button>
        </div>
      </header>

      <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
          <Shield className="w-7 h-7 text-primary" />
          {t("Admin Panel", "অ্যাডমিন প্যানেল")}
        </h1>
        <p className="text-muted-foreground mt-1">{t("Manage users, subscriptions & payments", "ইউজার, সাবস্ক্রিপশন ও পেমেন্ট ম্যানেজ করুন")}</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: t("Total Users", "মোট ইউজার"), value: users.length, icon: Users, color: "text-primary" },
          { label: t("Pending Payments", "পেন্ডিং পেমেন্ট"), value: pendingCount, icon: Clock, color: pendingCount > 0 ? "text-yellow-500" : "text-muted-foreground" },
          { label: t("Active Subscriptions", "সক্রিয় সাবস্ক্রিপশন"), value: users.filter(u => getActivePlan(u)).length, icon: Crown, color: "text-primary" },
          { label: t("Total Revenue", "মোট আয়"), value: `৳${payments.filter(p => p.status === "approved").reduce((s, p) => s + Number(p.amount_bdt), 0)}`, icon: CreditCard, color: "text-primary" },
        ].map((stat, i) => (
          <div key={i} className="card-gradient border border-border rounded-xl p-4">
            <stat.icon className={`w-5 h-5 ${stat.color} mb-1`} />
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button onClick={() => setTab("users")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === "users" ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:bg-accent"}`}>
          <Users className="w-4 h-4" /> {t("Users", "ইউজার")}
        </button>
        <button onClick={() => setTab("payments")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all relative ${tab === "payments" ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:bg-accent"}`}>
          <CreditCard className="w-4 h-4" /> {t("Payments", "পেমেন্ট")}
          {pendingCount > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full text-xs flex items-center justify-center font-bold">{pendingCount}</span>}
        </button>
        <button onClick={() => setTab("profile-edits")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === "profile-edits" ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:bg-accent"}`}>
          <History className="w-4 h-4" /> {t("Profile Changes", "প্রোফাইল পরিবর্তন")}
        </button>
        <button onClick={fetchData} disabled={loading} className="ml-auto p-2.5 rounded-xl bg-card border border-border text-muted-foreground hover:bg-accent">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* ═══ USERS TAB ═══ */}
      {tab === "users" && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder={t("Search by name or email...", "নাম বা ইমেইল দিয়ে খুঁজুন...")}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : (
            <div className="space-y-3">
              {filteredUsers.map(u => {
                const activePlan = getActivePlan(u);
                const isSuper = u.roles?.some((r: any) => r.role === "super_admin");
                return (
                  <motion.div key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="card-gradient border border-border rounded-xl p-4">
                    <div className="flex flex-col gap-3">
                      {/* Top row: name, badges, actions */}
                      <div className="flex flex-col md:flex-row md:items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-bold text-foreground">{u.profile?.full_name || "No Name"}</h4>
                            {isSuper && <span className="px-2 py-0.5 rounded-full bg-destructive/10 text-destructive text-xs font-bold">Admin</span>}
                            {activePlan ? (
                              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold">
                                {activePlan.name_en}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs font-bold">Free</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => setExpandedPlanUser(expandedPlanUser === u.id ? null : u.id)}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${expandedPlanUser === u.id ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary hover:bg-primary/20"}`}>
                            <Gift className="w-3.5 h-3.5" /> {t("Give Plan", "প্ল্যান দিন")}
                          </button>
                          {!isSuper && (
                            <button onClick={() => setDeleteConfirm({ userId: u.id, email: u.email || "" })}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive text-xs font-semibold hover:bg-destructive/20">
                              <Trash2 className="w-3.5 h-3.5" /> {t("Delete", "ডিলিট")}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Inline plan toggle */}
                      <AnimatePresence>
                        {expandedPlanUser === u.id && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden">
                            <div className="flex gap-2 flex-wrap">
                              {plans.filter(p => p.price_bdt > 0 && p.name_en !== "Free Trial").map(plan => (
                                <button key={plan.id} onClick={() => handleGrantPlan(u.id, plan.id)}
                                  disabled={actionLoading === u.id}
                                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-background hover:bg-primary hover:text-primary-foreground text-sm font-medium transition-all disabled:opacity-50">
                                  <Crown className="w-3.5 h-3.5" />
                                  <span className="font-bold">{plan.name_en}</span>
                                  <span className="text-xs opacity-70">৳{plan.price_bdt}</span>
                                  {actionLoading === u.id && <Loader2 className="w-3 h-3 animate-spin" />}
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Detail grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-primary/60" />
                          <span className="truncate">{u.email}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-primary/60" />
                          <span>{u.profile?.mobile_number || "N/A"}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <GraduationCap className="w-3.5 h-3.5 text-primary/60" />
                          <span>{u.profile?.class_level ? `Class ${u.profile.class_level}` : "N/A"}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-primary/60" />
                          <span>{u.profile?.board || "N/A"}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Target className="w-3.5 h-3.5 text-primary/60" />
                          <span>{u.profile?.goals || "N/A"}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5 text-primary/60" />
                          <span>{u.profile?.language === "bn" ? "বাংলা" : "English"}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-primary/60" />
                          <span>{t("Joined", "যোগদান")}: {new Date(u.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-primary/60" />
                          <span>{t("Last login", "শেষ লগইন")}: {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString() : "N/A"}</span>
                        </div>
                      </div>

                      {/* Active subscription details */}
                      {activePlan && (
                        <div className="flex items-center gap-2 text-xs bg-primary/5 rounded-lg px-3 py-2 border border-primary/10">
                          <Crown className="w-3.5 h-3.5 text-primary" />
                          <span className="text-foreground font-medium">{activePlan.name_en}</span>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-muted-foreground">
                            {t("Expires", "মেয়াদ শেষ")}: {new Date(u.subscriptions?.find((s: any) => s.status === "active")?.expires_at).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ═══ PAYMENTS TAB ═══ */}
      {tab === "payments" && (
        <div className="space-y-4">
          <div className="flex gap-2 overflow-x-auto">
            {["all", "pending", "approved", "rejected"].map(f => (
              <button key={f} onClick={() => setPaymentFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize whitespace-nowrap ${paymentFilter === f ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:bg-accent"}`}>
                {f === "all" ? t("All", "সব") : f === "pending" ? t("Pending", "পেন্ডিং") : f === "approved" ? t("Approved", "অনুমোদিত") : t("Rejected", "প্রত্যাখ্যাত")}
                {f === "pending" && pendingCount > 0 && ` (${pendingCount})`}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : filteredPayments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">{t("No payments found", "কোনো পেমেন্ট পাওয়া যায়নি")}</div>
          ) : (
            <div className="space-y-3">
              {filteredPayments.map(p => (
                <motion.div key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className={`card-gradient border rounded-xl p-4 ${p.status === "pending" ? "border-yellow-500/50" : "border-border"}`}>
                  <div className="flex flex-col md:flex-row md:items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-foreground">{p.user_name}</h4>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                          p.status === "pending" ? "bg-yellow-500/10 text-yellow-600" :
                          p.status === "approved" ? "bg-primary/10 text-primary" :
                          "bg-destructive/10 text-destructive"
                        }`}>{p.status}</span>
                        <span className="text-sm font-bold text-foreground">৳{p.amount_bdt}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                        <span className="capitalize">{p.payment_method}</span>
                        <span>TrxID: <span className="font-mono font-bold text-foreground">{p.transaction_id}</span></span>
                        {p.metadata?.sender_number && <span>From: <span className="font-mono">{p.metadata.sender_number}</span></span>}
                        <span>{new Date(p.created_at).toLocaleString()}</span>
                        {p.metadata?.plan_name && <span>Plan: {p.metadata.plan_name}</span>}
                      </div>
                    </div>
                    {p.status === "pending" && (
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleApprovePayment(p)} disabled={actionLoading === p.id}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 disabled:opacity-50">
                          {actionLoading === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                          {t("Approve", "অনুমোদন")}
                        </button>
                        <button onClick={() => handleRejectPayment(p.id)} disabled={actionLoading === p.id}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive text-xs font-semibold hover:bg-destructive/20 disabled:opacity-50">
                          <XCircle className="w-3.5 h-3.5" /> {t("Reject", "প্রত্যাখ্যান")}
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══ PROFILE EDITS TAB ═══ */}
      {tab === "profile-edits" && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{t("Recent profile changes by users (before → after)", "ইউজারদের সাম্প্রতিক প্রোফাইল পরিবর্তন (আগে → পরে)")}</p>
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : profileEdits.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">{t("No profile changes found", "কোনো প্রোফাইল পরিবর্তন পাওয়া যায়নি")}</div>
          ) : (
            <div className="space-y-2">
              {profileEdits.map((edit: any) => (
                <motion.div key={edit.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="card-gradient border border-border rounded-xl p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-foreground">{edit.user_name}</span>
                      <span className="px-2 py-0.5 rounded-full bg-accent text-xs font-medium text-muted-foreground">{edit.field_name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{new Date(edit.created_at).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-2 py-1 rounded-md bg-destructive/10 text-destructive font-mono truncate max-w-[40%]">{edit.old_value || "—"}</span>
                    <span className="text-muted-foreground">→</span>
                    <span className="px-2 py-1 rounded-md bg-primary/10 text-primary font-mono truncate max-w-[40%]">{edit.new_value || "—"}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══ DELETE CONFIRM MODAL ═══ */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
            onClick={() => setDeleteConfirm(null)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()}
              className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-6 h-6" />
                <h3 className="text-lg font-bold">{t("Delete User?", "ইউজার ডিলিট করবেন?")}</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                {t("This will permanently delete", "এটি স্থায়ীভাবে ডিলিট করবে")} <span className="font-bold text-foreground">{deleteConfirm.email}</span>. {t("This cannot be undone.", "এটি পূর্বাবস্থায় ফেরানো যাবে না।")}
              </p>
              <div className="flex gap-2">
                <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-accent">
                  {t("Cancel", "বাতিল")}
                </button>
                <button onClick={() => handleDeleteUser(deleteConfirm.userId)} disabled={actionLoading === deleteConfirm.userId}
                  className="flex-1 py-2.5 rounded-xl bg-destructive text-destructive-foreground text-sm font-bold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-1">
                  {actionLoading === deleteConfirm.userId ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  {t("Delete", "ডিলিট")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
};

export default AdminPage;
