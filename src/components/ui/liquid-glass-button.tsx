"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface LiquidButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

const LiquidButton = React.forwardRef<HTMLButtonElement, LiquidButtonProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn("liquid-glass-btn", className)}
        {...props}
      >
        <span className="liquid-glass-btn__inner">{children}</span>
      </button>
    );
  }
);
LiquidButton.displayName = "LiquidButton";

export { LiquidButton };
