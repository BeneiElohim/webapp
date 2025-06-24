import React, { useEffect, useState, useContext } from 'react';
import { Link, Navigate } from 'react-router-dom';
import api from '../api';
import { AuthContext } from '../contexts/AuthContext';

export default function GameList() {
  const { token } = useContext(AuthContext);
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!token) return;
    api
      .get('/games')
      .then(res => setGames(res.data))
      .catch(() => setErr('Failed to load games.'))
      .finally(() => setLoading(false));
  }, [token]);

  if (!token)      return <Navigate to="/login" />;
  if (loading)     return <div>Loading games…</div>;
  if (err)         return <div style={{ color: 'red' }}>{err}</div>;

  return (
    <div style={{ padding: '2rem' }}>
      <h2>All Games</h2>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {games.map(g => (
          <li
            key={g.id}
            style={{
              background: '#fff',
              padding: '1rem',
              borderRadius: 4,
              boxShadow: '0 1px 3px rgba(0,0,0,.1)',
              marginBottom: '1rem',
            }}
          >
            <Link to={`/games/${g.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <img
                  src={`https://webapp-production-23b4.up.railway.app${g.coverArtRelativePath}`}
                  alt={`${g.name} cover`}
                  style={{
                    width: 64,
                    height: 64,
                    objectFit: 'cover',
                    borderRadius: 4,
                    marginRight: '1rem',
                  }}
                />
                <div>
                  <h3 style={{ margin: 0 }}>
                    {g.name} ({g.releaseYear})
                  </h3>
                  <p style={{ margin: 0 }}>
                    Average {g.averageRating.toFixed(1)} ({g.reviewCount} reviews)
                  </p>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
