'use client'

import React, { useState, useEffect, useRef } from 'react'
import { MapPin, Search, X, Check } from 'lucide-react'
import { Button } from './button'
import { Input } from './input'

interface LocationData {
  latitude: number
  longitude: number
  address: string
  city?: string
  province?: string
  country?: string
  postalCode?: string
}

interface LocationPickerProps {
  value?: LocationData
  onChange: (location: LocationData | null) => void
  placeholder?: string
  className?: string
}

interface SearchResult {
  address: string
  latitude: number
  longitude: number
  city?: string
  province?: string
  country?: string
  postalCode?: string
}

export default function LocationPicker({ 
  value, 
  onChange, 
  placeholder = "Cari lokasi event...",
  className = ""
}: LocationPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(value || null)
  const [mapCenter, setMapCenter] = useState<[number, number]>([-6.2088, 106.8456]) // Jakarta default
  const [mapZoom, setMapZoom] = useState(13)
  const [mapMarker, setMapMarker] = useState<[number, number] | null>(null)
  const [isMapLoading, setIsMapLoading] = useState(false)
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([])
  
  const searchTimeoutRef = useRef<NodeJS.Timeout>()
  const mapRef = useRef<HTMLDivElement>(null)
  const leafletMapRef = useRef<any>(null)
  const leafletMarkerRef = useRef<any>(null)

  // Popular locations in Indonesia
  const popularLocations = [
    { name: 'Jakarta', coords: [-6.2088, 106.8456] },
    { name: 'Surabaya', coords: [-7.2575, 112.7521] },
    { name: 'Bandung', coords: [-6.9175, 107.6191] },
    { name: 'Medan', coords: [3.5952, 98.6722] },
    { name: 'Semarang', coords: [-6.9667, 110.4167] },
    { name: 'Makassar', coords: [-5.1477, 119.4327] },
    { name: 'Palembang', coords: [-2.9761, 104.7754] },
    { name: 'Tangerang', coords: [-6.1781, 106.6300] },
    { name: 'Depok', coords: [-6.4025, 106.7942] },
    { name: 'Bogor', coords: [-6.5963, 106.7972] },
  ]

  // Initialize map when component mounts
  useEffect(() => {
    if (isOpen && mapRef.current && !leafletMapRef.current) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        initializeMap()
      }, 100)
    }
  }, [isOpen])

  // Update map when selected location changes
  useEffect(() => {
    if (selectedLocation && leafletMapRef.current) {
      const newCenter: [number, number] = [selectedLocation.latitude, selectedLocation.longitude]
      setMapCenter(newCenter)
      setMapMarker(newCenter)
      
      if (leafletMapRef.current) {
        leafletMapRef.current.setView(newCenter, 15)
        updateMarker(newCenter)
      }
    }
  }, [selectedLocation])

  const initializeMap = async () => {
    try {
      setIsMapLoading(true)
      
      // Ensure map container exists
      if (!mapRef.current) {
        console.error('Map container not found')
        return
      }

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

      // Create map
      const map = L.map(mapRef.current).setView(mapCenter, mapZoom)
      leafletMapRef.current = map

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: false, // Remove attribution
        maxZoom: 19,
      }).addTo(map)

      // Add click handler for map
      map.on('click', (e: any) => {
        const { lat, lng } = e.latlng
        const newMarker: [number, number] = [lat, lng]
        setMapMarker(newMarker)
        updateMarker(newMarker)
        
        // Reverse geocode to get address
        reverseGeocode(lat, lng)
      })

      // Add initial marker if location is selected
      if (selectedLocation) {
        const initialMarker: [number, number] = [selectedLocation.latitude, selectedLocation.longitude]
        setMapMarker(initialMarker)
        updateMarker(initialMarker)
      }

      // Force map to resize after initialization
      setTimeout(() => {
        if (map) {
          map.invalidateSize()
        }
      }, 100)

    } catch (error) {
      console.error('Error initializing map:', error)
    } finally {
      setIsMapLoading(false)
    }
  }

  const updateMarker = (position: [number, number]) => {
    if (!leafletMapRef.current) return

    const L = require('leaflet')
    
    // Remove existing marker
    if (leafletMarkerRef.current) {
      leafletMapRef.current.removeLayer(leafletMarkerRef.current)
    }

    // Add new marker
    leafletMarkerRef.current = L.marker(position).addTo(leafletMapRef.current)
  }

  const searchAddresses = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      setSearchSuggestions([])
      return
    }

    try {
      setIsSearching(true)
      // Direct call to backend API
      const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000'
      const response = await fetch(`${backendUrl}/api/geocoding/search?query=${encodeURIComponent(query)}`)
      const data = await response.json()
      
      if (data.success) {
        setSearchResults(data.data)
        // Generate suggestions from results
        const suggestions = data.data.slice(0, 3).map((result: SearchResult) => 
          result.address.split(',').slice(0, 2).join(', ')
        )
        setSearchSuggestions(suggestions)
      } else {
        setSearchResults([])
        setSearchSuggestions([])
      }
    } catch (error) {
      console.error('Search error:', error)
      setSearchResults([])
      setSearchSuggestions([])
    } finally {
      setIsSearching(false)
    }
  }

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      // Direct call to backend API
      const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000'
      const response = await fetch(`${backendUrl}/api/geocoding/reverse-geocode`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ latitude: lat, longitude: lng }),
      })
      const data = await response.json()
      
      if (data.success) {
        const locationData: LocationData = {
          latitude: lat,
          longitude: lng,
          address: data.data.address,
          city: data.data.city,
          province: data.data.province,
          country: data.data.country,
          postalCode: data.data.postalCode,
        }
        setSelectedLocation(locationData)
      }
    } catch (error) {
      console.error('Reverse geocode error:', error)
    }
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    // Set new timeout for search
    searchTimeoutRef.current = setTimeout(() => {
      searchAddresses(query)
    }, 300)
  }

  const handleSearchResultClick = (result: SearchResult) => {
    const locationData: LocationData = {
      latitude: result.latitude,
      longitude: result.longitude,
      address: result.address,
      city: result.city,
      province: result.province,
      country: result.country,
      postalCode: result.postalCode,
    }
    
    setSelectedLocation(locationData)
    setSearchQuery('')
    setSearchResults([])
    setSearchSuggestions([])
    
    // Update map
    const newCenter: [number, number] = [result.latitude, result.longitude]
    setMapCenter(newCenter)
    setMapMarker(newCenter)
    
    if (leafletMapRef.current) {
      leafletMapRef.current.setView(newCenter, 15)
      updateMarker(newCenter)
    }
  }

  const handlePopularLocationClick = (location: { name: string; coords: [number, number] }) => {
    const newCenter: [number, number] = [location.coords[0], location.coords[1]]
    setMapCenter(newCenter)
    setMapMarker(newCenter)
    
    if (leafletMapRef.current) {
      leafletMapRef.current.setView(newCenter, 13)
      updateMarker(newCenter)
    }
    
    // Reverse geocode to get address
    reverseGeocode(location.coords[0], location.coords[1])
  }

  const handleConfirmLocation = () => {
    if (selectedLocation) {
      onChange(selectedLocation)
      setIsOpen(false)
      // Reset map state when closing
      setTimeout(() => {
        if (leafletMapRef.current) {
          leafletMapRef.current.remove()
          leafletMapRef.current = null
        }
        leafletMarkerRef.current = null
        setIsMapLoading(false)
      }, 300) // Wait for modal close animation
    }
  }

  const handleClearLocation = () => {
    setSelectedLocation(null)
    setMapMarker(null)
    onChange(null)
    
    if (leafletMarkerRef.current && leafletMapRef.current) {
      leafletMapRef.current.removeLayer(leafletMarkerRef.current)
      leafletMarkerRef.current = null
    }
  }

  const handleOpenPicker = () => {
    setIsOpen(true)
    // Reset any existing map state
    if (leafletMapRef.current) {
      leafletMapRef.current.remove()
      leafletMapRef.current = null
    }
    leafletMarkerRef.current = null
    setIsMapLoading(false)
  }

  const handleClosePicker = () => {
    setIsOpen(false)
    setSearchQuery('')
    setSearchResults([])
    setSearchSuggestions([])
    // Reset map state when closing
    setTimeout(() => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove()
        leafletMapRef.current = null
      }
      leafletMarkerRef.current = null
      setIsMapLoading(false)
    }, 300) // Wait for modal close animation
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
      if (leafletMapRef.current) {
        leafletMapRef.current.remove()
      }
    }
  }, [])

  return (
    <div className={`relative ${className}`}>
      {/* Location Input */}
      <div className="relative group">
        <MapPin className="absolute left-6 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors duration-200" />
        <Input
          value={selectedLocation ? selectedLocation.address : ''}
          placeholder={placeholder}
          readOnly
          onClick={handleOpenPicker}
          className="h-14 pl-14 pr-12 text-base border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200 group-hover:border-gray-300 rounded-2xl px-6 cursor-pointer"
        />
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
          {selectedLocation ? (
            <button
              onClick={handleClearLocation}
              className="text-gray-400 hover:text-red-500 transition-colors duration-200"
            >
              <X className="h-5 w-5" />
            </button>
          ) : (
            <Search className="h-5 w-5 text-gray-400" />
          )}
        </div>
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
      </div>

      {/* Location Picker Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-blue-600" />
                  Pilih Lokasi Event
                </h3>
                <p className="text-sm text-gray-600 mt-1">Cari atau klik di map untuk memilih lokasi yang tepat</p>
              </div>
              <button
                onClick={handleClosePicker}
                className="text-gray-400 hover:text-gray-600 transition-colors duration-200 p-2 hover:bg-white rounded-full"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex flex-col lg:flex-row h-[600px]">
              {/* Search Panel */}
              <div className="lg:w-1/3 border-r border-gray-200 flex flex-col">
                {/* Search Input */}
                <div className="p-4 border-b border-gray-200 bg-gray-50/50">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      value={searchQuery}
                      onChange={handleSearchChange}
                      placeholder="Cari alamat, kota, atau tempat..."
                      className="pl-10 pr-4 py-3 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl bg-white shadow-sm"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Search Results */}
                <div className="flex-1 overflow-y-auto p-4">
                  {isSearching && (
                    <div className="text-center py-8">
                      <div className="relative">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-200 mx-auto"></div>
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto absolute top-0"></div>
                      </div>
                      <p className="text-sm text-gray-500 mt-3 font-medium">Mencari lokasi...</p>
                      <p className="text-xs text-gray-400 mt-1">Mohon tunggu sebentar</p>
                    </div>
                  )}

                  {!isSearching && searchResults.length === 0 && searchQuery && (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Search className="h-6 w-6 text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-500 font-medium">Tidak ada hasil ditemukan</p>
                      <p className="text-xs text-gray-400 mt-1">Coba gunakan kata kunci yang lebih umum</p>
                      <div className="mt-3 text-xs text-gray-400">
                        <p>Contoh: "Jakarta", "Bandung", "SMK Bogor"</p>
                      </div>
                    </div>
                  )}

                  {/* Search Suggestions */}
                  {!isSearching && searchSuggestions.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-medium text-gray-600 mb-2 flex items-center">
                        <Search className="h-3 w-3 mr-1" />
                        Saran pencarian:
                      </p>
                      <div className="space-y-1">
                        {searchSuggestions.map((suggestion, index) => (
                          <button
                            key={index}
                            onClick={() => setSearchQuery(suggestion)}
                            className="w-full text-left p-2 text-xs text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-200"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Search Results */}
                  {searchResults.map((result, index) => (
                    <div
                      key={index}
                      onClick={() => handleSearchResultClick(result)}
                      className="p-3 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-all duration-200 mb-2 group"
                    >
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                          <MapPin className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-blue-900">
                            {result.address}
                          </p>
                          {result.city && (
                            <p className="text-xs text-gray-500 mt-1 flex items-center">
                              <span className="w-1 h-1 bg-gray-400 rounded-full mr-2"></span>
                              {result.city}, {result.province}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Popular Locations */}
                  {!searchQuery && (
                    <div className="mt-6">
                      <p className="text-xs font-medium text-gray-600 mb-3 flex items-center">
                        <MapPin className="h-3 w-3 mr-1" />
                        Lokasi Populer:
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {popularLocations.map((location, index) => (
                          <button
                            key={index}
                            onClick={() => handlePopularLocationClick(location)}
                            className="p-3 text-xs text-gray-700 bg-gray-50 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-all duration-200 text-center border border-transparent hover:border-blue-200 hover:shadow-sm"
                          >
                            {location.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Selected Location Info */}
                {selectedLocation && (
                  <div className="p-4 border-t border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <Check className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                          <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                          Lokasi Terpilih:
                        </h4>
                        <p className="text-sm text-gray-700 line-clamp-2 font-medium">{selectedLocation.address}</p>
                        {selectedLocation.city && (
                          <p className="text-xs text-gray-500 mt-1 flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {selectedLocation.city}, {selectedLocation.province}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-2 font-mono">
                          📍 {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Map Panel */}
              <div className="lg:w-2/3 relative">
                <div ref={mapRef} className="w-full h-full"></div>
                
                {/* Hide Leaflet attribution */}
                <style jsx>{`
                  :global(.leaflet-control-attribution) {
                    display: none !important;
                  }
                `}</style>
                
                {/* Map Loading */}
                {isMapLoading && (
                  <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                      <p className="text-sm text-gray-600">Memuat peta...</p>
                    </div>
                  </div>
                )}
                
                {/* Map Instructions */}
                <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/20">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                      <MapPin className="h-3 w-3 text-blue-600" />
                    </div>
                    <p className="text-sm text-gray-700 font-medium">
                      Klik di map untuk memilih lokasi
                    </p>
                  </div>
                </div>

                {/* Map Controls */}
                <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-xl p-2 shadow-lg border border-white/20">
                  <div className="flex flex-col space-y-1">
                    <button
                      onClick={() => {
                        if (leafletMapRef.current) {
                          leafletMapRef.current.zoomIn()
                        }
                      }}
                      className="w-8 h-8 bg-white border border-gray-200 rounded-lg flex items-center justify-center hover:bg-blue-50 hover:border-blue-300 transition-colors"
                    >
                      <span className="text-lg font-bold text-gray-600">+</span>
                    </button>
                    <button
                      onClick={() => {
                        if (leafletMapRef.current) {
                          leafletMapRef.current.zoomOut()
                        }
                      }}
                      className="w-8 h-8 bg-white border border-gray-200 rounded-lg flex items-center justify-center hover:bg-blue-50 hover:border-blue-300 transition-colors"
                    >
                      <span className="text-lg font-bold text-gray-600">−</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
              <div className="flex items-center space-x-2">
                {selectedLocation ? (
                  <>
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                      <Check className="h-3 w-3 text-green-600" />
                    </div>
                    <span className="text-sm text-green-600 font-medium">Lokasi telah dipilih</span>
                  </>
                ) : (
                  <>
                    <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                      <MapPin className="h-3 w-3 text-gray-400" />
                    </div>
                    <span className="text-sm text-gray-600">Pilih lokasi untuk melanjutkan</span>
                  </>
                )}
              </div>
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  onClick={handleClosePicker}
                  className="px-6 py-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                >
                  Batal
                </Button>
                <Button
                  onClick={handleConfirmLocation}
                  disabled={!selectedLocation}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Konfirmasi Lokasi
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
