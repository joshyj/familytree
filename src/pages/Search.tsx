import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search as SearchIcon, ArrowLeft, X } from 'lucide-react';
import { useStore } from '../store/useStore';
import { getInitials, stringToColor, getFullName } from '../utils/helpers';
import styles from './Search.module.css';

export default function Search() {
  const navigate = useNavigate();
  const personsRecord = useStore((state) => state.persons);
  const persons = Object.values(personsRecord);
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return persons.filter(
      (p) =>
        p.firstName.toLowerCase().includes(q) ||
        p.lastName.toLowerCase().includes(q) ||
        (p.nickname && p.nickname.toLowerCase().includes(q)) ||
        (p.birthPlace && p.birthPlace.toLowerCase().includes(q))
    );
  }, [persons, query]);

  const recentSearches = useMemo(() => {
    return persons.slice(0, 5);
  }, [persons]);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <div className={styles.searchBar}>
          <SearchIcon size={20} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search family members..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={styles.searchInput}
            autoFocus
          />
          {query && (
            <button className={styles.clearBtn} onClick={() => setQuery('')}>
              <X size={20} />
            </button>
          )}
        </div>
      </header>

      <div className={styles.content}>
        {query.trim() ? (
          <>
            <p className={styles.resultCount}>
              {results.length} result{results.length !== 1 ? 's' : ''} found
            </p>
            {results.length === 0 ? (
              <div className={styles.emptyState}>
                <SearchIcon size={48} color="#D1D5DB" />
                <p>No matches found for "{query}"</p>
              </div>
            ) : (
              <div className={styles.resultList}>
                {results.map((person) => (
                  <button
                    key={person.id}
                    className={styles.resultItem}
                    onClick={() => navigate(`/person/${person.id}`)}
                  >
                    {person.profilePhoto ? (
                      <img
                        src={person.profilePhoto}
                        alt=""
                        className={styles.avatar}
                      />
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
                        <span className={styles.personMeta}>
                          Born {new Date(person.birthDate).getFullYear()}
                          {person.birthPlace && ` • ${person.birthPlace}`}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            {recentSearches.length > 0 && (
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Family Members</h2>
                <div className={styles.resultList}>
                  {recentSearches.map((person) => (
                    <button
                      key={person.id}
                      className={styles.resultItem}
                      onClick={() => navigate(`/person/${person.id}`)}
                    >
                      {person.profilePhoto ? (
                        <img
                          src={person.profilePhoto}
                          alt=""
                          className={styles.avatar}
                        />
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
                          <span className={styles.personMeta}>
                            Born {new Date(person.birthDate).getFullYear()}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
