import * as React from "react"

export interface SwitchProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "onChange"> {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
}

export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  (
    {
      className = "",
      checked: controlledChecked,
      defaultChecked = false,
      onCheckedChange,
      onChange,
      disabled = false,
      id,
      ...props
    },
    ref
  ) => {
    const isControlled = controlledChecked !== undefined
    const [uncontrolledChecked, setUncontrolledChecked] = React.useState<boolean>(defaultChecked)
    const isChecked = isControlled ? Boolean(controlledChecked) : uncontrolledChecked

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled) return

      const nextChecked = e.target.checked
      if (!isControlled) {
        setUncontrolledChecked(nextChecked)
      }

      onCheckedChange?.(nextChecked)
      onChange?.(e)
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // WAI-ARIA Switch pattern: Enter toggles switch
      if (e.key === "Enter") {
        e.preventDefault()
        if (disabled) return
        const nextChecked = !isChecked
        if (!isControlled) {
          setUncontrolledChecked(nextChecked)
        }
        onCheckedChange?.(nextChecked)
        if (onChange) {
          const syntheticEvent = {
            ...e,
            target: { ...e.currentTarget, checked: nextChecked },
            currentTarget: { ...e.currentTarget, checked: nextChecked },
          } as unknown as React.ChangeEvent<HTMLInputElement>
          onChange(syntheticEvent)
        }
      }
      props.onKeyDown?.(e)
    }

    const state = isChecked ? "checked" : "unchecked"

    return (
      <label
        className={`relative inline-flex items-center select-none ${
          disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
        } ${className}`}
        data-state={state}
        data-disabled={disabled ? "" : undefined}
      >
        <input
          ref={ref}
          type="checkbox"
          role="switch"
          id={id}
          aria-checked={isChecked}
          aria-disabled={disabled ? "true" : undefined}
          checked={isChecked}
          disabled={disabled}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          className="sr-only peer"
          data-state={state}
          {...props}
        />
        <div
          aria-hidden="true"
          data-state={state}
          data-disabled={disabled ? "" : undefined}
          className={`w-11 h-6 bg-slate-200 dark:bg-slate-700 rounded-full transition-colors
            peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-blue-500 peer-focus-visible:ring-offset-2 dark:peer-focus-visible:ring-blue-400
            peer-checked:bg-blue-600
            peer-disabled:cursor-not-allowed
            after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 dark:after:border-slate-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-transform
            ${isChecked ? "after:translate-x-5 after:border-white" : "after:translate-x-0"}`}
        />
      </label>
    )
  }
)
Switch.displayName = "Switch"
