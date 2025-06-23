import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { AuthContext } from '../contexts/AuthContext';

export default function AdminGameCreate() {
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    releaseYear: new Date().getFullYear(),
    description: '',
    publisher: '',
    genreIds: [],
    platformIds: [],
  });
  
  const [coverArt, setCoverArt] = useState(null);
  const [genres, setGenres] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const checkAdminAndLoadData = async () => {
      try {
        const [adminRes, genresRes, platformsRes] = await Promise.all([
          api.get('/users/me/is-admin'),
          api.get('/genres'),
          api.get('/platforms')
        ]);
        
        setIsAdmin(adminRes.data.is_admin);
        setGenres(genresRes.data);
        setPlatforms(platformsRes.data);
        
        if (!adminRes.data.is_admin) {
          navigate('/');
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load data');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      checkAdminAndLoadData();
    }
  }, [token, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'releaseYear' ? parseInt(value) : value
    }));
  };

  const handleMultiSelect = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: prev[name].includes(value)
        ? prev[name].filter(id => id !== value)
        : [...prev[name], value]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!coverArt) {
      setError('Please select a cover art image');
      return;
    }

    const submitData = new FormData();
    submitData.append('name', formData.name);
    submitData.append('releaseYear', formData.releaseYear.toString());
    submitData.append('description', formData.description);
    submitData.append('publisher', formData.publisher);
    
    formData.genreIds.forEach(id => {
      submitData.append('genreIds', id.toString());
    });
    
    formData.platformIds.forEach(id => {
      submitData.append('platformIds', id.toString());
    });
    
    submitData.append('coverArt', coverArt);

    try {
      await api.post('/admin/createGame', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      alert('Game created successfully!');
      navigate('/games');
    } catch (err) {
      console.error(err);
      setError('Failed to create game. Please try again.');
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (!isAdmin) return null;

  return (
    <div className="admin-create-game">
      <h2>Create New Game</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit} className="game-form">
        <div className="form-group">
          <label htmlFor="name">Game Name *</label>
          <input
            id="name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="releaseYear">Release Year *</label>
            <input
              id="releaseYear"
              name="releaseYear"
              type="number"
              min="1950"
              max={new Date().getFullYear() + 5}
              value={formData.releaseYear}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="publisher">Publisher *</label>
            <input
              id="publisher"
              name="publisher"
              type="text"
              value={formData.publisher}
              onChange={handleInputChange}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="description">Description *</label>
          <textarea
            id="description"
            name="description"
            rows="4"
            value={formData.description}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="coverArt">Cover Art *</label>
          <input
            id="coverArt"
            type="file"
            accept="image/*"
            onChange={(e) => setCoverArt(e.target.files[0])}
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Genres *</label>
            <div className="checkbox-grid">
              {genres.map(genre => (
                <label key={genre.id} className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={formData.genreIds.includes(genre.id)}
                    onChange={() => handleMultiSelect('genreIds', genre.id)}
                  />
                  {genre.name}
                </label>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Platforms *</label>
            <div className="checkbox-grid">
              {platforms.map(platform => (
                <label key={platform.id} className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={formData.platformIds.includes(platform.id)}
                    onChange={() => handleMultiSelect('platformIds', platform.id)}
                  />
                  {platform.name}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" onClick={() => navigate('/games')} className="btn btn--secondary">
            Cancel
          </button>
          <button type="submit" className="btn btn--primary">
            Create Game
          </button>
        </div>
      </form>
    </div>
  );
}