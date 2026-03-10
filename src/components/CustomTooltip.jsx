import { useState } from 'react'
import {
  useFloating,
  useHover,
  useFocus,
  useInteractions,
  FloatingPortal,
  autoUpdate,
  flip,
  shift,
  offset,
} from '@floating-ui/react'

/**
 * Reusable tooltip built on @floating-ui/react.
 * Demonstrates what "under the hood" libraries like Shepherd.js use.
 *
 * Props:
 *   children  — the reference element (trigger)
 *   content   — string | ReactNode shown inside the tooltip
 *   placement — 'top' | 'bottom' | 'left' | 'right' (default 'right')
 */
export default function CustomTooltip({ children, content, placement = 'right' }) {
  const [isOpen, setIsOpen] = useState(false)

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement,
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(8),
      flip({ fallbackAxisSideDirection: 'start' }),
      shift({ padding: 8 }),
    ],
  })

  const hover = useHover(context, { move: false })
  const focus = useFocus(context)
  const { getReferenceProps, getFloatingProps } = useInteractions([hover, focus])

  return (
    <>
      <span ref={refs.setReference} {...getReferenceProps()} className="inline-flex">
        {children}
      </span>

      {isOpen && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            {...getFloatingProps()}
            className="z-50 max-w-xs bg-gray-900 text-white text-xs leading-relaxed rounded-lg px-3 py-2 shadow-xl pointer-events-none"
          >
            {content}
          </div>
        </FloatingPortal>
      )}
    </>
  )
}
