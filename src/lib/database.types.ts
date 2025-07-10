export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      products: {
        Row: {
          id: string
          code: string
          name: string
          price: number
          image: string
          category: string
          featured: boolean
          created_at: string
          updated_at: string
          description?: string
          brand?: string
          supplier?: string
          visible: boolean
        }
        Insert: {
          id?: string
          code: string
          name: string
          price: number
          image: string
          category: string
          featured?: boolean
          created_at?: string
          updated_at?: string
          description?: string
          brand?: string
          supplier?: string
          visible?: boolean
        }
        Update: {
          id?: string
          code?: string
          name?: string
          price?: number
          image?: string
          category?: string
          featured?: boolean
          created_at?: string
          updated_at?: string
          description?: string
          brand?: string
          supplier?: string
          visible?: boolean
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          icon: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          icon: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          icon?: string
          created_at?: string
          updated_at?: string
        }
      }
      banner_slides: {
        Row: {
          id: string
          title: string
          subtitle: string
          image: string
          mobile_image?: string
          order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          subtitle: string
          image: string
          mobile_image?: string
          order: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          subtitle?: string
          image?: string
          mobile_image?: string
          order?: number
          created_at?: string
          updated_at?: string
        }
      }
      catalog_clients: {
        Row: {
          id: string
          name: string | null
          dni: string
          cuit?: string
          celular?: string
          email?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name?: string | null
          dni: string
          cuit?: string
          celular?: string
          email?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string | null
          dni?: string
          cuit?: string
          celular?: string
          email?: string
          created_at?: string
          updated_at?: string
        }
      }
      catalog_leads: {
        Row: {
          id: string
          dni?: string
          email: string
          status: string
          created_at: string
          updated_at: string
          last_attempt: string
        }
        Insert: {
          id?: string
          dni?: string
          email: string
          status?: string
          created_at?: string
          updated_at?: string
          last_attempt?: string
        }
        Update: {
          id?: string
          dni?: string
          email?: string
          status?: string
          created_at?: string
          updated_at?: string
          last_attempt?: string
        }
      }
    }
  }
}