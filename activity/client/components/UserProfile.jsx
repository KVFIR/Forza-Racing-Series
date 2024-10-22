import React from 'react';

const UserProfile = ({ user }) => {
  if (!user) {
    return <div>Loading user profile...</div>;
  }

  return (
    <div className="bg-gray-800 text-white p-4 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">User Profile</h2>
      <img src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`} alt="User Avatar" className="w-24 h-24 rounded-full mb-4" />
      <p><strong>Username:</strong> {user.username}</p>
      <p><strong>Discriminator:</strong> {user.discriminator}</p>
      <p><strong>ID:</strong> {user.id}</p>
      {user.email && <p><strong>Email:</strong> {user.email}</p>}
    </div>
  );
};

export default UserProfile;
