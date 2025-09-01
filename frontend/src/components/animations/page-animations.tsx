'use client';

import { useEffect } from 'react';

export function usePageAnimations() {
  useEffect(() => {
    // Add animation classes to elements on page load
    const animateElements = () => {
      // Animate headers
      document.querySelectorAll('h1, h2, h3').forEach((el, index) => {
        el.classList.add('animate-slideDown');
        (el as HTMLElement).style.animationDelay = `${index * 0.1}s`;
      });

      // Animate paragraphs
      document.querySelectorAll('p').forEach((el, index) => {
        el.classList.add('animate-fadeIn');
        (el as HTMLElement).style.animationDelay = `${index * 0.05}s`;
      });

      // Animate cards
      document.querySelectorAll('[class*="card"]').forEach((el, index) => {
        el.classList.add('animate-slideUp', 'hover-lift');
        (el as HTMLElement).style.animationDelay = `${index * 0.1}s`;
      });

      // Animate buttons
      document.querySelectorAll('button').forEach((el) => {
        el.classList.add('hover-grow');
      });

      // Animate sections on scroll
      const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      };

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-slideUp');
            observer.unobserve(entry.target);
          }
        });
      }, observerOptions);

      document.querySelectorAll('section').forEach(section => {
        section.style.opacity = '0';
        observer.observe(section);
      });
    };

    // Run animations after a short delay to ensure DOM is ready
    setTimeout(animateElements, 100);

    return () => {
      // Cleanup if needed
    };
  }, []);
}

export function AnimatedPage({ children }: { children: React.ReactNode }) {
  usePageAnimations();
  return <>{children}</>;
}