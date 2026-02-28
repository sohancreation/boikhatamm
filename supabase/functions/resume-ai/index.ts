import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function callAI(apiKey: string, systemPrompt: string, userPrompt: string, stream = true) {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      stream,
    }),
  });
  return response;
}

async function callAIJson(apiKey: string, systemPrompt: string, userPrompt: string) {
  const response = await callAI(apiKey, systemPrompt, userPrompt, false);
  if (!response.ok) throw new Error(`AI error: ${response.status}`);
  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const bodyText = await req.text();
    if (new TextEncoder().encode(bodyText).length > 100 * 1024) {
      return new Response(JSON.stringify({ error: "Payload too large" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { action, data, language } = JSON.parse(bodyText);
    if (!action || typeof action !== "string") {
      return new Response(JSON.stringify({ error: "Missing action" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
    if (!OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY is not configured");

    const langInstruction = language === "bn" ? "Respond in Bangla (Bengali)." : "Respond in English.";

    // Non-streaming actions
    if (action === "improve_bullet") {
      const system = `You are an expert resume writer. Improve the given bullet point to be ATS-friendly with action verbs and quantified impact. Return ONLY the improved bullet point, nothing else. ${langInstruction}`;
      const result = await callAIJson(OPENROUTER_API_KEY, system, `Improve this resume bullet point for a ${data.careerMode || "general"} role:\n"${data.text}"`);
      return new Response(JSON.stringify({ result: result.trim() }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "generate_objective") {
      const system = `You are an expert resume writer. Generate a compelling 2-3 sentence career objective. Return ONLY the objective text. ${langInstruction}`;
      const result = await callAIJson(OPENROUTER_API_KEY, system, `Generate a career objective for:\nName: ${data.name}\nRole: ${data.careerMode}\nSkills: ${data.skills}\nExperience level: ${data.experienceLevel || "entry"}`);
      return new Response(JSON.stringify({ result: result.trim() }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "generate_project_description") {
      const system = `You are an expert resume writer. Generate a professional project description with 3 bullet points. Return JSON: {"description":"...","bullets":["...","...","..."]}. No markdown. ${langInstruction}`;
      const result = await callAIJson(OPENROUTER_API_KEY, system, `Project: ${data.title}\nTools: ${data.tools}\nGoal: ${data.goal}`);
      try {
        const parsed = JSON.parse(result);
        return new Response(JSON.stringify({ result: parsed }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch {
        return new Response(JSON.stringify({ result: { description: result, bullets: [] } }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    if (action === "suggest_skills") {
      const system = `You are a career advisor. Suggest 8-12 relevant skills for the given career. Return JSON array of strings only, no markdown. Example: ["Skill1","Skill2"]`;
      const result = await callAIJson(OPENROUTER_API_KEY, system, `Career: ${data.careerMode}\nCurrent skills: ${data.currentSkills?.join(", ") || "none"}`);
      try {
        const parsed = JSON.parse(result);
        return new Response(JSON.stringify({ result: parsed }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch {
        return new Response(JSON.stringify({ result: [] }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    if (action === "skill_gap") {
      const system = `You are a career advisor. Analyze skill gaps. Return JSON: {"missing":["skill1","skill2"],"recommendations":["tip1","tip2"]}. No markdown. ${langInstruction}`;
      const result = await callAIJson(OPENROUTER_API_KEY, system, `Career target: ${data.careerMode}\nCurrent skills: ${data.currentSkills?.join(", ") || "none"}`);
      try {
        const parsed = JSON.parse(result);
        return new Response(JSON.stringify({ result: parsed }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch {
        return new Response(JSON.stringify({ result: { missing: [], recommendations: [] } }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    if (action === "ats_score") {
      const system = `You are an ATS expert. Score this resume 0-100 and provide feedback. Return JSON only:
{"overall":85,"keywordMatch":80,"formatSafety":90,"grammarScore":85,"suggestions":["..."],"missingKeywords":["..."],"overusedWords":["..."],"passiveVoiceWarnings":["..."]}. No markdown. ${langInstruction}`;
      const result = await callAIJson(OPENROUTER_API_KEY, system, `Resume data:\n${JSON.stringify(data.resumeData)}\nTarget role: ${data.careerMode || "general"}`);
      try {
        const parsed = JSON.parse(result);
        return new Response(JSON.stringify({ result: parsed }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch {
        return new Response(JSON.stringify({ result: { overall: 0, suggestions: ["Could not analyze"] } }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Streaming actions
    let systemPrompt = "";
    let userPrompt = "";

    if (action === "build") {
      systemPrompt = `You are a professional Resume Builder AI. Create a polished, ATS-friendly resume in clean markdown format.
${langInstruction}

Structure the resume with these sections:
- **Header**: Name, contact info, LinkedIn
- **Professional Summary**: 2-3 compelling sentences
- **Education**: Degrees, institutions, dates
- **Experience**: Job titles, companies, achievements with metrics
- **Skills**: Technical and soft skills
- **Projects**: Key projects with impact
- **Certifications & Awards**: If any

Use action verbs, quantify achievements, and keep it concise. Make it ATS-optimized with relevant keywords.`;
      userPrompt = `Create a professional resume with this information:\n\n${JSON.stringify(data, null, 2)}`;
    } else if (action === "analyze") {
      systemPrompt = `You are an expert Resume Analyzer AI. Analyze resumes and provide detailed feedback.
${langInstruction}

Provide analysis in these sections:
1. **ATS Score** (0-100): Rate how well this resume would pass ATS systems
2. **Strengths**: What's done well
3. **Weaknesses**: What needs improvement
4. **Grammar & Language**: Any errors found
5. **Skill Gap Detection**: Missing skills for their target role
6. **Suggested Improvements**: Specific, actionable tips
7. **Missing Sections**: Important sections that are absent
8. **Keywords**: Suggest important keywords to add
9. **Career Mismatch Warning**: If content doesn't align with target role

Be specific and actionable in your feedback. Use markdown formatting.`;
      userPrompt = `Analyze this resume:\n\n${data.resumeText}${data.targetRole ? `\n\nTarget Role: ${data.targetRole}` : ""}`;
    } else {
      return new Response(JSON.stringify({ error: "Unknown action" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await callAI(OPENROUTER_API_KEY, systemPrompt, userPrompt, true);

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

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("resume-ai error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
