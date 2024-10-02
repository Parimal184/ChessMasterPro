// src/pages/Profile.tsx

import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const Profile: React.FC = () => {
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  return (
    <div>
      <h1>Profile</h1>
      <p>Welcome to your profile! Here you can view your game statistics and update your account settings.</p>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
};

export default Profile;
