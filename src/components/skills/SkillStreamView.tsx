import { useState, useCallback } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface Props {
  action: string;
  data: Record<string, string | boolean>;
  autoLoad?: boolean;
}

const SkillStreamView = ({ action, data, autoLoad = true }: Props) => {
  const { lang } = useLanguage();
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);

  const stream = useCallback(async () => {
    if (started) return;
    setStarted(true);
    setLoading(true);

    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/skill-mentor`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ action, data, language: lang }),
        }
      );

      if (!resp.ok || !resp.body) throw new Error("Stream failed");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let idx: number;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") break;
          try {
            const parsed = JSON.parse(json);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullText += content;
              setResult(fullText);
            }
          } catch {}
        }
      }
    } catch (e) {
      console.error(e);
      setResult("Error loading results. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [action, data, lang, started]);

  if (autoLoad && !started) {
    stream();
  }

  return (
    <Card className="border-border">
      <CardContent className="pt-6">
        {loading && !result ? (
          <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            AI বিশ্লেষণ করছে...
          </div>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown>{result}</ReactMarkdown>
            {loading && <span className="inline-block w-2 h-4 bg-primary animate-pulse rounded-sm ml-1" />}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SkillStreamView;
