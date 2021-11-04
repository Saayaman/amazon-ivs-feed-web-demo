import React from 'react';
import * as Icons from '../../../assets/icons';

import './Button.css';

const Button = ({ children, onClick, ...otherProps }) => {
  const Icon = Icons[children] || children;

  const clickHandler = (e) => {
    if (onClick) {
      e.stopPropagation();
      onClick(e);
    }
  };

  return (
    <button className="button" onClick={clickHandler} {...otherProps}>
      {Array.isArray(Icon) ? Icon : <Icon />}
    </button>
  );
};

export default Button;
