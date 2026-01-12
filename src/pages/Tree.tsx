import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Search, Users, Heart } from 'lucide-react';
import { useStore } from '../store/useStore';
import { getInitials, stringToColor, getFullName } from '../utils/helpers';
import { Person } from '../types';
import styles from './Tree.module.css';

interface FamilyUnit {
  person: Person;
  spouse?: Person;
  children: FamilyUnit[];
}

export default function Tree() {
  const navigate = useNavigate();
  const personsRecord = useStore((state) => state.persons);
  const persons = Object.values(personsRecord);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPersons = useMemo(() => {
    if (!searchQuery.trim()) return persons;
    const query = searchQuery.toLowerCase();
    return persons.filter(
      (p) =>
        p.firstName.toLowerCase().includes(query) ||
        p.lastName.toLowerCase().includes(query)
    );
  }, [persons, searchQuery]);

  // Find root persons (those who have no parents in the tree)
  const rootPersons = useMemo(() => {
    const childIds = new Set<string>();
    persons.forEach((p) => {
      p.children.forEach((id) => childIds.add(id));
      p.childrenIds.forEach((id) => childIds.add(id));
    });

    // If searching, show matching persons as roots
    if (searchQuery.trim()) {
      return filteredPersons;
    }

    return persons.filter((p) => !childIds.has(p.id));
  }, [persons, filteredPersons, searchQuery]);

  // Build family unit with spouse and children
  const buildFamilyUnit = (person: Person, visited: Set<string>): FamilyUnit | null => {
    if (visited.has(person.id)) return null;
    visited.add(person.id);

    // Find spouse
    const spouse = person.spouseId
      ? persons.find((p) => p.id === person.spouseId)
      : undefined;

    if (spouse) {
      visited.add(spouse.id);
    }

    // Get children IDs from both person and spouse
    const childIds = new Set<string>([
      ...person.children,
      ...person.childrenIds,
      ...(spouse?.children || []),
      ...(spouse?.childrenIds || []),
    ]);

    const children: FamilyUnit[] = [];
    childIds.forEach((childId) => {
      const child = persons.find((p) => p.id === childId);
      if (child && !visited.has(child.id)) {
        const childUnit = buildFamilyUnit(child, visited);
        if (childUnit) {
          children.push(childUnit);
        }
      }
    });

    return { person, spouse, children };
  };

  const familyUnits = useMemo(() => {
    const visited = new Set<string>();
    const units: FamilyUnit[] = [];

    rootPersons.forEach((person) => {
      if (!visited.has(person.id)) {
        const unit = buildFamilyUnit(person, visited);
        if (unit) {
          units.push(unit);
        }
      }
    });

    return units;
  }, [rootPersons, persons]);

  const getGenderClass = (gender?: string) => {
    switch (gender) {
      case 'male': return styles.male;
      case 'female': return styles.female;
      default: return styles.other;
    }
  };

  const renderPersonCard = (person: Person, isSpouse = false) => (
    <button
      key={person.id}
      className={`${styles.personCard} ${getGenderClass(person.gender)} ${isSpouse ? styles.spouseCard : ''}`}
      onClick={() => navigate(`/person/${person.id}`)}
    >
      {person.profilePhoto ? (
        <img src={person.profilePhoto} alt="" className={styles.avatar} />
      ) : (
        <div
          className={styles.avatarPlaceholder}
          style={{ background: stringToColor(person.id) }}
        >
          {getInitials(person.firstName, person.lastName)}
        </div>
      )}
      <div className={styles.personInfo}>
        <span className={styles.personName}>
          {getFullName(person.firstName, person.lastName)}
        </span>
        {(person.birthDate || person.deathDate) && (
          <span className={styles.personDates}>
            {person.birthDate && new Date(person.birthDate).getFullYear()}
            {person.birthDate && person.deathDate && ' - '}
            {person.deathDate && new Date(person.deathDate).getFullYear()}
            {!person.deathDate && person.birthDate && ' - Present'}
          </span>
        )}
      </div>
    </button>
  );

  const renderFamilyUnit = (unit: FamilyUnit, isRoot = false) => {
    const { person, spouse, children } = unit;
    const hasChildren = children.length > 0;

    return (
      <div key={person.id} className={`${styles.familyUnit} ${isRoot ? styles.rootUnit : ''}`}>
        {/* Parents row */}
        <div className={styles.coupleContainer}>
          {renderPersonCard(person)}
          {spouse && (
            <>
              <div className={styles.spouseConnector}>
                <Heart size={14} className={styles.heartIcon} />
              </div>
              {renderPersonCard(spouse, true)}
            </>
          )}
        </div>

        {/* Children */}
        {hasChildren && (
          <>
            <div className={styles.verticalLine} />
            <div className={styles.childrenContainer}>
              {children.length > 1 && <div className={styles.horizontalLine} />}
              <div className={styles.childrenRow}>
                {children.map((child) => (
                  <div key={child.person.id} className={styles.childBranch}>
                    {children.length > 1 && <div className={styles.childConnector} />}
                    {renderFamilyUnit(child)}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Family Tree</h1>
        <button
          className={styles.addButton}
          onClick={() => navigate('/person/new')}
        >
          <UserPlus size={20} />
        </button>
      </header>

      <div className={styles.searchContainer}>
        <Search size={20} className={styles.searchIcon} />
        <input
          type="text"
          placeholder="Search family members..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      {persons.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <Users size={48} />
          </div>
          <h3>No Family Members Yet</h3>
          <p>Start building your family tree by adding the first person.</p>
          <button
            className={styles.primaryButton}
            onClick={() => navigate('/person/new')}
          >
            <UserPlus size={20} />
            Add First Person
          </button>
        </div>
      ) : filteredPersons.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <Search size={48} />
          </div>
          <h3>No Results Found</h3>
          <p>Try a different search term.</p>
        </div>
      ) : (
        <div className={styles.treeWrapper}>
          <div className={styles.tree}>
            {familyUnits.map((unit) => renderFamilyUnit(unit, true))}
          </div>
        </div>
      )}

      {/* Legend */}
      {persons.length > 0 && (
        <div className={styles.legend}>
          <div className={styles.legendItem}>
            <div className={`${styles.legendDot} ${styles.male}`} />
            <span>Male</span>
          </div>
          <div className={styles.legendItem}>
            <div className={`${styles.legendDot} ${styles.female}`} />
            <span>Female</span>
          </div>
          <div className={styles.legendItem}>
            <Heart size={12} className={styles.legendHeart} />
            <span>Married</span>
          </div>
        </div>
      )}
    </div>
  );
}
