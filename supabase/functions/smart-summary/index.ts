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
    if (new TextEncoder().encode(bodyText).length > 100 * 1024) {
      return new Response(JSON.stringify({ error: "Payload too large (max 100KB)" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { content, sourceType, outputFormat, language } = JSON.parse(bodyText);
    if (!content || typeof content !== "string" || content.length > 50000) {
      return new Response(JSON.stringify({ error: "Content is required and must be under 50,000 characters" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (outputFormat && !["short", "detailed", "exam", "formula", "mcq"].includes(outputFormat)) {
      return new Response(JSON.stringify({ error: "Invalid outputFormat" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
    if (!OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY is not configured");

    const outputInstructions: Record<string, string> = {
      short: "Provide a concise summary in 5-10 bullet points. Focus on key takeaways.",
      detailed: "Provide a comprehensive, detailed explanation summary with sections and sub-points.",
      exam: "Create exam-focused notes: key definitions, formulas, important dates, and likely exam questions.",
      formula: "Extract and list all key formulas, equations, and important numerical values with brief explanations.",
      mcq: "Generate 10 important MCQ questions from the content with 4 options each and mark the correct answer.",
    };

    const langInstruction = language === "bn" 
      ? "Respond in Bangla (Bengali). Use Bangla script." 
      : "Respond in English.";

    const systemPrompt = `You are BoiKhata MM Smart Summary AI. You specialize in converting long content into clean, structured study notes for Bangladeshi students.

${langInstruction}

The user has provided content from: ${sourceType}
Output format requested: ${outputFormat}

Instructions:
${outputInstructions[outputFormat] || outputInstructions.short}

Format your response with clear markdown headings, bullet points, and emphasis on key terms. Make it visually scannable and easy to study from.`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Please summarize/process the following content:\n\n${content}` },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("smart-summary error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
