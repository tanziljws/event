import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Geocoding search API called')
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query')
    console.log('📝 Query:', query)

    if (!query) {
      console.log('❌ No query provided')
      return NextResponse.json({
        success: false,
        message: 'Search query is required',
      }, { status: 400 })
    }

    // Proxy to backend geocoding API
    const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000'
    const apiUrl = `${backendUrl}/api/geocoding/search?query=${encodeURIComponent(query)}`
    console.log('🌐 Backend URL:', apiUrl)
    
    const response = await fetch(apiUrl)
    console.log('📡 Response status:', response.status)
    
    const data = await response.json()
    console.log('📦 Response data:', data)

    return NextResponse.json(data)
  } catch (error) {
    console.error('❌ Geocoding search error:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to search addresses',
    }, { status: 500 })
  }
}
