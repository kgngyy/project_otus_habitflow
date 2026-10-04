import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import { onAuthChange, signOut } from './lib/auth';
import HomePage from './pages/HomePage';
import StatsPage from './pages/StatsPage';
import LoginPage from './pages/LoginPage';
import './App.css';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data }) => setSession(data.session))
      .catch(() => setSession(null))
      .finally(() => setLoading(false));

    const unsubscribe = onAuthChange((s) => setSession(s));
    return () => unsubscribe();
  }, []);

  if (loading) return <p className="empty-state">Загрузка…</p>;
  if (!session) return <LoginPage />;

  return (
    <BrowserRouter>
      <nav className="nav">
        <Link to="/">Главная</Link>
        <Link to="/stats">Статистика</Link>
        <button type="button" className="nav__logout" onClick={() => signOut()}>
          Выйти
        </button>
      </nav>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/stats" element={<StatsPage />} />
      </Routes>
    </BrowserRouter>
  );
}
