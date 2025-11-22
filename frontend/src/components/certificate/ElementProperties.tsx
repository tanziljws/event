'use client'

import React from 'react'
import { TextElement, ImageElement, CanvasElement } from '@/types/certificate'

interface ElementPropertiesProps {
  element: CanvasElement | null
  onUpdate: (updates: Partial<CanvasElement>) => void
  onDelete?: () => void
}

export const ElementProperties: React.FC<ElementPropertiesProps> = ({
  element,
  onUpdate,
  onDelete
}) => {
  if (!element) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px', color: '#6b7280' }}>
        <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', fontWeight: '600' }}>
          Element Properties
        </h3>
        <p style={{ margin: 0, fontSize: '14px' }}>
          Select an element to edit its properties
        </p>
      </div>
    )
  }

  const handleUpdate = (field: string, value: any) => {
    onUpdate({ [field]: value } as Partial<CanvasElement>)
  }

  // Type guards
  const isTextElement = (el: CanvasElement): el is TextElement => el.type === 'text'
  const isImageElement = (el: CanvasElement): el is ImageElement => el.type === 'image'

  const inputStyle = {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s'
  }

  const labelStyle = {
    display: 'block',
    fontWeight: '500',
    marginBottom: '6px',
    color: '#374151',
    fontSize: '14px'
  }

  const groupStyle = {
    marginBottom: '20px'
  }

  return (
    <div>
      <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600' }}>
        Element Properties
      </h3>
      
      {/* Element Type */}
      <div style={groupStyle}>
        <label style={labelStyle}>Element Type:</label>
        <div style={{
          padding: '8px 12px',
          background: element.type === 'text' ? '#eff6ff' : '#f0fdf4',
          border: `1px solid ${element.type === 'text' ? '#3b82f6' : '#10b981'}`,
          borderRadius: '6px',
          fontSize: '14px',
          fontWeight: '500',
          color: element.type === 'text' ? '#1e40af' : '#059669'
        }}>
          {element.type === 'text' ? '📝 Text Element' : '🖼️ Image Element'}
        </div>
      </div>

      {/* Text Element Properties */}
      {isTextElement(element) && (
        <>
          <div style={groupStyle}>
            <label style={labelStyle}>Placeholder Text:</label>
            <input
              type="text"
              value={element.placeholder}
              onChange={(e) => handleUpdate('placeholder', e.target.value)}
              placeholder="Enter placeholder text"
              style={inputStyle}
            />
          </div>

          <div style={groupStyle}>
            <label style={labelStyle}>Font Size:</label>
            <input
              type="number"
              min="8"
              max="72"
              value={element.fontSize}
              onChange={(e) => handleUpdate('fontSize', parseInt(e.target.value) || 16)}
              style={inputStyle}
            />
          </div>

          <div style={groupStyle}>
            <label style={labelStyle}>Font Family:</label>
            <select
              value={element.fontFamily}
              onChange={(e) => handleUpdate('fontFamily', e.target.value)}
              style={inputStyle}
            >
              <option value="Arial">Arial</option>
              <option value="Times New Roman">Times New Roman</option>
              <option value="Courier New">Courier New</option>
              <option value="Georgia">Georgia</option>
              <option value="Verdana">Verdana</option>
              <option value="Helvetica">Helvetica</option>
            </select>
          </div>

          <div style={groupStyle}>
            <label style={labelStyle}>Font Weight:</label>
            <select
              value={element.fontWeight}
              onChange={(e) => handleUpdate('fontWeight', e.target.value)}
              style={inputStyle}
            >
              <option value="normal">Normal</option>
              <option value="bold">Bold</option>
              <option value="lighter">Lighter</option>
              <option value="100">100</option>
              <option value="200">200</option>
              <option value="300">300</option>
              <option value="400">400</option>
              <option value="500">500</option>
              <option value="600">600</option>
              <option value="700">700</option>
              <option value="800">800</option>
              <option value="900">900</option>
            </select>
          </div>

          <div style={groupStyle}>
            <label style={labelStyle}>Text Color:</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="color"
                value={element.color}
                onChange={(e) => handleUpdate('color', e.target.value)}
                style={{
                  width: '40px',
                  height: '40px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              />
              <input
                type="text"
                value={element.color}
                onChange={(e) => handleUpdate('color', e.target.value)}
                style={{ ...inputStyle, flex: 1 }}
                placeholder="#000000"
              />
            </div>
          </div>

          <div style={groupStyle}>
            <label style={labelStyle}>Text Alignment:</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {(['left', 'center', 'right'] as const).map(align => (
                <button
                  key={align}
                  onClick={() => handleUpdate('textAlign', align)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    border: `1px solid ${element.textAlign === align ? '#3b82f6' : '#d1d5db'}`,
                    background: element.textAlign === align ? '#eff6ff' : 'white',
                    color: element.textAlign === align ? '#1e40af' : '#374151',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '500',
                    textTransform: 'capitalize'
                  }}
                >
                  {align}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Image Element Properties */}
      {isImageElement(element) && (
        <>
          <div style={groupStyle}>
            <label style={labelStyle}>Image Source URL:</label>
            <input
              type="text"
              value={element.src}
              onChange={(e) => handleUpdate('src', e.target.value)}
              placeholder="Enter image URL"
              style={inputStyle}
            />
          </div>
          
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Width:</label>
              <input
                type="number"
                min="20"
                max="800"
                value={element.width}
                onChange={(e) => handleUpdate('width', parseInt(e.target.value) || 120)}
                style={inputStyle}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Height:</label>
              <input
                type="number"
                min="20"
                max="600"
                value={element.height}
                onChange={(e) => handleUpdate('height', parseInt(e.target.value) || 80)}
                style={inputStyle}
              />
            </div>
          </div>
          
          <div style={groupStyle}>
            <label style={labelStyle}>
              Opacity: {Math.round((element.opacity || 1) * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={element.opacity || 1}
              onChange={(e) => handleUpdate('opacity', parseFloat(e.target.value))}
              style={{
                width: '100%',
                height: '6px',
                borderRadius: '3px',
                background: '#e5e7eb',
                outline: 'none',
                cursor: 'pointer'
              }}
            />
          </div>
          
          <div style={groupStyle}>
            <label style={labelStyle}>Z-Index (Layer):</label>
            <input
              type="number"
              min="0"
              max="10"
              value={element.zIndex}
              onChange={(e) => handleUpdate('zIndex', parseInt(e.target.value) || 1)}
              style={inputStyle}
            />
            <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0 0' }}>
              Higher numbers appear in front
            </p>
          </div>
        </>
      )}

      {/* Position Controls */}
      <div style={groupStyle}>
        <label style={labelStyle}>Position:</label>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ ...labelStyle, fontSize: '12px', color: '#6b7280' }}>X:</label>
            <input
              type="number"
              min="0"
              max="800"
              value={element.position.x}
              onChange={(e) => handleUpdate('position', { ...element.position, x: parseInt(e.target.value) || 0 })}
              style={inputStyle}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ ...labelStyle, fontSize: '12px', color: '#6b7280' }}>Y:</label>
            <input
              type="number"
              min="0"
              max="600"
              value={element.position.y}
              onChange={(e) => handleUpdate('position', { ...element.position, y: parseInt(e.target.value) || 0 })}
              style={inputStyle}
            />
          </div>
        </div>
      </div>

      {/* Element Info */}
      <div style={{
        padding: '12px',
        background: '#f9fafb',
        border: '1px solid #e5e7eb',
        borderRadius: '6px',
        marginTop: '20px'
      }}>
        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px' }}>
          Element ID:
        </div>
        <div style={{ fontSize: '14px', fontFamily: 'monospace', color: '#374151' }}>
          {element.id}
        </div>
      </div>

      {/* Delete Button */}
      {onDelete && (
        <div style={{ marginTop: '20px' }}>
          <button
            onClick={onDelete}
            style={{
              width: '100%',
              padding: '10px 16px',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#ef4444'}
          >
            🗑️ Delete Element
          </button>
        </div>
      )}
    </div>
  )
}

export default ElementProperties