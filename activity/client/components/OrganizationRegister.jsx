import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { IoArrowBackOutline } from 'react-icons/io5';

const OrganizationRegister = ({ user, auth }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    icon: '',
    announcementChannelId: '',
    participantRoleId: ''
  });
  const [channels, setChannels] = useState([]);
  const [roles, setRoles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch guild data, channels and roles on component mount
  useEffect(() => {
    const fetchGuildData = async () => {
      if (!user?.guildId) return;

      try {
        // Используем прокси для всех запросов
        const [guildsResponse, channelsResponse, rolesResponse] = await Promise.all([
          fetch('/.proxy/api/discord/users/@me/guilds', {
            headers: {
              'Authorization': `Bearer ${auth.access_token}`,
              'Content-Type': 'application/json',
            }
          }),
          fetch(`/.proxy/api/discord/guilds/${user.guildId}/channels`, {
            headers: {
              'Authorization': `Bearer ${auth.access_token}`,
              'Content-Type': 'application/json',
            }
          }),
          fetch(`/.proxy/api/discord/guilds/${user.guildId}/roles`, {
            headers: {
              'Authorization': `Bearer ${auth.access_token}`,
              'Content-Type': 'application/json',
            }
          })
        ]);

        if (!guildsResponse.ok || !channelsResponse.ok || !rolesResponse.ok) {
          throw new Error('Failed to fetch guild data');
        }

        const [guilds, channels, roles] = await Promise.all([
          guildsResponse.json(),
          channelsResponse.json(),
          rolesResponse.json()
        ]);

        const currentGuild = guilds.find(g => g.id === user.guildId);
        if (!currentGuild) {
          throw new Error('Guild not found');
        }

        // Фильтруем только текстовые каналы
        const textChannels = channels.filter(channel => channel.type === 0);
        
        // Фильтруем роли, исключая @everyone
        const filteredRoles = roles.filter(role => {
          // @everyone роль всегда имет такой же ID как и ID сервера
          return role.id !== user.guildId && !role.managed;
        });

        setChannels(textChannels);
        setRoles(filteredRoles);

        let iconUrl = null;
        if (currentGuild.icon) {
          iconUrl = `https://cdn.discordapp.com/icons/${currentGuild.id}/${currentGuild.icon}.webp?size=128`;
        }

        setFormData(prev => ({
          ...prev,
          name: currentGuild.name || '',
          icon: iconUrl || '/images/default-guild-icon.png'
        }));
      } catch (error) {
        console.error('Error fetching guild data:', error);
        toast.error('Failed to load server data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchGuildData();
  }, [user?.guildId, auth.access_token]);

  const handleIconClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      // Проверяем размер файла (максимум 1MB)
      if (file.size > 1024 * 1024) {
        toast.error('Image size should be less than 1MB');
        return;
      }

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('guildId', user.guildId);
        
        const response = await fetch('/.proxy/api/organizations/icon', {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          throw new Error('Failed to upload icon');
        }

        const { iconUrl } = await response.json();
        setFormData(prev => ({ ...prev, icon: iconUrl }));
        toast.success('Icon uploaded successfully');
      } catch (error) {
        console.error('Error uploading icon:', error);
        toast.error('Failed to upload icon');
      }
    };

    input.click();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user?.guildId) {
      toast.error('Guild ID not found');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/.proxy/api/organizations/register`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${auth.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          guildId: user.guildId,
          name: formData.name,
          icon: formData.icon,
          announcementChannelId: formData.announcementChannelId,
          participantRoleId: formData.participantRoleId
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 404) {
          throw new Error('Organization not found');
        } else if (response.status === 401) {
          onApiError(new Error('Unauthorized'));
          return;
        }
        
        throw new Error(errorData.error || 'Failed to register organization');
      }

      const data = await response.json();
      toast.success('Organization registered successfully');
      navigate('/organization-settings');
    } catch (error) {
      console.error('Error registering organization:', error);
      toast.error(error.message || 'Failed to register organization');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-8">
      {/* Back Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => navigate('/')}
        className="group mb-6 flex items-center space-x-2 rounded-xl bg-gray-800/50 px-4 py-2.5 text-gray-300 backdrop-blur-sm transition-all hover:bg-gray-700/50"
      >
        <IoArrowBackOutline className="transition-transform group-hover:-translate-x-1" />
        <span>Back to Menu</span>
      </motion.button>

      {/* Main Form Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mx-auto max-w-xl rounded-2xl bg-gray-800/90 p-6 shadow-xl backdrop-blur-lg sm:p-8"
      >
        <h2 className="mb-8 text-center text-2xl font-bold text-white sm:text-3xl">
          Register Organization
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Icon Upload */}
          <div className="flex flex-col items-center">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleIconClick}
              className="group relative cursor-pointer"
            >
              <div className="relative h-28 w-28 sm:h-32 sm:w-32">
                <img
                  src={formData.icon || '/images/default-guild-icon.png'}
                  alt="Server icon"
                  className="h-full w-full rounded-full object-cover ring-2 ring-gray-600 transition-all group-hover:ring-4 group-hover:ring-blue-500/50"
                />
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60 opacity-0 transition-all group-hover:opacity-100">
                  <span className="text-sm font-medium text-white">Change Icon</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Form Fields */}
          <div className="space-y-5">
            {/* Name Input */}
            <div>
              <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-gray-300">
                Organization Name
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full rounded-lg bg-gray-700/50 px-4 py-2.5 text-white placeholder-gray-400 ring-1 ring-gray-600 transition-all focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
                placeholder="Enter organization name"
              />
            </div>

            {/* Announcement Channel Select */}
            <div>
              <label htmlFor="announcementChannel" className="mb-1.5 block text-sm font-medium text-gray-300">
                Announcement Channel
              </label>
              <select
                id="announcementChannel"
                value={formData.announcementChannelId}
                onChange={(e) => setFormData(prev => ({ ...prev, announcementChannelId: e.target.value }))}
                className="w-full rounded-lg bg-gray-700/50 px-4 py-2.5 text-white ring-1 ring-gray-600 transition-all focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
                required
              >
                <option value="">Select channel</option>
                {channels.map(channel => (
                  <option key={channel.id} value={channel.id}>
                    #{channel.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Participant Role Select */}
            <div>
              <label htmlFor="participantRole" className="mb-1.5 block text-sm font-medium text-gray-300">
                Participant Role
              </label>
              <select
                id="participantRole"
                value={formData.participantRoleId}
                onChange={(e) => setFormData(prev => ({ ...prev, participantRoleId: e.target.value }))}
                className="w-full rounded-lg bg-gray-700/50 px-4 py-2.5 text-white ring-1 ring-gray-600 transition-all focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
                required
              >
                <option value="">Select role</option>
                {roles.map(role => (
                  <option key={role.id} value={role.id}>
                    @{role.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Submit Button */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="submit"
            disabled={isSubmitting}
            className="mt-8 w-full rounded-xl bg-blue-600 py-3 text-lg font-semibold text-white transition-all hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Registering...</span>
              </div>
            ) : (
              'Register Organization'
            )}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
};

export default OrganizationRegister;