import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Person, User, Comment, Story, Photo, SpouseRelationship, ParentRelationship } from '../types';

interface AppState {
  // Auth state
  currentUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authError: string | null;

  // Family tree state
  currentFamilyTreeId: string | null;
  familyTreeName: string | null;

  // Data state
  persons: Record<string, Person>;
  comments: Record<string, Comment[]>;
  stories: Record<string, Story[]>;
  selectedPersonId: string | null;

  // Auth actions
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, displayName: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;

  // Family tree actions
  createFamilyTree: (name: string, description?: string) => Promise<string | null>;
  joinFamilyTree: (treeId: string) => Promise<boolean>;
  switchFamilyTree: (treeId: string) => Promise<void>;
  getFamilyTrees: () => Promise<{ id: string; name: string; role: string }[]>;

  // Person actions
  loadPersons: () => Promise<void>;
  addPerson: (person: Partial<Person> & { firstName: string; lastName: string }) => Promise<Person | null>;
  updatePerson: (id: string, updates: Partial<Person>) => Promise<void>;
  deletePerson: (id: string) => Promise<void>;
  getPerson: (id: string) => Person | undefined;
  getAllPersons: () => Person[];

  // Relationship actions
  addChild: (parentId: string, childId: string) => Promise<void>;
  addSpouse: (person1Id: string, person2Id: string) => Promise<void>;
  setParent: (childId: string, parentId: string, parentType: 'father' | 'mother') => Promise<void>;

  // Comment actions
  addComment: (personId: string, content: string) => Promise<void>;
  getComments: (personId: string) => Comment[];
  loadComments: (personId: string) => Promise<void>;

  // Story actions
  addStory: (personId: string, content: string, authorId: string) => Promise<void>;
  getStories: (personId: string) => Story[];
  loadStories: (personId: string) => Promise<void>;

  // Photo actions
  addPhoto: (personId: string, photoUrl: string, caption?: string) => Promise<void>;
  addPhotoToPerson: (personId: string, photoUrl: string, caption?: string) => Promise<void>;
  setProfilePhoto: (personId: string, photoUrl: string) => Promise<void>;

  // Utility actions
  selectPerson: (id: string | null) => void;
  searchPersons: (query: string) => Person[];
  getChildren: (personId: string) => Person[];
  getParents: (personId: string) => Person[];
  getSpouses: (personId: string) => Person[];
  getSiblings: (personId: string) => Person[];
}

// Helper to convert DB row to Person type
const dbRowToPerson = (row: any, relationships: any[] = []): Person => {
  const spouseRelationships: SpouseRelationship[] = relationships
    .filter(r => r.relationship_type === 'spouse' && r.person_id === row.id)
    .map(r => ({
      personId: r.related_person_id,
      status: (r.subtype || 'current') as SpouseRelationship['status'],
    }));

  const parentRelationships: ParentRelationship[] = relationships
    .filter(r => r.relationship_type === 'parent' && r.person_id === row.id)
    .map(r => ({
      personId: r.related_person_id,
      type: (r.subtype || 'biological') as ParentRelationship['type'],
    }));

  // Get children (where this person is the related_person in a parent relationship)
  const childIds = relationships
    .filter(r => r.relationship_type === 'parent' && r.related_person_id === row.id)
    .map(r => r.person_id);

  // Get parent IDs
  const parentIds = parentRelationships.map(r => r.personId);

  // Get spouse IDs
  const spouseIds = spouseRelationships.map(r => r.personId);
  const currentSpouse = spouseRelationships.find(r => r.status === 'current');

  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name || '',
    nickname: row.nickname,
    gender: row.gender,
    birthDate: row.birth_date,
    birthPlace: row.birth_place,
    deathDate: row.death_date,
    deathPlace: row.death_place,
    isLiving: row.is_living ?? true,
    profilePhoto: row.profile_photo,
    photos: [], // Will be loaded separately if needed
    bio: row.bio,
    occupation: row.occupation,
    fatherId: undefined, // Will be computed from relationships
    motherId: undefined,
    spouseId: currentSpouse?.personId,
    spouseIds,
    spouseRelationships,
    parentRelationships,
    children: childIds,
    childrenIds: childIds,
    parents: parentIds,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by,
  };
};

export const useStore = create<AppState>()((set, get) => ({
  currentUser: null,
  isAuthenticated: false,
  isLoading: true,
  authError: null,
  currentFamilyTreeId: null,
  familyTreeName: null,
  persons: {},
  comments: {},
  stories: {},
  selectedPersonId: null,

  checkSession: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        // Get profile data
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        const user: User = {
          id: session.user.id,
          email: session.user.email || '',
          displayName: profile?.display_name || session.user.email?.split('@')[0] || 'User',
          avatarUrl: profile?.avatar_url,
          role: 'admin',
          familyTreeId: profile?.current_family_tree_id || 'default',
          createdAt: session.user.created_at,
        };

        set({
          currentUser: user,
          isAuthenticated: true,
          currentFamilyTreeId: profile?.current_family_tree_id,
          isLoading: false,
        });

        // Load persons if we have a family tree
        if (profile?.current_family_tree_id) {
          await get().loadPersons();
        }
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Session check error:', error);
      set({ isLoading: false });
    }
  },

  login: async (email, password) => {
    set({ authError: null, isLoading: true });

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        set({ authError: error.message, isLoading: false });
        return false;
      }

      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        const user: User = {
          id: data.user.id,
          email: data.user.email || '',
          displayName: profile?.display_name || email.split('@')[0],
          avatarUrl: profile?.avatar_url,
          role: 'admin',
          familyTreeId: profile?.current_family_tree_id || 'default',
          createdAt: data.user.created_at,
        };

        set({
          currentUser: user,
          isAuthenticated: true,
          currentFamilyTreeId: profile?.current_family_tree_id,
          isLoading: false,
        });

        // Load persons if we have a family tree
        if (profile?.current_family_tree_id) {
          await get().loadPersons();
        }

        return true;
      }

      set({ isLoading: false });
      return false;
    } catch (error: any) {
      set({ authError: error.message, isLoading: false });
      return false;
    }
  },

  register: async (email, password, displayName) => {
    set({ authError: null, isLoading: true });

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName },
        },
      });

      if (error) {
        set({ authError: error.message, isLoading: false });
        return false;
      }

      if (data.user) {
        // Create a default family tree for new users
        const { data: treeData, error: treeError } = await supabase
          .from('family_trees')
          .insert({
            name: `${displayName}'s Family Tree`,
            created_by: data.user.id,
          })
          .select()
          .single();

        if (treeError) {
          console.error('Error creating family tree:', treeError);
        }

        const user: User = {
          id: data.user.id,
          email: data.user.email || '',
          displayName,
          role: 'admin',
          familyTreeId: treeData?.id || 'default',
          createdAt: data.user.created_at,
        };

        set({
          currentUser: user,
          isAuthenticated: true,
          currentFamilyTreeId: treeData?.id || null,
          familyTreeName: treeData?.name || null,
          isLoading: false,
        });

        return true;
      }

      set({ isLoading: false });
      return false;
    } catch (error: any) {
      set({ authError: error.message, isLoading: false });
      return false;
    }
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({
      currentUser: null,
      isAuthenticated: false,
      currentFamilyTreeId: null,
      familyTreeName: null,
      persons: {},
      comments: {},
      stories: {},
    });
  },

  createFamilyTree: async (name, description) => {
    const { currentUser } = get();
    if (!currentUser) return null;

    try {
      const { data, error } = await supabase
        .from('family_trees')
        .insert({
          name,
          description,
          created_by: currentUser.id,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating family tree:', error);
        return null;
      }

      set({ currentFamilyTreeId: data.id, familyTreeName: data.name });
      return data.id;
    } catch (error) {
      console.error('Error creating family tree:', error);
      return null;
    }
  },

  joinFamilyTree: async (treeId) => {
    const { currentUser } = get();
    if (!currentUser) return false;

    try {
      // Add user as viewer to the family tree
      const { error } = await supabase
        .from('family_tree_members')
        .insert({
          family_tree_id: treeId,
          user_id: currentUser.id,
          role: 'viewer',
        });

      if (error) {
        console.error('Error joining family tree:', error);
        return false;
      }

      // Update user's current family tree
      await supabase
        .from('profiles')
        .update({ current_family_tree_id: treeId })
        .eq('id', currentUser.id);

      set({ currentFamilyTreeId: treeId });
      await get().loadPersons();

      return true;
    } catch (error) {
      console.error('Error joining family tree:', error);
      return false;
    }
  },

  switchFamilyTree: async (treeId) => {
    const { currentUser } = get();
    if (!currentUser) return;

    // Update user's current family tree
    await supabase
      .from('profiles')
      .update({ current_family_tree_id: treeId })
      .eq('id', currentUser.id);

    set({ currentFamilyTreeId: treeId, persons: {} });
    await get().loadPersons();
  },

  getFamilyTrees: async () => {
    const { currentUser } = get();
    if (!currentUser) return [];

    try {
      const { data, error } = await supabase
        .from('family_tree_members')
        .select(`
          role,
          family_trees (
            id,
            name
          )
        `)
        .eq('user_id', currentUser.id);

      if (error) {
        console.error('Error fetching family trees:', error);
        return [];
      }

      return data.map((item: any) => ({
        id: item.family_trees.id,
        name: item.family_trees.name,
        role: item.role,
      }));
    } catch (error) {
      console.error('Error fetching family trees:', error);
      return [];
    }
  },

  loadPersons: async () => {
    const { currentFamilyTreeId } = get();
    if (!currentFamilyTreeId) return;

    try {
      // Load all persons for the family tree
      const { data: personsData, error: personsError } = await supabase
        .from('persons')
        .select('*')
        .eq('family_tree_id', currentFamilyTreeId);

      if (personsError) {
        console.error('Error loading persons:', personsError);
        return;
      }

      // Load all relationships for the family tree
      const { data: relationshipsData, error: relError } = await supabase
        .from('relationships')
        .select('*')
        .eq('family_tree_id', currentFamilyTreeId);

      if (relError) {
        console.error('Error loading relationships:', relError);
      }

      const relationships = relationshipsData || [];

      // Convert to Person records
      const persons: Record<string, Person> = {};
      personsData?.forEach(row => {
        persons[row.id] = dbRowToPerson(row, relationships);
      });

      set({ persons });
    } catch (error) {
      console.error('Error loading persons:', error);
    }
  },

  addPerson: async (personData) => {
    const { currentUser, currentFamilyTreeId } = get();
    if (!currentUser || !currentFamilyTreeId) return null;

    try {
      // Insert person
      const { data: newPerson, error } = await supabase
        .from('persons')
        .insert({
          family_tree_id: currentFamilyTreeId,
          first_name: personData.firstName,
          last_name: personData.lastName || '',
          nickname: personData.nickname,
          gender: personData.gender,
          birth_date: personData.birthDate,
          birth_place: personData.birthPlace,
          death_date: personData.deathDate,
          death_place: personData.deathPlace,
          is_living: personData.isLiving ?? true,
          profile_photo: personData.profilePhoto,
          bio: personData.bio,
          occupation: personData.occupation,
          created_by: currentUser.id,
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding person:', error);
        return null;
      }

      // Insert relationships
      const relationshipsToInsert: any[] = [];

      // Parent relationships
      if (personData.parentRelationships) {
        personData.parentRelationships.forEach(rel => {
          relationshipsToInsert.push({
            family_tree_id: currentFamilyTreeId,
            person_id: newPerson.id,
            related_person_id: rel.personId,
            relationship_type: 'parent',
            subtype: rel.type,
          });
        });
      } else if (personData.parents) {
        personData.parents.forEach(parentId => {
          relationshipsToInsert.push({
            family_tree_id: currentFamilyTreeId,
            person_id: newPerson.id,
            related_person_id: parentId,
            relationship_type: 'parent',
            subtype: 'biological',
          });
        });
      }

      // Spouse relationships
      if (personData.spouseRelationships) {
        personData.spouseRelationships.forEach(rel => {
          relationshipsToInsert.push({
            family_tree_id: currentFamilyTreeId,
            person_id: newPerson.id,
            related_person_id: rel.personId,
            relationship_type: 'spouse',
            subtype: rel.status,
          });
          // Also add reciprocal relationship
          relationshipsToInsert.push({
            family_tree_id: currentFamilyTreeId,
            person_id: rel.personId,
            related_person_id: newPerson.id,
            relationship_type: 'spouse',
            subtype: rel.status,
          });
        });
      } else if (personData.spouseId) {
        relationshipsToInsert.push({
          family_tree_id: currentFamilyTreeId,
          person_id: newPerson.id,
          related_person_id: personData.spouseId,
          relationship_type: 'spouse',
          subtype: 'current',
        });
        relationshipsToInsert.push({
          family_tree_id: currentFamilyTreeId,
          person_id: personData.spouseId,
          related_person_id: newPerson.id,
          relationship_type: 'spouse',
          subtype: 'current',
        });
      }

      if (relationshipsToInsert.length > 0) {
        await supabase.from('relationships').insert(relationshipsToInsert);
      }

      // Reload all persons to get updated relationships
      await get().loadPersons();

      return get().persons[newPerson.id];
    } catch (error) {
      console.error('Error adding person:', error);
      return null;
    }
  },

  updatePerson: async (id, updates) => {
    const { currentFamilyTreeId } = get();
    if (!currentFamilyTreeId) return;

    try {
      // Update person data
      const dbUpdates: any = {};
      if (updates.firstName !== undefined) dbUpdates.first_name = updates.firstName;
      if (updates.lastName !== undefined) dbUpdates.last_name = updates.lastName;
      if (updates.nickname !== undefined) dbUpdates.nickname = updates.nickname;
      if (updates.gender !== undefined) dbUpdates.gender = updates.gender;
      if (updates.birthDate !== undefined) dbUpdates.birth_date = updates.birthDate;
      if (updates.birthPlace !== undefined) dbUpdates.birth_place = updates.birthPlace;
      if (updates.deathDate !== undefined) dbUpdates.death_date = updates.deathDate;
      if (updates.deathPlace !== undefined) dbUpdates.death_place = updates.deathPlace;
      if (updates.isLiving !== undefined) dbUpdates.is_living = updates.isLiving;
      if (updates.profilePhoto !== undefined) dbUpdates.profile_photo = updates.profilePhoto;
      if (updates.bio !== undefined) dbUpdates.bio = updates.bio;
      if (updates.occupation !== undefined) dbUpdates.occupation = updates.occupation;

      if (Object.keys(dbUpdates).length > 0) {
        const { error } = await supabase
          .from('persons')
          .update(dbUpdates)
          .eq('id', id);

        if (error) {
          console.error('Error updating person:', error);
          return;
        }
      }

      // Handle relationship updates
      if (updates.spouseRelationships !== undefined || updates.parentRelationships !== undefined) {
        // Delete existing relationships for this person
        await supabase
          .from('relationships')
          .delete()
          .eq('person_id', id);

        // Also delete reciprocal spouse relationships
        await supabase
          .from('relationships')
          .delete()
          .eq('related_person_id', id)
          .eq('relationship_type', 'spouse');

        const relationshipsToInsert: any[] = [];

        // Add parent relationships
        if (updates.parentRelationships) {
          updates.parentRelationships.forEach(rel => {
            relationshipsToInsert.push({
              family_tree_id: currentFamilyTreeId,
              person_id: id,
              related_person_id: rel.personId,
              relationship_type: 'parent',
              subtype: rel.type,
            });
          });
        }

        // Add spouse relationships (bidirectional)
        if (updates.spouseRelationships) {
          updates.spouseRelationships.forEach(rel => {
            relationshipsToInsert.push({
              family_tree_id: currentFamilyTreeId,
              person_id: id,
              related_person_id: rel.personId,
              relationship_type: 'spouse',
              subtype: rel.status,
            });
            relationshipsToInsert.push({
              family_tree_id: currentFamilyTreeId,
              person_id: rel.personId,
              related_person_id: id,
              relationship_type: 'spouse',
              subtype: rel.status,
            });
          });
        }

        if (relationshipsToInsert.length > 0) {
          await supabase.from('relationships').insert(relationshipsToInsert);
        }
      }

      // Reload persons to get updated data
      await get().loadPersons();
    } catch (error) {
      console.error('Error updating person:', error);
    }
  },

  deletePerson: async (id) => {
    try {
      const { error } = await supabase
        .from('persons')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting person:', error);
        return;
      }

      // Reload persons
      await get().loadPersons();
    } catch (error) {
      console.error('Error deleting person:', error);
    }
  },

  getPerson: (id) => get().persons[id],

  getAllPersons: () => Object.values(get().persons),

  addChild: async (parentId, childId) => {
    const { currentFamilyTreeId } = get();
    if (!currentFamilyTreeId) return;

    try {
      await supabase.from('relationships').insert({
        family_tree_id: currentFamilyTreeId,
        person_id: childId,
        related_person_id: parentId,
        relationship_type: 'parent',
        subtype: 'biological',
      });

      await get().loadPersons();
    } catch (error) {
      console.error('Error adding child relationship:', error);
    }
  },

  addSpouse: async (person1Id, person2Id) => {
    const { currentFamilyTreeId } = get();
    if (!currentFamilyTreeId) return;

    try {
      await supabase.from('relationships').insert([
        {
          family_tree_id: currentFamilyTreeId,
          person_id: person1Id,
          related_person_id: person2Id,
          relationship_type: 'spouse',
          subtype: 'current',
        },
        {
          family_tree_id: currentFamilyTreeId,
          person_id: person2Id,
          related_person_id: person1Id,
          relationship_type: 'spouse',
          subtype: 'current',
        },
      ]);

      await get().loadPersons();
    } catch (error) {
      console.error('Error adding spouse relationship:', error);
    }
  },

  setParent: async (childId, parentId, _parentType) => {
    const { currentFamilyTreeId } = get();
    if (!currentFamilyTreeId) return;

    try {
      await supabase.from('relationships').insert({
        family_tree_id: currentFamilyTreeId,
        person_id: childId,
        related_person_id: parentId,
        relationship_type: 'parent',
        subtype: 'biological',
      });

      await get().loadPersons();
    } catch (error) {
      console.error('Error setting parent:', error);
    }
  },

  addComment: async (personId, content) => {
    const { currentUser } = get();
    if (!currentUser) return;

    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          person_id: personId,
          author_id: currentUser.id,
          author_name: currentUser.displayName,
          content,
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding comment:', error);
        return;
      }

      const comment: Comment = {
        id: data.id,
        personId: data.person_id,
        authorId: data.author_id,
        authorName: data.author_name,
        content: data.content,
        createdAt: data.created_at,
      };

      set((state) => ({
        comments: {
          ...state.comments,
          [personId]: [...(state.comments[personId] || []), comment],
        },
      }));
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  },

  getComments: (personId) => get().comments[personId] || [],

  loadComments: async (personId) => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('person_id', personId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading comments:', error);
        return;
      }

      const comments: Comment[] = data.map(row => ({
        id: row.id,
        personId: row.person_id,
        authorId: row.author_id,
        authorName: row.author_name,
        content: row.content,
        createdAt: row.created_at,
      }));

      set((state) => ({
        comments: {
          ...state.comments,
          [personId]: comments,
        },
      }));
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  },

  addStory: async (personId, content, authorId) => {
    const { currentUser } = get();
    if (!currentUser) return;

    try {
      const { data, error } = await supabase
        .from('stories')
        .insert({
          person_id: personId,
          author_id: authorId || currentUser.id,
          author_name: currentUser.displayName,
          title: 'Story',
          content,
          is_featured: false,
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding story:', error);
        return;
      }

      const story: Story = {
        id: data.id,
        personId: data.person_id,
        authorId: data.author_id,
        authorName: data.author_name,
        content: data.content,
        isFeatured: data.is_featured,
        createdAt: data.created_at,
      };

      set((state) => ({
        stories: {
          ...state.stories,
          [personId]: [...(state.stories[personId] || []), story],
        },
      }));
    } catch (error) {
      console.error('Error adding story:', error);
    }
  },

  getStories: (personId) => get().stories[personId] || [],

  loadStories: async (personId) => {
    try {
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .eq('person_id', personId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading stories:', error);
        return;
      }

      const stories: Story[] = data.map(row => ({
        id: row.id,
        personId: row.person_id,
        authorId: row.author_id,
        authorName: row.author_name,
        content: row.content,
        isFeatured: row.is_featured,
        createdAt: row.created_at,
      }));

      set((state) => ({
        stories: {
          ...state.stories,
          [personId]: stories,
        },
      }));
    } catch (error) {
      console.error('Error loading stories:', error);
    }
  },

  addPhoto: async (personId, photoUrl, caption) => {
    const { currentUser } = get();
    if (!currentUser) return;

    try {
      const { data, error } = await supabase
        .from('person_photos')
        .insert({
          person_id: personId,
          url: photoUrl,
          caption,
          uploaded_by: currentUser.id,
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding photo:', error);
        return;
      }

      // Update local state
      const photo: Photo = {
        id: data.id,
        url: data.url,
        uri: data.url,
        caption: data.caption,
        taggedPersonIds: [personId],
        uploadedAt: data.uploaded_at,
        uploadedBy: data.uploaded_by,
      };

      set((state) => {
        const person = state.persons[personId];
        if (!person) return state;

        return {
          persons: {
            ...state.persons,
            [personId]: {
              ...person,
              photos: [...person.photos, photo],
            },
          },
        };
      });
    } catch (error) {
      console.error('Error adding photo:', error);
    }
  },

  addPhotoToPerson: async (personId, photoUrl, caption) => {
    await get().addPhoto(personId, photoUrl, caption);
  },

  setProfilePhoto: async (personId, photoUrl) => {
    await get().updatePerson(personId, { profilePhoto: photoUrl });
  },

  selectPerson: (id) => set({ selectedPersonId: id }),

  searchPersons: (query) => {
    const normalizedQuery = query.toLowerCase().trim();
    if (!normalizedQuery) return [];

    return Object.values(get().persons).filter((person) => {
      const fullName = `${person.firstName} ${person.lastName}`.toLowerCase();
      const birthPlace = person.birthPlace?.toLowerCase() || '';
      const nickname = person.nickname?.toLowerCase() || '';

      return (
        fullName.includes(normalizedQuery) ||
        birthPlace.includes(normalizedQuery) ||
        nickname.includes(normalizedQuery)
      );
    });
  },

  getChildren: (personId) => {
    const { persons } = get();
    const person = persons[personId];
    if (!person) return [];
    const childIds = [...new Set([...person.childrenIds, ...person.children])];
    return childIds.map((id) => persons[id]).filter(Boolean);
  },

  getParents: (personId) => {
    const { persons } = get();
    const person = persons[personId];
    if (!person) return [];
    const parentIds = [
      ...new Set(
        [person.fatherId, person.motherId, ...person.parents].filter(Boolean)
      ),
    ] as string[];
    return parentIds.map((id) => persons[id]).filter(Boolean);
  },

  getSpouses: (personId) => {
    const { persons } = get();
    const person = persons[personId];
    if (!person) return [];
    const spouseIdList = [
      ...new Set([person.spouseId, ...person.spouseIds].filter(Boolean)),
    ] as string[];
    return spouseIdList.map((id) => persons[id]).filter(Boolean);
  },

  getSiblings: (personId) => {
    const { persons } = get();
    const person = persons[personId];
    if (!person) return [];

    const siblingIds = new Set<string>();

    if (person.fatherId) {
      const father = persons[person.fatherId];
      father?.childrenIds.forEach((id) => {
        if (id !== personId) siblingIds.add(id);
      });
      father?.children.forEach((id) => {
        if (id !== personId) siblingIds.add(id);
      });
    }

    if (person.motherId) {
      const mother = persons[person.motherId];
      mother?.childrenIds.forEach((id) => {
        if (id !== personId) siblingIds.add(id);
      });
      mother?.children.forEach((id) => {
        if (id !== personId) siblingIds.add(id);
      });
    }

    return Array.from(siblingIds)
      .map((id) => persons[id])
      .filter(Boolean);
  },
}));
