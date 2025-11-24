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

// GET - Fetch all active headers for carousel (public endpoint)
export async function GET() {
  try {
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
  } catch (error: any) {
    console.error('Error fetching carousel headers:', error)
    return NextResponse.json(
      { message: 'Failed to fetch carousel headers', error: error.message || 'Unknown error' },
      { status: 500 }
    )
  }
}
