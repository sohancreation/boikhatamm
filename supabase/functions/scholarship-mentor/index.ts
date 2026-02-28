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
      ? "Respond entirely in Bangla (Bengali script)."
      : "Respond in English.";

    const prompts: Record<string, { system: string; user: string }> = {
      "find-scholarship": {
        system: `You are an expert Scholarship Advisor specializing in opportunities for Bangladeshi students. ${langInstruction}

The student has specified a scholarship scope: "${data.scope || "all"}".

${data.scope === "bangladesh" ? `FOCUS ONLY on Bangladeshi domestic scholarships. Include:
- Government scholarships (Prime Minister's Education Trust, Ministry of Education stipends, National Science & Technology Fellowship, MOSICT ICT scholarship)
- University-specific scholarships & fee waivers (DU, BUET, JU, RU, CU, KUET, RUET, SUST, BRAC, NSU, IUB, AIUB, EWU, UIU etc.)
- NGO scholarships (BRAC, ASA, Grameen, Jaago Foundation, Bangladesh Youth Leadership Center)
- Corporate/private scholarships (Square, Robi-Axiata, Grameenphone, Walton, IDLC, Dutch-Bangla Bank)
- Board-level merit scholarships for SSC/HSC results
- Upazila/district-level education stipends
- Female education stipends (উপবৃত্তি)
- Tribal/ethnic minority scholarships
- Freedom fighter family scholarships
- Small fund grants (৫,০০০ - ৫০,০০০ BDT) for tuition, books, exam fees
- Monthly stipend programs
Provide exact amounts in BDT, application processes, and deadlines.` :
data.scope === "international" ? `Focus on international scholarships available to Bangladeshi students studying abroad.` :
`Include BOTH domestic Bangladeshi scholarships AND international opportunities. Give special priority to Bangladesh-specific ones that students often miss.`}

Provide a comprehensive, well-structured response with:
1. **Available Scholarships** — List 8-12 relevant scholarships with name, organization, amount (in BDT for domestic), eligibility, and deadline
2. **Eligibility Match** — For each scholarship, give eligibility match percentage based on student profile
3. **Required Documents** — Exact documents needed for top matches
4. **Application Tips** — Specific success strategies
5. **Important Deadlines** — In chronological order
6. **Quick Small Funds** — For students who need immediate financial help, list 3-5 small fund/stipend options

Use real scholarship names. Use markdown formatting with tables where appropriate.`,
        user: `Find scholarships for this student profile:\n\nLevel: ${data.level}\nGPA: ${data.gpa}\nField: ${data.field}\nFinancial Need: ${data.financialNeed}\nTarget Country: ${data.targetCountry || "Bangladesh"}\nInstitution: ${data.institution || "Not specified"}\nDistrict: ${data.district || "Not specified"}\n\nAdditional Info: ${data.additionalInfo || "None"}`,
      },
      "abroad-guide": {
        system: `You are an expert Higher Study Abroad Mentor for Bangladeshi students. ${langInstruction}

Provide comprehensive country + subject guidance with:
1. **Top Universities** — List 8-10 best universities for the chosen subject with world ranking
2. **Admission Requirements** — GPA, IELTS/TOEFL, GRE/GMAT scores needed
3. **Tuition & Costs** — Yearly tuition range, living costs, total budget estimate in BDT
4. **Scholarship Opportunities** — Country-specific scholarships for Bangladeshi students
5. **Visa Requirements** — Documents, processing time, fees
6. **Language Requirements** — IELTS/TOEFL minimums, waivers if available
7. **Career Prospects** — Post-graduation work permit, average salary, job market
8. **Application Timeline** — Month-by-month planning guide

Use real, current data. Format with markdown tables and clear sections.`,
        user: `Guide for studying abroad:\n\nCountry: ${data.country}\nSubject: ${data.subject}\nDegree Level: ${data.degreeLevel}\nCurrent GPA: ${data.gpa || "Not specified"}\nIELTS Score: ${data.ielts || "Not taken yet"}\nBudget Range: ${data.budget || "Flexible"}`,
      },
      "higher-studies-mentor": {
        system: `You are a comprehensive Higher Studies Mentor for Bangladeshi students — covering BOTH domestic and international pathways. ${langInstruction}

Based on the student's profile and goals, provide:

1. **Personalized Pathway Analysis** — Evaluate their profile strength and recommend the best path (domestic vs abroad, which countries/universities)
2. **Step-by-Step Roadmap** — A detailed month-by-month plan from NOW until admission
3. **Test Preparation Guide** — Which tests to take (GRE/GMAT/IELTS/TOEFL/SAT), target scores, preparation timeline
4. **University Shortlist** — 10-15 universities categorized as Dream/Target/Safety with acceptance chances
5. **Funding Strategy** — Complete financial plan including scholarships, assistantships, education loans, part-time work options
6. **Profile Building Tips** — Research experience, publications, extracurriculars, work experience needed
7. **Application Strategy** — How many universities to apply, early vs regular deadlines, fee waivers
8. **Bangladesh-Specific Advice** — Local resources, coaching centers, document attestation from MoFA, bank solvency tips
9. **Common Mistakes** — Top 10 mistakes Bangladeshi students make and how to avoid them
10. **Success Stories** — Brief examples of Bangladeshi students who succeeded on similar paths

Be extremely detailed, practical, and encouraging.`,
        user: `Student Profile for mentoring:\n\nName: ${data.name || "Student"}\nCurrent Level: ${data.currentLevel}\nField: ${data.field}\nGPA/CGPA: ${data.gpa}\nTarget Degree: ${data.targetDegree}\nDream Countries: ${data.dreamCountries || "Open to suggestions"}\nBudget: ${data.budget || "Moderate"}\nIELTS/TOEFL: ${data.testScores || "Not taken"}\nWork Experience: ${data.workExperience || "None"}\nResearch Experience: ${data.researchExperience || "None"}\nGoals: ${data.goals || "Get into a good university"}\nTimeline: ${data.timeline || "Next intake"}`,
      },
      "document-help": {
        system: `You are an expert academic writing mentor specializing in scholarship and university applications for Bangladeshi students. ${langInstruction}

Help write the requested document with:
- Professional structure and formatting
- Compelling content tailored to the purpose
- Country/university-specific customization tips
- Common mistakes to avoid
- A complete template/draft they can customize

Be specific, actionable, and provide a ready-to-use document.`,
        user: `Help me write: ${data.documentType}\n\nPurpose: ${data.purpose}\nTarget University/Scholarship: ${data.target || "General"}\nCountry: ${data.country || "Not specified"}\nField of Study: ${data.field || "Not specified"}\nStudent Background: ${data.background || "Not provided"}\nAdditional Notes: ${data.notes || "None"}`,
      },
      "visa-prep": {
        system: `You are a Visa Interview Coach specializing in student visas for Bangladeshi applicants. ${langInstruction}

Conduct a realistic visa interview simulation:
1. **Common Questions** — List 15-20 most likely questions with model answers
2. **Tricky Questions** — 5 difficult questions with strategic answers
3. **Confidence Tips** — Body language, tone, presentation advice
4. **Risk Warnings** — Red flags to avoid, common rejection reasons
5. **Document Checklist** — What to bring to the interview
6. **Mock Interview Score** — Rate preparedness out of 100

Make answers specific to the student's profile and country.`,
        user: `Prepare me for a visa interview:\n\nCountry: ${data.country}\nVisa Type: Student Visa\nUniversity: ${data.university || "Not specified"}\nProgram: ${data.program || "Not specified"}\nFunding: ${data.funding || "Not specified"}\nPrevious Travel: ${data.previousTravel || "None"}\nAdditional Context: ${data.context || "None"}`,
      },
      "checklist": {
        system: `You are a Study Abroad Application Expert for Bangladeshi students. ${langInstruction}

Generate a complete, actionable document checklist and timeline:
1. **Required Documents** — Organized by category (Academic, Financial, Identity, Language)
2. **Document Details** — Where to get each document, cost, processing time
3. **Application Timeline** — Week-by-week plan
4. **Progress Tracker** — Checklist format with status indicators
5. **Tips** — How to get documents faster, common issues

Be extremely detailed and practical.`,
        user: `Generate document checklist:\n\nCountry: ${data.country}\nDegree Level: ${data.degreeLevel}\nUniversity: ${data.university || "General"}\nIntake: ${data.intake || "Next available"}`,
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
    console.error("scholarship-mentor error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
