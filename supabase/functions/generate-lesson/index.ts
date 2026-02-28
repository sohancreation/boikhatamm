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
    const { courseName, moduleTitle, moduleNumber, lessonTitles, objectives, keyConcepts, classLevel, language, depth, tone } = JSON.parse(bodyText);
    if (!courseName || typeof courseName !== "string" || courseName.length > 500) {
      return new Response(JSON.stringify({ error: "Invalid courseName" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (lessonTitles && Array.isArray(lessonTitles) && lessonTitles.length > 20) {
      return new Response(JSON.stringify({ error: "Too many lesson titles (max 20)" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
    if (!OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY is not configured");

    const lang = language === "bn" ? "Bangla" : "English";
    const depthLevel = depth || "standard";
    const toneMode = tone || "academic";

    // Auto-detect course type from course name, module title, and key concepts
    const allText = `${courseName} ${moduleTitle} ${(keyConcepts || []).join(" ")} ${(lessonTitles || []).join(" ")}`.toLowerCase();
    
    const mathKeywords = ["math", "গণিত", "calculus", "algebra", "geometry", "trigonometry", "statistics", "probability", "equation", "derivative", "integral", "matrix", "vector", "linear", "quadratic", "polynomial", "theorem", "proof", "logarithm", "differentiation", "integration", "arithmetic", "number theory", "combinatorics"];
    const codingKeywords = ["programming", "প্রোগ্রামিং", "coding", "code", "python", "java", "javascript", "c++", "algorithm", "data structure", "array", "linked list", "tree", "graph", "sorting", "searching", "recursion", "dynamic programming", "oop", "function", "loop", "variable", "class", "object", "database", "sql", "api", "web dev", "react", "html", "css", "compiler", "debugging"];
    
    const isMath = mathKeywords.some(k => allText.includes(k));
    const isCoding = codingKeywords.some(k => allText.includes(k));
    
    let courseType = "theory";
    if (isCoding) courseType = "coding";
    else if (isMath) courseType = "math";

    const toneInstructions: Record<string, string> = {
      academic: "Use formal academic language with proper terminology, definitions, and structured explanations.",
      friendly: "Use conversational, encouraging language. Explain concepts as if talking to a friend.",
      storytelling: "Weave concepts into compelling narratives with real stories and historical anecdotes.",
      revision: "Be concise and direct. Focus on key points, formulas, and quick summaries.",
    };

    // Build the specialized prompt sections based on course type
    let mathSection = "";
    let codingSection = "";

    if (courseType === "math" || courseType === "coding") {
      mathSection = `
📐 MATH CONTENT (CRITICAL — include for every math-related lesson):
Each lesson with mathematical content MUST include a "math" field:
{
  "math": {
    "problem_statement": "Clearly define the mathematical problem",
    "concepts_required": ["List of formulas/theorems needed"],
    "step_by_step_derivation": [
      {"step": 1, "action": "What we do", "equation": "The equation/expression", "explanation": "WHY we do this step"}
    ],
    "why_this_works": "Explain reasoning behind the chosen strategy",
    "alternative_approach": {
      "method": "Name of alternative method",
      "steps": ["Brief steps of alternative approach"],
      "when_to_use": "When this approach is better"
    },
    "common_mistakes": [
      {"mistake": "Description of mistake", "why_wrong": "Why it's wrong", "correct_way": "The correct approach"}
    ],
    "practice_problems": [
      {"difficulty": "direct|conceptual|hard", "problem": "Problem statement", "solution_steps": ["Step 1", "Step 2"], "answer": "Final answer"}
    ]
  }
}

MATH RULES:
- Show EVERY algebra step clearly. NEVER skip derivation steps.
- Explain WHY each step is done, not just what.
- Show alternative solving strategies when available.
- Identify common calculation errors (sign errors, formula misuse, arithmetic mistakes).
- Provide 2 direct problems, 1 conceptual variation, 1 harder version — ALL with full solutions.
`;
    }

    if (courseType === "coding") {
      codingSection = `
💻 CODING CONTENT (CRITICAL — include for every coding lesson):
Each lesson with coding content MUST include a "coding" field:
{
  "coding": {
    "language": "python/javascript/java/c++/etc",
    "problem_statement": "A practical, real coding problem — not theory",
    "thought_process": {
      "data_structure": "What data structure and why",
      "algorithm": "What algorithm and why",
      "approach": "Step-by-step thinking before coding"
    },
    "code_construction": [
      {"phase": "Skeleton", "code": "def solve():\\n  pass", "explanation": "Start with structure"},
      {"phase": "Add Logic", "code": "def solve(arr):\\n  result = []\\n  for x in arr:\\n    result.append(x*2)\\n  return result", "explanation": "Core logic added"},
      {"phase": "Final Version", "code": "Full complete code", "explanation": "Production-ready version"}
    ],
    "full_code": "Complete runnable program with comments",
    "code_walkthrough": [
      {"line_ref": "Line description", "explanation": "What this does and why"}
    ],
    "test_cases": [
      {"input": "Sample input", "output": "Expected output", "explanation": "Why this output"}
    ],
    "edge_cases": [
      {"case": "Empty input", "input": "[]", "expected": "[]", "explanation": "How code handles it"}
    ],
    "complexity": {
      "time": "O(n) — explanation of why",
      "space": "O(1) — explanation of why"
    },
    "optimization": {
      "current_issue": "What could be improved",
      "optimized_code": "Better version if applicable",
      "improvement": "What changed and why it's better"
    },
    "debugging_insight": {
      "buggy_code": "A common wrong version of the code",
      "bug_explanation": "Why it fails",
      "fix": "How to fix it"
    },
    "simulation": {
      "input": "Sample input for trace",
      "variable_trace": [
        {"step": 1, "variables": {"i": 0, "sum": 0}, "action": "Initialize"}
      ]
    }
  }
}

CODING RULES:
- Write FULL runnable code, never pseudocode-only.
- Explain each important line of code.
- Show sample input/output with explanations.
- Analyze time AND space complexity with Big-O.
- Show edge cases (empty input, large input, negative values, boundary).
- Show a common buggy version and explain debugging.
- Include a variable trace simulation showing values changing step by step.
`;
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a world-class educator creating detailed lesson content. You act like a competitive programming mentor, engineering lab instructor, and problem-solving coach — NOT like Wikipedia or a blog.

Language: ${lang}
Tone: ${toneMode} — ${toneInstructions[toneMode] || toneInstructions.academic}
Depth: ${depthLevel}
Course Type Detected: ${courseType.toUpperCase()}

For Module "${moduleTitle}" (Module ${moduleNumber}) of course "${courseName}", generate FULL detailed lesson content.

Each lesson MUST follow this pedagogical structure:

🔹 1. HOOK (Why this matters)
- A compelling real-life scenario or question
- Industry relevance
- "After this lesson, you will be able to..."

🔹 2. CONCEPT EXPLANATION (Progressive depth)
- Simple explanation (use analogies, everyday language)
- Deeper explanation (technical details, formal definitions)
- ${depthLevel === "advanced" || depthLevel === "research" ? "Technical/mathematical explanation with formulas and derivations" : "Key formulas if applicable"}

🔹 3. VISUAL CLARIFICATION
- Describe a diagram or flowchart
- A memorable analogy
- A worked example with step-by-step solution

🔹 4. PRACTICAL APPLICATION
- Real-world case study or applied scenario
- Step-by-step walkthrough

🔹 5. PRACTICE TASK
- A hands-on exercise for the student to try
- Hints provided

🔹 6. RECAP
- 4-6 key takeaways as bullet points
- Memory anchors (mnemonics or memorable phrases)

${mathSection}
${codingSection}

Also generate MODULE-LEVEL assessment and engagement content.

Return a JSON object with this EXACT structure:
{
  "module_title": "${moduleTitle}",
  "module_summary": "2-3 sentence overview",
  "course_type": "${courseType}",
  "lessons": [
    {
      "lesson_number": 1,
      "title": "Lesson Title",
      "estimated_minutes": 15,
      "hook": {
        "motivation": "Why this matters",
        "real_life_example": "A concrete scenario",
        "learning_promise": "After this lesson, you will..."
      },
      "concept": {
        "simple_explanation": "Explain like I'm 12",
        "deeper_explanation": "Formal explanation with terminology",
        "technical_notes": "Formulas, derivations, or advanced notes",
        "definitions": [
          {"term": "Term", "definition": "Clear definition"}
        ]
      },
      "visual": {
        "diagram_description": "Describe a helpful diagram",
        "analogy": "A memorable analogy",
        "worked_example": {
          "problem": "State the problem",
          "solution_steps": ["Step 1: ...", "Step 2: ..."],
          "answer": "Final answer with explanation"
        }
      },
      "practical": {
        "scenario": "Real-world application",
        "walkthrough": "Step-by-step how this applies"
      },
      "practice": {
        "task": "What the student should try",
        "hints": ["Hint 1", "Hint 2"],
        "expected_outcome": "What a correct solution looks like"
      },
      "recap": {
        "key_takeaways": ["t1", "t2", "t3", "t4"],
        "memory_anchors": ["memorable phrase"]
      }${courseType === "math" || courseType === "coding" ? `,
      "math": { ... }` : ""}${courseType === "coding" ? `,
      "coding": { ... }` : ""}
    }
  ],
  "assessment": {
    "concept_mcqs": [
      {"question": "Q", "options": ["A","B","C","D"], "correct_index": 0, "explanation": "Why"}
    ],
    "application_mcqs": [
      {"question": "Applied Q", "options": ["A","B","C","D"], "correct_index": 0, "explanation": "Why"}
    ],
    "challenge_problem": {
      "problem": "A harder problem integrating concepts",
      "hints": ["hint1"],
      "solution": "Detailed solution"
    },
    "project_task": "A mini-project related to this module"
  },
  "engagement": {
    "surprise_insight": "Something unexpected about this topic",
    "common_mistake": "A mistake most students make",
    "real_failure_example": "What goes wrong without this knowledge",
    "insider_tip": "Advice from industry professionals"
  }
}

Generate ${lessonTitles?.length || 3} lessons based on these titles: ${JSON.stringify(lessonTitles || [])}.
Generate 3 concept MCQs and 2 application MCQs.
${courseType === "math" ? "Include the 'math' field in EVERY lesson with full derivations and practice problems." : ""}
${courseType === "coding" ? "Include BOTH 'math' (if applicable) AND 'coding' fields in EVERY lesson with full runnable code, test cases, complexity analysis, and debugging insights." : ""}

IMPORTANT: Return ONLY the JSON object, no markdown fences.`
          },
          {
            role: "user",
            content: `Generate complete lesson content for Module ${moduleNumber}: "${moduleTitle}"
Course: ${courseName}
Class Level: ${classLevel}
Key Concepts: ${JSON.stringify(keyConcepts || [])}
Module Objectives: ${JSON.stringify(objectives || [])}
Course Type: ${courseType}

Make every lesson genuinely educational — a student should be able to master this topic from your content alone.
${courseType === "math" ? "\nFOR MATH: Show every single algebra step. Never skip steps. Explain WHY each transformation is done." : ""}
${courseType === "coding" ? "\nFOR CODING: Write complete, runnable code. Include variable trace simulation. Show debugging insights." : ""}`
          }
        ],
        max_tokens: 32000,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await response.text();
      console.error("AI lesson error:", status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "{}";
    
    let moduleContent;
    try {
      // Strip markdown fences and find the JSON object
      let cleaned = content.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
      
      // If JSON is truncated, try to repair it
      const firstBrace = cleaned.indexOf("{");
      if (firstBrace > 0) cleaned = cleaned.substring(firstBrace);
      
      try {
        moduleContent = JSON.parse(cleaned);
      } catch {
        // Try to fix truncated JSON by closing open braces/brackets
        let fixed = cleaned;
        const openBraces = (fixed.match(/{/g) || []).length;
        const closeBraces = (fixed.match(/}/g) || []).length;
        const openBrackets = (fixed.match(/\[/g) || []).length;
        const closeBrackets = (fixed.match(/]/g) || []).length;
        
        // Remove trailing comma or incomplete value
        fixed = fixed.replace(/,\s*$/, "");
        fixed = fixed.replace(/,\s*"[^"]*"?\s*$/, "");
        fixed = fixed.replace(/:\s*"[^"]*$/, ': ""');
        fixed = fixed.replace(/:\s*$/, ': null');
        
        for (let i = 0; i < openBrackets - closeBrackets; i++) fixed += "]";
        for (let i = 0; i < openBraces - closeBraces; i++) fixed += "}";
        
        moduleContent = JSON.parse(fixed);
      }
    } catch (parseErr) {
      console.error("Failed to parse lesson response:", content.substring(0, 500), "...", parseErr);
      return new Response(JSON.stringify({ error: "Failed to parse lesson content" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ moduleContent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-lesson error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
