import React from 'react';
import { motion } from 'framer-motion';

const SplitText = ({ text = '', className = '', delay = 0.05 }) => {
  const letters = Array.from(text);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { 
        staggerChildren: delay,
        delayChildren: 0.1 
      },
    },
  };

  const childVariants = {
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        damping: 12,
        stiffness: 100,
      },
    },
    hidden: {
      opacity: 0,
      y: 20,
      transition: {
        type: 'spring',
        damping: 12,
        stiffness: 100,
      },
    },
  };

  return (
    <motion.span
      style={{ display: 'inline-flex', flexWrap: 'wrap' }}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {letters.map((letter, index) => (
        <motion.span
          key={index}
          variants={childVariants}
          style={{ display: 'inline-block', whiteSpace: 'pre' }}
        >
          {letter}
        </motion.span>
      ))}
    </motion.span>
  );
};

export default SplitText;
