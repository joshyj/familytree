import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './store/useStore';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Tree from './pages/Tree';
import Gallery from './pages/Gallery';
import Profile from './pages/Profile';
import PersonDetail from './pages/PersonDetail';
import PersonEdit from './pages/PersonEdit';
import Search from './pages/Search';
import AIChat from './pages/AIChat';
import Settings from './pages/Settings';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useStore((state) => state.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useStore((state) => state.isAuthenticated);
  return !isAuthenticated ? <>{children}</> : <Navigate to="/" replace />;
}

function AppContent() {
  const checkSession = useStore((state) => state.checkSession);
  const isLoading = useStore((state) => state.isLoading);

  useEffect(() => {
    // Check for existing Supabase session on app load
    checkSession();
  }, [checkSession]);

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#F9FAFB',
      }}>
        <div style={{
          textAlign: 'center',
          color: '#6B7280',
        }}>
          <div style={{
            width: 40,
            height: 40,
            border: '3px solid #E5E7EB',
            borderTopColor: '#4A90D9',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px',
          }} />
          <p>Loading...</p>
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Home />} />
        <Route path="tree" element={<Tree />} />
        <Route path="gallery" element={<Gallery />} />
        <Route path="profile" element={<Profile />} />
        <Route path="search" element={<Search />} />
        <Route path="ai-chat" element={<AIChat />} />
        <Route path="settings" element={<Settings />} />
        <Route path="person/new" element={<PersonEdit />} />
        <Route path="person/:id" element={<PersonDetail />} />
        <Route path="person/:id/edit" element={<PersonEdit />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
