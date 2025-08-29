const CACHE_NAME = 'biogrofe-v1.0.0'
const STATIC_CACHE_NAME = 'biogrofe-static-v1.0.0'
const DYNAMIC_CACHE_NAME = 'biogrofe-dynamic-v1.0.0'

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  // Add other static assets as needed
]

// API endpoints to cache
const API_CACHE_PATTERNS = [
  /^https:\/\/gist\.githubusercontent\.com/,
  // Add other API patterns as needed
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...')
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets')
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => {
        console.log('[SW] Static assets cached successfully')
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error('[SW] Error caching static assets:', error)
      })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...')
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE_NAME && 
                cacheName !== DYNAMIC_CACHE_NAME &&
                cacheName !== CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        console.log('[SW] Service worker activated')
        return self.clients.claim()
      })
  )
})

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // Handle different types of requests
  if (request.destination === 'document') {
    // HTML pages - Network first, fallback to cache
    event.respondWith(networkFirstStrategy(request))
  } else if (isAPIRequest(request)) {
    // API requests - Cache first with network fallback
    event.respondWith(cacheFirstStrategy(request, DYNAMIC_CACHE_NAME))
  } else if (request.destination === 'image') {
    // Images - Cache first
    event.respondWith(cacheFirstStrategy(request, STATIC_CACHE_NAME))
  } else {
    // Other static assets - Cache first
    event.respondWith(cacheFirstStrategy(request, STATIC_CACHE_NAME))
  }
})

// Network first strategy (for HTML pages)
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', error)
    const cachedResponse = await caches.match(request)
    
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Return offline page if available
    return caches.match('/offline.html') || new Response('Offline', {
      status: 503,
      statusText: 'Service Unavailable'
    })
  }
}

// Cache first strategy (for API and static assets)
async function cacheFirstStrategy(request, cacheName) {
  const cachedResponse = await caches.match(request)
  
  if (cachedResponse) {
    // Update cache in background for API requests
    if (isAPIRequest(request)) {
      updateCacheInBackground(request, cacheName)
    }
    return cachedResponse
  }
  
  try {
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.log('[SW] Network and cache failed:', error)
    
    // Return a fallback response for failed requests
    if (request.destination === 'image') {
      return new Response('', { status: 404 })
    }
    
    return new Response('Network Error', {
      status: 503,
      statusText: 'Service Unavailable'
    })
  }
}

// Update cache in background (stale-while-revalidate)
function updateCacheInBackground(request, cacheName) {
  fetch(request)
    .then((response) => {
      if (response.ok) {
        caches.open(cacheName)
          .then((cache) => cache.put(request, response))
      }
    })
    .catch((error) => {
      console.log('[SW] Background cache update failed:', error)
    })
}

// Check if request is for API data
function isAPIRequest(request) {
  return API_CACHE_PATTERNS.some(pattern => pattern.test(request.url))
}

// Handle background sync (if supported)
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag)
  
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync())
  }
})

async function doBackgroundSync() {
  try {
    // Implement background sync logic here
    // For example, sync bookmarks, update cached data, etc.
    console.log('[SW] Performing background sync...')
  } catch (error) {
    console.error('[SW] Background sync failed:', error)
  }
}

// Handle push notifications (if needed in the future)
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received:', event)
  
  const options = {
    body: event.data ? event.data.text() : 'New update available',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Explore',
        icon: '/icons/checkmark.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/xmark.png'
      }
    ]
  }
  
  event.waitUntil(
    self.registration.showNotification('Biogrofe', options)
  )
})

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event)
  
  event.notification.close()
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    )
  }
})
