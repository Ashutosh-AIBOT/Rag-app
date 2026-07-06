import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
}

export default function Button({ variant = "primary", className = "", children, ...props }: ButtonProps) {
  const baseStyle = "px-4 py-2 rounded-lg font-medium transition duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-indigo-600 hover:bg-indigo-700 text-white focus:ring-indigo-500",
    secondary: "bg-zinc-700 hover:bg-zinc-600 text-zinc-100 focus:ring-zinc-500",
    danger: "bg-rose-600 hover:bg-rose-700 text-white focus:ring-rose-500",
    ghost: "bg-transparent hover:bg-zinc-800 text-zinc-300",
  };
  return (
    <button className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
