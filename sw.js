/**
 * Hi-Tech Internet Hotspot Portal - Service Worker
 * Copyright (c) 2025 Mahmoud. All rights reserved.
 * 
 * Developed by: Mahmoud
 * Website: Hi-Tech Internet Services
 * Description: Service worker for PWA functionality and notifications
 * 
 * This software is proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */

const CACHE_NAME = 'hitech-hotspot-v1';
const STATIC_CACHE_URLS = [
    '/login.html',
    '/css/styles.css',
    '/css/arabic.css',
    '/js/main.js',
    '/js/pwa-manager.js',
    '/js/particles.js',
    '/js/md5.js',
    '/manifest.json',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png'
];

// Install event - cache static resources
self.addEventListener('install', event => {
    console.log('🔧 Service Worker: Installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('📦 Service Worker: Caching static resources');
                return cache.addAll(STATIC_CACHE_URLS);
            })
            .then(() => {
                console.log('✅ Service Worker: Installation complete');
                return self.skipWaiting();
            })
            .catch(error => {
                console.error('❌ Service Worker: Installation failed', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    console.log('🔄 Service Worker: Activating...');
    
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames
                        .filter(cacheName => cacheName !== CACHE_NAME)
                        .map(cacheName => {
                            console.log('🗑️ Service Worker: Deleting old cache', cacheName);
                            return caches.delete(cacheName);
                        })
                );
            })
            .then(() => {
                console.log('✅ Service Worker: Activation complete');
                return self.clients.claim();
            })
    );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Return cached version or fetch from network
                return response || fetch(event.request);
            })
            .catch(() => {
                // If both cache and network fail, show offline page
                if (event.request.destination === 'document') {
                    return caches.match('/offline.html');
                }
            })
    );
});

// Message event - handle commands from main thread
self.addEventListener('message', event => {
    console.log('📨 Service Worker: Received message', event.data);
    
    if (event.data && event.data.type === 'TRIGGER_NOTIFICATION') {
        handleNotificationTrigger(event.data);
    }
    
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// Push event - handle push notifications
self.addEventListener('push', event => {
    console.log('📬 Service Worker: Push notification received');
    
    let notificationData = {};
    
    if (event.data) {
        try {
            notificationData = event.data.json();
        } catch (e) {
            notificationData = {
                title: 'هاي تك للإنترنت',
                body: event.data.text() || 'إشعار جديد'
            };
        }
    }
    
    const options = {
        body: notificationData.body || 'لديك إشعار جديد',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        tag: notificationData.tag || 'hitech-notification',
        requireInteraction: notificationData.requireInteraction || false,
        actions: [
            {
                action: 'view',
                title: 'عرض',
                icon: '/icons/icon-72x72.png'
            },
            {
                action: 'close',
                title: 'إغلاق'
            }
        ],
        data: {
            url: notificationData.url || '/login.html',
            timestamp: Date.now()
        }
    };
    
    event.waitUntil(
        self.registration.showNotification(
            notificationData.title || 'هاي تك للإنترنت',
            options
        )
    );
});

// Notification click event
self.addEventListener('notificationclick', event => {
    console.log('🔔 Service Worker: Notification clicked', event.action, event.notification.data);
    
    event.notification.close();
    
    if (event.action === 'dismiss' || event.action === 'close') {
        console.log('📝 Service Worker: Notification dismissed');
        return;
    }
    
    // Default action or 'view' action
    const urlToOpen = event.notification.data?.url || '/login.html';
    
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then(clientList => {
                console.log('🔍 Service Worker: Looking for existing clients', clientList.length);
                
                // Check if app is already open
                for (const client of clientList) {
                    if (client.url.includes(self.location.origin) && 'focus' in client) {
                        console.log('👁️ Service Worker: Focusing existing window');
                        return client.focus().then(() => {
                            if (client.navigate) {
                                return client.navigate(urlToOpen);
                            }
                        });
                    }
                }
                
                // Open new window if app is not open
                if (clients.openWindow) {
                    console.log('🆕 Service Worker: Opening new window');
                    return clients.openWindow(urlToOpen);
                }
            })
            .catch(error => {
                console.error('❌ Service Worker: Error handling notification click', error);
            })
    );
});

// Background sync event
self.addEventListener('sync', event => {
    console.log('🔄 Service Worker: Background sync', event.tag);
    
    if (event.tag === 'connection-status-sync') {
        event.waitUntil(checkConnectionStatus());
    }
});

// Handle notification trigger from main thread
function handleNotificationTrigger(data) {
    console.log('🔔 Service Worker: Handling notification trigger', data);
    
    const { notificationType, title, message, duration, priority } = data;
    
    let notificationTitle = title;
    let notificationIcon = '🔔';
    let requireInteraction = false;
    
    // Set default titles and icons based on type
    switch (notificationType) {
        case 'maintenance_alert':
            notificationTitle = title || 'صيانة النظام';
            notificationIcon = '🔧';
            requireInteraction = true;
            break;
        case 'maintenance_completed':
            notificationTitle = title || 'انتهاء الصيانة';
            notificationIcon = '✅';
            break;
        case 'service_announcement':
            notificationTitle = title || 'إعلان مهم';
            notificationIcon = '📢';
            break;
        case 'connection_restored':
            notificationTitle = title || 'تم استعادة الاتصال';
            notificationIcon = '✅';
            break;
        case 'connection_lost':
            notificationTitle = title || 'انقطع الاتصال';
            notificationIcon = '⚠️';
            requireInteraction = true;
            break;
        case 'slow_connection':
            notificationTitle = title || 'اتصال بطيء';
            notificationIcon = '🐌';
            break;
    }
    
    const options = {
        body: message || 'لديك إشعار جديد من هاي تك',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        tag: notificationType + '_' + Date.now(), // Make unique to prevent grouping
        requireInteraction: requireInteraction,
        silent: false,
        renotify: true, // Show even if tag matches
        persistent: true, // Keep notification visible
        actions: [
            {
                action: 'view',
                title: 'عرض',
                icon: '/icons/icon-72x72.png'
            },
            {
                action: 'dismiss',
                title: 'إغلاق'
            }
        ],
        data: {
            notificationType: notificationType,
            timestamp: Date.now(),
            duration: duration,
            priority: priority,
            url: '/login.html'
        },
        // Mobile-specific enhancements
        image: '/icons/icon-512x512.png', // Large image for rich notifications
        dir: 'rtl', // Right-to-left for Arabic
        lang: 'ar'
    };
    
    // Add vibration pattern for important notifications
    if (priority === 'urgent' || notificationType === 'maintenance_alert') {
        options.vibrate = [200, 100, 200, 100, 200];
    }
    
    // Enhanced notification delivery for mobile devices
    console.log('📱 Service Worker: Attempting to show notification');
    
    return self.registration.showNotification(
        `${notificationIcon} ${notificationTitle}`,
        options
    ).then(() => {
        console.log('✅ Service Worker: Notification shown successfully');
        
        // For mobile devices, also try to send a message to all clients
        return self.clients.matchAll({ includeUncontrolled: true }).then(clients => {
            console.log(`📤 Service Worker: Broadcasting to ${clients.length} clients`);
            
            clients.forEach(client => {
                try {
                    client.postMessage({
                        type: 'NOTIFICATION_SENT',
                        data: {
                            notificationType,
                            title: notificationTitle,
                            message,
                            timestamp: Date.now()
                        }
                    });
                } catch (error) {
                    console.warn('⚠️ Service Worker: Could not message client', error);
                }
            });
        });
    }).catch(error => {
        console.error('❌ Service Worker: Failed to show notification', error);
        
        // Fallback: broadcast to clients even if notification fails
        return self.clients.matchAll({ includeUncontrolled: true }).then(clients => {
            clients.forEach(client => {
                try {
                    client.postMessage({
                        type: 'NOTIFICATION_FALLBACK',
                        data: {
                            notificationType,
                            title: notificationTitle,
                            message,
                            timestamp: Date.now()
                        }
                    });
                } catch (error) {
                    console.warn('⚠️ Service Worker: Could not message client in fallback', error);
                }
            });
        });
    });
}

// Check connection status for background sync
async function checkConnectionStatus() {
    try {
        const response = await fetch('/ping', {
            method: 'HEAD',
            cache: 'no-cache'
        });
        
        if (response.ok) {
            // Connection is good
            console.log('✅ Service Worker: Connection check passed');
        } else {
            // Connection issues
            console.log('⚠️ Service Worker: Connection check failed');
        }
    } catch (error) {
        console.log('❌ Service Worker: Connection check error', error);
    }
}

// Periodic background sync (if supported)
self.addEventListener('periodicsync', event => {
    if (event.tag === 'connection-check') {
        event.waitUntil(checkConnectionStatus());
    }
});

console.log('🎯 Service Worker: Script loaded and ready');