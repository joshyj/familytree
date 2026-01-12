import { Outlet, NavLink } from 'react-router-dom';
import { Home, GitBranch, Image, User } from 'lucide-react';
import styles from './Layout.module.css';

const navItems = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/tree', icon: GitBranch, label: 'Tree' },
  { path: '/gallery', icon: Image, label: 'Gallery' },
  { path: '/profile', icon: User, label: 'Profile' },
];

export default function Layout() {
  return (
    <div className={styles.layout}>
      <main className={styles.main}>
        <Outlet />
      </main>

      <nav className={styles.nav}>
        {navItems.map(({ path, icon: Icon, label }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.active : ''}`
            }
            end={path === '/'}
          >
            <Icon size={24} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
