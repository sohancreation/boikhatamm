import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ==================== NCTB OFFICIAL SYLLABUS REFERENCE ====================
// Hardcoded chapter lists from official NCTB textbooks for Class 6 to HSC.
// Keys: "classLevel::subjectNameEn" (lowercase subject)
// Each entry: array of { ch: chapter_number, en: English name, bn: Bangla name }

const NCTB_CHAPTERS: Record<string, { ch: number; en: string; bn: string }[]> = {
  // ===== CLASS 6 =====
  "6::mathematics": [
    { ch: 1, en: "Natural Numbers & Fractions", bn: "স্বাভাবিক সংখ্যা ও ভগ্নাংশ" },
    { ch: 2, en: "Ratio & Proportion", bn: "অনুপাত ও সমানুপাত" },
    { ch: 3, en: "Integers", bn: "পূর্ণ সংখ্যা" },
    { ch: 4, en: "Algebraic Expressions", bn: "বীজগাণিতিক রাশি" },
    { ch: 5, en: "Simple Equations", bn: "সরল সমীকরণ" },
    { ch: 6, en: "Geometry: Lines and Angles", bn: "জ্যামিতি: রেখা ও কোণ" },
    { ch: 7, en: "Geometry: Triangles", bn: "জ্যামিতি: ত্রিভুজ" },
    { ch: 8, en: "Data Handling", bn: "তথ্য উপাত্ত" },
    { ch: 9, en: "Measurement", bn: "পরিমাপ" },
    { ch: 10, en: "Practical Geometry", bn: "ব্যবহারিক জ্যামিতি" },
  ],
  "6::science": [
    { ch: 1, en: "Food and Nutrition", bn: "খাদ্য ও পুষ্টি" },
    { ch: 2, en: "Structure of Living Organisms", bn: "জীবের গঠন" },
    { ch: 3, en: "Matter and Its Properties", bn: "পদার্থ ও তার ধর্ম" },
    { ch: 4, en: "Force and Motion", bn: "বল ও গতি" },
    { ch: 5, en: "Energy", bn: "শক্তি" },
    { ch: 6, en: "Sound", bn: "শব্দ" },
    { ch: 7, en: "Light", bn: "আলো" },
    { ch: 8, en: "Earth and Space", bn: "পৃথিবী ও মহাকাশ" },
    { ch: 9, en: "Our Environment", bn: "আমাদের পরিবেশ" },
    { ch: 10, en: "Technology in Daily Life", bn: "দৈনন্দিন জীবনে প্রযুক্তি" },
  ],
  "6::bangla": [
    { ch: 1, en: "Prose: Selected Stories", bn: "গদ্য: নির্বাচিত গল্প" },
    { ch: 2, en: "Poetry: Selected Poems", bn: "পদ্য: নির্বাচিত কবিতা" },
    { ch: 3, en: "Grammar: Parts of Speech", bn: "ব্যাকরণ: পদ প্রকরণ" },
    { ch: 4, en: "Grammar: Sentence Structure", bn: "ব্যাকরণ: বাক্য গঠন" },
    { ch: 5, en: "Grammar: Punctuation", bn: "ব্যাকরণ: বিরাম চিহ্ন" },
    { ch: 6, en: "Composition: Letter Writing", bn: "রচনা: পত্র লেখা" },
    { ch: 7, en: "Composition: Paragraph", bn: "রচনা: অনুচ্ছেদ" },
    { ch: 8, en: "Composition: Essay", bn: "রচনা: প্রবন্ধ" },
  ],
  "6::english": [
    { ch: 1, en: "Going to a New School", bn: "নতুন স্কুলে যাওয়া" },
    { ch: 2, en: "Playing Together", bn: "একসাথে খেলা" },
    { ch: 3, en: "Our Community", bn: "আমাদের সম্প্রদায়" },
    { ch: 4, en: "Food and Health", bn: "খাদ্য ও স্বাস্থ্য" },
    { ch: 5, en: "Animal World", bn: "প্রাণীজগৎ" },
    { ch: 6, en: "Travelling Around", bn: "ভ্রমণ" },
    { ch: 7, en: "Our Liberation War", bn: "আমাদের মুক্তিযুদ্ধ" },
    { ch: 8, en: "Amazing Nature", bn: "বিস্ময়কর প্রকৃতি" },
  ],
  "6::bangladesh & global studies": [
    { ch: 1, en: "Our Bangladesh", bn: "আমাদের বাংলাদেশ" },
    { ch: 2, en: "History and Heritage", bn: "ইতিহাস ও ঐতিহ্য" },
    { ch: 3, en: "Our Society", bn: "আমাদের সমাজ" },
    { ch: 4, en: "Economy of Bangladesh", bn: "বাংলাদেশের অর্থনীতি" },
    { ch: 5, en: "Our Environment", bn: "আমাদের পরিবেশ" },
    { ch: 6, en: "Citizenship", bn: "নাগরিকতা" },
    { ch: 7, en: "Global Context", bn: "বৈশ্বিক প্রেক্ষাপট" },
  ],
  "6::ict": [
    { ch: 1, en: "Introduction to ICT", bn: "তথ্য ও যোগাযোগ প্রযুক্তির পরিচিতি" },
    { ch: 2, en: "Computer Basics", bn: "কম্পিউটার পরিচিতি" },
    { ch: 3, en: "Word Processing", bn: "ওয়ার্ড প্রসেসিং" },
    { ch: 4, en: "Internet and Email", bn: "ইন্টারনেট ও ই-মেইল" },
    { ch: 5, en: "Digital Content", bn: "ডিজিটাল কনটেন্ট" },
  ],
  "6::islam & moral education": [
    { ch: 1, en: "Aqidah (Faith)", bn: "আকাইদ" },
    { ch: 2, en: "Ibadah (Worship)", bn: "ইবাদত" },
    { ch: 3, en: "Quran Sharif", bn: "কুরআন শরীফ" },
    { ch: 4, en: "Hadith Sharif", bn: "হাদিস শরীফ" },
    { ch: 5, en: "Moral Teachings", bn: "আখলাক" },
    { ch: 6, en: "Life of Prophet Muhammad (PBUH)", bn: "মহানবী (সা.)-এর জীবন" },
  ],

  // ===== CLASS 7 =====
  "7::mathematics": [
    { ch: 1, en: "Rational Numbers", bn: "মূলদ সংখ্যা" },
    { ch: 2, en: "Proportion & Percentage", bn: "সমানুপাত ও শতকরা" },
    { ch: 3, en: "Algebraic Expressions & Equations", bn: "বীজগাণিতিক রাশি ও সমীকরণ" },
    { ch: 4, en: "Exponents", bn: "সূচক" },
    { ch: 5, en: "Geometry: Quadrilaterals & Circles", bn: "জ্যামিতি: চতুর্ভুজ ও বৃত্ত" },
    { ch: 6, en: "Area & Volume", bn: "ক্ষেত্রফল ও আয়তন" },
    { ch: 7, en: "Statistics", bn: "পরিসংখ্যান" },
    { ch: 8, en: "Sets", bn: "সেট" },
    { ch: 9, en: "Profit, Loss & Simple Interest", bn: "লাভ, ক্ষতি ও সরল সুদ" },
  ],
  "7::science": [
    { ch: 1, en: "Cells and Tissues", bn: "কোষ ও টিস্যু" },
    { ch: 2, en: "Photosynthesis and Respiration", bn: "সালোকসংশ্লেষণ ও শ্বসন" },
    { ch: 3, en: "Atoms and Molecules", bn: "পরমাণু ও অণু" },
    { ch: 4, en: "Chemical Reactions", bn: "রাসায়নিক বিক্রিয়া" },
    { ch: 5, en: "Heat and Temperature", bn: "তাপ ও তাপমাত্রা" },
    { ch: 6, en: "Electricity", bn: "বিদ্যুৎ" },
    { ch: 7, en: "Magnetism", bn: "চুম্বকত্ব" },
    { ch: 8, en: "Climate and Seasons", bn: "জলবায়ু ও ঋতু" },
    { ch: 9, en: "Health and Disease", bn: "স্বাস্থ্য ও রোগ" },
    { ch: 10, en: "Population and Environment", bn: "জনসংখ্যা ও পরিবেশ" },
  ],

  // ===== CLASS 8 =====
  "8::mathematics": [
    { ch: 1, en: "Patterns and Sequences", bn: "প্যাটার্ন ও ক্রম" },
    { ch: 2, en: "Profit, Loss & Compound Interest", bn: "লাভ-ক্ষতি ও চক্রবৃদ্ধি সুদ" },
    { ch: 3, en: "Algebraic Formulas", bn: "বীজগাণিতিক সূত্রাবলি" },
    { ch: 4, en: "Linear Equations", bn: "সরল সমীকরণ" },
    { ch: 5, en: "Pythagoras Theorem", bn: "পিথাগোরাসের উপপাদ্য" },
    { ch: 6, en: "Area of Compound Shapes", bn: "যৌগিক আকৃতির ক্ষেত্রফল" },
    { ch: 7, en: "Surface Area & Volume", bn: "পৃষ্ঠতলের ক্ষেত্রফল ও আয়তন" },
    { ch: 8, en: "Statistics & Probability", bn: "পরিসংখ্যান ও সম্ভাবনা" },
    { ch: 9, en: "Sets and Functions", bn: "সেট ও ফাংশন" },
    { ch: 10, en: "Graphs and Coordinates", bn: "লেখচিত্র ও স্থানাংক" },
  ],
  "8::science": [
    { ch: 1, en: "Classification of Living Organisms", bn: "জীবের শ্রেণিবিন্যাস" },
    { ch: 2, en: "Human Body Systems", bn: "মানবদেহের তন্ত্র" },
    { ch: 3, en: "Reproduction in Plants & Animals", bn: "উদ্ভিদ ও প্রাণীর প্রজনন" },
    { ch: 4, en: "Elements, Compounds & Mixtures", bn: "মৌল, যৌগ ও মিশ্রণ" },
    { ch: 5, en: "Acids, Bases and Salts", bn: "এসিড, ক্ষার ও লবণ" },
    { ch: 6, en: "Pressure", bn: "চাপ" },
    { ch: 7, en: "Reflection of Light", bn: "আলোর প্রতিফলন" },
    { ch: 8, en: "Universe and Solar System", bn: "মহাবিশ্ব ও সৌরজগৎ" },
    { ch: 9, en: "Natural Resources", bn: "প্রাকৃতিক সম্পদ" },
    { ch: 10, en: "Biotechnology", bn: "জীবপ্রযুক্তি" },
  ],

  // ===== CLASS 9-10 (SSC) =====
  "9::general mathematics": [
    { ch: 1, en: "Sets and Functions", bn: "সেট ও ফাংশন" },
    { ch: 2, en: "Algebraic Expressions", bn: "বীজগাণিতিক রাশি" },
    { ch: 3, en: "Equations", bn: "সমীকরণ" },
    { ch: 4, en: "Inequalities", bn: "অসমতা" },
    { ch: 5, en: "Ratio, Proportion and Variation", bn: "অনুপাত, সমানুপাত ও ভেদ" },
    { ch: 6, en: "Indices and Logarithms", bn: "সূচক ও লগারিদম" },
    { ch: 7, en: "Practical Geometry", bn: "ব্যবহারিক জ্যামিতি" },
    { ch: 8, en: "Circle", bn: "বৃত্ত" },
    { ch: 9, en: "Trigonometric Ratios", bn: "ত্রিকোণমিতিক অনুপাত" },
    { ch: 10, en: "Mensuration", bn: "পরিমিতি" },
    { ch: 11, en: "Statistics and Probability", bn: "পরিসংখ্যান ও সম্ভাবনা" },
    { ch: 12, en: "Finite Series", bn: "সসীম ধারা" },
    { ch: 13, en: "Lines, Angles and Triangles", bn: "রেখা, কোণ ও ত্রিভুজ" },
  ],
  "10::general mathematics": [
    { ch: 1, en: "Sets and Functions", bn: "সেট ও ফাংশন" },
    { ch: 2, en: "Algebraic Expressions", bn: "বীজগাণিতিক রাশি" },
    { ch: 3, en: "Equations", bn: "সমীকরণ" },
    { ch: 4, en: "Inequalities", bn: "অসমতা" },
    { ch: 5, en: "Ratio, Proportion and Variation", bn: "অনুপাত, সমানুপাত ও ভেদ" },
    { ch: 6, en: "Indices and Logarithms", bn: "সূচক ও লগারিদম" },
    { ch: 7, en: "Practical Geometry", bn: "ব্যবহারিক জ্যামিতি" },
    { ch: 8, en: "Circle", bn: "বৃত্ত" },
    { ch: 9, en: "Trigonometric Ratios", bn: "ত্রিকোণমিতিক অনুপাত" },
    { ch: 10, en: "Mensuration", bn: "পরিমিতি" },
    { ch: 11, en: "Statistics and Probability", bn: "পরিসংখ্যান ও সম্ভাবনা" },
    { ch: 12, en: "Finite Series", bn: "সসীম ধারা" },
    { ch: 13, en: "Lines, Angles and Triangles", bn: "রেখা, কোণ ও ত্রিভুজ" },
  ],
  "9::physics": [
    { ch: 1, en: "Physical Quantities and Measurement", bn: "ভৌত রাশি ও পরিমাপ" },
    { ch: 2, en: "Motion", bn: "গতি" },
    { ch: 3, en: "Force", bn: "বল" },
    { ch: 4, en: "Work, Power and Energy", bn: "কাজ, ক্ষমতা ও শক্তি" },
    { ch: 5, en: "States of Matter and Pressure", bn: "পদার্থের অবস্থা ও চাপ" },
    { ch: 6, en: "Effects of Heat", bn: "তাপের প্রভাব" },
    { ch: 7, en: "Waves and Sound", bn: "তরঙ্গ ও শব্দ" },
    { ch: 8, en: "Light", bn: "আলো" },
    { ch: 9, en: "Static Electricity", bn: "স্থির বিদ্যুৎ" },
    { ch: 10, en: "Current Electricity", bn: "চল বিদ্যুৎ" },
    { ch: 11, en: "Magnetism", bn: "চুম্বকত্ব" },
    { ch: 12, en: "Modern Physics and Electronics", bn: "আধুনিক পদার্থবিজ্ঞান ও ইলেকট্রনিক্স" },
  ],
  "10::physics": [
    { ch: 1, en: "Physical Quantities and Measurement", bn: "ভৌত রাশি ও পরিমাপ" },
    { ch: 2, en: "Motion", bn: "গতি" },
    { ch: 3, en: "Force", bn: "বল" },
    { ch: 4, en: "Work, Power and Energy", bn: "কাজ, ক্ষমতা ও শক্তি" },
    { ch: 5, en: "States of Matter and Pressure", bn: "পদার্থের অবস্থা ও চাপ" },
    { ch: 6, en: "Effects of Heat", bn: "তাপের প্রভাব" },
    { ch: 7, en: "Waves and Sound", bn: "তরঙ্গ ও শব্দ" },
    { ch: 8, en: "Light", bn: "আলো" },
    { ch: 9, en: "Static Electricity", bn: "স্থির বিদ্যুৎ" },
    { ch: 10, en: "Current Electricity", bn: "চল বিদ্যুৎ" },
    { ch: 11, en: "Magnetism", bn: "চুম্বকত্ব" },
    { ch: 12, en: "Modern Physics and Electronics", bn: "আধুনিক পদার্থবিজ্ঞান ও ইলেকট্রনিক্স" },
  ],
  "9::chemistry": [
    { ch: 1, en: "Chemistry and Its Importance", bn: "রসায়নের ধারণা ও এর গুরুত্ব" },
    { ch: 2, en: "States of Matter", bn: "পদার্থের অবস্থা" },
    { ch: 3, en: "Structure of Atom", bn: "পরমাণুর গঠন" },
    { ch: 4, en: "Periodic Table", bn: "পর্যায় সারণি" },
    { ch: 5, en: "Chemical Bond", bn: "রাসায়নিক বন্ধন" },
    { ch: 6, en: "Chemical Reaction", bn: "রাসায়নিক বিক্রিয়া" },
    { ch: 7, en: "Chemical Calculations", bn: "রাসায়নিক গণনা" },
    { ch: 8, en: "Electrolysis", bn: "তড়িৎ বিশ্লেষণ" },
    { ch: 9, en: "Acids, Bases and Salts", bn: "এসিড, ক্ষারক ও লবণ" },
    { ch: 10, en: "Organic Chemistry Introduction", bn: "জৈব রসায়ন পরিচিতি" },
    { ch: 11, en: "Mining and Metallurgy", bn: "খনিজ ও ধাতুবিদ্যা" },
    { ch: 12, en: "Chemistry in Everyday Life", bn: "দৈনন্দিন জীবনে রসায়ন" },
  ],
  "10::chemistry": [
    { ch: 1, en: "Chemistry and Its Importance", bn: "রসায়নের ধারণা ও এর গুরুত্ব" },
    { ch: 2, en: "States of Matter", bn: "পদার্থের অবস্থা" },
    { ch: 3, en: "Structure of Atom", bn: "পরমাণুর গঠন" },
    { ch: 4, en: "Periodic Table", bn: "পর্যায় সারণি" },
    { ch: 5, en: "Chemical Bond", bn: "রাসায়নিক বন্ধন" },
    { ch: 6, en: "Chemical Reaction", bn: "রাসায়নিক বিক্রিয়া" },
    { ch: 7, en: "Chemical Calculations", bn: "রাসায়নিক গণনা" },
    { ch: 8, en: "Electrolysis", bn: "তড়িৎ বিশ্লেষণ" },
    { ch: 9, en: "Acids, Bases and Salts", bn: "এসিড, ক্ষারক ও লবণ" },
    { ch: 10, en: "Organic Chemistry Introduction", bn: "জৈব রসায়ন পরিচিতি" },
    { ch: 11, en: "Mining and Metallurgy", bn: "খনিজ ও ধাতুবিদ্যা" },
    { ch: 12, en: "Chemistry in Everyday Life", bn: "দৈনন্দিন জীবনে রসায়ন" },
  ],
  "9::biology": [
    { ch: 1, en: "Lessons from Biology", bn: "জীববিজ্ঞান পাঠ" },
    { ch: 2, en: "Cell and Cell Division", bn: "কোষ ও কোষ বিভাজন" },
    { ch: 3, en: "Cell Chemistry", bn: "কোষ রসায়ন" },
    { ch: 4, en: "Classification of Living Organisms", bn: "জীবের শ্রেণিবিন্যাস" },
    { ch: 5, en: "Bacteria and Viruses", bn: "ব্যাকটেরিয়া ও ভাইরাস" },
    { ch: 6, en: "Bryophyta and Pteridophyta", bn: "ব্রায়োফাইটা ও টেরিডোফাইটা" },
    { ch: 7, en: "Gymnosperms and Angiosperms", bn: "নগ্নবীজী ও আবৃতবীজী উদ্ভিদ" },
    { ch: 8, en: "Plant Physiology", bn: "উদ্ভিদ শারীরতত্ত্ব" },
    { ch: 9, en: "Animal Diversity", bn: "প্রাণীর বৈচিত্র্য" },
    { ch: 10, en: "Human Physiology", bn: "মানব শারীরতত্ত্ব" },
    { ch: 11, en: "Genetics and Evolution", bn: "জিনতত্ত্ব ও বিবর্তন" },
    { ch: 12, en: "Ecology", bn: "বাস্তুবিদ্যা" },
  ],
  "10::biology": [
    { ch: 1, en: "Lessons from Biology", bn: "জীববিজ্ঞান পাঠ" },
    { ch: 2, en: "Cell and Cell Division", bn: "কোষ ও কোষ বিভাজন" },
    { ch: 3, en: "Cell Chemistry", bn: "কোষ রসায়ন" },
    { ch: 4, en: "Classification of Living Organisms", bn: "জীবের শ্রেণিবিন্যাস" },
    { ch: 5, en: "Bacteria and Viruses", bn: "ব্যাকটেরিয়া ও ভাইরাস" },
    { ch: 6, en: "Bryophyta and Pteridophyta", bn: "ব্রায়োফাইটা ও টেরিডোফাইটা" },
    { ch: 7, en: "Gymnosperms and Angiosperms", bn: "নগ্নবীজী ও আবৃতবীজী উদ্ভিদ" },
    { ch: 8, en: "Plant Physiology", bn: "উদ্ভিদ শারীরতত্ত্ব" },
    { ch: 9, en: "Animal Diversity", bn: "প্রাণীর বৈচিত্র্য" },
    { ch: 10, en: "Human Physiology", bn: "মানব শারীরতত্ত্ব" },
    { ch: 11, en: "Genetics and Evolution", bn: "জিনতত্ত্ব ও বিবর্তন" },
    { ch: 12, en: "Ecology", bn: "বাস্তুবিদ্যা" },
  ],
  "9::higher mathematics": [
    { ch: 1, en: "Sets and Functions", bn: "সেট ও ফাংশন" },
    { ch: 2, en: "Algebraic Expressions", bn: "বীজগাণিতিক রাশি" },
    { ch: 3, en: "Indices and Logarithms", bn: "সূচক ও লগারিদম" },
    { ch: 4, en: "Equations", bn: "সমীকরণ" },
    { ch: 5, en: "Sequence and Series", bn: "অনুক্রম ও ধারা" },
    { ch: 6, en: "Geometry", bn: "জ্যামিতি" },
    { ch: 7, en: "Trigonometry", bn: "ত্রিকোণমিতি" },
    { ch: 8, en: "Vectors", bn: "ভেক্টর" },
    { ch: 9, en: "Coordinate Geometry", bn: "স্থানাংক জ্যামিতি" },
    { ch: 10, en: "Probability", bn: "সম্ভাবনা" },
    { ch: 11, en: "Matrix and Determinant", bn: "ম্যাট্রিক্স ও নির্ণায়ক" },
  ],
  "10::higher mathematics": [
    { ch: 1, en: "Sets and Functions", bn: "সেট ও ফাংশন" },
    { ch: 2, en: "Algebraic Expressions", bn: "বীজগাণিতিক রাশি" },
    { ch: 3, en: "Indices and Logarithms", bn: "সূচক ও লগারিদম" },
    { ch: 4, en: "Equations", bn: "সমীকরণ" },
    { ch: 5, en: "Sequence and Series", bn: "অনুক্রম ও ধারা" },
    { ch: 6, en: "Geometry", bn: "জ্যামিতি" },
    { ch: 7, en: "Trigonometry", bn: "ত্রিকোণমিতি" },
    { ch: 8, en: "Vectors", bn: "ভেক্টর" },
    { ch: 9, en: "Coordinate Geometry", bn: "স্থানাংক জ্যামিতি" },
    { ch: 10, en: "Probability", bn: "সম্ভাবনা" },
    { ch: 11, en: "Matrix and Determinant", bn: "ম্যাট্রিক্স ও নির্ণায়ক" },
  ],
  "9::accounting": [
    { ch: 1, en: "Concept and Scope of Accounting", bn: "হিসাববিজ্ঞানের ধারণা ও পরিধি" },
    { ch: 2, en: "Transactions and Events", bn: "লেনদেন ও ঘটনা" },
    { ch: 3, en: "Double Entry System", bn: "দুতরফা দাখিলা পদ্ধতি" },
    { ch: 4, en: "Journal", bn: "জাবেদা" },
    { ch: 5, en: "Ledger", bn: "খতিয়ান" },
    { ch: 6, en: "Cash Book", bn: "নগদান বই" },
    { ch: 7, en: "Trial Balance", bn: "রেওয়ামিল" },
    { ch: 8, en: "Financial Statements", bn: "আর্থিক বিবরণী" },
    { ch: 9, en: "Bank Reconciliation", bn: "ব্যাংক সমন্বয় বিবরণী" },
    { ch: 10, en: "Depreciation", bn: "অবচয়" },
  ],
  "10::accounting": [
    { ch: 1, en: "Concept and Scope of Accounting", bn: "হিসাববিজ্ঞানের ধারণা ও পরিধি" },
    { ch: 2, en: "Transactions and Events", bn: "লেনদেন ও ঘটনা" },
    { ch: 3, en: "Double Entry System", bn: "দুতরফা দাখিলা পদ্ধতি" },
    { ch: 4, en: "Journal", bn: "জাবেদা" },
    { ch: 5, en: "Ledger", bn: "খতিয়ান" },
    { ch: 6, en: "Cash Book", bn: "নগদান বই" },
    { ch: 7, en: "Trial Balance", bn: "রেওয়ামিল" },
    { ch: 8, en: "Financial Statements", bn: "আর্থিক বিবরণী" },
    { ch: 9, en: "Bank Reconciliation", bn: "ব্যাংক সমন্বয় বিবরণী" },
    { ch: 10, en: "Depreciation", bn: "অবচয়" },
  ],
  "9::bangladesh & global studies": [
    { ch: 1, en: "East Bengal from 1947 to 1970", bn: "১৯৪৭ থেকে ১৯৭০ পর্যন্ত পূর্ববাংলা" },
    { ch: 2, en: "Liberation War of Bangladesh", bn: "বাংলাদেশের মুক্তিযুদ্ধ" },
    { ch: 3, en: "Independent Bangladesh", bn: "স্বাধীন বাংলাদেশ" },
    { ch: 4, en: "Government and Politics", bn: "সরকার ও রাজনীতি" },
    { ch: 5, en: "Bangladesh Economy", bn: "বাংলাদেশের অর্থনীতি" },
    { ch: 6, en: "Society and Culture", bn: "সমাজ ও সংস্কৃতি" },
    { ch: 7, en: "Contemporary World and Bangladesh", bn: "সমকালীন বিশ্ব ও বাংলাদেশ" },
  ],
  "10::bangladesh & global studies": [
    { ch: 1, en: "East Bengal from 1947 to 1970", bn: "১৯৪৭ থেকে ১৯৭০ পর্যন্ত পূর্ববাংলা" },
    { ch: 2, en: "Liberation War of Bangladesh", bn: "বাংলাদেশের মুক্তিযুদ্ধ" },
    { ch: 3, en: "Independent Bangladesh", bn: "স্বাধীন বাংলাদেশ" },
    { ch: 4, en: "Government and Politics", bn: "সরকার ও রাজনীতি" },
    { ch: 5, en: "Bangladesh Economy", bn: "বাংলাদেশের অর্থনীতি" },
    { ch: 6, en: "Society and Culture", bn: "সমাজ ও সংস্কৃতি" },
    { ch: 7, en: "Contemporary World and Bangladesh", bn: "সমকালীন বিশ্ব ও বাংলাদেশ" },
  ],

  // ===== HSC (Class 11-12) =====
  "11::physics 1st paper": [
    { ch: 1, en: "Physical World and Measurement", bn: "ভৌত জগৎ ও পরিমাপ" },
    { ch: 2, en: "Vectors", bn: "ভেক্টর" },
    { ch: 3, en: "Kinematics", bn: "গতিবিদ্যা" },
    { ch: 4, en: "Newton's Laws of Motion", bn: "নিউটনের গতিসূত্র" },
    { ch: 5, en: "Work, Energy and Power", bn: "কাজ, শক্তি ও ক্ষমতা" },
    { ch: 6, en: "Gravitation", bn: "মহাকর্ষ ও অভিকর্ষ" },
    { ch: 7, en: "Stress and Strain", bn: "পীড়ন ও বিকৃতি" },
    { ch: 8, en: "Periodic Motion", bn: "পর্যাবৃত্ত গতি" },
    { ch: 9, en: "Waves", bn: "তরঙ্গ" },
    { ch: 10, en: "Ideal Gas and Kinetic Theory", bn: "আদর্শ গ্যাস ও গতিতত্ত্ব" },
  ],
  "12::physics 1st paper": [
    { ch: 1, en: "Physical World and Measurement", bn: "ভৌত জগৎ ও পরিমাপ" },
    { ch: 2, en: "Vectors", bn: "ভেক্টর" },
    { ch: 3, en: "Kinematics", bn: "গতিবিদ্যা" },
    { ch: 4, en: "Newton's Laws of Motion", bn: "নিউটনের গতিসূত্র" },
    { ch: 5, en: "Work, Energy and Power", bn: "কাজ, শক্তি ও ক্ষমতা" },
    { ch: 6, en: "Gravitation", bn: "মহাকর্ষ ও অভিকর্ষ" },
    { ch: 7, en: "Stress and Strain", bn: "পীড়ন ও বিকৃতি" },
    { ch: 8, en: "Periodic Motion", bn: "পর্যাবৃত্ত গতি" },
    { ch: 9, en: "Waves", bn: "তরঙ্গ" },
    { ch: 10, en: "Ideal Gas and Kinetic Theory", bn: "আদর্শ গ্যাস ও গতিতত্ত্ব" },
  ],
  "11::physics 2nd paper": [
    { ch: 1, en: "Heat and Thermodynamics", bn: "তাপ ও তাপগতিবিদ্যা" },
    { ch: 2, en: "Static Electricity", bn: "স্থির বিদ্যুৎ" },
    { ch: 3, en: "Current Electricity", bn: "চল বিদ্যুৎ" },
    { ch: 4, en: "Magnetic Effect of Current", bn: "তড়িতের চৌম্বক ক্রিয়া" },
    { ch: 5, en: "Electromagnetic Induction", bn: "তাড়িতচুম্বকীয় আবেশ" },
    { ch: 6, en: "Alternating Current", bn: "পরিবর্তী প্রবাহ" },
    { ch: 7, en: "Geometric Optics", bn: "জ্যামিতিক আলোকবিজ্ঞান" },
    { ch: 8, en: "Physical Optics", bn: "ভৌত আলোকবিজ্ঞান" },
    { ch: 9, en: "Modern Physics", bn: "আধুনিক পদার্থবিজ্ঞান" },
    { ch: 10, en: "Semiconductor and Electronics", bn: "অর্ধপরিবাহী ও ইলেকট্রনিক্স" },
    { ch: 11, en: "Nuclear Physics", bn: "নিউক্লিয়ার পদার্থবিজ্ঞান" },
  ],
  "12::physics 2nd paper": [
    { ch: 1, en: "Heat and Thermodynamics", bn: "তাপ ও তাপগতিবিদ্যা" },
    { ch: 2, en: "Static Electricity", bn: "স্থির বিদ্যুৎ" },
    { ch: 3, en: "Current Electricity", bn: "চল বিদ্যুৎ" },
    { ch: 4, en: "Magnetic Effect of Current", bn: "তড়িতের চৌম্বক ক্রিয়া" },
    { ch: 5, en: "Electromagnetic Induction", bn: "তাড়িতচুম্বকীয় আবেশ" },
    { ch: 6, en: "Alternating Current", bn: "পরিবর্তী প্রবাহ" },
    { ch: 7, en: "Geometric Optics", bn: "জ্যামিতিক আলোকবিজ্ঞান" },
    { ch: 8, en: "Physical Optics", bn: "ভৌত আলোকবিজ্ঞান" },
    { ch: 9, en: "Modern Physics", bn: "আধুনিক পদার্থবিজ্ঞান" },
    { ch: 10, en: "Semiconductor and Electronics", bn: "অর্ধপরিবাহী ও ইলেকট্রনিক্স" },
    { ch: 11, en: "Nuclear Physics", bn: "নিউক্লিয়ার পদার্থবিজ্ঞান" },
  ],
  "11::chemistry 1st paper": [
    { ch: 1, en: "Safety in Chemistry Lab", bn: "রসায়ন পরীক্ষাগারে নিরাপত্তা" },
    { ch: 2, en: "Qualitative Chemistry", bn: "গুণগত রসায়ন" },
    { ch: 3, en: "Atomic Structure", bn: "পরমাণুর গঠন" },
    { ch: 4, en: "Periodic Table and Properties", bn: "পর্যায় সারণি ও মৌলের ধর্ম" },
    { ch: 5, en: "Chemical Bond", bn: "রাসায়নিক বন্ধন" },
    { ch: 6, en: "Chemical Calculations", bn: "রাসায়নিক গণনা" },
    { ch: 7, en: "States of Matter: Gas", bn: "পদার্থের অবস্থা: গ্যাস" },
    { ch: 8, en: "Chemical Equilibrium", bn: "রাসায়নিক সাম্যাবস্থা" },
    { ch: 9, en: "Acid-Base Equilibrium", bn: "এসিড-ক্ষার সাম্যাবস্থা" },
  ],
  "12::chemistry 1st paper": [
    { ch: 1, en: "Safety in Chemistry Lab", bn: "রসায়ন পরীক্ষাগারে নিরাপত্তা" },
    { ch: 2, en: "Qualitative Chemistry", bn: "গুণগত রসায়ন" },
    { ch: 3, en: "Atomic Structure", bn: "পরমাণুর গঠন" },
    { ch: 4, en: "Periodic Table and Properties", bn: "পর্যায় সারণি ও মৌলের ধর্ম" },
    { ch: 5, en: "Chemical Bond", bn: "রাসায়নিক বন্ধন" },
    { ch: 6, en: "Chemical Calculations", bn: "রাসায়নিক গণনা" },
    { ch: 7, en: "States of Matter: Gas", bn: "পদার্থের অবস্থা: গ্যাস" },
    { ch: 8, en: "Chemical Equilibrium", bn: "রাসায়নিক সাম্যাবস্থা" },
    { ch: 9, en: "Acid-Base Equilibrium", bn: "এসিড-ক্ষার সাম্যাবস্থা" },
  ],
  "11::chemistry 2nd paper": [
    { ch: 1, en: "Environmental Chemistry", bn: "পরিবেশ রসায়ন" },
    { ch: 2, en: "Quantitative Chemistry", bn: "পরিমাণগত রসায়ন" },
    { ch: 3, en: "Electrochemistry", bn: "তড়িৎ রসায়ন" },
    { ch: 4, en: "Economic Chemistry", bn: "অর্থনৈতিক রসায়ন" },
    { ch: 5, en: "Organic Chemistry", bn: "জৈব রসায়ন" },
    { ch: 6, en: "Hydrocarbons", bn: "হাইড্রোকার্বন" },
    { ch: 7, en: "Organic Halogen Compounds", bn: "জৈব হ্যালোজেন যৌগ" },
    { ch: 8, en: "Alcohols, Phenols and Ethers", bn: "অ্যালকোহল, ফেনল ও ইথার" },
    { ch: 9, en: "Aldehydes, Ketones and Carboxylic Acids", bn: "অ্যালডিহাইড, কিটোন ও কার্বক্সিলিক এসিড" },
  ],
  "12::chemistry 2nd paper": [
    { ch: 1, en: "Environmental Chemistry", bn: "পরিবেশ রসায়ন" },
    { ch: 2, en: "Quantitative Chemistry", bn: "পরিমাণগত রসায়ন" },
    { ch: 3, en: "Electrochemistry", bn: "তড়িৎ রসায়ন" },
    { ch: 4, en: "Economic Chemistry", bn: "অর্থনৈতিক রসায়ন" },
    { ch: 5, en: "Organic Chemistry", bn: "জৈব রসায়ন" },
    { ch: 6, en: "Hydrocarbons", bn: "হাইড্রোকার্বন" },
    { ch: 7, en: "Organic Halogen Compounds", bn: "জৈব হ্যালোজেন যৌগ" },
    { ch: 8, en: "Alcohols, Phenols and Ethers", bn: "অ্যালকোহল, ফেনল ও ইথার" },
    { ch: 9, en: "Aldehydes, Ketones and Carboxylic Acids", bn: "অ্যালডিহাইড, কিটোন ও কার্বক্সিলিক এসিড" },
  ],
  "11::biology 1st paper": [
    { ch: 1, en: "Cell Biology", bn: "কোষবিজ্ঞান" },
    { ch: 2, en: "Cell Division", bn: "কোষ বিভাজন" },
    { ch: 3, en: "Cell Chemistry", bn: "কোষ রসায়ন" },
    { ch: 4, en: "Microorganisms", bn: "অণুজীব" },
    { ch: 5, en: "Plant Taxonomy", bn: "উদ্ভিদ শ্রেণিবিন্যাস" },
    { ch: 6, en: "Bryophytes and Pteridophytes", bn: "ব্রায়োফাইটা ও টেরিডোফাইটা" },
    { ch: 7, en: "Seed Plants", bn: "বীজ উদ্ভিদ" },
    { ch: 8, en: "Plant Anatomy", bn: "উদ্ভিদ অঙ্গসংস্থানবিদ্যা" },
    { ch: 9, en: "Plant Physiology", bn: "উদ্ভিদ শারীরবিদ্যা" },
    { ch: 10, en: "Plant Reproduction", bn: "উদ্ভিদের প্রজনন" },
    { ch: 11, en: "Plant Ecology", bn: "উদ্ভিদ বাস্তুবিদ্যা" },
    { ch: 12, en: "Biotechnology", bn: "জীবপ্রযুক্তি" },
  ],
  "12::biology 1st paper": [
    { ch: 1, en: "Cell Biology", bn: "কোষবিজ্ঞান" },
    { ch: 2, en: "Cell Division", bn: "কোষ বিভাজন" },
    { ch: 3, en: "Cell Chemistry", bn: "কোষ রসায়ন" },
    { ch: 4, en: "Microorganisms", bn: "অণুজীব" },
    { ch: 5, en: "Plant Taxonomy", bn: "উদ্ভিদ শ্রেণিবিন্যাস" },
    { ch: 6, en: "Bryophytes and Pteridophytes", bn: "ব্রায়োফাইটা ও টেরিডোফাইটা" },
    { ch: 7, en: "Seed Plants", bn: "বীজ উদ্ভিদ" },
    { ch: 8, en: "Plant Anatomy", bn: "উদ্ভিদ অঙ্গসংস্থানবিদ্যা" },
    { ch: 9, en: "Plant Physiology", bn: "উদ্ভিদ শারীরবিদ্যা" },
    { ch: 10, en: "Plant Reproduction", bn: "উদ্ভিদের প্রজনন" },
    { ch: 11, en: "Plant Ecology", bn: "উদ্ভিদ বাস্তুবিদ্যা" },
    { ch: 12, en: "Biotechnology", bn: "জীবপ্রযুক্তি" },
  ],
  "11::biology 2nd paper": [
    { ch: 1, en: "Animal Diversity and Classification", bn: "প্রাণীর বৈচিত্র্য ও শ্রেণিবিন্যাস" },
    { ch: 2, en: "Animal Identification", bn: "প্রাণী পরিচিতি" },
    { ch: 3, en: "Human Physiology: Digestion", bn: "মানব শরীরতত্ত্ব: পরিপাক" },
    { ch: 4, en: "Human Physiology: Blood & Circulation", bn: "মানব শরীরতত্ত্ব: রক্ত ও সংবহন" },
    { ch: 5, en: "Human Physiology: Respiration", bn: "মানব শরীরতত্ত্ব: শ্বসন" },
    { ch: 6, en: "Human Physiology: Excretion", bn: "মানব শরীরতত্ত্ব: রেচন" },
    { ch: 7, en: "Human Physiology: Nervous System", bn: "মানব শরীরতত্ত্ব: স্নায়ুতন্ত্র" },
    { ch: 8, en: "Human Physiology: Movement", bn: "মানব শরীরতত্ত্ব: চলন" },
    { ch: 9, en: "Genetics and Heredity", bn: "জিনতত্ত্ব ও বংশগতি" },
    { ch: 10, en: "Evolution", bn: "বিবর্তন" },
    { ch: 11, en: "Animal Behavior", bn: "প্রাণীর আচরণ" },
  ],
  "12::biology 2nd paper": [
    { ch: 1, en: "Animal Diversity and Classification", bn: "প্রাণীর বৈচিত্র্য ও শ্রেণিবিন্যাস" },
    { ch: 2, en: "Animal Identification", bn: "প্রাণী পরিচিতি" },
    { ch: 3, en: "Human Physiology: Digestion", bn: "মানব শরীরতত্ত্ব: পরিপাক" },
    { ch: 4, en: "Human Physiology: Blood & Circulation", bn: "মানব শরীরতত্ত্ব: রক্ত ও সংবহন" },
    { ch: 5, en: "Human Physiology: Respiration", bn: "মানব শরীরতত্ত্ব: শ্বসন" },
    { ch: 6, en: "Human Physiology: Excretion", bn: "মানব শরীরতত্ত্ব: রেচন" },
    { ch: 7, en: "Human Physiology: Nervous System", bn: "মানব শরীরতত্ত্ব: স্নায়ুতন্ত্র" },
    { ch: 8, en: "Human Physiology: Movement", bn: "মানব শরীরতত্ত্ব: চলন" },
    { ch: 9, en: "Genetics and Heredity", bn: "জিনতত্ত্ব ও বংশগতি" },
    { ch: 10, en: "Evolution", bn: "বিবর্তন" },
    { ch: 11, en: "Animal Behavior", bn: "প্রাণীর আচরণ" },
  ],
  "11::higher mathematics 1st paper": [
    { ch: 1, en: "Matrix and Determinant", bn: "ম্যাট্রিক্স ও নির্ণায়ক" },
    { ch: 2, en: "Sets and Functions", bn: "সেট ও ফাংশন" },
    { ch: 3, en: "Algebraic Equations", bn: "বীজগাণিতিক সমীকরণ" },
    { ch: 4, en: "Sequence and Series", bn: "অনুক্রম ও ধারা" },
    { ch: 5, en: "Trigonometry", bn: "ত্রিকোণমিতি" },
    { ch: 6, en: "Straight Line", bn: "সরলরেখা" },
    { ch: 7, en: "Circle", bn: "বৃত্ত" },
    { ch: 8, en: "Conic Sections", bn: "কনিক" },
    { ch: 9, en: "Limits and Continuity", bn: "সীমা ও সংযুক্তি" },
    { ch: 10, en: "Differentiation", bn: "অন্তরীকরণ" },
  ],
  "12::higher mathematics 1st paper": [
    { ch: 1, en: "Matrix and Determinant", bn: "ম্যাট্রিক্স ও নির্ণায়ক" },
    { ch: 2, en: "Sets and Functions", bn: "সেট ও ফাংশন" },
    { ch: 3, en: "Algebraic Equations", bn: "বীজগাণিতিক সমীকরণ" },
    { ch: 4, en: "Sequence and Series", bn: "অনুক্রম ও ধারা" },
    { ch: 5, en: "Trigonometry", bn: "ত্রিকোণমিতি" },
    { ch: 6, en: "Straight Line", bn: "সরলরেখা" },
    { ch: 7, en: "Circle", bn: "বৃত্ত" },
    { ch: 8, en: "Conic Sections", bn: "কনিক" },
    { ch: 9, en: "Limits and Continuity", bn: "সীমা ও সংযুক্তি" },
    { ch: 10, en: "Differentiation", bn: "অন্তরীকরণ" },
  ],
  "11::higher mathematics 2nd paper": [
    { ch: 1, en: "Integration", bn: "যোগজীকরণ" },
    { ch: 2, en: "Applications of Integration", bn: "যোগজীকরণের প্রয়োগ" },
    { ch: 3, en: "Differential Equations", bn: "অন্তরকলন সমীকরণ" },
    { ch: 4, en: "Vectors", bn: "ভেক্টর" },
    { ch: 5, en: "3D Coordinate Geometry", bn: "ত্রিমাত্রিক স্থানাংক জ্যামিতি" },
    { ch: 6, en: "Probability", bn: "সম্ভাবনা" },
    { ch: 7, en: "Statistics", bn: "পরিসংখ্যান" },
    { ch: 8, en: "Mathematical Induction", bn: "গাণিতিক আরোহ" },
    { ch: 9, en: "Complex Numbers", bn: "জটিল সংখ্যা" },
    { ch: 10, en: "Linear Programming", bn: "রৈখিক প্রোগ্রামিং" },
  ],
  "12::higher mathematics 2nd paper": [
    { ch: 1, en: "Integration", bn: "যোগজীকরণ" },
    { ch: 2, en: "Applications of Integration", bn: "যোগজীকরণের প্রয়োগ" },
    { ch: 3, en: "Differential Equations", bn: "অন্তরকলন সমীকরণ" },
    { ch: 4, en: "Vectors", bn: "ভেক্টর" },
    { ch: 5, en: "3D Coordinate Geometry", bn: "ত্রিমাত্রিক স্থানাংক জ্যামিতি" },
    { ch: 6, en: "Probability", bn: "সম্ভাবনা" },
    { ch: 7, en: "Statistics", bn: "পরিসংখ্যান" },
    { ch: 8, en: "Mathematical Induction", bn: "গাণিতিক আরোহ" },
    { ch: 9, en: "Complex Numbers", bn: "জটিল সংখ্যা" },
    { ch: 10, en: "Linear Programming", bn: "রৈখিক প্রোগ্রামিং" },
  ],
  "11::ict": [
    { ch: 1, en: "World and ICT", bn: "বিশ্ব ও তথ্যপ্রযুক্তি" },
    { ch: 2, en: "Communication Systems", bn: "কমিউনিকেশন সিস্টেম" },
    { ch: 3, en: "Number System & Digital Devices", bn: "সংখ্যা পদ্ধতি ও ডিজিটাল ডিভাইস" },
    { ch: 4, en: "Web Design (HTML)", bn: "ওয়েব ডিজাইন (এইচটিএমএল)" },
    { ch: 5, en: "Programming Language (C)", bn: "প্রোগ্রামিং ভাষা (সি)" },
    { ch: 6, en: "Database Management", bn: "ডেটাবেস ম্যানেজমেন্ট" },
  ],
  "12::ict": [
    { ch: 1, en: "World and ICT", bn: "বিশ্ব ও তথ্যপ্রযুক্তি" },
    { ch: 2, en: "Communication Systems", bn: "কমিউনিকেশন সিস্টেম" },
    { ch: 3, en: "Number System & Digital Devices", bn: "সংখ্যা পদ্ধতি ও ডিজিটাল ডিভাইস" },
    { ch: 4, en: "Web Design (HTML)", bn: "ওয়েব ডিজাইন (এইচটিএমএল)" },
    { ch: 5, en: "Programming Language (C)", bn: "প্রোগ্রামিং ভাষা (সি)" },
    { ch: 6, en: "Database Management", bn: "ডেটাবেস ম্যানেজমেন্ট" },
  ],
  "11::accounting 1st paper": [
    { ch: 1, en: "Nature and Scope of Accounting", bn: "হিসাববিজ্ঞানের প্রকৃতি ও পরিধি" },
    { ch: 2, en: "Transactions Analysis", bn: "লেনদেন বিশ্লেষণ" },
    { ch: 3, en: "Double Entry Bookkeeping", bn: "দুতরফা দাখিলা পদ্ধতি" },
    { ch: 4, en: "Journal and Ledger", bn: "জাবেদা ও খতিয়ান" },
    { ch: 5, en: "Subsidiary Books", bn: "সহায়ক বই" },
    { ch: 6, en: "Cash Book and Bank Reconciliation", bn: "নগদান বই ও ব্যাংক সমন্বয়" },
    { ch: 7, en: "Trial Balance and Errors", bn: "রেওয়ামিল ও ভুল সংশোধন" },
    { ch: 8, en: "Adjusting Entries", bn: "সমন্বয় দাখিলা" },
    { ch: 9, en: "Financial Statements of Sole Trader", bn: "একমালিকানা ব্যবসায়ের আর্থিক বিবরণী" },
  ],
  "12::accounting 1st paper": [
    { ch: 1, en: "Nature and Scope of Accounting", bn: "হিসাববিজ্ঞানের প্রকৃতি ও পরিধি" },
    { ch: 2, en: "Transactions Analysis", bn: "লেনদেন বিশ্লেষণ" },
    { ch: 3, en: "Double Entry Bookkeeping", bn: "দুতরফা দাখিলা পদ্ধতি" },
    { ch: 4, en: "Journal and Ledger", bn: "জাবেদা ও খতিয়ান" },
    { ch: 5, en: "Subsidiary Books", bn: "সহায়ক বই" },
    { ch: 6, en: "Cash Book and Bank Reconciliation", bn: "নগদান বই ও ব্যাংক সমন্বয়" },
    { ch: 7, en: "Trial Balance and Errors", bn: "রেওয়ামিল ও ভুল সংশোধন" },
    { ch: 8, en: "Adjusting Entries", bn: "সমন্বয় দাখিলা" },
    { ch: 9, en: "Financial Statements of Sole Trader", bn: "একমালিকানা ব্যবসায়ের আর্থিক বিবরণী" },
  ],
  "11::accounting 2nd paper": [
    { ch: 1, en: "Partnership Accounting", bn: "অংশীদারি ব্যবসায়ের হিসাব" },
    { ch: 2, en: "Admission of Partner", bn: "অংশীদারের প্রবেশ" },
    { ch: 3, en: "Retirement and Death of Partner", bn: "অংশীদারের অবসর ও মৃত্যু" },
    { ch: 4, en: "Dissolution of Partnership", bn: "অংশীদারি ব্যবসায়ের বিলোপ" },
    { ch: 5, en: "Company Accounts: Share", bn: "কোম্পানির হিসাব: শেয়ার" },
    { ch: 6, en: "Company Accounts: Debenture", bn: "কোম্পানির হিসাব: ঋণপত্র" },
    { ch: 7, en: "Company Financial Statements", bn: "কোম্পানির আর্থিক বিবরণী" },
    { ch: 8, en: "Cost Accounting Basics", bn: "ব্যয় হিসাববিজ্ঞানের মৌলিক ধারণা" },
  ],
  "12::accounting 2nd paper": [
    { ch: 1, en: "Partnership Accounting", bn: "অংশীদারি ব্যবসায়ের হিসাব" },
    { ch: 2, en: "Admission of Partner", bn: "অংশীদারের প্রবেশ" },
    { ch: 3, en: "Retirement and Death of Partner", bn: "অংশীদারের অবসর ও মৃত্যু" },
    { ch: 4, en: "Dissolution of Partnership", bn: "অংশীদারি ব্যবসায়ের বিলোপ" },
    { ch: 5, en: "Company Accounts: Share", bn: "কোম্পানির হিসাব: শেয়ার" },
    { ch: 6, en: "Company Accounts: Debenture", bn: "কোম্পানির হিসাব: ঋণপত্র" },
    { ch: 7, en: "Company Financial Statements", bn: "কোম্পানির আর্থিক বিবরণী" },
    { ch: 8, en: "Cost Accounting Basics", bn: "ব্যয় হিসাববিজ্ঞানের মৌলিক ধারণা" },
  ],
};

// Lookup function: tries multiple key patterns to find matching NCTB chapter data
function findNctbChapters(classLevel: string, subjectName: string): { ch: number; en: string; bn: string }[] | null {
  const cl = classLevel.toString().toLowerCase().replace("class ", "").replace("hsc", "11").replace("ssc", "9");
  const subLower = subjectName.toLowerCase().trim();
  
  // Direct lookup
  const key1 = `${cl}::${subLower}`;
  if (NCTB_CHAPTERS[key1]) return NCTB_CHAPTERS[key1];
  
  // Try without "1st paper"/"2nd paper" suffixes for class 9-10
  // Try with common aliases
  const aliases: Record<string, string[]> = {
    "bangla 1st paper": ["bangla"],
    "bangla 2nd paper": ["bangla"],
    "english 1st paper": ["english"],
    "english 2nd paper": ["english"],
    "general math": ["general mathematics"],
    "math": ["mathematics"],
    "maths": ["mathematics"],
  };
  
  for (const [alias, targets] of Object.entries(aliases)) {
    if (subLower === alias || subLower.includes(alias)) {
      for (const t of targets) {
        const k = `${cl}::${t}`;
        if (NCTB_CHAPTERS[k]) return NCTB_CHAPTERS[k];
      }
    }
  }
  
  return null;
}

// ==================== MAIN HANDLER ====================

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const authClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const bodyText = await req.text();
    if (new TextEncoder().encode(bodyText).length > 50 * 1024) {
      return new Response(JSON.stringify({ error: "Payload too large" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { classLevel, subjectName, board, language, depth, extraModules, existingModules, startModuleNumber, moduleCount, subject } = JSON.parse(bodyText);
    if (!classLevel || typeof classLevel !== "string" || classLevel.length > 50) {
      return new Response(JSON.stringify({ error: "Invalid classLevel" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const actualSubject = subjectName || subject;
    if (!actualSubject || typeof actualSubject !== "string" || actualSubject.length > 200) {
      return new Response(JSON.stringify({ error: "Invalid subject" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
    if (!OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const lang = language === "bn" ? "Bangla" : "English";
    const boardVal = board || "General";
    const depthLevel = depth || "standard";

    // Extra modules generation (skip cache)
    if (extraModules && existingModules?.length > 0) {
      const numToGen = moduleCount || 3;
      const startNum = startModuleNumber || existingModules.length + 1;
      
      const extraResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${OPENROUTER_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content: `You are a curriculum designer. Generate ${numToGen} NEW modules for "${actualSubject}" (Class ${classLevel}).
Existing modules: ${JSON.stringify(existingModules)}
Generate ${numToGen} new modules covering ADVANCED topics not yet covered. Start numbering from ${startNum}.
Return JSON: { "modules": [ { "module_number": ${startNum}, "title": "...", "hook": "...", "objectives": [...], "key_concepts": [...], "lesson_titles": [...], "difficulty": "medium|hard", "estimated_hours": 4, "industry_connection": "...", "common_mistakes": "...", "insider_tip": "..." } ] }
Return ONLY JSON, no markdown.`
            },
            { role: "user", content: `Generate ${numToGen} additional modules for ${actualSubject}.` }
          ],
          max_tokens: 4000,
        }),
      });

      if (!extraResponse.ok) throw new Error(`AI error: ${extraResponse.status}`);
      const extraData = await extraResponse.json();
      const extraContent = extraData.choices?.[0]?.message?.content || "{}";
      let parsed;
      try {
        parsed = JSON.parse(extraContent.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim());
      } catch { parsed = { modules: [] }; }

      return new Response(JSON.stringify({ modules: parsed.modules || [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check cache
    const { data: cached } = await supabase
      .from("generated_courses")
      .select("chapters")
      .eq("class_level", classLevel)
      .eq("subject_name", actualSubject)
      .eq("board", boardVal)
      .eq("language", language)
      .maybeSingle();

    if (cached?.chapters && typeof cached.chapters === "object" && (cached.chapters as any).course_overview) {
      return new Response(JSON.stringify({ course: cached.chapters, cached: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Look up hardcoded NCTB chapters
    const nctbRef = findNctbChapters(classLevel, actualSubject);
    
    // Build the chapter reference instruction
    let chapterInstruction = "";
    if (nctbRef) {
      const chapList = nctbRef.map(c => `  Chapter ${c.ch}: "${c.bn}" (${c.en})`).join("\n");
      chapterInstruction = `
⚠️ MANDATORY CHAPTER LIST — You MUST use EXACTLY these chapters in this EXACT order. Do NOT add, remove, or rename any chapter:
${chapList}

Total chapters: ${nctbRef.length}
Each module_number must match the chapter number above. Module title must be the chapter name in ${lang}.`;
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a world-class curriculum designer for the Bangladesh NCTB education system.

Language: ${lang}
Depth: ${depthLevel}
Class: ${classLevel}
Subject: ${actualSubject}
Board: ${boardVal}

${chapterInstruction}

${!nctbRef ? `Since no hardcoded reference is available for this subject, use your best knowledge of the NCTB textbook for Class ${classLevel} "${actualSubject}". Each module = one real textbook chapter in correct order.` : ""}

📦 MODULE STRUCTURE (for each chapter):
- module_number: chapter number from textbook
- title: exact NCTB chapter name in ${lang}
- hook: one compelling sentence — why this chapter matters
- objectives: 3 learning objectives
- key_concepts: 3-5 key concepts
- lesson_titles: 2-4 sub-topic lessons within this chapter
- difficulty: "easy" | "medium" | "hard"
- estimated_hours: number
- industry_connection: real-world use
- common_mistakes: typical student errors
- insider_tip: pro tip

Return this JSON structure (NO markdown, NO extra text):
{
  "course_overview": {
    "title": "Course title",
    "description": "2-3 sentences",
    "learning_outcomes": ["..."],
    "prerequisites": [],
    "target_audience": "...",
    "capstone_project": "...",
    "career_value": "...",
    "total_hours": 30,
    "module_count": ${nctbRef ? nctbRef.length : 10}
  },
  "modules": [...]
}

Guidelines:
- ${depthLevel === "beginner" ? "Keep explanations simple, use everyday language" : ""}
- ${depthLevel === "advanced" ? "Include theoretical depth, proofs, derivations" : ""}
- ${depthLevel === "research" ? "Include research perspectives, open problems" : ""}
- All content in ${lang}`
          },
          {
            role: "user",
            content: `Design the course for Class ${classLevel} — ${actualSubject} (${boardVal}, ${lang}). ${nctbRef ? `Use EXACTLY the ${nctbRef.length} chapters provided. Do NOT deviate.` : `Use official NCTB textbook chapters.`}`
          }
        ],
        max_tokens: 16000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "{}";
    
    let course;
    try {
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      course = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse AI response:", content);
      return new Response(JSON.stringify({ error: "Failed to parse course structure" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Cache result
    if (course?.modules?.length > 0) {
      await supabase.from("generated_courses").upsert({
        class_level: classLevel,
        subject_name: actualSubject,
        board: boardVal,
        language: language,
        chapters: course,
      }, { onConflict: "class_level,subject_name,board,language" });
    }

    return new Response(JSON.stringify({ course }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-course error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
