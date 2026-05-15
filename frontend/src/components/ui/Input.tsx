import React from 'react';
import { cn } from '../../utils/cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ElementType;
}

export const Input: React.FC<InputProps> = ({ icon: Icon, className, ...props }) => {
  return (
    <div className="relative">
      {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />}
      <input 
        className={cn("input-field", Icon && "pl-10", className)} 
        {...props} 
      />
    </div>
  );
};
