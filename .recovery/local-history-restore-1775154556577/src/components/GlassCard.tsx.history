interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
}

export default function GlassCard({ children, className = '' }: GlassCardProps) {
  return (
    <div
      className={`
        rounded-2xl
        bg-white/5
        backdrop-blur-lg
        border border-white/10
        p-6
        transition-all
        hover:bg-white/10
        hover:border-white/20
        ${className}
      `}
    >
      {children}
    </div>
  );
}
