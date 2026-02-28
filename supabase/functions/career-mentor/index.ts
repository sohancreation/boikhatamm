import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function buildUniPrompts(action: string, profile: any, langInstruction: string) {
  const prompts: Record<string, { system: string; user: string }> = {
    "career-mapping": {
      system: `You are an expert Career Mentor for Bangladeshi university students. ${langInstruction}

Based on the student's department/major, provide a DETAILED career mapping with:

1. **🎯 Top Career Paths** — List 6-8 specific career roles for their department with:
   - Role name
   - Average salary range in BDT (entry level & experienced)
   - Demand level (🔥 High / 🟡 Medium / 🔵 Low)
   - Required skills (3-4 key skills per role)

2. **📊 Industry Breakdown** — Which industries hire from their department, percentage distribution

3. **🏢 Top Companies in Bangladesh** — 8-10 companies that actively hire from their field

4. **🌍 Global Opportunities** — International career options and remote work possibilities

5. **💡 Emerging Roles** — 3-4 future roles that will be in demand in 2-3 years

Use markdown tables, bold text, and emojis for engaging formatting. Be specific to Bangladesh job market.`,
      user: `Student Profile:
University: ${profile.university}
Department: ${profile.department}
CGPA: ${profile.cgpa}
Year: ${profile.year}
Career Goal: ${profile.careerGoal}
Country Preference: ${profile.countryPref}
Interested Industry: ${profile.industry || "Open to all"}`,
    },
    "readiness-score": {
      system: `You are a Career Readiness Evaluator for Bangladeshi university students. ${langInstruction}

Analyze the student's profile and generate a DETAILED Career Readiness Report:

1. **📊 Overall Career Readiness Score: X/100**

2. **Breakdown Scores** (give each a score out of 100):
   - 🧠 Technical Skills
   - 🗣️ Soft Skills  
   - 💼 Internship/Work Experience
   - 📁 Portfolio/Projects
   - 📝 CV/Resume Quality
   - 🌐 Online Presence (LinkedIn, GitHub etc.)
   - 🏆 Extracurricular Activities
   - 📚 Academic Performance

3. **✅ Strengths** — What they're doing well (3-4 points)

4. **⚠️ Gaps to Fill** — Critical areas to improve with specific action items

5. **🎯 90-Day Action Plan** — Week-by-week improvement plan

6. **📈 Score Improvement Roadmap** — How to reach 85+ score

Return scores as numbers so they can be parsed. Use this exact format for scores:
SCORES_JSON: {"overall": X, "technical": X, "softSkills": X, "internship": X, "portfolio": X, "cv": X, "onlinePresence": X, "extracurricular": X, "academic": X}

Then provide the detailed analysis in markdown.`,
      user: `Student Profile:
University: ${profile.university}
Department: ${profile.department}
CGPA: ${profile.cgpa}
Year: ${profile.year}
Career Goal: ${profile.careerGoal}
Skills: ${profile.skills || "Not specified"}
Internships: ${profile.internships || "None"}
Projects: ${profile.projects || "None"}
Extracurriculars: ${profile.extracurriculars || "None"}
LinkedIn: ${profile.hasLinkedIn ? "Yes" : "No"}
GitHub: ${profile.hasGitHub ? "Yes" : "No"}
Portfolio: ${profile.hasPortfolio ? "Yes" : "No"}`,
    },
    "year-action-plan": {
      system: `You are a University Career Planning Expert for Bangladeshi students. ${langInstruction}

Create a COMPREHENSIVE year-specific action plan based on the student's current year:

For their specific year (${profile.year}), provide:

1. **🎯 Primary Focus Areas** — Top 3 priorities for this year

2. **📅 Month-by-Month Plan** (6 months ahead):
   For each month:
   - 🎯 Main goal
   - 📚 Skills to learn
   - 💼 Actions to take
   - ✅ Milestone to hit

3. **🛠️ Skills Roadmap** — Specific skills to master this year with resources

4. **💼 Internship/Job Strategy** — When and where to apply

5. **📁 Project Ideas** — 3-4 portfolio-worthy projects specific to their field

6. **🏆 Competitions & Events** — Relevant competitions, hackathons, case competitions in Bangladesh

7. **📝 CV Building Steps** — What to add to CV this year

8. **🤝 Networking Plan** — How to build professional connections

Be extremely specific and actionable. Include Bangladeshi platforms, companies, and opportunities.`,
      user: `Student Profile:
University: ${profile.university}
Department: ${profile.department}
CGPA: ${profile.cgpa}
Year: ${profile.year}
Career Goal: ${profile.careerGoal}
Country Preference: ${profile.countryPref}
Industry Interest: ${profile.industry || "Open"}
Current Skills: ${profile.skills || "Beginner"}`,
    },
  };
  return prompts[action];
}

function buildJobPrompts(action: string, profile: any, langInstruction: string) {
  const isGovt = profile.jobType === "sorkari";
  const prompts: Record<string, { system: string; user: string }> = {
    "job-mapping": {
      system: `You are an expert Job Career Mentor for Bangladeshi job candidates. ${langInstruction}

Based on the candidate's ${isGovt ? "government exam target" : "private sector preference"}, provide a DETAILED job mapping:

1. **🎯 Career Paths & Positions** — List 6-8 specific positions with:
   - Position/Role name
   - Salary range in BDT (entry & senior level)
   - Demand level (🔥 High / 🟡 Medium / 🔵 Low)
   - Key requirements

2. **📊 ${isGovt ? "Exam Structure & Syllabus Overview" : "Industry Landscape"}** — ${isGovt ? "Complete exam pattern, marks distribution, subjects" : "Market trends, hiring patterns, growth sectors"}

3. **🏢 ${isGovt ? "Government Bodies & Ministries" : "Top Companies Hiring"}** — 8-10 relevant organizations

4. **💰 Salary & Benefits Comparison** — Detailed compensation analysis

5. **💡 ${isGovt ? "Alternative Govt Exams" : "Related Roles to Explore"}** — 3-4 similar opportunities

Use markdown tables, bold text, and emojis. Be specific to Bangladesh.`,
      user: `Candidate Profile:
Job Type: ${profile.jobType === "sorkari" ? "Government" : "Private"}
Target Sector/Exam: ${profile.jobSector}
Target Role: ${profile.jobRole || "Not specified"}
Education: ${profile.education}
Experience: ${profile.experience || "None"}
Current Status: ${profile.currentStatus || "Not specified"}
Skills: ${profile.skills || "Not specified"}
Career Goal: ${profile.careerGoal || "Not specified"}
Country: ${profile.countryPref}`,
    },
    "readiness-score": {
      system: `You are a Job Readiness Evaluator for Bangladeshi job candidates. ${langInstruction}

Analyze the candidate's profile for ${isGovt ? "government job exam" : "private sector job"} readiness:

1. **📊 Overall Job Readiness Score: X/100**

2. **Breakdown Scores** (give each a score out of 100):
   - 🧠 Technical Skills
   - 🗣️ Communication
   - 💼 Experience
   - 🎓 Education
   - 📝 CV/Resume
   - 🌐 Online Presence
   - 📚 ${isGovt ? "Exam Preparation" : "Industry Knowledge"}
   - 🤝 Networking

3. **✅ Strengths** — What they're doing well

4. **⚠️ Gaps to Fill** — Critical areas with specific actions

5. **🎯 90-Day Action Plan** — Week-by-week improvement

6. **📈 How to reach 85+ score**

Return scores: SCORES_JSON: {"overall": X, "technical": X, "communication": X, "experience": X, "education": X, "cv": X, "onlinePresence": X, "preparation": X, "networking": X}

Then detailed markdown analysis.`,
      user: `Candidate Profile:
Job Type: ${profile.jobType === "sorkari" ? "Government" : "Private"}
Target: ${profile.jobSector}
Role: ${profile.jobRole || "General"}
Education: ${profile.education}
Experience: ${profile.experience || "None"}
Skills: ${profile.skills || "Not specified"}
Certifications: ${profile.certifications || "None"}
LinkedIn: ${profile.hasLinkedIn ? "Yes" : "No"}
Portfolio: ${profile.hasPortfolio ? "Yes" : "No"}
Status: ${profile.currentStatus || "Not specified"}`,
    },
    "preparation-plan": {
      system: `You are a Job Preparation Expert for Bangladeshi candidates. ${langInstruction}

Create a COMPREHENSIVE ${isGovt ? "exam preparation" : "job hunting"} plan:

1. **🎯 Primary Focus Areas** — Top 3 priorities

2. **📅 Month-by-Month Plan** (6 months):
   For each month:
   - 🎯 Main goal
   - 📚 ${isGovt ? "Subjects to study" : "Skills to learn"}
   - 💼 Actions to take
   - ✅ Milestone

3. **📚 ${isGovt ? "Study Guide" : "Skills Roadmap"}** — ${isGovt ? "Subject-wise preparation strategy with recommended books & resources" : "Specific skills to master with resources"}

4. **💼 ${isGovt ? "Mock Test & Practice Strategy" : "Application Strategy"}** — ${isGovt ? "Where to practice, model tests, previous year analysis" : "Resume tips, cover letters, interview prep"}

5. **🏆 ${isGovt ? "Coaching & Resources" : "Certifications & Training"}** — Recommended in Bangladesh

6. **📝 ${isGovt ? "Written Exam Tips" : "Interview Preparation"}** — Specific strategies

7. **🤝 Community & Support** — Groups, forums, mentors in Bangladesh

Be extremely specific. Include Bangladeshi resources, websites, books, and platforms.`,
      user: `Candidate Profile:
Job Type: ${profile.jobType === "sorkari" ? "Government" : "Private"}
Target: ${profile.jobSector}
Role: ${profile.jobRole || "General"}
Education: ${profile.education}
Experience: ${profile.experience || "None"}
Skills: ${profile.skills || "Not specified"}
Goal: ${profile.careerGoal || "Get selected"}
Country: ${profile.countryPref}`,
    },
  };
  return prompts[action];
}

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
    const { action, profile, language, mode } = JSON.parse(bodyText);
    if (!action || typeof action !== "string" || action.length > 100) {
      return new Response(JSON.stringify({ error: "Invalid action" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!profile || typeof profile !== "object") {
      return new Response(JSON.stringify({ error: "Profile object is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
    if (!OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY is not configured");

    const langInstruction = language === "bn"
      ? "Respond entirely in Bangla (Bengali script). Use Bangla numbers and formatting."
      : "Respond in English.";

    const prompt = mode === "job"
      ? buildJobPrompts(action, profile, langInstruction)
      : buildUniPrompts(action, profile, langInstruction);

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
    console.error("career-mentor error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
