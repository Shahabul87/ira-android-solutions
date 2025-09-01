'use client';

import { motion, MotionProps } from 'framer-motion';
import { ReactNode } from 'react';

interface AnimatedProps extends MotionProps {
  children: ReactNode;
  className?: string;
}

// Fade In Animation
export const FadeIn = ({ children, className = '', ...props }: AnimatedProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className={className}
    {...props}
  >
    {children}
  </motion.div>
);

// Fade In Up Animation
export const FadeInUp = ({ children, className = '', ...props }: AnimatedProps) => (
  <motion.div
    initial={{ opacity: 0, y: 40 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6 }}
    className={className}
    {...props}
  >
    {children}
  </motion.div>
);

// Slide In From Left
export const SlideInLeft = ({ children, className = '', ...props }: AnimatedProps) => (
  <motion.div
    initial={{ x: -100, opacity: 0 }}
    animate={{ x: 0, opacity: 1 }}
    transition={{ duration: 0.8, ease: "easeOut" }}
    className={className}
    {...props}
  >
    {children}
  </motion.div>
);

// Slide In From Right
export const SlideInRight = ({ children, className = '', ...props }: AnimatedProps) => (
  <motion.div
    initial={{ x: 100, opacity: 0 }}
    animate={{ x: 0, opacity: 1 }}
    transition={{ duration: 0.8, ease: "easeOut" }}
    className={className}
    {...props}
  >
    {children}
  </motion.div>
);

// Scale In Animation
export const ScaleIn = ({ children, className = '', ...props }: AnimatedProps) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5 }}
    className={className}
    {...props}
  >
    {children}
  </motion.div>
);

// Bounce In Animation
export const BounceIn = ({ children, className = '', ...props }: AnimatedProps) => (
  <motion.div
    initial={{ scale: 0, opacity: 0 }}
    animate={{ 
      scale: [0, 1.2, 1],
      opacity: 1 
    }}
    transition={{ 
      duration: 0.6,
      times: [0, 0.6, 1],
      ease: "easeOut"
    }}
    className={className}
    {...props}
  >
    {children}
  </motion.div>
);

// Stagger Container for list animations
export const StaggerContainer = ({ children, className = '', ...props }: AnimatedProps) => (
  <motion.div
    initial="hidden"
    animate="visible"
    variants={{
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: 0.1,
          delayChildren: 0.3
        }
      }
    }}
    className={className}
    {...props}
  >
    {children}
  </motion.div>
);

// Stagger Item for list items
export const StaggerItem = ({ children, className = '', ...props }: AnimatedProps) => (
  <motion.div
    variants={{
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0 }
    }}
    className={className}
    {...props}
  >
    {children}
  </motion.div>
);

// Floating Animation (continuous)
export const FloatingAnimation = ({ children, className = '', ...props }: AnimatedProps) => (
  <motion.div
    animate={{
      y: [0, -10, 0],
    }}
    transition={{
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut"
    }}
    className={className}
    {...props}
  >
    {children}
  </motion.div>
);

// Pulse Animation (continuous)
export const PulseAnimation = ({ children, className = '', ...props }: AnimatedProps) => (
  <motion.div
    animate={{
      scale: [1, 1.05, 1],
    }}
    transition={{
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }}
    className={className}
    {...props}
  >
    {children}
  </motion.div>
);

// Rotate Animation
export const RotateIn = ({ children, className = '', ...props }: AnimatedProps) => (
  <motion.div
    initial={{ rotate: -180, opacity: 0 }}
    animate={{ rotate: 0, opacity: 1 }}
    transition={{ duration: 0.8, ease: "easeOut" }}
    className={className}
    {...props}
  >
    {children}
  </motion.div>
);

// Scroll Triggered Animation
export const ScrollAnimation = ({ children, className = '', ...props }: AnimatedProps) => (
  <motion.div
    initial={{ opacity: 0, y: 50 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6 }}
    viewport={{ once: true, amount: 0.3 }}
    className={className}
    {...props}
  >
    {children}
  </motion.div>
);

// Hover Scale Animation
export const HoverScale = ({ children, className = '', ...props }: AnimatedProps) => (
  <motion.div
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    transition={{ type: "spring", stiffness: 400, damping: 17 }}
    className={className}
    {...props}
  >
    {children}
  </motion.div>
);

// Card Hover Animation
export const CardHover = ({ children, className = '', ...props }: AnimatedProps) => (
  <motion.div
    whileHover={{ 
      y: -5,
      boxShadow: "0 20px 40px rgba(0,0,0,0.15)"
    }}
    transition={{ duration: 0.3 }}
    className={className}
    {...props}
  >
    {children}
  </motion.div>
);

// Text Animation - Letter by Letter
interface TextAnimationProps {
  text: string;
  className?: string;
}

export const TextAnimation = ({ text, className = '' }: TextAnimationProps) => {
  const letters = text.split('');
  
  return (
    <motion.span className={className}>
      {letters.map((letter, index) => (
        <motion.span
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.03 }}
        >
          {letter === ' ' ? '\u00A0' : letter}
        </motion.span>
      ))}
    </motion.span>
  );
};

// Number Counter Animation
interface CounterProps {
  from?: number;
  to: number;
  duration?: number;
  className?: string;
}

export const AnimatedCounter = ({ to, duration = 2, className = '' }: CounterProps) => {
  return (
    <motion.span
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration }}
      >
        {to}
      </motion.span>
    </motion.span>
  );
};

