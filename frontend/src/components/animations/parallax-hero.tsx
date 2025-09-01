'use client';

import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { ReactNode, useRef } from 'react';
import { LucideProps } from 'lucide-react';

interface ParallaxHeroProps {
  children: ReactNode;
  className?: string;
}

export const ParallaxHero = ({ children, className = '' }: ParallaxHeroProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"]
  });

  const springConfig = { stiffness: 300, damping: 30, bounce: 100 };

  const translateY = useSpring(
    useTransform(scrollYProgress, [0, 1], [0, -100]),
    springConfig
  );

  const translateYText = useSpring(
    useTransform(scrollYProgress, [0, 1], [0, 100]),
    springConfig
  );

  const scale = useSpring(
    useTransform(scrollYProgress, [0, 0.5], [1, 1.2]),
    springConfig
  );

  const opacity = useSpring(
    useTransform(scrollYProgress, [0, 0.5], [1, 0.3]),
    springConfig
  );

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      <motion.div
        style={{
          translateY,
          scale,
          opacity
        }}
        className="absolute inset-0 z-0"
      >
        {/* Background gradient effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-white to-green-50" />
        
        {/* Animated patterns */}
        <motion.div
          animate={{
            rotate: [0, 360],
          }}
          transition={{
            duration: 100,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute -top-40 -right-40 w-80 h-80 bg-green-100 rounded-full opacity-20"
        />
        
        <motion.div
          animate={{
            rotate: [360, 0],
          }}
          transition={{
            duration: 150,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute -bottom-40 -left-40 w-96 h-96 bg-green-100 rounded-full opacity-20"
        />
      </motion.div>

      <motion.div
        style={{
          translateY: translateYText,
        }}
        className="relative z-10"
      >
        {children}
      </motion.div>
    </div>
  );
};

// Floating elements for parallax layers
export const FloatingElement = ({ 
  children, 
  delay = 0,
  duration = 3,
  className = '' 
}: { 
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}) => {
  return (
    <motion.div
      animate={{
        y: [0, -20, 0],
        rotate: [-5, 5, -5],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: "easeInOut"
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Multi-layer parallax container
export const MultiLayerParallax = ({ className = '' }: { className?: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"]
  });

  const layer1Y = useTransform(scrollYProgress, [0, 1], [0, -50]);
  const layer2Y = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const layer3Y = useTransform(scrollYProgress, [0, 1], [0, -150]);

  return (
    <div ref={ref} className={`absolute inset-0 overflow-hidden ${className}`}>
      {/* Layer 1 - Slowest */}
      <motion.div
        style={{ y: layer1Y }}
        className="absolute inset-0"
      >
        <div className="absolute top-20 left-10 w-32 h-32 bg-green-200 rounded-full opacity-20 blur-xl" />
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-green-300 rounded-full opacity-20 blur-xl" />
      </motion.div>

      {/* Layer 2 - Medium */}
      <motion.div
        style={{ y: layer2Y }}
        className="absolute inset-0"
      >
        <div className="absolute top-40 right-10 w-24 h-24 bg-green-400 rounded-lg opacity-10 blur-lg transform rotate-45" />
        <div className="absolute bottom-40 left-20 w-28 h-28 bg-green-400 rounded-lg opacity-10 blur-lg transform -rotate-45" />
      </motion.div>

      {/* Layer 3 - Fastest */}
      <motion.div
        style={{ y: layer3Y }}
        className="absolute inset-0"
      >
        <div className="absolute top-60 left-1/2 w-16 h-16 bg-green-500 rounded opacity-10 blur-md" />
        <div className="absolute bottom-60 right-1/3 w-20 h-20 bg-green-500 rounded opacity-10 blur-md" />
      </motion.div>

      {/* Animated grid pattern */}
      <motion.div
        animate={{
          backgroundPosition: ['0% 0%', '100% 100%'],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear"
        }}
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2316a34a' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px',
        }}
      />
    </div>
  );
};

// 3D Card parallax effect
export const Parallax3DCard = ({ 
  children, 
  className = '' 
}: { 
  children: ReactNode;
  className?: string;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  const rotateX = useTransform(scrollYProgress, [0, 0.5, 1], [20, 0, -20]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.8, 1, 0.8]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

  return (
    <motion.div
      ref={ref}
      style={{
        rotateX,
        scale,
        opacity,
        transformPerspective: 1000,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Interactive parallax icons
export const ParallaxIcon = ({ 
  icon: Icon,
  size = 24,
  delay = 0,
  className = ''
}: {
  icon: React.ComponentType<LucideProps>;
  size?: number;
  delay?: number;
  className?: string;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.5, type: "spring" }}
      whileHover={{ scale: 1.2, rotate: 360 }}
      className={`absolute ${className}`}
    >
      <FloatingElement delay={delay} duration={4}>
        <Icon size={size} className="text-green-500 opacity-20" />
      </FloatingElement>
    </motion.div>
  );
};