'use client';

import React from 'react';
import { 
  usePasswordStrength, 
  getStrengthColor, 
  getStrengthBarColor, 
  getStrengthLabel 
} from '@/hooks/use-password-strength';
import { cn } from '@/lib/utils';
import { Check, X } from 'lucide-react';

interface PasswordStrengthIndicatorProps {
  password: string;
  showDetails?: boolean;
  className?: string;
}

export function PasswordStrengthIndicator({
  password,
  showDetails = true,
  className,
}: PasswordStrengthIndicatorProps): JSX.Element {
  const passwordStrength = usePasswordStrength(password);

  if (!password) {
    return <div />;
  }

  const { score, strength, criteria, feedback } = passwordStrength;

  return (
    <div className={cn('space-y-2', className)}>
      {/* Strength Bar */}
      <div className='flex items-center gap-2'>
        <div className='flex-1 space-y-1'>
          <div className='flex gap-1'>
            {Array.from({ length: 5 }, (_, index) => (
              <div
                key={index}
                className={cn(
                  'h-2 flex-1 rounded-full transition-colors',
                  index < score
                    ? getStrengthBarColor(strength)
                    : 'bg-muted'
                )}
              />
            ))}
          </div>
        </div>
        <span className={cn('text-sm font-medium', getStrengthColor(strength))}>
          {getStrengthLabel(strength)}
        </span>
      </div>

      {/* Detailed Criteria */}
      {showDetails && (
        <div className='space-y-1'>
          <div className='text-xs text-muted-foreground'>Password requirements:</div>
          <div className='grid grid-cols-1 gap-1 text-xs'>
            <CriteriaItem
              met={criteria.minLength}
              text='At least 8 characters'
            />
            <CriteriaItem
              met={criteria.hasUpperCase}
              text='One uppercase letter'
            />
            <CriteriaItem
              met={criteria.hasLowerCase}
              text='One lowercase letter'
            />
            <CriteriaItem
              met={criteria.hasNumber}
              text='One number'
            />
            <CriteriaItem
              met={criteria.hasSpecialChar}
              text='One special character (@$!%*?&)'
            />
          </div>
        </div>
      )}

      {/* Feedback for improvements */}
      {feedback.length > 0 && showDetails && (
        <div className='space-y-1'>
          {feedback.slice(0, 3).map((message, index) => (
            <div key={index} className='text-xs text-muted-foreground flex items-center gap-1'>
              <X className='h-3 w-3 text-destructive flex-shrink-0' />
              <span>{message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface CriteriaItemProps {
  met: boolean;
  text: string;
}

function CriteriaItem({ met, text }: CriteriaItemProps): JSX.Element {
  return (
    <div className={cn(
      'flex items-center gap-2 transition-colors',
      met ? 'text-green-600' : 'text-muted-foreground'
    )}>
      {met ? (
        <Check className='h-3 w-3 flex-shrink-0' />
      ) : (
        <div className='h-3 w-3 rounded-full border border-muted-foreground flex-shrink-0' />
      )}
      <span>{text}</span>
    </div>
  );
}