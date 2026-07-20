import React from 'react';

const Logo = ({ width = 120, height = 120 }) => {
  return (
    <div className="logo-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <img 
        src="/logo.jpg" 
        alt="Soulful Baking Logo" 
        style={{ 
          width, 
          height, 
          objectFit: 'contain',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(229, 169, 60, 0.15)'
        }} 
      />
    </div>
  );
};

export default Logo;
