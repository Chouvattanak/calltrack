import React, { FC } from "react";

interface ComponentCardInputProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  desc?: string;
}

const ComponentCardInput: FC<ComponentCardInputProps> = ({
  title,
  children,
  className = "",
}) => {
  return (
    <div
      className={`rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] ${className}`}
    >
      {/* Card Header: Only render if a title is provided */}
      {title && (
        <div className="px-3 py-2 sm:px-6 sm:py-4 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-base font-medium text-gray-800 dark:text-white/90">
            {title}
          </h3>
          {/* {desc && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {desc}
            </p>
          )} */}
        </div>
      )}

      {/* Card Body: Conditionally add top border if there is a title */}
      <div className={`p-3 sm:p-5 ${title ? 'border-t border-gray-100 dark:border-gray-200' : ''}`}>
        <div className="space-y-5">{children}</div>
      </div>
    </div>
  );
};

export default ComponentCardInput;
