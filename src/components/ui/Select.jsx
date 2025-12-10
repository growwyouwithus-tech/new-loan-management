import { forwardRef } from 'react'
import clsx from 'clsx'

const Select = forwardRef(({ className, children, error, ...props }, ref) => {
  return (
    <select
      className={clsx(
        'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        error && 'border-destructive focus-visible:ring-destructive',
        className
      )}
      ref={ref}
      {...props}
    >
      {children}
    </select>
  )
})

Select.displayName = 'Select'

export default Select
