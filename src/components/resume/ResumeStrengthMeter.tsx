import { useLanguage } from "@/contexts/LanguageContext";
import { ResumeData, StrengthMeter } from "./resumeTypes";

function calcStrength(data: ResumeData): StrengthMeter {
  const obj = data.objective.length > 40 ? "strong" : data.objective.length > 10 ? "improve" : "weak";
  const sk = data.skills.length >= 5 ? "strong" : data.skills.length >= 2 ? "improve" : "weak";
  const exp = data.experience.length >= 1 && data.experience.some(e => e.bullets.length >= 2)
    ? "strong" : data.experience.length >= 1 ? "improve" : "weak";
  const edu = data.education.length >= 1 ? "strong" : "weak";

  const scores = { strong: 3, improve: 2, weak: 1 };
  const avg = (scores[obj] + scores[sk] + scores[exp] + scores[edu]) / 4;
  const overall = avg >= 2.5 ? "strong" : avg >= 1.5 ? "improve" : "weak";

  return { objective: obj, skills: sk, experience: exp, education: edu, overall };
}

const icons = { strong: "🟢", improve: "🟡", weak: "🔴" };
const labels_en = { strong: "Strong", improve: "Needs Work", weak: "Weak" };
const labels_bn = { strong: "শক্তিশালী", improve: "উন্নতি দরকার", weak: "দুর্বল" };

export default function ResumeStrengthMeter({ data }: { data: ResumeData }) {
  const { t } = useLanguage();
  const meter = calcStrength(data);

  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted text-xs font-medium text-foreground">
      <span>{icons[meter.overall]}</span>
      <span>{t(labels_en[meter.overall], labels_bn[meter.overall])}</span>
    </div>
  );
}
