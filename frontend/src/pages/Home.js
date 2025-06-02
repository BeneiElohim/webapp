import React, { useContext, useEffect, useState } from 'react';
import api from '../api';
import { AuthContext } from '../contexts/AuthContext';
import { Navigate, Link } from 'react-router-dom';

export default function Home() {
  const { logout, token } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    if (!token) return;

    api
      .get('/profiles/me')
      .then(() => {
        setHasProfile(true);
      })
      .catch(err => {
        if (err.response && err.response.status === 404) {
          setHasProfile(false);
        } else {
          console.error(err);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token]);

  if (!token) {
    return null;
  }

  if (loading) {
    return <div>Loading…</div>;
  }

  if (!hasProfile) {
    return <Navigate to="/create-profile" />;
  }

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      {token && <button onClick={logout}>Logout</button>}
      <h1>Welcome to Game Review Hub</h1>
      <Link to="/games">
        <button style={{ marginTop: '1rem', padding: '0.5rem 1rem' }}>
          Browse Games
        </button>
      </Link>
      <p>Use the menu to browse games, write reviews, etc.</p>
    </div>
  );
}
