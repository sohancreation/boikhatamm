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
    const { action, ...params } = JSON.parse(bodyText);
    if (!action || typeof action !== "string" || !["generate_plan", "adapt_plan", "parse_syllabus"].includes(action)) {
      return new Response(JSON.stringify({ error: "Invalid action" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (params.syllabusText && typeof params.syllabusText === "string" && params.syllabusText.length > 20000) {
      return new Response(JSON.stringify({ error: "Syllabus text too long" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
    if (!OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY not configured");

    let systemPrompt = "";
    let userPrompt = "";

    if (action === "generate_plan") {
      const { classLevel, targetExam, examDate, dailyHours, weakSubjects, strongSubjects, syllabusText } = params;
      
      const today = new Date().toISOString().split("T")[0];
      const daysLeft = Math.max(1, Math.ceil((new Date(examDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
      const weeksLeft = Math.ceil(daysLeft / 7);

      systemPrompt = `You are an expert Bangladeshi education planner. Create structured, realistic study plans for students. 
Always respond with valid JSON using the tool provided. Plan in Bengali context but output field values in English for data, descriptions in Bengali.`;

      userPrompt = `Create a ${weeksLeft}-week study plan for a Class ${classLevel} student preparing for ${targetExam}.
Exam date: ${examDate} (${daysLeft} days left)
Daily available hours: ${dailyHours}
Weak subjects: ${weakSubjects.join(", ") || "None specified"}
Strong subjects: ${strongSubjects.join(", ") || "None specified"}
${syllabusText ? `Syllabus info: ${syllabusText}` : ""}

Rules:
- Allocate MORE time to weak subjects (60-70% of study time)
- Strong subjects get maintenance study (20-30%)
- Include revision slots every week
- Include weekly mock test slots
- Each daily task should have: subject, chapter/topic, task_type (study/revision/mcq/mock_test), duration_minutes, description (in Bengali)
- Plan for ${dailyHours} hours per day, 6 days a week (1 day lighter for rest)
- Generate tasks for at least the first 2 weeks in detail
- Make descriptions motivating and specific in Bengali`;

    } else if (action === "adapt_plan") {
      const { incompleteTasks, upcomingTasks, dailyHours } = params;
      
      systemPrompt = `You are an adaptive study planner AI. Adjust study plans when students fall behind. Respond with JSON using the tool.`;
      
      userPrompt = `The student didn't complete these tasks:
${JSON.stringify(incompleteTasks)}

Their upcoming tasks are:
${JSON.stringify(upcomingTasks)}

Daily available hours: ${dailyHours}

Redistribute the incomplete work into the upcoming days. Don't overload any single day beyond ${dailyHours} hours. 
Prioritize the most important missed topics. Give adapted tasks with adjusted descriptions in Bengali explaining the change.`;

    } else if (action === "parse_syllabus") {
      const { syllabusContent } = params;
      
      systemPrompt = `You are a syllabus parser for Bangladeshi education. Extract subjects, chapters, and topics from syllabus content.`;
      
      userPrompt = `Parse this syllabus content and extract structured information:
${syllabusContent}

Extract: subjects with their chapters/topics listed.`;
    } else {
      throw new Error("Unknown action: " + action);
    }

    const tools = action === "generate_plan" ? [{
      type: "function",
      function: {
        name: "create_study_plan",
        description: "Create a structured study plan with daily tasks",
        parameters: {
          type: "object",
          properties: {
            weeks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  week_number: { type: "number" },
                  focus: { type: "string" },
                  days: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        day_offset: { type: "number", description: "Days from today (0 = today)" },
                        tasks: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              subject: { type: "string" },
                              chapter: { type: "string" },
                              task_type: { type: "string", enum: ["study", "revision", "mcq", "mock_test"] },
                              duration_minutes: { type: "number" },
                              description: { type: "string" }
                            },
                            required: ["subject", "chapter", "task_type", "duration_minutes", "description"]
                          }
                        }
                      },
                      required: ["day_offset", "tasks"]
                    }
                  }
                },
                required: ["week_number", "focus", "days"]
              }
            },
            summary: { type: "string", description: "Plan summary in Bengali" }
          },
          required: ["weeks", "summary"]
        }
      }
    }] : action === "adapt_plan" ? [{
      type: "function",
      function: {
        name: "adapt_study_plan",
        description: "Return adapted tasks",
        parameters: {
          type: "object",
          properties: {
            adapted_tasks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  subject: { type: "string" },
                  chapter: { type: "string" },
                  task_type: { type: "string" },
                  duration_minutes: { type: "number" },
                  description: { type: "string" },
                  day_offset: { type: "number" }
                },
                required: ["subject", "chapter", "task_type", "duration_minutes", "description", "day_offset"]
              }
            },
            message: { type: "string", description: "Adaptive message in Bengali" }
          },
          required: ["adapted_tasks", "message"]
        }
      }
    }] : [{
      type: "function",
      function: {
        name: "parse_syllabus_result",
        description: "Return parsed syllabus",
        parameters: {
          type: "object",
          properties: {
            subjects: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  chapters: {
                    type: "array",
                    items: { type: "string" }
                  }
                },
                required: ["name", "chapters"]
              }
            }
          },
          required: ["subjects"]
        }
      }
    }];

    const toolChoice = action === "generate_plan" 
      ? { type: "function", function: { name: "create_study_plan" } }
      : action === "adapt_plan"
      ? { type: "function", function: { name: "adapt_study_plan" } }
      : { type: "function", function: { name: "parse_syllabus_result" } };

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
        tools,
        tool_choice: toolChoice,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error("No tool call in response");
    }

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("study-planner error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
