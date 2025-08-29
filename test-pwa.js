// Simple PWA test script
// Run this in browser console to test PWA features

console.log('🧪 Testing PWA Features...\n');

// Test 1: Check if service worker is supported
if ('serviceWorker' in navigator) {
  console.log('✅ Service Worker supported');
  
  navigator.serviceWorker.getRegistrations().then(registrations => {
    if (registrations.length > 0) {
      console.log('✅ Service Worker registered:', registrations[0].scope);
    } else {
      console.log('❌ No Service Worker registered');
    }
  });
} else {
  console.log('❌ Service Worker not supported');
}

// Test 2: Check manifest
fetch('/manifest.json')
  .then(response => response.json())
  .then(manifest => {
    console.log('✅ Manifest loaded:', manifest.name);
    console.log('   - Short name:', manifest.short_name);
    console.log('   - Display mode:', manifest.display);
    console.log('   - Theme color:', manifest.theme_color);
  })
  .catch(error => {
    console.log('❌ Manifest not found:', error);
  });

// Test 3: Check if app is installable
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  console.log('✅ App is installable');
  deferredPrompt = e;
});

// Test 4: Check if running as PWA
if (window.matchMedia('(display-mode: standalone)').matches) {
  console.log('✅ Running as installed PWA');
} else if (window.navigator.standalone === true) {
  console.log('✅ Running as iOS PWA');
} else {
  console.log('ℹ️ Running in browser (not installed)');
}

// Test 5: Check offline capability
if ('caches' in window) {
  caches.keys().then(cacheNames => {
    if (cacheNames.length > 0) {
      console.log('✅ Cache API available, caches:', cacheNames);
    } else {
      console.log('ℹ️ Cache API available but no caches yet');
    }
  });
} else {
  console.log('❌ Cache API not supported');
}

// Test 6: Test export functionality
console.log('\n📊 Testing Export Features...');
console.log('Check if export buttons are visible and functional');

// Test 7: Test map functionality
console.log('\n🗺️ Testing Map Features...');
console.log('Switch to Map view to test Leaflet integration');

console.log('\n🎉 PWA Test Complete! Check results above.');
