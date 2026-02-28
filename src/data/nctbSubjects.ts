// NCTB Bangladesh curriculum subjects mapped by class level
// Sources: Bangladesh National Curriculum and Textbook Board (NCTB)

export interface SubjectItem {
  icon: string;
  nameEn: string;
  nameBn: string;
  type?: "theory" | "math" | "coding" | "language";
  group?: "compulsory" | "science" | "commerce" | "arts"; // For SSC/HSC filtering
}

// Class 6-8 have the same core subjects (no group split)
const CLASS_6_SUBJECTS: SubjectItem[] = [
  { icon: "🔢", nameEn: "Mathematics", nameBn: "গণিত", type: "math" },
  { icon: "📖", nameEn: "Bangla", nameBn: "বাংলা", type: "language" },
  { icon: "🌐", nameEn: "English", nameBn: "ইংরেজি", type: "language" },
  { icon: "🔬", nameEn: "Science", nameBn: "বিজ্ঞান", type: "theory" },
  { icon: "🌍", nameEn: "Bangladesh & Global Studies", nameBn: "বাংলাদেশ ও বিশ্বপরিচয়", type: "theory" },
  { icon: "🕌", nameEn: "Islam & Moral Education", nameBn: "ইসলাম ও নৈতিক শিক্ষা", type: "theory" },
  { icon: "💻", nameEn: "ICT", nameBn: "তথ্য ও যোগাযোগ প্রযুক্তি", type: "coding" },
  { icon: "🎨", nameEn: "Arts & Crafts", nameBn: "চারু ও কারুকলা", type: "theory" },
  { icon: "🏃", nameEn: "Physical Education", nameBn: "শারীরিক শিক্ষা ও স্বাস্থ্য", type: "theory" },
  { icon: "🌾", nameEn: "Agriculture Studies", nameBn: "কৃষি শিক্ষা", type: "theory" },
  { icon: "🏠", nameEn: "Home Science", nameBn: "গার্হস্থ্য বিজ্ঞান", type: "theory" },
];

const CLASS_7_SUBJECTS: SubjectItem[] = [...CLASS_6_SUBJECTS];
const CLASS_8_SUBJECTS: SubjectItem[] = [...CLASS_6_SUBJECTS];

// Class 9-10 — SSC level, group-based
const CLASS_9_SUBJECTS: SubjectItem[] = [
  // Compulsory for ALL groups
  { icon: "📖", nameEn: "Bangla 1st Paper", nameBn: "বাংলা ১ম পত্র", type: "language", group: "compulsory" },
  { icon: "📝", nameEn: "Bangla 2nd Paper", nameBn: "বাংলা ২য় পত্র", type: "language", group: "compulsory" },
  { icon: "🌐", nameEn: "English 1st Paper", nameBn: "ইংরেজি ১ম পত্র", type: "language", group: "compulsory" },
  { icon: "✍️", nameEn: "English 2nd Paper", nameBn: "ইংরেজি ২য় পত্র", type: "language", group: "compulsory" },
  { icon: "🔢", nameEn: "General Mathematics", nameBn: "সাধারণ গণিত", type: "math", group: "compulsory" },
  { icon: "🕌", nameEn: "Islam & Moral Education", nameBn: "ইসলাম ও নৈতিক শিক্ষা", type: "theory", group: "compulsory" },
  { icon: "💻", nameEn: "ICT", nameBn: "তথ্য ও যোগাযোগ প্রযুক্তি", type: "coding", group: "compulsory" },
  // Science Group
  { icon: "⚛️", nameEn: "Physics", nameBn: "পদার্থবিজ্ঞান", type: "theory", group: "science" },
  { icon: "🧪", nameEn: "Chemistry", nameBn: "রসায়ন", type: "theory", group: "science" },
  { icon: "🧬", nameEn: "Biology", nameBn: "জীববিজ্ঞান", type: "theory", group: "science" },
  { icon: "📐", nameEn: "Higher Mathematics", nameBn: "উচ্চতর গণিত", type: "math", group: "science" },
  // Commerce Group
  { icon: "📊", nameEn: "Accounting", nameBn: "হিসাববিজ্ঞান", type: "theory", group: "commerce" },
  { icon: "💼", nameEn: "Business Entrepreneurship", nameBn: "ব্যবসায় উদ্যোগ", type: "theory", group: "commerce" },
  { icon: "💰", nameEn: "Finance & Banking", nameBn: "ফিন্যান্স ও ব্যাংকিং", type: "theory", group: "commerce" },
  // Arts Group
  { icon: "🌍", nameEn: "Bangladesh & Global Studies", nameBn: "বাংলাদেশ ও বিশ্বপরিচয়", type: "theory", group: "arts" },
  { icon: "📜", nameEn: "History of Bangladesh", nameBn: "বাংলাদেশের ইতিহাস", type: "theory", group: "arts" },
  { icon: "🏛️", nameEn: "Civics & Citizenship", nameBn: "পৌরনীতি ও নাগরিকতা", type: "theory", group: "arts" },
  { icon: "🗺️", nameEn: "Geography & Environment", nameBn: "ভূগোল ও পরিবেশ", type: "theory", group: "arts" },
];

const CLASS_10_SUBJECTS: SubjectItem[] = CLASS_9_SUBJECTS;

// HSC (Class 11-12)
const HSC_SUBJECTS: SubjectItem[] = [
  // Compulsory
  { icon: "📖", nameEn: "Bangla 1st Paper", nameBn: "বাংলা ১ম পত্র", type: "language", group: "compulsory" },
  { icon: "📝", nameEn: "Bangla 2nd Paper", nameBn: "বাংলা ২য় পত্র", type: "language", group: "compulsory" },
  { icon: "🌐", nameEn: "English 1st Paper", nameBn: "ইংরেজি ১ম পত্র", type: "language", group: "compulsory" },
  { icon: "✍️", nameEn: "English 2nd Paper", nameBn: "ইংরেজি ২য় পত্র", type: "language", group: "compulsory" },
  { icon: "💻", nameEn: "ICT", nameBn: "তথ্য ও যোগাযোগ প্রযুক্তি", type: "coding", group: "compulsory" },
  // Science Group
  { icon: "⚛️", nameEn: "Physics 1st Paper", nameBn: "পদার্থবিজ্ঞান ১ম পত্র", type: "theory", group: "science" },
  { icon: "⚛️", nameEn: "Physics 2nd Paper", nameBn: "পদার্থবিজ্ঞান ২য় পত্র", type: "theory", group: "science" },
  { icon: "🧪", nameEn: "Chemistry 1st Paper", nameBn: "রসায়ন ১ম পত্র", type: "theory", group: "science" },
  { icon: "🧪", nameEn: "Chemistry 2nd Paper", nameBn: "রসায়ন ২য় পত্র", type: "theory", group: "science" },
  { icon: "🧬", nameEn: "Biology 1st Paper", nameBn: "জীববিজ্ঞান ১ম পত্র", type: "theory", group: "science" },
  { icon: "🧬", nameEn: "Biology 2nd Paper", nameBn: "জীববিজ্ঞান ২য় পত্র", type: "theory", group: "science" },
  { icon: "📐", nameEn: "Higher Mathematics 1st Paper", nameBn: "উচ্চতর গণিত ১ম পত্র", type: "math", group: "science" },
  { icon: "📐", nameEn: "Higher Mathematics 2nd Paper", nameBn: "উচ্চতর গণিত ২য় পত্র", type: "math", group: "science" },
  // Commerce Group
  { icon: "📊", nameEn: "Accounting 1st Paper", nameBn: "হিসাববিজ্ঞান ১ম পত্র", type: "theory", group: "commerce" },
  { icon: "📊", nameEn: "Accounting 2nd Paper", nameBn: "হিসাববিজ্ঞান ২য় পত্র", type: "theory", group: "commerce" },
  { icon: "💼", nameEn: "Business Organization & Management 1st Paper", nameBn: "ব্যবসায় সংগঠন ও ব্যবস্থাপনা ১ম পত্র", type: "theory", group: "commerce" },
  { icon: "💼", nameEn: "Business Organization & Management 2nd Paper", nameBn: "ব্যবসায় সংগঠন ও ব্যবস্থাপনা ২য় পত্র", type: "theory", group: "commerce" },
  { icon: "💰", nameEn: "Finance, Banking & Insurance 1st Paper", nameBn: "ফিন্যান্স, ব্যাংকিং ও বীমা ১ম পত্র", type: "theory", group: "commerce" },
  { icon: "💰", nameEn: "Finance, Banking & Insurance 2nd Paper", nameBn: "ফিন্যান্স, ব্যাংকিং ও বীমা ২য় পত্র", type: "theory", group: "commerce" },
  // Arts / Humanities
  { icon: "📜", nameEn: "History 1st Paper", nameBn: "ইতিহাস ১ম পত্র", type: "theory", group: "arts" },
  { icon: "📜", nameEn: "History 2nd Paper", nameBn: "ইতিহাস ২য় পত্র", type: "theory", group: "arts" },
  { icon: "🏛️", nameEn: "Civics & Good Governance 1st Paper", nameBn: "পৌরনীতি ও সুশাসন ১ম পত্র", type: "theory", group: "arts" },
  { icon: "🏛️", nameEn: "Civics & Good Governance 2nd Paper", nameBn: "পৌরনীতি ও সুশাসন ২য় পত্র", type: "theory", group: "arts" },
  { icon: "💡", nameEn: "Economics 1st Paper", nameBn: "অর্থনীতি ১ম পত্র", type: "theory", group: "arts" },
  { icon: "💡", nameEn: "Economics 2nd Paper", nameBn: "অর্থনীতি ২য় পত্র", type: "theory", group: "arts" },
  { icon: "🗺️", nameEn: "Geography 1st Paper", nameBn: "ভূগোল ১ম পত্র", type: "theory", group: "arts" },
  { icon: "🗺️", nameEn: "Geography 2nd Paper", nameBn: "ভূগোল ২য় পত্র", type: "theory", group: "arts" },
  { icon: "🌏", nameEn: "Sociology 1st Paper", nameBn: "সমাজবিজ্ঞান ১ম পত্র", type: "theory", group: "arts" },
  { icon: "🌏", nameEn: "Sociology 2nd Paper", nameBn: "সমাজবিজ্ঞান ২য় পত্র", type: "theory", group: "arts" },
  { icon: "🧠", nameEn: "Logic 1st Paper", nameBn: "যুক্তিবিদ্যা ১ম পত্র", type: "theory", group: "arts" },
  { icon: "🧠", nameEn: "Logic 2nd Paper", nameBn: "যুক্তিবিদ্যা ২য় পত্র", type: "theory", group: "arts" },
];

// Government Job (Sorkari)
const GOVT_JOB_SUBJECTS: SubjectItem[] = [
  { icon: "📖", nameEn: "Bangla Language & Literature", nameBn: "বাংলা ভাষা ও সাহিত্য", type: "language" },
  { icon: "🌐", nameEn: "English Language & Grammar", nameBn: "ইংরেজি ভাষা ও ব্যাকরণ", type: "language" },
  { icon: "🔢", nameEn: "Mathematical Reasoning", nameBn: "গাণিতিক যুক্তি", type: "math" },
  { icon: "🧠", nameEn: "Mental Ability & Reasoning", nameBn: "মানসিক দক্ষতা", type: "theory" },
  { icon: "🌍", nameEn: "General Knowledge — Bangladesh", nameBn: "সাধারণ জ্ঞান — বাংলাদেশ", type: "theory" },
  { icon: "🌎", nameEn: "General Knowledge — International", nameBn: "সাধারণ জ্ঞান — আন্তর্জাতিক", type: "theory" },
  { icon: "🔬", nameEn: "General Science & Technology", nameBn: "সাধারণ বিজ্ঞান ও প্রযুক্তি", type: "theory" },
  { icon: "💻", nameEn: "Computer & ICT", nameBn: "কম্পিউটার ও আইসিটি", type: "coding" },
  { icon: "🌍", nameEn: "Geography & Environment", nameBn: "ভূগোল ও পরিবেশ", type: "theory" },
  { icon: "⚖️", nameEn: "Ethics & Good Governance", nameBn: "নৈতিকতা ও সুশাসন", type: "theory" },
  { icon: "📜", nameEn: "Bangladesh Constitution", nameBn: "বাংলাদেশের সংবিধান", type: "theory" },
  { icon: "📊", nameEn: "Bangladesh Economy", nameBn: "বাংলাদেশের অর্থনীতি", type: "theory" },
];

// Private Job subjects
const PRIVATE_JOB_SUBJECTS: SubjectItem[] = [
  { icon: "💻", nameEn: "Computer Skills & Office Tools", nameBn: "কম্পিউটার দক্ষতা ও অফিস টুলস", type: "coding" },
  { icon: "🌐", nameEn: "English Communication", nameBn: "ইংরেজি যোগাযোগ", type: "language" },
  { icon: "🔢", nameEn: "Quantitative Aptitude", nameBn: "গণনামূলক দক্ষতা", type: "math" },
  { icon: "🧠", nameEn: "Analytical & Logical Reasoning", nameBn: "বিশ্লেষণী ও যৌক্তিক দক্ষতা", type: "theory" },
  { icon: "📊", nameEn: "Basic Accounting & Finance", nameBn: "বেসিক অ্যাকাউন্টিং ও ফিন্যান্স", type: "theory" },
  { icon: "📈", nameEn: "Marketing Fundamentals", nameBn: "মার্কেটিং মৌলিক", type: "theory" },
  { icon: "👥", nameEn: "Management & Leadership", nameBn: "ম্যানেজমেন্ট ও নেতৃত্ব", type: "theory" },
  { icon: "📱", nameEn: "Digital Literacy & Tools", nameBn: "ডিজিটাল লিটারেসি ও টুলস", type: "coding" },
  { icon: "📝", nameEn: "Professional Writing", nameBn: "পেশাদার লেখালেখি", type: "language" },
  { icon: "🤝", nameEn: "Soft Skills & Interview Prep", nameBn: "সফট স্কিলস ও ইন্টারভিউ প্রস্তুতি", type: "theory" },
];

// IELTS preparation subjects
const IELTS_SUBJECTS: SubjectItem[] = [
  { icon: "👂", nameEn: "IELTS Listening", nameBn: "আইইএলটিএস লিসেনিং", type: "language" },
  { icon: "📖", nameEn: "IELTS Reading", nameBn: "আইইএলটিএস রিডিং", type: "language" },
  { icon: "✍️", nameEn: "IELTS Writing Task 1", nameBn: "আইইএলটিএস রাইটিং টাস্ক ১", type: "language" },
  { icon: "📝", nameEn: "IELTS Writing Task 2", nameBn: "আইইএলটিএস রাইটিং টাস্ক ২", type: "language" },
  { icon: "🗣️", nameEn: "IELTS Speaking", nameBn: "আইইএলটিএস স্পিকিং", type: "language" },
  { icon: "📚", nameEn: "IELTS Vocabulary Builder", nameBn: "আইইএলটিএস শব্দভান্ডার", type: "language" },
  { icon: "📐", nameEn: "IELTS Grammar Mastery", nameBn: "আইইএলটিএস গ্রামার", type: "language" },
];

// University department subjects
export const DEPT_SUBJECTS: Record<string, SubjectItem[]> = {
  CSE: [
    { icon: "💻", nameEn: "Data Structures & Algorithms", nameBn: "ডেটা স্ট্রাকচার ও অ্যালগরিদম", type: "coding" },
    { icon: "🌐", nameEn: "Computer Networks", nameBn: "কম্পিউটার নেটওয়ার্ক", type: "theory" },
    { icon: "🗄️", nameEn: "Database Management", nameBn: "ডেটাবেস ম্যানেজমেন্ট", type: "coding" },
    { icon: "⚙️", nameEn: "Operating Systems", nameBn: "অপারেটিং সিস্টেম", type: "theory" },
    { icon: "🤖", nameEn: "Artificial Intelligence", nameBn: "কৃত্রিম বুদ্ধিমত্তা", type: "coding" },
    { icon: "📐", nameEn: "Discrete Mathematics", nameBn: "বিচ্ছিন্ন গণিত", type: "math" },
    { icon: "🔒", nameEn: "Cyber Security", nameBn: "সাইবার সিকিউরিটি", type: "theory" },
    { icon: "📱", nameEn: "Software Engineering", nameBn: "সফটওয়্যার ইঞ্জিনিয়ারিং", type: "coding" },
  ],
  EEE: [
    { icon: "⚡", nameEn: "Circuit Analysis", nameBn: "সার্কিট বিশ্লেষণ", type: "math" },
    { icon: "📡", nameEn: "Signal Processing", nameBn: "সিগন্যাল প্রসেসিং", type: "math" },
    { icon: "🔌", nameEn: "Power Systems", nameBn: "পাওয়ার সিস্টেম", type: "theory" },
    { icon: "📶", nameEn: "Telecommunications", nameBn: "টেলিযোগাযোগ", type: "theory" },
    { icon: "🎛️", nameEn: "Control Systems", nameBn: "কন্ট্রোল সিস্টেম", type: "math" },
    { icon: "💡", nameEn: "Electronics", nameBn: "ইলেকট্রনিক্স", type: "theory" },
  ],
  ME: [
    { icon: "🔧", nameEn: "Thermodynamics", nameBn: "তাপগতিবিদ্যা", type: "theory" },
    { icon: "⚙️", nameEn: "Mechanics of Solids", nameBn: "কঠিন পদার্থের বলবিদ্যা", type: "math" },
    { icon: "🏭", nameEn: "Manufacturing Process", nameBn: "ম্যানুফ্যাকচারিং প্রসেস", type: "theory" },
    { icon: "💨", nameEn: "Fluid Mechanics", nameBn: "তরল বলবিদ্যা", type: "math" },
    { icon: "📏", nameEn: "Machine Design", nameBn: "মেশিন ডিজাইন", type: "theory" },
  ],
  CE: [
    { icon: "🏗️", nameEn: "Structural Engineering", nameBn: "স্ট্রাকচারাল ইঞ্জিনিয়ারিং", type: "math" },
    { icon: "🌊", nameEn: "Hydraulics", nameBn: "হাইড্রোলিক্স", type: "math" },
    { icon: "🏠", nameEn: "Construction Management", nameBn: "কনস্ট্রাকশন ম্যানেজমেন্ট", type: "theory" },
    { icon: "🌍", nameEn: "Geotechnical Engineering", nameBn: "ভূপ্রকৌশল", type: "theory" },
    { icon: "🛣️", nameEn: "Transportation Engineering", nameBn: "পরিবহন প্রকৌশল", type: "theory" },
  ],
  BBA: [
    { icon: "📊", nameEn: "Principles of Management", nameBn: "ব্যবস্থাপনার মূলনীতি", type: "theory" },
    { icon: "💰", nameEn: "Financial Accounting", nameBn: "আর্থিক হিসাববিজ্ঞান", type: "theory" },
    { icon: "📈", nameEn: "Marketing Management", nameBn: "মার্কেটিং ম্যানেজমেন্ট", type: "theory" },
    { icon: "🏦", nameEn: "Business Finance", nameBn: "ব্যবসায় ফিন্যান্স", type: "theory" },
    { icon: "👥", nameEn: "Human Resource Management", nameBn: "মানবসম্পদ ব্যবস্থাপনা", type: "theory" },
    { icon: "📉", nameEn: "Business Statistics", nameBn: "ব্যবসায় পরিসংখ্যান", type: "math" },
  ],
  Economics: [
    { icon: "📊", nameEn: "Microeconomics", nameBn: "ব্যষ্টিক অর্থনীতি", type: "theory" },
    { icon: "🌐", nameEn: "Macroeconomics", nameBn: "সামষ্টিক অর্থনীতি", type: "theory" },
    { icon: "📈", nameEn: "Econometrics", nameBn: "অর্থমিতি", type: "math" },
    { icon: "🏦", nameEn: "Development Economics", nameBn: "উন্নয়ন অর্থনীতি", type: "theory" },
    { icon: "💱", nameEn: "International Trade", nameBn: "আন্তর্জাতিক বাণিজ্য", type: "theory" },
  ],
  English: [
    { icon: "📖", nameEn: "English Literature", nameBn: "ইংরেজি সাহিত্য", type: "language" },
    { icon: "✍️", nameEn: "Linguistics", nameBn: "ভাষাতত্ত্ব", type: "language" },
    { icon: "📝", nameEn: "Academic Writing", nameBn: "একাডেমিক রাইটিং", type: "language" },
    { icon: "🎭", nameEn: "Drama & Poetry", nameBn: "নাটক ও কবিতা", type: "language" },
  ],
  Physics: [
    { icon: "⚛️", nameEn: "Quantum Mechanics", nameBn: "কোয়ান্টাম বলবিদ্যা", type: "math" },
    { icon: "🔭", nameEn: "Classical Mechanics", nameBn: "ধ্রুপদী বলবিদ্যা", type: "math" },
    { icon: "⚡", nameEn: "Electromagnetism", nameBn: "তড়িৎচুম্বকত্ব", type: "math" },
    { icon: "🌡️", nameEn: "Statistical Physics", nameBn: "পরিসংখ্যান পদার্থবিজ্ঞান", type: "math" },
    { icon: "☢️", nameEn: "Nuclear Physics", nameBn: "পারমাণবিক পদার্থবিজ্ঞান", type: "theory" },
  ],
  Mathematics: [
    { icon: "📐", nameEn: "Calculus", nameBn: "ক্যালকুলাস", type: "math" },
    { icon: "🔢", nameEn: "Linear Algebra", nameBn: "রৈখিক বীজগণিত", type: "math" },
    { icon: "📊", nameEn: "Probability & Statistics", nameBn: "সম্ভাবনা ও পরিসংখ্যান", type: "math" },
    { icon: "∞", nameEn: "Real Analysis", nameBn: "বাস্তব বিশ্লেষণ", type: "math" },
    { icon: "🔗", nameEn: "Abstract Algebra", nameBn: "বিমূর্ত বীজগণিত", type: "math" },
  ],
  Chemistry: [
    { icon: "🧪", nameEn: "Organic Chemistry", nameBn: "জৈব রসায়ন", type: "theory" },
    { icon: "⚗️", nameEn: "Inorganic Chemistry", nameBn: "অজৈব রসায়ন", type: "theory" },
    { icon: "🔬", nameEn: "Physical Chemistry", nameBn: "ভৌত রসায়ন", type: "math" },
    { icon: "💊", nameEn: "Analytical Chemistry", nameBn: "বিশ্লেষণী রসায়ন", type: "theory" },
  ],
  Pharmacy: [
    { icon: "💊", nameEn: "Pharmacology", nameBn: "ফার্মাকোলজি", type: "theory" },
    { icon: "🧬", nameEn: "Pharmaceutical Chemistry", nameBn: "ফার্মাসিউটিক্যাল কেমিস্ট্রি", type: "theory" },
    { icon: "🏥", nameEn: "Clinical Pharmacy", nameBn: "ক্লিনিক্যাল ফার্মেসি", type: "theory" },
    { icon: "🔬", nameEn: "Microbiology", nameBn: "অণুজীববিজ্ঞান", type: "theory" },
  ],
  Law: [
    { icon: "⚖️", nameEn: "Constitutional Law", nameBn: "সাংবিধানিক আইন", type: "theory" },
    { icon: "📜", nameEn: "Criminal Law", nameBn: "ফৌজদারি আইন", type: "theory" },
    { icon: "🏛️", nameEn: "Civil Law", nameBn: "দেওয়ানী আইন", type: "theory" },
    { icon: "🌐", nameEn: "International Law", nameBn: "আন্তর্জাতিক আইন", type: "theory" },
  ],
  Marketing: [
    { icon: "📱", nameEn: "Digital Marketing", nameBn: "ডিজিটাল মার্কেটিং", type: "theory" },
    { icon: "📊", nameEn: "Consumer Behavior", nameBn: "ভোক্তা আচরণ", type: "theory" },
    { icon: "🎯", nameEn: "Brand Management", nameBn: "ব্র্যান্ড ম্যানেজমেন্ট", type: "theory" },
    { icon: "📈", nameEn: "Market Research", nameBn: "মার্কেট রিসার্চ", type: "theory" },
  ],
  Finance: [
    { icon: "💹", nameEn: "Corporate Finance", nameBn: "কর্পোরেট ফিন্যান্স", type: "theory" },
    { icon: "🏦", nameEn: "Banking & Insurance", nameBn: "ব্যাংকিং ও বীমা", type: "theory" },
    { icon: "📊", nameEn: "Investment Analysis", nameBn: "বিনিয়োগ বিশ্লেষণ", type: "theory" },
    { icon: "💰", nameEn: "Financial Management", nameBn: "আর্থিক ব্যবস্থাপনা", type: "theory" },
  ],
  Accounting: [
    { icon: "📒", nameEn: "Cost Accounting", nameBn: "ব্যয় হিসাববিজ্ঞান", type: "theory" },
    { icon: "📊", nameEn: "Auditing", nameBn: "নিরীক্ষা", type: "theory" },
    { icon: "🏦", nameEn: "Tax Accounting", nameBn: "কর হিসাববিজ্ঞান", type: "theory" },
    { icon: "📈", nameEn: "Management Accounting", nameBn: "ব্যবস্থাপনা হিসাববিজ্ঞান", type: "theory" },
  ],
};

export const GENERIC_UNI_SUBJECTS: SubjectItem[] = [
  { icon: "📚", nameEn: "Core Subject Studies", nameBn: "মূল বিষয় পড়াশোনা", type: "theory" },
  { icon: "🔬", nameEn: "Research Methodology", nameBn: "গবেষণা পদ্ধতি", type: "theory" },
  { icon: "📝", nameEn: "Academic Writing", nameBn: "একাডেমিক রাইটিং", type: "language" },
  { icon: "💻", nameEn: "Computer Skills", nameBn: "কম্পিউটার দক্ষতা", type: "coding" },
  { icon: "🌐", nameEn: "Communication Skills", nameBn: "যোগাযোগ দক্ষতা", type: "language" },
  { icon: "📊", nameEn: "Statistics & Data", nameBn: "পরিসংখ্যান ও ডেটা", type: "math" },
];

// Master mapping
export const CLASS_SUBJECT_MAP: Record<string, SubjectItem[]> = {
  "6": CLASS_6_SUBJECTS,
  "7": CLASS_7_SUBJECTS,
  "8": CLASS_8_SUBJECTS,
  "9": CLASS_9_SUBJECTS,
  "10": CLASS_10_SUBJECTS,
  "HSC": HSC_SUBJECTS,
  "IELTS": IELTS_SUBJECTS,
};

// Helper to extract subject group from interests array
const getSubjectGroup = (interests: string[] | null | undefined): string | null => {
  if (!interests) return null;
  const groups = ["Science", "Arts", "Commerce"];
  return interests.find(i => groups.includes(i)) || null;
};

// Helper to extract department from interests array
const getDepartment = (interests: string[] | null | undefined): string | null => {
  if (!interests) return null;
  const deptKeys = Object.keys(DEPT_SUBJECTS);
  return interests.find(i => deptKeys.includes(i)) || null;
};

export const getSubjectsForUser = (
  classLevel: string | null | undefined,
  isJobCandidate: boolean | null | undefined,
  jobType: string | null | undefined,  // "sorkari" or industry name for private
  isIelts: boolean | null | undefined,
  department: string | null | undefined,
  subjectGroup?: string | null | undefined // "Science", "Arts", "Commerce"
): { subjects: SubjectItem[]; label: string; labelBn: string } => {
  let mainSubjects: SubjectItem[] = [];
  let label = "";
  let labelBn = "";

  // Job candidate (either class_level="Job Candidate" or is_job_candidate=true)
  if (classLevel === "Job Candidate" || isJobCandidate) {
    if (jobType === "sorkari" || jobType === "government") {
      mainSubjects = GOVT_JOB_SUBJECTS;
      label = "Government Job Preparation";
      labelBn = "সরকারি চাকরি প্রস্তুতি";
    } else {
      mainSubjects = PRIVATE_JOB_SUBJECTS;
      label = "Private Job Preparation";
      labelBn = "বেসরকারি চাকরি প্রস্তুতি";
    }
  }
  // University
  else if (classLevel === "University") {
    const deptKeys = Object.keys(DEPT_SUBJECTS);
    const dept = department && deptKeys.includes(department) ? department : null;
    if (dept) {
      mainSubjects = DEPT_SUBJECTS[dept];
      label = `Department: ${dept}`;
      labelBn = `বিভাগ: ${dept}`;
    } else {
      mainSubjects = GENERIC_UNI_SUBJECTS;
      label = "University";
      labelBn = "বিশ্ববিদ্যালয়";
    }
  }
  // SSC (Class 9-10) or HSC — filter by subject group
  else if (classLevel === "9" || classLevel === "10" || classLevel === "HSC") {
    const allSubjects = CLASS_SUBJECT_MAP[classLevel] || CLASS_9_SUBJECTS;
    const group = subjectGroup?.toLowerCase() as "science" | "commerce" | "arts" | undefined;
    
    if (group && ["science", "commerce", "arts"].includes(group)) {
      // Show compulsory + group-specific subjects
      mainSubjects = allSubjects.filter(s => s.group === "compulsory" || s.group === group);
      const groupLabels: Record<string, { en: string; bn: string }> = {
        science: { en: "Science", bn: "বিজ্ঞান" },
        commerce: { en: "Commerce", bn: "ব্যবসায় শিক্ষা" },
        arts: { en: "Arts/Humanities", bn: "মানবিক" },
      };
      const gl = groupLabels[group];
      label = classLevel === "HSC" ? `HSC — ${gl.en}` : `Class ${classLevel} — ${gl.en}`;
      labelBn = classLevel === "HSC" ? `এইচএসসি — ${gl.bn}` : `শ্রেণি ${classLevel} — ${gl.bn}`;
    } else {
      // No group selected — show all
      mainSubjects = allSubjects;
      label = classLevel === "HSC" ? "HSC" : `Class ${classLevel}`;
      labelBn = classLevel === "HSC" ? "এইচএসসি" : `শ্রেণি ${classLevel}`;
    }
  }
  // Class 6-8
  else {
    const mapped = CLASS_SUBJECT_MAP[classLevel || "9"];
    if (mapped) {
      mainSubjects = mapped;
      label = `Class ${classLevel}`;
      labelBn = `শ্রেণি ${classLevel}`;
    } else {
      mainSubjects = CLASS_6_SUBJECTS;
      label = "Class 6";
      labelBn = "শ্রেণি ৬";
    }
  }

  // Append IELTS subjects as extra section if IELTS candidate
  if (isIelts && classLevel !== "Job Candidate" && !isJobCandidate) {
    // Add IELTS subjects to the end
    mainSubjects = [...mainSubjects, ...IELTS_SUBJECTS];
    label += " + IELTS";
    labelBn += " + আইইএলটিএস";
  } else if (isIelts && (classLevel === "Job Candidate" || isJobCandidate)) {
    mainSubjects = [...mainSubjects, ...IELTS_SUBJECTS];
    label += " + IELTS";
    labelBn += " + আইইএলটিএস";
  } else if (isIelts) {
    // Pure IELTS only candidate (no class)
    if (mainSubjects.length === 0) {
      mainSubjects = IELTS_SUBJECTS;
      label = "IELTS Preparation";
      labelBn = "আইইএলটিএস প্রস্তুতি";
    }
  }

  return { subjects: mainSubjects, label, labelBn };
};
