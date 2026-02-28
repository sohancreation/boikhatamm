import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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
    const { action, subject, chapter, topic, difficulty, questionCount, language, answers, questions, contextHint } = JSON.parse(bodyText);
    if (!action || typeof action !== "string") {
      return new Response(JSON.stringify({ error: "Missing action" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (action === "generate" && (!subject || typeof subject !== "string" || subject.length > 500)) {
      return new Response(JSON.stringify({ error: "Invalid subject" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (questionCount !== undefined && (typeof questionCount !== "number" || questionCount < 1 || questionCount > 50)) {
      return new Response(JSON.stringify({ error: "questionCount must be 1-50" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (action === "analyze" && (!Array.isArray(questions) || questions.length > 100)) {
      return new Response(JSON.stringify({ error: "Invalid questions array" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
    if (!OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY not configured");

    if (action === "generate") {
      const lang = language === "bn" ? "Bengali" : "English";
      const prompt = `You are an expert exam question generator for Bangladeshi students.
${contextHint ? `Context: ${contextHint}` : ""}

Generate exactly ${questionCount || 10} MCQ questions for:
- Subject: ${subject}
${chapter ? `- Chapter: ${chapter}` : ""}
${topic ? `- Topic: ${topic}` : ""}
- Difficulty: ${difficulty || "medium"}
- Language: ${lang}

Each question must have exactly 4 options (A, B, C, D) and one correct answer.
Make questions conceptual, not just memorization-based. Vary difficulty slightly.
${contextHint?.includes("University") ? "Questions should be at university/undergraduate level with appropriate depth and complexity." : ""}
${contextHint?.includes("Job preparation") ? "Questions should match the style and difficulty of actual competitive exam questions in Bangladesh (BCS, Bank, or corporate recruitment tests)." : ""}`;

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: prompt },
            { role: "user", content: "Generate the questions now." },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "return_questions",
                description: "Return generated quiz questions",
                parameters: {
                  type: "object",
                  properties: {
                    questions: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id: { type: "number" },
                          question: { type: "string" },
                          options: {
                            type: "object",
                            properties: {
                              A: { type: "string" },
                              B: { type: "string" },
                              C: { type: "string" },
                              D: { type: "string" },
                            },
                            required: ["A", "B", "C", "D"],
                          },
                          correct: { type: "string", enum: ["A", "B", "C", "D"] },
                          explanation: { type: "string" },
                        },
                        required: ["id", "question", "options", "correct", "explanation"],
                      },
                    },
                  },
                  required: ["questions"],
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "return_questions" } },
        }),
      });

      if (!response.ok) {
        const status = response.status;
        if (status === 429) return new Response(JSON.stringify({ error: "Rate limited. Try again shortly." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (status === 402) return new Response(JSON.stringify({ error: "Credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        throw new Error(`AI error: ${status}`);
      }

      const data = await response.json();
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      if (!toolCall) throw new Error("No tool call in response");
      const parsed = JSON.parse(toolCall.function.arguments);

      return new Response(JSON.stringify({ questions: parsed.questions }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "analyze") {
      const lang = language === "bn" ? "Bengali" : "English";
      // answers: { [questionId]: selectedOption }, questions: full question array
      let correct = 0;
      const weakTopics: string[] = [];
      const details: any[] = [];

      for (const q of questions) {
        const userAns = answers[q.id];
        const isCorrect = userAns === q.correct;
        if (isCorrect) correct++;
        else weakTopics.push(q.question.substring(0, 50));
        details.push({ id: q.id, correct: isCorrect, userAnswer: userAns, correctAnswer: q.correct });
      }

      const score = Math.round((correct / questions.length) * 100);

      const prompt = `A student just finished a quiz on "${subject}" ${topic ? `(topic: ${topic})` : ""}.
Score: ${correct}/${questions.length} (${score}%)
Wrong questions summary: ${weakTopics.join("; ") || "None"}

Give a short, encouraging ${lang} feedback (3-4 sentences). Mention specific weak areas and suggest what to revise. Be motivational.`;

      const fbResp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [
            { role: "system", content: "You are a supportive AI tutor for Bangladeshi students." },
            { role: "user", content: prompt },
          ],
        }),
      });

      let feedback = "";
      if (fbResp.ok) {
        const fbData = await fbResp.json();
        feedback = fbData.choices?.[0]?.message?.content || "";
      }

      return new Response(JSON.stringify({ score, correct, total: questions.length, details, feedback }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("quiz-engine error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
