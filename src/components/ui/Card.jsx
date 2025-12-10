import { motion } from 'framer-motion'
import clsx from 'clsx'

export function Card({ children, className, hover = false, ...props }) {
  const Component = hover ? motion.div : 'div'
  const motionProps = hover ? {
    whileHover: { y: -4, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' },
    transition: { duration: 0.2 }
  } : {}

  return (
    <Component
      className={clsx(
        'rounded-lg border bg-card text-card-foreground shadow-sm',
        className
      )}
      {...motionProps}
      {...props}
    >
      {children}
    </Component>
  )
}

export function CardHeader({ children, className, ...props }) {
  return (
    <div className={clsx('flex flex-col space-y-1.5 p-6', className)} {...props}>
      {children}
    </div>
  )
}

export function CardTitle({ children, className, ...props }) {
  return (
    <h3 className={clsx('text-2xl font-semibold leading-none tracking-tight', className)} {...props}>
      {children}
    </h3>
  )
}

export function CardDescription({ children, className, ...props }) {
  return (
    <p className={clsx('text-sm text-muted-foreground', className)} {...props}>
      {children}
    </p>
  )
}

export function CardContent({ children, className, ...props }) {
  return (
    <div className={clsx('p-6 pt-0', className)} {...props}>
      {children}
    </div>
  )
}

export function CardFooter({ children, className, ...props }) {
  return (
    <div className={clsx('flex items-center p-6 pt-0', className)} {...props}>
      {children}
    </div>
  )
}
