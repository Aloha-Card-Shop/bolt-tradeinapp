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
      cards: {
        Row: {
          id: string
          name: string
          set_name: string | null
          card_number: string | null
          game: 'pokemon' | 'japanese-pokemon' | 'magic'
          image_url: string | null
          rarity: string | null
          market_price: number | null
          low_price: number | null
          mid_price: number | null
          high_price: number | null
          last_updated: string
          tcgplayer_url: string | null
          attributes: Json
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          set_name?: string | null
          card_number?: string | null
          game: 'pokemon' | 'japanese-pokemon' | 'magic'
          image_url?: string | null
          rarity?: string | null
          market_price?: number | null
          low_price?: number | null
          mid_price?: number | null
          high_price?: number | null
          last_updated?: string
          tcgplayer_url?: string | null
          attributes?: Json
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          set_name?: string | null
          card_number?: string | null
          game?: 'pokemon' | 'japanese-pokemon' | 'magic'
          image_url?: string | null
          rarity?: string | null
          market_price?: number | null
          low_price?: number | null
          mid_price?: number | null
          high_price?: number | null
          last_updated?: string
          tcgplayer_url?: string | null
          attributes?: Json
          created_at?: string
        }
      }
      customers: {
        Row: {
          id: string
          first_name: string
          last_name: string
          email: string | null
          phone: string | null
          address: string | null
          created_at: string
        }
        Insert: {
          id?: string
          first_name: string
          last_name: string
          email?: string | null
          phone?: string | null
          address?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          first_name?: string
          last_name?: string
          email?: string | null
          phone?: string | null
          address?: string | null
          created_at?: string
        }
      }
      trade_ins: {
        Row: {
          id: string
          customer_id: string
          trade_in_date: string
          total_value: number
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          trade_in_date?: string
          total_value?: number
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          trade_in_date?: string
          total_value?: number
          notes?: string | null
          created_at?: string
        }
      }
      trade_in_items: {
        Row: {
          id: string
          trade_in_id: string
          card_id: string
          quantity: number
          price: number
          condition: 'near_mint' | 'lightly_played' | 'moderately_played' | 'heavily_played' | 'damaged'
          created_at: string
          attributes: Json
        }
        Insert: {
          id?: string
          trade_in_id: string
          card_id: string
          quantity?: number
          price: number
          condition?: 'near_mint' | 'lightly_played' | 'moderately_played' | 'heavily_played' | 'damaged'
          created_at?: string
          attributes?: Json
        }
        Update: {
          id?: string
          trade_in_id?: string
          card_id?: string
          quantity?: number
          price?: number
          condition?: 'near_mint' | 'lightly_played' | 'moderately_played' | 'heavily_played' | 'damaged'
          created_at?: string
          attributes?: Json
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      card_condition: 'near_mint' | 'lightly_played' | 'moderately_played' | 'heavily_played' | 'damaged'
      game_type: 'pokemon' | 'japanese-pokemon' | 'magic'
    }
  }
}