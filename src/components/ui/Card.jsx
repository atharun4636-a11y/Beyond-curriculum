import './Card.css';
import clsx from 'clsx';

export const Card = ({ children, className, ...props }) => {
  return (
    <div className={clsx('ui-card glass', className)} {...props}>
      {children}
    </div>
  );
};
