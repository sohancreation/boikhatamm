import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ADMIN_EMAIL = Deno.env.get("SUPER_ADMIN_EMAIL") || "";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Verify caller is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Not authenticated");

    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) throw new Error("Not authenticated");

    // Check if user is the designated admin and auto-assign role if needed
    if (user.email === ADMIN_EMAIL) {
      const { data: hasRole } = await supabaseAdmin.rpc("has_role", { _user_id: user.id, _role: "super_admin" });
      if (!hasRole) {
        await supabaseAdmin.from("user_roles").insert({ user_id: user.id, role: "super_admin" });
      }
    }

    // Now check admin role
    const { data: isAdmin } = await supabaseAdmin.rpc("has_role", { _user_id: user.id, _role: "super_admin" });
    if (!isAdmin) throw new Error("Unauthorized: admin access required");

    const { action, data } = await req.json();

    switch (action) {
      case "list-users": {
        const { data: authUsers, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
        if (error) throw error;

        const { data: profiles } = await supabaseAdmin.from("profiles").select("*");
        const { data: roles } = await supabaseAdmin.from("user_roles").select("*");
        const { data: subscriptions } = await supabaseAdmin.from("user_subscriptions").select("*, subscription_plans(*)").order("created_at", { ascending: false });

        const users = authUsers.users.map((u: any) => {
          const profile = profiles?.find((p: any) => p.user_id === u.id);
          const userRoles = roles?.filter((r: any) => r.user_id === u.id) || [];
          const userSubs = subscriptions?.filter((s: any) => s.user_id === u.id) || [];
          return {
            id: u.id,
            email: u.email,
            created_at: u.created_at,
            last_sign_in_at: u.last_sign_in_at,
            profile,
            roles: userRoles,
            subscriptions: userSubs,
          };
        });

        return new Response(JSON.stringify({ users }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "list-pending-payments": {
        const { data: allPayments } = await supabaseAdmin
          .from("payment_transactions")
          .select("*")
          .order("created_at", { ascending: false });

        const { data: profiles } = await supabaseAdmin.from("profiles").select("user_id, full_name");

        const enriched = (allPayments || []).map((p: any) => ({
          ...p,
          user_name: profiles?.find((pr: any) => pr.user_id === p.user_id)?.full_name || "Unknown",
        }));

        return new Response(JSON.stringify({ payments: enriched }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "approve-payment": {
        const { transactionId, planId, userId } = data;

        await supabaseAdmin
          .from("payment_transactions")
          .update({ status: "approved" })
          .eq("id", transactionId);

        const { data: plan } = await supabaseAdmin
          .from("subscription_plans")
          .select("*")
          .eq("id", planId)
          .single();

        if (plan) {
          await supabaseAdmin
            .from("user_subscriptions")
            .update({ status: "expired" })
            .eq("user_id", userId)
            .eq("status", "active");

          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + plan.duration_days);

          await supabaseAdmin.from("user_subscriptions").insert({
            user_id: userId,
            plan_id: planId,
            started_at: new Date().toISOString(),
            expires_at: expiresAt.toISOString(),
            status: "active",
            payment_method: "manual_approval",
          });

          await supabaseAdmin
            .from("user_subscriptions")
            .update({ status: "active", expires_at: expiresAt.toISOString() })
            .eq("user_id", userId)
            .eq("status", "pending");


          // Send notification to user
          await supabaseAdmin.from("notifications").insert({
            user_id: userId,
            text_en: `✅ Your payment has been approved! You now have ${plan.name_en} access for ${plan.duration_days} days.`,
            text_bn: `✅ আপনার পেমেন্ট অনুমোদিত হয়েছে! ${plan.name_bn} প্ল্যান ${plan.duration_days} দিনের জন্য সক্রিয়।`,
            is_read: false,
          });
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "reject-payment": {
        const { transactionId: txId } = data;
        await supabaseAdmin
          .from("payment_transactions")
          .update({ status: "rejected" })
          .eq("id", txId);

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "give-subscription": {
        const { userId: subUserId, planId: subPlanId } = data;

        const { data: plan } = await supabaseAdmin
          .from("subscription_plans")
          .select("*")
          .eq("id", subPlanId)
          .single();

        if (!plan) throw new Error("Plan not found");

        await supabaseAdmin
          .from("user_subscriptions")
          .update({ status: "expired" })
          .eq("user_id", subUserId)
          .eq("status", "active");

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + plan.duration_days);

        const { error: insertError } = await supabaseAdmin.from("user_subscriptions").insert({
          user_id: subUserId,
          plan_id: subPlanId,
          started_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
          status: "active",
          payment_method: "admin_granted",
        });
        if (insertError) throw new Error(`Failed to create subscription: ${insertError.message}`);

        // Send notification to user
        await supabaseAdmin.from("notifications").insert({
          user_id: subUserId,
          text_en: `🎉 You've been upgraded to ${plan.name_en}! Enjoy your new features for ${plan.duration_days} days.`,
          text_bn: `🎉 আপনাকে ${plan.name_bn} প্ল্যানে আপগ্রেড করা হয়েছে! ${plan.duration_days} দিন নতুন সুবিধা উপভোগ করুন।`,
          is_read: false,
        });

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "delete-user": {
        const { userId: delUserId } = data;
        const { error } = await supabaseAdmin.auth.admin.deleteUser(delUserId);
        if (error) throw error;

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "list-profile-edits": {
        const { data: editLogs } = await supabaseAdmin
          .from("profile_edit_logs")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(200);

        const { data: profiles } = await supabaseAdmin.from("profiles").select("user_id, full_name");

        const enriched = (editLogs || []).map((log: any) => ({
          ...log,
          user_name: profiles?.find((p: any) => p.user_id === log.user_id)?.full_name || "Unknown",
        }));

        return new Response(JSON.stringify({ edits: enriched }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        return new Response(JSON.stringify({ error: "Invalid action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (e) {
    console.error("admin-panel error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
