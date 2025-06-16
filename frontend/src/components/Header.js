import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import './Header.css';

export default function Header() {
  const { token, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="hdr">
      <Link to="/" className="hdr__brand">Game Review Hub</Link>

      {token && (
        <nav className="hdr__nav">
          <Link to="/games">Browse Games</Link>
          <Link to="/profile">My Profile</Link>
          <button onClick={handleLogout}>Logout</button>
        </nav>
      )}
    </header>
  );
}
