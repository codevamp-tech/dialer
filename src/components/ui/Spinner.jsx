export function Spinner({ className = '', size = 'md' }) {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-[3px]',
    xl: 'w-12 h-12 border-[3px]',
  };

  return (
    <div
      className={`${sizes[size]} border-muted-foreground/20 border-t-primary rounded-full animate-spin ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}

export function PageLoader({ message = 'Loading...' }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
      <Spinner size="xl" />
      <p className="text-muted-foreground font-medium animate-pulse">{message}</p>
    </div>
  );
}
