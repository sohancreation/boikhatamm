export interface SkillItem {
  id: string;
  nameEn: string;
  nameBn: string;
  icon: string;
  descEn: string;
  descBn: string;
}

export interface SkillTrack {
  id: string;
  nameEn: string;
  nameBn: string;
  icon: string;
  colorClass: string;
  descEn: string;
  descBn: string;
  skills: SkillItem[];
}

export const skillTracks: SkillTrack[] = [
  {
    id: "tech",
    nameEn: "Tech Track",
    nameBn: "টেক ট্র্যাক",
    icon: "👨‍💻",
    colorClass: "from-blue-500/20 to-cyan-500/20 border-blue-500/30",
    descEn: "Software, AI, Cloud & Security",
    descBn: "সফটওয়্যার, AI, ক্লাউড ও সিকিউরিটি",
    skills: [
      { id: "dsa", nameEn: "Data Structure & Algorithm", nameBn: "ডাটা স্ট্রাকচার ও অ্যালগরিদম", icon: "🧩", descEn: "Master problem-solving for tech interviews", descBn: "টেক ইন্টারভিউর জন্য সমস্যা সমাধান আয়ত্ত করো" },
      { id: "webdev", nameEn: "Web Development", nameBn: "ওয়েব ডেভেলপমেন্ট", icon: "🌐", descEn: "Full-stack web applications", descBn: "ফুল-স্ট্যাক ওয়েব অ্যাপ্লিকেশন" },
      { id: "aiml", nameEn: "AI / Machine Learning", nameBn: "AI / মেশিন লার্নিং", icon: "🤖", descEn: "Build intelligent systems", descBn: "বুদ্ধিমান সিস্টেম তৈরি করো" },
      { id: "mobile", nameEn: "Mobile App Development", nameBn: "মোবাইল অ্যাপ ডেভেলপমেন্ট", icon: "📱", descEn: "Android & iOS applications", descBn: "Android ও iOS অ্যাপ্লিকেশন" },
      { id: "cloud", nameEn: "Cloud Computing", nameBn: "ক্লাউড কম্পিউটিং", icon: "☁️", descEn: "AWS, Azure, GCP infrastructure", descBn: "AWS, Azure, GCP ইনফ্রাস্ট্রাকচার" },
      { id: "cybersec", nameEn: "Cyber Security", nameBn: "সাইবার সিকিউরিটি", icon: "🔒", descEn: "Protect systems and data", descBn: "সিস্টেম ও ডাটা সুরক্ষিত করো" },
    ],
  },
  {
    id: "business",
    nameEn: "Business Track",
    nameBn: "বিজনেস ট্র্যাক",
    icon: "📈",
    colorClass: "from-emerald-500/20 to-green-500/20 border-emerald-500/30",
    descEn: "Analytics, Finance & Marketing",
    descBn: "অ্যানালিটিক্স, ফিনান্স ও মার্কেটিং",
    skills: [
      { id: "excel", nameEn: "Excel Advanced", nameBn: "এক্সেল অ্যাডভান্সড", icon: "📊", descEn: "Pivot tables, VBA, macros", descBn: "পিভট টেবিল, VBA, ম্যাক্রো" },
      { id: "finmodel", nameEn: "Financial Modeling", nameBn: "ফিনান্সিয়াল মডেলিং", icon: "💹", descEn: "Valuation & forecasting models", descBn: "ভ্যালুয়েশন ও ফোরকাস্টিং মডেল" },
      { id: "bizanalytics", nameEn: "Business Analytics", nameBn: "বিজনেস অ্যানালিটিক্স", icon: "📉", descEn: "Data-driven decisions", descBn: "ডাটা-চালিত সিদ্ধান্ত" },
      { id: "powerbi", nameEn: "Power BI", nameBn: "পাওয়ার BI", icon: "📶", descEn: "Interactive dashboards & reports", descBn: "ইন্টারেক্টিভ ড্যাশবোর্ড ও রিপোর্ট" },
      { id: "digmarketing", nameEn: "Digital Marketing", nameBn: "ডিজিটাল মার্কেটিং", icon: "📣", descEn: "SEO, SEM, Social Media", descBn: "SEO, SEM, সোশ্যাল মিডিয়া" },
    ],
  },
  {
    id: "creative",
    nameEn: "Creative Track",
    nameBn: "ক্রিয়েটিভ ট্র্যাক",
    icon: "🎨",
    colorClass: "from-purple-500/20 to-pink-500/20 border-purple-500/30",
    descEn: "Design, Video & Branding",
    descBn: "ডিজাইন, ভিডিও ও ব্র্যান্ডিং",
    skills: [
      { id: "uiux", nameEn: "UI/UX Design", nameBn: "UI/UX ডিজাইন", icon: "🎨", descEn: "User-centered design", descBn: "ব্যবহারকারী-কেন্দ্রিক ডিজাইন" },
      { id: "video", nameEn: "Video Editing", nameBn: "ভিডিও এডিটিং", icon: "🎬", descEn: "Professional video production", descBn: "প্রফেশনাল ভিডিও প্রোডাকশন" },
      { id: "3d", nameEn: "3D Design", nameBn: "3D ডিজাইন", icon: "🧊", descEn: "3D modeling & animation", descBn: "3D মডেলিং ও অ্যানিমেশন" },
      { id: "branding", nameEn: "Branding", nameBn: "ব্র্যান্ডিং", icon: "✨", descEn: "Brand identity & strategy", descBn: "ব্র্যান্ড আইডেন্টিটি ও স্ট্র্যাটেজি" },
    ],
  },
  {
    id: "freelance",
    nameEn: "Freelance Track",
    nameBn: "ফ্রিল্যান্স ট্র্যাক",
    icon: "🌐",
    colorClass: "from-orange-500/20 to-amber-500/20 border-orange-500/30",
    descEn: "Fiverr, Upwork & Client Management",
    descBn: "Fiverr, Upwork ও ক্লায়েন্ট ম্যানেজমেন্ট",
    skills: [
      { id: "fiverr", nameEn: "Fiverr Strategy", nameBn: "ফাইভার স্ট্র্যাটেজি", icon: "🟢", descEn: "Gig optimization & ranking", descBn: "গিগ অপটিমাইজেশন ও র‌্যাংকিং" },
      { id: "upwork", nameEn: "Upwork Proposal Writing", nameBn: "আপওয়ার্ক প্রপোজাল রাইটিং", icon: "📝", descEn: "Win more contracts", descBn: "বেশি কন্ট্রাক্ট জিতো" },
      { id: "clientcomm", nameEn: "Client Communication", nameBn: "ক্লায়েন্ট কমিউনিকেশন", icon: "💬", descEn: "Professional client handling", descBn: "প্রফেশনাল ক্লায়েন্ট হ্যান্ডলিং" },
      { id: "portfolio", nameEn: "Portfolio Optimization", nameBn: "পোর্টফোলিও অপটিমাইজেশন", icon: "🎯", descEn: "Showcase work effectively", descBn: "কাজ কার্যকরভাবে প্রদর্শন করো" },
    ],
  },
];
