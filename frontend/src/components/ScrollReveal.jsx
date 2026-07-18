import React from 'react';
import { motion } from 'framer-motion';

const ScrollReveal = ({ children, className = '', delay = 0, duration = 0.6, y = 30, x = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y, x }}
      whileInView={{ opacity: 1, y: 0, x: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration, delay, ease: [0.215, 0.61, 0.355, 1] }}
      className={className}
      style={{ width: '100%', height: '100%' }}
    >
      {children}
    </motion.div>
  );
};

export default ScrollReveal;
