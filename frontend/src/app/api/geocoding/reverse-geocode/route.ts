import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { latitude, longitude } = body

    if (!latitude || !longitude) {
      return NextResponse.json({
        success: false,
        message: 'Latitude and longitude are required',
      }, { status: 400 })
    }

    // Proxy to backend geocoding API
    const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000'
    const response = await fetch(`${backendUrl}/api/geocoding/reverse-geocode`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ latitude, longitude }),
    })
    const data = await response.json()

    return NextResponse.json(data)
  } catch (error) {
    console.error('Reverse geocoding error:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to reverse geocode coordinates',
    }, { status: 500 })
  }
}
