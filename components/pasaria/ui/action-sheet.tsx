"use client"

import * as React from "react"
import { Dialog as ActionSheetPrimitive } from "@base-ui/react/dialog"

import { cn } from "@/lib/utils"

const ActionSheetContext = React.createContext<{
  onConfirm?: (flag: boolean) => void;
}>({});

function ActionSheet({ 
  onConfirm, 
  ...props 
}: ActionSheetPrimitive.Root.Props & { 
  onConfirm?: (flag: boolean) => void 
}) {
  return (
    <ActionSheetContext.Provider value={{ onConfirm }}>
      <ActionSheetPrimitive.Root data-slot="action-sheet" {...props} />
    </ActionSheetContext.Provider>
  )
}

function ActionSheetTrigger({ ...props }: ActionSheetPrimitive.Trigger.Props) {
  return <ActionSheetPrimitive.Trigger data-slot="action-sheet-trigger" {...props} />
}

function ActionSheetPortal({ ...props }: ActionSheetPrimitive.Portal.Props) {
  return <ActionSheetPrimitive.Portal data-slot="action-sheet-portal" {...props} />
}

function ActionSheetOverlay({ className, ...props }: ActionSheetPrimitive.Backdrop.Props) {
  return (
    <ActionSheetPrimitive.Backdrop
      data-slot="action-sheet-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-black/40 transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0 supports-backdrop-filter:backdrop-blur-sm",
        className
      )}
      {...props}
    />
  )
}

function ActionSheetContent({
  className,
  children,
  ...props
}: ActionSheetPrimitive.Popup.Props) {
  return (
    <ActionSheetPortal>
      <ActionSheetOverlay />
      <ActionSheetPrimitive.Popup
        data-slot="action-sheet-content"
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 mx-auto mt-24 flex w-full max-w-lg flex-col gap-4 rounded-t-xl bg-background p-6 text-sm text-foreground shadow-xl ring-1 ring-border/50 outline-none transition duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] data-ending-style:translate-y-full data-starting-style:translate-y-full",
          className
        )}
        {...props}
      >
        <div className="absolute top-3 left-1/2 h-1.5 w-12 -translate-x-1/2 rounded-full bg-muted" />
        {children}
      </ActionSheetPrimitive.Popup>
    </ActionSheetPortal>
  )
}

function ActionSheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="action-sheet-header"
      className={cn("mt-2 flex flex-col gap-1.5 text-center sm:text-left", className)}
      {...props}
    />
  )
}

function ActionSheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="action-sheet-footer"
      className={cn("mt-auto flex flex-col gap-2 sm:flex-row sm:justify-end", className)}
      {...props}
    />
  )
}

function ActionSheetTitle({ className, ...props }: ActionSheetPrimitive.Title.Props) {
  return (
    <ActionSheetPrimitive.Title
      data-slot="action-sheet-title"
      className={cn(
        "font-heading text-lg font-semibold tracking-tight",
        className
      )}
      {...props}
    />
  )
}

function ActionSheetDescription({
  className,
  ...props
}: ActionSheetPrimitive.Description.Props) {
  return (
    <ActionSheetPrimitive.Description
      data-slot="action-sheet-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

function ActionSheetClose({ className, ...props }: ActionSheetPrimitive.Close.Props) {
  return (
    <ActionSheetPrimitive.Close
      data-slot="action-sheet-close"
      className={className}
      {...props}
    />
  )
}

function ActionSheetConfirm({
  className,
  onClick,
  ...props
}: ActionSheetPrimitive.Close.Props) {
  const { onConfirm } = React.useContext(ActionSheetContext)

  return (
    <ActionSheetPrimitive.Close
      data-slot="action-sheet-confirm"
      className={className}
      onClick={(e) => {
        if (onConfirm) {
          onConfirm(true)
        }
        if (onClick) {
          onClick(e)
        }
      }}
      {...props}
    />
  )
}

export {
  ActionSheet,
  ActionSheetTrigger,
  ActionSheetPortal,
  ActionSheetOverlay,
  ActionSheetContent,
  ActionSheetHeader,
  ActionSheetFooter,
  ActionSheetTitle,
  ActionSheetDescription,
  ActionSheetClose,
  ActionSheetConfirm,
}
