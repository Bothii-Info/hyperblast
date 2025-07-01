import React from 'react';

/**
 * A reusable, styled button for the application.
 *
 * @param {object} props - The component's props.
 * @param {function} props.onClick - The function to execute when the button is clicked.
 * @param {React.ReactNode} props.children - The content displayed inside the button.
 * @param {string} [props.className=''] - Optional additional classes for custom styling.
 * @param {boolean} [props.disabled=false] - If true, the button will be un-clickable.
 */
const Button = ({ onClick, children, className = '', disabled = false }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full 
        transform 
        rounded-lg 
        bg-indigo-600 
        px-6 
        py-3 
        font-bold 
        text-white 
        transition 
        duration-300 
        ease-in-out 
        hover:scale-105 
        hover:bg-indigo-700 
        focus:outline-none 
        focus:ring-2 
        focus:ring-indigo-500 
        focus:ring-opacity-50 
        disabled:transform-none 
        disabled:cursor-not-allowed 
        disabled:bg-gray-500
        ${className}
      `}
    >
      {children}
    </button>
  );
};

export default Button;