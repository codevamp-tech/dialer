const variants = {
  default: 'bg-secondary text-secondary-foreground',
  primary: 'bg-primary/10 text-primary',
  success: 'bg-green-500/10 text-green-700 dark:text-green-400',
  warning: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
  destructive: 'bg-red-500/10 text-red-700 dark:text-red-400',
  outline: 'border border-border text-foreground bg-transparent',
};

export function Badge({ children, variant = 'default', className = '', dot = false }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${variants[variant]} ${className}`}>
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}
