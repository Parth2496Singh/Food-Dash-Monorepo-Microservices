import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

const Input: React.FC<InputProps> = ({ label, id, className = '', ...props }) => {
  return (
    <div className={`relative ${className}`}>
      <input
        id={id}
        className="block px-4 pb-2.5 pt-6 w-full text-sm text-gray-900 bg-white rounded-xl border border-gray-300 appearance-none focus:outline-none focus:ring-0 focus:border-primary peer"
        placeholder=" "
        {...props}
      />
      <label
        htmlFor={id}
        className="absolute text-sm text-gray-500 duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-primary"
      >
        {label}
      </label>
    </div>
  );
};

export default Input;
