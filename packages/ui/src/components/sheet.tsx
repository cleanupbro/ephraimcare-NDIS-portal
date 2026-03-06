"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"
import { cn } from "../lib/utils"

type SheetSide = "left" | "right"

interface SheetContextValue {
  open: boolean
  onOpenChange: (open: boolean) => void
  titleId: string
  descriptionId: string
}

const SheetContext = React.createContext<SheetContextValue | null>(null)

function useSheetContext(componentName: string) {
  const context = React.useContext(SheetContext)

  if (!context) {
    throw new Error(`${componentName} must be used within Sheet`)
  }

  return context
}

let activeBodyLocks = 0
let lockedScrollY = 0

function lockBodyScroll() {
  if (typeof document === "undefined") return

  if (activeBodyLocks === 0) {
    lockedScrollY = window.scrollY
    document.body.style.position = "fixed"
    document.body.style.top = `-${lockedScrollY}px`
    document.body.style.left = "0"
    document.body.style.right = "0"
    document.body.style.width = "100%"
    document.body.style.overflow = "hidden"
  }

  activeBodyLocks += 1
}

function unlockBodyScroll() {
  if (typeof document === "undefined" || activeBodyLocks === 0) return

  activeBodyLocks -= 1

  if (activeBodyLocks === 0) {
    document.body.style.position = ""
    document.body.style.top = ""
    document.body.style.left = ""
    document.body.style.right = ""
    document.body.style.width = ""
    document.body.style.overflow = ""
    window.scrollTo(0, lockedScrollY)
  }
}

function Sheet({
  open = false,
  onOpenChange,
  children,
}: {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}) {
  const titleId = React.useId()
  const descriptionId = React.useId()

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      onOpenChange?.(nextOpen)
    },
    [onOpenChange]
  )

  const contextValue = React.useMemo(
    () => ({
      open,
      onOpenChange: handleOpenChange,
      titleId,
      descriptionId,
    }),
    [descriptionId, handleOpenChange, open, titleId]
  )

  return (
    <SheetContext.Provider value={contextValue}>{children}</SheetContext.Provider>
  )
}

const SheetTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ onClick, ...props }, ref) => {
  const { onOpenChange } = useSheetContext("SheetTrigger")

  return (
    <button
      ref={ref}
      type="button"
      onClick={(event) => {
        onClick?.(event)
        if (!event.defaultPrevented) {
          onOpenChange(true)
        }
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
  const { onOpenChange } = useSheetContext("SheetClose")

  return (
    <button
      ref={ref}
      type="button"
      onClick={(event) => {
        onClick?.(event)
        if (!event.defaultPrevented) {
          onOpenChange(false)
        }
      }}
      {...props}
    />
  )
})
SheetClose.displayName = "SheetClose"

function SheetPortal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || typeof document === "undefined") {
    return null
  }

  return createPortal(children, document.body)
}

const SheetOverlay = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, onClick, ...props }, ref) => {
  const { open, onOpenChange } = useSheetContext("SheetOverlay")

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={cn(
        "absolute inset-0 bg-black/50 transition-opacity duration-300 ease-out",
        open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        className
      )}
      onClick={(event) => {
        onClick?.(event)
        if (!event.defaultPrevented) {
          onOpenChange(false)
        }
      }}
      {...props}
    />
  )
})
SheetOverlay.displayName = "SheetOverlay"

interface SheetContentProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: SheetSide
}

const sideClasses: Record<SheetSide, string> = {
  left: "left-0 border-r data-[state=closed]:-translate-x-full data-[state=open]:translate-x-0",
  right:
    "right-0 border-l data-[state=closed]:translate-x-full data-[state=open]:translate-x-0",
}

const SheetContent = React.forwardRef<HTMLDivElement, SheetContentProps>(
  ({ className, children, side = "right", onTransitionEnd, ...props }, ref) => {
    const { open, onOpenChange, titleId, descriptionId } =
      useSheetContext("SheetContent")
    const [isMounted, setIsMounted] = React.useState(open)

    React.useEffect(() => {
      if (open) {
        setIsMounted(true)
      }
    }, [open])

    React.useEffect(() => {
      if (!isMounted || !open) return

      lockBodyScroll()

      return () => {
        unlockBodyScroll()
      }
    }, [isMounted, open])

    React.useEffect(() => {
      if (!isMounted || !open) return

      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
          event.preventDefault()
          onOpenChange(false)
        }
      }

      document.addEventListener("keydown", handleKeyDown)
      return () => {
        document.removeEventListener("keydown", handleKeyDown)
      }
    }, [isMounted, onOpenChange, open])

    const handlePanelTransitionEnd = React.useCallback(
      (event: React.TransitionEvent<HTMLDivElement>) => {
        if (event.target !== event.currentTarget || event.propertyName !== "transform") {
          return
        }

        if (!open) {
          setIsMounted(false)
        }

        onTransitionEnd?.(event)
      },
      [onTransitionEnd, open]
    )

    if (!isMounted) {
      return null
    }

    return (
      <SheetPortal>
        <div
          className={cn(
            "fixed inset-0 z-50",
            open ? "pointer-events-auto" : "pointer-events-none"
          )}
        >
          <SheetOverlay />
          <div
            ref={ref}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            data-state={open ? "open" : "closed"}
            className={cn(
              "absolute inset-y-0 z-10 flex w-[min(88vw,28rem)] max-w-full flex-col bg-background shadow-xl transition-transform duration-300 ease-out will-change-transform",
              sideClasses[side],
              className
            )}
            onTransitionEnd={handlePanelTransitionEnd}
            {...props}
          >
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="absolute right-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-md bg-background/95 text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>
            <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
          </div>
        </div>
      </SheetPortal>
    )
  }
)
SheetContent.displayName = "SheetContent"

const SheetHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-2 px-6 pt-6", className)} {...props} />
)
SheetHeader.displayName = "SheetHeader"

const SheetFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse px-6 pb-6 sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
SheetFooter.displayName = "SheetFooter"

const SheetTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, id, ...props }, ref) => {
  const { titleId } = useSheetContext("SheetTitle")

  return (
    <h2
      ref={ref}
      id={id ?? titleId}
      className={cn("text-lg font-semibold leading-none tracking-tight", className)}
      {...props}
    />
  )
})
SheetTitle.displayName = "SheetTitle"

const SheetDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, id, ...props }, ref) => {
  const { descriptionId } = useSheetContext("SheetDescription")

  return (
    <p
      ref={ref}
      id={id ?? descriptionId}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
})
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
