import React, { useContext, useEffect, useState } from 'react';
import api from '../api';
import { AuthContext } from '../contexts/AuthContext';
import { Navigate, Link, useNavigate } from 'react-router-dom';

export default function Home() {
  const { logout, token } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) return;

    api
      .get('/profiles/me')
      .then(() => setHasProfile(true))
      .catch(err => {
        if (err.response?.status === 401) {
          // Token expired  clear auth and push to /login
          logout();
          navigate('/login');
        } else if (err.response?.status === 404) {
          setHasProfile(false); // needs to create profile
        } else {
          console.error(err);
        }
      })
      .finally(() => setLoading(false));
  }, [token, logout, navigate]);

  if (!token) {
    return null;
  }
  if (loading)  return <div>Loading…</div>;
  if (!hasProfile) return <Navigate to="/create-profile" />;

  return (
    <section style={{ textAlign: 'center' }}>
      <h1>Welcome to Game Review Hub</h1>

      <Link to="/games">
        <button className="btn" style={{ marginTop: '1rem' }}>
          Browse Games
        </button>
      </Link>
    </section>
  );
}
