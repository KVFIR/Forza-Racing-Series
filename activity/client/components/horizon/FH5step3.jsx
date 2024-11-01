import React from 'react';

const FH5step3 = ({ data, onChange }) => {
  const settings = [
    {
      id: 'collisions',
      label: 'Car Collisions',
      description: 'Enable or disable collisions between cars'
    },
    {
      id: 'ghosting',
      label: 'Ghost Mode',
      description: 'Make other players appear as ghosts'
    },
    {
      id: 'customUpgrades',
      label: 'Custom Upgrades',
      description: 'Allow custom car upgrades'
    },
    {
      id: 'tuning',
      label: 'Tuning',
      description: 'Allow car tuning'
    },
    {
      id: 'abs',
      label: 'ABS',
      description: 'Anti-lock Braking System'
    },
    {
      id: 'tcr',
      label: 'Traction Control',
      description: 'Traction Control System'
    },
    {
      id: 'stab',
      label: 'Stability Control',
      description: 'Stability Control System'
    },
    {
      id: 'rewind',
      label: 'Rewind',
      description: 'Allow using rewind feature'
    }
  ];

  return (
    <div className="space-y-4">
      {settings.map((setting) => (
        <div key={setting.id} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
          <div>
            <h3 className="text-white font-medium">{setting.label}</h3>
            <p className="text-gray-400 text-sm">{setting.description}</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={data[setting.id]}
              onChange={(e) => onChange(setting.id, e.target.checked)}
            />
            <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      ))}
    </div>
  );
};

export default FH5step3;
