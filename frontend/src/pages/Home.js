import React, { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

export default function Home() {
  const { logout, token } = useContext(AuthContext);
  return (
    <div>
      {token && <button onClick={logout}>Logout</button>}
      <h1>Welcome to Game Review Hub</h1>
    </div>
  );
}
