'use client'

import React, { useState, useCallback, useRef } from 'react'
import { X } from 'lucide-react'

export interface SimpleTextElement {
  id: string
  type: 'text'
  text: string
  position: { x: number; y: number }
  width?: number
  height?: number
  fontSize: number
  fontFamily: string
  color: string
  fontWeight: 'normal' | 'bold'
  textAlign: 'left' | 'center' | 'right'
  // Dynamic text metadata
  isDynamic?: boolean
  dynamicType?: 'user_name' | 'event_name'
}

export interface SimpleSignatureElement {
  id: string
  type: 'signature'
  position: { x: number; y: number }
  width: number
  height: number
  signatureData: string // Base64 image data
  label?: string // Optional label like "Director", "Manager", etc.
}

export type SimpleElement = SimpleTextElement | SimpleSignatureElement

export interface SimpleElementEditorProps {
  elements: SimpleElement[]
  onElementsChange: (elements: SimpleElement[]) => void
  canvasWidth: number
  canvasHeight: number
  onOpenSignatureModal?: (element: SimpleSignatureElement) => void
  onElementSelect?: (element: SimpleElement) => void
}

export const SimpleElementEditor: React.FC<SimpleElementEditorProps> = ({
  elements,
  onElementsChange,
  canvasWidth,
  canvasHeight,
  onOpenSignatureModal,
  onElementSelect
}) => {
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [resizeHandle, setResizeHandle] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [hoveredElementId, setHoveredElementId] = useState<string | null>(null)
  const [showGrid, setShowGrid] = useState(true)
  const [snapToGrid, setSnapToGrid] = useState(true)
  const gridSize = 20

  const canvasRef = useRef<HTMLDivElement>(null)
  const lastUpdateRef = useRef<number>(0)
  const containerRef = useRef<HTMLDivElement>(null)

  // Animation ref for smooth updates
  const animationRef = useRef<number | null>(null)
  const startTimeRef = useRef<number>(0)
  const startDimensionsRef = useRef<{ width: number; height: number; fontSize: number } | null>(null)

  const handleElementClick = (elementId: string) => {
    setSelectedElementId(elementId)
    const element = elements.find(el => el.id === elementId)
    if (element && onElementSelect) {
      onElementSelect(element)
    }
  }

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setSelectedElementId(null)
    }
  }

  // Keyboard controls
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedElementId) return

      // Delete element
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const newElements = elements.filter(el => el.id !== selectedElementId)
        onElementsChange(newElements)
        setSelectedElementId(null)
        return
      }

      // Move element with arrows
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault()
        const element = elements.find(el => el.id === selectedElementId)
        if (!element) return

        const step = e.shiftKey ? 10 : 1
        let newX = element.position.x
        let newY = element.position.y

        switch (e.key) {
          case 'ArrowUp': newY -= step; break
          case 'ArrowDown': newY += step; break
          case 'ArrowLeft': newX -= step; break
          case 'ArrowRight': newX += step; break
        }

        // Constrain to canvas
        newX = Math.max(0, Math.min(canvasWidth - (element.width || 0), newX))
        newY = Math.max(0, Math.min(canvasHeight - (element.height || 0), newY))

        onElementsChange(elements.map(el =>
          el.id === selectedElementId ? { ...el, position: { x: newX, y: newY } } : el
        ))
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedElementId, elements, onElementsChange, canvasWidth, canvasHeight])

  const handleElementMouseDown = (e: React.MouseEvent, elementId: string) => {
    e.preventDefault()
    e.stopPropagation()

    const element = elements.find(el => el.id === elementId)
    if (!element || !canvasRef.current) return

    const canvasRect = canvasRef.current.getBoundingClientRect()
    const offsetX = e.clientX - canvasRect.left - (element.position?.x || 0)
    const offsetY = e.clientY - canvasRect.top - (element.position?.y || 0)

    setDragOffset({ x: offsetX, y: offsetY })
    setIsDragging(true)
    setSelectedElementId(elementId)

    // Select element immediately
    if (onElementSelect) onElementSelect(element)
  }

  const handleResizeMouseDown = (e: React.MouseEvent, elementId: string, handle: string) => {
    e.preventDefault()
    e.stopPropagation()

    // Store initial dimensions for smooth scaling
    const element = elements.find(el => el.id === elementId)
    if (element) {
      startDimensionsRef.current = {
        width: element.width || 100,
        height: element.height || 50,
        fontSize: element.type === 'text' ? (element as SimpleTextElement).fontSize : 16
      }
    }

    setResizeHandle(handle)
    setIsResizing(true)
    setSelectedElementId(elementId)
    startTimeRef.current = performance.now()
  }

  // Smooth update loop with RAF
  const smoothUpdate = useCallback((e: MouseEvent) => {
    if (!canvasRef.current) return

    const currentTime = performance.now()
    const deltaTime = currentTime - lastUpdateRef.current

    // Throttle updates for better performance (8ms = ~120fps)
    if (deltaTime < 8) return
    lastUpdateRef.current = currentTime

    const canvasRect = canvasRef.current.getBoundingClientRect()
    const mouseX = e.clientX - canvasRect.left
    const mouseY = e.clientY - canvasRect.top

    if (isDragging && selectedElementId) {
      let newX = mouseX - dragOffset.x
      let newY = mouseY - dragOffset.y

      // Snap to grid
      if (snapToGrid) {
        newX = Math.round(newX / gridSize) * gridSize
        newY = Math.round(newY / gridSize) * gridSize
      }

      // Constrain to canvas bounds
      const constrainedX = Math.max(0, Math.min(canvasWidth - 50, newX))
      const constrainedY = Math.max(0, Math.min(canvasHeight - 30, newY))

      onElementsChange(elements.map(el =>
        el.id === selectedElementId
          ? { ...el, position: { x: constrainedX, y: constrainedY } }
          : el
      ))
    } else if (isResizing && selectedElementId && resizeHandle) {
      const element = elements.find(el => el.id === selectedElementId)
      if (!element) return

      // Resize both text and signature elements
      if (element.type === 'text' || element.type === 'signature') {
        const currentWidth = element.width || 100
        const currentHeight = element.height || 50
        let newWidth = currentWidth
        let newHeight = currentHeight

        // Calculate new dimensions based on resize handle
        switch (resizeHandle) {
          case 'se': // Southeast (bottom-right)
            newWidth = Math.max(50, mouseX - (element.position?.x || 0))
            newHeight = Math.max(30, mouseY - (element.position?.y || 0))
            break
          case 'sw': // Southwest (bottom-left)
            newWidth = Math.max(50, (element.position?.x || 0) + currentWidth - mouseX)
            newHeight = Math.max(30, mouseY - (element.position?.y || 0))
            break
          case 'ne': // Northeast (top-right)
            newWidth = Math.max(50, mouseX - (element.position?.x || 0))
            newHeight = Math.max(30, (element.position?.y || 0) + currentHeight - mouseY)
            break
          case 'nw': // Northwest (top-left)
            newWidth = Math.max(50, (element.position?.x || 0) + currentWidth - mouseX)
            newHeight = Math.max(30, (element.position?.y || 0) + currentHeight - mouseY)
            break
          case 'e': // East (right side)
            newWidth = Math.max(50, mouseX - (element.position?.x || 0))
            break
          case 'w': // West (left side)
            newWidth = Math.max(50, (element.position?.x || 0) + currentWidth - mouseX)
            break
          case 'n': // North (top side)
            newHeight = Math.max(30, (element.position?.y || 0) + currentHeight - mouseY)
            break
          case 's': // South (bottom side)
            newHeight = Math.max(30, mouseY - (element.position?.y || 0))
            break
        }

        // Snap dimensions to grid if enabled
        if (snapToGrid) {
          newWidth = Math.round(newWidth / gridSize) * gridSize
          newHeight = Math.round(newHeight / gridSize) * gridSize
        }

        // Constrain to canvas bounds
        newWidth = Math.min(newWidth, canvasWidth - (element.position?.x || 0))
        newHeight = Math.min(newHeight, canvasHeight - (element.position?.y || 0))

        // Enhanced font scaling - ONLY for corner handles, NOT side handles
        let newFontSize = 16
        if (element.type === 'text' && startDimensionsRef.current) {
          const textElement = element as SimpleTextElement
          const cornerHandles = ['se', 'sw', 'ne', 'nw']

          if (cornerHandles.includes(resizeHandle)) {
            // Calculate scaling factors
            const widthFactor = newWidth / startDimensionsRef.current.width
            const heightFactor = newHeight / startDimensionsRef.current.height

            // Use average factor for smoother scaling
            const avgFactor = (widthFactor + heightFactor) / 2

            // Apply scaling to original font size
            const startFontSize = startDimensionsRef.current.fontSize
            const calculatedFontSize = startFontSize * avgFactor

            // Limit between 8px - 120px
            newFontSize = Math.max(8, Math.min(120, Math.round(calculatedFontSize)))
          } else {
            // For side handles (w, e, n, s), keep original font size
            newFontSize = textElement.fontSize
          }
        }

        onElementsChange(elements.map(el =>
          el.id === selectedElementId
            ? {
              ...el,
              width: newWidth,
              height: newHeight,
              ...(element.type === 'text' ? { fontSize: newFontSize } : {})
            }
            : el
        ))
      }
    }
  }, [isDragging, isResizing, selectedElementId, resizeHandle, dragOffset, elements, onElementsChange, canvasWidth, canvasHeight, snapToGrid])

  // Main mouse move handler
  const handleMouseMove = useCallback((e: MouseEvent) => {
    smoothUpdate(e)
  }, [smoothUpdate])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setIsResizing(false)
    setResizeHandle(null)
    startDimensionsRef.current = null

    // Cancel any pending animation frame
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }
  }, [])

  React.useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp])

  // Cleanup animation frame on unmount
  React.useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  const addTextElement = () => {
    const newElement: SimpleTextElement = {
      id: `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'text',
      text: 'New Text',
      position: { x: canvasWidth / 2, y: canvasHeight / 2 },
      fontSize: 24,
      fontFamily: 'Ephesis', // Default to elegant font
      color: '#000000',
      fontWeight: 'normal',
      textAlign: 'center'
    }
    onElementsChange([...elements, newElement])
    setSelectedElementId(newElement.id)
  }

  const updateElement = (elementId: string, updates: Partial<SimpleElement>) => {
    onElementsChange(elements.map(el =>
      el.id === elementId ? { ...el, ...updates } as SimpleElement : el
    ))
  }

  const alignElement = (alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    if (!selectedElementId) return
    const element = elements.find(el => el.id === selectedElementId)
    if (!element) return

    let newX = element.position.x
    let newY = element.position.y

    switch (alignment) {
      case 'left': newX = 0; break
      case 'center': newX = (canvasWidth - (element.width || 0)) / 2; break
      case 'right': newX = canvasWidth - (element.width || 0); break
      case 'top': newY = 0; break
      case 'middle': newY = (canvasHeight - (element.height || 0)) / 2; break
      case 'bottom': newY = canvasHeight - (element.height || 0); break
    }

    onElementsChange(elements.map(el =>
      el.id === selectedElementId ? { ...el, position: { x: newX, y: newY } } : el
    ))
  }

  const changeLayer = (action: 'front' | 'back' | 'forward' | 'backward') => {
    if (!selectedElementId) return
    const index = elements.findIndex(el => el.id === selectedElementId)
    if (index === -1) return

    const newElements = [...elements]
    const element = newElements[index]

    newElements.splice(index, 1)

    switch (action) {
      case 'front': newElements.push(element); break
      case 'back': newElements.unshift(element); break
      case 'forward': newElements.splice(Math.min(newElements.length, index + 1), 0, element); break
      case 'backward': newElements.splice(Math.max(0, index - 1), 0, element); break
    }

    onElementsChange(newElements)
  }

  const deleteElement = (elementId: string) => {
    onElementsChange(elements.filter(el => el.id !== elementId))
    if (selectedElementId === elementId) {
      setSelectedElementId(null)
    }
  }

  const selectedElement = elements.find(el => el.id === selectedElementId)


  return (
    <div className="simple-element-editor flex flex-col gap-4" ref={containerRef}>
      {/* Toolbar */}
      <div className="flex items-center justify-between bg-white p-2 rounded-lg shadow-sm border border-gray-200 flex-wrap gap-2">
        <div className="flex items-center gap-2 border-r pr-2">
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`p-2 rounded hover:bg-gray-100 ${showGrid ? 'bg-blue-50 text-blue-600' : 'text-gray-600'}`}
            title="Toggle Grid"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="3" y1="15" x2="21" y2="15"></line><line x1="9" y1="3" x2="9" y2="21"></line><line x1="15" y1="3" x2="15" y2="21"></line></svg>
          </button>
          <button
            onClick={() => setSnapToGrid(!snapToGrid)}
            className={`p-2 rounded hover:bg-gray-100 ${snapToGrid ? 'bg-blue-50 text-blue-600' : 'text-gray-600'}`}
            title="Snap to Grid"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5"></path><path d="M16 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"></path><path d="M8 16a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"></path></svg>
          </button>
        </div>

        {selectedElementId && (
          <>
            <div className="flex items-center gap-1 border-r pr-2">
              <button onClick={() => alignElement('left')} className="p-2 rounded hover:bg-gray-100 text-gray-600" title="Align Left">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="21" y1="6" x2="3" y2="6"></line><line x1="15" y1="12" x2="3" y2="12"></line><line x1="17" y1="18" x2="3" y2="18"></line></svg>
              </button>
              <button onClick={() => alignElement('center')} className="p-2 rounded hover:bg-gray-100 text-gray-600" title="Align Center">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="10" x2="6" y2="10"></line><line x1="21" y1="6" x2="3" y2="6"></line><line x1="21" y1="14" x2="3" y2="14"></line><line x1="18" y1="18" x2="6" y2="18"></line></svg>
              </button>
              <button onClick={() => alignElement('right')} className="p-2 rounded hover:bg-gray-100 text-gray-600" title="Align Right">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="21" y1="6" x2="3" y2="6"></line><line x1="21" y1="12" x2="9" y2="12"></line><line x1="21" y1="18" x2="7" y2="18"></line></svg>
              </button>
            </div>

            <div className="flex items-center gap-1 border-r pr-2">
              <button onClick={() => changeLayer('front')} className="p-2 rounded hover:bg-gray-100 text-gray-600" title="Bring to Front">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="2" ry="2"></rect><path d="M12 16v-8"></path><path d="M8 12l4-4 4 4"></path></svg>
              </button>
              <button onClick={() => changeLayer('back')} className="p-2 rounded hover:bg-gray-100 text-gray-600" title="Send to Back">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="2" ry="2"></rect><path d="M12 8v8"></path><path d="M8 12l4 4 4-4"></path></svg>
              </button>
            </div>
          </>
        )}

        <div className="text-xs text-gray-500 ml-auto">
          {selectedElement ? (selectedElement.type === 'text' ? (selectedElement as SimpleTextElement).text.substring(0, 15) + '...' : 'Signature') : 'No selection'}
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={canvasRef}
        className="element-canvas"
        onClick={handleCanvasClick}
        style={{
          width: canvasWidth,
          height: canvasHeight,
          position: 'relative',
          border: '2px solid #e5e7eb',
          borderRadius: '8px',
          background: 'transparent',
          overflow: 'hidden'
        }}
      >
        {/* Render Elements */}
        {elements.filter(element => element.position).map(element => {
          const isSelected = selectedElementId === element.id
          const isHovered = hoveredElementId === element.id

          return (
            <div
              key={element.id}
              className={`absolute group cursor-move select-none ${isSelected ? 'z-20' : 'z-10'}`}
              style={{
                left: element.position.x,
                top: element.position.y,
                width: element.width,
                height: element.height,
              }}
              onMouseDown={(e) => handleElementMouseDown(e, element.id)}
              onMouseEnter={() => setHoveredElementId(element.id)}
              onMouseLeave={() => setHoveredElementId(null)}
              onClick={(e) => {
                e.stopPropagation()
                handleElementClick(element.id)
              }}
            >
              {/* Selection Border & Hover Effect */}
              <div className={`w-full h-full relative transition-all duration-200 ${isSelected
                  ? 'ring-2 ring-blue-500 ring-offset-1'
                  : 'hover:ring-1 hover:ring-blue-300 hover:ring-dashed'
                }`}>

                {/* Element Content */}
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: element.type === 'text' ? (element as SimpleTextElement).textAlign : 'center',
                    overflow: 'hidden',
                    fontFamily: element.type === 'text' ? (element as SimpleTextElement).fontFamily : undefined,
                    fontSize: element.type === 'text' ? `${(element as SimpleTextElement).fontSize}px` : undefined,
                    fontWeight: element.type === 'text' ? (element as SimpleTextElement).fontWeight : undefined,
                    color: element.type === 'text' ? (element as SimpleTextElement).color : undefined,
                  }}
                >
                  {element.type === 'text' ? (
                    (element as SimpleTextElement).text
                  ) : (
                    (element as SimpleSignatureElement).signatureData ? (
                      <img
                        src={(element as SimpleSignatureElement).signatureData}
                        alt="Signature"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-full h-full border-2 border-dashed border-gray-300 rounded flex items-center justify-center text-gray-400 text-xs">
                        Signature
                      </div>
                    )
                  )}
                </div>

                {/* Delete Button (on hover or select) */}
                {(isSelected || isHovered) && (
                  <button
                    className="absolute -top-3 -right-3 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-red-600 transition-colors z-30"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteElement(element.id)
                    }}
                  >
                    <X size={12} />
                  </button>
                )}

                {/* Resize Handles (only when selected) */}
                {isSelected && (
                  <>
                    {/* Corners */}
                    <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-blue-500 rounded-full cursor-nw-resize z-30" onMouseDown={(e) => handleResizeMouseDown(e, element.id, 'nw')} />
                    <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-blue-500 rounded-full cursor-ne-resize z-30" onMouseDown={(e) => handleResizeMouseDown(e, element.id, 'ne')} />
                    <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-blue-500 rounded-full cursor-sw-resize z-30" onMouseDown={(e) => handleResizeMouseDown(e, element.id, 'sw')} />
                    <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-blue-500 rounded-full cursor-se-resize z-30" onMouseDown={(e) => handleResizeMouseDown(e, element.id, 'se')} />
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Element Properties - Only show when element is selected */}
      {selectedElement && (
        <div className="element-properties mt-4 bg-gray-50 p-4 rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-gray-900">
              Edit {selectedElement.type === 'text' ? 'Text' : 'Signature'} Element
            </h4>
            {selectedElement.type === 'text' && selectedElement.isDynamic && (
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                Dynamic Text
              </span>
            )}
            {selectedElement.type === 'signature' && (
              <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full font-medium">
                ✍️ Signature
              </span>
            )}
          </div>

          {/* Text Element Properties */}
          {selectedElement.type === 'text' && (
            <>
              {/* Text */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Text:</label>
                {selectedElement.isDynamic ? (
                  <div className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-100 text-gray-600">
                    {selectedElement.text}
                    <div className="text-xs text-gray-500 mt-1">
                      {selectedElement.dynamicType === 'user_name'
                        ? 'Dynamic: Will be replaced with participant name'
                        : 'Dynamic: Will be replaced with event name'
                      }
                    </div>
                  </div>
                ) : (
                  <input
                    type="text"
                    value={selectedElement.text}
                    onChange={(e) => updateElement(selectedElement.id, { text: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                )}
              </div>
            </>
          )}

          {/* Signature Element Properties */}
          {selectedElement.type === 'signature' && (
            <>
              {/* Signature Label */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Label (optional):</label>
                <input
                  type="text"
                  value={selectedElement.label || ''}
                  onChange={(e) => updateElement(selectedElement.id, { label: e.target.value })}
                  placeholder="e.g., Director, Manager, etc."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>

              {/* Signature Actions */}
              <div className="space-y-2">
                <button
                  onClick={() => {
                    if (onOpenSignatureModal) {
                      onOpenSignatureModal(selectedElement)
                    }
                  }}
                  className="w-full px-3 py-2 bg-purple-500 text-white rounded-md text-sm hover:bg-purple-600 transition-colors font-medium"
                >
                  ✍️ Draw Signature
                </button>

                {selectedElement.signatureData && (
                  <button
                    onClick={() => updateElement(selectedElement.id, { signatureData: '' })}
                    className="w-full px-3 py-2 bg-red-500 text-white rounded-md text-sm hover:bg-red-600 transition-colors font-medium"
                  >
                    🗑️ Clear Signature
                  </button>
                )}
              </div>
            </>
          )}

          {/* Text-specific properties */}
          {selectedElement.type === 'text' && (
            <>
              {/* Font Family */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Font Style:</label>
                <select
                  value={selectedElement.fontFamily}
                  onChange={(e) => updateElement(selectedElement.id, { fontFamily: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <optgroup label="Standard Fonts">
                    <option value="Arial">Arial (Standard)</option>
                    <option value="Georgia">Georgia (Serif)</option>
                    <option value="Times New Roman">Times New Roman (Classic)</option>
                    <option value="Inter">Inter (Modern)</option>
                    <option value="Helvetica">Helvetica (Clean)</option>
                  </optgroup>
                  <optgroup label="Cursive/Script Fonts">
                    <option value="Brush Script MT">Brush Script MT (Handwriting)</option>
                    <option value="Lucida Handwriting">Lucida Handwriting (Script)</option>
                    <option value="Bradley Hand">Bradley Hand (Cursive)</option>
                    <option value="Edwardian Script ITC">Edwardian Script (Elegant)</option>
                    <option value="French Script MT">French Script MT (Classic)</option>
                    <option value="Kunstler Script">Kunstler Script (Fancy)</option>
                    <option value="Monotype Corsiva">Monotype Corsiva (Italic)</option>
                    <option value="Script MT Bold">Script MT (Bold)</option>
                    <option value="Comic Sans MS">Comic Sans MS (Casual)</option>
                    <option value="Chalkduster">Chalkduster (Chalk Style)</option>
                    <option value="Marker Felt">Marker Felt (Marker Style)</option>
                    <option value="Papyrus">Papyrus (Ancient)</option>
                    <option value="Trattatello">Trattatello (Elegant)</option>
                    <option value="Apple Chancery">Apple Chancery (Formal Script)</option>
                    <option value="Snell Roundhand">Snell Roundhand (Calligraphy)</option>
                    <option value="Segoe Script">Segoe Script (Modern Script)</option>
                    <option value="Segoe Print">Segoe Print (Print Style)</option>
                    <option value="Freestyle Script">Freestyle Script (Freehand)</option>
                  </optgroup>
                  <optgroup label="Google Cursive Fonts">
                    <option value="Ephesis">Ephesis (Elegant)</option>
                    <option value="Dancing Script">Dancing Script (Handwriting)</option>
                    <option value="Great Vibes">Great Vibes (Calligraphy)</option>
                    <option value="Allura">Allura (Script)</option>
                    <option value="Alex Brush">Alex Brush (Brush)</option>
                    <option value="Berkshire Swash">Berkshire Swash (Swash)</option>
                    <option value="Caveat">Caveat (Handwriting)</option>
                    <option value="Kalam">Kalam (Handwriting)</option>
                    <option value="Pacifico">Pacifico (Casual)</option>
                    <option value="Satisfy">Satisfy (Script)</option>
                    <option value="Yellowtail">Yellowtail (Brush)</option>
                    <option value="Amatic SC">Amatic SC (Handwriting)</option>
                    <option value="Indie Flower">Indie Flower (Casual)</option>
                    <option value="Lobster">Lobster (Display)</option>
                    <option value="Righteous">Righteous (Display)</option>
                    <option value="Shadows Into Light">Shadows Into Light (Handwriting)</option>
                    <option value="Special Elite">Special Elite (Typewriter)</option>
                  </optgroup>
                </select>
              </div>

              {/* Font Size */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Font Size:
                  <span className="text-xs text-gray-500 ml-1">(Auto-scales with corner resize only)</span>
                </label>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="8"
                    max="120"
                    value={selectedElement.fontSize}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    onChange={(e) => updateElement(selectedElement.id, { fontSize: parseInt(e.target.value) || 16 })}
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>8px</span>
                    <span className="font-medium text-blue-600">{selectedElement.fontSize}px</span>
                    <span>120px</span>
                  </div>
                  <input
                    type="number"
                    min="8"
                    max="120"
                    value={selectedElement.fontSize}
                    onChange={(e) => updateElement(selectedElement.id, { fontSize: parseInt(e.target.value) || 16 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
              </div>

              {/* Size Controls */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Width:</label>
                  <input
                    type="number"
                    min="50"
                    max="400"
                    value={selectedElement.width || 100}
                    onChange={(e) => updateElement(selectedElement.id, { width: parseInt(e.target.value) || 100 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Height:</label>
                  <input
                    type="number"
                    min="30"
                    max="200"
                    value={selectedElement.height || 50}
                    onChange={(e) => updateElement(selectedElement.id, { height: parseInt(e.target.value) || 50 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
              </div>

              {/* Font Size Info */}
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-blue-800">📏 Auto Scaling:</span>
                  <span className="text-sm text-blue-600">
                    Font size: {selectedElement.fontSize}px
                  </span>
                </div>
                <p className="text-xs text-blue-600 mt-1">
                  Font size automatically adjusts ONLY when resizing from corners, not from sides.
                </p>
                <div className="mt-2 text-xs text-blue-500">
                  <div>• Corner handles (⚪): Font scales with resize</div>
                  <div>• Side handles (▬): Font size stays the same</div>
                  <div>• Use corners to scale text proportionally</div>
                </div>
              </div>

              {/* Color */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Color:</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={selectedElement.color}
                    onChange={(e) => updateElement(selectedElement.id, { color: e.target.value })}
                    className="w-12 h-8 border border-gray-300 rounded"
                  />
                  <input
                    type="text"
                    value={selectedElement.color}
                    onChange={(e) => updateElement(selectedElement.id, { color: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
              </div>

              {/* Font Weight */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Font Weight:</label>
                <select
                  value={selectedElement.fontWeight}
                  onChange={(e) => updateElement(selectedElement.id, { fontWeight: e.target.value as 'normal' | 'bold' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="normal">Normal</option>
                  <option value="bold">Bold</option>
                </select>
              </div>

              {/* Text Align */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Text Align:</label>
                <div className="flex gap-2">
                  {(['left', 'center', 'right'] as const).map(align => (
                    <button
                      key={align}
                      onClick={() => updateElement(selectedElement.id, { textAlign: align })}
                      className={`px-3 py-1 text-sm rounded ${selectedElement.textAlign === align
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                    >
                      {align.charAt(0).toUpperCase() + align.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Signature-specific properties */}
          {selectedElement.type === 'signature' && (
            <>
              {/* Size */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Width:</label>
                  <input
                    type="number"
                    min="50"
                    max="300"
                    value={selectedElement.width}
                    onChange={(e) => updateElement(selectedElement.id, { width: parseInt(e.target.value) || 150 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Height:</label>
                  <input
                    type="number"
                    min="30"
                    max="100"
                    value={selectedElement.height}
                    onChange={(e) => updateElement(selectedElement.id, { height: parseInt(e.target.value) || 60 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
              </div>
            </>
          )}

          {/* Position */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">X:</label>
              <input
                type="number"
                min="0"
                max={canvasWidth}
                value={selectedElement.position?.x || 0}
                onChange={(e) => updateElement(selectedElement.id, { position: { x: parseInt(e.target.value) || 0, y: selectedElement.position?.y || 0 } })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Y:</label>
              <input
                type="number"
                min="0"
                max={canvasHeight}
                value={selectedElement.position?.y || 0}
                onChange={(e) => updateElement(selectedElement.id, { position: { x: selectedElement.position?.x || 0, y: parseInt(e.target.value) || 0 } })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
          </div>

          {/* Delete */}
          <button
            onClick={() => deleteElement(selectedElement.id)}
            className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium text-sm"
          >
            🗑️ Delete Element
          </button>
        </div>
      )}
    </div>
  )
}

export default SimpleElementEditor

// Add CSS for font size slider
const styles = `
  input[type="range"] {
    -webkit-appearance: none;
    appearance: none;
    background: transparent;
    cursor: pointer;
  }

  input[type="range"]::-webkit-slider-track {
    background: #e5e7eb;
    height: 8px;
    border-radius: 4px;
  }

  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    background: #3b82f6;
    height: 20px;
    width: 20px;
    border-radius: 50%;
    cursor: pointer;
  }

  input[type="range"]::-moz-range-track {
    background: #e5e7eb;
    height: 8px;
    border-radius: 4px;
    border: none;
  }

  input[type="range"]::-moz-range-thumb {
    background: #3b82f6;
    height: 20px;
    width: 20px;
    border-radius: 50%;
    cursor: pointer;
    border: none;
  }
`

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style')
  styleSheet.textContent = styles
  document.head.appendChild(styleSheet)
}
