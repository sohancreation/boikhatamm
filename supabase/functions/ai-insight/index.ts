import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claimsData, error: claimsError } = await sb.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const bodyText = await req.text();
    if (new TextEncoder().encode(bodyText).length > 10 * 1024) {
      return new Response(JSON.stringify({ error: "Payload too large" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { studentName, classLevel, goals, language, xp, level, streakDays, totalCompleted, totalTopics } = JSON.parse(bodyText);
    if (studentName && typeof studentName === "string" && studentName.length > 200) {
      return new Response(JSON.stringify({ error: "Name too long" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
    if (!OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY is not configured");

    const lang = language === "bn" ? "Bangla" : "English";

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: `You are BoiKhata MM AI Mentor. Respond in ${lang}. Based on the student's performance data, generate ONE practical, actionable tip from one of these categories: study technique, memorization method, skill development, self-improvement, time management, exam preparation, or focus improvement. NO motivational quotes. Only concrete, practical advice they can apply TODAY.

Also generate 3 short daily tasks relevant to their level and weaknesses.

Return JSON only:
{
  "insight": "A specific, practical study/learning tip based on their performance (2-3 sentences max)",
  "tip_category": "study_technique|memorization|skill_development|self_improvement|time_management|exam_prep|focus",
  "tip_icon": "📖|🧠|🎯|💡|⏰|📝|🔍",
  "tasks": [
    {"title": "Task 1", "subject": "Math", "duration": "10 min"},
    {"title": "Task 2", "subject": "English", "duration": "15 min"},
    {"title": "Task 3", "subject": "Science", "duration": "10 min"}
  ]
}`
          },
          {
            role: "user",
            content: `Student: ${studentName}, Class: ${classLevel}, Goal: ${goals || "Not set"}, XP: ${xp}, Level: ${level}, Streak: ${streakDays} days, Topics completed: ${totalCompleted || 0}/${totalTopics || 0}`
          }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "{}";
    
    let parsed;
    try {
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = {
        insight: language === "bn" ? "প্রতিদিন ১৫ মিনিট আগের দিনের পড়া রিভিউ করলে দীর্ঘমেয়াদী স্মৃতিতে থাকে। আজ গতকালের নোটগুলো একবার দেখে নাও!" : "Reviewing yesterday's notes for 15 minutes daily improves long-term retention. Try it today!",
        tip_category: "memorization",
        tip_icon: "🧠",
        tasks: [],
      };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-insight error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
