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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      bids: {
        Row: {
          bid_id: string
          office_id: string | null
          price: number
          request_id: string | null
          status: string | null
          submitted_at: string | null
          timeline: number
        }
        Insert: {
          bid_id?: string
          office_id?: string | null
          price: number
          request_id?: string | null
          status?: string | null
          submitted_at?: string | null
          timeline: number
        }
        Update: {
          bid_id?: string
          office_id?: string | null
          price?: number
          request_id?: string | null
          status?: string | null
          submitted_at?: string | null
          timeline?: number
        }
        Relationships: [
          {
            foreignKeyName: "bids_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "engineering_offices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bids_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "project_requests"
            referencedColumns: ["request_id"]
          },
        ]
      }
      clients: {
        Row: {
          id: string
          is_active: boolean | null
          phone: string | null
        }
        Insert: {
          id: string
          is_active?: boolean | null
          phone?: string | null
        }
        Update: {
          id?: string
          is_active?: boolean | null
          phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          client_id: string | null
          contract_id: string
          created_at: string | null
          description: string | null
          is_client_signed: boolean | null
          is_office_signed: boolean | null
          office_id: string | null
          signed_at: string | null
          title: string | null
        }
        Insert: {
          client_id?: string | null
          contract_id?: string
          created_at?: string | null
          description?: string | null
          is_client_signed?: boolean | null
          is_office_signed?: boolean | null
          office_id?: string | null
          signed_at?: string | null
          title?: string | null
        }
        Update: {
          client_id?: string | null
          contract_id?: string
          created_at?: string | null
          description?: string | null
          is_client_signed?: boolean | null
          is_office_signed?: boolean | null
          office_id?: string | null
          signed_at?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contracts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "engineering_offices"
            referencedColumns: ["id"]
          },
        ]
      }
      engineering_offices: {
        Row: {
          city: string | null
          coverage_area: string | null
          description: string | null
          id: string
          is_active: boolean
          is_verified: boolean | null
          license_document_url: string | null
          license_expiry_date: string | null
          license_number: string
          office_type: string | null
          phone: string | null
          years_of_experience: string | null
        }
        Insert: {
          city?: string | null
          coverage_area?: string | null
          description?: string | null
          id: string
          is_active?: boolean
          is_verified?: boolean | null
          license_document_url?: string | null
          license_expiry_date?: string | null
          license_number: string
          office_type?: string | null
          phone?: string | null
          years_of_experience?: string | null
        }
        Update: {
          city?: string | null
          coverage_area?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          is_verified?: boolean | null
          license_document_url?: string | null
          license_expiry_date?: string | null
          license_number?: string
          office_type?: string | null
          phone?: string | null
          years_of_experience?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "engineering_offices_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "engineering_offices_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      escrow: {
        Row: {
          contract_id: string | null
          created_at: string | null
          escrow_id: string
          released_amount: number | null
          status: string | null
          total_amount: number | null
        }
        Insert: {
          contract_id?: string | null
          created_at?: string | null
          escrow_id?: string
          released_amount?: number | null
          status?: string | null
          total_amount?: number | null
        }
        Update: {
          contract_id?: string | null
          created_at?: string | null
          escrow_id?: string
          released_amount?: number | null
          status?: string | null
          total_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "escrow_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["contract_id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_key: string
          created_at: string
          id: string
          recipient_id: string
          sender_id: string
        }
        Insert: {
          content: string
          conversation_key: string
          created_at?: string
          id?: string
          recipient_id: string
          sender_id: string
        }
        Update: {
          content?: string
          conversation_key?: string
          created_at?: string
          id?: string
          recipient_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      milestones: {
        Row: {
          deliverable_url: string | null
          description: string | null
          due_date: string | null
          milestone_id: string
          project_id: string | null
          status: string | null
          title: string
        }
        Insert: {
          deliverable_url?: string | null
          description?: string | null
          due_date?: string | null
          milestone_id?: string
          project_id?: string | null
          status?: string | null
          title: string
        }
        Update: {
          deliverable_url?: string | null
          description?: string | null
          due_date?: string | null
          milestone_id?: string
          project_id?: string | null
          status?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["project_id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          is_read: boolean | null
          message: string | null
          notification_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          is_read?: boolean | null
          message?: string | null
          notification_id?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          is_read?: boolean | null
          message?: string | null
          notification_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number | null
          created_at: string | null
          escrow_id: string | null
          milestone_id: string | null
          payment_id: string
          status: boolean | null
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          escrow_id?: string | null
          milestone_id?: string | null
          payment_id?: string
          status?: boolean | null
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          escrow_id?: string | null
          milestone_id?: string | null
          payment_id?: string
          status?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_escrow_id_fkey"
            columns: ["escrow_id"]
            isOneToOne: false
            referencedRelation: "escrow"
            referencedColumns: ["escrow_id"]
          },
          {
            foreignKeyName: "payments_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "milestones"
            referencedColumns: ["milestone_id"]
          },
        ]
      }
      portfolio: {
        Row: {
          category: string | null
          completed_at: string | null
          description: string | null
          image_url: string | null
          office_id: string | null
          portfolio_id: string
          project_title: string | null
        }
        Insert: {
          category?: string | null
          completed_at?: string | null
          description?: string | null
          image_url?: string | null
          office_id?: string | null
          portfolio_id?: string
          project_title?: string | null
        }
        Update: {
          category?: string | null
          completed_at?: string | null
          description?: string | null
          image_url?: string | null
          office_id?: string | null
          portfolio_id?: string
          project_title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "engineering_offices"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          email: string
          id: string
          name: string
          role: string
        }
        Insert: {
          email: string
          id: string
          name: string
          role: string
        }
        Update: {
          email?: string
          id?: string
          name?: string
          role?: string
        }
        Relationships: []
      }
      project_requests: {
        Row: {
          budget_range: string | null
          client_id: string | null
          created_at: string | null
          description: string | null
          location: string | null
          request_id: string
          status: string | null
          target_office_id: string | null
          title: string
        }
        Insert: {
          budget_range?: string | null
          client_id?: string | null
          created_at?: string | null
          description?: string | null
          location?: string | null
          request_id?: string
          status?: string | null
          target_office_id?: string | null
          title: string
        }
        Update: {
          budget_range?: string | null
          client_id?: string | null
          created_at?: string | null
          description?: string | null
          location?: string | null
          request_id?: string
          status?: string | null
          target_office_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_requests_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_requests_target_office_id_fkey"
            columns: ["target_office_id"]
            isOneToOne: false
            referencedRelation: "engineering_offices"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          contract_id: string | null
          description: string | null
          progress_percentage: number | null
          project_id: string
          start_date: string | null
          status: string | null
          title: string
        }
        Insert: {
          contract_id?: string | null
          description?: string | null
          progress_percentage?: number | null
          project_id?: string
          start_date?: string | null
          status?: string | null
          title: string
        }
        Update: {
          contract_id?: string | null
          description?: string | null
          progress_percentage?: number | null
          project_id?: string
          start_date?: string | null
          status?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["contract_id"]
          },
        ]
      }
      ratings: {
        Row: {
          client_id: string | null
          comment: string | null
          created_at: string | null
          milestone_id: string | null
          rating_id: string
          stars: number | null
        }
        Insert: {
          client_id?: string | null
          comment?: string | null
          created_at?: string | null
          milestone_id?: string | null
          rating_id?: string
          stars?: number | null
        }
        Update: {
          client_id?: string | null
          comment?: string | null
          created_at?: string | null
          milestone_id?: string | null
          rating_id?: string
          stars?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ratings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "milestones"
            referencedColumns: ["milestone_id"]
          },
        ]
      }
      reports: {
        Row: {
          client_id: string | null
          created_at: string | null
          description: string | null
          project_id: string | null
          report_id: string
          status: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          description?: string | null
          project_id?: string | null
          report_id?: string
          status?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          description?: string | null
          project_id?: string | null
          report_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["project_id"]
          },
        ]
      }
      service_catalog: {
        Row: {
          catalog_id: string
          category: string | null
          office_id: string | null
          price: number | null
          pricing_model: string | null
          sub_category: string | null
        }
        Insert: {
          catalog_id?: string
          category?: string | null
          office_id?: string | null
          price?: number | null
          pricing_model?: string | null
          sub_category?: string | null
        }
        Update: {
          catalog_id?: string
          category?: string | null
          office_id?: string | null
          price?: number | null
          pricing_model?: string | null
          sub_category?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_catalog_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "engineering_offices"
            referencedColumns: ["id"]
          },
        ]
      }
      supervisors: {
        Row: {
          id: string
          phone: string | null
        }
        Insert: {
          id: string
          phone?: string | null
        }
        Update: {
          id?: string
          phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supervisors_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supervisors_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      template_purchases: {
        Row: {
          category_snapshot: string | null
          client_id: string
          created_at: string
          file_url_snapshot: string | null
          id: string
          office_id: string | null
          preview_image_snapshot: string | null
          purchase_price: number
          status: string
          sub_category_snapshot: string | null
          template_id: string
          title_snapshot: string | null
        }
        Insert: {
          category_snapshot?: string | null
          client_id: string
          created_at?: string
          file_url_snapshot?: string | null
          id?: string
          office_id?: string | null
          preview_image_snapshot?: string | null
          purchase_price?: number
          status?: string
          sub_category_snapshot?: string | null
          template_id: string
          title_snapshot?: string | null
        }
        Update: {
          category_snapshot?: string | null
          client_id?: string
          created_at?: string
          file_url_snapshot?: string | null
          id?: string
          office_id?: string | null
          preview_image_snapshot?: string | null
          purchase_price?: number
          status?: string
          sub_category_snapshot?: string | null
          template_id?: string
          title_snapshot?: string | null
        }
        Relationships: []
      }
      templates: {
        Row: {
          category: string | null
          description: string | null
          file_url: string | null
          included_files: string | null
          is_approved: boolean | null
          is_available: boolean | null
          office_id: string | null
          preview_image_url: string | null
          price: number | null
          sub_category: string | null
          template_id: string
          title: string | null
        }
        Insert: {
          category?: string | null
          description?: string | null
          file_url?: string | null
          included_files?: string | null
          is_approved?: boolean | null
          is_available?: boolean | null
          office_id?: string | null
          preview_image_url?: string | null
          price?: number | null
          sub_category?: string | null
          template_id?: string
          title?: string | null
        }
        Update: {
          category?: string | null
          description?: string | null
          file_url?: string | null
          included_files?: string | null
          is_approved?: boolean | null
          is_available?: boolean | null
          office_id?: string | null
          preview_image_url?: string | null
          price?: number | null
          sub_category?: string | null
          template_id?: string
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "templates_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "engineering_offices"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      public_profiles: {
        Row: {
          id: string | null
          name: string | null
          role: string | null
        }
        Insert: {
          id?: string | null
          name?: string | null
          role?: string | null
        }
        Update: {
          id?: string | null
          name?: string | null
          role?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      is_supervisor: { Args: never; Returns: boolean }
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
