import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import * as Icons from '../../../assets/icons';

import './Button.css';

const Button = ({ children, onClick,  link, ...otherProps }) => {
  const Icon = Icons[children] || children;

  const clickHandler = (e) => {
    e.stopPropagation();
    onClick(e);
  };

  if(!!link) {
    return <NavLink className="button" to={link}><Icon /></NavLink>
  }

  return (
    <button className="button" onClick={!!onClick && clickHandler} {...otherProps}>
      <Icon />
    </button>
  );
};

export default Button;
