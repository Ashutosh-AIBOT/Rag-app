import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

export default function Card({ className = "", children, ...props }: CardProps) {
  return (
    <div className={`bg-zinc-900 border border-zinc-800 rounded-xl p-6 ${className}`} {...props}>
      {children}
    </div>
  );
}
