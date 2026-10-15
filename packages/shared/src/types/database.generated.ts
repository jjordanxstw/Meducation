/**
 * GENERATED from the local Supabase stack — do not edit by hand.
 * Regenerate after a migration: pnpm db:local:types
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      _schema_migrations: {
        Row: {
          applied_at: string;
          id: number;
          name: string;
          version: string;
        };
        ComputedFields: never;
        Insert: {
          applied_at?: string;
          id?: number;
          name: string;
          version: string;
        };
        Update: {
          applied_at?: string;
          id?: number;
          name?: string;
          version?: string;
        };
        Relationships: [];
      };
      admins: {
        Row: {
          created_at: string;
          email: string | null;
          full_name: string;
          id: string;
          is_active: boolean;
          is_super_admin: boolean;
          last_login_at: string | null;
          last_login_ip: string | null;
          password_changed_at: string;
          password_hash: string;
          password_history: NonNullable<Json>;
          updated_at: string;
          username: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          email?: string | null;
          full_name: string;
          id?: string;
          is_active?: boolean;
          is_super_admin?: boolean;
          last_login_at?: string | null;
          last_login_ip?: string | null;
          password_changed_at?: string;
          password_hash: string;
          password_history?: NonNullable<Json>;
          updated_at?: string;
          username: string;
        };
        Update: {
          created_at?: string;
          email?: string | null;
          full_name?: string;
          id?: string;
          is_active?: boolean;
          is_super_admin?: boolean;
          last_login_at?: string | null;
          last_login_ip?: string | null;
          password_changed_at?: string;
          password_hash?: string;
          password_history?: NonNullable<Json>;
          updated_at?: string;
          username?: string;
        };
        Relationships: [];
      };
      announcements: {
        Row: {
          content: string;
          created_at: string;
          created_by_admin: string | null;
          id: string;
          is_pinned: boolean;
          is_published: boolean;
          title: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          content: string;
          created_at?: string;
          created_by_admin?: string | null;
          id?: string;
          is_pinned?: boolean;
          is_published?: boolean;
          title: string;
          updated_at?: string;
        };
        Update: {
          content?: string;
          created_at?: string;
          created_by_admin?: string | null;
          id?: string;
          is_pinned?: boolean;
          is_published?: boolean;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'announcements_created_by_admin_fkey';
            columns: ['created_by_admin'];
            isOneToOne: false;
            referencedRelation: 'admins';
            referencedColumns: ['id'];
          },
        ];
      };
      audit_logs: {
        Row: {
          action: Database['public']['Enums']['audit_action'];
          created_at: string;
          id: string;
          ip_address: unknown;
          new_data: Json | null;
          old_data: Json | null;
          record_id: string;
          table_name: string;
          user_agent: string | null;
          user_email: string | null;
          user_id: string | null;
        };
        ComputedFields: never;
        Insert: {
          action: Database['public']['Enums']['audit_action'];
          created_at?: string;
          id?: string;
          ip_address?: unknown;
          new_data?: Json | null;
          old_data?: Json | null;
          record_id: string;
          table_name: string;
          user_agent?: string | null;
          user_email?: string | null;
          user_id?: string | null;
        };
        Update: {
          action?: Database['public']['Enums']['audit_action'];
          created_at?: string;
          id?: string;
          ip_address?: unknown;
          new_data?: Json | null;
          old_data?: Json | null;
          record_id?: string;
          table_name?: string;
          user_agent?: string | null;
          user_email?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'audit_logs_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      auth_audit_logs: {
        Row: {
          created_at: string;
          event_type: string;
          failure_reason: string | null;
          id: string;
          ip_address: unknown;
          metadata: Json | null;
          success: boolean;
          user_agent: string | null;
          user_id: string | null;
          user_type: Database['public']['Enums']['user_role'];
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          event_type: string;
          failure_reason?: string | null;
          id?: string;
          ip_address?: unknown;
          metadata?: Json | null;
          success: boolean;
          user_agent?: string | null;
          user_id?: string | null;
          user_type: Database['public']['Enums']['user_role'];
        };
        Update: {
          created_at?: string;
          event_type?: string;
          failure_reason?: string | null;
          id?: string;
          ip_address?: unknown;
          metadata?: Json | null;
          success?: boolean;
          user_agent?: string | null;
          user_id?: string | null;
          user_type?: Database['public']['Enums']['user_role'];
        };
        Relationships: [];
      };
      calendar_events: {
        Row: {
          color: string | null;
          created_at: string;
          created_by: string | null;
          created_by_admin: string | null;
          daily_schedule: boolean;
          description: string | null;
          end_date: string | null;
          end_time: string | null;
          id: string;
          location: string | null;
          start_date: string;
          start_time: string | null;
          subject_id: string | null;
          title: string;
          type: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          color?: string | null;
          created_at?: string;
          created_by?: string | null;
          created_by_admin?: string | null;
          daily_schedule?: boolean;
          description?: string | null;
          end_date?: string | null;
          end_time?: string | null;
          id?: string;
          location?: string | null;
          start_date: string;
          start_time?: string | null;
          subject_id?: string | null;
          title: string;
          type: string;
          updated_at?: string;
        };
        Update: {
          color?: string | null;
          created_at?: string;
          created_by?: string | null;
          created_by_admin?: string | null;
          daily_schedule?: boolean;
          description?: string | null;
          end_date?: string | null;
          end_time?: string | null;
          id?: string;
          location?: string | null;
          start_date?: string;
          start_time?: string | null;
          subject_id?: string | null;
          title?: string;
          type?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'calendar_events_created_by_admin_fkey';
            columns: ['created_by_admin'];
            isOneToOne: false;
            referencedRelation: 'admins';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'calendar_events_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'calendar_events_subject_id_fkey';
            columns: ['subject_id'];
            isOneToOne: false;
            referencedRelation: 'subjects';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'calendar_events_subject_id_fkey';
            columns: ['subject_id'];
            isOneToOne: false;
            referencedRelation: 'view_lecture_hierarchy';
            referencedColumns: ['subject_id'];
          },
          {
            foreignKeyName: 'calendar_events_type_fkey';
            columns: ['type'];
            isOneToOne: false;
            referencedRelation: 'event_types';
            referencedColumns: ['name'];
          },
        ];
      };
      event_types: {
        Row: {
          color: string;
          created_at: string;
          id: string;
          name: string;
          sort_order: number;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          color?: string;
          created_at?: string;
          id?: string;
          name: string;
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          color?: string;
          created_at?: string;
          id?: string;
          name?: string;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      idempotency_cache: {
        Row: {
          created_at: string;
          expires_at: string;
          key: string;
          request_hash: string;
          response_body: Json | null;
          response_status: number;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          expires_at?: string;
          key: string;
          request_hash: string;
          response_body?: Json | null;
          response_status: number;
        };
        Update: {
          created_at?: string;
          expires_at?: string;
          key?: string;
          request_hash?: string;
          response_body?: Json | null;
          response_status?: number;
        };
        Relationships: [];
      };
      learning_resources: {
        Row: {
          author_name: string | null;
          categories: NonNullable<Json>;
          created_at: string;
          description: string | null;
          id: string;
          image_url: string | null;
          is_published: boolean;
          order_index: number;
          technologies: string[];
          title: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          author_name?: string | null;
          categories?: NonNullable<Json>;
          created_at?: string;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          is_published?: boolean;
          order_index?: number;
          technologies?: string[];
          title: string;
          updated_at?: string;
        };
        Update: {
          author_name?: string | null;
          categories?: NonNullable<Json>;
          created_at?: string;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          is_published?: boolean;
          order_index?: number;
          technologies?: string[];
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      lectures: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          is_active: boolean;
          lecture_date: string | null;
          lecturer_name: string | null;
          order_index: number;
          section_id: string;
          title: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          lecture_date?: string | null;
          lecturer_name?: string | null;
          order_index?: number;
          section_id: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          lecture_date?: string | null;
          lecturer_name?: string | null;
          order_index?: number;
          section_id?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'lectures_section_id_fkey';
            columns: ['section_id'];
            isOneToOne: false;
            referencedRelation: 'sections';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'lectures_section_id_fkey';
            columns: ['section_id'];
            isOneToOne: false;
            referencedRelation: 'view_lecture_hierarchy';
            referencedColumns: ['section_id'];
          },
        ];
      };
      news: {
        Row: {
          author_name: string | null;
          body: string;
          category_id: string | null;
          cover_image_url: string | null;
          created_at: string;
          id: string;
          is_featured: boolean;
          is_published: boolean;
          published_at: string;
          summary: string | null;
          title: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          author_name?: string | null;
          body: string;
          category_id?: string | null;
          cover_image_url?: string | null;
          created_at?: string;
          id?: string;
          is_featured?: boolean;
          is_published?: boolean;
          published_at?: string;
          summary?: string | null;
          title: string;
          updated_at?: string;
        };
        Update: {
          author_name?: string | null;
          body?: string;
          category_id?: string | null;
          cover_image_url?: string | null;
          created_at?: string;
          id?: string;
          is_featured?: boolean;
          is_published?: boolean;
          published_at?: string;
          summary?: string | null;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'news_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'news_categories';
            referencedColumns: ['id'];
          },
        ];
      };
      news_categories: {
        Row: {
          color: string;
          created_at: string;
          id: string;
          name: string;
          sort_order: number;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          color?: string;
          created_at?: string;
          id?: string;
          name: string;
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          color?: string;
          created_at?: string;
          id?: string;
          name?: string;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          email: string;
          full_name: string;
          id: string;
          role: Database['public']['Enums']['user_role'];
          student_id: string | null;
          updated_at: string;
          year_level: number | null;
        };
        ComputedFields: never;
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          email: string;
          full_name: string;
          id: string;
          role?: Database['public']['Enums']['user_role'];
          student_id?: string | null;
          updated_at?: string;
          year_level?: number | null;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          email?: string;
          full_name?: string;
          id?: string;
          role?: Database['public']['Enums']['user_role'];
          student_id?: string | null;
          updated_at?: string;
          year_level?: number | null;
        };
        Relationships: [];
      };
      refresh_tokens: {
        Row: {
          created_at: string;
          device_info: Json | null;
          expires_at: string;
          family_id: string;
          id: string;
          ip_address: unknown;
          replaced_by: string | null;
          reuse_detected_at: string | null;
          revoked_at: string | null;
          token_hash: string;
          user_agent: string | null;
          user_id: string;
          user_type: Database['public']['Enums']['user_role'];
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          device_info?: Json | null;
          expires_at: string;
          family_id?: string;
          id?: string;
          ip_address?: unknown;
          replaced_by?: string | null;
          reuse_detected_at?: string | null;
          revoked_at?: string | null;
          token_hash: string;
          user_agent?: string | null;
          user_id: string;
          user_type: Database['public']['Enums']['user_role'];
        };
        Update: {
          created_at?: string;
          device_info?: Json | null;
          expires_at?: string;
          family_id?: string;
          id?: string;
          ip_address?: unknown;
          replaced_by?: string | null;
          reuse_detected_at?: string | null;
          revoked_at?: string | null;
          token_hash?: string;
          user_agent?: string | null;
          user_id?: string;
          user_type?: Database['public']['Enums']['user_role'];
        };
        Relationships: [
          {
            foreignKeyName: 'refresh_tokens_replaced_by_fkey';
            columns: ['replaced_by'];
            isOneToOne: false;
            referencedRelation: 'active_sessions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'refresh_tokens_replaced_by_fkey';
            columns: ['replaced_by'];
            isOneToOne: false;
            referencedRelation: 'refresh_tokens';
            referencedColumns: ['id'];
          },
        ];
      };
      resources: {
        Row: {
          created_at: string;
          duration_seconds: number | null;
          file_size_bytes: number | null;
          id: string;
          is_active: boolean;
          label: string;
          lecture_id: string;
          order_index: number;
          type: Database['public']['Enums']['resource_type'];
          updated_at: string;
          url: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          duration_seconds?: number | null;
          file_size_bytes?: number | null;
          id?: string;
          is_active?: boolean;
          label: string;
          lecture_id: string;
          order_index?: number;
          type: Database['public']['Enums']['resource_type'];
          updated_at?: string;
          url: string;
        };
        Update: {
          created_at?: string;
          duration_seconds?: number | null;
          file_size_bytes?: number | null;
          id?: string;
          is_active?: boolean;
          label?: string;
          lecture_id?: string;
          order_index?: number;
          type?: Database['public']['Enums']['resource_type'];
          updated_at?: string;
          url?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'resources_lecture_id_fkey';
            columns: ['lecture_id'];
            isOneToOne: false;
            referencedRelation: 'lectures';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'resources_lecture_id_fkey';
            columns: ['lecture_id'];
            isOneToOne: false;
            referencedRelation: 'view_lecture_hierarchy';
            referencedColumns: ['lecture_id'];
          },
        ];
      };
      sections: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          is_active: boolean;
          name: string;
          order_index: number;
          subject_id: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          name: string;
          order_index?: number;
          subject_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          name?: string;
          order_index?: number;
          subject_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'sections_subject_id_fkey';
            columns: ['subject_id'];
            isOneToOne: false;
            referencedRelation: 'subjects';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'sections_subject_id_fkey';
            columns: ['subject_id'];
            isOneToOne: false;
            referencedRelation: 'view_lecture_hierarchy';
            referencedColumns: ['subject_id'];
          },
        ];
      };
      subjects: {
        Row: {
          code: string;
          created_at: string;
          description: string | null;
          id: string;
          is_active: boolean;
          name: string;
          order_index: number;
          thumbnail_url: string | null;
          updated_at: string;
          year_level: number;
        };
        ComputedFields: never;
        Insert: {
          code: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          name: string;
          order_index?: number;
          thumbnail_url?: string | null;
          updated_at?: string;
          year_level: number;
        };
        Update: {
          code?: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          name?: string;
          order_index?: number;
          thumbnail_url?: string | null;
          updated_at?: string;
          year_level?: number;
        };
        Relationships: [];
      };
      team_members: {
        Row: {
          avatar_url: string | null;
          bio: string | null;
          created_at: string;
          email: string | null;
          full_name: string;
          github_url: string | null;
          id: string;
          instagram_url: string | null;
          is_active: boolean;
          linkedin_url: string | null;
          order_index: number;
          role: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          email?: string | null;
          full_name: string;
          github_url?: string | null;
          id?: string;
          instagram_url?: string | null;
          is_active?: boolean;
          linkedin_url?: string | null;
          order_index?: number;
          role: string;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          email?: string | null;
          full_name?: string;
          github_url?: string | null;
          id?: string;
          instagram_url?: string | null;
          is_active?: boolean;
          linkedin_url?: string | null;
          order_index?: number;
          role?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      active_sessions: {
        Row: {
          browser: string | null;
          created_at: string | null;
          device: string | null;
          display_name: string | null;
          expires_at: string | null;
          id: string | null;
          ip_address: unknown;
          last_seen: string | null;
          user_id: string | null;
          user_type: Database['public']['Enums']['user_role'] | null;
        };
        ComputedFields: never;
        Relationships: [];
      };
      view_lecture_hierarchy: {
        Row: {
          lecture_date: string | null;
          lecture_id: string | null;
          lecture_order: number | null;
          lecture_title: string | null;
          resource_id: string | null;
          resource_label: string | null;
          resource_order: number | null;
          resource_type: Database['public']['Enums']['resource_type'] | null;
          resource_url: string | null;
          section_id: string | null;
          section_name: string | null;
          section_order: number | null;
          subject_code: string | null;
          subject_id: string | null;
          subject_name: string | null;
          year_level: number | null;
        };
        ComputedFields: never;
        Relationships: [];
      };
    };
    Functions: {
      admin_full_create_resource: { Args: { payload: Json }; Returns: Json };
      admin_save_subject_tree: { Args: { payload: Json }; Returns: Json };
      cleanup_all_expired: { Args: Record<PropertyKey, never>; Returns: Json };
      cleanup_expired_tokens: { Args: Record<PropertyKey, never>; Returns: number };
      cleanup_idempotency_cache: { Args: Record<PropertyKey, never>; Returns: number };
      cleanup_old_auth_audit_logs: { Args: { retention_days?: number }; Returns: number };
      cleanup_security_artifacts: {
        Args: { auth_audit_retention_days?: number; token_retention_days?: number };
        Returns: Json;
      };
      is_admin_user: { Args: Record<PropertyKey, never>; Returns: boolean };
      revoke_all_user_sessions: {
        Args: {
          target_user_id: string;
          target_user_type: Database['public']['Enums']['user_role'];
        };
        Returns: number;
      };
      revoke_session: { Args: { token_id: string }; Returns: boolean };
      revoke_token_family: { Args: { target_family_id: string }; Returns: number };
    };
    Enums: {
      audit_action: 'INSERT' | 'UPDATE' | 'DELETE';
      resource_type: 'youtube' | 'gdrive_video' | 'gdrive_pdf' | 'external';
      user_role: 'admin' | 'student';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      audit_action: ['INSERT', 'UPDATE', 'DELETE'],
      resource_type: ['youtube', 'gdrive_video', 'gdrive_pdf', 'external'],
      user_role: ['admin', 'student'],
    },
  },
} as const;
