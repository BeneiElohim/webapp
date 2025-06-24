import React, { useState, useContext, useEffect } from 'react';
import api from '../api';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function CreateProfile() {
  const { token } = useContext(AuthContext);
  const [bio, setBio] = useState('');
  const [nickname, setNickname] = useState('');
  const [picture, setPicture] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // If token is missing, redirect to login
  useEffect(() => {
    if (!token) {
      navigate('/login');
    }
  }, [token, navigate]);

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      await api.post('/users/me/createProfile', {
        bio,
        nickname,
        profilePictureRelativePath: picture,
      });
      // Once profile is created, go back to home
      navigate('/');
    } catch (err) {
      console.error(err);
      setError('Failed to create profile. Make sure nickname is unique.');
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: 'auto', padding: '2rem' }}>
      <h2>Create Your Profile</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label>Nickname</label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            required
            style={{ width: '100%', padding: '0.5rem' }}
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label>Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell us a bit about yourself"
            rows={3}
            style={{ width: '100%', padding: '0.5rem' }}
          />
        </div>
        {error && (
          <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>
        )}
        <button type="submit" style={{ padding: '0.5rem 1rem' }}>
          Create Profile
        </button>
      </form>
    </div>
  );
}
