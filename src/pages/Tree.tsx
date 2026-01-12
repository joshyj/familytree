import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronRight, UserPlus, Search, Users } from 'lucide-react';
import { useStore } from '../store/useStore';
import { getInitials, stringToColor, getFullName } from '../utils/helpers';
import styles from './Tree.module.css';

interface TreeNode {
  person: ReturnType<typeof useStore.getState>['getAllPersons'] extends () => (infer T)[] ? T : never;
  children: TreeNode[];
  level: number;
}

export default function Tree() {
  const navigate = useNavigate();
  const personsRecord = useStore((state) => state.persons);
  const persons = Object.values(personsRecord);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
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

  const rootPersons = useMemo(() => {
    const childIds = new Set<string>();
    persons.forEach((p) => {
      p.children.forEach((id) => childIds.add(id));
    });
    return filteredPersons.filter((p) => !childIds.has(p.id));
  }, [persons, filteredPersons]);

  const buildTree = (person: typeof persons[0], level: number): TreeNode => {
    const children = person.children
      .map((childId) => persons.find((p) => p.id === childId))
      .filter(Boolean)
      .map((child) => buildTree(child!, level + 1));
    return { person, children, level };
  };

  const toggleExpand = (id: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const renderNode = (node: TreeNode) => {
    const { person, children, level } = node;
    const isExpanded = expandedNodes.has(person.id);
    const hasChildren = children.length > 0;

    return (
      <div key={person.id} className={styles.nodeContainer}>
        <div
          className={styles.node}
          style={{ marginLeft: level * 24 }}
        >
          {hasChildren && (
            <button
              className={styles.expandButton}
              onClick={() => toggleExpand(person.id)}
            >
              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
          )}
          <button
            className={styles.personButton}
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
              {person.birthDate && (
                <span className={styles.personDates}>
                  {new Date(person.birthDate).getFullYear()}
                  {person.deathDate && ` - ${new Date(person.deathDate).getFullYear()}`}
                </span>
              )}
            </div>
          </button>
        </div>
        {isExpanded && children.map(renderNode)}
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
          <Users size={64} color="#D1D5DB" />
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
          <Search size={64} color="#D1D5DB" />
          <h3>No Results Found</h3>
          <p>Try a different search term.</p>
        </div>
      ) : (
        <div className={styles.tree}>
          {rootPersons.map((person) => renderNode(buildTree(person, 0)))}
        </div>
      )}
    </div>
  );
}
