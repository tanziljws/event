'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Plus, 
  Trash2, 
  DollarSign, 
  Tag, 
  Palette, 
  Gift, 
  Settings as SettingsIcon,
  GripVertical,
  Info,
  AlertCircle,
  Eye
} from 'lucide-react'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

// Ticket type interface
export interface TicketType {
  id?: string
  name: string
  description: string
  price: number | null
  isFree: boolean
  capacity: number
  saleStartDate: string | null
  saleEndDate: string | null
  benefits: string[]
  color: string
  icon: string
  badgeText: string | null
  minQuantity: number
  maxQuantity: number
  requiresApproval: boolean
  termsConditions: string | null
  originalPrice: number | null
  discountPercentage: number | null
  promoCode: string | null
  isActive: boolean
  sortOrder?: number
}

// Default ticket type
const defaultTicketType: TicketType = {
  name: '',
  description: '',
  price: null,
  isFree: true,
  capacity: 100,
  saleStartDate: null,
  saleEndDate: null,
  benefits: [],
  color: '#2563EB', // Default blue
  icon: 'ticket',
  badgeText: null,
  minQuantity: 1,
  maxQuantity: 10,
  requiresApproval: false,
  termsConditions: null,
  originalPrice: null,
  discountPercentage: null,
  promoCode: null,
  isActive: true
}

// Available colors for tickets
const colorOptions = [
  { name: 'Blue', value: '#2563EB' },
  { name: 'Red', value: '#DC2626' },
  { name: 'Green', value: '#16A34A' },
  { name: 'Purple', value: '#9333EA' },
  { name: 'Pink', value: '#DB2777' },
  { name: 'Orange', value: '#EA580C' },
  { name: 'Yellow', value: '#CA8A04' },
  { name: 'Teal', value: '#0D9488' },
  { name: 'Indigo', value: '#4F46E5' },
  { name: 'Cyan', value: '#06B6D4' },
  { name: 'Lime', value: '#65A30D' },
  { name: 'Amber', value: '#D97706' }
]

// Available icons for tickets
const iconOptions = [
  { name: 'Ticket', value: 'ticket' },
  { name: 'Star', value: 'star' },
  { name: 'Crown', value: 'crown' },
  { name: 'Diamond', value: 'diamond' },
  { name: 'Gift', value: 'gift' },
  { name: 'Heart', value: 'heart' },
  { name: 'Lightning', value: 'lightning' },
  { name: 'Medal', value: 'medal' },
  { name: 'Trophy', value: 'trophy' },
  { name: 'Fire', value: 'fire' },
  { name: 'Rocket', value: 'rocket' }
]

// Suggested benefits
const suggestedBenefits = [
  'Free merchandise',
  'Priority seating',
  'Early access',
  'Meet & greet with speakers',
  'Exclusive workshop access',
  'Certificate of participation',
  'Lunch included',
  'Networking session',
  'Recording of sessions',
  'Goodie bag',
  'VIP parking',
  'Exclusive Q&A session'
]

interface CustomTicketFormProps {
  ticketTypes: TicketType[]
  onChange: (ticketTypes: TicketType[]) => void
  onPreview?: (ticketType: TicketType) => void
}

export default function CustomTicketForm({ 
  ticketTypes = [], 
  onChange,
  onPreview
}: CustomTicketFormProps) {
  const [activeTicketIndex, setActiveTicketIndex] = useState(0)
  const [activeTab, setActiveTab] = useState('basic')
  const [newBenefit, setNewBenefit] = useState('')

  // Initialize with at least one ticket type if none provided
  useEffect(() => {
    if (ticketTypes.length === 0) {
      onChange([{...defaultTicketType}])
    }
  }, [])

  // Handle adding a new ticket type
  const handleAddTicketType = () => {
    const newTicketTypes = [...ticketTypes, {...defaultTicketType}]
    onChange(newTicketTypes)
    setActiveTicketIndex(newTicketTypes.length - 1)
    setActiveTab('basic')
  }

  // Handle removing a ticket type
  const handleRemoveTicketType = (index: number) => {
    const newTicketTypes = ticketTypes.filter((_, i) => i !== index)
    onChange(newTicketTypes)
    
    // Adjust active index if needed
    if (index <= activeTicketIndex) {
      setActiveTicketIndex(Math.max(0, activeTicketIndex - 1))
    }
  }

  // Handle updating a ticket type
  const handleUpdateTicketType = (index: number, field: keyof TicketType, value: any) => {
    const newTicketTypes = [...ticketTypes]
    newTicketTypes[index] = {
      ...newTicketTypes[index],
      [field]: value
    }
    
    // Special handling for isFree toggle
    if (field === 'isFree' && value === true) {
      newTicketTypes[index].price = null
    }
    
    onChange(newTicketTypes)
  }

  // Handle adding a benefit
  const handleAddBenefit = () => {
    if (!newBenefit.trim()) return
    
    const newTicketTypes = [...ticketTypes]
    newTicketTypes[activeTicketIndex].benefits = [
      ...newTicketTypes[activeTicketIndex].benefits,
      newBenefit.trim()
    ]
    
    onChange(newTicketTypes)
    setNewBenefit('')
  }

  // Handle adding a suggested benefit
  const handleAddSuggestedBenefit = (benefit: string) => {
    const newTicketTypes = [...ticketTypes]
    
    // Only add if not already in the list
    if (!newTicketTypes[activeTicketIndex].benefits.includes(benefit)) {
      newTicketTypes[activeTicketIndex].benefits = [
        ...newTicketTypes[activeTicketIndex].benefits,
        benefit
      ]
      
      onChange(newTicketTypes)
    }
  }

  // Handle removing a benefit
  const handleRemoveBenefit = (benefitIndex: number) => {
    const newTicketTypes = [...ticketTypes]
    newTicketTypes[activeTicketIndex].benefits = newTicketTypes[activeTicketIndex].benefits.filter(
      (_, i) => i !== benefitIndex
    )
    
    onChange(newTicketTypes)
  }

  // Get icon component based on name
  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'ticket': return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/></svg>
      case 'star': return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
      case 'crown': return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/></svg>
      case 'diamond': return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 2H8l-4 6h16l-4-6Z"/><path d="M4 8v1l8 13 8-13V8H4Z"/></svg>
      case 'gift': return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"/></svg>
      case 'heart': return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
      case 'lightning': return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 16.326A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 .5 8.973"/><path d="m13 12-3 5h4l-3 5"/></svg>
      case 'medal': return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7.21 15 2.66 7.14a2 2 0 0 1 .13-2.2L4.4 2.8A2 2 0 0 1 6 2h12a2 2 0 0 1 1.6.8l1.6 2.14a2 2 0 0 1 .14 2.2L16.79 15"/><path d="M11 12 5.12 2.2"/><path d="m13 12 5.88-9.8"/><path d="M8 7h8"/><circle cx="12" cy="17" r="5"/><path d="M12 18v-2h-.5"/></svg>
      case 'trophy': return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 22V8a2 2 0 1 1 4 0v14"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M12 17a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/></svg>
      case 'fire': return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>
      case 'rocket': return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>
      default: return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/></svg>
    }
  }

  // If no ticket types, show empty state
  if (ticketTypes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Ticket Types</h3>
          <p className="text-sm text-gray-500 mb-4">Create your first ticket type to get started</p>
          <Button onClick={handleAddTicketType}>
            <Plus className="mr-2 h-4 w-4" />
            Add Ticket Type
          </Button>
        </div>
      </div>
    )
  }

  const activeTicket = ticketTypes[activeTicketIndex] || defaultTicketType

  return (
    <div className="space-y-6">
      {/* Ticket Type Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2">
        {ticketTypes.map((ticket, index) => (
          <Button
            key={index}
            variant={activeTicketIndex === index ? "primary" : "outline"}
            className={`flex items-center ${activeTicketIndex === index ? '' : 'border-dashed'}`}
            style={{
              backgroundColor: activeTicketIndex === index ? ticket.color + '20' : 'transparent',
              borderColor: ticket.color,
              color: activeTicketIndex === index ? ticket.color : 'inherit'
            }}
            onClick={() => setActiveTicketIndex(index)}
          >
            <div className="flex items-center">
              <span className="mr-2">{getIconComponent(ticket.icon)}</span>
              <span>{ticket.name || `Ticket ${index + 1}`}</span>
            </div>
          </Button>
        ))}
        <Button 
          variant="ghost" 
          className="flex-shrink-0 border border-dashed border-gray-300 hover:border-gray-400"
          onClick={handleAddTicketType}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Ticket
        </Button>
      </div>

      {/* Active Ticket Form */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xl font-semibold">
            {activeTicket.name ? activeTicket.name : `Ticket ${activeTicketIndex + 1}`}
          </CardTitle>
          <div className="flex items-center space-x-2">
            {ticketTypes.length > 1 && (
              <Button 
                variant="ghost" 
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => handleRemoveTicketType(activeTicketIndex)}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Remove
              </Button>
            )}
            {onPreview && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onPreview(activeTicket)}
              >
                <Eye className="h-4 w-4 mr-1" />
                Preview
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4 mb-6">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="visual">Visual</TabsTrigger>
              <TabsTrigger value="benefits">Benefits</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>
            
            {/* Basic Info Tab */}
            <TabsContent value="basic" className="space-y-4">
              <div>
                <Label htmlFor="name">Ticket Name</Label>
                <Input
                  id="name"
                  placeholder="e.g. VIP, Early Bird, Student"
                  value={activeTicket.name}
                  onChange={(e) => handleUpdateTicketType(activeTicketIndex, 'name', e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what's included with this ticket"
                  value={activeTicket.description}
                  onChange={(e) => handleUpdateTicketType(activeTicketIndex, 'description', e.target.value)}
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="capacity">Capacity</Label>
                <Input
                  id="capacity"
                  type="number"
                  min="1"
                  placeholder="100"
                  value={activeTicket.capacity}
                  onChange={(e) => handleUpdateTicketType(activeTicketIndex, 'capacity', parseInt(e.target.value) || 0)}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="saleStartDate">Sale Start Date</Label>
                  <Input
                    id="saleStartDate"
                    type="datetime-local"
                    value={activeTicket.saleStartDate || ''}
                    onChange={(e) => handleUpdateTicketType(activeTicketIndex, 'saleStartDate', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="saleEndDate">Sale End Date</Label>
                  <Input
                    id="saleEndDate"
                    type="datetime-local"
                    value={activeTicket.saleEndDate || ''}
                    onChange={(e) => handleUpdateTicketType(activeTicketIndex, 'saleEndDate', e.target.value)}
                  />
                </div>
              </div>
            </TabsContent>
            
            {/* Visual Tab */}
            <TabsContent value="visual" className="space-y-6">
              <div>
                <Label className="mb-2 block">Ticket Color</Label>
                <div className="grid grid-cols-6 gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      className={`w-full aspect-square rounded-md border-2 ${
                        activeTicket.color === color.value ? 'border-black' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color.value }}
                      onClick={() => handleUpdateTicketType(activeTicketIndex, 'color', color.value)}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
              
              <div>
                <Label className="mb-2 block">Ticket Icon</Label>
                <div className="grid grid-cols-6 gap-2">
                  {iconOptions.map((icon) => (
                    <button
                      key={icon.value}
                      type="button"
                      className={`w-full aspect-square rounded-md border-2 flex items-center justify-center ${
                        activeTicket.icon === icon.value 
                          ? 'border-black bg-gray-100' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleUpdateTicketType(activeTicketIndex, 'icon', icon.value)}
                      title={icon.name}
                    >
                      {getIconComponent(icon.value)}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <Label htmlFor="badgeText">Badge Text (Optional)</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="badgeText"
                    placeholder="e.g. EARLY, LIMITED, SPECIAL"
                    value={activeTicket.badgeText || ''}
                    onChange={(e) => handleUpdateTicketType(activeTicketIndex, 'badgeText', e.target.value)}
                    maxLength={10}
                  />
                  {activeTicket.badgeText && (
                    <div className="flex-shrink-0">
                      <Badge 
                        style={{ 
                          backgroundColor: activeTicket.color,
                          color: 'white'
                        }}
                      >
                        {activeTicket.badgeText}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
            
            {/* Benefits Tab */}
            <TabsContent value="benefits" className="space-y-4">
              <div>
                <Label htmlFor="benefits">Ticket Benefits</Label>
                <div className="flex items-center space-x-2 mb-2">
                  <Input
                    id="benefits"
                    placeholder="Add a benefit"
                    value={newBenefit}
                    onChange={(e) => setNewBenefit(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddBenefit()
                      }
                    }}
                  />
                  <Button 
                    type="button" 
                    onClick={handleAddBenefit}
                    disabled={!newBenefit.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Benefits List */}
                <div className="space-y-2 max-h-60 overflow-y-auto p-2">
                  {activeTicket.benefits.length === 0 ? (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      No benefits added yet
                    </div>
                  ) : (
                    activeTicket.benefits.map((benefit, index) => (
                      <div 
                        key={index}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded-md group"
                      >
                        <div className="flex items-center">
                          <GripVertical className="h-4 w-4 text-gray-400 mr-2 cursor-move opacity-0 group-hover:opacity-100 transition-opacity" />
                          <span>{benefit}</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveBenefit(index)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
                
                {/* Suggested Benefits */}
                <div className="mt-4">
                  <Label className="text-sm text-gray-500 mb-2 block">Suggested Benefits</Label>
                  <div className="flex flex-wrap gap-2">
                    {suggestedBenefits.map((benefit) => (
                      <Badge
                        key={benefit}
                        variant="outline"
                        className="cursor-pointer hover:bg-gray-100"
                        onClick={() => handleAddSuggestedBenefit(benefit)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        {benefit}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>
            
            {/* Advanced Tab */}
            <TabsContent value="advanced" className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <DollarSign className="h-5 w-5 text-gray-500 mr-2" />
                  <div>
                    <Label htmlFor="isFree" className="text-base">Free Ticket</Label>
                    <p className="text-sm text-gray-500">Toggle for free or paid tickets</p>
                  </div>
                </div>
                <Switch
                  id="isFree"
                  checked={activeTicket.isFree}
                  onCheckedChange={(checked) => handleUpdateTicketType(activeTicketIndex, 'isFree', checked)}
                />
              </div>
              
              {!activeTicket.isFree && (
                <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <Label htmlFor="price">Ticket Price</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                      <Input
                        id="price"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        className="pl-10"
                        value={activeTicket.price || ''}
                        onChange={(e) => handleUpdateTicketType(activeTicketIndex, 'price', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="originalPrice">Original Price (Optional)</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                        <Input
                          id="originalPrice"
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          className="pl-10"
                          value={activeTicket.originalPrice || ''}
                          onChange={(e) => handleUpdateTicketType(activeTicketIndex, 'originalPrice', parseFloat(e.target.value) || null)}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="discountPercentage">Discount Percentage</Label>
                      <div className="relative">
                        <Input
                          id="discountPercentage"
                          type="number"
                          min="0"
                          max="100"
                          placeholder="0"
                          value={activeTicket.discountPercentage || ''}
                          onChange={(e) => handleUpdateTicketType(activeTicketIndex, 'discountPercentage', parseFloat(e.target.value) || null)}
                        />
                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="promoCode">Promo Code (Optional)</Label>
                    <Input
                      id="promoCode"
                      placeholder="e.g. EARLYBIRD"
                      value={activeTicket.promoCode || ''}
                      onChange={(e) => handleUpdateTicketType(activeTicketIndex, 'promoCode', e.target.value)}
                    />
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="minQuantity">Min Quantity per Purchase</Label>
                  <Input
                    id="minQuantity"
                    type="number"
                    min="1"
                    placeholder="1"
                    value={activeTicket.minQuantity}
                    onChange={(e) => handleUpdateTicketType(activeTicketIndex, 'minQuantity', parseInt(e.target.value) || 1)}
                  />
                </div>
                <div>
                  <Label htmlFor="maxQuantity">Max Quantity per Purchase</Label>
                  <Input
                    id="maxQuantity"
                    type="number"
                    min="1"
                    placeholder="10"
                    value={activeTicket.maxQuantity}
                    onChange={(e) => handleUpdateTicketType(activeTicketIndex, 'maxQuantity', parseInt(e.target.value) || 1)}
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-gray-500 mr-2" />
                  <div>
                    <Label htmlFor="requiresApproval" className="text-base">Requires Approval</Label>
                    <p className="text-sm text-gray-500">Manually approve registrations</p>
                  </div>
                </div>
                <Switch
                  id="requiresApproval"
                  checked={activeTicket.requiresApproval}
                  onCheckedChange={(checked) => handleUpdateTicketType(activeTicketIndex, 'requiresApproval', checked)}
                />
              </div>
              
              <div>
                <Label htmlFor="termsConditions">Terms & Conditions (Optional)</Label>
                <Textarea
                  id="termsConditions"
                  placeholder="Add any specific terms for this ticket type"
                  value={activeTicket.termsConditions || ''}
                  onChange={(e) => handleUpdateTicketType(activeTicketIndex, 'termsConditions', e.target.value)}
                  rows={3}
                />
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <SettingsIcon className="h-5 w-5 text-gray-500 mr-2" />
                  <div>
                    <Label htmlFor="isActive" className="text-base">Active Status</Label>
                    <p className="text-sm text-gray-500">Enable or disable this ticket type</p>
                  </div>
                </div>
                <Switch
                  id="isActive"
                  checked={activeTicket.isActive}
                  onCheckedChange={(checked) => handleUpdateTicketType(activeTicketIndex, 'isActive', checked)}
                />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}