import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog'
import * as React from 'react'

import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * Renders the Radix AlertDialog root with a data-slot attribute and forwards all props.
 *
 * @param props - Props forwarded to AlertDialogPrimitive.Root
 * @returns A React element representing the AlertDialog root
 *
 * @example
 * <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
 *   <AlertDialogTrigger>Open</AlertDialogTrigger>
 *   <AlertDialogContent>...</AlertDialogContent>
 * </AlertDialog>
 */
function AlertDialog({
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Root>) {
  return <AlertDialogPrimitive.Root data-slot="alert-dialog" {...props} />
}

/**
 * Renders an AlertDialog trigger element that forwards all received props and sets a data-slot for theming/slotting.
 *
 * @param props - Props forwarded to the underlying Radix AlertDialog Trigger component
 *
 * @example
 * <AlertDialog>
 *   <AlertDialogTrigger>Open</AlertDialogTrigger>
 *   <AlertDialogContent>...</AlertDialogContent>
 * </AlertDialog>
 */
function AlertDialogTrigger({
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Trigger>) {
  return (
    <AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...props} />
  )
}

/**
 * Wraps the Radix AlertDialog Portal and applies a consistent `data-slot` attribute while forwarding all props.
 *
 * @param props - Props forwarded to the underlying Radix `AlertDialogPrimitive.Portal`
 * @returns A Portal element that renders children into a portal with `data-slot="alert-dialog-portal"`
 */
function AlertDialogPortal({
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Portal>) {
  return (
    <AlertDialogPrimitive.Portal data-slot="alert-dialog-portal" {...props} />
  )
}

/**
 * Renders the AlertDialog overlay with a dimmed backdrop and entry/exit animations.
 *
 * @param className - Additional CSS classes to merge with the component's default classes
 * @param props - Additional props passed through to Radix's Overlay primitive
 * @returns The rendered AlertDialog overlay element
 *
 * @example
 * <AlertDialogOverlay className="backdrop-blur-sm" />
 */
function AlertDialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Overlay>) {
  return (
    <AlertDialogPrimitive.Overlay
      data-slot="alert-dialog-overlay"
      className={cn(
        'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50',
        className
      )}
      {...props}
    />
  )
}

/**
 * Renders the alert dialog's content within a portal, including the overlay and standardized layout/styling.
 *
 * @param className - Additional class names to merge with the component's default styling.
 * @param props - Remaining props are forwarded to Radix's AlertDialog.Content.
 * @returns The AlertDialog content element with overlay and portal applied.
 *
 * @example
 * <AlertDialogContent className="w-96">
 *   <AlertDialogTitle>Delete item</AlertDialogTitle>
 *   <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
 *   <AlertDialogFooter>...</AlertDialogFooter>
 * </AlertDialogContent>
 */
function AlertDialogContent({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Content>) {
  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <AlertDialogPrimitive.Content
        data-slot="alert-dialog-content"
        className={cn(
          'bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg',
          className
        )}
        {...props}
      />
    </AlertDialogPortal>
  )
}

/**
 * Renders the header container for an alert dialog.
 *
 * Renders a <div> with the `data-slot="alert-dialog-header"` attribute and default layout
 * classes for vertical spacing and responsive text alignment. Any `className` provided is
 * merged with the defaults and all other props are forwarded to the underlying div.
 *
 * @param className - Additional CSS classes to append to the default header classes
 * @param props - Other attributes and event handlers for the container div
 *
 * @example
 * <AlertDialogHeader className="pb-2">
 *   <AlertDialogTitle>Delete item</AlertDialogTitle>
 * </AlertDialogHeader>
 */
function AlertDialogHeader({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-dialog-header"
      className={cn('flex flex-col gap-2 text-center sm:text-left', className)}
      {...props}
    />
  )
}

/**
 * Renders the AlertDialog footer container with responsive layout for actions.
 *
 * The footer stacks buttons vertically on small screens (reversed order) and
 * displays them in a right-aligned horizontal row on larger screens.
 *
 * @param className - Additional CSS classes to apply to the footer container.
 * @param props - Additional `div` attributes forwarded to the container.
 * @returns The footer `div` element for use inside an `AlertDialog` content.
 *
 * @example
 * <AlertDialogFooter className="mt-4">
 *   <AlertDialogCancel>Cancel</AlertDialogCancel>
 *   <AlertDialogAction>Confirm</AlertDialogAction>
 * </AlertDialogFooter>
 */
function AlertDialogFooter({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-dialog-footer"
      className={cn(
        'flex flex-col-reverse gap-2 sm:flex-row sm:justify-end',
        className
      )}
      {...props}
    />
  )
}

/**
 * Render a styled alert dialog title with a `data-slot` attribute.
 *
 * @param className - Additional CSS classes to append to the default title styles.
 * @param props - Additional props forwarded to the underlying Radix `AlertDialogPrimitive.Title`.
 * @returns The rendered AlertDialog title element.
 *
 * @example
 * <AlertDialogTitle>Delete item</AlertDialogTitle>
 */
function AlertDialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Title>) {
  return (
    <AlertDialogPrimitive.Title
      data-slot="alert-dialog-title"
      className={cn('text-lg font-semibold', className)}
      {...props}
    />
  )
}

/**
 * Renders the alert dialog description element with consistent styling and a data-slot attribute.
 *
 * @param className - Additional class names to merge with the default description styles
 * @param props - Additional props forwarded to Radix's AlertDialog Description primitive
 * @returns The rendered AlertDialog description element
 *
 * @example
 * <AlertDialogDescription className="mt-2">
 *   This action cannot be undone.
 * </AlertDialogDescription>
 */
function AlertDialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Description>) {
  return (
    <AlertDialogPrimitive.Description
      data-slot="alert-dialog-description"
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  )
}

/**
 * Renders a styled AlertDialog action button wired to Radix's Action primitive.
 *
 * @param className - Additional CSS classes to apply to the action button
 * @param props - All other props are forwarded to the underlying Radix `AlertDialogPrimitive.Action` component
 * @returns A React element that renders an actionable button within an AlertDialog, combining `buttonVariants` styles with any provided `className`
 *
 * @example
 * <AlertDialogAction onClick={handleConfirm}>Confirm</AlertDialogAction>
 */
function AlertDialogAction({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Action>) {
  return (
    <AlertDialogPrimitive.Action
      data-slot="alert-dialog-action"
      className={cn(buttonVariants(), className)}
      {...props}
    />
  )
}

/**
 * Renders a cancel button for an alert dialog with outline styling and slot metadata.
 *
 * @param className - Additional CSS class names to apply to the button.
 * @param props - All other props are forwarded to the underlying Radix `AlertDialogPrimitive.Cancel` component.
 * @returns A `Cancel` button element with outlined button styles and `data-slot="alert-dialog-cancel"`.
 *
 * @example
 * <AlertDialog>
 *   <AlertDialogTrigger>Open</AlertDialogTrigger>
 *   <AlertDialogContent>
 *     <AlertDialogHeader>
 *       <AlertDialogTitle>Confirm</AlertDialogTitle>
 *     </AlertDialogHeader>
 *     <AlertDialogFooter>
 *       <AlertDialogCancel onClick={handleCancel}>Cancel</AlertDialogCancel>
 *       <AlertDialogAction onClick={handleConfirm}>Confirm</AlertDialogAction>
 *     </AlertDialogFooter>
 *   </AlertDialogContent>
 * </AlertDialog>
 */
function AlertDialogCancel({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Cancel>) {
  return (
    <AlertDialogPrimitive.Cancel
      data-slot="alert-dialog-cancel"
      className={cn(buttonVariants({ variant: 'outline' }), className)}
      {...props}
    />
  )
}

export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel
}