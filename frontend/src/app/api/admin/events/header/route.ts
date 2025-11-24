import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

// Use singleton pattern to ensure fresh Prisma client
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// GET - Fetch all active headers (for carousel) or single header
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const all = searchParams.get('all') === 'true'
    const active = searchParams.get('active') !== 'false' // default true

    if (all) {
      // Return all headers (for admin management)
      const headers = await prisma.eventsHeader.findMany({
        orderBy: [
          { sortOrder: 'asc' },
          { createdAt: 'desc' }
        ]
      })
      return NextResponse.json(headers)
    }

    if (active) {
      // Return only active headers (for carousel)
      const headers = await prisma.eventsHeader.findMany({
        where: {
          isActive: true
        },
        orderBy: [
          { sortOrder: 'asc' },
          { createdAt: 'desc' }
        ]
      })

      if (headers.length === 0) {
        // Return default content if none exists
        return NextResponse.json([{
          id: 'default',
          bannerUrl: '/banner/default-banner.png',
          title: 'Featured Event',
          subtitle: 'Discover Amazing Events',
          description: 'Join us for exciting events and unforgettable experiences.',
          ctaText: 'Explore Events',
          ctaLink: '#',
          isActive: true,
          sortOrder: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        }])
      }

      return NextResponse.json(headers)
    }

    // Return single header (backward compatibility)
    const headerContent = await prisma.eventsHeader.findFirst({
      where: {
        isActive: true
      },
      orderBy: [
        { sortOrder: 'asc' },
        { updatedAt: 'desc' }
      ]
    })

    if (!headerContent) {
      // Return default content if none exists
      return NextResponse.json({
        id: 'default',
        bannerUrl: '/banner/default-banner.png',
        title: 'Featured Event',
        subtitle: 'Discover Amazing Events',
        description: 'Join us for exciting events and unforgettable experiences.',
        ctaText: 'Explore Events',
        ctaLink: '#',
        createdAt: new Date(),
        updatedAt: new Date()
      })
    }

    return NextResponse.json(headerContent)
  } catch (error: any) {
    console.error('Error fetching header content:', error)
    return NextResponse.json(
      { message: 'Failed to fetch header content', error: error.message || 'Unknown error' },
      { status: 500 }
    )
  }
}

// POST - Create new header content
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { bannerUrl, title, subtitle, description, ctaText, ctaLink, isActive, sortOrder } = body

    // Validate required fields
    if (!bannerUrl || !title || !subtitle || !description || !ctaText || !ctaLink) {
      return NextResponse.json(
        { message: 'All fields are required' },
        { status: 400 }
      )
    }

    // Get max sortOrder to set new item at the end
    const maxSortOrder = await prisma.eventsHeader.aggregate({
      _max: {
        sortOrder: true
      }
    })

    // Create new header content
    const headerContent = await prisma.eventsHeader.create({
      data: {
        bannerUrl,
        title,
        subtitle,
        description,
        ctaText,
        ctaLink,
        isActive: isActive !== undefined ? isActive : true,
        sortOrder: sortOrder !== undefined ? sortOrder : (maxSortOrder._max.sortOrder ?? -1) + 1
      }
    })

    return NextResponse.json(headerContent)
  } catch (error: any) {
    console.error('Error creating header content:', error)
    return NextResponse.json(
      { message: 'Failed to create header content', error: error.message || 'Unknown error' },
      { status: 500 }
    )
  }
}

// PUT - Update header content
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, bannerUrl, title, subtitle, description, ctaText, ctaLink, isActive, sortOrder } = body

    if (!id) {
      return NextResponse.json(
        { message: 'Header ID is required' },
        { status: 400 }
      )
    }

    // Validate required fields
    if (!bannerUrl || !title || !subtitle || !description || !ctaText || !ctaLink) {
      return NextResponse.json(
        { message: 'All fields are required' },
        { status: 400 }
      )
    }

    // Update header content
    const headerContent = await prisma.eventsHeader.update({
      where: { id },
      data: {
        bannerUrl,
        title,
        subtitle,
        description,
        ctaText,
        ctaLink,
        isActive: isActive !== undefined ? isActive : true,
        sortOrder: sortOrder !== undefined ? sortOrder : undefined,
        updatedAt: new Date()
      }
    })

    return NextResponse.json(headerContent)
  } catch (error: any) {
    console.error('Error updating header content:', error)
    return NextResponse.json(
      { message: 'Failed to update header content', error: error.message || 'Unknown error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete header content
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { message: 'Header ID is required' },
        { status: 400 }
      )
    }

    await prisma.eventsHeader.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Header deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting header content:', error)
    return NextResponse.json(
      { message: 'Failed to delete header content', error: error.message || 'Unknown error' },
      { status: 500 }
    )
  }
}
