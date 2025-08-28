'use client';

import { useState, useCallback } from 'react';
import { useForm, UseFormReturn, FieldValues, Path, DefaultValues } from 'react-hook-form';

export interface UseAuthFormOptions<T extends FieldValues> {
  defaultValues: DefaultValues<T>;
  onSuccess?: (data: T) => void | Promise<void>;
  onError?: (error: string) => void;
}

export interface UseAuthFormReturn<T extends FieldValues> {
  form: UseFormReturn<T>;
  isSubmitting: boolean;
  error: string;
  setError: (error: string) => void;
  clearError: () => void;
  handleSubmit: (
    onSubmit: (data: T) => Promise<boolean>
  ) => (data: T) => Promise<void>;
}

export function useAuthForm<T extends FieldValues>(
  options: UseAuthFormOptions<T>
): UseAuthFormReturn<T> {
  const { defaultValues, onSuccess, onError } = options;
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const form = useForm<T>({
    defaultValues,
    mode: 'onChange',
  }) as UseFormReturn<T>;

  const clearError = useCallback(() => {
    setError('');
  }, []);

  const handleSubmit = useCallback(
    (onSubmit: (data: T) => Promise<boolean>) => 
      async (data: T): Promise<void> => {
        setError('');
        setIsSubmitting(true);

        try {
          const success = await onSubmit(data);

          if (success) {
            if (onSuccess) {
              await onSuccess(data);
            }
          } else {
            const errorMessage = 'Operation failed. Please check your input and try again.';
            setError(errorMessage);
            if (onError) {
              onError(errorMessage);
            }
          }
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
          setError(errorMessage);
          if (onError) {
            onError(errorMessage);
          }
        } finally {
          setIsSubmitting(false);
        }
      },
    [onSuccess, onError]
  );

  return {
    form,
    isSubmitting,
    error,
    setError,
    clearError,
    handleSubmit,
  };
}

// Validation utilities
export const validationRules = {
  email: {
    required: 'Email is required',
    pattern: {
      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: 'Please enter a valid email address',
    },
  },
  
  password: {
    required: 'Password is required',
    minLength: {
      value: 8,
      message: 'Password must be at least 8 characters long',
    },
    pattern: {
      value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]+$/,
      message: 'Password must contain uppercase, lowercase, number, and special character',
    },
  },

  confirmPassword: (password: string) => ({
    required: 'Please confirm your password',
    validate: (value: string) => 
      value === password || 'Passwords do not match',
  }),

  firstName: {
    required: 'First name is required',
    minLength: {
      value: 2,
      message: 'First name must be at least 2 characters',
    },
    maxLength: {
      value: 50,
      message: 'First name must not exceed 50 characters',
    },
    pattern: {
      value: /^[a-zA-Z\s]+$/,
      message: 'First name can only contain letters and spaces',
    },
  },

  lastName: {
    required: 'Last name is required',
    minLength: {
      value: 2,
      message: 'Last name must be at least 2 characters',
    },
    maxLength: {
      value: 50,
      message: 'Last name must not exceed 50 characters',
    },
    pattern: {
      value: /^[a-zA-Z\s]+$/,
      message: 'Last name can only contain letters and spaces',
    },
  },

  terms: {
    required: 'You must accept the terms and conditions',
  },
} as const;

// Form field helper for better type safety
export function getFieldError<T extends FieldValues>(
  form: UseFormReturn<T>,
  fieldName: Path<T>
): string | undefined {
  const fieldError = form.formState.errors[fieldName];
  return fieldError?.message as string | undefined;
}

// Check if form is valid helper
export function isFormValid<T extends FieldValues>(
  form: UseFormReturn<T>,
  requiredFields: Array<Path<T>>
): boolean {
  const { isValid, errors } = form.formState;
  const watchedValues = form.watch();
  
  // Check if all required fields have values
  const allFieldsHaveValues = requiredFields.every(field => {
    const value = watchedValues[field];
    return value !== undefined && value !== null && value !== '';
  });

  // Check if there are no validation errors
  const noErrors = Object.keys(errors).length === 0;

  return isValid && allFieldsHaveValues && noErrors;
}