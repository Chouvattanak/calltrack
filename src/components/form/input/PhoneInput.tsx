"use client";
import React, { useState, useEffect } from "react";
import InputField from "./InputField";
import Label from "../Label";

interface PhoneInputProps {
  id?: string;
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
  disabled?: boolean;
  required?: boolean;
}

export default function PhoneInput({
  id,
  label,
  placeholder = "000-000-0000",
  value,
  onChange,
  error,
  disabled,
  required,
}: PhoneInputProps) {
  const [formattedValue, setFormattedValue] = useState("");

  // Format phone number with xxx-xxx-xxxx pattern
  const formatPhoneNumber = (input: string): string => {
    // Remove all non-digits
    const numbers = input.replace(/\D/g, "");
    
    // Limit to 10 digits (without country code)
    const limitedNumbers = numbers.slice(0, 10);
    
    // Apply formatting
    if (limitedNumbers.length <= 3) {
      return limitedNumbers;
    } else if (limitedNumbers.length <= 6) {
      return `${limitedNumbers.slice(0, 3)}-${limitedNumbers.slice(3)}`;
    } else {
      return `${limitedNumbers.slice(0, 3)}-${limitedNumbers.slice(3, 6)}-${limitedNumbers.slice(6)}`;
    }
  };

  // Extract raw phone number (digits only)
  const extractRawNumber = (formatted: string): string => {
    return formatted.replace(/\D/g, "");
  };

  // Update formatted value when prop value changes
  useEffect(() => {
    if (value) {
      // If value starts with +855, remove it for formatting
      const cleanValue = value.startsWith("+855") ? value.slice(4) : value;
      setFormattedValue(formatPhoneNumber(cleanValue));
    } else {
      setFormattedValue("");
    }
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const formatted = formatPhoneNumber(inputValue);
    setFormattedValue(formatted);
    
    // Send back the full number with +855 prefix
    const rawNumber = extractRawNumber(formatted);
    const fullNumber = rawNumber ? `+855${rawNumber}` : "";
    onChange(fullNumber);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow: backspace, delete, tab, escape, enter
    if ([8, 9, 27, 13, 46].indexOf(e.keyCode) !== -1 ||
        // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
        (e.keyCode === 65 && e.ctrlKey === true) ||
        (e.keyCode === 67 && e.ctrlKey === true) ||
        (e.keyCode === 86 && e.ctrlKey === true) ||
        (e.keyCode === 88 && e.ctrlKey === true) ||
        // Allow: home, end, left, right
        (e.keyCode >= 35 && e.keyCode <= 39)) {
      return;
    }
    // Ensure that it is a number and stop the keypress
    if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
      e.preventDefault();
    }
  };

  return (
    <div>
      {label && (
        <Label htmlFor={id}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">
            (+855)
          </span>
        </div>
        <InputField
          id={id}
          type="tel"
          placeholder={placeholder}
          value={formattedValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          error={error}
          disabled={disabled}
          className="pl-16" // Add left padding for the prefix
        />
      </div>
    </div>
  );
}
