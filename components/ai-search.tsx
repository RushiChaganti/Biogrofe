"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Search, Sparkles, Brain } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface AISearchProps {
  onSearch: (query: string, isAI: boolean) => void
  placeholder?: string
}

// AI-like search suggestions and synonyms
const searchSynonyms = {
  drug: ["pharmaceutical", "medicine", "therapy", "treatment"],
  gene: ["genetic", "genomic", "dna", "molecular"],
  cancer: ["oncology", "tumor", "malignancy", "carcinoma"],
  vaccine: ["immunization", "vaccination", "immunotherapy"],
  diagnostic: ["testing", "screening", "detection", "analysis"],
  biotech: ["biotechnology", "biopharmaceutical", "life sciences"],
  research: ["development", "innovation", "discovery", "clinical"],
  startup: ["emerging", "early-stage", "new", "founded"],
}

const smartSuggestions = [
  "Companies developing cancer treatments",
  "Gene therapy startups in California",
  "Diagnostic companies with FDA approval",
  "Vaccine manufacturers with global reach",
  "AI-powered drug discovery platforms",
  "Biotech companies founded after 2020",
]

export function AISearch({ onSearch, placeholder = "Search organizations..." }: AISearchProps) {
  const [query, setQuery] = useState("")
  const [isAIMode, setIsAIMode] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  // Generate intelligent suggestions based on input
  useEffect(() => {
    if (query.length > 2) {
      const relevantSuggestions = smartSuggestions.filter(
        (suggestion) =>
          suggestion.toLowerCase().includes(query.toLowerCase()) ||
          query
            .toLowerCase()
            .split(" ")
            .some((word) => suggestion.toLowerCase().includes(word)),
      )
      setSuggestions(relevantSuggestions.slice(0, 3))
      setShowSuggestions(relevantSuggestions.length > 0)
    } else {
      setShowSuggestions(false)
    }
  }, [query])

  const handleSearch = (searchQuery: string = query) => {
    if (searchQuery.trim()) {
      onSearch(searchQuery, isAIMode)
      setShowSuggestions(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  return (
    <div className="relative w-full max-w-2xl">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          type="text"
          placeholder={isAIMode ? "Ask me anything about biotech organizations..." : placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          className={`pl-10 pr-32 h-12 text-base ${isAIMode ? "border-primary ring-1 ring-primary/20" : ""}`}
        />
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
          <Button
            variant={isAIMode ? "default" : "outline"}
            size="sm"
            onClick={() => setIsAIMode(!isAIMode)}
            className="h-8 px-3"
          >
            {isAIMode ? <Brain className="h-3 w-3 mr-1" /> : <Sparkles className="h-3 w-3 mr-1" />}
            {isAIMode ? "AI" : "Smart"}
          </Button>
          <Button onClick={() => handleSearch()} size="sm" className="h-8 px-3">
            Search
          </Button>
        </div>
      </div>

      {/* AI Suggestions Dropdown */}
      {showSuggestions && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-lg shadow-lg z-50">
          <div className="p-2">
            <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Smart Suggestions
            </div>
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => {
                  setQuery(suggestion)
                  handleSearch(suggestion)
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-muted rounded-md transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
