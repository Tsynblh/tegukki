import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "destructive" | "outline";
}

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  const variantStyles = {
    default: "bg-primary/10 text-primary border border-primary/20",
    secondary: "bg-secondary/15 text-secondary border border-secondary/25",
    destructive: "bg-destructive/10 text-destructive border border-destructive/20",
    outline: "border border-border text-muted-foreground",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold select-none",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}
