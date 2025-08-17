interface Organization {
  id: string
  name: string
  description: string
  category: string
  location: string
  founded: number
  employees: string
  website: string
  specialties: string[]
  funding: string
  stage: string
}

// Semantic search keywords and weights
const semanticKeywords = {
  cancer: ["oncology", "tumor", "malignancy", "carcinoma", "chemotherapy"],
  gene: ["genetic", "genomic", "dna", "molecular", "crispr"],
  drug: ["pharmaceutical", "medicine", "therapy", "treatment", "compound"],
  vaccine: ["immunization", "vaccination", "immunotherapy", "antibody"],
  diagnostic: ["testing", "screening", "detection", "analysis", "biomarker"],
  ai: ["artificial intelligence", "machine learning", "computational", "algorithm"],
  startup: ["emerging", "early-stage", "founded", "new", "venture"],
}

export class AISearchEngine {
  private organizations: Organization[]

  constructor(organizations: Organization[]) {
    this.organizations = organizations
  }

  // Enhanced search with AI-like capabilities
  search(query: string, isAIMode = false): Organization[] {
    if (!query.trim()) return this.organizations

    const searchTerms = query
      .toLowerCase()
      .split(" ")
      .filter((term) => term.length > 1)

    if (isAIMode) {
      return this.aiSearch(query, searchTerms)
    } else {
      return this.standardSearch(searchTerms)
    }
  }

  private aiSearch(originalQuery: string, searchTerms: string[]): Organization[] {
    // Expand search terms with semantic keywords
    const expandedTerms = this.expandSearchTerms(searchTerms)

    // Score organizations based on relevance
    const scoredResults = this.organizations.map((org) => ({
      organization: org,
      score: this.calculateAIScore(org, originalQuery, expandedTerms),
    }))

    // Filter and sort by relevance score
    return scoredResults
      .filter((result) => result.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((result) => result.organization)
  }

  private standardSearch(searchTerms: string[]): Organization[] {
    return this.organizations.filter((org) => {
      const searchableText = `
        ${org.name} 
        ${org.description} 
        ${org.category} 
        ${org.location} 
        ${org.specialties.join(" ")}
        ${org.stage}
      `.toLowerCase()

      return searchTerms.some((term) => searchableText.includes(term) || this.fuzzyMatch(searchableText, term))
    })
  }

  private expandSearchTerms(terms: string[]): string[] {
    const expanded = [...terms]

    terms.forEach((term) => {
      Object.entries(semanticKeywords).forEach(([key, synonyms]) => {
        if (term.includes(key) || synonyms.some((syn) => term.includes(syn))) {
          expanded.push(key, ...synonyms)
        }
      })
    })

    return [...new Set(expanded)]
  }

  private calculateAIScore(org: Organization, originalQuery: string, expandedTerms: string[]): number {
    let score = 0
    const orgText = `${org.name} ${org.description} ${org.specialties.join(" ")}`.toLowerCase()

    // Exact name match gets highest score
    if (orgText.includes(originalQuery.toLowerCase())) {
      score += 100
    }

    // Category and specialty matches
    expandedTerms.forEach((term) => {
      if (org.name.toLowerCase().includes(term)) score += 50
      if (org.category.toLowerCase().includes(term)) score += 30
      if (org.specialties.some((spec) => spec.toLowerCase().includes(term))) score += 25
      if (org.description.toLowerCase().includes(term)) score += 15
      if (org.location.toLowerCase().includes(term)) score += 10
    })

    // Boost for recent companies if searching for "startup" or "new"
    if (expandedTerms.some((term) => ["startup", "new", "emerging"].includes(term))) {
      if (org.founded > 2018) score += 20
    }

    // Boost for specific stages
    if (expandedTerms.some((term) => ["clinical", "fda"].includes(term))) {
      if (org.stage.toLowerCase().includes("clinical")) score += 25
    }

    return score
  }

  private fuzzyMatch(text: string, term: string): boolean {
    // Simple fuzzy matching for typos
    if (term.length < 4) return false

    const words = text.split(" ")
    return words.some((word) => {
      if (word.length < 3) return false

      let matches = 0
      const minLength = Math.min(word.length, term.length)

      for (let i = 0; i < minLength; i++) {
        if (word[i] === term[i]) matches++
      }

      return matches / minLength > 0.7
    })
  }

  // Get smart suggestions based on current data
  getSuggestions(query: string): string[] {
    if (query.length < 2) return []

    const suggestions = new Set<string>()

    this.organizations.forEach((org) => {
      // Add category suggestions
      if (org.category.toLowerCase().includes(query.toLowerCase())) {
        suggestions.add(`${org.category} companies`)
      }

      // Add location suggestions
      if (org.location.toLowerCase().includes(query.toLowerCase())) {
        suggestions.add(`Companies in ${org.location}`)
      }

      // Add specialty suggestions
      org.specialties.forEach((specialty) => {
        if (specialty.toLowerCase().includes(query.toLowerCase())) {
          suggestions.add(`${specialty} specialists`)
        }
      })
    })

    return Array.from(suggestions).slice(0, 5)
  }
}
