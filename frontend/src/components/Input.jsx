import React from 'react';

/**
 * A reusable, styled input component for forms.
 *
 * @param {object} props - The component's props.
 * @param {string} props.placeholder - The placeholder text for the input.
 * @param {string} props.value - The current value of the input.
 * @param {function} props.onChange - The function to call when the input value changes.
 * @param {string} [props.type='text'] - The type of the input (e.g., 'text', 'password', 'number').
 */
const Input = ({ placeholder, value, onChange, type = 'text' }) => {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className="
        w-full 
        rounded-lg 
        border-2 
        border-gray-700 
        bg-gray-800 
        p-4 
        text-white 
        placeholder-gray-500 
        transition-colors 
        duration-200 
        focus:border-indigo-500 
        focus:outline-none 
        focus:ring-0
      "
    />
  );
};

export default Input;
