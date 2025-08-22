/**
 * Hi-Tech Internet Hotspot Portal - Enhanced Notifications System
 * Copyright (c) 2025 Mahmoud. All rights reserved.
 * 
 * Developed by: Mahmoud
 * Website: Hi-Tech Internet Services
 * Description: Advanced notification system with animations, timing, and mobile support
 * 
 * This software is proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */

class EnhancedNotificationSystem {
    constructor() {
        this.notifications = new Map(); // Store active notifications
        this.notificationCount = 0;
        this.maxNotifications = 5; // Maximum notifications to show at once
        this.defaultDuration = 5000; // 5 seconds default
        this.isInitialized = false;
        this.serverEventSource = null;
        this.serverConnected = false;
        
        this.init();
    }

    /**
     * Save active notifications to localStorage for persistence
     */
    saveActiveNotifications() {
        const activeNotifications = [];
        
        this.notifications.forEach((notificationData, notificationId) => {
            const now = Date.now();
            const elapsed = now - notificationData.startTime;
            const remaining = Math.max(0, notificationData.duration - elapsed);
            
            // Only save notifications that still have time remaining
            if (remaining > 0) {
                activeNotifications.push({
                    id: notificationId,
                    data: notificationData.data,
                    startTime: notificationData.startTime,
                    duration: notificationData.duration,
                    remainingTime: remaining
                });
            }
        });
        
        localStorage.setItem('hitech_active_notifications', JSON.stringify(activeNotifications));
        console.log('💾 Saved active notifications:', activeNotifications.length);
    }

    /**
     * Load and restore active notifications from localStorage
     */
    restoreActiveNotifications() {
        try {
            const savedNotifications = localStorage.getItem('hitech_active_notifications');
            if (!savedNotifications) return;
            
            const notifications = JSON.parse(savedNotifications);
            const now = Date.now();
            let restoredCount = 0;
            
            console.log('🔄 Restoring notifications:', notifications.length);
            
            notifications.forEach((savedNotif, index) => {
                // Check if notification should still be active
                const totalElapsed = now - savedNotif.startTime;
                const remainingTime = Math.max(0, savedNotif.duration - totalElapsed);
                
                if (remainingTime > 1000) { // At least 1 second remaining
                    // Restore the notification
                    setTimeout(() => {
                        this.showRestoredNotification(savedNotif, remainingTime);
                    }, index * 100); // Stagger restoration
                    
                    restoredCount++;
                }
            });
            
            console.log(`✅ Restored ${restoredCount} notifications`);
            
            // Clear the saved notifications after restoration
            localStorage.removeItem('hitech_active_notifications');
            
        } catch (error) {
            console.error('❌ Error restoring notifications:', error);
            localStorage.removeItem('hitech_active_notifications');
        }
    }

    /**
     * Show a restored notification with adjusted timing
     */
    showRestoredNotification(savedNotif, remainingTime) {
        const notificationId = `restored-${++this.notificationCount}-${Date.now()}`;
        
        // Calculate display duration in minutes for the restored notification
        const displayDurationMinutes = Math.ceil(remainingTime / (1000 * 60));
        
        // Create corrected data for the restored notification
        const correctedData = {
            ...savedNotif.data,
            displayDurationMinutes: displayDurationMinutes
        };
        
        // Create notification element
        const notification = this.createNotificationElement(notificationId, correctedData);
        
        // Add "restored" indicator
        const restoredBadge = document.createElement('span');
        restoredBadge.style.cssText = `
            position: absolute;
            top: 8px;
            left: 8px;
            background: rgba(34, 197, 94, 0.8);
            color: white;
            font-size: 10px;
            padding: 2px 6px;
            border-radius: 8px;
            font-weight: 600;
            text-shadow: 0 1px 2px rgba(0,0,0,0.5);
        `;
        restoredBadge.textContent = 'مُستعاد';
        notification.appendChild(restoredBadge);

        // Add to container
        const container = document.getElementById('hitech-notification-container');
        container.appendChild(notification);

        // Store notification data with adjusted timing
        this.notifications.set(notificationId, {
            element: notification,
            data: correctedData,
            startTime: Date.now(), // Reset start time to now
            duration: remainingTime, // Use remaining time as duration
            timerId: null,
            progressAnimationId: null,
            isRestored: true
        });

        // Animate in
        requestAnimationFrame(() => {
            notification.classList.add('show');
        });

        // Start progress bar animation with remaining time
        this.startProgressAnimation(notificationId, remainingTime);

        // Set auto-dismiss timer with remaining time
        this.setDismissTimer(notificationId, remainingTime);

        // Add priority effects
        this.applyPriorityEffects(notification, savedNotif.data.priority);

        console.log(`🔄 Restored notification: ${notificationId}, remaining: ${Math.ceil(remainingTime/1000)}s`);
    }

    /**
     * Check for active server notifications and show them to new visitors
     */
    checkServerNotifications() {
        try {
            const serverNotifications = localStorage.getItem('server_notifications');
            if (!serverNotifications) {
                console.log('📭 No server notifications found');
                return;
            }

            const notifications = JSON.parse(serverNotifications);
            const now = Date.now();
            let shownCount = 0;

            console.log('🔍 Checking server notifications for new visitor:', notifications.length);

            notifications.forEach((notif, index) => {
                // Check if notification is still active
                if (notif.expiresAt && notif.expiresAt > now) {
                    const remainingTime = notif.expiresAt - now;
                    
                    if (remainingTime > 1000) { // At least 1 second remaining
                        // Stagger showing notifications
                        setTimeout(() => {
                            this.showServerNotification(notif, remainingTime);
                        }, index * 200);
                        
                        shownCount++;
                    }
                }
            });

            console.log(`👁️ Showing ${shownCount} active server notifications to new visitor`);

        } catch (error) {
            console.error('❌ Error checking server notifications:', error);
        }
    }

    /**
     * Show a server notification to new visitors
     */
    showServerNotification(serverNotif, remainingTime) {
        // Don't show if we already have this notification
        const existingNotif = Array.from(this.notifications.values()).find(
            notifData => notifData.data.id === serverNotif.id
        );
        
        if (existingNotif) {
            console.log('⏭️ Notification already showing, skipping:', serverNotif.id);
            return;
        }

        const displayDurationMinutes = Math.ceil(remainingTime / (1000 * 60));
        
        // Create notification data in the expected format
        const notificationData = {
            notificationType: serverNotif.notificationType,
            title: serverNotif.title,
            message: serverNotif.message,
            duration: remainingTime,
            displayDuration: serverNotif.displayDuration,
            displayDurationMinutes: displayDurationMinutes,
            priority: serverNotif.priority || 'normal',
            timestamp: serverNotif.timestamp,
            id: serverNotif.id,
            sender: serverNotif.sender
        };

        const notificationId = `server-${++this.notificationCount}-${Date.now()}`;
        
        // Create notification element
        const notification = this.createNotificationElement(notificationId, notificationData);
        
        // Add "server" indicator to show it's from admin
        const serverBadge = document.createElement('span');
        serverBadge.style.cssText = `
            position: absolute;
            top: 8px;
            left: 8px;
            background: rgba(59, 130, 246, 0.8);
            color: white;
            font-size: 10px;
            padding: 2px 6px;
            border-radius: 8px;
            font-weight: 600;
            text-shadow: 0 1px 2px rgba(0,0,0,0.5);
        `;
        serverBadge.textContent = 'من الإدارة';
        notification.appendChild(serverBadge);

        // Add to container
        const container = document.getElementById('hitech-notification-container');
        container.appendChild(notification);

        // Store notification data
        this.notifications.set(notificationId, {
            element: notification,
            data: notificationData,
            startTime: Date.now(),
            duration: remainingTime,
            timerId: null,
            progressAnimationId: null,
            isFromServer: true
        });

        // Animate in
        requestAnimationFrame(() => {
            notification.classList.add('show');
        });

        // Start progress bar animation
        this.startProgressAnimation(notificationId, remainingTime);

        // Set auto-dismiss timer
        this.setDismissTimer(notificationId, remainingTime);

        // Add priority effects
        this.applyPriorityEffects(notification, notificationData.priority);

        console.log(`📢 Showed server notification to new visitor: ${notificationId}, remaining: ${Math.ceil(remainingTime/1000)}s`);
    }

    /**
     * Initialize the notification system
     */
    init() {
        if (this.isInitialized) return;
        
        console.log('🎨 Enhanced Notifications: Initializing...');
        
        // Create notification container
        this.createNotificationContainer();
        
        // Add notification styles
        this.addNotificationStyles();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Request notification permissions for mobile devices
        this.requestNotificationPermissions();
        
        // Setup mobile optimizations
        this.setupMobileOptimizations();
        
        // Restore any previously active notifications
        this.restoreActiveNotifications();
        
        // Check for active server notifications (for new visitors)
        this.checkServerNotifications();
        
        // Connect to notification server via SSE
        this.connectToNotificationServer();
        
        this.isInitialized = true;
        
        // Debug time information for hotspot troubleshooting
        this.getCurrentTimeDebug();
        
        console.log('✅ Enhanced Notifications: Ready');
    }

    /**
     * Create notification container
     */
    createNotificationContainer() {
        // Remove existing container
        const existingContainer = document.getElementById('hitech-notification-container');
        if (existingContainer) {
            existingContainer.remove();
        }

        const container = document.createElement('div');
        container.id = 'hitech-notification-container';
        container.className = 'hitech-notification-container';
        
        document.body.appendChild(container);
    }

    /**
     * Add comprehensive notification styles
     */
    addNotificationStyles() {
        const existingStyles = document.getElementById('hitech-notification-styles');
        if (existingStyles) {
            existingStyles.remove();
        }

        const style = document.createElement('style');
        style.id = 'hitech-notification-styles';
        style.textContent = `
            /* Notification Container */
            .hitech-notification-container {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 999999;
                pointer-events: none;
                max-width: 420px;
                width: 100%;
            }

            /* Individual Notification */
            .hitech-notification {
                pointer-events: auto;
                background: linear-gradient(135deg, rgba(0, 0, 0, 0.98), rgba(30, 41, 59, 0.95));
                backdrop-filter: blur(20px);
                border-radius: 16px;
                padding: 20px;
                margin-bottom: 12px;
                box-shadow: 
                    0 10px 40px rgba(0, 0, 0, 0.4),
                    0 0 0 1px rgba(255, 255, 255, 0.15),
                    inset 0 1px 0 rgba(255, 255, 255, 0.25);
                color: white;
                font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
                transform: translateX(100%);
                opacity: 0;
                transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                position: relative;
                overflow: hidden;
            }

            .hitech-notification.show {
                transform: translateX(0);
                opacity: 1;
            }

            .hitech-notification.hide {
                transform: translateX(100%);
                opacity: 0;
                margin-bottom: 0;
                padding-top: 0;
                padding-bottom: 0;
                max-height: 0;
            }

            /* Notification Types */
            .hitech-notification.maintenance_alert {
                border-left: 4px solid #F59E0B;
                background: linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(30, 41, 59, 0.98));
            }

            .hitech-notification.maintenance_alert .hitech-notification-title,
            .hitech-notification.maintenance_alert .hitech-notification-body,
            .hitech-notification.maintenance_alert .hitech-notification-footer {
                color: #FFFFFF !important;
                text-shadow: 0 2px 4px rgba(0, 0, 0, 0.9) !important;
            }

            .hitech-notification.maintenance_completed {
                border-left: 4px solid #22C55E;
                background: linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(30, 41, 59, 0.98));
            }

            .hitech-notification.maintenance_completed .hitech-notification-title,
            .hitech-notification.maintenance_completed .hitech-notification-body,
            .hitech-notification.maintenance_completed .hitech-notification-footer {
                color: #FFFFFF !important;
                text-shadow: 0 2px 4px rgba(0, 0, 0, 0.9) !important;
            }

            .hitech-notification.service_announcement {
                border-left: 4px solid #3B82F6;
                background: linear-gradient(135deg, rgba(59, 130, 246, 0.25), rgba(30, 41, 59, 0.98));
            }

            .hitech-notification.service_announcement .hitech-notification-title,
            .hitech-notification.service_announcement .hitech-notification-body,
            .hitech-notification.service_announcement .hitech-notification-footer {
                color: #FFFFFF !important;
                text-shadow: 0 2px 4px rgba(0, 0, 0, 0.9) !important;
            }

            .hitech-notification.service_announcement .hitech-notification-duration {
                background: rgba(59, 130, 246, 0.8) !important;
                color: #FFFFFF !important;
                border: 1px solid rgba(59, 130, 246, 1) !important;
                text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8) !important;
            }

            .hitech-notification.connection_lost {
                border-left: 4px solid #EF4444;
                background: linear-gradient(135deg, rgba(239, 68, 68, 0.25), rgba(30, 41, 59, 0.98));
            }

            .hitech-notification.connection_lost .hitech-notification-title,
            .hitech-notification.connection_lost .hitech-notification-body,
            .hitech-notification.connection_lost .hitech-notification-footer {
                color: #FFFFFF !important;
                text-shadow: 0 2px 4px rgba(0, 0, 0, 0.9) !important;
            }

            .hitech-notification.connection_restored {
                border-left: 4px solid #10B981;
                background: linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(30, 41, 59, 0.98));
            }

            .hitech-notification.connection_restored .hitech-notification-title,
            .hitech-notification.connection_restored .hitech-notification-body,
            .hitech-notification.connection_restored .hitech-notification-footer {
                color: #FFFFFF !important;
                text-shadow: 0 2px 4px rgba(0, 0, 0, 0.9) !important;
            }

            /* Notification Header */
            .hitech-notification-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 12px;
            }

            .hitech-notification-title-container {
                display: flex;
                align-items: center;
                flex: 1;
            }

            .hitech-notification-icon {
                font-size: 28px;
                margin-left: 12px;
                animation: notificationPulse 2s ease-in-out infinite;
            }

            .hitech-notification-title {
                font-size: 16px;
                font-weight: 700;
                color: #FFFFFF;
                text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
            }

            .hitech-notification-close {
                background: rgba(255, 255, 255, 0.1);
                border: none;
                border-radius: 8px;
                color: rgba(255, 255, 255, 0.7);
                cursor: pointer;
                font-size: 18px;
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s ease;
                backdrop-filter: blur(10px);
            }

            .hitech-notification-close:hover {
                background: rgba(255, 255, 255, 0.2);
                color: rgba(255, 255, 255, 1);
                transform: scale(1.1);
            }

            /* Notification Body */
            .hitech-notification-body {
                font-size: 14px;
                line-height: 1.5;
                color: #FFFFFF;
                text-shadow: 0 1px 3px rgba(0, 0, 0, 0.7);
                margin-bottom: 12px;
                font-weight: 500;
            }

            /* Notification Footer */
            .hitech-notification-footer {
                display: flex;
                align-items: center;
                justify-content: space-between;
                font-size: 12px;
                color: rgba(255, 255, 255, 0.9);
                text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6);
            }

            .hitech-notification-duration {
                background: rgba(255, 255, 255, 0.15);
                padding: 4px 8px;
                border-radius: 12px;
                font-weight: 600;
                color: #FFFFFF;
                text-shadow: 0 1px 2px rgba(0, 0, 0, 0.7);
            }

            .hitech-notification-time {
                font-style: italic;
                font-weight: 500;
                color: rgba(255, 255, 255, 0.8);
            }

            /* Progress Bar */
            .hitech-notification-progress {
                position: absolute;
                bottom: 0;
                left: 0;
                height: 3px;
                background: linear-gradient(90deg, #22C55E, #16A34A);
                border-radius: 0 0 16px 16px;
                transform-origin: left;
                animation: progressBar linear;
            }

            /* Animations */
            @keyframes notificationPulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.1); }
            }

            @keyframes progressBar {
                0% { transform: scaleX(1); }
                100% { transform: scaleX(0); }
            }

            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-5px); }
                75% { transform: translateX(5px); }
            }

            @keyframes bounce {
                0%, 20%, 53%, 80%, 100% { transform: translate3d(0, 0, 0); }
                40%, 43% { transform: translate3d(0, -10px, 0); }
                70% { transform: translate3d(0, -5px, 0); }
                90% { transform: translate3d(0, -2px, 0); }
            }

            /* Hover Effects */
            .hitech-notification:hover {
                transform: translateX(-5px) scale(1.02);
                box-shadow: 
                    0 20px 60px rgba(0, 0, 0, 0.4),
                    0 0 0 1px rgba(255, 255, 255, 0.2),
                    inset 0 1px 0 rgba(255, 255, 255, 0.3);
            }

            /* Mobile Optimizations */
            @media (max-width: 768px) {
                .hitech-notification-container {
                    top: 10px;
                    right: 10px;
                    left: 10px;
                    max-width: none;
                }

                .hitech-notification {
                    padding: 16px;
                    border-radius: 12px;
                }

                .hitech-notification-icon {
                    font-size: 24px;
                    margin-left: 8px;
                }

                .hitech-notification-title {
                    font-size: 15px;
                }

                .hitech-notification-body {
                    font-size: 13px;
                }
            }

            /* Tablet Optimizations */
            @media (max-width: 1024px) and (min-width: 769px) {
                .hitech-notification-container {
                    top: 15px;
                    right: 15px;
                    max-width: 380px;
                }
            }

            /* Special Effects for Priority Notifications */
            .hitech-notification.priority-urgent {
                animation: shake 0.5s ease-in-out 3;
                box-shadow: 
                    0 10px 40px rgba(239, 68, 68, 0.4),
                    0 0 0 2px rgba(239, 68, 68, 0.5),
                    inset 0 1px 0 rgba(255, 255, 255, 0.2);
            }

            .hitech-notification.priority-high {
                animation: bounce 1s ease-in-out 2;
            }

            /* Dark/Light Theme Support */
            @media (prefers-color-scheme: light) {
                .hitech-notification {
                    background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(248, 250, 252, 0.95));
                    color: #1F2937;
                    box-shadow: 
                        0 10px 40px rgba(0, 0, 0, 0.1),
                        0 0 0 1px rgba(0, 0, 0, 0.1),
                        inset 0 1px 0 rgba(255, 255, 255, 0.5);
                }

                .hitech-notification-title {
                    color: #111827;
                    text-shadow: none;
                }

                .hitech-notification-body {
                    color: rgba(31, 41, 55, 0.8);
                }

                .hitech-notification-footer {
                    color: rgba(107, 114, 128, 0.8);
                }

                .hitech-notification-close {
                    background: rgba(0, 0, 0, 0.05);
                    color: rgba(31, 41, 55, 0.7);
                }

                .hitech-notification-close:hover {
                    background: rgba(0, 0, 0, 0.1);
                    color: rgba(31, 41, 55, 1);
                }
            }

            /* Reduced Motion Support */
            @media (prefers-reduced-motion: reduce) {
                .hitech-notification,
                .hitech-notification-icon,
                .hitech-notification-progress {
                    animation: none;
                }

                .hitech-notification {
                    transition: opacity 0.2s ease;
                }
            }
        `;

        document.head.appendChild(style);
    }

    /**
     * Request notification permissions for mobile and external devices
     */
    async requestNotificationPermissions() {
        console.log('🔐 Enhanced Notifications: Requesting permissions...');
        
        if (!('Notification' in window)) {
            console.warn('❌ Notifications not supported in this browser');
            return false;
        }
        
        if (Notification.permission === 'granted') {
            console.log('✅ Notification permission already granted');
            return true;
        }
        
        if (Notification.permission === 'default') {
            try {
                // For mobile devices, show a user-friendly prompt first
                if (this.isMobileDevice()) {
                    this.showPermissionPrompt();
                }
                
                const permission = await Notification.requestPermission();
                console.log('🔔 Notification permission result:', permission);
                
                if (permission === 'granted') {
                    console.log('✅ Notification permission granted');
                    this.showWelcomeNotification();
                    return true;
                } else {
                    console.warn('❌ Notification permission denied');
                    return false;
                }
            } catch (error) {
                console.error('❌ Error requesting notification permission:', error);
                return false;
            }
        }
        
        console.warn('❌ Notification permission blocked');
        return false;
    }

    /**
     * Check if device is mobile
     */
    isMobileDevice() {
        return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               ('ontouchstart' in window) ||
               (navigator.maxTouchPoints > 0);
    }

    /**
     * Show permission prompt for mobile users
     */
    showPermissionPrompt() {
        const promptDiv = document.createElement('div');
        promptDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, rgba(59, 130, 246, 0.95), rgba(30, 41, 59, 0.95));
            color: white;
            padding: 20px;
            border-radius: 12px;
            text-align: center;
            z-index: 999999;
            max-width: 300px;
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        `;
        
        promptDiv.innerHTML = `
            <div style="font-size: 32px; margin-bottom: 10px;">📱</div>
            <div style="font-weight: bold; margin-bottom: 10px;">تفعيل الإشعارات</div>
            <div style="font-size: 14px; line-height: 1.5; margin-bottom: 15px;">
                لتلقي الإشعارات المهمة من الإدارة، يرجى السماح بالإشعارات عند ظهور النافذة
            </div>
            <button onclick="this.parentNode.remove()" style="
                background: rgba(255, 255, 255, 0.2);
                border: none;
                color: white;
                padding: 8px 16px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 12px;
            ">فهمت</button>
        `;
        
        document.body.appendChild(promptDiv);
        
        setTimeout(() => {
            if (promptDiv.parentNode) {
                promptDiv.remove();
            }
        }, 5000);
    }

    /**
     * Show welcome notification after permission granted
     */
    showWelcomeNotification() {
        setTimeout(() => {
            this.showNotification({
                notificationType: 'service_announcement',
                title: 'مرحباً بك',
                message: 'تم تفعيل الإشعارات بنجاح! ستصلك الآن جميع الإعلانات المهمة.',
                duration: 5000,
                priority: 'normal',
                timestamp: Date.now()
            });
        }, 1000);
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Listen for broadcast notifications
        window.addEventListener('storage', (event) => {
            if (event.key === 'hitech_broadcast_notification') {
                try {
                    const notificationData = JSON.parse(event.newValue);
                    this.showNotification(notificationData);
                } catch (error) {
                    console.error('❌ Error parsing broadcast notification:', error);
                }
            }
        });

        // Listen for custom events
        window.addEventListener('hitech-notification', (event) => {
            this.showNotification(event.detail);
        });

        // Handle page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                // Page is hidden, pause timers and save notifications
                this.pauseAllTimers();
                this.saveActiveNotifications();
            } else {
                // Page is visible, resume timers
                this.resumeAllTimers();
            }
        });

        // Save notifications before page unload
        window.addEventListener('beforeunload', () => {
            this.saveActiveNotifications();
        });

        // Also save periodically (every 30 seconds) in case of unexpected page close
        setInterval(() => {
            if (this.notifications.size > 0) {
                this.saveActiveNotifications();
            }
        }, 30000);

        // Check for new server notifications periodically (every 15 seconds)
        setInterval(() => {
            this.checkServerNotifications();
        }, 15000);

        // Auto-reconnect to server if connection is lost
        setInterval(() => {
            if (!this.serverConnected && !this.serverEventSource) {
                console.log('🔄 Attempting to reconnect to notification server...');
                this.connectToNotificationServer();
            }
        }, 30000); // Every 30 seconds
    }

    /**
     * Setup mobile optimizations
     */
    setupMobileOptimizations() {
        // Detect mobile device
        const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const isTouch = 'ontouchstart' in window;

        if (isMobile || isTouch) {
            // Add mobile-specific optimizations
            document.body.classList.add('hitech-mobile-notifications');
            
            // Reduce max notifications on mobile
            this.maxNotifications = 3;
            
            // Add touch event handlers
            this.setupTouchHandlers();
        }
    }

    /**
     * Setup touch handlers for mobile
     */
    setupTouchHandlers() {
        let startX = 0;
        let currentX = 0;
        let isDragging = false;

        document.addEventListener('touchstart', (e) => {
            if (e.target.closest('.hitech-notification')) {
                startX = e.touches[0].clientX;
                isDragging = true;
            }
        });

        document.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            
            currentX = e.touches[0].clientX;
            const diffX = currentX - startX;
            const notification = e.target.closest('.hitech-notification');
            
            if (notification && diffX > 0) {
                notification.style.transform = `translateX(${diffX}px)`;
                notification.style.opacity = Math.max(0.3, 1 - (diffX / 200));
            }
        });

        document.addEventListener('touchend', (e) => {
            if (!isDragging) return;
            
            const diffX = currentX - startX;
            const notification = e.target.closest('.hitech-notification');
            
            if (notification) {
                if (diffX > 100) {
                    // Swipe to dismiss
                    const notificationId = notification.dataset.notificationId;
                    this.dismissNotification(notificationId);
                } else {
                    // Snap back
                    notification.style.transform = '';
                    notification.style.opacity = '';
                }
            }
            
            isDragging = false;
        });
    }

    /**
     * Show enhanced notification with deduplication
     */
    showNotification(data) {
        // Check for duplicate notifications
        const notificationId = data.id || `${data.notificationType}_${data.timestamp}`;
        if (this.isNotificationAlreadyShown(notificationId)) {
            console.log('⏭️ Skipping duplicate notification:', notificationId);
            return;
        }

        console.log('🔔 Showing notification:', notificationId, data);

        // Always show in-page notification first
        this.showInPageNotification(data);

        // Only show browser notification if user is on mobile or if in-page failed
        const isMobile = this.isMobileDevice();
        const hasPermission = Notification.permission === 'granted';
        
        if (hasPermission && (isMobile || document.hidden)) {
            // Show browser notification for mobile devices or when page is hidden
            setTimeout(() => {
                this.showBrowserNotification(data);
            }, 100); // Small delay to prevent conflict with in-page notification
        }

        // Mark notification as shown
        this.markNotificationAsShown(notificationId);
    }

    /**
     * Check if notification was already shown recently
     */
    isNotificationAlreadyShown(notificationId) {
        const recentNotifications = this.getRecentNotificationIds();
        return recentNotifications.includes(notificationId);
    }

    /**
     * Mark notification as shown to prevent duplicates
     */
    markNotificationAsShown(notificationId) {
        let recentNotifications = this.getRecentNotificationIds();
        recentNotifications.push(notificationId);
        
        // Keep only last 20 notifications
        if (recentNotifications.length > 20) {
            recentNotifications = recentNotifications.slice(-20);
        }
        
        localStorage.setItem('hitech_recent_notifications', JSON.stringify(recentNotifications));
        
        // Clean up old entries after 5 minutes
        setTimeout(() => {
            this.cleanupOldNotificationIds(notificationId);
        }, 5 * 60 * 1000);
    }

    /**
     * Get recently shown notification IDs
     */
    getRecentNotificationIds() {
        try {
            return JSON.parse(localStorage.getItem('hitech_recent_notifications') || '[]');
        } catch (error) {
            return [];
        }
    }

    /**
     * Clean up old notification IDs
     */
    cleanupOldNotificationIds(oldId) {
        let recentNotifications = this.getRecentNotificationIds();
        recentNotifications = recentNotifications.filter(id => id !== oldId);
        localStorage.setItem('hitech_recent_notifications', JSON.stringify(recentNotifications));
    }

    /**
     * Show browser notification (for mobile phones and external devices)
     */
    showBrowserNotification(data) {
        try {
            console.log('📱 Attempting to show browser notification for external devices');
            
            // Check permission first
            if (Notification.permission !== 'granted') {
                console.warn('❌ Notification permission not granted');
                return;
            }
            
            const icon = this.getNotificationIcon(data.notificationType);
            const title = `${icon} ${data.title || this.getDefaultTitle(data.notificationType)}`;
            
            const options = {
                body: data.message,
                icon: '/icons/icon-192x192.png',
                badge: '/icons/icon-72x72.png',
                tag: data.notificationType + '_' + Date.now(), // Unique tag for each notification
                requireInteraction: data.priority === 'urgent' || data.notificationType === 'maintenance_alert',
                silent: false,
                renotify: true, // Show even if another notification has same tag
                actions: [
                    {
                        action: 'view',
                        title: 'عرض'
                    },
                    {
                        action: 'dismiss',
                        title: 'إغلاق'
                    }
                ],
                vibrate: this.getVibrationPattern(data.priority),
                dir: 'rtl', // Right-to-left for Arabic
                lang: 'ar',
                data: {
                    notificationType: data.notificationType,
                    timestamp: data.timestamp,
                    duration: data.duration,
                    url: window.location.origin + '/login.html'
                }
            };

            const notification = new Notification(title, options);

            console.log('✅ Browser notification created successfully');

            // Auto-close browser notification based on duration
            let durationMs;
            if (data.duration && data.duration > 1000) {
                durationMs = parseInt(data.duration);
            } else if (data.displayDuration) {
                durationMs = parseInt(data.displayDuration) * 60 * 1000;
            } else {
                durationMs = 5 * 60 * 1000;
            }
            
            const autoCloseTimer = setTimeout(() => {
                notification.close();
                console.log('⏰ Browser notification auto-closed');
            }, durationMs);

            notification.onclick = () => {
                console.log('🔔 Browser notification clicked');
                window.focus();
                clearTimeout(autoCloseTimer);
                notification.close();
            };

            notification.onclose = () => {
                console.log('🔔 Browser notification closed');
                clearTimeout(autoCloseTimer);
            };

            notification.onerror = (error) => {
                console.error('❌ Browser notification error:', error);
                clearTimeout(autoCloseTimer);
            };

        } catch (error) {
            console.error('❌ Error showing browser notification:', error);
        }
    }

    /**
     * Show enhanced in-page notification
     */
    showInPageNotification(data) {
        // Remove old notifications if we have too many
        this.cleanupOldNotifications();

        const notificationId = `notification-${++this.notificationCount}-${Date.now()}`;
        
        // Handle duration properly - admin sends in milliseconds, convert to display minutes
        let durationMs;
        let displayDurationMinutes;
        
        if (data.duration && data.duration > 1000) {
            // Duration is in milliseconds (from admin)
            durationMs = parseInt(data.duration);
            displayDurationMinutes = Math.ceil(durationMs / (1000 * 60));
        } else if (data.displayDuration) {
            // Use displayDuration if provided (already in minutes)
            displayDurationMinutes = parseInt(data.displayDuration);
            durationMs = displayDurationMinutes * 60 * 1000;
        } else {
            // Default fallback
            displayDurationMinutes = 5;
            durationMs = 5 * 60 * 1000;
        }
        
        console.log('🔔 Notification duration:', {
            originalDuration: data.duration,
            displayDuration: data.displayDuration,
            calculatedMs: durationMs,
            displayMinutes: displayDurationMinutes
        });

        // Create notification element with corrected data
        const correctedData = {
            ...data,
            displayDurationMinutes: displayDurationMinutes
        };
        const notification = this.createNotificationElement(notificationId, correctedData);

        // Add to container
        const container = document.getElementById('hitech-notification-container');
        container.appendChild(notification);

        // Store notification data
        this.notifications.set(notificationId, {
            element: notification,
            data: correctedData,
            startTime: Date.now(),
            duration: durationMs,
            timerId: null,
            progressAnimationId: null
        });

        // Animate in
        requestAnimationFrame(() => {
            notification.classList.add('show');
        });

        // Start progress bar animation
        this.startProgressAnimation(notificationId, durationMs);

        // Set auto-dismiss timer
        this.setDismissTimer(notificationId, durationMs);

        // Add priority effects
        this.applyPriorityEffects(notification, data.priority);

        // Save active notifications after adding new one
        this.saveActiveNotifications();

        console.log(`📱 Notification shown: ${notificationId}`);
    }

    /**
     * Create notification element
     */
    createNotificationElement(notificationId, data) {
        const notification = document.createElement('div');
        notification.className = `hitech-notification ${data.notificationType}`;
        notification.dataset.notificationId = notificationId;

        const icon = this.getNotificationIcon(data.notificationType);
        const title = data.title || this.getDefaultTitle(data.notificationType);
        
        // Ensure we have a valid timestamp
        const timestamp = data.timestamp || Date.now();
        const time = this.formatTime(timestamp);
        
        console.log('📅 Creating notification time display:', {
            originalTimestamp: data.timestamp,
            usedTimestamp: timestamp,
            formattedTime: time
        });

        notification.innerHTML = `
            <div class="hitech-notification-header">
                <div class="hitech-notification-title-container">
                    <span class="hitech-notification-icon">${icon}</span>
                    <span class="hitech-notification-title">${title}</span>
                </div>
                <button class="hitech-notification-close" onclick="enhancedNotifications.dismissNotification('${notificationId}')" title="إغلاق">
                    ×
                </button>
            </div>
            <div class="hitech-notification-body">
                ${data.message}
            </div>
            <div class="hitech-notification-footer">
                <span class="hitech-notification-time">${time}</span>
                ${data.displayDurationMinutes ? `<span class="hitech-notification-duration">${data.displayDurationMinutes} دقيقة</span>` : ''}
            </div>
            <div class="hitech-notification-progress"></div>
        `;

        return notification;
    }

    /**
     * Start progress bar animation
     */
    startProgressAnimation(notificationId, duration) {
        const notificationData = this.notifications.get(notificationId);
        if (!notificationData) return;

        const progressBar = notificationData.element.querySelector('.hitech-notification-progress');
        if (progressBar) {
            progressBar.style.animationDuration = `${duration}ms`;
        }
    }

    /**
     * Set auto-dismiss timer
     */
    setDismissTimer(notificationId, duration) {
        const notificationData = this.notifications.get(notificationId);
        if (!notificationData) return;

        const timerId = setTimeout(() => {
            this.dismissNotification(notificationId);
        }, duration);

        notificationData.timerId = timerId;
    }

    /**
     * Apply priority effects
     */
    applyPriorityEffects(notification, priority) {
        if (priority === 'urgent') {
            notification.classList.add('priority-urgent');
            // Keep urgent notifications longer
            setTimeout(() => {
                notification.classList.remove('priority-urgent');
            }, 1500);
        } else if (priority === 'high') {
            notification.classList.add('priority-high');
            setTimeout(() => {
                notification.classList.remove('priority-high');
            }, 2000);
        }
    }

    /**
     * Dismiss notification
     */
    dismissNotification(notificationId) {
        const notificationData = this.notifications.get(notificationId);
        if (!notificationData) return;

        console.log(`🗑️ Dismissing notification: ${notificationId}`);

        // Clear timer
        if (notificationData.timerId) {
            clearTimeout(notificationData.timerId);
        }

        // Animate out
        notificationData.element.classList.add('hide');

        // Remove from DOM after animation
        setTimeout(() => {
            if (notificationData.element.parentNode) {
                notificationData.element.parentNode.removeChild(notificationData.element);
            }
            this.notifications.delete(notificationId);
            
            // Update saved notifications after removal
            this.saveActiveNotifications();
        }, 400);
    }

    /**
     * Clean up old notifications
     */
    cleanupOldNotifications() {
        if (this.notifications.size >= this.maxNotifications) {
            // Get oldest notification
            const oldestId = Array.from(this.notifications.keys())[0];
            this.dismissNotification(oldestId);
        }
    }

    /**
     * Pause all timers (when page is hidden)
     */
    pauseAllTimers() {
        this.notifications.forEach((notificationData, notificationId) => {
            if (notificationData.timerId) {
                clearTimeout(notificationData.timerId);
                
                // Calculate remaining time
                const elapsed = Date.now() - notificationData.startTime;
                const remaining = Math.max(0, notificationData.duration - elapsed);
                notificationData.remainingTime = remaining;
            }
        });
    }

    /**
     * Resume all timers (when page becomes visible)
     */
    resumeAllTimers() {
        this.notifications.forEach((notificationData, notificationId) => {
            if (notificationData.remainingTime > 0) {
                notificationData.timerId = setTimeout(() => {
                    this.dismissNotification(notificationId);
                }, notificationData.remainingTime);
                
                notificationData.startTime = Date.now();
                delete notificationData.remainingTime;
            }
        });
    }

    /**
     * Get notification icon
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
     * Get default title
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
     * Get vibration pattern based on priority
     */
    getVibrationPattern(priority) {
        const patterns = {
            'urgent': [200, 100, 200, 100, 200, 100, 200],
            'high': [100, 50, 100, 50, 100],
            'normal': [100, 50, 100]
        };
        return patterns[priority] || patterns.normal;
    }

    /**
     * Format time in a robust way that works in hotspot environments
     */
    formatTime(timestamp) {
        try {
            const date = new Date(timestamp);
            
            // Check if date is valid
            if (isNaN(date.getTime())) {
                console.warn('Invalid timestamp:', timestamp);
                return 'الآن';
            }
            
            // Try modern locale formatting first
            try {
                const time = date.toLocaleTimeString('ar-EG', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                });
                
                // Check if the result looks valid (not just numbers/colons)
                if (time && time.length > 3 && !time.includes('Invalid')) {
                    return time;
                }
            } catch (localeError) {
                console.warn('Locale formatting failed:', localeError);
            }
            
            // Fallback to manual Arabic formatting
            return this.formatTimeManual(date);
            
        } catch (error) {
            console.error('Time formatting error:', error);
            // Ultra-simple fallback for hotspot environments with limited JS
            try {
                const simpleTime = this.getSimpleTime();
                return simpleTime;
            } catch (simpleError) {
                return 'الآن';
            }
        }
    }

    /**
     * Ultra-simple time for environments with limited JavaScript support
     */
    getSimpleTime() {
        try {
            const now = new Date();
            const hours = now.getHours();
            const minutes = now.getMinutes();
            
            // Very basic 24-hour format
            const h = hours.toString().padStart(2, '0');
            const m = minutes.toString().padStart(2, '0');
            
            return `${h}:${m}`;
        } catch (error) {
            return 'الآن';
        }
    }

    /**
     * Manual time formatting as fallback for hotspot environments
     */
    formatTimeManual(date) {
        try {
            let hours = date.getHours();
            const minutes = date.getMinutes();
            const seconds = date.getSeconds();
            
            // Convert to 12-hour format
            const period = hours >= 12 ? 'مساءً' : 'صباحاً';
            if (hours === 0) {
                hours = 12;
            } else if (hours > 12) {
                hours = hours - 12;
            }
            
            // Pad with zeros
            const paddedMinutes = minutes.toString().padStart(2, '0');
            const paddedSeconds = seconds.toString().padStart(2, '0');
            
            // Format in Arabic style with seconds for debugging
            const timeStr = `${hours}:${paddedMinutes}:${paddedSeconds} ${period}`;
            
            console.log('⏰ Formatted time:', {
                original: date.toISOString(),
                formatted: timeStr,
                timestamp: date.getTime()
            });
            
            return timeStr;
            
        } catch (error) {
            console.error('Manual time formatting error:', error);
            return 'الآن';
        }
    }

    /**
     * Get current time for debugging hotspot issues
     */
    getCurrentTimeDebug() {
        const now = new Date();
        const utc = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),
                            now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());
        
        console.log('🕐 Time Debug Info:', {
            local: now.toString(),
            utc: utc.toString(),
            timestamp: now.getTime(),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Unknown'
        });
        
        return now;
    }

    /**
     * Clear all notifications
     */
    clearAll() {
        Array.from(this.notifications.keys()).forEach(notificationId => {
            this.dismissNotification(notificationId);
        });
    }

    /**
     * Get active notifications count
     */
    getActiveCount() {
        return this.notifications.size;
    }

    /**
     * Connect to notification server via Server-Sent Events
     */
    connectToNotificationServer() {
        try {
            // Try different server URLs
            const possibleUrls = [
                'http://localhost:3000/notifications/stream',
                'http://127.0.0.1:3000/notifications/stream',
                'http://2.2.2.2:3000/notifications/stream', // Local server IP
                '/notifications/stream' // Relative path if server is on same host
            ];
            
            this.attemptServerConnection(possibleUrls, 0);
            
        } catch (error) {
            console.error('❌ Error connecting to notification server:', error);
        }
    }
    
    /**
     * Attempt to connect to server with fallback URLs
     */
    attemptServerConnection(urls, index) {
        if (index >= urls.length) {
            console.warn('⚠️ All server connection attempts failed');
            return;
        }
        
        const url = urls[index];
        console.log(`🔌 Attempting to connect to notification server: ${url}`);
        
        try {
            if (this.serverEventSource) {
                this.serverEventSource.close();
            }
            
            const eventSource = new EventSource(url);
            
            eventSource.onopen = () => {
                console.log('✅ Connected to notification server successfully');
                this.serverEventSource = eventSource;
                this.serverConnected = true;
            };
            
            eventSource.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.handleServerMessage(data);
                } catch (parseError) {
                    console.error('❌ Error parsing server message:', parseError);
                }
            };
            
            eventSource.onerror = (error) => {
                console.error(`❌ Server connection error for ${url}:`, error);
                this.serverConnected = false;
                eventSource.close();
                this.serverEventSource = null;
                
                // Try next URL
                setTimeout(() => {
                    this.attemptServerConnection(urls, index + 1);
                }, 1000);
            };
            
            // Timeout for connection attempt
            setTimeout(() => {
                if (!this.serverConnected) {
                    console.warn(`⏱️ Connection timeout for ${url}`);
                    eventSource.close();
                    this.attemptServerConnection(urls, index + 1);
                }
            }, 5000);
            
        } catch (error) {
            console.error(`❌ Error creating EventSource for ${url}:`, error);
            setTimeout(() => {
                this.attemptServerConnection(urls, index + 1);
            }, 1000);
        }
    }
    
    /**
     * Handle messages from the notification server
     */
    handleServerMessage(data) {
        console.log('📡 Received server message:', data);
        
        switch (data.type) {
            case 'connected':
                console.log('👋 Server connection established:', data.message);
                break;
                
            case 'heartbeat':
                // Server heartbeat - connection is alive
                break;
                
            case 'notification':
                // New notification from server
                console.log('🔔 Received notification from server:', data.data);
                this.showServerNotificationFromSSE(data.data);
                break;
                
            default:
                console.log('💬 Unknown server message type:', data.type);
        }
    }
    
    /**
     * Show notification received via SSE from server
     */
    showServerNotificationFromSSE(notificationData) {
        // Check if we already have this notification to prevent duplicates
        const notificationId = notificationData.id || `${notificationData.notificationType}_${notificationData.timestamp}`;
        
        if (this.isNotificationAlreadyShown(notificationId)) {
            console.log('⏭️ SSE notification already shown, skipping:', notificationId);
            return;
        }
        
        // Calculate remaining time
        const now = Date.now();
        const expiresAt = notificationData.timestamp + notificationData.duration;
        const remainingTime = Math.max(0, expiresAt - now);
        
        if (remainingTime < 1000) {
            console.log('⏱️ SSE notification expired, skipping:', notificationId);
            return;
        }
        
        // Show the notification
        const displayData = {
            ...notificationData,
            duration: remainingTime,
            displayDurationMinutes: Math.ceil(remainingTime / (1000 * 60))
        };
        
        console.log('🔔 Showing SSE notification:', displayData);
        this.showNotification(displayData);
    }
    
    /**
     * Disconnect from notification server
     */
    disconnectFromNotificationServer() {
        if (this.serverEventSource) {
            console.log('🔌 Disconnecting from notification server');
            this.serverEventSource.close();
            this.serverEventSource = null;
            this.serverConnected = false;
        }
    }
}

// Initialize enhanced notifications system
let enhancedNotifications;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        enhancedNotifications = new EnhancedNotificationSystem();
        window.enhancedNotifications = enhancedNotifications;
    });
} else {
    enhancedNotifications = new EnhancedNotificationSystem();
    window.enhancedNotifications = enhancedNotifications;
}

// Export for debugging
window.EnhancedNotificationSystem = EnhancedNotificationSystem;

// Clean up on page unload
window.addEventListener('beforeunload', () => {
    if (window.enhancedNotifications) {
        window.enhancedNotifications.disconnectFromNotificationServer();
    }
});