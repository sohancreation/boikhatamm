import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
    if (!OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY is not configured");

    const bodyText = await req.text();
    if (new TextEncoder().encode(bodyText).length > 50 * 1024) {
      return new Response(JSON.stringify({ error: "Payload too large" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const {
      action,
      jobCategory,
      govSubCategory,
      examStage,
      topic,
      language,
      questionNumber,
      totalQuestions,
      currentQuestion,
      userAnswer,
      conversationHistory,
      privateIndustry,
      privateRole,
    } = JSON.parse(bodyText);
    if (!action || !["ask_question", "evaluate_answer", "generate_report"].includes(action)) {
      return new Response(JSON.stringify({ error: "Invalid action" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (userAnswer && typeof userAnswer === "string" && userAnswer.length > 5000) {
      return new Response(JSON.stringify({ error: "Answer too long" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (conversationHistory && Array.isArray(conversationHistory) && conversationHistory.length > 50) {
      return new Response(JSON.stringify({ error: "History too long" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let systemPrompt = "";
    let userPrompt = "";

    if (action === "ask_question") {
      const jobContext = jobCategory === "government"
        ? `Government Job Category: ${govSubCategory?.toUpperCase()}
Exam Stage: ${examStage}
${topic ? `Topic Focus: ${topic}` : ""}`
        : `Private Sector
Industry: ${privateIndustry || "General"}
Target Role: ${privateRole || "General"}`;

      const prevQs = conversationHistory?.length
        ? `\nPrevious questions asked (DO NOT repeat these):\n${conversationHistory.map((h: any) => `- ${h.question}`).join("\n")}`
        : "";

      systemPrompt = `You are an expert Bangladeshi job interview panel member. You conduct realistic, professional mock interviews.

Context:
${jobContext}
Language preference: ${language === "bn" ? "Bangla" : "English"}
Question ${questionNumber} of ${totalQuestions}

Rules:
1. Ask exactly ONE interview question appropriate for the job type, exam stage, and topic.
2. Questions should progressively increase in difficulty.
3. For government jobs, include questions about Bangladesh's constitution, governance, current affairs, history, and job-specific knowledge.
4. For BCS viva, ask questions a real BCS viva board would ask - personal, academic, current affairs, Bangladesh studies.
5. For bank jobs, include quantitative aptitude, banking knowledge, economics, and English proficiency questions.
6. For private sector, ask behavioral, technical, and situational questions relevant to the industry and role.
7. If language is Bangla, ask in Bangla script. If English, ask in English.
8. Make questions realistic and challenging - this should feel like a real interview.
${prevQs}`;

      userPrompt = `Generate the next interview question (Question ${questionNumber} of ${totalQuestions}). Return ONLY a JSON object with this exact format:
{
  "question": "The interview question text",
  "hint": "A brief hint or context about what a good answer should cover (1-2 sentences)",
  "difficulty": "easy|medium|hard",
  "category": "The topic/category of this question"
}`;
    } else if (action === "evaluate_answer") {
      systemPrompt = `You are an expert Bangladeshi job interview evaluator. Evaluate the candidate's answer critically but fairly.

Job Type: ${jobCategory === "government" ? `Government - ${govSubCategory?.toUpperCase()} - ${examStage}` : `Private - ${privateIndustry} - ${privateRole}`}
Language: ${language === "bn" ? "Bangla" : "English"}

Evaluation criteria:
1. Accuracy & correctness (for factual questions)
2. Depth of knowledge
3. Communication clarity
4. Relevance to the question
5. Confidence and professionalism
6. For Bangla answers, evaluate both content and expression quality`;

      userPrompt = `Question: "${currentQuestion}"
Candidate's Answer: "${userAnswer}"

Evaluate this answer. Return ONLY a JSON object:
{
  "score": <number 1-10>,
  "feedback": "Detailed feedback in ${language === "bn" ? "Bangla" : "English"} (2-3 sentences)",
  "modelAnswer": "A model/ideal answer for reference (2-3 sentences)",
  "strengths": ["strength1", "strength2"],
  "weaknesses": ["weakness1", "weakness2"],
  "improvement": "One specific tip to improve"
}`;
    } else if (action === "generate_report") {
      systemPrompt = `You are an expert career coach specializing in Bangladeshi job market preparation. Generate a comprehensive performance report.

Job Type: ${jobCategory === "government" ? `Government - ${govSubCategory?.toUpperCase()} - ${examStage}` : `Private - ${privateIndustry} - ${privateRole}`}
Language: ${language === "bn" ? "Bangla" : "English"}`;

      const historyText = conversationHistory?.map((h: any, i: number) =>
        `Q${i + 1}: ${h.question}\nAnswer: ${h.answer}\nScore: ${h.score}/10\nFeedback: ${h.feedback}`
      ).join("\n\n") || "No history";

      userPrompt = `Here is the complete interview session:

${historyText}

Generate a comprehensive performance report. Return ONLY a JSON object:
{
  "overallScore": <number 1-100>,
  "grade": "A+|A|B+|B|C+|C|D|F",
  "summary": "Overall performance summary (3-4 sentences in ${language === "bn" ? "Bangla" : "English"})",
  "strengths": ["Top strength areas with details"],
  "weaknesses": ["Areas needing improvement with details"],
  "topicBreakdown": [{"topic": "topic name", "score": <1-100>, "comment": "brief comment"}],
  "recommendations": ["Specific study/practice recommendations"],
  "readinessLevel": "Not Ready|Needs Practice|Almost Ready|Interview Ready|Excellent",
  "nextSteps": ["Actionable next steps for improvement"],
  "motivationalNote": "An encouraging message in ${language === "bn" ? "Bangla" : "English"}"
}`;
    } else {
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
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
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

    // Parse JSON from AI response
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
    console.error("mock-interview error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
