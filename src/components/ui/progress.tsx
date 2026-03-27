import * as React from "react"
import { cn } from "@/lib/utils"
import "./progress.css"

const Progress = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { value?: number }
>(({ className, value, ...props }, ref) => {
  const indicatorRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (indicatorRef.current) {
      const translateValue = `calc(-100% + ${value || 0}%)`;
      indicatorRef.current.style.transform = `translateX(${translateValue})`;
    }
  }, [value]);
  
  return (
    <div
      ref={ref}
      className={cn("progress-root", className)}
      {...props}
    >
      <div
        ref={indicatorRef}
        className="progress-indicator"
      />
    </div>
  )
})
Progress.displayName = "Progress"

export { Progress }
