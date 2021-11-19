import React from 'react';
import * as Icons from '../../../assets/icons';

import './Button.css';

const Button = React.forwardRef((props, ref) => {
  const { children, onClick, ...otherProps } = props;
  const Icon = Icons[children] || children;

  const clickHandler = (e) => {
    if (onClick) {
      e.stopPropagation();
      onClick(e);
    }
  };

  return (
    <span style={{ cursor: 'pointer' }}>
      <button ref={ref} className="button" onClick={clickHandler} {...otherProps}>
        {typeof Icon === 'string' ? `${Icon} ` : <Icon />}
      </button>
    </span>
  );
});

export default Button;
