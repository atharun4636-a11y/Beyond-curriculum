import './Input.css';
import { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import clsx from 'clsx';

export const Input = forwardRef(({ 
  label, 
  error, 
  type = 'text',
  className,
  wrapperClassName,
  ...props 
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPasswordType = type === 'password';

  return (
    <div className={clsx('ui-input-wrapper', wrapperClassName)}>
      {label && <label className="ui-input-label">{label}</label>}
      <div style={{ position: 'relative', width: '100%' }}>
        <input
          ref={ref}
          type={isPasswordType ? (showPassword ? 'text' : 'password') : type}
          className={clsx(
            'ui-input',
            error && 'ui-input--error',
            className
          )}
          style={isPasswordType ? { paddingRight: '38px' } : {}}
          {...props}
        />
        {isPasswordType && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={{
              position: 'absolute',
              right: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2px',
              zIndex: 2
            }}
            title={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {error && <span className="ui-input-error-text">{error}</span>}
    </div>
  );
});

Input.displayName = 'Input';
