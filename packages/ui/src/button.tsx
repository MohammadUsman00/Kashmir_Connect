import * as React from "react";
import { cn } from "./utils";

type ButtonVariant = "default" | "secondary" | "ghost" | "destructive";

const variantClasses: Record<ButtonVariant, string> = {
  default: "bg-amber-700 text-white hover:bg-amber-800",
  secondary: "bg-neutral-200 text-neutral-900 hover:bg-neutral-300",
  ghost: "bg-transparent text-neutral-900 hover:bg-neutral-100",
  destructive: "bg-red-600 text-white hover:bg-red-700"
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "default", ...props },
  ref
) {
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
});
