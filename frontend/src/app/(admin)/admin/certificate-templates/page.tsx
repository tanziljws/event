'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading'
import { SkeletonCertificateTemplates } from '@/components/ui/skeleton'
import { ApiService } from '@/lib/api'
import { SimpleElementEditor } from '@/components/certificate/SimpleElementEditor'
import { 
  Calendar, 
  FileText, 
  Edit, 
  Eye,
  Plus,
  Download,
  Save,
  Upload,
  X
} from 'lucide-react'
import Link from 'next/link'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

interface Event {
  id: string
  title: string
  eventDate: string
  eventTime: string
  location: string
  isPublished: boolean
  certificateTemplateUrl?: string
  hasCertificateTemplate: boolean
  participantCount: number
}

interface CertificateTemplate {
  id: string
  eventId: string
  eventTitle: string
  backgroundImage?: string
  elements: any[]
  createdAt: string
  updatedAt: string
}

interface SimpleTextElement {
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
  isDynamic?: boolean
  dynamicType?: 'user_name' | 'event_name'
}

interface SimpleSignatureElement {
  id: string
  type: 'signature'
  position: { x: number; y: number }
  width: number
  height: number
  signatureData: string
  label?: string
}

type SimpleElement = SimpleTextElement | SimpleSignatureElement

export default function CertificateTemplatesPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [showTemplateEditor, setShowTemplateEditor] = useState(false)
  
  // Template editor states
  const [backgroundImage, setBackgroundImage] = useState<string>('')
  const [isUploading, setIsUploading] = useState(false)
  const [backgroundSize, setBackgroundSize] = useState<'cover' | 'contain' | 'auto'>('cover')
  const [elements, setElements] = useState<SimpleElement[]>([])
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [textElementType, setTextElementType] = useState<'user_name' | 'event_name' | 'custom'>('user_name')
  const [showSignatureModal, setShowSignatureModal] = useState(false)
  const [currentSignatureElement, setCurrentSignatureElement] = useState<SimpleSignatureElement | null>(null)
  const [showCustomTextModal, setShowCustomTextModal] = useState(false)
  const [customTextInput, setCustomTextInput] = useState('')
  
  const exportRef = useRef<HTMLDivElement>(null)
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  
  // Element properties state for sidebar
  const [selectedElementForEdit, setSelectedElementForEdit] = useState<SimpleElement | null>(null)

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const response = await ApiService.getCertificateTemplates({ 
        page: 1, 
        limit: 100
      })
      
      if (response.success) {
        // Get events with template status
        const eventsResponse = await ApiService.getEvents({ 
          page: 1, 
          limit: 100
        })
        
        if (eventsResponse.success) {
          const events = eventsResponse.data.events || []
          const templates = response.data.templates || []
          
          // Add template status to events
          const eventsWithStatus = events.map((event: any) => ({
            ...event,
            hasCertificateTemplate: templates.some((template: any) => template.eventId === event.id),
            certificateTemplateUrl: templates.find((template: any) => template.eventId === event.id)?.backgroundImage
          }))
          
          setEvents(eventsWithStatus)
        } else {
          setError('Failed to fetch events')
        }
      } else {
        setError('Failed to fetch certificate templates')
      }
    } catch (err) {
      setError('Failed to fetch events')
      console.error('Events error:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const handleCreateTemplate = (event: Event) => {
    setSelectedEvent(event)
    setShowTemplateEditor(true)
  }

  const handleEditTemplate = async (event: Event) => {
    try {
      setSelectedEvent(event)
      setShowTemplateEditor(true)
      
      // Load existing template data
      const response = await ApiService.getCertificateTemplate(event.id)
      if (response.success && response.data) {
        const template = response.data
        setBackgroundImage(template.backgroundImage || '')
        setBackgroundSize(template.backgroundSize || 'cover')
        setElements(template.elements || [])
        setSelectedElementId(null)
      } else {
        // No existing template, start fresh
        setBackgroundImage('')
        setBackgroundSize('cover')
        setElements([])
        setSelectedElementId(null)
      }
    } catch (error) {
      console.error('Error loading template:', error)
      // Start fresh if error
      setBackgroundImage('')
      setBackgroundSize('cover')
      setElements([])
      setSelectedElementId(null)
    }
  }

  const handleViewTemplate = async (event: Event) => {
    try {
      setSelectedEvent(event)
      setShowTemplateEditor(true)
      
      // Load existing template data for view only
      const response = await ApiService.getCertificateTemplate(event.id)
      if (response.success && response.data) {
        const template = response.data
        setBackgroundImage(template.backgroundImage || '')
        setBackgroundSize(template.backgroundSize || 'cover')
        setElements(template.elements || [])
        setSelectedElementId(null)
      } else {
        alert('No template found for this event')
        return
      }
    } catch (error) {
      console.error('Error loading template:', error)
      alert('Error loading template')
    }
  }

  // Template editor functions
  const handleBackgroundImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setIsUploading(true)
      const reader = new FileReader()
      reader.onload = (e) => {
        setBackgroundImage(e.target?.result as string)
        setIsUploading(false)
      }
      reader.readAsDataURL(file)
    }
  }

  const addTextElement = (type: 'user_name' | 'event_name' | 'custom' = textElementType, customText?: string) => {
    const textContent = type === 'user_name' ? '[Nama Peserta]' : 
                       type === 'event_name' ? '[Nama Event]' : 
                       customText || 'Custom Text'
    
    // Set default font based on element type
    const getDefaultFont = (elementType: string) => {
      switch (elementType) {
        case 'user_name':
          return 'Ephesis' // Elegant font for participant name
        case 'event_name':
          return 'Great Vibes' // Calligraphy font for event name
        default:
          return 'Inter' // Standard font for custom text
      }
    }
    
    const newElement: SimpleTextElement = {
      id: `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'text',
      text: textContent,
      position: { x: 400, y: 300 },
      fontSize: type === 'user_name' ? 32 : 24, // Larger font for participant name
      fontFamily: getDefaultFont(type),
      color: '#000000',
      fontWeight: 'normal',
      textAlign: 'center',
      isDynamic: type !== 'custom',
      dynamicType: type === 'custom' ? undefined : type
    }
    
    setElements([...elements, newElement])
    setSelectedElementId(newElement.id)
  }

  const addSignatureElement = () => {
    const newSignatureElement: SimpleSignatureElement = {
      id: `signature-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'signature',
      position: { x: 400, y: 500 },
      width: 150,
      height: 60,
      signatureData: '',
      label: ''
    }
    
    setElements([...elements, newSignatureElement])
    setCurrentSignatureElement(newSignatureElement)
    setShowSignatureModal(true)
  }

  const handleCustomTextSubmit = () => {
    if (customTextInput.trim()) {
      addTextElement('custom', customTextInput.trim())
      setCustomTextInput('')
      setShowCustomTextModal(false)
    }
  }

  const openCustomTextModal = () => {
    setCustomTextInput('')
    setShowCustomTextModal(true)
  }

  const handleSaveTemplate = async () => {
    try {
      setIsExporting(true)
      
      if (!selectedEvent) {
        throw new Error('No event selected')
      }
      
      // Validate template data
      if (!backgroundImage) {
        throw new Error('Please upload a background image first')
      }
      
      if (!elements || elements.length === 0) {
        throw new Error('Please add at least one text or signature element')
      }
      
      // Prepare template data
      const templateData = {
        backgroundImage,
        backgroundSize,
        elements
      }
      
      console.log('Saving template data:', {
        eventId: selectedEvent.id,
        templateData,
        elementsLength: elements.length,
        elements: elements,
        elementsType: typeof elements,
        elementsIsArray: Array.isArray(elements),
        elementsStringified: JSON.stringify(elements)
      })
      
      // Save to database via API
      const response = await ApiService.saveCertificateTemplate(selectedEvent.id, templateData)
      
      if (response.success) {
        // Close editor
        setShowTemplateEditor(false)
        setSelectedEvent(null)
        
        // Reset states
        setBackgroundImage('')
        setElements([])
        setSelectedElementId(null)
        
        // Refresh events list
        await fetchEvents()
        
        // Show success message
        alert('Certificate template saved successfully!')
      } else {
        throw new Error(response.message || 'Failed to save template')
      }
    } catch (err) {
      console.error('Save template error:', err)
      
      // Show detailed error message to user
      const errorMessage = (err as Error).message || 'Failed to save certificate template'
      alert(`Error: ${errorMessage}`)
    } finally {
      setIsExporting(false)
    }
  }

  const handleOpenSignatureModal = (element: SimpleSignatureElement) => {
    setCurrentSignatureElement(element)
    setShowSignatureModal(true)
  }

  const handleSignatureSave = () => {
    if (signatureCanvasRef.current && currentSignatureElement) {
      const signatureData = signatureCanvasRef.current.toDataURL()
      
      setElements(elements.map(el => 
        el.id === currentSignatureElement.id 
          ? { ...el, signatureData }
          : el
      ))
      
      setShowSignatureModal(false)
      setCurrentSignatureElement(null)
    }
  }

  const handleSignatureClear = () => {
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
      }
    }
  }, [showSignatureModal])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100">
        <div className="space-y-8 p-6">
          <SkeletonCertificateTemplates />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={fetchEvents}>Try Again</Button>
      </div>
    )
  }

  if (showTemplateEditor && selectedEvent) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Certificate Template Editor
            </h1>
            <p className="text-gray-600">
              Create certificate template for: <strong>{selectedEvent.title}</strong>
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowTemplateEditor(false)
                setSelectedEvent(null)
              }}
            >
              Back to Events
            </Button>
          </div>
        </div>

        {/* Template Editor */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Template Settings</CardTitle>
                <CardDescription>
                  Configure your certificate template
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Event Information
                  </label>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>Event:</strong> {selectedEvent.title}</p>
                    <p><strong>Date:</strong> {formatDate(selectedEvent.eventDate)}</p>
                    <p><strong>Location:</strong> {selectedEvent.location}</p>
                    <p><strong>Participants:</strong> {selectedEvent.participantCount}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Background Image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBackgroundImageUpload}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {isUploading && (
                    <div className="mt-2 text-sm text-blue-600">
                      <LoadingSpinner size="sm" /> Uploading...
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Add Text Element
                  </label>
                  <div className="space-y-2">
                    <Button 
                      size="sm" 
                      className="w-full justify-start"
                      onClick={() => addTextElement('user_name')}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Participant Name
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => addTextElement('event_name')}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Event Name
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={openCustomTextModal}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Custom Text
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Add Signature
                  </label>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={addSignatureElement}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Digital Signature
                  </Button>
                </div>

                {/* Element Properties */}
                {selectedElementForEdit && (
                  <div className="pt-4 border-t">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Element Properties
                    </label>
                    <div className="space-y-3">
                      {/* Element Info */}
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="text-sm">
                          <p><strong>Type:</strong> {selectedElementForEdit.type}</p>
                          {selectedElementForEdit.type === 'text' && (
                            <p><strong>Text:</strong> {(selectedElementForEdit as SimpleTextElement).text}</p>
                          )}
                          <p><strong>Position:</strong> {selectedElementForEdit.position.x}, {selectedElementForEdit.position.y}</p>
                        </div>
                      </div>

                      {/* Text Properties */}
                      {selectedElementForEdit.type === 'text' && (
                        <div className="space-y-3">
                          {/* Font Size */}
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Font Size</label>
                            <div className="flex items-center space-x-2">
                              <input
                                type="range"
                                min="8"
                                max="120"
                                value={(selectedElementForEdit as SimpleTextElement).fontSize}
                                onChange={(e) => {
                                  const newElements = elements.map(el => 
                                    el.id === selectedElementForEdit.id 
                                      ? { ...el, fontSize: parseInt(e.target.value) }
                                      : el
                                  )
                                  setElements(newElements)
                                  setSelectedElementForEdit({ ...selectedElementForEdit, fontSize: parseInt(e.target.value) } as SimpleTextElement)
                                }}
                                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                              />
                              <span className="text-xs text-gray-600 w-12 text-center">
                                {(selectedElementForEdit as SimpleTextElement).fontSize}px
                              </span>
                            </div>
                          </div>

                          {/* Font Family */}
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Font Family</label>
                            <select
                              value={(selectedElementForEdit as SimpleTextElement).fontFamily}
                              onChange={(e) => {
                                const newElements = elements.map(el => 
                                  el.id === selectedElementForEdit.id 
                                    ? { ...el, fontFamily: e.target.value }
                                    : el
                                )
                                setElements(newElements)
                                setSelectedElementForEdit({ ...selectedElementForEdit, fontFamily: e.target.value } as SimpleTextElement)
                              }}
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                            >
                              <optgroup label="Standard Fonts">
                                <option value="Arial">Arial</option>
                                <option value="Georgia">Georgia</option>
                                <option value="Times New Roman">Times New Roman</option>
                                <option value="Inter">Inter</option>
                                <option value="Helvetica">Helvetica</option>
                              </optgroup>
                              <optgroup label="Cursive/Script Fonts">
                                <option value="Brush Script MT">Brush Script MT</option>
                                <option value="Lucida Handwriting">Lucida Handwriting</option>
                                <option value="Comic Sans MS">Comic Sans MS</option>
                                <option value="Bradley Hand">Bradley Hand</option>
                                <option value="Chalkduster">Chalkduster</option>
                                <option value="Marker Felt">Marker Felt</option>
                                <option value="Papyrus">Papyrus</option>
                                <option value="Trattatello">Trattatello</option>
                                <option value="Apple Chancery">Apple Chancery</option>
                                <option value="Snell Roundhand">Snell Roundhand</option>
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
                              <optgroup label="Modern Fonts">
                                <option value="Segoe Script">Segoe Script</option>
                                <option value="Segoe Print">Segoe Print</option>
                                <option value="Freestyle Script">Freestyle Script</option>
                                <option value="French Script MT">French Script MT</option>
                                <option value="Edwardian Script ITC">Edwardian Script ITC</option>
                              </optgroup>
                            </select>
                          </div>

                          {/* Font Weight */}
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Font Weight</label>
                            <select
                              value={(selectedElementForEdit as SimpleTextElement).fontWeight}
                              onChange={(e) => {
                                const newElements = elements.map(el => 
                                  el.id === selectedElementForEdit.id 
                                    ? { ...el, fontWeight: e.target.value as 'normal' | 'bold' }
                                    : el
                                )
                                setElements(newElements)
                                setSelectedElementForEdit({ ...selectedElementForEdit, fontWeight: e.target.value as 'normal' | 'bold' } as SimpleTextElement)
                              }}
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                            >
                              <option value="normal">Normal</option>
                              <option value="bold">Bold</option>
                            </select>
                          </div>

                          {/* Color */}
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Color</label>
                            <div className="flex items-center space-x-2">
                              <input
                                type="color"
                                value={(selectedElementForEdit as SimpleTextElement).color}
                                onChange={(e) => {
                                  const newElements = elements.map(el => 
                                    el.id === selectedElementForEdit.id 
                                      ? { ...el, color: e.target.value }
                                      : el
                                  )
                                  setElements(newElements)
                                  setSelectedElementForEdit({ ...selectedElementForEdit, color: e.target.value } as SimpleTextElement)
                                }}
                                className="w-8 h-6 border border-gray-300 rounded"
                              />
                              <input
                                type="text"
                                value={(selectedElementForEdit as SimpleTextElement).color}
                                onChange={(e) => {
                                  const newElements = elements.map(el => 
                                    el.id === selectedElementForEdit.id 
                                      ? { ...el, color: e.target.value }
                                      : el
                                  )
                                  setElements(newElements)
                                  setSelectedElementForEdit({ ...selectedElementForEdit, color: e.target.value } as SimpleTextElement)
                                }}
                                className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
                              />
                            </div>
                          </div>

                          {/* Text Align */}
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Text Align</label>
                            <div className="flex space-x-1">
                              {['left', 'center', 'right'].map((align) => (
                                <button
                                  key={align}
                                  onClick={() => {
                                    const newElements = elements.map(el => 
                                      el.id === selectedElementForEdit.id 
                                        ? { ...el, textAlign: align as 'left' | 'center' | 'right' }
                                        : el
                                    )
                                    setElements(newElements)
                                    setSelectedElementForEdit({ ...selectedElementForEdit, textAlign: align as 'left' | 'center' | 'right' } as SimpleTextElement)
                                  }}
                                  className={`px-2 py-1 text-xs rounded ${
                                    (selectedElementForEdit as SimpleTextElement).textAlign === align
                                      ? 'bg-blue-500 text-white'
                                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                  }`}
                                >
                                  {align.charAt(0).toUpperCase() + align.slice(1)}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Signature Properties */}
                      {selectedElementForEdit.type === 'signature' && (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Signature Label</label>
                            <input
                              type="text"
                              value={(selectedElementForEdit as SimpleSignatureElement).label || ''}
                              onChange={(e) => {
                                const newElements = elements.map(el => 
                                  el.id === selectedElementForEdit.id 
                                    ? { ...el, label: e.target.value }
                                    : el
                                )
                                setElements(newElements)
                                setSelectedElementForEdit({ ...selectedElementForEdit, label: e.target.value } as SimpleSignatureElement)
                              }}
                              placeholder="e.g., Director, Manager"
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                            />
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full text-xs"
                            onClick={() => handleOpenSignatureModal(selectedElementForEdit as SimpleSignatureElement)}
                          >
                            ✍️ Edit Signature
                          </Button>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="pt-2 border-t">
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full text-xs text-red-600 hover:text-red-700"
                          onClick={() => {
                            const newElements = elements.filter(el => el.id !== selectedElementForEdit.id)
                            setElements(newElements)
                            setSelectedElementForEdit(null)
                          }}
                        >
                          🗑️ Delete Element
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <Button 
                    className="w-full"
                    onClick={handleSaveTemplate}
                    disabled={isExporting}
                  >
                    {isExporting ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Template
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Canvas */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>Certificate Preview</CardTitle>
                <CardDescription>
                  Design your certificate template
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <div 
                    ref={exportRef}
                    className="relative w-full aspect-[4/3] bg-gray-50 border-2 border-gray-300 rounded-lg overflow-hidden"
                    style={{
                      backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'none',
                      backgroundSize: backgroundSize,
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat'
                    }}
                  >
                    {!backgroundImage && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center text-gray-500">
                          <FileText className="mx-auto h-12 w-12 mb-4" />
                          <p className="text-lg font-medium">Certificate Template Canvas</p>
                          <p className="text-sm">Upload background image and add elements</p>
                        </div>
                      </div>
                    )}
                    
                    <SimpleElementEditor
                      elements={elements}
                      onElementsChange={setElements}
                      canvasWidth={800}
                      canvasHeight={600}
                      onOpenSignatureModal={handleOpenSignatureModal}
                      onElementSelect={(element) => setSelectedElementForEdit(element)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Signature Modal */}
        {showSignatureModal && currentSignatureElement && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Draw Signature</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSignatureModal(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
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
              
              <div className="text-xs text-gray-500 mb-2">
                Canvas Status: {signatureCanvasRef.current ? '✅ Loaded' : '❌ Not Loaded'} | 
                Drawing: {isDrawing ? '🖊️ Active' : '⏸️ Inactive'}
              </div>
              
              <div className="flex gap-2">
                <Button onClick={handleSignatureClear} variant="outline">
                  Clear
                </Button>
                <Button 
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
                  variant="outline"
                >
                  Test Draw
                </Button>
                <Button onClick={handleSignatureSave} className="flex-1">
                  Save Signature
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Custom Text Modal */}
        {showCustomTextModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Add Custom Text</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCustomTextModal(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Text Content
                </label>
                <input
                  type="text"
                  value={customTextInput}
                  onChange={(e) => setCustomTextInput(e.target.value)}
                  placeholder="Enter your custom text..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleCustomTextSubmit()
                    }
                  }}
                />
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowCustomTextModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCustomTextSubmit}
                  disabled={!customTextInput.trim()}
                  className="flex-1"
                >
                  Add Text
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Certificate Templates</h1>
          <p className="text-gray-600">Manage certificate templates for each event</p>
        </div>
      </div>

      {/* Events List */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => (
          <Card key={event.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg line-clamp-2">{event.title}</CardTitle>
                  <CardDescription className="mt-2">
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="mr-1 h-4 w-4" />
                      {formatDate(event.eventDate)} at {event.eventTime}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      📍 {event.location}
                    </div>
                  </CardDescription>
                </div>
                <div className="ml-4">
                  {event.hasCertificateTemplate ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <FileText className="mr-1 h-3 w-3" />
                      Template Ready
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      No Template
                    </span>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  {event.participantCount} participants
                </div>
                <div className="flex gap-2">
                  {event.hasCertificateTemplate ? (
                    <>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleViewTemplate(event)}
                      >
                        <Eye className="mr-1 h-4 w-4" />
                        View
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={() => handleEditTemplate(event)}
                      >
                        <Edit className="mr-1 h-4 w-4" />
                        Edit
                      </Button>
                    </>
                  ) : (
                    <Button 
                      size="sm" 
                      onClick={() => handleCreateTemplate(event)}
                    >
                      <Plus className="mr-1 h-4 w-4" />
                      Create Template
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {events.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Events Found</h3>
          <p className="text-gray-500 mb-4">Create your first event to start managing certificate templates.</p>
          <Link href="/admin/events/create">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Event
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}
