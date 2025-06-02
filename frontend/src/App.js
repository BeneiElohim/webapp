import React, { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import { AuthContext } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';

import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import CreateProfile from './pages/CreateProfile';
import Profile from './pages/Profile';
import GameList from './pages/GameList';
import GameDetail from './pages/GameDetail';

function HomeWrapper() {
  const { token } = useContext(AuthContext);
  return token ? <Home /> : <Navigate to="/login" />;
}

export default function App() {
  return (
    <Routes>
      {/* Root: show Home if logged in, otherwise go to /login */}
      <Route path="/" element={<HomeWrapper />} />

      {/* Create‐profile (only for logged‐in users) */}
      <Route
        path="/create-profile"
        element={
          <PrivateRoute>
            <CreateProfile />
          </PrivateRoute>
        }
      />

      {/* Game list: /games */}
      <Route
        path="/games"
        element={
          <PrivateRoute>
            <GameList />
          </PrivateRoute>
        }
      />

      {/* Game detail: /games/:id */}
      <Route
        path="/games/:id"
        element={
          <PrivateRoute>
            <GameDetail />
          </PrivateRoute>
        }
      />

      {/* Auth flows */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* User’s own profile page */}
      <Route
        path="/profile"
        element={
          <PrivateRoute>
            <Profile />
          </PrivateRoute>
        }
      />
    </Routes>
  );
}