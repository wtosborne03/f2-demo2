export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      games: {
        Row: {
          created_at: string
          id: number
          rounds: number
        }
        Insert: {
          created_at?: string
          id?: number
          rounds?: number
        }
        Update: {
          created_at?: string
          id?: number
          rounds?: number
        }
        Relationships: []
      }
      games_played: {
        Row: {
          doubloons: number
          drinks: number
          game: number
          user: string
          won: boolean
        }
        Insert: {
          doubloons?: number
          drinks?: number
          game: number
          user: string
          won?: boolean
        }
        Update: {
          doubloons?: number
          drinks?: number
          game?: number
          user?: string
          won?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "games_played_game_fkey"
            columns: ["game"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "games_played_user_fkey"
            columns: ["user"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      minigames: {
        Row: {
          created_at: string
          id: number
          name: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          name?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          name?: string | null
        }
        Relationships: []
      }
      owned: {
        Row: {
          created_at: string
          item_id: number
          user_id: string
        }
        Insert: {
          created_at?: string
          item_id: number
          user_id: string
        }
        Update: {
          created_at?: string
          item_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "owned_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "shop"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "owned_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      prompts: {
        Row: {
          content: string
          created_at: string
          game: number
          id: number
          minigame: number
          prompt: string | null
          type: number
          user: string | null
          votes: number | null
        }
        Insert: {
          content: string
          created_at?: string
          game: number
          id?: number
          minigame: number
          prompt?: string | null
          type?: number
          user?: string | null
          votes?: number | null
        }
        Update: {
          content?: string
          created_at?: string
          game?: number
          id?: number
          minigame?: number
          prompt?: string | null
          type?: number
          user?: string | null
          votes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "prompts_game_fkey"
            columns: ["game"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prompts_minigame_fkey"
            columns: ["minigame"]
            isOneToOne: false
            referencedRelation: "minigames"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prompts_user_fkey"
            columns: ["user"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      shop: {
        Row: {
          created_at: string
          description: string | null
          id: number
          name: string
          price: number
          thumbnail: string | null
          type: number
          value: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: number
          name: string
          price: number
          thumbnail?: string | null
          type: number
          value: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: number
          name?: string
          price?: number
          thumbnail?: string | null
          type?: number
          value?: number
        }
        Relationships: []
      }
      users: {
        Row: {
          avatar_emote: number
          avatar_eyes: number | null
          avatar_hair: number | null
          avatar_mouth: number | null
          created_at: string
          dollars: number
          email: string | null
          game_name: string | null
          id: string
        }
        Insert: {
          avatar_emote?: number
          avatar_eyes?: number | null
          avatar_hair?: number | null
          avatar_mouth?: number | null
          created_at?: string
          dollars?: number
          email?: string | null
          game_name?: string | null
          id?: string
        }
        Update: {
          avatar_emote?: number
          avatar_eyes?: number | null
          avatar_hair?: number | null
          avatar_mouth?: number | null
          created_at?: string
          dollars?: number
          email?: string | null
          game_name?: string | null
          id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
