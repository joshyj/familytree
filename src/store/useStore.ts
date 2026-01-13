import { create } from 'zustand';
import { auth, db } from '../lib/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
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

// Helper to convert Firestore document to Person type
const docToPerson = (docData: any, docId: string, relationships: any[] = []): Person => {
  const spouseRelationships: SpouseRelationship[] = relationships
    .filter(r => r.relationshipType === 'spouse' && r.personId === docId)
    .map(r => ({
      personId: r.relatedPersonId,
      status: (r.subtype || 'current') as SpouseRelationship['status'],
    }));

  const parentRelationships: ParentRelationship[] = relationships
    .filter(r => r.relationshipType === 'parent' && r.personId === docId)
    .map(r => ({
      personId: r.relatedPersonId,
      type: (r.subtype || 'biological') as ParentRelationship['type'],
    }));

  // Get children (where this person is the related_person in a parent relationship)
  const childIds = relationships
    .filter(r => r.relationshipType === 'parent' && r.relatedPersonId === docId)
    .map(r => r.personId);

  // Get parent IDs
  const parentIds = parentRelationships.map(r => r.personId);

  // Get spouse IDs
  const spouseIds = spouseRelationships.map(r => r.personId);
  const currentSpouse = spouseRelationships.find(r => r.status === 'current');

  return {
    id: docId,
    firstName: docData.firstName,
    lastName: docData.lastName || '',
    nickname: docData.nickname,
    gender: docData.gender,
    birthDate: docData.birthDate,
    birthPlace: docData.birthPlace,
    deathDate: docData.deathDate,
    deathPlace: docData.deathPlace,
    isLiving: docData.isLiving ?? true,
    profilePhoto: docData.profilePhoto,
    photos: [],
    bio: docData.bio,
    occupation: docData.occupation,
    fatherId: undefined,
    motherId: undefined,
    spouseId: currentSpouse?.personId,
    spouseIds,
    spouseRelationships,
    parentRelationships,
    children: childIds,
    childrenIds: childIds,
    parents: parentIds,
    createdAt: docData.createdAt instanceof Timestamp ? docData.createdAt.toDate().toISOString() : docData.createdAt,
    updatedAt: docData.updatedAt instanceof Timestamp ? docData.updatedAt.toDate().toISOString() : docData.updatedAt,
    createdBy: docData.createdBy,
  };
};

// Helper to convert Timestamp to ISO string
const timestampToString = (ts: any): string => {
  if (ts instanceof Timestamp) {
    return ts.toDate().toISOString();
  }
  return ts || new Date().toISOString();
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
    return new Promise<void>((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
        unsubscribe();

        if (firebaseUser) {
          try {
            // Get profile data from Firestore
            const profileDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
            const profileData = profileDoc.exists() ? profileDoc.data() : null;

            const user: User = {
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: profileData?.displayName || firebaseUser.email?.split('@')[0] || 'User',
              avatarUrl: profileData?.avatarUrl,
              role: 'admin',
              familyTreeId: profileData?.currentFamilyTreeId || 'default',
              createdAt: firebaseUser.metadata.creationTime || new Date().toISOString(),
            };

            set({
              currentUser: user,
              isAuthenticated: true,
              currentFamilyTreeId: profileData?.currentFamilyTreeId,
              isLoading: false,
            });

            // Load persons if we have a family tree
            if (profileData?.currentFamilyTreeId) {
              await get().loadPersons();
            }
          } catch (error) {
            console.error('Error fetching profile:', error);
            set({ isLoading: false });
          }
        } else {
          set({ isLoading: false });
        }
        resolve();
      });
    });
  },

  login: async (email, password) => {
    set({ authError: null, isLoading: true });

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Get profile data from Firestore
      const profileDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      const profileData = profileDoc.exists() ? profileDoc.data() : null;

      const user: User = {
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: profileData?.displayName || email.split('@')[0],
        avatarUrl: profileData?.avatarUrl,
        role: 'admin',
        familyTreeId: profileData?.currentFamilyTreeId || 'default',
        createdAt: firebaseUser.metadata.creationTime || new Date().toISOString(),
      };

      set({
        currentUser: user,
        isAuthenticated: true,
        currentFamilyTreeId: profileData?.currentFamilyTreeId,
        isLoading: false,
      });

      // Load persons if we have a family tree
      if (profileData?.currentFamilyTreeId) {
        await get().loadPersons();
      }

      return true;
    } catch (error: any) {
      const errorMessage = error.code === 'auth/invalid-credential'
        ? 'Invalid email or password'
        : error.message;
      set({ authError: errorMessage, isLoading: false });
      return false;
    }
  },

  register: async (email, password, displayName) => {
    set({ authError: null, isLoading: true });

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Create user profile in Firestore
      await setDoc(doc(db, 'users', firebaseUser.uid), {
        email,
        displayName,
        avatarUrl: null,
        currentFamilyTreeId: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Create a default family tree for new users
      const treeRef = await addDoc(collection(db, 'familyTrees'), {
        name: `${displayName}'s Family Tree`,
        description: null,
        createdBy: firebaseUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Add user as admin member of the family tree
      await addDoc(collection(db, 'familyTreeMembers'), {
        familyTreeId: treeRef.id,
        userId: firebaseUser.uid,
        role: 'admin',
        joinedAt: serverTimestamp(),
      });

      // Update user's current family tree
      await updateDoc(doc(db, 'users', firebaseUser.uid), {
        currentFamilyTreeId: treeRef.id,
      });

      const user: User = {
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName,
        role: 'admin',
        familyTreeId: treeRef.id,
        createdAt: firebaseUser.metadata.creationTime || new Date().toISOString(),
      };

      set({
        currentUser: user,
        isAuthenticated: true,
        currentFamilyTreeId: treeRef.id,
        familyTreeName: `${displayName}'s Family Tree`,
        isLoading: false,
      });

      return true;
    } catch (error: any) {
      const errorMessage = error.code === 'auth/email-already-in-use'
        ? 'Email already in use'
        : error.message;
      set({ authError: errorMessage, isLoading: false });
      return false;
    }
  },

  logout: async () => {
    await signOut(auth);
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
      const treeRef = await addDoc(collection(db, 'familyTrees'), {
        name,
        description: description || null,
        createdBy: currentUser.id,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Add user as admin
      await addDoc(collection(db, 'familyTreeMembers'), {
        familyTreeId: treeRef.id,
        userId: currentUser.id,
        role: 'admin',
        joinedAt: serverTimestamp(),
      });

      set({ currentFamilyTreeId: treeRef.id, familyTreeName: name });
      return treeRef.id;
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
      await addDoc(collection(db, 'familyTreeMembers'), {
        familyTreeId: treeId,
        userId: currentUser.id,
        role: 'viewer',
        joinedAt: serverTimestamp(),
      });

      // Update user's current family tree
      await updateDoc(doc(db, 'users', currentUser.id), {
        currentFamilyTreeId: treeId,
      });

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
    await updateDoc(doc(db, 'users', currentUser.id), {
      currentFamilyTreeId: treeId,
    });

    set({ currentFamilyTreeId: treeId, persons: {} });
    await get().loadPersons();
  },

  getFamilyTrees: async () => {
    const { currentUser } = get();
    if (!currentUser) return [];

    try {
      const membersQuery = query(
        collection(db, 'familyTreeMembers'),
        where('userId', '==', currentUser.id)
      );
      const membersSnapshot = await getDocs(membersQuery);

      const trees: { id: string; name: string; role: string }[] = [];

      for (const memberDoc of membersSnapshot.docs) {
        const memberData = memberDoc.data();
        const treeDoc = await getDoc(doc(db, 'familyTrees', memberData.familyTreeId));
        if (treeDoc.exists()) {
          trees.push({
            id: treeDoc.id,
            name: treeDoc.data().name,
            role: memberData.role,
          });
        }
      }

      return trees;
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
      const personsQuery = query(
        collection(db, 'persons'),
        where('familyTreeId', '==', currentFamilyTreeId)
      );
      const personsSnapshot = await getDocs(personsQuery);

      // Load all relationships for the family tree
      const relQuery = query(
        collection(db, 'relationships'),
        where('familyTreeId', '==', currentFamilyTreeId)
      );
      const relSnapshot = await getDocs(relQuery);

      const relationships = relSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));

      // Convert to Person records
      const persons: Record<string, Person> = {};
      personsSnapshot.docs.forEach(docSnap => {
        persons[docSnap.id] = docToPerson(docSnap.data(), docSnap.id, relationships);
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
      const personRef = await addDoc(collection(db, 'persons'), {
        familyTreeId: currentFamilyTreeId,
        firstName: personData.firstName,
        lastName: personData.lastName || '',
        nickname: personData.nickname || null,
        gender: personData.gender || null,
        birthDate: personData.birthDate || null,
        birthPlace: personData.birthPlace || null,
        deathDate: personData.deathDate || null,
        deathPlace: personData.deathPlace || null,
        isLiving: personData.isLiving ?? true,
        profilePhoto: personData.profilePhoto || null,
        bio: personData.bio || null,
        occupation: personData.occupation || null,
        createdBy: currentUser.id,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Insert relationships
      const relationshipsToInsert: any[] = [];

      // Parent relationships
      if (personData.parentRelationships) {
        personData.parentRelationships.forEach(rel => {
          relationshipsToInsert.push({
            familyTreeId: currentFamilyTreeId,
            personId: personRef.id,
            relatedPersonId: rel.personId,
            relationshipType: 'parent',
            subtype: rel.type,
            createdAt: serverTimestamp(),
          });
        });
      } else if (personData.parents) {
        personData.parents.forEach(parentId => {
          relationshipsToInsert.push({
            familyTreeId: currentFamilyTreeId,
            personId: personRef.id,
            relatedPersonId: parentId,
            relationshipType: 'parent',
            subtype: 'biological',
            createdAt: serverTimestamp(),
          });
        });
      }

      // Spouse relationships
      if (personData.spouseRelationships) {
        personData.spouseRelationships.forEach(rel => {
          relationshipsToInsert.push({
            familyTreeId: currentFamilyTreeId,
            personId: personRef.id,
            relatedPersonId: rel.personId,
            relationshipType: 'spouse',
            subtype: rel.status,
            createdAt: serverTimestamp(),
          });
          // Also add reciprocal relationship
          relationshipsToInsert.push({
            familyTreeId: currentFamilyTreeId,
            personId: rel.personId,
            relatedPersonId: personRef.id,
            relationshipType: 'spouse',
            subtype: rel.status,
            createdAt: serverTimestamp(),
          });
        });
      } else if (personData.spouseId) {
        relationshipsToInsert.push({
          familyTreeId: currentFamilyTreeId,
          personId: personRef.id,
          relatedPersonId: personData.spouseId,
          relationshipType: 'spouse',
          subtype: 'current',
          createdAt: serverTimestamp(),
        });
        relationshipsToInsert.push({
          familyTreeId: currentFamilyTreeId,
          personId: personData.spouseId,
          relatedPersonId: personRef.id,
          relationshipType: 'spouse',
          subtype: 'current',
          createdAt: serverTimestamp(),
        });
      }

      // Add all relationships
      for (const rel of relationshipsToInsert) {
        await addDoc(collection(db, 'relationships'), rel);
      }

      // Reload all persons to get updated relationships
      await get().loadPersons();

      return get().persons[personRef.id];
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
      const dbUpdates: any = { updatedAt: serverTimestamp() };
      if (updates.firstName !== undefined) dbUpdates.firstName = updates.firstName;
      if (updates.lastName !== undefined) dbUpdates.lastName = updates.lastName;
      if (updates.nickname !== undefined) dbUpdates.nickname = updates.nickname;
      if (updates.gender !== undefined) dbUpdates.gender = updates.gender;
      if (updates.birthDate !== undefined) dbUpdates.birthDate = updates.birthDate;
      if (updates.birthPlace !== undefined) dbUpdates.birthPlace = updates.birthPlace;
      if (updates.deathDate !== undefined) dbUpdates.deathDate = updates.deathDate;
      if (updates.deathPlace !== undefined) dbUpdates.deathPlace = updates.deathPlace;
      if (updates.isLiving !== undefined) dbUpdates.isLiving = updates.isLiving;
      if (updates.profilePhoto !== undefined) dbUpdates.profilePhoto = updates.profilePhoto;
      if (updates.bio !== undefined) dbUpdates.bio = updates.bio;
      if (updates.occupation !== undefined) dbUpdates.occupation = updates.occupation;

      await updateDoc(doc(db, 'persons', id), dbUpdates);

      // Handle relationship updates
      if (updates.spouseRelationships !== undefined || updates.parentRelationships !== undefined) {
        // Delete existing relationships for this person
        const existingRelQuery = query(
          collection(db, 'relationships'),
          where('personId', '==', id)
        );
        const existingRels = await getDocs(existingRelQuery);
        for (const relDoc of existingRels.docs) {
          await deleteDoc(relDoc.ref);
        }

        // Also delete reciprocal spouse relationships
        const reciprocalQuery = query(
          collection(db, 'relationships'),
          where('relatedPersonId', '==', id),
          where('relationshipType', '==', 'spouse')
        );
        const reciprocalRels = await getDocs(reciprocalQuery);
        for (const relDoc of reciprocalRels.docs) {
          await deleteDoc(relDoc.ref);
        }

        // Add parent relationships
        if (updates.parentRelationships) {
          for (const rel of updates.parentRelationships) {
            await addDoc(collection(db, 'relationships'), {
              familyTreeId: currentFamilyTreeId,
              personId: id,
              relatedPersonId: rel.personId,
              relationshipType: 'parent',
              subtype: rel.type,
              createdAt: serverTimestamp(),
            });
          }
        }

        // Add spouse relationships (bidirectional)
        if (updates.spouseRelationships) {
          for (const rel of updates.spouseRelationships) {
            await addDoc(collection(db, 'relationships'), {
              familyTreeId: currentFamilyTreeId,
              personId: id,
              relatedPersonId: rel.personId,
              relationshipType: 'spouse',
              subtype: rel.status,
              createdAt: serverTimestamp(),
            });
            await addDoc(collection(db, 'relationships'), {
              familyTreeId: currentFamilyTreeId,
              personId: rel.personId,
              relatedPersonId: id,
              relationshipType: 'spouse',
              subtype: rel.status,
              createdAt: serverTimestamp(),
            });
          }
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
      await deleteDoc(doc(db, 'persons', id));

      // Delete related relationships
      const relQuery1 = query(collection(db, 'relationships'), where('personId', '==', id));
      const relQuery2 = query(collection(db, 'relationships'), where('relatedPersonId', '==', id));

      const [rels1, rels2] = await Promise.all([getDocs(relQuery1), getDocs(relQuery2)]);

      for (const relDoc of [...rels1.docs, ...rels2.docs]) {
        await deleteDoc(relDoc.ref);
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
      await addDoc(collection(db, 'relationships'), {
        familyTreeId: currentFamilyTreeId,
        personId: childId,
        relatedPersonId: parentId,
        relationshipType: 'parent',
        subtype: 'biological',
        createdAt: serverTimestamp(),
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
      await addDoc(collection(db, 'relationships'), {
        familyTreeId: currentFamilyTreeId,
        personId: person1Id,
        relatedPersonId: person2Id,
        relationshipType: 'spouse',
        subtype: 'current',
        createdAt: serverTimestamp(),
      });

      await addDoc(collection(db, 'relationships'), {
        familyTreeId: currentFamilyTreeId,
        personId: person2Id,
        relatedPersonId: person1Id,
        relationshipType: 'spouse',
        subtype: 'current',
        createdAt: serverTimestamp(),
      });

      await get().loadPersons();
    } catch (error) {
      console.error('Error adding spouse relationship:', error);
    }
  },

  setParent: async (childId, parentId, _parentType) => {
    const { currentFamilyTreeId } = get();
    if (!currentFamilyTreeId) return;

    try {
      await addDoc(collection(db, 'relationships'), {
        familyTreeId: currentFamilyTreeId,
        personId: childId,
        relatedPersonId: parentId,
        relationshipType: 'parent',
        subtype: 'biological',
        createdAt: serverTimestamp(),
      });

      await get().loadPersons();
    } catch (error) {
      console.error('Error setting parent:', error);
    }
  },

  addComment: async (personId, content) => {
    const { currentUser, currentFamilyTreeId } = get();
    if (!currentUser || !currentFamilyTreeId) return;

    try {
      const commentRef = await addDoc(collection(db, 'comments'), {
        personId,
        familyTreeId: currentFamilyTreeId,
        authorId: currentUser.id,
        authorName: currentUser.displayName,
        content,
        createdAt: serverTimestamp(),
      });

      const comment: Comment = {
        id: commentRef.id,
        personId,
        authorId: currentUser.id,
        authorName: currentUser.displayName,
        content,
        createdAt: new Date().toISOString(),
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
    const { currentFamilyTreeId } = get();
    if (!currentFamilyTreeId) return;

    try {
      const commentsQuery = query(
        collection(db, 'comments'),
        where('personId', '==', personId),
        where('familyTreeId', '==', currentFamilyTreeId),
        orderBy('createdAt', 'asc')
      );
      const commentsSnapshot = await getDocs(commentsQuery);

      const comments: Comment[] = commentsSnapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          personId: data.personId,
          authorId: data.authorId,
          authorName: data.authorName,
          content: data.content,
          createdAt: timestampToString(data.createdAt),
        };
      });

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
    const { currentUser, currentFamilyTreeId } = get();
    if (!currentUser || !currentFamilyTreeId) return;

    try {
      const storyRef = await addDoc(collection(db, 'stories'), {
        personId,
        familyTreeId: currentFamilyTreeId,
        authorId: authorId || currentUser.id,
        authorName: currentUser.displayName,
        title: 'Story',
        content,
        isFeatured: false,
        createdAt: serverTimestamp(),
      });

      const story: Story = {
        id: storyRef.id,
        personId,
        authorId: authorId || currentUser.id,
        authorName: currentUser.displayName,
        content,
        isFeatured: false,
        createdAt: new Date().toISOString(),
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
    const { currentFamilyTreeId } = get();
    if (!currentFamilyTreeId) return;

    try {
      const storiesQuery = query(
        collection(db, 'stories'),
        where('personId', '==', personId),
        where('familyTreeId', '==', currentFamilyTreeId),
        orderBy('createdAt', 'asc')
      );
      const storiesSnapshot = await getDocs(storiesQuery);

      const stories: Story[] = storiesSnapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          personId: data.personId,
          authorId: data.authorId,
          authorName: data.authorName,
          content: data.content,
          isFeatured: data.isFeatured,
          createdAt: timestampToString(data.createdAt),
        };
      });

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
    const { currentUser, currentFamilyTreeId } = get();
    if (!currentUser || !currentFamilyTreeId) return;

    try {
      const photoRef = await addDoc(collection(db, 'personPhotos'), {
        personId,
        familyTreeId: currentFamilyTreeId,
        url: photoUrl,
        caption: caption || null,
        uploadedBy: currentUser.id,
        uploadedAt: serverTimestamp(),
      });

      // Update local state
      const photo: Photo = {
        id: photoRef.id,
        url: photoUrl,
        uri: photoUrl,
        caption: caption || undefined,
        taggedPersonIds: [personId],
        uploadedAt: new Date().toISOString(),
        uploadedBy: currentUser.id,
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
