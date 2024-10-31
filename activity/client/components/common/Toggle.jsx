import React from 'react';

const Toggle = ({ checked, onChange, label, className = '' }) => {
  return (
    <label className={`flex items-center cursor-pointer ${className}`}>
      <div className="relative">
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={onChange}
        />
        <div className={`w-14 h-7 rounded-full transition-colors duration-200 ease-in-out ${checked ? 'bg-blue-600' : 'bg-gray-400'}`}>
          <div className={`absolute left-1 top-1 w-5 h-5 bg-white rounded-full transition-transform duration-200 ease-in-out ${checked ? 'transform translate-x-7' : ''}`} />
        </div>
      </div>
      {label && <span className="ml-3 text-sm font-medium text-gray-300">{label}</span>}
    </label>
  );
};

export default Toggle;
