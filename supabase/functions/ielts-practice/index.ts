import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    if (authError || !authUser) {
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
    const {
      action,
      module,
      level,
      taskType,
      userAnswer,
      passage,
      question,
      conversationHistory,
      language,
    } = JSON.parse(bodyText);
    const validActions = ["generate_passage", "generate_writing_task", "evaluate_writing", "generate_speaking_question", "evaluate_speaking", "generate_listening", "evaluate_listening"];
    if (!action || !validActions.includes(action)) {
      return new Response(JSON.stringify({ error: "Invalid action" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (userAnswer && typeof userAnswer === "string" && userAnswer.length > 10000) {
      return new Response(JSON.stringify({ error: "Answer too long" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (conversationHistory && Array.isArray(conversationHistory) && conversationHistory.length > 50) {
      return new Response(JSON.stringify({ error: "Conversation history too long" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let systemPrompt = "";
    let userPrompt = "";

    const levelDesc = level === "4-5" ? "beginner (Band 4-5)" : level === "6-7" ? "intermediate (Band 6-7)" : "advanced (Band 8+)";
    const langNote = language === "bn" ? "Provide brief Bangla (বাংলা) hints/tips alongside English content where helpful." : "";

    if (action === "generate_passage") {
      systemPrompt = `You are an IELTS Reading test generator. Create authentic IELTS-style reading passages with questions. ${langNote}`;
      userPrompt = `Generate an IELTS Academic Reading passage for ${levelDesc} level. Return ONLY a JSON object:
{
  "title": "Passage title",
  "passage": "A 300-500 word academic passage appropriate for IELTS",
  "questions": [
    {"id": 1, "type": "multiple_choice", "question": "Question text", "options": ["A", "B", "C", "D"], "correctAnswer": "A", "explanation": "Why this is correct"},
    {"id": 2, "type": "fill_blank", "question": "Complete: The study showed that ___", "correctAnswer": "answer text", "explanation": "Explanation"},
    {"id": 3, "type": "true_false_notgiven", "question": "Statement to evaluate", "correctAnswer": "True", "explanation": "Explanation"},
    {"id": 4, "type": "multiple_choice", "question": "Question", "options": ["A", "B", "C", "D"], "correctAnswer": "B", "explanation": "Why"},
    {"id": 5, "type": "short_answer", "question": "Question requiring brief answer", "correctAnswer": "answer", "explanation": "Explanation"}
  ]${language === "bn" ? ',\n  "banglaHint": "বাংলায় সংক্ষিপ্ত টিপস"' : ""}
}`;
    } else if (action === "generate_writing_task") {
      const taskDesc = taskType === "task1"
        ? "Task 1: Describe a graph, chart, table, or diagram in at least 150 words"
        : "Task 2: Write an essay of at least 250 words on a given topic";

      systemPrompt = `You are an IELTS Writing test generator. Create authentic IELTS writing tasks. ${langNote}`;
      userPrompt = `Generate an IELTS Academic Writing ${taskDesc} for ${levelDesc} level. Return ONLY a JSON object:
{
  "taskNumber": ${taskType === "task1" ? 1 : 2},
  "instruction": "Full task instruction text",
  "topic": "Brief topic description",
  "dataDescription": ${taskType === "task1" ? '"Description of the visual data (e.g., bar chart showing X over Y years)"' : '"null"'},
  "wordLimit": ${taskType === "task1" ? 150 : 250},
  "tips": ["Tip 1", "Tip 2", "Tip 3"],
  "sampleOutline": "Brief outline of what a good answer should cover"${language === "bn" ? ',\n  "banglaHint": "বাংলায় লেখার টিপস"' : ""}
}`;
    } else if (action === "evaluate_writing") {
      systemPrompt = `You are an IELTS Writing examiner with extensive experience. Evaluate writing using official IELTS criteria. ${langNote}`;
      userPrompt = `Task: "${question}"
Student's answer: "${userAnswer}"
Level target: ${levelDesc}

Evaluate this IELTS writing response. Return ONLY a JSON object:
{
  "taskAchievement": {"score": <1.0-9.0>, "feedback": "Detailed feedback"},
  "coherenceCohesion": {"score": <1.0-9.0>, "feedback": "Detailed feedback"},
  "lexicalResource": {"score": <1.0-9.0>, "feedback": "Detailed feedback"},
  "grammaticalRange": {"score": <1.0-9.0>, "feedback": "Detailed feedback"},
  "overallBand": <1.0-9.0>,
  "wordCount": <number>,
  "strengths": ["strength1", "strength2"],
  "improvements": ["improvement1", "improvement2"],
  "correctedVersion": "A model answer or improved version (2-3 key sentences)",
  "tips": ["Specific actionable tip 1", "Tip 2"]${language === "bn" ? ',\n  "banglaFeedback": "বাংলায় সংক্ষিপ্ত ফিডব্যাক"' : ""}
}`;
    } else if (action === "generate_speaking_question") {
      const partDesc = taskType === "part1" ? "Part 1: Introduction & Interview (simple personal questions)"
        : taskType === "part2" ? "Part 2: Long Turn (cue card - speak for 1-2 minutes)"
        : "Part 3: Discussion (abstract/opinion questions related to Part 2 topic)";

      // Build conversation context from full history (examiner + student)
      let conversationContext = "";
      if (conversationHistory?.length) {
        conversationContext = "\n\nPrevious conversation:\n" + conversationHistory.map((h: any) => {
          if (h.role === "examiner") return `Examiner: ${h.text}`;
          if (h.role === "student") return `Candidate: ${h.text}`;
          if (h.question) return `Examiner: ${h.question}`;
          return "";
        }).filter(Boolean).join("\n");
        conversationContext += "\n\nIMPORTANT: Generate a DIFFERENT question that follows up on the candidate's last answer. React to what they said. DO NOT repeat any previous question. Ask about a new related topic or dig deeper into something they mentioned.";
      }

      systemPrompt = `You are an IELTS Speaking examiner conducting a live speaking test. You must ask varied, contextual questions that respond to the candidate's answers. Never repeat a question. ${langNote}
${partDesc}
${conversationContext}`;

      if (taskType === "part2") {
        userPrompt = `Generate an IELTS Speaking Part 2 cue card for ${levelDesc}. Return ONLY a JSON:
{
  "question": "Describe a [topic]. You should say: - point 1 - point 2 - point 3 - and explain why...",
  "prepTime": 60,
  "speakTime": 120,
  "followUp": "A brief follow-up question after the long turn"${language === "bn" ? ',\n  "banglaHint": "বাংলায় সংক্ষিপ্ত টিপ"' : ""}
}`;
      } else {
        userPrompt = `Generate a NEW IELTS Speaking ${taskType === "part1" ? "Part 1" : "Part 3"} question for ${levelDesc}. The question MUST be different from all previous ones and should naturally follow from the conversation. Return ONLY a JSON:
{
  "question": "The speaking question",
  "followUp": "A natural follow-up question",
  "samplePoints": ["Point to cover 1", "Point 2"]${language === "bn" ? ',\n  "banglaHint": "বাংলায় সংক্ষিপ্ত টিপ"' : ""}
}`;
      }
    } else if (action === "evaluate_speaking") {
      systemPrompt = `You are an IELTS Speaking examiner. Evaluate the transcribed spoken response. ${langNote}`;
      userPrompt = `Question: "${question}"
Transcribed answer: "${userAnswer}"
Speaking Part: ${taskType}
Target level: ${levelDesc}

Evaluate this response. Return ONLY a JSON:
{
  "fluencyCoherence": {"score": <1.0-9.0>, "feedback": "feedback"},
  "lexicalResource": {"score": <1.0-9.0>, "feedback": "feedback"},
  "grammaticalRange": {"score": <1.0-9.0>, "feedback": "feedback"},
  "pronunciation": {"score": <1.0-9.0>, "feedback": "Note: based on text only, estimated"},
  "overallBand": <1.0-9.0>,
  "strengths": ["strength1"],
  "improvements": ["improvement1"],
  "modelAnswer": "A sample high-scoring response (2-3 sentences)",
  "tips": ["Tip 1"]${language === "bn" ? ',\n  "banglaFeedback": "বাংলায় ফিডব্যাক"' : ""}
}`;
    } else if (action === "generate_listening") {
      systemPrompt = `You are an IELTS Listening test generator. Create a realistic listening scenario with transcript and questions. ${langNote}`;
      userPrompt = `Generate an IELTS Listening section for ${levelDesc}. Since we can't play audio, provide a transcript that the student reads as if listening. Return ONLY a JSON:
{
  "scenario": "Brief description of the listening scenario (e.g., university lecture, conversation between students)",
  "transcript": "A 200-400 word transcript of the audio content",
  "questions": [
    {"id": 1, "type": "fill_blank", "question": "Complete: The main topic discussed was ___", "correctAnswer": "answer", "explanation": "explanation"},
    {"id": 2, "type": "multiple_choice", "question": "Question", "options": ["A", "B", "C", "D"], "correctAnswer": "B", "explanation": "why"},
    {"id": 3, "type": "fill_blank", "question": "The speaker mentioned ___ as a key factor", "correctAnswer": "answer", "explanation": "explanation"},
    {"id": 4, "type": "multiple_choice", "question": "Question", "options": ["A", "B", "C"], "correctAnswer": "A", "explanation": "why"},
    {"id": 5, "type": "short_answer", "question": "Brief answer question", "correctAnswer": "answer", "explanation": "explanation"}
  ]${language === "bn" ? ',\n  "banglaHint": "বাংলায় শোনার টিপস"' : ""}
}`;
    } else if (action === "evaluate_listening") {
      systemPrompt = `You are an IELTS Listening evaluator.`;
      userPrompt = `Evaluate these listening answers. Questions and correct answers:
${JSON.stringify(conversationHistory)}

Student's answers: ${JSON.stringify(userAnswer)}

Return ONLY a JSON:
{
  "score": <number of correct>,
  "total": <total questions>,
  "bandEstimate": <1.0-9.0>,
  "results": [{"questionId": 1, "correct": true, "userAnswer": "x", "correctAnswer": "y", "explanation": "why"}],
  "tips": ["Improvement tip"]${language === "bn" ? ',\n  "banglaFeedback": "বাংলায় ফিডব্যাক"' : ""}
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
    console.error("ielts-practice error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
