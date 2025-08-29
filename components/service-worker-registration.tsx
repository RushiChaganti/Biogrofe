"use client"

import { useEffect } from 'react'
import { Workbox } from 'workbox-window'

declare global {
  interface Window {
    workbox?: Workbox;
  }
}

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      window.workbox !== undefined
    ) {
      const wb = window.workbox
      
      // Add event listeners to handle any of the generated workbox events
      wb.addEventListener('controlling', () => {
        console.log('[SW] Service worker is controlling the page')
        window.location.reload()
      })

      wb.addEventListener('waiting', () => {
        console.log('[SW] Service worker is waiting')
        // Show update available notification
        if (confirm('A new version is available. Reload to update?')) {
          wb.messageSkipWaiting()
        }
      })

      // Updated the 'installed' event listener to use 'unknown' and cast dynamically.
      wb.addEventListener('installed', (event: unknown) => {
        console.log('[SW] Service worker installed:', event);
        const isUpdate = (event as { isUpdate?: boolean }).isUpdate;
        if (isUpdate) {
          console.log('[SW] Service worker updated');
        } else {
          console.log('[SW] Service worker installed for the first time');
        }
      })

      wb.addEventListener('activated', () => {
        console.log('[SW] Service worker activated')
      })

      wb.register()
    } else if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator
    ) {
      // Fallback registration without workbox
      registerServiceWorker()
    }
  }, [])

  return null
}

async function registerServiceWorker() {
  try {
    console.log('[SW] Registering service worker...')
    
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    })

    console.log('[SW] Service worker registered successfully:', registration)

    // Handle updates
    registration.addEventListener('updatefound', () => {
      console.log('[SW] New service worker found')
      
      const newWorker = registration.installing
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // New update available
              console.log('[SW] New content is available; please refresh.')
              
              // Show update notification
              if (confirm('A new version is available. Reload to update?')) {
                window.location.reload()
              }
            } else {
              // Content is cached for offline use
              console.log('[SW] Content is cached for offline use.')
            }
          }
        })
      }
    })

    // Handle controller change
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('[SW] Controller changed, reloading page')
      window.location.reload()
    })

  } catch (error) {
    console.error('[SW] Service worker registration failed:', error)
  }
}

// Utility function to check if app is running as PWA
export function isPWA(): boolean {
  if (typeof window === 'undefined') return false
  
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  )
}

// Utility function to check if device is mobile
export function isMobile(): boolean {
  if (typeof window === 'undefined') return false
  
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  )
}

// Utility function to get install prompt
export function getInstallPrompt(): Promise<any> {
  return new Promise((resolve) => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault()
      resolve(e)
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    
    // Timeout after 5 seconds
    setTimeout(() => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      resolve(null)
    }, 5000)
  })
}
