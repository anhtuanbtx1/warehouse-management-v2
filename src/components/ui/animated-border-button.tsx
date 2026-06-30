"use client";
import React from "react";
import { motion } from "motion/react";

interface AnimatedBorderButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: "primary" | "outline-primary" | "success" | "outline-secondary" | "danger";
  size?: "sm" | "md" | "lg";
  glowColor?: string;
  duration?: number;
  className?: string;
}

const AnimatedBorderButton: React.FC<AnimatedBorderButtonProps> = ({
  children,
  variant = "outline-primary",
  size,
  glowColor = "#f97316",
  duration = 3,
  className = "",
  style,
  ...props
}) => {
  const sizeClass = size === "sm" ? "btn-sm" : size === "lg" ? "btn-lg" : "";
  const radius = 10;

  return (
    <button
      className={`btn btn-${variant} ${sizeClass} ${className}`}
      style={{ position: "relative", overflow: "hidden", ...style }}
      {...props}
    >
      {/* Animated border overlay */}
      <span
        style={{
          position: "absolute",
          inset: -1,
          borderRadius: "inherit",
          pointerEvents: "none",
          zIndex: 0,
        }}
      >
        <motion.span
          style={{
            position: "absolute",
            width: 24,
            height: 24,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
            offsetPath: `rect(0px auto auto 0px round ${radius}px)`,
            offsetDistance: "0%",
            filter: "blur(3px)",
            opacity: 0.9,
          }}
          animate={{ offsetDistance: ["0%", "100%"] }}
          transition={{
            repeat: Infinity,
            duration,
            ease: "linear",
          }}
        />
      </span>

      {/* Button content sits above the animation */}
      <span style={{ position: "relative", zIndex: 1 }}>{children}</span>
    </button>
  );
};

export default AnimatedBorderButton;
