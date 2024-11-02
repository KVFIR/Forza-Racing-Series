import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { IoArrowBackOutline, IoSettingsOutline, IoServerOutline, IoInformationCircleOutline } from 'react-icons/io5';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from './common/LoadingSpinner';
import { toast } from 'react-toastify';

const OrganizationSettings = ({ user, auth }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [serverInfo, setServerInfo] = useState(null);
  const [hasAdminPermission, setHasAdminPermission] = useState(false);

  useEffect(() => {
    const checkPermissions = async () => {
      if (!user?.guildId) {
        console.error('No guild ID available');
        navigate('/');
        return;
      }

      try {
        const response = await fetch(`/.proxy/api/guilds/${user.guildId}/member-permissions?userId=${user.id}`, {
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch permissions');
        }

        const { permissions } = await response.json();
        // Проверяем наличие прав администратора (ADMINISTRATOR = 0x8)
        const permissionBits = BigInt(permissions);
        const isAdmin = (permissionBits & BigInt(0x8)) === BigInt(0x8);
        console.log('Permission check:', {
          permissions: permissions,
          permissionBits: permissionBits.toString(),
          isAdmin: isAdmin
        });
        setHasAdminPermission(isAdmin);

        if (!isAdmin) {
          toast.error('You need administrator permissions to access this page');
          navigate('/');
          return;
        }

        await fetchServerInfo();
      } catch (error) {
        console.error('Error checking permissions:', error);
        toast.error('Failed to verify permissions');
        navigate('/');
      }
    };

    checkPermissions();
  }, [user, navigate]);

  const fetchServerInfo = async () => {
    try {
      const response = await fetch(`/.proxy/api/guilds/${user.guildId}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch server info');
      }

      const guildData = await response.json();
      setServerInfo({
        id: guildData.id,
        name: guildData.name,
        icon: guildData.icon,
        roles: guildData.roles || []
      });
    } catch (error) {
      console.error('Error fetching server info:', error);
      toast.error('Failed to load server information');
      setServerInfo({
        id: user.guildId,
        name: 'Unknown Server',
        icon: null,
        roles: []
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getServerIconUrl = (serverId, icon) => {
    if (!icon) return null;
    return `https://cdn.discordapp.com/icons/${serverId}/${icon}.webp?size=128`;
  };

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="flex justify-center items-center h-screen"
      >
        <LoadingSpinner />
      </motion.div>
    );
  }

  return (
    <div className="container mx-auto px-4">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => navigate('/')}
        className="mb-4 flex items-center bg-white bg-opacity-20 text-white py-2 px-4 rounded-lg font-semibold transition duration-300 ease-in-out hover:bg-opacity-30 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
      >
        <IoArrowBackOutline className="mr-2" />
        Back to Menu
      </motion.button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gray-800 bg-opacity-90 rounded-lg shadow-lg p-6 max-w-4xl mx-auto"
      >
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
          <IoSettingsOutline className="mr-3 text-3xl text-blue-400" />
          Organization Settings
        </h2>

        {serverInfo && (
          <div className="space-y-6">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-gray-700 bg-opacity-70 rounded-lg p-6"
            >
              <h3 className="text-xl font-semibold mb-6 flex items-center text-white">
                <IoServerOutline className="mr-2 text-green-400" />
                Server Information
              </h3>
              
              <div className="flex items-start space-x-6 mb-6">
                {serverInfo.icon && (
                  <img
                    src={getServerIconUrl(serverInfo.id, serverInfo.icon)}
                    alt="Server Icon"
                    className="w-24 h-24 rounded-full bg-gray-600"
                  />
                )}
                <div className="flex-1">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-800 bg-opacity-70 p-4 rounded-lg">
                      <p className="text-gray-400 mb-2">Server Name</p>
                      <p className="text-lg font-medium text-white">{serverInfo.name}</p>
                    </div>
                    <div className="bg-gray-800 bg-opacity-70 p-4 rounded-lg">
                      <p className="text-gray-400 mb-2">Server ID</p>
                      <p className="text-lg font-medium text-white">{serverInfo.id}</p>
                    </div>
                  </div>
                </div>
              </div>

              {serverInfo.roles.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-lg font-semibold mb-4 text-white">Server Roles</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {serverInfo.roles.map(role => (
                      <div
                        key={role.id}
                        className="bg-gray-800 bg-opacity-50 p-3 rounded-lg"
                        style={{
                          borderLeft: `4px solid ${role.color ? `#${role.color.toString(16)}` : '#99AAB5'}`
                        }}
                      >
                        <p className="text-white">{role.name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-blue-900 bg-opacity-20 rounded-lg p-4 flex items-start"
            >
              <IoInformationCircleOutline className="text-blue-400 text-xl flex-shrink-0 mt-1 mr-3" />
              <p className="text-blue-100">
                This page shows basic information about your Discord server. More settings and customization options will be available in future updates.
              </p>
            </motion.div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default OrganizationSettings;