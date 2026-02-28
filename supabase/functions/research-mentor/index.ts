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
    const { action, data, language } = JSON.parse(bodyText);
    if (!action || typeof action !== "string" || action.length > 100) {
      return new Response(JSON.stringify({ error: "Invalid action" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!data || typeof data !== "object") {
      return new Response(JSON.stringify({ error: "Data object is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (data.paperAbstract && typeof data.paperAbstract === "string" && data.paperAbstract.length > 20000) {
      return new Response(JSON.stringify({ error: "Abstract too long" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
    if (!OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY is not configured");

    const langInstruction = language === "bn"
      ? "Respond entirely in Bangla (Bengali script)."
      : "Respond in English.";

    const profileContext = `
Student Profile:
- Degree Level: ${data.degreeLevel || "Not specified"}
- Major/Subject: ${data.major || "Not specified"}
- University: ${data.university || "Not specified"}
- Research Interest: ${data.researchInterest || "Not specified"}
- Thesis Topic: ${data.thesisTopic || "None"}
- Publication Status: ${data.publicationStatus || "No publications"}
- Tools Known: ${(data.toolsKnown || []).join(", ") || "None specified"}
- Future Goal: ${data.futureGoal || "Not specified"}`;

    const prompts: Record<string, { system: string; user: string }> = {
      "research-direction": {
        system: `You are an expert Research Direction Advisor for Bangladeshi university students. ${langInstruction}

Based on the student's background, interest area, and major, provide:

1. **🎯 Top Research Directions** — List 6-8 specific research directions/domains highly relevant to their field
2. **🔬 Trending Topics** — 5 currently trending research areas in their field (2024-2025)
3. **📊 Interdisciplinary Opportunities** — 3-4 cross-disciplinary research areas they could explore
4. **🏫 Leading Research Groups** — 5 notable research labs/groups (both in Bangladesh and internationally)
5. **📈 Career Impact** — How each direction connects to career prospects (academia vs industry)
6. **💡 Quick Start Guide** — For each direction, suggest 2-3 foundational papers to read

Be very specific to their major. Use markdown with clear sections and bullet points.`,
        user: `Find research directions for this student:\n${profileContext}\n\nSpecific interest area: ${data.interestQuery || data.researchInterest || "General"}`,
      },
      "topic-generator": {
        system: `You are an expert Research Topic Generator for academic researchers. ${langInstruction}

Generate comprehensive research topic suggestions:

1. **📝 Research Titles** — Generate exactly 10 specific, well-formulated research titles
2. **📄 Short Abstract** — For each title, write a 2-3 sentence abstract
3. **🔧 Suggested Methodology** — For each, recommend the primary research methodology
4. **📊 Dataset Ideas** — Suggest possible datasets or data collection methods
5. **⭐ Novelty Score** — Rate each topic's novelty (★ to ★★★★★)
6. **🎯 Feasibility** — Rate feasibility for the student's level (Easy / Moderate / Challenging)
7. **📚 Key References** — 2-3 seminal papers related to each topic

Make titles academically rigorous and publishable. Format beautifully with markdown tables where appropriate.`,
        user: `Generate research topics:\n${profileContext}\n\nTopic request: "${data.topicQuery || "Generate topics in my field"}"`,
      },
      "proposal-builder": {
        system: `You are an expert Academic Research Proposal Writer. ${langInstruction}

Generate a complete, publication-ready research proposal with:

1. **📋 Title Page** — Full title, author placeholder, affiliation
2. **🔍 Background & Introduction** — 3-4 paragraphs of context
3. **❗ Problem Statement** — Clear articulation of the research problem
4. **📊 Research Gap** — What's missing in current literature
5. **🎯 Research Objectives** — 3-5 specific, measurable objectives
6. **❓ Research Questions** — 3-5 aligned research questions
7. **📐 Methodology** — Detailed research design, data collection, analysis plan
8. **📈 Expected Outcomes** — What the research will contribute
9. **📅 Timeline** — Month-by-month Gantt chart (text format)
10. **📚 Preliminary References** — 10-15 key references in APA format
11. **💰 Budget Estimation** — If applicable

Make it professional, editable, and suitable for thesis/scholarship submission.`,
        user: `Build a research proposal:\n${profileContext}\n\nProposal Topic: "${data.proposalTopic || data.thesisTopic || "Not specified"}"\nPurpose: ${data.proposalPurpose || "Thesis/Dissertation"}\nAdditional Notes: ${data.proposalNotes || "None"}`,
      },
      "literature-review": {
        system: `You are an expert Literature Review Assistant for academic researchers. ${langInstruction}

Analyze the provided paper/abstract and provide:

1. **📝 Summary** — Concise summary of key findings (3-4 sentences)
2. **🔬 Methodology Extraction** — What research method was used, sample size, tools
3. **📊 Key Results** — Main findings in bullet points
4. **🔗 Comparison** — How this relates to similar research in the field
5. **🕳️ Research Gaps Identified** — What this paper doesn't address
6. **💡 Future Research Suggestions** — Based on gaps found
7. **⚡ Strengths & Limitations** — Critical analysis
8. **📎 Citation** — Suggested citation format (APA)

Be analytical, critical, and academically rigorous.`,
        user: `Analyze this paper/abstract:\n\n"${data.paperAbstract || "No abstract provided"}"\n\nStudent's research context:\n${profileContext}`,
      },
      "methodology-suggestion": {
        system: `You are an expert Research Methodology Advisor. ${langInstruction}

Based on the student's field and research topic, provide detailed methodology suggestions:

**For Quantitative Research:**
1. **📊 Survey Design** — Questionnaire structure, Likert scales, sampling
2. **📈 Statistical Models** — Regression, ANOVA, SEM, etc. with justification
3. **🎯 Sample Size** — Calculation method and recommended size
4. **🛠️ Analysis Tools** — SPSS, STATA, R commands

**For Qualitative Research:**
1. **🎤 Interview Framework** — Semi-structured interview guide
2. **📝 Thematic Analysis** — Step-by-step Braun & Clarke method
3. **👥 Focus Group Design** — If applicable
4. **🔍 Coding Strategy** — Open, axial, selective coding

**For Technical/CS Research:**
1. **🏗️ Model Architecture** — Neural network design, algorithm selection
2. **📊 Evaluation Metrics** — Accuracy, F1, BLEU, ROUGE, etc.
3. **🔄 Experimental Design** — Train/test split, cross-validation
4. **📉 Baseline Comparisons** — What to compare against

Provide specific, actionable guidance with examples.`,
        user: `Suggest methodology:\n${profileContext}\n\nResearch Topic: "${data.methodologyTopic || data.thesisTopic || "Not specified"}"\nResearch Type Preference: ${data.researchType || "Any"}`,
      },
      "tool-guidance": {
        system: `You are a Research Tools & Software Expert. ${langInstruction}

Based on the student's field, provide comprehensive tool guidance:

1. **🛠️ Essential Tools** — Must-have software for their research area
2. **📊 Data Analysis** — Statistical/analytical tools with pros & cons
3. **📝 Writing Tools** — LaTeX, Overleaf, reference managers (Zotero, Mendeley)
4. **🔍 Literature Search** — Google Scholar, Scopus, Web of Science tips
5. **📈 Visualization** — Charts, graphs, diagrams tools
6. **💻 Programming** — Languages & libraries relevant to their field
7. **🆓 Free vs Paid** — Free alternatives for expensive software
8. **📖 Learning Resources** — Tutorials, courses for each tool
9. **🏫 Bangladesh-Specific** — Access through university subscriptions, free resources

Be practical and include direct links/commands where possible.`,
        user: `Suggest research tools:\n${profileContext}`,
      },
      "publication-roadmap": {
        system: `You are a Publication Strategy Expert for academic researchers. ${langInstruction}

Provide a complete publication roadmap:

1. **📝 How to Write a Journal Paper** — Step-by-step guide
2. **📋 Paper Structure (IMRAD)** — Introduction, Methods, Results, And Discussion explained
3. **📊 Conference vs Journal** — When to choose which, pros & cons
4. **⚠️ Predatory Journals** — How to identify and avoid them (Beall's list, DOAJ)
5. **🏆 Scopus & Web of Science** — How indexing works, why it matters
6. **🎯 Journal Selection** — How to pick the right journal for your paper
7. **📤 Submission Process** — Cover letter, reviewer response, revision strategy
8. **⏱️ Timeline** — Typical publication timeline from draft to published
9. **💡 Tips for First-Time Authors** — Common mistakes and how to avoid them
10. **🇧🇩 Bangladesh Context** — UGC requirements, local journals, institutional support

Be detailed, practical, and encouraging.`,
        user: `Guide me on publication:\n${profileContext}\n\nCurrent paper stage: ${data.paperStage || "Planning"}\nTarget journal type: ${data.journalType || "Any"}`,
      },
      "mock-viva": {
        system: `You are a Thesis Defense / Viva Voce Simulator for academic students. ${langInstruction}

Conduct a comprehensive viva preparation:

1. **❓ Common Questions** — List 15-20 most likely viva questions with model answers
2. **🔥 Tricky Questions** — 5-7 difficult/challenging questions with strategic answers
3. **🎯 Defense Strategy** — How to present your research confidently
4. **📊 Presentation Tips** — Slide structure, time management, body language
5. **⚠️ Red Flags** — Common mistakes that examiners penalize
6. **💪 Confidence Boosters** — Mental preparation techniques
7. **📝 Opening Statement** — Template for introducing your research
8. **🏆 Scoring Rubric** — What examiners typically evaluate (out of 100)

Make answers specific to the student's research topic and methodology.`,
        user: `Prepare me for viva/defense:\n${profileContext}\n\nDefense Type: ${data.defenseType || "Thesis Defense"}\nResearch Topic: "${data.vivaTopicDetail || data.thesisTopic || "Not specified"}"`,
      },
    };

    const prompt = prompts[action];
    if (!prompt) {
      return new Response(JSON.stringify({ error: "Invalid action" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
      console.error("AI error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("research-mentor error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
