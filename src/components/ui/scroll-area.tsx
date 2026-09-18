import * as React from "react"
export function ScrollArea({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) { return <div className={className} {...props}>{children}</div> }
