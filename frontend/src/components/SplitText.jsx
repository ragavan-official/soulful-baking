import React from 'react';
import { motion } from 'framer-motion';

const SplitText = ({ text = '', className = '', delay = 0.05 }) => {
  const words = text.split(' ');

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

  let globalLetterIndex = 0;

  return (
    <motion.span
      style={{ display: 'inline-flex', flexWrap: 'wrap' }}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {words.map((word, wordIndex) => {
        const letters = Array.from(word);
        return (
          <span 
            key={wordIndex} 
            style={{ display: 'inline-block', whiteSpace: 'nowrap', marginRight: '0.25em' }}
          >
            {letters.map((letter) => {
              const idx = globalLetterIndex++;
              return (
                <motion.span
                  key={idx}
                  variants={childVariants}
                  style={{ display: 'inline-block' }}
                >
                  {letter}
                </motion.span>
              );
            })}
          </span>
        );
      })}
    </motion.span>
  );
};

export default SplitText;
