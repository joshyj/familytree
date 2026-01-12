import { Person } from '../types';

export function formatDate(dateString?: string): string {
  if (!dateString) return 'Unknown';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export function getBirthYear(dateString?: string): string {
  if (!dateString) return '';
  try {
    return new Date(dateString).getFullYear().toString();
  } catch {
    return '';
  }
}

export function getFullName(firstName: string, lastName?: string): string {
  if (lastName) {
    return `${firstName} ${lastName}`.trim();
  }
  return firstName;
}

export function getFullNameFromPerson(person: Person): string {
  let name = `${person.firstName} ${person.lastName}`;
  if (person.maidenName) {
    name += ` (née ${person.maidenName})`;
  }
  return name;
}

export function getLifeSpan(person: Person): string {
  const birthYear = getBirthYear(person.birthDate);
  const deathYear = person.deathDate ? getBirthYear(person.deathDate) : '';

  if (person.isLiving) {
    return birthYear ? `b. ${birthYear}` : '';
  }

  if (birthYear && deathYear) {
    return `${birthYear} - ${deathYear}`;
  }

  if (birthYear) {
    return `b. ${birthYear}`;
  }

  if (deathYear) {
    return `d. ${deathYear}`;
  }

  return '';
}

export function calculateAge(birthDate?: string, deathDate?: string): number | null {
  if (!birthDate) return null;

  const birth = new Date(birthDate);
  const end = deathDate ? new Date(deathDate) : new Date();

  let age = end.getFullYear() - birth.getFullYear();
  const monthDiff = end.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && end.getDate() < birth.getDate())) {
    age--;
  }

  return age;
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPassword(password: string): boolean {
  return password.length >= 6;
}

export function getInitials(firstName: string, lastName?: string): string {
  const first = firstName?.charAt(0) || '';
  const last = lastName?.charAt(0) || '';
  return `${first}${last}`.toUpperCase();
}

export function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = hash % 360;
  return `hsl(${h}, 65%, 55%)`;
}

export function getGenderColor(gender?: 'male' | 'female' | 'other'): string {
  switch (gender) {
    case 'male': return '#4A90D9';
    case 'female': return '#D94A8C';
    default: return '#6B7280';
  }
}

export function calculateRelationship(
  person1: Person,
  person2: Person,
  persons: Record<string, Person>
): string {
  if (person1.fatherId === person2.id || person1.motherId === person2.id) {
    return person2.gender === 'male' ? 'Father' : person2.gender === 'female' ? 'Mother' : 'Parent';
  }

  if (person2.fatherId === person1.id || person2.motherId === person1.id) {
    return person2.gender === 'male' ? 'Son' : person2.gender === 'female' ? 'Daughter' : 'Child';
  }

  if (person1.spouseIds.includes(person2.id)) {
    return person2.gender === 'male' ? 'Husband' : person2.gender === 'female' ? 'Wife' : 'Spouse';
  }

  const person1Parents = [person1.fatherId, person1.motherId].filter(Boolean);
  const person2Parents = [person2.fatherId, person2.motherId].filter(Boolean);

  const sharedParents = person1Parents.filter(p => person2Parents.includes(p));
  if (sharedParents.length > 0) {
    if (sharedParents.length === 2) {
      return person2.gender === 'male' ? 'Brother' : person2.gender === 'female' ? 'Sister' : 'Sibling';
    }
    return person2.gender === 'male' ? 'Half-Brother' : person2.gender === 'female' ? 'Half-Sister' : 'Half-Sibling';
  }

  for (const parentId of person1Parents) {
    const parent = persons[parentId as string];
    if (parent) {
      if (parent.fatherId === person2.id || parent.motherId === person2.id) {
        return person2.gender === 'male' ? 'Grandfather' : person2.gender === 'female' ? 'Grandmother' : 'Grandparent';
      }
    }
  }

  return 'Related';
}
