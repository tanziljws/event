import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET - Fetch all active carousel items
export async function GET() {
  try {
    const carouselItems = await prisma.eventsHeader.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        sortOrder: 'asc'
      }
    })

    return NextResponse.json(carouselItems)
  } catch (error) {
    console.error('Error fetching carousel items:', error)
    return NextResponse.json(
      { message: 'Failed to fetch carousel items' },
      { status: 500 }
    )
  }
}

// POST - Create new carousel item
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { videoUrl, title, subtitle, description, ctaText, ctaLink, logoUrl, sortOrder } = body

    // Validate required fields
    if (!videoUrl || !title || !subtitle || !description || !ctaText || !ctaLink) {
      return NextResponse.json(
        { message: 'All required fields must be provided' },
        { status: 400 }
      )
    }

    const carouselItem = await prisma.eventsHeader.create({
      data: {
        videoUrl,
        title,
        subtitle,
        description,
        ctaText,
        ctaLink,
        logoUrl: logoUrl || null,
        sortOrder: sortOrder || 0,
        isActive: true
      }
    })

    return NextResponse.json(carouselItem)
  } catch (error) {
    console.error('Error creating carousel item:', error)
    return NextResponse.json(
      { message: 'Failed to create carousel item' },
      { status: 500 }
    )
  }
}
