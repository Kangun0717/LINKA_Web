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
      community_action_log: {
        Row: {
          action: string
          created_at: string
          id: number
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: never
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: never
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_action_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_rate_limits: {
        Row: {
          action: string
          max_count: number
          window_length: string
        }
        Insert: {
          action: string
          max_count: number
          window_length: string
        }
        Update: {
          action?: string
          max_count?: number
          window_length?: string
        }
        Relationships: []
      }
      memories: {
        Row: {
          cover_photo_id: string | null
          created_at: string
          date_precision: string
          id: string
          kind: string
          mood: string | null
          note: string | null
          place_id: string | null
          place_label: string | null
          remembered_on: string | null
          touch_event_id: string | null
          updated_at: string
          user_id: string
          visibility: string
          visit_id: string | null
        }
        Insert: {
          cover_photo_id?: string | null
          created_at?: string
          date_precision?: string
          id?: string
          kind?: string
          mood?: string | null
          note?: string | null
          place_id?: string | null
          place_label?: string | null
          remembered_on?: string | null
          touch_event_id?: string | null
          updated_at?: string
          user_id?: string
          visibility?: string
          visit_id?: string | null
        }
        Update: {
          cover_photo_id?: string | null
          created_at?: string
          date_precision?: string
          id?: string
          kind?: string
          mood?: string | null
          note?: string | null
          place_id?: string | null
          place_label?: string | null
          remembered_on?: string | null
          touch_event_id?: string | null
          updated_at?: string
          user_id?: string
          visibility?: string
          visit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "memories_cover_photo_fkey"
            columns: ["cover_photo_id"]
            isOneToOne: false
            referencedRelation: "memory_photos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memories_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memories_touch_event_id_fkey"
            columns: ["touch_event_id"]
            isOneToOne: false
            referencedRelation: "touch_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memories_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: true
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      memory_photos: {
        Row: {
          alt: string | null
          created_at: string
          height: number
          id: string
          memory_id: string
          position: number
          storage_path: string
          user_id: string
          width: number
        }
        Insert: {
          alt?: string | null
          created_at?: string
          height: number
          id?: string
          memory_id: string
          position?: number
          storage_path: string
          user_id?: string
          width: number
        }
        Update: {
          alt?: string | null
          created_at?: string
          height?: number
          id?: string
          memory_id?: string
          position?: number
          storage_path?: string
          user_id?: string
          width?: number
        }
        Relationships: [
          {
            foreignKeyName: "memory_photos_memory_id_fkey"
            columns: ["memory_id"]
            isOneToOne: false
            referencedRelation: "memories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memory_photos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      place_event_translations: {
        Row: {
          created_at: string
          description: string | null
          event_id: string
          locale: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_id: string
          locale: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          event_id?: string
          locale?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "place_event_translations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "place_events"
            referencedColumns: ["id"]
          },
        ]
      }
      place_events: {
        Row: {
          all_day: boolean
          checked_at: string | null
          created_at: string
          ends_at: string | null
          id: string
          official_url: string | null
          place_id: string
          source_url: string | null
          starts_at: string
          status: string
          updated_at: string
        }
        Insert: {
          all_day?: boolean
          checked_at?: string | null
          created_at?: string
          ends_at?: string | null
          id?: string
          official_url?: string | null
          place_id: string
          source_url?: string | null
          starts_at: string
          status?: string
          updated_at?: string
        }
        Update: {
          all_day?: boolean
          checked_at?: string | null
          created_at?: string
          ends_at?: string | null
          id?: string
          official_url?: string | null
          place_id?: string
          source_url?: string | null
          starts_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "place_events_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
        ]
      }
      place_sources: {
        Row: {
          checked_at: string
          covers: string[]
          created_at: string
          id: string
          note: string | null
          place_id: string
          publisher: string | null
          url: string
        }
        Insert: {
          checked_at: string
          covers?: string[]
          created_at?: string
          id?: string
          note?: string | null
          place_id: string
          publisher?: string | null
          url: string
        }
        Update: {
          checked_at?: string
          covers?: string[]
          created_at?: string
          id?: string
          note?: string | null
          place_id?: string
          publisher?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "place_sources_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
        ]
      }
      place_suggestion_events: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          internal_note: string | null
          is_public: boolean
          kind: string
          occurred_at: string
          public_note: Json
          status: string | null
          suggestion_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          internal_note?: string | null
          is_public?: boolean
          kind: string
          occurred_at?: string
          public_note?: Json
          status?: string | null
          suggestion_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          internal_note?: string | null
          is_public?: boolean
          kind?: string
          occurred_at?: string
          public_note?: Json
          status?: string | null
          suggestion_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "place_suggestion_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "place_suggestion_events_suggestion_id_fkey"
            columns: ["suggestion_id"]
            isOneToOne: false
            referencedRelation: "place_suggestions"
            referencedColumns: ["id"]
          },
        ]
      }
      place_suggestion_photos: {
        Row: {
          created_at: string
          height: number
          id: string
          position: number
          public_path: string | null
          review_status: string
          storage_path: string
          suggestion_id: string
          user_id: string
          width: number
        }
        Insert: {
          created_at?: string
          height: number
          id?: string
          position?: number
          public_path?: string | null
          review_status?: string
          storage_path: string
          suggestion_id: string
          user_id?: string
          width: number
        }
        Update: {
          created_at?: string
          height?: number
          id?: string
          position?: number
          public_path?: string | null
          review_status?: string
          storage_path?: string
          suggestion_id?: string
          user_id?: string
          width?: number
        }
        Relationships: [
          {
            foreignKeyName: "place_suggestion_photos_suggestion_id_fkey"
            columns: ["suggestion_id"]
            isOneToOne: false
            referencedRelation: "place_suggestions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "place_suggestion_photos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      place_suggestion_supports: {
        Row: {
          created_at: string
          suggestion_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          suggestion_id: string
          user_id?: string
        }
        Update: {
          created_at?: string
          suggestion_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "place_suggestion_supports_suggestion_id_fkey"
            columns: ["suggestion_id"]
            isOneToOne: false
            referencedRelation: "place_suggestions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "place_suggestion_supports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      place_suggestions: {
        Row: {
          address: string | null
          attribution: string
          created_at: string
          duplicate_of: string | null
          id: string
          latitude: number | null
          locale: string | null
          longitude: number | null
          name: string
          opened_at: string | null
          photo_path: string | null
          place_id: string | null
          public_area: string | null
          public_latitude: number | null
          public_longitude: number | null
          public_reason: string | null
          published_at: string | null
          reason: string
          reference_url: string | null
          region_id: string | null
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          support_count: number
          updated_at: string
          user_id: string
          withdrawn_at: string | null
        }
        Insert: {
          address?: string | null
          attribution?: string
          created_at?: string
          duplicate_of?: string | null
          id?: string
          latitude?: number | null
          locale?: string | null
          longitude?: number | null
          name: string
          opened_at?: string | null
          photo_path?: string | null
          place_id?: string | null
          public_area?: string | null
          public_latitude?: number | null
          public_longitude?: number | null
          public_reason?: string | null
          published_at?: string | null
          reason: string
          reference_url?: string | null
          region_id?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          support_count?: number
          updated_at?: string
          user_id?: string
          withdrawn_at?: string | null
        }
        Update: {
          address?: string | null
          attribution?: string
          created_at?: string
          duplicate_of?: string | null
          id?: string
          latitude?: number | null
          locale?: string | null
          longitude?: number | null
          name?: string
          opened_at?: string | null
          photo_path?: string | null
          place_id?: string | null
          public_area?: string | null
          public_latitude?: number | null
          public_longitude?: number | null
          public_reason?: string | null
          published_at?: string | null
          reason?: string
          reference_url?: string | null
          region_id?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          support_count?: number
          updated_at?: string
          user_id?: string
          withdrawn_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "place_suggestions_duplicate_of_fkey"
            columns: ["duplicate_of"]
            isOneToOne: false
            referencedRelation: "place_suggestions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "place_suggestions_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "place_suggestions_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "place_suggestions_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "place_suggestions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      place_translations: {
        Row: {
          content_checked_at: string | null
          created_at: string
          description: string | null
          hero_image_alt: string | null
          locale: string
          locality: string | null
          name: string | null
          official_name: string | null
          place_id: string
          practical_info: Json | null
          practical_info_as_of: string | null
          short_description: string | null
          source_url: string | null
          updated_at: string
        }
        Insert: {
          content_checked_at?: string | null
          created_at?: string
          description?: string | null
          hero_image_alt?: string | null
          locale: string
          locality?: string | null
          name?: string | null
          official_name?: string | null
          place_id: string
          practical_info?: Json | null
          practical_info_as_of?: string | null
          short_description?: string | null
          source_url?: string | null
          updated_at?: string
        }
        Update: {
          content_checked_at?: string | null
          created_at?: string
          description?: string | null
          hero_image_alt?: string | null
          locale?: string
          locality?: string | null
          name?: string | null
          official_name?: string | null
          place_id?: string
          practical_info?: Json | null
          practical_info_as_of?: string | null
          short_description?: string | null
          source_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "place_translations_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
        ]
      }
      places: {
        Row: {
          created_at: string
          discovery_enabled: boolean
          hero_image_credit: string | null
          hero_image_license: string | null
          hero_image_license_url: string | null
          hero_image_path: string | null
          hero_image_source_url: string | null
          id: string
          kind: string
          label_side: string | null
          latitude: number
          longitude: number
          native_locale: string
          native_name: string
          official_url: string | null
          parent_id: string | null
          partner_status: string
          romanized_name: string | null
          slug: string
          status: string
          timezone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          discovery_enabled?: boolean
          hero_image_credit?: string | null
          hero_image_license?: string | null
          hero_image_license_url?: string | null
          hero_image_path?: string | null
          hero_image_source_url?: string | null
          id?: string
          kind?: string
          label_side?: string | null
          latitude: number
          longitude: number
          native_locale?: string
          native_name: string
          official_url?: string | null
          parent_id?: string | null
          partner_status?: string
          romanized_name?: string | null
          slug: string
          status?: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          discovery_enabled?: boolean
          hero_image_credit?: string | null
          hero_image_license?: string | null
          hero_image_license_url?: string | null
          hero_image_path?: string | null
          hero_image_source_url?: string | null
          id?: string
          kind?: string
          label_side?: string | null
          latitude?: number
          longitude?: number
          native_locale?: string
          native_name?: string
          official_url?: string | null
          parent_id?: string | null
          partner_status?: string
          romanized_name?: string | null
          slug?: string
          status?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "places_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          created_at: string
          has_nfc: boolean
          id: string
          is_active: boolean
          is_limited: boolean
          limited_quantity: number | null
          name: string
          price_jpy: number
          product_id: string
          sku: string
          stock_quantity: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          has_nfc?: boolean
          id?: string
          is_active?: boolean
          is_limited?: boolean
          limited_quantity?: number | null
          name: string
          price_jpy: number
          product_id: string
          sku: string
          stock_quantity?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          has_nfc?: boolean
          id?: string
          is_active?: boolean
          is_limited?: boolean
          limited_quantity?: number | null
          name?: string
          price_jpy?: number
          product_id?: string
          sku?: string
          stock_quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          project_id: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          project_id?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          project_id?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          age_range: string | null
          avatar_url: string | null
          created_at: string
          display_name: string | null
          gender: string | null
          id: string
          nationality: string | null
          preferred_locale: string | null
          role: string
          updated_at: string
        }
        Insert: {
          age_range?: string | null
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          gender?: string | null
          id: string
          nationality?: string | null
          preferred_locale?: string | null
          role?: string
          updated_at?: string
        }
        Update: {
          age_range?: string | null
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          gender?: string | null
          id?: string
          nationality?: string | null
          preferred_locale?: string | null
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          cover_image_url: string | null
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          is_active: boolean
          name: string
          project_type: string
          slug: string
          start_date: string | null
          updated_at: string
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean
          name: string
          project_type: string
          slug: string
          start_date?: string | null
          updated_at?: string
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean
          name?: string
          project_type?: string
          slug?: string
          start_date?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      safety_resources: {
        Row: {
          checked_at: string
          created_at: string
          id: string
          kind: string
          languages: string[]
          phone: string | null
          place_id: string | null
          publisher: string
          sort: number
          summary: Json
          title: string
          updated_at: string
          url: string
        }
        Insert: {
          checked_at: string
          created_at?: string
          id?: string
          kind: string
          languages?: string[]
          phone?: string | null
          place_id?: string | null
          publisher: string
          sort?: number
          summary?: Json
          title: string
          updated_at?: string
          url: string
        }
        Update: {
          checked_at?: string
          created_at?: string
          id?: string
          kind?: string
          languages?: string[]
          phone?: string | null
          place_id?: string | null
          publisher?: string
          sort?: number
          summary?: Json
          title?: string
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "safety_resources_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
        ]
      }
      touch_events: {
        Row: {
          created_at: string
          id: string
          is_test: boolean
          local_date: string
          place_id: string
          source: string
          touched_at: string
          touchpoint_id: string
          user_id: string
          visit_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_test?: boolean
          local_date: string
          place_id: string
          source?: string
          touched_at?: string
          touchpoint_id: string
          user_id: string
          visit_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_test?: boolean
          local_date?: string
          place_id?: string
          source?: string
          touched_at?: string
          touchpoint_id?: string
          user_id?: string
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "touch_events_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "touch_events_touchpoint_id_fkey"
            columns: ["touchpoint_id"]
            isOneToOne: false
            referencedRelation: "touchpoints"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "touch_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "touch_events_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      touchpoints: {
        Row: {
          access_mode: string
          code: string
          cover_image_url: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          is_test: boolean
          latitude: number | null
          longitude: number | null
          name: string
          place_id: string | null
          project_id: string | null
          public_id: string
          test_access: string
          touchpoint_type: string
          updated_at: string
        }
        Insert: {
          access_mode?: string
          code: string
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_test?: boolean
          latitude?: number | null
          longitude?: number | null
          name: string
          place_id?: string | null
          project_id?: string | null
          public_id?: string
          test_access?: string
          touchpoint_type: string
          updated_at?: string
        }
        Update: {
          access_mode?: string
          code?: string
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_test?: boolean
          latitude?: number | null
          longitude?: number | null
          name?: string
          place_id?: string | null
          project_id?: string | null
          public_id?: string
          test_access?: string
          touchpoint_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "touchpoints_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "touchpoints_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      visits: {
        Row: {
          created_at: string
          first_touched_at: string
          id: string
          is_test: boolean
          last_touched_at: string
          local_date: string
          place_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          first_touched_at: string
          id?: string
          is_test?: boolean
          last_touched_at: string
          local_date: string
          place_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          first_touched_at?: string
          id?: string
          is_test?: boolean
          last_touched_at?: string
          local_date?: string
          place_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visits_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_user_id_fkey"
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
      community_suggestion: {
        Args: { p_id: string }
        Returns: {
          id: string
          name: string
          opened_at: string
          photos: string[]
          place_id: string
          proposer_name: string
          public_area: string
          public_latitude: number
          public_longitude: number
          public_reason: string
          published_at: string
          reference_url: string
          region_id: string
          status: string
          support_count: number
        }[]
      }
      community_suggestion_timeline: {
        Args: { p_id: string }
        Returns: {
          kind: string
          occurred_at: string
          public_note: Json
          status: string
        }[]
      }
      community_suggestions: {
        Args: { p_limit?: number; p_statuses?: string[] }
        Returns: {
          cover_path: string
          id: string
          name: string
          opened_at: string
          place_id: string
          proposer_name: string
          public_area: string
          public_latitude: number
          public_longitude: number
          public_reason: string
          published_at: string
          region_id: string
          status: string
          support_count: number
        }[]
      }
      generate_public_id: { Args: never; Returns: string }
      is_admin: { Args: never; Returns: boolean }
      is_public_suggestion_status: {
        Args: { p_status: string }
        Returns: boolean
      }
      place_touches_today: { Args: { p_place_id: string }; Returns: number }
      place_visitors_today: { Args: { p_place_id: string }; Returns: number }
      record_touch: {
        Args: { p_public_id: string }
        Returns: {
          duplicate: boolean
          is_test: boolean
          local_date: string
          place_id: string
          touch_event_id: string
          touched_at: string
          visit_id: string
        }[]
      }
      resolve_touch_point: {
        Args: { p_public_id: string }
        Returns: {
          access_mode: string
          is_test: boolean
          place_id: string
          place_slug: string
          touchpoint_id: string
          touchpoint_name: string
        }[]
      }
      suggestion_accepts_support: { Args: { p_id: string }; Returns: boolean }
      suggestion_support_open: { Args: { p_id: string }; Returns: boolean }
      withdraw_suggestion: { Args: { p_id: string }; Returns: undefined }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
