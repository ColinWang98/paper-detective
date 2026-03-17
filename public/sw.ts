/// <reference lib="webworker" />

import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { 
  CacheFirst, 
  NetworkFirst, 
  StaleWhileRevalidate,
  NetworkOnly 
} from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { BackgroundSyncPlugin } from 'workbox-background-sync';
import type { PrecacheEntry } from 'workbox-precaching';

// Extend ServiceWorkerGlobalScope for TypeScript
declare const self: ServiceWorkerGlobalScope;

type PeriodicSyncEvent = ExtendableEvent & { tag: string };

const CACHE_VERSION = 'v1';
const STATIC_CACHE_NAME = `paper-detective-static-${CACHE_VERSION}`;
const PDF_CACHE_NAME = `paper-detective-pdfs-${CACHE_VERSION}`;
const API_CACHE_NAME = `paper-detective-api-${CACHE_VERSION}`;
const IMAGE_CACHE_NAME = `paper-detective-images-${CACHE_VERSION}`;

// ============================================================================
// Precache Core Resources
// ============================================================================

// Precache and route all build assets
const manifest = (self as ServiceWorkerGlobalScope & {
  __WB_MANIFEST?: Array<string | PrecacheEntry>;
}).__WB_MANIFEST ?? [];
precacheAndRoute(manifest);

// Clean up outdated caches
cleanupOutdatedCaches();

// ============================================================================
// Navigation Route - Offline Page Fallback
// ============================================================================

const navigationRoute = new NavigationRoute(
  new NetworkFirst({
    cacheName: 'pages-cache',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [200],
      }),
    ],
  }),
  {
    denylist: [/^\/api\//],
  }
);

registerRoute(navigationRoute);

// Fallback to offline page when navigation fails
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        return await fetch(event.request);
      } catch {
        return (
          (await caches.match('/offline')) ??
          (await caches.match('/offline.html')) ??
          new Response(
            `
          <!DOCTYPE html>
          <html>
            <head>
              <title>离线 - Paper Detective</title>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <style>
                body { 
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                  display: flex; 
                  align-items: center; 
                  justify-content: center; 
                  min-height: 100vh; 
                  margin: 0;
                  background: #1a1a2e;
                  color: #fff;
                }
                .container { text-align: center; padding: 2rem; }
                h1 { font-size: 1.5rem; margin-bottom: 1rem; }
                p { color: #888; margin-bottom: 1.5rem; }
                button {
                  background: #e94560;
                  color: white;
                  border: none;
                  padding: 0.75rem 1.5rem;
                  border-radius: 0.5rem;
                  cursor: pointer;
                  font-size: 1rem;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>🔌 您已离线</h1>
                <p>请检查网络连接后重试</p>
                <button onclick="location.reload()">重新连接</button>
              </div>
            </body>
          </html>
          `,
            { headers: { 'Content-Type': 'text/html' } }
          )
        );
      }
    })());
  }
});

// ============================================================================
// Static Assets - Cache First
// ============================================================================

registerRoute(
  ({ request }) => 
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'font',
  new CacheFirst({
    cacheName: STATIC_CACHE_NAME,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      }),
    ],
  })
);

// ============================================================================
// PDF Files - Cache First with Capacity Limit
// ============================================================================

registerRoute(
  ({ url, request }) => {
    // Only cache PDFs from same origin or specific trusted domains
    const isPDF = url.pathname.endsWith('.pdf') || 
                  request.headers.get('content-type')?.includes('pdf');
    const isTrustedOrigin = self.location.origin === url.origin;
    return isPDF && isTrustedOrigin;
  },
  new CacheFirst({
    cacheName: PDF_CACHE_NAME,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 20, // Max 20 PDFs cached
        maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
        purgeOnQuotaError: true, // Clear on quota exceeded
      }),
    ],
  })
);

// ============================================================================
// API Responses - Network First / Stale While Revalidate
// ============================================================================

// Critical API - Network First
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/ai/'),
  new NetworkFirst({
    cacheName: API_CACHE_NAME,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [200],
      }),
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 24 * 60 * 60, // 1 day
      }),
    ],
    networkTimeoutSeconds: 10,
  })
);

// General API - Stale While Revalidate
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/') && !url.pathname.startsWith('/api/ai/'),
  new StaleWhileRevalidate({
    cacheName: API_CACHE_NAME,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [200],
      }),
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
      }),
    ],
  })
);

// ============================================================================
// Images - Cache First
// ============================================================================

registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: IMAGE_CACHE_NAME,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 200,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      }),
    ],
  })
);

// ============================================================================
// Background Sync
// ============================================================================

const bgSyncPlugin = new BackgroundSyncPlugin('sync-queue', {
  maxRetentionTime: 24 * 60, // 24 hours in minutes
  onSync: async ({ queue }) => {
    let entry;
    while ((entry = await queue.shiftRequest())) {
      try {
        await fetch(entry.request);
        
        // Notify clients about successful sync
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
          client.postMessage({
            type: 'SYNC_COMPLETED',
            timestamp: Date.now(),
          });
        });
      } catch (error) {
        console.error('Background sync failed:', error);
        await queue.unshiftRequest(entry);
        throw error;
      }
    }
  },
});

// Register background sync for API mutations
registerRoute(
  ({ url, request }) => 
    url.pathname.startsWith('/api/') &&
    ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method),
  new NetworkOnly({
    plugins: [bgSyncPlugin],
  }),
  'POST'
);

// ============================================================================
// Push Notifications (Future Enhancement)
// ============================================================================

self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  try {
    const data = event.data.json();
    const options: NotificationOptions = {
      body: data.body || '您有新的通知',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      tag: data.tag || 'default',
      requireInteraction: data.requireInteraction || false,
      data: data.url ? { url: data.url } : undefined,
    };

    event.waitUntil(
      self.registration.showNotification(
        data.title || 'Paper Detective',
        options
      )
    );
  } catch (error) {
    console.error('Push notification error:', error);
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const notificationData = event.notification.data;
  if (notificationData?.url) {
    event.waitUntil(
      self.clients.openWindow(notificationData.url)
    );
  }
});

// ============================================================================
// Service Worker Lifecycle
// ============================================================================

self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  
  // Skip waiting to activate immediately
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  
  event.waitUntil(
    Promise.all([
      // Claim clients immediately
      self.clients.claim(),
      
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name.startsWith('paper-detective-') && !name.includes(CACHE_VERSION))
            .map((name) => caches.delete(name))
        );
      }),
    ])
  );
  
  // Notify clients about activation
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      client.postMessage({
        type: 'SW_ACTIVATED',
        version: CACHE_VERSION,
      });
    });
  });
});

// ============================================================================
// Message Handling
// ============================================================================

self.addEventListener('message', (event) => {
  if (!event.data) return;
  
  switch (event.data.type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'GET_VERSION':
      event.ports[0]?.postMessage({
        version: CACHE_VERSION,
        timestamp: Date.now(),
      });
      break;
      
    case 'CLEAR_CACHES':
      event.waitUntil(
        caches.keys().then((names) => {
          return Promise.all(names.map((name) => caches.delete(name)));
        }).then(() => {
          event.ports[0]?.postMessage({ success: true });
        })
      );
      break;
      
    case 'CACHE_PDF':
      // Explicitly cache a PDF with privacy check
      if (event.data.url && !event.data.isSensitive) {
        event.waitUntil(
          caches.open(PDF_CACHE_NAME).then((cache) => {
            return fetch(event.data.url).then((response) => {
              return cache.put(event.data.url, response);
            });
          })
        );
      }
      break;
  }
});

// ============================================================================
// Periodic Background Sync (if supported)
// ============================================================================

self.addEventListener('periodicsync', (event) => {
  const periodicEvent = event as PeriodicSyncEvent;

  if (periodicEvent.tag === 'sync-data') {
    periodicEvent.waitUntil(
      // Perform periodic sync tasks
      Promise.resolve().then(() => {
        console.log('[SW] Periodic sync triggered');
      })
    );
  }
});

export {};
