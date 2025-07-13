import { Description, Field, Input, Label } from "@headlessui/react";
import clsx from "clsx";
import { forwardRef } from "react";

interface BaseInputProps {
  label?: string;
  description?: string;
  placeholder?: string;
  type?: "text" | "email" | "password" | "tel" | "number" | "url" | "search";
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  width?: string;
}

const BaseInput = forwardRef<HTMLInputElement, BaseInputProps>(
  (
    {
      label,
      description,
      placeholder,
      type = "text",
      value,
      onChange,
      className,
      required = false,
      disabled = false,
      error,
      width = "w-full max-w-[300px]",
      ...props
    },
    ref
  ) => {
    return (
      <div className={width}>
        <Field>
          {label && (
            <Label className="text-sm font-medium text-gray-300 mb-1">
              {label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </Label>
          )}
          {description && (
            <Description className="text-sm text-gray-400 mb-2">
              {description}
            </Description>
          )}
          <Input
            ref={ref}
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            className={clsx(
              "block w-full rounded-md border-none dark:bg-black bg-gray-200 px-3 py-2 text-sm text-main-text",
              "data-focus:outline-2 data-focus:-outline-offset-2 data-focus:outline-blue-500/50",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              error && "border-red-500 data-focus:outline-red-500/50",
              className
            )}
            {...props}
          />
          {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
        </Field>
      </div>
    );
  }
);

BaseInput.displayName = "BaseInput";

export default BaseInput;
