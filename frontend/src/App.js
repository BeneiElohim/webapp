import React, { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import { AuthContext } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';

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
    <Layout>
      <Routes>
        <Route path="/" element={<HomeWrapper />} />

        <Route
          path="/create-profile"
          element={
            <PrivateRoute>
              <CreateProfile />
            </PrivateRoute>
          }
        />

        <Route
          path="/games"
          element={
            <PrivateRoute>
              <GameList />
            </PrivateRoute>
          }
        />
        <Route
          path="/games/:id"
          element={
            <PrivateRoute>
              <GameDetail />
            </PrivateRoute>
          }
        />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          }
        />
      </Routes>
    </Layout>
  );
}