import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  BorderStyle, TableRow, TableCell, Table, WidthType, ShadingType,
} from "docx";
import { saveAs } from "file-saver";
import { ResumeData } from "./resumeTypes";

export async function exportPDF(elementId: string, fileName: string) {
  const el = document.getElementById(elementId);
  if (!el) return;

  const canvas = await html2canvas(el, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
  });

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF("p", "mm", "a4");
  const pdfW = pdf.internal.pageSize.getWidth();
  const pdfH = pdf.internal.pageSize.getHeight();
  const imgW = canvas.width;
  const imgH = canvas.height;
  const ratio = Math.min(pdfW / imgW, pdfH / imgH);
  const w = imgW * ratio;
  const h = imgH * ratio;
  const x = (pdfW - w) / 2;

  pdf.addImage(imgData, "PNG", x, 0, w, h);
  pdf.save(`${fileName}.pdf`);
}

export async function exportDOCX(data: ResumeData, fileName: string) {
  const sections: Paragraph[] = [];

  // Name
  sections.push(
    new Paragraph({
      children: [new TextRun({ text: data.personalInfo.fullName || "Your Name", bold: true, size: 36, font: "Calibri" })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
    })
  );

  // Contact line
  const contactParts = [data.personalInfo.email, data.personalInfo.phone, data.personalInfo.linkedin, data.personalInfo.address].filter(Boolean);
  if (contactParts.length) {
    sections.push(
      new Paragraph({
        children: [new TextRun({ text: contactParts.join("  |  "), size: 18, font: "Calibri", color: "666666" })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      })
    );
  }

  const sectionHeader = (title: string) =>
    new Paragraph({
      children: [new TextRun({ text: title.toUpperCase(), bold: true, size: 22, font: "Calibri", color: "2B6CB0" })],
      spacing: { before: 300, after: 100 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: "2B6CB0" } },
    });

  // Objective
  if (data.objective) {
    sections.push(sectionHeader("Career Objective"));
    sections.push(new Paragraph({ children: [new TextRun({ text: data.objective, size: 20, font: "Calibri" })], spacing: { after: 100 } }));
  }

  // Education
  if (data.education.length) {
    sections.push(sectionHeader("Education"));
    data.education.forEach(ed => {
      sections.push(new Paragraph({
        children: [
          new TextRun({ text: ed.degree, bold: true, size: 20, font: "Calibri" }),
          new TextRun({ text: `  —  ${ed.institution}`, size: 20, font: "Calibri" }),
          new TextRun({ text: `  (${ed.year})`, size: 18, font: "Calibri", color: "888888" }),
        ],
        spacing: { after: 40 },
      }));
      if (ed.cgpa) {
        sections.push(new Paragraph({ children: [new TextRun({ text: `CGPA: ${ed.cgpa}`, size: 18, font: "Calibri", italics: true })], spacing: { after: 80 } }));
      }
    });
  }

  // Skills
  if (data.skills.length) {
    sections.push(sectionHeader("Skills"));
    sections.push(new Paragraph({ children: [new TextRun({ text: data.skills.join("  •  "), size: 20, font: "Calibri" })], spacing: { after: 100 } }));
  }

  // Experience
  if (data.experience.length) {
    sections.push(sectionHeader("Work Experience"));
    data.experience.forEach(exp => {
      sections.push(new Paragraph({
        children: [
          new TextRun({ text: exp.title, bold: true, size: 20, font: "Calibri" }),
          new TextRun({ text: `  at  ${exp.company}`, size: 20, font: "Calibri" }),
          new TextRun({ text: `  (${exp.duration})`, size: 18, font: "Calibri", color: "888888" }),
        ],
        spacing: { after: 40 },
      }));
      exp.bullets.filter(b => b.trim()).forEach(b => {
        sections.push(new Paragraph({ children: [new TextRun({ text: b, size: 20, font: "Calibri" })], bullet: { level: 0 }, spacing: { after: 20 } }));
      });
    });
  }

  // Projects
  if (data.projects.length) {
    sections.push(sectionHeader("Projects"));
    data.projects.forEach(p => {
      sections.push(new Paragraph({
        children: [
          new TextRun({ text: p.title, bold: true, size: 20, font: "Calibri" }),
          ...(p.tools ? [new TextRun({ text: `  (${p.tools})`, size: 18, font: "Calibri", color: "888888" })] : []),
        ],
        spacing: { after: 40 },
      }));
      if (p.description) {
        sections.push(new Paragraph({ children: [new TextRun({ text: p.description, size: 20, font: "Calibri" })], spacing: { after: 20 } }));
      }
      p.bullets.filter(b => b.trim()).forEach(b => {
        sections.push(new Paragraph({ children: [new TextRun({ text: b, size: 20, font: "Calibri" })], bullet: { level: 0 }, spacing: { after: 20 } }));
      });
    });
  }

  // Certifications
  if (data.certifications.length) {
    sections.push(sectionHeader("Certifications"));
    data.certifications.forEach(c => {
      sections.push(new Paragraph({
        children: [
          new TextRun({ text: c.name, bold: true, size: 20, font: "Calibri" }),
          new TextRun({ text: ` — ${c.issuer} (${c.year})`, size: 18, font: "Calibri", color: "888888" }),
        ],
        spacing: { after: 40 },
      }));
    });
  }

  // Achievements
  const achievements = data.achievements.filter(a => a.trim());
  if (achievements.length) {
    sections.push(sectionHeader("Achievements"));
    achievements.forEach(a => {
      sections.push(new Paragraph({ children: [new TextRun({ text: a, size: 20, font: "Calibri" })], bullet: { level: 0 }, spacing: { after: 20 } }));
    });
  }

  // Languages
  const langs = data.languages.filter(l => l.trim());
  if (langs.length) {
    sections.push(sectionHeader("Languages"));
    sections.push(new Paragraph({ children: [new TextRun({ text: langs.join(", "), size: 20, font: "Calibri" })], spacing: { after: 100 } }));
  }

  const doc = new Document({
    sections: [{ children: sections }],
    styles: {
      default: {
        document: { run: { font: "Calibri", size: 20 } },
      },
    },
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${fileName}.docx`);
}
