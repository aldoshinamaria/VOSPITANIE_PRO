import { Input, type InputProps } from "@/components/ui/input";
import { Textarea, type TextareaProps } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface FieldBaseProps {
  label: string;
  required?: boolean;
  error?: string;
  className?: string;
}

export function FormField({
  label,
  required = false,
  error,
  className,
  ...props
}: FieldBaseProps & InputProps) {
  return (
    <label className={cn("grid gap-2 text-sm font-medium", className)}>
      <FieldLabel label={label} required={required} />
      <Input
        aria-invalid={Boolean(error)}
        className={error ? "border-red-300 focus-visible:ring-red-500" : undefined}
        {...props}
      />
      <FieldError error={error} />
    </label>
  );
}

export function TextareaField({
  label,
  required = false,
  error,
  className,
  ...props
}: FieldBaseProps & TextareaProps) {
  return (
    <label className={cn("grid gap-2 text-sm font-medium", className)}>
      <FieldLabel label={label} required={required} />
      <Textarea
        aria-invalid={Boolean(error)}
        className={error ? "border-red-300 focus-visible:ring-red-500" : undefined}
        {...props}
      />
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
