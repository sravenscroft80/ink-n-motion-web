export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          created_at: string;
          signup_bonus_granted: boolean;
        };
        Insert: {
          id: string;
          email?: string | null;
          created_at?: string;
          signup_bonus_granted?: boolean;
        };
        Update: {
          id?: string;
          email?: string | null;
          created_at?: string;
          signup_bonus_granted?: boolean;
        };
        Relationships: [];
      };
      token_grants: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          remaining: number;
          granted_at: string;
          expires_at: string;
          source: string;
          pack_id: string | null;
          stripe_checkout_session_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          amount: number;
          remaining: number;
          granted_at?: string;
          expires_at: string;
          source: string;
          pack_id?: string | null;
          stripe_checkout_session_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          amount?: number;
          remaining?: number;
          granted_at?: string;
          expires_at?: string;
          source?: string;
          pack_id?: string | null;
          stripe_checkout_session_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      token_ledger: {
        Row: {
          id: string;
          user_id: string;
          entry_type: string;
          amount: number;
          action: string | null;
          grant_id: string | null;
          stripe_checkout_session_id: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          entry_type: string;
          amount: number;
          action?: string | null;
          grant_id?: string | null;
          stripe_checkout_session_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          entry_type?: string;
          amount?: number;
          action?: string | null;
          grant_id?: string | null;
          stripe_checkout_session_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      stripe_processed_events: {
        Row: {
          id: string;
          event_type: string;
          checkout_session_id: string | null;
          user_id: string | null;
          pack: string | null;
          tokens_granted: number | null;
          processed_at: string;
        };
        Insert: {
          id: string;
          event_type: string;
          checkout_session_id?: string | null;
          user_id?: string | null;
          pack?: string | null;
          tokens_granted?: number | null;
          processed_at?: string;
        };
        Update: {
          id?: string;
          event_type?: string;
          checkout_session_id?: string | null;
          user_id?: string | null;
          pack?: string | null;
          tokens_granted?: number | null;
          processed_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_spendable_balance: {
        Args: { p_user_id: string };
        Returns: number;
      };
      grant_tokens: {
        Args: {
          p_user_id: string;
          p_amount: number;
          p_source: string;
          p_expires_at?: string;
          p_pack_id?: string | null;
          p_stripe_checkout_session_id?: string | null;
          p_action?: string | null;
        };
        Returns: string;
      };
      spend_tokens: {
        Args: {
          p_user_id: string;
          p_action: string;
          p_cost: number;
        };
        Returns: string;
      };
      refund_tokens: {
        Args: {
          p_user_id: string;
          p_spend_batch: string;
          p_action?: string | null;
        };
        Returns: number;
      };
      ensure_signup_bonus: {
        Args: { p_user_id: string };
        Returns: number;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
