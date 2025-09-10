// Please ensure this is the file you are editing,
// e.g., components/form/input/InputField.tsx or similar.

import React, { FC } from "react";

// --- KEY CHANGE 1: Extend React.InputHTMLAttributes<HTMLInputElement> ---
// This tells TypeScript that InputProps should accept all standard HTML <input> element attributes.
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  // Your existing custom props go here.
  // Many of these (like 'type', 'id', 'name', 'placeholder', 'defaultValue', 'onChange', 'min', 'max', 'step', 'disabled')
  // are now inherited from React.InputHTMLAttributes, but you can keep them explicitly
  // listed here if you want to provide specific default values or override their types.
  // For clarity, I've left them as they were, but know they are already covered by the extension.
  type?: "text" | "number" | "email" | "password" | "date" | "time" | string;
  id?: string;
  name?: string;
  placeholder?: string;
  defaultValue?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string; // This className is for additional external styles
  min?: string;
  max?: string;
  step?: number;
  disabled?: boolean; // Keep this explicit for internal disabled state styling

  // Custom props for styling/display logic:
  success?: boolean;
  error?: boolean; // Boolean to indicate error state for styling
  hint?: string; // Optional hint or error text displayed below the input
}

const Input: FC<InputProps> = ({
  // --- KEY CHANGE 2: Destructure your specific props first, then use `...rest` ---
  // `...rest` will collect all other standard HTML <input> attributes
  // that are passed to this component (like `value`, `required`, `onBlur`, etc.).
  type = "text",
  // Destructure any other props that have custom logic or default values in this component
  // (e.g., id, name, placeholder, defaultValue, onChange, min, max, step, disabled if you handle them specifically)
  // For simplicity, it's often cleaner to destructure only what you explicitly use or default here,
  // and let `...rest` handle the rest.
  id,
  name,
  placeholder,
  defaultValue,
  onChange,
  className = "",
  min,
  max,
  step,
  disabled = false, // Explicitly destructured to use in `if (disabled)` check
  success = false,
  error = false,
  hint,
  ...rest // <-- THIS IS CRUCIAL: Captures all remaining props (e.g., 'value', 'required')
}) => {
  // Determine input styles based on state (disabled, success, error)
  let inputClasses = `h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 ${className}`;

  // Add styles for the different states
  if (disabled) { // Use the destructured 'disabled' prop
    inputClasses += ` text-gray-500 border-gray-300 cursor-not-allowed dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700`;
  } else if (error) {
    inputClasses += ` text-error-800 border-error-500 focus:ring-3 focus:ring-error-500/10  dark:text-error-400 dark:border-error-500`;
  } else if (success) {
    inputClasses += ` text-success-500 border-success-400 focus:ring-success-500/10 focus:border-success-300  dark:text-success-400 dark:border-success-500`;
  } else {
    inputClasses += ` bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:focus:border-brand-800`;
  }

  // Determine if this is a controlled or uncontrolled input
  const isControlled = rest.value !== undefined;
  
  return (
    <div className="relative">
      <input
        type={type}
        id={id}
        name={name}
        placeholder={placeholder}
        onChange={onChange}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        className={inputClasses}
        {...(isControlled 
          ? { value: rest.value ?? '' } 
          : { defaultValue: defaultValue ?? '' }
        )}
        {...rest}
      />

      {/* Optional Hint Text */}
      {hint && (
        <p
          className={`mt-1.5 text-xs ${
            error // Use the 'error' prop to determine hint text color
              ? "text-error-500"
              : success
              ? "text-success-500"
              : "text-gray-500"
          }`}
        >
          {hint}
        </p>
      )}
    </div>
  );
};

export default Input;