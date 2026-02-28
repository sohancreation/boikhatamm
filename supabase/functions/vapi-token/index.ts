import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MAX_DAILY_VAPI_CALLS = 10;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    if (authError || !authUser) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = authUser.id;

    const { type } = await req.json();

    if (type !== "ielts" && type !== "interview") {
      return new Response(JSON.stringify({ error: "Invalid type" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Rate limit: max N VAPI calls per user per day
    const serviceClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const today = new Date().toISOString().split("T")[0];
    
    // Check user's subscription plan for access control
    const { data: userPlan } = await serviceClient.rpc("get_user_plan", { _user_id: userId });
    if (userPlan === "free") {
      return new Response(JSON.stringify({ error: "Voice features require an active subscription" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Count today's VAPI usage from xp_logs (we log vapi_call actions)
    const { count } = await serviceClient
      .from("xp_logs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("action", "vapi_call")
      .gte("created_at", `${today}T00:00:00Z`);

    if ((count || 0) >= MAX_DAILY_VAPI_CALLS) {
      return new Response(JSON.stringify({ error: "Daily voice call limit reached. Try again tomorrow." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Log this VAPI call for rate limiting
    await serviceClient.from("xp_logs").insert({
      user_id: userId,
      action: "vapi_call",
      xp_earned: 0,
      coins_earned: 0,
      metadata: { type, date: today },
    });

    let apiKey: string | undefined;
    let assistantId: string | undefined;

    if (type === "ielts") {
      apiKey = Deno.env.get("VAPI_API_KEY_IELTS");
      assistantId = "6cc3b8b4-ef91-4e50-83d8-cd4fb3470e17";
    } else {
      apiKey = Deno.env.get("VAPI_API_KEY_INTERVIEW");
      assistantId = "337310a9-5b35-4585-8cfc-4604d1b9ee1a";
    }

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "VAPI not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract actual API key if the secret contains an HTML embed snippet
    let cleanKey = apiKey;
    if (apiKey.includes("<script") || apiKey.includes("vapiSDK")) {
      const match = apiKey.match(/apiKey:\s*"([^"]+)"/);
      if (match?.[1]) {
        cleanKey = match[1];
      }
    }

    return new Response(JSON.stringify({ apiKey: cleanKey, assistantId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("vapi-token error:", e);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
