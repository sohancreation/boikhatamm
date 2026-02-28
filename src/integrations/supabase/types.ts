export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          category: string | null
          coins_bonus: number | null
          description_bn: string | null
          description_en: string | null
          icon: string | null
          id: string
          name_bn: string
          name_en: string
          requirement_type: string
          requirement_value: number
          sort_order: number | null
          xp_bonus: number | null
        }
        Insert: {
          category?: string | null
          coins_bonus?: number | null
          description_bn?: string | null
          description_en?: string | null
          icon?: string | null
          id: string
          name_bn: string
          name_en: string
          requirement_type: string
          requirement_value?: number
          sort_order?: number | null
          xp_bonus?: number | null
        }
        Update: {
          category?: string | null
          coins_bonus?: number | null
          description_bn?: string | null
          description_en?: string | null
          icon?: string | null
          id?: string
          name_bn?: string
          name_en?: string
          requirement_type?: string
          requirement_value?: number
          sort_order?: number | null
          xp_bonus?: number | null
        }
        Relationships: []
      }
      ai_summaries: {
        Row: {
          created_at: string
          id: string
          output_format: string
          result: string
          source_content: string
          source_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          output_format: string
          result: string
          source_content: string
          source_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          output_format?: string
          result?: string
          source_content?: string
          source_type?: string
          user_id?: string
        }
        Relationships: []
      }
      badges: {
        Row: {
          description_bn: string | null
          description_en: string | null
          icon: string | null
          id: string
          name_bn: string
          name_en: string
          xp_required: number | null
        }
        Insert: {
          description_bn?: string | null
          description_en?: string | null
          icon?: string | null
          id?: string
          name_bn: string
          name_en: string
          xp_required?: number | null
        }
        Update: {
          description_bn?: string | null
          description_en?: string | null
          icon?: string | null
          id?: string
          name_bn?: string
          name_en?: string
          xp_required?: number | null
        }
        Relationships: []
      }
      career_results: {
        Row: {
          created_at: string
          id: string
          profile_data: Json
          results_data: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          profile_data?: Json
          results_data?: Json
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          profile_data?: Json
          results_data?: Json
          user_id?: string
        }
        Relationships: []
      }
      chapters: {
        Row: {
          chapter_number: number | null
          id: string
          name_bn: string
          name_en: string
          sort_order: number | null
          subject_id: string
        }
        Insert: {
          chapter_number?: number | null
          id?: string
          name_bn: string
          name_en: string
          sort_order?: number | null
          subject_id: string
        }
        Update: {
          chapter_number?: number | null
          id?: string
          name_bn?: string
          name_en?: string
          sort_order?: number | null
          subject_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chapters_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_missions: {
        Row: {
          all_completed: boolean
          bonus_claimed: boolean
          created_at: string
          id: string
          mission_1_done: boolean
          mission_1_progress: number
          mission_1_target: number
          mission_1_type: string
          mission_2_done: boolean
          mission_2_progress: number
          mission_2_target: number
          mission_2_type: string
          mission_3_done: boolean
          mission_3_progress: number
          mission_3_target: number
          mission_3_type: string
          mission_date: string
          user_id: string
        }
        Insert: {
          all_completed?: boolean
          bonus_claimed?: boolean
          created_at?: string
          id?: string
          mission_1_done?: boolean
          mission_1_progress?: number
          mission_1_target?: number
          mission_1_type?: string
          mission_2_done?: boolean
          mission_2_progress?: number
          mission_2_target?: number
          mission_2_type?: string
          mission_3_done?: boolean
          mission_3_progress?: number
          mission_3_target?: number
          mission_3_type?: string
          mission_date?: string
          user_id: string
        }
        Update: {
          all_completed?: boolean
          bonus_claimed?: boolean
          created_at?: string
          id?: string
          mission_1_done?: boolean
          mission_1_progress?: number
          mission_1_target?: number
          mission_1_type?: string
          mission_2_done?: boolean
          mission_2_progress?: number
          mission_2_target?: number
          mission_2_type?: string
          mission_3_done?: boolean
          mission_3_progress?: number
          mission_3_target?: number
          mission_3_type?: string
          mission_date?: string
          user_id?: string
        }
        Relationships: []
      }
      doubt_sessions: {
        Row: {
          created_at: string
          id: string
          messages: Json
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          messages?: Json
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          messages?: Json
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      generated_courses: {
        Row: {
          board: string | null
          chapters: Json
          class_level: string
          created_at: string
          id: string
          language: string | null
          subject_name: string
          updated_at: string
        }
        Insert: {
          board?: string | null
          chapters?: Json
          class_level: string
          created_at?: string
          id?: string
          language?: string | null
          subject_name: string
          updated_at?: string
        }
        Update: {
          board?: string | null
          chapters?: Json
          class_level?: string
          created_at?: string
          id?: string
          language?: string | null
          subject_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      ielts_results: {
        Row: {
          answers: Json
          band_score: number | null
          created_at: string
          evaluation: Json
          id: string
          level: string | null
          module: string
          questions: Json
          user_id: string
        }
        Insert: {
          answers?: Json
          band_score?: number | null
          created_at?: string
          evaluation?: Json
          id?: string
          level?: string | null
          module: string
          questions?: Json
          user_id: string
        }
        Update: {
          answers?: Json
          band_score?: number | null
          created_at?: string
          evaluation?: Json
          id?: string
          level?: string | null
          module?: string
          questions?: Json
          user_id?: string
        }
        Relationships: []
      }
      mock_interview_results: {
        Row: {
          config: Json
          created_at: string
          history: Json
          id: string
          overall_score: number
          questions: Json
          total_questions: number
          user_id: string
        }
        Insert: {
          config?: Json
          created_at?: string
          history?: Json
          id?: string
          overall_score?: number
          questions?: Json
          total_questions?: number
          user_id: string
        }
        Update: {
          config?: Json
          created_at?: string
          history?: Json
          id?: string
          overall_score?: number
          questions?: Json
          total_questions?: number
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          text_bn: string
          text_en: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          text_bn?: string
          text_en?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          text_bn?: string
          text_en?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_transactions: {
        Row: {
          amount_bdt: number
          created_at: string
          id: string
          metadata: Json | null
          payment_method: string
          status: string
          subscription_id: string | null
          transaction_id: string | null
          user_id: string
        }
        Insert: {
          amount_bdt: number
          created_at?: string
          id?: string
          metadata?: Json | null
          payment_method: string
          status?: string
          subscription_id?: string | null
          transaction_id?: string | null
          user_id: string
        }
        Update: {
          amount_bdt?: number
          created_at?: string
          id?: string
          metadata?: Json | null
          payment_method?: string
          status?: string
          subscription_id?: string | null
          transaction_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "user_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_edit_logs: {
        Row: {
          created_at: string
          field_name: string
          id: string
          new_value: string | null
          old_value: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          field_name: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          field_name?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age: number | null
          avatar_url: string | null
          board: string | null
          class_level: string | null
          coins: number | null
          coins_last_earned_at: string | null
          created_at: string
          daily_coins_earned: number
          daily_coins_reset_date: string | null
          full_name: string
          goals: string | null
          id: string
          ielts_target_band: string | null
          interests: string[] | null
          is_ielts_candidate: boolean | null
          is_job_candidate: boolean | null
          job_role: string | null
          job_sector: string | null
          job_type: string | null
          language: string | null
          last_active_date: string | null
          last_ai_question_at: string | null
          last_quiz_at: string | null
          level: number | null
          mobile_number: string | null
          monthly_coins_earned: number
          monthly_coins_reset_date: string | null
          rank_title: string | null
          streak_days: number | null
          strengths: string[] | null
          theme: string | null
          updated_at: string
          user_id: string
          weaknesses: string[] | null
          xp: number | null
        }
        Insert: {
          age?: number | null
          avatar_url?: string | null
          board?: string | null
          class_level?: string | null
          coins?: number | null
          coins_last_earned_at?: string | null
          created_at?: string
          daily_coins_earned?: number
          daily_coins_reset_date?: string | null
          full_name?: string
          goals?: string | null
          id?: string
          ielts_target_band?: string | null
          interests?: string[] | null
          is_ielts_candidate?: boolean | null
          is_job_candidate?: boolean | null
          job_role?: string | null
          job_sector?: string | null
          job_type?: string | null
          language?: string | null
          last_active_date?: string | null
          last_ai_question_at?: string | null
          last_quiz_at?: string | null
          level?: number | null
          mobile_number?: string | null
          monthly_coins_earned?: number
          monthly_coins_reset_date?: string | null
          rank_title?: string | null
          streak_days?: number | null
          strengths?: string[] | null
          theme?: string | null
          updated_at?: string
          user_id: string
          weaknesses?: string[] | null
          xp?: number | null
        }
        Update: {
          age?: number | null
          avatar_url?: string | null
          board?: string | null
          class_level?: string | null
          coins?: number | null
          coins_last_earned_at?: string | null
          created_at?: string
          daily_coins_earned?: number
          daily_coins_reset_date?: string | null
          full_name?: string
          goals?: string | null
          id?: string
          ielts_target_band?: string | null
          interests?: string[] | null
          is_ielts_candidate?: boolean | null
          is_job_candidate?: boolean | null
          job_role?: string | null
          job_sector?: string | null
          job_type?: string | null
          language?: string | null
          last_active_date?: string | null
          last_ai_question_at?: string | null
          last_quiz_at?: string | null
          level?: number | null
          mobile_number?: string | null
          monthly_coins_earned?: number
          monthly_coins_reset_date?: string | null
          rank_title?: string | null
          streak_days?: number | null
          strengths?: string[] | null
          theme?: string | null
          updated_at?: string
          user_id?: string
          weaknesses?: string[] | null
          xp?: number | null
        }
        Relationships: []
      }
      project_helper_sessions: {
        Row: {
          action: string
          created_at: string
          id: string
          project_plan: string | null
          project_type: string
          result: string | null
          user_id: string
        }
        Insert: {
          action?: string
          created_at?: string
          id?: string
          project_plan?: string | null
          project_type?: string
          result?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          project_plan?: string | null
          project_type?: string
          result?: string | null
          user_id?: string
        }
        Relationships: []
      }
      quiz_results: {
        Row: {
          answers: Json
          chapter: string | null
          correct_count: number
          created_at: string
          difficulty: string
          feedback: string | null
          id: string
          question_count: number
          questions: Json
          score: number
          subject: string
          topic: string | null
          total_count: number
          user_id: string
        }
        Insert: {
          answers?: Json
          chapter?: string | null
          correct_count?: number
          created_at?: string
          difficulty?: string
          feedback?: string | null
          id?: string
          question_count?: number
          questions?: Json
          score?: number
          subject: string
          topic?: string | null
          total_count?: number
          user_id: string
        }
        Update: {
          answers?: Json
          chapter?: string | null
          correct_count?: number
          created_at?: string
          difficulty?: string
          feedback?: string | null
          id?: string
          question_count?: number
          questions?: Json
          score?: number
          subject?: string
          topic?: string | null
          total_count?: number
          user_id?: string
        }
        Relationships: []
      }
      saved_resumes: {
        Row: {
          created_at: string
          id: string
          resume_data: Json
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          resume_data?: Json
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          resume_data?: Json
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      saved_slides: {
        Row: {
          created_at: string
          id: string
          slides_data: Json
          style: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          slides_data?: Json
          style?: string | null
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          slides_data?: Json
          style?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      scholarship_searches: {
        Row: {
          created_at: string
          id: string
          results_data: Json
          search_params: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          results_data?: Json
          search_params?: Json
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          results_data?: Json
          search_params?: Json
          user_id?: string
        }
        Relationships: []
      }
      skill_tree_progress: {
        Row: {
          id: string
          lessons_done: number | null
          mastery_level: number | null
          quizzes_done: number | null
          skill_branch: string
          subject: string
          unlocked: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          lessons_done?: number | null
          mastery_level?: number | null
          quizzes_done?: number | null
          skill_branch: string
          subject: string
          unlocked?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          lessons_done?: number | null
          mastery_level?: number | null
          quizzes_done?: number | null
          skill_branch?: string
          subject?: string
          unlocked?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      student_progress: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string
          id: string
          score: number | null
          topic_id: string
          user_id: string
          xp_earned: number | null
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string
          id?: string
          score?: number | null
          topic_id: string
          user_id: string
          xp_earned?: number | null
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string
          id?: string
          score?: number | null
          topic_id?: string
          user_id?: string
          xp_earned?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "student_progress_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      study_abroad_profiles: {
        Row: {
          analysis_result: Json | null
          cgpa: string | null
          country_preferences: string[] | null
          country_recommendations: Json | null
          created_at: string
          degree: string | null
          funding_preference: string | null
          gmat_score: string | null
          graduation_year: string | null
          gre_score: string | null
          has_conference: boolean | null
          has_publication: boolean | null
          has_thesis: boolean | null
          id: string
          ielts_score: string | null
          internship_details: string | null
          job_details: string | null
          major: string | null
          project_details: string | null
          research_details: string | null
          sat_score: string | null
          target_degree: string | null
          target_major: string | null
          university_name: string | null
          university_recommendations: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          analysis_result?: Json | null
          cgpa?: string | null
          country_preferences?: string[] | null
          country_recommendations?: Json | null
          created_at?: string
          degree?: string | null
          funding_preference?: string | null
          gmat_score?: string | null
          graduation_year?: string | null
          gre_score?: string | null
          has_conference?: boolean | null
          has_publication?: boolean | null
          has_thesis?: boolean | null
          id?: string
          ielts_score?: string | null
          internship_details?: string | null
          job_details?: string | null
          major?: string | null
          project_details?: string | null
          research_details?: string | null
          sat_score?: string | null
          target_degree?: string | null
          target_major?: string | null
          university_name?: string | null
          university_recommendations?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          analysis_result?: Json | null
          cgpa?: string | null
          country_preferences?: string[] | null
          country_recommendations?: Json | null
          created_at?: string
          degree?: string | null
          funding_preference?: string | null
          gmat_score?: string | null
          graduation_year?: string | null
          gre_score?: string | null
          has_conference?: boolean | null
          has_publication?: boolean | null
          has_thesis?: boolean | null
          id?: string
          ielts_score?: string | null
          internship_details?: string | null
          job_details?: string | null
          major?: string | null
          project_details?: string | null
          research_details?: string | null
          sat_score?: string | null
          target_degree?: string | null
          target_major?: string | null
          university_name?: string | null
          university_recommendations?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      study_plans: {
        Row: {
          class_level: string
          created_at: string
          daily_hours: number
          exam_date: string
          id: string
          plan_data: Json
          status: string
          strong_subjects: string[]
          syllabus_text: string | null
          target_exam: string
          updated_at: string
          user_id: string
          weak_subjects: string[]
        }
        Insert: {
          class_level: string
          created_at?: string
          daily_hours?: number
          exam_date: string
          id?: string
          plan_data?: Json
          status?: string
          strong_subjects?: string[]
          syllabus_text?: string | null
          target_exam: string
          updated_at?: string
          user_id: string
          weak_subjects?: string[]
        }
        Update: {
          class_level?: string
          created_at?: string
          daily_hours?: number
          exam_date?: string
          id?: string
          plan_data?: Json
          status?: string
          strong_subjects?: string[]
          syllabus_text?: string | null
          target_exam?: string
          updated_at?: string
          user_id?: string
          weak_subjects?: string[]
        }
        Relationships: []
      }
      study_tasks: {
        Row: {
          chapter: string | null
          completed_at: string | null
          created_at: string
          description: string | null
          duration_minutes: number
          id: string
          is_completed: boolean
          plan_id: string
          sort_order: number
          subject: string
          task_date: string
          task_type: string
          user_id: string
        }
        Insert: {
          chapter?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          is_completed?: boolean
          plan_id: string
          sort_order?: number
          subject: string
          task_date: string
          task_type?: string
          user_id: string
        }
        Update: {
          chapter?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          is_completed?: boolean
          plan_id?: string
          sort_order?: number
          subject?: string
          task_date?: string
          task_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_tasks_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "study_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          class_level: string
          icon: string | null
          id: string
          is_active: boolean | null
          name_bn: string
          name_en: string
          sort_order: number | null
        }
        Insert: {
          class_level: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name_bn: string
          name_en: string
          sort_order?: number | null
        }
        Update: {
          class_level?: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name_bn?: string
          name_en?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          created_at: string
          description_bn: string | null
          description_en: string | null
          discount_percent: number | null
          duration_days: number
          features: Json | null
          has_career_mentoring: boolean | null
          has_gamification: boolean | null
          has_skill_learning: boolean | null
          has_teacher_tools: boolean | null
          id: string
          is_active: boolean | null
          max_ai_queries_per_day: number | null
          name_bn: string
          name_en: string
          plan_type: string
          price_bdt: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description_bn?: string | null
          description_en?: string | null
          discount_percent?: number | null
          duration_days?: number
          features?: Json | null
          has_career_mentoring?: boolean | null
          has_gamification?: boolean | null
          has_skill_learning?: boolean | null
          has_teacher_tools?: boolean | null
          id?: string
          is_active?: boolean | null
          max_ai_queries_per_day?: number | null
          name_bn: string
          name_en: string
          plan_type: string
          price_bdt?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description_bn?: string | null
          description_en?: string | null
          discount_percent?: number | null
          duration_days?: number
          features?: Json | null
          has_career_mentoring?: boolean | null
          has_gamification?: boolean | null
          has_skill_learning?: boolean | null
          has_teacher_tools?: boolean | null
          id?: string
          is_active?: boolean | null
          max_ai_queries_per_day?: number | null
          name_bn?: string
          name_en?: string
          plan_type?: string
          price_bdt?: number
          updated_at?: string
        }
        Relationships: []
      }
      topics: {
        Row: {
          chapter_id: string
          id: string
          name_bn: string
          name_en: string
          notes_content: string | null
          requires_plan: string | null
          sort_order: number | null
          youtube_url: string | null
        }
        Insert: {
          chapter_id: string
          id?: string
          name_bn: string
          name_en: string
          notes_content?: string | null
          requires_plan?: string | null
          sort_order?: number | null
          youtube_url?: string | null
        }
        Update: {
          chapter_id?: string
          id?: string
          name_bn?: string
          name_en?: string
          notes_content?: string | null
          requires_plan?: string | null
          sort_order?: number | null
          youtube_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "topics_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_id: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_inventory: {
        Row: {
          acquired_at: string
          id: string
          item_id: string
          item_type: string
          quantity: number | null
          user_id: string
        }
        Insert: {
          acquired_at?: string
          id?: string
          item_id: string
          item_type: string
          quantity?: number | null
          user_id: string
        }
        Update: {
          acquired_at?: string
          id?: string
          item_id?: string
          item_type?: string
          quantity?: number | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          payment_method: string | null
          payment_transaction_id: string | null
          plan_id: string
          started_at: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          payment_method?: string | null
          payment_transaction_id?: string | null
          plan_id: string
          started_at?: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          payment_method?: string | null
          payment_transaction_id?: string | null
          plan_id?: string
          started_at?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      xp_logs: {
        Row: {
          action: string
          coins_earned: number
          created_at: string
          id: string
          metadata: Json | null
          user_id: string
          xp_earned: number
        }
        Insert: {
          action: string
          coins_earned?: number
          created_at?: string
          id?: string
          metadata?: Json | null
          user_id: string
          xp_earned?: number
        }
        Update: {
          action?: string
          coins_earned?: number
          created_at?: string
          id?: string
          metadata?: Json | null
          user_id?: string
          xp_earned?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_plan: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "student" | "teacher" | "institution_admin" | "super_admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["student", "teacher", "institution_admin", "super_admin"],
    },
  },
} as const
