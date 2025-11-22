'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TicketType } from './CustomTicketForm'

interface TicketPreviewProps {
  ticket: TicketType
  eventTitle?: string
}

export default function TicketPreview({ ticket, eventTitle }: TicketPreviewProps) {
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

  // Format price display
  const formatPrice = (price: number | null) => {
    if (price === null) return 'Free'
    return `$${price.toFixed(2)}`
  }

  return (
    <div className="max-w-md mx-auto">
      <Card className="overflow-hidden border-2" style={{ borderColor: ticket.color }}>
        <div 
          className="p-4 flex items-center justify-between" 
          style={{ backgroundColor: ticket.color + '20' }}
        >
            <div className="flex flex-col">
              {eventTitle && (
                <p className="text-sm text-gray-500 mb-1">{eventTitle}</p>
              )}
              <div className="flex items-center">
                <div className="mr-2" style={{ color: ticket.color }}>
                  {getIconComponent(ticket.icon)}
                </div>
                <h3 className="font-bold text-lg">{ticket.name || 'Unnamed Ticket'}</h3>
              </div>
            </div>
          {ticket.badgeText && (
            <Badge style={{ backgroundColor: ticket.color, color: 'white' }}>
              {ticket.badgeText}
            </Badge>
          )}
        </div>
        
        <CardContent className="p-4 space-y-4">
          {ticket.description && (
            <p className="text-gray-600 text-sm">{ticket.description}</p>
          )}
          
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Price</p>
              <div className="flex items-center">
                <p className="font-bold text-xl">{formatPrice(ticket.price)}</p>
                {ticket.originalPrice && !ticket.isFree && (
                  <p className="text-sm text-gray-500 line-through ml-2">
                    ${ticket.originalPrice.toFixed(2)}
                  </p>
                )}
              </div>
              {ticket.discountPercentage && !ticket.isFree && (
                <Badge variant="outline" className="text-green-600 border-green-600">
                  {ticket.discountPercentage}% OFF
                </Badge>
              )}
            </div>
            
            <div className="text-right">
              <p className="text-sm text-gray-500">Capacity</p>
              <p className="font-semibold">{ticket.capacity}</p>
            </div>
          </div>
          
          {ticket.benefits.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">What's included:</p>
              <ul className="space-y-1">
                {ticket.benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start">
                    <svg 
                      className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {(ticket.saleStartDate || ticket.saleEndDate) && (
            <div className="border-t pt-3 text-sm text-gray-500">
              {ticket.saleStartDate && (
                <p>Sales start: {new Date(ticket.saleStartDate).toLocaleDateString()}</p>
              )}
              {ticket.saleEndDate && (
                <p>Sales end: {new Date(ticket.saleEndDate).toLocaleDateString()}</p>
              )}
            </div>
          )}
          
          {ticket.requiresApproval && (
            <div className="bg-yellow-50 p-2 rounded text-sm text-yellow-700">
              Registration requires approval
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}