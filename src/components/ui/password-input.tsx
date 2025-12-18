"use client";

import React, { useState, ReactNode } from 'react';
import { Input } from './input';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from './button';
import { cn } from './utils';

interface PasswordInputProps extends Omit<any, 'type'> {
  leftIcon?: any; // Icon to show on the left (like Lock icon)
}

export function PasswordInput({ 
  className, 
  leftIcon,
  ...props 
}: PasswordInputProps & { type?: never }) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative">
      {leftIcon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
          {leftIcon}
        </div>
      )}
      <Input
        {...props}
        type={showPassword ? 'text' : 'password'}
        className={cn(
          leftIcon ? 'pl-10' : '',
          'pr-10',
          className
        )}
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
        onClick={() => setShowPassword(!showPassword)}
        aria-label={showPassword ? 'Hide password' : 'Show password'}
      >
        {showPassword ? (
          <EyeOff className="h-4 w-4 text-gray-400" />
        ) : (
          <Eye className="h-4 w-4 text-gray-400" />
        )}
      </Button>
    </div>
  );
}
