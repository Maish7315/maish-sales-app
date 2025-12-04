import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check your .env file.')
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          full_name: string
          phone_number: string
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          username: string
          full_name: string
          phone_number: string
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          full_name?: string
          phone_number?: string
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      sales: {
        Row: {
          id: string
          user_id: string
          item_description: string
          amount_cents: number
          commission_cents: number
          timestamp: string
          photo_url: string | null
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          item_description: string
          amount_cents: number
          commission_cents: number
          timestamp?: string
          photo_url?: string | null
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          item_description?: string
          amount_cents?: number
          commission_cents?: number
          timestamp?: string
          photo_url?: string | null
          status?: string
          created_at?: string
        }
      }
    }
  }
}