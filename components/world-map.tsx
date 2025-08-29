"use client"

import { useEffect, useState, useMemo } from "react"
import dynamic from "next/dynamic"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Building2, Globe, Mail, Phone, X, Loader2 } from "lucide-react"

// Dynamically import map components to avoid SSR issues
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
)

const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
)

const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
)

const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
)

type Organization = {
  id: number
  name: string
  category: string
  location: string
  address: string
  employees: string
  website: string
  phone: string
  email: string
  twitter: string
  linkedin: string
  description: string
  organizationType: string[]
  founded: number
}

interface WorldMapProps {
  organizations: Organization[]
  onOrganizationSelect?: (org: Organization) => void
}

// Geocoding data for major cities/countries
const locationCoordinates: Record<string, [number, number]> = {
  // Countries
  'United States': [39.8283, -98.5795],
  'United Kingdom': [55.3781, -3.4360],
  'India': [20.5937, 78.9629],
  'Australia': [-25.2744, 133.7751],
  'Canada': [56.1304, -106.3468],
  'Germany': [51.1657, 10.4515],
  'France': [46.2276, 2.2137],
  'China': [35.8617, 104.1954],
  'Japan': [36.2048, 138.2529],
  'South Korea': [35.9078, 127.7669],
  'Singapore': [1.3521, 103.8198],
  'Switzerland': [46.8182, 8.2275],
  'Netherlands': [52.1326, 5.2913],
  'Sweden': [60.1282, 18.6435],
  'Denmark': [56.2639, 9.5018],
  'Norway': [60.4720, 8.4689],
  'Finland': [61.9241, 25.7482],
  'Belgium': [50.5039, 4.4699],
  'Italy': [41.8719, 12.5674],
  'Spain': [40.4637, -3.7492],
  'Israel': [31.0461, 34.8516],
  'Brazil': [-14.2350, -51.9253],
  
  // Major cities
  'Boston': [42.3601, -71.0589],
  'San Francisco': [37.7749, -122.4194],
  'New York': [40.7128, -74.0060],
  'London': [51.5074, -0.1278],
  'Cambridge': [52.2053, 0.1218],
  'Oxford': [51.7520, -1.2577],
  'Berlin': [52.5200, 13.4050],
  'Munich': [48.1351, 11.5820],
  'Paris': [48.8566, 2.3522],
  'Tokyo': [35.6762, 139.6503],
  'Seoul': [37.5665, 126.9780],
  'Sydney': [-33.8688, 151.2093],
  'Melbourne': [-37.8136, 144.9631],
  'Toronto': [43.6532, -79.3832],
  'Vancouver': [49.2827, -123.1207],
  'Zurich': [47.3769, 8.5417],
  'Amsterdam': [52.3676, 4.9041],
  'Stockholm': [59.3293, 18.0686],
  'Copenhagen': [55.6761, 12.5683],
  'Oslo': [59.9139, 10.7522],
  'Helsinki': [60.1699, 24.9384],
  'Brussels': [50.8503, 4.3517],
  'Rome': [41.9028, 12.4964],
  'Madrid': [40.4168, -3.7038],
  'Tel Aviv': [32.0853, 34.7818],
  'São Paulo': [-23.5505, -46.6333],
}

// Function to get coordinates for a location
const getCoordinates = (location: string): [number, number] | null => {
  // Clean the location string
  const cleanLocation = location.trim()
  
  // Direct match
  if (locationCoordinates[cleanLocation]) {
    return locationCoordinates[cleanLocation]
  }
  
  // Try to find a partial match
  const locationKeys = Object.keys(locationCoordinates)
  const partialMatch = locationKeys.find(key => 
    cleanLocation.toLowerCase().includes(key.toLowerCase()) ||
    key.toLowerCase().includes(cleanLocation.toLowerCase())
  )
  
  if (partialMatch) {
    return locationCoordinates[partialMatch]
  }
  
  return null
}

export function WorldMap({ organizations, onOrganizationSelect }: WorldMapProps) {
  const [isClient, setIsClient] = useState(false)
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null)
  const [leafletLoaded, setLeafletLoaded] = useState(false)

  useEffect(() => {
    setIsClient(true)
    
    // Load Leaflet CSS
    if (typeof window !== 'undefined') {
      import('leaflet').then((L) => {
        // Fix for default markers
      delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: () => string })._getIconUrl
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        })
        setLeafletLoaded(true)
      })
    }
  }, [])

  // Process organizations with coordinates
  const mappedOrganizations = useMemo(() => {
    return organizations
      .map(org => {
        const coords = getCoordinates(org.location)
        return coords ? { ...org, coordinates: coords } : null
      })
      .filter((org): org is Organization & { coordinates: [number, number] } => org !== null)
  }, [organizations])

  // Group organizations by location for clustering
  const locationGroups = useMemo(() => {
    const groups: Record<string, (Organization & { coordinates: [number, number] })[]> = {}
    
    mappedOrganizations.forEach(org => {
      const key = `${org.coordinates[0]},${org.coordinates[1]}`
      if (!groups[key]) {
        groups[key] = []
      }
      groups[key].push(org)
    })
    
    return groups
  }, [mappedOrganizations])

  if (!isClient || !leafletLoaded) {
    return (
      <div className="h-96 bg-muted rounded-lg flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading world map...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="h-96 rounded-lg overflow-hidden border border-border">
          <MapContainer
            center={[20, 0]}
            zoom={2}
            style={{ height: '100%', width: '100%' }}
            className="z-0"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {Object.entries(locationGroups).map(([key, orgs]) => {
              const [lat, lng] = orgs[0].coordinates
              const isCluster = orgs.length > 1
              
              return (
                <Marker
                  key={key}
                  position={[lat, lng]}
                  eventHandlers={{
                    click: () => {
                      if (orgs.length === 1) {
                        setSelectedOrg(orgs[0])
                        onOrganizationSelect?.(orgs[0])
                      }
                    }
                  }}
                >
                  <Popup>
                    <div className="p-2 min-w-[250px]">
                      {isCluster ? (
                        <div>
                          <h3 className="font-semibold mb-2">
                            {orgs.length} Organizations in {orgs[0].location}
                          </h3>
                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {orgs.map(org => (
                              <div
                                key={org.id}
                                className="p-2 border rounded cursor-pointer hover:bg-gray-50"
                                onClick={() => {
                                  setSelectedOrg(org)
                                  onOrganizationSelect?.(org)
                                }}
                              >
                                <div className="font-medium text-sm">{org.name}</div>
                                <div className="text-xs text-gray-600">{org.category}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <h3 className="font-semibold">{orgs[0].name}</h3>
                          <p className="text-sm text-gray-600 mb-2">{orgs[0].category}</p>
                          <p className="text-xs">{orgs[0].description}</p>
                          <div className="mt-2 flex gap-1">
                            {orgs[0].organizationType.slice(0, 2).map(type => (
                              <Badge key={type} variant="secondary" className="text-xs">
                                {type}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </Popup>
                </Marker>
              )
            })}
          </MapContainer>
        </div>
        
        {/* Map Statistics */}
        <div className="absolute top-4 left-4 bg-background/90 backdrop-blur-sm rounded-lg p-3 border border-border">
          <div className="text-sm space-y-1">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="font-medium">{mappedOrganizations.length} Organizations</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              <span className="font-medium">{Object.keys(locationGroups).length} Locations</span>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Organization Details */}
      {selectedOrg && (
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg">{selectedOrg.name}</CardTitle>
                <CardDescription>{selectedOrg.category}</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedOrg(null)}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{selectedOrg.description}</p>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span>{selectedOrg.location}</span>
                </div>
                {selectedOrg.address && selectedOrg.address !== "Address not specified" && (
                  <div className="flex items-start gap-2 text-sm">
                    <Building2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-xs">{selectedOrg.address}</span>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                {selectedOrg.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-primary" />
                    <a href={`mailto:${selectedOrg.email}`} className="text-primary hover:underline truncate">
                      {selectedOrg.email}
                    </a>
                  </div>
                )}
                {selectedOrg.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-primary" />
                    <span>{selectedOrg.phone}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-sm mb-2">Organization Type</h4>
              <div className="flex flex-wrap gap-1">
                {selectedOrg.organizationType.map((type) => (
                  <Badge key={type} variant="secondary" className="text-xs">
                    {type}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
