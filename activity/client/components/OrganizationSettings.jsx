import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import BackButton from './common/BackButton';
import LoadingSpinner from './common/LoadingSpinner';
import { IoMegaphone, IoSave, IoChevronDown } from 'react-icons/io5';

const OrganizationSettings = ({ user, auth, onApiError }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [settings, setSettings] = useState({
    name: '',
    icon: '',
    announcementChannelId: '',
    participantRoleId: '',
    registrationInstructions: ''
  });
  const [channels, setChannels] = useState([]);
  const [roles, setRoles] = useState([]);

  useEffect(() => {
    const fetchGuildData = async () => {
      if (!user?.guildId) return;

      try {
        const [orgResponse, channelsResponse, rolesResponse] = await Promise.all([
          fetch(`/.proxy/api/organizations/${user.guildId}`),
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

        if (!orgResponse.ok) {
          throw new Error('Failed to fetch organization data');
        }

        const [orgData, channels, roles] = await Promise.all([
          orgResponse.json(),
          channelsResponse.json(),
          rolesResponse.json()
        ]);

        const textChannels = channels.filter(channel => channel.type === 0);
        const filteredRoles = roles.filter(role => {
          return role.id !== user.guildId && !role.managed;
        });

        setChannels(textChannels);
        setRoles(filteredRoles);
        setSettings({
          name: orgData.name || '',
          icon: orgData.icon || '',
          announcementChannelId: orgData.announcementChannelId || '',
          participantRoleId: orgData.participantRoleId || '',
          registrationInstructions: orgData.registrationInstructions || ''
        });
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load settings');
        if (error.status === 401) {
          onApiError(error);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchGuildData();
  }, [user?.guildId, auth.access_token, onApiError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user?.guildId) {
      toast.error('Guild ID not found');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/.proxy/api/guilds/${user.guildId}/settings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${auth.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: settings.name,
          icon: settings.icon,
          announcementChannelId: settings.announcementChannelId,
          participantRoleId: settings.participantRoleId,
          registrationInstructions: settings.registrationInstructions
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
        
        throw new Error(errorData.error || 'Failed to update settings');
      }

      const data = await response.json();
      
      setSettings(prev => ({
        ...prev,
        ...data.settings
      }));

      toast.success('Settings updated successfully');
    } catch (error) {
      console.error('Error updating settings:', error);
      
      if (error.message === 'Organization not found') {
        toast.error('Organization not found. Please try again later.');
      } else if (error.code === 32) {
        toast.error('Selected channel is invalid or not accessible');
      } else {
        toast.error(error.message || 'Failed to update settings');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getIconUrl = (iconPath) => {
    if (!iconPath) return '/images/default-guild-icon.png';
    if (iconPath.startsWith('https://cdn.discordapp.com')) return iconPath;
    return `/.proxy${iconPath}`;
  };

  useEffect(() => {
    console.log('Current settings:', settings);
  }, [settings]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="p-4">
      <BackButton />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mx-auto max-w-2xl bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden"
      >
        {/* Header */}
        <h1 className="text-2xl font-bold text-white text-left p-6 border-b border-gray-700/50">
          Organization Settings
        </h1>

        {/* Organization Info */}
        <div className="p-6 border-b border-gray-700/50">
          <div className="flex items-center space-x-6">
            <div className="relative h-20 w-20">
              <img
                src={getIconUrl(settings.icon)}
                alt="Organization icon"
                className="h-full w-full rounded-full object-cover ring-2 ring-gray-600"
              />
            </div>
            <div className="flex-1">
              <input
                type="text"
                value={settings.name}
                onChange={(e) => setSettings(prev => ({ ...prev, name: e.target.value }))}
                className="w-full bg-transparent text-2xl font-bold text-white border-none focus:outline-none focus:ring-0 px-0 py-1 hover:bg-gray-700/30 rounded transition-colors"
                placeholder="Organization Name"
              />
            </div>
          </div>
        </div>

        {/* Settings Cards */}
        <div className="p-6 space-y-4">
          {/* Virtual Racing Coordinator Setup Card */}
          <div className="bg-gray-700/50 rounded-xl p-4">
            <h3 className="text-lg font-medium text-white mb-4">
              Virtual Racing Coordinator Setup
            </h3>
            
            <div className="space-y-4">
              {/* Announcement Channel */}
              <div className="group">
                <label className="text-sm text-gray-400 mb-1.5 block">
                  Channel where race announcements will be posted
                </label>
                <div className="relative">
                  <select
                    value={settings.announcementChannelId}
                    onChange={(e) => setSettings(prev => ({ ...prev, announcementChannelId: e.target.value }))}
                    className="w-full bg-gray-800/50 border-0 rounded-xl px-4 py-3 text-white appearance-none focus:ring-2 focus:ring-blue-500/40 transition-all"
                  >
                    <option value="">Select channel</option>
                    {channels.map(channel => (
                      <option key={channel.id} value={channel.id}>
                        #{channel.name}
                      </option>
                    ))}
                  </select>
                  <IoChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Participant Role */}
              <div className="group">
                <label className="text-sm text-gray-400 mb-1.5 block">
                  Role that will be assigned to race participants
                </label>
                <div className="relative">
                  <select
                    value={settings.participantRoleId}
                    onChange={(e) => setSettings(prev => ({ ...prev, participantRoleId: e.target.value }))}
                    className="w-full bg-gray-800/50 border-0 rounded-xl px-4 py-3 text-white appearance-none focus:ring-2 focus:ring-blue-500/40 transition-all"
                  >
                    <option value="">Select role</option>
                    {roles.map(role => (
                      <option key={role.id} value={role.id}>
                        @{role.name}
                      </option>
                    ))}
                  </select>
                  <IoChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-center">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl px-6 py-3 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <span>Save Changes</span>
                </>
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default OrganizationSettings;