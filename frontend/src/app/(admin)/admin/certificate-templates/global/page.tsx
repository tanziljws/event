'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading'
import { SkeletonCertificateTemplates } from '@/components/ui/skeleton'
import { ApiService } from '@/lib/api'
import { SimpleElementEditor } from '@/components/certificate/SimpleElementEditor'
import {
  FileText,
  Edit,
  Plus,
  Save,
  X,
  Download,
  RotateCcw,
  RotateCw,
  Settings,
  Type,
  Image as ImageIcon,
  Layout,
  Move,
  Palette
} from 'lucide-react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'

interface GlobalTemplate {
  id: string
  name: string
  description: string
  backgroundImage?: string
  elements: any[]
  isActive: boolean
  isDefault: boolean
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

export default function GlobalCertificateTemplatesPage() {
  // Helper function to ensure elements have proper position
  const ensureElementsHavePosition = (elements: SimpleElement[]): SimpleElement[] => {
    return elements.map(element => ({
      ...element,
      position: element.position || { x: 400, y: 300 }
    }))
  }

  const [templates, setTemplates] = useState<GlobalTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<GlobalTemplate | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showTemplateEditor, setShowTemplateEditor] = useState(false)
  const [isCreatingNew, setIsCreatingNew] = useState(false)

  // Template editor states
  const [templateName, setTemplateName] = useState('')
  const [templateDescription, setTemplateDescription] = useState('')
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

  // Canvas dimensions (must match SimpleElementEditor props)
  const canvasWidth = 800
  const canvasHeight = 600

  const exportRef = useRef<HTMLDivElement>(null)
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)

  // Element properties state for sidebar
  const [selectedElementForEdit, setSelectedElementForEdit] = useState<SimpleElement | null>(null)

  // History state
  const [history, setHistory] = useState<SimpleElement[][]>([[]])
  const [historyIndex, setHistoryIndex] = useState(0)

  const handleElementsChange = (newElements: SimpleElement[]) => {
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(newElements)
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
    setElements(newElements)
  }

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      setHistoryIndex(newIndex)
      setElements(history[newIndex])
    }
  }

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1
      setHistoryIndex(newIndex)
      setElements(history[newIndex])
    }
  }

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      setLoading(true)



      const response = await ApiService.getGlobalCertificateTemplates({
        page: 1,
        limit: 100
      })



      if (response.success) {
        setTemplates(response.data.templates || [])
      } else {
        setError('Failed to fetch global templates')
      }
    } catch (err: any) {
      console.error('Fetch Templates Error:', err)

      let errorMessage = 'Failed to fetch global templates'

      if (err.response?.status === 404) {
        errorMessage = 'API endpoint not found. Please check if you are logged in as SUPER_ADMIN.'
      } else if (err.response?.status === 401) {
        errorMessage = 'Authentication failed. Please login again.'
      } else if (err.response?.status === 403) {
        errorMessage = 'Access denied. You need SUPER_ADMIN role to access global templates.'
      }

      setError(errorMessage)
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

  const handleCreateTemplate = () => {
    setIsCreatingNew(true)
    setSelectedTemplate(null)
    setShowTemplateEditor(true)
    resetTemplateEditor()
  }

  const handleEditTemplate = async (template: GlobalTemplate) => {
    try {
      setIsCreatingNew(false)
      setSelectedTemplate(template)
      setShowTemplateEditor(true)

      // Load template data
      setTemplateName(template.name)
      setTemplateDescription(template.description)
      setBackgroundImage(template.backgroundImage || '')
      setElements(ensureElementsHavePosition(template.elements || []))
      setHistory([ensureElementsHavePosition(template.elements || [])])
      setHistoryIndex(0)
      setSelectedElementId(null)
    } catch (error) {
      console.error('Error loading template:', error)
      alert('Error loading template')
    }
  }

  const handleViewTemplate = async (template: GlobalTemplate) => {
    try {
      setIsCreatingNew(false)
      setSelectedTemplate(template)
      setShowTemplateEditor(true)

      // Load template data for view only
      setTemplateName(template.name)
      setTemplateDescription(template.description)
      setBackgroundImage(template.backgroundImage || '')
      setElements(ensureElementsHavePosition(template.elements || []))
      setSelectedElementId(null)
    } catch (error) {
      console.error('Error loading template:', error)
      alert('Error loading template')
    }
  }

  const handleDuplicateTemplate = async (template: GlobalTemplate) => {
    try {
      setIsCreatingNew(true)
      setSelectedTemplate(null)
      setShowTemplateEditor(true)

      // Load template data with new name
      setTemplateName(`${template.name} (Copy)`)
      setTemplateDescription(template.description)
      setBackgroundImage(template.backgroundImage || '')
      setElements(ensureElementsHavePosition(template.elements || []))
      setHistory([ensureElementsHavePosition(template.elements || [])])
      setHistoryIndex(0)
      setSelectedElementId(null)
    } catch (error) {
      console.error('Error duplicating template:', error)
      alert('Error duplicating template')
    }
  }

  const handleDeleteTemplate = async (template: GlobalTemplate) => {
    if (!confirm(`Are you sure you want to delete "${template.name}"? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await ApiService.deleteGlobalCertificateTemplate(template.id)

      if (response.success) {
        await fetchTemplates()
        alert('Template deleted successfully!')
      } else {
        throw new Error(response.message || 'Failed to delete template')
      }
    } catch (err) {
      console.error('Delete template error:', err)
      alert('Error deleting template')
    }
  }

  const resetTemplateEditor = () => {
    setTemplateName('')
    setTemplateDescription('')
    setBackgroundImage('')
    setElements([])
    setHistory([[]])
    setHistoryIndex(0)
    setSelectedElementId(null)
    setSelectedElementForEdit(null)
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

    const getDefaultFont = (elementType: string) => {
      switch (elementType) {
        case 'user_name':
          return 'Ephesis'
        case 'event_name':
          return 'Great Vibes'
        default:
          return 'Inter'
      }
    }

    const newElement: SimpleTextElement = {
      id: `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'text',
      text: textContent,
      position: { x: 400, y: 300 },
      fontSize: type === 'user_name' ? 32 : 24,
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

      // Validate template data
      if (!templateName.trim()) {
        throw new Error('Please enter a template name')
      }

      if (!backgroundImage) {
        throw new Error('Please upload a background image first')
      }

      if (!elements || elements.length === 0) {
        throw new Error('Please add at least one text or signature element')
      }

      // Prepare template data
      const templateData = {
        name: templateName.trim(),
        description: templateDescription.trim(),
        backgroundImage,
        backgroundSize,
        elements,
        isActive: true,
        isDefault: true // Global template is always default
      }

      // Save to database via API
      let response
      if (isCreatingNew) {
        // Create new template
        response = await ApiService.createGlobalCertificateTemplate(templateData)
      } else if (selectedTemplate) {
        // Update existing template
        response = await ApiService.updateGlobalCertificateTemplate(selectedTemplate.id, templateData)
      } else {
        throw new Error('Invalid template state')
      }

      if (response.success) {
        // Close editor
        setShowTemplateEditor(false)

        // Reset states
        resetTemplateEditor()

        // Refresh template
        await fetchTemplates()

        // Show success message
        alert(`Global certificate template ${isCreatingNew ? 'created' : 'updated'} successfully!`)
      } else {
        throw new Error(response.message || 'Failed to save template')
      }
    } catch (err: any) {
      console.error('Save template error:', err)

      // Show detailed error message to user
      let errorMessage = 'Failed to save global certificate template'

      if (err.response?.status === 404) {
        errorMessage = 'Access denied. Please check if you are logged in as SUPER_ADMIN.'
      } else if (err.response?.status === 401) {
        errorMessage = 'Authentication failed. Please login again.'
      } else if (err.response?.status === 403) {
        errorMessage = 'Access denied. You need SUPER_ADMIN role to manage global templates.'
      } else if (err.message) {
        errorMessage = err.message
      }

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

  // Export functions
  const exportToPDF = async () => {
    if (!exportRef.current) return
    setIsExporting(true)

    try {
      // Wait a bit to ensure UI is ready
      await new Promise(resolve => setTimeout(resolve, 100))

      // Store original styles
      const originalWidth = exportRef.current.style.width
      const originalHeight = exportRef.current.style.height
      const originalMaxWidth = exportRef.current.style.maxWidth

      // Set exact dimensions for capture (800x600)
      exportRef.current.style.width = '800px'
      exportRef.current.style.height = '600px'
      exportRef.current.style.maxWidth = '800px'

      // Wait for layout to update
      await new Promise(resolve => setTimeout(resolve, 50))

      // Capture the entire exportRef which includes background image
      const canvas = await html2canvas(exportRef.current, {
        width: 800,
        height: 600,
        windowWidth: 800,
        windowHeight: 600,
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        // Ignore UI elements (toolbar, buttons, resize handles)
        ignoreElements: (element) => {
          // Ignore toolbar (first child of simple-element-editor)
          if (element.classList.contains('simple-element-editor')) {
            const firstChild = element.querySelector(':scope > div:first-child')
            if (firstChild && firstChild.contains(element)) return true
          }

          // Ignore buttons (delete buttons, etc.)
          if (element.tagName === 'BUTTON') return true

          // Ignore resize handles
          if (element.classList.contains('cursor-nw-resize')) return true
          if (element.classList.contains('cursor-ne-resize')) return true
          if (element.classList.contains('cursor-sw-resize')) return true
          if (element.classList.contains('cursor-se-resize')) return true
          if (element.classList.contains('cursor-n-resize')) return true
          if (element.classList.contains('cursor-s-resize')) return true
          if (element.classList.contains('cursor-e-resize')) return true
          if (element.classList.contains('cursor-w-resize')) return true

          return false
        },
        onclone: (clonedDoc) => {
          // Additional cleanup in cloned document
          const clonedWindow = clonedDoc.defaultView
          if (clonedWindow) {
            // Hide toolbar
            const toolbar = clonedDoc.querySelector('.simple-element-editor > div:first-child')
            if (toolbar) {
              (toolbar as HTMLElement).style.display = 'none'
            }

            // Hide all buttons
            const buttons = clonedDoc.querySelectorAll('button')
            buttons.forEach(btn => {
              (btn as HTMLElement).style.display = 'none'
            })

            // Hide resize handles
            const handles = clonedDoc.querySelectorAll('[class*="cursor-"][class*="-resize"]')
            handles.forEach(handle => {
              (handle as HTMLElement).style.display = 'none'
            })

            // Remove selection rings
            const rings = clonedDoc.querySelectorAll('.ring-2, .ring-blue-500, .ring-1')
            rings.forEach(ring => {
              const element = ring as HTMLElement
              element.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-1', 'ring-1', 'ring-blue-300', 'ring-dashed')
              element.style.outline = 'none'
              element.style.boxShadow = 'none'
            })

            // Hide "No selection" text and placeholder
            const placeholders = clonedDoc.querySelectorAll('.text-gray-500')
            placeholders.forEach(placeholder => {
              const text = (placeholder as HTMLElement).textContent
              if (text?.includes('No selection') || text?.includes('Upload background')) {
                (placeholder as HTMLElement).style.display = 'none'
              }
            })
          }
        }
      })

      // Restore original styles
      exportRef.current.style.width = originalWidth
      exportRef.current.style.height = originalHeight
      exportRef.current.style.maxWidth = originalMaxWidth

      const imgData = canvas.toDataURL('image/png', 1.0)
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [800, 600]
      })

      pdf.addImage(imgData, 'PNG', 0, 0, 800, 600)
      pdf.save(`${templateName || 'global-template'}.pdf`)
    } catch (error) {
      console.error('Error exporting to PDF:', error)
      alert(`Error exporting to PDF: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsExporting(false)
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
        <Button onClick={fetchTemplates}>Try Again</Button>
      </div>
    )
  }

  if (showTemplateEditor) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isCreatingNew ? 'Create Global Template' : 'Edit Global Template'}
            </h1>
            <p className="text-gray-600">
              {isCreatingNew ? 'Create a new global certificate template' : `Editing: ${selectedTemplate?.name}`}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="w-9 px-0"
              onClick={undo}
              disabled={historyIndex <= 0}
              title="Undo"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-9 px-0"
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              title="Redo"
            >
              <RotateCw className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowTemplateEditor(false)
                resetTemplateEditor()
              }}
            >
              Back to Template
            </Button>
          </div>
        </div>

        {/* Template Editor */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-3 space-y-4">
            <Card className="h-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Editor Tools</CardTitle>
                <CardDescription>
                  Configure template and elements
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Tabs defaultValue="settings" className="w-full">
                  <TabsList className="w-full grid grid-cols-3 rounded-none border-b bg-transparent p-0">
                    <TabsTrigger
                      value="settings"
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-blue-50/50"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </TabsTrigger>
                    <TabsTrigger
                      value="elements"
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-blue-50/50"
                    >
                      <Layout className="h-4 w-4 mr-2" />
                      Add
                    </TabsTrigger>
                    <TabsTrigger
                      value="properties"
                      disabled={!selectedElementForEdit}
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-blue-50/50"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </TabsTrigger>
                  </TabsList>

                  {/* Tab: Settings */}
                  <TabsContent value="settings" className="p-4 space-y-4 m-0">
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <Label htmlFor="templateName">Template Name *</Label>
                        <Input
                          id="templateName"
                          value={templateName}
                          onChange={(e) => setTemplateName(e.target.value)}
                          placeholder="e.g., Certificate of Achievement"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="templateDesc">Description</Label>
                        <textarea
                          id="templateDesc"
                          value={templateDescription}
                          onChange={(e) => setTemplateDescription(e.target.value)}
                          placeholder="Brief description..."
                          rows={3}
                          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                      </div>

                      <Separator />

                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label>Background Image *</Label>
                          <div className="grid w-full items-center gap-1.5">
                            <Label htmlFor="bg-image" className="cursor-pointer">
                              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-400 hover:bg-blue-50/50 transition-all text-center">
                                {backgroundImage ? (
                                  <div className="relative aspect-video w-full overflow-hidden rounded-md bg-gray-100">
                                    <img src={backgroundImage} alt="Background" className="object-cover w-full h-full" />
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-md">
                                      <span className="text-white text-xs font-medium">Change Image</span>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex flex-col items-center gap-2 text-gray-500">
                                    <ImageIcon className="h-10 w-10" />
                                    <span className="text-sm font-medium">Click to upload background</span>
                                    <span className="text-xs text-gray-400">PNG, JPG, or WebP</span>
                                  </div>
                                )}
                              </div>
                            </Label>
                            <Input
                              id="bg-image"
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleBackgroundImageUpload}
                            />
                          </div>
                          {isUploading && (
                            <div className="flex items-center gap-2 text-xs text-blue-600">
                              <LoadingSpinner size="sm" /> Uploading...
                            </div>
                          )}
                        </div>

                        {backgroundImage && (
                          <div className="space-y-2">
                            <Label htmlFor="backgroundSize">Background Size</Label>
                            <select
                              id="backgroundSize"
                              value={backgroundSize}
                              onChange={(e) => setBackgroundSize(e.target.value as 'cover' | 'contain' | 'auto')}
                              className="w-full h-9 px-3 text-sm border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                            >
                              <option value="cover">Cover (Fill entire canvas)</option>
                              <option value="contain">Contain (Fit within canvas)</option>
                              <option value="auto">Auto (Original size)</option>
                            </select>
                            <p className="text-xs text-gray-500">
                              {backgroundSize === 'cover' && 'Image will fill the entire canvas, may be cropped'}
                              {backgroundSize === 'contain' && 'Image will fit within canvas, may have empty space'}
                              {backgroundSize === 'auto' && 'Image will display at original size'}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  {/* Tab: Elements */}
                  <TabsContent value="elements" className="p-4 space-y-4 m-0">
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium mb-3 text-gray-700">Text Elements</h4>
                        <div className="grid grid-cols-1 gap-2">
                          <Button
                            variant="outline"
                            className="justify-start h-auto py-3 px-4 border-dashed hover:border-blue-500 hover:bg-blue-50 transition-all"
                            onClick={() => addTextElement('user_name')}
                          >
                            <div className="bg-blue-100 p-2 rounded-md mr-3">
                              <Type className="h-4 w-4 text-blue-600" />
                            </div>
                            <div className="text-left">
                              <div className="font-medium text-sm">Participant Name</div>
                              <div className="text-xs text-gray-500">Dynamic placeholder</div>
                            </div>
                          </Button>

                          <Button
                            variant="outline"
                            className="justify-start h-auto py-3 px-4 border-dashed hover:border-blue-500 hover:bg-blue-50 transition-all"
                            onClick={() => addTextElement('event_name')}
                          >
                            <div className="bg-purple-100 p-2 rounded-md mr-3">
                              <Type className="h-4 w-4 text-purple-600" />
                            </div>
                            <div className="text-left">
                              <div className="font-medium text-sm">Event Name</div>
                              <div className="text-xs text-gray-500">Dynamic placeholder</div>
                            </div>
                          </Button>

                          <Button
                            variant="outline"
                            className="justify-start h-auto py-3 px-4 border-dashed hover:border-blue-500 hover:bg-blue-50 transition-all"
                            onClick={openCustomTextModal}
                          >
                            <div className="bg-gray-100 p-2 rounded-md mr-3">
                              <Type className="h-4 w-4 text-gray-600" />
                            </div>
                            <div className="text-left">
                              <div className="font-medium text-sm">Custom Text</div>
                              <div className="text-xs text-gray-500">Static text label</div>
                            </div>
                          </Button>
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <h4 className="text-sm font-medium mb-3 text-gray-700">Graphics</h4>
                        <Button
                          variant="outline"
                          className="w-full justify-start h-auto py-3 px-4 border-dashed hover:border-blue-500 hover:bg-blue-50 transition-all"
                          onClick={addSignatureElement}
                        >
                          <div className="bg-green-100 p-2 rounded-md mr-3">
                            <ImageIcon className="h-4 w-4 text-green-600" />
                          </div>
                          <div className="text-left">
                            <div className="font-medium text-sm">Digital Signature</div>
                            <div className="text-xs text-gray-500">Draw or upload signature</div>
                          </div>
                        </Button>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Tab: Properties */}
                  <TabsContent value="properties" className="p-4 space-y-4 m-0">
                    {selectedElementForEdit ? (
                      <div className="space-y-4">
                        {/* Element Info */}
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-3 rounded-md border border-blue-200 text-xs space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 font-medium">Type:</span>
                            <span className="font-semibold text-blue-700 capitalize px-2 py-0.5 bg-white rounded">{selectedElementForEdit.type.replace('_', ' ')}</span>
                          </div>
                          <Separator className="my-2" />
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <Label className="text-xs text-gray-600">X Position</Label>
                              <Input
                                type="number"
                                value={Math.round(selectedElementForEdit.position.x)}
                                onChange={(e) => {
                                  const newX = parseInt(e.target.value) || 0
                                  const newElements = elements.map(el =>
                                    el.id === selectedElementForEdit.id
                                      ? { ...el, position: { ...el.position, x: newX } }
                                      : el
                                  )
                                  setElements(newElements)
                                  setSelectedElementForEdit({ ...selectedElementForEdit, position: { ...selectedElementForEdit.position, x: newX } })
                                }}
                                className="h-8 text-xs"
                                min="0"
                                max={canvasWidth}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs text-gray-600">Y Position</Label>
                              <Input
                                type="number"
                                value={Math.round(selectedElementForEdit.position.y)}
                                onChange={(e) => {
                                  const newY = parseInt(e.target.value) || 0
                                  const newElements = elements.map(el =>
                                    el.id === selectedElementForEdit.id
                                      ? { ...el, position: { ...el.position, y: newY } }
                                      : el
                                  )
                                  setElements(newElements)
                                  setSelectedElementForEdit({ ...selectedElementForEdit, position: { ...selectedElementForEdit.position, y: newY } })
                                }}
                                className="h-8 text-xs"
                                min="0"
                                max={canvasHeight}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Text Properties */}
                        {selectedElementForEdit.type === 'text' && (
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label className="text-xs uppercase text-gray-500 font-semibold tracking-wider">Typography</Label>

                              <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                  <Label className="text-xs">Font Family</Label>
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
                                    className="w-full h-9 px-2 text-xs border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
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

                                <div className="space-y-1">
                                  <Label className="text-xs">Weight</Label>
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
                                    className="w-full h-9 px-2 text-xs border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                                  >
                                    <option value="normal">Normal</option>
                                    <option value="bold">Bold</option>
                                  </select>
                                </div>
                              </div>

                              <div className="space-y-1">
                                <div className="flex justify-between">
                                  <Label className="text-xs">Size</Label>
                                  <span className="text-xs text-gray-500">{(selectedElementForEdit as SimpleTextElement).fontSize}px</span>
                                </div>
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
                                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                />
                              </div>

                              <div className="space-y-1">
                                <Label className="text-xs">Alignment</Label>
                                <div className="flex bg-gray-100 rounded-md p-1 gap-1">
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
                                      className={`flex-1 py-1 text-xs rounded-sm transition-all ${(selectedElementForEdit as SimpleTextElement).textAlign === align
                                        ? 'bg-white shadow-sm text-blue-600 font-medium'
                                        : 'text-gray-500 hover:bg-gray-200'
                                        }`}
                                    >
                                      {align.charAt(0).toUpperCase() + align.slice(1)}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>

                            <Separator />

                            <div className="space-y-2">
                              <Label className="text-xs uppercase text-gray-500 font-semibold tracking-wider">Appearance</Label>
                              <div className="flex items-center gap-3">
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
                                  className="w-10 h-10 border border-gray-300 rounded cursor-pointer p-1 bg-white"
                                />
                                <div className="flex-1">
                                  <Input
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
                                    className="font-mono text-xs"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Signature Properties */}
                        {selectedElementForEdit.type === 'signature' && (
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label className="text-xs uppercase text-gray-500 font-semibold tracking-wider">Settings</Label>
                              <div className="space-y-1">
                                <Label className="text-xs">Label (Optional)</Label>
                                <Input
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
                                  placeholder="e.g., Director"
                                />
                              </div>
                            </div>

                            <Separator />

                            <div className="space-y-2">
                              <Label className="text-xs uppercase text-gray-500 font-semibold tracking-wider">Size</Label>
                              <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                  <Label className="text-xs">Width</Label>
                                  <Input
                                    type="number"
                                    value={(selectedElementForEdit as SimpleSignatureElement).width}
                                    onChange={(e) => {
                                      const newWidth = parseInt(e.target.value) || 150
                                      const newElements = elements.map(el =>
                                        el.id === selectedElementForEdit.id
                                          ? { ...el, width: newWidth }
                                          : el
                                      )
                                      setElements(newElements)
                                      setSelectedElementForEdit({ ...selectedElementForEdit, width: newWidth } as SimpleSignatureElement)
                                    }}
                                    className="h-8 text-xs"
                                    min="50"
                                    max={canvasWidth}
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs">Height</Label>
                                  <Input
                                    type="number"
                                    value={(selectedElementForEdit as SimpleSignatureElement).height}
                                    onChange={(e) => {
                                      const newHeight = parseInt(e.target.value) || 60
                                      const newElements = elements.map(el =>
                                        el.id === selectedElementForEdit.id
                                          ? { ...el, height: newHeight }
                                          : el
                                      )
                                      setElements(newElements)
                                      setSelectedElementForEdit({ ...selectedElementForEdit, height: newHeight } as SimpleSignatureElement)
                                    }}
                                    className="h-8 text-xs"
                                    min="30"
                                    max={canvasHeight}
                                  />
                                </div>
                              </div>
                            </div>

                            <Separator />

                            <Button
                              variant="outline"
                              className="w-full"
                              onClick={() => handleOpenSignatureModal(selectedElementForEdit as SimpleSignatureElement)}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Redraw Signature
                            </Button>
                          </div>
                        )}

                        <Separator />

                        <Button
                          variant="destructive"
                          className="w-full"
                          onClick={() => {
                            const newElements = elements.filter(el => el.id !== selectedElementForEdit.id)
                            setElements(newElements)
                            setSelectedElementForEdit(null)
                          }}
                        >
                          Delete Element
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Move className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <p className="text-sm font-medium">No Element Selected</p>
                        <p className="text-xs mt-1">Select an element on the canvas to edit its properties.</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>

                <div className="p-4 border-t bg-gray-50 space-y-2">
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
                        {isCreatingNew ? 'Create Template' : 'Update Template'}
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={exportToPDF}
                    disabled={isExporting}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export PDF
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Canvas */}
          <div className="lg:col-span-9">
            <Card>
              <CardHeader>
                <CardTitle>Template Preview</CardTitle>
                <CardDescription>
                  Design your global certificate template
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
                          <p className="text-lg font-medium">Global Certificate Template Canvas</p>
                          <p className="text-sm">Upload background image and add elements</p>
                        </div>
                      </div>
                    )}

                    <SimpleElementEditor
                      elements={elements}
                      onElementsChange={handleElementsChange}
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

              <div className="flex gap-2">
                <Button onClick={handleSignatureClear} variant="outline">
                  Clear
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
          <h1 className="text-3xl font-bold text-gray-900">Global Certificate Templates</h1>
          <p className="text-gray-600">Create and manage reusable certificate templates</p>
        </div>
        <Button onClick={handleCreateTemplate}>
          <Plus className="mr-2 h-4 w-4" />
          Create Template
        </Button>
      </div>

      {/* Templates List */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow overflow-hidden">
            {/* Template Preview Thumbnail */}
            {template.backgroundImage ? (
              <div className="relative h-48 bg-gray-100 overflow-hidden">
                <img
                  src={template.backgroundImage}
                  alt={`${template.name} preview`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2">
                  {template.isDefault ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500 text-white shadow-md">
                      Default
                    </span>
                  ) : template.isActive ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500 text-white shadow-md">
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-500 text-white shadow-md">
                      Inactive
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="relative h-48 bg-gradient-to-br from-blue-100 to-indigo-200 flex items-center justify-center">
                <div className="text-center">
                  <FileText className="mx-auto h-12 w-12 text-blue-400 mb-2" />
                  <p className="text-sm text-blue-600 font-medium">No Preview</p>
                </div>
                <div className="absolute top-2 right-2">
                  {template.isDefault ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500 text-white shadow-md">
                      Default
                    </span>
                  ) : template.isActive ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500 text-white shadow-md">
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-500 text-white shadow-md">
                      Inactive
                    </span>
                  )}
                </div>
              </div>
            )}

            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg line-clamp-2">{template.name}</CardTitle>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-gray-500">
                      {template.description || 'No description'}
                    </p>
                    <p className="text-sm text-gray-500">
                      Created: {formatDate(template.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  Elements: {Array.isArray(template.elements) ? template.elements.length : 0}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleViewTemplate(template)}
                  >
                    <FileText className="mr-1 h-4 w-4" />
                    View
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleEditTemplate(template)}
                  >
                    <Edit className="mr-1 h-4 w-4" />
                    Edit
                  </Button>
                  {!template.isDefault && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteTemplate(template)}
                      className="text-red-600 hover:text-red-700"
                    >
                      ×
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {templates.length === 0 && (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Global Templates Found</h3>
          <p className="text-gray-500 mb-4">Create your first global certificate template to get started.</p>
          <Button onClick={handleCreateTemplate}>
            <Plus className="mr-2 h-4 w-4" />
            Create Template
          </Button>
        </div>
      )}
    </div>
  )
}

