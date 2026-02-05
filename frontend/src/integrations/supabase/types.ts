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
      cards: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          power: number
          type: Database["public"]["Enums"]["card_type"]
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          power: number
          type: Database["public"]["Enums"]["card_type"]
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          power?: number
          type?: Database["public"]["Enums"]["card_type"]
        }
        Relationships: []
      }
      match_players: {
        Row: {
          health: number | null
          id: string
          is_connected: boolean | null
          is_eliminated: boolean | null
          joined_at: string | null
          match_id: string
          max_health: number | null
          player_id: string
          session_id: string | null
        }
        Insert: {
          health?: number | null
          id?: string
          is_connected?: boolean | null
          is_eliminated?: boolean | null
          joined_at?: string | null
          match_id: string
          max_health?: number | null
          player_id: string
          session_id?: string | null
        }
        Update: {
          health?: number | null
          id?: string
          is_connected?: boolean | null
          is_eliminated?: boolean | null
          joined_at?: string | null
          match_id?: string
          max_health?: number | null
          player_id?: string
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "match_players_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_players_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_players_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "session_wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      match_results: {
        Row: {
          created_at: string | null
          final_state_hash: string | null
          id: string
          match_id: string
          settlement_tx_id: string | null
          winner_id: string
          winner_payout: number
        }
        Insert: {
          created_at?: string | null
          final_state_hash?: string | null
          id?: string
          match_id: string
          settlement_tx_id?: string | null
          winner_id: string
          winner_payout: number
        }
        Update: {
          created_at?: string | null
          final_state_hash?: string | null
          id?: string
          match_id?: string
          settlement_tx_id?: string | null
          winner_id?: string
          winner_payout?: number
        }
        Relationships: [
          {
            foreignKeyName: "match_results_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: true
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_results_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          created_at: string | null
          current_round: number | null
          ended_at: string | null
          entry_fee: number
          id: string
          max_players: number | null
          min_players: number | null
          prize_pool: number
          round_time_limit: number | null
          settlement_tx_id: string | null
          started_at: string | null
          state_hash: string | null
          status: Database["public"]["Enums"]["match_status"] | null
          total_rounds: number | null
          winner_id: string | null
        }
        Insert: {
          created_at?: string | null
          current_round?: number | null
          ended_at?: string | null
          entry_fee: number
          id?: string
          max_players?: number | null
          min_players?: number | null
          prize_pool: number
          round_time_limit?: number | null
          settlement_tx_id?: string | null
          started_at?: string | null
          state_hash?: string | null
          status?: Database["public"]["Enums"]["match_status"] | null
          total_rounds?: number | null
          winner_id?: string | null
        }
        Update: {
          created_at?: string | null
          current_round?: number | null
          ended_at?: string | null
          entry_fee?: number
          id?: string
          max_players?: number | null
          min_players?: number | null
          prize_pool?: number
          round_time_limit?: number | null
          settlement_tx_id?: string | null
          started_at?: string | null
          state_hash?: string | null
          status?: Database["public"]["Enums"]["match_status"] | null
          total_rounds?: number | null
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      player_cards: {
        Row: {
          card_id: string
          id: string
          is_used: boolean | null
          match_player_id: string
          used_in_round: number | null
        }
        Insert: {
          card_id: string
          id?: string
          is_used?: boolean | null
          match_player_id: string
          used_in_round?: number | null
        }
        Update: {
          card_id?: string
          id?: string
          is_used?: boolean | null
          match_player_id?: string
          used_in_round?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "player_cards_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_cards_match_player_id_fkey"
            columns: ["match_player_id"]
            isOneToOne: false
            referencedRelation: "match_players"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          display_name: string
          ens_name: string
          id: string
          losses: number | null
          preferences: Json | null
          spend_limit: number | null
          total_earnings: number | null
          total_matches: number | null
          total_spent: number | null
          updated_at: string | null
          wins: number | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          display_name: string
          ens_name: string
          id: string
          losses?: number | null
          preferences?: Json | null
          spend_limit?: number | null
          total_earnings?: number | null
          total_matches?: number | null
          total_spent?: number | null
          updated_at?: string | null
          wins?: number | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string
          ens_name?: string
          id?: string
          losses?: number | null
          preferences?: Json | null
          spend_limit?: number | null
          total_earnings?: number | null
          total_matches?: number | null
          total_spent?: number | null
          updated_at?: string | null
          wins?: number | null
        }
        Relationships: []
      }
      round_actions: {
        Row: {
          card_id: string
          health_change: number | null
          id: string
          match_id: string
          player_id: string
          round_number: number
          target_id: string | null
          timestamp: string | null
        }
        Insert: {
          card_id: string
          health_change?: number | null
          id?: string
          match_id: string
          player_id: string
          round_number: number
          target_id?: string | null
          timestamp?: string | null
        }
        Update: {
          card_id?: string
          health_change?: number | null
          id?: string
          match_id?: string
          player_id?: string
          round_number?: number
          target_id?: string | null
          timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "round_actions_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "round_actions_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "round_actions_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "round_actions_target_id_fkey"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      session_wallets: {
        Row: {
          balance: number
          closed_at: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          locked_amount: number
          match_id: string | null
          permissions: string[] | null
          status: Database["public"]["Enums"]["session_status"] | null
          user_id: string
        }
        Insert: {
          balance: number
          closed_at?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          locked_amount: number
          match_id?: string | null
          permissions?: string[] | null
          status?: Database["public"]["Enums"]["session_status"] | null
          user_id: string
        }
        Update: {
          balance?: number
          closed_at?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          locked_amount?: number
          match_id?: string | null
          permissions?: string[] | null
          status?: Database["public"]["Enums"]["session_status"] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_wallets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      card_type: "ATTACK" | "DEFENSE" | "TRICK" | "SPECIAL"
      match_status: "WAITING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"
      session_status: "ACTIVE" | "CLOSED" | "EXPIRED"
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
      card_type: ["ATTACK", "DEFENSE", "TRICK", "SPECIAL"],
      match_status: ["WAITING", "IN_PROGRESS", "COMPLETED", "CANCELLED"],
      session_status: ["ACTIVE", "CLOSED", "EXPIRED"],
    },
  },
} as const
