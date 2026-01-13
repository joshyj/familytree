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
      family_trees: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      family_tree_members: {
        Row: {
          id: string;
          family_tree_id: string;
          user_id: string;
          role: 'admin' | 'editor' | 'viewer';
          joined_at: string;
        };
        Insert: {
          id?: string;
          family_tree_id: string;
          user_id: string;
          role?: 'admin' | 'editor' | 'viewer';
          joined_at?: string;
        };
        Update: {
          id?: string;
          family_tree_id?: string;
          user_id?: string;
          role?: 'admin' | 'editor' | 'viewer';
          joined_at?: string;
        };
      };
      persons: {
        Row: {
          id: string;
          family_tree_id: string;
          first_name: string;
          last_name: string;
          nickname: string | null;
          gender: 'male' | 'female' | 'other' | null;
          birth_date: string | null;
          death_date: string | null;
          birth_place: string | null;
          death_place: string | null;
          is_living: boolean;
          profile_photo: string | null;
          bio: string | null;
          occupation: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          family_tree_id: string;
          first_name: string;
          last_name?: string;
          nickname?: string | null;
          gender?: 'male' | 'female' | 'other' | null;
          birth_date?: string | null;
          death_date?: string | null;
          birth_place?: string | null;
          death_place?: string | null;
          is_living?: boolean;
          profile_photo?: string | null;
          bio?: string | null;
          occupation?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          family_tree_id?: string;
          first_name?: string;
          last_name?: string;
          nickname?: string | null;
          gender?: 'male' | 'female' | 'other' | null;
          birth_date?: string | null;
          death_date?: string | null;
          birth_place?: string | null;
          death_place?: string | null;
          is_living?: boolean;
          profile_photo?: string | null;
          bio?: string | null;
          occupation?: string | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      person_photos: {
        Row: {
          id: string;
          person_id: string;
          url: string;
          caption: string | null;
          uploaded_by: string;
          uploaded_at: string;
        };
        Insert: {
          id?: string;
          person_id: string;
          url: string;
          caption?: string | null;
          uploaded_by: string;
          uploaded_at?: string;
        };
        Update: {
          id?: string;
          person_id?: string;
          url?: string;
          caption?: string | null;
          uploaded_by?: string;
          uploaded_at?: string;
        };
      };
      photo_tags: {
        Row: {
          id: string;
          photo_id: string;
          person_id: string;
        };
        Insert: {
          id?: string;
          photo_id: string;
          person_id: string;
        };
        Update: {
          id?: string;
          photo_id?: string;
          person_id?: string;
        };
      };
      relationships: {
        Row: {
          id: string;
          family_tree_id: string;
          person_id: string;
          related_person_id: string;
          relationship_type: 'parent' | 'spouse';
          subtype: string | null; // 'biological', 'step', 'adoptive' for parent; 'current', 'divorced', 'widowed', 'separated' for spouse
          created_at: string;
        };
        Insert: {
          id?: string;
          family_tree_id: string;
          person_id: string;
          related_person_id: string;
          relationship_type: 'parent' | 'spouse';
          subtype?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          family_tree_id?: string;
          person_id?: string;
          related_person_id?: string;
          relationship_type?: 'parent' | 'spouse';
          subtype?: string | null;
          created_at?: string;
        };
      };
      comments: {
        Row: {
          id: string;
          person_id: string;
          author_id: string;
          author_name: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          person_id: string;
          author_id: string;
          author_name: string;
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          person_id?: string;
          author_id?: string;
          author_name?: string;
          content?: string;
          created_at?: string;
        };
      };
      stories: {
        Row: {
          id: string;
          person_id: string;
          author_id: string;
          author_name: string;
          title: string;
          content: string;
          is_featured: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          person_id: string;
          author_id: string;
          author_name: string;
          title: string;
          content: string;
          is_featured?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          person_id?: string;
          author_id?: string;
          author_name?: string;
          title?: string;
          content?: string;
          is_featured?: boolean;
          created_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          display_name: string;
          avatar_url: string | null;
          current_family_tree_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          display_name: string;
          avatar_url?: string | null;
          current_family_tree_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          display_name?: string;
          avatar_url?: string | null;
          current_family_tree_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}
