import React, { RefObject, useState } from "react"

export function useRefDimensions(ref: RefObject<HTMLElement | null>) {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  React.useEffect(() => {
    function handleResize() {
      if (ref.current) {
        const { current } = ref
        const boundingRect = current.getBoundingClientRect()
        const { width, height } = boundingRect
        setDimensions({ width: Math.round(width), height: Math.round(height) })
      }
    }
    handleResize()
    window.addEventListener("resize", handleResize)
    return () => {
        window.removeEventListener("resize", handleResize)
    }
  }, [ref])
  return dimensions
} 