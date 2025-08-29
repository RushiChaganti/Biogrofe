"use client"

import { useState, useMemo, useEffect } from "react"
import {
  Filter,
  Building2,
  MapPin,
  Globe,
  Phone,
  Mail,
  Sparkles,
  GitCompare,
  X,
  Bookmark,
  BookmarkCheck,
  Grid3X3,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ThemeToggle } from "@/components/theme-toggle"
import { ExportMenu } from "@/components/export-menu"
import { PWAInstall } from "@/components/pwa-install"
import { ServiceWorkerRegistration } from "@/components/service-worker-registration"
import { WorldMap } from "@/components/world-map"

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

const employeeSizes = ["All Sizes", "10-50", "50-100", "100-500", "500-1000", "1000+"]

const sortOptions = ["A to Z", "Z to A"]

const isCompanyNameSearch = (query: string, organizations: Organization[]): boolean => {
  const companyNames = organizations.map((org) => org.name.toLowerCase())
  const queryLower = query.toLowerCase()

  return companyNames.some((name) => {
    // Check if query matches the full name or any word in the name
    if (name.includes(queryLower)) return true

    // Check if query matches any individual word in the company name
    const nameWords = name.split(/\s+/)
    return nameWords.some((word) => word.includes(queryLower) || queryLower.includes(word))
  })
}

const performIntelligentSearch = (
  query: string,
  organizations: Organization[],
  isAI = false,
  aiEnhancedQuery?: string,
) => {
  if (!query.trim()) return organizations

  // Use AI-enhanced query if available
  const searchQuery = aiEnhancedQuery || query
  const queryLower = searchQuery.toLowerCase()

  // Use regular search for company names
  if (isCompanyNameSearch(query, organizations)) {
    console.log("[v0] Using regular search for company name:", query)
    return organizations.filter((org) => org.name.toLowerCase().includes(query.toLowerCase()))
  }

  // Use AI-like search for complex queries
  console.log(`[v0] Using ${isAI ? "AI-enhanced" : "intelligent"} search for query:`, searchQuery)

  // Enhanced semantic search with scoring
  const scoredResults = organizations.map((org) => {
    let score = 0

    // Direct matches get highest score
    if (org.name.toLowerCase().includes(queryLower)) score += 10
    if (org.description.toLowerCase().includes(queryLower)) score += 8
    if (org.category.toLowerCase().includes(queryLower)) score += 6

    // Organization type matches
    org.organizationType.forEach((type) => {
      if (type.toLowerCase().includes(queryLower)) score += 5
    })

    // Location matches
    if (org.location.toLowerCase().includes(queryLower)) score += 4

    // Enhanced semantic keyword matching for AI queries
    const keywords = {
      gene: ["gene therapy", "genetic", "genomic", "crispr", "dna", "rna"],
      drug: ["pharmaceuticals", "drug discovery", "medicine", "therapeutic", "clinical"],
      ai: ["bioinformatics", "data", "analysis", "machine learning", "artificial intelligence"],
      nano: ["nanobiotechnology", "nanoparticle", "nanotechnology"],
      marine: ["marine biotechnology", "ocean", "aquaculture"],
      agriculture: ["agricultural biotechnology", "crop", "farming", "seeds"],
      investment: ["venture capital", "funding", "investor", "finance"],
      regulatory: ["fda", "compliance", "approval", "regulation"],
      cancer: ["oncology", "tumor", "chemotherapy", "immunotherapy"],
      vaccine: ["immunization", "antibody", "immune", "prevention"],
    }

    Object.entries(keywords).forEach(([key, synonyms]) => {
      if (queryLower.includes(key)) {
        synonyms.forEach((synonym) => {
          if (
            org.description.toLowerCase().includes(synonym) ||
            org.organizationType.some((s) => s.toLowerCase().includes(synonym))
          ) {
            score += isAI ? 4 : 3 // Higher score for AI-enhanced searches
          }
        })
      }
    })

    return { ...org, searchScore: score }
  })

  return scoredResults.filter((org) => org.searchScore > 0).sort((a, b) => b.searchScore - a.searchScore)
}

const parseCSV = (csvText: string): Organization[] => {
  console.log("[v0] Starting CSV parsing...")

  // Parse CSV with proper handling of quoted fields and newlines
  const parseCSVText = (text: string): string[][] => {
    const result: string[][] = []
    const lines = text.trim().split("\n")
    let currentRow: string[] = []
    let currentField = ""
    let inQuotes = false
    let i = 0

    while (i < lines.length) {
      const line = lines[i]
      let j = 0

      while (j < line.length) {
        const char = line[j]

        if (char === '"') {
          inQuotes = !inQuotes
        } else if (char === "," && !inQuotes) {
          currentRow.push(currentField.trim())
          currentField = ""
        } else {
          currentField += char
        }
        j++
      }

      // If we're not in quotes, this line is complete
      if (!inQuotes) {
        currentRow.push(currentField.trim())
        result.push(currentRow)
        currentRow = []
        currentField = ""
      } else {
        // We're in quotes and hit a newline, so add the newline and continue
        currentField += "\n"
      }
      i++
    }

    // Handle any remaining field
    if (currentField || currentRow.length > 0) {
      currentRow.push(currentField.trim())
      result.push(currentRow)
    }

    return result
  }

  const rows = parseCSVText(csvText)
  console.log("[v0] CSV rows count:", rows.length)

  if (rows.length < 2) {
    console.log("[v0] CSV has insufficient data - only", rows.length, "rows")
    return []
  }

  const headers = rows[0]
  console.log("[v0] CSV headers:", headers)

  const organizations = rows
    .slice(1)
    .map((row, index) => {
      // Skip empty rows
      if (!row || row.length === 0 || row.every((field) => !field.trim())) {
        console.log(`[v0] Skipping empty row at index ${index}`)
        return null
      }

      const org: any = {}

      headers.forEach((header, i) => {
        org[header] = (row[i] || "").trim()
      })

      // Extract and clean the main fields
      const researchArea = (org["Research area/lab/scientist"] || "").trim()
      const organization = (org["Organization"] || "").trim()
      const location = (org["Location"] || "").trim()
      const address = (org["Address"] || "").trim()
      const weblink = (org["Weblink"] || "").trim()
      const contactPerson = (org["Contact Person"] || "").trim()
      const email = (org["Email"] || "").trim()
      const twitter = (org["Twitter"] || "").trim()
      const linkedin = (org["Linkedin"] || "").trim()

      // Skip if all essential fields are empty or if the name would be invalid
      if (!researchArea && !organization && !location && !weblink && !contactPerson && !email) {
        console.log(`[v0] Skipping organization at index ${index} - all essential fields empty`)
        return null
      }

      // Skip if the research area or organization contains contact information (indicates parsing error)
      if (
        researchArea &&
        (researchArea.includes("@") ||
          researchArea.includes("(") ||
          researchArea.includes("Level") ||
          researchArea.includes("Street"))
      ) {
        console.log(
          `[v0] Skipping organization at index ${index} - research area contains contact info: "${researchArea}"`,
        )
        return null
      }

      // Clean up fields that might have newlines or extra whitespace
      const cleanResearchArea = researchArea.replace(/\n/g, " ").trim()
      const cleanOrganization = organization.replace(/\n/g, " ").trim()
      const cleanLocation = location.replace(/\n/g, " ").trim()
      const cleanAddress = address.replace(/\n/g, " ").trim()

      // Map the specific CSV structure to our organization format
      const transformedOrg = {
        id: index + 1,
        name: cleanResearchArea || cleanOrganization || "Unknown Organization",
        category: cleanOrganization || "Industrial Biotechnology",
        location: cleanLocation || "Location not specified",
        address: cleanAddress || "Address not specified",
        employees: "50-100", // Default since not in CSV
        website: weblink,
        phone: contactPerson,
        email: email,
        twitter: twitter,
        linkedin: linkedin,
        description: cleanResearchArea
          ? `${cleanResearchArea}${cleanOrganization ? ` - ${cleanOrganization}` : ""}`
          : `Biotechnology organization${cleanOrganization ? ` - ${cleanOrganization}` : ""}`,
        organizationType: cleanOrganization ? [cleanOrganization] : ["Biotechnology"],
        founded: 2020, // Default since not in CSV
      }

      if (index < 3) {
        console.log(`[v0] Transformed organization ${index + 1}:`, transformedOrg)
      }

      return transformedOrg
    })
    .filter((org): org is Organization => {
      if (org === null) return false
      if (!org.name || org.name.trim() === "" || org.name === "Unknown Organization") {
        console.log(`[v0] Filtering out organization with invalid name: "${org?.name}"`)
        return false
      }
      // Filter out organizations with invalid location data that contains contact info
      if (
        org.location &&
        (org.location.includes("@") ||
          org.location.includes("(") ||
          org.location.includes("Level") ||
          org.location.includes("Suite"))
      ) {
        console.log(`[v0] Filtering out organization with invalid location: "${org.name}" - "${org.location}"`)
        return false
      }
      return true
    }) // Filter out null entries and invalid organizations

  console.log("[v0] Final organizations count after filtering:", organizations.length)
  console.log(
    "[v0] Sample of final organizations:",
    organizations.slice(0, 3).map((org) => ({ name: org.name, category: org.category })),
  )
  return organizations
}

const useBookmarks = () => {
  const [bookmarks, setBookmarks] = useState<number[]>([])

  useEffect(() => {
    const saved = localStorage.getItem("biotech-bookmarks")
    if (saved) {
      setBookmarks(JSON.parse(saved))
    }
  }, [])

  const toggleBookmark = (orgId: number) => {
    const newBookmarks = bookmarks.includes(orgId) ? bookmarks.filter((id) => id !== orgId) : [...bookmarks, orgId]

    setBookmarks(newBookmarks)
    localStorage.setItem("biotech-bookmarks", JSON.stringify(newBookmarks))
  }

  const isBookmarked = (orgId: number) => bookmarks.includes(orgId)

  return { bookmarks, toggleBookmark, isBookmarked }
}

export default function BiotechDirectory() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All Categories")
  const [selectedEmployeeSize, setSelectedEmployeeSize] = useState("All Sizes")
  const [selectedSort, setSelectedSort] = useState("A to Z")
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null)
  const [isAiSearch, setIsAiSearch] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [compareList, setCompareList] = useState<number[]>([])
  const [showComparison, setShowComparison] = useState(false)
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false)
  const [viewMode, setViewMode] = useState<"grid" | "countries" | "map">("grid")
  const [expandedCountry, setExpandedCountry] = useState<string | null>(null)
  const { bookmarks, toggleBookmark, isBookmarked } = useBookmarks()
  const [aiEnhancedQuery, setAiEnhancedQuery] = useState("")

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        setLoading(true)
        setError(null)

        console.log("[v0] Fetching data from GitHub Gist...")
        const response = await fetch(
          "https://gist.githubusercontent.com/RushiChaganti/54e669b7eee9f6bca2637458d0308f01/raw/",
        )

        if (!response.ok) {
          throw new Error(`Failed to fetch data: ${response.status}`)
        }

        const csvText = await response.text()
        console.log("[v0] Raw CSV data received:", csvText.substring(0, 500) + "...")
        console.log("[v0] CSV data length:", csvText.length)

        const parsedOrganizations = parseCSV(csvText)
        console.log("[v0] Parsed organizations count:", parsedOrganizations.length)
        console.log("[v0] First parsed organization:", parsedOrganizations[0])

        setOrganizations(parsedOrganizations)
      } catch (err) {
        console.error("[v0] Error fetching organizations:", err)
        setError(err instanceof Error ? err.message : "Failed to load organizations")
      } finally {
        setLoading(false)
      }
    }

    fetchOrganizations()
  }, [])

  // Handle ESC key to return to homepage
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (selectedOrg) {
          setSelectedOrg(null)
        } else if (showComparison) {
          setShowComparison(false)
        } else if (expandedCountry) {
          setExpandedCountry(null)
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [selectedOrg, showComparison, expandedCountry])

  // Reset expanded country when switching view modes
  useEffect(() => {
    if (viewMode !== "countries") {
      setExpandedCountry(null)
    }
  }, [viewMode])

  // Generate dynamic categories from the actual data
  const categories = useMemo(() => {
    if (organizations.length === 0) return ["All Categories"]

    const uniqueCategories = Array.from(new Set(organizations.map((org) => org.category)))
      .filter((category) => category && category.trim() !== "")
      .sort()

    return ["All Categories", ...uniqueCategories]
  }, [organizations])

  const filteredOrganizations = useMemo(() => {
    let filtered = organizations

    // Apply search filter with AI enhancement
    if (searchTerm) {
      filtered = performIntelligentSearch(searchTerm, filtered, isAiSearch, aiEnhancedQuery)
    }

    if (showBookmarksOnly) {
      filtered = filtered.filter((org) => bookmarks.includes(org.id))
    }

    if (selectedCategory !== "All Categories") {
      filtered = filtered.filter((org) => org.category === selectedCategory)
    }

    if (selectedEmployeeSize !== "All Sizes") {
      filtered = filtered.filter((org) => org.employees === selectedEmployeeSize)
    }

    // Apply sorting (always sort alphabetically)
    if (selectedSort === "Z to A") {
      filtered = [...filtered].sort((a, b) => b.name.localeCompare(a.name))
    } else {
      // Default to A to Z sorting
      filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name))
    }

    return filtered
  }, [
    organizations,
    searchTerm,
    selectedCategory,
    selectedEmployeeSize,
    selectedSort,
    showBookmarksOnly,
    isAiSearch,
    aiEnhancedQuery,
    bookmarks,
  ])

  const toggleCompare = (orgId: number) => {
    if (compareList.includes(orgId)) {
      setCompareList(compareList.filter((id) => id !== orgId))
    } else if (compareList.length < 5) {
      setCompareList([...compareList, orgId])
    }
  }

  const clearComparison = () => {
    setCompareList([])
    setShowComparison(false)
  }

  const compareOrganizations = organizations.filter((org) => compareList.includes(org.id))

  // Extract country from location string and get country emoji
  const extractCountry = (location: string): string => {
    if (!location || location.trim() === "") return "Unknown"

    const locationUpper = location.toUpperCase().trim()

    // Skip if location contains contact information (indicates parsing error)
    if (
      locationUpper.includes("@") ||
      locationUpper.includes("(") ||
      locationUpper.includes("HTTP") ||
      locationUpper.includes("LEVEL") ||
      locationUpper.includes("SUITE") ||
      locationUpper.includes("FLOOR")
    ) {
      return "Unknown"
    }

    // Handle common country formats
    if (locationUpper === "USA" || locationUpper.includes("UNITED STATES")) return "United States"
    if (locationUpper === "UK" || locationUpper.includes("UNITED KINGDOM")) return "United Kingdom"
    if (locationUpper === "INDIA") return "India"
    if (locationUpper === "AUSTRALIA") return "Australia"
    if (locationUpper === "CANADA") return "Canada"
    if (locationUpper === "GERMANY") return "Germany"
    if (locationUpper === "FRANCE") return "France"
    if (locationUpper === "CHINA") return "China"
    if (locationUpper === "JAPAN") return "Japan"
    if (locationUpper === "SOUTH KOREA") return "South Korea"
    if (locationUpper === "SINGAPORE") return "Singapore"
    if (locationUpper === "SWITZERLAND") return "Switzerland"
    if (locationUpper === "NETHERLANDS") return "Netherlands"
    if (locationUpper === "SWEDEN") return "Sweden"
    if (locationUpper === "DENMARK") return "Denmark"
    if (locationUpper === "NORWAY") return "Norway"
    if (locationUpper === "FINLAND") return "Finland"
    if (locationUpper === "BELGIUM") return "Belgium"
    if (locationUpper === "ITALY") return "Italy"
    if (locationUpper === "SPAIN") return "Spain"
    if (locationUpper === "ISRAEL") return "Israel"
    if (locationUpper === "BRAZIL") return "Brazil"

    // If no match found, return the original location (cleaned)
    return location.trim() || "Unknown"
  }

  const getCountryEmoji = (country: string): string => {
    const emojiMap: Record<string, string> = {
      "United States": "🇺🇸",
      "United Kingdom": "🇬🇧",
      India: "🇮🇳",
      Australia: "🇦🇺",
      Canada: "🇨🇦",
      Germany: "🇩🇪",
      France: "🇫🇷",
      China: "🇨🇳",
      Japan: "🇯🇵",
      "South Korea": "🇰🇷",
      Singapore: "🇸🇬",
      Switzerland: "🇨🇭",
      Netherlands: "🇳🇱",
      Sweden: "🇸🇪",
      Denmark: "🇩🇰",
      Norway: "🇳🇴",
      Finland: "🇫🇮",
      Belgium: "🇧🇪",
      Italy: "🇮🇹",
      Spain: "🇪🇸",
      Israel: "🇮🇱",
      Brazil: "🇧🇷",
    }
    return emojiMap[country] || "🌍"
  }

  // Group organizations by country for timeline view
  const timelineData = useMemo(() => {
    const grouped = filteredOrganizations.reduce(
      (acc, org) => {
        const country = extractCountry(org.location)
        // Skip organizations with unknown or invalid countries
        if (country === "Unknown" || country === "Location not specified" || !country.trim()) {
          return acc
        }
        if (!acc[country]) {
          acc[country] = []
        }
        acc[country].push(org)
        return acc
      },
      {} as Record<string, Organization[]>,
    )

    return Object.entries(grouped)
      .map(([country, orgs]) => ({
        country,
        organizations: orgs.sort((a, b) => a.name.localeCompare(b.name)),
        count: orgs.length,
      }))
      .filter(({ count }) => count > 0) // Only include countries with organizations
      .sort((a, b) => b.count - a.count) // Most organizations first
  }, [filteredOrganizations])

  const handleSearch = (query: string) => {
    setSearchTerm(query);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Loading Organizations</h2>
          <p className="text-muted-foreground">Fetching biotechnology companies data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <img src="/favicon.ico" alt="Biogrofe" className="h-8 w-8 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Error Loading Data</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <ServiceWorkerRegistration />

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
          {/* Mobile-first header layout */}
          <div className="flex flex-col gap-4 sm:gap-6">
            {/* Top row: Logo and essential actions */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => {
                  setSelectedOrg(null)
                  setShowComparison(false)
                  setSearchTerm("")
                  setSelectedCategory("All Categories")
                  setSelectedEmployeeSize("All Sizes")
                  setSelectedSort("A to Z")
                  setShowBookmarksOnly(false)
                }}
                className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity"
              >
                <img src="/favicon.ico" alt="Biogrofe" className="h-6 w-6 sm:h-8 sm:w-8" />
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">Biogrofe</h1>
              </button>

              {/* Mobile menu toggle and theme toggle */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3"
                >
                  <Filter className="h-4 w-4" />
                  <span className="hidden xs:inline text-xs sm:text-sm">Filters</span>
                </Button>
                <ThemeToggle />
              </div>
            </div>

            {/* Second row: Action buttons - responsive layout */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBookmarksOnly(!showBookmarksOnly)}
                className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 ${showBookmarksOnly ? "bg-primary text-primary-foreground" : ""}`}
              >
                <Bookmark className="h-4 w-4" />
                <span className="hidden xs:inline text-xs sm:text-sm">Bookmarks ({bookmarks.length})</span>
              </Button>

              {compareList.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowComparison(!showComparison)}
                  className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800"
                >
                  <GitCompare className="h-4 w-4" />
                  <span className="hidden xs:inline text-xs sm:text-sm">Compare ({compareList.length})</span>
                </Button>
              )}

              {/* View mode toggle - more compact on mobile */}
              <div className="flex items-center border border-border rounded-md">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="rounded-r-none border-r px-2 sm:px-3"
                >
                  <Grid3X3 className="h-4 w-4" />
                  <span className="hidden sm:inline ml-1 text-xs sm:text-sm">Grid</span>
                </Button>
                <Button
                  variant={viewMode === "countries" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("countries")}
                  className="rounded-none border-r px-2 sm:px-3"
                >
                  <Globe className="h-4 w-4" />
                  <span className="hidden sm:inline ml-1 text-xs sm:text-sm">Countries</span>
                </Button>
                <Button
                  variant={viewMode === "map" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("map")}
                  className="rounded-l-none px-2 sm:px-3"
                >
                  <MapPin className="h-4 w-4" />
                  <span className="hidden sm:inline ml-1 text-xs sm:text-sm">Map</span>
                </Button>
              </div>

              <ExportMenu
                organizations={filteredOrganizations}
                filters={{
                  searchTerm: searchTerm,
                  category: selectedCategory,
                  employeeSize: selectedEmployeeSize,
                }}
              />
            </div>

            {/* Search section */}
            <div className="max-w-2xl mx-auto w-full">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search organizations..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 sm:pl-12 pr-10 sm:pr-12 h-10 sm:h-12 text-sm sm:text-lg border rounded-md w-full"
                />
              </div>
            </div>
          </div>
        </div>
      </header>


      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-8">
          {showFilters && (
            <>
              <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setShowFilters(false)} />
              <aside className="fixed top-0 right-0 h-full w-full max-w-sm bg-background border-l border-border z-50 lg:relative lg:w-64 lg:h-auto lg:bg-transparent lg:border-l-0 lg:z-auto">
                <div className="p-3 sm:p-4 lg:p-0 h-full overflow-y-auto">
                  <Card className="lg:sticky lg:top-4">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between text-sm sm:text-base">
                        <span className="flex items-center gap-2">
                          <Filter className="h-4 w-4" />
                          Filters
                        </span>
                        <Button variant="ghost" size="sm" onClick={() => setShowFilters(false)} className="lg:hidden">
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-0">
                      <div>
                        <label className="text-xs font-medium text-foreground mb-2 block">Category</label>
                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                          <SelectTrigger className="h-9 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-xs font-medium text-foreground mb-2 block">Company Size</label>
                        <Select value={selectedEmployeeSize} onValueChange={setSelectedEmployeeSize}>
                          <SelectTrigger className="h-9 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {employeeSizes.map((size) => (
                              <SelectItem key={size} value={size}>
                                {size}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-xs font-medium text-foreground mb-2 block">Sort By</label>
                        <Select value={selectedSort} onValueChange={setSelectedSort}>
                          <SelectTrigger className="h-9 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {sortOptions.map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="pt-3 border-t border-border">
                        <p className="text-xs text-muted-foreground">
                          {filteredOrganizations.length} organization{filteredOrganizations.length !== 1 ? "s" : ""}{" "}
                          found
                        </p>
                      </div>

                      {/* Mobile-only close button */}
                      <div className="lg:hidden pt-4">
                        <Button onClick={() => setShowFilters(false)} className="w-full" size="sm">
                          Apply Filters
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </aside>
            </>
          )}

          <main className="flex-1">
            {showComparison && compareOrganizations.length > 0 ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold text-foreground">
                    Compare Organizations ({compareOrganizations.length})
                  </h2>
                  <Button variant="outline" onClick={() => setShowComparison(false)}>
                    Back to Results
                  </Button>
                </div>

                <div className="overflow-x-auto">
                  <div className="flex gap-4 min-w-max">
                    {compareOrganizations.map((org) => (
                      <Card key={org.id} className="w-80 flex-shrink-0">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="min-w-0 flex-1">
                              <CardTitle className="text-lg">{org.name}</CardTitle>
                              <CardDescription>{org.category}</CardDescription>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleCompare(org.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <p className="text-sm text-muted-foreground">{org.description}</p>

                          <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm">
                              <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                              <span>{org.location}</span>
                            </div>
                            {org.address && org.address !== "Address not specified" && (
                              <div className="flex items-start gap-2 text-sm">
                                <Building2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                                <span className="text-xs">{org.address}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-sm">
                              <Globe className="h-4 w-4 text-primary flex-shrink-0" />
                              <a
                                href={`https://${org.website}`}
                                className="text-primary hover:underline truncate"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {org.website}
                              </a>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="h-4 w-4 text-primary flex-shrink-0" />
                              <a href={`tel:${org.phone}`} className="text-primary hover:underline">
                                {org.phone}
                              </a>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="h-4 w-4 text-primary flex-shrink-0" />
                              <a href={`mailto:${org.email}`} className="text-primary hover:underline truncate">
                                {org.email}
                              </a>
                            </div>
                            {org.twitter && (
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-primary text-xs">𝕏</span>
                                <a
                                  href={`https://twitter.com/${org.twitter}`}
                                  className="text-primary hover:underline truncate"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  @{org.twitter}
                                </a>
                              </div>
                            )}
                            {org.linkedin && (
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-primary text-xs">in</span>
                                <a
                                  href={`https://linkedin.com/company/${org.linkedin}`}
                                  className="text-primary hover:underline truncate"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  {org.linkedin}
                                </a>
                              </div>
                            )}
                          </div>

                          <div>
                            <h4 className="font-medium text-sm mb-2">Organization Type</h4>
                            <div className="flex flex-wrap gap-1">
                              {org.organizationType.map((type) => (
                                <Badge key={type} variant="secondary" className="text-xs">
                                  {type}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <div className="flex justify-center">
                  <Button variant="outline" onClick={clearComparison}>
                    Clear Comparison
                  </Button>
                </div>
              </div>
            ) : selectedOrg ? (
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-2xl">{selectedOrg.name}</CardTitle>
                      <CardDescription className="text-lg mt-1">{selectedOrg.category}</CardDescription>
                    </div>
                    <Button variant="outline" onClick={() => setSelectedOrg(null)}>
                      Back to Results
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-foreground text-lg leading-relaxed">{selectedOrg.description}</p>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <MapPin className="h-5 w-5 text-primary" />
                        <span>{selectedOrg.location}</span>
                      </div>
                      {selectedOrg.address && selectedOrg.address !== "Address not specified" && (
                        <div className="flex items-start gap-3">
                          <Building2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                          <span>{selectedOrg.address}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-3">
                        <Globe className="h-5 w-5 text-primary" />
                        <a href={`https://${selectedOrg.website}`} className="text-primary hover:underline">
                          {selectedOrg.website}
                        </a>
                      </div>
                      {selectedOrg.twitter && (
                        <div className="flex items-center gap-3">
                          <span className="text-primary">𝕏</span>
                          <a
                            href={`https://twitter.com/${selectedOrg.twitter}`}
                            className="text-primary hover:underline"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            @{selectedOrg.twitter}
                          </a>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Phone className="h-5 w-5 text-primary" />
                        <span>{selectedOrg.phone}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-primary" />
                        <a href={`mailto:${selectedOrg.email}`} className="text-primary hover:underline truncate">
                          {selectedOrg.email}
                        </a>
                      </div>
                      {selectedOrg.linkedin && (
                        <div className="flex items-center gap-3">
                          <span className="text-primary">in</span>
                          <a
                            href={`https://linkedin.com/company/${selectedOrg.linkedin}`}
                            className="text-primary hover:underline"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {selectedOrg.linkedin}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-foreground mb-3">Organization Type</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedOrg.organizationType.map((type) => (
                        <Badge key={type} variant="secondary">
                          {type}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold text-foreground">
                    {showBookmarksOnly ? "Bookmarked " : ""}Organizations ({filteredOrganizations.length})
                  </h2>
                  {compareList.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {compareList.length}/5 selected for comparison
                      </span>
                      <Button variant="outline" size="sm" onClick={clearComparison}>
                        Clear
                      </Button>
                    </div>
                  )}
                </div>

                {viewMode === "map" ? (
                  <div className="space-y-6">
                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-bold text-foreground mb-2">Interactive World Map</h3>
                      <p className="text-muted-foreground">
                        Explore biotechnology organizations by their geographic locations
                      </p>
                    </div>
                    <WorldMap organizations={filteredOrganizations} onOrganizationSelect={setSelectedOrg} />
                  </div>
                ) : viewMode === "countries" ? (
                  <div className="space-y-6">
                    <div className="relative bg-gradient-to-br from-slate-50 via-blue-50 to-green-50 dark:from-slate-950 dark:via-blue-950 dark:to-green-950 border border-border rounded-2xl p-8 overflow-hidden">
                      {/* Background Pattern */}
                      <div className="absolute inset-0 opacity-10">
                        <div
                          className="absolute inset-0"
                          style={{
                            backgroundImage: `linear-gradient(90deg, #3b82f6 1px, transparent 1px),
                                           linear-gradient(0deg, #10b981 1px, transparent 1px)`,
                            backgroundSize: "40px 40px",
                          }}
                        />
                      </div>

                      {/* Floating Timeline Elements */}
                      <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        {[...Array(15)].map((_, i) => (
                          <div
                            key={i}
                            className="absolute w-1 h-8 bg-primary/20 rounded-full animate-pulse"
                            style={{
                              left: `${Math.random() * 100}%`,
                              top: `${Math.random() * 100}%`,
                              animationDelay: `${Math.random() * 3}s`,
                              animationDuration: `${2 + Math.random() * 2}s`,
                              transform: `rotate(${Math.random() * 360}deg)`,
                            }}
                          />
                        ))}
                      </div>

                      <div className="relative z-10">
                        <div className="text-center mb-8">
                          <div className="relative inline-block">
                            <Globe className="h-16 w-16 text-primary mx-auto mb-4 drop-shadow-lg" />
                            <div className="absolute -inset-2 bg-primary/20 rounded-full blur-xl animate-pulse" />
                          </div>
                          <h3 className="text-3xl font-bold text-foreground mb-3 bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                            Global Biotechnology Organizations
                          </h3>
                          <p className="text-muted-foreground text-lg">
                            Explore biotechnology companies and institutions by country
                          </p>
                        </div>

                        {/* Country Blobs Content */}
                        <div className="space-y-8">
                          {/* Country Blobs Grid */}
                          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {timelineData.map((countryData) => (
                              <Card
                                key={countryData.country}
                                className={`cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-2 border-2 ${
                                  expandedCountry === countryData.country
                                    ? "border-primary bg-primary/5 shadow-lg"
                                    : "border-border hover:border-primary/50"
                                }`}
                                onClick={() =>
                                  setExpandedCountry(
                                    expandedCountry === countryData.country ? null : countryData.country,
                                  )
                                }
                              >
                                <CardContent className="p-6 text-center">
                                  <div className="relative inline-block mb-4">
                                    <div className="w-16 h-16 bg-gradient-to-br from-primary to-blue-600 rounded-full flex items-center justify-center shadow-lg mx-auto">
                                      <MapPin className="h-8 w-8 text-white" />
                                    </div>
                                    <div className="absolute -inset-1 bg-primary/20 rounded-full blur-md animate-pulse" />
                                  </div>
                                  <h3 className="text-xl font-bold text-foreground mb-2 flex items-center justify-center gap-2">
                                    <span className="text-2xl">{getCountryEmoji(countryData.country)}</span>
                                    {countryData.country}
                                  </h3>
                                  <p className="text-muted-foreground text-sm">
                                    {countryData.count} organization{countryData.count !== 1 ? "s" : ""}
                                  </p>
                                  <div className="mt-3">
                                    <Badge variant="secondary" className="text-xs">
                                      Click to {expandedCountry === countryData.country ? "collapse" : "expand"}
                                    </Badge>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>

                          {/* Expanded Country Organizations */}
                          {expandedCountry && (
                            <div className="mt-8 p-6 bg-gradient-to-br from-primary/5 to-blue-50 dark:from-primary/10 dark:to-blue-950 rounded-2xl border border-primary/20">
                              <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                                    <MapPin className="h-6 w-6 text-white" />
                                  </div>
                                  <div>
                                    <h3 className="text-2xl font-bold text-foreground flex items-center gap-2">
                                      <span className="text-3xl">{getCountryEmoji(expandedCountry)}</span>
                                      {expandedCountry}
                                    </h3>
                                    <p className="text-muted-foreground">
                                      {timelineData.find((c) => c.country === expandedCountry)?.count} organizations
                                    </p>
                                  </div>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setExpandedCountry(null)}
                                  className="flex items-center gap-2"
                                >
                                  <X className="h-4 w-4" />
                                  Close
                                </Button>
                              </div>

                              {/* Organizations Grid */}
                              <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                                {timelineData
                                  .find((c) => c.country === expandedCountry)
                                  ?.organizations.map((org, orgIndex) => (
                                    <Card
                                      key={org.id}
                                      className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-l-4 border-l-primary/50 cursor-pointer"
                                      style={{
                                        animationDelay: `${orgIndex * 0.1}s`,
                                      }}
                                      onClick={() => setSelectedOrg(org)}
                                    >
                                      <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between">
                                          <div className="min-w-0 flex-1">
                                            <CardTitle className="text-base leading-tight">{org.name}</CardTitle>
                                            <CardDescription className="text-xs">{org.category}</CardDescription>
                                          </div>
                                          <div className="flex items-center gap-1">
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={(e) => {
                                                e.stopPropagation()
                                                toggleBookmark(org.id)
                                              }}
                                              className="p-1 h-auto"
                                            >
                                              {isBookmarked(org.id) ? (
                                                <BookmarkCheck className="h-4 w-4 text-primary" />
                                              ) : (
                                                <Bookmark className="h-4 w-4 text-muted-foreground hover:text-primary" />
                                              )}
                                            </Button>
                                            <div onClick={(e) => e.stopPropagation()}>
                                              <Checkbox
                                                checked={compareList.includes(org.id)}
                                                onCheckedChange={() => toggleCompare(org.id)}
                                                disabled={!compareList.includes(org.id) && compareList.length >= 5}
                                                className="h-4 w-4 border-muted-foreground hover:border-primary data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                                              />
                                            </div>
                                          </div>
                                        </div>
                                      </CardHeader>
                                      <CardContent className="pt-0 space-y-3">
                                        {/* <p className="text-xs text-muted-foreground line-clamp-2">{org.description}</p> */}

                                        <div className="space-y-2">
                                          <div className="flex items-center gap-1 text-xs">
                                            <MapPin className="h-3 w-3 text-primary flex-shrink-0" />
                                            <span className="truncate">{org.location}</span>
                                          </div>
                                          <div className="flex items-center gap-1 text-xs">
                                            <Globe className="h-3 w-3 text-primary flex-shrink-0" />
                                            <a
                                              href={`https://${org.website}`}
                                              className="text-primary hover:underline truncate"
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              onClick={(e) => e.stopPropagation()}
                                            >
                                              {org.website}
                                            </a>
                                          </div>
                                        </div>

                                        <div className="flex flex-wrap gap-1">
                                          {org.organizationType.slice(0, 2).map((type) => (
                                            <Badge key={type} variant="secondary" className="text-xs">
                                              {type}
                                            </Badge>
                                          ))}
                                          {org.organizationType.length > 2 && (
                                            <Badge variant="secondary" className="text-xs">
                                              +{org.organizationType.length - 2} more
                                            </Badge>
                                          )}
                                        </div>
                                      </CardContent>
                                    </Card>
                                  ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Country View Footer */}
                        <div className="text-center mt-8 pt-6 border-t border-border/50">
                          <p className="text-sm text-muted-foreground mb-2">
                            🌍 Global Biotechnology Organizations • Explore companies by country
                          </p>
                          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                              Global Coverage
                            </span>
                            <span className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                              {filteredOrganizations.length} Organizations
                            </span>
                            <span className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                              {timelineData.length} Countries
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filteredOrganizations.map((org) => (
                      <Card
                        key={org.id}
                        className="hover:shadow-lg transition-shadow cursor-pointer"
                        onClick={() => setSelectedOrg(org)}
                      >
                        <CardHeader className="pb-2 sm:pb-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <CardTitle className="text-sm sm:text-base leading-tight line-clamp-2">
                                {org.name}
                              </CardTitle>
                              <CardDescription className="text-xs mt-1">{org.category}</CardDescription>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  toggleBookmark(org.id)
                                }}
                                className="p-1 h-auto w-auto"
                              >
                                {isBookmarked(org.id) ? (
                                  <BookmarkCheck className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                                ) : (
                                  <Bookmark className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground hover:text-primary" />
                                )}
                              </Button>
                              <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                                <Checkbox
                                  checked={compareList.includes(org.id)}
                                  onCheckedChange={() => toggleCompare(org.id)}
                                  disabled={!compareList.includes(org.id) && compareList.length >= 5}
                                  className="h-3 w-3 sm:h-4 sm:w-4 border-muted-foreground hover:border-primary data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                                />
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0 space-y-2 sm:space-y-3">
                          <div className="space-y-1.5 sm:space-y-2">
                            <div className="flex items-center gap-1.5 text-xs">
                              <MapPin className="h-3 w-3 text-primary flex-shrink-0" />
                              <span className="truncate">{org.location}</span>
                            </div>
                            {org.address && org.address !== "Address not specified" && (
                              <div className="flex items-start gap-1.5 text-xs">
                                <Building2 className="h-3 w-3 text-primary flex-shrink-0 mt-0.5" />
                                <span className="truncate text-xs leading-tight">{org.address}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1.5 text-xs">
                              <Globe className="h-3 w-3 text-primary flex-shrink-0" />
                              <a
                                href={`https://${org.website}`}
                                className="text-primary hover:underline truncate"
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {org.website}
                              </a>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs">
                              <Phone className="h-3 w-3 text-primary flex-shrink-0" />
                              <a
                                href={`tel:${org.phone}`}
                                className="text-primary hover:underline truncate"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {org.phone}
                              </a>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs">
                              <Mail className="h-3 w-3 text-primary flex-shrink-0" />
                              <a
                                href={`mailto:${org.email}`}
                                className="text-primary hover:underline truncate"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {org.email}
                              </a>
                            </div>
                            {org.twitter && (
                              <div className="flex items-center gap-1.5 text-xs">
                                <span className="text-primary text-xs">𝕏</span>
                                <a
                                  href={`https://twitter.com/${org.twitter}`}
                                  className="text-primary hover:underline truncate"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  @{org.twitter}
                                </a>
                              </div>
                            )}
                            {org.linkedin && (
                              <div className="flex items-center gap-1.5 text-xs">
                                <span className="text-primary text-xs">in</span>
                                <a
                                  href={`https://linkedin.com/company/${org.linkedin}`}
                                  className="text-primary hover:underline truncate"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {org.linkedin}
                                </a>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-1">
                            {org.organizationType.slice(0, 2).map((type) => (
                              <Badge key={type} variant="secondary" className="text-xs px-1.5 py-0.5">
                                {type}
                              </Badge>
                            ))}
                            {org.organizationType.length > 2 && (
                              <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                                +{org.organizationType.length - 2} more
                              </Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {filteredOrganizations.length === 0 && (
                  <div className="text-center py-12">
                    <img src="/favicon.ico" alt="Biogrofe" className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No organizations found</h3>
                    <p className="text-muted-foreground">Try adjusting your search criteria or filters</p>
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* PWA Components */}
      <PWAInstall />
    </div>
  )
}
