export type SpouseStatus = 'current' | 'divorced' | 'widowed' | 'separated';
export type ParentType = 'biological' | 'step' | 'adoptive';

export interface SpouseRelationship {
  personId: string;
  status: SpouseStatus;
  marriageDate?: string;
  divorceDate?: string;
}

export interface ParentRelationship {
  personId: string;
  type: ParentType;
}

export interface Person {
  id: string;
  firstName: string;
  lastName: string;
  maidenName?: string;
  nickname?: string;
  gender?: 'male' | 'female' | 'other';
  birthDate?: string;
  birthPlace?: string;
  deathDate?: string;
  deathPlace?: string;
  isLiving?: boolean;
  profilePhoto?: string;
  photos: Photo[];
  bio?: string;
  occupation?: string;
  fatherId?: string;
  motherId?: string;
  spouseId?: string;
  spouseIds: string[];
  // New relationship fields
  spouseRelationships?: SpouseRelationship[];
  parentRelationships?: ParentRelationship[];
  children: string[];
  childrenIds: string[];
  parents: string[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface Photo {
  id: string;
  url: string;
  uri?: string;
  caption?: string;
  dateTaken?: string;
  takenAt?: string;
  taggedPersonIds: string[];
  uploadedAt: string;
  uploadedBy: string;
}

export interface Comment {
  id: string;
  personId: string;
  authorId: string;
  authorName: string;
  content: string;
  parentCommentId?: string;
  createdAt: string;
}

export interface Story {
  id: string;
  personId: string;
  authorId: string;
  authorName: string;
  title?: string;
  content: string;
  isFeatured?: boolean;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  role: 'admin' | 'editor' | 'viewer';
  familyTreeId: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}
