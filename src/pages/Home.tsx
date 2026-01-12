import { useNavigate } from 'react-router-dom';
import { Search, Users, Image, BookOpen, UserPlus, GitBranch, Sparkles, Settings } from 'lucide-react';
import { useStore } from '../store/useStore';
import { getInitials, stringToColor } from '../utils/helpers';
import styles from './Home.module.css';

export default function Home() {
  const navigate = useNavigate();
  const currentUser = useStore((state) => state.currentUser);
  const personsRecord = useStore((state) => state.persons);
  const stories = useStore((state) => state.stories);

  // Derive persons array from the record to avoid infinite re-renders
  const persons = Object.values(personsRecord);

  const recentPersons = [...persons]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  const totalPhotos = persons.reduce((sum, p) => sum + p.photos.length, 0);
  const totalStories = Object.values(stories).flat().length;

  const quickActions = [
    { icon: UserPlus, label: 'Add Person', onClick: () => navigate('/person/new'), color: '#EBF5FF', iconColor: '#4A90D9' },
    { icon: GitBranch, label: 'View Tree', onClick: () => navigate('/tree'), color: '#F0FDF4', iconColor: '#10B981' },
    { icon: Sparkles, label: 'AI Assistant', onClick: () => navigate('/ai-chat'), color: '#FDF4FF', iconColor: '#A855F7' },
    { icon: Settings, label: 'Settings', onClick: () => navigate('/settings'), color: '#FEF3C7', iconColor: '#D97706' },
  ];

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <p className={styles.greeting}>Welcome back,</p>
          <h1 className={styles.userName}>{currentUser?.displayName || 'Family Member'}</h1>
        </div>
        <button className={styles.searchButton} onClick={() => navigate('/search')}>
          <Search size={24} />
        </button>
      </header>

      <div className={styles.stats}>
        <div className={styles.statCard}>
          <Users size={28} color="#4A90D9" />
          <span className={styles.statNumber}>{persons.length}</span>
          <span className={styles.statLabel}>Members</span>
        </div>
        <div className={styles.statCard}>
          <Image size={28} color="#D94A8C" />
          <span className={styles.statNumber}>{totalPhotos}</span>
          <span className={styles.statLabel}>Photos</span>
        </div>
        <div className={styles.statCard}>
          <BookOpen size={28} color="#10B981" />
          <span className={styles.statNumber}>{totalStories}</span>
          <span className={styles.statLabel}>Stories</span>
        </div>
      </div>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Quick Actions</h2>
        <div className={styles.quickActions}>
          {quickActions.map(({ icon: Icon, label, onClick, color, iconColor }) => (
            <button key={label} className={styles.actionButton} onClick={onClick}>
              <div className={styles.actionIcon} style={{ background: color }}>
                <Icon size={24} color={iconColor} />
              </div>
              <span>{label}</span>
            </button>
          ))}
        </div>
      </section>

      {persons.length === 0 ? (
        <div className={styles.emptyState}>
          <Users size={64} color="#D1D5DB" />
          <h3>Start Your Family Tree</h3>
          <p>Add yourself and your family members to begin building your family history.</p>
          <button className={styles.primaryButton} onClick={() => navigate('/person/new')}>
            <UserPlus size={20} />
            Add First Person
          </button>
        </div>
      ) : (
        <>
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Recently Updated</h2>
              <button className={styles.seeAllButton} onClick={() => navigate('/tree')}>
                See All
              </button>
            </div>
            <div className={styles.personsList}>
              {recentPersons.map((person) => (
                <button
                  key={person.id}
                  className={styles.personCard}
                  onClick={() => navigate(`/person/${person.id}`)}
                >
                  {person.profilePhoto ? (
                    <img src={person.profilePhoto} alt="" className={styles.personPhoto} />
                  ) : (
                    <div
                      className={styles.personAvatar}
                      style={{ background: stringToColor(person.id) }}
                    >
                      {getInitials(person.firstName, person.lastName)}
                    </div>
                  )}
                  <span className={styles.personName}>{person.firstName}</span>
                </button>
              ))}
            </div>
          </section>

          <div className={styles.tipCard}>
            <div className={styles.tipHeader}>
              <span className={styles.tipIcon}>💡</span>
              <span className={styles.tipTitle}>Tip</span>
            </div>
            <p className={styles.tipText}>
              Try adding photos to your family members' profiles to make your tree more visual and engaging!
            </p>
          </div>
        </>
      )}
    </div>
  );
}
