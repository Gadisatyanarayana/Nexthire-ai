interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  isLoading?: boolean;
}

export default function Button({
  children,
  variant = 'primary',
  isLoading = false,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  const baseStyles = 'px-6 py-3 rounded-xl font-medium transition-all active:scale-95';

  const variants = {
    primary:
      'bg-white text-black hover:bg-white/90 disabled:bg-gray-400 disabled:text-gray-600',
    secondary:
      'bg-white/10 text-white border border-white/20 hover:bg-white/20 disabled:bg-white/5',
    danger: 'bg-red-500/20 text-red-300 hover:bg-red-500/30 disabled:bg-red-500/10',
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {isLoading ? '...' : children}
    </button>
  );
}
