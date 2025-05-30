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
      api_keys: {
        Row: {
          description: string | null
          expiration_date: string | null
          id: string
          is_active: boolean | null
          key_name: string
          key_value: string
          last_updated: string
          updated_by: string | null
        }
        Insert: {
          description?: string | null
          expiration_date?: string | null
          id?: string
          is_active?: boolean | null
          key_name: string
          key_value: string
          last_updated?: string
          updated_by?: string | null
        }
        Update: {
          description?: string | null
          expiration_date?: string | null
          id?: string
          is_active?: boolean | null
          key_name?: string
          key_value?: string
          last_updated?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      barcode_settings: {
        Row: {
          description: string | null
          id: string
          setting_name: string
          setting_value: Json
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          description?: string | null
          id?: string
          setting_name: string
          setting_value: Json
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          description?: string | null
          id?: string
          setting_name?: string
          setting_value?: Json
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      barcode_templates: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_default: boolean | null
          name: string
          updated_at: string | null
          zpl_template: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          updated_at?: string | null
          zpl_template: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          updated_at?: string | null
          zpl_template?: string
        }
        Relationships: []
      }
      cards: {
        Row: {
          attributes: Json | null
          card_number: string | null
          created_at: string | null
          game: Database["public"]["Enums"]["game_type"]
          high_price: number | null
          id: string
          image_url: string | null
          last_updated: string | null
          low_price: number | null
          market_price: number | null
          mid_price: number | null
          name: string
          rarity: string | null
          set_name: string | null
          tcgplayer_url: string | null
        }
        Insert: {
          attributes?: Json | null
          card_number?: string | null
          created_at?: string | null
          game: Database["public"]["Enums"]["game_type"]
          high_price?: number | null
          id?: string
          image_url?: string | null
          last_updated?: string | null
          low_price?: number | null
          market_price?: number | null
          mid_price?: number | null
          name: string
          rarity?: string | null
          set_name?: string | null
          tcgplayer_url?: string | null
        }
        Update: {
          attributes?: Json | null
          card_number?: string | null
          created_at?: string | null
          game?: Database["public"]["Enums"]["game_type"]
          high_price?: number | null
          id?: string
          image_url?: string | null
          last_updated?: string | null
          low_price?: number | null
          market_price?: number | null
          mid_price?: number | null
          name?: string
          rarity?: string | null
          set_name?: string | null
          tcgplayer_url?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          category_description: string | null
          category_id: number
          category_page_title: string | null
          condition_guide_url: string | null
          display_name: string | null
          is_direct: boolean | null
          is_scannable: boolean | null
          modified_on: string
          name: string
          non_sealed_label: string | null
          popularity: number | null
          sealed_label: string | null
          seo_category_name: string | null
        }
        Insert: {
          category_description?: string | null
          category_id: number
          category_page_title?: string | null
          condition_guide_url?: string | null
          display_name?: string | null
          is_direct?: boolean | null
          is_scannable?: boolean | null
          modified_on?: string
          name: string
          non_sealed_label?: string | null
          popularity?: number | null
          sealed_label?: string | null
          seo_category_name?: string | null
        }
        Update: {
          category_description?: string | null
          category_id?: number
          category_page_title?: string | null
          condition_guide_url?: string | null
          display_name?: string | null
          is_direct?: boolean | null
          is_scannable?: boolean | null
          modified_on?: string
          name?: string
          non_sealed_label?: string | null
          popularity?: number | null
          sealed_label?: string | null
          seo_category_name?: string | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          created_at: string | null
          email: string | null
          first_name: string
          id: string
          last_name: string
          phone: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          first_name: string
          id?: string
          last_name: string
          phone?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          first_name?: string
          id?: string
          last_name?: string
          phone?: string | null
        }
        Relationships: []
      }
      groups: {
        Row: {
          abbreviation: string | null
          categoryid: number
          groupid: number
          issupplemental: boolean
          modifiedon: string
          name: string
          publishedon: string
        }
        Insert: {
          abbreviation?: string | null
          categoryid: number
          groupid: number
          issupplemental: boolean
          modifiedon: string
          name: string
          publishedon: string
        }
        Update: {
          abbreviation?: string | null
          categoryid?: number
          groupid?: number
          issupplemental?: boolean
          modifiedon?: string
          name?: string
          publishedon?: string
        }
        Relationships: [
          {
            foreignKeyName: "groups_categoryid_fkey"
            columns: ["categoryid"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["category_id"]
          },
        ]
      }
      locations: {
        Row: {
          address: string | null
          created_at: string
          id: string
          name: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      print_logs: {
        Row: {
          error_message: string | null
          id: string
          print_job_id: string | null
          printed_at: string | null
          printed_by: string
          printer_id: string
          status: string
          template_id: string | null
          trade_in_id: string
        }
        Insert: {
          error_message?: string | null
          id?: string
          print_job_id?: string | null
          printed_at?: string | null
          printed_by: string
          printer_id: string
          status: string
          template_id?: string | null
          trade_in_id: string
        }
        Update: {
          error_message?: string | null
          id?: string
          print_job_id?: string | null
          printed_at?: string | null
          printed_by?: string
          printer_id?: string
          status?: string
          template_id?: string | null
          trade_in_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "print_logs_printer_id_fkey"
            columns: ["printer_id"]
            isOneToOne: false
            referencedRelation: "printers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "print_logs_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "barcode_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "print_logs_trade_in_id_fkey"
            columns: ["trade_in_id"]
            isOneToOne: false
            referencedRelation: "trade_ins"
            referencedColumns: ["id"]
          },
        ]
      }
      printer_models: {
        Row: {
          brand: string
          created_at: string
          id: string
          model: string
          printer_type: string
        }
        Insert: {
          brand: string
          created_at?: string
          id?: string
          model: string
          printer_type?: string
        }
        Update: {
          brand?: string
          created_at?: string
          id?: string
          model?: string
          printer_type?: string
        }
        Relationships: []
      }
      printers: {
        Row: {
          created_at: string
          id: string
          is_default: boolean | null
          location_id: string
          name: string
          printer_id: string
          printer_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_default?: boolean | null
          location_id: string
          name: string
          printer_id: string
          printer_type?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_default?: boolean | null
          location_id?: string
          name?: string
          printer_id?: string
          printer_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "printers_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          role: string
          username: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          role?: string
          username?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          role?: string
          username?: string | null
        }
        Relationships: []
      }
      shopify_field_mappings: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          mapping_type: string
          sort_order: number | null
          source_field: string
          target_field: string
          transform_template: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          mapping_type?: string
          sort_order?: number | null
          source_field: string
          target_field: string
          transform_template?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          mapping_type?: string
          sort_order?: number | null
          source_field?: string
          target_field?: string
          transform_template?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      shopify_settings: {
        Row: {
          access_token: string
          api_key: string
          api_secret: string
          created_at: string | null
          id: string
          shop_domain: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          access_token: string
          api_key: string
          api_secret: string
          created_at?: string | null
          id?: string
          shop_domain: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          access_token?: string
          api_key?: string
          api_secret?: string
          created_at?: string | null
          id?: string
          shop_domain?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      shopify_sync_logs: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          item_id: string | null
          message: string | null
          status: string
          trade_in_id: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          item_id?: string | null
          message?: string | null
          status: string
          trade_in_id?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          item_id?: string | null
          message?: string | null
          status?: string
          trade_in_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shopify_sync_logs_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "trade_in_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopify_sync_logs_trade_in_id_fkey"
            columns: ["trade_in_id"]
            isOneToOne: false
            referencedRelation: "trade_ins"
            referencedColumns: ["id"]
          },
        ]
      }
      trade_in_items: {
        Row: {
          attributes: Json | null
          card_id: string
          condition: Database["public"]["Enums"]["card_condition"]
          created_at: string | null
          id: string
          price: number
          quantity: number
          shopify_inventory_item_id: string | null
          shopify_product_id: string | null
          shopify_sync_status: string | null
          shopify_synced_at: string | null
          shopify_variant_id: string | null
          trade_in_id: string
        }
        Insert: {
          attributes?: Json | null
          card_id: string
          condition?: Database["public"]["Enums"]["card_condition"]
          created_at?: string | null
          id?: string
          price: number
          quantity?: number
          shopify_inventory_item_id?: string | null
          shopify_product_id?: string | null
          shopify_sync_status?: string | null
          shopify_synced_at?: string | null
          shopify_variant_id?: string | null
          trade_in_id: string
        }
        Update: {
          attributes?: Json | null
          card_id?: string
          condition?: Database["public"]["Enums"]["card_condition"]
          created_at?: string | null
          id?: string
          price?: number
          quantity?: number
          shopify_inventory_item_id?: string | null
          shopify_product_id?: string | null
          shopify_sync_status?: string | null
          shopify_synced_at?: string | null
          shopify_variant_id?: string | null
          trade_in_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trade_in_items_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trade_in_items_trade_in_id_fkey"
            columns: ["trade_in_id"]
            isOneToOne: false
            referencedRelation: "trade_ins"
            referencedColumns: ["id"]
          },
        ]
      }
      trade_ins: {
        Row: {
          cash_value: number
          created_at: string | null
          customer_id: string
          handled_at: string | null
          handled_by: string | null
          id: string
          last_printed_at: string | null
          notes: string | null
          payment_type: string
          print_count: number | null
          printed: boolean | null
          printed_by: string | null
          printer_id: string | null
          shopify_synced: boolean | null
          shopify_synced_at: string | null
          shopify_synced_by: string | null
          staff_notes: string | null
          status: string
          total_value: number
          trade_in_date: string | null
          trade_value: number
        }
        Insert: {
          cash_value?: number
          created_at?: string | null
          customer_id: string
          handled_at?: string | null
          handled_by?: string | null
          id?: string
          last_printed_at?: string | null
          notes?: string | null
          payment_type?: string
          print_count?: number | null
          printed?: boolean | null
          printed_by?: string | null
          printer_id?: string | null
          shopify_synced?: boolean | null
          shopify_synced_at?: string | null
          shopify_synced_by?: string | null
          staff_notes?: string | null
          status?: string
          total_value?: number
          trade_in_date?: string | null
          trade_value?: number
        }
        Update: {
          cash_value?: number
          created_at?: string | null
          customer_id?: string
          handled_at?: string | null
          handled_by?: string | null
          id?: string
          last_printed_at?: string | null
          notes?: string | null
          payment_type?: string
          print_count?: number | null
          printed?: boolean | null
          printed_by?: string | null
          printer_id?: string | null
          shopify_synced?: boolean | null
          shopify_synced_at?: string | null
          shopify_synced_by?: string | null
          staff_notes?: string | null
          status?: string
          total_value?: number
          trade_in_date?: string | null
          trade_value?: number
        }
        Relationships: [
          {
            foreignKeyName: "trade_ins_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trade_ins_printer_id_fkey"
            columns: ["printer_id"]
            isOneToOne: false
            referencedRelation: "printers"
            referencedColumns: ["id"]
          },
        ]
      }
      trade_value_settings: {
        Row: {
          cash_percentage: number
          created_at: string | null
          fixed_cash_value: number | null
          fixed_trade_value: number | null
          game: Database["public"]["Enums"]["game_type"]
          id: string
          max_value: number
          min_value: number
          trade_percentage: number
          updated_at: string | null
        }
        Insert: {
          cash_percentage?: number
          created_at?: string | null
          fixed_cash_value?: number | null
          fixed_trade_value?: number | null
          game: Database["public"]["Enums"]["game_type"]
          id?: string
          max_value?: number
          min_value?: number
          trade_percentage?: number
          updated_at?: string | null
        }
        Update: {
          cash_percentage?: number
          created_at?: string | null
          fixed_cash_value?: number | null
          fixed_trade_value?: number | null
          game?: Database["public"]["Enums"]["game_type"]
          id?: string
          max_value?: number
          min_value?: number
          trade_percentage?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      unified_products: {
        Row: {
          attributes: Json | null
          card_number: string | null
          card_number_backup: string | null
          category_id: number
          clean_name: string | null
          created_at: string | null
          first_edition: string | null
          first_edition_holofoil: string | null
          group_id: number
          holofoil: string | null
          id: number
          image_count: number | null
          image_url: string | null
          is_presale: boolean | null
          modified_on: string | null
          name: string
          presale_note: string | null
          product_id: number
          released_on: string | null
          reverse_holofoil: string | null
          tcgplayer_product_id: string | null
          unlimited: string | null
          unlimited_holofoil: string | null
          url: string | null
        }
        Insert: {
          attributes?: Json | null
          card_number?: string | null
          card_number_backup?: string | null
          category_id: number
          clean_name?: string | null
          created_at?: string | null
          first_edition?: string | null
          first_edition_holofoil?: string | null
          group_id: number
          holofoil?: string | null
          id?: number
          image_count?: number | null
          image_url?: string | null
          is_presale?: boolean | null
          modified_on?: string | null
          name: string
          presale_note?: string | null
          product_id: number
          released_on?: string | null
          reverse_holofoil?: string | null
          tcgplayer_product_id?: string | null
          unlimited?: string | null
          unlimited_holofoil?: string | null
          url?: string | null
        }
        Update: {
          attributes?: Json | null
          card_number?: string | null
          card_number_backup?: string | null
          category_id?: number
          clean_name?: string | null
          created_at?: string | null
          first_edition?: string | null
          first_edition_holofoil?: string | null
          group_id?: number
          holofoil?: string | null
          id?: number
          image_count?: number | null
          image_url?: string | null
          is_presale?: boolean | null
          modified_on?: string | null
          name?: string
          presale_note?: string | null
          product_id?: number
          released_on?: string | null
          reverse_holofoil?: string | null
          tcgplayer_product_id?: string | null
          unlimited?: string | null
          unlimited_holofoil?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "unified_products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "unified_products_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["groupid"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      extract_card_number: {
        Args: { attrs: Json }
        Returns: string
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_trade_value_percentage: {
        Args: {
          p_game: Database["public"]["Enums"]["game_type"]
          p_value: number
          p_payment_type: string
        }
        Returns: number
      }
      has_required_role: {
        Args: { required_roles: string[] }
        Returns: boolean
      }
    }
    Enums: {
      card_condition:
        | "mint"
        | "near_mint"
        | "lightly_played"
        | "moderately_played"
        | "heavily_played"
        | "damaged"
      game_type: "pokemon" | "japanese-pokemon" | "magic"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      card_condition: [
        "mint",
        "near_mint",
        "lightly_played",
        "moderately_played",
        "heavily_played",
        "damaged",
      ],
      game_type: ["pokemon", "japanese-pokemon", "magic"],
    },
  },
} as const
