'use client'

import React, { useRef, useState, useEffect, useCallback } from 'react'

export interface TextElement {
  id: string
  type: 'text'
  placeholder: string
  position: { x: number; y: number }
  fontSize: number
  fontFamily: string
  fontWeight: string
  color: string
  textAlign: 'left' | 'center' | 'right'
  width?: number
  height?: number
}

export interface ImageElement {
  id: string
  type: 'image'
  src: string
  position: { x: number; y: number }
  width: number
  height: number
  opacity: number
  zIndex: number
}

export type CanvasElement = TextElement | ImageElement

export interface CanvasEditorProps {
  elements: CanvasElement[]
  onElementSelect: (elementId: string | null) => void
  onElementMove: (elementId: string, newPosition: { x: number; y: number }) => void
  onElementUpdate: (elementId: string, updates: Partial<CanvasElement>) => void
  onElementAdd: (element: Omit<CanvasElement, 'id'>) => void
  selectedElementId?: string | null
  width?: number
  height?: number
  backgroundImage?: string
  backgroundSize?: 'contain' | 'cover' | 'stretch'
  userData?: {
    name?: string
    email?: string
    eventTitle?: string
    date?: string
    certificateNumber?: string
  }
}

export const CanvasEditor: React.FC<CanvasEditorProps> = ({
  elements,
  onElementSelect,
  onElementMove,
  onElementUpdate,
  onElementAdd,
  selectedElementId,
  width = 800,
  height = 600,
  backgroundImage,
  backgroundSize = 'contain',
  userData = {}
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [dragElementId, setDragElementId] = useState<string | null>(null)
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 })

  // Update canvas offset when container changes
  useEffect(() => {
    const updateOffset = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setCanvasOffset({ x: rect.left, y: rect.top })
      }
    }

    updateOffset()
    window.addEventListener('resize', updateOffset)
    return () => window.removeEventListener('resize', updateOffset)
  }, [])

  // Handle mouse down on element
  const handleElementMouseDown = useCallback((e: React.MouseEvent, elementId: string) => {
    e.preventDefault()
    e.stopPropagation()
    
    setIsDragging(true)
    setDragElementId(elementId)
    setDragStart({ x: e.clientX, y: e.clientY })
    onElementSelect(elementId)
  }, [onElementSelect])

  // Handle mouse move for dragging
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging && dragElementId) {
      const deltaX = e.clientX - dragStart.x
      const deltaY = e.clientY - dragStart.y
      
      const element = elements.find(el => el.id === dragElementId)
      if (element) {
        const newPosition = {
          x: Math.max(0, Math.min(width, element.position.x + deltaX)),
          y: Math.max(0, Math.min(height, element.position.y + deltaY))
        }
        
        onElementMove(dragElementId, newPosition)
        setDragStart({ x: e.clientX, y: e.clientY })
      }
    }
  }, [isDragging, dragElementId, dragStart, elements, onElementMove, width, height])

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setDragElementId(null)
  }, [])

  // Add global mouse event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  // Handle canvas click (deselect)
  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (!isDragging) {
      onElementSelect(null)
    }
  }, [isDragging, onElementSelect])

  // Add new text element
  const handleAddText = useCallback(() => {
    const newElement: Omit<TextElement, 'id'> = {
      type: 'text',
      placeholder: '{{newText}}',
      position: { x: width / 2, y: height / 2 },
      fontSize: 16,
      fontFamily: 'Arial',
      fontWeight: 'normal',
      color: '#000000',
      textAlign: 'center'
    }
    onElementAdd(newElement)
  }, [onElementAdd, width, height])

  // Add new image element
  const handleAddImage = useCallback(() => {
    const newElement: Omit<ImageElement, 'id'> = {
      type: 'image',
      src: '',
      position: { x: width / 2, y: height / 2 },
      width: 120,
      height: 80,
      opacity: 1,
      zIndex: 1
    }
    onElementAdd(newElement)
  }, [onElementAdd, width, height])

  // Handle image upload
  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && selectedElementId) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const src = e.target?.result as string
        onElementUpdate(selectedElementId, { src })
      }
      reader.readAsDataURL(file)
    }
  }, [selectedElementId, onElementUpdate])

  // Replace placeholder with user data
  const replacePlaceholder = useCallback((placeholder: string) => {
    if (!userData) return placeholder
    
    return placeholder
      .replace('{{name}}', userData.name || '{{name}}')
      .replace('{{email}}', userData.email || '{{email}}')
      .replace('{{eventTitle}}', userData.eventTitle || '{{eventTitle}}')
      .replace('{{date}}', userData.date || '{{date}}')
      .replace('{{certificateNumber}}', userData.certificateNumber || '{{certificateNumber}}')
  }, [userData])

  return (
    <div className="canvas-editor-container">
      <div className="canvas-toolbar">
        <div className="toolbar-buttons">
          <button 
            onClick={handleAddText}
            className="add-text-btn"
            disabled={isDragging}
          >
            Add Text Element
          </button>
          <button 
            onClick={handleAddImage}
            className="add-image-btn"
            disabled={isDragging}
          >
            Add Image Element
          </button>
        </div>
        <div className="canvas-info">
          Canvas: {width} x {height}
        </div>
      </div>
      
      <div 
        ref={containerRef}
        className="canvas-container"
        style={{ width, height }}
      >
        {/* Background Image */}
        {backgroundImage && (
          <div 
            className="canvas-background-image"
            style={{
              backgroundImage: `url(${backgroundImage})`,
              backgroundSize: backgroundSize === 'stretch' ? '100% 100%' : backgroundSize,
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              zIndex: 0
            }}
          />
        )}
        
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          onClick={handleCanvasClick}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: 1,
            pointerEvents: 'auto'
          }}
        />
        
        {/* Render elements */}
        {elements
          .sort((a, b) => {
            if (a.type === 'image' && b.type === 'text') return (a as ImageElement).zIndex - 1
            if (a.type === 'text' && b.type === 'image') return 1 - (b as ImageElement).zIndex
            if (a.type === 'image' && b.type === 'image') return (a as ImageElement).zIndex - (b as ImageElement).zIndex
            return 0
          })
          .map(element => {
            if (element.type === 'text') {
              return (
                <DraggableTextElement
                  key={element.id}
                  element={element}
                  isSelected={selectedElementId === element.id}
                  isDragging={isDragging && dragElementId === element.id}
                  onMouseDown={(e) => handleElementMouseDown(e, element.id)}
                  canvasWidth={width}
                  canvasHeight={height}
                  userData={userData}
                  replacePlaceholder={replacePlaceholder}
                />
              )
            } else if (element.type === 'image') {
              return (
                <DraggableImageElement
                  key={element.id}
                  element={element}
                  isSelected={selectedElementId === element.id}
                  isDragging={isDragging && dragElementId === element.id}
                  onMouseDown={(e) => handleElementMouseDown(e, element.id)}
                  canvasWidth={width}
                  canvasHeight={height}
                  onImageUpload={handleImageUpload}
                />
              )
            }
            return null
          })}
        
        {/* Selection indicator */}
        {selectedElementId && (
          <div className="selection-indicator">
            Element selected: {selectedElementId}
          </div>
        )}
      </div>
    </div>
  )
}

interface DraggableTextElementProps {
  element: TextElement
  isSelected: boolean
  isDragging: boolean
  onMouseDown: (e: React.MouseEvent) => void
  canvasWidth: number
  canvasHeight: number
  userData?: any
  replacePlaceholder: (placeholder: string) => string
}

interface DraggableImageElementProps {
  element: ImageElement
  isSelected: boolean
  isDragging: boolean
  onMouseDown: (e: React.MouseEvent) => void
  canvasWidth: number
  canvasHeight: number
  onImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void
}

const DraggableTextElement: React.FC<DraggableTextElementProps> = ({
  element,
  isSelected,
  isDragging,
  onMouseDown,
  canvasWidth,
  canvasHeight,
  userData,
  replacePlaceholder
}) => {
  const elementStyle: React.CSSProperties = {
    position: 'absolute',
    left: element.position.x,
    top: element.position.y,
    fontSize: element.fontSize,
    fontFamily: element.fontFamily,
    fontWeight: element.fontWeight,
    color: element.color,
    textAlign: element.textAlign,
    cursor: isDragging ? 'grabbing' : 'grab',
    userSelect: 'none',
    transform: 'translate(-50%, -50%)',
    padding: '4px 8px',
    border: isSelected ? '2px dashed #007bff' : '1px dashed transparent',
    borderRadius: '4px',
    backgroundColor: isSelected ? 'rgba(0, 123, 255, 0.1)' : 'transparent',
    transition: isDragging ? 'none' : 'all 0.2s ease',
    zIndex: isSelected ? 20 : 10,
    maxWidth: canvasWidth - element.position.x,
    wordWrap: 'break-word'
  }

  return (
    <div
      style={elementStyle}
      onMouseDown={onMouseDown}
      className={`draggable-text-element ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''}`}
    >
      {replacePlaceholder(element.placeholder)}
    </div>
  )
}

const DraggableImageElement: React.FC<DraggableImageElementProps> = ({
  element,
  isSelected,
  isDragging,
  onMouseDown,
  canvasWidth,
  canvasHeight,
  onImageUpload
}) => {
  const elementStyle: React.CSSProperties = {
    position: 'absolute',
    left: element.position.x,
    top: element.position.y,
    width: element.width,
    height: element.height,
    opacity: element.opacity,
    cursor: isDragging ? 'grabbing' : 'grab',
    userSelect: 'none',
    transform: 'translate(-50%, -50%)',
    border: isSelected ? '2px dashed #007bff' : '1px dashed transparent',
    borderRadius: '4px',
    backgroundColor: isSelected ? 'rgba(0, 123, 255, 0.1)' : 'transparent',
    transition: isDragging ? 'none' : 'all 0.2s ease',
    zIndex: isSelected ? 20 : element.zIndex + 10,
    overflow: 'hidden'
  }

  return (
    <div
      style={elementStyle}
      onMouseDown={onMouseDown}
      className={`draggable-image-element ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''}`}
    >
      {element.src ? (
        <img
          src={element.src}
          alt="Certificate element"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block'
          }}
        />
      ) : (
        <div
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: '#f8f9fa',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#6c757d',
            fontSize: '10px',
            textAlign: 'center',
            border: '2px dashed #dee2e6',
            borderRadius: '4px',
            padding: '4px',
            boxSizing: 'border-box'
          }}
        >
          {isSelected ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ marginBottom: '4px', fontSize: '9px' }}>📷 Upload Image</div>
              <input
                type="file"
                accept="image/*"
                onChange={onImageUpload}
                style={{ display: 'none' }}
                id={`image-upload-${element.id}`}
              />
              <label
                htmlFor={`image-upload-${element.id}`}
                style={{
                  cursor: 'pointer',
                  color: '#007bff',
                  textDecoration: 'underline',
                  fontSize: '8px',
                  display: 'block'
                }}
              >
                Choose File
              </label>
            </div>
          ) : (
            <div style={{ fontSize: '9px' }}>
              📷<br />No Image
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default CanvasEditor
