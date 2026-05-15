import React from 'react';
import { cn } from '../../utils/cn';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
}

export const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', className, ...props }) => {
  return (
    <button 
      className={cn(
        variant === 'primary' ? 'btn-primary' : 'btn-secondary',
        'flex items-center justify-center gap-2',
        className
      )} 
      {...props}
    >
      {children}
    </button>
  );
};
