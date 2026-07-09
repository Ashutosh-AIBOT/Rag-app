type BadgeVariant = "green" | "amber" | "rose" | "gold" | "default";

const styles: Record<BadgeVariant, string> = {
  green: "badge-green",
  amber: "badge-amber",
  rose: "badge-rose",
  gold: "badge-gold",
  default: "badge bg-zinc-800 border border-zinc-700 text-zinc-400",
};

export default function Badge({
  variant = "default",
  children,
  className = "",
}: {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={`${styles[variant]} ${className}`}>
      {children}
    </span>
  );
}
