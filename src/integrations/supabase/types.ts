export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
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
      card_inventory: {
        Row: {
          card_id: string
          created_at: string | null
          current_selling_price: number | null
          id: string
          import_source: string | null
          last_price_check: string | null
          last_printed_at: string | null
          market_price: number | null
          notes: string | null
          print_count: number | null
          printed: boolean | null
          printed_by: string | null
          processed_at: string | null
          processed_by: string | null
          shopify_product_id: string | null
          shopify_sync_error: string | null
          shopify_synced: boolean | null
          shopify_synced_at: string | null
          shopify_variant_id: string | null
          sku: string | null
          status: string | null
          trade_in_item_id: string | null
          trade_in_price: number
          updated_at: string | null
        }
        Insert: {
          card_id: string
          created_at?: string | null
          current_selling_price?: number | null
          id?: string
          import_source?: string | null
          last_price_check?: string | null
          last_printed_at?: string | null
          market_price?: number | null
          notes?: string | null
          print_count?: number | null
          printed?: boolean | null
          printed_by?: string | null
          processed_at?: string | null
          processed_by?: string | null
          shopify_product_id?: string | null
          shopify_sync_error?: string | null
          shopify_synced?: boolean | null
          shopify_synced_at?: string | null
          shopify_variant_id?: string | null
          sku?: string | null
          status?: string | null
          trade_in_item_id?: string | null
          trade_in_price: number
          updated_at?: string | null
        }
        Update: {
          card_id?: string
          created_at?: string | null
          current_selling_price?: number | null
          id?: string
          import_source?: string | null
          last_price_check?: string | null
          last_printed_at?: string | null
          market_price?: number | null
          notes?: string | null
          print_count?: number | null
          printed?: boolean | null
          printed_by?: string | null
          processed_at?: string | null
          processed_by?: string | null
          shopify_product_id?: string | null
          shopify_sync_error?: string | null
          shopify_synced?: boolean | null
          shopify_synced_at?: string | null
          shopify_variant_id?: string | null
          sku?: string | null
          status?: string | null
          trade_in_item_id?: string | null
          trade_in_price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "card_inventory_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_inventory_printed_by_fkey"
            columns: ["printed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_inventory_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_inventory_trade_in_item_id_fkey"
            columns: ["trade_in_item_id"]
            isOneToOne: false
            referencedRelation: "trade_in_items"
            referencedColumns: ["id"]
          },
        ]
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
      condensed_cards_by_condition_with_number: {
        Row: {
          card_number: string | null
          created_at: string | null
          damaged_price: number | null
          heavily_played_price: number | null
          id: string
          image_url: string | null
          lightly_played_price: number | null
          moderately_played_price: number | null
          name: string | null
          near_mint_price: number | null
          rarity: string | null
          set_name: string | null
          tcgplayer_url: string | null
        }
        Insert: {
          card_number?: string | null
          created_at?: string | null
          damaged_price?: number | null
          heavily_played_price?: number | null
          id?: string
          image_url?: string | null
          lightly_played_price?: number | null
          moderately_played_price?: number | null
          name?: string | null
          near_mint_price?: number | null
          rarity?: string | null
          set_name?: string | null
          tcgplayer_url?: string | null
        }
        Update: {
          card_number?: string | null
          created_at?: string | null
          damaged_price?: number | null
          heavily_played_price?: number | null
          id?: string
          image_url?: string | null
          lightly_played_price?: number | null
          moderately_played_price?: number | null
          name?: string | null
          near_mint_price?: number | null
          rarity?: string | null
          set_name?: string | null
          tcgplayer_url?: string | null
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
      event_category_mappings: {
        Row: {
          created_at: string
          created_by: string | null
          event_category: string
          id: string
          shopify_tag: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          event_category: string
          id?: string
          shopify_tag: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          event_category?: string
          id?: string
          shopify_tag?: string
        }
        Relationships: []
      }
      event_registrations: {
        Row: {
          event_id: string
          id: string
          registered_at: string
          status: string
          user_id: string
        }
        Insert: {
          event_id: string
          id?: string
          registered_at?: string
          status?: string
          user_id: string
        }
        Update: {
          event_id?: string
          id?: string
          registered_at?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          current_attendees: number
          date: string
          description: string | null
          id: string
          location: string
          max_attendees: number
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          created_by?: string | null
          current_attendees?: number
          date: string
          description?: string | null
          id?: string
          location: string
          max_attendees?: number
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          current_attendees?: number
          date?: string
          description?: string | null
          id?: string
          location?: string
          max_attendees?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      featured_shopify_products: {
        Row: {
          compare_at_price: number | null
          created_at: string
          description: string | null
          display_order: number | null
          handle: string
          id: string
          image_alt_text: string | null
          image_url: string | null
          is_featured: boolean | null
          price: number | null
          product_type: string | null
          shopify_created_at: string | null
          shopify_product_id: string
          shopify_updated_at: string | null
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string
          vendor: string | null
        }
        Insert: {
          compare_at_price?: number | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          handle: string
          id?: string
          image_alt_text?: string | null
          image_url?: string | null
          is_featured?: boolean | null
          price?: number | null
          product_type?: string | null
          shopify_created_at?: string | null
          shopify_product_id: string
          shopify_updated_at?: string | null
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          vendor?: string | null
        }
        Update: {
          compare_at_price?: number | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          handle?: string
          id?: string
          image_alt_text?: string | null
          image_url?: string | null
          is_featured?: boolean | null
          price?: number | null
          product_type?: string | null
          shopify_created_at?: string | null
          shopify_product_id?: string
          shopify_updated_at?: string | null
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          vendor?: string | null
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
      inventory_movements: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          inventory_item_id: string
          movement_type: string
          quantity_after: number
          quantity_before: number
          quantity_change: number
          reason: string | null
          reference_id: string | null
          reference_type: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          inventory_item_id: string
          movement_type: string
          quantity_after: number
          quantity_before: number
          quantity_change: number
          reason?: string | null
          reference_id?: string | null
          reference_type?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          inventory_item_id?: string
          movement_type?: string
          quantity_after?: number
          quantity_before?: number
          quantity_change?: number
          reason?: string | null
          reference_id?: string | null
          reference_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "card_inventory"
            referencedColumns: ["id"]
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
      master_cards: {
        Row: {
          attributes: Json | null
          card_number: string | null
          cards_table_match_id: string | null
          created_at: string
          damaged_price: number | null
          data_sources: string[] | null
          game: Database["public"]["Enums"]["game_type"] | null
          heavily_played_price: number | null
          high_price: number | null
          id: string
          image_url: string | null
          lightly_played_price: number | null
          low_price: number | null
          market_price: number | null
          match_confidence: number | null
          mid_price: number | null
          moderately_played_price: number | null
          name: string | null
          near_mint_price: number | null
          rarity: string | null
          set_name: string | null
          tcgplayer_url: string | null
          updated_at: string
        }
        Insert: {
          attributes?: Json | null
          card_number?: string | null
          cards_table_match_id?: string | null
          created_at?: string
          damaged_price?: number | null
          data_sources?: string[] | null
          game?: Database["public"]["Enums"]["game_type"] | null
          heavily_played_price?: number | null
          high_price?: number | null
          id?: string
          image_url?: string | null
          lightly_played_price?: number | null
          low_price?: number | null
          market_price?: number | null
          match_confidence?: number | null
          mid_price?: number | null
          moderately_played_price?: number | null
          name?: string | null
          near_mint_price?: number | null
          rarity?: string | null
          set_name?: string | null
          tcgplayer_url?: string | null
          updated_at?: string
        }
        Update: {
          attributes?: Json | null
          card_number?: string | null
          cards_table_match_id?: string | null
          created_at?: string
          damaged_price?: number | null
          data_sources?: string[] | null
          game?: Database["public"]["Enums"]["game_type"] | null
          heavily_played_price?: number | null
          high_price?: number | null
          id?: string
          image_url?: string | null
          lightly_played_price?: number | null
          low_price?: number | null
          market_price?: number | null
          match_confidence?: number | null
          mid_price?: number | null
          moderately_played_price?: number | null
          name?: string | null
          near_mint_price?: number | null
          rarity?: string | null
          set_name?: string | null
          tcgplayer_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      pokemon_set_group: {
        Row: {
          poketcg_reldate: string | null
          poketcg_sid: string | null
          poketcg_sname: string | null
          tcgcsv_id: Json | null
          tcgcsv_pubdate: string | null
          tcgcsv_sabb: Json | null
          tcgcsv_sname: string | null
          tcgdex_sname: string | null
        }
        Insert: {
          poketcg_reldate?: string | null
          poketcg_sid?: string | null
          poketcg_sname?: string | null
          tcgcsv_id?: Json | null
          tcgcsv_pubdate?: string | null
          tcgcsv_sabb?: Json | null
          tcgcsv_sname?: string | null
          tcgdex_sname?: string | null
        }
        Update: {
          poketcg_reldate?: string | null
          poketcg_sid?: string | null
          poketcg_sname?: string | null
          tcgcsv_id?: Json | null
          tcgcsv_pubdate?: string | null
          tcgcsv_sabb?: Json | null
          tcgcsv_sname?: string | null
          tcgdex_sname?: string | null
        }
        Relationships: []
      }
      poketcg_products: {
        Row: {
          dg_id: string | null
          pg_id: string | null
          pp_artist: string | null
          pp_fed: number | null
          pp_fed_hf: number | null
          pp_hf: number | null
          pp_id: string | null
          pp_image: string | null
          pp_name: string | null
          pp_norm: number | null
          pp_pokedex: number | null
          pp_r_rh: number | null
          pp_rarity: string | null
          pp_unlim: number | null
          pp_unlim_hf: number | null
          pp_url: string | null
          tg_id: number | null
        }
        Insert: {
          dg_id?: string | null
          pg_id?: string | null
          pp_artist?: string | null
          pp_fed?: number | null
          pp_fed_hf?: number | null
          pp_hf?: number | null
          pp_id?: string | null
          pp_image?: string | null
          pp_name?: string | null
          pp_norm?: number | null
          pp_pokedex?: number | null
          pp_r_rh?: number | null
          pp_rarity?: string | null
          pp_unlim?: number | null
          pp_unlim_hf?: number | null
          pp_url?: string | null
          tg_id?: number | null
        }
        Update: {
          dg_id?: string | null
          pg_id?: string | null
          pp_artist?: string | null
          pp_fed?: number | null
          pp_fed_hf?: number | null
          pp_hf?: number | null
          pp_id?: string | null
          pp_image?: string | null
          pp_name?: string | null
          pp_norm?: number | null
          pp_pokedex?: number | null
          pp_r_rh?: number | null
          pp_rarity?: string | null
          pp_unlim?: number | null
          pp_unlim_hf?: number | null
          pp_url?: string | null
          tg_id?: number | null
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
      shop_category_mappings: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          shop_category: string
          shopify_tag: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          shop_category: string
          shopify_tag: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          shop_category?: string
          shopify_tag?: string
        }
        Relationships: []
      }
      shopify_collection_sync_settings: {
        Row: {
          auto_add_products: boolean | null
          auto_price_products: boolean | null
          collection_id: string
          created_at: string
          created_by: string | null
          id: string
          sync_enabled: boolean
          sync_frequency: string | null
          updated_at: string
        }
        Insert: {
          auto_add_products?: boolean | null
          auto_price_products?: boolean | null
          collection_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          sync_enabled?: boolean
          sync_frequency?: string | null
          updated_at?: string
        }
        Update: {
          auto_add_products?: boolean | null
          auto_price_products?: boolean | null
          collection_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          sync_enabled?: boolean
          sync_frequency?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shopify_collection_sync_settings_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "shopify_collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopify_collection_sync_settings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      shopify_collections: {
        Row: {
          collection_type: string | null
          created_at: string
          description: string | null
          handle: string
          id: string
          image_url: string | null
          last_synced_at: string | null
          product_count: number | null
          published: boolean | null
          shopify_collection_id: string
          title: string
          updated_at: string
        }
        Insert: {
          collection_type?: string | null
          created_at?: string
          description?: string | null
          handle: string
          id?: string
          image_url?: string | null
          last_synced_at?: string | null
          product_count?: number | null
          published?: boolean | null
          shopify_collection_id: string
          title: string
          updated_at?: string
        }
        Update: {
          collection_type?: string | null
          created_at?: string
          description?: string | null
          handle?: string
          id?: string
          image_url?: string | null
          last_synced_at?: string | null
          product_count?: number | null
          published?: boolean | null
          shopify_collection_id?: string
          title?: string
          updated_at?: string
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
      shopify_sales_tracking: {
        Row: {
          created_at: string
          currency: string | null
          error_message: string | null
          id: string
          inventory_item_id: string | null
          line_item_id: string
          price: number
          processed: boolean | null
          processed_at: string | null
          quantity_sold: number
          shopify_order_id: string
          shopify_order_number: string | null
          shopify_product_id: string | null
          shopify_variant_id: string | null
          sku: string | null
          total_amount: number
          webhook_data: Json | null
        }
        Insert: {
          created_at?: string
          currency?: string | null
          error_message?: string | null
          id?: string
          inventory_item_id?: string | null
          line_item_id: string
          price: number
          processed?: boolean | null
          processed_at?: string | null
          quantity_sold: number
          shopify_order_id: string
          shopify_order_number?: string | null
          shopify_product_id?: string | null
          shopify_variant_id?: string | null
          sku?: string | null
          total_amount: number
          webhook_data?: Json | null
        }
        Update: {
          created_at?: string
          currency?: string | null
          error_message?: string | null
          id?: string
          inventory_item_id?: string | null
          line_item_id?: string
          price?: number
          processed?: boolean | null
          processed_at?: string | null
          quantity_sold?: number
          shopify_order_id?: string
          shopify_order_number?: string | null
          shopify_product_id?: string | null
          shopify_variant_id?: string | null
          sku?: string | null
          total_amount?: number
          webhook_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "shopify_sales_tracking_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "card_inventory"
            referencedColumns: ["id"]
          },
        ]
      }
      shopify_settings: {
        Row: {
          access_token: string
          api_key: string
          api_secret: string
          created_at: string | null
          id: string
          is_active: boolean | null
          shop_domain: string
          storefront_access_token: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          access_token: string
          api_key: string
          api_secret: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          shop_domain: string
          storefront_access_token?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          access_token?: string
          api_key?: string
          api_secret?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          shop_domain?: string
          storefront_access_token?: string | null
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
      tcgcsv: {
        Row: {
          data_type: string
          id: string
          imported_at: string
          imported_by: string | null
          raw_data: Json
          record_count: number
          source_endpoint: string
          source_name: string
        }
        Insert: {
          data_type: string
          id?: string
          imported_at?: string
          imported_by?: string | null
          raw_data: Json
          record_count?: number
          source_endpoint: string
          source_name: string
        }
        Update: {
          data_type?: string
          id?: string
          imported_at?: string
          imported_by?: string | null
          raw_data?: Json
          record_count?: number
          source_endpoint?: string
          source_name?: string
        }
        Relationships: []
      }
      tcgcsv_products: {
        Row: {
          category_id: string | null
          dg_id: string | null
          pg_id: string | null
          tg_id: number | null
          tp_card_no: string | null
          tp_id: number | null
          tp_name: string | null
          tp_presale: string | null
          tp_rarity: string | null
          tp_url: string | null
        }
        Insert: {
          category_id?: string | null
          dg_id?: string | null
          pg_id?: string | null
          tg_id?: number | null
          tp_card_no?: string | null
          tp_id?: number | null
          tp_name?: string | null
          tp_presale?: string | null
          tp_rarity?: string | null
          tp_url?: string | null
        }
        Update: {
          category_id?: string | null
          dg_id?: string | null
          pg_id?: string | null
          tg_id?: number | null
          tp_card_no?: string | null
          tp_id?: number | null
          tp_name?: string | null
          tp_presale?: string | null
          tp_rarity?: string | null
          tp_url?: string | null
        }
        Relationships: []
      }
      tcgdex_products: {
        Row: {
          dg_id: string | null
          dp_card_no: string | null
          dp_fed: number | null
          dp_fed_hf: number | null
          dp_hf: number | null
          dp_name: string | null
          dp_norm: number | null
          dp_r_hf: number | null
          dp_unlim: number | null
          dp_unlim_hf: number | null
          pg_id: string | null
          tg_id: number | null
        }
        Insert: {
          dg_id?: string | null
          dp_card_no?: string | null
          dp_fed?: number | null
          dp_fed_hf?: number | null
          dp_hf?: number | null
          dp_name?: string | null
          dp_norm?: number | null
          dp_r_hf?: number | null
          dp_unlim?: number | null
          dp_unlim_hf?: number | null
          pg_id?: string | null
          tg_id?: number | null
        }
        Update: {
          dg_id?: string | null
          dp_card_no?: string | null
          dp_fed?: number | null
          dp_fed_hf?: number | null
          dp_hf?: number | null
          dp_name?: string | null
          dp_norm?: number | null
          dp_r_hf?: number | null
          dp_unlim?: number | null
          dp_unlim_hf?: number | null
          pg_id?: string | null
          tg_id?: number | null
        }
        Relationships: []
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
          normal: string | null
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
          normal?: string | null
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
          normal?: string | null
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
      pokemon_products: {
        Row: {
          card_no: string | null
          category_id: string | null
          group_id: Json | null
          name: Json | null
          presale_info: Json | null
          product_id: Json | null
          rarity: string | null
          url: Json | null
        }
        Relationships: []
      }
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
