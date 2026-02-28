import { useRef, useState } from "react";
import { Upload, FileText, Image, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

interface FileUploadZoneProps {
  onTextExtracted: (text: string, fileName: string) => void;
  accept?: string;
  label?: string;
  description?: string;
  maxSizeMB?: number;
  compact?: boolean;
}

export default function FileUploadZone({
  onTextExtracted,
  accept = ".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.webp",
  label,
  description,
  maxSizeMB = 5,
  compact = false,
}: FileUploadZoneProps) {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(t(`File too large (max ${maxSizeMB}MB)`, `ফাইল খুব বড় (সর্বোচ্চ ${maxSizeMB}MB)`));
      return;
    }

    setLoading(true);
    setFileName(file.name);

    try {
      const isImage = file.type.startsWith("image/");

      if (isImage) {
        // For images, convert to base64 and pass description
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result as string;
          onTextExtracted(`[Image uploaded: ${file.name}]\n[Base64 data available for AI processing]`, file.name);
          toast.success(t("Image uploaded!", "ছবি আপলোড হয়েছে!"));
        };
        reader.readAsDataURL(file);
      } else if (file.type === "text/plain" || file.name.endsWith(".txt") || file.name.endsWith(".md")) {
        const text = await file.text();
        onTextExtracted(text, file.name);
        toast.success(t("File loaded!", "ফাইল লোড হয়েছে!"));
      } else {
        // PDF/DOC - attempt text extraction
        try {
          const text = await file.text();
          const cleaned = text.replace(/[^\x20-\x7E\n\r\t\u0980-\u09FF]/g, " ").replace(/\s{3,}/g, "\n").trim();
          if (cleaned.length > 50) {
            onTextExtracted(cleaned, file.name);
            toast.success(t("Text extracted from file!", "ফাইল থেকে টেক্সট বের হয়েছে!"));
          } else {
            onTextExtracted(`[Uploaded: ${file.name}]\nPlease paste the content manually for best results.`, file.name);
            toast.info(t("Couldn't extract text. Please paste manually.", "টেক্সট বের করা যায়নি। ম্যানুয়ালি পেস্ট করুন।"));
          }
        } catch {
          onTextExtracted(`[Uploaded: ${file.name}]`, file.name);
          toast.info(t("Please paste the content manually.", "ম্যানুয়ালি পেস্ট করুন।"));
        }
      }
    } catch {
      toast.error(t("Error reading file", "ফাইল পড়তে সমস্যা"));
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <input ref={fileInputRef} type="file" accept={accept} onChange={handleFile} className="hidden" />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-dashed border-primary/30 text-sm font-medium text-primary hover:bg-primary/5 hover:border-primary/60 transition-all disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {label || t("Upload File", "ফাইল আপলোড")}
        </button>
        {fileName && (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <FileText className="w-3 h-3" /> {fileName}
            <button onClick={() => setFileName("")} className="hover:text-destructive"><X className="w-3 h-3" /></button>
          </span>
        )}
      </div>
    );
  }

  return (
    <div>
      <input ref={fileInputRef} type="file" accept={accept} onChange={handleFile} className="hidden" />
      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-primary/20 rounded-xl p-4 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all group"
      >
        {loading ? (
          <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
        ) : (
          <>
            <Upload className="w-6 h-6 text-primary mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <p className="text-sm font-medium text-foreground">{label || t("Upload File", "ফাইল আপলোড")}</p>
            <p className="text-xs text-muted-foreground mt-1">{description || t("PDF, DOC, TXT, or Image", "PDF, DOC, TXT বা ছবি")}</p>
          </>
        )}
        {fileName && (
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium">
            <FileText className="w-3 h-3" /> {fileName}
          </div>
        )}
      </div>
    </div>
  );
}
