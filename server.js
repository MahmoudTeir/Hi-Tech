/**
 * Hi-Tech Internet Hotspot Portal - Notification Server
 * Copyright (c) 2025 Mahmoud. All rights reserved.
 * 
 * Simple Node.js server for cross-device notifications
 * Works with hotspot environments and handles real-time broadcasting
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const webPush = require('web-push');

// Configuration
const PORT = process.env.PORT || 3000;
const ADMIN_TOKEN = 'hitech_admin_2025'; // Simple token for admin authentication

// VAPID keys for real push notifications
const VAPID_KEYS = {
    publicKey: 'BAevWbgCDCUm5qIaF2pkSN3AwxRmTMh8gPF3EeUN2PveTg4Cc0LKxw14Rm6jxiuE2qZ_AqK0lQkZy7QGYMkrQ4g',
    privateKey: 'jt_cCa0C5aiLvEc-QIZ0PqMrvevaFRDkLNAXnuXv8Sc'
};

// Configure web-push
webPush.setVapidDetails(
    'mailto:admin@hitech.net',
    VAPID_KEYS.publicKey,
    VAPID_KEYS.privateKey
);

// Store active connections and notifications
let activeConnections = new Set();
let activeNotifications = [];
let subscribedClients = new Map(); // Store push subscriptions for background notifications

// MIME types for serving static files
const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.ico': 'image/x-icon'
};

// Create HTTP server
const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    const method = req.method;

    console.log(`${method} ${pathname} - ${new Date().toISOString()}`);

    // CORS headers for cross-origin requests
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle preflight requests
    if (method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // API Routes
    if (pathname.startsWith('/api/')) {
        handleApiRequest(req, res, pathname, method);
        return;
    }

    // Server-Sent Events for real-time notifications
    if (pathname === '/notifications/stream') {
        handleSSE(req, res);
        return;
    }

    // Serve static files
    serveStaticFile(req, res, pathname);
});

/**
 * Handle API requests
 */
function handleApiRequest(req, res, pathname, method) {
    // Send notification API
    if (pathname === '/api/notifications/send' && method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                
                // Simple authentication check
                if (data.token !== ADMIN_TOKEN) {
                    res.writeHead(401, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Unauthorized' }));
                    return;
                }

                // Create notification object
                const notification = {
                    id: Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                    notificationType: data.notificationType || 'service_announcement',
                    title: data.title || 'إشعار من الإدارة',
                    message: data.message || 'لديك إشعار جديد',
                    duration: data.duration || 300000, // 5 minutes default
                    displayDuration: data.displayDuration || 5,
                    priority: data.priority || 'normal',
                    timestamp: Date.now(),
                    sender: 'admin'
                };

                // Store notification
                activeNotifications.push(notification);
                
                // Clean old notifications (keep last 10)
                if (activeNotifications.length > 10) {
                    activeNotifications = activeNotifications.slice(-10);
                }

                // Broadcast to all connected clients
                const message = JSON.stringify({
                    type: 'notification',
                    data: notification
                });

                console.log(`📤 Broadcasting notification to ${activeConnections.size} clients`);
                
                for (const client of activeConnections) {
                    try {
                        client.write(`data: ${message}\n\n`);
                    } catch (error) {
                        console.error('Error sending to client:', error);
                        activeConnections.delete(client);
                    }
                }

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    success: true, 
                    notificationId: notification.id,
                    clientsNotified: activeConnections.size
                }));

            } catch (error) {
                console.error('Error processing notification:', error);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
        });
        return;
    }

    // Get active notifications API
    if (pathname === '/api/notifications/active' && method === 'GET') {
        const now = Date.now();
        const active = activeNotifications.filter(notif => {
            const expiresAt = notif.timestamp + notif.duration;
            return expiresAt > now;
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ notifications: active }));
        return;
    }

    // Server status API
    if (pathname === '/api/status' && method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'running',
            connectedClients: activeConnections.size,
            activeNotifications: activeNotifications.length,
            uptime: process.uptime(),
            timestamp: Date.now()
        }));
        return;
    }

    // Get VAPID public key for client-side push subscription
    if (pathname === '/api/push/vapid-public-key' && method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            publicKey: VAPID_KEYS.publicKey
        }));
        return;
    }

    // Push subscription endpoint for background notifications
    if (pathname === '/api/push/subscribe' && method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                const { subscription, clientId } = JSON.parse(body);
                
                if (!subscription || !subscription.endpoint) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Invalid subscription data' }));
                    return;
                }
                
                // Store the subscription
                const id = clientId || 'client_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                subscribedClients.set(id, {
                    subscription: subscription,
                    timestamp: Date.now(),
                    clientId: id
                });
                
                console.log(`🔔 Push subscription registered: ${id}`);
                console.log(`📊 Total subscribed clients: ${subscribedClients.size}`);
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    success: true, 
                    clientId: id,
                    totalSubscribed: subscribedClients.size
                }));
                
            } catch (error) {
                console.error('Error processing push subscription:', error);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
        });
        return;
    }

    // Push notification API endpoint (for background notifications)
    if (pathname === '/api/push/send' && method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                
                // Simple authentication check
                if (data.token !== ADMIN_TOKEN) {
                    res.writeHead(401, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Unauthorized' }));
                    return;
                }
                
                const notification = {
                    title: data.title || 'هاي تك للإنترنت',
                    body: data.message || 'لديك إشعار جديد',
                    tag: (data.notificationType || 'notification') + '_' + Date.now(),
                    requireInteraction: data.priority === 'urgent' || data.notificationType === 'maintenance_alert',
                    data: {
                        notificationType: data.notificationType,
                        timestamp: Date.now(),
                        url: '/login.html'
                    }
                };
                
                // Send to all subscribed clients
                sendPushToAllClients(notification);
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    success: true, 
                    clientsNotified: subscribedClients.size
                }));
                
            } catch (error) {
                console.error('Error processing push notification:', error);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
        });
        return;
    }

    // 404 for unknown API routes
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'API endpoint not found' }));
}

/**
 * Handle Server-Sent Events for real-time notifications
 */
function handleSSE(req, res) {
    console.log('📡 New SSE connection established');

    // Set SSE headers
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
    });

    // Add to active connections
    activeConnections.add(res);

    // Send welcome message
    res.write(`data: ${JSON.stringify({
        type: 'connected',
        message: 'متصل بخدمة الإشعارات',
        timestamp: Date.now()
    })}\n\n`);

    // Send any active notifications to new client
    const now = Date.now();
    const active = activeNotifications.filter(notif => {
        const expiresAt = notif.timestamp + notif.duration;
        return expiresAt > now;
    });

    if (active.length > 0) {
        setTimeout(() => {
            for (const notification of active) {
                try {
                    res.write(`data: ${JSON.stringify({
                        type: 'notification',
                        data: notification
                    })}\n\n`);
                } catch (error) {
                    console.error('Error sending active notification:', error);
                }
            }
        }, 1000); // Small delay to ensure connection is ready
    }

    // Handle client disconnect
    req.on('close', () => {
        console.log('📡 SSE connection closed');
        activeConnections.delete(res);
    });

    req.on('error', (error) => {
        console.error('SSE connection error:', error);
        activeConnections.delete(res);
    });

    // Keep connection alive with periodic heartbeat
    const heartbeat = setInterval(() => {
        try {
            res.write(`data: ${JSON.stringify({
                type: 'heartbeat',
                timestamp: Date.now()
            })}\n\n`);
        } catch (error) {
            clearInterval(heartbeat);
            activeConnections.delete(res);
        }
    }, 30000); // Every 30 seconds

    // Clean up heartbeat on disconnect
    req.on('close', () => {
        clearInterval(heartbeat);
    });
}

/**
 * Send push notifications to all subscribed clients
 */
function sendPushToAllClients(notificationPayload) {
    console.log(`📱 Sending push notifications to ${subscribedClients.size} subscribed clients`);
    
    const promises = [];
    const expiredClients = [];
    
    for (const [clientId, clientData] of subscribedClients.entries()) {
        try {
            console.log(`📤 Sending REAL push to client: ${clientId}`);
            
            // Use real web-push library for background notifications
            const pushPromise = webPush.sendNotification(
                clientData.subscription,
                JSON.stringify(notificationPayload)
            ).then(() => {
                console.log(`✅ Real push sent successfully to: ${clientId}`);
                return { success: true, clientId };
            }).catch(error => {
                console.error(`❌ Failed to send real push to ${clientId}:`, error);
                
                // Mark client for removal if subscription is invalid
                if (error.statusCode === 410 || error.statusCode === 413) {
                    expiredClients.push(clientId);
                }
                return { success: false, clientId, error: error.message };
            });
            
            promises.push(pushPromise);
            
        } catch (error) {
            console.error(`❌ Failed to send push to client ${clientId}:`, error);
            
            // Mark client for removal if subscription is invalid
            if (error.statusCode === 410 || error.statusCode === 413) {
                expiredClients.push(clientId);
            }
        }
    }
    
    // Clean up expired subscriptions
    expiredClients.forEach(clientId => {
        console.log(`🧹 Removing expired push subscription: ${clientId}`);
        subscribedClients.delete(clientId);
    });
    
    return Promise.all(promises).then(results => {
        const successful = results.filter(r => r.success).length;
        console.log(`✅ Push notifications sent successfully to ${successful}/${subscribedClients.size} clients`);
        return { sent: successful, total: subscribedClients.size };
    });
}

/**
 * Serve static files
 */
function serveStaticFile(req, res, pathname) {
    // Default to index.html for root
    if (pathname === '/') {
        pathname = '/login.html';
    }

    const filePath = path.join(__dirname, pathname);
    const ext = path.extname(filePath);
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 - File Not Found</h1>');
            } else {
                res.writeHead(500, { 'Content-Type': 'text/html' });
                res.end('<h1>500 - Internal Server Error</h1>');
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        }
    });
}

// Start server on all network interfaces (0.0.0.0) for cross-device access
server.listen(PORT, '0.0.0.0', () => {
    console.log('🚀 Hi-Tech Notification Server Started');
    console.log(`🌐 Server running at http://0.0.0.0:${PORT}`);
    console.log(`🌐 Local access: http://localhost:${PORT}`);
    console.log(`🌐 Network access: http://[YOUR_IP]:${PORT}`);
    console.log(`📡 SSE endpoint: /notifications/stream`);
    console.log(`🔔 Send notifications to: /api/notifications/send`);
    console.log(`📊 Server status: /api/status`);
    console.log(`🔐 Admin token: ${ADMIN_TOKEN}`);
    console.log('Ready to broadcast notifications to all connected devices! 📱💻🖥️');
    console.log('📱 Mobile devices can now connect using your computer\'s IP address!');
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('📴 Server shutting down gracefully...');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});

// Clean up old notifications every 5 minutes
setInterval(() => {
    const now = Date.now();
    const before = activeNotifications.length;
    activeNotifications = activeNotifications.filter(notif => {
        const expiresAt = notif.timestamp + notif.duration;
        return expiresAt > now;
    });
    if (before !== activeNotifications.length) {
        console.log(`🧹 Cleaned up ${before - activeNotifications.length} expired notifications`);
    }
}, 5 * 60 * 1000);