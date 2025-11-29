import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "primary" | "danger";
  active?: boolean;
  className?: string;
  fullWidth?: boolean;
}

export function Button({
  children,
  onClick,
  variant = "default",
  active = false,
  className = "",
  fullWidth = true,
  ...rest
}: ButtonProps) {
  const base = `px-3 py-2 rounded text-white transition-colors ${
    fullWidth ? "w-full" : "w-auto"
  } text-left`;

  const variants = {
    default: "bg-gray-700 hover:bg-gray-600",
    primary: "bg-blue-600 hover:bg-blue-500",
    danger: "bg-red-600 hover:bg-red-500",
  }[variant];

  return (
    <button
      onClick={onClick}
      className={`
        ${base}
        ${variants}
        ${active ? "ring-2 ring-yellow-400" : ""}
        ${className}
      `}
      {...rest}
    >
      {children}
    </button>
  );
}
