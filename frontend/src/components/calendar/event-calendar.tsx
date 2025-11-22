'use client'

import React, { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface Event {
  id: string
  title: string
  createdAt: string
  eventDate: string
  status: string
  category: string
  location: string
  maxParticipants: number
  isPublished: boolean
  generateCertificate: boolean
  _count: {
    registrations: number
  }
}

interface EventCalendarProps {
  events: Event[]
  onEventClick: (event: Event) => void
}

export default function EventCalendar({ events, onEventClick }: EventCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  // Get calendar data
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  // Get first day of month and number of days
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()
  const startingDayOfWeek = firstDay.getDay()

  // Get events by creation date
  const eventsByDate = events.reduce((acc, event) => {
    const eventDate = new Date(event.createdAt).toDateString()
    if (!acc[eventDate]) {
      acc[eventDate] = []
    }
    acc[eventDate].push(event)
    return acc
  }, {} as Record<string, Event[]>)


  // Navigation
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
    setSelectedDate(null)
  }

  // Get events for a specific date
  const getEventsForDate = (date: Date) => {
    return eventsByDate[date.toDateString()] || []
  }

  // Check if date has events
  const hasEvents = (date: Date) => {
    return getEventsForDate(date).length > 0
  }

  // Get event count for date
  const getEventCount = (date: Date) => {
    return getEventsForDate(date).length
  }

  // Render calendar days
  const renderCalendarDays = () => {
    const days = []
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ]

    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(
        <div key={`empty-${i}`} className="h-24 border border-gray-200 bg-gray-50"></div>
      )
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      const isToday = date.toDateString() === new Date().toDateString()
      const isSelected = selectedDate?.toDateString() === date.toDateString()
      const eventCount = getEventCount(date)
      const hasEvent = hasEvents(date)

      days.push(
        <div
          key={day}
          className={`h-24 border border-gray-200 p-2 cursor-pointer hover:bg-gray-50 transition-colors ${
            isToday ? 'bg-blue-50 border-blue-300' : ''
          } ${isSelected ? 'bg-blue-100 border-blue-400' : ''}`}
          onClick={() => setSelectedDate(date)}
        >
          <div className="flex items-center justify-between mb-1">
            <span className={`text-sm font-medium ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
              {day}
            </span>
            {hasEvent && (
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-xs text-blue-600 font-medium">{eventCount}</span>
              </div>
            )}
          </div>
          {hasEvent && (
            <div className="text-xs text-gray-600 truncate">
              {getEventsForDate(date)[0]?.title}
              {eventCount > 1 && ` +${eventCount - 1} more`}
            </div>
          )}
        </div>
      )
    }

    return days
  }

  // Get selected date events
  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : []

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Calendar */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPreviousMonth}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h2 className="text-xl font-semibold">
                  {new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNextMonth}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={goToToday}
              >
                Today
              </Button>
            </div>
            <CardDescription>Events created by date</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-0">
              {/* Day headers */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="h-8 flex items-center justify-center text-sm font-medium text-gray-500 border-b border-gray-200">
                  {day}
                </div>
              ))}
              {/* Calendar days */}
              {renderCalendarDays()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Events List */}
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center">
                  <CalendarIcon className="mr-2 h-5 w-5" />
                  {selectedDate ? 'Events Created' : 'Select a Date'}
                </CardTitle>
                <CardDescription>
                  {selectedDate 
                    ? `Events created on ${selectedDate.toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}`
                    : 'Click on a date to view events'
                  }
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {selectedDate ? (
              <div className="space-y-3">
                {selectedDateEvents.length === 0 ? (
                  <div className="text-center py-8">
                    <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No events created</h3>
                    <p className="mt-1 text-sm text-gray-500">No events were created on this date.</p>
                  </div>
                ) : (
                  selectedDateEvents.map((event) => (
                    <div
                      key={event.id}
                      className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => onEventClick(event)}
                    >
                      <h4 className="font-medium text-gray-900 text-sm">{event.title}</h4>
                      <p className="text-xs text-gray-500 mt-1">{event.category}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-600">{event._count.registrations} participants</span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          event.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                          event.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                          event.status === 'DRAFT' ? 'bg-gray-100 text-gray-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {event.status === 'APPROVED' ? 'Published' : 
                           event.status === 'PENDING' ? 'Pending' : 
                           event.status === 'DRAFT' ? 'Draft' : 
                           event.status === 'REJECTED' ? 'Rejected' : event.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Select a date</h3>
                <p className="mt-1 text-sm text-gray-500">Click on a calendar date to view events created on that day.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
