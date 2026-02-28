import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Send, Loader2, Bot, User, ImagePlus, FileText, X } from "lucide-react";
import HistoryDrawer from "@/components/history/HistoryDrawer";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

type Msg = { role: "user" | "assistant"; content: string | any[]; displayContent?: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/doubt-solver`;

const DoubtSolver = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const topic = searchParams.get("topic");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState(topic ? `Explain "${topic}" in detail` : "");
  const [isLoading, setIsLoading] = useState(false);
  const [attachedFile, setAttachedFile] = useState<{ name: string; type: string; base64: string; preview?: string } | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Max 5MB
    if (file.size > 5 * 1024 * 1024) {
      alert(t("File too large. Max 5MB.", "ফাইল খুব বড়। সর্বোচ্চ ৫MB।"));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      const preview = file.type.startsWith("image/") ? reader.result as string : undefined;
      setAttachedFile({ name: file.name, type: file.type, base64, preview });
    };
    reader.readAsDataURL(file);
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeAttachment = () => setAttachedFile(null);

  const send = async () => {
    if ((!input.trim() && !attachedFile) || isLoading) return;
    if (!user) {
      toast.error(t("Please sign up first to use Doubt Solver", "ডাউট সলভার ব্যবহার করতে আগে সাইন আপ করুন"));
      navigate("/auth");
      return;
    }

    // Build user message content
    let messageContent: any;
    let displayContent = input.trim();

    if (attachedFile) {
      const parts: any[] = [];
      if (input.trim()) {
        parts.push({ type: "text", text: input.trim() });
      } else {
        parts.push({ type: "text", text: t("Please analyze this file and explain.", "এই ফাইলটি বিশ্লেষণ করো এবং ব্যাখ্যা করো।") });
      }
      
      const mediaType = attachedFile.type.startsWith("image/") ? attachedFile.type : 
        attachedFile.type === "application/pdf" ? "application/pdf" : attachedFile.type;
      
      parts.push({
        type: "image_url",
        image_url: { url: `data:${mediaType};base64,${attachedFile.base64}` }
      });

      messageContent = parts;
      displayContent = `${displayContent || ""} 📎 ${attachedFile.name}`.trim();
    } else {
      messageContent = input.trim();
    }

    const userMsg: Msg = { role: "user", content: messageContent, displayContent };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setAttachedFile(null);
    setIsLoading(true);

    let assistantSoFar = "";
    const allMessages = [...messages, userMsg].map(m => ({
      role: m.role,
      content: m.content
    }));

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: allMessages }),
      });

      if (!resp.ok || !resp.body) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to connect to AI");
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantSoFar += content;
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar, displayContent: assistantSoFar } : m));
                }
                return [...prev, { role: "assistant", content: assistantSoFar, displayContent: assistantSoFar }];
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch (e: any) {
      setMessages((prev) => [...prev, { role: "assistant", content: `❌ ${e.message}`, displayContent: `❌ ${e.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-save session after each exchange
  const sessionIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!user || messages.length < 2) return;
    const saveSession = async () => {
      const title = typeof messages[0]?.content === "string" ? messages[0].content.slice(0, 80) : "Doubt Session";
      const saveMsgs = messages.map(m => ({ role: m.role, content: m.displayContent || (typeof m.content === "string" ? m.content : "📎 File") }));
      if (sessionIdRef.current) {
        await supabase.from("doubt_sessions").update({ messages: saveMsgs as any, title }).eq("id", sessionIdRef.current);
      } else {
        const { data } = await supabase.from("doubt_sessions").insert({ user_id: user.id, title, messages: saveMsgs as any }).select("id").single();
        if (data) sessionIdRef.current = data.id;
      }
    };
    saveSession();
  }, [messages, user]);

  const getDisplayText = (msg: Msg): string => {
    if (msg.displayContent) return msg.displayContent;
    if (typeof msg.content === "string") return msg.content;
    // For multipart content, extract text
    return (msg.content as any[]).filter(p => p.type === "text").map(p => p.text).join(" ");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] md:h-screen">
      <div className="flex items-center justify-between px-4 pt-3 pb-1 max-w-3xl mx-auto w-full">
        <h2 className="text-lg font-bold text-foreground">{t("Doubt Solver", "সন্দেহ সমাধান")}</h2>
        <HistoryDrawer
          config={{
            table: "doubt_sessions",
            titleField: "title",
            pageTitle: t("Chat Sessions", "চ্যাট সেশন"),
            icon: "💬",
            dateField: "updated_at",
          }}
          onSelect={(item) => {
            const msgs = (item.messages || []).map((m: any) => ({ role: m.role, content: m.content, displayContent: m.content }));
            setMessages(msgs);
            sessionIdRef.current = item.id;
          }}
        />
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-3xl mx-auto w-full">
        {messages.length === 0 && (
          <div className="text-center py-16">
            <Bot className="w-16 h-16 text-primary mx-auto mb-4 animate-pulse-glow rounded-full p-3" />
            <h2 className="text-xl font-bold text-foreground mb-2">{t("Ask me anything!", "আমাকে যেকোনো কিছু জিজ্ঞেস করো!")}</h2>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              {t(
                "I can explain concepts, solve problems, and even analyze images & PDFs! Upload a photo of your question or textbook page.",
                "আমি ধারণা ব্যাখ্যা করতে, সমস্যা সমাধান করতে, এবং ছবি ও PDF বিশ্লেষণ করতে পারি! তোমার প্রশ্ন বা পাঠ্যবইয়ের পৃষ্ঠার ছবি আপলোড করো।"
              )}
            </p>
            <div className="flex flex-wrap gap-2 justify-center mt-6">
              {[
                t("Solve: 2x + 5 = 15", "সমাধান করো: 2x + 5 = 15"),
                t("What is photosynthesis?", "সালোকসংশ্লেষণ কী?"),
                t("📷 Upload a question photo", "📷 প্রশ্নের ছবি আপলোড করো"),
              ].map((q, i) => (
                <button key={q} onClick={() => {
                  if (i === 2) {
                    fileInputRef.current?.click();
                  } else {
                    setInput(q);
                  }
                }} className="px-3 py-1.5 rounded-full bg-accent text-accent-foreground text-sm hover:bg-primary hover:text-primary-foreground transition-colors">
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
            {msg.role === "assistant" && (
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-primary-foreground" />
              </div>
            )}
            <div className={`max-w-[80%] p-4 rounded-xl text-sm leading-relaxed ${
              msg.role === "user"
                ? "bg-primary text-primary-foreground rounded-tr-sm"
                : "card-gradient border border-border text-foreground rounded-tl-sm"
            }`}>
              {msg.role === "assistant" ? (
                <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-headings:my-2">
                  <ReactMarkdown>{getDisplayText(msg)}</ReactMarkdown>
                </div>
              ) : (
                <span className="whitespace-pre-wrap">{getDisplayText(msg)}</span>
              )}
            </div>
            {msg.role === "user" && (
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-secondary-foreground" />
              </div>
            )}
          </div>
        ))}

        {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <Bot className="w-4 h-4 text-primary-foreground" />
            </div>
            <div className="card-gradient border border-border rounded-xl p-4 rounded-tl-sm">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Attachment preview */}
      {attachedFile && (
        <div className="border-t border-border bg-muted/50 px-4 py-2">
          <div className="max-w-3xl mx-auto flex items-center gap-3">
            {attachedFile.preview ? (
              <img src={attachedFile.preview} alt="Preview" className="w-12 h-12 rounded-lg object-cover border border-border" />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center border border-border">
                <FileText className="w-5 h-5 text-primary" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{attachedFile.name}</p>
              <p className="text-xs text-muted-foreground">{t("Ready to send", "পাঠানোর জন্য প্রস্তুত")}</p>
            </div>
            <button onClick={removeAttachment} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="border-t border-border bg-background p-4">
        <div className="max-w-3xl mx-auto flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={handleFileSelect}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-3 rounded-xl bg-card border border-input text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            title={t("Upload image or PDF", "ছবি বা PDF আপলোড করো")}
          >
            <ImagePlus className="w-5 h-5" />
          </button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
            placeholder={t("Ask your doubt or upload an image...", "তোমার প্রশ্ন জিজ্ঞেস করো বা ছবি আপলোড করো...")}
            className="flex-1 px-4 py-3 rounded-xl bg-card border border-input text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring outline-none"
            disabled={isLoading}
          />
          <button
            onClick={send}
            disabled={isLoading || (!input.trim() && !attachedFile)}
            className="px-4 py-3 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DoubtSolver;
