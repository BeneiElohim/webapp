import React, { useEffect, useState, useContext } from 'react';
import api from '../api';
import { AuthContext } from '../contexts/AuthContext';
import { Link, Navigate } from 'react-router-dom';

export default function GameList() {
  const { token } = useContext(AuthContext);
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    api
      .get('/games')
      .then(res => {
        setGames(res.data);
      })
      .catch(err => {
        console.error(err);
        setError('Failed to load games.');
      })
      .finally(() => setLoading(false));
  }, [token]);

  if (!token) {
    return <Navigate to="/login" />;
  }

  if (loading) return <div>Loading games…</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  return (
    <div style={{ padding: '2rem' }}>
      <h2>All Games</h2>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {games.map(game => (
          <li
            key={game.id}
            style={{
              marginBottom: '1rem',
              background: '#fff',
              padding: '1rem',
              borderRadius: '4px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}
          >
            <Link to={`/games/${game.id}`} style={{ textDecoration: 'none' }}>
              <h3>{game.name} ({game.releaseYear})</h3>
              <p>Average Rating: {game.averageRating.toFixed(1)} ({game.reviewCount} reviews)</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
