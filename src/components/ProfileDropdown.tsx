import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { User, Edit3, LogOut, Camera, X, Loader2, Save, ChevronRight, Check, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useUserItems } from "@/hooks/useUserItems";

const CLASS_OPTIONS = [
  { value: "6", en: "Class 6", bn: "৬ষ্ঠ শ্রেণি" },
  { value: "7", en: "Class 7", bn: "৭ম শ্রেণি" },
  { value: "8", en: "Class 8", bn: "৮ম শ্রেণি" },
  { value: "9", en: "Class 9", bn: "৯ম শ্রেণি" },
  { value: "10", en: "Class 10", bn: "১০ম শ্রেণি" },
  { value: "HSC", en: "HSC", bn: "এইচএসসি" },
  { value: "University", en: "University", bn: "বিশ্ববিদ্যালয়" },
  { value: "Job Candidate", en: "Job Candidate 💼", bn: "চাকরি প্রার্থী 💼" },
];

const SUBJECT_GROUP_OPTIONS = [
  { value: "Science", en: "Science", bn: "বিজ্ঞান" },
  { value: "Arts", en: "Arts", bn: "মানবিক" },
  { value: "Commerce", en: "Commerce", bn: "ব্যবসায় শিক্ষা" },
];

const BOARD_OPTIONS = [
  { value: "Dhaka", en: "Dhaka", bn: "ঢাকা" },
  { value: "Rajshahi", en: "Rajshahi", bn: "রাজশাহী" },
  { value: "Chittagong", en: "Chittagong", bn: "চট্টগ্রাম" },
  { value: "Comilla", en: "Comilla", bn: "কুমিল্লা" },
  { value: "Jessore", en: "Jessore", bn: "যশোর" },
  { value: "Sylhet", en: "Sylhet", bn: "সিলেট" },
  { value: "Dinajpur", en: "Dinajpur", bn: "দিনাজপুর" },
  { value: "Barishal", en: "Barishal", bn: "বরিশাল" },
  { value: "Mymensingh", en: "Mymensingh", bn: "ময়মনসিংহ" },
  { value: "Madrasa", en: "Madrasa", bn: "মাদ্রাসা" },
  { value: "Technical", en: "Technical", bn: "কারিগরি" },
  { value: "English Medium", en: "English Medium", bn: "ইংরেজি মাধ্যম" },
];

const CAREER_OPTIONS = [
  { value: "Engineer", en: "Engineer", bn: "ইঞ্জিনিয়ার" },
  { value: "Doctor", en: "Doctor", bn: "ডাক্তার" },
  { value: "Software Developer", en: "Software Developer", bn: "সফটওয়্যার ডেভেলপার" },
  { value: "Freelancer", en: "Freelancer", bn: "ফ্রিল্যান্সার" },
  { value: "Teacher", en: "Teacher", bn: "শিক্ষক" },
  { value: "Business", en: "Business", bn: "ব্যবসা" },
  { value: "Government Job", en: "Government Job", bn: "সরকারি চাকরি" },
  { value: "Not Sure", en: "Not Sure", bn: "নিশ্চিত নই" },
];

const DEPARTMENT_OPTIONS = [
  { value: "CSE", en: "CSE / Computer Science", bn: "সিএসই / কম্পিউটার সায়েন্স" },
  { value: "EEE", en: "EEE / Electrical Engineering", bn: "ইইই / ইলেকট্রিক্যাল ইঞ্জিনিয়ারিং" },
  { value: "ME", en: "ME / Mechanical Engineering", bn: "এমই / মেকানিক্যাল ইঞ্জিনিয়ারিং" },
  { value: "CE", en: "CE / Civil Engineering", bn: "সিই / সিভিল ইঞ্জিনিয়ারিং" },
  { value: "BBA", en: "BBA / Business Administration", bn: "বিবিএ / ব্যবসায় প্রশাসন" },
  { value: "Economics", en: "Economics", bn: "অর্থনীতি" },
  { value: "English", en: "English", bn: "ইংরেজি" },
  { value: "Mathematics", en: "Mathematics", bn: "গণিত" },
  { value: "Physics", en: "Physics", bn: "পদার্থবিজ্ঞান" },
  { value: "Chemistry", en: "Chemistry", bn: "রসায়ন" },
  { value: "Pharmacy", en: "Pharmacy", bn: "ফার্মেসি" },
  { value: "Law", en: "Law", bn: "আইন" },
  { value: "Marketing", en: "Marketing", bn: "মার্কেটিং" },
  { value: "Finance", en: "Finance & Banking", bn: "ফিন্যান্স ও ব্যাংকিং" },
  { value: "Accounting", en: "Accounting", bn: "হিসাববিজ্ঞান" },
  { value: "Other", en: "Other", bn: "অন্যান্য" },
];

const GOVT_JOB_TYPES = [
  { value: "BCS", en: "BCS", bn: "বিসিএস" },
  { value: "Bank", en: "Bank", bn: "ব্যাংক" },
  { value: "Primary Teacher", en: "Primary Teacher", bn: "প্রাথমিক শিক্ষক" },
  { value: "NTRCA", en: "NTRCA", bn: "এনটিআরসিএ" },
  { value: "Police", en: "Police", bn: "পুলিশ" },
  { value: "Defense", en: "Defense", bn: "প্রতিরক্ষা" },
  { value: "Other Govt", en: "Other Govt", bn: "অন্যান্য সরকারি" },
];

const PRIVATE_INDUSTRY_OPTIONS = [
  { value: "Software & IT", en: "Software & IT", bn: "সফটওয়্যার ও আইটি" },
  { value: "Banking & Finance", en: "Banking & Finance", bn: "ব্যাংকিং ও ফিন্যান্স" },
  { value: "Telecommunications", en: "Telecommunications", bn: "টেলিকমিউনিকেশন" },
  { value: "FMCG", en: "FMCG", bn: "এফএমসিজি" },
  { value: "Pharmaceuticals", en: "Pharmaceuticals", bn: "ফার্মাসিউটিক্যালস" },
  { value: "E-commerce", en: "E-commerce", bn: "ই-কমার্স" },
  { value: "Other", en: "Other", bn: "অন্যান্য" },
];

const PRIVATE_ROLE_OPTIONS = [
  { value: "Software Engineer", en: "Software Engineer", bn: "সফটওয়্যার ইঞ্জিনিয়ার" },
  { value: "Marketing Executive", en: "Marketing Executive", bn: "মার্কেটিং এক্সিকিউটিভ" },
  { value: "HR Officer", en: "HR Officer", bn: "এইচআর অফিসার" },
  { value: "Accountant", en: "Accountant", bn: "হিসাবরক্ষক" },
  { value: "Data Analyst", en: "Data Analyst", bn: "ডাটা অ্যানালিস্ট" },
  { value: "Project Manager", en: "Project Manager", bn: "প্রজেক্ট ম্যানেজার" },
  { value: "Other", en: "Other", bn: "অন্যান্য" },
];

const extractFromInterests = (interests: string[] | null | undefined) => {
  if (!interests) return { subjectGroup: "", department: "", university: "", isIelts: false, ieltsTargetBand: "" };
  const groups = ["Science", "Arts", "Commerce"];
  const depts = DEPARTMENT_OPTIONS.map(d => d.value);
  let subjectGroup = "";
  let department = "";
  let university = "";
  let isIelts = false;
  let ieltsTargetBand = "";
  interests.forEach(i => {
    if (groups.includes(i)) subjectGroup = i;
    else if (depts.includes(i)) department = i;
    else if (i.startsWith("University:")) university = i.replace("University:", "");
    else if (i === "IELTS") isIelts = true;
    else if (i.startsWith("IELTSBand:")) ieltsTargetBand = i.replace("IELTSBand:", "");
  });
  return { subjectGroup, department, university, isIelts, ieltsTargetBand };
};

// Inline editable field component
const EditableField = ({
  label, value, displayValue, editing, onEdit, onSave, onCancel, children, saving
}: {
  label: string; value: string; displayValue?: string; editing: boolean;
  onEdit: () => void; onSave: () => void; onCancel: () => void;
  children: React.ReactNode; saving?: boolean;
}) => (
  <div className="flex items-start justify-between gap-2 py-1.5">
    <div className="flex-1 min-w-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      {editing ? (
        <div className="mt-1 flex items-center gap-1.5">
          <div className="flex-1">{children}</div>
          <button onClick={onSave} disabled={saving} className="p-1.5 rounded-md bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
          </button>
          <button onClick={onCancel} className="p-1.5 rounded-md hover:bg-accent text-muted-foreground">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <p className="text-sm font-medium text-foreground truncate">{displayValue || value || "—"}</p>
      )}
    </div>
    {!editing && (
      <button onClick={onEdit} className="p-1 rounded-md hover:bg-accent text-muted-foreground hover:text-primary transition-colors mt-1 flex-shrink-0">
        <Pencil className="w-3.5 h-3.5" />
      </button>
    )}
  </div>
);

const ProfileDropdown = () => {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { frameClass } = useUserItems();
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [savingField, setSavingField] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);

  // Temp edit values
  const [editName, setEditName] = useState("");
  const [editMobile, setEditMobile] = useState("");
  const [editGoals, setEditGoals] = useState("");
  const [editClass, setEditClass] = useState("");
  const [editBoard, setEditBoard] = useState("");
  const [editSubjectGroup, setEditSubjectGroup] = useState("");
  const [editLang, setEditLang] = useState("bn");
  const [editIsJobCandidate, setEditIsJobCandidate] = useState(false);
  const [editJobSector, setEditJobSector] = useState("");
  const [editJobType, setEditJobType] = useState("");
  const [editJobIndustry, setEditJobIndustry] = useState("");
  const [editJobRole, setEditJobRole] = useState("");
  const [editIsIelts, setEditIsIelts] = useState(false);
  const [editIeltsBand, setEditIeltsBand] = useState("");
  const [editUniversity, setEditUniversity] = useState("");
  const [editDepartment, setEditDepartment] = useState("");

  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setEditingField(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const initEditValues = () => {
    const extracted = extractFromInterests(profile?.interests);
    setEditName(profile?.full_name || "");
    setEditMobile(profile?.mobile_number || "");
    setEditGoals(profile?.goals || "");
    setEditClass(profile?.class_level || "");
    setEditBoard(profile?.board || "");
    setEditSubjectGroup(extracted.subjectGroup);
    setEditLang(profile?.language || "bn");
    setEditIsJobCandidate(!!profile?.is_job_candidate);
    setEditJobSector(profile?.job_sector || "");
    setEditJobType(profile?.job_type || "");
    setEditJobRole(profile?.job_role || "");
    if (profile?.job_sector === "besorkari") {
      setEditJobIndustry(profile?.job_type || "");
      setEditJobType("");
    } else {
      setEditJobIndustry("");
    }
    setEditIsIelts(!!profile?.is_ielts_candidate);
    setEditIeltsBand(profile?.ielts_target_band || "");
    setEditUniversity(extracted.university);
    setEditDepartment(extracted.department);
  };

  const startEdit = (field: string) => {
    initEditValues();
    setEditingField(field);
  };

  const logChange = async (fieldName: string, oldValue: string | null, newValue: string | null) => {
    if (!user || oldValue === newValue) return;
    await supabase.from("profile_edit_logs").insert({
      user_id: user.id,
      field_name: fieldName,
      old_value: oldValue || "",
      new_value: newValue || "",
    });
  };

  const saveField = async (field: string) => {
    if (!user) return;
    setSavingField(field);
    try {
      const updateData: any = {};
      const logs: { field: string; old: string | null; new: string | null }[] = [];

      switch (field) {
        case "name":
          updateData.full_name = editName;
          logs.push({ field: "full_name", old: profile?.full_name, new: editName });
          break;
        case "mobile":
          updateData.mobile_number = editMobile;
          logs.push({ field: "mobile_number", old: profile?.mobile_number, new: editMobile });
          break;
        case "class": {
          updateData.class_level = editClass;
          logs.push({ field: "class_level", old: profile?.class_level, new: editClass });
          // Also update related fields
          const interests: string[] = [];
          if (editSubjectGroup) interests.push(editSubjectGroup);
          if (editClass === "University") {
            if (editDepartment) interests.push(editDepartment);
            if (editUniversity) interests.push(`University:${editUniversity}`);
            updateData.board = editUniversity;
          } else if (editClass === "Job Candidate") {
            updateData.board = null;
            updateData.is_job_candidate = true;
            updateData.job_sector = editJobSector;
            updateData.job_type = editJobSector === "sorkari" ? editJobType : editJobIndustry;
            updateData.job_role = editJobSector === "besorkari" ? editJobRole : null;
          } else {
            updateData.board = editBoard;
          }
          if (editIsIelts) {
            interests.push("IELTS");
            if (editIeltsBand) interests.push(`IELTSBand:${editIeltsBand}`);
          }
          updateData.interests = interests;
          updateData.is_ielts_candidate = editIsIelts;
          updateData.ielts_target_band = editIsIelts ? editIeltsBand : null;
          break;
        }
        case "board":
          updateData.board = editBoard;
          logs.push({ field: "board", old: profile?.board, new: editBoard });
          break;
        case "goals":
          updateData.goals = editGoals;
          logs.push({ field: "goals", old: profile?.goals, new: editGoals });
          break;
        case "language":
          updateData.language = editLang;
          logs.push({ field: "language", old: profile?.language, new: editLang });
          break;
        case "job": {
          updateData.is_job_candidate = editIsJobCandidate;
          updateData.job_sector = editJobSector;
          updateData.job_type = editJobSector === "sorkari" ? editJobType : editJobIndustry;
          updateData.job_role = editJobSector === "besorkari" ? editJobRole : null;
          logs.push({ field: "job_sector", old: profile?.job_sector, new: editJobSector });
          logs.push({ field: "job_type", old: profile?.job_type, new: updateData.job_type });
          logs.push({ field: "job_role", old: profile?.job_role, new: updateData.job_role });
          break;
        }
        case "ielts":
          updateData.is_ielts_candidate = editIsIelts;
          updateData.ielts_target_band = editIsIelts ? editIeltsBand : null;
          logs.push({ field: "ielts_target_band", old: profile?.ielts_target_band, new: editIeltsBand });
          break;
        case "university":
          updateData.board = editUniversity;
          const newInterests = [...(profile?.interests || [])];
          const uniIdx = newInterests.findIndex((i: string) => i.startsWith("University:"));
          if (uniIdx >= 0) newInterests[uniIdx] = `University:${editUniversity}`;
          else newInterests.push(`University:${editUniversity}`);
          updateData.interests = newInterests;
          logs.push({ field: "university", old: extractFromInterests(profile?.interests).university, new: editUniversity });
          break;
        case "department": {
          const deptInterests = [...(profile?.interests || [])];
          const deptValues = DEPARTMENT_OPTIONS.map(d => d.value);
          const filtered = deptInterests.filter((i: string) => !deptValues.includes(i));
          if (editDepartment) filtered.push(editDepartment);
          updateData.interests = filtered;
          logs.push({ field: "department", old: extractFromInterests(profile?.interests).department, new: editDepartment });
          break;
        }
        case "subjectGroup": {
          const sgInterests = [...(profile?.interests || [])];
          const sgFiltered = sgInterests.filter((i: string) => !["Science", "Arts", "Commerce"].includes(i));
          if (editSubjectGroup) sgFiltered.push(editSubjectGroup);
          updateData.interests = sgFiltered;
          logs.push({ field: "subject_group", old: extractFromInterests(profile?.interests).subjectGroup, new: editSubjectGroup });
          break;
        }
      }

      // Validate before saving
      if (updateData.full_name !== undefined && (updateData.full_name.length > 100 || updateData.full_name.length < 1)) {
        throw new Error("Name must be 1-100 characters");
      }
      if (updateData.age !== undefined && (updateData.age < 1 || updateData.age > 100)) {
        throw new Error("Age must be between 1 and 100");
      }
      if (updateData.goals !== undefined && updateData.goals && updateData.goals.length > 500) {
        throw new Error("Goals must be under 500 characters");
      }
      if (updateData.interests && updateData.interests.length > 20) {
        throw new Error("Too many interests");
      }

      await supabase.from("profiles").update(updateData).eq("user_id", user.id);

      // Log all changes
      for (const log of logs) {
        await logChange(log.field, log.old, log.new);
      }

      await refreshProfile();
      setEditingField(null);
      toast({ title: t("Updated!", "আপডেট হয়েছে!") });
    } catch (err: any) {
      toast({ title: t("Error", "ত্রুটি"), description: err.message, variant: "destructive" });
    } finally {
      setSavingField(null);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/avatar.${ext}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
      const oldUrl = profile?.avatar_url;
      const newUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      await supabase.from("profiles").update({ avatar_url: newUrl }).eq("user_id", user.id);
      await logChange("avatar_url", oldUrl, newUrl);
      await refreshProfile();
      toast({ title: t("Avatar updated!", "ছবি আপডেট হয়েছে!") });
    } catch (err: any) {
      toast({ title: t("Error", "ত্রুটি"), description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const initials = (profile?.full_name || "U").split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
  const extracted = extractFromInterests(profile?.interests);
  const classDisplay = CLASS_OPTIONS.find(c => c.value === profile?.class_level);
  const groupDisplay = SUBJECT_GROUP_OPTIONS.find(g => g.value === extracted.subjectGroup);
  const boardDisplay = BOARD_OPTIONS.find(b => b.value === profile?.board);

  const inputClass = "w-full px-3 py-1.5 rounded-lg bg-background border border-input text-foreground text-sm focus:ring-2 focus:ring-ring outline-none";
  const selectClass = "w-full px-3 py-1.5 rounded-lg bg-background border border-input text-foreground text-sm focus:ring-2 focus:ring-ring outline-none appearance-none";

  const showSubjectGroup = profile?.class_level === "9" || profile?.class_level === "10" || profile?.class_level === "HSC";
  const showBoard = profile?.class_level && profile?.class_level !== "University" && profile?.class_level !== "Job Candidate";
  const showUniversity = profile?.class_level === "University";

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-1">
        <Avatar className={`w-8 h-8 transition-colors cursor-pointer ${frameClass || "border-2 border-primary/30 hover:border-primary"}`}>
          <AvatarImage src={profile?.avatar_url || undefined} alt="Profile" />
          <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">{initials}</AvatarFallback>
        </Avatar>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            className="absolute right-0 mt-2 w-96 max-w-[calc(100vw-1rem)] max-h-[85vh] overflow-y-auto bg-card border border-border rounded-xl shadow-lg z-50"
          >
            {/* Profile Header */}
            <div className="p-5 bg-primary/5 flex items-center gap-4 border-b border-border">
              <div className="relative group">
                <Avatar className={`w-16 h-16 ${frameClass || "border-2 border-primary/20"}`}>
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">{initials}</AvatarFallback>
                </Avatar>
                <label className="absolute inset-0 flex items-center justify-center bg-foreground/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  {uploading ? <Loader2 className="w-4 h-4 text-background animate-spin" /> : <Camera className="w-4 h-4 text-background" />}
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploading} />
                </label>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground text-lg truncate">{profile?.full_name || t("Student", "শিক্ষার্থী")}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  {classDisplay && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                      {t(classDisplay.en, classDisplay.bn)}
                    </span>
                  )}
                  {groupDisplay && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-secondary/20 text-secondary-foreground font-medium">
                      {t(groupDisplay.en, groupDisplay.bn)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Detail Sections with Inline Edit */}
            <div className="p-4 space-y-0.5 divide-y divide-border/50">
              {/* Full Name */}
              <EditableField
                label={t("Full Name", "পূর্ণ নাম")}
                value={profile?.full_name || ""}
                editing={editingField === "name"}
                onEdit={() => startEdit("name")}
                onSave={() => saveField("name")}
                onCancel={() => setEditingField(null)}
                saving={savingField === "name"}
              >
                <input value={editName} onChange={e => setEditName(e.target.value)} className={inputClass} />
              </EditableField>

              {/* Email (read-only) */}
              <div className="flex items-start justify-between gap-2 py-1.5">
                <div>
                  <span className="text-xs text-muted-foreground">{t("Email", "ইমেইল")}</span>
                  <p className="text-sm font-medium text-foreground truncate">{user?.email || "—"}</p>
                </div>
              </div>

              {/* Mobile */}
              <EditableField
                label={t("Mobile", "মোবাইল")}
                value={profile?.mobile_number || ""}
                editing={editingField === "mobile"}
                onEdit={() => startEdit("mobile")}
                onSave={() => saveField("mobile")}
                onCancel={() => setEditingField(null)}
                saving={savingField === "mobile"}
              >
                <input value={editMobile} onChange={e => setEditMobile(e.target.value.replace(/[^0-9+]/g, ""))} className={inputClass} placeholder="01XXXXXXXXX" />
              </EditableField>

              {/* Class / Track */}
              <EditableField
                label={t("Class / Track", "শ্রেণি / ট্র্যাক")}
                value={profile?.class_level || ""}
                displayValue={classDisplay ? t(classDisplay.en, classDisplay.bn) : ""}
                editing={editingField === "class"}
                onEdit={() => startEdit("class")}
                onSave={() => saveField("class")}
                onCancel={() => setEditingField(null)}
                saving={savingField === "class"}
              >
                <select value={editClass} onChange={e => setEditClass(e.target.value)} className={selectClass}>
                  <option value="">{t("Select", "নির্বাচন করো")}</option>
                  {CLASS_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{t(opt.en, opt.bn)}</option>
                  ))}
                </select>
              </EditableField>

              {/* Subject Group (SSC/HSC) */}
              {showSubjectGroup && (
                <EditableField
                  label={t("Subject Group", "বিষয় বিভাগ")}
                  value={extracted.subjectGroup}
                  displayValue={groupDisplay ? t(groupDisplay.en, groupDisplay.bn) : ""}
                  editing={editingField === "subjectGroup"}
                  onEdit={() => startEdit("subjectGroup")}
                  onSave={() => saveField("subjectGroup")}
                  onCancel={() => setEditingField(null)}
                  saving={savingField === "subjectGroup"}
                >
                  <select value={editSubjectGroup} onChange={e => setEditSubjectGroup(e.target.value)} className={selectClass}>
                    <option value="">{t("Select", "নির্বাচন করো")}</option>
                    {SUBJECT_GROUP_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{t(opt.en, opt.bn)}</option>
                    ))}
                  </select>
                </EditableField>
              )}

              {/* Board */}
              {showBoard && (
                <EditableField
                  label={t("Board", "বোর্ড")}
                  value={profile?.board || ""}
                  displayValue={boardDisplay ? t(boardDisplay.en, boardDisplay.bn) : profile?.board || ""}
                  editing={editingField === "board"}
                  onEdit={() => startEdit("board")}
                  onSave={() => saveField("board")}
                  onCancel={() => setEditingField(null)}
                  saving={savingField === "board"}
                >
                  <select value={editBoard} onChange={e => setEditBoard(e.target.value)} className={selectClass}>
                    <option value="">{t("Select", "নির্বাচন করো")}</option>
                    {BOARD_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{t(opt.en, opt.bn)}</option>
                    ))}
                  </select>
                </EditableField>
              )}

              {/* University */}
              {showUniversity && (
                <>
                  <EditableField
                    label={t("University", "বিশ্ববিদ্যালয়")}
                    value={extracted.university}
                    editing={editingField === "university"}
                    onEdit={() => startEdit("university")}
                    onSave={() => saveField("university")}
                    onCancel={() => setEditingField(null)}
                    saving={savingField === "university"}
                  >
                    <input value={editUniversity} onChange={e => setEditUniversity(e.target.value)} className={inputClass} />
                  </EditableField>

                  <EditableField
                    label={t("Department", "বিভাগ")}
                    value={extracted.department}
                    displayValue={DEPARTMENT_OPTIONS.find(d => d.value === extracted.department) ? t(DEPARTMENT_OPTIONS.find(d => d.value === extracted.department)!.en, DEPARTMENT_OPTIONS.find(d => d.value === extracted.department)!.bn) : extracted.department}
                    editing={editingField === "department"}
                    onEdit={() => startEdit("department")}
                    onSave={() => saveField("department")}
                    onCancel={() => setEditingField(null)}
                    saving={savingField === "department"}
                  >
                    <select value={editDepartment} onChange={e => setEditDepartment(e.target.value)} className={selectClass}>
                      <option value="">{t("Select", "নির্বাচন করো")}</option>
                      {DEPARTMENT_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{t(opt.en, opt.bn)}</option>
                      ))}
                    </select>
                  </EditableField>
                </>
              )}

              {/* Job fields */}
              {profile?.is_job_candidate && (
                <EditableField
                  label={t("Job Track", "চাকরির ধরন")}
                  value={profile?.job_sector || ""}
                  displayValue={
                    profile?.job_sector === "sorkari"
                      ? `${t("Government", "সরকারি")}${profile?.job_type ? ` - ${profile.job_type}` : ""}`
                      : `${t("Private", "বেসরকারি")}${profile?.job_type ? ` - ${profile.job_type}` : ""}${profile?.job_role ? ` (${profile.job_role})` : ""}`
                  }
                  editing={editingField === "job"}
                  onEdit={() => startEdit("job")}
                  onSave={() => saveField("job")}
                  onCancel={() => setEditingField(null)}
                  saving={savingField === "job"}
                >
                  <div className="space-y-2">
                    <select value={editJobSector} onChange={e => { setEditJobSector(e.target.value); setEditJobType(""); setEditJobIndustry(""); setEditJobRole(""); }} className={selectClass}>
                      <option value="">{t("Select sector", "সেক্টর নির্বাচন")}</option>
                      <option value="sorkari">{t("Government", "সরকারি")}</option>
                      <option value="besorkari">{t("Private", "বেসরকারি")}</option>
                    </select>
                    {editJobSector === "sorkari" && (
                      <select value={editJobType} onChange={e => setEditJobType(e.target.value)} className={selectClass}>
                        <option value="">{t("Exam type", "পরীক্ষার ধরন")}</option>
                        {GOVT_JOB_TYPES.map(opt => <option key={opt.value} value={opt.value}>{t(opt.en, opt.bn)}</option>)}
                      </select>
                    )}
                    {editJobSector === "besorkari" && (
                      <>
                        <select value={editJobIndustry} onChange={e => setEditJobIndustry(e.target.value)} className={selectClass}>
                          <option value="">{t("Industry", "শিল্পখাত")}</option>
                          {PRIVATE_INDUSTRY_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{t(opt.en, opt.bn)}</option>)}
                        </select>
                        <select value={editJobRole} onChange={e => setEditJobRole(e.target.value)} className={selectClass}>
                          <option value="">{t("Role", "পদ")}</option>
                          {PRIVATE_ROLE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{t(opt.en, opt.bn)}</option>)}
                        </select>
                      </>
                    )}
                  </div>
                </EditableField>
              )}

              {/* IELTS */}
              {profile?.is_ielts_candidate && (
                <EditableField
                  label={t("IELTS Target", "আইইএলটিএস টার্গেট")}
                  value={profile?.ielts_target_band || ""}
                  displayValue={profile?.ielts_target_band ? `Band ${profile.ielts_target_band}` : "—"}
                  editing={editingField === "ielts"}
                  onEdit={() => startEdit("ielts")}
                  onSave={() => saveField("ielts")}
                  onCancel={() => setEditingField(null)}
                  saving={savingField === "ielts"}
                >
                  <select value={editIeltsBand} onChange={e => setEditIeltsBand(e.target.value)} className={selectClass}>
                    <option value="">{t("Target Band", "টার্গেট ব্যান্ড")}</option>
                    {["5.0", "5.5", "6.0", "6.5", "7.0", "7.5", "8.0", "8.5"].map(b => (
                      <option key={b} value={b}>Band {b}</option>
                    ))}
                  </select>
                </EditableField>
              )}

              {/* Career Goal */}
              <EditableField
                label={t("Career Goal", "ক্যারিয়ার লক্ষ্য")}
                value={profile?.goals || ""}
                editing={editingField === "goals"}
                onEdit={() => startEdit("goals")}
                onSave={() => saveField("goals")}
                onCancel={() => setEditingField(null)}
                saving={savingField === "goals"}
              >
                <select value={editGoals} onChange={e => setEditGoals(e.target.value)} className={selectClass}>
                  <option value="">{t("Select", "নির্বাচন করো")}</option>
                  {CAREER_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{t(opt.en, opt.bn)}</option>
                  ))}
                </select>
              </EditableField>

              {/* Language */}
              <EditableField
                label={t("Language", "ভাষা")}
                value={profile?.language || "bn"}
                displayValue={profile?.language === "bn" ? "বাংলা" : "English"}
                editing={editingField === "language"}
                onEdit={() => startEdit("language")}
                onSave={() => saveField("language")}
                onCancel={() => setEditingField(null)}
                saving={savingField === "language"}
              >
                <select value={editLang} onChange={e => setEditLang(e.target.value)} className={selectClass}>
                  <option value="bn">বাংলা</option>
                  <option value="en">English</option>
                </select>
              </EditableField>
            </div>

            {/* Logout */}
            <div className="border-t border-border p-2">
              <button onClick={() => { signOut(); navigate("/"); setOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm rounded-lg hover:bg-destructive/10 text-destructive transition-colors">
                <LogOut className="w-4 h-4" /> {t("Logout", "লগআউট")}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfileDropdown;
