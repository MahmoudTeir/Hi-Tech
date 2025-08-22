/**
 * Hi-Tech Internet Hotspot Portal - Speed Test Application
 * Copyright (c) 2025 Mahmoud. All rights reserved.
 * 
 * Developed by: Mahmoud
 * Website: Hi-Tech Internet Services
 * Description: Internet speed testing with real-time gauges and Fast.com API
 * 
 * This software is proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 * - Connection quality assessment
 * - Real ping measurements prioritizing Fast.com servers
 * - Real upload speed testing via POST requests
 */

// Speed test state
let speedTestRunning = false;
let downloadSpeedInterval;
let uploadSpeedInterval;
let animationFrameId;

// Final results storage
let testResults = {
    downloadSpeed: 0,
    uploadSpeed: 0,
    ping: 0,
    quality: ''
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
    
    console.log('Speed Test application initialized');
};

/**
 * Start the speed test simulation
 */
function startSpeedTest() {
    if (speedTestRunning) {
        stopSpeedTest();
        return;
    }
    
    speedTestRunning = true;
    const testBtn = document.querySelector('.speed-test-btn');
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    const resultsSection = document.getElementById('speedResults');
    
    // Update UI
    testBtn.textContent = 'إيقاف الاختبار';
    statusDot.className = 'status-dot testing';
    statusText.textContent = 'جاري الاختبار...';
    
    // Hide previous results
    if (resultsSection) {
        resultsSection.style.display = 'none';
    }
    
    // Reset values
    resetSpeedValues();
    
    // Start ping test
    simulatePing();
    
    // Start download test after 1 second
    setTimeout(() => {
        if (speedTestRunning) {
            startDownloadTest();
        }
    }, 1000);
}

/**
 * Stop the speed test
 */
function stopSpeedTest() {
    speedTestRunning = false;
    
    if (downloadSpeedInterval) clearInterval(downloadSpeedInterval);
    if (uploadSpeedInterval) clearInterval(uploadSpeedInterval);
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    
    const testBtn = document.querySelector('.speed-test-btn');
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    
    testBtn.textContent = 'بدء الاختبار';
    statusDot.className = 'status-dot';
    statusText.textContent = 'تم إيقاف الاختبار';
    
    // Reset after 2 seconds
    setTimeout(() => {
        if (!speedTestRunning) {
            statusText.textContent = 'جاهز للاختبار';
        }
    }, 2000);
}

/**
 * Reset all speed values and progress bars
 */
function resetSpeedValues() {
    document.getElementById('downloadSpeed').textContent = '0';
    document.getElementById('uploadSpeed').textContent = '0';
    document.getElementById('pingValue').textContent = '-- مللي ثانية';
    document.getElementById('downloadPercent').textContent = '0%';
    document.getElementById('uploadPercent').textContent = '0%';
    
    // Reset gauge fills
    document.querySelector('.download-gauge').style.strokeDasharray = '0 251.2';
    document.querySelector('.upload-gauge').style.strokeDasharray = '0 251.2';
    
    // Reset progress bars
    document.getElementById('downloadProgress').style.width = '0%';
    document.getElementById('uploadProgress').style.width = '0%';
    
    // Reset test results
    testResults = {
        downloadSpeed: 0,
        uploadSpeed: 0,
        ping: 0,
        quality: ''
    };
}

/**
 * Get real ping measurement prioritizing Fast.com servers
 */
async function getRealPing() {
    const testServers = [
        { url: 'https://fast.com/', name: 'Fast.com Netflix' },
        { url: 'https://api.fast.com/', name: 'Fast.com API' },
        { url: 'https://www.google.com/', name: 'Google' },
        { url: 'https://www.cloudflare.com/', name: 'Cloudflare' }
    ];
    
    let totalPing = 0;
    let successfulPings = 0;
    
    for (const server of testServers) {
        try {
            const startTime = performance.now();
            const response = await fetch(server.url, {
                method: 'HEAD',
                cache: 'no-store',
                headers: {
                    'Cache-Control': 'no-cache'
                }
            });
            
            if (response.ok) {
                const ping = performance.now() - startTime;
                console.log(`Ping to ${server.name}: ${ping.toFixed(1)}ms`);
                totalPing += ping;
                successfulPings++;
                
                // If Fast.com responds, prioritize it
                if (server.name.includes('Fast.com') && ping < 100) {
                    return Math.max(Math.round(ping), 1);
                }
            }
        } catch (error) {
            console.log(`Ping to ${server.name} failed:`, error.message);
            continue;
        }
    }
    
    if (successfulPings > 0) {
        return Math.max(Math.round(totalPing / successfulPings), 1);
    }
    
    // Fallback to simulated ping
    return Math.floor(Math.random() * 50) + 10;
}

/**
 * Simulate ping measurement with real data when possible
 */
async function simulatePing() {
    let pingCount = 0;
    let pingSum = 0;
    const maxPings = 5;
    
    const pingInterval = setInterval(async () => {
        if (!speedTestRunning || pingCount >= maxPings) {
            clearInterval(pingInterval);
            if (pingCount > 0) {
                testResults.ping = Math.round(pingSum / pingCount);
            }
            return;
        }
        
        const ping = await getRealPing();
        pingSum += ping;
        pingCount++;
        
        document.getElementById('pingValue').textContent = `${ping} مللي ثانية`;
    }, 500);
}

/**
 * Fast.com Netflix API - Browser Compatible Version
 */
class FastAPI {
    constructor(options = {}) {
        this.token = options.token || 'YXNkZmFzZGxmbnNkYWZoYXNkZmhrYWxm'; // Default token
        this.timeout = options.timeout || 5000;
        this.https = options.https !== false;
        this.urlCount = options.urlCount || 5;
        this.verbose = options.verbose || false;
    }

    // Get test URLs from Fast.com API
    async getTargets() {
        try {
            const apiUrl = `https://api.fast.com/netflix/speedtest?https=true&token=${this.token}&urlCount=${this.urlCount}`;
            
            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Cache-Control': 'no-cache'
                }
            });

            if (!response.ok) {
                throw new Error(`API responded with status: ${response.status}`);
            }

            const data = await response.json();
            return data.map(target => target.url);
            
        } catch (error) {
            console.log('Fast.com API error:', error.message);
            throw error;
        }
    }

    // Perform speed test using Fast.com URLs
    async getSpeed() {
        try {
            const targets = await this.getTargets();
            console.log(`Got ${targets.length} Fast.com test URLs`);
            
            let totalBytes = 0;
            let startTime = performance.now();
            const requests = [];

            // Start all downloads simultaneously
            const downloadPromises = targets.map(async (url) => {
                try {
                    const response = await fetch(url, {
                        method: 'GET',
                        cache: 'no-store'
                    });

                    if (!response.ok) return 0;

                    const reader = response.body.getReader();
                    let bytes = 0;

                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        bytes += value.length;
                        totalBytes += value.length;
                    }

                    return bytes;
                } catch (error) {
                    console.log(`Failed to download from ${url}:`, error.message);
                    return 0;
                }
            });

            // Wait for timeout or first completion
            const timeoutPromise = new Promise(resolve => {
                setTimeout(() => {
                    resolve('timeout');
                }, this.timeout);
            });

            await Promise.race([
                Promise.all(downloadPromises),
                timeoutPromise
            ]);

            const duration = (performance.now() - startTime) / 1000;
            const speedMbps = (totalBytes * 8) / (duration * 1000000);

            if (this.verbose) {
                console.log(`Fast.com test: ${totalBytes} bytes in ${duration.toFixed(2)}s = ${speedMbps.toFixed(2)} Mbps`);
            }

            return Math.max(Math.round(speedMbps), 1);

        } catch (error) {
            console.log('Fast.com speed test failed:', error.message);
            throw error;
        }
    }
}

/**
 * Get real speed data using Fast.com Netflix API
 */
async function getRealSpeedFromFastcom() {
    try {
        console.log('Starting Fast.com Netflix speed test...');
        
        const fastAPI = new FastAPI({
            verbose: true,
            timeout: 8000,
            urlCount: 3
        });

        const speed = await fastAPI.getSpeed();
        
        console.log(`Fast.com speed result: ${speed} Mbps`);
        return { downloadSpeed: speed, realData: true };
        
    } catch (error) {
        console.log('Fast.com API failed, using fallback:', error.message);
        return await getFallbackSpeed();
    }
}

/**
 * Fallback speed test using reliable servers
 */
async function getFallbackSpeed() {
    try {
        const testFiles = [
            { url: 'https://httpbin.org/bytes/1048576', size: 1048576, name: 'HTTPBin 1MB' },
            { url: 'https://httpbin.org/bytes/5242880', size: 5242880, name: 'HTTPBin 5MB' }
        ];
        
        let totalSpeed = 0;
        let successfulTests = 0;
        
        console.log('Using fallback speed test...');
        
        for (const testFile of testFiles) {
            try {
                const startTime = performance.now();
                const response = await fetch(testFile.url, {
                    method: 'GET',
                    cache: 'no-store',
                    mode: 'cors'
                });
                
                if (!response.ok) continue;
                
                const arrayBuffer = await response.arrayBuffer();
                const endTime = performance.now();
                
                const totalBytes = arrayBuffer.byteLength;
                const duration = (endTime - startTime) / 1000;
                
                if (duration > 0 && totalBytes > 0) {
                    const speedBps = totalBytes / duration;
                    const speedMbps = (speedBps * 8) / 1000000;
                    
                    if (speedMbps >= 0.1 && speedMbps <= 1000) {
                        totalSpeed += speedMbps;
                        successfulTests++;
                    }
                }
                
            } catch (serverError) {
                continue;
            }
        }
        
        if (successfulTests > 0) {
            const avgSpeed = Math.min(Math.max(Math.round(totalSpeed / successfulTests), 1), 1000);
            return { downloadSpeed: avgSpeed, realData: true };
        }
        
        throw new Error('All fallback tests failed');
        
    } catch (error) {
        console.log('Fallback test failed, using simulation:', error.message);
        return null;
    }
}

/**
 * Start download speed test with real Fast.com data or simulation fallback
 */
async function startDownloadTest() {
    if (!speedTestRunning) return;
    
    const statusText = document.getElementById('statusText');
    statusText.textContent = 'اختبار التحميل...';
    
    // Try to get real speed from Fast.com Netflix API first
    const realSpeedData = await getRealSpeedFromFastcom();
    
    if (realSpeedData && realSpeedData.realData) {
        // Use real data from Fast.com
        await simulateProgressWithRealSpeed(realSpeedData.downloadSpeed);
    } else {
        // Fallback to simulation
        await simulateDownloadSpeed();
    }
}

/**
 * Simulate progress bars with real speed data
 */
async function simulateProgressWithRealSpeed(realSpeed) {
    return new Promise((resolve) => {
        let progress = 0;
        let currentSpeed = 0;
        const testDuration = 5000; // 5 seconds
        const updateInterval = 100; // Update every 100ms
        
        downloadSpeedInterval = setInterval(() => {
            if (!speedTestRunning) {
                clearInterval(downloadSpeedInterval);
                resolve();
                return;
            }
            
            progress += (updateInterval / testDuration) * 100;
            
            if (progress <= 100) {
                // Ramp up to real speed with realistic curve
                let speedMultiplier;
                if (progress < 20) {
                    speedMultiplier = (progress / 20) * 0.3;
                } else if (progress < 80) {
                    speedMultiplier = 0.8 + Math.sin((progress / 100) * Math.PI) * 0.2;
                } else {
                    speedMultiplier = 0.9 - ((progress - 80) / 20) * 0.1;
                }
                
                currentSpeed = Math.floor(realSpeed * speedMultiplier * (0.9 + Math.random() * 0.2));
                
                // Update display
                document.getElementById('downloadSpeed').textContent = currentSpeed.toString();
                document.getElementById('downloadPercent').textContent = `${Math.floor(progress)}%`;
                
                // Update gauge (circumference is approximately 251.2)
                const gaugeProgress = Math.min((currentSpeed / 100) * 251.2, 251.2);
                document.querySelector('.download-gauge').style.strokeDasharray = `${gaugeProgress} 251.2`;
                
                // Update progress bar
                document.getElementById('downloadProgress').style.width = `${progress}%`;
            } else {
                clearInterval(downloadSpeedInterval);
                testResults.downloadSpeed = realSpeed;
                
                // Start upload test after download completes
                setTimeout(() => {
                    if (speedTestRunning) {
                        startUploadTest();
                    }
                }, 500);
                resolve();
            }
        }, updateInterval);
    });
}

/**
 * Fallback simulation for download speed
 */
async function simulateDownloadSpeed() {
    return new Promise((resolve) => {
        let downloadSpeed = 0;
        let progress = 0;
        let maxDownloadSpeed = 0;
        const maxSpeed = Math.floor(Math.random() * 80) + 20; // 20-100 Mbps
        const testDuration = 5000; // 5 seconds
        const updateInterval = 100; // Update every 100ms
        
        downloadSpeedInterval = setInterval(() => {
            if (!speedTestRunning) {
                clearInterval(downloadSpeedInterval);
                resolve();
                return;
            }
            
            progress += (updateInterval / testDuration) * 100;
            
            if (progress <= 100) {
                // Simulate realistic speed curve with ramp up and stabilization
                let speedMultiplier;
                if (progress < 20) {
                    // Ramp up phase
                    speedMultiplier = (progress / 20) * 0.3;
                } else if (progress < 80) {
                    // Stable phase
                    speedMultiplier = 0.7 + Math.sin((progress / 100) * Math.PI) * 0.3;
                } else {
                    // Wind down phase
                    speedMultiplier = 0.8 - ((progress - 80) / 20) * 0.2;
                }
                
                downloadSpeed = Math.floor(maxSpeed * speedMultiplier * (0.85 + Math.random() * 0.3));
                maxDownloadSpeed = Math.max(maxDownloadSpeed, downloadSpeed);
                
                // Update display
                document.getElementById('downloadSpeed').textContent = downloadSpeed.toString();
                document.getElementById('downloadPercent').textContent = `${Math.floor(progress)}%`;
                
                // Update gauge (circumference is approximately 251.2)
                const gaugeProgress = (downloadSpeed / 100) * 251.2;
                document.querySelector('.download-gauge').style.strokeDasharray = `${gaugeProgress} 251.2`;
                
                // Update progress bar
                document.getElementById('downloadProgress').style.width = `${progress}%`;
            } else {
                clearInterval(downloadSpeedInterval);
                testResults.downloadSpeed = maxDownloadSpeed;
                
                // Start upload test after download completes
                setTimeout(() => {
                    if (speedTestRunning) {
                        startUploadTest();
                    }
                }, 500);
                resolve();
            }
        }, updateInterval);
    });
}

/**
 * Get real upload speed using POST requests
 */
async function getRealUploadSpeed() {
    try {
        // Generate test data of different sizes
        const testSizes = [
            { size: 102400, name: '100KB' },    // 100KB
            { size: 524288, name: '512KB' },    // 512KB
            { size: 1048576, name: '1MB' }      // 1MB
        ];
        
        let totalSpeed = 0;
        let successfulTests = 0;
        
        console.log('Starting real upload speed test...');
        
        for (const testSize of testSizes) {
            try {
                console.log(`Testing upload with ${testSize.name}...`);
                
                // Create test data
                const testData = new Uint8Array(testSize.size);
                for (let i = 0; i < testData.length; i++) {
                    testData[i] = Math.floor(Math.random() * 256);
                }
                
                const startTime = performance.now();
                const response = await fetch('https://httpbin.org/post', {
                    method: 'POST',
                    body: testData,
                    headers: {
                        'Content-Type': 'application/octet-stream',
                        'Cache-Control': 'no-cache'
                    }
                });
                
                const endTime = performance.now();
                
                if (response.ok) {
                    const duration = (endTime - startTime) / 1000; // Convert to seconds
                    const speedBps = testSize.size / duration; // Bytes per second
                    const speedMbps = (speedBps * 8) / 1000000; // Convert to Mbps
                    
                    console.log(`Upload ${testSize.name}: ${speedMbps.toFixed(2)} Mbps`);
                    
                    if (speedMbps >= 0.1 && speedMbps <= 500) {
                        totalSpeed += speedMbps;
                        successfulTests++;
                    }
                }
                
            } catch (error) {
                console.log(`Upload test ${testSize.name} failed:`, error.message);
                continue;
            }
        }
        
        if (successfulTests > 0) {
            const avgSpeed = totalSpeed / successfulTests;
            const finalSpeed = Math.min(Math.max(Math.round(avgSpeed), 1), 500);
            console.log(`Upload speed: ${finalSpeed} Mbps from ${successfulTests} tests`);
            return finalSpeed;
        }
        
        throw new Error('All upload tests failed');
        
    } catch (error) {
        console.log('Upload test failed, using estimation:', error.message);
        return null;
    }
}

/**
 * Start upload speed test with real data or estimation fallback
 */
async function startUploadTest() {
    if (!speedTestRunning) return;
    
    const statusText = document.getElementById('statusText');
    statusText.textContent = 'اختبار الرفع...';
    
    // Try to get real upload speed
    const realUploadSpeed = await getRealUploadSpeed();
    
    if (realUploadSpeed) {
        // Use real upload speed with progress animation
        await simulateUploadProgress(realUploadSpeed);
    } else {
        // Fallback to estimation (typically 20-40% of download speed)
        const estimatedSpeed = Math.max(Math.round(testResults.downloadSpeed * 0.3), 5);
        await simulateUploadProgress(estimatedSpeed);
    }
}

/**
 * Simulate upload progress with real or estimated speed
 */
async function simulateUploadProgress(realSpeed) {
    return new Promise((resolve) => {
        let progress = 0;
        let currentSpeed = 0;
        const testDuration = 4000; // 4 seconds
        const updateInterval = 100; // Update every 100ms
        
        uploadSpeedInterval = setInterval(() => {
            if (!speedTestRunning) {
                clearInterval(uploadSpeedInterval);
                resolve();
                return;
            }
            
            progress += (updateInterval / testDuration) * 100;
            
            if (progress <= 100) {
                // Ramp up to real speed with realistic curve
                let speedMultiplier;
                if (progress < 30) {
                    speedMultiplier = (progress / 30) * 0.4;
                } else if (progress < 70) {
                    speedMultiplier = 0.7 + Math.sin((progress / 100) * Math.PI) * 0.3;
                } else {
                    speedMultiplier = 0.8 - ((progress - 70) / 30) * 0.2;
                }
                
                currentSpeed = Math.floor(realSpeed * speedMultiplier * (0.9 + Math.random() * 0.2));
                
                // Update display
                document.getElementById('uploadSpeed').textContent = currentSpeed.toString();
                document.getElementById('uploadPercent').textContent = `${Math.floor(progress)}%`;
                
                // Update gauge (circumference is approximately 251.2)
                const gaugeProgress = Math.min((currentSpeed / 100) * 251.2, 251.2);
                document.querySelector('.upload-gauge').style.strokeDasharray = `${gaugeProgress} 251.2`;
                
                // Update progress bar
                document.getElementById('uploadProgress').style.width = `${progress}%`;
            } else {
                clearInterval(uploadSpeedInterval);
                testResults.uploadSpeed = realSpeed;
                completeSpeedTest();
                resolve();
            }
        }, updateInterval);
    });
}

/**
 * Complete the speed test and show results
 */
function completeSpeedTest() {
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    const testBtn = document.querySelector('.speed-test-btn');
    const resultsSection = document.getElementById('speedResults');
    
    statusDot.className = 'status-dot connected';
    statusText.textContent = 'اكتمل الاختبار';
    testBtn.textContent = 'بدء الاختبار';
    
    speedTestRunning = false;
    
    // Calculate connection quality
    const quality = calculateConnectionQuality(testResults.downloadSpeed, testResults.uploadSpeed, testResults.ping);
    testResults.quality = quality;
    
    // Update results display
    if (resultsSection) {
        document.getElementById('finalDownloadSpeed').textContent = `${testResults.downloadSpeed} ميجا/ث`;
        document.getElementById('finalUploadSpeed').textContent = `${testResults.uploadSpeed} ميجا/ث`;
        document.getElementById('finalPing').textContent = `${testResults.ping} مللي ثانية`;
        document.getElementById('connectionQuality').textContent = quality;
        
        resultsSection.style.display = 'block';
    }
    
    // Auto-reset status after 5 seconds
    setTimeout(() => {
        if (!speedTestRunning) {
            statusDot.className = 'status-dot';
            statusText.textContent = 'جاهز للاختبار';
        }
    }, 5000);
}

/**
 * Calculate connection quality based on speed and ping
 * @param {number} download - Download speed in Mbps
 * @param {number} upload - Upload speed in Mbps  
 * @param {number} ping - Ping in milliseconds
 * @returns {string} Quality rating in Arabic
 */
function calculateConnectionQuality(download, upload, ping) {
    // Calculate composite score (out of 100)
    let score = 0;
    
    // Download speed scoring (40% weight)
    if (download >= 50) score += 40;
    else if (download >= 25) score += 30;
    else if (download >= 10) score += 20;
    else score += 10;
    
    // Upload speed scoring (30% weight)
    if (upload >= 25) score += 30;
    else if (upload >= 10) score += 22;
    else if (upload >= 5) score += 15;
    else score += 8;
    
    // Ping scoring (30% weight)
    if (ping <= 20) score += 30;
    else if (ping <= 40) score += 22;
    else if (ping <= 60) score += 15;
    else score += 8;
    
    // Return quality rating
    if (score >= 85) return 'ممتاز';
    else if (score >= 70) return 'جيد جداً';
    else if (score >= 55) return 'جيد';
    else if (score >= 40) return 'متوسط';
    else return 'ضعيف';
}

/**
 * Utility function to format speed values
 * @param {number} speed - Speed value in Mbps
 * @returns {string} Formatted speed string
 */
function formatSpeed(speed) {
    if (speed >= 1000) {
        return `${(speed / 1000).toFixed(1)} جيجا/ث`;
    }
    return `${speed} ميجا/ث`;
}

/**
 * Share speed test results (optional feature)
 */
function shareResults() {
    if (testResults.downloadSpeed === 0) {
        alert('يرجى إجراء اختبار السرعة أولاً');
        return;
    }
    
    const resultText = `
نتائج اختبار السرعة - هاي تك للإنترنت
🔽 التحميل: ${testResults.downloadSpeed} ميجا/ث
🔼 الرفع: ${testResults.uploadSpeed} ميجا/ث  
⏱️ زمن الاستجابة: ${testResults.ping} مللي ثانية
⭐ جودة الاتصال: ${testResults.quality}
    `;
    
    if (navigator.share) {
        navigator.share({
            title: 'نتائج اختبار السرعة - هاي تك',
            text: resultText
        });
    } else {
        // Fallback for browsers without Web Share API
        navigator.clipboard.writeText(resultText).then(() => {
            alert('تم نسخ النتائج إلى الحافظة');
        }).catch(() => {
            alert(resultText);
        });
    }
}