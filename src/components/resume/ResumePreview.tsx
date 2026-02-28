import { useLanguage } from "@/contexts/LanguageContext";
import { ResumeData, TEMPLATES, TemplateId } from "./resumeTypes";
import { Mail, Phone, Linkedin, Globe, MapPin } from "lucide-react";

export default function ResumePreview({ data, templateId }: { data: ResumeData; templateId: TemplateId }) {
  const { t } = useLanguage();
  const tpl = TEMPLATES.find(t => t.id === templateId) || TEMPLATES[0];
  const accent = tpl.accentColor;
  const pi = data.personalInfo;

  const SectionTitle = ({ children }: { children: string }) => (
    <div className="mt-5 mb-2">
      <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] pb-1"
        style={{ color: accent, borderBottom: `2px solid ${accent}` }}>{children}</h3>
    </div>
  );

  const hasContent = (arr: string[]) => arr.some(a => a.trim());

  return (
    <div id="resume-preview" className="bg-white text-gray-900 shadow-2xl"
      style={{ fontFamily: tpl.fontFamily, fontSize: "10.5px", lineHeight: "1.55", minHeight: "1056px", width: "816px", padding: 0 }}>
      
      {/* Header - Professional */}
      <div style={{ background: accent, padding: "28px 40px 22px" }}>
        <h1 className="text-white font-bold" style={{ fontSize: "26px", letterSpacing: "0.02em", margin: 0 }}>
          {pi.fullName || t("Your Name", "আপনার নাম")}
        </h1>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
          {pi.email && (
            <span className="flex items-center gap-1 text-white/90" style={{ fontSize: "9.5px" }}>
              <Mail size={10} /> {pi.email}
            </span>
          )}
          {pi.phone && (
            <span className="flex items-center gap-1 text-white/90" style={{ fontSize: "9.5px" }}>
              <Phone size={10} /> {pi.phone}
            </span>
          )}
          {pi.linkedin && (
            <span className="flex items-center gap-1 text-white/90" style={{ fontSize: "9.5px" }}>
              <Linkedin size={10} /> {pi.linkedin}
            </span>
          )}
          {pi.portfolio && (
            <span className="flex items-center gap-1 text-white/90" style={{ fontSize: "9.5px" }}>
              <Globe size={10} /> {pi.portfolio}
            </span>
          )}
          {pi.address && (
            <span className="flex items-center gap-1 text-white/90" style={{ fontSize: "9.5px" }}>
              <MapPin size={10} /> {pi.address}
            </span>
          )}
        </div>
      </div>

      <div style={{ padding: "20px 40px 30px" }}>
        {/* Objective */}
        {data.objective && (
          <>
            <SectionTitle>{t("Professional Summary", "পেশাদার সারসংক্ষেপ")}</SectionTitle>
            <p className="text-gray-700" style={{ fontSize: "10.5px" }}>{data.objective}</p>
          </>
        )}

        {/* Experience */}
        {data.experience.length > 0 && (
          <>
            <SectionTitle>{t("Work Experience", "কাজের অভিজ্ঞতা")}</SectionTitle>
            {data.experience.map(exp => (
              <div key={exp.id} className="mb-3">
                <div className="flex justify-between items-baseline">
                  <span className="font-bold text-gray-900" style={{ fontSize: "11px" }}>{exp.title}</span>
                  <span className="text-gray-500 italic" style={{ fontSize: "9.5px" }}>{exp.duration}</span>
                </div>
                <div className="text-gray-600 italic" style={{ fontSize: "10px" }}>{exp.company}</div>
                {exp.bullets.filter(b => b.trim()).length > 0 && (
                  <ul className="mt-1 space-y-0.5" style={{ paddingLeft: "16px", listStyleType: "disc" }}>
                    {exp.bullets.filter(b => b.trim()).map((b, i) => (
                      <li key={i} className="text-gray-700" style={{ fontSize: "10px" }}>{b}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </>
        )}

        {/* Education */}
        {data.education.length > 0 && (
          <>
            <SectionTitle>{t("Education", "শিক্ষা")}</SectionTitle>
            {data.education.map(ed => (
              <div key={ed.id} className="mb-2">
                <div className="flex justify-between items-baseline">
                  <span className="font-bold text-gray-900" style={{ fontSize: "11px" }}>{ed.degree}</span>
                  <span className="text-gray-500" style={{ fontSize: "9.5px" }}>{ed.year}</span>
                </div>
                <div className="text-gray-600" style={{ fontSize: "10px" }}>
                  {ed.institution}{ed.cgpa && ` — CGPA: ${ed.cgpa}`}
                </div>
                {ed.details && <p className="text-gray-500 mt-0.5" style={{ fontSize: "9.5px" }}>{ed.details}</p>}
              </div>
            ))}
          </>
        )}

        {/* Skills */}
        {data.skills.length > 0 && (
          <>
            <SectionTitle>{t("Skills", "দক্ষতা")}</SectionTitle>
            <div className="flex flex-wrap gap-1.5">
              {data.skills.map((s, i) => (
                <span key={i} className="px-2.5 py-0.5 rounded font-medium"
                  style={{ fontSize: "9.5px", background: accent + "15", color: accent, border: `1px solid ${accent}30` }}>{s}</span>
              ))}
            </div>
          </>
        )}

        {/* Projects */}
        {data.projects.length > 0 && (
          <>
            <SectionTitle>{t("Projects", "প্রজেক্ট")}</SectionTitle>
            {data.projects.map(p => (
              <div key={p.id} className="mb-3">
                <div className="flex items-baseline gap-2">
                  <span className="font-bold text-gray-900" style={{ fontSize: "11px" }}>{p.title}</span>
                  {p.tools && <span className="text-gray-500" style={{ fontSize: "9px" }}>({p.tools})</span>}
                </div>
                {p.description && <p className="text-gray-700 mt-0.5" style={{ fontSize: "10px" }}>{p.description}</p>}
                {p.bullets.filter(b => b.trim()).length > 0 && (
                  <ul className="mt-1 space-y-0.5" style={{ paddingLeft: "16px", listStyleType: "disc" }}>
                    {p.bullets.filter(b => b.trim()).map((b, i) => (
                      <li key={i} className="text-gray-700" style={{ fontSize: "10px" }}>{b}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </>
        )}

        {/* Certifications */}
        {data.certifications.length > 0 && (
          <>
            <SectionTitle>{t("Certifications", "সার্টিফিকেশন")}</SectionTitle>
            {data.certifications.map(c => (
              <div key={c.id} className="flex justify-between mb-1" style={{ fontSize: "10px" }}>
                <span><span className="font-semibold text-gray-900">{c.name}</span> — <span className="text-gray-500">{c.issuer}</span></span>
                <span className="text-gray-500">{c.year}</span>
              </div>
            ))}
          </>
        )}

        {/* Achievements */}
        {hasContent(data.achievements) && (
          <>
            <SectionTitle>{t("Achievements", "অর্জন")}</SectionTitle>
            <ul style={{ paddingLeft: "16px", listStyleType: "disc" }}>
              {data.achievements.filter(a => a.trim()).map((a, i) => (
                <li key={i} className="text-gray-700 mb-0.5" style={{ fontSize: "10px" }}>{a}</li>
              ))}
            </ul>
          </>
        )}

        {/* Extracurricular */}
        {hasContent(data.extracurricular) && (
          <>
            <SectionTitle>{t("Extracurricular Activities", "সহ-পাঠ্যক্রমিক")}</SectionTitle>
            <ul style={{ paddingLeft: "16px", listStyleType: "disc" }}>
              {data.extracurricular.filter(a => a.trim()).map((a, i) => (
                <li key={i} className="text-gray-700 mb-0.5" style={{ fontSize: "10px" }}>{a}</li>
              ))}
            </ul>
          </>
        )}

        {/* Languages */}
        {hasContent(data.languages) && (
          <>
            <SectionTitle>{t("Languages", "ভাষা")}</SectionTitle>
            <p className="text-gray-700" style={{ fontSize: "10px" }}>{data.languages.filter(l => l.trim()).join("  •  ")}</p>
          </>
        )}
      </div>
    </div>
  );
}
