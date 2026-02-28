import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const bodyText = await req.text();
    if (new TextEncoder().encode(bodyText).length > 100 * 1024) {
      return new Response(JSON.stringify({ error: "Payload too large" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { content, sourceType, style, slideCount, language } = JSON.parse(bodyText);
    if (!content || typeof content !== "string" || content.length > 50000) {
      return new Response(JSON.stringify({ error: "Content required, max 50,000 chars" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (slideCount !== undefined && (typeof slideCount !== "number" || slideCount < 1 || slideCount > 50)) {
      return new Response(JSON.stringify({ error: "slideCount must be 1-50" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
    if (!OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY is not configured");

    const styleInstructions: Record<string, string> = {
      academic: "Use formal academic tone. Include references section. Clear hierarchy of information. Professional and scholarly feel.",
      corporate: "Business professional tone. Use data-driven language. Clean structure with executive summary. Focus on ROI and metrics.",
      startup: "Bold, energetic, inspiring tone. Problem-Solution-Market-Traction structure. Use impactful one-liners. Investor-friendly format.",
      minimal: "Ultra clean, minimal text per slide. Maximum 3-4 bullet points. Let white space speak. Modern and elegant.",
    };

    const langInstruction = language === "bn"
      ? "Generate ALL slide content in Bangla (Bengali script). Titles, bullet points, speaker notes — everything in Bangla."
      : "Generate all content in English.";

    const systemPrompt = `You are BoiKhata MM Presentation AI. You create professional, well-structured presentation slides.

${langInstruction}
Style: ${styleInstructions[style] || styleInstructions.minimal}

Generate exactly ${slideCount || 10} slides. Output as valid JSON (no markdown fences, no extra text) with this exact structure:
{
  "title": "Presentation Title",
  "slides": [
    {
      "slideNumber": 1,
      "title": "Slide Title",
      "bullets": ["Point 1", "Point 2", "Point 3"],
      "speakerNotes": "What to say for this slide",
      "visualSuggestion": "Suggest an image, chart, or diagram idea",
      "layout": "title|content|two-column|image-focus|chart|quote"
    }
  ]
}

Rules:
- Slide 1 should be a title slide with subtitle
- Last slide should be a "Thank You" or "Q&A" slide
- Each slide should have 3-5 bullet points max
- Speaker notes should be 2-3 sentences
- Visual suggestions should be specific and actionable
- Use the appropriate layout type for each slide's content
- Make content compelling and presentation-ready`;

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
          { role: "user", content: `Create a presentation from this input (source: ${sourceType}):\n\n${content}` },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded." }), {
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

    const aiData = await response.json();
    const raw = aiData.choices?.[0]?.message?.content || "";
    
    // Parse the JSON from the AI response
    let slides;
    try {
      // Try to extract JSON from the response (may have markdown fences)
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      slides = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(raw);
    } catch (parseErr) {
      console.error("Failed to parse slides JSON:", parseErr, "Raw:", raw);
      return new Response(JSON.stringify({ error: "Failed to parse AI response. Please try again." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(slides), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("slide-generator error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
