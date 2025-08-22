/**
 * Hi-Tech Internet Hotspot Portal - Watch Page Application
 * Copyright (c) 2025 Mahmoud. All rights reserved.
 * 
 * Developed by: Mahmoud
 * Website: Hi-Tech Internet Services
 * Description: Football and films streaming functionality
 * 
 * This software is proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */

// Server configuration
const STREAMING_SERVER = {
    ip: '2.2.2.2',
    port: 8080,
    protocol: 'http'
};

// Content endpoints on the streaming server
const CONTENT_ENDPOINTS = {
    'football-live': '/live/football',
    'football-replay': '/replay/football',
    'arabic-movies': '/movies/arabic',
    'foreign-movies': '/movies/foreign',
    'tv-series': '/series',
    'kids-content': '/kids'
};

/**
 * Initialize application when DOM is loaded
 */
window.onload = function() {
    // Generate particles for background animation
    if (typeof generateParticles === 'function') {
        generateParticles();
    }
    
    // Add smooth scrolling for better UX
    document.documentElement.style.scrollBehavior = 'smooth';
    
    // Check server status on load
    checkServerStatus();
    
    // Set up periodic server status check
    setInterval(checkServerStatus, 30000); // Check every 30 seconds
    
    console.log('Watch page initialized');
    console.log(`Streaming server: ${STREAMING_SERVER.protocol}://${STREAMING_SERVER.ip}:${STREAMING_SERVER.port}`);
};

/**
 * Check if the streaming server is online
 */
async function checkServerStatus() {
    const statusDot = document.getElementById('serverStatus');
    const statusText = document.getElementById('statusText');
    
    if (!statusDot || !statusText) return;
    
    try {
        // Try to ping the streaming server
        const serverUrl = `${STREAMING_SERVER.protocol}://${STREAMING_SERVER.ip}:${STREAMING_SERVER.port}/status`;
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
        const response = await fetch(serverUrl, {
            method: 'HEAD',
            mode: 'no-cors', // Allow cross-origin requests
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        // If we get here, server is likely online
        statusDot.className = 'status-dot online';
        statusText.textContent = 'متصل';
        
        console.log('Streaming server is online');
        
    } catch (error) {
        // Server is offline or unreachable
        statusDot.className = 'status-dot';
        statusText.textContent = 'غير متصل';
        
        console.log('Streaming server is offline:', error.message);
    }
}

/**
 * Connect to streaming server for specific content
 * @param {string} contentType - The type of content to stream
 */
function connectToServer(contentType) {
    if (!CONTENT_ENDPOINTS[contentType]) {
        alert('نوع المحتوى غير متاح');
        return;
    }
    
    const endpoint = CONTENT_ENDPOINTS[contentType];
    const streamUrl = `${STREAMING_SERVER.protocol}://${STREAMING_SERVER.ip}:${STREAMING_SERVER.port}${endpoint}`;
    
    console.log(`Connecting to: ${streamUrl}`);
    
    // Show loading message
    showLoadingMessage(contentType);
    
    // Try to connect to the streaming server
    setTimeout(() => {
        try {
            // Attempt to open the stream in a new window/tab
            const streamWindow = window.open(streamUrl, '_blank');
            
            if (streamWindow) {
                console.log(`Successfully opened stream: ${streamUrl}`);
                hideLoadingMessage();
            } else {
                // If popup blocked, redirect current window
                window.location.href = streamUrl;
            }
            
        } catch (error) {
            console.error('Failed to connect to streaming server:', error);
            hideLoadingMessage();
            showConnectionError(contentType);
        }
    }, 1000); // Small delay for UX
}

/**
 * Show loading message when connecting
 * @param {string} contentType - The content type being loaded
 */
function showLoadingMessage(contentType) {
    // Create loading overlay
    const overlay = document.createElement('div');
    overlay.id = 'loadingOverlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(10px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        color: white;
        font-size: 18px;
        font-weight: 600;
    `;
    
    const contentNames = {
        'football-live': 'المباريات المباشرة',
        'football-replay': 'إعادة المباريات',
        'arabic-movies': 'الأفلام العربية',
        'foreign-movies': 'الأفلام الأجنبية',
        'tv-series': 'المسلسلات',
        'kids-content': 'محتوى الأطفال'
    };
    
    overlay.innerHTML = `
        <div style="text-align: center;">
            <div style="font-size: 48px; margin-bottom: 20px;">⏳</div>
            <div>جاري الاتصال بخادم البث...</div>
            <div style="margin-top: 10px; color: #8B5CF6;">${contentNames[contentType] || 'المحتوى المحدد'}</div>
            <div style="margin-top: 20px; font-size: 14px; color: #ccc;">
                ${STREAMING_SERVER.ip}:${STREAMING_SERVER.port}
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
}

/**
 * Hide loading message
 */
function hideLoadingMessage() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.remove();
    }
}

/**
 * Show connection error message
 * @param {string} contentType - The content type that failed to connect
 */
function showConnectionError(contentType) {
    const contentNames = {
        'football-live': 'المباريات المباشرة',
        'football-replay': 'إعادة المباريات',
        'arabic-movies': 'الأفلام العربية',
        'foreign-movies': 'الأفلام الأجنبية',
        'tv-series': 'المسلسلات',
        'kids-content': 'محتوى الأطفال'
    };
    
    const message = `
        لا يمكن الاتصال بخادم البث حالياً
        
        المحتوى: ${contentNames[contentType] || 'غير محدد'}
        الخادم: ${STREAMING_SERVER.ip}:${STREAMING_SERVER.port}
        
        يرجى التحقق من:
        • الاتصال بالإنترنت
        • إعدادات الشبكة
        • حالة الخادم
        
        أو الاتصال بالدعم الفني: 0599328821
    `;
    
    alert(message);
}

/**
 * Get server connection info for debugging
 */
function getServerInfo() {
    return {
        server: STREAMING_SERVER,
        endpoints: CONTENT_ENDPOINTS,
        status: document.getElementById('statusText')?.textContent || 'unknown'
    };
}

/**
 * Manual server connection test
 */
async function testServerConnection() {
    console.log('Testing server connection...');
    
    const testUrl = `${STREAMING_SERVER.protocol}://${STREAMING_SERVER.ip}:${STREAMING_SERVER.port}/`;
    
    try {
        const response = await fetch(testUrl, {
            method: 'GET',
            mode: 'no-cors',
            cache: 'no-cache'
        });
        
        console.log('Server connection test successful');
        alert('اختبار الاتصال نجح! الخادم متاح.');
        
    } catch (error) {
        console.error('Server connection test failed:', error);
        alert(`فشل اختبار الاتصال: ${error.message}`);
    }
}

// Expose functions for debugging
window.watchDebug = {
    getServerInfo,
    testServerConnection,
    checkServerStatus,
    connectToServer
};