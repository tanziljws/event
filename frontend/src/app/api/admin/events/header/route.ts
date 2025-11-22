import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET - Fetch header content
export async function GET() {
  try {
    const headerContent = await prisma.eventsHeader.findFirst({
      orderBy: {
        updatedAt: 'desc'
      }
    })

    if (!headerContent) {
      // Return default content if none exists
      return NextResponse.json({
        id: 'default',
        videoUrl: 'https://www.youtube.com/embed/XEb4McVJ1-U?start=1578&autoplay=1&mute=1&controls=0&rel=0&modestbranding=1&loop=1&playlist=XEb4McVJ1-U',
        title: 'SHEILA ON 7',
        subtitle: '6th Anniversary Concert',
        description: 'May 1996 - 2012 • Special Performance. Experience the legendary Indonesian rock band\'s anniversary concert with exclusive live performances and unforgettable moments.',
        ctaText: 'Buy Tickets Now',
        ctaLink: '#',
        createdAt: new Date(),
        updatedAt: new Date()
      })
    }

    return NextResponse.json(headerContent)
  } catch (error) {
    console.error('Error fetching header content:', error)
    return NextResponse.json(
      { message: 'Failed to fetch header content' },
      { status: 500 }
    )
  }
}

// POST - Create or update header content
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { videoUrl, title, subtitle, description, ctaText, ctaLink } = body

    // Validate required fields
    if (!videoUrl || !title || !subtitle || !description || !ctaText || !ctaLink) {
      return NextResponse.json(
        { message: 'All fields are required' },
        { status: 400 }
      )
    }

    // Check if header content already exists
    const existingContent = await prisma.eventsHeader.findFirst()

    let headerContent
    if (existingContent) {
      // Update existing content
      headerContent = await prisma.eventsHeader.update({
        where: { id: existingContent.id },
        data: {
          videoUrl,
          title,
          subtitle,
          description,
          ctaText,
          ctaLink,
          updatedAt: new Date()
        }
      })
    } else {
      // Create new content
      headerContent = await prisma.eventsHeader.create({
        data: {
          videoUrl,
          title,
          subtitle,
          description,
          ctaText,
          ctaLink
        }
      })
    }

    return NextResponse.json(headerContent)
  } catch (error) {
    console.error('Error saving header content:', error)
    return NextResponse.json(
      { message: 'Failed to save header content' },
      { status: 500 }
    )
  }
}
