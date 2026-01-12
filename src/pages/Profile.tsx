import { useNavigate } from 'react-router-dom';
import { User, Mail, Calendar, LogOut, ChevronRight, Users, Image, MessageSquare } from 'lucide-react';
import { useStore } from '../store/useStore';
import { getInitials, stringToColor, formatDate } from '../utils/helpers';
import styles from './Profile.module.css';

export default function Profile() {
  const navigate = useNavigate();
  const currentUser = useStore((state) => state.currentUser);
  const personsRecord = useStore((state) => state.persons);
  const persons = Object.values(personsRecord);
  const stories = useStore((state) => state.stories);
  const logout = useStore((state) => state.logout);

  const totalPhotos = persons.reduce((sum, p) => sum + p.photos.length, 0);
  const totalStories = Object.values(stories).flat().length;

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      logout();
      navigate('/login');
    }
  };

  if (!currentUser) return null;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div
          className={styles.avatar}
          style={{ background: stringToColor(currentUser.id) }}
        >
          {getInitials(currentUser.displayName, '')}
        </div>
        <h1 className={styles.name}>{currentUser.displayName}</h1>
        <p className={styles.email}>{currentUser.email}</p>
        <p className={styles.joined}>
          Member since {formatDate(currentUser.createdAt)}
        </p>
      </div>

      <div className={styles.stats}>
        <div className={styles.statItem}>
          <Users size={24} color="#4A90D9" />
          <span className={styles.statNumber}>{persons.length}</span>
          <span className={styles.statLabel}>Members</span>
        </div>
        <div className={styles.statItem}>
          <Image size={24} color="#D94A8C" />
          <span className={styles.statNumber}>{totalPhotos}</span>
          <span className={styles.statLabel}>Photos</span>
        </div>
        <div className={styles.statItem}>
          <MessageSquare size={24} color="#10B981" />
          <span className={styles.statNumber}>{totalStories}</span>
          <span className={styles.statLabel}>Stories</span>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Account</h2>
        <div className={styles.menuList}>
          <button className={styles.menuItem}>
            <User size={20} className={styles.menuIcon} />
            <span className={styles.menuLabel}>Edit Profile</span>
            <ChevronRight size={20} className={styles.menuArrow} />
          </button>
          <button className={styles.menuItem}>
            <Mail size={20} className={styles.menuIcon} />
            <span className={styles.menuLabel}>Email Preferences</span>
            <ChevronRight size={20} className={styles.menuArrow} />
          </button>
          <button className={styles.menuItem}>
            <Calendar size={20} className={styles.menuIcon} />
            <span className={styles.menuLabel}>Activity Log</span>
            <ChevronRight size={20} className={styles.menuArrow} />
          </button>
        </div>
      </div>

      <button className={styles.logoutButton} onClick={handleLogout}>
        <LogOut size={20} />
        <span>Sign Out</span>
      </button>
    </div>
  );
}
