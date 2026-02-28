import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function buildPrompt(action: string, profile: any, language: string, extra?: any): { system: string; user: string } | null {
  const lang = language === "bn" ? "Bangla" : "English";

  if (action === "analyze_profile") {
    return {
      system: `You are an expert higher education counselor specializing in international admissions for Bangladeshi students. Language: ${lang}`,
      user: `Analyze this student profile for studying abroad:

ACADEMIC: Degree: ${profile.degree || "N/A"}, CGPA: ${profile.cgpa || "N/A"}, Major: ${profile.major || "N/A"}, University: ${profile.university_name || "N/A"}, Graduation: ${profile.graduation_year || "N/A"}
TESTS: IELTS: ${profile.ielts_score || "N/A"}, GRE: ${profile.gre_score || "N/A"}, GMAT: ${profile.gmat_score || "N/A"}, SAT: ${profile.sat_score || "N/A"}
RESEARCH: Thesis(${profile.has_thesis}), Publication(${profile.has_publication}), Conference(${profile.has_conference}), Details: ${profile.research_details || "None"}
EXPERIENCE: Internship: ${profile.internship_details || "None"}, Job: ${profile.job_details || "None"}, Projects: ${profile.project_details || "None"}
PREFERENCES: Target: ${profile.target_degree} in ${profile.target_major}, Funding: ${profile.funding_preference}, Countries: ${(profile.country_preferences || []).join(", ") || "Any"}

Return ONLY JSON:
{"overallScore":<0-100>,"breakdown":{"academic":<0-100>,"english":<0-100>,"research":<0-100>,"experience":<0-100>,"testScores":<0-100>},"improvements":[{"area":"name","suggestion":"actionable","impactPercent":<number>}],"topImprovement":"sentence","strengthAreas":["list"],"weakAreas":["list"],"readinessLevel":"Not Ready|Needs Work|Almost Ready|Ready|Highly Competitive","summary":"2-3 sentences in ${lang}"}`,
    };
  }

  if (action === "recommend_countries") {
    return {
      system: `You are an expert study abroad counselor. Compare countries for a Bangladeshi student. Language: ${lang}`,
      user: `Profile: ${profile.degree}, CGPA: ${profile.cgpa}, Major: ${profile.major}, IELTS: ${profile.ielts_score || "N/A"}, GRE: ${profile.gre_score || "N/A"}, Research: Thesis(${profile.has_thesis}), Pub(${profile.has_publication}), Funding: ${profile.funding_preference}, Target: ${profile.target_degree} in ${profile.target_major}, Countries: ${(profile.country_preferences || []).join(", ") || "Any"}

Return ONLY JSON:
{"countries":[{"country":"name","matchScore":<0-100>,"admissionDifficulty":"Easy|Moderate|Competitive|Very Competitive","estimatedCostPerYear":"USD","scholarshipAvailability":"High|Medium|Low","workOpportunity":"Excellent|Good|Limited","topReasons":["r1","r2"],"challenges":["c1"],"recommendedTag":"Best Match|Low Cost|Best Scholarship|Best Work Opportunity"}],"topRecommendation":"country","summary":"2-3 sentences in ${lang}"}`,
    };
  }

  if (action === "recommend_universities") {
    return {
      system: `You are an expert university admission counselor. Recommend real universities categorized by admission difficulty. Language: ${lang}`,
      user: `Profile: ${profile.degree}, CGPA: ${profile.cgpa}, Major: ${profile.major}, IELTS: ${profile.ielts_score || "N/A"}, GRE: ${profile.gre_score || "N/A"}, Research: Thesis(${profile.has_thesis}), Pub(${profile.has_publication}), Target: ${profile.target_degree} in ${profile.target_major}, Countries: ${(profile.country_preferences || []).join(", ") || "Any"}, Funding: ${profile.funding_preference}

Return ONLY JSON:
{"safe":[{"name":"Uni","country":"Country","program":"Program","admissionProbability":<60-95>,"fundingProbability":<0-100>,"highlights":["h1"],"deadline":"month"}],"moderate":[same structure, prob 30-60],"ambitious":[same structure, prob 10-35],"summary":"in ${lang}"}`,
    };
  }

  if (action === "generate_sop") {
    const uni = extra?.university || "the target university";
    const country = extra?.country || "the target country";
    return {
      system: `You are an expert SOP writer for graduate school applications. Write a compelling, personalized Statement of Purpose. Language: ${lang}`,
      user: `Write a Statement of Purpose for this student applying to ${uni} in ${country}:

Profile: ${profile.degree} in ${profile.major}, CGPA: ${profile.cgpa}, University: ${profile.university_name || "N/A"}
Research: Thesis(${profile.has_thesis}), Publication(${profile.has_publication}), Details: ${profile.research_details || "None"}
Experience: Internship: ${profile.internship_details || "None"}, Job: ${profile.job_details || "None"}, Projects: ${profile.project_details || "None"}
Target: ${profile.target_degree} in ${profile.target_major}

Return ONLY JSON:
{"sop":"Full SOP text (600-800 words, well-structured with paragraphs)","wordCount":<number>,"sections":["Introduction","Academic Background","Research Experience","Professional Experience","Future Goals","Why This University"],"tips":["tip1","tip2","tip3"]}`,
    };
  }

  if (action === "generate_lor_guide") {
    return {
      system: `You are an expert academic advisor helping students get strong Letters of Recommendation. Language: ${lang}`,
      user: `Create a LOR guide for this student:

Profile: ${profile.degree} in ${profile.major}, CGPA: ${profile.cgpa}, University: ${profile.university_name || "N/A"}
Research: Thesis(${profile.has_thesis}), Publication(${profile.has_publication})
Target: ${profile.target_degree} in ${profile.target_major}

Return ONLY JSON:
{"recommendedReferees":[{"type":"Professor/Supervisor/Employer","why":"reason","approachScript":"what to say when asking"}],"emailTemplate":"Professional email template to request LOR","lorTemplate":"Template structure for the recommender with sections","tips":["tip1","tip2","tip3"],"commonMistakes":["mistake1","mistake2"],"timeline":"When to ask and follow-up schedule"}`,
    };
  }

  if (action === "generate_academic_cv") {
    return {
      system: `You are an expert academic CV writer. Create a well-structured academic CV/resume suitable for graduate school applications. Language: ${lang}`,
      user: `Create an academic CV for this student:

Name: ${extra?.name || "Student"}
Profile: ${profile.degree} in ${profile.major}, CGPA: ${profile.cgpa}, University: ${profile.university_name || "N/A"}, Graduation: ${profile.graduation_year || "N/A"}
Tests: IELTS: ${profile.ielts_score || "N/A"}, GRE: ${profile.gre_score || "N/A"}
Research: Thesis(${profile.has_thesis}), Publication(${profile.has_publication}), Conference(${profile.has_conference}), Details: ${profile.research_details || "None"}
Experience: Internship: ${profile.internship_details || "None"}, Job: ${profile.job_details || "None"}, Projects: ${profile.project_details || "None"}
Target: ${profile.target_degree} in ${profile.target_major}

Return ONLY JSON:
{"cv":"Full formatted academic CV text (use markdown formatting with headers ##, bullet points, etc.)","sections":["Education","Research Experience","Publications","Work Experience","Projects","Skills","Test Scores","Awards & Activities"],"tips":["tip1","tip2"],"improvements":["what to add to strengthen CV"]}`,
    };
  }

  if (action === "generate_research_proposal") {
    const topic = extra?.topic || profile.target_major;
    return {
      system: `You are an expert research proposal writer for graduate school applications. Language: ${lang}`,
      user: `Write a research proposal outline for a ${profile.target_degree} application in ${topic}:

Student Background: ${profile.degree} in ${profile.major}, Research: ${profile.research_details || "None"}
Target: ${profile.target_degree} in ${profile.target_major}

Return ONLY JSON:
{"proposal":"Full research proposal (800-1000 words with markdown formatting)","title":"Proposed research title","sections":["Introduction & Background","Research Questions","Literature Review","Methodology","Expected Outcomes","Timeline","References"],"tips":["tip1","tip2"],"relatedTopics":["topic1","topic2","topic3"]}`,
    };
  }

  if (action === "generate_roadmap") {
    return {
      system: `You are an expert study abroad application strategist. Create a detailed month-by-month application roadmap. Language: ${lang}`,
      user: `Create a detailed application roadmap for this student:

Profile: ${profile.degree} in ${profile.major}, CGPA: ${profile.cgpa}
Tests: IELTS: ${profile.ielts_score || "N/A"}, GRE: ${profile.gre_score || "N/A"}
Research: Thesis(${profile.has_thesis}), Publication(${profile.has_publication})
Target: ${profile.target_degree} in ${profile.target_major}
Countries: ${(profile.country_preferences || []).join(", ") || "Any"}
Funding: ${profile.funding_preference}

Return ONLY JSON:
{"roadmap":[{"month":"Month 1","title":"Phase Title","tasks":[{"task":"specific task","priority":"high|medium|low","duration":"estimated time","details":"more info"}]}],"deadlines":[{"item":"What","date":"Approximate date/month","country":"Which country","type":"application|test|scholarship|visa","urgent":true/false}],"visaChecklist":[{"item":"requirement","details":"explanation"}],"financialGuide":{"bankStatement":"requirement","estimatedCosts":[{"item":"item","amount":"USD amount"}],"tips":["tip1"]},"summary":"Overview in ${lang}"}`,
    };
  }

  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

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

    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
    if (!OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY is not configured");

    const bodyText = await req.text();
    if (new TextEncoder().encode(bodyText).length > 50 * 1024) {
      return new Response(JSON.stringify({ error: "Payload too large" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { action, profile, language, extra } = JSON.parse(bodyText);
    if (!action || typeof action !== "string" || action.length > 100) {
      return new Response(JSON.stringify({ error: "Invalid action" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!profile || typeof profile !== "object") {
      return new Response(JSON.stringify({ error: "Profile object required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const prompts = buildPrompt(action, profile, language, extra);

    if (!prompts) {
      return new Response(JSON.stringify({ error: "Invalid action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
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
          { role: "system", content: prompts.system },
          { role: "user", content: prompts.user },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    let parsed;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { error: "Could not parse response" };
    } catch {
      parsed = { rawContent: content, error: "Parse error" };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("study-abroad error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
