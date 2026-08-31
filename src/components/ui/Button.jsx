import './Button.css';
import { forwardRef } from 'react';
import clsx from 'clsx';

export const Button = forwardRef(({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className,
  fullWidth = false,
  isLoading = false,
  ...props 
}, ref) => {
  return (
    <button
      ref={ref}
      className={clsx(
        'ui-button',
        `ui-button--${variant}`,
        `ui-button--${size}`,
        fullWidth && 'ui-button--full',
        isLoading && 'ui-button--loading',
        className
      )}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? <span className="loader" /> : children}
    </button>
  );
});

Button.displayName = 'Button';
