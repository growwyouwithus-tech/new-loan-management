import clsx from 'clsx'

export default function Badge({ children, variant = 'default', className, ...props }) {
  const variants = {
    default: 'bg-primary text-primary-foreground',
    secondary: 'bg-secondary text-secondary-foreground',
    destructive: 'bg-destructive text-destructive-foreground',
    outline: 'border border-input bg-background',
    success: '!bg-green-500 !text-white border-green-500',
    warning: 'bg-yellow-500 text-white',
    info: 'bg-blue-500 text-white',
  }

  return (
    <div
      className={clsx(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
