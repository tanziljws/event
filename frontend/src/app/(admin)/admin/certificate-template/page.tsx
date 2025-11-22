'use client'

import React, { useState, useRef, useEffect } from 'react'
import Navbar from '@/components/navbar'
import SimpleElementEditor, { SimpleElement, SimpleTextElement, SimpleSignatureElement } from '@/components/certificate/SimpleElementEditor'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { ApiService } from '@/lib/api'
import { useAuth } from '@/contexts/auth-context'

export default function CertificateTemplatePage() {
  const { user } = useAuth()
  
  // Background image state
  const [backgroundImage, setBackgroundImage] = useState<string>('')
  const [isUploading, setIsUploading] = useState(false)
  const [backgroundSize, setBackgroundSize] = useState<'contain' | 'cover' | 'stretch'>('contain')
  
  // Elements state
  const [elements, setElements] = useState<SimpleElement[]>([])
  
  // Export ref
  const exportRef = useRef<HTMLDivElement>(null)
  const [isExporting, setIsExporting] = useState(false)
  
  // Text element types
  const [textElementType, setTextElementType] = useState<'custom' | 'user_name' | 'event_name'>('custom')
  
  // Signature modal state
  const [showSignatureModal, setShowSignatureModal] = useState(false)
  const [currentSignatureElement, setCurrentSignatureElement] = useState<SimpleSignatureElement | null>(null)
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  
  // Sample data for demonstration (in real app, this would come from database)
  const [sampleData, setSampleData] = useState({
    userName: user?.fullName || 'John Doe',
    eventName: 'Web Development Workshop 2024'
  })

  // Function to load real data from database
  const loadRealData = async () => {
    try {
      // In real implementation, you would fetch from API
      // const userData = await ApiService.getUserProfile()
      // const eventData = await ApiService.getEvent(eventId)
      
      // For now, use sample data
      setSampleData({
        userName: user?.fullName || 'John Doe',
        eventName: 'Web Development Workshop 2024'
      })
    } catch (error) {
      console.error('Error loading real data:', error)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setIsUploading(true)
      const reader = new FileReader()
      reader.onload = (event) => {
        setBackgroundImage(event.target?.result as string)
        setIsUploading(false)
      }
      reader.readAsDataURL(file)
    }
  }

  const exportToPDF = async () => {
    if (!exportRef.current) return

    setIsExporting(true)
    try {
      // Temporarily replace dynamic text for export
      const elementsWithRealData = replaceDynamicText(elements)
      
      // Update elements temporarily for export
      const originalElements = elements
      setElements(elementsWithRealData)
      
      // Wait for DOM update
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const canvas = await html2canvas(exportRef.current, {
        width: 800,
        height: 600,
        scale: 2, // Higher quality
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [297, 210] // A4 landscape
      })

      // Calculate dimensions to fit 800x600 canvas in A4
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = 800
      const imgHeight = 600
      
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight)
      const finalWidth = imgWidth * ratio
      const finalHeight = imgHeight * ratio
      
      const x = (pdfWidth - finalWidth) / 2
      const y = (pdfHeight - finalHeight) / 2

      pdf.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight)
      pdf.save('certificate-template.pdf')
      
      // Restore original elements
      setElements(originalElements)
    } catch (error) {
      console.error('Error exporting to PDF:', error)
      alert('Error exporting to PDF. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const exportToJPG = async () => {
    if (!exportRef.current) return

    setIsExporting(true)
    try {
      // Temporarily replace dynamic text for export
      const elementsWithRealData = replaceDynamicText(elements)
      
      // Update elements temporarily for export
      const originalElements = elements
      setElements(elementsWithRealData)
      
      // Wait for DOM update
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const canvas = await html2canvas(exportRef.current, {
        width: 800,
        height: 600,
        scale: 2, // Higher quality
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      })

      // Convert to JPG
      const imgData = canvas.toDataURL('image/jpeg', 0.95)
      
      // Create download link
      const link = document.createElement('a')
      link.download = 'certificate-template.jpg'
      link.href = imgData
      link.click()
      
      // Restore original elements
      setElements(originalElements)
    } catch (error) {
      console.error('Error exporting to JPG:', error)
      alert('Error exporting to JPG. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  // Function to replace dynamic text with real data
  const replaceDynamicText = (elements: SimpleElement[]) => {
    return elements.map(element => {
      if (element.type === 'text' && element.isDynamic && element.dynamicType) {
        let realText = ''
        if (element.dynamicType === 'user_name') {
          realText = sampleData.userName
        } else if (element.dynamicType === 'event_name') {
          realText = sampleData.eventName
        }
        
        return {
          ...element,
          text: realText
        }
      }
      return element
    })
  }

  // Signature functions
  const openSignatureModal = (element: SimpleSignatureElement) => {
    setCurrentSignatureElement(element)
    setShowSignatureModal(true)
  }

  const saveSignature = () => {
    if (signatureCanvasRef.current && currentSignatureElement) {
      const signatureData = signatureCanvasRef.current.toDataURL()
      
      // Check if this is a new signature element (not yet in elements array)
      const existingElement = elements.find(el => el.id === currentSignatureElement.id)
      
      if (existingElement) {
        // Update existing signature element
        setElements(prev => prev.map(el => 
          el.id === currentSignatureElement.id 
            ? { ...el, signatureData }
            : el
        ))
      } else {
        // Add new signature element to canvas
        setElements(prev => [...prev, { ...currentSignatureElement, signatureData }])
      }
      
      setShowSignatureModal(false)
      setCurrentSignatureElement(null)
    }
  }

  const clearSignature = () => {
    if (signatureCanvasRef.current) {
      const ctx = signatureCanvasRef.current.getContext('2d')
      if (ctx) {
        ctx.clearRect(0, 0, signatureCanvasRef.current.width, signatureCanvasRef.current.height)
      }
    }
  }

  // Drawing functions for canvas
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    setIsDrawing(true)
    const canvas = signatureCanvasRef.current
    if (canvas) {
      const rect = canvas.getBoundingClientRect()
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.beginPath()
        ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top)
        console.log('Started drawing at:', e.clientX - rect.left, e.clientY - rect.top)
      }
    }
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    if (!isDrawing) return
    const canvas = signatureCanvasRef.current
    if (canvas) {
      const rect = canvas.getBoundingClientRect()
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top)
        ctx.stroke()
      }
    }
  }

  const stopDrawing = (e?: React.MouseEvent<HTMLCanvasElement>) => {
    if (e) e.preventDefault()
    setIsDrawing(false)
  }

  // Initialize canvas when modal opens
  useEffect(() => {
    if (showSignatureModal && signatureCanvasRef.current) {
      const canvas = signatureCanvasRef.current
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.strokeStyle = '#000000'
        ctx.lineWidth = 2
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        console.log('Canvas initialized:', canvas.width, 'x', canvas.height)
        console.log('Canvas context:', ctx)
      } else {
        console.error('Canvas context not available')
      }
    }
  }, [showSignatureModal])

  const exportToPNG = async () => {
    if (!exportRef.current) return

    setIsExporting(true)
    try {
      // Temporarily replace dynamic text for export
      const elementsWithRealData = replaceDynamicText(elements)
      
      // Update elements temporarily for export
      const originalElements = elements
      setElements(elementsWithRealData)
      
      // Wait for DOM update
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const canvas = await html2canvas(exportRef.current, {
        width: 800,
        height: 600,
        scale: 2, // Higher quality
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      })

      // Convert to PNG
      const imgData = canvas.toDataURL('image/png')
      
      // Create download link
      const link = document.createElement('a')
      link.download = 'certificate-template.png'
      link.href = imgData
      link.click()
      
      // Restore original elements
      setElements(originalElements)
    } catch (error) {
      console.error('Error exporting to PNG:', error)
      alert('Error exporting to PNG. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }



  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Certificate Template Editor
          </h1>
          <p className="text-gray-600">
            Design your certificate template with professional canvas editor
          </p>
        </div>

        {/* Main Content */}
        <div className="flex justify-center">
          <div className="flex gap-8 items-start">
            {/* Canvas Preview */}
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">Certificate Canvas</h2>
                <p className="text-gray-600">800 × 600 pixels</p>
              </div>
              
              <div className="canvas-container" ref={exportRef}>
                {/* Background Image */}
                {backgroundImage && (
                  <div 
                    className="canvas-background-image"
                    style={{
                      backgroundImage: `url(${backgroundImage})`,
                      backgroundSize: backgroundSize === 'stretch' ? '100% 100%' : backgroundSize,
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat'
                    }}
                  />
                )}
                
                {/* Element Editor Overlay */}
                <div className="element-editor-overlay">
                  <SimpleElementEditor
                    elements={elements}
                    onElementsChange={setElements}
                    canvasWidth={800}
                    canvasHeight={600}
                    onOpenSignatureModal={openSignatureModal}
                  />
                </div>
                
                {/* Placeholder when no background image */}
                {!backgroundImage && (
                  <div className="canvas-placeholder">
                    <div className="placeholder-content">
                      <div className="placeholder-icon">📄</div>
                      <div className="placeholder-text">Certificate Template</div>
                      <div className="placeholder-subtitle">Upload background image to start</div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mt-6 flex justify-center space-x-4">
                <div className="bg-blue-50 px-4 py-2 rounded-lg">
                  <div className="text-xs text-blue-600 font-medium">CANVAS SIZE</div>
                  <div className="text-sm text-blue-800 font-semibold">800 × 600</div>
                </div>
                <div className={`px-4 py-2 rounded-lg ${backgroundImage ? 'bg-green-50' : 'bg-gray-50'}`}>
                  <div className={`text-xs font-medium ${backgroundImage ? 'text-green-600' : 'text-gray-600'}`}>STATUS</div>
                  <div className={`text-sm font-semibold ${backgroundImage ? 'text-green-800' : 'text-gray-800'}`}>
                    {backgroundImage ? 'Image Loaded' : 'No Image'}
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="w-80 space-y-6">
              {/* Upload Section */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">Upload Background Image</h2>
                  <p className="text-sm text-gray-600">Choose an image to use as your certificate background</p>
                </div>
                
                <div 
                  className="upload-container"
                  onClick={() => !isUploading && document.getElementById('image-upload')?.click()}
                >
                  {backgroundImage ? (
                    <div className="image-preview">
                      <img 
                        src={backgroundImage} 
                        alt="Background preview" 
                        className="preview-image"
                      />
                      <div className="overlay">
                        <span className="change-text">Click to change image</span>
                      </div>
                    </div>
                  ) : (
                    <div className="upload-placeholder">
                      {isUploading ? (
                        <div className="uploading-content">
                          <div className="uploading-spinner"></div>
                          <div className="uploading-text">Uploading...</div>
                        </div>
                      ) : (
                        <div className="upload-content">
                          <div className="upload-icon">📷</div>
                          <div className="upload-text">Click to upload image</div>
                          <div className="upload-hint">PNG, JPG, GIF up to 10MB</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />
                
                {backgroundImage && (
                  <div className="mt-4 flex justify-center">
                    <button
                      onClick={() => setBackgroundImage('')}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-colors font-medium"
                    >
                      🗑️ Remove Image
                    </button>
                  </div>
                )}

                {/* Background Size Control */}
                {backgroundImage && (
                  <div className="mt-6">
                    <h3 className="text-md font-semibold text-gray-900 mb-3">Image Fit</h3>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="backgroundSize"
                          value="contain"
                          checked={backgroundSize === 'contain'}
                          onChange={(e) => setBackgroundSize(e.target.value as 'contain' | 'cover' | 'stretch')}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">Contain (fit whole image)</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="backgroundSize"
                          value="cover"
                          checked={backgroundSize === 'cover'}
                          onChange={(e) => setBackgroundSize(e.target.value as 'contain' | 'cover' | 'stretch')}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">Cover (fill canvas)</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="backgroundSize"
                          value="stretch"
                          checked={backgroundSize === 'stretch'}
                          onChange={(e) => setBackgroundSize(e.target.value as 'contain' | 'cover' | 'stretch')}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">Stretch (distort to fit)</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Add Text Element Form */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">Add Text Element</h2>
                  <p className="text-sm text-gray-600">Add text elements to your certificate</p>
                </div>
                
                <div className="space-y-4">
                  {/* Text Element Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Text Element Type:</label>
                    <select
                      value={textElementType}
                      onChange={(e) => setTextElementType(e.target.value as 'custom' | 'user_name' | 'event_name')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="custom">Custom Text</option>
                      <option value="user_name">User Name (from database)</option>
                      <option value="event_name">Event Name (from database)</option>
                    </select>
                  </div>

                  {/* Text Content - Only show for custom text */}
                  {textElementType === 'custom' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Text Content:</label>
                      <input
                        type="text"
                        placeholder="Enter text..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        id="text-content"
                      />
                    </div>
                  )}

                  {/* Dynamic Text Preview */}
                  {textElementType !== 'custom' && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="text-xs text-blue-800 font-medium mb-1">Preview:</div>
                      <div className="text-sm text-blue-700">
                        {textElementType === 'user_name' ? '[Nama Peserta]' : '[Nama Event]'}
                      </div>
                      <div className="text-xs text-blue-600 mt-1">
                        {textElementType === 'user_name' 
                          ? 'Text ini akan otomatis diisi dengan nama peserta saat certificate di-generate'
                          : 'Text ini akan otomatis diisi dengan nama event saat certificate di-generate'
                        }
                      </div>
                    </div>
                  )}

                  {/* Font Family */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Font Style:</label>
                    <select
                      defaultValue="Arial"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      id="font-family"
                    >
                      <option value="Arial">Arial (Standard)</option>
                      <option value="Georgia">Georgia (Serif)</option>
                      <option value="Times New Roman">Times New Roman (Classic)</option>
                      <option value="Brush Script MT">Brush Script (Handwriting)</option>
                      <option value="Lucida Handwriting">Lucida Handwriting</option>
                      <option value="Bradley Hand">Bradley Hand (Cursive)</option>
                      <option value="Edwardian Script ITC">Edwardian Script (Elegant)</option>
                      <option value="French Script MT">French Script (Classic)</option>
                      <option value="Kunstler Script">Kunstler Script (Fancy)</option>
                      <option value="Monotype Corsiva">Monotype Corsiva (Italic)</option>
                      <option value="Script MT Bold">Script MT (Bold)</option>
                      <option value="Vivaldi">Vivaldi (Ornate)</option>
                      <option value="Comic Sans MS">Comic Sans (Casual)</option>
                      <option value="Chalkduster">Chalkduster (Chalk)</option>
                      <option value="Marker Felt">Marker Felt (Marker)</option>
                      <option value="Papyrus">Papyrus (Ancient)</option>
                    </select>
                  </div>

                  {/* Font Size */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Font Size:</label>
                    <div className="space-y-2">
                      <input
                        type="range"
                        min="8"
                        max="120"
                        defaultValue="16"
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        id="font-size-slider"
                        onChange={(e) => {
                          const value = e.target.value
                          const fontSizeInput = document.getElementById('font-size') as HTMLInputElement
                          if (fontSizeInput) {
                            fontSizeInput.value = value
                          }
                        }}
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>8px</span>
                        <span id="font-size-display">16px</span>
                        <span>120px</span>
                      </div>
                      <input
                        type="number"
                        min="8"
                        max="120"
                        defaultValue="16"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        id="font-size"
                        onChange={(e) => {
                          const value = e.target.value
                          const slider = document.getElementById('font-size-slider') as HTMLInputElement
                          const display = document.getElementById('font-size-display') as HTMLElement
                          if (slider) {
                            slider.value = value
                          }
                          if (display) {
                            display.textContent = value + 'px'
                          }
                        }}
                      />
                    </div>
                  </div>

                  {/* Color */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Color:</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        defaultValue="#000000"
                        className="w-12 h-8 border border-gray-300 rounded cursor-pointer"
                        id="text-color"
                      />
                      <input
                        type="text"
                        defaultValue="#000000"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        id="color-text"
                      />
                    </div>
                  </div>

                  {/* Font Weight */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Font Weight:</label>
                    <select
                      defaultValue="normal"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      id="font-weight"
                    >
                      <option value="normal">Normal</option>
                      <option value="bold">Bold</option>
                    </select>
                  </div>

                  {/* Text Align */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Text Align:</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="px-3 py-1 text-sm rounded bg-blue-500 text-white font-medium"
                        data-align="left"
                        onClick={(e) => {
                          document.querySelectorAll('[data-align]').forEach(btn => {
                            btn.classList.remove('bg-blue-500', 'text-white')
                            btn.classList.add('bg-gray-200', 'text-gray-700')
                          })
                          e.currentTarget.classList.remove('bg-gray-200', 'text-gray-700')
                          e.currentTarget.classList.add('bg-blue-500', 'text-white')
                        }}
                      >
                        Left
                      </button>
                      <button
                        type="button"
                        className="px-3 py-1 text-sm rounded bg-gray-200 text-gray-700 hover:bg-gray-300 font-medium"
                        data-align="center"
                        onClick={(e) => {
                          document.querySelectorAll('[data-align]').forEach(btn => {
                            btn.classList.remove('bg-blue-500', 'text-white')
                            btn.classList.add('bg-gray-200', 'text-gray-700')
                          })
                          e.currentTarget.classList.remove('bg-gray-200', 'text-gray-700')
                          e.currentTarget.classList.add('bg-blue-500', 'text-white')
                        }}
                      >
                        Center
                      </button>
                      <button
                        type="button"
                        className="px-3 py-1 text-sm rounded bg-gray-200 text-gray-700 hover:bg-gray-300 font-medium"
                        data-align="right"
                        onClick={(e) => {
                          document.querySelectorAll('[data-align]').forEach(btn => {
                            btn.classList.remove('bg-blue-500', 'text-white')
                            btn.classList.add('bg-gray-200', 'text-gray-700')
                          })
                          e.currentTarget.classList.remove('bg-gray-200', 'text-gray-700')
                          e.currentTarget.classList.add('bg-blue-500', 'text-white')
                        }}
                      >
                        Right
                      </button>
                    </div>
                  </div>

                  {/* Position */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">X Position:</label>
                      <input
                        type="number"
                        min="0"
                        max="800"
                        defaultValue="400"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        id="x-position"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Y Position:</label>
                      <input
                        type="number"
                        min="0"
                        max="600"
                        defaultValue="300"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        id="y-position"
                      />
                    </div>
                  </div>

                  {/* Add Button */}
                  <button
                    onClick={() => {
                      let textContent = ''
                      
                      if (textElementType === 'custom') {
                        textContent = (document.getElementById('text-content') as HTMLInputElement)?.value || 'New Text'
                      } else if (textElementType === 'user_name') {
                        textContent = '[Nama Peserta]'
                      } else if (textElementType === 'event_name') {
                        textContent = '[Nama Event]'
                      }

                      const fontFamily = (document.getElementById('font-family') as HTMLSelectElement)?.value || 'Arial'
                      const fontSize = parseInt((document.getElementById('font-size') as HTMLInputElement)?.value || '16')
                      const color = (document.getElementById('text-color') as HTMLInputElement)?.value || '#000000'
                      const fontWeight = (document.getElementById('font-weight') as HTMLSelectElement)?.value as 'normal' | 'bold' || 'normal'
                      const textAlign = document.querySelector('[data-align].bg-blue-500')?.getAttribute('data-align') as 'left' | 'center' | 'right' || 'center'
                      const x = parseInt((document.getElementById('x-position') as HTMLInputElement)?.value || '400')
                      const y = parseInt((document.getElementById('y-position') as HTMLInputElement)?.value || '300')

                      const newElement: SimpleTextElement = {
                        id: `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                        type: 'text',
                        text: textContent,
                        position: { x: x, y: y },
                        fontSize: fontSize,
                        fontFamily: fontFamily,
                        color: color,
                        fontWeight: fontWeight,
                        textAlign: textAlign,
                        // Add metadata for dynamic text
                        isDynamic: textElementType !== 'custom',
                        dynamicType: textElementType === 'custom' ? undefined : textElementType
                      }

                      setElements(prev => [...prev, newElement])

                      // Reset form
                      if (textElementType === 'custom') {
                        ;(document.getElementById('text-content') as HTMLInputElement).value = ''
                      }
                      ;(document.getElementById('font-family') as HTMLSelectElement).value = 'Arial'
                      ;(document.getElementById('font-size') as HTMLInputElement).value = '16'
                      ;(document.getElementById('font-size-slider') as HTMLInputElement).value = '16'
                      ;(document.getElementById('font-size-display') as HTMLElement).textContent = '16px'
                      ;(document.getElementById('text-color') as HTMLInputElement).value = '#000000'
                      ;(document.getElementById('color-text') as HTMLInputElement).value = '#000000'
                      ;(document.getElementById('font-weight') as HTMLSelectElement).value = 'normal'
                      ;(document.getElementById('x-position') as HTMLInputElement).value = '400'
                      ;(document.getElementById('y-position') as HTMLInputElement).value = '300'

                      // Reset text align buttons
                      document.querySelectorAll('[data-align]').forEach(btn => {
                        btn.classList.remove('bg-blue-500', 'text-white')
                        btn.classList.add('bg-gray-200', 'text-gray-700')
                      })
                      document.querySelector('[data-align="center"]')?.classList.remove('bg-gray-200', 'text-gray-700')
                      document.querySelector('[data-align="center"]')?.classList.add('bg-blue-500', 'text-white')
                    }}
                    className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                  >
                    📝 Add Text Element
                  </button>

                  {/* Add Signature Button */}
                  <button
                    onClick={() => {
                      // Set default signature element yang akan dibuat
                      const newSignatureElement: SimpleSignatureElement = {
                        id: `signature-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                        type: 'signature',
                        position: { x: 400, y: 500 },
                        width: 150,
                        height: 60,
                        signatureData: '',
                        label: '' // No default label
                      }
                      setCurrentSignatureElement(newSignatureElement)
                      setShowSignatureModal(true)
                    }}
                    className="w-full px-4 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors font-medium"
                  >
                    ✍️ Add Signature Element
                  </button>

                  {/* Clear All Button */}
                  <button
                    onClick={() => setElements([])}
                    className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium text-sm"
                  >
                    🗑️ Clear All Elements
                  </button>
                </div>
              </div>

              {/* Export Section */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">Export Certificate</h2>
                  <p className="text-sm text-gray-600">Download your certificate template</p>
                </div>
                
                <div className="space-y-3">
                  <button
                    onClick={exportToPDF}
                    disabled={isExporting}
                    className={`w-full flex items-center justify-center px-4 py-3 rounded-lg transition-colors font-medium ${
                      isExporting 
                        ? 'bg-gray-400 text-white cursor-not-allowed' 
                        : 'bg-red-500 text-white hover:bg-red-600'
                    }`}
                  >
                    {isExporting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Exporting...
                      </>
                    ) : (
                      '📄 Export as PDF'
                    )}
                  </button>
                  
                  <button
                    onClick={exportToPNG}
                    disabled={isExporting}
                    className={`w-full flex items-center justify-center px-4 py-3 rounded-lg transition-colors font-medium ${
                      isExporting 
                        ? 'bg-gray-400 text-white cursor-not-allowed' 
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                  >
                    {isExporting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Exporting...
                      </>
                    ) : (
                      '🖼️ Export as PNG'
                    )}
                  </button>
                  
                  <button
                    onClick={exportToJPG}
                    disabled={isExporting}
                    className={`w-full flex items-center justify-center px-4 py-3 rounded-lg transition-colors font-medium ${
                      isExporting 
                        ? 'bg-gray-400 text-white cursor-not-allowed' 
                        : 'bg-green-500 text-white hover:bg-green-600'
                    }`}
                  >
                    {isExporting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Exporting...
                      </>
                    ) : (
                      '📷 Export as JPG'
                    )}
                  </button>
                </div>
                
                <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                  <div className="text-xs text-yellow-800 font-medium mb-1">Export Tips:</div>
                  <div className="text-xs text-yellow-700">
                    • PDF: Best for printing<br/>
                    • PNG: Best quality, larger file<br/>
                    • JPG: Smaller file, good quality
                  </div>
                </div>
                
                {/* Sample Data Configuration */}
                <div className="mt-4 p-3 bg-green-50 rounded-lg">
                  <div className="text-xs text-green-800 font-medium mb-2">Sample Data for Export:</div>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-xs text-green-700 mb-1">User Name:</label>
                      <input
                        type="text"
                        value={sampleData.userName}
                        onChange={(e) => setSampleData(prev => ({ ...prev, userName: e.target.value }))}
                        className="w-full px-2 py-1 border border-green-300 rounded text-xs focus:ring-1 focus:ring-green-500 focus:border-green-500"
                        placeholder="Enter sample user name"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-green-700 mb-1">Event Name:</label>
                      <input
                        type="text"
                        value={sampleData.eventName}
                        onChange={(e) => setSampleData(prev => ({ ...prev, eventName: e.target.value }))}
                        className="w-full px-2 py-1 border border-green-300 rounded text-xs focus:ring-1 focus:ring-green-500 focus:border-green-500"
                        placeholder="Enter sample event name"
                      />
                    </div>
                  </div>
                  <div className="text-xs text-green-600 mt-2">
                    💡 This data will be used to replace dynamic text elements during export
                  </div>
                  <button
                    onClick={loadRealData}
                    className="w-full mt-2 px-3 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 transition-colors font-medium"
                  >
                    🔄 Load Real Data from Database
                  </button>
                </div>

                {/* Dynamic Text Info */}
                {elements.some(el => el.type === 'text' && el.isDynamic) && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <div className="text-xs text-blue-800 font-medium mb-1">Dynamic Text Elements:</div>
                    <div className="text-xs text-blue-700">
                      {elements.filter(el => el.type === 'text' && el.isDynamic).map(el => {
                        const textEl = el as SimpleTextElement
                        return (
                          <div key={el.id} className="mb-1">
                            • {textEl.dynamicType === 'user_name' ? '[Nama Peserta]' : '[Nama Event]'} - {textEl.text}
                          </div>
                        )
                      })}
                      <div className="mt-2 text-blue-600">
                        🔄 These will be replaced with actual data when certificate is generated
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Signature Modal */}
      {showSignatureModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Draw Signature</h3>
            <p className="text-sm text-gray-600 mb-4">
              Gambar tanda tangan Anda di area putih di bawah ini
            </p>
            <div className="text-xs text-gray-500 mb-2">
              Canvas Status: {signatureCanvasRef.current ? '✅ Loaded' : '❌ Not Loaded'} | 
              Drawing: {isDrawing ? '🖊️ Active' : '⏸️ Inactive'}
            </div>
            
            <div className="mb-4" style={{ width: '400px', height: '200px', border: '3px solid #e5e7eb', borderRadius: '8px', backgroundColor: 'white' }}>
              <canvas
                ref={signatureCanvasRef}
                width={400}
                height={200}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={(e) => {
                  e.preventDefault()
                  const touch = e.touches[0]
                  const mouseEvent = new MouseEvent('mousedown', {
                    clientX: touch.clientX,
                    clientY: touch.clientY
                  })
                  startDrawing(mouseEvent as any)
                }}
                onTouchMove={(e) => {
                  e.preventDefault()
                  const touch = e.touches[0]
                  const mouseEvent = new MouseEvent('mousemove', {
                    clientX: touch.clientX,
                    clientY: touch.clientY
                  })
                  draw(mouseEvent as any)
                }}
                onTouchEnd={(e) => {
                  e.preventDefault()
                  stopDrawing()
                }}
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  cursor: 'crosshair',
                  borderRadius: '8px',
                  touchAction: 'none',
                  display: 'block'
                }}
              />
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={clearSignature}
                className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
              >
                🗑️ Clear
              </button>
              <button
                onClick={() => {
                  // Test drawing
                  const canvas = signatureCanvasRef.current
                  if (canvas) {
                    const ctx = canvas.getContext('2d')
                    if (ctx) {
                      ctx.beginPath()
                      ctx.moveTo(50, 50)
                      ctx.lineTo(100, 100)
                      ctx.stroke()
                      console.log('Test line drawn')
                    }
                  }
                }}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
              >
                🧪 Test Draw
              </button>
              <button
                onClick={() => {
                  setShowSignatureModal(false)
                  setCurrentSignatureElement(null)
                }}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
              >
                ❌ Cancel
              </button>
              <button
                onClick={saveSignature}
                className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
              >
                ✅ Save & Add to Certificate
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .canvas-container {
          width: 800px;
          height: 600px;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          position: relative;
          background: white;
          margin: 0 auto;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .canvas-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
        }

        .placeholder-content {
          text-align: center;
          color: #64748b;
        }

        .placeholder-icon {
          font-size: 48px;
          margin-bottom: 16px;
          opacity: 0.6;
        }

        .placeholder-text {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 8px;
          color: #475569;
        }

        .placeholder-subtitle {
          font-size: 14px;
          color: #94a3b8;
        }

        .canvas-background-image {
          width: 100%;
          height: 100%;
          position: absolute;
          top: 0;
          left: 0;
          background-position: center;
          background-repeat: no-repeat;
          z-index: 0;
        }

        .element-editor-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 1;
          pointer-events: auto;
        }

        .element-editor-overlay .simple-element-editor {
          pointer-events: auto;
        }

        .element-editor-overlay .element-canvas {
          border: none !important;
          background: transparent !important;
          pointer-events: auto;
        }

        .element-editor-overlay .element-canvas > div {
          pointer-events: auto !important;
        }

        .upload-container {
          width: 100%;
          height: 200px;
          border: 2px dashed #d1d5db;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
          background: white;
        }

        .upload-container:hover {
          border-color: #3b82f6;
          background-color: #f8fafc;
        }

        .upload-container:disabled {
          cursor: not-allowed;
          opacity: 0.6;
        }

        .upload-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .upload-content {
          text-align: center;
          color: #6b7280;
        }

        .upload-icon {
          font-size: 32px;
          margin-bottom: 12px;
          opacity: 0.7;
        }

        .upload-text {
          font-size: 16px;
          font-weight: 500;
          margin-bottom: 4px;
          color: #374151;
        }

        .upload-hint {
          font-size: 12px;
          color: #9ca3af;
        }

        .uploading-content {
          text-align: center;
          color: #3b82f6;
        }

        .uploading-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid #e5e7eb;
          border-top: 3px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 12px;
        }

        .uploading-text {
          font-size: 14px;
          font-weight: 500;
          color: #3b82f6;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .image-preview {
          width: 100%;
          height: 100%;
          position: relative;
        }

        .preview-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .upload-container:hover .overlay {
          opacity: 1;
        }

        .change-text {
          color: white;
          font-size: 14px;
          font-weight: 500;
        }

        /* Font Size Slider Styling */
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

        .signature-canvas {
          width: 100% !important;
          height: 100% !important;
          border-radius: 8px;
          cursor: crosshair;
        }
      `}</style>
    </div>
  )
}