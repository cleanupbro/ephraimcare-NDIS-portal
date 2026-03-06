"use client"

import * as React from "react"
import { X } from "lucide-react"
import { cn } from "../lib/utils"

// ─── Simple Sheet implementation using CSS transitions ────────────────────
// Radix Dialog's mount/unmount cycle prevents CSS transitions from playing
// on mobile (element is removed before close animation, and appears without
// open animation). This implementation keeps the DOM mounted and uses
// translate + opacity transitions directly.

interface SheetContextValue {
  open: boolean
  onOpenChange: (open: boolean) => void
}
const SheetContext = React.createContext<SheetContextValue>({
  open: false,
  onOpenChange: () => {},
})

function Sheet({ open = false, onOpenChange, children }: {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}) {
  const handleOpenChange = React.useCallback((v: boolean) => {
    onOpenChange?.(v)
  }, [onOpenChange])

  return (
    <SheetContext.Provider value={{ open, onOpenChange: handleOpenChange }}>
      {children}
    </SheetContext.Provider>
  )
}

const SheetTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ onClick, ...props }, ref) => {
  const { onOpenChange } = React.useContext(SheetContext)
  return (
    <button
      ref={ref}
      type="button"
      onClick={(e) => {
        onOpenChange(true)
        onClick?.(e)
      }}
      {...props}
    />
  )
})
SheetTrigger.displayName = "SheetTrigger"

const SheetClose = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ onClick, ...props }, ref) => {
  const { onOpenChange } = React.useContext(SheetContext)
  return (
    <button
      ref={ref}
      type="button"
      onClick={(e) => {
        onOpenChange(false)
        onClick?.(e)
      }}
      {...props}
    />
  )
})
SheetClose.displayName = "SheetClose"

const SheetPortal = ({ children }: { children: React.ReactNode }) => <>{children}</>

const SheetOverlay = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { open, onOpenChange } = React.useContext(SheetContext)
  return (
    <div
      ref={ref}
      aria-hidden="true"
      onClick={() => onOpenChange(false)}
      className={cn(
        "fixed inset-0 z-50 bg-black/50 transition-opacity duration-300",
        open ? "opacity-100" : "opacity-0 pointer-events-none",
        className
      )}
      {...props}
    />
  )
})
SheetOverlay.displayName = "SheetOverlay"

interface SheetContentProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: "left" | "right"
}

const SheetContent = React.forwardRef<HTMLDivElement, SheetContentProps>(
  ({ className, children, side = "right", ...props }, ref) => {
    const { open, onOpenChange } = React.useContext(SheetContext)

    // Lock body scroll when open
    React.useEffect(() => {
      if (open) {
        const original = document.body.style.overflow
        document.body.style.overflow = "hidden"
        return () => { document.body.style.overflow = original }
      }
    }, [open])

    // Close on Escape
    React.useEffect(() => {
      if (!open) return
      const handleKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") onOpenChange(false)
      }
      document.addEventListener("keydown", handleKey)
      return () => document.removeEventListener("keydown", handleKey)
    }, [open, onOpenChange])

    return (
      <>
        <SheetOverlay />
        <div
          ref={ref}
          role="dialog"
          aria-modal={open}
          className={cn(
            "fixed inset-y-0 z-50 flex w-[280px] flex-col bg-background shadow-lg transition-transform duration-300 ease-in-out sm:max-w-sm",
            side === "left" && "left-0 border-r",
            side === "right" && "right-0 border-l",
            // Slide position
            open
              ? "translate-x-0"
              : side === "left"
                ? "-translate-x-full"
                : "translate-x-full",
            !open && "pointer-events-none",
            className
          )}
          {...props}
        >
          <div className="flex-1 overflow-y-auto">
            {children}
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-md opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        </div>
      </>
    )
  }
)
SheetContent.displayName = "SheetContent"

const SheetHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("flex flex-col space-y-2 px-6 pt-6", className)}
    {...props}
  />
)
SheetHeader.displayName = "SheetHeader"

const SheetFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 px-6 pb-6",
      className
    )}
    {...props}
  />
)
SheetFooter.displayName = "SheetFooter"

const SheetTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
SheetTitle.displayName = "SheetTitle"

const SheetDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
SheetDescription.displayName = "SheetDescription"

export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
