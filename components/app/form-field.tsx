import type * as React from "react";

import { Input, type InputProps } from "@/components/ui/input";
import { Textarea, type TextareaProps } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const fieldShellClassName = "grid h-full content-start gap-2 text-sm font-medium";
const fieldHelpClassName = "min-h-[3.75rem]";

interface FieldBaseProps {
  label: string;
  required?: boolean;
  error?: string;
  className?: string;
  help?: React.ReactNode;
}

export function FormField({
  label,
  required = false,
  error,
  className,
  help,
  ...props
}: FieldBaseProps & InputProps) {
  return (
    <label className={cn(fieldShellClassName, className)}>
      <FieldLabel label={label} required={required} />
      <Input
        aria-invalid={Boolean(error)}
        className={error ? "border-red-300 focus-visible:ring-red-500" : undefined}
        {...props}
      />
      {help ? <div className={fieldHelpClassName}>{help}</div> : null}
      <FieldError error={error} />
    </label>
  );
}

export function TextareaField({
  label,
  required = false,
  error,
  className,
  help,
  ...props
}: FieldBaseProps & TextareaProps) {
  return (
    <label className={cn(fieldShellClassName, className)}>
      <FieldLabel label={label} required={required} />
      <Textarea
        aria-invalid={Boolean(error)}
        className={error ? "border-red-300 focus-visible:ring-red-500" : undefined}
        {...props}
      />
      {help ? <div className={fieldHelpClassName}>{help}</div> : null}
      <FieldError error={error} />
    </label>
  );
}

export function FieldLabel({ label, required = false }: { label: string; required?: boolean }) {
  return (
    <span>
      {label}
      {required ? <span className="ml-1 text-red-600">*</span> : null}
    </span>
  );
}

export function FieldError({ error }: { error?: string }) {
  return error ? <span className="text-xs font-normal text-red-700">{error}</span> : null;
}
