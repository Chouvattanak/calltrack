import React, { ReactNode, FC } from "react";

// --- KEY CHANGE 1: Extend React.ButtonHTMLAttributes<HTMLButtonElement> ---
// This tells TypeScript that ButtonProps should accept all standard HTML <button> attributes.
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  // Your existing custom props go here.
  // Note: 'children', 'className', 'onClick', and 'disabled' are already included by
  // React.ButtonHTMLAttributes, but keeping them here allows for specific defaults
  // or custom logic within this component.
  children: ReactNode; // Button text or content
  size?: "sm" | "md"; // Button size
  variant?: "primary" | "outline"; // Button variant
  startIcon?: ReactNode; // Icon before the text
  endIcon?: ReactNode; // Icon after the text
  // onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void; // Already covered by extends
  // disabled?: boolean; // Already covered by extends, but kept for clarity/default
  // className?: string; // Already covered by extends, but kept for clarity/default
}

const Button: FC<ButtonProps> = ({
  children,
  size = "md",
  variant = "primary",
  startIcon,
  endIcon,
  // Destructure any other props you handle specifically (like onClick, disabled if you have custom logic)
  // All other standard HTML <button> attributes will be collected into `...rest`.
  onClick, // Keep onClick explicitly destructured if you handle its logic here
  className = "", // Keep className explicit for merging with internal styles
  disabled = false, // Keep disabled explicit if you have custom styling logic based on it
  ...rest // <-- KEY CHANGE 2: Capture all other standard HTML button props here
}) => {
  // Size Classes
  const sizeClasses = {
    sm: "px-4 py-3 text-sm",
    md: "px-5 py-3.5 text-sm",
  };

  // Variant Classes
  const variantClasses = {
    primary:
      "bg-brand-500 text-white shadow-theme-xs hover:bg-brand-600 disabled:bg-brand-300",
    outline:
      "bg-white text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700 dark:hover:bg-white/[0.03] dark:hover:text-gray-300",
  };

  return (
    <button
      className={`inline-flex items-center justify-center font-medium gap-2 rounded-lg transition ${className} ${
        sizeClasses[size]
      } ${variantClasses[variant]} ${
        disabled ? "cursor-not-allowed opacity-50" : "" // Use the destructured 'disabled' prop
      }`}
      onClick={onClick} // Pass the destructured 'onClick'
      disabled={disabled} // Pass the destructured 'disabled'
      // --- KEY CHANGE 3: Spread all remaining props onto the native <button> ---
      // This is what passes the `type="submit"` attribute (and any other HTML attributes) through.
      {...rest}
    >
      {startIcon && <span className="flex items-center">{startIcon}</span>}
      {children}
      {endIcon && <span className="flex items-center">{endIcon}</span>}
    </button>
  );
};

export default Button;