'use client';

import { useMemo } from 'react';

export interface PasswordStrengthCriteria {
  minLength: boolean;
  hasUpperCase: boolean;
  hasLowerCase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
}

export interface PasswordStrengthResult {
  score: number; // 0-5
  strength: 'very-weak' | 'weak' | 'fair' | 'good' | 'strong';
  criteria: PasswordStrengthCriteria;
  isValid: boolean;
  feedback: string[];
}

export function usePasswordStrength(password: string): PasswordStrengthResult {
  return useMemo(() => {
    if (!password) {
      return {
        score: 0,
        strength: 'very-weak',
        criteria: {
          minLength: false,
          hasUpperCase: false,
          hasLowerCase: false,
          hasNumber: false,
          hasSpecialChar: false,
        },
        isValid: false,
        feedback: ['Password is required'],
      };
    }

    const criteria: PasswordStrengthCriteria = {
      minLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecialChar: /[@$!%*?&]/.test(password),
    };

    // Calculate score based on criteria
    let score = 0;
    if (criteria.minLength) score++;
    if (criteria.hasUpperCase) score++;
    if (criteria.hasLowerCase) score++;
    if (criteria.hasNumber) score++;
    if (criteria.hasSpecialChar) score++;

    // Determine strength level
    let strength: PasswordStrengthResult['strength'];
    if (score === 0) strength = 'very-weak';
    else if (score === 1) strength = 'very-weak';
    else if (score === 2) strength = 'weak';
    else if (score === 3) strength = 'fair';
    else if (score === 4) strength = 'good';
    else strength = 'strong';

    // Generate feedback
    const feedback: string[] = [];
    if (!criteria.minLength) {
      feedback.push('Password must be at least 8 characters long');
    }
    if (!criteria.hasUpperCase) {
      feedback.push('Add at least one uppercase letter');
    }
    if (!criteria.hasLowerCase) {
      feedback.push('Add at least one lowercase letter');
    }
    if (!criteria.hasNumber) {
      feedback.push('Add at least one number');
    }
    if (!criteria.hasSpecialChar) {
      feedback.push('Add at least one special character (@$!%*?&)');
    }

    // Additional feedback based on strength
    if (score < 5 && password.length < 12) {
      feedback.push('Consider using a longer password for better security');
    }

    const isValid = score === 5;

    return {
      score,
      strength,
      criteria,
      isValid,
      feedback,
    };
  }, [password]);
}

// Helper function to get strength color
export function getStrengthColor(
  strength: PasswordStrengthResult['strength']
): string {
  switch (strength) {
    case 'very-weak':
      return 'text-red-600';
    case 'weak':
      return 'text-red-500';
    case 'fair':
      return 'text-yellow-500';
    case 'good':
      return 'text-blue-500';
    case 'strong':
      return 'text-green-500';
    default:
      return 'text-gray-500';
  }
}

// Helper function to get strength bar color
export function getStrengthBarColor(
  strength: PasswordStrengthResult['strength']
): string {
  switch (strength) {
    case 'very-weak':
      return 'bg-red-600';
    case 'weak':
      return 'bg-red-500';
    case 'fair':
      return 'bg-yellow-500';
    case 'good':
      return 'bg-blue-500';
    case 'strong':
      return 'bg-green-500';
    default:
      return 'bg-gray-300';
  }
}

// Helper function to get strength label
export function getStrengthLabel(
  strength: PasswordStrengthResult['strength']
): string {
  switch (strength) {
    case 'very-weak':
      return 'Very Weak';
    case 'weak':
      return 'Weak';
    case 'fair':
      return 'Fair';
    case 'good':
      return 'Good';
    case 'strong':
      return 'Strong';
    default:
      return 'Unknown';
  }
}