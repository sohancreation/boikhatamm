import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import SubjectsPage from "./pages/SubjectsPage";
import SubjectPage from "./pages/SubjectPage";
import DoubtSolver from "./pages/DoubtSolver";
import PricingPage from "./pages/PricingPage";
import StudyPlanPage from "./pages/StudyPlanPage";
import CareerPage from "./pages/CareerPage";
import QuizzesPage from "./pages/QuizzesPage";
import SkillsPage from "./pages/SkillsPage";
import CoursesPage from "./pages/CoursesPage";
import SmartSummaryPage from "./pages/SmartSummaryPage";
import ResumeBuilderPage from "./pages/ResumeBuilderPage";
import SlideGeneratorPage from "./pages/SlideGeneratorPage";
import ScholarshipPage from "./pages/ScholarshipPage";
import AdminPage from "./pages/AdminPage";
import MockInterviewPage from "./pages/MockInterviewPage";
import IeltsPage from "./pages/IeltsPage";
import StudyAbroadPage from "./pages/StudyAbroadPage";
import ResearchMentorPage from "./pages/ResearchMentorPage";
import ProjectHelperPage from "./pages/ProjectHelperPage";
import NotFound from "./pages/NotFound";
import AppLayout from "./components/layout/AppLayout";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <HashRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/admin" element={<AdminPage />} />
                {/* All authenticated pages use AppLayout with sidebar */}
                <Route element={<AppLayout />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/subjects" element={<SubjectsPage />} />
                  <Route path="/subjects/:subjectId" element={<SubjectPage />} />
                  <Route path="/doubt-solver" element={<DoubtSolver />} />
                  <Route path="/pricing" element={<PricingPage />} />
                  <Route path="/study-plan" element={<StudyPlanPage />} />
                  <Route path="/career" element={<CareerPage />} />
                  <Route path="/quizzes" element={<QuizzesPage />} />
                  <Route path="/skills" element={<SkillsPage />} />
                  <Route path="/courses" element={<CoursesPage />} />
                  <Route path="/smart-summary" element={<SmartSummaryPage />} />
                  <Route path="/resume-builder" element={<ResumeBuilderPage />} />
                  <Route path="/slide-generator" element={<SlideGeneratorPage />} />
                  <Route path="/scholarship" element={<ScholarshipPage />} />
                  <Route path="/study-abroad" element={<StudyAbroadPage />} />
                  <Route path="/mock-interview" element={<MockInterviewPage />} />
                  <Route path="/ielts" element={<IeltsPage />} />
                  <Route path="/research-mentor" element={<ResearchMentorPage />} />
                  <Route path="/project-helper" element={<ProjectHelperPage />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </HashRouter>
          </TooltipProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
