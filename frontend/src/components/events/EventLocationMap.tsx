'use client'

import React, { useEffect, useRef, useState } from 'react'
import { MapPin, ExternalLink } from 'lucide-react'

interface EventLocationMapProps {
  location: string
  latitude?: number | string | null
  longitude?: number | string | null
  address?: string | null
  city?: string | null
  province?: string | null
  className?: string
}

export default function EventLocationMap({
  location,
  latitude,
  longitude,
  address,
  city,
  province,
  className = ''
}: EventLocationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const leafletMapRef = useRef<any>(null)
  const leafletMarkerRef = useRef<any>(null)
  const [isMapLoading, setIsMapLoading] = useState(true)
  const [mapError, setMapError] = useState<string | null>(null)

  // Convert latitude/longitude to numbers if they're strings
  const lat = latitude ? parseFloat(latitude.toString()) : null
  const lng = longitude ? parseFloat(longitude.toString()) : null

  // Check if we have valid coordinates
  const hasCoordinates = lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng)

  useEffect(() => {
    if (!mapRef.current) return

    // If no coordinates, don't try to load map
    if (!hasCoordinates) {
      setIsMapLoading(false)
      return
    }

    const initializeMap = async () => {
      try {
        setIsMapLoading(true)
        setMapError(null)

        // Dynamically import Leaflet
        const L = await import('leaflet')
        await import('leaflet/dist/leaflet.css')

        // Fix for default markers in Leaflet with Next.js
        delete (L.Icon.Default.prototype as any)._getIconUrl
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        })

        // Create map centered on event location
        const map = L.map(mapRef.current!, {
          center: [lat!, lng!],
          zoom: 15,
          zoomControl: true,
        })

        leafletMapRef.current = map

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(map)

        // Add custom marker with popup
        const customIcon = L.divIcon({
          className: 'custom-marker',
          html: `
            <div style="
              background-color: #3b82f6;
              width: 40px;
              height: 40px;
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              border: 3px solid white;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <div style="
                transform: rotate(45deg);
                color: white;
                font-size: 20px;
                font-weight: bold;
              ">📍</div>
            </div>
          `,
          iconSize: [40, 40],
          iconAnchor: [20, 40],
          popupAnchor: [0, -40],
        })

        const marker = L.marker([lat!, lng!], { icon: customIcon }).addTo(map)

        // Add popup with location info
        const popupContent = `
          <div style="padding: 8px; min-width: 200px;">
            <strong style="font-size: 14px; color: #1f2937;">${location}</strong>
            ${address ? `<p style="margin: 4px 0 0 0; font-size: 12px; color: #6b7280;">${address}</p>` : ''}
            ${city || province ? `<p style="margin: 4px 0 0 0; font-size: 12px; color: #6b7280;">${[city, province].filter(Boolean).join(', ')}</p>` : ''}
          </div>
        `
        marker.bindPopup(popupContent).openPopup()

        leafletMarkerRef.current = marker

        setIsMapLoading(false)
      } catch (error) {
        console.error('Error initializing map:', error)
        setMapError('Gagal memuat peta')
        setIsMapLoading(false)
      }
    }

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      initializeMap()
    }, 100)

    return () => {
      clearTimeout(timer)
      if (leafletMapRef.current) {
        leafletMapRef.current.remove()
        leafletMapRef.current = null
      }
    }
  }, [lat, lng, location, address, city, province, hasCoordinates])

  // Generate Google Maps URL for fallback
  const googleMapsUrl = hasCoordinates
    ? `https://www.google.com/maps?q=${lat},${lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`

  return (
    <div className={`relative ${className}`}>
      {hasCoordinates ? (
        <>
          {/* Leaflet Map */}
          <div
            ref={mapRef}
            className="w-full h-[400px] rounded-xl overflow-hidden border border-gray-200 shadow-lg bg-gray-100"
            style={{ minHeight: '400px' }}
          >
            {isMapLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                  <p className="text-gray-600 text-sm">Memuat peta...</p>
                </div>
              </div>
            )}
            {mapError && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
                <div className="text-center p-4">
                  <p className="text-red-600 text-sm mb-2">{mapError}</p>
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 text-sm underline inline-flex items-center gap-1"
                  >
                    Buka di Google Maps
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Location Info & Actions */}
          <div className="mt-4 flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                  <MapPin className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">{location}</h4>
                  {address && (
                    <p className="text-sm text-gray-600 mb-1">{address}</p>
                  )}
                  {(city || province) && (
                    <p className="text-sm text-gray-500">
                      {[city, province].filter(Boolean).join(', ')}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm hover:shadow-md"
            >
              <ExternalLink className="w-4 h-4" />
              Buka di Maps
            </a>
          </div>
        </>
      ) : (
        /* Fallback: Google Maps Embed or Link */
        <div className="w-full rounded-xl overflow-hidden border border-gray-200 shadow-lg bg-gray-50">
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-8 h-8 text-blue-600" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">{location}</h4>
            {address && (
              <p className="text-sm text-gray-600 mb-4">{address}</p>
            )}
            {(city || province) && (
              <p className="text-sm text-gray-500 mb-6">
                {[city, province].filter(Boolean).join(', ')}
              </p>
            )}
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-sm hover:shadow-md"
            >
              <ExternalLink className="w-4 h-4" />
              Buka di Google Maps
            </a>
          </div>
        </div>
      )}

      <style jsx global>{`
        .custom-marker {
          background: transparent !important;
          border: none !important;
        }
        .leaflet-popup-content-wrapper {
          border-radius: 8px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .leaflet-popup-content {
          margin: 0;
        }
      `}</style>
    </div>
  )
}

