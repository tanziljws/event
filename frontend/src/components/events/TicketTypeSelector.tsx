'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TicketType } from '@/types'
import { Check, Plus, Minus, Star, Gift, Heart, Zap, Award, Trophy, Flame, Rocket, Crown, Diamond, Tag, Circle, Disc } from 'lucide-react'

interface TicketTypeSelectorProps {
  ticketTypes: TicketType[]
  selectedTicketTypeId?: string | null
  quantity?: number
  onTicketTypeSelect: (ticketType: TicketType, quantity: number) => void
  disabled?: boolean
}

// Icon mapping
const getIconComponent = (iconName: string) => {
  const icons: { [key: string]: React.ReactNode } = {
    ticket: <Tag className="w-5 h-5" />,
    star: <Star className="w-5 h-5" />,
    crown: <Crown className="w-5 h-5" />,
    diamond: <Diamond className="w-5 h-5" />,
    gift: <Gift className="w-5 h-5" />,
    heart: <Heart className="w-5 h-5" />,
    lightning: <Zap className="w-5 h-5" />,
    medal: <Award className="w-5 h-5" />,
    trophy: <Trophy className="w-5 h-5" />,
    fire: <Flame className="w-5 h-5" />,
    rocket: <Rocket className="w-5 h-5" />,
  }
  return icons[iconName] || <Tag className="w-5 h-5" />
}

const formatPrice = (price: number | null, isFree: boolean) => {
  if (isFree || price === null || price === 0) return 'Gratis'
  return `Rp ${price.toLocaleString('id-ID')}`
}

export default function TicketTypeSelector({
  ticketTypes,
  selectedTicketTypeId,
  quantity: initialQuantity = 1,
  onTicketTypeSelect,
  disabled = false
}: TicketTypeSelectorProps) {
  const [quantities, setQuantities] = useState<{ [key: string]: number }>({})

  // Initialize quantities
  useEffect(() => {
    const initialQuantities: { [key: string]: number } = {}
    ticketTypes.forEach(ticket => {
      initialQuantities[ticket.id] = initialQuantity
    })
    setQuantities(initialQuantities)
  }, [ticketTypes, initialQuantity])

  const handleQuantityChange = (e: React.MouseEvent, ticketId: string, delta: number) => {
    e.stopPropagation() // Prevent card selection when changing quantity

    const currentQty = quantities[ticketId] || 1
    const ticket = ticketTypes.find(t => t.id === ticketId)
    if (!ticket) return

    const maxQty = ticket.maxQuantity || 10
    const minQty = ticket.minQuantity || 1
    const remainingCapacity = ticket.remainingCapacity ?? (ticket.capacity - (ticket.soldCount || 0))

    const newQty = Math.max(minQty, Math.min(maxQty, Math.min(currentQty + delta, remainingCapacity)))

    setQuantities(prev => ({
      ...prev,
      [ticketId]: newQty
    }))

    // If this ticket is selected, update the selection immediately
    if (selectedTicketTypeId === ticketId) {
      onTicketTypeSelect(ticket, newQty)
    }
  }

  const handleTicketSelect = (ticket: TicketType) => {
    if (disabled) return
    const remainingCapacity = ticket.remainingCapacity ?? (ticket.capacity - (ticket.soldCount || 0))
    if (remainingCapacity <= 0) return

    const qty = quantities[ticket.id] || 1
    onTicketTypeSelect(ticket, qty)
  }

  const getTicketColor = (color: string) => {
    if (color.startsWith('#')) {
      return color
    }
    return `#${color}`
  }

  if (ticketTypes.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-gray-500">Tidak ada tiket tersedia untuk event ini.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {ticketTypes.map((ticket) => {
        const isSelected = selectedTicketTypeId === ticket.id
        const isSoldOut = (ticket.remainingCapacity ?? (ticket.capacity - (ticket.soldCount || 0))) <= 0
        const currentQuantity = quantities[ticket.id] || 1
        const remainingCapacity = ticket.remainingCapacity ?? (ticket.capacity - (ticket.soldCount || 0))
        const ticketColor = getTicketColor(ticket.color)

        return (
          <div
            key={ticket.id}
            onClick={() => !isSoldOut && handleTicketSelect(ticket)}
            className={`
              relative rounded-xl transition-all duration-300 cursor-pointer overflow-hidden group
              ${isSelected
                ? 'shadow-lg shadow-blue-200/50 scale-[1.01]'
                : 'shadow-md hover:shadow-lg hover:scale-[1.005]'
              }
              ${(disabled || isSoldOut) ? 'opacity-60 cursor-not-allowed' : ''}
            `}
          >
            {/* Ticket Container */}
            <div className="bg-white rounded-xl overflow-hidden border border-gray-200">
              <div className="flex flex-col md:flex-row">
                {/* Left Side - Main Content (70%) */}
                <div className="flex-1 p-4 md:p-5 relative">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3 mt-1">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {/* Radio Indicator */}
                        {isSelected ? (
                          <div
                            className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: ticketColor }}
                          >
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex-shrink-0"></div>
                        )}

                        <h3 className="font-bold text-base text-gray-900">
                          {ticket.name}
                        </h3>
                      </div>

                      {ticket.badgeText && (
                        <Badge
                          className="ml-7 text-xs font-semibold"
                          style={{ backgroundColor: ticketColor }}
                        >
                          {ticket.badgeText}
                        </Badge>
                      )}
                    </div>

                    {/* Price */}
                    <div className="text-right ml-3">
                      <div className="font-bold text-lg" style={{ color: ticketColor }}>
                        {formatPrice(ticket.price, ticket.isFree)}
                      </div>
                      {ticket.originalPrice && ticket.price && ticket.originalPrice > ticket.price && (
                        <div className="text-xs text-gray-400 line-through">
                          Rp {ticket.originalPrice.toLocaleString('id-ID')}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  {ticket.description && (
                    <p className="text-xs text-gray-600 mb-3 ml-7">
                      {ticket.description}
                    </p>
                  )}

                  {/* Benefits */}
                  {ticket.benefits && ticket.benefits.length > 0 && (
                    <div className="ml-7 mb-3">
                      <ul className="space-y-1">
                        {ticket.benefits.slice(0, isSelected ? undefined : 3).map((benefit, index) => (
                          <li key={index} className="flex items-center gap-2 text-xs text-gray-600">
                            <Check className="w-3 h-3 text-green-500 flex-shrink-0" />
                            <span>{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Capacity Info */}
                  <div className="ml-7 flex items-center gap-2 text-xs text-gray-500">
                    {isSoldOut ? (
                      <span className="text-red-600 font-medium flex items-center gap-1 px-2 py-0.5 bg-red-50 rounded-md">
                        <Tag className="w-3 h-3" /> Habis Terjual
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-gray-50 rounded-md">
                        <Tag className="w-3 h-3" />
                        Sisa {remainingCapacity - (isSelected ? currentQuantity : 0)} tiket
                      </span>
                    )}
                  </div>
                </div>

                {/* Separator Line & Notches */}
                <div className="relative flex md:flex-col items-center justify-center">
                  {/* Desktop Line (Vertical) */}
                  <div className="hidden md:block h-[80%] w-px border-l-2 border-dashed border-gray-300"></div>
                  {/* Mobile Line (Horizontal) */}
                  <div className="md:hidden w-[80%] h-px border-t-2 border-dashed border-gray-300 my-3"></div>

                  {/* Notches - Bigger for more prominent curve */}
                  <div className="absolute -top-4 md:-top-4 left-1/2 md:left-auto md:-top-4 w-8 h-8 bg-gray-50 rounded-full transform -translate-x-1/2 md:translate-x-0 z-10 shadow-[inset_0_-2px_6px_rgba(0,0,0,0.15)]"></div>
                  <div className="absolute -bottom-4 md:-bottom-4 left-1/2 md:left-auto md:-bottom-4 w-8 h-8 bg-gray-50 rounded-full transform -translate-x-1/2 md:translate-x-0 z-10 shadow-[inset_0_2px_6px_rgba(0,0,0,0.15)]"></div>
                </div>

                {/* Right Side - Stub (30%) */}
                <div
                  className="w-full md:w-48 p-4 md:p-5 flex flex-col items-center justify-between border-l-0 md:border-l border-dashed border-gray-200 relative"
                  style={{ backgroundColor: ticketColor }}
                >
                  {/* Selection Indicator */}
                  {isSelected && (
                    <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center shadow-md">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}

                  <div className="text-center w-full space-y-3">
                    {/* Icon */}
                    <div
                      className="w-12 h-12 rounded-xl mx-auto flex items-center justify-center shadow-sm bg-white/20 backdrop-blur-sm"
                    >
                      <div className="text-white">
                        {getIconComponent(ticket.icon || 'ticket')}
                      </div>
                    </div>

                    {/* Quantity Selector - Only when selected */}
                    {isSelected && !isSoldOut && (
                      <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <p className="text-xs text-white/90 mb-1.5 font-medium">Jumlah</p>
                        <div className="flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-lg border border-white/20 p-0.5 shadow-sm">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 hover:bg-white text-gray-700"
                            onClick={(e) => handleQuantityChange(e, ticket.id, -1)}
                            disabled={disabled || currentQuantity <= (ticket.minQuantity || 1)}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-8 text-center font-bold text-gray-900 text-sm">{currentQuantity}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 hover:bg-white text-gray-700"
                            onClick={(e) => handleQuantityChange(e, ticket.id, 1)}
                            disabled={
                              disabled ||
                              currentQuantity >= (ticket.maxQuantity || 10) ||
                              currentQuantity >= remainingCapacity
                            }
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Barcode Visual */}
                  <div className="w-full mt-4 opacity-40">
                    <div className="h-6 w-full flex items-end justify-center gap-[2px] overflow-hidden">
                      {[...Array(25)].map((_, i) => (
                        <div
                          key={i}
                          className="bg-white"
                          style={{
                            width: Math.random() > 0.5 ? '1px' : '2px',
                            height: `${Math.random() * 50 + 50}%`
                          }}
                        ></div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
