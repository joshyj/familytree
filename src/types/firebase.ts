import { Timestamp } from 'firebase/firestore';

// Firestore document types for FamilyRoots app

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  currentFamilyTreeId: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface FamilyTree {
  id: string;
  name: string;
  description: string | null;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface FamilyTreeMember {
  id: string;
  familyTreeId: string;
  userId: string;
  role: 'admin' | 'editor' | 'viewer';
  joinedAt: Timestamp;
}

export interface FirestorePerson {
  id: string;
  familyTreeId: string;
  firstName: string;
  lastName: string;
  nickname: string | null;
  gender: 'male' | 'female' | 'other' | null;
  birthDate: string | null;
  deathDate: string | null;
  birthPlace: string | null;
  deathPlace: string | null;
  isLiving: boolean;
  profilePhoto: string | null;
  bio: string | null;
  occupation: string | null;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface FirestoreRelationship {
  id: string;
  familyTreeId: string;
  personId: string;
  relatedPersonId: string;
  relationshipType: 'parent' | 'spouse';
  subtype: string | null; // 'biological', 'step', 'adoptive' for parent; 'current', 'divorced', 'widowed', 'separated' for spouse
  createdAt: Timestamp;
}

export interface PersonPhoto {
  id: string;
  personId: string;
  familyTreeId: string;
  url: string;
  caption: string | null;
  uploadedBy: string;
  uploadedAt: Timestamp;
}

export interface PhotoTag {
  id: string;
  photoId: string;
  personId: string;
}

export interface FirestoreComment {
  id: string;
  personId: string;
  familyTreeId: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: Timestamp;
}

export interface FirestoreStory {
  id: string;
  personId: string;
  familyTreeId: string;
  authorId: string;
  authorName: string;
  title: string;
  content: string;
  isFeatured: boolean;
  createdAt: Timestamp;
}

// Helper type for creating new documents (without id, timestamps auto-generated)
export type CreateDocument<T> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>;
