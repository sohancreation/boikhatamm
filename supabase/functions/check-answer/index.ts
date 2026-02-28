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
    if (new TextEncoder().encode(bodyText).length > 50 * 1024) {
      return new Response(JSON.stringify({ error: "Payload too large" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { problem, studentAnswer, expectedAnswer, courseType, language } = JSON.parse(bodyText);
    if (!studentAnswer || typeof studentAnswer !== "string" || studentAnswer.length > 10000) {
      return new Response(JSON.stringify({ error: "Invalid or too-long student answer" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
    if (!OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY not configured");

    const lang = language === "bn" ? "Bangla" : "English";

    const prompt = courseType === "coding"
      ? `You are an expert coding tutor. A student submitted code for this problem:

Problem: ${problem}

Student's Answer:
${studentAnswer}

Expected/Reference Answer:
${expectedAnswer}

Evaluate in ${lang}. Return JSON:
{
  "is_correct": true/false,
  "score": 0-100,
  "feedback": "Detailed feedback",
  "issues": ["list of specific issues if any"],
  "corrected_code": "corrected version if wrong, or null if correct",
  "hints": ["progressive hints to help fix without giving full answer"]
}`
      : `You are an expert ${courseType === "math" ? "math" : "academic"} tutor. A student answered:

Problem: ${problem}

Student's Answer: ${studentAnswer}

Expected Answer: ${expectedAnswer}

Evaluate in ${lang}. Return JSON:
{
  "is_correct": true/false,
  "score": 0-100,
  "feedback": "Detailed feedback explaining what's right/wrong",
  "issues": ["specific errors"],
  "correct_solution": "step-by-step correct solution if wrong, null if correct",
  "hints": ["progressive hints"]
}`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${OPENROUTER_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: "You are a helpful tutor. Return ONLY valid JSON, no markdown fences." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI error: ${status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "{}";
    let result;
    try {
      const cleaned = content.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
      result = JSON.parse(cleaned);
    } catch {
      result = { is_correct: false, score: 0, feedback: content, issues: [], hints: [] };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("check-answer error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
