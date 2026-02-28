import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const bodyText = await req.text();
    if (new TextEncoder().encode(bodyText).length > 50 * 1024) {
      return new Response(JSON.stringify({ error: "Payload too large" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { action, prompt, text, language, tone } = JSON.parse(bodyText);
    if (!action || typeof action !== "string") {
      return new Response(JSON.stringify({ error: "Missing action" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (prompt && typeof prompt === "string" && prompt.length > 2000) {
      return new Response(JSON.stringify({ error: "Prompt too long" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (text && typeof text === "string" && text.length > 10000) {
      return new Response(JSON.stringify({ error: "Text too long" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
    if (!OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY is not configured");

    // ===== ACTION: GENERATE IMAGE =====
    if (action === "generate-image") {
      const imagePrompt = `Create a professional, clean presentation slide visual for: ${prompt}. 
Style: Modern business presentation quality, minimal text, professional photography or illustration style. 
Aspect ratio 16:9. Ultra high resolution. No watermarks.`;

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image",
          messages: [{ role: "user", content: imagePrompt }],
          modalities: ["image", "text"],
        }),
      });

      if (!response.ok) {
        const status = response.status;
        if (status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        const t = await response.text();
        console.error("AI image error:", status, t);
        return new Response(JSON.stringify({ error: "Image generation failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const data = await response.json();
      const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url || "";
      
      return new Response(JSON.stringify({ imageUrl }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ===== ACTION: IMPROVE TEXT (generic) =====
    if (action === "improve-text") {
      const langNote = language === "bn" ? "Respond in Bangla (Bengali script)." : "Respond in English.";
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content: `You are a presentation text expert. Improve the given slide text to be more impactful, concise, and professional. ${langNote}
Return ONLY a JSON object (no markdown fences) with this structure:
{
  "title": "improved title",
  "bullets": ["improved point 1", "improved point 2", ...]
}
Keep bullet count similar. Make text punchy and presentation-ready.`,
            },
            { role: "user", content: text },
          ],
        }),
      });

      if (!response.ok) {
        const status = response.status;
        if (status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        return new Response(JSON.stringify({ error: "Text improvement failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const data = await response.json();
      const raw = data.choices?.[0]?.message?.content || "";
      try {
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        const result = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(raw);
        return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      } catch {
        return new Response(JSON.stringify({ error: "Failed to parse AI response" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    // ===== ACTION: TRANSFORM TEXT (rewrite/shorten/expand/academic/persuasive/simplify/tone) =====
    if (action === "transform-text") {
      const langNote = language === "bn" ? "Respond in Bangla (Bengali script)." : "Respond in English.";
      
      const toneInstructions: Record<string, string> = {
        rewrite: "Rewrite the text with fresh wording while keeping the same meaning. Make it more engaging and presentation-ready.",
        shorten: "Condense the text to be much shorter and punchier. Remove unnecessary words. Keep only the essential message. Reduce bullet count if needed.",
        expand: "Expand the text with more detail, examples, and supporting points. Add 1-2 more bullets if appropriate. Make it more comprehensive.",
        academic: "Rewrite in a formal academic tone. Use scholarly language, proper terminology, and evidence-based phrasing. Suitable for university presentations.",
        persuasive: "Rewrite to be highly persuasive and compelling. Use power words, rhetorical techniques, and calls to action. Make the audience want to agree.",
        simplify: "Simplify the language to be easy to understand. Use short sentences, common words, and clear structure. Suitable for a general audience.",
        formal: "Rewrite in a formal, professional business tone. Use corporate language and structured phrasing.",
        casual: "Rewrite in a casual, friendly, conversational tone. Make it feel like talking to a friend.",
      };

      const instruction = toneInstructions[tone] || toneInstructions.rewrite;

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content: `You are a presentation text expert. ${instruction} ${langNote}
Return ONLY a JSON object (no markdown fences) with this structure:
{
  "title": "transformed title",
  "bullets": ["point 1", "point 2", ...]
}
Maintain the slide's core message while applying the transformation.`,
            },
            { role: "user", content: text },
          ],
        }),
      });

      if (!response.ok) {
        const status = response.status;
        if (status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        return new Response(JSON.stringify({ error: "Text transformation failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const data = await response.json();
      const raw = data.choices?.[0]?.message?.content || "";
      try {
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        const result = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(raw);
        return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      } catch {
        return new Response(JSON.stringify({ error: "Failed to parse AI response" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("slide-ai-tools error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
