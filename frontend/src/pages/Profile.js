import React, { useContext, useEffect, useState } from 'react';
import api from '../api';
import { AuthContext } from '../contexts/AuthContext';

export default function Profile() {
  const { token } = useContext(AuthContext);
  const [user, setUser] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [bio, setBio] = useState('');
  const [nickname, setNickname] = useState('');
  const [picture, setPicture] = useState('');

  useEffect(() => {
    api.get('/users/me').then(res => setUser(res.data));
    api.get('/users/me/reviews').then(res => setReviews(res.data));
  }, [token]);

  const handleUpdate = async () => {
    await api.put('/profiles/me', {
      bio,
      nickname,
      profilePictureRelativePath: picture,
    });
    alert('Profile updated');
  };

  if (!user) return <div>Loading…</div>;

  return (
    <div>
      <h1>{user.username}</h1>
      <div>
        <textarea
          value={bio}
          onChange={e => setBio(e.target.value)}
          placeholder="Bio"
        />
        <input
          value={nickname}
          onChange={e => setNickname(e.target.value)}
          placeholder="Nickname"
        />
        <input
          value={picture}
          onChange={e => setPicture(e.target.value)}
          placeholder="Picture Path"
        />
        <button onClick={handleUpdate}>Save Profile</button>
      </div>
      <h2>Your Reviews</h2>
      <ul>
        {reviews.map(r => (
          <li key={r.reviewId}>
            {r.content} — {r.score}/100
          </li>
        ))}
      </ul>
    </div>
  );
}
