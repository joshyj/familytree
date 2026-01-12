import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Person, User, Comment, Story, Photo } from '../types';

const generateId = () => crypto.randomUUID();

interface AppState {
  currentUser: User | null;
  isAuthenticated: boolean;
  persons: Record<string, Person>;
  comments: Record<string, Comment[]>;
  stories: Record<string, Story[]>;
  selectedPersonId: string | null;

  login: (email: string, password: string) => boolean;
  register: (email: string, password: string, displayName: string) => boolean;
  logout: () => void;

  addPerson: (person: Partial<Person> & { firstName: string; lastName: string }) => Person;
  updatePerson: (id: string, updates: Partial<Person>) => void;
  deletePerson: (id: string) => void;
  getPerson: (id: string) => Person | undefined;
  getAllPersons: () => Person[];

  addChild: (parentId: string, childId: string) => void;
  addSpouse: (person1Id: string, person2Id: string) => void;
  setParent: (childId: string, parentId: string, parentType: 'father' | 'mother') => void;

  addComment: (personId: string, content: string) => void;
  getComments: (personId: string) => Comment[];

  addStory: (personId: string, content: string, authorId: string) => void;
  getStories: (personId: string) => Story[];

  addPhoto: (personId: string, photoUrl: string, caption?: string) => void;
  addPhotoToPerson: (personId: string, photoUrl: string, caption?: string) => void;
  setProfilePhoto: (personId: string, photoUrl: string) => void;

  selectPerson: (id: string | null) => void;
  searchPersons: (query: string) => Person[];

  getChildren: (personId: string) => Person[];
  getParents: (personId: string) => Person[];
  getSpouses: (personId: string) => Person[];
  getSiblings: (personId: string) => Person[];
}

interface StoredUser {
  email: string;
  password: string;
  displayName: string;
}

const getStoredUsers = (): Record<string, StoredUser> => {
  const stored = localStorage.getItem('familyroots_users');
  return stored ? JSON.parse(stored) : {};
};

const setStoredUsers = (users: Record<string, StoredUser>) => {
  localStorage.setItem('familyroots_users', JSON.stringify(users));
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      isAuthenticated: false,
      persons: {},
      comments: {},
      stories: {},
      selectedPersonId: null,

      login: (email, password) => {
        const users = getStoredUsers();
        const userEntry = Object.entries(users).find(([_, u]) => u.email === email.toLowerCase());

        if (userEntry && userEntry[1].password === password) {
          const user: User = {
            id: userEntry[0],
            email: userEntry[1].email,
            displayName: userEntry[1].displayName,
            role: 'admin',
            familyTreeId: 'default',
            createdAt: new Date().toISOString(),
          };
          set({ currentUser: user, isAuthenticated: true });
          return true;
        }
        return false;
      },

      register: (email, password, displayName) => {
        const users = getStoredUsers();
        if (Object.values(users).some(u => u.email === email.toLowerCase())) {
          return false;
        }

        const userId = generateId();
        users[userId] = { email: email.toLowerCase(), password, displayName };
        setStoredUsers(users);

        const user: User = {
          id: userId,
          email: email.toLowerCase(),
          displayName,
          role: 'admin',
          familyTreeId: 'default',
          createdAt: new Date().toISOString(),
        };

        set({ currentUser: user, isAuthenticated: true });
        return true;
      },

      logout: () => {
        set({ currentUser: null, isAuthenticated: false });
      },

      addPerson: (personData) => {
        const { currentUser } = get();
        const id = generateId();
        const now = new Date().toISOString();

        const person: Person = {
          id,
          firstName: personData.firstName,
          lastName: personData.lastName,
          nickname: personData.nickname,
          gender: personData.gender,
          birthDate: personData.birthDate,
          birthPlace: personData.birthPlace,
          deathDate: personData.deathDate,
          deathPlace: personData.deathPlace,
          isLiving: personData.isLiving ?? true,
          profilePhoto: personData.profilePhoto,
          photos: [],
          bio: personData.bio,
          occupation: personData.occupation,
          fatherId: personData.fatherId,
          motherId: personData.motherId,
          spouseId: personData.spouseId,
          spouseIds: personData.spouseIds || [],
          children: personData.children || [],
          childrenIds: personData.childrenIds || [],
          parents: personData.parents || [],
          createdAt: now,
          updatedAt: now,
          createdBy: currentUser?.id || 'unknown',
        };

        set((state) => ({
          persons: { ...state.persons, [id]: person }
        }));

        // Handle spouse relationship if spouseId is provided
        if (personData.spouseId) {
          const { persons } = get();
          const spouse = persons[personData.spouseId];
          if (spouse) {
            set((state) => ({
              persons: {
                ...state.persons,
                [personData.spouseId!]: {
                  ...spouse,
                  spouseId: id,
                  spouseIds: [...new Set([...spouse.spouseIds, id])],
                }
              }
            }));
          }
        }

        // Handle parent relationships
        if (personData.parents && personData.parents.length > 0) {
          const { persons } = get();
          personData.parents.forEach((parentId) => {
            const parent = persons[parentId];
            if (parent) {
              set((state) => ({
                persons: {
                  ...state.persons,
                  [parentId]: {
                    ...parent,
                    children: [...new Set([...parent.children, id])],
                    childrenIds: [...new Set([...parent.childrenIds, id])],
                  }
                }
              }));
            }
          });
        }

        return get().persons[id];
      },

      updatePerson: (id, updates) => {
        set((state) => ({
          persons: {
            ...state.persons,
            [id]: {
              ...state.persons[id],
              ...updates,
              updatedAt: new Date().toISOString(),
            }
          }
        }));
      },

      deletePerson: (id) => {
        set((state) => {
          const newPersons = { ...state.persons };
          delete newPersons[id];

          Object.values(newPersons).forEach(person => {
            if (person.fatherId === id) person.fatherId = undefined;
            if (person.motherId === id) person.motherId = undefined;
            if (person.spouseId === id) person.spouseId = undefined;
            person.spouseIds = person.spouseIds.filter(sid => sid !== id);
            person.childrenIds = person.childrenIds.filter(cid => cid !== id);
            person.children = person.children.filter(cid => cid !== id);
            person.parents = person.parents.filter(pid => pid !== id);
          });

          return { persons: newPersons };
        });
      },

      getPerson: (id) => get().persons[id],

      getAllPersons: () => Object.values(get().persons),

      addChild: (parentId, childId) => {
        const { persons } = get();
        const parent = persons[parentId];
        const child = persons[childId];

        if (parent && child) {
          set((state) => ({
            persons: {
              ...state.persons,
              [parentId]: {
                ...parent,
                childrenIds: [...new Set([...parent.childrenIds, childId])],
                children: [...new Set([...parent.children, childId])],
              },
              [childId]: {
                ...child,
                ...(parent.gender === 'male' ? { fatherId: parentId } : { motherId: parentId }),
                parents: [...new Set([...child.parents, parentId])],
              }
            }
          }));
        }
      },

      addSpouse: (person1Id, person2Id) => {
        const { persons } = get();
        const person1 = persons[person1Id];
        const person2 = persons[person2Id];

        if (person1 && person2) {
          set((state) => ({
            persons: {
              ...state.persons,
              [person1Id]: {
                ...person1,
                spouseId: person2Id,
                spouseIds: [...new Set([...person1.spouseIds, person2Id])],
              },
              [person2Id]: {
                ...person2,
                spouseId: person1Id,
                spouseIds: [...new Set([...person2.spouseIds, person1Id])],
              }
            }
          }));
        }
      },

      setParent: (childId, parentId, parentType) => {
        const { persons } = get();
        const child = persons[childId];
        const parent = persons[parentId];

        if (child && parent) {
          set((state) => ({
            persons: {
              ...state.persons,
              [childId]: {
                ...child,
                [parentType === 'father' ? 'fatherId' : 'motherId']: parentId,
                parents: [...new Set([...child.parents, parentId])],
              },
              [parentId]: {
                ...parent,
                childrenIds: [...new Set([...parent.childrenIds, childId])],
                children: [...new Set([...parent.children, childId])],
              }
            }
          }));
        }
      },

      addComment: (personId, content) => {
        const { currentUser } = get();
        const comment: Comment = {
          id: generateId(),
          personId,
          authorId: currentUser?.id || 'unknown',
          authorName: currentUser?.displayName || 'Anonymous',
          content,
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          comments: {
            ...state.comments,
            [personId]: [...(state.comments[personId] || []), comment],
          }
        }));
      },

      getComments: (personId) => get().comments[personId] || [],

      addStory: (personId, content, authorId) => {
        const { currentUser } = get();
        const story: Story = {
          id: generateId(),
          personId,
          authorId: authorId || currentUser?.id || 'unknown',
          authorName: currentUser?.displayName || 'Anonymous',
          content,
          isFeatured: false,
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          stories: {
            ...state.stories,
            [personId]: [...(state.stories[personId] || []), story],
          }
        }));
      },

      getStories: (personId) => get().stories[personId] || [],

      addPhoto: (personId, photoUrl, caption) => {
        const { currentUser, persons } = get();
        const person = persons[personId];

        if (person) {
          const photo: Photo = {
            id: generateId(),
            url: photoUrl,
            uri: photoUrl,
            caption,
            taggedPersonIds: [personId],
            uploadedAt: new Date().toISOString(),
            uploadedBy: currentUser?.id || 'unknown',
          };

          set((state) => ({
            persons: {
              ...state.persons,
              [personId]: {
                ...person,
                photos: [...person.photos, photo],
              }
            }
          }));
        }
      },

      addPhotoToPerson: (personId, photoUrl, caption) => {
        get().addPhoto(personId, photoUrl, caption);
      },

      setProfilePhoto: (personId, photoUrl) => {
        get().updatePerson(personId, { profilePhoto: photoUrl });
      },

      selectPerson: (id) => set({ selectedPersonId: id }),

      searchPersons: (query) => {
        const normalizedQuery = query.toLowerCase().trim();
        if (!normalizedQuery) return [];

        return Object.values(get().persons).filter(person => {
          const fullName = `${person.firstName} ${person.lastName}`.toLowerCase();
          const maidenName = person.maidenName?.toLowerCase() || '';
          const birthPlace = person.birthPlace?.toLowerCase() || '';
          const nickname = person.nickname?.toLowerCase() || '';

          return fullName.includes(normalizedQuery) ||
                 maidenName.includes(normalizedQuery) ||
                 birthPlace.includes(normalizedQuery) ||
                 nickname.includes(normalizedQuery);
        });
      },

      getChildren: (personId) => {
        const { persons } = get();
        const person = persons[personId];
        if (!person) return [];
        const childIds = [...new Set([...person.childrenIds, ...person.children])];
        return childIds.map(id => persons[id]).filter(Boolean);
      },

      getParents: (personId) => {
        const { persons } = get();
        const person = persons[personId];
        if (!person) return [];
        const parentIds = [...new Set([person.fatherId, person.motherId, ...person.parents].filter(Boolean))] as string[];
        return parentIds.map(id => persons[id]).filter(Boolean);
      },

      getSpouses: (personId) => {
        const { persons } = get();
        const person = persons[personId];
        if (!person) return [];
        const spouseIdList = [...new Set([person.spouseId, ...person.spouseIds].filter(Boolean))] as string[];
        return spouseIdList.map(id => persons[id]).filter(Boolean);
      },

      getSiblings: (personId) => {
        const { persons } = get();
        const person = persons[personId];
        if (!person) return [];

        const siblingIds = new Set<string>();

        if (person.fatherId) {
          const father = persons[person.fatherId];
          father?.childrenIds.forEach(id => {
            if (id !== personId) siblingIds.add(id);
          });
          father?.children.forEach(id => {
            if (id !== personId) siblingIds.add(id);
          });
        }

        if (person.motherId) {
          const mother = persons[person.motherId];
          mother?.childrenIds.forEach(id => {
            if (id !== personId) siblingIds.add(id);
          });
          mother?.children.forEach(id => {
            if (id !== personId) siblingIds.add(id);
          });
        }

        return Array.from(siblingIds).map(id => persons[id]).filter(Boolean);
      },
    }),
    {
      name: 'familyroots-storage',
      partialize: (state) => ({
        persons: state.persons,
        comments: state.comments,
        stories: state.stories,
        currentUser: state.currentUser,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
