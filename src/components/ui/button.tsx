import * as React from "react"
import { Loader2 } from "lucide-react"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  loading?: boolean;
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = "",
      variant = "default",
      size = "default",
      type = "button",
      loading = false,
      isLoading = false,
      disabled,
      children,
      title,
      ...props
    },
    ref
  ) => {
    const isBusy = loading || isLoading
    const isDisabled = disabled || isBusy

    const baseStyles =
      "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer disabled:cursor-not-allowed"

    const variants: Record<string, string> = {
      default:
        "bg-slate-900 text-slate-50 hover:bg-slate-900/90 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-50/90",
      secondary:
        "bg-slate-100 text-slate-900 hover:bg-slate-100/80 dark:bg-slate-800 dark:text-slate-50 dark:hover:bg-slate-800/80",
      destructive:
        "bg-red-500 text-slate-50 hover:bg-red-500/90 dark:bg-red-900 dark:text-slate-50 dark:hover:bg-red-900/90",
      outline:
        "border border-slate-200 bg-white hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-800 dark:hover:text-slate-50",
      ghost:
        "hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-50",
      link: "text-slate-900 underline-offset-4 hover:underline dark:text-slate-50",
    }

    const sizes: Record<string, string> = {
      default: "h-10 px-4 py-2",
      sm: "h-9 rounded-md px-3",
      lg: "h-11 rounded-md px-8",
      icon: "h-10 w-10 p-0",
    }

    const combinedClasses = `${baseStyles} ${variants[variant] || variants.default} ${
      sizes[size] || sizes.default
    } ${className}`.trim()

    // Ensure icon-only buttons have an accessible name if title is provided
    const ariaLabel =
      props["aria-label"] || (size === "icon" && typeof title === "string" ? title : undefined)

    return (
      <button
        ref={ref}
        type={type}
        className={combinedClasses}
        disabled={isDisabled}
        aria-busy={isBusy ? "true" : undefined}
        aria-disabled={isDisabled ? "true" : undefined}
        aria-label={ariaLabel}
        data-loading={isBusy ? "true" : undefined}
        data-disabled={isDisabled ? "true" : undefined}
        title={title}
        {...props}
      >
        {isBusy && (
          <Loader2
            className={`animate-spin ${size === "sm" ? "h-3.5 w-3.5 mr-1.5" : "h-4 w-4 mr-2"}`}
            aria-hidden="true"
          />
        )}
        {children}
      </button>
    )
  }
)
Button.displayName = "Button"
