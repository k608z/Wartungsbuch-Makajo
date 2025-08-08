import React from 'react';

const Alert = ({ message, type, onClose }) => {
  return (
    <div 
      className={`alert alert-${type} alert-dismissible fade show position-fixed`}
      style={{
        top: '20px',
        right: '20px',
        zIndex: 9999,
        maxWidth: '300px'
      }}
    >
      {message}
      <button 
        type="button" 
        className="btn-close" 
        onClick={onClose}
        aria-label="Close"
      ></button>
    </div>
  );
};

export default Alert;