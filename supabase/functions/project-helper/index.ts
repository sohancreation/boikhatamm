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
    const reqData = JSON.parse(bodyText);
    const { action, projectType, level, subject, duration, budget, teamSize, projectPlan, chatMessage, profile, language } = reqData;
    if (!action || typeof action !== "string" || action.length > 100) {
      return new Response(JSON.stringify({ error: "Invalid action" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (projectPlan && typeof projectPlan === "string" && projectPlan.length > 10000) {
      return new Response(JSON.stringify({ error: "Project plan too long (max 10,000 chars)" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (chatMessage && typeof chatMessage === "string" && chatMessage.length > 5000) {
      return new Response(JSON.stringify({ error: "Message too long (max 5,000 chars)" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const lang = language || "en";
    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
    if (!OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY not configured");

    const profileContext = profile ? `
Student Profile:
- Degree: ${profile.degreeLevel || "N/A"}
- Major: ${profile.major || "N/A"}
- University: ${profile.university || "N/A"}
- Tools Known: ${profile.toolsKnown?.join(", ") || "None"}
- Goal: ${profile.futureGoal || "N/A"}
` : "";

    const prompts: Record<string, { system: string; user: string }> = {
      "generate-ideas": {
        system: `You are a brilliant project idea generator for students. Generate 6 creative, feasible project ideas based on the student's inputs. For each idea provide:
1. Title (creative name)
2. Short description (2-3 sentences)
3. Required tools/components (list)
4. Approximate budget (USD range)
5. Difficulty level (Beginner/Intermediate/Advanced)
6. Innovation score (1-10)
7. Skills gained (list)
8. Time estimate

Format as JSON array with keys: title, description, tools, budget, difficulty, innovationScore, skillsGained, timeEstimate.
${lang === "bn" ? "Respond in Bengali." : "Respond in English."}
Important: Generate innovative, practical ideas. Not generic copy-paste projects.`,
        user: `Project Type: ${projectType}
Subject/Field: ${subject || "General"}
Level: ${level || "University"}
Time Available: ${duration || "1 month"}
Budget: ${budget || "Low"}
Team: ${teamSize || "Solo"}
${profileContext}`
      },
      "project-breakdown": {
        system: `You are an expert project mentor and technical architect. The student has a project plan. Break it down into a comprehensive blueprint. Provide:

1. **Required Components/Technologies** - Detailed list with specifications
2. **Estimated Budget** - Item-wise cost breakdown in USD
3. **System Architecture** - How components connect (text diagram)
4. **Connection/Setup Guide** - Step-by-step wiring/setup instructions
5. **Code Structure** - Required libraries, folder structure, boilerplate explanation (NOT full code, teach the approach)
6. **Timeline Breakdown** - Week-by-week milestones
7. **Risk & Troubleshooting** - Common problems and solutions
8. **Documentation Template** - Abstract, Problem Statement, Methodology, Expected Results
9. **Viva Questions** - 10 likely questions with brief answer hints

Format with clear markdown headers. Be detailed but educational - guide, don't give ready solutions.
${lang === "bn" ? "Respond in Bengali." : "Respond in English."}`,
        user: `Project Type: ${projectType}
Project Plan: ${projectPlan}
${profileContext}`
      },
      "debug-assist": {
        system: `You are a patient, expert project debugging assistant. The student is building a project and needs help. Act like a senior mentor:
- Ask clarifying questions if needed
- Provide step-by-step debugging guidance
- Explain WHY something went wrong
- Suggest fixes with explanation
- Don't just give code, teach the concept

${lang === "bn" ? "Respond in Bengali." : "Respond in English."}
Project Type: ${projectType || "Software"}`,
        user: chatMessage || "I need help with my project."
      },
      "documentation": {
        system: `You are an academic documentation expert. Help the student write professional project documentation. Generate:

1. Abstract (150-200 words)
2. Problem Statement
3. Objectives (3-5 bullet points)
4. Methodology
5. Expected Results
6. Future Work
7. References format guide

Be academic and professional. Guide the writing, provide structure and examples.
${lang === "bn" ? "Respond in Bengali." : "Respond in English."}`,
        user: `Project Type: ${projectType}
Project Details: ${projectPlan}
${profileContext}`
      },
      "viva-prep": {
        system: `You are a strict but fair thesis/project defense examiner. Simulate a viva voce session.
Generate 15 questions across these categories:
- Technical depth (5 questions)
- Methodology justification (3 questions)
- Innovation & contribution (3 questions)
- Limitations & future work (2 questions)
- Practical application (2 questions)

For each question provide:
- The question
- Difficulty (Easy/Medium/Hard)
- Brief answer hint (2-3 lines, not full answer)

Format as JSON array with keys: question, difficulty, hint, category.
${lang === "bn" ? "Respond in Bengali." : "Respond in English."}`,
        user: `Project Type: ${projectType}
Project: ${projectPlan}
${profileContext}`
      },
      "portfolio-export": {
        system: `You are a career portfolio specialist. Convert the student's project into professional resume bullet points and portfolio description.

Generate:
1. **Resume Bullets** - 3-5 action-oriented bullet points (STAR format)
2. **Portfolio Description** - 150 words professional project summary
3. **Skills Demonstrated** - Categorized skills list
4. **LinkedIn Project Entry** - Ready-to-paste LinkedIn format
5. **GitHub README Template** - Professional README structure

${lang === "bn" ? "Respond in Bengali." : "Respond in English."}`,
        user: `Project Type: ${projectType}
Project: ${projectPlan}
${profileContext}`
      }
    };

    const prompt = prompts[action];
    if (!prompt) throw new Error(`Unknown action: ${action}`);

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: prompt.system },
          { role: "user", content: prompt.user },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      throw new Error("AI gateway error");
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("project-helper error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
