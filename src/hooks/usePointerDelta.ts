import { useRef, type PointerEvent } from 'react'

export function usePointerDelta(onDelta: (dx: number, dy: number) => void) {
  const last = useRef<{ x: number; y: number } | null>(null)

  return {
    onPointerDown: (event: PointerEvent<HTMLElement>) => {
      event.preventDefault()
      event.currentTarget.setPointerCapture(event.pointerId)
      last.current = { x: event.clientX, y: event.clientY }
    },
    onPointerMove: (event: PointerEvent<HTMLElement>) => {
      if (!last.current || !event.currentTarget.hasPointerCapture(event.pointerId)) return
      onDelta(event.clientX - last.current.x, event.clientY - last.current.y)
      last.current = { x: event.clientX, y: event.clientY }
    },
    onPointerUp: (event: PointerEvent<HTMLElement>) => {
      last.current = null
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId)
      }
    },
  }
}
