import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET - Fetch specific carousel item
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const item = await prisma.eventsHeader.findUnique({
      where: { id: params.id }
    })

    if (!item) {
      return NextResponse.json(
        { message: 'Carousel item not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(item)
  } catch (error) {
    console.error('Error fetching carousel item:', error)
    return NextResponse.json(
      { message: 'Failed to fetch carousel item' },
      { status: 500 }
    )
  }
}

// PATCH - Update carousel item
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { bannerUrl, title, subtitle, description, ctaText, ctaLink, logoUrl, sortOrder, isActive } = body

    // Check if item exists
    const existingItem = await prisma.eventsHeader.findUnique({
      where: { id: params.id }
    })

    if (!existingItem) {
      return NextResponse.json(
        { message: 'Carousel item not found' },
        { status: 404 }
      )
    }

    // Update item
    const updatedItem = await prisma.eventsHeader.update({
      where: { id: params.id },
      data: {
        ...(bannerUrl && { bannerUrl }),
        ...(title && { title }),
        ...(subtitle && { subtitle }),
        ...(description && { description }),
        ...(ctaText && { ctaText }),
        ...(ctaLink && { ctaLink }),
        ...(logoUrl !== undefined && { logoUrl }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(isActive !== undefined && { isActive }),
        updatedAt: new Date()
      }
    })

    return NextResponse.json(updatedItem)
  } catch (error) {
    console.error('Error updating carousel item:', error)
    return NextResponse.json(
      { message: 'Failed to update carousel item' },
      { status: 500 }
    )
  }
}

// DELETE - Delete carousel item
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if item exists
    const existingItem = await prisma.eventsHeader.findUnique({
      where: { id: params.id }
    })

    if (!existingItem) {
      return NextResponse.json(
        { message: 'Carousel item not found' },
        { status: 404 }
      )
    }

    // Delete item
    await prisma.eventsHeader.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Carousel item deleted successfully' })
  } catch (error) {
    console.error('Error deleting carousel item:', error)
    return NextResponse.json(
      { message: 'Failed to delete carousel item' },
      { status: 500 }
    )
  }
}
