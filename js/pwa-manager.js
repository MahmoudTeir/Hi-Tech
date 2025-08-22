/**
 * Hi-Tech Internet Hotspot Portal - PWA Manager
 * Copyright (c) 2025 Mahmoud. All rights reserved.
 * 
 * Developed by: Mahmoud
 * Website: Hi-Tech Internet Services
 * Description: Progressive Web App functionality and notification management
 * 
 * This software is proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */

class PWAManager {
    constructor() {
        this.swRegistration = null;
        this.isOnline = navigator.onLine;
        this.connectionCheckInterval = null;
        this.notificationPermission = 'default';
        this.installPromptEvent = null;
        
        this.init();
    }

    /**
     * Initialize PWA Manager
     */
    async init() {
        console.log('🎯 PWA Manager: Initializing...');
        
        // Check if service workers are supported
        if ('serviceWorker' in navigator) {
            await this.registerServiceWorker();
        } else {
            console.warn('⚠️ Service Workers not supported');
        }
        
        // Setup push notifications
        await this.setupPushNotifications();
        
        // Setup connection monitoring
        this.setupConnectionMonitoring();
        
        // Setup install prompt
        this.setupInstallPrompt();
        
        // Setup offline detection
        this.setupOfflineDetection();
        
        console.log('✅ PWA Manager: Initialization complete');
    }

    /**
     * Register Service Worker
     */
    async registerServiceWorker() {
        try {
            console.log('🔧 PWA Manager: Registering service worker...');
            
            this.swRegistration = await navigator.serviceWorker.register('/sw.js', {
                scope: '/'
            });
            
            console.log('✅ Service Worker registered:', this.swRegistration.scope);
            
            // Handle service worker updates
            this.swRegistration.addEventListener('updatefound', () => {
                console.log('🔄 Service Worker update found');
                const newWorker = this.swRegistration.installing;
                
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        this.showUpdateNotification();
                    }
                });
            });
            
            // Listen for service worker messages
            navigator.serviceWorker.addEventListener('message', this.handleServiceWorkerMessage.bind(this));
            
        } catch (error) {
            console.error('❌ Service Worker registration failed:', error);
        }
    }

    /**
     * Setup Push Notifications
     */
    async setupPushNotifications() {
        console.log('📢 PWA Manager: Setting up push notifications...');
        
        // Check notification support
        if (!('Notification' in window)) {
            console.warn('⚠️ Push notifications not supported');
            return;
        }
        
        // Check current permission
        this.notificationPermission = Notification.permission;
        console.log('🔔 Notification permission:', this.notificationPermission);
        
        if (this.notificationPermission === 'default') {
            // Auto-request permission after delay for better UX
            setTimeout(() => {
                this.showNotificationPermissionPrompt();
            }, 3000);
        } else if (this.notificationPermission === 'granted') {
            await this.subscribeToPushNotifications();
            this.setupNotificationListener();
        }
        
        // Always setup the notification listener for broadcasting
        this.setupNotificationListener();
    }

    /**
     * Request notification permission
     */
    async requestNotificationPermission() {
        try {
            this.notificationPermission = await Notification.requestPermission();
            console.log('🔔 Notification permission result:', this.notificationPermission);
            
            if (this.notificationPermission === 'granted') {
                await this.subscribeToPushNotifications();
                this.showWelcomeNotification();
            }
            
        } catch (error) {
            console.error('❌ Notification permission request failed:', error);
        }
    }

    /**
     * Subscribe to push notifications
     */
    async subscribeToPushNotifications() {
        if (!this.swRegistration) {
            console.warn('⚠️ Service Worker not registered');
            return;
        }
        
        try {
            console.log('📮 PWA Manager: Subscribing to push notifications...');
            
            const subscription = await this.swRegistration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.urlB64ToUint8Array(this.getVAPIDPublicKey())
            });
            
            console.log('✅ Push subscription successful:', subscription);
            
            // Send subscription to server (implement as needed)
            await this.sendSubscriptionToServer(subscription);
            
        } catch (error) {
            console.error('❌ Push subscription failed:', error);
        }
    }

    /**
     * Get VAPID public key (replace with your actual key)
     */
    getVAPIDPublicKey() {
        // This is a placeholder - replace with your actual VAPID public key
        return 'BEl62iUYgUivxIkv69yViEuiBIa40HI0AkI1fEI2aMxwDaZwvGh2kGlxLK3aMBFHPGUXh8XQLF9dT4W4w9g8G3w';
    }

    /**
     * Convert VAPID key to Uint8Array
     */
    urlB64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');
        
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    /**
     * Send subscription to server
     */
    async sendSubscriptionToServer(subscription) {
        try {
            // Implement server-side subscription storage
            console.log('📤 Sending subscription to server...');
            
            // For now, store in localStorage as fallback
            localStorage.setItem('push-subscription', JSON.stringify(subscription));
            
        } catch (error) {
            console.error('❌ Failed to send subscription to server:', error);
        }
    }

    /**
     * Setup connection monitoring
     */
    setupConnectionMonitoring() {
        console.log('🌐 PWA Manager: Setting up connection monitoring...');
        
        // Monitor online/offline status
        window.addEventListener('online', this.handleOnline.bind(this));
        window.addEventListener('offline', this.handleOffline.bind(this));
        
        // Start periodic connection checks
        this.startConnectionChecks();
    }

    /**
     * Handle online event
     */
    handleOnline() {
        console.log('✅ Connection restored');
        this.isOnline = true;
        
        // Trigger background sync
        if (this.swRegistration && this.swRegistration.sync) {
            this.swRegistration.sync.register('connection-status-sync');
        }
        
        // Send connection notification
        this.sendConnectionNotification('connection_restored');
        
        // Update UI
        this.updateConnectionStatus(true);
    }

    /**
     * Handle offline event
     */
    handleOffline() {
        console.log('❌ Connection lost');
        this.isOnline = false;
        
        // Send connection notification
        this.sendConnectionNotification('connection_lost');
        
        // Update UI
        this.updateConnectionStatus(false);
    }

    /**
     * Start periodic connection checks
     */
    startConnectionChecks() {
        this.connectionCheckInterval = setInterval(() => {
            this.checkConnectionQuality();
        }, 30000); // Check every 30 seconds
    }

    /**
     * Check connection quality
     */
    async checkConnectionQuality() {
        if (!this.isOnline) return;
        
        try {
            const startTime = Date.now();
            const response = await fetch('/ping', { 
                method: 'HEAD',
                cache: 'no-cache'
            });
            const endTime = Date.now();
            const latency = endTime - startTime;
            
            console.log(`🏓 Connection latency: ${latency}ms`);
            
            // Notify if connection is slow
            if (latency > 3000) {
                this.sendConnectionNotification('slow_connection', {
                    latency: latency
                });
            }
            
        } catch (error) {
            console.log('🔄 Connection check failed, might be offline');
            if (this.isOnline) {
                this.handleOffline();
            }
        }
    }

    /**
     * Send connection notification
     */
    sendConnectionNotification(type, data = {}) {
        if (this.notificationPermission !== 'granted') return;
        
        const notificationData = {
            type: type,
            timestamp: Date.now(),
            ...data
        };
        
        // Send to service worker
        if (this.swRegistration && this.swRegistration.active) {
            this.swRegistration.active.postMessage({
                type: 'TRIGGER_NOTIFICATION',
                ...notificationData
            });
        }
    }

    /**
     * Send maintenance notification
     */
    sendMaintenanceNotification(type, message, duration = null) {
        if (this.notificationPermission !== 'granted') return;
        
        const notificationData = {
            type: type,
            message: message,
            timestamp: Date.now(),
            duration: duration
        };
        
        // Send to service worker
        if (this.swRegistration && this.swRegistration.active) {
            this.swRegistration.active.postMessage({
                type: 'TRIGGER_NOTIFICATION',
                ...notificationData
            });
        }
        
        // Show maintenance banner if it's a maintenance alert
        if (type === 'maintenance_alert') {
            this.showMaintenanceBanner(message, duration);
        }
    }

    /**
     * Show maintenance banner
     */
    showMaintenanceBanner(message, duration) {
        // Remove existing maintenance banner
        const existingBanner = document.querySelector('.maintenance-banner');
        if (existingBanner) {
            existingBanner.remove();
        }
        
        // Create maintenance banner
        const banner = document.createElement('div');
        banner.className = 'maintenance-banner';
        banner.innerHTML = `
            <div class="banner-content">
                <span class="banner-icon">🔧</span>
                <div class="banner-text">
                    <div class="banner-title">صيانة النظام</div>
                    <div class="banner-message">${message}</div>
                    ${duration ? `<div class="banner-duration">المدة المتوقعة: ${duration}</div>` : ''}
                </div>
                <div class="banner-actions">
                    <button class="banner-button" onclick="window.location.href='/maintenance.html'">التفاصيل</button>
                    <button class="banner-close" onclick="this.parentElement.parentElement.parentElement.remove()">×</button>
                </div>
            </div>
        `;
        
        // Add banner styles
        banner.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            z-index: 10000;
            background: linear-gradient(135deg, #F59E0B, #D97706);
            color: white;
            padding: 16px;
            text-align: center;
            animation: slideDown 0.3s ease;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        `;
        
        // Style banner content
        const content = banner.querySelector('.banner-content');
        content.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: space-between;
            max-width: 1200px;
            margin: 0 auto;
            gap: 16px;
        `;
        
        const icon = banner.querySelector('.banner-icon');
        icon.style.cssText = `
            font-size: 24px;
            animation: maintenance-pulse 2s ease-in-out infinite;
        `;
        
        const text = banner.querySelector('.banner-text');
        text.style.cssText = `
            flex: 1;
            text-align: right;
        `;
        
        const title = banner.querySelector('.banner-title');
        title.style.cssText = `
            font-size: 16px;
            font-weight: 700;
            margin-bottom: 4px;
        `;
        
        const messageEl = banner.querySelector('.banner-message');
        messageEl.style.cssText = `
            font-size: 14px;
            opacity: 0.9;
        `;
        
        const durationEl = banner.querySelector('.banner-duration');
        if (durationEl) {
            durationEl.style.cssText = `
                font-size: 12px;
                opacity: 0.8;
                margin-top: 2px;
            `;
        }
        
        const actions = banner.querySelector('.banner-actions');
        actions.style.cssText = `
            display: flex;
            align-items: center;
            gap: 8px;
        `;
        
        const button = banner.querySelector('.banner-button');
        button.style.cssText = `
            background: rgba(255, 255, 255, 0.2);
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
        `;
        
        const closeBtn = banner.querySelector('.banner-close');
        closeBtn.style.cssText = `
            background: none;
            border: none;
            color: white;
            font-size: 20px;
            cursor: pointer;
            padding: 4px 8px;
            border-radius: 4px;
            transition: all 0.3s ease;
        `;
        
        // Add hover effects
        button.addEventListener('mouseenter', () => {
            button.style.background = 'rgba(255, 255, 255, 0.3)';
        });
        button.addEventListener('mouseleave', () => {
            button.style.background = 'rgba(255, 255, 255, 0.2)';
        });
        
        closeBtn.addEventListener('mouseenter', () => {
            closeBtn.style.background = 'rgba(255, 255, 255, 0.2)';
        });
        closeBtn.addEventListener('mouseleave', () => {
            closeBtn.style.background = 'none';
        });
        
        document.body.appendChild(banner);
        
        // Add maintenance pulse animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes maintenance-pulse {
                0%, 100% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.1); opacity: 0.8; }
            }
        `;
        document.head.appendChild(style);
        
        // Auto-remove after duration or 30 seconds
        const autoRemoveTime = duration ? (parseInt(duration) * 60 * 1000) : 30000;
        setTimeout(() => {
            if (banner.parentElement) {
                banner.remove();
            }
        }, autoRemoveTime);
    }

    /**
     * Update connection status in UI
     */
    updateConnectionStatus(isOnline) {
        // Update status indicators
        const statusDots = document.querySelectorAll('.status-dot');
        const statusTexts = document.querySelectorAll('.status-text');
        
        statusDots.forEach(dot => {
            dot.className = `status-dot ${isOnline ? 'connected' : 'error'}`;
        });
        
        statusTexts.forEach(text => {
            text.textContent = isOnline ? 'متصل' : 'غير متصل';
        });
        
        // Show connection banner
        this.showConnectionBanner(isOnline);
    }

    /**
     * Show connection status banner
     */
    showConnectionBanner(isOnline) {
        // Remove existing banner
        const existingBanner = document.querySelector('.connection-banner');
        if (existingBanner) {
            existingBanner.remove();
        }
        
        // Create new banner
        const banner = document.createElement('div');
        banner.className = `connection-banner ${isOnline ? 'online' : 'offline'}`;
        banner.innerHTML = `
            <div class="banner-content">
                <span class="banner-icon">${isOnline ? '✅' : '⚠️'}</span>
                <span class="banner-text">${isOnline ? 'تم استعادة الاتصال' : 'انقطع الاتصال'}</span>
                <button class="banner-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        // Add banner styles
        banner.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            z-index: 10000;
            background: ${isOnline ? 'linear-gradient(135deg, #10B981, #059669)' : 'linear-gradient(135deg, #EF4444, #DC2626)'};
            color: white;
            padding: 12px;
            text-align: center;
            animation: slideDown 0.3s ease;
        `;
        
        document.body.appendChild(banner);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (banner.parentElement) {
                banner.remove();
            }
        }, 5000);
    }

    /**
     * Setup install prompt
     */
    setupInstallPrompt() {
        console.log('📱 PWA Manager: Setting up install prompt...');
        
        window.addEventListener('beforeinstallprompt', (event) => {
            console.log('📲 Install prompt triggered');
            event.preventDefault();
            this.installPromptEvent = event;
            this.showInstallButton();
        });
        
        window.addEventListener('appinstalled', () => {
            console.log('✅ App installed successfully');
            this.hideInstallButton();
            this.showWelcomeNotification();
        });
    }

    /**
     * Show app install button
     */
    showInstallButton() {
        // Create install button
        const installButton = document.createElement('button');
        installButton.id = 'pwa-install-btn';
        installButton.innerHTML = '📱 تثبيت التطبيق';
        installButton.className = 'pwa-install-button';
        installButton.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: linear-gradient(135deg, #22C55E, #16A34A);
            color: white;
            border: none;
            border-radius: 50px;
            padding: 12px 20px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            box-shadow: 0 8px 32px rgba(34, 197, 94, 0.3);
            z-index: 1000;
            transition: all 0.3s ease;
            animation: bounce 2s infinite;
        `;
        
        installButton.addEventListener('click', this.promptInstall.bind(this));
        document.body.appendChild(installButton);
    }

    /**
     * Hide install button
     */
    hideInstallButton() {
        const installButton = document.getElementById('pwa-install-btn');
        if (installButton) {
            installButton.remove();
        }
    }

    /**
     * Prompt app installation
     */
    async promptInstall() {
        if (!this.installPromptEvent) {
            console.warn('⚠️ Install prompt not available');
            return;
        }
        
        try {
            const result = await this.installPromptEvent.prompt();
            console.log('📲 Install prompt result:', result.outcome);
            
            if (result.outcome === 'accepted') {
                console.log('✅ User accepted install prompt');
            } else {
                console.log('❌ User dismissed install prompt');
            }
            
            this.installPromptEvent = null;
            this.hideInstallButton();
            
        } catch (error) {
            console.error('❌ Install prompt failed:', error);
        }
    }

    /**
     * Setup offline detection
     */
    setupOfflineDetection() {
        // Add offline styles
        const offlineStyles = document.createElement('style');
        offlineStyles.textContent = `
            @keyframes slideDown {
                from { transform: translateY(-100%); }
                to { transform: translateY(0); }
            }
            
            @keyframes bounce {
                0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
                40% { transform: translateY(-10px); }
                60% { transform: translateY(-5px); }
            }
            
            .connection-banner {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            }
            
            .banner-content {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 12px;
            }
            
            .banner-close {
                background: none;
                border: none;
                color: white;
                font-size: 18px;
                cursor: pointer;
                padding: 0;
                margin-left: auto;
            }
        `;
        document.head.appendChild(offlineStyles);
    }

    /**
     * Show notification permission prompt
     */
    showNotificationPermissionPrompt() {
        // Create a user-friendly prompt
        const promptDiv = document.createElement('div');
        promptDiv.className = 'notification-prompt';
        promptDiv.innerHTML = `
            <div class="prompt-content">
                <h3>🔔 تفعيل الإشعارات</h3>
                <p>احصل على تنبيهات فورية حول حالة الاتصال وسرعة الإنترنت</p>
                <div class="prompt-buttons">
                    <button class="btn-allow">تفعيل الإشعارات</button>
                    <button class="btn-deny">لا، شكراً</button>
                </div>
            </div>
        `;
        
        promptDiv.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10001;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        `;
        
        const content = promptDiv.querySelector('.prompt-content');
        content.style.cssText = `
            background: white;
            padding: 32px;
            border-radius: 16px;
            text-align: center;
            max-width: 400px;
            margin: 20px;
        `;
        
        const allowBtn = promptDiv.querySelector('.btn-allow');
        const denyBtn = promptDiv.querySelector('.btn-deny');
        
        allowBtn.style.cssText = `
            background: linear-gradient(135deg, #22C55E, #16A34A);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            margin: 8px;
            cursor: pointer;
            font-weight: 600;
        `;
        
        denyBtn.style.cssText = `
            background: #6B7280;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            margin: 8px;
            cursor: pointer;
        `;
        
        allowBtn.addEventListener('click', () => {
            this.requestNotificationPermission();
            promptDiv.remove();
        });
        
        denyBtn.addEventListener('click', () => {
            promptDiv.remove();
        });
        
        document.body.appendChild(promptDiv);
    }

    /**
     * Show welcome notification
     */
    showWelcomeNotification() {
        if (this.notificationPermission === 'granted') {
            new Notification('مرحباً بك في هاي تك! 🎉', {
                body: 'سيتم إرسال تنبيهات حول حالة الاتصال وأداء الشبكة',
                icon: '/icons/icon-192x192.png',
                tag: 'welcome'
            });
        }
    }

    /**
     * Show update notification
     */
    showUpdateNotification() {
        if (this.notificationPermission === 'granted') {
            new Notification('🔄 تحديث متوفر', {
                body: 'يتوفر إصدار جديد من التطبيق. انقر لتحديث.',
                icon: '/icons/icon-192x192.png',
                tag: 'update-available',
                requireInteraction: true
            });
        }
    }

    /**
     * Handle service worker messages
     */
    handleServiceWorkerMessage(event) {
        console.log('📨 Message from service worker:', event.data);
        
        if (event.data.type === 'CONNECTION_STATUS_UPDATE') {
            this.updateConnectionStatus(event.data.status === 'online');
        }
    }

    /**
     * Setup notification listener for broadcasting
     */
    setupNotificationListener() {
        console.log('📡 PWA Manager: Setting up notification broadcast listener...');
        
        // Listen for localStorage changes (cross-tab communication)
        window.addEventListener('storage', (event) => {
            if (event.key === 'hitech_broadcast_notification') {
                try {
                    const notificationData = JSON.parse(event.newValue);
                    this.handleBroadcastNotification(notificationData);
                } catch (error) {
                    console.error('❌ Error parsing broadcast notification:', error);
                }
            }
        });
        
        // Listen for custom events (same-tab communication)
        window.addEventListener('hitech-notification', (event) => {
            this.handleBroadcastNotification(event.detail);
        });
        
        // Setup periodic check for server notifications
        this.setupServerNotificationCheck();
    }

    /**
     * Handle broadcast notification
     */
    handleBroadcastNotification(data) {
        console.log('📨 PWA Manager: Received broadcast notification:', data);
        
        // Use enhanced notification system if available
        if (window.enhancedNotifications) {
            window.enhancedNotifications.showNotification(data);
        } else if (this.notificationPermission === 'granted') {
            this.sendMaintenanceNotification(
                data.notificationType || 'service_announcement',
                data.message || 'إشعار جديد من هاي تك',
                data.duration
            );
        } else {
            // Fallback to old in-page notification
            this.showInPageNotification(data);
        }
    }

    /**
     * Show in-page notification for users without notification permission
     */
    showInPageNotification(data) {
        // Remove existing in-page notifications
        const existingNotifications = document.querySelectorAll('.in-page-notification');
        existingNotifications.forEach(notification => notification.remove());
        
        // Create in-page notification
        const notification = document.createElement('div');
        notification.className = 'in-page-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-header">
                    <span class="notification-icon">${this.getNotificationIcon(data.notificationType)}</span>
                    <span class="notification-title">${data.title || this.getDefaultTitle(data.notificationType)}</span>
                    <button class="notification-close" onclick="this.parentElement.parentElement.parentElement.remove()">×</button>
                </div>
                <div class="notification-body">${data.message}</div>
                ${data.duration ? `<div class="notification-duration">المدة المتوقعة: ${data.duration}</div>` : ''}
            </div>
        `;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            max-width: 400px;
            background: rgba(0, 0, 0, 0.9);
            color: white;
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            z-index: 10000;
            animation: slideInFromRight 0.3s ease-out;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
        `;
        
        // Style content
        const content = notification.querySelector('.notification-content');
        content.style.cssText = `
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        `;
        
        const header = notification.querySelector('.notification-header');
        header.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 10px;
        `;
        
        const icon = notification.querySelector('.notification-icon');
        icon.style.cssText = `
            font-size: 24px;
            margin-left: 10px;
        `;
        
        const title = notification.querySelector('.notification-title');
        title.style.cssText = `
            font-weight: 600;
            font-size: 16px;
            flex: 1;
        `;
        
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.style.cssText = `
            background: none;
            border: none;
            color: white;
            font-size: 20px;
            cursor: pointer;
            padding: 0;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        
        const body = notification.querySelector('.notification-body');
        body.style.cssText = `
            font-size: 14px;
            line-height: 1.4;
            opacity: 0.9;
        `;
        
        const duration = notification.querySelector('.notification-duration');
        if (duration) {
            duration.style.cssText = `
                font-size: 12px;
                opacity: 0.7;
                margin-top: 8px;
                font-style: italic;
            `;
        }
        
        document.body.appendChild(notification);
        
        // Auto-remove after delay
        const autoRemoveTime = data.duration ? (parseInt(data.duration) * 60 * 1000) : 10000;
        setTimeout(() => {
            if (notification.parentElement) {
                notification.style.animation = 'slideOutToRight 0.3s ease-in';
                setTimeout(() => notification.remove(), 300);
            }
        }, autoRemoveTime);
        
        // Add animations
        if (!document.querySelector('#in-page-notification-styles')) {
            const style = document.createElement('style');
            style.id = 'in-page-notification-styles';
            style.textContent = `
                @keyframes slideInFromRight {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                
                @keyframes slideOutToRight {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    /**
     * Get notification icon based on type
     */
    getNotificationIcon(type) {
        const icons = {
            'maintenance_alert': '🔧',
            'maintenance_completed': '✅',
            'service_announcement': '📢',
            'connection_restored': '✅',
            'connection_lost': '⚠️',
            'slow_connection': '🐌'
        };
        return icons[type] || '🔔';
    }

    /**
     * Get default title based on type
     */
    getDefaultTitle(type) {
        const titles = {
            'maintenance_alert': 'صيانة النظام',
            'maintenance_completed': 'انتهاء الصيانة',
            'service_announcement': 'إعلان مهم',
            'connection_restored': 'تم استعادة الاتصال',
            'connection_lost': 'انقطع الاتصال',
            'slow_connection': 'اتصال بطيء'
        };
        return titles[type] || 'إشعار';
    }

    /**
     * Setup server notification check (simulated)
     */
    setupServerNotificationCheck() {
        // Check for server notifications every 30 seconds
        setInterval(() => {
            this.checkServerNotifications();
        }, 30000);
    }

    /**
     * Check for server notifications (simulated)
     */
    async checkServerNotifications() {
        try {
            // In a real implementation, this would check your notification API
            // For now, we'll check localStorage for demo purposes
            const lastCheck = localStorage.getItem('last_notification_check') || '0';
            const serverNotifications = localStorage.getItem('server_notifications');
            
            if (serverNotifications) {
                const notifications = JSON.parse(serverNotifications);
                const newNotifications = notifications.filter(n => n.timestamp > parseInt(lastCheck));
                
                newNotifications.forEach(notification => {
                    this.handleBroadcastNotification(notification);
                });
                
                if (newNotifications.length > 0) {
                    localStorage.setItem('last_notification_check', Date.now().toString());
                }
            }
        } catch (error) {
            console.error('❌ Error checking server notifications:', error);
        }
    }

    /**
     * Cleanup when page unloads
     */
    cleanup() {
        if (this.connectionCheckInterval) {
            clearInterval(this.connectionCheckInterval);
        }
    }
}

// Initialize PWA Manager when DOM is ready
let pwaManager;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        pwaManager = new PWAManager();
    });
} else {
    pwaManager = new PWAManager();
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (pwaManager) {
        pwaManager.cleanup();
    }
});

// Export for debugging
window.pwaManager = pwaManager;