import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Server-side coupon definitions
const VALID_COUPONS: Record<string, number> = {
  "WELCOME10": 10,
  "STUDY20": 20,
  "LEARN15": 15,
  "BOIKHATA25": 25,
};

// Max discount percent by plan type
const MAX_COIN_DISCOUNT: Record<string, number> = {
  basic: 20,
  pro: 25,
  premium: 30,
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub as string;
    const serviceClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const body = await req.json();
    const { action } = body;

    if (action === "validate_coupon") {
      const code = (body.coupon_code || "").trim().toUpperCase();
      const discount = VALID_COUPONS[code];
      if (!discount) {
        return new Response(JSON.stringify({ valid: false, error: "Invalid coupon code" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ valid: true, discount_percent: discount, code }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "validate_coin_discount") {
      const { plan_type, base_price } = body;
      if (!plan_type || typeof base_price !== "number" || base_price <= 0) {
        return new Response(JSON.stringify({ error: "Invalid parameters" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Fetch user's actual coin balance from database
      const { data: profile } = await serviceClient
        .from("profiles")
        .select("coins")
        .eq("user_id", userId)
        .single();

      const coins = profile?.coins || 0;
      const maxDiscountPercent = MAX_COIN_DISCOUNT[plan_type] || 20;

      // Calculate discount: 1 coin = ৳1 discount, capped at max%
      const maxDiscountBdt = Math.round(base_price * maxDiscountPercent / 100);
      const discountBdt = Math.min(coins, maxDiscountBdt);
      const discountPercent = base_price > 0 ? Math.round((discountBdt / base_price) * 100) : 0;

      return new Response(JSON.stringify({
        valid: true,
        coins_available: coins,
        discount_bdt: discountBdt,
        discount_percent: discountPercent,
        max_discount_percent: maxDiscountPercent,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "calculate_final_price") {
      const { plan_id, billing_cycle, use_coin_discount, coupon_code } = body;

      // Fetch plan from database
      const { data: plan } = await serviceClient
        .from("subscription_plans")
        .select("*")
        .eq("id", plan_id)
        .single();

      if (!plan) {
        return new Response(JSON.stringify({ error: "Plan not found" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Determine base price
      const annualPrices: Record<string, number> = { basic: 3999, pro: 7999, premium: 14999 };
      let basePrice = billing_cycle === "annual"
        ? (annualPrices[plan.plan_type] || plan.price_bdt * 10)
        : plan.price_bdt;

      let coinDiscountApplied = 0;
      let couponDiscountApplied = 0;
      let price = basePrice;

      // Apply coin discount first
      if (use_coin_discount) {
        const { data: profile } = await serviceClient
          .from("profiles")
          .select("coins")
          .eq("user_id", userId)
          .single();

        const coins = profile?.coins || 0;
        const maxPercent = MAX_COIN_DISCOUNT[plan.plan_type] || 20;
        const maxBdt = Math.round(price * maxPercent / 100);
        coinDiscountApplied = Math.min(coins, maxBdt);
        price -= coinDiscountApplied;
      }

      // Apply coupon discount
      if (coupon_code) {
        const code = coupon_code.trim().toUpperCase();
        const couponPercent = VALID_COUPONS[code];
        if (couponPercent) {
          couponDiscountApplied = Math.round(price * couponPercent / 100);
          price -= couponDiscountApplied;
        }
      }

      const finalPrice = Math.max(0, Math.round(price));

      return new Response(JSON.stringify({
        base_price: basePrice,
        coin_discount: coinDiscountApplied,
        coupon_discount: couponDiscountApplied,
        final_price: finalPrice,
        plan_name: plan.name_en,
        plan_type: plan.plan_type,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("validate-payment error:", e);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
