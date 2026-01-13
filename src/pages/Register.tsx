import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, User, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useStore } from '../store/useStore';
import { isValidEmail, isValidPassword } from '../utils/helpers';
import styles from './Auth.module.css';

export default function Register() {
  const register = useStore((state) => state.register);
  const authError = useStore((state) => state.authError);
  const storeLoading = useStore((state) => state.isLoading);

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!displayName.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }
    if (!isValidEmail(email)) {
      setError('Please enter a valid email');
      return;
    }
    if (!isValidPassword(password)) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const success = await register(email.trim(), password, displayName.trim());
    if (!success && !authError) {
      setError('This email is already registered');
    }
  };

  const displayError = error || authError;

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <Link to="/login" className={styles.backButton}>
          <ArrowLeft size={20} />
          Back to Sign In
        </Link>

        <div className={styles.header}>
          <h1 className={styles.title}>Create Account</h1>
          <p className={styles.subtitle}>Start preserving your family history</p>
        </div>

        {displayError && (
          <div className={styles.error}>
            <AlertCircle size={18} />
            <span>{displayError}</span>
          </div>
        )}

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <User size={20} className={styles.inputIcon} />
            <input
              type="text"
              placeholder="Full Name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className={styles.input}
              autoComplete="name"
            />
          </div>

          <div className={styles.inputGroup}>
            <Mail size={20} className={styles.inputIcon} />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
              autoComplete="email"
            />
          </div>

          <div className={styles.inputGroup}>
            <Lock size={20} className={styles.inputIcon} />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password (min. 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.input}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={styles.eyeButton}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <div className={styles.inputGroup}>
            <Lock size={20} className={styles.inputIcon} />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={styles.input}
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            className={styles.button}
            disabled={storeLoading}
          >
            {storeLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p className={styles.footer}>
          Already have an account?{' '}
          <Link to="/login" className={styles.link}>Sign In</Link>
        </p>
      </div>
    </div>
  );
}
