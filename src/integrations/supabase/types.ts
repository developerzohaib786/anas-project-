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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      asset_analysis: {
        Row: {
          analysis_result: Json | null
          brand_asset_id: string
          created_at: string
          flagged_reasons: string[] | null
          id: string
          is_flagged: boolean
          processed_at: string
          quality_score: number | null
          training_job_id: string
        }
        Insert: {
          analysis_result?: Json | null
          brand_asset_id: string
          created_at?: string
          flagged_reasons?: string[] | null
          id?: string
          is_flagged?: boolean
          processed_at?: string
          quality_score?: number | null
          training_job_id: string
        }
        Update: {
          analysis_result?: Json | null
          brand_asset_id?: string
          created_at?: string
          flagged_reasons?: string[] | null
          id?: string
          is_flagged?: boolean
          processed_at?: string
          quality_score?: number | null
          training_job_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_asset_analysis_brand_asset"
            columns: ["brand_asset_id"]
            isOneToOne: false
            referencedRelation: "brand_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_asset_analysis_training_job"
            columns: ["training_job_id"]
            isOneToOne: false
            referencedRelation: "training_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_assets: {
        Row: {
          asset_type: string | null
          brand_profile_id: string
          content_type: string | null
          created_at: string | null
          description: string | null
          file_name: string
          file_size: number | null
          id: string
          is_active: boolean | null
          storage_path: string
          tags: string[] | null
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          asset_type?: string | null
          brand_profile_id: string
          content_type?: string | null
          created_at?: string | null
          description?: string | null
          file_name: string
          file_size?: number | null
          id?: string
          is_active?: boolean | null
          storage_path: string
          tags?: string[] | null
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          asset_type?: string | null
          brand_profile_id?: string
          content_type?: string | null
          created_at?: string | null
          description?: string | null
          file_name?: string
          file_size?: number | null
          id?: string
          is_active?: boolean | null
          storage_path?: string
          tags?: string[] | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "brand_assets_brand_profile_id_fkey"
            columns: ["brand_profile_id"]
            isOneToOne: false
            referencedRelation: "brand_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_profiles: {
        Row: {
          additional_notes: string | null
          brand_name: string
          brand_tone: string | null
          brand_voice: string | null
          content_donts: string | null
          content_dos: string | null
          core_values: string | null
          created_at: string | null
          description: string | null
          id: string
          industry: string | null
          is_active: boolean | null
          key_messages: string | null
          location: string | null
          logo_url: string | null
          primary_color: string | null
          secondary_color: string | null
          updated_at: string | null
          user_id: string
          website_url: string | null
        }
        Insert: {
          additional_notes?: string | null
          brand_name: string
          brand_tone?: string | null
          brand_voice?: string | null
          content_donts?: string | null
          content_dos?: string | null
          core_values?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          industry?: string | null
          is_active?: boolean | null
          key_messages?: string | null
          location?: string | null
          logo_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          updated_at?: string | null
          user_id: string
          website_url?: string | null
        }
        Update: {
          additional_notes?: string | null
          brand_name?: string
          brand_tone?: string | null
          brand_voice?: string | null
          content_donts?: string | null
          content_dos?: string | null
          core_values?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          industry?: string | null
          is_active?: boolean | null
          key_messages?: string | null
          location?: string | null
          logo_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          updated_at?: string | null
          user_id?: string
          website_url?: string | null
        }
        Relationships: []
      }
      brand_training_profiles: {
        Row: {
          brand_profile_id: string
          categories_analyzed: string[] | null
          created_at: string
          id: string
          is_active: boolean
          negative_modifiers: string | null
          prompt_modifiers: string | null
          quality_metrics: Json | null
          style_summary: string | null
          total_images_used: number
          training_job_id: string
          user_id: string
          version: number
        }
        Insert: {
          brand_profile_id: string
          categories_analyzed?: string[] | null
          created_at?: string
          id?: string
          is_active?: boolean
          negative_modifiers?: string | null
          prompt_modifiers?: string | null
          quality_metrics?: Json | null
          style_summary?: string | null
          total_images_used?: number
          training_job_id: string
          user_id: string
          version?: number
        }
        Update: {
          brand_profile_id?: string
          categories_analyzed?: string[] | null
          created_at?: string
          id?: string
          is_active?: boolean
          negative_modifiers?: string | null
          prompt_modifiers?: string | null
          quality_metrics?: Json | null
          style_summary?: string | null
          total_images_used?: number
          training_job_id?: string
          user_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_brand_training_profiles_training_job"
            columns: ["training_job_id"]
            isOneToOne: false
            referencedRelation: "training_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          onboarding_completed: boolean | null
          onboarding_step: number | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          onboarding_completed?: boolean | null
          onboarding_step?: number | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          onboarding_completed?: boolean | null
          onboarding_step?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      team_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          role: string
          team_id: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          role?: string
          team_id: string
          token?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          role?: string
          team_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_invitations_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_memberships: {
        Row: {
          created_at: string
          id: string
          invitation_accepted: boolean | null
          invited_at: string | null
          invited_by: string | null
          joined_at: string | null
          role: string
          team_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invitation_accepted?: boolean | null
          invited_at?: string | null
          invited_by?: string | null
          joined_at?: string | null
          role?: string
          team_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invitation_accepted?: boolean | null
          invited_at?: string | null
          invited_by?: string | null
          joined_at?: string | null
          role?: string
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_memberships_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      training_jobs: {
        Row: {
          brand_profile_id: string
          categories: string[]
          completed_at: string | null
          created_at: string
          error_message: string | null
          flagged_assets: number
          id: string
          processed_assets: number
          started_at: string | null
          status: string
          total_assets: number
          updated_at: string
          user_id: string
        }
        Insert: {
          brand_profile_id: string
          categories?: string[]
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          flagged_assets?: number
          id?: string
          processed_assets?: number
          started_at?: string | null
          status?: string
          total_assets?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          brand_profile_id?: string
          categories?: string[]
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          flagged_assets?: number
          id?: string
          processed_assets?: number
          started_at?: string | null
          status?: string
          total_assets?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_team_invitation: {
        Args: { invite_token: string }
        Returns: boolean
      }
      check_team_membership: {
        Args: {
          required_roles?: string[]
          target_team_id: string
          target_user_id?: string
        }
        Returns: boolean
      }
      is_team_admin: {
        Args: { target_team_id: string; target_user_id?: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
