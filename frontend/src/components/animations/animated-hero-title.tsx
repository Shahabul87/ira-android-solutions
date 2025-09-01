'use client';

import { motion, Variants } from 'framer-motion';
import { useEffect, useState } from 'react';

interface AnimatedHeroTitleProps {
  text: string;
  className?: string;
}

export const AnimatedHeroTitle = ({ text, className = '' }: AnimatedHeroTitleProps) => {
  const words = text.split(' ');
  
  const container: Variants = {
    hidden: { opacity: 0 },
    visible: (i = 1) => ({
      opacity: 1,
      transition: { staggerChildren: 0.12, delayChildren: 0.04 * i },
    }),
  };

  const child: Variants = {
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 100,
      },
    },
    hidden: {
      opacity: 0,
      y: 20,
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 100,
      },
    },
  };

  return (
    <motion.h1
      className={className}
      variants={container}
      initial="hidden"
      animate="visible"
    >
      {words.map((word, index) => (
        <motion.span
          variants={child}
          key={index}
          style={{ display: 'inline-block', marginRight: '0.4em' }}
        >
          {word}
        </motion.span>
      ))}
    </motion.h1>
  );
};

// Typewriter effect component
export const TypewriterTitle = ({ text, className = '' }: AnimatedHeroTitleProps) => {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, 50);
      return () => clearTimeout(timeout);
    } else {
      setIsComplete(true);
    }
    return undefined;
  }, [currentIndex, text]);

  return (
    <h1 className={className}>
      {displayText}
      {!isComplete && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          className="inline-block w-1 h-12 bg-green-600 ml-1"
        />
      )}
    </h1>
  );
};

// Gradient animated title
export const GradientAnimatedTitle = ({ text, className = '' }: AnimatedHeroTitleProps) => {
  return (
    <motion.h1
      className={`${className} bg-gradient-to-r from-green-600 via-green-500 to-green-600 bg-clip-text text-transparent bg-[length:200%_auto]`}
      animate={{
        backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
      }}
      transition={{
        duration: 5,
        ease: "linear",
        repeat: Infinity,
      }}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      {text}
    </motion.h1>
  );
};

// Split text animation with hover effect
export const InteractiveHeroTitle = ({ text, className = '' }: AnimatedHeroTitleProps) => {
  const words = text.split(' ');
  
  return (
    <h1 className={className}>
      {words.map((word, wordIndex) => (
        <span key={wordIndex} className="inline-block mr-2">
          {word.split('').map((char, charIndex) => (
            <motion.span
              key={`${wordIndex}-${charIndex}`}
              className="inline-block"
              initial={{ opacity: 0, y: 50, rotateX: -90 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{
                duration: 0.5,
                delay: wordIndex * 0.1 + charIndex * 0.02,
                type: "spring",
                stiffness: 100,
              }}
              whileHover={{
                y: -10,
                color: '#16a34a',
                transition: { duration: 0.2 }
              }}
            >
              {char}
            </motion.span>
          ))}
        </span>
      ))}
    </h1>
  );
};

// Glowing effect title
export const GlowingTitle = ({ text, className = '' }: AnimatedHeroTitleProps) => {
  const words = text.split(' ');
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <h1 className={`${className} relative`}>
        {/* Glow effect background */}
        <motion.span
          className="absolute inset-0 blur-xl opacity-50 bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent"
          animate={{
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          {text}
        </motion.span>
        
        {/* Main text */}
        <span className="relative">
          {words.map((word, index) => (
            <motion.span
              key={index}
              className="inline-block mr-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.5,
                delay: index * 0.1,
                ease: "easeOut"
              }}
            >
              {word}
            </motion.span>
          ))}
        </span>
      </h1>
    </motion.div>
  );
};

// Wave animation title
export const WaveAnimatedTitle = ({ text, className = '' }: AnimatedHeroTitleProps) => {
  const letters = text.split('');
  
  return (
    <h1 className={className}>
      {letters.map((letter, index) => (
        <motion.span
          key={index}
          className="inline-block"
          initial={{ y: 0 }}
          animate={{ y: [0, -20, 0] }}
          transition={{
            duration: 1,
            delay: index * 0.03,
            repeat: Infinity,
            repeatDelay: 3,
            ease: "easeInOut"
          }}
        >
          {letter === ' ' ? '\u00A0' : letter}
        </motion.span>
      ))}
    </h1>
  );
};