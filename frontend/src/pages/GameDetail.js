import React, { useEffect, useState, useContext } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import api from '../api';
import { AuthContext } from '../contexts/AuthContext';

export default function GameDetail() {
  const { id } = useParams();
  const gameId = parseInt(id, 10);
  const { token } = useContext(AuthContext);

  const [game, setGame] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [user, setUser] = useState(null);
  const [existingReview, setExistingReview] = useState(null);
  const [content, setContent] = useState('');
  const [score, setScore] = useState(50);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    Promise.all([
      api.get('/users/me/'),
      api.get(`/games/${gameId}`),
      api.get(`/games/${gameId}/reviews`),
    ])
      .then(([userRes, gameRes, revRes]) => {
        setUser(userRes.data);
        setGame(gameRes.data);
        setReviews(revRes.data);
      })
      .catch(err => {
        console.error(err);
        setError('Failed to load game or reviews.');
      })
      .finally(() => setLoading(false));
  }, [token, gameId]);

  useEffect(() => {
    if (user && reviews.length > 0) {
      const myRev = reviews.find(r => r.userId === user.id);
      if (myRev) {
        setExistingReview(myRev);
        setContent(myRev.content);
        setScore(myRev.score);
      }
    }
  }, [user, reviews]);

  if (!token) {
    return <Navigate to="/login" />;
  }
  if (loading) {
    return <div>Loading game details…</div>;
  }
  if (error) {
    return <div style={{ color: 'red' }}>{error}</div>;
  }
  if (!game) {
    return <div>Game not found.</div>;
  }

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      if (existingReview) {
        await api.put('/users/me/reviews', {
          gameId: gameId,
          content,
          score,
        });
        const revRes = await api.get(`/games/${gameId}/reviews`);
        setReviews(revRes.data);
        alert('Review updated');
      } else {
        await api.post('/users/me/reviews', {
          gameId: gameId,
          content,
          score,
        });
        const revRes = await api.get(`/games/${gameId}/reviews`);
        setReviews(revRes.data);
        alert('Review created');
      }
      setExistingReview(null);
      setContent('');
      setScore(50);
    } catch (err) {
      console.error(err);
      if (err.response && err.response.status === 409) {
        setError('You have already reviewed this game.');
      } else {
        setError('Failed to submit review.');
      }
    }
  };

  const handleDelete = async () => {
    if (!existingReview) return;
    try {
      await api.delete(`/users/me/reviews/${existingReview.reviewId}`);
      const revRes = await api.get(`/games/${gameId}/reviews`);
      setReviews(revRes.data);
      setExistingReview(null);
      setContent('');
      setScore(50);
      alert('Review deleted');
    } catch (err) {
      console.error(err);
      setError('Failed to delete review.');
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2>{game.name} ({game.releaseYear})</h2>
      <p>{game.description}</p>
      <p>Publisher: {game.publisher}</p>
      <p>Platforms: {game.platforms.map(p => p.name).join(', ')}</p>
      <p>Genres: {game.genres.map(g => g.name).join(', ')}</p>
      <hr style={{ margin: '2rem 0' }} />

      <h3>Your Review</h3>
      <form onSubmit={handleSubmit} style={{ marginBottom: '2rem' }}>
        <div style={{ marginBottom: '1rem' }}>
          <label>Score: {score}</label>
          <input
            type="range"
            min="0"
            max="100"
            value={score}
            onChange={e => setScore(parseInt(e.target.value, 10))}
            style={{ width: '100%' }}
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Write your review…"
            rows={4}
            style={{ width: '100%', padding: '0.5rem' }}
            required
          />
        </div>
        <button type="submit" style={{ marginRight: '1rem', padding: '0.5rem 1rem' }}>
          {existingReview ? 'Update Review' : 'Post Review'}
        </button>
        {existingReview && (
          <button
            type="button"
            onClick={handleDelete}
            style={{ padding: '0.5rem 1rem', background: '#dc3545', color: '#fff' }}
          >
            Delete Review
          </button>
        )}
      </form>
      {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

      <hr style={{ margin: '2rem 0' }} />
      <h3>All Reviews ({reviews.length})</h3>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {reviews.map(r => (
          <li
            key={r.reviewId}
            style={{
              marginBottom: '1rem',
              background: '#fff',
              padding: '1rem',
              borderRadius: '4px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            <strong>{r.nickname || r.userId}</strong> rated it {r.score}/100
            <p>{r.content}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
