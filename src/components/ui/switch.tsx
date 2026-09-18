import * as React from "react"
export function Switch({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) { return <input type="checkbox" className={className} {...props} /> }
