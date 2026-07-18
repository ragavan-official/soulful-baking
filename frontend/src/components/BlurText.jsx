import React from 'react';
import { motion } from 'framer-motion';

const BlurText = ({ text = '', className = '', delay = 0.03 }) => {
  const words = text.split(' ');

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: delay,
      },
    },
  };

  const childVariants = {
    hidden: {
      opacity: 0,
      filter: 'blur(10px)',
      y: 15,
      scale: 0.9,
    },
    visible: {
      opacity: 1,
      filter: 'blur(0px)',
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: [0.2, 0.65, 0.3, 1], // Custom smooth cubic-bezier
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
      {words.map((word, wordIndex) => (
        <span
          key={wordIndex}
          style={{ display: 'inline-block', whiteSpace: 'nowrap', marginRight: '0.25em' }}
        >
          {Array.from(word).map((char, charIndex) => (
            <motion.span
              key={charIndex}
              variants={childVariants}
              style={{ display: 'inline-block' }}
            >
              {char}
            </motion.span>
          ))}
        </span>
      ))}
    </motion.span>
  );
};

export default BlurText;
