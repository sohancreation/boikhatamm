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
    const contentType = req.headers.get("content-type") || "";

    // ── TTS: Use an AI provider to generate spoken text, then return as speech via browser SpeechSynthesis ──
    // Since OpenRouter/OpenAI may not expose a native TTS endpoint, we return the text for client-side SpeechSynthesis
    // OR we try OpenAI TTS with graceful fallback
    if (contentType.includes("application/json")) {
      const { action, text, voice } = await req.json();

      if (action === "tts") {
        // Try OpenAI TTS first
        const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
        if (OPENAI_API_KEY) {
          try {
            const ttsResponse = await fetch("https://api.openai.com/v1/audio/speech", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${OPENAI_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: "tts-1",
                input: text,
                voice: voice || "nova",
                response_format: "mp3",
              }),
            });

            if (ttsResponse.ok) {
              const audioBuffer = await ttsResponse.arrayBuffer();
              return new Response(audioBuffer, {
                headers: { ...corsHeaders, "Content-Type": "audio/mpeg" },
              });
            }

            const errText = await ttsResponse.text();
            console.error("OpenAI TTS error:", ttsResponse.status, errText);
          } catch (e) {
            console.error("OpenAI TTS exception:", e);
          }
        }

        // Fallback: return text for client-side Web Speech API
        return new Response(JSON.stringify({ fallback: "speech_synthesis", text }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "Invalid action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── STT: speech-to-text (Whisper) ──
    if (contentType.includes("multipart/form-data")) {
      const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

      const formData = await req.formData();
      const audioFile = formData.get("audio") as File;
      if (!audioFile) throw new Error("No audio file provided");

      // Try OpenAI Whisper
      if (OPENAI_API_KEY) {
        try {
          const whisperForm = new FormData();
          whisperForm.append("file", audioFile, "audio.webm");
          whisperForm.append("model", "whisper-1");
          whisperForm.append("language", "en");

          const sttResponse = await fetch("https://api.openai.com/v1/audio/transcriptions", {
            method: "POST",
            headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
            body: whisperForm,
          });

          if (sttResponse.ok) {
            const result = await sttResponse.json();
            return new Response(JSON.stringify({ text: result.text }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }

          const errText = await sttResponse.text();
          console.error("Whisper error:", sttResponse.status, errText);
        } catch (e) {
          console.error("Whisper exception:", e);
        }
      }

      // Fallback: tell client to use browser SpeechRecognition
      return new Response(JSON.stringify({ fallback: "speech_recognition", text: "" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unsupported content type" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ielts-voice error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
