-- FamilyRoots Database Schema for Supabase
-- Run this SQL in your Supabase SQL Editor (Dashboard > SQL Editor)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES TABLE (extends Supabase auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  current_family_tree_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- FAMILY TREES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS family_trees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key to profiles after family_trees is created
ALTER TABLE profiles
ADD CONSTRAINT fk_current_family_tree
FOREIGN KEY (current_family_tree_id)
REFERENCES family_trees(id) ON DELETE SET NULL;

-- ============================================
-- FAMILY TREE MEMBERS (for sharing trees)
-- ============================================
CREATE TABLE IF NOT EXISTS family_tree_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_tree_id UUID NOT NULL REFERENCES family_trees(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'editor', 'viewer')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(family_tree_id, user_id)
);

-- ============================================
-- PERSONS TABLE (family members)
-- ============================================
CREATE TABLE IF NOT EXISTS persons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_tree_id UUID NOT NULL REFERENCES family_trees(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT DEFAULT '',
  nickname TEXT,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  birth_date DATE,
  death_date DATE,
  birth_place TEXT,
  death_place TEXT,
  is_living BOOLEAN DEFAULT TRUE,
  profile_photo TEXT,
  bio TEXT,
  occupation TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- RELATIONSHIPS TABLE (parent/spouse connections)
-- ============================================
CREATE TABLE IF NOT EXISTS relationships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_tree_id UUID NOT NULL REFERENCES family_trees(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  related_person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL CHECK (relationship_type IN ('parent', 'spouse')),
  subtype TEXT, -- 'biological', 'step', 'adoptive' for parent; 'current', 'divorced', 'widowed', 'separated' for spouse
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(person_id, related_person_id, relationship_type)
);

-- ============================================
-- PERSON PHOTOS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS person_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  caption TEXT,
  uploaded_by UUID NOT NULL REFERENCES profiles(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PHOTO TAGS TABLE (tag people in photos)
-- ============================================
CREATE TABLE IF NOT EXISTS photo_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  photo_id UUID NOT NULL REFERENCES person_photos(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  UNIQUE(photo_id, person_id)
);

-- ============================================
-- COMMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id),
  author_name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STORIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS stories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id),
  author_name TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_persons_family_tree ON persons(family_tree_id);
CREATE INDEX IF NOT EXISTS idx_relationships_person ON relationships(person_id);
CREATE INDEX IF NOT EXISTS idx_relationships_related ON relationships(related_person_id);
CREATE INDEX IF NOT EXISTS idx_family_tree_members_user ON family_tree_members(user_id);
CREATE INDEX IF NOT EXISTS idx_family_tree_members_tree ON family_tree_members(family_tree_id);
CREATE INDEX IF NOT EXISTS idx_person_photos_person ON person_photos(person_id);
CREATE INDEX IF NOT EXISTS idx_comments_person ON comments(person_id);
CREATE INDEX IF NOT EXISTS idx_stories_person ON stories(person_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_trees ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_tree_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE person_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;

-- PROFILES policies
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- FAMILY TREES policies
CREATE POLICY "Users can view family trees they are members of"
  ON family_trees FOR SELECT
  USING (
    id IN (
      SELECT family_tree_id FROM family_tree_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create family trees"
  ON family_trees FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can update their family trees"
  ON family_trees FOR UPDATE
  USING (
    id IN (
      SELECT family_tree_id FROM family_tree_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete their family trees"
  ON family_trees FOR DELETE
  USING (
    id IN (
      SELECT family_tree_id FROM family_tree_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- FAMILY TREE MEMBERS policies
CREATE POLICY "Users can view members of their family trees"
  ON family_tree_members FOR SELECT
  USING (
    family_tree_id IN (
      SELECT family_tree_id FROM family_tree_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage family tree members"
  ON family_tree_members FOR ALL
  USING (
    family_tree_id IN (
      SELECT family_tree_id FROM family_tree_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can add themselves to a family tree"
  ON family_tree_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- PERSONS policies
CREATE POLICY "Users can view persons in their family trees"
  ON persons FOR SELECT
  USING (
    family_tree_id IN (
      SELECT family_tree_id FROM family_tree_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Editors and admins can insert persons"
  ON persons FOR INSERT
  WITH CHECK (
    family_tree_id IN (
      SELECT family_tree_id FROM family_tree_members
      WHERE user_id = auth.uid() AND role IN ('admin', 'editor')
    )
  );

CREATE POLICY "Editors and admins can update persons"
  ON persons FOR UPDATE
  USING (
    family_tree_id IN (
      SELECT family_tree_id FROM family_tree_members
      WHERE user_id = auth.uid() AND role IN ('admin', 'editor')
    )
  );

CREATE POLICY "Admins can delete persons"
  ON persons FOR DELETE
  USING (
    family_tree_id IN (
      SELECT family_tree_id FROM family_tree_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- RELATIONSHIPS policies
CREATE POLICY "Users can view relationships in their family trees"
  ON relationships FOR SELECT
  USING (
    family_tree_id IN (
      SELECT family_tree_id FROM family_tree_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Editors and admins can manage relationships"
  ON relationships FOR ALL
  USING (
    family_tree_id IN (
      SELECT family_tree_id FROM family_tree_members
      WHERE user_id = auth.uid() AND role IN ('admin', 'editor')
    )
  );

-- PERSON PHOTOS policies
CREATE POLICY "Users can view photos in their family trees"
  ON person_photos FOR SELECT
  USING (
    person_id IN (
      SELECT id FROM persons WHERE family_tree_id IN (
        SELECT family_tree_id FROM family_tree_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Editors and admins can manage photos"
  ON person_photos FOR ALL
  USING (
    person_id IN (
      SELECT id FROM persons WHERE family_tree_id IN (
        SELECT family_tree_id FROM family_tree_members
        WHERE user_id = auth.uid() AND role IN ('admin', 'editor')
      )
    )
  );

-- PHOTO TAGS policies
CREATE POLICY "Users can view photo tags in their family trees"
  ON photo_tags FOR SELECT
  USING (
    photo_id IN (
      SELECT id FROM person_photos WHERE person_id IN (
        SELECT id FROM persons WHERE family_tree_id IN (
          SELECT family_tree_id FROM family_tree_members WHERE user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Editors and admins can manage photo tags"
  ON photo_tags FOR ALL
  USING (
    photo_id IN (
      SELECT id FROM person_photos WHERE person_id IN (
        SELECT id FROM persons WHERE family_tree_id IN (
          SELECT family_tree_id FROM family_tree_members
          WHERE user_id = auth.uid() AND role IN ('admin', 'editor')
        )
      )
    )
  );

-- COMMENTS policies
CREATE POLICY "Users can view comments in their family trees"
  ON comments FOR SELECT
  USING (
    person_id IN (
      SELECT id FROM persons WHERE family_tree_id IN (
        SELECT family_tree_id FROM family_tree_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Members can add comments"
  ON comments FOR INSERT
  WITH CHECK (
    person_id IN (
      SELECT id FROM persons WHERE family_tree_id IN (
        SELECT family_tree_id FROM family_tree_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete own comments"
  ON comments FOR DELETE
  USING (author_id = auth.uid());

-- STORIES policies
CREATE POLICY "Users can view stories in their family trees"
  ON stories FOR SELECT
  USING (
    person_id IN (
      SELECT id FROM persons WHERE family_tree_id IN (
        SELECT family_tree_id FROM family_tree_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Members can add stories"
  ON stories FOR INSERT
  WITH CHECK (
    person_id IN (
      SELECT id FROM persons WHERE family_tree_id IN (
        SELECT family_tree_id FROM family_tree_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update own stories"
  ON stories FOR UPDATE
  USING (author_id = auth.uid());

CREATE POLICY "Users can delete own stories"
  ON stories FOR DELETE
  USING (author_id = auth.uid());

-- ============================================
-- FUNCTIONS AND TRIGGERS
-- ============================================

-- Function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to auto-add creator as admin when family tree is created
CREATE OR REPLACE FUNCTION public.handle_new_family_tree()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.family_tree_members (family_tree_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'admin');

  -- Also set this as the user's current family tree if they don't have one
  UPDATE public.profiles
  SET current_family_tree_id = NEW.id
  WHERE id = NEW.created_by AND current_family_tree_id IS NULL;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new family tree
DROP TRIGGER IF EXISTS on_family_tree_created ON family_trees;
CREATE TRIGGER on_family_tree_created
  AFTER INSERT ON family_trees
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_family_tree();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_family_trees_updated_at
  BEFORE UPDATE ON family_trees
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_persons_updated_at
  BEFORE UPDATE ON persons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- STORAGE BUCKET FOR PHOTOS
-- ============================================
-- Run this in the Storage section of Supabase Dashboard:
-- 1. Create a new bucket called "photos"
-- 2. Make it public or configure RLS policies
--
-- Or run this SQL:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('photos', 'photos', true);
