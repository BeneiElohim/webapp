import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { AuthContext } from '../contexts/AuthContext';

export default function Profile() {
  const { token } = useContext(AuthContext);
  const [user, setUser] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [bio, setBio] = useState('');
  const [nickname, setNickname] = useState('');
  const [picture, setPicture] = useState('');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  useEffect(() => {
    if (!token) return;

    Promise.all([api.get('/users/me'), api.get('/users/me/reviews')])
      .then(([uRes, rRes]) => {
        setUser(uRes.data);
        setReviews(rRes.data);
      })
      .catch(() => setErr('Failed to load profile information.'))
      .finally(() => setLoading(false));
  }, [token]);

  const handleSave = async () => {
    try {
      await api.put('/profiles/me', {
        bio,
        nickname,
        profilePictureRelativePath: picture,
      });
      alert('Profile updated');
    } catch {
      alert('Could not save profile.');
    }
  };
  if (loading) return <div>Loading…</div>;
  if (err)     return <div style={{ color: 'red' }}>{err}</div>;
  if (!user)   return null; 

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '2rem' }}>
      <h1>{user.username}</h1>

      <section style={{ marginBottom: '2rem' }}>
        <textarea
          value={bio}
          onChange={e => setBio(e.target.value)}
          placeholder="Bio"
          rows={3}
          style={{ width: '100%', padding: '0.5rem', marginBottom: '0.75rem' }}
        />
        <input
          value={nickname}
          onChange={e => setNickname(e.target.value)}
          placeholder="Nickname"
          style={{ width: '100%', padding: '0.5rem', marginBottom: '0.75rem' }}
        />
        <input
          value={picture}
          onChange={e => setPicture(e.target.value)}
          placeholder="Profile picture path"
          style={{ width: '100%', padding: '0.5rem', marginBottom: '0.75rem' }}
        />
        <button className="btn" onClick={handleSave}>
          Save Profile
        </button>
      </section>

      <h2>Your Reviews</h2>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {reviews.map(r => (
          <li
            key={r.reviewId}
            style={{
              background: '#fff',
              marginBottom: '0.75rem',
              padding: '0.75rem',
              borderRadius: 4,
              boxShadow: '0 1px 3px rgba(0,0,0,.05)',
            }}
          >
            <strong>
              <Link to={`/games/${r.gameId}`}>{r.gameName}</Link>
            </strong>{' '}
            – <em>{r.score}/100</em>
            <p style={{ margin: '0.5rem 0 0' }}>{r.content}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
