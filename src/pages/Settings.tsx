import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Bell,
  Moon,
  Globe,
  Shield,
  HelpCircle,
  Info,
  ChevronRight,
  Download,
  Upload,
  Trash2,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import styles from './Settings.module.css';

export default function Settings() {
  const navigate = useNavigate();
  const personsRecord = useStore((state) => state.persons);
  const persons = Object.values(personsRecord);
  const stories = useStore((state) => state.stories);

  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const handleExport = () => {
    const data = {
      persons,
      stories,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `familyroots-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearData = () => {
    if (
      window.confirm(
        'Are you sure you want to delete all your family tree data? This action cannot be undone.'
      )
    ) {
      localStorage.removeItem('familyroots-storage');
      window.location.reload();
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <h1 className={styles.title}>Settings</h1>
      </header>

      <div className={styles.content}>
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Preferences</h2>
          <div className={styles.optionsList}>
            <div className={styles.optionItem}>
              <div className={styles.optionInfo}>
                <Bell size={20} className={styles.optionIcon} />
                <span>Notifications</span>
              </div>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={notifications}
                  onChange={(e) => setNotifications(e.target.checked)}
                />
                <span className={styles.toggleSlider} />
              </label>
            </div>
            <div className={styles.optionItem}>
              <div className={styles.optionInfo}>
                <Moon size={20} className={styles.optionIcon} />
                <span>Dark Mode</span>
              </div>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={darkMode}
                  onChange={(e) => setDarkMode(e.target.checked)}
                />
                <span className={styles.toggleSlider} />
              </label>
            </div>
            <button className={styles.optionItem}>
              <div className={styles.optionInfo}>
                <Globe size={20} className={styles.optionIcon} />
                <span>Language</span>
              </div>
              <div className={styles.optionValue}>
                <span>English</span>
                <ChevronRight size={20} className={styles.chevron} />
              </div>
            </button>
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Data Management</h2>
          <div className={styles.optionsList}>
            <button className={styles.optionItem} onClick={handleExport}>
              <div className={styles.optionInfo}>
                <Download size={20} className={styles.optionIcon} />
                <span>Export Data</span>
              </div>
              <ChevronRight size={20} className={styles.chevron} />
            </button>
            <button className={styles.optionItem}>
              <div className={styles.optionInfo}>
                <Upload size={20} className={styles.optionIcon} />
                <span>Import Data</span>
              </div>
              <ChevronRight size={20} className={styles.chevron} />
            </button>
            <button
              className={`${styles.optionItem} ${styles.danger}`}
              onClick={handleClearData}
            >
              <div className={styles.optionInfo}>
                <Trash2 size={20} className={styles.optionIcon} />
                <span>Clear All Data</span>
              </div>
              <ChevronRight size={20} className={styles.chevron} />
            </button>
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Privacy & Security</h2>
          <div className={styles.optionsList}>
            <button className={styles.optionItem}>
              <div className={styles.optionInfo}>
                <Shield size={20} className={styles.optionIcon} />
                <span>Privacy Policy</span>
              </div>
              <ChevronRight size={20} className={styles.chevron} />
            </button>
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Support</h2>
          <div className={styles.optionsList}>
            <button className={styles.optionItem}>
              <div className={styles.optionInfo}>
                <HelpCircle size={20} className={styles.optionIcon} />
                <span>Help Center</span>
              </div>
              <ChevronRight size={20} className={styles.chevron} />
            </button>
            <button className={styles.optionItem}>
              <div className={styles.optionInfo}>
                <Info size={20} className={styles.optionIcon} />
                <span>About</span>
              </div>
              <ChevronRight size={20} className={styles.chevron} />
            </button>
          </div>
        </div>

        <div className={styles.footer}>
          <p className={styles.version}>FamilyRoots v1.0.0</p>
          <p className={styles.copyright}>Made with love for families everywhere</p>
        </div>
      </div>
    </div>
  );
}
