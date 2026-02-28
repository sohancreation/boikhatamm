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
    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
    if (!OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY is not configured");

    const langInstruction = language === "bn"
      ? "Respond entirely in Bangla (Bengali script). Use Bangla numbers."
      : "Respond in English.";

    const prompts: Record<string, { system: string; user: string }> = {
      "skill-assessment": {
        system: `You are an expert Skill Assessment AI for university students in Bangladesh. ${langInstruction}

The student wants to learn: "${data.skillName}" from the "${data.track}" track.

Conduct a skill assessment by:

1. **📊 Current Level Assessment** — Based on their answers, rate them:
   - 🟢 Beginner (0-30%)
   - 🟡 Intermediate (31-65%)
   - 🔵 Advanced (66-100%)
   
   Provide: LEVEL_JSON: {"level": "beginner|intermediate|advanced", "score": X}

2. **🧪 5 Quick Assessment Questions** — Ask 5 questions of increasing difficulty about "${data.skillName}". For each:
   - Question
   - 4 options (A/B/C/D)
   - Correct answer
   - Explanation

3. **📈 Skill Gap Analysis** — What they likely know vs what's needed for industry

4. **🎯 Recommended Starting Point** — Where to begin learning

5. **⏰ Estimated Time to Job-Ready** — Realistic timeline

Format with markdown. Be encouraging but honest.`,
        user: `Student Profile:
Skill to assess: ${data.skillName}
Track: ${data.track}
University: ${data.university || "Not specified"}
Department: ${data.department || "Not specified"}
Year: ${data.year || "Not specified"}
Current experience with this skill: ${data.experience || "Beginner - no experience"}
Career goal: ${data.careerGoal || "Not specified"}`,
      },
      "career-roadmap": {
        system: `You are an expert Career-Linked Skill Roadmap Generator for Bangladeshi university students. ${langInstruction}

Create an extremely detailed, actionable skill roadmap:

1. **🎯 Career Target**: ${data.careerGoal}
   - What this role does
   - Average salary in Bangladesh (BDT) & globally
   - Demand level

2. **🗺️ 6-Month Skill Roadmap** (Month by month):
   For EACH month:
   - 📚 Topics to learn (specific)
   - 🛠️ Tools/Technologies
   - ⏰ Daily study hours recommended
   - ✅ End-of-month milestone
   - 📁 Mini project

3. **🏗️ 3 Major Projects** (Portfolio-worthy):
   For each project:
   - Project name & description
   - Technologies used
   - Difficulty level
   - Estimated completion time
   - What it demonstrates to employers
   - GitHub repo structure suggestion

4. **💼 2 Internship Targets**:
   - Company types to target
   - When to apply
   - How to prepare
   - Bangladesh-specific companies hiring for this role

5. **📝 50 Interview Questions** (categorized):
   - 15 Basic concept questions
   - 15 Intermediate questions  
   - 10 Advanced/Problem-solving
   - 10 Behavioral/HR questions
   Each with brief answer hints

6. **📚 Free Resources**:
   - YouTube channels
   - Free courses (Coursera, edX, freeCodeCamp)
   - Practice platforms
   - Communities to join

7. **🏆 Monthly Milestones & Checkpoints**

Be extremely specific. Use real platform names, tools, and Bangladesh job market data.`,
        user: `Student wants to become: ${data.careerGoal}
Timeline: ${data.timeline || "6 months"}
Current skills: ${data.currentSkills || "Beginner"}
University: ${data.university || "Not specified"}
Department: ${data.department || "Not specified"}
Year: ${data.year || "Not specified"}
Selected skill track: ${data.track}
Daily available hours: ${data.dailyHours || "2-3 hours"}`,
      },
      "project-review": {
        system: `You are a Senior Technical Reviewer and Mentor for university student projects. ${langInstruction}

Review the student's project submission and provide:

1. **📊 Project Score: X/100**
   SCORE_JSON: {"overall": X, "code": X, "design": X, "functionality": X, "documentation": X}

2. **✅ Strengths** (3-5 points) — What's done well

3. **⚠️ Areas for Improvement** (3-5 points) — Specific, actionable feedback

4. **🐛 Issues Found** — Any bugs, security issues, or bad practices

5. **💡 Enhancement Suggestions** — How to make it portfolio-worthy

6. **📝 Resume Bullet Point** — A ready-to-use bullet point for their CV

7. **🎯 Next Steps** — What to build next to level up

Be constructive, encouraging, and specific.`,
        user: `Project Details:
Project Name: ${data.projectName}
Description: ${data.description}
Technologies Used: ${data.technologies}
GitHub URL: ${data.githubUrl || "Not provided"}
Challenges Faced: ${data.challenges || "Not mentioned"}
Student's self-assessment: ${data.selfAssessment || "Not provided"}`,
      },
      "company-prep": {
        system: `You are an expert Interview Coach specializing in company-specific preparation for Bangladeshi job seekers. ${langInstruction}

Prepare a comprehensive guide for getting hired at the specified company:

1. **🏢 Company Overview** — What they do, culture, values, work environment

2. **💼 Roles They Hire For** — Common positions, especially for fresh graduates

3. **📝 Application Process** — Step-by-step, from application to offer

4. **🧪 Technical Assessment** — What to expect (coding test, case study, aptitude)

5. **🗣️ Interview Questions** — 15-20 company-specific questions with model answers

6. **🎯 Must-Have Skills** — What they specifically look for

7. **💡 Pro Tips** — Insider advice for standing out

8. **💰 Compensation** — Expected salary range for freshers in BDT

9. **📅 Hiring Timeline** — When they typically recruit

10. **🔗 How to Connect** — LinkedIn approach, career page, referrals

Use real, current information about the company.`,
        user: `Prepare me for: ${data.company}
My profile:
Department: ${data.department || "Not specified"}
Skills: ${data.skills || "Not specified"}
Year: ${data.year || "Fresh graduate"}
Target role: ${data.targetRole || "Any entry-level"}`,
      },
      "salary-projection": {
        system: `You are a Career Compensation Analyst specializing in the Bangladesh and global job market. ${langInstruction}

Provide detailed salary projections:

1. **💰 Salary Range by Experience**:
   | Experience | Bangladesh (BDT/month) | Remote/Global (USD/month) |
   | Entry (0-1 yr) | X | X |
   | Junior (1-3 yr) | X | X |
   | Mid (3-5 yr) | X | X |
   | Senior (5-8 yr) | X | X |
   | Lead (8+ yr) | X | X |

2. **📊 Salary by Company Type**:
   - Multinational
   - Local large company
   - Startup
   - Freelance
   - Government

3. **🎯 Skills That Increase Salary** — Top 5 skills with salary bump percentage

4. **📈 Career Growth Path** — Typical progression with salary at each level

5. **🌍 Remote Work Opportunity** — Freelance/remote rates

6. **💡 Negotiation Tips** — How to negotiate salary in Bangladesh

Use real market data. Be specific with numbers.`,
        user: `Salary projection for:
Skills: ${data.skills}
Department: ${data.department || "Not specified"}
Target role: ${data.targetRole || "Not specified"}
Experience level: ${data.experience || "Fresh graduate"}
Location preference: ${data.location || "Bangladesh"}`,
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
    console.error("skill-mentor error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
