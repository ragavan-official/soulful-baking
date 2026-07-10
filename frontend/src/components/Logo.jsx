import React from 'react';
import { motion } from 'react';
import { motion as motionModule } from 'framer-motion';

const Logo = ({ width = 120, height = 120, animate = true }) => {
  const pathVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: {
        pathLength: { type: 'spring', duration: 2.5, bounce: 0.1 },
        opacity: { duration: 0.5 }
      }
    }
  };

  return (
    <div className="logo-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <svg
        width={width}
        height={height}
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ overflow: 'visible' }}
      >
        <defs>
          <linearGradient id="gold-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFE082" />
            <stop offset="50%" stopColor="#E5A93C" />
            <stop offset="100%" stopColor="#9E721D" />
          </linearGradient>
          <filter id="gold-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        
        {/* Stylized SB Logo Curves */}
        <motionModule.path
          d="M 50,130 C 50,150 70,165 95,165 C 130,165 140,130 115,100 C 105,88 85,90 90,110 C 95,130 145,135 155,100 C 165,65 130,45 100,45 C 80,45 65,58 75,78 C 85,98 120,95 125,75 C 130,55 90,30 65,60 C 55,72 50,90 60,110"
          stroke="url(#gold-gradient)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#gold-glow)"
          variants={animate ? pathVariants : {}}
          initial={animate ? "hidden" : "visible"}
          animate="visible"
        />

        {/* Outer subtle glow circle */}
        <motionModule.circle
          cx="100"
          cy="100"
          r="85"
          stroke="url(#gold-gradient)"
          strokeWidth="1.5"
          strokeDasharray="4 8"
          style={{ opacity: 0.4 }}
          animate={animate ? { rotate: 360 } : {}}
          transition={animate ? { repeat: Infinity, duration: 40, ease: "linear" } : {}}
        />
      </svg>
      <h1 className="logo-text" style={{ 
        fontFamily: "'Playfair Display', serif", 
        color: '#F5EBE6', 
        marginTop: '12px',
        fontSize: '26px',
        fontWeight: '500',
        letterSpacing: '1px',
        background: 'linear-gradient(to bottom, #FFF, #E5A93C)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        textAlign: 'center'
      }}>
        Soulful Baking
      </h1>
    </div>
  );
};

export default Logo;
